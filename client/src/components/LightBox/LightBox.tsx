import type { Item } from "../../api/upload";
import styles from "./LightBox.module.css";
import { useEffect } from "react";
import { API_BASE } from "../../config/api";
import { formatSize } from "../../helpers/helpers";

type LightBoxTypes = {
  items: Item[];
  lightBoxIndex: number;
  setLightBoxIndex: (i: number) => void;
  handleDeleteItem: (id: string) => void;
  handleRestore?: (id: string) => void;
  onClose: () => void;
};

export function LightBox({ items, lightBoxIndex, setLightBoxIndex, onClose, handleDeleteItem, handleRestore }: LightBoxTypes) {
  const item = items[lightBoxIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (lightBoxIndex === 0) {
          onClose();
        } else {
          setLightBoxIndex(lightBoxIndex - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (lightBoxIndex === items.length - 1) {
          onClose();
        } else {
          setLightBoxIndex(lightBoxIndex + 1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, setLightBoxIndex, lightBoxIndex]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.detailsContainer} onClick={(e) => e.stopPropagation()}>
        <p>Item name: {item.originalName}</p>
        <p>Weight: {formatSize(item.size)}{!! item.metadata?.ExifImageHeight && ` - Resolution: ${String(item.metadata.ExifImageWidth)} x ${String(item.metadata?.ExifImageHeight)}`}</p>
        <p>Created at: {new Date(item.createdAt).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          ,{" "}
          {new Date(item.createdAt).toLocaleTimeString("it-IT", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>

        {!! item.metadata?.Make && <p>{String(item.metadata.Make)} {String(item.metadata?.Model)}</p>}
      </div>
      <img className={styles.image} src={`${API_BASE}${item.url}`} alt={item.id} onClick={(e) => e.stopPropagation()} />
      <div>
          <button className={styles.deleteButton} onClick={() => handleDeleteItem(item.id)} >Delete</button>
          {handleRestore && (<button onClick={() => handleRestore(item.id)}>Restore</button>)}
      </div>
    </div>
  );
}
