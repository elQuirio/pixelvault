import { useState, useEffect } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { getItems } from "../../api/upload.ts";
import type { Item } from "../..//api/upload.ts";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
import { uploadOne } from "../..//api/upload.ts";
import { Gauge } from "../Gauge/Gauge.tsx";
import styles from './Drive.module.css';
import { createFolder } from "../..//api/upload.ts";

type DriveProps = {
  getSpaceUsed: () => void;
}

export function Drive({getSpaceUsed}: DriveProps) {
  const [files, setFiles] = useState<Item[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("creationDateDesc");
  const [search, setSearch] = useState('');

  const filtered = files.filter((f) => {
    const name = f.visibleName ?? f.originalName;
    return name?.toLowerCase().includes(search.toLowerCase())
  });

  function loadItems() {
    getItems({sortBy, parentId: 'root'}).then((res) => {
      setFiles(res.data.items);
    });
  }

  useEffect(() => {
    loadItems();
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
      loadItems();
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

  async function handleCreateFolder() {
    console.log('creata');
    await createFolder({visibleName: 'testFolder', parentId: 'root'});
    loadItems();
  }

  return (
    <>
      <UploadArea onFilesSelected={handleUploadFiles} />
      {isUploading && <p className="status">Uploading...{done}/{total}</p>}
      {isUploading && <Gauge done={done} total={total}/>}
      <div className={styles.searchBarWrapper}><input className={styles.searchBarInput} type="text" value={search} placeholder= 'Search...' onChange={(e) => setSearch(e.target.value)}/></div>
      <button onClick={handleCreateFolder}>Create folder</button>
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