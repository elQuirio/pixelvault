import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import staticPlugin from "@fastify/static";
import { unlink } from "node:fs/promises";
import sharp from "sharp";

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

await app.register(cors, { origin: "http://localhost:5173", methods: '*' });

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

app.get("/health", async () => {
  return { status: "ok" };
});

app.get("/photos", async (req) => {
  const files = await readdir(ORIGINAL_DIR);
  return {
    photos: files
      .filter((fName) => !fName.startsWith("."))
      .map((f) => ({
        id: f,
        url: `/uploads/originals/${f}`,
        thumbnail: `/uploads/thumbnails/${f.split(".")[0]}.webp`,
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
    const id = randomUUID();
    const ext = part.filename.split(".").pop() ?? "bin";
    const filepath = join(ORIGINAL_DIR, `${id}.${ext}`);

    const buffer = await part.toBuffer();
    await writeFile(filepath, buffer);
    await sharp(buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(join(THUMBNAIL_DIR, `${id}.webp`));

    saved.push({
      id: `${id}.${ext}`,
      originalName: part.filename,
      size: buffer.length,
      url: `/uploads/originals/${id}.${ext}`,
      thumbnail: `/uploads/thumbnails/${id}.webp`,
    });
  }

  return { uploaded: saved };
});



app.delete('/photos/:id', async (req, reply) => {
  const { id } = req.params as {id: string};

  if (!id) {
    return reply.code(400).send();
  }

  try {
    //original
    await unlink(join(ORIGINAL_DIR, id));
    //thumbnail
    await unlink(join(THUMBNAIL_DIR, `${id.split('.')[0]}.webp`));
    return reply.code(204).send();
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return reply.code(404).send( {message: 'Resource not found'} );
    } else {
      return reply.code(500).send( {message: 'Internal server error'} );
    }
  }
});

//////////////////////////////////////////////////////////////////

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
