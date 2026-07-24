import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { permanentDelete, permanentDeleteBulk, restoreItem, restoreItemsBulk } from "../../api/upload.ts";
import { useToast } from "../../context/useToast.tsx";

import { useItems } from "../../hooks/useItems.ts";

type TrashProps = {
  getSpaceUsed: () => void;
}

export function Trash({getSpaceUsed}: TrashProps) {
  const {items, removeItems, sortBy, setSortBy } = useItems({deleted: true});
  const { showToast } = useToast();


  async function handlePermanentDelete(id: string) {
    try {
      await permanentDelete(id);
      removeItems([id]);
      getSpaceUsed();
    } catch (err) {
      console.log('Delete failed', err);
      showToast('Delete failed', 'error');
    }
  }

  async function handlePermanentDeleteBulk(ids: string[]) {
    try {
      await permanentDeleteBulk(ids);
      removeItems(ids);
      getSpaceUsed();
    } catch (err) {
      console.log('Delete failed', err);
      showToast('Delete failed', 'error');
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreItem(id);
      removeItems([id]);
    } catch (err) {
      console.log('Restore failed', err);
      showToast('Restore failed', 'error');
    }
  }

  async function handleBulkRestore(ids: string[]) {
    try {
      await restoreItemsBulk(ids);
      removeItems(ids);  
    } catch (err) {
      console.log('Restore failed', err);
      showToast('Restore failed', 'error');
    }
  }

  return (
    <>
      <ItemGrid
        files={items}
        handleDeleteItem={handlePermanentDelete}
        handleDeleteBulkClick={handlePermanentDeleteBulk}
        handleRestore={handleRestore}
        handleBulkRestore={handleBulkRestore}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
    </>
  );
}
