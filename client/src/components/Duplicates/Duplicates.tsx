import { DuplicateGrid } from '../DuplicateGrid/DuplicateGrid.tsx';
import { deleteItemsBulk, getItemCount } from "../../api/upload.ts";
import { useToast } from '../../context/useToast.tsx';
import { useState } from 'react';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal.tsx';
import type { ItemType } from '../../types/types.ts';
import { useDuplicates } from '../../hooks/useDuplicates.ts';

type DuplicatesProps = {
  getSpaceUsed: () => void;
}

export function Duplicates({getSpaceUsed}: DuplicatesProps) {
  const [itemType, setItemType] = useState<ItemType | 'all'>('all');
  const {duplicates, loading, removeDuplicates } = useDuplicates();

  const [modal, setModal] = useState< {mode:'confirm', action:'soft', count: number, ids: string[]} | null > (null);

  const { showToast } = useToast();

  async function handleDeleteConfirm(ids: string[]) {
    try {
      await deleteItemsBulk(ids);
      removeDuplicates(ids);
      getSpaceUsed();
      setModal(null);
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    }
  }

  async function handleDeleteClick(ids: string[]) {
      try {
        const count = await getItemCount({mode:'soft', selectedIds: ids});
        setModal({mode: 'confirm', action:'soft', count, ids});
      } catch (err) {
        console.error(err);
        showToast('Delete failed', 'error');
      }
    }


  return (
    <>
      {(modal?.mode === 'confirm') && <ConfirmModal mode={modal.action} itemCount={modal.count} onConfirm={() => handleDeleteConfirm(modal.ids)} onClose={() => setModal(null)} />}
      <DuplicateGrid
        duplicates={duplicates ?? []}
        isLoading={loading}
        onDelete={handleDeleteClick}
        onDeleteBulk={handleDeleteClick}
        itemType={itemType}
        setItemType={setItemType}
        typeOptions={['video', 'image']}
      />
    </>
  );
}
