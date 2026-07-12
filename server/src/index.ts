import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import staticPlugin from "@fastify/static";
import sharp from "sharp";
import { db } from "./db";
import { items, users } from "./schema";
import { eq, asc, desc, and, isNull, isNotNull, inArray, sum } from "drizzle-orm";
import argon2 from 'argon2';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import exifr from 'exifr';
import { fileTypeFromBuffer } from "file-type";
import convert from 'heic-convert';
import { safeUnlink, isUuid } from "./utility";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const ORIGINAL_DIR = join(UPLOAD_DIR, "originals");
const THUMBNAIL_DIR = join(UPLOAD_DIR, "thumbnails");
await mkdir(ORIGINAL_DIR, { recursive: true });
await mkdir(THUMBNAIL_DIR, { recursive: true });

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});


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

await app.register(cors, { origin: "http://localhost:5173", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], credentials: true });

await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, //50MB
    files: 20,
  },
});

await app.register(staticPlugin, {
  root: UPLOAD_DIR,
  prefix: "/uploads/",
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
  let parentFolder: {id: number};
  const conditions = [eq(items.userId, userId)];

  if (parentIdString === 'root') {
    conditions.push(isNull(items.parentId));
  }
  else if (parentIdString) {
    if (!isUuid(parentIdString)) {
      return reply.code(404).send({message: 'Resource not found'});
    }
    [parentFolder] = await db.select({id: items.id}).from(items).where(and(eq(items.userId, userId), eq(items.fileUuid, parentIdString)));
    if (!parentFolder) {
      return reply.code(404).send({message: 'Resource not found'});
    } 
    conditions.push(eq(items.parentId, parentFolder.id));
  }

  if(type) {
    conditions.push(inArray(items.itemType, type.split(',')));
  }

  if (deleted==='true') {
    conditions.push(isNotNull(items.deletedAt));
  } else {
    conditions.push(isNull(items.deletedAt));
  }

  const orderBy = (sortBy && sortBy in sortMap) ? sortMap[sortBy] : desc(items.createdAt);

  const rows = (await db.select().from(items).where(and(...conditions)).orderBy(orderBy));

  return {data: {
    items: rows.map((f) => ({
      id: f.fileUuid,
      url: `/uploads/originals/${f.fileUuid}.${f.ext}`,
      thumbnail: f.itemType === 'image' ? `/uploads/thumbnails/${f.fileUuid}.webp` : null,
      originalName: f.originalName,
      visibleName: f.visibleName,
      size: f.size,
      itemType: f.itemType,
      createdAt: f.createdAt,
      metadata: f.metadata,
    })),
  }};
});


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

  const {parentId: parentUUID} = req.query as {parentId: string};
  let parentId : number | null = null;
  if (parentUUID) {
    if (!isUuid(parentUUID)) {
      return reply.code(404).send({message: 'Resource not found'});
    }
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
      let buffer = await part.toBuffer();
      const originalBuffer = buffer;
      const buffFileType = await fileTypeFromBuffer(buffer);
      const isHeic = buffFileType?.mime === 'image/heic' || buffFileType?.mime ==='image/heif';
      const isPhoto = isHeic || buffFileType?.mime.startsWith('image/');
      const itemType = isPhoto ? 'image' : 'file';
      const ext = isHeic ? 'jpg' : (buffFileType?.ext ?? 'bin');
  
      const filepath = join(ORIGINAL_DIR, `${fileUuid}.${ext}`);

      if (isHeic) {
        buffer = Buffer.from(await convert({
          buffer: buffer,
          format: 'JPEG',
          quality: 0.9,
        }));
      }
      
      let metadata = null;

      if (isPhoto) {
        metadata = (await exifr.parse(isHeic ? originalBuffer : buffer, {gps: true}) ?? null) as Record<string, unknown> | null;
        await sharp(buffer)
          .resize(200, 200, { fit: "cover" })
          .webp({ quality: 80 })
          .toFile(join(THUMBNAIL_DIR, `${fileUuid}.webp`));
      }

      await writeFile(filepath, buffer);

      await db
        .insert(items)
        .values({ fileUuid, ext, originalName, parentId, visibleName: originalName, size: buffer.length, userId, metadata, itemType });

      saved.push({
        id: fileUuid,
        itemType,
        originalName,
        size: buffer.length,
        url: `/uploads/originals/${fileUuid}.${ext}`,
        thumbnail: isPhoto ? `/uploads/thumbnails/${fileUuid}.webp` : null,
      });
    } catch (err) {
      req.log.error({ err, file: part.filename }, 'skipping failed file');
      continue;
    }
  }
  return { data: {uploaded: saved }};
});


