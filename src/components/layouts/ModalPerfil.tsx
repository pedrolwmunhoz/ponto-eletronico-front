import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Building2, User } from "lucide-react";
import { getPerfilEmpresa } from "@/lib/api-empresa";
import { getPerfilFuncionario } from "@/lib/api-funcionario";
import {
  atualizarEnderecoEmpresa,
  atualizarJornadaPadrao,
} from "@/lib/api-empresa";
import {
  atualizarPerfilUsuario,
  atualizarEmail,
  adicionarEmail,
  adicionarTelefone,
  removerTelefone,
} from "@/lib/api-usuario";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import {
  validateUsername,
  validateEmail,
  validateCodigoPais,
  validateDdd,
  validateNumeroTelefone,
  validateRua,
  validateNumeroEndereco,
  validateComplemento,
  validateBairro,
  validateCidade,
  validateUf,
  validateCep,
  validateDurationHhmm,
  validateTimezone,
} from "@/lib/validations";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";
import type { TipoUsuario } from "@/types/auth";
import type {
  EmpresaPerfilResponse,
  FuncionarioPerfilResponse,
} from "@/types/empresa";
import {
  TIPO_CONTRATO_OPCOES,
  TIPO_ESCALA_JORNADA_OPCOES,
} from "@/types/empresa";
import { durationToHHmm, hhmmToDuration } from "@/lib/duration";
import { formatCpf, formatCnpj, formatTitleCase, maskCepInput, maskDddInput, maskNumeroTelefoneInput, maskNumeroEnderecoInput } from "@/lib/format";
import { useEstadosCidades } from "@/lib/useEstadosCidades";

interface ModalPerfilEmpresaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: EmpresaPerfilResponse;
}

