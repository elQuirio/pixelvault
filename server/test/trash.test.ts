import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/db.js";
import { sql, inArray, eq } from "drizzle-orm";
import { seed } from "./helpers.js";
import { buildApp } from '../src/index.js';
import { items } from "../src/schema.js";


beforeEach(async () => {
  await db.execute(sql`truncate table items, users restart identity cascade`);
});



describe('DELETE /items', () => {
    it('it returns 204 code when successfully deleted an item', async () => {
        const {userId, uuidA} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const res = await app.inject({
            method: "DELETE",
            url: "/items",
            payload: { ids: [uuidA] },
            cookies: { token },
        });

        expect(res.statusCode).toBe(204);
    });

    it('it successfully delete the whole subtree', async () => {
        const {userId, uuidA, idA, idB, idC} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const res = await app.inject({
            method: "DELETE",
            url: "/items",
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
        const {userId, uuidA, idA, idB, idC, idZ} = await seed();
        const app = await buildApp();
        const token = app.jwt.sign({id: userId})
        const res = await app.inject({
            method: "DELETE",
            url: "/items",
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
            url: "/items",
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
            url: "/items",
            payload: { ids: [uuidA] },
            cookies: { },
        });

        expect(res.statusCode).toBe(401);
    });

});