import { useState, useEffect } from "react";
import { useToast } from "../context/useToast.tsx";
import { getTags } from "../api/tags.ts";
import type { Tag } from "../types/types.ts";


export function useUserTags() {
    const [userTags, setUserTags] = useState<Tag[] | null>(null);

    const { showToast } = useToast();

    function loadUserTags() {
        getTags().then((res) => {
            setUserTags(res)
        }).catch((err) => {
            console.error(err);
            showToast('Error loading user tags', 'error');
        })

    }

    useEffect(() => {
        loadUserTags();
    }, []);


    return { userTags, reloadUserTags: loadUserTags };
}
