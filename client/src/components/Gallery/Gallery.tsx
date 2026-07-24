import { UploadArea } from '../UploadArea/UploadArea.tsx'
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { deleteItem, deleteItemsBulk } from "../../api/upload.ts";
//import styles from './Gallery.module.css';
import { useItems } from "../../hooks/useItems.ts";
import { useSearch } from '../../hooks/useSearch.ts';
import { SearchBar } from '../SearchBar/SearchBar.tsx';
import { useToast } from '../../context/useToast.tsx';

type GalleryProps = {
  getSpaceUsed: () => void;
}

export function Gallery({getSpaceUsed}: GalleryProps) {
  
  const {items, removeItems, sortBy, setSortBy, reload } = useItems({type: ['image', 'video']});

  const {query, setQuery, filtered} = useSearch(items);
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
