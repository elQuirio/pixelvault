import styles from "./UploadArea.module.css";
import { useState } from "react";
import { Gauge } from "../Gauge/Gauge.tsx";
import { useUpload } from "../../hooks/useUpload.ts";

type UploadAreaProps = {
  onComplete?: () => void;
  parentId: null|string;
  accept?: string;
  multiple?: boolean;
};

export function UploadArea({ accept, multiple, onComplete, parentId }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const {done, total, isUploading, uploadFiles} = useUpload({onComplete});

  function handleDrop(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files, parentId);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    uploadFiles(files, parentId);
  }

  return (
    <label
      className={`${styles.dropzoneContainer} ${isDragging ? styles.dragging : ""}`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
    { isUploading ? (<>
                      <p className="status">Uploading...{done}/{total}</p>
                      <Gauge done={done} total={total}/>
                    </>)
      : <span>Drop here your files...</span>
      }

      <input type="file" onChange={handleChange} multiple={multiple ?? true} accept={accept ?? "*"} hidden></input>
    </label>
  );
}
