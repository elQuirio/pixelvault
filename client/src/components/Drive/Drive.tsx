import { useState } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
import { uploadOne } from "../..//api/upload.ts";
import { Gauge } from "../Gauge/Gauge.tsx";
import styles from './Drive.module.css';
import { createFolder } from "../..//api/upload.ts";
import { useItems } from "../../hooks/useItems.ts";

type DriveProps = {
  getSpaceUsed: () => void;
}

export function Drive({getSpaceUsed}: DriveProps) {
  const [currentFolder, setCurrentFolder] = useState("root");
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const {items, removeItems, reload, sortBy, setSortBy } = useItems({parentId: currentFolder});

  const filtered = items.filter((f) => {
    const name = f.visibleName ?? f.originalName;
    return name?.toLowerCase().includes(search.toLowerCase())
  });


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
      reload();
      getSpaceUsed();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteItem(id: string) {
    await deleteItem(id);
    removeItems([id]);
  }

  async function handleDeleteBulkClick(ids: string[]) {
    await deleteItemsBulk(ids);
    removeItems(ids);
  }

  async function handleCreateFolder() {
    await createFolder({visibleName: 'testFolder', parentId: currentFolder});
    reload();
  }

  function handleOpenFolder(id: string) {
    setCurrentFolder(id);
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
        onFolderOpen={handleOpenFolder}
      />
    </>
  );



}