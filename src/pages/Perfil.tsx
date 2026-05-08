import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, LogOut, Save, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/lib/brand";
import { AVATAR_MAX_BYTES, uploadUserAvatar } from "@/lib/avatar-upload";
import { ESTADO_CIVIL_OPTIONS, type EstadoCivilSlug } from "@/lib/marital-status";

type ProfileRow = Tables<"profiles">;

export default function Perfil() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [profissao, setProfissao] = useState("");
  const [estadoCivil, setEstadoCivil] = useState<EstadoCivilSlug>("prefiro_nao_informar");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const userId = session?.user.id;

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error(error);
        toast({ title: "Não foi possível carregar o perfil", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!data) {
        toast({
          title: "Perfil não encontrado",
          description: "Faça logout e entre novamente. Se persistir, entre em contato com o suporte.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setProfile(data as ProfileRow);
      setProfissao((data as ProfileRow).profissao ?? "");
      const ec = (data as ProfileRow).estado_civil as EstadoCivilSlug;
      setEstadoCivil(
        ESTADO_CIVIL_OPTIONS.some((o) => o.value === ec) ? ec : "prefiro_nao_informar"
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayAvatar = photoPreview || profile?.avatar_url || null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !profile) return;

    if (photoFile && photoFile.size > AVATAR_MAX_BYTES) {
      toast({ title: "Foto muito grande", description: "Máximo 2 MB.", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      if (photoFile) {
        await uploadUserAvatar(userId, photoFile);
        setPhotoFile(null);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          profissao: profissao.trim(),
          estado_civil: estadoCivil,
        })
        .eq("id", userId);

      if (error) throw error;

      const { data: refreshed } = await supabase.from("profiles").select("*").eq("id", userId).single();

      if (refreshed) setProfile(refreshed as ProfileRow);

      toast({ title: "Perfil atualizado!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/15">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {BRAND.shortName}
                </p>
                <h1 className="font-display text-xl font-bold">Meu perfil</h1>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Card className="border-border/80 shadow-lg">
          <CardHeader>
            <CardTitle className="font-display text-lg">Dados e foto</CardTitle>
            <CardDescription>Profissão e estado civil aparecem só para você — úteis para personalizar sua experiência.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-primary/20 bg-muted flex items-center justify-center shadow-inner">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-14 w-14 text-muted-foreground" />
                  )}
                </div>
                <div className="w-full space-y-2">
                  <Label>Foto de perfil</Label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="cursor-pointer text-sm"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">Até 2 MB · JPG, PNG ou WebP</p>
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Nome: </span>
                  <span className="font-medium">{profile?.nome || "—"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">E-mail: </span>
                  <span className="font-medium">{session.user.email ?? "—"}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profissao">Profissão</Label>
                <Input
                  id="profissao"
                  placeholder="Ex.: empresário(a), advogado(a), engenheiro(a)…"
                  value={profissao}
                  onChange={(e) => setProfissao(e.target.value)}
                  autoComplete="organization-title"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado civil</Label>
                <Select value={estadoCivil} onValueChange={(v) => setEstadoCivil(v as EstadoCivilSlug)}>
                  <SelectTrigger id="estado-civil" className="bg-background">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADO_CIVIL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={saving || !profile}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar alterações
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <Button type="button" variant="outline" className="w-full gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
