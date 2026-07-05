import { useState, useEffect } from "react";
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { getTrash } from "../../api/upload.ts";
import type { Item } from "../..//api/upload.ts";
import { permanentDelete, permanentDeleteBulk, restoreItem, restoreItemsBulk } from "../../api/upload.ts";

type TrashProps = {
  getSpaceUsed: () => void;
}

export function Trash({getSpaceUsed}: TrashProps) {
  const [files, setFiles] = useState<Item[]>([]);
  const [sortBy, setSortBy] = useState("creationDateDesc");

  useEffect(() => {
    getTrash(sortBy).then((res) => {
      setFiles(res.data.items);
    });
  }, [sortBy]);

  async function handlePermanentDelete(id: string) {
    await permanentDelete(id);
    setFiles(files.filter((f) => f.id !== id));
    getSpaceUsed();
  }

  async function handlePermanentDeleteBulk(ids: string[]) {
    await permanentDeleteBulk(ids);
    setFiles(files.filter((f) => !ids.includes(f.id)));
    getSpaceUsed();
  }

  async function handleRestore(id: string) {
    await restoreItem(id);
    setFiles(files.filter((f) => f.id !== id));
  }

  async function handleBulkRestore(ids: string[]) {
    await restoreItemsBulk(ids);
    setFiles(files.filter((f) => !ids.includes(f.id)));
  }

  return (
    <>
      <ItemGrid
        files={files}
        handleDeleteItem={handlePermanentDelete}
        handleDeleteBulkClick={handlePermanentDeleteBulk}
        handleRestore={handleRestore}
        handleBulkRestore={handleBulkRestore}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </>
  );
}
