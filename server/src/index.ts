import { UPLOAD_DIR, ORIGINAL_DIR, THUMBNAIL_DIR } from "./config.js";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import cors from "@fastify/cors";
import { mkdir } from "node:fs/promises";
import staticPlugin from "@fastify/static";
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { searchRoutes } from "./routes/search.js";
import { authRoutes } from "./routes/auth.js";
import { storageRoutes } from "./routes/storage.js";
import { itemsRoutes } from "./routes/items.js";


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

export async function buildApp() {

  const app = Fastify({
    trustProxy: '127.0.0.1',
    logger: {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  await mkdir(ORIGINAL_DIR, { recursive: true });
  await mkdir(THUMBNAIL_DIR, { recursive: true });


  await app.register(cors, { origin: ["http://localhost:5173", "http://192.168.1.151:5173"], methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], credentials: true });

  await app.register(multipart, {
    limits: {
      fileSize: 5000 * 1024 * 1024, //5GB
      files: 200,
    },
  });

  await app.register(staticPlugin, {
    root: UPLOAD_DIR,
    serve: false,
  });

  await app.register(cookie);
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error('JWT_SECRET is missing')
  await app.register(jwt, {secret: JWT_SECRET, cookie: {cookieName: 'token', signed: false}} );

  await app.register(rateLimit, {global: false});

  await app.register(helmet, {crossOriginResourcePolicy: { policy: 'same-site' }});

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

  await app.register(async (api) => {
    await api.register(itemsRoutes);
    await api.register(searchRoutes);
    await api.register(authRoutes);
    await api.register(storageRoutes);
  }, { prefix: '/api' });

  return app;
};

