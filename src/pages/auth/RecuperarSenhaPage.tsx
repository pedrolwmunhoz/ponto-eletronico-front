import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Step = "email" | "codigo" | "nova-senha" | "sucesso";

export default function RecuperarSenhaPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [token, setToken] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEnviarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/recuperar-senha", { email });
      setStep("codigo");
      toast({ title: "Código enviado", description: "Verifique seu email." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.response?.data?.message || "Email não encontrado." });
    } finally {
      setLoading(false);
    }
  };

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/validar-codigo", { codigo });
      setToken(data.token);
      setStep("nova-senha");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.response?.data?.message || "Código inválido." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaNova !== confirmarSenha) {
      toast({ variant: "destructive", title: "Erro", description: "As senhas não coincidem." });
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/resetar-senha", { token, senhaNova });
      setStep("sucesso");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.response?.data?.message || "Erro ao redefinir senha." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo - igual navbar */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <Clock className="h-6 w-6" />
            PontoSeg
          </div>
        </div>

        <Card className="border-border shadow-lg">
          {step === "email" && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl">Recuperar senha</CardTitle>
                <CardDescription>Informe seu email para receber o código de recuperação</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEnviarEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar código"}</Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "codigo" && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl">Verificar código</CardTitle>
                <CardDescription>Insira o código de 6 dígitos enviado para {email}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValidarCodigo} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input id="codigo" placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value)} required maxLength={6} className="text-center text-2xl tracking-[0.5em]" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Verificando..." : "Verificar"}</Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "nova-senha" && (
            <>
              <CardHeader>
                <CardTitle className="font-display text-xl">Nova senha</CardTitle>
                <CardDescription>Crie uma nova senha para sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetarSenha} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="senhaNova">Nova senha</Label>
                    <Input id="senhaNova" type="password" placeholder="••••••••" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmar">Confirmar senha</Label>
                    <Input id="confirmar" type="password" placeholder="••••••••" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Salvando..." : "Redefinir senha"}</Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "sucesso" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="font-display text-xl">Senha redefinida!</CardTitle>
                <CardDescription>Sua senha foi alterada com sucesso</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate("/login")}>Ir para o login</Button>
              </CardContent>
            </>
          )}

          <div className="px-6 pb-6">
            <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Voltar ao login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
