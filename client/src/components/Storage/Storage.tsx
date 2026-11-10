import { useState } from "react";
import { useLeastViewed } from "../../hooks/useLeastViewed.ts";
import { useStorageDetails } from "../../hooks/useStorageDetails.ts";
import { ItemGrid } from "../ItemGrid/ItemGrid.tsx";
//import styles from './Storage.module.css'
import { StorageStats } from "./StorageStats.tsx";
import { deleteItemsBulk } from '../../api/items.ts';
import { useToast } from "../../context/useToast.tsx";
import { getItemCount } from "../../api/items.ts";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal.tsx";
import type { ItemType } from "../../types/types.ts";
import styles from './Storage.module.css';


export function Storage() {
    const { details, reload: reloadStorageDetails } = useStorageDetails();
    const { leastViewed, reload: reloadLeastViewed } = useLeastViewed();
    const [tab, setTab] = useState<'topTen'|'leastView'>('topTen');
    const { showToast } = useToast();
    const [modal, setModal] = useState< {mode:'confirm', action:'soft', count: number, ids: string[]} | null > (null);
    const [itemType, setItemType] = useState<ItemType | 'all'>('all');

    if (!details || !leastViewed) return <p>Loading...</p>;

    const items = (tab === 'topTen' ? details.topTenItems : leastViewed).filter((i) => (itemType === 'all' ? true : i.itemType === itemType));

    async function handleDeleteConfirm(ids: string[]) {
      try {
        await deleteItemsBulk(ids);
        reloadStorageDetails();
        reloadLeastViewed();
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

      function changeTab(next: 'topTen' | 'leastView') {
        setTab(next);
        setItemType('all');
      }

    return  <div>
                <StorageStats stats={details}/>
                <div className={styles.tabs}>
                  <button className={`${styles.tab} ${tab === 'topTen' ? styles.active : ''}`} onClick={() => changeTab('topTen')}>Largest</button>
                  <button className={`${styles.tab} ${tab === 'leastView' ? styles.active : ''}`} onClick={() => changeTab('leastView')}>Least viewed</button>
                </div>
                {(modal?.mode === 'confirm') && <ConfirmModal mode={modal.action} itemCount={modal.count} onConfirm={() => handleDeleteConfirm(modal.ids)} onClose={() => setModal(null)} />}
                <ItemGrid items={items} isLoading={false} onDelete={handleDeleteClick} onDeleteBulk={handleDeleteClick}
                        itemType={itemType} setItemType={setItemType} typeOptions={tab === 'topTen' ? ['video', 'image', 'file'] : ['video', 'image']}
                />
            </div>
}