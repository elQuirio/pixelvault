import { useState } from "react";
import type { Item } from "../types/types.ts";
import { getSemanticSearch } from "../api/upload.ts";
import { useToast } from "../context/useToast.tsx";

export function useSearch(items: Item[]) {
    const [query, setQuery] = useState('');
    const [semanticResults, setSemanticResults] = useState<Item[] | null>(null);
    const [searchedQuery, setSearchedQuery] = useState('');
    const [isSemanticLoading, setIsSemanticLoading] = useState(false);
    const { showToast } = useToast();
    

    const clientFiltered = items.filter((f) => f.visibleName.toLowerCase().includes(query.toLowerCase()));

    async function runSemanticSearch() {
        try {
            if (!query.trim() || isSemanticLoading) return;
            setIsSemanticLoading(true);
            const resp = await getSemanticSearch({query});
            setSemanticResults(resp.items);
            setSearchedQuery(query);
        }
        catch (err) {
            console.error(err);
            showToast('Error searching items', 'error');
            setSemanticResults(null);
        }
        finally {
            setIsSemanticLoading(false);
        }
    }

    function updateQuery(value: string) {
        setQuery(value);
        setSemanticResults(null);
    }

    const isSemantic = query === searchedQuery && semanticResults !== null;
    const itemMap = new Map(items.map((i) => [i.id, i ]));
    const filtered = isSemantic ? semanticResults.map((s) => itemMap.get(s.id)).filter((i) => i !== undefined) : clientFiltered;

    return {query, setQuery: updateQuery, filtered, runSemanticSearch, isSemantic, isSemanticLoading};
}