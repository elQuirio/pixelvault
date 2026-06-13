import styles from "./PhotoGrid.module.css";
import { Photo } from '../../api/upload';

type PhotoGridProps = {
  files: Photo[];
};

const API_BASE = "http://localhost:3000";

export function PhotoGrid({ files }: PhotoGridProps) {

  return (
    <div className={styles.gridContainer}>
      {files.map((u, i) => (
        <img key={u.id} className={styles.thumbnail} src={`${API_BASE}${u.url}`} alt={files[i].id} />
      ))}
    </div>
  );
}
