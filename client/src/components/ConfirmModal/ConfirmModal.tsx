import { Modal } from "../Modal/Modal";
import styles from './ConfirmModal.module.css';

type ConfirmModalProps = {
    mainLabel?: string,
    confirmBtnLabel?: string,
    itemCount?: number,
    mode: 'soft'|'permanent'|'restore',
    onConfirm: () => Promise<void>,
    onClose: () => void,
}

export function ConfirmModal({mainLabel, confirmBtnLabel='Confirm', itemCount, mode, onConfirm, onClose}: ConfirmModalProps) {

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm();
  }

  let defaultMainLabel: string = 'Are you sure?';
  let itemString: string = 'selected items';
  if (itemCount) {
    itemString = `${itemCount} ${(itemCount === 1) ? 'item': 'items'}`;
  }
  
  if (mode === 'permanent') {
    defaultMainLabel = `Permanently delete ${itemString}?`;
  } else if (mode === 'soft') {
    defaultMainLabel = `Move ${itemString} to trash?`;
  } else if (mode === 'restore') {
     defaultMainLabel = `Restore ${itemString}?`;
  }

  const modalContent = (<form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className={styles.modal}>
                                <div className={styles.modalWrapper}>
                                <div className={styles.modalLabel}>{mainLabel ?? defaultMainLabel}</div>
                                <div className={styles.modalButtonsWrapper}>
                                  <button type="submit">{confirmBtnLabel}</button>
                                  <button type="button" onClick={onClose}>Cancel</button>
                                </div>
                                </div>
                            </form>);

    return <Modal onClose={onClose} modalContent={modalContent}/>
}



