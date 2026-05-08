import { supabase } from "@/integrations/supabase/client";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Envia foto para `avatars/{userId}/avatar.{ext}` e atualiza `profiles.avatar_url`. */
export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const extRaw = file.name.split(".").pop()?.toLowerCase();
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(extRaw || "") ? extRaw : "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type || `image/${ext}`,
  });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;
  const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
  if (dbErr) throw dbErr;
  return publicUrl;
}
