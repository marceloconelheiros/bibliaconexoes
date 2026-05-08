import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** URL pública da foto em `profiles.avatar_url` para o utilizador autenticado. */
export function useProfileAvatarUrl(userId: string | undefined) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
      if (!cancelled) setAvatarUrl(data?.avatar_url ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return avatarUrl;
}
