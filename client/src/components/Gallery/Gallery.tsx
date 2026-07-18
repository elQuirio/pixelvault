import { useState } from "react";
import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
import styles from './Gallery.module.css';
import { useItems } from "../../hooks/useItems.ts";

type GalleryProps = {
  getSpaceUsed: () => void;
}

export function Gallery({getSpaceUsed}: GalleryProps) {
  const [search, setSearch] = useState('');
  const {items, removeItems, sortBy, setSortBy, reload } = useItems({type: ['image', 'video']});

  const filtered = items.filter((f) => f.originalName?.toLowerCase().includes(search.toLowerCase()));

  async function handleDeleteItem(id: string) {
    await deleteItem(id);
    removeItems([id]);
  }

  async function handleDeleteBulkClick(ids: string[]) {
    await deleteItemsBulk(ids);
    removeItems(ids);
  }

  return (
    <>
      <UploadArea parentId={null} onComplete={() => { reload(); getSpaceUsed(); }}/>
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
