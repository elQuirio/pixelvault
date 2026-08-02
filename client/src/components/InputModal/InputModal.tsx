import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import styles from './InputModal.module.css';

type InputModalProps = {
    initialValue: string,
    mainLabel?: string,
    confirmBtnLabel: string,
    onConfirm: (input: string) => Promise<void>,
    onClose: () => void,
}

export function InputModal({initialValue, mainLabel='Insert value', confirmBtnLabel, onConfirm, onClose}: InputModalProps) {
  const [input, setInput] = useState(initialValue);

  useEffect(() => {
    const onKeyDownHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }

    document.addEventListener('keydown', onKeyDownHandler);
    return () => {document.removeEventListener('keydown', onKeyDownHandler)};

  }, [onClose]);

  function handleOnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onConfirm(input);
  }

  const modalContent = (<div onClick={onClose} className={styles.overlay}>
                            <form onSubmit={handleOnSubmit} onClick={(e) => e.stopPropagation()} className={styles.modal}>
                                <div className={styles.modalWrapper}>
                                <label htmlFor="input-value">{mainLabel}</label>
                                <input id='input-value' type="text" value={input} onChange={(e) => setInput(e.target.value)} autoFocus autoComplete="off"></input>
                                <button type="submit">{confirmBtnLabel}</button>
                                <button type="button" onClick={onClose}>Cancel</button>
                                </div>
                            </form>
                        </div>);


    return createPortal(modalContent, document.body);
}



