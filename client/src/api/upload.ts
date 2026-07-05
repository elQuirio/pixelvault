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

export async function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("file", f));

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<UploadResponse>;
}


export async function uploadOne(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<UploadResponse>;
}


export async function getItems(sortBy: string) {
  const res = await fetch(`${API_BASE}/items?sortBy=${sortBy}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error fetching items: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<ItemsResponse>;
}

export async function getTrash(sortBy: string) {
  const res = await fetch(`${API_BASE}/items/trash?sortBy=${sortBy}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error fetching items: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<ItemsResponse>;
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