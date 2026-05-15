import type { Database } from "@/integrations/supabase/types";

export type PostPrivacy = Database["public"]["Enums"]["post_privacy"];

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_default: boolean;
  sort_order: number;
};

export type FeedAuthor = {
  id: string;
  nome: string;
  avatar_url: string | null;
};

export type FeedPost = {
  id: string;
  body: string;
  privacy: PostPrivacy;
  created_at: string;
  community_id: string;
  author_id: string;
  author: FeedAuthor | null;
};

export const PRIVACY_OPTIONS: { value: PostPrivacy; label: string; hint: string }[] = [
  {
    value: "public",
    label: "Público",
    hint: "Qualquer pessoa com conta na Bíblia Conexões.",
  },
  {
    value: "community",
    label: "Comunidade",
    hint: "Só quem faz parte deste grupo.",
  },
  {
    value: "followers",
    label: "Seguidores",
    hint: "Só quem te segue.",
  },
];

export function privacyLabel(p: PostPrivacy): string {
  return PRIVACY_OPTIONS.find((o) => o.value === p)?.label ?? p;
}

export function formatPostTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export function authorInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
