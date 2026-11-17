import { useState, useEffect } from "react";
import { useToast } from "../context/useToast.tsx";
import { getItemTags, removeItemTag } from "../api/itemsTags.ts";
import { getTags } from "../api/tags.ts";
import { addItemTag } from "../api/itemsTags.ts";
import type { Tag } from "../types/types.ts";


export function useTags({itemId} : {itemId: string}) {
    const [itemTags, setItemTags] = useState<{tags: Tag[], loadedFor: string} | null>(null);
    const [userTags, setUserTags] = useState<Tag[] | null>(null);

    const { showToast } = useToast();

    useEffect(() => {
            let ignore = false;
            getItemTags({ itemId }).then((res) => {
                if (!ignore) setItemTags({tags: res, loadedFor: itemId});
            }).catch((err) => {
                console.error(err);
                showToast('Error loading item tags', 'error');
            });
            return () => { ignore = true; };
    }, [itemId]);


    function loadUserTags() {
        getTags().then((res) => {
            setUserTags(res)
        }).catch((err) => {
            console.error(err);
            showToast('Error loading user tags', 'error');
        })

    }

    function addTag(tagName: string) {
        addItemTag({itemId, tagName}).then((res) => setItemTags((prev) => {
            if (!prev) return {tags: [res], loadedFor: itemId};
            else if (prev.loadedFor !== itemId) return prev;
            else {
                return prev.tags.some((p) => p.tagId === res.tagId) ? prev : {tags: [...prev.tags, res], loadedFor: prev.loadedFor};
            };
        }
        )).then(() => loadUserTags())
        .catch((err)=> {
            console.error(err);
            showToast('Error adding tag', 'error');
        });
    }

    function removeTag(tagId: string) {
        removeItemTag({itemId, tagId}).then(() => setItemTags((prev) => {
            if (!prev) return prev;
            else if (prev.loadedFor !== itemId) return prev;
            else {
                return {tags: prev.tags.filter((p) => p.tagId !== tagId), loadedFor: prev.loadedFor};
            };
        }
        )).then(() => loadUserTags()).catch((err)=> {
            console.error(err);
            showToast('Error removing tag', 'error');
        });
    }

    useEffect(() => {
        loadUserTags();
    }, []);

    const visibleTags = itemTags?.loadedFor === itemId ? itemTags.tags : [];
    const loading = itemTags?.tags === null;

    return { itemTags: visibleTags, userTags, addTag, removeTag, loading };
}
