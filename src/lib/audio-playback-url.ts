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
  stripLeadingAudiosNoiseSegments,
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

/**
 * Pasta exacta no bucket `…/Biblia/{Testamento}/` quando o nome PT na BD não coincide
 * com os nomes das pastas no Supabase (ASCII, sem acentos, ex.: Cantares de Salomao).
 */
const STORAGE_BOOK_FOLDER_PT: Record<string, string> = {
  "Cântico dos Cânticos": "Cantares de Salomao",
};

function asciiFoldPortuguese(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").trim();
}

export function abbrevToAudiosStorageSlug(abbrev: string): string {
  const t = abbrev.trim();
  if (!t) return t;
  const o = STORAGE_ABBREV_OVERRIDE[t];
  if (o) return o;
  return t.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Pasta do livro no bucket: `books.audio_folder` (sanitizado) ou nome alinhado ao Storage. */
export function bookStorageFolder(book: Pick<BookForAudio, "name" | "audio_folder">): string {
  const rawManual = book.audio_folder?.trim();
  if (rawManual) {
    let manual = sanitizeEnvPlainValue(rawManual).trim();
    let parts = stripLeadingAudiosNoiseSegments(
      manual
        .split("/")
        .map((x) => sanitizeEnvPlainValue(x).trim())
        .filter(Boolean),
    );

    if (parts[0]?.toLowerCase() === "biblia" && parts.length > 1) {
      parts = parts.slice(1);
    }
    parts = parts.filter((s) => s !== "Velho Testamento" && s !== "Novo Testamento");

    manual = parts.join("/").trim();
    if (/^[A-Za-z_][\w]+\s*=/.test(manual)) manual = "";
    if (manual) return manual;
  }

  const nameKey = book.name.trim();
  if (STORAGE_BOOK_FOLDER_PT[nameKey]) return STORAGE_BOOK_FOLDER_PT[nameKey];
  return asciiFoldPortuguese(nameKey);
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

/** Extensões de áudio tratadas como ficheiro único na pasta (não «pasta só com capítulos»). */
export function looksLikeAudioFilename(segment: string): boolean {
  return /\.(mp3|m4a|aac|ogg|wav|opus|webm)$/i.test(segment.trim());
}

/** Último segmento não é nome de ficheiro de áudio → trata-se como pasta (ex.: …/Genesis). */
export function isChapterFolderBucketPath(bucketRelativePath: string): boolean {
  const seg = bucketRelativePath.split("/").filter(Boolean).pop() ?? "";
  return seg !== "" && !looksLikeAudioFilename(seg);
}

/** Caminho do objecto dentro do bucket a partir de `audio_url` (path relativo ou URL pública). */
export function bucketPathFromDirectAudioInput(raw: string | null | undefined): string | null {
  const t = sanitizeEnvPlainValue(raw ?? "").trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    return bucketObjectPathFromPublicUrl(t);
  }
  const segments = t
    .split("/")
    .map((s) => sanitizeEnvPlainValue(s).trim())
    .filter(Boolean);
  const path = stripLeadingAudiosNoiseSegments(segments).join("/");
  return path || null;
}

/** Extrai «Biblia/…» a partir da URL pública do Storage. */
export function bucketObjectPathFromPublicUrl(url: string, bucketId?: string): string | null {
  const b = bucketId ?? getAudiosBucketId();
  const u = fixSupabaseStoragePublicUrl(url.trim());
  const needle = `/object/public/${b}/`;
  const idx = u.indexOf(needle);
  if (idx === -1) return null;
  let rest = u.slice(idx + needle.length).split("?")[0];
  try {
    return decodeURIComponent(rest).replace(/\/$/, "");
  } catch {
    return rest.replace(/\/$/, "");
  }
}

/**
 * Pasta no bucket onde estão MP3 por capítulo.
 * — `audio_url` sem ficheiro (ex.: …/Genesis) → essa pasta.
 * — Sem `audio_url`, faixa «normal» (não Salmos por grupo): pasta do livro com `VITE_SUPABASE_AUDIOS_PREFIX`.
 */
export function getAudiosChapterRootDirectoryPath(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  const direct = track.audio_url?.trim();
  if (direct) {
    const bp = bucketPathFromDirectAudioInput(direct);
    if (bp && isChapterFolderBucketPath(bp)) return bp.replace(/\/+$/, "");
    return null;
  }
  const grp = (track.psalms_group ?? "NONE").trim().toUpperCase();
  if (grp !== "NONE") return null;
  return getAudiosBookDirectoryPath(track, book);
}

export type ChapterMp3Item = {
  /** Número do capítulo inferido do nome do ficheiro (ou ordem). */
  chapter: number;
  fileName: string;
  objectPath: string;
  publicUrl: string;
};

function guessChapterFromFilename(fileName: string, orderIndex: number): number {
  const base = fileName.replace(/\.[^.]+$/i, "");
  const lead = base.match(/^(\d{1,3})\b/);
  if (lead) return parseInt(lead[1], 10);
  const mid = base.match(/(?:^|[_\s.-])(?:cap|capitulo|chapter)\s*[_\s.-]*(\d{1,3})\b/i);
  if (mid) return parseInt(mid[1], 10);
  const tail = base.match(/(\d{1,3})\s*$/);
  if (tail) return parseInt(tail[1], 10);
  return orderIndex + 1;
}

/** Lista e ordena MP3 numa pasta do livro (um ficheiro por capítulo). */
export async function listSortedChapterMp3ForDirectory(dir: string): Promise<ChapterMp3Item[]> {
  const bucket = getAudiosBucketId();
  const { data: entries, error } = await supabase.storage.from(bucket).list(dir.replace(/\/+$/, ""), {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) {
    console.error("[Áudio] list capítulos", dir, error);
    return [];
  }
  const mp3s = (entries ?? []).filter(
    (e): e is { name: string } => !!e?.name && e.name.toLowerCase().endsWith(".mp3"),
  );
  const tagged = mp3s.map((e, i) => ({
    fileName: e.name,
    chapter: guessChapterFromFilename(e.name, i),
    objectPath: `${dir.replace(/\/+$/, "")}/${e.name}`,
  }));
  tagged.sort(
    (a, b) => a.chapter - b.chapter || a.fileName.localeCompare(b.fileName, undefined, { numeric: true }),
  );
  return tagged.map((x) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(x.objectPath);
    return {
      chapter: x.chapter,
      fileName: x.fileName,
      objectPath: x.objectPath,
      publicUrl: fixSupabaseStoragePublicUrl(data.publicUrl),
    };
  });
}

export function normalizeStorageAudioDirectValue(
  raw: string | null | undefined,
): { publicUrl: string; objectPath: string } | null {
  const trimmed = sanitizeEnvPlainValue(raw ?? "").trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return {
      publicUrl: fixSupabaseStoragePublicUrl(trimmed),
      objectPath: trimmed,
    };
  }

  const segments = trimmed
    .split("/")
    .map((s) => sanitizeEnvPlainValue(s).trim())
    .filter(Boolean);
  const pathForBucket = stripLeadingAudiosNoiseSegments(segments).join("/");
  if (!pathForBucket) return null;

  const bucket = getAudiosBucketId();
  const { data } = supabase.storage.from(bucket).getPublicUrl(pathForBucket);
  return {
    publicUrl: fixSupabaseStoragePublicUrl(data.publicUrl),
    objectPath: pathForBucket,
  };
}

