import type { FastifyPluginCallback } from 'fastify';
import { db } from "../db.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";
import argon2 from 'argon2';


export const authRoutes: FastifyPluginCallback = (app, _opts, done) => {

  app.post('/auth/register', {config: {rateLimit: {max: 3, timeWindow: '1 hour' }}}, async (req, reply) => {
    const { name, email, password } = req.body as {name?: string, email?: string, password?: string};
    const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION ?? 'false';

    if (ALLOW_REGISTRATION !== 'true') {
      return reply.code(403).send({message: 'Registration not allowed'});
    }

    if (!name || !email || !password) {
      return reply.code(400).send({ message: 'Missing mandatory data'});
    }

    if (password.length < 8) {
      return reply.code(400).send({ message: 'Password too short'});
    }

    const passwordHash = await argon2.hash(password, {type: argon2.argon2id});
    try {
      const [user] = await db.insert(users).values({name, email, passwordHash}).returning({id: users.id});
      return reply.status(201).send({data: {id: user.id}});
    } catch (err) {
      const e = err as {code?: string, cause?: {code?: string}};
      if (e.code === '23505' || e.cause?.code === '23505') {
        return reply.status(409).send({message: 'Username already taken'});
      }
      throw err;
    }
  })

  app.post('/auth/login', {config: {rateLimit: {max: 15, timeWindow: '1 hour' }}}, async (req, reply) => {
    const {name, password} = req.body as {name?: string, password?: string};

    if (!name || !password) {
      return reply.code(400).send({message: 'Missing mandatory data'});
    }

    const [user] = await db.select({id: users.id, passwordHash: users.passwordHash}).from(users).where(eq(users.name, name));

    if (!user) {
      return reply.code(401).send({message: 'Invalid credentials'});
    }
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      return reply.code(401).send({message: 'Invalid credentials'});
    }
    const token = app.jwt.sign({id: user.id}, {expiresIn: '3d'});
    return reply.setCookie('token', token, {httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', path: '/', maxAge: 3*24*60*60}).code(200).send({data: {id: user.id}});
  })


  app.post('/auth/logout', async (_, reply) => {
      return reply.clearCookie('token', {path: '/'}).code(200).send();
  });

  app.get('/auth/me', async (req, reply) => {
    try {
      await req.jwtVerify();
      return reply.code(200).send({data: { id: req.user.id}});
    } catch {
      return reply.code(401).send({message: 'Not authenticated'});
    }
  });

  done();
};

