import { db } from "../src/db";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { sql, eq } from "drizzle-orm";
import { buildApp } from '../src/index.js';
import { seed, createUser, createItem, createTag, linkTag } from "./helpers.js";
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

    it('reuses an existing tag instead of creating a duplicate', async () => {
        vi.mocked(getEmbedding).mockResolvedValue(null);
        const {userId} = await seed();
        const app = await buildApp();
        const {itemId: itemId1} = await createItem({userId, fileName: 'userFile1'});
        const {tagUuid: userTagUuid} = await createTag({userId, itemId: itemId1, tagName: 'user tag'});
        const {itemUuid: itemUuid2} = await createItem({userId, fileName: 'userFile2'});

        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "POST",
            url: `/api/items/${itemUuid2}/tags`,
            cookies: { token },
            payload: { name: ' USER TAG '},
        });
        expect(resp.statusCode).toBe(201);
        const jsonResp = await resp.json() as { data: { tag: {tagId: string, tagName: string}}};
        expect(jsonResp.data.tag.tagName).toEqual('user tag');
        expect(jsonResp.data.tag.tagId).toEqual(userTagUuid);

        const tstTag = await db.select().from(tags).where(eq(tags.userId, userId));
        expect(tstTag.length).toBe(1);
    });

    it('does not duplicate the link when the item already has the tag', async () => {
        vi.mocked(getEmbedding).mockResolvedValue(null);
        const {userId} = await seed();
        const app = await buildApp();
        const {itemUuid, itemId} = await createItem({userId, fileName: 'userFile'});
        const {tagUuid: userTagUuid} = await createTag({userId, itemId, tagName: 'user tag'});

        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "POST",
            url: `/api/items/${itemUuid}/tags`,
            cookies: { token },
            payload: { name: 'user tag'},
        });
        expect(resp.statusCode).toBe(201);
        const jsonResp = await resp.json() as { data: { tag: {tagId: string, tagName: string}}};
        expect(jsonResp.data.tag.tagName).toEqual('user tag');
        expect(jsonResp.data.tag.tagId).toEqual(userTagUuid);

        const tstTag = await db.select().from(itemTags).where(eq(itemTags.itemId, itemId));
        expect(tstTag.length).toBe(1);
    });
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

    it('returns 400 when the item id is not a uuid', async () => {
        const {userId} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const uuid = crypto.randomUUID();
        const resp = await app.inject({
            method: "DELETE",
            url: `/api/items/123item/tags/${uuid}`,
            cookies: { token },
        });
        expect(resp.statusCode).toBe(400);
    });

    it('returns 400 when the tag id is not a uuid', async () => {
        const {userId} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const uuid = crypto.randomUUID();
        const resp = await app.inject({
            method: "DELETE",
            url: `/api/items/${uuid}/tags/345tag`,
            cookies: { token },
        });
        expect(resp.statusCode).toBe(400);
    });

    it('returns 404 when the item belongs to another user', async () => {
        const {userId} = await seed();
        const {userId: otherUserId} = await createUser({});
        const {itemUuid: otherUserItemUuid, itemId: otherUserItemId} = await createItem({userId: otherUserId, fileName: 'otherUserFile'});
        const {itemId: userItemId} = await createItem({userId: userId, fileName: 'userFile'});
        await createTag({userId: otherUserId, itemId: otherUserItemId, tagName: 'otherUserTag'});
        const {tagUuid: userTagUuid} = await createTag({userId, itemId: userItemId, tagName: 'userTag'});
        const app = await buildApp();
        const token = app.jwt.sign({id: userId});
        const resp = await app.inject({
            method: "DELETE",
            url: `/api/items/${otherUserItemUuid}/tags/${userTagUuid}`,
            cookies: { token },
        });
        expect(resp.statusCode).toBe(404);
    });

    it('returns 404 when the tag belongs to another user', async () => {
        const {userId} = await seed();
        const {userId: otherUserId} = await createUser({});

        const {itemId: otherUserItemId} = await createItem({userId: otherUserId, fileName: 'otherUserFile'});
        const {itemUuid: userItemUuid, itemId: userItemId} = await createItem({userId: userId, fileName: 'userFile'});
        const {tagUuid: otherUserTagUuid} = await createTag({userId: otherUserId, itemId: otherUserItemId, tagName: 'otherUserTag'});
        await createTag({userId, itemId: userItemId, tagName: 'userTag'});

        const app = await buildApp();
        const token = app.jwt.sign({id: userId});
        const resp = await app.inject({
            method: "DELETE",
            url: `/api/items/${userItemUuid}/tags/${otherUserTagUuid}`,
            cookies: { token },
        });
        expect(resp.statusCode).toBe(404);

        const otherLinks = await db.select().from(itemTags).where(eq(itemTags.itemId, otherUserItemId));
        expect(otherLinks.length).toBe(1);
    });

    it('removes only the requested tag from the item, keeping the others', async () => {
        const {userId} = await seed();
        
        const {itemUuid: itemUuid1, itemId: itemId1} = await createItem({userId, fileName: 'userItem1'});
        
        const {tagUuid: tagUuid1} = await createTag({userId, itemId: itemId1, tagName: 'Tag Item 1'});
        const {tagUuid: tagUuid2} = await createTag({userId, itemId: itemId1, tagName: 'Tag Item 2'});

        const app = await buildApp();
        const token = app.jwt.sign({id: userId});
        const resp = await app.inject({
            method: "DELETE",
            url: `/api/items/${itemUuid1}/tags/${tagUuid1}`,
            cookies: { token },
        });
        expect(resp.statusCode).toBe(204);
        const tstTag = await db.select({tagUuid: tags.tagUuid, tagName: tags.tagName}).from(itemTags).innerJoin(tags, eq(itemTags.tagId, tags.id)).where(eq(itemTags.itemId, itemId1));
        expect(tstTag.length).toEqual(1);
        expect(tstTag[0].tagUuid).toEqual(tagUuid2);
    });

    it('removes the tag only from this item, keeping it on other items', async () => {
        const {userId} = await seed();
        
        const {itemUuid: itemUuid1, itemId: itemId1} = await createItem({userId, fileName: 'userItem1'});
        const {itemId: itemId2} = await createItem({userId, fileName: 'userItem2'});
        
        const {tagUuid, tagId} = await createTag({userId, itemId: itemId1, tagName: 'Tag Item'});
        await linkTag({tagId, itemId: itemId2});

        const app = await buildApp();
        const token = app.jwt.sign({id: userId});
        const resp = await app.inject({
            method: "DELETE",
            url: `/api/items/${itemUuid1}/tags/${tagUuid}`,
            cookies: { token },
        });
        expect(resp.statusCode).toBe(204);
        
        const tstTag1 = await db.select({tagUuid: tags.tagUuid, tagName: tags.tagName}).from(itemTags).innerJoin(tags, eq(itemTags.tagId, tags.id)).where(eq(itemTags.itemId, itemId1));
        expect(tstTag1.length).toEqual(0);

        const tstTag2 = await db.select({tagUuid: tags.tagUuid, tagName: tags.tagName}).from(itemTags).innerJoin(tags, eq(itemTags.tagId, tags.id)).where(eq(itemTags.itemId, itemId2));
        expect(tstTag2.length).toEqual(1);
        expect(tstTag2[0].tagUuid).toEqual(tagUuid);
    });

    it('deletes the tag when its last link is removed', async () => {
        const {userId} = await seed();

        const {itemUuid: itemUuid1, itemId: itemId1} = await createItem({userId, fileName: 'userItem1'});
        const {tagUuid} = await createTag({userId, itemId: itemId1, tagName: 'Tag Item'});

        const app = await buildApp();
        const token = app.jwt.sign({id: userId});
        const resp = await app.inject({
            method: "DELETE",
            url: `/api/items/${itemUuid1}/tags/${tagUuid}`,
            cookies: { token },
        });

        expect(resp.statusCode).toBe(204);
        
        const tstTag = await db.select().from(tags).where(eq(tags.tagUuid, tagUuid));
        expect(tstTag.length).toEqual(0);
    });

});