app.delete("/items/:id", {preHandler: [app.authenticate]}, async (req, reply) => {
  const { id } = req.params as { id: string };
  const userId = req.user.id;

  if (!id) {
    return reply.code(400).send();
  } else if (!isUuid(id)) {
    return reply.code(404).send({message: 'Resource not found'});
  }


  const [item] = await db.select().from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
  if (!item) {
    return reply.code(404).send({ message: "Resource not found" });
  }

  if (item.itemType === 'folder') {
    const children = await db.select({id: items.id}).from(items).where(and(eq(items.parentId, item.id), eq(items.userId, userId), isNull(items.deletedAt)));
    if (children.length > 0) {
      return reply.code(409).send({ message: "Folder not empty"});
    }
  }

  //db
  await db.update(items).set({deletedAt: new Date()}).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));

  return reply.code(204).send();
});

app.delete("/items", {preHandler: [app.authenticate]}, async (req, reply) => {
  const { ids } = req.body as { ids: string[] };
  const userId = req.user.id;

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
    await db.update(items).set({deletedAt: new Date()}).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
  }
  return reply.code(204).send();
});



app.post('/items/:id/restore', {preHandler: [app.authenticate]}, async (req, reply)=> {
  const { id } = req.params as {id: string};

  if (!id) {
    return reply.code(400).send();
  } else if (!isUuid(id)) {
    return reply.code(404).send({message: 'Resource not found'});
  }

  const userId = req.user.id;
  const restored = await db.update(items).set({deletedAt: null}).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt) )).returning({id: items.fileUuid});

  if (restored.length === 0) {
    return reply.code(404).send({message: 'Resource not found'});
  }

  return reply.code(200).send();
});

// restore bulk
app.post('/items/restore', {preHandler: [app.authenticate]}, async (req, reply)=> {
  const { ids } = req.body as { ids: string[] };
  const userId = req.user.id;

  if (!ids || ids.length === 0) {
    return reply.code(400).send();
  }

  for (const id of ids) {
    if (!isUuid(id)) continue;
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
    if (!item) continue;
    await db.update(items).set({deletedAt: null}).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
  }
  return reply.code(200).send();

})


// permanent single
app.delete('/items/:id/permanent', {preHandler: [app.authenticate]}, async (req, reply) => {
  const {id} = req.params as {id: string};

  if (!id) {
    return reply.code(400).send({message: 'Missing mandatory data'});
  } else if (!isUuid(id)) {
    return reply.code(404).send({message: 'Resource not found'});
  }

  const userId = req.user.id;
  
  const [item] = await db.select().from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
  if (!item) {
    return reply.code(404).send({ message: "Resource not found" });
  }
  //db
  await db.delete(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
  //original
  await safeUnlink(join(ORIGINAL_DIR, `${id}.${item.ext}`));
  //thumbnail
  await safeUnlink(join(THUMBNAIL_DIR, `${id}.webp`));

  return reply.code(204).send();
});


// permanent bulk
app.delete('/items/permanent', {preHandler: [app.authenticate]}, async (req, reply) => {
  const { ids } = req.body as { ids: string[] };
  const userId = req.user.id;

  if (!ids || ids.length === 0) {
    return reply.code(400).send();
  }

  for (const id of ids) {
    if (!isUuid(id)) continue;

    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
    if (!item) continue;
    await db.delete(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
    await safeUnlink(join(ORIGINAL_DIR, `${id}.${item.ext}`));
    await safeUnlink(join(THUMBNAIL_DIR, `${id}.webp`));
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


//////////////////////////////////////////////////////////////////

const start = async () => {
  try {
    await db.execute("select 1");
    app.log.info("db connected");
    await app.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
