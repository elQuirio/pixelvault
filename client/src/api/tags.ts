import { API_BASE } from "../config/api";
import { throwIfNotOk } from "./apiHelpers";
import type { Tag } from "../types/types";

export async function getTags() {
    const res = await fetch(`${API_BASE}/tags`, {
        method: "GET",
        credentials: "include",
    });

    await throwIfNotOk(res, 'Error fetching tags');

    const {data} = await res.json() as  { data: { tags: Tag[]} };

    return data.tags;
}