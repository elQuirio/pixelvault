import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/db.js";
import { sql, inArray, eq } from "drizzle-orm";
import { seed } from "./helpers.js";
import { buildApp } from '../src/index.js';
import { items } from "../src/schema.js";


beforeEach(async () => {
  await db.execute(sql`truncate table items, users restart identity cascade`);
});



describe('POST /auth/register', () => {
  it('returns 403 when registration is not allowed', async () => {
    process.env.ALLOW_REGISTRATION='false';
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/register",
            payload: {name: 'testName', email: 'testemail@email.com', password: 'testPassword'}
        });
    expect(resp.statusCode).toBe(403);
  });

  it('returns 400 when username is missing', async () => {
    process.env.ALLOW_REGISTRATION='true';
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/register",
            payload: {name: '', email: 'testemail@email.com', password: 'testPassword'}
        });
    expect(resp.statusCode).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    process.env.ALLOW_REGISTRATION='true';
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/register",
            payload: {name: 'testName', email: 'testemail@email.com', password: ''}
        });
    expect(resp.statusCode).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    process.env.ALLOW_REGISTRATION='true';
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/register",
            payload: {name: 'testName', email: '', password: 'testPassword'}
        });
    expect(resp.statusCode).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    process.env.ALLOW_REGISTRATION='true';
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/register",
            payload: {name: 'testName', email: 'testemail@email.com', password: '123456'}
        });
    expect(resp.statusCode).toBe(400);
  });

  it('returns 409 when username is taken', async () => {
    process.env.ALLOW_REGISTRATION='true';
    const {userName} = await seed();
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/register",
            payload: {name: userName, email: 'testemail@email.com', password: 'testPassword'}
        });
    expect(resp.statusCode).toBe(409);
  });

  it('returns 201 when registration is allowed', async () => {
    process.env.ALLOW_REGISTRATION='true';
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/register",
            payload: {name: 'testName', email: 'testemail@email.com', password: 'testPassword'}
        });
    expect(resp.statusCode).toBe(201);
  });

})



describe('POST /auth/login', () => {
  it('it returns 400 when user is missing', async () => {

    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {name: '', password: 'testPassword'}
        });
    expect(resp.statusCode).toBe(400);
  });

  it('it returns 400 when password is missing', async () => {

    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {name: 'fakeName', password: ''}
        });
    expect(resp.statusCode).toBe(400);
  });

  it('it returns 401 when user does not exist', async () => {
    await seed();
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {name: 'fakeUser', password: 'wrongPassword'}
        });
    expect(resp.statusCode).toBe(401);
  });

  it('it returns 401 when user password is wrong', async () => {
    const {userName} = await seed();
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {name: userName, password: 'wrongPassword'}
        });
    expect(resp.statusCode).toBe(401);
  });

  it('it returns 200 when user and password are correct', async () => {
    const {userName, userPassword} = await seed();
    const app = await buildApp();
    const resp = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {name: userName, password: userPassword}
        });
    expect(resp.statusCode).toBe(200);
    const tokenCookie = resp.cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie?.httpOnly).toBe(true);
  });

})


describe('GET /auth/me', () => {
  it('it returns 401 when not authenticated', async () => {
    const app = await buildApp();
    const resp = await app.inject({
            method: "GET",
            url: "/auth/me",
        });
    expect(resp.statusCode).toBe(401);
  })

  it('it returns 200 when authenticated', async () => {
    const {userId} = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId});
    const resp = await app.inject({
            method: "GET",
            url: "/auth/me",
            cookies: {token}
        });
    expect(resp.statusCode).toBe(200);
    const jsonResp = resp.json();
    expect(jsonResp.data.id).toBe(userId);
  })


  it('it returns 401 when token is expired', async () => {
    const {userId} = await seed();
    const app = await buildApp();
    const token = app.jwt.sign({id: userId}, {expiresIn: '1m',  clockTimestamp: Date.now() - 5*60*1000});
    const resp = await app.inject({
            method: "GET",
            url: "/auth/me",
            cookies: {token}
        });
    expect(resp.statusCode).toBe(401);
  })

})