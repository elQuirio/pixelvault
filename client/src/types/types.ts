
export type UploadedFile = {
  id: string;
  originalName: string;
  size: number;
  url: string;
};

export type UploadResponse = {
  data: {
    uploaded: UploadedFile[];
  };
};

export type Item = {
  id: string;
  url: string;
  thumbnail: string | null;
  originalName: string | null;
  visibleName: string;
  size: number;
  itemType: ItemType;
  createdAt: string;
  metadata: Record<string, unknown | null>;
  childCount: number;
  folderCount: number;
};

export type ItemsResponse = {
  data: {
    items: Item[];
  };
};

export type ItemResponse = {
  data: {
    item: {
      id: string, 
      itemType: ItemType, 
      visibleName: string, 
      createdAt: string 
    };
  }
}

export type ItemType = 'folder' | 'image' | 'video' | 'file';

export type Result<T, E> = | { ok: true, data: T } | { ok: false, error: E };