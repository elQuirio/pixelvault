import { describe, it, expect, beforeEach, onTestFinished } from "vitest";
import { db } from "../src/db.js";
import { sql, inArray, eq } from "drizzle-orm";
import { seed } from "./helpers.js";
import { buildApp } from '../src/index.js';
import { items } from "../src/schema.js";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { safeUnlink } from "../src/utility.js";
import { join } from "node:path";
import { createUser } from "./helpers.js";

beforeEach(async () => {
  await db.execute(sql`truncate table items, users restart identity cascade`);
});


describe('GET /api/items', () => {
  it('it returns 404 when parentId is not uuid', async () => {
    const {userId} = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items?parentId=123456`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);
  });

  it('it returns 404 when parentId is uuid but does not exist', async () => {
    const parentId = randomUUID();
    const {userId} = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items?parentId=${parentId}`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);

  });

  it('returns direct children of a folder', async () => {
    const {userId, uuidB, uuidA } = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items?parentId=${uuidA}`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(200);
    const jsonResp = resp.json();
    expect(jsonResp.data.items).toHaveLength(1);
    expect(jsonResp.data.items[0].id).toBe(uuidB);
  });
})




describe('GET /api/items/:id/original', () => {
  it('it returns 401 when user is not authenticated', async () => {
    const app = await buildApp();
    const resp = await app.inject({
            method: "GET",
            url: "/api/items/123abc/original",
        });
    expect(resp.statusCode).toBe(401);
  });


  it('it returns 404 when item type is a folder', async () => {
    const {userId, uuidA } = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/${uuidA}/original`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);
  });

  it('it returns 404 when itemId is not a valid uuid', async () => {
    const {userId} = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/abcdefg/original`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);
  });

  it('returns a 404 when item is not found', async () => {
    const itemId = randomUUID();
    const {userId} = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/${itemId}/original`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);

  });


  it('it returns a 404 when other user content is requested', async () => {
    const app = await buildApp();
    const {userId} = await createUser({});
    const {uuidC} = await seed();
    const token = app.jwt.sign({id: userId});
    const dir = join(process.env.STORAGE_DIR!, 'uploads', 'originals');
    const filePath = join(dir, `${uuidC}.jpeg`);
    await writeFile(filePath, 'contenuto di prova');
    onTestFinished(() => safeUnlink(filePath));
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/${uuidC}/original`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);
  });


  it('it returns correct file content', async () => {
    const {userId, uuidC } = await seed();
    const app = await buildApp();
    const dir = join(process.env.STORAGE_DIR!, 'uploads', 'originals');
    const filePath = join(dir, `${uuidC}.jpeg`);
    await writeFile(filePath, 'contenuto di prova');
    onTestFinished(() => safeUnlink(filePath));
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/${uuidC}/original`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toBe('contenuto di prova');
  });

});



describe('GET /api/items/:id/thumbnail', () => {
  it('it returns 401 when user is not authenticated', async () => {

    const app = await buildApp();
    const resp = await app.inject({
            method: "GET",
            url: "/api/items/123abc/thumbnail",
        });
    expect(resp.statusCode).toBe(401);
  });


  it('it returns 404 when item type is not video or image', async () => {
    const {userId, uuidA } = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/${uuidA}/thumbnail`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);
  });

  it('it returns 404 when itemId is not a valid uuid', async () => {
    const {userId} = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/abcdefg/thumbnail`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);
  });

  it('returns a 404 when item is not found', async () => {
    const itemId = randomUUID();
    const {userId} = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/${itemId}/thumbnail`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);

  });

  it('it returns a 404 when other user content is requested', async () => {
    const app = await buildApp();
    const {userId} = await createUser({});
    const {uuidC} = await seed();
    const token = app.jwt.sign({id: userId});
    const dir = join(process.env.STORAGE_DIR!, 'uploads', 'thumbnails');
    const filePath = join(dir, `${uuidC}.webp`);
    await writeFile(filePath, 'contenuto di prova');
    onTestFinished(() => safeUnlink(filePath));
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/${uuidC}/thumbnail`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(404);
  });

  it('it returns correct file content', async () => {
    const app = await buildApp();
    const {userId, uuidC } = await seed();
    const dir = join(process.env.STORAGE_DIR!, 'uploads', 'thumbnails');
    const filePath = join(dir, `${uuidC}.webp`);
    await writeFile(filePath, 'contenuto di prova');
    onTestFinished(() => safeUnlink(filePath));
    const token = app.jwt.sign({id: userId})
    const resp = await app.inject({
      method: "GET",
      url: `/api/items/${uuidC}/thumbnail`,
      cookies: { token }
    });
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toBe('contenuto di prova');
  });

})