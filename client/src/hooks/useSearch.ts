import { useState } from "react";
import type { Item } from "../types/types.ts";

export function useSearch(items: Item[]) {
    const [query, setQuery] = useState('');

    const filtered = items.filter((f) => f.visibleName.toLowerCase().includes(query.toLowerCase()));

    return {query, setQuery, filtered}
}