import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads");
await mkdir(UPLOAD_DIR, { recursive: true });

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

await app.register(cors, { origin: "http://localhost:5173/" });

await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, //50MB
    files: 20,
  },
});

/////////////////////////////////////////////////////////////////////////////

app.get("/health", async () => {
  return { status: "ok" };
});

app.post("/upload", async (req) => {
  const parts = req.files();
  const saved: { id: string; originalName: string; size: number }[] = [];

  for await (const part of parts) {
    const id = randomUUID();
    const ext = part.filename.split(".").pop() ?? "bin";
    const filepath = join(UPLOAD_DIR, `${id}.${ext}`);

    const buffer = await part.toBuffer();
    await writeFile(filepath, buffer);

    saved.push({
      id,
      originalName: part.filename,
      size: buffer.length,
    });
  }

  return { uploaded: saved };
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
