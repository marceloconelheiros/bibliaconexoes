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

/**
 * Remove aspas e o prefixo acidental `VITE_ALGO=` quando se cola a linha inteira no campo da Vercel.
 */
export function sanitizeEnvPlainValue(raw: string | undefined): string {
  if (raw == null) return "";
  let t = raw.trim().replace(/^["']|["']$/g, "");
  t = t.replace(/^VITE_[A-Z0-9_]+\s*=\s*/i, "").trim();
  return t.replace(/^["']|["']$/g, "");
}

/** ID do bucket Storage dos MP3 (migração usa `audios`). Use `VITE_SUPABASE_AUDIOS_BUCKET` se o id no Dashboard for outro. */
export function getAudiosBucketId(): string {
  const id = sanitizeEnvPlainValue(import.meta.env.VITE_SUPABASE_AUDIOS_BUCKET ?? "");
  return id || "audios";
}

/**
 * Caminho dentro do bucket até ao Velho/Novo Testamento (sem barra inicial/final).
 * Ex.: `Biblia`. Vazio = ficheiros na raiz do bucket.
 */
export function getAudiosObjectPrefixPath(): string {
  let p = sanitizeEnvPlainValue(import.meta.env.VITE_SUPABASE_AUDIOS_PREFIX ?? "");
  if (!p) return "";
  if (/https?:\/\//i.test(p) || /supabase\.com\/dashboard/i.test(p)) return "";
  return p.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
}

/** Pastas de testamento iguais ao layout típico no Storage (português). */
export function audiosTestamentFolderFromDb(testament: string | null | undefined): string {
  return (testament ?? "").trim().toUpperCase() === "NT" ? "Novo Testamento" : "Velho Testamento";
}

/** `slug` = nome fixo Gn.mp3 etc.; `auto` = listar pasta do livro no Storage e usar o .mp3 encontrado. */
export function getAudiosFileMode(): "slug" | "auto" {
  const m = sanitizeEnvPlainValue(import.meta.env.VITE_SUPABASE_AUDIOS_FILE_MODE ?? "").toLowerCase();
  return m === "auto" ? "auto" : "slug";
}
