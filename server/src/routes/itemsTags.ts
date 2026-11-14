import type { FastifyPluginCallback } from 'fastify';
import { isUuid } from '../utility.js';
import { db } from '../db.js';
import { items, itemTags, tags } from '../schema.js';
import { eq, and } from 'drizzle-orm';


export const itemTagsRoutes: FastifyPluginCallback = (app, _opts, done) => {

  app.get('/items/:id/tags', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;
    const { id } = req.params as { id: string };

    if (!id || !isUuid(id)) return reply.code(400).send({message: 'Missing mandatory id'});
    const [item] = await db.select({itemId: items.id}).from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
    if (!item) return reply.code(404).send({message: 'Item not found'});

    const itmTgs = await db.select({ tagId: tags.tagUuid, tagName: tags.tagName }).from(itemTags).innerJoin(tags, eq(itemTags.tagId, tags.id)).where(eq(itemTags.itemId, item.itemId));

    return reply.send({ data: { tags: itmTgs }});
  });

  app.post('/items/:id/tags', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;
    const { id } = req.params as { id: string };
    const { name } = req.body as { name?: string };
    const tagName = name?.trim().toLowerCase();

    if (!id || !isUuid(id)) return reply.code(400).send({message: 'Missing mandatory id'});
    if (!tagName) return reply.code(400).send({message: 'Missing mandatory tag name'});
    if (tagName.length > 50) return reply.code(400).send({message: 'Tag name is too long (max 50)'});

    const [item] = await db.select({itemId: items.id}).from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
    if (!item) return reply.code(404).send({message: 'Item not found'});

    await db.insert(tags).values({userId, tagName: tagName}).onConflictDoNothing();
    const [tgs] = await db.select({tagUuid: tags.tagUuid, tagId: tags.id, tagName: tags.tagName}).from(tags).where(and(eq(tags.userId, userId), eq(tags.tagName, tagName)));

    await db.insert(itemTags).values({tagId: tgs.tagId, itemId: item.itemId, source: 'manual'}).onConflictDoNothing();

    return reply.code(201).send({ data: { tag: {tagId: tgs.tagUuid, tagName: tgs.tagName}}});
  });


  app.delete('/items/:id/tags/:tagId', {preHandler: [app.authenticate]}, async (req, reply) => {
    const userId = req.user.id;
    const { id, tagId: tagUuid } = req.params as { id: string, tagId: string };

    if (!id || !isUuid(id)) return reply.code(400).send({message: 'Missing mandatory item id'});
    if (!tagUuid || !isUuid(tagUuid)) return reply.code(400).send({message: 'Missing mandatory tag id'});

    const [item] = await db.select({itemId: items.id}).from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
    if (!item) return reply.code(404).send({message: 'Item not found'});

    const [tag] = await db.select({tagId: tags.id}).from(tags).where(and(eq(tags.userId, userId), eq(tags.tagUuid, tagUuid)));
    if (!tag) return reply.code(404).send({message: 'Tag not found'});

    await db.delete(itemTags).where(and(eq(itemTags.tagId, tag.tagId), eq(itemTags.itemId, item.itemId)));
    
    return reply.code(204).send();
  });

  done();
};
