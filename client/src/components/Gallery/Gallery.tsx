import { useState, useEffect } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { PhotoGrid } from "../PhotoGrid/PhotoGrid.tsx";
import { getPhotos } from "../../api/upload.ts";
import type { Photo } from "../..//api/upload.ts";
import { deletePhoto, deletePhotosBulk } from "../../api/upload.ts";
import { uploadOne } from "../..//api/upload.ts";
import { Gauge } from "../Gauge/Gauge.tsx";

type GalleryProps = {
  getSpaceUsed: () => void;
}

export function Gallery({getSpaceUsed}: GalleryProps) {
  const [files, setFiles] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("creationDateDesc");

  useEffect(() => {
    getPhotos(sortBy).then((res) => {
      setFiles(res.data.photos);
    });
  }, [sortBy]);

  async function handleUploadFiles(newFiles: File[]) {
    setTotal(newFiles.length);
    setDone(0);
    setIsUploading(true);
    try {

      const promises = newFiles.map((f) => {
        return uploadOne(f).then((c) => {
          setDone(p => p+1);
          return c;
        })
      });

      await Promise.allSettled(promises);
      const res = await getPhotos(sortBy);
      setFiles(res.data.photos);
      getSpaceUsed();
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
      {isUploading && <p className="status">Uploading...{done}/{total}</p>}
      {isUploading && <Gauge done={done} total={total}/>}
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
