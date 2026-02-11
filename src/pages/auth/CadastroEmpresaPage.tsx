import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CadastroEmpresaRequest } from "@/types/auth";

type Step = 1 | 2 | 3 | 4;

export default function CadastroEmpresaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // Step 3 - Contato
  const [codigoPais, setCodigoPais] = useState("+55");
  const [ddd, setDdd] = useState("");
  const [telefone, setTelefone] = useState("");

  // Step 4 - Credenciais
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async () => {
    if (senha !== confirmarSenha) {
      toast({ variant: "destructive", title: "Erro", description: "As senhas não coincidem." });
      return;
    }

    setLoading(true);
    const body: CadastroEmpresaRequest = {
      username,
      email,
      senha,
      razaoSocial,
      cnpj: cnpj.replace(/\D/g, ""),
      empresaEndereco: { rua, numero, complemento: complemento || undefined, bairro, cidade, uf, cep: cep.replace(/\D/g, "") },
      usuarioTelefone: { codigoPais: codigoPais.replace("+", ""), ddd, numero: telefone },
    };

    try {
      await api.post("/api/empresa", body);
      setSucesso(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no cadastro", description: error.response?.data?.message || "Verifique os dados e tente novamente." });
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Clock className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">PontoSaaS</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between px-4">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.n}
              </div>
              <span className={`hidden text-xs sm:block ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`mx-2 h-0.5 w-6 sm:w-10 ${step > s.n ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
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
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input placeholder="Nome da empresa" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Rua</Label>
                    <Input value={rua} onChange={(e) => setRua(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input value={numero} onChange={(e) => setNumero(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={bairro} onChange={(e) => setBairro(e.target.value)} required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-2">
                    <Label>CEP</Label>
                    <Input placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={cidade} onChange={(e) => setCidade(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input maxLength={2} placeholder="SP" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} required />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input value={codigoPais} onChange={(e) => setCodigoPais(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>DDD</Label>
                  <Input placeholder="11" maxLength={2} value={ddd} onChange={(e) => setDdd(e.target.value)} required />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Número</Label>
                  <Input placeholder="99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
                </div>
              </div>
            )}

            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label>Nome de usuário</Label>
                  <Input placeholder="meunome" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="empresa@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres, 1 maiúscula e 1 número/símbolo</p>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha</Label>
                  <Input type="password" placeholder="••••••••" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required minLength={6} />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep((step - 1) as Step)} className="gap-1">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
              )}
              <div className="flex-1" />
              {step < 4 ? (
                <Button onClick={() => setStep((step + 1) as Step)} className="gap-1">
                  Próximo <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar empresa"}
                </Button>
              )}
            </div>
          </CardContent>

          <div className="px-6 pb-6">
            <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Já tenho conta
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
