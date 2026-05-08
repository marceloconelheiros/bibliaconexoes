/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  /** Base pública do bucket `audios` (sem barra final), ex.: …/storage/v1/object/public/audios */
  readonly VITE_PUBLIC_AUDIO_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
