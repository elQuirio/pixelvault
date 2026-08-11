import { useState } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItemsBulk } from "../../api/upload.ts";
//import styles from './Drive.module.css';
import { createFolder } from "../../api/upload.ts";
import { useItems } from "../../hooks/useItems.ts";
import { useSearch } from "../../hooks/useSearch.ts";
import { SearchBar } from "../SearchBar/SearchBar.tsx";
import { useToast } from '../../context/useToast.tsx';
import { updateItem, getItemCount } from '../../api/upload.ts';

import { InputModal } from "../InputModal/InputModal.tsx";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal.tsx";
import { NavigationModal } from "../NavigationModal/NavigationModal.tsx";

type DriveProps = {
  getSpaceUsed: () => void;
}

export function Drive({getSpaceUsed}: DriveProps) {
  const [path, setPath] = useState<{id: string, name: string}[]>([{id: 'root', name: 'Home'}]);
  const currentFolder = path.at(-1)?.id ?? 'root';
  const [modal, setModal] = useState< {mode:'rename', item:{id: string, name: string}, } | {mode: 'move', ids: string[]} | {mode: 'create'} | {mode: 'confirm', action: 'soft', count: number, ids: string[]} | null > (null);
  const { showToast } = useToast();

  const {items, removeItems, reload, sortBy, setSortBy, patchItem } = useItems({parentId: currentFolder});

  const {query, setQuery, filtered} = useSearch(items);

  async function handleDeleteConfirm(ids: string[]) {
    try {
      await deleteItemsBulk(ids);
      removeItems(ids);
      setModal(null);
    } catch (err) {
      console.log('Delete failed', err);
      showToast('Delete failed', 'error');
    }
  }

  async function handleDeleteClick(ids: string[]) {
    try {
      const count = await getItemCount({mode:'soft', selectedIds: ids});
      setModal({mode: 'confirm', action: 'soft', count, ids});
    } catch (err) {
      console.log(err);
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
      setModal(null);
      reload();
    } catch (err) {
      console.log('Create folder failed', err);
      showToast('Create folder failed', 'error');
    }
  }

  function handleMoveClick(ids: string[]) {
    setModal({mode:'move', ids});
  }

  function onClickCancel() {
    setModal(null);
  }

  async function handleRenameItem(newName: string) {
    if (modal?.mode !== 'rename') return;
    try {
      await updateItem({id: modal.item.id, visibleName: newName.trim()});
      patchItem(modal.item.id, {visibleName: newName.trim()})
      setModal(null);
    } catch (err) {
      console.log('Rename failed', err);
      showToast('Rename failed','error');
    }
  }

  async function handleMoveConfirm(parentId: string) {
    if (modal?.mode !== 'move') return;
    try {
      for (const id of modal.ids) {
        await updateItem({id, parentId});
      }
    } catch (err) {
      console.log('Move failed', err);
      showToast('Move failed', 'error');
    }
    finally {
      reload();
      setModal(null);
    }
  }

  return (
    <>
      <UploadArea parentId={currentFolder === 'root' ? null : currentFolder} onComplete={()=> { reload(); getSpaceUsed();}} />
      <SearchBar value={query} setValue={setQuery}/>
      {path.map((p) => {
        return <button key={p.id} onClick={() => onBreadcrumbClick(p.id)}>{p.name}</button>
        })}
      <button onClick={() => setModal({mode:'create'})}>Create folder</button>
      {(modal?.mode === 'create' || modal?.mode === 'rename') && <InputModal { ...(modal.mode === 'create' ?
                                      {initialValue: '', mode: modal.mode, onConfirm: handleCreateFolder, confirmBtnLabel:'Create folder' } 
                                      : {initialValue: modal.item.name, mode:modal.mode, onConfirm: handleRenameItem, confirmBtnLabel:'Rename item' })} 
                                      onClose={onClickCancel} />}
      {(modal?.mode === 'confirm') && <ConfirmModal action={modal.action} itemCount={modal.count} onConfirm={() => handleDeleteConfirm(modal.ids)} onClose={onClickCancel}/>}
      {(modal?.mode === 'move' && <NavigationModal initialPath={path} excludedIds={modal.ids} onConfirm={handleMoveConfirm} onClose={onClickCancel} />)}
      <ItemGrid
        key={currentFolder}
        files={filtered}
        handleDeleteItem={handleDeleteClick}
        handleDeleteBulkClick={handleDeleteClick}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onFolderOpen={handleOpenFolder}
        onRename={(item) => setModal({mode: 'rename', item})}
        onBulkMove={handleMoveClick}
      />
    </>
  );

}