import type { Photo } from "../../api/upload";
import styles from "./LightBox.module.css";
import { useEffect } from "react";
import { API_BASE } from "../../config/api";

type LightBoxTypes = {
  photos: Photo[];
  lightBoxIndex: number;
  setLightBoxIndex: (i: number) => void;
  handleDeletePhoto: (id: string) => void;
  onClose: () => void;
};


export function LightBox({ photos, lightBoxIndex, setLightBoxIndex, onClose, handleDeletePhoto }: LightBoxTypes) {
  const photo = photos[lightBoxIndex];


    useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      else if (e.key === 'ArrowLeft') {
        if (lightBoxIndex === 0) {
          onClose()
        } else {
          setLightBoxIndex(lightBoxIndex-1);
        }
      } else if (e.key === 'ArrowRight') {
        if (lightBoxIndex === photos.length-1) {
          onClose();
        } else {
          setLightBoxIndex(lightBoxIndex+1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, setLightBoxIndex, lightBoxIndex]);

  
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
