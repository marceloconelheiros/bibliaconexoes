import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, Loader2, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/brand";
import { AVATAR_MAX_BYTES, uploadUserAvatar } from "@/lib/avatar-upload";
import { FAITH_TRADITION_OPTIONS } from "@/lib/faith-traditions";
import { isLikelyMobileDigits, normalizeWhatsappDigits } from "@/lib/whatsapp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [faithTradition, setFaithTradition] = useState("");
  const [faithDetail, setFaithDetail] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const resetRegisterFields = () => {
    setNome("");
    setCidade("");
    setWhatsapp("");
    setBirthDate("");
    setFaithTradition("");
    setFaithDetail("");
    setPhotoFile(null);
  };

  const toggleMode = () => {
    setIsRegister((v) => !v);
    resetRegisterFields();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const nomeT = nome.trim();
    const cidadeT = cidade.trim();
    const wa = normalizeWhatsappDigits(whatsapp);
    const faithDetailT = faithDetail.trim();

    if (nomeT.length < 2) {
      toast({ title: "Informe seu nome completo", variant: "destructive" });
      return;
    }
    if (cidadeT.length < 2) {
      toast({ title: "Informe sua cidade", variant: "destructive" });
      return;
    }
    if (!isLikelyMobileDigits(wa)) {
      toast({
        title: "WhatsApp inválido",
        description: "Informe DDD + número (somente dígitos). Ex.: 11987654321",
        variant: "destructive",
      });
      return;
    }
    if (!birthDate) {
      toast({ title: "Informe sua data de nascimento", variant: "destructive" });
      return;
    }
    if (!email.trim() || !password) {
      toast({ title: "E-mail e senha são obrigatórios", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (!faithTradition) {
      toast({
        title: "Selecione como você se identifica",
        description: "Escolha uma opção na lista (logo acima do e-mail).",
        variant: "destructive",
      });
      return;
    }
    if (photoFile && photoFile.size > AVATAR_MAX_BYTES) {
      toast({ title: "Foto muito grande", description: "Máximo 2 MB.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          nome: nomeT,
          cidade: cidadeT,
          whatsapp: wa,
          birth_date: birthDate,
          faith_tradition: faithTradition,
          faith_detail: faithDetailT || null,
        },
      },
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    let photoUploadFailed = false;
    if (data.session?.user && photoFile) {
      try {
        await uploadUserAvatar(data.session.user.id, photoFile);
      } catch (err) {
        console.error(err);
        photoUploadFailed = true;
      }
    }

    if (data.session) {
      toast({
        title: "Conta criada!",
        description: photoUploadFailed
          ? "Sua conta está pronta, mas a foto não pôde ser enviada. Tente novamente depois."
          : `Bem-vindo ao ${BRAND.shortName}.`,
      });
    } else {
      toast({
        title: "Quase lá!",
        description: photoFile
          ? "Confirme o e-mail para ativar a conta. Depois de entrar, você poderá enviar sua foto."
          : "Enviamos um link para confirmar seu e-mail.",
      });
    }

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast({ title: "Preencha e-mail e senha", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      toast({ title: "E-mail ou senha incorretos", variant: "destructive" });
    } else {
      toast({ title: "Login realizado!" });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/[0.08] via-background to-accent/30 flex items-center justify-center p-4 relative overflow-hidden py-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-amber-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <Card
        className={`w-full border border-border/60 shadow-2xl bg-card/90 backdrop-blur-md relative z-10 animate-fade-in rounded-2xl ${isRegister ? "max-w-lg" : "max-w-md"}`}
      >
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <img
              src="/logo.png"
              alt={BRAND.name}
              className="w-14 h-14 rounded-2xl shadow-md ring-2 ring-primary/15"
            />
            <div className="text-center sm:text-left">
              <CardTitle className="font-display text-3xl font-bold tracking-tight text-foreground">
                {BRAND.name}
              </CardTitle>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mt-1">{BRAND.tagline}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground pt-1">
            {isRegister ? "Preencha seus dados para criar a conta" : "Entre para continuar sua jornada"}
          </p>
        </CardHeader>
        <CardContent>
          {isRegister ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <ScrollArea className="max-h-[min(68vh,540px)] pr-4">
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      autoComplete="name"
                      placeholder="Seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      autoComplete="address-level2"
                      placeholder="Onde você mora"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="DDD + número (ex.: 11987654321)"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faith-select">Como você se identifica</Label>
                    <p className="text-xs text-muted-foreground">
                      Fé ou tradição que mais representa você (inclui Espiritismo/Kardecismo).
                    </p>
                    <Select value={faithTradition} onValueChange={setFaithTradition}>
                      <SelectTrigger id="faith-select" className="bg-background">
                        <SelectValue placeholder="Selecione uma opção..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {FAITH_TRADITION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faithDetail">Denominação ou detalhe (opcional)</Label>
                    <Input
                      id="faithDetail"
                      placeholder="Ex.: Assembleia, Igreja Batista, Casa Espírita FEB, Universal…"
                      value={faithDetail}
                      onChange={(e) => setFaithDetail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-reg">E-mail</Label>
                    <Input
                      id="email-reg"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-reg">Senha</Label>
                    <Input
                      id="password-reg"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Foto de perfil (opcional)</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-dashed border-border bg-muted flex items-center justify-center shrink-0">
                        {photoPreview ? (
                          <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-1 min-w-[160px]">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="cursor-pointer text-sm"
                          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                        />
                        {photoFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-fit gap-1 text-muted-foreground"
                            onClick={() => setPhotoFile(null)}
                          >
                            <X className="h-4 w-4" />
                            Remover foto
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · máx. 2 MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Criar conta
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button type="button" onClick={toggleMode} className="text-sm text-primary hover:underline">
              {isRegister ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
