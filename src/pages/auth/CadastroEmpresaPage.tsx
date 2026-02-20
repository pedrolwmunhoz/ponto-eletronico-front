import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldWithExpected, FieldExpectedStatus } from "@/components/ui/field-with-expected";
import { FieldError } from "@/components/ui/field-error";
import { maskCnpjInput, maskCepInput, maskDddInput, maskNumeroTelefoneInput, maskNumeroEnderecoInput, formatTitleCase, maskUsernameInput, maskEmailInput } from "@/lib/format";
import { useEstadosCidades } from "@/lib/useEstadosCidades";
import { getFieldExpected } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Clock, ArrowLeft, ArrowRight, CheckCircle, PencilLine, Check } from "lucide-react";
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

type Step = 1 | 2 | 3;

type PaisDdd = { codigo: string; fone: string; nome: string };

function foneSemZerosEsquerda(fone: string): string {
  return (fone || "").replace(/^0+/, "") || "0";
}

/** Deriva username da razão social: primeiro e segundo palavra em minúsculo, só a-z 0-9 . - (igual funcionário: primeiro + segundo nome). */
function usernameFromRazaoSocial(razaoSocial: string): string {
  const t = (razaoSocial ?? "").trim();
  if (!t) return "";
  const normalized = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "");
  const parts = t.split(/\s+/).filter(Boolean);
  const primeiro = normalized(parts[0] ?? "");
  if (parts.length === 1) return primeiro;
  const segundo = normalized(parts[1] ?? "");
  return [primeiro, segundo].filter(Boolean).join(".");
}

