import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import staticPlugin from "@fastify/static";
import sharp from "sharp";
import { db } from "./db";
import { items, users } from "./schema";
import { eq, asc, desc, and, isNull, isNotNull, sum } from "drizzle-orm";
import argon2 from 'argon2';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import exifr from 'exifr';
import { fileTypeFromBuffer } from "file-type";
import convert from 'heic-convert';

const UPLOAD_DIR = join(process.cwd(), "uploads");
const ORIGINAL_DIR = join(UPLOAD_DIR, "originals");
const THUMBNAIL_DIR = join(UPLOAD_DIR, "thumbnails");
await mkdir(ORIGINAL_DIR, { recursive: true });
await mkdir(THUMBNAIL_DIR, { recursive: true });

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});


declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number };
    user: { id: number };
  }
}

await app.register(cors, { origin: "http://localhost:5173", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], credentials: true });

await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, //50MB
    files: 20,
  },
});

await app.register(staticPlugin, {
  root: UPLOAD_DIR,
  prefix: "/uploads/",
});

await app.register(cookie);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is missing')
await app.register(jwt, {secret: JWT_SECRET, cookie: {cookieName: 'token', signed: false}} );

app.decorate('authenticate', async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({message: 'Not authenticated'});
  }
} )

/////////////////////////////////////////////////////////////////////////////

app.get("/health", () => {
  return { data:{ status: "ok"} };
});

const sortMap = {
  'creationDateDesc': desc(items.createdAt),
  'creationDateAsc': asc(items.createdAt),
};

type SortKey = keyof typeof sortMap;

app.get("/items", {preHandler: [app.authenticate]},  async (req) => {
  const userId = req.user.id;
  const {sortBy} = req.query as {sortBy?: SortKey};
  const orderBy = (sortBy && sortBy in sortMap) ? sortMap[sortBy] : desc(items.createdAt);
  const rows = (await db.select().from(items).where(and(eq(items.userId, userId), isNull(items.deletedAt))).orderBy(orderBy));
  return {data: {
    items: rows.map((f) => ({
      id: f.fileUuid,
      url: `/uploads/originals/${f.fileUuid}.${f.ext}`,
      thumbnail: f.itemType === 'image' ? `/uploads/thumbnails/${f.fileUuid}.webp` : null,
      originalName: f.originalName,
      size: f.size,
      itemType: f.itemType,
      createdAt: f.createdAt,
      metadata: f.metadata,
    })),
  }};
});

app.get("/items/trash", {preHandler: [app.authenticate]},  async (req) => {
  const userId = req.user.id;
  const {sortBy} = req.query as {sortBy?: SortKey};
  const orderBy = (sortBy && sortBy in sortMap) ? sortMap[sortBy] : desc(items.createdAt);
  const rows = (await db.select().from(items).where(and(eq(items.userId, userId), isNotNull(items.deletedAt))).orderBy(orderBy));
  return {data: { 
    items: rows.map((f) => ({
      id: f.fileUuid,
      url: `/uploads/originals/${f.fileUuid}.${f.ext}`,
      thumbnail: f.itemType === 'image' ? `/uploads/thumbnails/${f.fileUuid}.webp` : null,
      originalName: f.originalName,
      size: f.size,
      itemType: f.itemType,
      createdAt: f.createdAt,
      metadata: f.metadata,
    })),
  }};
});


app.post("/upload", {preHandler: [app.authenticate]}, async (req) => {
  const userId = req.user.id;
  const parts = req.files();
  const saved: {
    id: string;
    itemType: string;
    originalName: string;
    size: number;
    url: string;
    thumbnail: string | null;
  }[] = [];

  for await (const part of parts) {
    const fileUuid = randomUUID();
    const originalName = part.filename;
    try {
      let buffer = await part.toBuffer();
      let originalBuffer = buffer;
      const buffFileType = await fileTypeFromBuffer(buffer);
      const isHeic = buffFileType?.mime === 'image/heic' || buffFileType?.mime ==='image/heif';
      const isPhoto = isHeic || buffFileType?.mime.startsWith('image/');
      const itemType = isPhoto ? 'image' : 'file';
      const ext = isHeic ? 'jpg' : (buffFileType?.ext ?? 'bin');
  
      const filepath = join(ORIGINAL_DIR, `${fileUuid}.${ext}`);

      if (isHeic) {
        buffer = Buffer.from(await convert({
          buffer: buffer,
          format: 'JPEG',
          quality: 0.9,
        }));
      }
      
      let metadata = null;

      if (isPhoto) {
        metadata = await exifr.parse(isHeic ? originalBuffer : buffer, {gps: true}) ?? null;
        await sharp(buffer)
          .resize(200, 200, { fit: "cover" })
          .webp({ quality: 80 })
          .toFile(join(THUMBNAIL_DIR, `${fileUuid}.webp`));
      }

      await writeFile(filepath, buffer);

      await db
        .insert(items)
        .values({ fileUuid, ext, originalName, visibleName: originalName, size: buffer.length, userId, metadata, itemType });

      saved.push({
        id: fileUuid,
        itemType,
        originalName,
        size: buffer.length,
        url: `/uploads/originals/${fileUuid}.${ext}`,
        thumbnail: isPhoto ? `/uploads/thumbnails/${fileUuid}.webp` : null,
      });
    } catch (err) {
      req.log.error({ err, file: part.filename }, 'skipping failed file');
      continue;
    }
  }

  return { data: {uploaded: saved }};
});


