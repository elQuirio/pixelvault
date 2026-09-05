import { useState } from "react";

export function useSelection() {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);


  const toggleSelectMode = () => {
    setIsSelectMode((prev: boolean) => !prev);
    setSelectedIds([]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? [...prev.filter((i) => i !== id)] : [...prev, id]);
  };
  
  return { isSelectMode, setIsSelectMode, selectedIds, setSelectedIds, toggleSelectMode, toggleSelection };
}