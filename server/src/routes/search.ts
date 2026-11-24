import type { FastifyPluginCallback } from 'fastify';
import { db } from "../db.js";
import { items, itemTags, tags } from "../schema.js";
import { eq, asc, desc, and, isNull, isNotNull, cosineDistance, exists } from "drizzle-orm";
import { getEmbedding, toItemDto, isUuid } from "../utility.js";


export const searchRoutes: FastifyPluginCallback = (app, _opts, done) => {
    app.get('/search', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;
    const { q: queryString, tags: tagsParam } = req.query as {q?: string, tags?: string};
    const tagList = tagsParam ? tagsParam.split(',') : [];
    const text = queryString?.trim();

    if (!text && tagList.length === 0) return reply.code(400).send({message: 'Missing mandatory data'});
    if (tagList.some((t) => !isUuid(t))) return reply.code(400).send({ message: 'Invalid tag id' });
    
    const embedding = text ? await getEmbedding({type: 'text', value: text}) : null;
    if (text && !embedding) return reply.code(503).send({message: 'Error calling text embedding service'});

    const orderBy = embedding ? asc(cosineDistance(items.itemVector, embedding)) : desc(items.createdAt);
    const conditions = [eq(items.userId, userId), isNull(items.deletedAt)];
    
    if (text) conditions.push(isNotNull(items.itemVector));
    if (tagList.length >0) {
      for (const tagUuid of tagList) {
        conditions.push(exists(
          db.select().from(itemTags)
            .innerJoin(tags, eq(tags.id, itemTags.tagId))
            .where(and(
              eq(itemTags.itemId, items.id),
              eq(tags.tagUuid, tagUuid),
              eq(tags.userId, userId),
            ))
        ));
      }
    }

    const rows = await db.select({id: items.id, 
                                  fileUuid: items.fileUuid, 
                                  itemType: items.itemType, 
                                  originalName: items.originalName,
                                  visibleName: items.visibleName,
                                  size: items.size,
                                  createdAt: items.createdAt,
                                  metadata: items.metadata,
                                  viewCount: items.viewCount,
                                  lastViewedAt: items.lastViewedAt,
                                  })
      .from(items)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(100);

    return {data: { items: rows.map((r) => ({...toItemDto(r) })) }};
  })

  done();
};


