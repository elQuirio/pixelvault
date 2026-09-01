import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) throw new Error('Database url is missing');

const pool = new Pool({ connectionString: DATABASE_URL });

export const db = drizzle(pool);