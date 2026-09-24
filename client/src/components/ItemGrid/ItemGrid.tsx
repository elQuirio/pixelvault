import styles from "./ItemGrid.module.css";
import type { Item, ItemType } from "../../types/types.ts";
import { LightBox } from "../LightBox/LightBox";
import { API_BASE } from "../../config/api";
import { TypeIcon } from "../TypeIcon/TypeIcon";
import { Toolbar } from "../Toolbar/Toolbar";
import { useLightBox } from "../../hooks/useLightBox";
import { useSelection } from "../../hooks/useSelection";
import { ItemActions } from "../ItemActions/ItemActions";
import { registerView } from "../../api/upload.ts";



type ItemGridProps = {
  items: Item[];
  isLoading: boolean;
  onDelete: (ids: string[]) => void;
  onDeleteBulk: (ids: string[]) => void;
  onRestore?: (ids: string[]) => void;
  onRestoreBulk?: (ids: string[]) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  query?: string;
  itemType: ItemType | 'all';
  setItemType: (itemType: ItemType | 'all') => void;
  typeOptions?: ItemType[];
  onFolderOpen?: (id: string, name: string) => void;
  onCreateFolder?: () => void;
  onRename?: (item: { id: string, name: string }) => void;
  onMoveBulk?: (ids: string[]) => void;
};

export function ItemGrid({ items, isLoading, onDelete, onDeleteBulk, sortBy, setSortBy, query, itemType, setItemType, typeOptions, onRestore, onRestoreBulk, onFolderOpen, onRename, onMoveBulk, onCreateFolder }: ItemGridProps) {
  const {isSelectMode, toggleSelectMode, selectedIds, toggleSelection, toggleSelectAll} = useSelection();

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
    registerView({itemUUID: u.id});
    setLightBoxIndex(mediaItems.findIndex((m) => u.id === m.id));
  };

  function handleDeleteBulk(selectedIds: string[]) {
    if (selectedIds.length === 0) return;
    onDeleteBulk(selectedIds);
    toggleSelectMode();
  }

  function handleRestoreBulk(selectedIds: string[]) {
    if (selectedIds.length === 0) return;
    onRestoreBulk?.(selectedIds);
    toggleSelectMode();
  }

  function handleMoveBulk(selectedIds: string[]) {
    if (selectedIds.length === 0) return;
    onMoveBulk?.(selectedIds);
    toggleSelectMode();
  }

  function handleToggleSelectAll() {
    toggleSelectAll(items.map((i) => i.id));
  }

  return (
    <div>
      <Toolbar isSelectMode={isSelectMode} selectedCount={selectedIds.length} itemsCount={items.length} onToggleSelectMode={toggleSelectMode} onToggleSelectAll={handleToggleSelectAll} sortBy={sortBy} setSortBy={setSortBy} itemType={itemType} setItemType={setItemType} typeOptions={typeOptions} onDeleteBulk={() => handleDeleteBulk(selectedIds)} onRestoreBulk={onRestoreBulk && (() => handleRestoreBulk(selectedIds))} onMoveBulk={onMoveBulk && (() => handleMoveBulk(selectedIds))} onCreateFolder={onCreateFolder && (onCreateFolder)} />
{isLoading ? (<div>Loading</div>) : items.length > 0 ? <div className={styles.gridContainer}>
        {items.map((u) => (
            <div key={u.id} className={styles.thumbnailContainer}>
              {isSelectMode && (
                <input type="checkbox" className={styles.selectionCheckbox} checked={selectedIds.includes(u.id)} onChange={() => toggleSelection(u.id)} />
              )}
              {u.thumbnail ? (
                <img className={styles.thumbnail} src={`${API_BASE}${u.thumbnail}`} alt={u.id} onClick={() => handleClick(u)}/>
              ) : (
                <TypeIcon itemType={u.itemType} onClick={() => handleClick(u)} itemCount={u.childCount}/>
              )}
              <div className={styles.itemName}>{u.visibleName}</div>
              {!isSelectMode && <ItemActions item={u} onRename={onRename} onMove={onMoveBulk} onDelete={onDelete} />}
            </div>
        ))}
        {lightBoxIndex !== null && (
          <LightBox items={mediaItems} lightBoxIndex={lightBoxIndex} setLightBoxIndex={setLightBoxIndex} onClose={closeLightBox} onDelete={onDelete} onRestore={onRestore}/>
        )}
      </div> : (itemType !== 'all') ? <div className={styles.emptyType}>No {itemType}s here</div> 
      : (query !== '') ? <div className={styles.emptyType}>No search results</div>
      : <div className={styles.emptyFolder}>Empty folder</div>}
    </div>
  );
}
