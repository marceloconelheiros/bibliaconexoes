/**
 * Resolve URL de reprodução dos áudios.
 *
 * 1) `audio_tracks.audio_url` quando preenchido.
 * 2) Caso contrário: objeto na raiz do bucket Storage **audios**, nome
 *    `{slug}.mp3` ou `{slug}_{PS1…}.mp3` (Salmos). O `slug` é o abbrev do livro
 *    sem diacríticos (ex.: Êx→Ex), para obedecer às regras de chave do Storage
 *    e coincidir com ficheiros típicos em ASCII. Usa `getPublicUrl` do SDK.
 */
import { supabase } from "@/integrations/supabase/client";

export type BookForAudio = {
  abbrev: string;
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

/** Caminho do objeto dentro do bucket `audios` (ex.: `Gn.mp3`, `Ex.mp3`, `Sl_PS1.mp3`). */
export function getAudiosObjectPath(
  track: { psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  if (!book?.abbrev?.trim()) return null;
  const slug = abbrevToAudiosStorageSlug(book.abbrev);
  if (!slug) return null;
  const group = track.psalms_group;
  if (group && group !== "NONE") {
    return `${slug}_${group}.mp3`;
  }
  return `${slug}.mp3`;
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
