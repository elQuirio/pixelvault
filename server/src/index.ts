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
import { photos, users } from "./schema";
import { eq, asc, desc } from "drizzle-orm";
import argon2 from 'argon2';

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

await app.register(cors, { origin: "http://localhost:5173", methods: "*" });

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

/////////////////////////////////////////////////////////////////////////////

app.get("/health", () => {
  return { status: "ok" };
});

const sortMap = {
  'creationDateDesc': desc(photos.createdAt),
  'creationDateAsc': asc(photos.createdAt),
};

type SortKey = keyof typeof sortMap;

app.get("/photos", async (req) => {
  const {sortBy} = req.query as {sortBy?: SortKey};
  const orderBy = (sortBy && sortBy in sortMap) ? sortMap[sortBy] : desc(photos.createdAt);
  const rows = (await db.select().from(photos).orderBy(orderBy));
  return {
    photos: rows.map((f) => ({
      id: f.fileUuid,
      url: `/uploads/originals/${f.fileUuid}.${f.ext}`,
      thumbnail: `/uploads/thumbnails/${f.fileUuid}.webp`,
      originalName: f.originalName,
      size: f.size,
      createdAt: f.createdAt,
    })),
  };
});

app.post("/upload", async (req) => {
  const parts = req.files();
  const saved: {
    id: string;
    originalName: string;
    size: number;
    url: string;
    thumbnail: string;
  }[] = [];

  for await (const part of parts) {
    const fileUuid = randomUUID();
    const ext = part.filename.split(".").pop() ?? "bin";
    const filepath = join(ORIGINAL_DIR, `${fileUuid}.${ext}`);
    const originalName = part.filename;

    const buffer = await part.toBuffer();
    await writeFile(filepath, buffer);
    await sharp(buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(join(THUMBNAIL_DIR, `${fileUuid}.webp`));

    await db
      .insert(photos)
      .values({ fileUuid, ext, originalName, size: buffer.length });

    saved.push({
      id: fileUuid,
      originalName,
      size: buffer.length,
      url: `/uploads/originals/${fileUuid}.${ext}`,
      thumbnail: `/uploads/thumbnails/${fileUuid}.webp`,
    });
  }

  return { uploaded: saved };
});

app.delete("/photos/:id", async (req, reply) => {
  const { id } = req.params as { id: string };

  if (!id) {
    return reply.code(400).send();
  }

  const [photo] = await db.select().from(photos).where(eq(photos.fileUuid, id));
  if (!photo) {
    return reply.code(404).send({ message: "Resource not found" });
  }
  //db
  await db.delete(photos).where(eq(photos.fileUuid, id));
  //original
  await safeUnlink(join(ORIGINAL_DIR, `${id}.${photo.ext}`));
  //thumbnail
  await safeUnlink(join(THUMBNAIL_DIR, `${id}.webp`));

  return reply.code(204).send();
});

app.delete("/photos", async (req, reply) => {
  const { ids } = req.body as { ids: string[] };

  if (!ids || ids.length === 0) {
    return reply.code(400).send();
  }

  for (const id of ids) {
    const [photo] = await db
      .select()
      .from(photos)
      .where(eq(photos.fileUuid, id));
    if (!photo) continue;
    await db.delete(photos).where(eq(photos.fileUuid, id));
    await safeUnlink(join(ORIGINAL_DIR, `${id}.${photo.ext}`));
    await safeUnlink(join(THUMBNAIL_DIR, `${id}.webp`));
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


//////////////////////////// AUTH ////////////////////////////////

app.post('/auth/register', async (req, reply) => {
  const { name, email, password } = req.body as {name?: string, email?: string, password?: string};

  if (!name || !email || !password) {
    return reply.code(400).send({ message: 'Missing mandatory data'});
  }

  const passwordHash = await argon2.hash(password, {type: argon2.argon2id});
  try {
    await db.insert(users).values({name, email, passwordHash});
  } catch (err) {
    const e = err as {code?: string, cause?: {code?: string}};
    if (e.code === '23505' || e.cause?.code === '23505') {
      return reply.status(409).send({message: 'Username already taken'});
    }
    throw err;
  }
  
  return reply.status(201).send({payload: name});
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

  return reply.code(200).send({message: 'ok'});

})


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
