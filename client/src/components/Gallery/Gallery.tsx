import { useState, useEffect } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { PhotoGrid } from "../PhotoGrid/PhotoGrid.tsx";
import { uploadFiles, getPhotos } from "../../api/upload.ts";
import type { Photo } from "../..//api/upload.ts";
import { deletePhoto, deletePhotosBulk } from "../../api/upload.ts";

export function Gallery() {
  const [files, setFiles] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sortBy, setSortBy] = useState("creationDateDesc");

  useEffect(() => {
    getPhotos(sortBy).then((res) => {
      setFiles(res.data.photos);
    });
  }, [sortBy]);

  async function handleUploadFiles(newFiles: File[]) {
    setIsUploading(true);
    try {
      await uploadFiles(newFiles);
      const res = await getPhotos(sortBy);
      setFiles(res.data.photos);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeletePhoto(id: string) {
    await deletePhoto(id);
    setFiles(files.filter((f) => f.id !== id));
  }

  async function handleDeleteBulkClick(ids: string[]) {
    await deletePhotosBulk(ids);
    setFiles(files.filter((f) => !ids.includes(f.id)));
  }

  return (
    <>
      <UploadArea onFilesSelected={handleUploadFiles} />
      {isUploading && <p className="status">Uploading...</p>}
      <PhotoGrid
        files={files}
        handleDeletePhoto={handleDeletePhoto}
        handleDeleteBulkClick={handleDeleteBulkClick}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </>
  );
}