export function getAudioPlaybackUrl(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): string | null {
  const direct = track.audio_url?.trim();
  if (direct) {
    const bp = bucketPathFromDirectAudioInput(direct);
    if (!bp || !isChapterFolderBucketPath(bp)) {
      const n = normalizeStorageAudioDirectValue(direct);
      if (n) return n.publicUrl;
    }
  }

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
    const bp = bucketPathFromDirectAudioInput(direct);
    if (!bp || !isChapterFolderBucketPath(bp)) {
      const n = normalizeStorageAudioDirectValue(direct);
      if (n) return n;
    }
  }

  const chapterRootEarly = getAudiosChapterRootDirectoryPath(track, book);
  if (chapterRootEarly) {
    const ch = await listSortedChapterMp3ForDirectory(chapterRootEarly);
    if (ch.length > 1) return null;
    if (ch.length === 1) {
      return { publicUrl: ch[0].publicUrl, objectPath: ch[0].objectPath };
    }
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

/** Para UI: há caminho/base para tentar áudio (inclui modo por capítulo na pasta do livro). */
export function audiosBuiltInPlaybackConfigured(
  track: { audio_url: string | null; psalms_group: string | null },
  book?: BookForAudio,
): boolean {
  if (track.audio_url?.trim()) return true;
  if (getAudiosChapterRootDirectoryPath(track, book)) return true;
  if (!book?.abbrev?.trim()) return false;
  if (getAudiosObjectPrefixPath()) {
    return !!(book.name?.trim() && getAudiosBookDirectoryPath(track, book));
  }
  return !!getAudiosSlugFilename(track, book);
}
