import { describe, it, expect, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../src/db.js";
import { collectSubtree } from "../src/utility.js";
import { seed } from "./helpers.js";


beforeEach(async () => {
  await db.execute(sql`truncate table items, users restart identity cascade`);
});


describe('collectSubtree', () => {

    it('it contains all children items and only them', async () => {
        const {userId, idA, idB, idC} = await seed();
        const result = await collectSubtree({ rootId: idA, userId});
        expect(new Set(result)).toEqual(new Set([idA, idB, idC]));
    });

    it('it does not contains items not in children list', async () => {
        const {userId, idA, idZ} = await seed();
        const result = await collectSubtree({ rootId: idA, userId});
        expect(result).not.toContain(idZ);
    })
}
)