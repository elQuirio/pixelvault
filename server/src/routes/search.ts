import type { FastifyPluginAsync } from 'fastify';
import { db } from "../db.js";
import { items } from "../schema.js";
import { eq, asc, and, isNull, isNotNull, cosineDistance } from "drizzle-orm";
import { getEmbedding } from "../utility.js";


export const searchRoutes: FastifyPluginAsync = async (app) => {
    app.get('/search', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;
    const { q: queryString } = req.query as {q: string};

    if (!queryString?.trim()) return reply.code(400).send({message: 'Missing mandatory data'});

    const embedding = await getEmbedding({type: 'text', value: queryString});

    if (!embedding) return reply.code(503).send({message: 'Error calling text embedding service'});

    const rows = await db.select({id: items.id, 
                                  fileUuid: items.fileUuid, 
                                  itemType: items.itemType, 
                                  originalName: items.originalName, 
                                  visibleName: items.visibleName,
                                  size: items.size,
                                  createdAt: items.createdAt,
                                  metadata: items.metadata,
                                  distance: cosineDistance(items.itemVector, embedding)})
      .from(items)
      .where(and(isNotNull(items.itemVector), eq(items.userId, userId), isNull(items.deletedAt)))
      .orderBy(asc(cosineDistance(items.itemVector, embedding)))
      .limit(100);

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
        childCount: 0,
        folderCount: 0,
        distance: f.distance
      })),
    }};
  })
};


