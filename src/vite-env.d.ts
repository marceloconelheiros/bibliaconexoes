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
  /** Pasta no Storage para livros OT (por omissão: Velho Testamento) */
  readonly VITE_SUPABASE_AUDIOS_FOLDER_OT?: string;
  /** Pasta no Storage para livros NT (por omissão: Novo Testamento) */
  readonly VITE_SUPABASE_AUDIOS_FOLDER_NT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
