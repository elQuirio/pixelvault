import { useState, useEffect } from "react";
import type { ItemType, Item } from "../types/types.ts";
import { getItems } from "../api/upload.ts";
import { useToast } from "../context/useToast.tsx";

type useItemsProps = {
  parentId?: string;
  deleted?: boolean;
  type?: ItemType[];
};

export function useItems({ parentId, deleted, type }: useItemsProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [sortBy, setSortBy] = useState("creationDateDesc");
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(null);
  const { showToast } = useToast();

  function loadItems() {
    getItems({ sortBy, parentId, deleted, type }).then((res) => {
      setItems(res.data.items);
      setLoadedFor(parentId);
    }).catch((err) => {
      console.error(err);
      showToast('Error loading files', 'error');
    })
  }

  useEffect(() => {
    loadItems();
  }, [sortBy, parentId, deleted, type?.join(',')]);

  const removeItems = (ids: string[]) => {
    setItems((prev) => prev.filter((f) => !ids.includes(f.id)));
  }

  const patchItem = (id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((f) => f.id === id ? {...f, ...patch} : f ));
  }

  const loading = loadedFor !== parentId;

  return {
    items,
    sortBy,
    setSortBy,
    type,
    removeItems,
    reload: loadItems,
    patchItem,
    loading
  };
}
