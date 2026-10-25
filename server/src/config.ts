import "dotenv/config";
import { join } from "node:path";

const STORAGE_DIR = process.env.STORAGE_DIR;
if (!STORAGE_DIR) {
    throw new Error('Missing mandatory storage dir!');
}

export const UPLOAD_DIR = join(STORAGE_DIR, "uploads");
export const ORIGINAL_DIR = join(UPLOAD_DIR, "originals");
export const THUMBNAIL_DIR = join(UPLOAD_DIR, "thumbnails");