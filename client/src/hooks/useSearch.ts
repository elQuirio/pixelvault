import { useState } from "react";
import type { Item, Tag } from "../types/types.ts";
import { getSemanticSearch } from "../api/search.ts";
import { useToast } from "../context/useToast.tsx";

export function useSearch(items: Item[]) {
    const [query, setQuery] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [semanticResults, setSemanticResults] = useState<Item[] | null>(null);
    const [searchedQuery, setSearchedQuery] = useState('');
    const [searchedTags, setSearchedTags] = useState<Tag[]>([]);
    const [isSemanticLoading, setIsSemanticLoading] = useState(false);
    const { showToast } = useToast();

    const clientFiltered = items.filter((f) => f.visibleName.toLowerCase().includes(query.toLowerCase()));
    const tagList = tags.map((t) => t.tagId);

    async function runSemanticSearch({searchQuery = query, searchTags = tags} : {searchQuery?: string, searchTags?: Tag[]} = {}) {
        try {
            if ((!searchQuery.trim() && searchTags.length === 0) || isSemanticLoading) return;
            const tagIds = searchTags.map((t) => t.tagId);
            setIsSemanticLoading(true);
            const resp = await getSemanticSearch({query: searchQuery, tags: tagIds});
            setSemanticResults(resp.items);
            setSearchedQuery(searchQuery);
            setSearchedTags(searchTags);
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

    function addSearchTag(tag: Tag) {
        if (tagList.includes(tag.tagId)) {
            setQuery('');
            return;
        }
        const nextTags = [...tags, tag];
        setTags(nextTags);
        setQuery('');
        setSemanticResults(null);
        runSemanticSearch({searchQuery: '', searchTags: nextTags});
    }

    function removeSearchTag(tag: Tag) {
        const nextTags = tags.filter((t) => t.tagId !== tag.tagId);
        setTags(nextTags);
        setSemanticResults(null);
        runSemanticSearch({searchQuery: query, searchTags: nextTags});
    }

    function clearSearch() {
        setTags([]);
        setQuery('');
        setSemanticResults(null);
    }

    const isSemantic = query === searchedQuery && tags === searchedTags && semanticResults !== null;
    const itemMap = new Map(items.map((i) => [i.id, i ]));
    const filtered = isSemantic ? semanticResults.map((s) => itemMap.get(s.id)).filter((i) => i !== undefined) : clientFiltered;

    return {query, setQuery: updateQuery, filtered, runSemanticSearch, isSemantic, isSemanticLoading, tags, addSearchTag, removeSearchTag, clearSearch};
}