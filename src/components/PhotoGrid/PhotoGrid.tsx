import { useEffect, useState } from "react";
import styles from "./PhotoGrid.module.css";

type PhotoGridProps = {
  files: File[];
};

export function PhotoGrid({ files }: PhotoGridProps) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setUrls(newUrls);

    return () => {
      newUrls.forEach((u) => {
        URL.revokeObjectURL(u);
      });
    };
  }, [files]);

  return (
    <div className={styles.gridContainer}>
      {urls.map((u, i) => (
        <img key={u} className={styles.thumbnail} src={u} alt={files[i].name} />
      ))}
    </div>
  );
}
