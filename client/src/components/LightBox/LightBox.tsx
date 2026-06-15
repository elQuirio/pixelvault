import { Photo } from "../../api/upload";
import styles from "./LightBox.module.css";
import { useEffect } from "react";
import { deletePhoto } from '../../api/upload';

type LightBoxTypes = {
  photos: Photo[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  onClose: () => void;
};

const API_BASE = "http://localhost:3000";

export function LightBox({ photos, selectedIndex, setSelectedIndex, onClose, handleDeletePhoto }: LightBoxTypes) {
  const photo = photos[selectedIndex];

    useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      else if (e.key === 'ArrowLeft') {
        if (selectedIndex === 0) {
          onClose()
        } else {
          setSelectedIndex(selectedIndex-1);
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedIndex === photos.length-1) {
          onClose();
        } else {
          setSelectedIndex(selectedIndex+1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, setSelectedIndex, selectedIndex]);

  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <img
        className={styles.image}
        src={`${API_BASE}${photo.url}`}
        alt={photo.id}
        onClick={(e) => e.stopPropagation()}
      />
      <button className={styles.deleteButton} onClick={() => handleDeletePhoto(photo.id)} >Delete</button>
    </div>
  );
}
