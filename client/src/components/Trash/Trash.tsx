import { useState, useEffect } from "react";
import { PhotoGrid } from "../PhotoGrid/PhotoGrid.tsx";
import { getTrash } from "../../api/upload.ts";
import type { Photo } from "../..//api/upload.ts";
import { permanentDelete, permanentDeleteBulk, restorePhoto, restorePhotoBulk } from "../../api/upload.ts";

export function Trash() {
  const [files, setFiles] = useState<Photo[]>([]);
  const [sortBy, setSortBy] = useState("creationDateDesc");

  useEffect(() => {
    getTrash(sortBy).then((res) => {
      setFiles(res.data.photos);
    });
  }, [sortBy]);

  async function handlePermanentDelete(id: string) {
    await permanentDelete(id);
    setFiles(files.filter((f) => f.id !== id));
  }

  async function handlePermanentDeleteBulk(ids: string[]) {
    await permanentDeleteBulk(ids);
    setFiles(files.filter((f) => !ids.includes(f.id)));
  }

  async function handleRestore(id: string) {
    await restorePhoto(id);
    setFiles(files.filter((f) => f.id !== id));
  }

  async function handleBulkRestore(ids: string[]) {
    await restorePhotoBulk(ids);
    setFiles(files.filter((f) => !ids.includes(f.id)));
  }

  return (
    <>
      <PhotoGrid
        files={files}
        handleDeletePhoto={handlePermanentDelete}
        handleDeleteBulkClick={handlePermanentDeleteBulk}
        handleRestore={handleRestore}
        handleBulkRestore={handleBulkRestore}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </>
  );
}
