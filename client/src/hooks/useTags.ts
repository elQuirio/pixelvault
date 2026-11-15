import { useState, useEffect } from "react";
import { useToast } from "../context/useToast.tsx";
import { getItemTags, removeItemTag } from "../api/itemsTags.ts";
import { getTags } from "../api/tags.ts";
import { addItemTag } from "../api/itemsTags.ts";
import type { Tag } from "../types/types.ts";


export function useTags({itemId} : {itemId: string}) {
    const [itemTags, setItemTags] = useState<Tag[] | null>(null);
    const [userTags, setUserTags] = useState<Tag[] | null>(null);

    const { showToast } = useToast();

    useEffect(() => {
        let ignore = false;
        getItemTags({ itemId }).then((res) => {
            if (!ignore) setItemTags(res);
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
            if (!prev) return [res];
            else return prev.some((p) => p.tagId === res.tagId) ? prev : [...prev, res];
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
            else return prev.filter((p) => p.tagId !== tagId);
        }
        )).catch((err)=> {
            console.error(err);
            showToast('Error removing tag', 'error');
        });
    }

    useEffect(() => {
        loadUserTags();
    }, []);


  const loading = itemTags === null;

  return { itemTags, userTags, addTag, removeTag, loading };
}
