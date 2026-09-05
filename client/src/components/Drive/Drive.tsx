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
import { Breadcrumb } from "../Breadcrumb/Breadcrumb.tsx";

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
      console.error(err);
      showToast('Delete failed', 'error');
    }
  }

  async function handleDeleteClick(ids: string[]) {
    try {
      const count = await getItemCount({mode:'soft', selectedIds: ids});
      setModal({mode: 'confirm', action: 'soft', count, ids});
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    }
  }


  function handleOpenFolder(id: string, name: string) {
    setPath((prev) => [...prev, {id: id, name: name}])
  }

  function handleBreadcrumbClick(id: string|null) {
    const breadIndex = path.findIndex((p) => p.id === id);
    setPath((prev) => prev.slice(0, breadIndex+1));
  }


  async function handleCreateFolder(newFolderName: string) {
    try {
      await createFolder({visibleName: newFolderName.trim(), parentId: currentFolder});
      setModal(null);
      reload();
    } catch (err) {
      console.error(err);
      showToast('Create folder failed', 'error');
    }
  }

  function handleMoveClick(ids: string[]) {
    setModal({mode:'move', ids});
  }

  function handleCancelClick() {
    setModal(null);
  }

  async function handleRenameItem(newName: string) {
    if (modal?.mode !== 'rename') return;
    try {
      await updateItem({id: modal.item.id, visibleName: newName.trim()});
      patchItem(modal.item.id, {visibleName: newName.trim()})
      setModal(null);
    } catch (err) {
      console.error(err);
      showToast('Rename failed','error');
    }
  }

  async function handleMoveConfirm(parentId: string) {
    if (modal?.mode !== 'move') return;
    try {

      const promises = modal.ids.map((id) => updateItem({id, parentId}));
      const resp = await Promise.allSettled(promises);
      const failed = resp.filter((r) => r.status === 'rejected');
      
      if (failed.length > 0) {
        showToast(`${failed.length}/${modal.ids.length} failed to move`, 'error');
      }
    } catch (err) {
      console.error(err);
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
      <Breadcrumb path={path} onNavigate={handleBreadcrumbClick}/>
      {(modal?.mode === 'create' || modal?.mode === 'rename') && <InputModal { ...(modal.mode === 'create' ?
                                      {initialValue: '', mode: modal.mode, onConfirm: handleCreateFolder, confirmBtnLabel:'Create' } 
                                      : {initialValue: modal.item.name, mode:modal.mode, onConfirm: handleRenameItem, confirmBtnLabel:'Rename' })} 
                                      onClose={handleCancelClick} />}
      {(modal?.mode === 'confirm') && <ConfirmModal mode={modal.action} itemCount={modal.count} onConfirm={() => handleDeleteConfirm(modal.ids)} onClose={handleCancelClick}/>}
      {(modal?.mode === 'move' && <NavigationModal initialPath={path} excludedIds={modal.ids} onConfirm={handleMoveConfirm} onClose={handleCancelClick} />)}
      <ItemGrid
        key={currentFolder}
        items={filtered}
        onDelete={handleDeleteClick}
        onDeleteBulk={handleDeleteClick}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onFolderOpen={handleOpenFolder}
        onRename={(item) => setModal({mode: 'rename', item})}
        onMoveBulk={handleMoveClick}
        onCreateFolder={() => setModal({mode:'create'})}
      />
    </>
  );

}