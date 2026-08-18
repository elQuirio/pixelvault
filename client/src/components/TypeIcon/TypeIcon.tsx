import { FileText, Folder, Video } from "lucide-react";
import styles from './TypeIcon.module.css';

type TypeIconProps = {
    itemType: string;
    itemCount?: number;
    onClick: () => void;
}

export function TypeIcon({itemType, onClick, itemCount}: TypeIconProps) {
    
    const itemString = `${itemCount ?? 0} item${itemCount === 1 ? '' : 's'}`;

    const getIcon = (itemType: string) => {

        switch (itemType){
            case 'folder': return <><Folder className={styles.typeIcon} size={50}/><div className={styles.folderStats}>{itemString}</div></>
            case 'video': return <Video className={styles.typeIcon} size={50}/>
            default: return <FileText className={styles.typeIcon} size={50}/>
        }
    }

    return  <div className={styles.typeIconContainer} onClick={onClick}>
                {getIcon(itemType)}
            </div>

}