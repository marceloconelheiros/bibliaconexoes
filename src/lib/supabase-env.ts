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
 * Remove aspas e `VAR=value` **repetido** no início (valor colado tipo Vercel/`.env`).
 * Aceita tanto `VAR=…` tipo `VITE_*` como outras variáveis em CAPS snake case.
 */
export function sanitizeEnvPlainValue(raw: string | undefined): string {
  if (raw == null) return "";
  let t = raw.trim().replace(/^["']|["']$/g, "");
  for (let i = 0; i < 5; i++) {
    const prev = t;
    t = t.replace(/^VITE_[A-Z0-9_]+\s*=\s*/i, "").trim();
    // `NOME=value` quando alguém cola o valor errado inteiro na Vercel
    t = t.replace(/^[A-Z][A-Z0-9_]{2,}\s*=\s*/, "").trim();
    if (t === prev) break;
    t = t.replace(/^["']|["']$/g, "").trim();
  }
  return t.replace(/^["']|["']$/g, "");
}

/** Igual ao filtro del prefix «Biblia» — remove `file/audios`/bucket errados no arranque. */
export function stripLeadingAudiosNoiseSegments(parts: string[]): string[] {
  let segments = [...parts];
  while (
    segments.length >= 2 &&
    segments[0].toLowerCase() === "file" &&
    segments[1].toLowerCase() === "audios"
  ) {
    segments = segments.slice(2);
  }
  while (segments.length >= 1 && segments[0].toLowerCase() === "audios") {
    segments = segments.slice(1);
  }
  return segments.filter((x) => x !== "");
}

/** Segmento de prefixo inválido (outra variável colada ou nome=valor). */
function cleanAudiosPrefixSegment(seg: string): string | null {
  const s = sanitizeEnvPlainValue(seg).trim();
  if (!s) return null;
  if (/^[A-Za-z_][\w]+\s*=/.test(s)) return null;
  return s;
}

/** ID do bucket Storage dos MP3 (migração usa `audios`). Use `VITE_SUPABASE_AUDIOS_BUCKET` se o id no Dashboard for outro. */
export function getAudiosBucketId(): string {
  const id = sanitizeEnvPlainValue(import.meta.env.VITE_SUPABASE_AUDIOS_BUCKET ?? "");
  return id || "audios";
}

/**
 * Só o primeiro nível dentro do bucket (ex.: **Biblia**).
 * Não incluir «Velho/Novo Testamento», nem «audios», nem `file/…` copiados do Dashboard.
 */
export function getAudiosObjectPrefixPath(): string {
  let p = sanitizeEnvPlainValue(import.meta.env.VITE_SUPABASE_AUDIOS_PREFIX ?? "");
  if (!p) return "";
  if (/https?:\/\//i.test(p) || /supabase\.com\/dashboard/i.test(p)) return "";

  let segments = p
    .split("/")
    .map((seg) => cleanAudiosPrefixSegment(seg))
    .filter((x): x is string => x != null && x.length > 0);

  segments = stripLeadingAudiosNoiseSegments(segments);
  segments = segments.filter((s) => s !== "Velho Testamento" && s !== "Novo Testamento");

  return segments.join("/").replace(/\/{2,}/g, "/");
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
