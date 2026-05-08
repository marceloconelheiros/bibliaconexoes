// Configuração do cliente Supabase (variáveis VITE_* na Vercel → Production → Redeploy)
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { readSupabaseEnv } from "@/lib/supabase-env";

const env = readSupabaseEnv();
if (!env) {
  throw new Error(
    "Supabase não configurado no deploy. Na Vercel: Settings → Environment Variables → ambiente Production → " +
      "adicione VITE_SUPABASE_URL (https://xxxx.supabase.co) e VITE_SUPABASE_PUBLISHABLE_KEY (chave anon), depois Redeploy."
  );
}

export const supabase = createClient<Database>(env.url, env.key, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