export default function CadastroEmpresaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getError, getTouched, touch, validate, handleBlur, handleChange, validateAll } = useValidation();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 - Empresa + Telefone
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [codigoPais, setCodigoPais] = useState("55");
  const [ddd, setDdd] = useState("");
  const [telefone, setTelefone] = useState("");
  const [paises, setPaises] = useState<PaisDdd[]>([]);

  // Step 2 - Endereço
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");

  // Step 3 - Credenciais
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [sucesso, setSucesso] = useState(false);
  const [enderecoCamposVisiveis, setEnderecoCamposVisiveis] = useState(false);
  const [enderecoBuscando, setEnderecoBuscando] = useState(false);
  const [editRua, setEditRua] = useState(true);
  const [editBairro, setEditBairro] = useState(true);
  const [editUf, setEditUf] = useState(true);
  const [editCidade, setEditCidade] = useState(true);
  const [editUsername, setEditUsername] = useState(false);
  const refUsername = useRef<HTMLDivElement>(null);
  const lastCepFetchedRef = useRef<string>("");
  const { estados, getCidadesByUf, loading: loadingEstados } = useEstadosCidades();
  const cidades = getCidadesByUf(uf);

  useEffect(() => {
    fetch("/pais-ddd.json")
      .then((res) => res.json())
      .then((data: PaisDdd[]) => {
        const sorted = [...(data || [])].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        setPaises(sorted);
      })
      .catch(() => setPaises([]));
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    const handleMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (editUsername && refUsername.current && !refUsername.current.contains(t)) setEditUsername(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [step, editUsername]);

  // Autopreenchimento ViaCEP: quando CEP tiver 8 dígitos, busca e preenche logradouro, bairro, cidade, uf (sem botão)
  useEffect(() => {
    const cepDig = cep.replace(/\D/g, "");
    if (cepDig.length < 8) {
      lastCepFetchedRef.current = "";
      setEnderecoCamposVisiveis(false);
      setEnderecoBuscando(false);
      setEditRua(true);
      setEditBairro(true);
      setEditUf(true);
      setEditCidade(true);
      setRua("");
      setBairro("");
      setCidade("");
      setUf("");
      handleChange("rua", "", (v) => validateRua(v, true));
      handleChange("bairro", "", (v) => validateBairro(v, true));
      handleChange("cidade", "", (x) => validateCidade(x, true));
      handleChange("uf", "", (x) => validateUf(x, true));
      return;
    }
    if (lastCepFetchedRef.current === cepDig) return;
    lastCepFetchedRef.current = cepDig;
    setEnderecoBuscando(true);
    let cancelled = false;
    fetch(`https://viacep.com.br/ws/${cepDig}/json/`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setEnderecoBuscando(false);
        if (data.erro || !data) {
          lastCepFetchedRef.current = "";
          touch("cep");
          validate("cep", cep, () => "CEP inválido.");
          return;
        }
        const logradouro = (data.logradouro || "").trim();
        const bairroVal = (data.bairro || "").trim();
        const localidade = (data.localidade || "").trim();
        const ufVal = (data.uf || "").trim();
        setRua(logradouro);
        setBairro(bairroVal);
        setUf(ufVal);
        setCidade(localidade);
        handleChange("rua", logradouro, (v) => validateRua(v, true));
        handleChange("bairro", bairroVal, (v) => validateBairro(v, true));
        handleChange("uf", ufVal, (x) => validateUf(x, true));
        handleChange("cidade", localidade, (x) => validateCidade(x, true));
        touch("numero");
        validate("numero", "", (v) => validateNumeroEndereco(v, true));
        setEditRua(false);
        setEditBairro(false);
        setEditUf(false);
        setEditCidade(false);
        setEnderecoCamposVisiveis(true);
      })
      .catch(() => {
        if (!cancelled) {
          setEnderecoBuscando(false);
          lastCepFetchedRef.current = "";
          touch("cep");
          validate("cep", cep, () => "CEP inválido.");
        }
      });
    return () => { cancelled = true; };
  }, [cep, touch, validate, handleChange]);

  const validateStep1 = () =>
    validateAll([
      ["razaoSocial", razaoSocial, (v) => validateRazaoSocial(v, true)],
      ["cnpj", cnpj, (v) => validateCnpj(v, true)],
      ["codigoPais", codigoPais.replace(/\D/g, ""), (v) => validateCodigoPais(v || null, true)],
      ["ddd", ddd, (v) => validateDdd(v, true)],
      ["telefone", telefone, (v) => validateNumeroTelefone(v, true)],
    ]);
  const validateStep2 = () =>
    validateAll([
      ["rua", rua, (v) => validateRua(v, true)],
      ["numero", numero, (v) => validateNumeroEndereco(v, true)],
      ["complemento", complemento, validateComplemento],
      ["bairro", bairro, (v) => validateBairro(v, true)],
      ["cep", cep, (v) => validateCep(v, true)],
      ["cidade", cidade, (v) => validateCidade(v, true)],
      ["uf", uf, (v) => validateUf(v, true)],
    ]);

  const step1CanGoNext =
    !validateRazaoSocial(razaoSocial, true) &&
    !validateCnpj(cnpj, true) &&
    !validateCodigoPais(codigoPais.replace(/\D/g, "") || null, true) &&
    !validateDdd(ddd, true) &&
    !validateNumeroTelefone(telefone, true);
  const step2CanGoNext =
    !validateRua(rua, true) &&
    !validateNumeroEndereco(numero, true) &&
    !validateBairro(bairro, true) &&
    !validateCep(cep, true) &&
    !validateCidade(cidade, true) &&
    !validateUf(uf, true) &&
    validateComplemento(complemento) === undefined;
  const step3CanSubmit =
    !validateUsername(username, true) &&
    !validateEmail(email, true) &&
    !validateSenha(senha, true) &&
    senha === confirmarSenha &&
    senha.trim().length > 0;

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
    // Usuário vê campos com máscara; para a API enviamos sem máscara.
    const body: Record<string, unknown> = {
      username,
      email,
      senha,
      razaoSocial,
      cnpj: cnpj.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 14), // 14 caracteres, sem pontuação
      empresaEndereco: { rua, numero: numero.replace(/\D/g, ""), complemento: complemento || undefined, bairro, cidade, uf, cep: cep.replace(/\D/g, "") },
      usuarioTelefone: { codigoPais: foneSemZerosEsquerda(codigoPais.replace(/\D/g, "")), ddd: ddd.replace(/\D/g, ""), numero: telefone.replace(/\D/g, "") },
    };

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
        <Card className="w-full max-w-lg border-border shadow-lg">
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
    { n: 3, label: "Acesso" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center pt-24 pb-8 px-4">
        <div className="w-full max-w-2xl space-y-8">
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

        <Card className="w-full border-border shadow-lg min-h-0">
          <CardHeader>
            <CardTitle className="font-display text-xl">Cadastro de Empresa</CardTitle>
            <CardDescription>
              {step === 1 && "Dados da empresa e telefone"}
              {step === 2 && "Endereço da empresa"}
              {step === 3 && "Credenciais de acesso"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-6">
            {step === 1 && (
              <>
                <FieldWithExpected label="Razão Social" required expected={getFieldExpected("razaoSocial")} error={getError("razaoSocial")} showValid={razaoSocial.trim().length > 0}>
                  <Input
                    placeholder="Nome da empresa"
                    value={razaoSocial}
                    onChange={(e) => {
                      const formatted = formatTitleCase(e.target.value);
                      setRazaoSocial(formatted);
                      handleChange("razaoSocial", formatted, (v) => validateRazaoSocial(v, true));
                      const suggested = maskUsernameInput(usernameFromRazaoSocial(formatted));
                      setUsername(suggested);
                      handleChange("username", suggested, (v) => validateUsername(v, true));
                    }}
                    onBlur={() => handleBlur("razaoSocial", razaoSocial, (v) => validateRazaoSocial(v, true))}
                    aria-invalid={!!getError("razaoSocial")}
                    className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base"
                  />
                </FieldWithExpected>
                <FieldWithExpected label="CNPJ" required expected={getFieldExpected("cnpj")} error={getError("cnpj")} showValid={cnpj.replace(/[^A-Za-z0-9]/g, "").length > 0}>
                  <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => { const next = maskCnpjInput(e.target.value); setCnpj(next); handleChange("cnpj", next, (v) => validateCnpj(v, true)); }} onBlur={() => handleBlur("cnpj", cnpj, (v) => validateCnpj(v, true))} aria-invalid={!!getError("cnpj")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <div className="grid grid-cols-4 gap-3">
                  <FieldWithExpected label="País" required expected={getFieldExpected("codigoPais")} error={getError("codigoPais")} showValid={codigoPais.replace(/\D/g, "").length > 0} showExpected={false}>
                    <Select value={codigoPais || undefined} onValueChange={(v) => { setCodigoPais(v); handleChange("codigoPais", v.replace(/\D/g, ""), (x) => validateCodigoPais(x || null, true)); handleBlur("codigoPais", v.replace(/\D/g, ""), (x) => validateCodigoPais(x || null, true)); }} disabled={paises.length === 0}>
                      <SelectTrigger aria-invalid={!!getError("codigoPais")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base">
                        <SelectValue placeholder="Selecione o país" />
                      </SelectTrigger>
                      <SelectContent>
                        {paises.map((p) => {
                          const cod = foneSemZerosEsquerda(p.fone);
                          return <SelectItem key={p.codigo} value={cod}>{p.nome} {cod}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </FieldWithExpected>
                  <FieldWithExpected label="DDD" required expected={getFieldExpected("ddd")} error={getError("ddd")} showValid={ddd.trim().length > 0} showExpected={false}>
                    <Input placeholder="11" maxLength={5} value={ddd} onChange={(e) => { const next = maskDddInput(e.target.value); setDdd(next); handleChange("ddd", next, (v) => validateDdd(v, true)); }} onBlur={() => handleBlur("ddd", ddd, (v) => validateDdd(v, true))} aria-invalid={!!getError("ddd")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                  </FieldWithExpected>
                  <div className="col-span-2">
                    <FieldWithExpected label="Número" required expected={getFieldExpected("numeroTelefone")} error={getError("telefone")} showValid={getTouched("telefone") || telefone.trim().length > 0} showExpected={false}>
                      <Input placeholder="99999-9999" value={telefone} onChange={(e) => { const next = maskNumeroTelefoneInput(e.target.value); setTelefone(next); handleChange("telefone", next, (v) => validateNumeroTelefone(v, true)); }} onBlur={() => handleBlur("telefone", telefone, (v) => validateNumeroTelefone(v, true))} aria-invalid={!!getError("telefone")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                    </FieldWithExpected>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <FieldWithExpected label="CEP" required expected={getFieldExpected("cep")} error={getError("cep")} showValid={cep.replace(/\D/g, "").length > 0}>
                  <Input placeholder="00000-000" value={cep} onChange={(e) => { const next = maskCepInput(e.target.value); setCep(next); handleChange("cep", next, (v) => validateCep(v, true)); }} onBlur={() => handleBlur("cep", cep, (v) => validateCep(v, true))} aria-invalid={!!getError("cep")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                {enderecoBuscando && (
                  <p className="text-sm text-muted-foreground animate-pulse">Buscando endereço...</p>
                )}
                {enderecoCamposVisiveis && (
                <>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="col-span-2">
                    <FieldWithExpected label="Rua" required expected={getFieldExpected("rua")} error={getError("rua")} showValid={rua.trim().length > 0}>
                      <div className="relative">
                        <Input value={rua} disabled={!editRua} onChange={(e) => { const formatted = formatTitleCase(e.target.value); setRua(formatted); handleChange("rua", formatted, (v) => validateRua(v, true)); }} onBlur={() => { handleBlur("rua", rua, (v) => validateRua(v, true)); setEditRua(false); }} aria-invalid={!!getError("rua")} className={cn("mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base pr-12", !editRua && "bg-muted")} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditRua((prev) => !prev)}>
                          {editRua ? <Check className="h-4 w-4 text-green-600" /> : <PencilLine className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FieldWithExpected>
                  </div>
                  <div>
                    <FieldWithExpected label="Número" required expected={getFieldExpected("numeroEndereco")} error={getError("numero")} showValid={numero.trim().length > 0}>
                      <Input value={numero} onChange={(e) => { const next = maskNumeroEnderecoInput(e.target.value); setNumero(next); handleChange("numero", next, (v) => validateNumeroEndereco(v, true)); }} onBlur={() => handleBlur("numero", numero, (v) => validateNumeroEndereco(v, true))} aria-invalid={!!getError("numero")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                    </FieldWithExpected>
                  </div>
                </div>
                <FieldWithExpected label="Complemento (opcional)" expected={getFieldExpected("complemento")} error={getError("complemento")} showValid={complemento.trim().length > 0}>
                  <Input value={complemento} onChange={(e) => { const formatted = formatTitleCase(e.target.value); setComplemento(formatted); handleChange("complemento", formatted, validateComplemento); }} onBlur={() => handleBlur("complemento", complemento, validateComplemento)} aria-invalid={!!getError("complemento")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <FieldWithExpected label="Bairro" required expected={getFieldExpected("bairro")} error={getError("bairro")} showValid={bairro.trim().length > 0}>
                  <div className="relative">
                    <Input value={bairro} disabled={!editBairro} onChange={(e) => { const formatted = formatTitleCase(e.target.value); setBairro(formatted); handleChange("bairro", formatted, (v) => validateBairro(v, true)); }} onBlur={() => { handleBlur("bairro", bairro, (v) => validateBairro(v, true)); setEditBairro(false); }} aria-invalid={!!getError("bairro")} className={cn("mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base pr-12", !editBairro && "bg-muted")} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditBairro((prev) => !prev)}>
                      {editBairro ? <Check className="h-4 w-4 text-green-600" /> : <PencilLine className="h-4 w-4" />}
                    </Button>
                  </div>
                </FieldWithExpected>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <FieldWithExpected label="Estado" required expected={getFieldExpected("uf")} error={getError("uf")} showValid={uf.trim().length > 0}>
                    <div className="relative">
                      <Select value={uf || undefined} onValueChange={(v) => { setUf(v); setCidade(""); handleChange("uf", v, (x) => validateUf(x, true)); handleBlur("uf", v, (x) => validateUf(x, true)); handleChange("cidade", "", (x) => validateCidade(x, true)); }} disabled={loadingEstados || !editUf}>
                        <SelectTrigger aria-invalid={!!getError("uf")} className={cn("mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base pr-12", !editUf && "bg-muted")}>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map((e) => (
                            <SelectItem key={e.sigla} value={e.sigla}>{e.nomeEstado} - {e.sigla}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground z-10" onClick={() => setEditUf((prev) => !prev)}>
                        {editUf ? <Check className="h-4 w-4 text-green-600" /> : <PencilLine className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FieldWithExpected>
                  <FieldWithExpected label="Cidade" required expected={getFieldExpected("cidade")} error={getError("cidade")} showValid={cidade.trim().length > 0} className="col-span-2">
                    <div className="relative">
                      <Select value={cidade || undefined} onValueChange={(v) => { setCidade(v); handleChange("cidade", v, (x) => validateCidade(x, true)); handleBlur("cidade", v, (x) => validateCidade(x, true)); }} disabled={!uf || cidades.length === 0 || !editCidade}>
                        <SelectTrigger aria-invalid={!!getError("cidade")} className={cn("mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base pr-12", !editCidade && "bg-muted")}>
                          <SelectValue placeholder={uf ? "Selecione a cidade" : "Primeiro selecione o estado"} />
                        </SelectTrigger>
                        <SelectContent>
                          {cidades.map((c) => (
                            <SelectItem key={c.id_cidade} value={c.nomeCidade}>{c.nomeCidade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground z-10" onClick={() => setEditCidade((prev) => !prev)}>
                        {editCidade ? <Check className="h-4 w-4 text-green-600" /> : <PencilLine className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FieldWithExpected>
                </div>
                </>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label required>Usuário (login)</Label>
                  <div ref={refUsername} className="relative">
                    <Input
                      value={username}
                      disabled={!editUsername}
                      onChange={(e) => {
                        const next = maskUsernameInput(e.target.value);
                        setUsername(next);
                        handleChange("username", next, (v) => validateUsername(v, true));
                      }}
                      onBlur={() => {
                        handleBlur("username", username, (v) => validateUsername(v, true));
                        setEditUsername(false);
                      }}
                      placeholder="primeiro.segundonome"
                      aria-invalid={!!getError("username")}
                      className={cn("mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base pr-12", !editUsername && "bg-muted")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => (editUsername ? setEditUsername(false) : setEditUsername(true))}
                    >
                      {editUsername ? <Check className="h-4 w-4 text-green-600" /> : <PencilLine className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FieldExpectedStatus fieldKey="username" value={username} error={getError("username")} touched={getTouched("username")} />
                </div>
                <FieldWithExpected label="Email" required expected={getFieldExpected("email")} error={getError("email")} showValid={email.trim().length > 0}>
                  <Input type="email" placeholder="empresa@email.com" value={email} onChange={(e) => { const next = maskEmailInput(e.target.value); setEmail(next); handleChange("email", next, (v) => validateEmail(v, true)); }} onBlur={() => handleBlur("email", email, (v) => validateEmail(v, true))} aria-invalid={!!getError("email")} className="mt-0.5 h-9 text-sm sm:mt-1 sm:h-10 sm:text-base" />
                </FieldWithExpected>
                <FieldWithExpected label="Senha" required expected={getFieldExpected("senha")} error={getError("senha")} showValid={senha.length > 0}>
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
              {step < 3 ? (
                <Button
                  size="sm"
                  onClick={() => {
                    const valid = step === 1 ? validateStep1() : validateStep2();
                    if (valid) setStep((step + 1) as Step);
                  }}
                  disabled={step === 1 ? !step1CanGoNext : !step2CanGoNext}
                  className="gap-1 text-xs sm:text-sm"
                >
                  Próximo <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleSubmit} disabled={loading || !step3CanSubmit} className="text-xs sm:text-sm">
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
