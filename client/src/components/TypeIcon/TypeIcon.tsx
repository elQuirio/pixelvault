import { FileText, Folder, Video } from "lucide-react";
import styles from './TypeIcon.module.css';

type TypeIconProps = {
    itemType: string;
    onClick: () => void;
}

export function TypeIcon({itemType, onClick}: TypeIconProps) {

    const getIcon = (itemType: string) => {
        switch (itemType){
            case 'folder': return <Folder className={styles.typeIcon} size={50}/>
            case 'video': return <Video className={styles.typeIcon} size={50}/>
            default: return <FileText className={styles.typeIcon} size={50}/>
        }
    }

    return <div className={styles.typeIconContainer} onClick={onClick}>{getIcon(itemType)}</div>

}