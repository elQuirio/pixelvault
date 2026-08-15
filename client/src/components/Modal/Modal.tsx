import { createPortal } from "react-dom";
import { useEffect } from "react";
import styles from './Modal.module.css';

type ModalProps = {
    onClose: () => void,
    modalContent: React.ReactNode,
}

export function Modal({onClose, modalContent}: ModalProps) {

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {document.removeEventListener('keydown', handleKeyDown)};

  }, [onClose]);


  const modalWrap = (<div onClick={onClose} className={styles.overlay}>
                            { modalContent }
                        </div>);


    return createPortal(modalWrap, document.body);
}



