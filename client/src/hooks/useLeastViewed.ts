import { useState, useEffect } from "react";
import type { Item } from "../types/types.ts";
import { useToast } from "../context/useToast.tsx";
import { getItems } from '../api/items.ts';


export function useLeastViewed() {
  const [leastViewed, setLeastViewed] = useState<Item[] | null>(null);
  const { showToast } = useToast();

  function loadLeastViewed() {
    getItems({sortBy: 'viewsAsc', type: ['image', 'video']}).then((res) => {
      const count = Math.max(100, Math.ceil(res.data.items.length * 0.1));
      setLeastViewed(res.data.items.slice(0,count));
    }).catch((err) => {
      console.error(err);
      showToast('Error loading least viewed items', 'error');
    })
  }

  useEffect(() => {
    loadLeastViewed();
  }, []);


  const removeLeastViewed = (ids: string[]) => {
    setLeastViewed((prev) => {
        if (!prev) return prev;
        return prev.filter((f) => !ids.includes(f.id))
    });
  }

  const loading = leastViewed === null;

  return {
    leastViewed,
    loading,
    removeLeastViewed,
    reload: loadLeastViewed,
  };
}
