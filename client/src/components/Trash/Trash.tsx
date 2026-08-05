import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { permanentDelete, permanentDeleteBulk, restoreItem, restoreItemsBulk } from "../../api/upload.ts";
import { useToast } from "../../context/useToast.tsx";
import { useState } from "react";
import { useItems } from "../../hooks/useItems.ts";

type TrashProps = {
  getSpaceUsed: () => void;
}

export function Trash({getSpaceUsed}: TrashProps) {
  const [path, setPath] = useState<{id: string | null, name: string}[]>([{id: null, name: 'Home'}]);
  const currentFolder = path.at(-1)?.id ?? undefined;
  const {items, removeItems, sortBy, setSortBy } = useItems({parentId: currentFolder, deleted: true});
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


  function handleOpenFolder(id: string, name: string) {
    setPath((prev) => [...prev, {id: id, name: name}]);
  }

  function onBreadcrumbClick(id: string|null) {
    const breadIndex = path.findIndex((p) => p.id === id);
    setPath((prev) => prev.slice(0, breadIndex+1));
  }

  return (
    <>
      {path.map((p) => {
        return <button key={p.id ?? 'home'} onClick={() => onBreadcrumbClick(p.id)}>{p.name}</button>
        })}
      <ItemGrid
        key={currentFolder ?? 'home'}
        files={items}
        handleDeleteItem={handlePermanentDelete}
        handleDeleteBulkClick={handlePermanentDeleteBulk}
        handleRestore={handleRestore}
        handleBulkRestore={handleBulkRestore}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onFolderOpen={handleOpenFolder}
      />
    </>
  );
}