app.delete("/items/:id", {preHandler: [app.authenticate]}, async (req, reply) => {
  const { id } = req.params as { id: string };
  const userId = req.user.id;

  if (!id) {
    return reply.code(400).send();
  }

  const [item] = await db.select().from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
  if (!item) {
    return reply.code(404).send({ message: "Resource not found" });
  }
  //db
  await db.update(items).set({deletedAt: new Date()}).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));

  return reply.code(204).send();
});

app.delete("/items", {preHandler: [app.authenticate]}, async (req, reply) => {
  const { ids } = req.body as { ids: string[] };
  const userId = req.user.id;

  if (!ids || ids.length === 0) {
    return reply.code(400).send();
  }

  for (const id of ids) {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
    if (!item) continue;
    await db.update(items).set({deletedAt: new Date()}).where(and(eq(items.fileUuid, id), eq(items.userId, userId)));
  }
  return reply.code(204).send();
});

async function safeUnlink(path: string) {
  try {
    await unlink(path);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code !== "ENOENT") throw err;
  }
}

app.post('/items/:id/restore', {preHandler: [app.authenticate]}, async (req, reply)=> {
  const { id } = req.params as {id: string};

  if (!id) {
    return reply.code(400).send();
  }
  const userId = req.user.id;
  const restored = await db.update(items).set({deletedAt: null}).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt) )).returning({id: items.fileUuid});

  if (restored.length === 0) {
    return reply.code(404).send({message: 'Resource not found'});
  }

  return reply.code(200).send();
});

// restore bulk
app.post('/items/restore', {preHandler: [app.authenticate]}, async (req, reply)=> {
  const { ids } = req.body as { ids: string[] };
  const userId = req.user.id;

  if (!ids || ids.length === 0) {
    return reply.code(400).send();
  }

  for (const id of ids) {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
    if (!item) continue;
    await db.update(items).set({deletedAt: null}).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
  }
  return reply.code(200).send();

})


// perament single
app.delete('/items/:id/permanent', {preHandler: [app.authenticate]}, async (req, reply) => {
  const {id} = req.params as {id: string};

  if (!id) {
    return reply.code(400).send({message: 'Missing mandatory data'});
  }

  const userId = req.user.id;
  
  const [item] = await db.select().from(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
  if (!item) {
    return reply.code(404).send({ message: "Resource not found" });
  }
  //db
  await db.delete(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
  //original
  await safeUnlink(join(ORIGINAL_DIR, `${id}.${item.ext}`));
  //thumbnail
  await safeUnlink(join(THUMBNAIL_DIR, `${id}.webp`));

  return reply.code(204).send();
});


// perament bulk
app.delete('/items/permanent', {preHandler: [app.authenticate]}, async (req, reply) => {
  const { ids } = req.body as { ids: string[] };
  const userId = req.user.id;

  if (!ids || ids.length === 0) {
    return reply.code(400).send();
  }

  for (const id of ids) {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
    if (!item) continue;
    await db.delete(items).where(and(eq(items.fileUuid, id), eq(items.userId, userId), isNotNull(items.deletedAt)));
    await safeUnlink(join(ORIGINAL_DIR, `${id}.${item.ext}`));
    await safeUnlink(join(THUMBNAIL_DIR, `${id}.webp`));
  }
  return reply.code(204).send();

})

//////////////////////////// AUTH ////////////////////////////////

app.post('/auth/register', async (req, reply) => {
  const { name, email, password } = req.body as {name?: string, email?: string, password?: string};

  if (!name || !email || !password) {
    return reply.code(400).send({ message: 'Missing mandatory data'});
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

app.post('/auth/login', async (req, reply) => {
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
  const token = app.jwt.sign({id: user.id});
  return reply.setCookie('token', token, {httpOnly: true, sameSite: 'lax', secure: false, path: '/'}).code(200).send({data: {id: user.id}});
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




///////////////////////////// UTILS //////////////////////////////

app.get('/storage', {preHandler: [app.authenticate]}, async (req, reply) => {
  const userId = req.user.id;

  const [row] = await db.select({sizeTotal: sum(items.size)}).from(items).where(eq(items.userId, userId));

  return reply.code(200).send({data: {used: Number(row.sizeTotal ?? 0)}});
});


//////////////////////////////////////////////////////////////////

const start = async () => {
  try {
    await db.execute("select 1");
    app.log.info("db connected");
    await app.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
