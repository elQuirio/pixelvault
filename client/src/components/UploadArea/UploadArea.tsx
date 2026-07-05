import styles from "./UploadArea.module.css";
import { useState } from "react";

type UploadAreaProps = {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
};

export function UploadArea({
  onFilesSelected,
  accept,
  multiple,
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleOnDrop(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  }

  function handleOnChange(e: React.ChangeEvent<HTMLInputElement>): void {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    onFilesSelected(files);
  }

  return (
    <label
      className={`${styles.dropzoneContainer} ${isDragging ? styles.dragging : ""}`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleOnDrop}
    >
      <span>Drop here your files...</span>
      <input
        type="file"
        onChange={handleOnChange}
        multiple={multiple ?? true}
        accept={accept ?? "*"}
        hidden
      ></input>
    </label>
  );
}
