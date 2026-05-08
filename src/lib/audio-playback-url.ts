/**
 * Resolve a URL final para reprodução.
 *
 * 1) `audio_tracks.audio_url` quando preenchido no Supabase.
 * 2) `VITE_PUBLIC_AUDIO_BASE_URL` + `{abbrev}.mp3` ou `{abbrev}_{PS1…}.mp3` (Salmos).
 * 3) Automático: `{VITE_SUPABASE_URL}/storage/v1/object/public/audios/` + mesmo padrão de arquivo,
 *    para não precisar da variável extra se os MP3 já estão no bucket público `audios`.
 */
export type BookForAudio = {
  abbrev: string;
};

function trimSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/** Base do bucket público `audios` (sem barra no final). */
export function getPublicAudiosBucketBase(): string | null {
  const explicit = (import.meta.env.VITE_PUBLIC_AUDIO_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const projectUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
  if (!projectUrl) return null;

  return `${trimSlash(projectUrl)}/storage/v1/object/public/audios`;
}

export function getAudioPlaybackUrl(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  const direct = track.audio_url?.trim();
  if (direct) return direct;

  const base = getPublicAudiosBucketBase();
  if (!base || !book?.abbrev?.trim()) return null;

  const abbrev = book.abbrev.trim();
  const group = track.psalms_group;

  if (group && group !== "NONE") {
    return `${base}/${encodeURIComponent(abbrev)}_${group}.mp3`;
  }
  return `${base}/${encodeURIComponent(abbrev)}.mp3`;
}
