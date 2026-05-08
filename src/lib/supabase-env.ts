/**
 * Lê e valida env do Supabase no build (Vite).
 * Use sempre `?? ""` antes de `.trim()` — senão `undefined?.trim().replace(...)` quebra em runtime.
 */
export function readSupabaseEnv(): { url: string; key: string } | null {
  const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim().replace(/^["']|["']$/g, "");
  if (!url || !key) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const normalizedUrl = u.href.replace(/\/$/, "");
    return { url: normalizedUrl, key };
  } catch {
    return null;
  }
}

export function isSupabaseEnvReady(): boolean {
  return readSupabaseEnv() !== null;
}
