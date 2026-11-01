import { useStorageDetails } from "../../hooks/useStorageDetails";
//import styles from './Storage.module.css'
import { StorageStats } from "./StorageStats";
//import { useItems } from "../../hooks/useItems";


export function Storage() {
    const { details } = useStorageDetails();
    //const {items, removeItems, sortBy, setSortBy, reload, patchItem, loading } = useItems({type: itemType === 'all' ? ['image', 'video'] : [itemType]});

    if (!details) return <p>Loading...</p>;

    return  <div>
                <StorageStats stats={details}/>
                 {/*<ItemGrid
                        items={filtered}
                        isLoading={loading}
                        onDelete={handleDeleteClick}
                        onDeleteBulk={handleDeleteClick}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        query={query}
                        itemType={itemType}
                        setItemType={setItemType}
                        typeOptions={['video', 'image']}
                        onRename={(item) => setModal({mode:'rename', item})}
                      />*/}
            </div>
}