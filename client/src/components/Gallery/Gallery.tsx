import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
import { useItems } from "../../hooks/useItems.ts";
//import styles from './Gallery.module.css';
import { useItems } from "../../hooks/useItems.ts";
import { useUpload } from "../../hooks/useUpload.ts";
import { useSearch } from '../../hooks/useSearch.ts';
import { SearchBar } from '../SearchBar/SearchBar.tsx';

type GalleryProps = {
  getSpaceUsed: () => void;
}

export function Gallery({getSpaceUsed}: GalleryProps) {
  
  const {items, removeItems, sortBy, setSortBy, reload } = useItems({type: ['image', 'video']});

  const {query, setQuery, filtered} = useSearch(items);


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
      <SearchBar value={query} setValue={setQuery}/>
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
