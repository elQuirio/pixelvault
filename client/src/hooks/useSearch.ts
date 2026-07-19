import { useState } from "react";
import type { Item } from "../api/upload";

export function useSearch(items: Item[]) {
    const [query, setQuery] = useState('');

    const filtered = items.filter((f) => (f.visibleName ?? f.originalName ?? '')?.toLowerCase().includes(query.toLowerCase()));

    return {query, setQuery, filtered}
}