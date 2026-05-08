/**
 * Shims só para o TypeScript do editor (VS Code / tsc).
 * Em produção as Edge Functions rodam em Deno e resolvem estas URLs normalmente.
 */

declare namespace Deno {
  function serve(handler: (request: Request) => Response | Promise<Response>): void;

  namespace env {
    function get(key: string): string | undefined;
  }
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): import("@supabase/supabase-js").SupabaseClient;
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}