function ModalPerfilEmpresa({ open, onOpenChange, data }: ModalPerfilEmpresaProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getError, getTouched, handleBlur, handleChange, validateAll, clearAll } = useValidation();
  const { estados, getCidadesByUf, loading: loadingEstados } = useEstadosCidades();
  const [form, setForm] = useState({
    username: data.username ?? "",
    email: data.email ?? "",
    codigoPais: data.codigoPais ?? "55",
    ddd: data.ddd ?? "",
    numero: data.numero ?? "",
    rua: data.rua ?? "",
    numeroEndereco: data.numeroEndereco ?? "",
    complemento: data.complemento ?? "",
    bairro: data.bairro ?? "",
    cidade: data.cidade ?? "",
    uf: (data.uf ?? "").toUpperCase(),
    cep: data.cep ?? "",
    cargaDiariaPadrao: data.cargaDiariaPadrao ?? "",
    cargaSemanalPadrao: data.cargaSemanalPadrao ?? "",
    toleranciaPadrao: data.toleranciaPadrao ?? "",
    intervaloPadrao: data.intervaloPadrao ?? "",
    timezone: data.timezone ?? "America/Sao_Paulo",
    gravarGeolocalizacaoObrigatoria: data.gravarGeolocalizacaoObrigatoria ?? false,
    permitirAjustePontoDireto: data.permitirAjustePontoDireto ?? false,
  });
  const cidades = getCidadesByUf(form.uf);

  useEffect(() => {
    if (open && data) {
      setForm({
        username: data.username ?? "",
        email: data.email ?? "",
        codigoPais: data.codigoPais ?? "55",
        ddd: data.ddd ?? "",
        numero: data.numero ?? "",
        rua: data.rua ?? "",
        numeroEndereco: data.numeroEndereco ?? "",
        complemento: data.complemento ?? "",
        bairro: data.bairro ?? "",
        cidade: data.cidade ?? "",
        uf: (data.uf ?? "").toUpperCase(),
        cep: data.cep ?? "",
        cargaDiariaPadrao: data.cargaDiariaPadrao ?? "",
        cargaSemanalPadrao: data.cargaSemanalPadrao ?? "",
        toleranciaPadrao: data.toleranciaPadrao ?? "",
        intervaloPadrao: data.intervaloPadrao ?? "",
        timezone: data.timezone ?? "America/Sao_Paulo",
        gravarGeolocalizacaoObrigatoria: data.gravarGeolocalizacaoObrigatoria ?? false,
        permitirAjustePontoDireto: data.permitirAjustePontoDireto ?? false,
      });
      clearAll();
    }
  }, [open, data, clearAll]);

  const hasChanges =
    form.username.trim() !== (data.username ?? "") ||
    form.email.trim().toLowerCase() !== (data.email ?? "").toLowerCase() ||
    form.codigoPais !== (data.codigoPais ?? "55") ||
    form.ddd !== (data.ddd ?? "") ||
    form.numero !== (data.numero ?? "") ||
    form.rua !== (data.rua ?? "") ||
    form.numeroEndereco !== (data.numeroEndereco ?? "") ||
    form.complemento !== (data.complemento ?? "") ||
    form.bairro !== (data.bairro ?? "") ||
    form.cidade !== (data.cidade ?? "") ||
    form.uf !== (data.uf ?? "").toUpperCase() ||
    form.cep !== (data.cep ?? "") ||
    form.cargaDiariaPadrao !== (data.cargaDiariaPadrao ?? "") ||
    form.cargaSemanalPadrao !== (data.cargaSemanalPadrao ?? "") ||
    form.toleranciaPadrao !== (data.toleranciaPadrao ?? "") ||
    form.intervaloPadrao !== (data.intervaloPadrao ?? "") ||
    form.timezone !== (data.timezone ?? "") ||
    form.gravarGeolocalizacaoObrigatoria !== (data.gravarGeolocalizacaoObrigatoria ?? false) ||
    form.permitirAjustePontoDireto !== (data.permitirAjustePontoDireto ?? false);

  const mutation = useMutation({
    mutationFn: async () => {
      const ok = validateAll([
        ["username", form.username, (v) => validateUsername(v, true)],
        ["email", form.email, (v) => validateEmail(v, true)],
        ["codigoPais", form.codigoPais, (v) => validateCodigoPais(v, true)],
        ["ddd", form.ddd, (v) => validateDdd(v, true)],
        ["numero", form.numero, (v) => validateNumeroTelefone(v, true)],
        ["rua", form.rua, (v) => validateRua(v, true)],
        ["numeroEndereco", form.numeroEndereco, (v) => validateNumeroEndereco(v, true)],
        ["complemento", form.complemento, validateComplemento],
        ["bairro", form.bairro, (v) => validateBairro(v, true)],
        ["cidade", form.cidade, (v) => validateCidade(v, true)],
        ["uf", form.uf, (v) => validateUf(v, true)],
        ["cep", form.cep, (v) => validateCep(v, true)],
        ["cargaDiariaPadrao", durationToHHmm(form.cargaDiariaPadrao ?? ""), (v) => validateDurationHhmm(v, true)],
        ["cargaSemanalPadrao", durationToHHmm(form.cargaSemanalPadrao ?? ""), (v) => validateDurationHhmm(v, true)],
        ["toleranciaPadrao", durationToHHmm(form.toleranciaPadrao ?? "PT0S"), (v) => validateDurationHhmm(v, true)],
        ["intervaloPadrao", durationToHHmm(form.intervaloPadrao ?? ""), (v) => validateDurationHhmm(v, true)],
        ["timezone", form.timezone, (v) => validateTimezone(v, true)],
      ]);
      if (!ok) {
        toast({ variant: "destructive", title: "Corrija os erros antes de salvar." });
        return;
      }
      const tasks: Array<() => Promise<void>> = [];
      if (form.username.trim() !== (data.username ?? "")) {
        tasks.push(() => atualizarPerfilUsuario({ username: form.username.trim() }));
      }
      const emailChanged = form.email.trim().toLowerCase() !== (data.email ?? "").toLowerCase();
      if (emailChanged && form.email.trim()) {
        if (data.email) {
          tasks.push(() => atualizarEmail({ novoEmail: form.email.trim().toLowerCase() }));
        } else {
          tasks.push(() => adicionarEmail({ novoEmail: form.email.trim().toLowerCase() }));
        }
      }
      const telefoneChanged =
        form.codigoPais !== (data.codigoPais ?? "") ||
        form.ddd !== (data.ddd ?? "") ||
        form.numero !== (data.numero ?? "");
      if (telefoneChanged) {
        const hadTelefone = !!data.telefoneId && (data.codigoPais ?? data.ddd ?? data.numero);
        const hasNewTelefone = !!(form.codigoPais?.trim() && form.ddd?.trim() && form.numero?.trim());
        if (hadTelefone && data.telefoneId) tasks.push(() => removerTelefone(data.telefoneId!));
        if (hasNewTelefone) {
          tasks.push(() =>
            adicionarTelefone({
              codigoPais: form.codigoPais.replace(/\D/g, "").trim(),
              ddd: form.ddd.replace(/\D/g, "").trim(),
              numero: form.numero.replace(/\D/g, "").trim(),
            })
          );
        }
      }
      const enderecoChanged =
        form.rua !== (data.rua ?? "") ||
        form.numeroEndereco !== (data.numeroEndereco ?? "") ||
        form.complemento !== (data.complemento ?? "") ||
        form.bairro !== (data.bairro ?? "") ||
        form.cidade !== (data.cidade ?? "") ||
        form.uf !== (data.uf ?? "").toUpperCase() ||
        form.cep !== (data.cep ?? "");
      if (enderecoChanged && form.rua?.trim() && form.numeroEndereco?.trim() && form.bairro?.trim() && form.cidade?.trim() && form.uf?.length === 2 && form.cep?.replace(/\D/g, "").length === 8) {
        tasks.push(() =>
          atualizarEnderecoEmpresa({
            rua: form.rua.trim(),
            numero: form.numeroEndereco.replace(/\D/g, "") || form.numeroEndereco,
            complemento: form.complemento?.trim() ?? null,
            bairro: form.bairro.trim(),
            cidade: form.cidade.trim(),
            uf: form.uf.toUpperCase(),
            cep: form.cep.replace(/\D/g, ""),
          })
        );
      }
      const jornadaChanged =
        form.cargaDiariaPadrao !== (data.cargaDiariaPadrao ?? "") ||
        form.cargaSemanalPadrao !== (data.cargaSemanalPadrao ?? "") ||
        form.toleranciaPadrao !== (data.toleranciaPadrao ?? "") ||
        form.intervaloPadrao !== (data.intervaloPadrao ?? "") ||
        form.timezone !== (data.timezone ?? "") ||
        form.gravarGeolocalizacaoObrigatoria !== (data.gravarGeolocalizacaoObrigatoria ?? false) ||
        form.permitirAjustePontoDireto !== (data.permitirAjustePontoDireto ?? false);
      if (jornadaChanged && form.cargaDiariaPadrao && form.cargaSemanalPadrao && form.toleranciaPadrao && form.intervaloPadrao) {
        tasks.push(() =>
          atualizarJornadaPadrao({
            tipoEscalaJornadaId: 1,
            cargaHorariaDiaria: form.cargaDiariaPadrao,
            cargaHorariaSemanal: form.cargaSemanalPadrao,
            toleranciaPadrao: form.toleranciaPadrao || "PT0S",
            intervaloPadrao: form.intervaloPadrao,
            tempoDescansoEntreJornada: "PT11H",
            entradaPadrao: "08:00",
            saidaPadrao: "17:00",
            timezone: form.timezone || "America/Sao_Paulo",
            gravaGeoObrigatoria: form.gravarGeolocalizacaoObrigatoria,
            gravaPontoApenasEmGeofence: false,
            permiteAjustePonto: form.permitirAjustePontoDireto,
          } as Parameters<typeof atualizarJornadaPadrao>[0])
        );
      }
      if (tasks.length === 0) {
        toast({ title: "Nenhuma alteração detectada.", variant: "default" });
        return;
      }
      for (const task of tasks) await task();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["perfil", "EMPRESA"] });
      toast({ title: "Perfil atualizado.", description: "As alterações foram salvas." });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (err as Error)?.message;
      toast({ variant: "destructive", title: "Erro ao salvar", description: msg });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] h-[min(680px,92vh)] max-h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Perfil da empresa</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{data.razaoSocial ?? "—"}</h3>
            <p className="text-sm text-muted-foreground">{data.email ?? "—"}</p>
          </div>
        </div>
        <Tabs defaultValue="fiscal" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mb-4 flex flex-wrap gap-1 shrink-0">
            <TabsTrigger value="fiscal">Empresa</TabsTrigger>
            <TabsTrigger value="telefone">Telefone</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
            <TabsTrigger value="jornada">Jornada Padrão</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          <TabsContent value="fiscal" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">CNPJ</Label>
                  <Input value={data.cnpj ? formatCnpj(data.cnpj) : ""} disabled className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Razão Social</Label>
                  <Input value={data.razaoSocial ?? ""} disabled className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm font-medium" required>Username</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => { setForm((p) => ({ ...p, username: e.target.value })); handleChange("username", e.target.value, (v) => validateUsername(v, true)); }}
                    onBlur={() => handleBlur("username", form.username, (v) => validateUsername(v, true))}
                    className="mt-1"
                    aria-invalid={!!getError("username")}
                  />
                  <FieldExpectedStatus fieldKey="username" value={form.username} error={getError("username")} touched={getTouched("username")} />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium" required>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); handleChange("email", e.target.value, (v) => validateEmail(v, true)); }}
                    onBlur={() => handleBlur("email", form.email, (v) => validateEmail(v, true))}
                    className="mt-1"
                    aria-invalid={!!getError("email")}
                  />
                  <FieldExpectedStatus fieldKey="email" value={form.email} error={getError("email")} touched={getTouched("email")} />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="telefone" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium" required>Código País</Label>
                  <Input
                    value={form.codigoPais}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 10); setForm((p) => ({ ...p, codigoPais: v })); handleChange("codigoPais", v, (x) => validateCodigoPais(x, true)); }}
                    onBlur={() => handleBlur("codigoPais", form.codigoPais, (v) => validateCodigoPais(v, true))}
                    placeholder="55"
                    className="mt-1"
                    aria-invalid={!!getError("codigoPais")}
                  />
                  <FieldExpectedStatus fieldKey="codigoPais" value={form.codigoPais} error={getError("codigoPais")} touched={getTouched("codigoPais")} />
                </div>
                <div>
                  <Label className="text-sm font-medium" required>DDD</Label>
                  <Input
                    value={form.ddd}
                    onChange={(e) => { const next = maskDddInput(e.target.value); setForm((p) => ({ ...p, ddd: next })); handleChange("ddd", next, (v) => validateDdd(v, true)); }}
                    onBlur={() => handleBlur("ddd", form.ddd, (v) => validateDdd(v, true))}
                    placeholder="11"
                    className="mt-1"
                    aria-invalid={!!getError("ddd")}
                  />
                  <FieldExpectedStatus fieldKey="ddd" value={form.ddd} error={getError("ddd")} touched={getTouched("ddd")} />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium" required>Número</Label>
                  <Input
                    value={form.numero}
                    onChange={(e) => { const next = maskNumeroTelefoneInput(e.target.value); setForm((p) => ({ ...p, numero: next })); handleChange("numero", next, (v) => validateNumeroTelefone(v, true)); }}
                    onBlur={() => handleBlur("numero", form.numero, (v) => validateNumeroTelefone(v, true))}
                    placeholder="99999-9999"
                    className="mt-1"
                    aria-invalid={!!getError("numero")}
                  />
                  <FieldExpectedStatus fieldKey="numeroTelefone" value={form.numero} error={getError("numero")} touched={getTouched("numero")} />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="endereco" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label className="text-sm font-medium" required>Rua</Label>
                  <Input
                    value={form.rua}
                    onChange={(e) => { const formatted = formatTitleCase(e.target.value); setForm((p) => ({ ...p, rua: formatted })); handleChange("rua", formatted, (v) => validateRua(v, true)); }}
                    onBlur={() => handleBlur("rua", form.rua, (v) => validateRua(v, true))}
                    className="mt-1"
                    aria-invalid={!!getError("rua")}
                  />
                  <FieldExpectedStatus fieldKey="rua" value={form.rua} error={getError("rua")} touched={getTouched("rua")} />
                </div>
                <div>
                  <Label className="text-sm font-medium" required>Número</Label>
                  <Input
                    value={form.numeroEndereco}
                    onChange={(e) => { const next = maskNumeroEnderecoInput(e.target.value); setForm((p) => ({ ...p, numeroEndereco: next })); handleChange("numeroEndereco", next, (v) => validateNumeroEndereco(v, true)); }}
                    onBlur={() => handleBlur("numeroEndereco", form.numeroEndereco, (v) => validateNumeroEndereco(v, true))}
                    placeholder="Ex: 100"
                    className="mt-1"
                    aria-invalid={!!getError("numeroEndereco")}
                  />
                  <FieldExpectedStatus fieldKey="numeroEndereco" value={form.numeroEndereco} error={getError("numeroEndereco")} touched={getTouched("numeroEndereco")} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Complemento</Label>
                <Input
                  value={form.complemento}
                  onChange={(e) => { const formatted = formatTitleCase(e.target.value); setForm((p) => ({ ...p, complemento: formatted })); handleChange("complemento", formatted, validateComplemento); }}
                  onBlur={() => handleBlur("complemento", form.complemento, validateComplemento)}
                  className="mt-1"
                  aria-invalid={!!getError("complemento")}
                />
                <FieldExpectedStatus fieldKey="complemento" value={form.complemento} error={getError("complemento")} touched={getTouched("complemento")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium" required>Estado</Label>
                  <Select value={form.uf || undefined} onValueChange={(v) => { setForm((p) => ({ ...p, uf: v, cidade: "" })); handleChange("uf", v, (x) => validateUf(x, true)); handleBlur("uf", v, (x) => validateUf(x, true)); handleChange("cidade", "", (x) => validateCidade(x, true)); }} disabled={loadingEstados}>
                    <SelectTrigger className="mt-1" aria-invalid={!!getError("uf")}>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((e) => (
                        <SelectItem key={e.sigla} value={e.sigla}>{e.nomeEstado} - {e.sigla}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldExpectedStatus fieldKey="uf" value={form.uf} error={getError("uf")} touched={getTouched("uf")} />
                </div>
                <div>
                  <Label className="text-sm font-medium" required>Cidade</Label>
                  <Select value={form.cidade || undefined} onValueChange={(v) => { setForm((p) => ({ ...p, cidade: v })); handleChange("cidade", v, (x) => validateCidade(x, true)); handleBlur("cidade", v, (x) => validateCidade(x, true)); }} disabled={!form.uf || cidades.length === 0}>
                    <SelectTrigger className="mt-1" aria-invalid={!!getError("cidade")}>
                      <SelectValue placeholder={form.uf ? "Selecione a cidade" : "Primeiro selecione o estado"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cidades.map((c) => (
                        <SelectItem key={c.id_cidade} value={c.nomeCidade}>{c.nomeCidade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldExpectedStatus fieldKey="cidade" value={form.cidade} error={getError("cidade")} touched={getTouched("cidade")} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium" required>Bairro</Label>
                <Input
                  value={form.bairro}
                  onChange={(e) => { const formatted = formatTitleCase(e.target.value); setForm((p) => ({ ...p, bairro: formatted })); handleChange("bairro", formatted, (v) => validateBairro(v, true)); }}
                  onBlur={() => handleBlur("bairro", form.bairro, (v) => validateBairro(v, true))}
                  className="mt-1"
                  aria-invalid={!!getError("bairro")}
                />
                <FieldExpectedStatus fieldKey="bairro" value={form.bairro} error={getError("bairro")} touched={getTouched("bairro")} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium" required>CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={(e) => { const next = maskCepInput(e.target.value); setForm((p) => ({ ...p, cep: next })); handleChange("cep", next, (v) => validateCep(v, true)); }}
                    onBlur={() => handleBlur("cep", form.cep, (v) => validateCep(v, true))}
                    placeholder="00000-000"
                    className="mt-1"
                    aria-invalid={!!getError("cep")}
                  />
                  <FieldExpectedStatus fieldKey="cep" value={form.cep} error={getError("cep")} touched={getTouched("cep")} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <Input
                    value={form.timezone}
                    onChange={(e) => { setForm((p) => ({ ...p, timezone: e.target.value })); handleChange("timezone", e.target.value, (v) => validateTimezone(v, true)); }}
                    onBlur={() => handleBlur("timezone", form.timezone, (v) => validateTimezone(v, true))}
                    className="mt-1"
                    aria-invalid={!!getError("timezone")}
                  />
                  <FieldExpectedStatus fieldKey="timezone" value={form.timezone} error={getError("timezone")} touched={getTouched("timezone")} />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="jornada" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium" required>Carga Diária Padrão</Label>
                <Input
                  value={durationToHHmm(form.cargaDiariaPadrao ?? "")}
                  onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, cargaDiariaPadrao: hhmmToDuration(v) })); handleChange("cargaDiariaPadrao", v, (x) => validateDurationHhmm(x, true)); }}
                  onBlur={() => handleBlur("cargaDiariaPadrao", durationToHHmm(form.cargaDiariaPadrao ?? ""), (v) => validateDurationHhmm(v, true))}
                  placeholder="08:00"
                  className="mt-1"
                  aria-invalid={!!getError("cargaDiariaPadrao")}
                />
                <FieldExpectedStatus fieldKey="cargaDiariaPadrao" value={durationToHHmm(form.cargaDiariaPadrao ?? "")} error={getError("cargaDiariaPadrao")} touched={getTouched("cargaDiariaPadrao")} />
              </div>
              <div>
                <Label className="text-sm font-medium" required>Carga Semanal Padrão</Label>
                <Input
                  value={durationToHHmm(form.cargaSemanalPadrao ?? "")}
                  onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, cargaSemanalPadrao: hhmmToDuration(v) })); handleChange("cargaSemanalPadrao", v, (x) => validateDurationHhmm(x, true)); }}
                  onBlur={() => handleBlur("cargaSemanalPadrao", durationToHHmm(form.cargaSemanalPadrao ?? ""), (v) => validateDurationHhmm(v, true))}
                  placeholder="44:00"
                  className="mt-1"
                  aria-invalid={!!getError("cargaSemanalPadrao")}
                />
                <FieldExpectedStatus fieldKey="cargaSemanalPadrao" value={durationToHHmm(form.cargaSemanalPadrao ?? "")} error={getError("cargaSemanalPadrao")} touched={getTouched("cargaSemanalPadrao")} />
              </div>
              <div>
                <Label className="text-sm font-medium" required>Tolerância Padrão</Label>
                <Input
                  value={durationToHHmm(form.toleranciaPadrao ?? "PT0S")}
                  onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, toleranciaPadrao: hhmmToDuration(v) || "PT0S" })); handleChange("toleranciaPadrao", v, (x) => validateDurationHhmm(x, true)); }}
                  onBlur={() => handleBlur("toleranciaPadrao", durationToHHmm(form.toleranciaPadrao ?? "PT0S"), (v) => validateDurationHhmm(v, true))}
                  placeholder="00:00"
                  className="mt-1"
                  aria-invalid={!!getError("toleranciaPadrao")}
                />
                <FieldExpectedStatus fieldKey="toleranciaPadrao" value={durationToHHmm(form.toleranciaPadrao ?? "PT0S")} error={getError("toleranciaPadrao")} touched={getTouched("toleranciaPadrao")} />
              </div>
              <div>
                <Label className="text-sm font-medium" required>Intervalo Padrão</Label>
                <Input
                  value={durationToHHmm(form.intervaloPadrao ?? "")}
                  onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, intervaloPadrao: hhmmToDuration(v) })); handleChange("intervaloPadrao", v, (x) => validateDurationHhmm(x, true)); }}
                  onBlur={() => handleBlur("intervaloPadrao", durationToHHmm(form.intervaloPadrao ?? ""), (v) => validateDurationHhmm(v, true))}
                  placeholder="01:00"
                  className="mt-1"
                  aria-invalid={!!getError("intervaloPadrao")}
                />
                <FieldExpectedStatus fieldKey="intervaloPadrao" value={durationToHHmm(form.intervaloPadrao ?? "")} error={getError("intervaloPadrao")} touched={getTouched("intervaloPadrao")} />
              </div>
              <div className="col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.gravarGeolocalizacaoObrigatoria}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, gravarGeolocalizacaoObrigatoria: !!v }))}
                  />
                  <Label className="text-sm font-medium">Gravar Geolocalização Obrigatória</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.permitirAjustePontoDireto}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, permitirAjustePontoDireto: !!v }))}
                  />
                  <Label className="text-sm font-medium">Permitir Ajuste de Ponto Direto</Label>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="compliance" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={data.controlePontoObrigatorio ?? false} disabled />
                <Label className="text-sm font-medium">Controle de Ponto Obrigatório</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Tipo de Modelo de Ponto</Label>
                  <Input value={data.tipoModeloPonto ?? ""} disabled className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Tempo de Retenção (anos)</Label>
                  <Input type="number" value={data.tempoRetencao ?? ""} disabled className="mt-1 bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={data.auditoriaAtiva ?? false} disabled />
                  <Label className="text-sm font-medium">Auditoria Ativa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={data.assinaturaDigitalObrigatoria ?? false} disabled />
                  <Label className="text-sm font-medium">Assinatura Digital Obrigatória</Label>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Campos com * são obrigatórios.</p>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !hasChanges}>
            {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ModalPerfilProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: TipoUsuario;
  perfil?: EmpresaPerfilResponse | FuncionarioPerfilResponse | null;
}

