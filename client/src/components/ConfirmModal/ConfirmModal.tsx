import { Modal } from "../Modal/Modal";
import styles from './ConfirmModal.module.css';

type ConfirmModalProps = {
    mainLabel?: string,
    confirmBtnLabel?: string,
    itemCount?: number,
    action: 'soft'|'permanent'|'restore',
    onConfirm: () => Promise<void>,
    onClose: () => void,
}

export function ConfirmModal({mainLabel, confirmBtnLabel='Confirm', itemCount, action, onConfirm, onClose}: ConfirmModalProps) {

  function handleOnSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm();
  }

  let defaultMainLabel: string = 'Are you sure?';
  let itemString: string = 'selected items';
  if (itemCount) {
    itemString = `${itemCount} ${(itemCount === 1) ? 'item': 'items'}`;
  }
  
  if (action === 'permanent') {
    defaultMainLabel = `Permanently delete ${itemString}?`;
  } else if (action === 'soft') {
    defaultMainLabel = `Move ${itemString} to trash?`;
  } else if (action === 'restore') {
     defaultMainLabel = `Restore ${itemString}?`;
  }

  const modalContent = (<form onSubmit={handleOnSubmit} onClick={(e) => e.stopPropagation()} className={styles.modal}>
                                <div className={styles.modalWrapper}>
                                <div>{mainLabel ?? defaultMainLabel}</div>
                                <button type="submit">{confirmBtnLabel}</button>
                                <button type="button" onClick={onClose}>Cancel</button>
                                </div>
                            </form>);

    return <Modal onClose={onClose} modalContent={modalContent}/>
}



