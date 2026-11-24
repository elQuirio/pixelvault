import type { FastifyPluginCallback } from 'fastify';
import { db } from '../db.js';
import { tags } from '../schema.js';
import { eq, asc} from 'drizzle-orm';


export const tagsRoutes: FastifyPluginCallback = (app, _opts, done) => {

  app.get('/tags', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;

    const tgsList = await db.select({ tagId: tags.tagUuid, tagName: tags.tagName }).from(tags).where(eq(tags.userId, userId)).orderBy(asc(tags.tagName));

    return reply.send({ data: { tags: tgsList}})
  })

  done();
};
