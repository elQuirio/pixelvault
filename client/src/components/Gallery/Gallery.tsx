import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItem, deleteItemsBulk, updateItem } from "../../api/upload.ts";
//import styles from './Gallery.module.css';
import { useItems } from "../../hooks/useItems.ts";
import { useSearch } from '../../hooks/useSearch.ts';
import { SearchBar } from '../SearchBar/SearchBar.tsx';
import { useToast } from '../../context/useToast.tsx';
import { useState } from 'react';
import { InputModal } from '../InputModal/InputModal.tsx';

type GalleryProps = {
  getSpaceUsed: () => void;
}

export function Gallery({getSpaceUsed}: GalleryProps) {
  
  const {items, removeItems, sortBy, setSortBy, reload, patchItem } = useItems({type: ['image', 'video']});
  const {query, setQuery, filtered} = useSearch(items);
  const [modal, setModal] = useState< {mode:'rename', item:{id: string, name: string}, } | null > (null);

  const { showToast } = useToast();


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

  async function handleConfirmRename(newName: string) {
    try {
      if (modal?.mode !== 'rename') return;
      await updateItem({id: modal.item.id, visibleName: newName.trim()});
      patchItem(modal.item.id, {visibleName: newName.trim()});
      setModal(null);
    } catch (err) {
      console.log('Rename failed', err);
      showToast('Rename failed', 'error');
    }
  }

  return (
    <>
      <UploadArea parentId={null} onComplete={() => { reload(); getSpaceUsed(); }}/>
      <SearchBar value={query} setValue={setQuery}/>
      {modal && <InputModal initialValue={modal.item.name} confirmBtnLabel={'Rename item'} mainLabel={'Insert new name'} onConfirm={handleConfirmRename} onClose={() => setModal(null)} />}
      <ItemGrid
        files={filtered}
        handleDeleteItem={handleDeleteItem}
        handleDeleteBulkClick={handleDeleteBulkClick}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onRename={(item) => setModal({mode:'rename', item})}
      />
    </>
  );
}
