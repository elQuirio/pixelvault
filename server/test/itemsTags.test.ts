import { db } from "../src/db";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { sql, eq } from "drizzle-orm";
import { buildApp } from '../src/index.js';
import { seed, createUser, createItem, createTag } from "./helpers.js";
import { getEmbedding } from "../src/utility.js";
import { itemTags, tags } from "../src/schema.js";


beforeEach(async () => {
  await db.execute(sql`truncate table items, users, tags, item_tags restart identity cascade`);
});

vi.mock('../src/utility.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/utility.js')>();
  return { ...original, getEmbedding: vi.fn() };
});

describe('GET /api/items/:id/tags', () => {
    it('returns 401 without a token', async () => {
        const app = await buildApp();
        const resp = await app.inject({
            method: "GET",
            url: "/api/items/123abc/tags",
        });
        expect(resp.statusCode).toBe(401);
    });

    it('returns 400 when the item id is not a uuid', async () => {
        const {userId} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "GET",
            url: "/api/items/123abc/tags",
            cookies: { token }
        });
        expect(resp.statusCode).toBe(400);
    });

    it('returns 404 when the item belongs to another user', async () => {
        const {userId} = await seed();
        const {userId: otherUserId} = await createUser({});
        const {itemUuid: otherUserItemUuid} = await createItem({userId: otherUserId, fileName: 'otherUserFile'});
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "GET",
            url: `/api/items/${otherUserItemUuid}/tags`,
            cookies: { token }
        });
        expect(resp.statusCode).toBe(404);
    });

    it('returns an empty list for an item without tags', async () => {
        const {userId} = await seed();
        const {itemUuid} = await createItem({userId, fileName: 'userFile'});
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "GET",
            url: `/api/items/${itemUuid}/tags`,
            cookies: { token }
        });
        expect(resp.statusCode).toBe(200);
        const jsonResp = await resp.json() as { data: { tags: { tagId: string; tagName: string;}[] }};
        expect(jsonResp.data.tags).toEqual([]);
    });

    it('returns the tags of the item', async () => {
        const {userId} = await seed();
        const {itemUuid, itemId} = await createItem({userId, fileName: 'userFile'});
        const {tagUuid, tagName} = await createTag({userId, itemId, tagName: 'testTag'});
        const {itemId: otherItemId} = await createItem({userId, fileName: 'otherFile'});
        await createTag({userId, itemId: otherItemId, tagName: 'otherTestTag'});
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "GET",
            url: `/api/items/${itemUuid}/tags`,
            cookies: { token }
        });
        expect(resp.statusCode).toBe(200);
        const jsonResp = await resp.json() as { data: { tags: { tagId: string; tagName: string;}[] }};
        expect(jsonResp.data.tags).toEqual([{tagId: tagUuid, tagName: tagName}]);
    });
});


describe('POST /api/items/:id/tags', () => {

    it('returns 401 without a token', async () => {
        const app = await buildApp();
        const resp = await app.inject({
            method: "POST",
            url: "/api/items/123abc/tags",
        });
        expect(resp.statusCode).toBe(401);
    });

    it('returns 400 when the item id is not a uuid', async () => {
        const {userId} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "POST",
            url: "/api/items/123abc/tags",
            cookies: { token },
            payload: { name: 'sea' },
        });
        expect(resp.statusCode).toBe(400);
    });

    it('returns 400 when the tag name is missing or blank', async () => {
        const {userId} = await seed();
        const app = await buildApp();
        const {itemUuid, itemId} = await createItem({userId, fileName: 'userFile'});
        await createTag({userId, itemId, tagName: 'testTag'});
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "POST",
            url: `/api/items/${itemUuid}/tags`,
            cookies: { token },
            payload: { name: '' },
        });
        expect(resp.statusCode).toBe(400);
    });

    it('returns 400 when the tag name is longer than 50 characters', async () => {
        const {userId} = await seed();
        const app = await buildApp();
        const {itemUuid, itemId} = await createItem({userId, fileName: 'userFile'});
        await createTag({userId, itemId, tagName: 'testTag'});
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "POST",
            url: `/api/items/${itemUuid}/tags`,
            cookies: { token },
            payload: { name: '012345678901234567890123456789012345678901234567890123456789' },
        });
        expect(resp.statusCode).toBe(400);
    });

    it('returns 404 when the item belongs to another user', async () => {
        const {userId} = await seed();
        const {userId: otherUserId} = await createUser({});
        const {itemUuid: otherUserItemUuid} = await createItem({userId: otherUserId, fileName: 'otherUserFile'});
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "POST",
            url: `/api/items/${otherUserItemUuid}/tags`,
            cookies: { token },
            payload: { name: 'sea' },
        });
        expect(resp.statusCode).toBe(404);
    });

    it('creates the tag and links it, saving the name trimmed and lowercased', async () => {
        vi.mocked(getEmbedding).mockResolvedValue(null);
        const {userId} = await seed();
        const app = await buildApp();
        const {itemUuid, itemId} = await createItem({userId, fileName: 'userFile'});
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "POST",
            url: `/api/items/${itemUuid}/tags`,
            cookies: { token },
            payload: { name: 'TEST TAG '},
        });
        expect(resp.statusCode).toBe(201);
        const jsonResp = await resp.json() as { data: { tag: {tagId: string, tagName: string}}};
        expect(jsonResp.data.tag.tagName).toEqual('test tag');
        const tst = await db.select().from(itemTags).innerJoin(tags, eq(itemTags.tagId, tags.id)).where(eq(itemTags.itemId, itemId));
        expect(tst.length).toEqual(1);
        expect(tst[0].tags.tagUuid).toEqual(jsonResp.data.tag.tagId);
        expect(tst[0].tags.tagName).toEqual('test tag');
    });

    it('reuses an existing tag instead of creating a duplicate');
    it('does not duplicate the link when the item already has the tag');
});


describe('DELETE /api/items/:id/tags/:tagId', () => {
    
    it('returns 401 without a token', async () => {
        const app = await buildApp();
        const resp = await app.inject({
            method: "DELETE",
            url: "/api/items/123abc/tags/345tag",
        });
        expect(resp.statusCode).toBe(401);
    });

    it('returns 400 when the item id or the tag id is not a uuid');
    it('returns 404 when the item belongs to another user');
    it('returns 404 when the tag belongs to another user');
    it('removes the link only from this item, keeping it on the others');
    it('deletes the tag when its last link is removed');
});



