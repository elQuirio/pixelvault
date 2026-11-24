import { db } from "../src/db.js";
import { items, users, tags, itemTags } from "../src/schema.js";
import argon2 from "argon2";

export async function seed() {
    const [user] = await db.insert(users).values({ name: "test", email: "test@test.com", passwordHash: await argon2.hash('testPassword') }).returning({ id: users.id, name: users.name});
    const [folderA] = await db.insert(items).values({visibleName: 'folderA', originalName:'folderA', userId: user.id, parentId: null, itemType: 'folder'}).returning({id: items.id, uuid: items.fileUuid});
    const [folderB] = await db.insert(items).values({visibleName: 'folderB', originalName:'folderB', userId: user.id, parentId: folderA.id, itemType: 'folder'}).returning({id: items.id, uuid: items.fileUuid});
    const [fileC] = await db.insert(items).values({visibleName: 'fileC', originalName:'fileC', userId: user.id, parentId: folderB.id, itemType: 'image', ext: 'jpeg'}).returning({id: items.id, uuid: items.fileUuid});
    const [folderZ] = await db.insert(items).values({visibleName: 'folderZ', originalName:'folderZ', userId: user.id, parentId: null, itemType: 'folder'}).returning({id: items.id});

    return {userId: user.id, userName: user.name, userPassword: 'testPassword', idA: folderA.id, uuidA: folderA.uuid, idB: folderB.id, uuidB: folderB.uuid, idC: fileC.id, uuidC: fileC.uuid, idZ: folderZ.id};
}

export async function createUser({name, email, password}: {name?: string, email?: string, password?: string}) {
    const [user] = await db.insert(users).values({ name: name ?? "randomUser", email: email ?? "randomEmail@test.com", passwordHash: await argon2.hash(password ?? 'randomPassword') }).returning({ id: users.id, name: users.name});
    
    return {userId: user.id, userName: user.name, userPassword: password ?? 'randomPassword'};
}

export async function createItem({userId, fileName}: {userId: number, fileName: string}) {
    const [item] = await db.insert(items).values({visibleName: fileName, originalName: fileName, userId, itemType: 'image', ext: 'jpeg'}).returning({ itemUuid: items.fileUuid, itemId: items.id });
    return {itemUuid: item.itemUuid, itemId: item.itemId};
}

export async function createTag({userId, itemId, tagName}: {userId: number, itemId?: number, tagName: string }) {
    const [tag] = await db.insert(tags).values({ userId: userId, tagName: tagName }).returning({ tagUuid: tags.tagUuid, tagId: tags.id, tagName: tags.tagName });
    if (itemId) {
        const [itemTag] = await db.insert(itemTags).values({ tagId: tag.tagId, itemId: itemId}).returning({ itemTagId: itemTags.id });
        return {tagId: tag.tagId, tagUuid: tag.tagUuid, tagName: tag.tagName, itemTagId: itemTag.itemTagId};
    }
    return {tagId: tag.tagId, tagUuid: tag.tagUuid, tagName: tag.tagName};
}

export async function linkTag({tagId, itemId}: {tagId: number, itemId: number}) {
    const [itemTag] = await db.insert(itemTags).values({ tagId, itemId }).returning({ itemTagId: itemTags.id });
    return { itemTagId: itemTag.itemTagId };
}