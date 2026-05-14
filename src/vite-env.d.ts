/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  /** Base pública do bucket `audios` (sem barra final), ex.: …/storage/v1/object/public/audios */
  readonly VITE_PUBLIC_AUDIO_BASE_URL?: string;
  /** ID técnico do bucket no Supabase (Dashboard → Storage → definições). Por omissão: audios */
  readonly VITE_SUPABASE_AUDIOS_BUCKET?: string;
  /** Pastas dentro do bucket antes do testamento, ex.: files/audio/biblia (sem / no início). Se vazio, MP3 na raiz. */
  readonly VITE_SUPABASE_AUDIOS_PREFIX?: string;
  /** `slug` (por omissão) = Gn.mp3 derivado do abbrev; `auto` = listar pasta do livro e usar .mp3 encontrado */
  readonly VITE_SUPABASE_AUDIOS_FILE_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
