import type { FastifyPluginCallback } from 'fastify';
import { db } from "../db.js";
import { eq, sum, and, inArray, not, isNull, desc, getTableColumns, isNotNull, sql, avg } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { items } from "../schema.js";
import { getFolderSizes } from '../utility.js';


export const storageRoutes: FastifyPluginCallback = (app, _opts, done) => {

  app.get('/storage', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;

    const [row] = await db.select({sizeTotal: sum(items.size)}).from(items).where(eq(items.userId, userId));

    return reply.code(200).send({data: {used: Number(row.sizeTotal ?? 0)}});
  });


  app.get('/storage/details', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;

    const [totalSize] = await db.select({totalSize: sum(items.size)}).from(items).where(and(eq(items.userId, userId), isNull(items.deletedAt)));
    const [binSize] = await db.select({binSize: sum(items.size)}).from(items).where(and(eq(items.userId, userId), isNotNull(items.deletedAt)));
        
    const parent = alias(items, 'parent');
    const topTenItems = await db.select({...getTableColumns(items), parentName: parent.visibleName}).from(items).leftJoin(parent, eq(parent.id, items.parentId)).where(and(not(inArray(items.itemType,['folder'])), eq(items.userId, userId), isNull(items.deletedAt))).orderBy(desc(items.size)).limit(10);

    const itemTypeSize = await db.select({itemType: items.itemType, itemTypeSize: sum(items.size)}).from(items).where(and(eq(items.userId, userId), not(inArray(items.itemType, ['folder'])), isNull(items.deletedAt))).groupBy(items.itemType);
    
    const folderSizes = await getFolderSizes({userId});
    const foldersData = await db.select({id: items.id, fileUuid: items.fileUuid, name: items.visibleName}).from(items).where(and(eq(items.userId, userId), eq(items.itemType, 'folder'), isNull(items.parentId), isNull(items.deletedAt)));
    const topFiveFolders = foldersData.map((f) => ({name: f.name, id: f.fileUuid, size: folderSizes.get(f.id)??0})).sort((a,b) => b.size-a.size).slice(0,5);

    const dups = db.select({itemHash: items.itemHash, duplicatesSize: sum(items.size).as('duplicatesSize'), originalSize: avg(items.size).as('originalSize')}).from(items).where(and(not(inArray(items.itemType,['folder'])), eq(items.userId, userId), isNull(items.deletedAt), isNotNull(items.itemHash))).groupBy(items.itemHash).having(sql`count(*)>1`).as('dups');
    const [duplicateRaw] = await db.select({duplicatesSize: sql`sum(${dups.duplicatesSize}) -  sum(${dups.originalSize})`}).from(dups);
    const duplicateSize = Number(duplicateRaw?.duplicatesSize ?? 0);

    return reply.code(200).send({data: {totalSize: Number(totalSize.totalSize ?? 0),
                                        binSize: Number(binSize.binSize ?? 0),
                                        itemTypeSize: itemTypeSize.map((i) => {return {itemType: i.itemType, itemTypeSize: Number(i.itemTypeSize)}}),
                                        topTenItems: topTenItems.map((i) => ({
                                                                      id: i.fileUuid,
                                                                      url: `/items/${i.fileUuid}/original`,
                                                                      thumbnail: ['image', 'video'].includes(i.itemType) ? `/items/${i.fileUuid}/thumbnail` : null,
                                                                      originalName: i.originalName,
                                                                      visibleName: i.visibleName,
                                                                      parentName: i.parentName,
                                                                      size: i.size,
                                                                      itemType: i.itemType,
                                                                      createdAt: i.createdAt,
                                                                      metadata: i.metadata,
                                                                      childCount: 0,
                                                                      folderCount: 0,
                                                                      })),
                                        topFiveFolders, 
                                        duplicateSize}});
  })

  done();
};

