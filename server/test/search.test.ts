import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "../src/db.js";
import { sql, eq } from "drizzle-orm";
import { seed, createUser } from "./helpers.js";
import { buildApp } from '../src/index.js';
import { items } from "../src/schema.js";
import { getEmbedding } from "../src/utility.js";

beforeEach(async () => {
  await db.execute(sql`truncate table items, users restart identity cascade`);
});

vi.mock('../src/utility.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/utility.js')>();
  return { ...original, getEmbedding: vi.fn() };
});

describe('/GET search', () => {
    it('it returns a 400 when query string is missing', async () => {
        const {userId} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "GET",
            url: `/search?q=`,
            cookies: { token }
        });
        expect(resp.statusCode).toBe(400);
    })

    it('it returns a 503 when no embedding is generated', async () => {
        vi.mocked(getEmbedding).mockResolvedValue(null);
        const {userId} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const resp = await app.inject({
            method: "GET",
            url: `/search?q=searchedString`,
            cookies: { token }
        });
        expect(resp.statusCode).toBe(503);
    })

    it('it returns a record with a valid embedding', async () => {
        vi.mocked(getEmbedding).mockResolvedValue(new Array(768).fill(0.5));
        const {userId, idC, uuidC} = await seed();
        await db.update(items).set({itemVector: new Array(768).fill(0.5)}).where(eq(items.id, idC));
        const app = await buildApp();
        const token = app.jwt.sign({id: userId});
        const resp = await app.inject({
            method: "GET",
            url: `/search?q=searchedString`,
            cookies: { token }
        });
        const parsedResp = await resp.json();
        expect(resp.statusCode).toBe(200);
        expect(parsedResp.data.items[0].id).toEqual(uuidC);
        expect(parsedResp.data.items).toHaveLength(1);
    });

    it('it returns an empty result when requesting a different user item', async () => {
        vi.mocked(getEmbedding).mockResolvedValue(new Array(768).fill(0.5));
        const {idC } = await seed();
        const { userId: otherUserId } = await createUser({});
        await db.update(items).set({itemVector: new Array(768).fill(0.5)}).where(eq(items.id, idC));
        const app = await buildApp();
        const token = app.jwt.sign({id: otherUserId});
        const resp = await app.inject({
            method: "GET",
            url: `/search?q=searchedString`,
            cookies: { token }
        });
        const parsedResp = await resp.json();
        expect(resp.statusCode).toBe(200);
        expect(parsedResp.data.items).toHaveLength(0);
    })
})