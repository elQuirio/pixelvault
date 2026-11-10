import { API_BASE } from "../config/api";
import type { SemanticSearchResponse } from "../types/types";

export async function getSemanticSearch({query}: {query: string}) {
  const params = new URLSearchParams();
  params.set('q', query);

  const res = await fetch(`${API_BASE}/search?${params}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error searching items: ${res.status} ${res.statusText}`);
  }
  const jsonResp = await res.json() as SemanticSearchResponse;
  return jsonResp.data;
}