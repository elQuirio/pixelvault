import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
import { getItemCount, permanentDeleteBulk, restoreItemsBulk } from "../../api/upload.ts";
import { useToast } from "../../context/useToast.tsx";
import { useState } from "react";
import { useItems } from "../../hooks/useItems.ts";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal.tsx";
import { Breadcrumb } from "../Breadcrumb/Breadcrumb.tsx";

type TrashProps = {
  getSpaceUsed: () => void;
}

export function Trash({getSpaceUsed}: TrashProps) {
  const [path, setPath] = useState<{id: string | null, name: string}[]>([{id: null, name: 'Home'}]);
  const currentFolder = path.at(-1)?.id ?? undefined;
  const {items, removeItems, sortBy, setSortBy, reload } = useItems({parentId: currentFolder, deleted: true});
  const { showToast } = useToast();
  const [modal, setModal] = useState<{mode:'confirm', action: 'restore'|'permanent', count: number, ids: string[]} | null>(null);

  async function handlePermanentClick(ids: string[]) {
    try {
      const count = await getItemCount({selectedIds: ids, mode:'permanent'});
      setModal({mode: 'confirm', action: 'permanent', count: count, ids});
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    }
  }

  async function handlePermanentConfirm(ids: string[]) {
    try {
      await permanentDeleteBulk(ids);
      removeItems(ids);
      getSpaceUsed();
      setModal(null);
      reload();
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    }
  }

  async function handleRestoreClick(ids: string[]) {
    try {
      const count = await getItemCount({selectedIds: ids, mode: 'restore'});
      setModal({mode:'confirm', action: 'restore', count, ids});
    } catch (err) {
      console.error(err);
      showToast('Restore failed', 'error');
    }
  }

  async function handleRestoreConfirm(ids: string[]) {
    try {
      await restoreItemsBulk(ids);
      removeItems(ids);
      setModal(null);
      reload();
    } catch (err) {
      console.error(err);
      showToast('Restore failed', 'error');
    }
  }


  function handleOpenFolder(id: string, name: string) {
    setPath((prev) => [...prev, {id: id, name: name}]);
  }

  function handleBreadcrumbClick(id: string|null) {
    const breadIndex = path.findIndex((p) => p.id === id);
    setPath((prev) => prev.slice(0, breadIndex+1));
  }

  function handleCancelClick() {
    setModal(null);
  }

  return (
    <>
      <Breadcrumb path={path} onNavigate={handleBreadcrumbClick}/> 
        {modal?.mode === 'confirm' && <ConfirmModal confirmBtnLabel={'Confirm'} mode={modal.action} itemCount={modal.count}
                                                    onConfirm={modal.action === 'permanent' ? () => handlePermanentConfirm(modal.ids) : () => handleRestoreConfirm(modal.ids)} 
                                                    onClose={handleCancelClick}/>}
      <ItemGrid
        key={currentFolder ?? 'home'}
        items={items}
        onDelete={handlePermanentClick}
        onDeleteBulk={handlePermanentClick}
        onRestore={handleRestoreClick}
        onRestoreBulk={handleRestoreClick}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onFolderOpen={handleOpenFolder}
      />
    </>
  );
}
