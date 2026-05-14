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

/** ID do bucket Storage dos MP3 (migração usa `audios`). Use `VITE_SUPABASE_AUDIOS_BUCKET` se o id no Dashboard for outro. */
export function getAudiosBucketId(): string {
  const id = (import.meta.env.VITE_SUPABASE_AUDIOS_BUCKET ?? "").trim();
  return id || "audios";
}

/**
 * Caminho dentro do bucket antes da pasta do testamento e do ficheiro.
 * Ex.: `files/audio/biblia` (sem barra inicial/final). Vazio = ficheiros na raiz do bucket.
 */
export function getAudiosObjectPrefixPath(): string {
  const p = (import.meta.env.VITE_SUPABASE_AUDIOS_PREFIX ?? "").trim();
  if (!p) return "";
  return p.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
}

/**
 * Nome da pasta de testamento dentro do prefixo (livros `books.testament`: OT / NT).
 * Por defeito coincide com pastas em português no Storage.
 */
export function getAudiosTestamentFolder(testament: string | null | undefined): string {
  const t = (testament ?? "").trim().toUpperCase();
  const nt = (import.meta.env.VITE_SUPABASE_AUDIOS_FOLDER_NT ?? "").trim() || "Novo Testamento";
  const ot = (import.meta.env.VITE_SUPABASE_AUDIOS_FOLDER_OT ?? "").trim() || "Velho Testamento";
  return t === "NT" ? nt : ot;
}
