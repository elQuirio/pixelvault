import { API_BASE } from "../config/api";
import type { Tag } from '../types/types.ts';
import {  throwIfNotOk } from './apiHelpers.ts';

export async function getItemTags({itemId}: {itemId: string}) {

    const res = await fetch(`${API_BASE}/items/${itemId}/tags`, {
        method: "GET",
        credentials: "include",
    });

    await throwIfNotOk(res, 'Error fetching tags');

    const { data } = await res.json() as { data: { tags: Tag[] }};

    return data.tags;
}


export async function addItemTag({itemId, tagName}: {itemId: string, tagName: string}) {

    const res = await fetch(`${API_BASE}/items/${itemId}/tags`, {
        method: "POST",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({name: tagName}),
    });

    await throwIfNotOk(res, 'Error saving tag');

    const { data } = await res.json() as { data: { tag: Tag }};

    return data.tag;
}


export async function removeItemTag({itemId, tagId}: {itemId: string, tagId: string}) {
    const res = await fetch(`${API_BASE}/items/${itemId}/tags/${tagId}`, {
        method: "DELETE",
        credentials: "include",
    });

    await throwIfNotOk(res, 'Error deleting tag');

    return;
}