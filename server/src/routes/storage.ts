import type { FastifyPluginAsync } from 'fastify';
import { db } from "../db.js";
import { eq, sum } from "drizzle-orm";
import { items } from "../schema.js";


export const storageRoutes: FastifyPluginAsync = async (app) => {

  app.get('/storage', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;

    const [row] = await db.select({sizeTotal: sum(items.size)}).from(items).where(eq(items.userId, userId));

    return reply.code(200).send({data: {used: Number(row.sizeTotal ?? 0)}});
  });
};