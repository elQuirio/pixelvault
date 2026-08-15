import styles from "./ItemGrid.module.css";
import type { Item } from "../../api/upload";
import { LightBox } from "../LightBox/LightBox";
import { API_BASE } from "../../config/api";
import { TypeIcon } from "../TypeIcon/TypeIcon";
import { Toolbar } from "../Toolbar/Toolbar";
import { useLightBox } from "../../hooks/useLightBox";
import { useSelection } from "../../hooks/useSelection";
import { ItemActions } from "../ItemActions/ItemActions";



type ItemGridProps = {
  items: Item[];
  onDelete: (ids: string[]) => void;
  onDeleteBulk: (ids: string[]) => void;
  onRestore?: (ids: string[]) => void;
  onRestoreBulk?: (ids: string[]) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  onFolderOpen?: (id: string, name: string) => void;
  onRename?: (item: { id: string, name: string }) => void;
  onMoveBulk?: (ids: string[]) => void;
};

export function ItemGrid({ items, onDelete, onDeleteBulk, sortBy, setSortBy, onRestore, onRestoreBulk, onFolderOpen, onRename, onMoveBulk }: ItemGridProps) {
  const {isSelectMode, toggleSelectMode, selectedIds, toggleSelection} = useSelection();

  const mediaItems = items.filter((f) => f.itemType !== "folder");
  const { lightBoxIndex, setLightBoxIndex, closeLightBox } = useLightBox(mediaItems);


  const handleClick = (u: Item) => {
    if (isSelectMode) {
      toggleSelection(u.id);
      return;
    }
    if (u.itemType === "folder") {
      onFolderOpen?.(u.id, u.visibleName);
      return;
    }
    setLightBoxIndex(mediaItems.findIndex((m) => u.id === m.id));
  };

  function handleDeleteBulk(selectedIds: string[]) {
    onDeleteBulk(selectedIds);
    toggleSelectMode();
  }

  function handleRestoreBulk(selectedIds: string[]) {
    onRestoreBulk?.(selectedIds);
    toggleSelectMode();
  }

  function handleMoveBulk(selectedIds: string[]) {
    onMoveBulk?.(selectedIds);
    toggleSelectMode();
  }

  return (
    <div>
      <Toolbar isSelectMode={isSelectMode} onToggleSelectMode={toggleSelectMode} sortBy={sortBy} setSortBy={setSortBy} onDeleteBulk={() => handleDeleteBulk(selectedIds)} onRestoreBulk={onRestoreBulk && (() => handleRestoreBulk(selectedIds))} onMoveBulk={onMoveBulk && (() => handleMoveBulk(selectedIds))} />
      <div className={styles.gridContainer}>
        {items.map((u) => (
          <div key={u.id} className={styles.thumbnailContainer}>
            {isSelectMode && (
              <input type="checkbox" className={styles.selectionCheckbox} checked={selectedIds.includes(u.id)} onChange={() => toggleSelection(u.id)} />
            )}
            {u.thumbnail ? (
              <img className={styles.thumbnail} src={`${API_BASE}${u.thumbnail}`} alt={u.id} onClick={() => handleClick(u)}/>
            ) : (
              <TypeIcon itemType={u.itemType} onClick={() => handleClick(u)}/>
            )}
            <div className={styles.itemName}>{u.visibleName}</div>
            <ItemActions item={u} onRename={onRename} onMove={onMoveBulk} />
          </div>
        ))}
        {lightBoxIndex !== null && (
          <LightBox items={mediaItems} lightBoxIndex={lightBoxIndex} setLightBoxIndex={setLightBoxIndex} onClose={closeLightBox} onDelete={onDelete} onRestore={onRestore}/>
        )}
      </div>
    </div>
  );
}
