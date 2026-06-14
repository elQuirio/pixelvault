import { Photo } from "../../api/upload";
import styles from "./LightBox.module.css";
import { useEffect } from "react";

type LightBoxTypes = {
  photo: Photo;
  onClose: () => void;
};

const API_BASE = "http://localhost:3000";

export function LightBox({ photo, onClose }: LightBoxTypes) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <img
        className={styles.image}
        src={`${API_BASE}${photo.url}`}
        alt={photo.id}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
