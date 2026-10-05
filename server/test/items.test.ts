import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/db.js";
import { sql, inArray, eq } from "drizzle-orm";
import { seed } from "./helpers.js";
import { buildApp } from '../src/index.js';
import { items } from "../src/schema.js";


beforeEach(async () => {
  await db.execute(sql`truncate table items, users restart identity cascade`);
});



describe('GET /items/:id/original', () => {
  it('it returns 429 when user is not authenticated', async () => {

    const app = await buildApp();
    const resp = await app.inject({
            method: "GET",
            url: "/items/123abc/original",
        });
    expect(resp.statusCode).toBe(401);
  })

})