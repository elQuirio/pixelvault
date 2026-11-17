import { useTags } from "../../hooks/useTags.ts";
import { useState } from "react";
import type { Item } from "../../types/types.ts";
import styles from './TagEditor.module.css';
import { X } from 'lucide-react';

type TagEditorProps = {
    item: Item,
}


export function TagEditor({item}: TagEditorProps) {
    const { itemTags, addTag, removeTag } = useTags({itemId: item.id});
    const [draft, setDraft] = useState('');

    function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter') return;
        const name = e.currentTarget.value.trim();
        if (!name) return;
        addTag(name);
        setDraft('');
    }

    if (!itemTags) return <div></div>

    return  <div className={styles.tagEditor}>{itemTags.map((i) => <div key={i.tagId} className={styles.tag}>{i.tagName}<button className={styles.removeButton} onClick={() => removeTag(i.tagId)}><X size={12} strokeWidth={3}/></button></div>)}
                <input type='text' className={styles.tagInput} placeholder="+ add tag" value={draft} autoCapitalize='none' maxLength={50} onChange={(e) => setDraft(e.currentTarget.value)} style={{width: `${Math.max(draft.length, 8) + 3}ch`}} onKeyDown={(e) => handleAddTag(e)}/>
            </div>
}