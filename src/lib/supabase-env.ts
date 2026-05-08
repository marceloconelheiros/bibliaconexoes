/** Variáveis obrigatórias no build (Netlify → Environment variables). */
export function isSupabaseEnvReady(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  return Boolean(url && key);
}
