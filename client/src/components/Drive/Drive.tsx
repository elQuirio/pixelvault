import { useState } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
import { Gauge } from "../Gauge/Gauge.tsx";
import styles from './Drive.module.css';
import { createFolder } from "../../api/upload.ts";
import { useUpload } from "../../hooks/useUpload.ts";
import { useItems } from "../../hooks/useItems.ts";

import { CreateFolderModal } from "../CreateFolderModal/CreateFolderModal.tsx";

type DriveProps = {
  getSpaceUsed: () => void;
}

export function Drive({getSpaceUsed}: DriveProps) {
  const [path, setPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Home'}]);
  const currentFolder = path.at(-1)?.id ?? 'root';
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const {items, removeItems, reload, sortBy, setSortBy } = useItems({parentId: currentFolder});
  const {done, total, isUploading, uploadFiles} = useUpload({
                onComplete: () => {
                  reload();
                  getSpaceUsed();
              }})

  const filtered = items.filter((f) => {
    const name = f.visibleName ?? f.originalName;
    return name?.toLowerCase().includes(search.toLowerCase())
  });



  async function handleDeleteItem(id: string) {
    await deleteItem(id);
    removeItems([id]);
  }

  async function handleDeleteBulkClick(ids: string[]) {
    await deleteItemsBulk(ids);
    removeItems(ids);
  }


  function handleOpenFolder(id: string, name: string) {
    setPath((prev) => [...prev, {id: id, name: name}])
  }

  function onBreadcrumbClick(id: string) {
    const breadIndex = path.findIndex((p) => p.id === id);
    setPath((prev) => prev.slice(0, breadIndex+1));
  }


  async function handleCreateFolder(newFolderName: string) {
        await createFolder({visibleName: newFolderName.trim(), parentId: currentFolder});
        setIsCreating(false);
        reload();
  }

  function onClickCancel() {
    setIsCreating(false);
  }
  

  return (
    <>
      <UploadArea onFilesSelected={(files) => uploadFiles(files, currentFolder === 'root' ? null : currentFolder)} />
      {isUploading && <p className="status">Uploading...{done}/{total}</p>}
      {isUploading && <Gauge done={done} total={total}/>}
      <div className={styles.searchBarWrapper}><input className={styles.searchBarInput} type="text" value={search} placeholder= 'Search...' onChange={(e) => setSearch(e.target.value)}/></div>
      {path.map((p) => {
        return <button key={p.id} onClick={() => onBreadcrumbClick(p.id)}>{p.name}</button>
        })}
      <button onClick={() => setIsCreating(true)}>Create folder</button>
      {isCreating && <CreateFolderModal onConfirm={handleCreateFolder} onClose={onClickCancel}/>}
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