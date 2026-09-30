
import type { Item, ItemType, DuplicateGroup } from "../../types/types.ts";
import { Toolbar } from "../Toolbar/Toolbar";
import { LightBox } from "../LightBox/LightBox.tsx";
import { useLightBox } from "../../hooks/useLightBox";
import { useSelection } from "../../hooks/useSelection";
import { TypeIcon } from "../TypeIcon/TypeIcon.tsx";
import { ItemActions } from "../ItemActions/ItemActions.tsx";
import { Folder } from "lucide-react";
import { API_BASE } from "../../config/api.ts";
import styles from './DuplicateGrid.module.css';



type DuplicateGridProps = {
  duplicates: DuplicateGroup[];
  isLoading: boolean;
  onDelete: (ids: string[]) => void;
  onDeleteBulk: (ids: string[]) => void;
  itemType: ItemType | 'all';
  setItemType: (itemType: ItemType | 'all') => void;
  typeOptions?: ItemType[];
};

export function DuplicateGrid({ duplicates, isLoading, onDelete, onDeleteBulk, itemType, setItemType, typeOptions }: DuplicateGridProps) {
  const {isSelectMode, toggleSelectMode, selectedIds, setSelectedIds, toggleSelection, toggleSelectAll} = useSelection();
  const filteredDuplicates = duplicates.filter((i) => itemType === 'all' || i.items[0].itemType === itemType);
  const duplicatesItems = filteredDuplicates.flatMap((d) => d.items);
  const selectAllItems = filteredDuplicates.flatMap((d) => d.items.slice(1).map((i) => i.id));
  const { lightBoxIndex, setLightBoxIndex, closeLightBox } = useLightBox(duplicatesItems);

  const handleClick = (u: Item) => {
    if (isSelectMode) {
      toggleSelection(u.id);
      return;
    } 
    setLightBoxIndex(duplicatesItems.findIndex((m) => u.id === m.id));
  };

  const handleSetItemType = (itemType: ItemType | 'all') => {
    setItemType(itemType);
    setSelectedIds([]);
  }

  function handleDeleteBulk(selectedIds: string[]) {
    if (selectedIds.length === 0) return;
    onDeleteBulk(selectedIds);
    toggleSelectMode();
  }

  function handleToggleSelectAll() {
    toggleSelectAll(selectAllItems);
  }

  return (<div>
      <Toolbar isSelectMode={isSelectMode} selectedCount={selectedIds.length} itemsCount={selectAllItems.length} onToggleSelectMode={toggleSelectMode} onToggleSelectAll={handleToggleSelectAll} itemType={itemType} setItemType={handleSetItemType} typeOptions={typeOptions} onDeleteBulk={() => handleDeleteBulk(selectedIds)} />
        {isLoading ? (<div>Loading</div>) : filteredDuplicates.length === 0 ? <div>No duplicates</div> : 
        <div className={styles.duplicateGridContainer}>
          {filteredDuplicates.map((d) => (
            <div key={d.hash} className={styles.duplicatesRowContainer}>
              {d.items.map((i) => <div key={i.id} className={styles.duplicateContainer}>
                                    {isSelectMode && (<input type="checkbox" className={styles.selectionCheckbox} checked={selectedIds.includes(i.id)} onChange={() => toggleSelection(i.id)}/>)}
                                  <div className={styles.thumbnailWrapper}>
                                  {i.thumbnail ? 
                                      <img className={styles.duplicateThumbnail} src={`${API_BASE}${i.thumbnail}`} alt={i.id} onClick={() => handleClick(i)}/> 
                                      : <TypeIcon itemType={i.itemType} onClick={() => handleClick(i)}/>
                                  }
                                  {!isSelectMode &&  <ItemActions item={i} onDelete={onDelete} />}
                                  </div>
                                  <div className={styles.itemName}>{i.visibleName}</div>
                                  <div className={styles.parentName}><Folder size={13}/>{i.parentName === null ? 'Root' : i.parentName}</div>
                                  </div>)}
            </div>))}
        {lightBoxIndex !== null && (
            <LightBox items={duplicatesItems} lightBoxIndex={lightBoxIndex} setLightBoxIndex={setLightBoxIndex} onClose={closeLightBox} onDelete={onDelete}/>
        )}
</div>}
</div>)
}
