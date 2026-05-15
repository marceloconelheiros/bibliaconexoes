import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, PenLine, UserPlus, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  authorInitials,
  formatPostTime,
  PRIVACY_OPTIONS,
  privacyLabel,
  type Community,
  type FeedAuthor,
  type FeedPost,
  type PostPrivacy,
} from "@/lib/community";

type FaceUser = FeedAuthor & { isFollowing: boolean };

const Comunidade = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [faceUsers, setFaceUsers] = useState<FaceUser[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [postBody, setPostBody] = useState("");
  const [postPrivacy, setPostPrivacy] = useState<PostPrivacy>("community");
  const [submitting, setSubmitting] = useState(false);

  const slugParam = searchParams.get("grupo");
  const defaultCommunity = communities.find((c) => c.is_default) ?? communities[0];
  const activeCommunity = useMemo(() => {
    if (!slugParam) return defaultCommunity;
    return communities.find((c) => c.slug === slugParam) ?? defaultCommunity;
  }, [communities, slugParam, defaultCommunity]);

  const loadCommunities = useCallback(async () => {
    const { data, error } = await supabase
      .from("communities")
      .select("id, slug, name, description, is_default, sort_order")
      .order("sort_order");
    if (error) throw error;
    setCommunities((data ?? []) as Community[]);
  }, []);

  const loadMembership = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.from("community_members").select("community_id").eq("user_id", userId);
    if (error) throw error;
    setMemberIds(new Set((data ?? []).map((r) => r.community_id)));
  }, [userId]);

  const loadFeed = useCallback(async (communityId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
          id, body, privacy, created_at, community_id, author_id,
          author:profiles!posts_author_id_fkey ( id, nome, avatar_url )
        `,
      )
      .eq("community_id", communityId)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    setPosts((data ?? []) as unknown as FeedPost[]);
  }, []);

  const loadFaceStrip = useCallback(async () => {
    if (!userId) return;

    const { data: followingRows, error: fErr } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    if (fErr) throw fErr;
    const followingSet = new Set((followingRows ?? []).map((r) => r.following_id));

    const { data: myCommunities, error: mcErr } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId);
    if (mcErr) throw mcErr;
    const commIds = (myCommunities ?? []).map((r) => r.community_id);
    if (commIds.length === 0) {
      setFaceUsers([]);
      return;
    }

    const { data: memberRows, error: mErr } = await supabase
      .from("community_members")
      .select("user_id")
      .in("community_id", commIds)
      .neq("user_id", userId)
      .limit(80);
    if (mErr) throw mErr;

    const candidateIds = [...new Set((memberRows ?? []).map((r) => r.user_id))];
    const followedIds = [...followingSet];
    const orderedIds = [...followedIds, ...candidateIds.filter((id) => !followingSet.has(id))].slice(0, 16);

    if (orderedIds.length === 0) {
      setFaceUsers([]);
      return;
    }

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, nome, avatar_url")
      .in("id", orderedIds);
    if (pErr) throw pErr;

    const byId = new Map((profiles ?? []).map((p) => [p.id, p as FeedAuthor]));
    const faces: FaceUser[] = orderedIds
      .map((id) => {
        const p = byId.get(id);
        if (!p) return null;
        return { ...p, isFollowing: followingSet.has(id) };
      })
      .filter((x): x is FaceUser => x != null);

    setFaceUsers(faces);
  }, [userId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadCommunities(), loadMembership(), loadFaceStrip()]);
  }, [loadCommunities, loadMembership, loadFaceStrip]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await refreshAll();
      } catch (e) {
        console.error(e);
        toast({ title: "Erro ao carregar comunidade", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAll, toast]);

  useEffect(() => {
    if (!activeCommunity?.id) return;
    void loadFeed(activeCommunity.id).catch((e) => {
      console.error(e);
      toast({ title: "Erro ao carregar publicações", variant: "destructive" });
    });
  }, [activeCommunity?.id, loadFeed, toast]);

  const selectCommunity = (slug: string) => {
    if (slug === defaultCommunity?.slug) {
      setSearchParams({});
    } else {
      setSearchParams({ grupo: slug });
    }
  };

  const ensureMember = async (communityId: string) => {
    if (!userId || memberIds.has(communityId)) return;
    const { error } = await supabase.from("community_members").insert({ community_id: communityId, user_id: userId });
    if (error) throw error;
    setMemberIds((prev) => new Set(prev).add(communityId));
  };

  const handleSelectCommunity = async (c: Community) => {
    try {
      await ensureMember(c.id);
      selectCommunity(c.slug);
    } catch (e) {
      console.error(e);
      toast({ title: "Não foi possível entrar no grupo", variant: "destructive" });
    }
  };

  const toggleFollow = async (targetId: string, currentlyFollowing: boolean) => {
    if (!userId || targetId === userId) return;
    try {
      if (currentlyFollowing) {
        const { error } = await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({ follower_id: userId, following_id: targetId });
        if (error) throw error;
      }
      await loadFaceStrip();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao atualizar seguimento", variant: "destructive" });
    }
  };

  const handlePublish = async () => {
    if (!userId || !activeCommunity) return;
    const body = postBody.trim();
    if (!body) {
      toast({ title: "Escreva algo antes de publicar", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await ensureMember(activeCommunity.id);
      const { error } = await supabase.from("posts").insert({
        author_id: userId,
        community_id: activeCommunity.id,
        body,
        privacy: postPrivacy,
      });
      if (error) throw error;
      setPostBody("");
      setComposeOpen(false);
      toast({ title: "Publicado" });
      await loadFeed(activeCommunity.id);
    } catch (e) {
      console.error(e);
      toast({ title: "Não foi possível publicar", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const subCommunities = communities.filter((c) => !c.is_default);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-medium">Início</span>
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-sm font-semibold tracking-tight">Comunidade</h1>
            <p className="truncate text-[10px] text-muted-foreground">{activeCommunity?.name ?? "Geral"}</p>
          </div>
          <ThemeToggle className="h-9 w-9 shrink-0 rounded-md border border-border bg-card shadow-sm" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5">
        {faceUsers.length > 0 && (
          <section aria-label="Pessoas">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Seguindo e sugestões
            </p>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {faceUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="flex w-16 shrink-0 flex-col items-center gap-1"
                  onClick={() => void toggleFollow(u.id, u.isFollowing)}
                  title={u.isFollowing ? `Deixar de seguir ${u.nome}` : `Seguir ${u.nome}`}
                >
                  <span className="relative">
                    <Avatar className="h-12 w-12 border-2 border-background ring-1 ring-border">
                      <AvatarImage src={u.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="text-xs">{authorInitials(u.nome)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-background",
                        u.isFollowing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {u.isFollowing ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                    </span>
                  </span>
                  <span className="line-clamp-1 w-full text-center text-[10px] font-medium text-foreground">
                    {u.nome.split(/\s+/)[0]}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section aria-label="Grupos">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
            {defaultCommunity && (
              <Button
                type="button"
                size="sm"
                variant={activeCommunity?.id === defaultCommunity.id ? "default" : "outline"}
                className="h-8 shrink-0 rounded-full px-4 text-xs font-semibold"
                onClick={() => void handleSelectCommunity(defaultCommunity)}
              >
                {defaultCommunity.name}
              </Button>
            )}
            {subCommunities.map((c) => {
              const isMember = memberIds.has(c.id);
              const active = activeCommunity?.id === c.id;
              return (
                <Button
                  key={c.id}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className={cn(
                    "h-8 shrink-0 rounded-full px-4 text-xs font-semibold",
                    !isMember && !active && "border-dashed",
                  )}
                  onClick={() => void handleSelectCommunity(c)}
                >
                  {c.name}
                  {!isMember && !active ? " +" : ""}
                </Button>
              );
            })}
          </div>
          {activeCommunity?.description && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{activeCommunity.description}</p>
          )}
        </section>

        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" variant="secondary">
              <PenLine className="h-4 w-4" />
              Nova publicação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Publicar em {activeCommunity?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-body">Texto</Label>
                <Textarea
                  id="post-body"
                  rows={4}
                  placeholder="Compartilhe uma reflexão, pedido ou gratidão…"
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  maxLength={4000}
                />
              </div>
              <div className="space-y-2">
                <Label>Quem pode ver</Label>
                <Select value={postPrivacy} onValueChange={(v) => setPostPrivacy(v as PostPrivacy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIVACY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {PRIVACY_OPTIONS.find((o) => o.value === postPrivacy)?.hint}
                </p>
              </div>
              <Button className="w-full" disabled={submitting} onClick={() => void handlePublish()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <section aria-label="Publicações" className="space-y-3 pb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mais recentes</h2>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Ainda não há publicações aqui. Seja o primeiro a compartilhar.
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="border-border/80 shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={post.author?.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="text-xs">
                        {authorInitials(post.author?.nome ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">{post.author?.nome ?? "Membro"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatPostTime(post.created_at)} · {privacyLabel(post.privacy)}
                      </p>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.body}</p>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default Comunidade;
