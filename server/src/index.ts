import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { mkdir, writeFile, rename, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import staticPlugin from "@fastify/static";
import sharp from "sharp";
import { db } from "./db.js";
import { items, users } from "./schema.js";
import { eq, asc, desc, and, isNull, isNotNull, inArray, sum, notExists, count, getTableColumns, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import argon2 from 'argon2';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import exifr from 'exifr';
import { fileTypeFromFile } from "file-type";
import convert from 'heic-convert';
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { safeUnlink, isUuid, probeVideo, generateVideoThumbnail, collectSubtree, collectAncestors, hashItem } from "./utility.js";
import type { ItemType, DuplicateItem } from "./types/types.js";


declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number };
    user: { id: number };
  }
}

export async function buildApp() {

  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  const STORAGE_DIR = process.env.STORAGE_DIR;
  if (!STORAGE_DIR) {
    throw new Error('Missing mandatory storage dir!');
  }

  const UPLOAD_DIR = join(STORAGE_DIR, "uploads");
  const ORIGINAL_DIR = join(UPLOAD_DIR, "originals");
  const THUMBNAIL_DIR = join(UPLOAD_DIR, "thumbnails");
  await mkdir(ORIGINAL_DIR, { recursive: true });
  await mkdir(THUMBNAIL_DIR, { recursive: true });


  await app.register(cors, { origin: ["http://localhost:5173", "http://192.168.1.151:5173"], methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], credentials: true });

  await app.register(multipart, {
    limits: {
      fileSize: 5000 * 1024 * 1024, //5GB
      files: 200,
    },
  });

  await app.register(staticPlugin, {
    root: UPLOAD_DIR,
    serve: false,
  });

  await app.register(cookie);
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error('JWT_SECRET is missing')
  await app.register(jwt, {secret: JWT_SECRET, cookie: {cookieName: 'token', signed: false}} );

  app.decorate('authenticate', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({message: 'Not authenticated'});
    }
  } )

  /////////////////////////////////////////////////////////////////////////////

  app.get("/health", () => {
    return { data:{ status: "ok"} };
  });

  const sortMap = {
    'creationDateDesc': desc(items.createdAt),
    'creationDateAsc': asc(items.createdAt),
  };

  type SortKey = keyof typeof sortMap;


  app.get("/items", {preHandler: [app.authenticate]},  async (req, reply) => {
    const userId = req.user.id;
    const {sortBy, parentId: parentIdString, type, deleted} = req.query as {sortBy?: SortKey, parentId?: string, type?: string, deleted?: string};
    let parentFolder: {id: number, deletedAt: Date | null} = {id: -1, deletedAt: null};
    const conditions = [eq(items.userId, userId)];

    if (parentIdString === 'root') {
      conditions.push(isNull(items.parentId));
    }
    else if (parentIdString) {
      if (!isUuid(parentIdString)) {
        return reply.code(404).send({message: 'Resource not found'});
      }
      [parentFolder] = await db.select({id: items.id, deletedAt: items.deletedAt}).from(items).where(and(eq(items.userId, userId), eq(items.fileUuid, parentIdString)));
      if (!parentFolder) {
        return reply.code(404).send({message: 'Resource not found'});
      }
      conditions.push(eq(items.parentId, parentFolder.id));
    }

    if(type) {
      conditions.push(inArray(items.itemType, type.split(',') as ItemType[]));
    }
  // deletedAt is both a flag and a BATCH id.
  // Every item trashed in the same request shares the exact same timestamp.
  // An item whose parent was trashed in a different batch is a root of its own.
    if (deleted==='true') {
      conditions.push(isNotNull(items.deletedAt));
      // When browsing trashed items deleted in different batches I want to see them as root items in trash
      // that is why parentFolder.deletedAt guard is important here
      if (parentFolder?.deletedAt) {
        conditions.push(eq(items.deletedAt, parentFolder.deletedAt));
      }
      else if (!parentIdString) {
        // I want to see in the root all child items with a parent deleted in a different batch (not exists)
        const parent = alias(items, 'parent');
        conditions.push(notExists(db.select().from(parent).where(and(eq(parent.id, items.parentId), eq(parent.deletedAt, items.deletedAt)))));
      }
    } else {
      conditions.push(isNull(items.deletedAt));
    }

    const orderBy = (sortBy && sortBy in sortMap) ? sortMap[sortBy] : desc(items.createdAt);
    
    const childFilter = deleted === 'true' ? sql`c.deleted_at = "items"."deleted_at"` : sql`c.deleted_at is null`;

    const rows = await (db.select({...getTableColumns(items), 
                    childCount: sql<number>`(select count(*) from ${items} c where c.parent_id = "items"."id" and ${childFilter})`.mapWith(Number).as('child_count'), 
                    folderCount:  sql<number>`(select count(*) from ${items} c where c.parent_id = "items"."id" and ${childFilter} and c.item_type = 'folder')`.mapWith(Number).as('folder_count')}
                  ).from(items).where(and(...conditions)).orderBy(orderBy));

    return {data: {
      items: rows.map((f) => ({
        id: f.fileUuid,
        url: `/items/${f.fileUuid}/original`,
        thumbnail: ['image', 'video'].includes(f.itemType) ? `/items/${f.fileUuid}/thumbnail` : null,
        originalName: f.originalName,
        visibleName: f.visibleName,
        size: f.size,
        itemType: f.itemType,
        createdAt: f.createdAt,
        metadata: f.metadata,
        childCount: f.childCount,
        folderCount: f.folderCount,
      })),
    }};
  });

  app.get('/items/:id/original', {preHandler: [app.authenticate]}, async (req, reply) => {
    const { id: itemId } = req.params as {id: string};
    const userId = req.user.id;

    if (!isUuid(itemId)) return reply.code(404).send({message: 'Resource not found'});

    const [item] = await db.select({fileUuid: items.fileUuid, ext: items.ext, itemType: items.itemType}).from(items).where(and(eq(items.fileUuid, itemId), eq(items.userId, userId)));

    if (!item || item.itemType === 'folder') return reply.code(404).send({message: 'Resource not found'});

    return reply.sendFile(`originals/${item.fileUuid}.${item.ext}`);
  });


  app.get('/items/:id/thumbnail', {preHandler: [app.authenticate]}, async (req, reply) => {
    const { id: itemId } = req.params as {id: string};
    const userId = req.user.id;

    if (!isUuid(itemId)) return reply.code(404).send({message: 'Resource not found'});

    const [item] = await db.select({fileUuid: items.fileUuid, itemType: items.itemType}).from(items).where(and(eq(items.fileUuid, itemId), eq(items.userId, userId)));

    if (!item || (!['video','image'].includes(item.itemType))) return reply.code(404).send({message: 'Resource not found'});

    return reply.sendFile(`thumbnails/${item.fileUuid}.webp`);
  });


  app.get('/items/duplicates', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;

    const duplicateHash = db.select({hash: items.itemHash}).from(items)
      .where(
        and(inArray(items.itemType,['file','image','video']), eq(items.userId, userId), isNull(items.deletedAt)))
      .groupBy(items.itemHash)
      .having(sql`count(*)>1`);
    
    const parent = alias(items, 'parent');
    const duplicateList = await db.select({...getTableColumns(items), parentName: parent.visibleName}).from(items).leftJoin(parent, eq(parent.id, items.parentId)).where(and(inArray(items.itemHash, duplicateHash), eq(items.userId, userId), isNull(items.deletedAt))).orderBy(asc(items.createdAt));

    const groups: Record<string, DuplicateItem[]> = {};
    for (const duplicate of duplicateList) {
      const key = duplicate.itemHash!;
      groups[key] ??= [];
      groups[key].push({
        id: duplicate.fileUuid,
        url: `/items/${duplicate.fileUuid}/original`,
        thumbnail: ['image', 'video'].includes(duplicate.itemType) ? `/items/${duplicate.fileUuid}/thumbnail` : null,
        originalName: duplicate.originalName,
        visibleName: duplicate.visibleName,
        size: duplicate.size,
        itemType: duplicate.itemType,
        createdAt: duplicate.createdAt,
        metadata: duplicate.metadata,
        childCount: 0,
        folderCount: 0,
        parentName: duplicate.parentName,
        })
    }
    return reply.code(200).send({data: { groups: Object.entries(groups).map(([hash, items]) =>  ({hash, items}) )}});
  })


  app.post("/upload", {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;
    const parts = req.files();
    const saved: {
      id: string;
      itemType: string;
      originalName: string;
      size: number;
      url: string;
      thumbnail: string | null;
    }[] = [];
    const skipped: {
      itemType: string;
      originalName: string;
    }[] = [];

    const {parentId: parentUUID} = req.query as {parentId: string};
    let parentId : number | null = null;
    if (parentUUID) {
      if (!isUuid(parentUUID)) {
        return reply.code(404).send({message: 'Resource not found'});
      }
      // parent uuid belongs to user and is not deleted and is a folder
      const [parentData] = await db.select({id: items.id}).from(items).where(and(eq(items.userId, userId), eq(items.fileUuid, parentUUID), isNull(items.deletedAt), eq(items.itemType, 'folder')));
      if(!parentData){
        return reply.code(404).send({message: 'Resource not found'});
      }
      parentId = parentData.id;
    }

    for await (const part of parts) {
      const fileUuid = randomUUID();
      const originalName = part.filename;
      try {
        const tmpPath = join(ORIGINAL_DIR, `${fileUuid}.part`);
        await pipeline(part.file, createWriteStream(tmpPath));

        if (part.file.truncated) {
          await safeUnlink(tmpPath);
          continue;
        }

        const fileType = await fileTypeFromFile(tmpPath);
        const isHeic = fileType?.mime === 'image/heic' || fileType?.mime ==='image/heif';
        const isPhoto = isHeic || fileType?.mime.startsWith('image/');
        const isVideo = fileType?.mime.startsWith('video/');
        const itemType = isPhoto ? 'image' : (isVideo ? 'video' : 'file');
        const ext = isHeic ? 'jpg' : (fileType?.ext ?? 'bin');
    
        const filepath = join(ORIGINAL_DIR, `${fileUuid}.${ext}`);

        if (isHeic) {
          const buffer = Buffer.from(await convert({
            buffer: await readFile(tmpPath),
            format: 'JPEG',
            quality: 0.9,
          }));
          await writeFile(filepath, buffer);
        } else {
          await rename(tmpPath, filepath);
        }

        // check duplicates
        const itemHash = await hashItem(filepath);
        const [duplicate] = await db.select({id: items.id}).from(items).where(and(
          eq(items.itemHash, itemHash),
          eq(items.userId, userId),
          parentId === null ? isNull(items.parentId) : eq(items.parentId, parentId),
          isNull(items.deletedAt))).limit(1);

        if (duplicate) {
          await safeUnlink(filepath);
          await safeUnlink(tmpPath);
          skipped.push({itemType, originalName})
          continue;
        }

        
        let metadata = null;

        if (isPhoto) {
          metadata = (await exifr.parse(isHeic ? tmpPath : filepath, {gps: true}) ?? null) as Record<string, unknown> | null;
          await sharp(filepath).rotate()
            .resize(200, 200, { fit: "cover" })
            .webp({ quality: 80 })
            .toFile(join(THUMBNAIL_DIR, `${fileUuid}.webp`));
        } else if (isVideo) {
          metadata = await probeVideo(filepath);
          await generateVideoThumbnail(filepath, fileUuid, THUMBNAIL_DIR);
        }

        const { size } = await stat(filepath);
        await safeUnlink(tmpPath);
        
        await db
          .insert(items)
          .values({ fileUuid, ext, originalName, parentId, visibleName: originalName, size, userId, metadata, itemType, itemHash });

        saved.push({
          id: fileUuid,
          itemType,
          originalName,
          size,
          url: `/items/${fileUuid}/original`,
          thumbnail: isPhoto || isVideo ? `/items/${fileUuid}/thumbnail` : null,
        });

      } catch (err) {
        req.log.error({ err, file: part.filename }, 'skipping failed file');
        continue;
      }
    }
    return { data: {uploaded: saved, skipped }};
  });


  app.delete("/items", {preHandler: [app.authenticate]}, async (req, reply) => {
    const { ids } = req.body as { ids: string[] };
    const userId = req.user.id;
    const idsToDelete : number[] = [];

    if (!ids || ids.length === 0) {
      return reply.code(400).send();
    }

    for (const id of ids) {
      if (!isUuid(id)) continue;
      const [item] = await db
        .select()
        .from(items)
        .where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
      if (!item) continue;
      const itemChildren = await collectSubtree({userId, rootId: item.id});
      idsToDelete.push(...itemChildren);
    }

    const deletedAt = new Date();
    await db.update(items).set({deletedAt: deletedAt}).where(and(inArray(items.id, idsToDelete), isNull(items.deletedAt), eq(items.userId, userId)));

    return reply.code(204).send();
  });


  // restore bulk
  app.post('/items/restore', {preHandler: [app.authenticate]}, async (req, reply)=> {
    const { ids } = req.body as { ids: string[] };
    const userId = req.user.id;

    if (!ids || ids.length === 0) {
      return reply.code(400).send();
    }

    const itemChildrenUnion : number[] = [];
    const itemsList = [];

    for (const id of ids) {
      if (!isUuid(id)) continue;
      // get item details from item id
      const [item] = await db.select().from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
      if (!item) continue;
      // collect subtree for each item
      const subtree = await collectSubtree({rootId: item.id, userId, deletedAt: item.deletedAt});
      itemsList.push({item, subtree});
      itemChildrenUnion.push(...subtree);
    }

    for (const {item, subtree} of itemsList) {

      if (item.parentId !== null) {
        // get parent from item
        const [parent] = await db.select().from(items).where(and(eq(items.id, item.parentId), eq(items.userId, userId) ));
        if (parent?.deletedAt && !itemChildrenUnion.includes(parent.id)) {
          // if parent is deleted too but not restore in this batch then unlink them
          await db.update(items).set({parentId: null}).where(and(eq(items.id, item.id), eq(items.userId, userId), isNotNull(items.deletedAt)));
        }
      }
      await db.update(items).set({deletedAt: null}).where(and(inArray(items.id, subtree), eq(items.userId, userId), eq(items.deletedAt, item.deletedAt! )));
    }
    return reply.code(200).send();
  })


  // permanent bulk
  app.delete('/items/permanent', {preHandler: [app.authenticate]}, async (req, reply) => {
    const { ids } = req.body as { ids: string[] };
    const userId = req.user.id;
    const itemsToDelete: number[] = [];

    if (!ids || ids.length === 0) {
      return reply.code(400).send();
    }

    for (const id of ids) {
      if (!isUuid(id)) continue;

      const [item] = await db.select().from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
      if (!item) continue;
      const childrenItem = await collectSubtree({rootId: item.id, userId, deletedAt: item.deletedAt});
      itemsToDelete.push(...childrenItem);
    }

    const deletedItems = await db.delete(items).where(and(inArray(items.id, itemsToDelete), eq(items.userId, userId))).returning({uuid: items.fileUuid, ext: items.ext, });
    for (const delItem of deletedItems) {
      await safeUnlink(join(ORIGINAL_DIR, `${delItem.uuid}.${delItem.ext}`));
      await safeUnlink(join(THUMBNAIL_DIR, `${delItem.uuid}.webp`));
    }

    return reply.code(204).send();
  })


  app.post('/items', {preHandler: [app.authenticate]}, async (req, reply) => {
    const { visibleName, parentId: parentIdString } = req.body as { visibleName: string, parentId?: string};
    const userId = req.user.id;
    let parentFolder;

    if (!visibleName) {
      return reply.code(400).send({message: 'Missing mandatory data'});
    }

    if (parentIdString) {
      if (!isUuid(parentIdString)) {
        return reply.code(404).send({message: 'Resource not found'});
      }
      [parentFolder] = await db.select({id: items.id}).from(items).where(and(eq(items.userId, userId), eq(items.fileUuid, parentIdString), isNull(items.deletedAt), eq(items.itemType, 'folder')));
      if (!parentFolder) {
        return reply.code(404).send({message: 'Resource not found'});
      }
    }

    const [insertData] = await db.insert(items).values({parentId: parentFolder?.id ?? null, itemType: 'folder', visibleName, userId }).returning();
    return reply.code(201).send({data: {item: {id: insertData.fileUuid, itemType: insertData.itemType, visibleName: insertData.visibleName, createdAt: insertData.createdAt }}});
  });


  app.patch('/items', {preHandler: [app.authenticate]}, async (req, reply) => {

    const { ids, parentId: parentUUID } = req.body as {ids: string[], parentId: string};
    const userId = req.user.id;

    if(!parentUUID || ids.length === 0) {
      return reply.code(400).send({message: 'Missing mandatory data'});
    }

    const invalidUUIDs = ids.filter((i) => !isUuid(i));

    if (invalidUUIDs.length > 0 || (parentUUID && parentUUID !== 'root' && !isUuid(parentUUID))) {
      return reply.code(404).send({message: 'Resource not found'});
    }

    if (ids.includes(parentUUID)) {
      return reply.code(400).send({message: 'Cannot move an item into itself'});
    }

    const updateData : {parentId: null | number} = {parentId: null};
    if (parentUUID === 'root') {
      updateData.parentId = null;
    } else {
      const [destination] = await db.select({id: items.id}).from(items).where(and(eq(items.userId, userId), eq(items.fileUuid, parentUUID), isNull(items.deletedAt), eq(items.itemType, 'folder')));
      if(!destination) {
        return reply.code(404).send({message: 'Resource not found'});
      }
      updateData.parentId = destination.id;
    }

    const ancestors = await collectAncestors({destinationId: updateData.parentId, userId})
    const movingItems = [];
    
    for (const id of ids) {
      const [itemMoved] = await db.select({id: items.id, fileType: items.itemType, itemUUID: items.fileUuid}).from(items).where(and(eq(items.userId, userId), eq(items.fileUuid, id), isNull(items.deletedAt)));
      if (!itemMoved) {
        return reply.code(404).send({message: 'Resource not found'});
      }
      if (itemMoved.fileType === 'folder') {
        if (ancestors.includes(itemMoved.id)) {
          return reply.code(400).send({message: 'Cannot move an ancestor item into his child'});
        }
      }
    movingItems.push(itemMoved.itemUUID)
    }

    await db.update(items).set(updateData).where(and(eq(items.userId, userId), inArray(items.fileUuid, movingItems)));
    
    return reply.code(204).send();
  })


  app.patch('/items/:id', {preHandler: [app.authenticate]}, async (req, reply) => {
    const { id } = req.params as {id: string};
    const { visibleName: newVisibleName, parentId: parentUUID } = req.body as {visibleName?: string, parentId?: string};
    const userId = req.user.id;

    if((!newVisibleName) && (!parentUUID)) {
      return reply.code(400).send({message: 'Missing mandatory data'});
    }

    if (!isUuid(id) || (parentUUID && parentUUID !== 'root' && !isUuid(parentUUID))) {
      return reply.code(404).send({message: 'Resource not found'});
    }

    if (parentUUID === id) {
      return reply.code(400).send({message: 'Cannot move an item into itself'});
    }
    
    const updateData : {visibleName?: string, parentId?: null | number} = {};
    if (newVisibleName) {
      updateData.visibleName = newVisibleName;
    }
    if (parentUUID) {
      if (parentUUID === 'root') {
        updateData.parentId = null;
      } else {
        const [parentData] = await db.select({id: items.id}).from(items).where(and(eq(items.userId, userId), eq(items.fileUuid, parentUUID), isNull(items.deletedAt), eq(items.itemType, 'folder')));
        if(!parentData){
          return reply.code(404).send({message: 'Resource not found'});
        }

        const [itemMoved] = await db.select({id: items.id, fileType: items.itemType}).from(items).where(and(eq(items.userId, userId), eq(items.fileUuid, id), isNull(items.deletedAt)));
        if (!itemMoved){
          return reply.code(404).send({message: 'Resource not found'});
        }
        if (itemMoved.fileType === 'folder') {
          let curr : number | null = parentData.id;
          while (curr !== null) {
            if (curr === itemMoved.id) {
              return reply.code(409).send({message: 'Action not allowed'});
            }
            const [ancestor] = await db.select({parentId: items.parentId}).from(items).where(and(eq(items.userId, userId), eq(items.id, curr), isNull(items.deletedAt), eq(items.itemType, 'folder')));
            curr = ancestor?.parentId ?? null;
          }
        }
        updateData.parentId = parentData.id;
      }
    }

    const [row] = await db.update(items).set(updateData).where(and(eq(items.userId, userId), eq(items.fileUuid, id))).returning({id: items.fileUuid});

    if (!row) {
      return reply.code(404).send({message: 'Resource not found'});
    }
    
    return reply.code(200).send({data:{item: {id:row.id}}});
  })


  app.post('/items/count', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;
    const {mode, roots} = req.body as {mode: 'soft'|'permanent'|'restore', roots: string[]};

    if (!Array.isArray(roots) || roots.length === 0) {
      return reply.code(400).send({message: 'Missing mandatory data'});
    }
    
    for (const id of roots) {
      if (!isUuid(id)) {
        return reply.code(404).send({message: 'Resource not found'});
      }
    }

    if (!['soft', 'permanent', 'restore'].includes(mode)) {
      return reply.code(400).send({message: 'Mode not managed'});
    }

    let idsCount : {total: number} = {total: 0};

    if (mode === 'permanent') {
      const idsChildren : number[] = [];
      const rootsN = await db.select({id: items.id, deletedAt: items.deletedAt}).from(items).where(and(inArray(items.fileUuid, roots), eq(items.userId, userId), isNotNull(items.deletedAt)));
      for (const root of rootsN) {
        const subTree = await collectSubtree({userId, rootId: root.id, deletedAt: root.deletedAt});
        idsChildren.push(...subTree);
      }
      [idsCount] = await db.select({total: count()}).from(items).where(and(inArray(items.id, idsChildren), eq(items.userId, userId), isNotNull(items.deletedAt)));
      
    } else if (mode === 'soft') {
      const idsChildren : number[] = [];
      const rootsN = await db.select({id: items.id}).from(items).where(and(inArray(items.fileUuid, roots), eq(items.userId, userId), isNull(items.deletedAt)));
      for (const root of rootsN) {
        const subTree = await collectSubtree({userId, rootId: root.id});
        idsChildren.push(...subTree);
      }
      [idsCount] = await db.select({total: count()}).from(items).where(and(inArray(items.id, idsChildren), eq(items.userId, userId), isNull(items.deletedAt)));
    }
    else if (mode === 'restore') {
      const rootsN = await db.select({id: items.id, deletedAt: items.deletedAt}).from(items).where(and(inArray(items.fileUuid, roots), eq(items.userId, userId), isNotNull(items.deletedAt)));
      for (const root of rootsN) {
        const subTree = await collectSubtree({userId, rootId: root.id, deletedAt: root.deletedAt});
        const [currentCount] = await db.select({total: count()}).from(items).where(and(inArray(items.id, subTree), eq(items.userId, userId), eq(items.deletedAt, root.deletedAt!) ));
        idsCount.total += currentCount.total;
      }
    }
    
    return reply.code(200).send({data: {count: idsCount.total}});
  })


  app.post('/items/:uuid/view', {preHandler: [app.authenticate]}, async (req, reply) => {
    const { uuid: itemUUID } = req.params as {uuid: string};
    const userId = req.user.id;

    if (!isUuid(itemUUID)) return reply.code(400).send({message: 'Missing mandatory data'});

    const [updatedId] = await db.update(items).set({ lastViewedAt: new Date(), viewCount: sql`${items.viewCount} +1`}).where(
      and(eq(items.fileUuid, itemUUID), isNull(items.deletedAt), eq(items.userId, userId))
      ).returning({id: items.id});

    if (!updatedId) return reply.code(404).send();

    return reply.code(204).send();
  });


  //////////////////////////// AUTH ////////////////////////////////

  app.post('/auth/register', async (req, reply) => {
    const { name, email, password } = req.body as {name?: string, email?: string, password?: string};

    if (!name || !email || !password) {
      return reply.code(400).send({ message: 'Missing mandatory data'});
    }

    const passwordHash = await argon2.hash(password, {type: argon2.argon2id});
    try {
      const [user] = await db.insert(users).values({name, email, passwordHash}).returning({id: users.id});
      return reply.status(201).send({data: {id: user.id}});
    } catch (err) {
      const e = err as {code?: string, cause?: {code?: string}};
      if (e.code === '23505' || e.cause?.code === '23505') {
        return reply.status(409).send({message: 'Username already taken'});
      }
      throw err;
    }
  })

  app.post('/auth/login', async (req, reply) => {
    const {name, password} = req.body as {name?: string, password?: string};

    if (!name || !password) {
      return reply.code(400).send({message: 'Missing mandatory data'});
    }

    const [user] = await db.select({id: users.id, passwordHash: users.passwordHash}).from(users).where(eq(users.name, name));

    if (!user) {
      return reply.code(401).send({message: 'Invalid credentials'});
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      return reply.code(401).send({message: 'Invalid credentials'});
    }
    const token = app.jwt.sign({id: user.id});
    return reply.setCookie('token', token, {httpOnly: true, sameSite: 'lax', secure: false, path: '/'}).code(200).send({data: {id: user.id}});
  })


  app.post('/auth/logout', async (_, reply) => {
      return reply.clearCookie('token', {path: '/'}).code(200).send();
  });

  app.get('/auth/me', async (req, reply) => {
    try {
      await req.jwtVerify();
      return reply.code(200).send({data: { id: req.user.id}});
    } catch {
      return reply.code(401).send({message: 'Not authenticated'});
    }
  });


  ///////////////////////////// UTILS //////////////////////////////

  app.get('/storage', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;

    const [row] = await db.select({sizeTotal: sum(items.size)}).from(items).where(eq(items.userId, userId));

    return reply.code(200).send({data: {used: Number(row.sizeTotal ?? 0)}});
  });


  return app;
};

