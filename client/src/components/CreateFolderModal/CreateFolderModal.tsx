import { createPortal } from "react-dom";
import { useState } from "react";
import styles from './CreateFolderModal.module.css';

type createFolderProps = {
    initialValue: string,
    confirmBtnLabel: string,
    onConfirm: (newFolderName: string) => Promise<void>,
    onClose: () => void,
}

export function CreateFolderModal({initialValue, confirmBtnLabel, onConfirm, onClose}: createFolderProps) {
  const [name, setName] = useState(initialValue);

  function handleOnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name);
  }

  const modalContent = (<div onClick={onClose} className={styles.overlay}>
                            <form onSubmit={handleOnSubmit} onClick={(e) => e.stopPropagation()} className={styles.modal}>
                                <div className={styles.modalWrapper}>
                                <label htmlFor="new-folder-name-input">Insert name</label>
                                <input id='new-folder-name-input' type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus></input>
                                <button type="submit">{confirmBtnLabel}</button>
                                <button type="button" onClick={onClose}>Cancel</button>
                                </div>
                            </form>
                        </div>);


    return createPortal(modalContent, document.body);
}



