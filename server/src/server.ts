import { buildApp } from "./index.js";
import { db } from "./db.js";


const start = async () => {
  try {
    await db.execute("select 1");
    const app = await buildApp();
    app.log.info("db connected");
    await app.listen({ port: 3000, host: process.env.HOST ?? '127.0.0.1' });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

void start();