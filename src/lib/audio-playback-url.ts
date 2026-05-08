/**
 * Resolve URL de reprodução dos áudios.
 *
 * 1) `audio_tracks.audio_url` quando preenchido.
 * 2) Caso contrário: objeto na raiz do bucket Storage **audios**, nome
 *    `{abbrev}.mp3` ou `{abbrev}_{PS1…}.mp3` (Salmos). Usa `getPublicUrl` do SDK.
 */
import { supabase } from "@/integrations/supabase/client";

export type BookForAudio = {
  abbrev: string;
};

/** Caminho do objeto dentro do bucket `audios` (ex.: `Gn.mp3`, `Sl_PS1.mp3`). */
export function getAudiosObjectPath(
  track: { psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  if (!book?.abbrev?.trim()) return null;
  const abbrev = book.abbrev.trim();
  const group = track.psalms_group;
  if (group && group !== "NONE") {
    return `${abbrev}_${group}.mp3`;
  }
  return `${abbrev}.mp3`;
}

export function getAudioPlaybackUrl(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  const direct = track.audio_url?.trim();
  if (direct) return direct;

  const path = getAudiosObjectPath(track, book);
  if (!path) return null;

  const explicit = (import.meta.env.VITE_PUBLIC_AUDIO_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (explicit) {
    return `${explicit}/${encodeURIComponent(path)}`;
  }

  const { data } = supabase.storage.from("audios").getPublicUrl(path);
  return data.publicUrl;
}
