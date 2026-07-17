import React, { useState } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
import { uploadOne } from "../../api/upload.ts";
import { Gauge } from "../Gauge/Gauge.tsx";
import styles from './Drive.module.css';
import { createFolder } from "../../api/upload.ts";
import { useItems } from "../../hooks/useItems.ts";
import { createPortal } from "react-dom";

type DriveProps = {
  getSpaceUsed: () => void;
}

export function Drive({getSpaceUsed}: DriveProps) {
  const [path, setPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Home'}]);
  const currentFolder = path.at(-1)?.id ?? 'root';
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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
        return uploadOne(f, currentFolder === 'root' ? null : currentFolder).then((c) => {
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

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder({visibleName: newFolderName.trim(), parentId: currentFolder});
    setNewFolderName('');
    setIsCreating(false);
    reload();
  }

  function handleOpenFolder(id: string, name: string) {
    setPath((prev) => [...prev, {id: id, name: name}])
  }

  function onBreadcrumbClick(id: string) {
    const breadIndex = path.findIndex((p) => p.id === id);
    setPath((prev) => prev.slice(0, breadIndex+1));
  }

  return (
    <>
      <UploadArea onFilesSelected={handleUploadFiles} />
      {isUploading && <p className="status">Uploading...{done}/{total}</p>}
      {isUploading && <Gauge done={done} total={total}/>}
      <div className={styles.searchBarWrapper}><input className={styles.searchBarInput} type="text" value={search} placeholder= 'Search...' onChange={(e) => setSearch(e.target.value)}/></div>
      {path.map((p) => {
        return <button key={p.id} onClick={() => onBreadcrumbClick(p.id)}>{p.name}</button>
        })}
      <button onClick={() => setIsCreating(true)}>Create folder</button>
      {isCreating && createPortal(<div onClick={() => {setIsCreating(false); setNewFolderName('');}} className={styles.overlay}>
                                    <form onSubmit={handleCreateFolder} onClick={(e) => e.stopPropagation()} className={styles.modal}>
                                      <div className={styles.modalWrapper}>
                                        <label htmlFor="new-folder-name-input">Insert folder name</label>
                                        <input id='new-folder-name-input' type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus></input>
                                        <button type="submit">Confirm</button>
                                        <button type="button" onClick={() => {setIsCreating(false);setNewFolderName('');}}>Cancel</button>
                                      </div>
                                    </form>
                                  </div>, document.body)}
      <ItemGrid
        key={currentFolder}
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