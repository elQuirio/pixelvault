
export type ItemType = 'folder' | 'image' | 'file' | 'video';

export const ITEM_TYPES = ['folder', 'image', 'file', 'video'] as const;

export type DuplicateItem = {
    id: string;
    url: string;
    thumbnail: string | null;
    originalName: string | null;
    visibleName: string;
    size: number | null;
    itemType: string;
    createdAt: Date | null;
    metadata: unknown;
    childCount: number;
    folderCount: number;
}