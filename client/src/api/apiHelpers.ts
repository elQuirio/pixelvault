export async function throwIfNotOk(res: Response, fallback: string) {
    if (res.ok) return;
    const body = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message ?? `${fallback}: ${res.status}`);
}