export function ModalPerfil({
  open,
  onOpenChange,
  userType,
  perfil: perfilProp,
}: ModalPerfilProps) {
  const isEmpresa = userType === "EMPRESA";
  const { data: perfilFetched } = useQuery({
    queryKey: ["perfil", userType],
    queryFn: isEmpresa ? getPerfilEmpresa : getPerfilFuncionario,
    enabled: open && (userType === "EMPRESA" || userType === "FUNCIONARIO"),
    retry: false,
  });
  const data = (perfilProp ?? perfilFetched) as EmpresaPerfilResponse | FuncionarioPerfilResponse | undefined;

  if (open && !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            Carregando perfil...
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data) return null;

  if (isEmpresa) {
    return (
      <ModalPerfilEmpresa
        open={open}
        onOpenChange={onOpenChange}
        data={data as EmpresaPerfilResponse}
      />
    );
  }

  // Funcionário
  const funcData = data as FuncionarioPerfilResponse;
  const contrato = funcData?.contratoFuncionario;
  const jornada = funcData?.jornadaFuncionarioConfig;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] h-[min(680px,90vh)] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Meu perfil</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 mb-6 shrink-0">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {funcData?.nomeCompleto ?? "—"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {funcData?.email ?? "—"}
            </p>
          </div>
        </div>
        <Tabs defaultValue="dados" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mb-4 flex flex-wrap gap-1 shrink-0">
            <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="telefone">Telefone</TabsTrigger>
            <TabsTrigger value="contrato">Contrato</TabsTrigger>
            <TabsTrigger value="jornada">Jornada</TabsTrigger>
            <TabsTrigger value="ponto">Controle Ponto</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={funcData?.funcionarioAtivo ?? false}
                  disabled
                />
                <Label className="text-sm font-medium">Funcionário Ativo</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome Completo</Label>
                  <Input
                    value={funcData?.nomeCompleto ?? ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <Input
                    value={funcData?.username ?? ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">CPF</Label>
                  <Input
                    value={funcData?.cpf ? formatCpf(funcData.cpf) : ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Data Nascimento</Label>
                  <Input
                    type="date"
                    value={funcData?.dataNascimento ?? ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Matrícula</Label>
                  <Input
                    value={funcData?.matricula ?? ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">E-mail</Label>
                  <Input
                    type="email"
                    value={funcData?.email ?? ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="telefone" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Código País</Label>
                  <Input
                    value={funcData?.usuarioTelefone?.codigoPais ?? ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">DDD</Label>
                  <Input
                    value={funcData?.usuarioTelefone?.ddd ?? ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Número</Label>
                  <Input
                    value={funcData?.usuarioTelefone?.numero ?? ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="contrato" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              {contrato ? (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={contrato.ativo} disabled />
                    <Label className="text-sm font-medium">Contrato Ativo</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Cargo</Label>
                      <Input
                        value={contrato.cargo ?? ""}
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Departamento</Label>
                      <Input
                        value={contrato.departamento ?? ""}
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tipo de Contrato</Label>
                      <Input
                        value={
                          TIPO_CONTRATO_OPCOES.find((o) => o.id === contrato.tipoContratoId)
                            ?.descricao ?? "—"
                        }
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Data de Admissão</Label>
                      <Input
                        type="date"
                        value={contrato.dataAdmissao ?? ""}
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Data de Demissão</Label>
                      <Input
                        type="date"
                        value={contrato.dataDemissao ?? ""}
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Salário Mensal</Label>
                      <Input
                        value={
                          contrato.salarioMensal != null
                            ? `R$ ${contrato.salarioMensal.toLocaleString("pt-BR")}`
                            : ""
                        }
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Salário Hora</Label>
                      <Input
                        value={
                          contrato.salarioHora != null
                            ? `R$ ${contrato.salarioHora.toLocaleString("pt-BR")}`
                            : ""
                        }
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Contrato não informado.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="jornada" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              {jornada ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tipo de Escala</Label>
                    <Input
                      value={
                        TIPO_ESCALA_JORNADA_OPCOES.find(
                          (o) => o.id === jornada.tipoEscalaJornadaId,
                        )?.descricao ?? "—"
                      }
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Carga Horária Diária</Label>
                    <Input
                      value={durationToHHmm(jornada.cargaHorariaDiaria ?? "")}
                      disabled
                      placeholder="08:00"
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Carga Horária Semanal</Label>
                    <Input
                      value={durationToHHmm(jornada.cargaHorariaSemanal ?? "")}
                      disabled
                      placeholder="44:00"
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Entrada Padrão</Label>
                    <Input
                      value={jornada.entradaPadrao ?? ""}
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Saída Padrão</Label>
                    <Input
                      value={jornada.saidaPadrao ?? ""}
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Intervalo Padrão</Label>
                    <Input
                      value={durationToHHmm(jornada.intervaloPadrao ?? "")}
                      disabled
                      placeholder="01:00"
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={jornada.gravaGeoObrigatoria} disabled />
                      <Label className="text-sm font-medium">
                        Gravar Geolocalização Obrigatória
                      </Label>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Jornada não configurada.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="ponto" className="min-h-[280px] overflow-y-auto data-[state=inactive]:hidden">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configurações de controle de ponto são definidas pela empresa. A tolerância e
                gravação de geolocalização seguem a jornada configurada.
              </p>
              {jornada && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tolerância</Label>
                    <Input
                      value={durationToHHmm(jornada.toleranciaPadrao ?? "PT0S")}
                      disabled
                      placeholder="00:00"
                      className="mt-1 bg-muted"
                    />
                  </div>
                  <div className="flex items-center gap-2 self-end pb-2">
                    <Checkbox checked={jornada.gravaGeoObrigatoria} disabled />
                    <Label className="text-sm font-medium">
                      Gravar Geolocalização Obrigatória
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
