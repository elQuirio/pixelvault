import "dotenv/config";
import { db } from "../db.js";
import { tags } from "../schema.js";
import { eq, asc, and, isNull, gt } from "drizzle-orm";
import { getEmbedding } from "../utility.js";

async function backfillTag() {
    let lastId:number = 0;
    let count = 0;
    let loop = 0;
    let failed = 0;

    const itemsToUpdate = await db.$count(tags, isNull(tags.tagVector));
    const totalLoops = Math.ceil(itemsToUpdate/100)

    while (true) {
        loop ++;
        count = 0;
        const batch = await db.select({ id: tags.id, tagUuid: tags.tagUuid, tagName: tags.tagName }).from(tags).where(and(isNull(tags.tagVector), gt(tags.id, lastId))).orderBy(asc(tags.id)).limit(100);
        if (batch.length === 0) break;

        for (const item of batch) {
            count++;

            const tagVector = await getEmbedding({type: 'text', value: item.tagName});

            if (tagVector === null) {
                console.log(`batch: ${loop}/${totalLoops} - Tag: ${count}/${batch.length} - ERROR: ${item.tagUuid}`);
                failed++;
                continue;
            }

            await db.update(tags).set({tagVector}).where(eq(tags.id, item.id));
            console.log(`batch: ${loop}/${totalLoops} - Tag: ${count}/${batch.length} - Updated: ${item.tagUuid}`);
        }
        lastId = batch[batch.length-1].id;
    }

    console.log(`${itemsToUpdate-failed} tags updated - ${failed} tags failed`);
    return ;
}

await backfillTag();
await db.$client.end();