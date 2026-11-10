import { API_BASE } from "../config/api";
import type { StorageDetails } from "../types/types";

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



export async function getStorageDetails() {
    const resp = await fetch(`${API_BASE}/storage/details`, {
        method: 'GET',
        credentials: 'include',
    })
  
    if(!resp.ok) {
        throw new Error(`Error fetching storage details: ${resp.status} ${resp.statusText}`);
    }
    const { data } = await resp.json() as {data: StorageDetails};

    return data;
}