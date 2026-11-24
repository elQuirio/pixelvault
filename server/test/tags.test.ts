import { db } from "../src/db";
import { describe, it, beforeEach, expect } from "vitest";
import { sql } from "drizzle-orm";
import { buildApp } from '../src/index.js';
import { createTag, createUser, seed } from "./helpers.js";


beforeEach(async () => {
  await db.execute(sql`truncate table items, users, tags, item_tags restart identity cascade`);
});


describe('GET /api/tags', () => {
    
    it('returns 401 without a token', async () => {
        const app = await buildApp();
        const resp = await app.inject({
            method: "GET",
            url: "/api/tags",
        });
        expect(resp.statusCode).toBe(401);
    });

    it('returns only the tags of the current user, sorted by name', async () => {
        const {userId} = await seed();
        const {userId: otherUserId} = await createUser({});
        await createTag({userId, tagName: 'tagA'});
        await createTag({userId, tagName: 'tagB'});
        await createTag({userId, tagName: 'tagD'});
        await createTag({userId: otherUserId, tagName: 'tagC'});
        
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "GET",
            url: "/api/tags",
            cookies: { token }
        });
        expect(resp.statusCode).toBe(200);
        const jsonResp = resp.json();
        expect(jsonResp.data.tags.map((t: {tagId: string, tagName: string}) => t.tagName)).toEqual(['tagA', 'tagB', 'tagD']);
    });
});