import { useState } from "react";
import { Modal } from "../Modal/Modal";
import styles from './InputModal.module.css';


type InputModalProps = {
    initialValue: string,
    mainLabel?: string,
    mode: 'create'|'rename',
    confirmBtnLabel: string,
    onConfirm: (input: string) => Promise<void>,
    onClose: () => void,
}

export function InputModal({initialValue, mainLabel, mode, confirmBtnLabel, onConfirm, onClose}: InputModalProps) {
  const [input, setInput] = useState(initialValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onConfirm(input);
  }
  let defaultMainLabel: string = 'Insert name';
  if (mode === 'create') {
    defaultMainLabel= 'Insert folder name';
  } else if (mode === 'rename') {
    defaultMainLabel= 'Insert new name';
  }

  const modalContent = (<form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className={styles.modal}>
                                <div className={styles.modalWrapper}>
                                <label className={styles.modalLabel} htmlFor="input-value">{mainLabel ?? defaultMainLabel}</label>
                                <input className={styles.modalInput} id='input-value' type="text" value={input} onChange={(e) => setInput(e.target.value)} autoFocus autoComplete="off"></input>
                                <div className={styles.modalButtonsWrapper}>
                                  <button type="submit">{confirmBtnLabel}</button>
                                  <button type="button" onClick={onClose}>Cancel</button>
                                </div>
                                </div>
                            </form>);

    return <Modal onClose={onClose} modalContent={modalContent}/>
}



