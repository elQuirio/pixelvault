import { API_BASE } from "../config/api";

type UploadedFile = {
  id: string;
  originalName: string;
  size: number;
  url: string;
};

type UploadResponse = {
  data: {
    uploaded: UploadedFile[];
  };
};

export type Item = {
  id: string;
  url: string;
  thumbnail: string | null;
  originalName: string;
  visibleName: string;
  size: number;
  itemType: string;
  createdAt: string;
  metadata: Record<string, unknown | null>;

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
      itemType: string, 
      visibleName: string, 
      createdAt: string 
    };
  }
}


export async function uploadOne(file: File, parentId: string | null = null) {
  const formData = new FormData();
  formData.append("file", file);
  const params = new URLSearchParams();
  if (parentId) params.set('parentId', parentId);

  const res = await fetch(`${API_BASE}/upload?${params}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<UploadResponse>;
}


export async function getItems(options: {sortBy?: string, parentId?: string, type?: string[], deleted?: boolean} = {}) {
  const params = new URLSearchParams();
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.parentId) params.set('parentId', options.parentId);
  if (options.type) params.set('type', options.type.join(','));
  if (options.deleted) params.set('deleted', 'true');

  const res = await fetch(`${API_BASE}/items?${params}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error fetching items: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<ItemsResponse>;
}


export async function createFolder({visibleName, parentId}: {visibleName: string, parentId?: string}) {
  const body : {visibleName: string, parentId?: null|string} = {visibleName };
  if (parentId && parentId !== 'root') body.parentId = parentId;

  const resp = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`Error creating folder: ${resp.status} ${resp.statusText}`)
  }

  return resp.json() as Promise<ItemResponse>;
}


export async function deleteItem(id: string) {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error deleting id: ${id}`);
  }
  return;
}


export async function deleteItemsBulk(ids: string[]) {
  const res = await fetch(`${API_BASE}/items`, {
    method: "DELETE",
    headers: { "Content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ids: ids }),
  });

  if (!res.ok) {
    throw new Error(`Error deleting ids`);
  }

  return;
}


export async function restoreItem(id: string) {
  const resp = await fetch(`${API_BASE}/items/${id}/restore`,{
    method: 'POST',
    credentials: 'include',
  });
  if (!resp.ok) {
    throw new Error(`Error deleting id: ${id}`);
  }
  return;
}


export async function restoreItemsBulk(ids: string[]) {
  const resp = await fetch(`${API_BASE}/items/restore`,{
    method: 'POST',
    headers: { "Content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ ids: ids }),
  });

  if (!resp.ok) {
    throw new Error(`Error restoring ids`);
  }
  return;
}


export async function permanentDelete(id: string) {
  const resp = await fetch(`${API_BASE}/items/${id}/permanent`,{
    method: 'DELETE',
    credentials: 'include',
  });

  if (!resp.ok) {
    throw new Error(`Error deleting id: ${id}`);
  }
  return;
}


export async function permanentDeleteBulk(ids: string[]) {
  const resp = await fetch(`${API_BASE}/items/permanent`,{
    method: 'DELETE',
    headers: { "Content-type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ ids: ids }),
  });

  if (!resp.ok) {
    throw new Error(`Error deleting ids`);
  }
  return;
}


export async function getStorage() {
  const resp = await fetch(`${API_BASE}/storage`, {
    method: 'GET',
    credentials: 'include',
  });

  if(!resp.ok) {
    throw new Error(`Error fetching storage usage: ${resp.status} ${resp.statusText}`);
  }
  const { data } = await resp.json() as {data: {used: number}};
  return data.used;
}