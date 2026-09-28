
import type { Item, ItemType, DuplicateGroup } from "../../types/types.ts";
import { Toolbar } from "../Toolbar/Toolbar";
import { LightBox } from "../LightBox/LightBox.tsx";
import { useLightBox } from "../../hooks/useLightBox";
import { useSelection } from "../../hooks/useSelection";
import { API_BASE } from "../../config/api.ts";
import styles from './DuplicateGrid.module.css';



type DuplicateGridProps = {
  duplicates: DuplicateGroup[];
  isLoading: boolean;
  onDelete: (ids: string[]) => void;
  onDeleteBulk: (ids: string[]) => void;
  query?: string;
  itemType: ItemType | 'all';
  setItemType: (itemType: ItemType | 'all') => void;
  typeOptions?: ItemType[];
  onMoveBulk?: (ids: string[]) => void;
};

export function DuplicateGrid({ duplicates, isLoading, onDelete, onDeleteBulk, itemType, setItemType, typeOptions }: DuplicateGridProps) {
  const {isSelectMode, toggleSelectMode, selectedIds, toggleSelection, toggleSelectAll} = useSelection();
  const duplicatesItems = duplicates.flatMap((d) => d.items);
  const { lightBoxIndex, setLightBoxIndex, closeLightBox } = useLightBox(duplicatesItems);


  const handleClick = (u: Item) => {
    if (isSelectMode) {
      toggleSelection(u.id);
      return;
    }
    setLightBoxIndex(duplicatesItems.findIndex((m) => u.id === m.id));
  };

  function handleDeleteBulk(selectedIds: string[]) {
    if (selectedIds.length === 0) return;
    onDeleteBulk(selectedIds);
    toggleSelectMode();
  }

  function handleToggleSelectAll() {
    toggleSelectAll(duplicatesItems.map((i) => i.id));
  }

  return (<div>
      <Toolbar isSelectMode={isSelectMode} selectedCount={selectedIds.length} itemsCount={duplicates.length} onToggleSelectMode={toggleSelectMode} onToggleSelectAll={handleToggleSelectAll} itemType={itemType} setItemType={setItemType} typeOptions={typeOptions} onDeleteBulk={() => handleDeleteBulk(selectedIds)} />
        {isLoading ? (<div>Loading</div>) : duplicates.length > 0 ? <div className={styles.duplicateGridContainer}>
        {duplicates.map((d) => (
            <div key={d.hash} className={styles.duplicatesRowContainer}>
                {d.items.map((i) => <div className={styles.duplicateContainer}>
                {isSelectMode && (<input type="checkbox" className={styles.selectionCheckbox} checked={selectedIds.includes(i.id)} onChange={() => toggleSelection(i.id)}/>)}
                  <img key={i.id} className={styles.duplicateThumbnail} src={`${API_BASE}${i.thumbnail}`} alt={i.id} onClick={() => handleClick(i)}/>
                  </div>)}
            </div>
              ))}
        {lightBoxIndex !== null && (
            <LightBox items={duplicatesItems} lightBoxIndex={lightBoxIndex} setLightBoxIndex={setLightBoxIndex} onClose={closeLightBox} onDelete={onDelete}/>
        )}
</div> : <div>empty</div>}
</div>)
}
