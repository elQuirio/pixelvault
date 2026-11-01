import { useState, useEffect } from "react";
import type { StorageDetails } from "../types/types.ts";
import { useToast } from "../context/useToast.tsx";
import { getStorageDetails } from '../api/storage.ts';


export function useStorageDetails() {
    const [details, setDetails] = useState<StorageDetails | null>(null);

    const { showToast } = useToast();

    function loadDetails() {
    getStorageDetails().then((res) => {
        setDetails(res);
    }).catch((err) => {
        console.error(err);
        showToast('Error loading details', 'error');
    })
    }

    useEffect(() => {
        loadDetails();
    }, []);


  const loading = details === null;

  return { details, loading, reload: loadDetails };
}
