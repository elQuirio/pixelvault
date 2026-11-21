import { API_BASE } from "../config/api";
import type { SemanticSearchResponse } from "../types/types";
import { throwIfNotOk } from "./apiHelpers";

export async function getSemanticSearch({query, tags}: {query?: string, tags?: string[]}) {
  
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (tags && tags.length > 0) params.set('tags', tags.join(','));

  const res = await fetch(`${API_BASE}/search?${params}`, {
    method: "GET",
    credentials: "include",
  });

  await throwIfNotOk(res, 'Error searching items');
  
  const jsonResp = await res.json() as SemanticSearchResponse;
  return jsonResp.data;
}