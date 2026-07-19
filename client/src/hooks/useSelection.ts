import { useState } from "react";

export function useSelection() {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);


  const toggleSelectMode = () => {
    setIsSelectMode((prev: boolean) => !prev);
  };


  const handleCheckboxOnChange = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev.filter((i) => i !== id)]);
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  return { isSelectMode, setIsSelectMode, selectedIds, setSelectedIds, toggleSelectMode, handleCheckboxOnChange};
}