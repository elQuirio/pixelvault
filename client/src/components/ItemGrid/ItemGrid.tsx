import styles from "./ItemGrid.module.css";
import type { Item } from "../../api/upload";
import { useEffect, useState } from "react";
import { LightBox } from "../LightBox/LightBox";
import { API_BASE } from "../../config/api";
import { TypeIcon } from "../TypeIcon/TypeIcon";
import { Toolbar } from "../Toolbar/ToolBar";

type ItemGridProps = {
  files: Item[];
  handleDeleteItem: (id: string) => void;
  handleDeleteBulkClick: (ids: string[]) => void;
  handleRestore?: (id: string) => void;
  handleBulkRestore?: (ids: string[]) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  onFolderOpen?: (id: string, name: string) => void;
};

export function ItemGrid({ files, handleDeleteItem, handleDeleteBulkClick, sortBy, setSortBy, handleRestore, handleBulkRestore, onFolderOpen }: ItemGridProps) {
  const [lightBoxIndex, setLightBoxIndex] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const mediaItems = files.filter((f) => f.itemType !== "folder");

  const toggleSelectMode = () => {
    setIsSelectMode((prev: boolean) => !prev);
  };

  const handleCheckboxOnChange = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev.filter((i) => i !== id)]);
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleOnClick = (u: Item) => {
    if (isSelectMode) {
      handleCheckboxOnChange(u.id);
      return;
    }
    if (u.itemType === "folder") {
      onFolderOpen?.(u.id, u.visibleName);
      return;
    }
    setLightBoxIndex(mediaItems.findIndex((m) => u.id === m.id));
  };

  function onBulkDelete(selectedIds: string[]) {
    handleDeleteBulkClick(selectedIds);
    toggleSelectMode();
  }

  function onBulkRestore(selectedIds: string[]) {
    handleBulkRestore?.(selectedIds);
    toggleSelectMode();
  }


  useEffect(() => {
    if (lightBoxIndex === null) return;
    if (mediaItems.length === 0) {
      setLightBoxIndex(null);
    } else if (lightBoxIndex >= mediaItems.length) {
      setLightBoxIndex(mediaItems.length - 1);
    }
  }, [mediaItems.length, lightBoxIndex]);

  return (
    <div>
      <Toolbar isSelectMode={isSelectMode} toggleSelectMode={toggleSelectMode} sortBy={sortBy} setSortBy={setSortBy} onBulkDelete={() => onBulkDelete(selectedIds)} onBulkRestore={handleBulkRestore && (() => onBulkRestore(selectedIds))} />
      <div className={styles.gridContainer}>
        {files.map((u, i) => (
          <div key={u.id} className={styles.thumbnailContainer}>
            {isSelectMode && (
              <input type="checkbox" className={styles.selectionCheckbox} checked={selectedIds.includes(u.id)} onChange={() => handleCheckboxOnChange(u.id)} />
            )}
            {u.thumbnail ? (
              <img className={styles.thumbnail} src={`${API_BASE}${u.thumbnail}`} alt={files[i].id} onClick={() => handleOnClick(u)}/>
            ) : (
              <TypeIcon itemType={u.itemType} onClick={() => handleOnClick(u)}/>
            )}
            <p className={styles.itemName}>{u.visibleName}</p>
          </div>
        ))}
        {lightBoxIndex !== null && (
          <LightBox items={mediaItems} lightBoxIndex={lightBoxIndex} setLightBoxIndex={setLightBoxIndex} onClose={() => setLightBoxIndex(null)} handleDeleteItem={handleDeleteItem} handleRestore={handleRestore}/>
        )}
      </div>
    </div>
  );
}
