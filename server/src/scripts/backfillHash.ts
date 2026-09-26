import "dotenv/config";
import { db } from "../db.js";
import { items } from "../schema.js";
import { eq, asc, and, isNull, gt, not } from "drizzle-orm";
import { hashItem } from "../utility.js";
import { join } from "node:path";

const STORAGE_DIR = process.env.STORAGE_DIR;
if (!STORAGE_DIR) {
throw new Error('Missing mandatory storage dir!');
}
const ORIGINAL_DIR = join(STORAGE_DIR, "uploads", "originals");


async function backfillHash() {
    let lastId:number = 0;
    let count = 0;
    let loop = 0;
    let failed = 0;

    const itemsToUpdate = await db.$count(items, and(isNull(items.itemHash), not(eq(items.itemType, 'folder'))));
    const totalLoops = Math.ceil(itemsToUpdate/100)

    while (true) {
        loop ++;
        count = 0;
        const batch = await db.select({ id: items.id, fileUuid: items.fileUuid, ext: items.ext }).from(items).where(and(isNull(items.itemHash), gt(items.id, lastId), not(eq(items.itemType, 'folder')))).orderBy(asc(items.id)).limit(100);
        if (batch.length === 0) break;

        for (const item of batch) {
            count++;
            try {
                const filepath = join(ORIGINAL_DIR, `${item.fileUuid}.${item.ext}`);
                const itemHash = await hashItem(filepath);
                await db.update(items).set({itemHash}).where(eq(items.id, item.id));
                console.log(`batch: ${loop}/${totalLoops} - Item: ${count}/${batch.length} - Updated: ${item.fileUuid}.${item.ext}`);
            } catch (err) {
                console.log(err);
                console.log(`batch: ${loop}/${totalLoops} - Item: ${count}/${batch.length} - ERROR: ${item.fileUuid}.${item.ext}`);
                failed++;
                continue;
            }
        }
        lastId = batch[batch.length-1].id;
    }

    console.log(`${itemsToUpdate-failed} items updated - ${failed} items failed`);
    return ;
}

await backfillHash();
await db.$client.end();