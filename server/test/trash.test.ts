import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/db.js";
import { sql, inArray, eq } from "drizzle-orm";
import { seed, createItem, createTag, linkTag } from "./helpers.js";
import { buildApp } from '../src/index.js';
import { items, itemTags, tags } from "../src/schema.js";


beforeEach(async () => {
  await db.execute(sql`truncate table items, users, tags, item_tags restart identity cascade`);
});



describe('DELETE /api/items', () => {
    it('it returns 204 code when successfully deleted an item', async () => {
        const {userId, uuidA} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const res = await app.inject({
            method: "DELETE",
            url: "/api/items",
            payload: { ids: [uuidA] },
            cookies: { token },
        });

        expect(res.statusCode).toBe(204);
    });

    it('it successfully delete the whole subtree', async () => {
        const {userId, uuidA, idA, idB, idC} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        await app.inject({
            method: "DELETE",
            url: "/api/items",
            payload: { ids: [uuidA] },
            cookies: { token },
        });
        const result = await db.select({id: items.id, deletedAt: items.deletedAt}).from(items).where(inArray(items.id, [idA, idB, idC]));
        for (const row of result) {
            expect(row.deletedAt).not.toBeNull();
            expect(row.deletedAt).toEqual(result[0].deletedAt);
        }
        expect(result).toHaveLength(3);
    })

    it('it only deletes subtree items', async () => {
        const {userId, uuidA, idZ} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const res = await app.inject({
            method: "DELETE",
            url: "/api/items",
            payload: { ids: [uuidA] },
            cookies: { token },
        });
        expect(res.statusCode).toBe(204);
        const [result] = await db.select({id: items.id, deletedAt: items.deletedAt}).from(items).where(eq(items.id, idZ));
        expect(result.deletedAt).toBeNull();
    })

    it('it returns a 400 status code when ids are missing', async () => {
        const {userId} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const res = await app.inject({
            method: "DELETE",
            url: "/api/items",
            payload: { },
            cookies: { token },
        });

        expect(res.statusCode).toBe(400);
    })

    it('it returns a 401 status code when token is missing', async () => {
        const {uuidA} = await seed();
        const app = await buildApp();
        const res = await app.inject({
            method: "DELETE",
            url: "/api/items",
            payload: { ids: [uuidA] },
            cookies: { },
        });

        expect(res.statusCode).toBe(401);
    });
});



describe('DELETE /api/items/permanent', () => {
    it('deletes orphan tags after a permanent delete, keeping shared ones', async () => {
        const {userId} = await seed();
        
        const {itemUuid: itemUuid1, itemId: itemId1} = await createItem({userId, fileName: 'userItem1'});
        const {tagUuid: tagUuid1, tagId: tagId1} = await createTag({userId, itemId: itemId1, tagName: 'Tag Orphan'});

        const {itemId: itemId2} = await createItem({userId, fileName: 'userItem2'});
        const {tagUuid: tagUuid2, tagId: tagId2} = await createTag({userId, itemId: itemId2, tagName: 'Tag Item'});

        await linkTag({tagId: tagId2, itemId: itemId1});

        await db.update(items).set({ deletedAt: new Date() }).where(eq(items.id, itemId1));

        const app = await buildApp();
        const token = app.jwt.sign({id: userId});
        const res = await app.inject({
            method: "DELETE",
            url: "/api/items/permanent",
            payload: { ids: [itemUuid1] },
            cookies: { token },
        });

        expect(res.statusCode).toBe(204);
        
        const tstItemTag1 = await db.select().from(itemTags).innerJoin(tags, eq(itemTags.tagId, tags.id)).where(eq(itemTags.itemId, itemId1));
        expect(tstItemTag1.length).toEqual(0);

        const tstTag1 = await db.select().from(tags).where(eq(tags.id, tagId1));
        expect(tstTag1.length).toEqual(0);

        const tstItemTag2 = await db.select({tagUuid: tags.tagUuid, tagName: tags.tagName}).from(itemTags).innerJoin(tags, eq(itemTags.tagId, tags.id)).where(eq(itemTags.itemId, itemId2));
        expect(tstItemTag2.length).toEqual(1);
        expect(tstItemTag2[0].tagUuid).toEqual(tagUuid2);
    });
});