import { useState } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
//import styles from './Drive.module.css';
import { createFolder } from "../../api/upload.ts";
import { useItems } from "../../hooks/useItems.ts";
import { useSearch } from "../../hooks/useSearch.ts";
import { SearchBar } from "../SearchBar/SearchBar.tsx";
import { useToast } from '../../context/useToast.tsx';

import { CreateFolderModal } from "../CreateFolderModal/CreateFolderModal.tsx";

type DriveProps = {
  getSpaceUsed: () => void;
}

export function Drive({getSpaceUsed}: DriveProps) {
  const [path, setPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Home'}]);
  const currentFolder = path.at(-1)?.id ?? 'root';
  const [isCreating, setIsCreating] = useState(false);
  const { showToast } = useToast();

  const {items, removeItems, reload, sortBy, setSortBy } = useItems({parentId: currentFolder});

  const {query, setQuery, filtered} = useSearch(items);

  async function handleDeleteItem(id: string) {
    try {
      await deleteItem(id);
      removeItems([id]);
    } catch (err) {
      console.log('Delete failed', err);
      showToast('Delete failed', 'error');
    }
  }

  async function handleDeleteBulkClick(ids: string[]) {
    try { 
      await deleteItemsBulk(ids);
      removeItems(ids);
    } catch (err) {
      console.log('Delete failed', err);
      showToast('Delete failed', 'error');
    }
  }


  function handleOpenFolder(id: string, name: string) {
    setPath((prev) => [...prev, {id: id, name: name}])
  }

  function onBreadcrumbClick(id: string) {
    const breadIndex = path.findIndex((p) => p.id === id);
    setPath((prev) => prev.slice(0, breadIndex+1));
  }


  async function handleCreateFolder(newFolderName: string) {
    try {
      await createFolder({visibleName: newFolderName.trim(), parentId: currentFolder});
      setIsCreating(false);
      reload();
    } catch (err) {
      console.log('Create folder failed', err);
      showToast('Create folder failed', 'error');
    }
  }

  function onClickCancel() {
    setIsCreating(false);
  }
  

  return (
    <>
      <UploadArea parentId={currentFolder === 'root' ? null : currentFolder} onComplete={()=> { reload(); getSpaceUsed();}} />
      <SearchBar value={query} setValue={setQuery}/>
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