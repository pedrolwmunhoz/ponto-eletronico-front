import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldWithExpected } from "@/components/ui/field-with-expected";
import { CheckCircle2, Clock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import { maskCpfInput, maskCnpjInput, maskTelefoneInput, maskUsernameInput, maskEmailInput } from "@/lib/format";
import { validateCredencialByTipo, validateSenha, getFieldExpected } from "@/lib/validations";
import type { TipoCredencial } from "@/types/auth";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [valor, setValor] = useState("");
  const [tipoCredencial, setTipoCredencial] = useState<TipoCredencial>("EMAIL");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { getError, getTouched, handleBlur, handleChange, validateAll, clearError } = useValidation();

  const validateValor = (v: string) => validateCredencialByTipo(v, tipoCredencial, true);

  useEffect(() => {
    if (searchParams.get("unauthorized") === "1") {
      toast({
        variant: "destructive",
        title: "Não autorizado",
        description: "Seu usuário não tem permissão para acessar esta área. Entre com a conta correta.",
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    if (tipoCredencial === "CPF" && valor) setValor((v) => maskCpfInput(v));
    if (tipoCredencial === "CNPJ" && valor) setValor((v) => maskCnpjInput(v));
    if (tipoCredencial === "TELEFONE" && valor) setValor((v) => maskTelefoneInput(v));
    if (tipoCredencial === "USERNAME" && valor) setValor((v) => maskUsernameInput(v));
    if (tipoCredencial === "EMAIL" && valor) setValor((v) => maskEmailInput(v));
  }, [tipoCredencial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validateAll([
      ["valor", valor, validateValor],
      ["senha", senha, (v) => validateSenha(v, true)],
    ]);
    if (!ok) return;
    const valorEnvio =
      tipoCredencial === "CPF" || tipoCredencial === "TELEFONE"
        ? valor.replace(/\D/g, "")
        : tipoCredencial === "CNPJ"
          ? valor.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
          : valor;
    try {
      await login({ valor: valorEnvio, tipoCredencial, senha });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.response?.data?.mensagem || "Credenciais inválidas. Tente novamente.",
      });
    }
  };

  const placeholders: Record<TipoCredencial, string> = {
    EMAIL: "seu@email.com",
    USERNAME: "seu.usuario",
    CPF: "000.000.000-00",
    CNPJ: "00.000.000/0000-00",
    TELEFONE: "(00) 00000-0000",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center pt-24 pb-8 px-4">
        <div className="w-full max-w-md space-y-8">
        {/* Logo - igual navbar */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <Clock className="h-6 w-6" />
            PontoSeg
          </div>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">Entrar na sua conta</CardTitle>
            <CardDescription>Insira suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCredencial" required>Tipo de credencial</Label>
                <Select
                  value={tipoCredencial}
                  onValueChange={(v) => {
                    setTipoCredencial(v as TipoCredencial);
                    setValor("");
                    clearError("valor");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="USERNAME">Usuário</SelectItem>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="TELEFONE">Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FieldWithExpected
                name="valor"
                label="Credencial"
                required
                expected={getFieldExpected(tipoCredencial.toLowerCase())}
                error={getError("valor")}
                showValid={valor.trim().length > 0}
              >
                <Input
                  id="valor"
                  placeholder={placeholders[tipoCredencial]}
                  value={valor}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const next =
                      tipoCredencial === "CPF"
                        ? maskCpfInput(raw)
                        : tipoCredencial === "CNPJ"
                          ? maskCnpjInput(raw)
                          : tipoCredencial === "TELEFONE"
                            ? maskTelefoneInput(raw)
                            : tipoCredencial === "USERNAME"
                              ? maskUsernameInput(raw)
                              : tipoCredencial === "EMAIL"
                                ? maskEmailInput(raw)
                                : raw;
                    setValor(next);
                    handleChange("valor", next, validateValor);
                  }}
                  onBlur={() => handleBlur("valor", valor, validateValor)}
                  aria-invalid={!!getError("valor")}
                  className="mt-1"
                />
              </FieldWithExpected>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="senha" required>Senha</Label>
                  <Link
                    to="/recuperar-senha"
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value);
                      handleChange("senha", e.target.value, (v) => validateSenha(v, true));
                    }}
                    onBlur={() => handleBlur("senha", senha, (v) => validateSenha(v, true))}
                    aria-invalid={!!getError("senha")}
                    className="mt-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Esperado: {getFieldExpected("senha")}</p>
                {getError("senha") && <p role="alert" className="text-sm text-destructive">{getError("senha")}</p>}
                {!getError("senha") && senha.length > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    Válido
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  !valor.trim() ||
                  !senha ||
                  !!validateValor(valor)
                }
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              É uma empresa?{" "}
              <Link to="/cadastro" className="font-medium text-primary hover:underline">
                Cadastre-se aqui
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
