import { useState, useEffect } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { getItems } from "../../api/upload.ts";
import type { Item } from "../..//api/upload.ts";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
import { uploadOne } from "../..//api/upload.ts";
import { Gauge } from "../Gauge/Gauge.tsx";
import styles from './Gallery.module.css';

type GalleryProps = {
  getSpaceUsed: () => void;
}

export function Gallery({getSpaceUsed}: GalleryProps) {
  const [files, setFiles] = useState<Item[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("creationDateDesc");
  const [search, setSearch] = useState('');

  const filtered = files.filter((f) => f.originalName?.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    getItems({sortBy}).then((res) => {
      setFiles(res.data.items);
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
      const res = await getItems({sortBy});
      setFiles(res.data.items);
      getSpaceUsed();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteItem(id: string) {
    await deleteItem(id);
    setFiles(files.filter((f) => f.id !== id));
  }

  async function handleDeleteBulkClick(ids: string[]) {
    await deleteItemsBulk(ids);
    setFiles(files.filter((f) => !ids.includes(f.id)));
  }

  return (
    <>
      <UploadArea onFilesSelected={handleUploadFiles} />
      {isUploading && <p className="status">Uploading...{done}/{total}</p>}
      {isUploading && <Gauge done={done} total={total}/>}
      <div className={styles.searchBarWrapper}><input className={styles.searchBarInput} type="text" value={search} placeholder= 'Search...' onChange={(e) => setSearch(e.target.value)}/></div>
      <ItemGrid
        files={filtered}
        handleDeleteItem={handleDeleteItem}
        handleDeleteBulkClick={handleDeleteBulkClick}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </>
  );
}
