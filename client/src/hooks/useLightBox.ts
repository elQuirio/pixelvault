import { useState } from "react";
import type { Item } from "../api/upload";

export function useLightBox (mediaItems: Item[]) {
    const [lightBoxIndex, setLightBoxIndex] = useState<number | null>(null);

    const closeLightBox = () => {
        setLightBoxIndex(null);
    };

    if (lightBoxIndex !== null && lightBoxIndex >= mediaItems.length) {
        setLightBoxIndex(mediaItems.length === 0 ? null : mediaItems.length - 1);
    }

    return { lightBoxIndex, setLightBoxIndex, closeLightBox};
}