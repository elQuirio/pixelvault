import { db } from "../src/db.js";
import { items, users } from "../src/schema.js";

export async function seed() {
    const [user] = await db.insert(users).values({ name: "test", email: "test@test.com", passwordHash: "x" }).returning({ id: users.id });
    const [folderA] = await db.insert(items).values({visibleName: 'folderA', originalName:'folderA', userId: user.id, parentId: null, itemType: 'folder'}).returning({id: items.id, uuid: items.fileUuid});
    const [folderB] = await db.insert(items).values({visibleName: 'folderB', originalName:'folderB', userId: user.id, parentId: folderA.id, itemType: 'folder'}).returning({id: items.id});
    const [fileC] = await db.insert(items).values({visibleName: 'fileC', originalName:'fileC', userId: user.id, parentId: folderB.id, itemType: 'file'}).returning({id: items.id});
    const [folderZ] = await db.insert(items).values({visibleName: 'folderZ', originalName:'folderZ', userId: user.id, parentId: null, itemType: 'folder'}).returning({id: items.id});

    return {userId: user.id, idA: folderA.id, uuidA: folderA.uuid, idB: folderB.id, idC: fileC.id, idZ: folderZ.id};
}