import { useState, useEffect } from "react";
import type { DuplicateGroup } from "../types/types.ts";
import { useToast } from "../context/useToast.tsx";
import { getDuplicates } from '../api/upload.ts';


export function useDuplicates() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[] | null>(null);
  const { showToast } = useToast();

  function loadDuplicates() {
    getDuplicates().then((res) => {
      setDuplicates(res.data.groups);
    }).catch((err) => {
      console.error(err);
      showToast('Error loading duplicates', 'error');
    })
  }

  useEffect(() => {
    loadDuplicates();
  }, []);


  const removeDuplicates = (ids: string[]) => {
    setDuplicates((prev) => {
      if (!prev) return prev;
      return prev.map(({hash, items}) => ({hash, items: items.filter((i) => !ids.includes(i.id)) })).filter((p) => p.items.length>1)});
  }

  const loading = duplicates === null;

  return {
    duplicates,
    loading,
    removeDuplicates,
    reload: loadDuplicates,
  };
}
