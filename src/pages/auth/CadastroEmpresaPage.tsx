import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldWithExpected } from "@/components/ui/field-with-expected";
import { FieldError } from "@/components/ui/field-error";
import { maskCnpjInput } from "@/lib/format";
import { getFieldExpected } from "@/lib/validations";
import { Switch } from "@/components/ui/switch";
import { Clock, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import {
  validateRazaoSocial,
  validateCnpj,
  validateRua,
  validateNumeroEndereco,
  validateComplemento,
  validateBairro,
  validateCep,
  validateCidade,
  validateUf,
  validateCodigoPais,
  validateDdd,
  validateNumeroTelefone,
  validateUsername,
  validateEmail,
  validateSenha,
} from "@/lib/validations";
import type { CadastroEmpresaRequest } from "@/types/auth";

type Step = 1 | 2 | 3 | 4;

export default function CadastroEmpresaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getError, getTouched, handleBlur, handleChange, validateAll } = useValidation();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Empresa
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");

  // Step 2 - Endereço
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");

  // Step 3 - Contato (codigoPais só dígitos, ex: 55)
  const [codigoPais, setCodigoPais] = useState("55");
  const [ddd, setDdd] = useState("");
  const [telefone, setTelefone] = useState("");

  // Step 4 - Credenciais
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Ativar = incluir objeto na request (opcional)
  const [incluirEndereco, setIncluirEndereco] = useState(true);
  const [incluirTelefone, setIncluirTelefone] = useState(false);

  const [sucesso, setSucesso] = useState(false);

  const validateStep1 = () =>
    validateAll([
      ["razaoSocial", razaoSocial, (v) => validateRazaoSocial(v, true)],
      ["cnpj", cnpj, (v) => validateCnpj(v, true)],
    ]);
  const validateStep2 = () =>
    !incluirEndereco ||
    validateAll([
      ["rua", rua, (v) => validateRua(v, true)],
      ["numero", numero, (v) => validateNumeroEndereco(v, true)],
      ["complemento", complemento, validateComplemento],
      ["bairro", bairro, (v) => validateBairro(v, true)],
      ["cep", cep, (v) => validateCep(v, true)],
      ["cidade", cidade, (v) => validateCidade(v, true)],
      ["uf", uf, (v) => validateUf(v, true)],
    ]);
  const validateStep3 = () =>
    !incluirTelefone ||
    validateAll([
      ["codigoPais", codigoPais.replace(/\D/g, ""), (v) => validateCodigoPais(v || null, true)],
      ["ddd", ddd, (v) => validateDdd(v, true)],
      ["telefone", telefone, (v) => validateNumeroTelefone(v, true)],
    ]);

  const handleSubmit = async () => {
    if (senha !== confirmarSenha) {
      toast({ variant: "destructive", title: "Erro", description: "As senhas não coincidem." });
      return;
    }
    const step4Ok = validateAll([
      ["username", username, (v) => validateUsername(v, true)],
      ["email", email, (v) => validateEmail(v, true)],
      ["senha", senha, (v) => validateSenha(v, true)],
    ]);
    if (!step4Ok) return;

    setLoading(true);
    const body: Record<string, unknown> = {
      username,
      email,
      senha,
      razaoSocial,
      cnpj: cnpj.replace(/\D/g, ""),
    };
    if (incluirEndereco) {
      body.empresaEndereco = { rua, numero, complemento: complemento || undefined, bairro, cidade, uf, cep: cep.replace(/\D/g, "") };
    }
    if (incluirTelefone) {
      body.usuarioTelefone = { codigoPais: codigoPais.replace(/\D/g, ""), ddd, numero: telefone };
    }

    try {
      await api.post("/api/empresa", body);
      setSucesso(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no cadastro", description: error.response?.data?.mensagem || "Verifique os dados e tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="font-display text-xl">Cadastro realizado!</CardTitle>
            <CardDescription>Sua empresa foi cadastrada com sucesso</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/login")}>Ir para o login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    { n: 1, label: "Empresa" },
    { n: 2, label: "Endereço" },
    { n: 3, label: "Contato" },
    { n: 4, label: "Acesso" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center pt-24 pb-8 px-4">
        <div className="w-full max-w-lg space-y-8">
        {/* Logo - igual navbar */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <Clock className="h-6 w-6" />
            PontoSeg
          </div>
        </div>

        {/* Progress */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.n}
                </div>
                <span className={`hidden text-xs sm:block ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`mx-1 h-0.5 w-4 sm:w-8 shrink-0 ${step > s.n ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-display text-xl">Cadastro de Empresa</CardTitle>
            <CardDescription>
              {step === 1 && "Dados da empresa"}
              {step === 2 && "Endereço da empresa"}
              {step === 3 && "Telefone de contato"}
              {step === 4 && "Credenciais de acesso"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-6">
            {step === 1 && (
              <>
                <FieldWithExpected label="Razão Social" required expected={getFieldExpected("razaoSocial")} error={getError("razaoSocial")} showValid={getTouched("razaoSocial") || razaoSocial.trim().length > 0}>
                  <Input placeholder="Nome da empresa" value={razaoSocial} onChange={(e) => { setRazaoSocial(e.target.value); handleChange("razaoSocial", e.target.value, (v) => validateRazaoSocial(v, true)); }} onBlur={() => handleBlur("razaoSocial", razaoSocial, (v) => validateRazaoSocial(v, true))} aria-invalid={!!getError("razaoSocial")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <FieldWithExpected label="CNPJ" required expected={getFieldExpected("cnpj")} error={getError("cnpj")} showValid={getTouched("cnpj") || cnpj.trim().length > 0}>
                  <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => { const next = maskCnpjInput(e.target.value); setCnpj(next); handleChange("cnpj", next, (v) => validateCnpj(v, true)); }} onBlur={() => handleBlur("cnpj", cnpj, (v) => validateCnpj(v, true))} aria-invalid={!!getError("cnpj")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center justify-between gap-2 rounded-lg border p-3 sm:p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium sm:text-base">Incluir endereço</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">Ao ativar, o endereço será enviado no cadastro.</p>
                  </div>
                  <Switch checked={incluirEndereco} onCheckedChange={setIncluirEndereco} className="shrink-0" />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="col-span-2">
                    <FieldWithExpected label="Rua" required expected={getFieldExpected("rua")} error={getError("rua")} showValid={getTouched("rua") || rua.trim().length > 0}>
                      <Input value={rua} onChange={(e) => { setRua(e.target.value); handleChange("rua", e.target.value, (v) => validateRua(v, true)); }} onBlur={() => handleBlur("rua", rua, (v) => validateRua(v, true))} aria-invalid={!!getError("rua")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                    </FieldWithExpected>
                  </div>
                  <div>
                    <FieldWithExpected label="Número" required expected={getFieldExpected("numeroEndereco")} error={getError("numero")} showValid={getTouched("numero") || numero.trim().length > 0}>
                      <Input value={numero} onChange={(e) => { setNumero(e.target.value); handleChange("numero", e.target.value, (v) => validateNumeroEndereco(v, true)); }} onBlur={() => handleBlur("numero", numero, (v) => validateNumeroEndereco(v, true))} aria-invalid={!!getError("numero")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                    </FieldWithExpected>
                  </div>
                </div>
                <FieldWithExpected label="Complemento" expected={getFieldExpected("complemento")} error={getError("complemento")} showValid={getTouched("complemento") || complemento.trim().length > 0}>
                  <Input value={complemento} onChange={(e) => { setComplemento(e.target.value); handleChange("complemento", e.target.value, validateComplemento); }} onBlur={() => handleBlur("complemento", complemento, validateComplemento)} aria-invalid={!!getError("complemento")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <FieldWithExpected label="Bairro" required expected={getFieldExpected("bairro")} error={getError("bairro")} showValid={getTouched("bairro") || bairro.trim().length > 0}>
                  <Input value={bairro} onChange={(e) => { setBairro(e.target.value); handleChange("bairro", e.target.value, (v) => validateBairro(v, true)); }} onBlur={() => handleBlur("bairro", bairro, (v) => validateBairro(v, true))} aria-invalid={!!getError("bairro")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <FieldWithExpected label="CEP" required expected={getFieldExpected("cep")} error={getError("cep")} showValid={getTouched("cep") || cep.replace(/\D/g, "").length > 0}>
                    <Input placeholder="00000-000" value={cep} onChange={(e) => { setCep(e.target.value); handleChange("cep", e.target.value, (v) => validateCep(v, true)); }} onBlur={() => handleBlur("cep", cep, (v) => validateCep(v, true))} aria-invalid={!!getError("cep")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                  </FieldWithExpected>
                  <FieldWithExpected label="Cidade" required expected={getFieldExpected("cidade")} error={getError("cidade")} showValid={getTouched("cidade") || cidade.trim().length > 0}>
                    <Input value={cidade} onChange={(e) => { setCidade(e.target.value); handleChange("cidade", e.target.value, (v) => validateCidade(v, true)); }} onBlur={() => handleBlur("cidade", cidade, (v) => validateCidade(v, true))} aria-invalid={!!getError("cidade")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                  </FieldWithExpected>
                  <FieldWithExpected label="UF" required expected={getFieldExpected("uf")} error={getError("uf")} showValid={getTouched("uf") || uf.trim().length > 0}>
                    <Input maxLength={2} placeholder="SP" value={uf} onChange={(e) => { setUf(e.target.value.toUpperCase()); handleChange("uf", e.target.value.toUpperCase(), (v) => validateUf(v, true)); }} onBlur={() => handleBlur("uf", uf, (v) => validateUf(v, true))} aria-invalid={!!getError("uf")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                  </FieldWithExpected>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Incluir telefone</p>
                    <p className="text-sm text-muted-foreground">Ao ativar, o telefone será enviado no cadastro.</p>
                  </div>
                  <Switch checked={incluirTelefone} onCheckedChange={setIncluirTelefone} />
                </div>
                <div className="grid grid-cols-4 gap-3">
                <FieldWithExpected label="País" required expected={getFieldExpected("codigoPais")} error={getError("codigoPais")} showValid={getTouched("codigoPais") || codigoPais.replace(/\D/g, "").length > 0}>
                  <Input value={codigoPais} placeholder="55" onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setCodigoPais(v); handleChange("codigoPais", v, (x) => validateCodigoPais(x || null, true)); }} onBlur={() => handleBlur("codigoPais", codigoPais.replace(/\D/g, ""), (v) => validateCodigoPais(v || null, true))} aria-invalid={!!getError("codigoPais")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <FieldWithExpected label="DDD" required expected={getFieldExpected("ddd")} error={getError("ddd")} showValid={getTouched("ddd") || ddd.trim().length > 0}>
                  <Input placeholder="11" maxLength={5} value={ddd} onChange={(e) => { setDdd(e.target.value); handleChange("ddd", e.target.value, (v) => validateDdd(v, true)); }} onBlur={() => handleBlur("ddd", ddd, (v) => validateDdd(v, true))} aria-invalid={!!getError("ddd")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <div className="col-span-2">
                  <FieldWithExpected label="Número" required expected={getFieldExpected("telefone")} error={getError("telefone")} showValid={getTouched("telefone") || telefone.trim().length > 0}>
                    <Input placeholder="99999-9999" value={telefone} onChange={(e) => { setTelefone(e.target.value); handleChange("telefone", e.target.value, (v) => validateNumeroTelefone(v, true)); }} onBlur={() => handleBlur("telefone", telefone, (v) => validateNumeroTelefone(v, true))} aria-invalid={!!getError("telefone")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                  </FieldWithExpected>
                </div>
              </div>
              </>
            )}

            {step === 4 && (
              <>
                <FieldWithExpected label="Nome de usuário" required expected={getFieldExpected("username")} error={getError("username")} showValid={getTouched("username") || username.trim().length > 0}>
                  <Input placeholder="meunome" value={username} onChange={(e) => { setUsername(e.target.value); handleChange("username", e.target.value, (v) => validateUsername(v, true)); }} onBlur={() => handleBlur("username", username, (v) => validateUsername(v, true))} aria-invalid={!!getError("username")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <FieldWithExpected label="Email" required expected={getFieldExpected("email")} error={getError("email")} showValid={getTouched("email") || email.trim().length > 0}>
                  <Input type="email" placeholder="empresa@email.com" value={email} onChange={(e) => { setEmail(e.target.value); handleChange("email", e.target.value, (v) => validateEmail(v, true)); }} onBlur={() => handleBlur("email", email, (v) => validateEmail(v, true))} aria-invalid={!!getError("email")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <FieldWithExpected label="Senha" required expected={getFieldExpected("senha")} error={getError("senha")} showValid={getTouched("senha") || senha.length > 0}>
                  <Input type="password" placeholder="••••••••" value={senha} onChange={(e) => { setSenha(e.target.value); handleChange("senha", e.target.value, (v) => validateSenha(v, true)); }} onBlur={() => handleBlur("senha", senha, (v) => validateSenha(v, true))} aria-invalid={!!getError("senha")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <div className="space-y-1">
                  <Label required>Confirmar Senha</Label>
                  <Input type="password" placeholder="••••••••" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                  <p className="text-xs text-muted-foreground">Esperado: {getFieldExpected("confirmarSenha")}</p>
                  {confirmarSenha && senha !== confirmarSenha && <p role="alert" className="text-sm text-destructive">As senhas não coincidem.</p>}
                  {confirmarSenha && senha === confirmarSenha && senha.length > 0 && <p className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1">Válido</p>}
                </div>
              </>
            )}

            <div className="flex gap-2 pt-1 sm:gap-3 sm:pt-2">
              {step === 1 ? (
                <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-1 text-xs sm:text-sm">
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Voltar
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setStep((step - 1) as Step)} className="gap-1 text-xs sm:text-sm">
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Voltar
                </Button>
              )}
              <div className="flex-1" />
              {step < 4 ? (
                <Button
                  size="sm"
                  onClick={() => {
                    const valid = step === 1 ? validateStep1() : step === 2 ? validateStep2() : validateStep3();
                    if (valid) setStep((step + 1) as Step);
                  }}
                  className="gap-1 text-xs sm:text-sm"
                >
                  Próximo <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleSubmit} disabled={loading} className="text-xs sm:text-sm">
                  {loading ? "Cadastrando..." : "Cadastrar empresa"}
                </Button>
              )}
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground sm:mt-6 sm:text-sm">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Faça login
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
