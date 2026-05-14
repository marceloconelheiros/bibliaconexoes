/**
 * Resolve URL de reprodução dos áudios.
 *
 * 1) `audio_tracks.audio_url` quando preenchido.
 * 2) Caso contrário: Storage — ver `getAudiosFileMode()` (`slug` vs `auto`) e prefixo/pastas em supabase-env.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  audiosTestamentFolderFromDb,
  getAudiosBucketId,
  getAudiosFileMode,
  getAudiosObjectPrefixPath,
  sanitizeEnvPlainValue,
} from "@/lib/supabase-env";

export type BookForAudio = {
  abbrev: string;
  name: string;
  testament?: string | null;
  /** Nome exacto da pasta no Storage; se null, deriva-se de `name` sem diacríticos. */
  audio_folder?: string | null;
};

/** Colisões após remover marcas: «Jó» viraria «Jo», igual ao abbrev de João. */
const STORAGE_ABBREV_OVERRIDE: Record<string, string> = {
  Jó: "Job",
};

export function abbrevToAudiosStorageSlug(abbrev: string): string {
  const t = abbrev.trim();
  if (!t) return t;
  const o = STORAGE_ABBREV_OVERRIDE[t];
  if (o) return o;
  return t.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Pasta do livro no bucket: `books.audio_folder` ou nome sem marcas diacríticas. */
export function bookStorageFolder(book: Pick<BookForAudio, "name" | "audio_folder">): string {
  const manual = book.audio_folder?.trim();
  if (manual) return manual;
  return book.name.normalize("NFD").replace(/\p{M}/gu, "").trim();
}

function psalmsGroupFileSuffix(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().toUpperCase();
  if (s === "" || s === "NONE") return null;
  return /^PS[1-5]$/.test(s) ? s : null;
}

function encodeStorageObjectPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

/** Nome do ficheiro só (ex.: Gn.mp3, Sl_PS1.mp3). */
export function getAudiosSlugFilename(
  track: { psalms_group: string | null },
  book?: Pick<BookForAudio, "abbrev">,
): string | null {
  if (!book?.abbrev?.trim()) return null;
  let slug = abbrevToAudiosStorageSlug(book.abbrev);
  slug = slug.replace(/[^A-Za-z0-9]/g, "");
  if (!slug) return null;
  const group = psalmsGroupFileSuffix(track.psalms_group);
  return group ? `${slug}_${group}.mp3` : `${slug}.mp3`;
}

/** Diretório dentro do bucket até à pasta do livro (sem nome do .mp3). Só quando há prefixo configurado. */
export function getAudiosBookDirectoryPath(
  track: { psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  if (!book?.name?.trim() || !book?.abbrev?.trim()) return null;
  const prefix = getAudiosObjectPrefixPath();
  if (!prefix) return null;
  const testamentFolder = audiosTestamentFolderFromDb(book.testament);
  const bookFolder = bookStorageFolder(book);
  return `${prefix}/${testamentFolder}/${bookFolder}`;
}

/**
 * Caminho completo do objeto no bucket (modo `slug`: nome derivado do abbrev).
 * Sem prefixo → só `Gn.mp3` na raiz do bucket.
 */
export function getAudiosObjectPath(
  track: { psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  const filename = getAudiosSlugFilename(track, book);
  if (!filename) return null;
  const dir = getAudiosBookDirectoryPath(track, book);
  if (dir) return `${dir}/${filename}`;
  return filename;
}

export function fixSupabaseStoragePublicUrl(url: string): string {
  return url.trim().replace(/\/rest\/v1\/object\//gi, "/storage/v1/object/");
}

export function getAudioPlaybackUrl(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  const direct = track.audio_url?.trim();
  if (direct) return fixSupabaseStoragePublicUrl(direct);

  if (getAudiosFileMode() === "auto" && getAudiosObjectPrefixPath()) {
    return null;
  }

  const path = getAudiosObjectPath(track, book);
  if (!path) return null;

  const explicitRaw = sanitizeEnvPlainValue(import.meta.env.VITE_PUBLIC_AUDIO_BASE_URL ?? "").replace(/\/$/, "");
  if (explicitRaw) {
    if (/supabase\.com\/dashboard/i.test(explicitRaw)) return null;
    const explicit = fixSupabaseStoragePublicUrl(explicitRaw);
    return fixSupabaseStoragePublicUrl(`${explicit}/${encodeStorageObjectPath(path)}`);
  }

  const bucket = getAudiosBucketId();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return fixSupabaseStoragePublicUrl(data.publicUrl);
}

export type ResolvedAudiosPlayback = {
  publicUrl: string;
  objectPath: string;
};

/** Resolve URL final; em modo `auto` lista a pasta do livro no Storage e escolhe um .mp3. */
export async function resolveAudiosPlaybackUrl(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): Promise<ResolvedAudiosPlayback | null> {
  const direct = track.audio_url?.trim();
  if (direct) {
    const u = fixSupabaseStoragePublicUrl(direct);
    return { publicUrl: u, objectPath: direct };
  }

  const bucket = getAudiosBucketId();
  const explicitRaw = sanitizeEnvPlainValue(import.meta.env.VITE_PUBLIC_AUDIO_BASE_URL ?? "").replace(/\/$/, "");

  const slugPath = getAudiosObjectPath(track, book);
  const slugName = getAudiosSlugFilename(track, book);

  const useAuto = getAudiosFileMode() === "auto" && !!getAudiosObjectPrefixPath();
  const dir = getAudiosBookDirectoryPath(track, book);

  if (useAuto && dir) {
    const { data: entries, error } = await supabase.storage.from(bucket).list(dir, {
      limit: 200,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      console.error("[Áudio] list", dir, error);
    }
    const mp3s =
      entries?.filter((e) => {
        if (!e?.name) return false;
        const n = e.name.toLowerCase();
        return n.endsWith(".mp3") && !n.endsWith("/");
      }) ?? [];

    if (mp3s.length > 0) {
      let pick = slugName ? mp3s.find((f) => f.name === slugName) : undefined;
      if (!pick) pick = mp3s.length === 1 ? mp3s[0] : mp3s[0];
      const objectPath = `${dir}/${pick.name}`;
      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      return { publicUrl: fixSupabaseStoragePublicUrl(data.publicUrl), objectPath };
    }
  }

  if (!slugPath) return null;

  if (explicitRaw) {
    if (/supabase\.com\/dashboard/i.test(explicitRaw)) return null;
    const explicit = fixSupabaseStoragePublicUrl(explicitRaw);
    const publicUrl = fixSupabaseStoragePublicUrl(`${explicit}/${encodeStorageObjectPath(slugPath)}`);
    return { publicUrl, objectPath: slugPath };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(slugPath);
  return {
    publicUrl: fixSupabaseStoragePublicUrl(data.publicUrl),
    objectPath: slugPath,
  };
}

/** Para UI: há caminho/base para tentar áudio (inclui modo auto + prefix). */
export function audiosBuiltInPlaybackConfigured(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): boolean {
  if (track.audio_url?.trim()) return true;
  if (!book?.abbrev?.trim()) return false;
  if (getAudiosObjectPrefixPath()) {
    return !!(book.name?.trim() && getAudiosBookDirectoryPath(track, book));
  }
  return !!getAudiosSlugFilename(track, book);
}
