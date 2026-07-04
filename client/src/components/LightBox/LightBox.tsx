import type { Photo } from "../../api/upload";
import styles from "./LightBox.module.css";
import { useEffect } from "react";
import { API_BASE } from "../../config/api";
import { formatSize } from "../../helpers/helpers";

type LightBoxTypes = {
  photos: Photo[];
  lightBoxIndex: number;
  setLightBoxIndex: (i: number) => void;
  handleDeletePhoto: (id: string) => void;
  handleRestore?: (id: string) => void;
  onClose: () => void;
};

export function LightBox({
  photos,
  lightBoxIndex,
  setLightBoxIndex,
  onClose,
  handleDeletePhoto,
  handleRestore,
}: LightBoxTypes) {
  const photo = photos[lightBoxIndex];

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
        if (lightBoxIndex === photos.length - 1) {
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
      <div className={styles.detailsContainer}>
        <p>Photo name: {photo.originalName}</p>
        <p>Weight: {formatSize(photo.size)} - {!! photo.metadata?.ExifImageHeight && `Resolution: ${String(photo.metadata.ExifImageWidth)} x ${String(photo.metadata?.ExifImageHeight)}`}</p>
        <p>Created at: {new Date(photo.createdAt).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          ,{" "}
          {new Date(photo.createdAt).toLocaleTimeString("it-IT", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>

        {!! photo.metadata?.Make && <p>{String(photo.metadata.Make)} {String(photo.metadata?.Model)}</p>}
      </div>
      <img
        className={styles.image}
        src={`${API_BASE}${photo.url}`}
        alt={photo.id}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className={styles.deleteButton}
        onClick={() => handleDeletePhoto(photo.id)}
      >
        Delete
      </button>
      {handleRestore && (
        <button onClick={() => handleRestore(photo.id)}>Restore</button>
      )}
    </div>
  );
}
