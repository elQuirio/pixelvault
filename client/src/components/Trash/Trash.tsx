import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { permanentDelete, permanentDeleteBulk, restoreItem, restoreItemsBulk } from "../../api/upload.ts";

import { useItems } from "../../hooks/useItems.ts";

type TrashProps = {
  getSpaceUsed: () => void;
}

export function Trash({getSpaceUsed}: TrashProps) {
  const {items, removeItems, sortBy, setSortBy } = useItems({deleted: true});


  async function handlePermanentDelete(id: string) {
    await permanentDelete(id);
    removeItems([id]);
    getSpaceUsed();
  }

  async function handlePermanentDeleteBulk(ids: string[]) {
    await permanentDeleteBulk(ids);
    removeItems(ids);
    getSpaceUsed();
  }

  async function handleRestore(id: string) {
    await restoreItem(id);
    removeItems([id]);
  }

  async function handleBulkRestore(ids: string[]) {
    await restoreItemsBulk(ids);
    removeItems(ids);
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
