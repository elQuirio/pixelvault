import { useState } from "react";
import type { Item, Tag } from "../types/types.ts";
import { getSemanticSearch } from "../api/search.ts";
import { useToast } from "../context/useToast.tsx";

export function useSearch(items: Item[]) {
    const [query, setQuery] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [taggedItems, setTaggedItems] = useState<Item[]>([]);
    const [semanticResults, setSemanticResults] = useState<Item[] | null>(null);
    const [searchedQuery, setSearchedQuery] = useState('');
    const [searchedTags, setSearchedTags] = useState<Tag[]>([]);
    const [isSemanticLoading, setIsSemanticLoading] = useState(false);
    const { showToast } = useToast();

    const itemMap = new Map(items.map((i) => [i.id, i ]));
    const baseItems = tags.length > 0 ? taggedItems.map((ti) => itemMap.get(ti.id)).filter((i) => i !== undefined) : items;
    const clientFiltered = baseItems.filter((f) => f.visibleName.toLowerCase().includes(query.toLowerCase()));
    const tagList = tags.map((t) => t.tagId);

    async function loadTaggedItems({tags} : {tags: Tag[]}) {
        if (tags.length === 0) {
            setTaggedItems([]);
            return;
        }
        try {
            const resp = await getSemanticSearch({tags: tags.map((t) => t.tagId)});
            setTaggedItems(resp.items);
        } catch (err) {
            console.error(err);
            showToast('Error loading tagged items', 'error');
        }
    }

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
        loadTaggedItems({tags:nextTags});
    }

    function removeSearchTag(tag: Tag) {
        const nextTags = tags.filter((t) => t.tagId !== tag.tagId);
        setTags(nextTags);
        setSemanticResults(null);
        loadTaggedItems({tags:nextTags});
    }

    function clearSearch() {
        setTags([]);
        setQuery('');
        setSemanticResults(null);
        setTaggedItems([]);
    }

    const isSemantic = query === searchedQuery && tags === searchedTags && semanticResults !== null;
    const filtered = isSemantic ? semanticResults.map((s) => itemMap.get(s.id)).filter((i) => i !== undefined) : clientFiltered;

    return {query, setQuery: updateQuery, filtered, runSemanticSearch, isSemantic, isSemanticLoading, tags, addSearchTag, removeSearchTag, clearSearch};
}