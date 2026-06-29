import { useState, useEffect } from "react";

export function useErrorToast(duration = 3500) {
    const [error, setError] = useState<string|null>(null);
    
    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), duration);
        return () => clearTimeout(timer);
    }, [error, duration]);

    return [error, setError] as const;
}