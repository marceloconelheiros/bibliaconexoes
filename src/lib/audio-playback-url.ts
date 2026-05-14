/**
 * Resolve URL de reprodução dos áudios.
 *
 * 1) `audio_tracks.audio_url` quando preenchido.
 * 2) Caso contrário: objeto no bucket Storage (id em `VITE_SUPABASE_AUDIOS_BUCKET`, por defeito audios).
 *    Caminho relativo: opcionalmente `VITE_SUPABASE_AUDIOS_PREFIX` + pasta OT/NT + `{slug}.mp3`
 *    ou `{slug}_{PS1…}.mp3` (Salmos). Sem prefixo = ficheiro na raiz do bucket.
 */
import { supabase } from "@/integrations/supabase/client";
import { getAudiosBucketId, getAudiosObjectPrefixPath, getAudiosTestamentFolder } from "@/lib/supabase-env";

export type BookForAudio = {
  abbrev: string;
  testament?: string | null;
};

/** Colisões após remover marcas: «Jó» viraria «Jo», igual ao abbrev de João. */
const STORAGE_ABBREV_OVERRIDE: Record<string, string> = {
  Jó: "Job",
};

/**
 * Parte do nome do ficheiro derivada de `books.abbrev` (não altera `audio_url`).
 */
export function abbrevToAudiosStorageSlug(abbrev: string): string {
  const t = abbrev.trim();
  if (!t) return t;
  const o = STORAGE_ABBREV_OVERRIDE[t];
  if (o) return o;
  return t.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Só aceita grupos de Salmos válidos; qualquer outro valor não altera o nome do ficheiro. */
function psalmsGroupFileSuffix(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().toUpperCase();
  if (s === "" || s === "NONE") return null;
  return /^PS[1-5]$/.test(s) ? s : null;
}

/** Codifica cada segmento do caminho do objeto (pastas com espaços, etc.). */
function encodeStorageObjectPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

/** Caminho do objeto dentro do bucket (ex.: `Gn.mp3` ou `files/audio/biblia/Velho Testamento/Gn.mp3`). */
export function getAudiosObjectPath(
  track: { psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  if (!book?.abbrev?.trim()) return null;
  let slug = abbrevToAudiosStorageSlug(book.abbrev);
  slug = slug.replace(/[^A-Za-z0-9]/g, "");
  if (!slug) return null;
  const group = psalmsGroupFileSuffix(track.psalms_group);
  const filename = group ? `${slug}_${group}.mp3` : `${slug}.mp3`;

  const prefix = getAudiosObjectPrefixPath();
  if (!prefix) return filename;

  const testamentFolder = getAudiosTestamentFolder(book.testament);
  return `${prefix}/${testamentFolder}/${filename}`;
}

/** Storage público: `/storage/v1/object/...`. `/rest/v1/object/...` é erro comum e devolve 401 «No API key». */
export function fixSupabaseStoragePublicUrl(url: string): string {
  return url.trim().replace(/\/rest\/v1\/object\//gi, "/storage/v1/object/");
}

export function getAudioPlaybackUrl(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  const direct = track.audio_url?.trim();
  if (direct) return fixSupabaseStoragePublicUrl(direct);

  const path = getAudiosObjectPath(track, book);
  if (!path) return null;

  const explicitRaw = (import.meta.env.VITE_PUBLIC_AUDIO_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (explicitRaw) {
    const explicit = fixSupabaseStoragePublicUrl(explicitRaw);
    return fixSupabaseStoragePublicUrl(`${explicit}/${encodeStorageObjectPath(path)}`);
  }

  const bucket = getAudiosBucketId();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return fixSupabaseStoragePublicUrl(data.publicUrl);
}
