/**
 * Resolve a URL final para reprodução.
 * 1) Usa `audio_tracks.audio_url` quando preenchido no Supabase.
 * 2) Caso contrário, se existir VITE_PUBLIC_AUDIO_BASE_URL, monta o caminho no bucket público `audios`:
 *    - Livros normais: `{BASE}/{abbrev}.mp3` (abbrev como em `public.books.abbrev`)
 *    - Salmos (faixas PS1…PS5): `{BASE}/{abbrev}_{PS1|PS2|…}.mp3`
 */
export type BookForAudio = {
  abbrev: string;
};

export function getAudioPlaybackUrl(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  const direct = track.audio_url?.trim();
  if (direct) return direct;

  const rawBase = import.meta.env.VITE_PUBLIC_AUDIO_BASE_URL?.trim();
  if (!rawBase || !book?.abbrev?.trim()) return null;

  const base = rawBase.replace(/\/$/, "");
  const abbrev = book.abbrev.trim();
  const group = track.psalms_group;

  if (group && group !== "NONE") {
    return `${base}/${abbrev}_${group}.mp3`;
  }
  return `${base}/${abbrev}.mp3`;
}
