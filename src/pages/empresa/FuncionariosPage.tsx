import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Users, Search, Plus, Trash2, MoreVertical, Pencil, Key, Mail, Unlock, PencilLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import { formatCpf, formatSalarioDisplay, formatTelefoneNumero, formatTitleCase, maskCpfInput, maskDddInput, maskNumeroTelefoneInput, maskPisPasepInput, maskUsernameInput, maskEmailInput } from "@/lib/format";
import type { ValidationResult } from "@/lib/validations";
import {
  validateUsername,
  validateEmail,
  validateCpf,
  validateNomeCompleto,
  validatePrimeiroNome,
  validateUltimoNome,
  validateSenha,
  validateCargo,
  validateCodigoPais,
  validateDdd,
  validateNumeroTelefone,
  validateData,
  validateDataAdmissao,
  validateMatricula,
  validateComplemento,
  validatePisPasep,
  validateSalarioObrigatorio,
  validateDurationHhmm,
  validateDurationHhmmCargaDiaria,
  validateDurationHhmmIntervalo,
  validateDurationHhmmTolerancia,
  validateHorario,
  validateRequiredSelect,
  getFieldExpected,
} from "@/lib/validations";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";
import {
  listarFuncionarios,
  listarGeofences,
  deletarFuncionario,
  criarFuncionario,
  atualizarFuncionario,
  resetarSenhaFuncionario,
  resetarEmailFuncionario,
  desbloquearFuncionario,
  getPerfilFuncionario,
} from "@/lib/api-empresa";
import type {
  FuncionarioListagemResponse,
  FuncionarioCreateRequest,
  FuncionarioUpdateRequest,
  ContratoFuncionarioRequest,
  JornadaFuncionarioConfigRequest,
} from "@/types/empresa";
import { TIPO_CONTRATO_OPCOES, TIPO_ESCALA_JORNADA_OPCOES } from "@/types/empresa";

function formatTelefones(telefones: { codigoPais: string; ddd: string; numero: string }[]): string {
  if (!telefones?.length) return "—";
  return telefones.map((t) => `+${t.codigoPais} (${t.ddd}) ${t.numero}`).join(", ");
}

const emptyForm = (): FuncionarioCreateRequest => ({
  username: "",
  nomeCompleto: "",
  primeiroNome: "",
  ultimoNome: "",
  cpf: "",
  dataNascimento: null,
  email: "",
  senha: "",
  usuarioTelefone: null,
  contratoFuncionario: null,
  jornadaFuncionarioConfig: null,
  geofenceIds: null,
});

/** Auto-completa primeiro, último e username a partir do nome completo. Só preenche sobrenome e ".sobrenome" no usuário quando houver mais de um nome. */
function fillFromNomeCompleto(nomeCompleto: string): { primeiroNome: string; ultimoNome: string; username: string } {
  const t = nomeCompleto.trim();
  if (!t) return { primeiroNome: "", ultimoNome: "", username: "" };
  const parts = t.split(/\s+/).filter(Boolean);
  const primeiro = parts[0] ?? "";
  if (parts.length === 1) return { primeiroNome: primeiro, ultimoNome: "", username: primeiro.toLowerCase() };
  const ultimo = parts[parts.length - 1] ?? "";
  const username = [primeiro, ultimo].filter(Boolean).map((s) => s.toLowerCase()).join(".");
  return { primeiroNome: primeiro, ultimoNome: ultimo, username };
}

/** Valores iniciais para aba Contrato (opcional). */
const emptyContrato = (): ContratoFuncionarioRequest => ({
  matricula: null,
  pisPasep: null,
  cargo: "",
  departamento: null,
  tipoContratoId: 0,
  ativo: true,
  dataAdmissao: "",
  dataDemissao: null,
  salarioMensal: 0,
  salarioHora: 0,
});

/** Valores iniciais para aba Jornada (opcional). Durações em ISO-8601 (valor só na UI). */
const emptyJornada = (): JornadaFuncionarioConfigRequest => ({
  tipoEscalaJornadaId: 0,
  cargaHorariaDiaria: "PT8H",
  cargaHorariaSemanal: "PT44H",
  toleranciaPadrao: "PT0S",
  intervaloPadrao: "PT1H",
  tempoDescansoEntreJornada: "PT11H",
  entradaPadrao: "08:00",
  saidaPadrao: "17:00",
  gravaGeoObrigatoria: false,
});

import { durationToHHmm, hhmmToDuration, clampDurationHHmmTo44, clampDurationHHmmTo6, clampDurationHHmmTo12 } from "@/lib/duration";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination-constants";

export default function FuncionariosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getError, getTouched, handleBlur, handleChange, validateAll, clearError } = useValidation();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [nome, setNome] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FuncionarioListagemResponse | null>(null);

  const [formOpen, setFormOpen] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<FuncionarioListagemResponse | null>(null);
  const [form, setForm] = useState<FuncionarioCreateRequest>(emptyForm());
  const [ativarTelefone, setAtivarTelefone] = useState(false);
  const [ativarContrato, setAtivarContrato] = useState(false);
  const [ativarJornada, setAtivarJornada] = useState(false);
  const [ativarGeofences, setAtivarGeofences] = useState(false);
  const [senhaNova, setSenhaNova] = useState("");
  const [emailNovo, setEmailNovo] = useState("");
  const [resetSenhaTarget, setResetSenhaTarget] = useState<FuncionarioListagemResponse | null>(null);
  const [resetEmailTarget, setResetEmailTarget] = useState<FuncionarioListagemResponse | null>(null);
  const [salarioMensalInput, setSalarioMensalInput] = useState("");
  const [salarioHoraInput, setSalarioHoraInput] = useState("");
  const [editPrimeiroNome, setEditPrimeiroNome] = useState(false);
  const [editUltimoNome, setEditUltimoNome] = useState(false);
  const [editUsername, setEditUsername] = useState(false);
  const [durationDisplays, setDurationDisplays] = useState<Record<string, string>>({});
  const refPrimeiroNome = useRef<HTMLDivElement>(null);
  const refUltimoNome = useRef<HTMLDivElement>(null);
  const refUsername = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resetSenhaTarget) {
      setSenhaNova("");
      clearError("resetSenhaNova");
    }
  }, [resetSenhaTarget, clearError]);
  useEffect(() => {
    if (resetEmailTarget) {
      setEmailNovo("");
      clearError("resetEmailNovo");
    }
  }, [resetEmailTarget, clearError]);

  useEffect(() => {
    if (formOpen === null) return;
    const handleMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (editPrimeiroNome && refPrimeiroNome.current && !refPrimeiroNome.current.contains(t)) setEditPrimeiroNome(false);
      if (editUltimoNome && refUltimoNome.current && !refUltimoNome.current.contains(t)) setEditUltimoNome(false);
      if (editUsername && refUsername.current && !refUsername.current.contains(t)) setEditUsername(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [formOpen, editPrimeiroNome, editUltimoNome, editUsername]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["empresa", "funcionarios", page, pageSize, nome],
    queryFn: () => listarFuncionarios({ page, pageSize, nome: nome || undefined }),
  });

  useEffect(() => {
    if (isError && error) {
      const msg = (error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar funcionários.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    }
  }, [isError, error, toast]);

  const { data: geofencesData } = useQuery({
    queryKey: ["empresa", "geofences", "all"],
    queryFn: () => listarGeofences({ page: 0, size: 500 }),
    enabled: formOpen !== null,
  });
  const geofencesList = geofencesData?.conteudo ?? [];

  const deleteMutation = useMutation({
    mutationFn: (funcionarioId: string) => deletarFuncionario(funcionarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "funcionarios"] });
      setDeleteTarget(null);
      toast({ title: "Funcionário removido", description: "O registro foi desativado com sucesso." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: err.response?.data?.mensagem ?? "Não foi possível remover o funcionário.",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: FuncionarioCreateRequest) => criarFuncionario(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "funcionarios"] });
      setFormOpen(null);
      setForm(emptyForm());
      toast({ title: "Funcionário criado", description: "Novo funcionário cadastrado com sucesso." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar",
        description: err.response?.data?.mensagem ?? "Não foi possível criar o funcionário.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FuncionarioUpdateRequest }) =>
      atualizarFuncionario(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "funcionarios"] });
      setFormOpen(null);
      setEditTarget(null);
      setForm(emptyForm());
      toast({ title: "Funcionário atualizado", description: "Dados salvos com sucesso." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: err.response?.data?.mensagem ?? "Não foi possível atualizar.",
      });
    },
  });

  const resetSenhaMutation = useMutation({
    mutationFn: ({ id, senhaNova }: { id: string; senhaNova: string }) =>
      resetarSenhaFuncionario(id, { senhaNova }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "funcionarios"] });
      setResetSenhaTarget(null);
      setSenhaNova("");
      toast({ title: "Senha alterada", description: "A nova senha foi definida." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao resetar senha",
        description: err.response?.data?.mensagem ?? "Não foi possível alterar a senha.",
      });
    },
  });

  const resetEmailMutation = useMutation({
    mutationFn: ({ id, emailNovo }: { id: string; emailNovo: string }) =>
      resetarEmailFuncionario(id, { emailNovo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "funcionarios"] });
      setResetEmailTarget(null);
      setEmailNovo("");
      toast({ title: "E-mail alterado", description: "O novo e-mail foi definido." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao resetar e-mail",
        description: err.response?.data?.mensagem ?? "Não foi possível alterar o e-mail.",
      });
    },
  });

  const desbloquearMutation = useMutation({
    mutationFn: (funcionarioId: string) => desbloquearFuncionario(funcionarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "funcionarios"] });
      toast({ title: "Funcionário desbloqueado", description: "O acesso foi liberado." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao desbloquear",
        description: err.response?.data?.mensagem ?? "Não foi possível desbloquear.",
      });
    },
  });

  const handleSearch = () => setNome(nomeInput.trim());
  const handleClearSearch = () => {
    setNomeInput("");
    setNome("");
    setPage(0);
  };

  const openCreate = () => {
    setForm({
      ...emptyForm(),
      contratoFuncionario: emptyContrato(),
      jornadaFuncionarioConfig: emptyJornada(),
      geofenceIds: [],
    });
    setDurationDisplays({});
    setAtivarTelefone(false);
    setAtivarContrato(false);
    setAtivarJornada(false);
    setAtivarGeofences(false);
    setEditTarget(null);
    setFormOpen("create");
    setSalarioMensalInput("");
    setSalarioHoraInput("");
    setEditPrimeiroNome(false);
    setEditUltimoNome(false);
    setEditUsername(false);
  };

  /** Usuário digita só números; últimos 2 = centavos. Converte para decimal e guarda no form. Ex: "150050" -> 1500.50 */
  const salarioFromDigits = (digits: string) => (digits ? Math.round(parseInt(digits.replace(/\D/g, ""), 10) || 0) / 100 : 0);
  /** Para exibir no input ao carregar: decimal do form vira string de dígitos. Ex: 1500.50 -> "150050" */
  const digitsFromSalario = (n: number) => (n != null && !Number.isNaN(n) && n > 0 ? String(Math.round(n * 100)) : "");

  const openEdit = async (f: FuncionarioListagemResponse) => {
    setEditTarget(f);
    setFormOpen("edit");
    try {
      const p = await getPerfilFuncionario(f.usuarioId);
      const j = p.jornadaFuncionarioConfig;
      const toTime = (v: string | undefined) => (v && v.length >= 5 ? v.slice(0, 5) : "08:00");
      setAtivarTelefone(!!p.usuarioTelefone);
      setAtivarContrato(!!p.contratoFuncionario);
      setAtivarJornada(!!j);
      setAtivarGeofences((p.geofenceIds?.length ?? 0) > 0);
      setForm({
        username: p.username ?? "",
        nomeCompleto: p.nomeCompleto ?? "",
        primeiroNome: p.primeiroNome ?? "",
        ultimoNome: p.ultimoNome ?? "",
        cpf: p.cpf ? (formatCpf(p.cpf) || p.cpf) : "",
        dataNascimento: p.dataNascimento ?? null,
        email: p.email ?? "",
        senha: "",
        usuarioTelefone: p.usuarioTelefone ?? null,
        contratoFuncionario: p.contratoFuncionario
          ? {
              ...p.contratoFuncionario,
              pisPasep: p.contratoFuncionario.pisPasep ? maskPisPasepInput(p.contratoFuncionario.pisPasep) : null,
            }
          : emptyContrato(),
        jornadaFuncionarioConfig: j
          ? {
              tipoEscalaJornadaId: j.tipoEscalaJornadaId ?? 0,
              cargaHorariaDiaria: j.cargaHorariaDiaria ?? "PT8H",
              cargaHorariaSemanal: j.cargaHorariaSemanal ?? "PT44H",
              toleranciaPadrao: j.toleranciaPadrao ?? "PT0S",
              intervaloPadrao: j.intervaloPadrao ?? "PT1H",
              tempoDescansoEntreJornada: j.tempoDescansoEntreJornada ?? null,
              entradaPadrao: toTime(j.entradaPadrao),
              saidaPadrao: toTime(j.saidaPadrao),
              gravaGeoObrigatoria: j.gravaGeoObrigatoria ?? false,
            }
          : emptyJornada(),
        geofenceIds: p.geofenceIds ?? [],
      });
      setDurationDisplays(
        j
          ? {
              cargaHorariaDiaria: durationToHHmm(j.cargaHorariaDiaria ?? ""),
              cargaHorariaSemanal: durationToHHmm(j.cargaHorariaSemanal ?? ""),
              toleranciaPadrao: durationToHHmm(j.toleranciaPadrao ?? "PT0S"),
              intervaloPadrao: durationToHHmm(j.intervaloPadrao ?? ""),
              tempoDescansoEntreJornada: j.tempoDescansoEntreJornada ? durationToHHmm(j.tempoDescansoEntreJornada) : "",
            }
          : {},
      );
      const salM = p.contratoFuncionario?.salarioMensal;
      const salH = p.contratoFuncionario?.salarioHora;
      setSalarioMensalInput(digitsFromSalario(salM ?? 0));
      setSalarioHoraInput(digitsFromSalario(salH ?? 0));
      setEditPrimeiroNome(false);
      setEditUltimoNome(false);
      setEditUsername(false);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar perfil",
        description: (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? "Não foi possível carregar os dados do funcionário.",
      });
      setFormOpen(null);
    }
  };

  /** Telefone: enviar à API sem máscara (só dígitos). Nome e texto ficam com formatação. */
  const buildTelefone = () => {
    if (!ativarTelefone) return null;
    const t = form.usuarioTelefone;
    if (!t?.codigoPais?.trim() || !t?.ddd?.trim() || !t?.numero?.trim()) return null;
    return {
      codigoPais: t.codigoPais.replace(/\D/g, "").trim(),
      ddd: t.ddd.replace(/\D/g, "").trim(),
      numero: t.numero.replace(/\D/g, "").trim(),
    };
  };

  /** Contrato: cargo/departamento com formatação (texto). PIS/PASEP sem máscara (só dígitos). */
  const buildContrato = (): ContratoFuncionarioRequest | null => {
    if (!ativarContrato) return null;
    const c = form.contratoFuncionario;
    if (!c || !c.cargo?.trim() || !c.tipoContratoId || !c.dataAdmissao?.trim() || c.salarioMensal == null || c.salarioHora == null) return null;
    return {
      matricula: c.matricula?.trim() || null,
      pisPasep: c.pisPasep?.replace(/\D/g, "").trim() || null,
      cargo: c.cargo.trim(),
      departamento: c.departamento?.trim() || null,
      tipoContratoId: c.tipoContratoId,
      ativo: c.ativo,
      dataAdmissao: c.dataAdmissao.trim(),
      dataDemissao: c.dataDemissao?.trim() || null,
      salarioMensal: Number(c.salarioMensal),
      salarioHora: Number(c.salarioHora),
    };
  };

  const buildJornada = (): JornadaFuncionarioConfigRequest | null => {
    if (!ativarJornada) return null;
    const j = form.jornadaFuncionarioConfig;
    if (!j || !j.tipoEscalaJornadaId || !j.cargaHorariaDiaria || !j.cargaHorariaSemanal || !j.entradaPadrao || !j.saidaPadrao || !j.intervaloPadrao) return null;
    return {
      tipoEscalaJornadaId: j.tipoEscalaJornadaId,
      cargaHorariaDiaria: j.cargaHorariaDiaria,
      cargaHorariaSemanal: j.cargaHorariaSemanal,
      toleranciaPadrao: j.toleranciaPadrao ?? null,
      intervaloPadrao: j.intervaloPadrao,
      tempoDescansoEntreJornada: j.tempoDescansoEntreJornada ?? null,
      entradaPadrao: j.entradaPadrao,
      saidaPadrao: j.saidaPadrao,
      gravaGeoObrigatoria: j.gravaGeoObrigatoria ?? false,
    };
  };

  type ValidateEntry = [string, unknown, (v: unknown) => ValidationResult];

  const handleSubmitCreate = () => {
    const ok = validateAll([
      ["nomeCompleto", form.nomeCompleto ?? "", (v: unknown) => validateNomeCompleto(v as string, true)],
      ["primeiroNome", form.primeiroNome ?? "", (v: unknown) => validatePrimeiroNome(v as string, true)],
      ["ultimoNome", form.ultimoNome ?? "", (v: unknown) => validateUltimoNome(v as string, true)],
      ["username", form.username ?? "", (v: unknown) => validateUsername(v as string, true)],
      ["cpf", form.cpf ?? "", (v: unknown) => validateCpf(v as string, true)],
      ["email", form.email ?? "", (v: unknown) => validateEmail(v as string, true)],
      ["senha", form.senha ?? "", (v: unknown) => validateSenha(v as string, true)],
      ...(ativarTelefone
        ? ([
            ["codigoPais", form.usuarioTelefone?.codigoPais ?? "", (v: unknown) => validateCodigoPais(v as string, true)],
            ["ddd", form.usuarioTelefone?.ddd ?? "", (v: unknown) => validateDdd(v as string, true)],
            ["numero", form.usuarioTelefone?.numero ?? "", (v: unknown) => validateNumeroTelefone(v as string, true)],
          ] as ValidateEntry[])
        : []),
      ...(ativarContrato && form.contratoFuncionario
        ? ([
            ["cargo", form.contratoFuncionario.cargo ?? "", (v: unknown) => validateCargo(v as string, true)],
            ["pisPasep", form.contratoFuncionario.pisPasep ?? "", (v: unknown) => validatePisPasep(v as string, false)],
            ["tipoContratoId", form.contratoFuncionario.tipoContratoId ? String(form.contratoFuncionario.tipoContratoId) : "", (v: unknown) => validateRequiredSelect(v as string, "Tipo de contrato é obrigatório.")],
            ["dataAdmissao", form.contratoFuncionario.dataAdmissao ?? "", (v: unknown) => validateDataAdmissao(v as string, true)],
            ["salarioMensal", form.contratoFuncionario.salarioMensal ?? 0, (v: unknown) => validateSalarioObrigatorio(v as number, "Salário mensal")],
            ["salarioHora", form.contratoFuncionario.salarioHora ?? 0, (v: unknown) => validateSalarioObrigatorio(v as number, "Salário hora")],
          ] as ValidateEntry[])
        : []),
      ...(ativarJornada && form.jornadaFuncionarioConfig
        ? ([
            ["tipoEscalaJornadaId", form.jornadaFuncionarioConfig.tipoEscalaJornadaId ? String(form.jornadaFuncionarioConfig.tipoEscalaJornadaId) : "", (v: unknown) => validateRequiredSelect(v as string, "Tipo de escala jornada é obrigatório.")],
            ["cargaHorariaDiaria", durationToHHmm(form.jornadaFuncionarioConfig.cargaHorariaDiaria ?? ""), (v: unknown) => validateDurationHhmmCargaDiaria(v as string)],
            ["cargaHorariaSemanal", durationToHHmm(form.jornadaFuncionarioConfig.cargaHorariaSemanal ?? ""), (v: unknown) => validateDurationHhmm(v as string, true, "Carga semanal")],
            ["intervaloPadrao", durationToHHmm(form.jornadaFuncionarioConfig.intervaloPadrao ?? ""), (v: unknown) => validateDurationHhmm(v as string, true, "Intervalo")],
            ["entradaPadrao", form.jornadaFuncionarioConfig.entradaPadrao ?? "", (v: unknown) => validateHorario(v as string, true, "Entrada padrão")],
            ["saidaPadrao", form.jornadaFuncionarioConfig.saidaPadrao ?? "", (v: unknown) => validateHorario(v as string, true, "Saída padrão")],
          ] as ValidateEntry[])
        : []),
    ]);
    if (!ok) {
      toast({ variant: "destructive", title: "Corrija os erros antes de salvar." });
      return;
    }
    // CPF: usuário vê com máscara; envia para API sem máscara (11 dígitos).
    const body: FuncionarioCreateRequest = {
      username: form.username.trim(),
      nomeCompleto: form.nomeCompleto.trim(),
      primeiroNome: form.primeiroNome.trim(),
      ultimoNome: form.ultimoNome.trim(),
      cpf: form.cpf.replace(/\D/g, "").trim(),
      dataNascimento: form.dataNascimento ?? null,
      email: form.email.trim(),
      senha: form.senha,
      usuarioTelefone: buildTelefone(),
      contratoFuncionario: buildContrato(),
      jornadaFuncionarioConfig: buildJornada(),
      geofenceIds: form.geofenceIds?.length ? form.geofenceIds : null,
    };
    createMutation.mutate(body);
  };

  const handleSubmitEdit = () => {
    if (!editTarget) return;
    const ok = validateAll([
      ["nomeCompleto", form.nomeCompleto ?? "", (v: unknown) => validateNomeCompleto(v as string, true)],
      ["primeiroNome", form.primeiroNome ?? "", (v: unknown) => validatePrimeiroNome(v as string, true)],
      ["ultimoNome", form.ultimoNome ?? "", (v: unknown) => validateUltimoNome(v as string, true)],
      ["username", form.username ?? "", (v: unknown) => validateUsername(v as string, true)],
      ["cpf", form.cpf ?? "", (v: unknown) => validateCpf(v as string, true)],
      ["email", form.email ?? "", (v: unknown) => validateEmail(v as string, true)],
      ...(ativarTelefone
        ? ([
            ["codigoPais", form.usuarioTelefone?.codigoPais ?? "", (v: unknown) => validateCodigoPais(v as string, true)],
            ["ddd", form.usuarioTelefone?.ddd ?? "", (v: unknown) => validateDdd(v as string, true)],
            ["numero", form.usuarioTelefone?.numero ?? "", (v: unknown) => validateNumeroTelefone(v as string, true)],
          ] as ValidateEntry[])
        : []),
      ...(ativarContrato && form.contratoFuncionario
        ? ([
            ["cargo", form.contratoFuncionario.cargo ?? "", (v: unknown) => validateCargo(v as string, true)],
            ["pisPasep", form.contratoFuncionario.pisPasep ?? "", (v: unknown) => validatePisPasep(v as string, false)],
            ["tipoContratoId", form.contratoFuncionario.tipoContratoId ? String(form.contratoFuncionario.tipoContratoId) : "", (v: unknown) => validateRequiredSelect(v as string, "Tipo de contrato é obrigatório.")],
            ["dataAdmissao", form.contratoFuncionario.dataAdmissao ?? "", (v: unknown) => validateDataAdmissao(v as string, true)],
            ["salarioMensal", form.contratoFuncionario.salarioMensal ?? 0, (v: unknown) => validateSalarioObrigatorio(v as number, "Salário mensal")],
            ["salarioHora", form.contratoFuncionario.salarioHora ?? 0, (v: unknown) => validateSalarioObrigatorio(v as number, "Salário hora")],
          ] as ValidateEntry[])
        : []),
      ...(ativarJornada && form.jornadaFuncionarioConfig
        ? ([
            ["tipoEscalaJornadaId", form.jornadaFuncionarioConfig.tipoEscalaJornadaId ? String(form.jornadaFuncionarioConfig.tipoEscalaJornadaId) : "", (v: unknown) => validateRequiredSelect(v as string, "Tipo de escala jornada é obrigatório.")],
            ["cargaHorariaDiaria", durationToHHmm(form.jornadaFuncionarioConfig.cargaHorariaDiaria ?? ""), (v: unknown) => validateDurationHhmmCargaDiaria(v as string)],
            ["cargaHorariaSemanal", durationToHHmm(form.jornadaFuncionarioConfig.cargaHorariaSemanal ?? ""), (v: unknown) => validateDurationHhmm(v as string, true, "Carga semanal")],
            ["intervaloPadrao", durationToHHmm(form.jornadaFuncionarioConfig.intervaloPadrao ?? ""), (v: unknown) => validateDurationHhmm(v as string, true, "Intervalo")],
            ["entradaPadrao", form.jornadaFuncionarioConfig.entradaPadrao ?? "", (v: unknown) => validateHorario(v as string, true, "Entrada padrão")],
            ["saidaPadrao", form.jornadaFuncionarioConfig.saidaPadrao ?? "", (v: unknown) => validateHorario(v as string, true, "Saída padrão")],
          ] as ValidateEntry[])
        : []),
    ]);
    if (!ok) {
      toast({ variant: "destructive", title: "Corrija os erros antes de salvar." });
      return;
    }
    // CPF: envia para API sem máscara (11 dígitos).
    const body: FuncionarioUpdateRequest = {
      username: form.username.trim(),
      nomeCompleto: form.nomeCompleto.trim(),
      primeiroNome: form.primeiroNome.trim(),
      ultimoNome: form.ultimoNome.trim(),
      cpf: form.cpf.replace(/\D/g, "").trim(),
      dataNascimento: form.dataNascimento ?? null,
      email: form.email.trim(),
      usuarioTelefone: buildTelefone(),
      contratoFuncionario: buildContrato(),
      jornadaFuncionarioConfig: buildJornada(),
      geofenceIds: ativarGeofences && form.geofenceIds?.length ? form.geofenceIds : null,
    };
    updateMutation.mutate({ id: editTarget.usuarioId, body });
  };

  const paginacao = data?.paginacao;
  const totalElementos = paginacao?.totalElementos ?? 0;
  const totalPaginas =
    paginacao != null ? Math.max(1, Math.ceil(totalElementos / pageSize)) : 1;
  const paginaAtual = paginacao?.paginaAtual ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Funcionários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os funcionários e seus acessos ao ponto</p>
        </div>
        <Button className="shrink-0 gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo funcionário
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Listagem
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar por nome..."
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-48"
            />
            <Button variant="secondary" size="sm" onClick={handleSearch} className="gap-1">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
            {(nome || nomeInput) && (
              <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          )}
          {!isLoading && (data || isError) && (
            <>
              <div className="h-[600px] overflow-y-auto rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>E-mails</TableHead>
                    <TableHead>Telefones</TableHead>
                    <TableHead className="w-[70px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.conteudo ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum funcionário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.conteudo ?? []).map((f) => (
                      <TableRow key={f.usuarioId}>
                        <TableCell className="font-medium">
                          {[f.primeiroNome, f.ultimoNome].filter(Boolean).join(" ") || "—"}
                        </TableCell>
                        <TableCell>{f.username ?? "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {f.emails?.length ? f.emails.join(", ") : "—"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {formatTelefones(f.telefones ?? [])}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Ações"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(f)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setResetSenhaTarget(f); setSenhaNova(""); }}>
                                <Key className="h-4 w-4 mr-2" />
                                Resetar senha
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setResetEmailTarget(f); setEmailNovo(f.emails?.[0] ?? ""); }}>
                                <Mail className="h-4 w-4 mr-2" />
                                Resetar e-mail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => desbloquearMutation.mutate(f.usuarioId)}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Desbloquear
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(f)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
<div className="mt-2 sm:mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 border-t pt-2 sm:pt-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                  Página {paginaAtual + 1} de {totalPaginas}
                  {paginacao != null && ` • ${paginacao.totalElementos} registro(s)`}
                </p>
<div className="flex justify-center scale-90 sm:scale-100 origin-center">
                    <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (paginaAtual > 0) setPage(paginaAtual - 1);
                        }}
                        className={paginaAtual === 0 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {(() => {
                      const maxBtns = 3;
                      const start = Math.max(
                        0,
                        Math.min(paginaAtual - Math.floor(maxBtns / 2), totalPaginas - maxBtns)
                      );
                      const end = Math.min(totalPaginas - 1, start + maxBtns - 1);
                      return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
                        (p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                              isActive={p === paginaAtual}
                            >
                              {p + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      );
                    })()}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (paginaAtual < totalPaginas - 1) setPage(paginaAtual + 1);
                        }}
                        className={
                          paginaAtual >= totalPaginas - 1 ? "pointer-events-none opacity-50" : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Por página</span>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
<SelectTrigger className="w-[72px] h-8 sm:w-[85px] sm:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar / Editar funcionário */}
      <Dialog open={formOpen !== null} onOpenChange={(open) => { if (!open) { setFormOpen(null); queryClient.invalidateQueries({ queryKey: ["empresa", "funcionarios"] }); } }}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] min-h-[60vh] sm:min-h-[70vh] flex flex-col overflow-hidden px-4 py-4 sm:px-8 sm:py-6">
          <DialogHeader className="flex-shrink-0 pb-1 sm:pb-2">
            <DialogTitle className="text-base sm:text-lg">{formOpen === "create" ? "Novo funcionário" : "Editar funcionário"}</DialogTitle>
          </DialogHeader>
          <div className="max-w-2xl w-full mx-auto flex flex-col flex-1 min-h-0">
          <Tabs defaultValue="dados" className="w-full flex flex-col flex-1 min-h-0">
            <TabsList className="flex flex-wrap gap-0.5 flex-shrink-0 mb-3 h-auto p-0.5 sm:gap-1 sm:mb-6 justify-center">
              <TabsTrigger value="dados" className="gap-1 text-xs px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm">
                Dados <Badge className="text-[9px] px-1 py-0 font-normal border-0 bg-blue-100 text-blue-800 sm:text-[10px] sm:px-1.5">Obrigatório</Badge>
              </TabsTrigger>
              <TabsTrigger value="telefone" className="gap-1 text-xs px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm">
                Telefone <Badge className="text-[9px] px-1 py-0 font-normal border-0 bg-amber-100 text-amber-800 sm:text-[10px] sm:px-1.5">Opcional</Badge>
              </TabsTrigger>
              <TabsTrigger value="contrato" className="gap-1 text-xs px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm">
                Contrato <Badge className="text-[9px] px-1 py-0 font-normal border-0 bg-amber-100 text-amber-800 sm:text-[10px] sm:px-1.5">Opcional</Badge>
              </TabsTrigger>
              <TabsTrigger value="jornada" className="gap-1 text-xs px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm">
                Jornada <Badge className="text-[9px] px-1 py-0 font-normal border-0 bg-amber-100 text-amber-800 sm:text-[10px] sm:px-1.5">Opcional</Badge>
              </TabsTrigger>
              <TabsTrigger value="geofences" className="gap-1 text-xs px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm">
                Áreas <Badge className="text-[9px] px-1 py-0 font-normal border-0 bg-amber-100 text-amber-800 sm:text-[10px] sm:px-1.5">Opcional</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dados" className="space-y-3 pt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden data-[state=inactive]:hidden sm:space-y-4 sm:pt-4 px-1 py-0.5">
              <div className="space-y-1.5 sm:space-y-2">
                <Label required className="text-xs sm:text-sm">Nome completo</Label>
                <Input
                  value={form.nomeCompleto}
                  onChange={(e) => {
                    const formatted = formatTitleCase(e.target.value);
                    const filled = fillFromNomeCompleto(formatted);
                    setForm((prev) => ({
                      ...prev,
                      nomeCompleto: formatted,
                      primeiroNome: filled.primeiroNome,
                      ultimoNome: filled.ultimoNome,
                      username: filled.username,
                    }));
                    handleChange("nomeCompleto", formatted, (x) => validateNomeCompleto(x, true));
                  }}
                  onBlur={() => handleBlur("nomeCompleto", form.nomeCompleto ?? "", (x) => validateNomeCompleto(x, true))}
                  placeholder="Ex: João Pedro da Silva"
                />
                <FieldExpectedStatus fieldKey="nomeCompleto" value={form.nomeCompleto ?? ""} error={getError("nomeCompleto")} touched={getTouched("nomeCompleto")} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label required className="text-xs sm:text-sm">Primeiro nome</Label>
                  <div ref={refPrimeiroNome} className="relative">
                    <Input
                      value={form.primeiroNome}
                      disabled={!editPrimeiroNome}
                      onChange={(e) => {
                        const formatted = formatTitleCase(e.target.value);
                        setForm((prev) => ({ ...prev, primeiroNome: formatted }));
                        handleChange("primeiroNome", formatted, (x) => validatePrimeiroNome(x, true));
                      }}
                      onBlur={() => {
                        handleBlur("primeiroNome", form.primeiroNome ?? "", (x) => validatePrimeiroNome(x, true));
                        setEditPrimeiroNome(false);
                      }}
                      placeholder="Ex: João"
                      className={cn("h-9 text-sm sm:h-10 sm:text-base pr-12", !editPrimeiroNome && "bg-muted")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => (editPrimeiroNome ? setEditPrimeiroNome(false) : setEditPrimeiroNome(true))}
                    >
                      {editPrimeiroNome ? <Check className="h-4 w-4 text-green-600" /> : <PencilLine className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FieldExpectedStatus fieldKey="primeiroNome" value={form.primeiroNome ?? ""} error={getError("primeiroNome")} touched={getTouched("primeiroNome")} />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label required className="text-xs sm:text-sm">Sobrenome</Label>
                  <div ref={refUltimoNome} className="relative">
                    <Input
                      value={form.ultimoNome}
                      disabled={!editUltimoNome}
                      onChange={(e) => {
                        const formatted = formatTitleCase(e.target.value);
                        setForm((prev) => ({ ...prev, ultimoNome: formatted }));
                        handleChange("ultimoNome", formatted, (x) => validateUltimoNome(x, true));
                      }}
                      onBlur={() => {
                        handleBlur("ultimoNome", form.ultimoNome ?? "", (x) => validateUltimoNome(x, true));
                        setEditUltimoNome(false);
                      }}
                      placeholder="Ex: Silva"
                      className={cn("h-9 text-sm sm:h-10 sm:text-base pr-12", !editUltimoNome && "bg-muted")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => (editUltimoNome ? setEditUltimoNome(false) : setEditUltimoNome(true))}
                    >
                      {editUltimoNome ? <Check className="h-4 w-4 text-green-600" /> : <PencilLine className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FieldExpectedStatus fieldKey="ultimoNome" value={form.ultimoNome ?? ""} error={getError("ultimoNome")} touched={getTouched("ultimoNome")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label required>Usuário (login)</Label>
                  <div ref={refUsername} className="relative">
                    <Input
                      value={form.username}
                      disabled={!editUsername}
                      onChange={(e) => {
                        const next = maskUsernameInput(e.target.value);
                        setForm((prev) => ({ ...prev, username: next }));
                        handleChange("username", next, (v) => validateUsername(v, true));
                      }}
                      onBlur={() => {
                        handleBlur("username", form.username ?? "", (v) => validateUsername(v, true));
                        setEditUsername(false);
                      }}
                      placeholder="primeiro.ultimonome"
                      className={cn("pr-12", !editUsername && "bg-muted")}
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
                  <FieldExpectedStatus fieldKey="username" value={form.username ?? ""} error={getError("username")} touched={getTouched("username")} />
                </div>
                <div className="space-y-2">
                  <Label required>CPF</Label>
                  <Input
                    value={form.cpf}
                    onChange={(e) => {
                      const next = maskCpfInput(e.target.value);
                      setForm((prev) => ({ ...prev, cpf: next }));
                      handleChange("cpf", next, (v) => validateCpf(v, true));
                    }}
                    onBlur={() => handleBlur("cpf", form.cpf ?? "", (v) => validateCpf(v, true))}
                    placeholder="000.000.000-00"
                  />
                  <FieldExpectedStatus fieldKey="cpf" value={form.cpf ?? ""} error={getError("cpf")} touched={getTouched("cpf")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Data nascimento (opcional)</Label>
                  <Input
                    type="date"
                    value={form.dataNascimento ?? ""}
                    onChange={(e) => {
                      const v = e.target.value || null;
                      setForm((prev) => ({ ...prev, dataNascimento: v }));
                      handleChange("dataNascimento", v ?? "", (x) => validateData(x, false));
                    }}
                    onBlur={() => handleBlur("dataNascimento", form.dataNascimento ?? "", (x) => validateData(x, false))}
                    aria-invalid={!!getError("dataNascimento")}
                  />
                  <FieldExpectedStatus fieldKey="dataNascimento" value={form.dataNascimento ?? ""} error={getError("dataNascimento")} touched={getTouched("dataNascimento")} />
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label required>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    const next = maskEmailInput(e.target.value);
                    setForm((prev) => ({ ...prev, email: next }));
                    handleChange("email", next, (v) => validateEmail(v, true));
                  }}
                  onBlur={() => handleBlur("email", form.email ?? "", (v) => validateEmail(v, true))}
                  placeholder="email@empresa.com"
                />
                <FieldExpectedStatus fieldKey="email" value={form.email ?? ""} error={getError("email")} touched={getTouched("email")} />
              </div>
              {formOpen === "create" && (
                <div className="space-y-2">
                  <Label required>Senha</Label>
                  <Input
                    type="password"
                    value={form.senha}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, senha: e.target.value }));
                      handleChange("senha", e.target.value, (v) => validateSenha(v, true));
                    }}
                    onBlur={() => handleBlur("senha", form.senha ?? "", (v) => validateSenha(v, true))}
                    placeholder="••••••••"
                  />
                  <FieldExpectedStatus fieldKey="senha" value={form.senha ?? ""} error={getError("senha")} touched={getTouched("senha")} />
                </div>
              )}
            </TabsContent>
            <TabsContent value="telefone" className="space-y-3 pt-2 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden sm:space-y-4 sm:pt-4">
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium sm:text-base">Incluir telefone</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">Ao ativar, o será enviado para {formOpen === "create" ? "cadastrar" : "editar"}.</p>
                </div>
                <Switch checked={ativarTelefone} onCheckedChange={setAtivarTelefone} className="shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">Preencha para cadastrar telefone.</p>
              <div className={cn("grid grid-cols-3 gap-2 sm:gap-3", !ativarTelefone && "opacity-60 pointer-events-none")}>
                <div className="space-y-2">
                  <Label required>Cód. país</Label>
                  <Input
                    disabled={!ativarTelefone}
                    value={form.usuarioTelefone?.codigoPais ?? "55"}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 3) || "55";
                      setForm((prev) => ({
                        ...prev,
                        usuarioTelefone: {
                          ...(prev.usuarioTelefone ?? { codigoPais: "55", ddd: "", numero: "" }),
                          codigoPais: v,
                        },
                      }));
                      handleChange("codigoPais", v, (x) => validateCodigoPais(x, true));
                    }}
                    onBlur={() => handleBlur("codigoPais", form.usuarioTelefone?.codigoPais ?? "", (x) => validateCodigoPais(x, true))}
                    placeholder="55"
                  />
                  <FieldExpectedStatus fieldKey="codigoPais" value={form.usuarioTelefone?.codigoPais ?? ""} error={getError("codigoPais")} touched={getTouched("codigoPais")} />
                </div>
                <div className="space-y-2">
                  <Label required>DDD</Label>
                  <Input
                    disabled={!ativarTelefone}
                    value={form.usuarioTelefone?.ddd ?? ""}
                    onChange={(e) => {
                      const next = maskDddInput(e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        usuarioTelefone: {
                          ...(prev.usuarioTelefone ?? { codigoPais: "55", ddd: "", numero: "" }),
                          ddd: next,
                        },
                      }));
                      handleChange("ddd", next, (x) => validateDdd(x, true));
                    }}
                    onBlur={() => handleBlur("ddd", form.usuarioTelefone?.ddd ?? "", (x) => validateDdd(x, true))}
                    placeholder="11"
                  />
                  <FieldExpectedStatus fieldKey="ddd" value={form.usuarioTelefone?.ddd ?? ""} error={getError("ddd")} touched={getTouched("ddd")} />
                </div>
                <div className="space-y-2">
                  <Label required>Número</Label>
                  <Input
                    disabled={!ativarTelefone}
                    value={form.usuarioTelefone?.numero ?? ""}
                    onChange={(e) => {
                      const next = maskNumeroTelefoneInput(e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        usuarioTelefone: {
                          ...(prev.usuarioTelefone ?? { codigoPais: "55", ddd: "", numero: "" }),
                          numero: next,
                        },
                      }));
                      handleChange("numero", next, (x) => validateNumeroTelefone(x, true));
                    }}
                    onBlur={() => handleBlur("numero", form.usuarioTelefone?.numero ?? "", (x) => validateNumeroTelefone(x, true))}
                    placeholder="99999-9999"
                  />
                  <FieldExpectedStatus fieldKey="numeroTelefone" value={form.usuarioTelefone?.numero ?? ""} error={getError("numero")} touched={getTouched("numero")} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contrato" className="space-y-4 pt-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden data-[state=inactive]:hidden px-1 py-0.5">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Incluir contrato</p>
                  <p className="text-sm text-muted-foreground">Ao ativar, o será enviado na request.</p>
                </div>
                <Switch checked={ativarContrato} onCheckedChange={setAtivarContrato} />
              </div>
              <p className="text-sm text-muted-foreground">Preencha todos os campos obrigatórios para enviar contrato.</p>
              {form.contratoFuncionario && (
                <div className={cn(!ativarContrato && "opacity-60 pointer-events-none")}>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label>Matrícula (opcional)</Label>
                      <Input
                        disabled={!ativarContrato}
                        value={form.contratoFuncionario.matricula ?? ""}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, matricula: v }
                              : emptyContrato(),
                          }));
                          handleChange("matricula", v ?? "", (x) => validateMatricula(x, false));
                        }}
                        onBlur={() => handleBlur("matricula", form.contratoFuncionario?.matricula ?? "", (x) => validateMatricula(x, false))}
                        placeholder="Matrícula"
                        aria-invalid={!!getError("matricula")}
                      />
                      <FieldExpectedStatus fieldKey="matricula" value={form.contratoFuncionario?.matricula ?? ""} error={getError("matricula")} touched={getTouched("matricula")} />
                    </div>
                    <div className="space-y-2">
                      <Label>PIS/PASEP (opcional)</Label>
                      <Input
                        value={form.contratoFuncionario.pisPasep ?? ""}
                        onChange={(e) => {
                          const next = maskPisPasepInput(e.target.value);
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, pisPasep: next || null }
                              : { ...emptyContrato(), pisPasep: next || null },
                          }));
                          handleChange("pisPasep", next || "", (v) => validatePisPasep(v, false));
                        }}
                        onBlur={() => handleBlur("pisPasep", form.contratoFuncionario?.pisPasep ?? "", (v) => validatePisPasep(v, false))}
                        placeholder="000.00000.00-0"
                        aria-invalid={!!getError("pisPasep")}
                      />
                      <FieldExpectedStatus fieldKey="pisPasep" value={form.contratoFuncionario?.pisPasep ?? ""} error={getError("pisPasep")} touched={getTouched("pisPasep")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label required>Cargo</Label>
                      <Input
                        value={form.contratoFuncionario.cargo}
                        onChange={(e) => {
                          const formatted = formatTitleCase(e.target.value);
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, cargo: formatted }
                              : { ...emptyContrato(), cargo: formatted },
                          }));
                          handleChange("cargo", formatted, (x) => validateCargo(x, true));
                        }}
                        onBlur={() => handleBlur("cargo", form.contratoFuncionario?.cargo ?? "", (x) => validateCargo(x, true))}
                        placeholder="Cargo"
                      />
                      <FieldExpectedStatus fieldKey="cargo" value={form.contratoFuncionario?.cargo ?? ""} error={getError("cargo")} touched={getTouched("cargo")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Departamento (opcional)</Label>
                      <Input
                        disabled={!ativarContrato}
                        value={form.contratoFuncionario.departamento ?? ""}
                        onChange={(e) => {
                          const formatted = formatTitleCase(e.target.value);
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, departamento: formatted || null }
                              : { ...emptyContrato(), departamento: formatted || null },
                          }));
                          handleChange("departamento", formatted || "", (x) => validateComplemento(x));
                        }}
                        onBlur={() => handleBlur("departamento", form.contratoFuncionario?.departamento ?? "", (x) => validateComplemento(x))}
                        placeholder="Departamento"
                        aria-invalid={!!getError("departamento")}
                      />
                      <FieldExpectedStatus fieldKey="departamento" value={form.contratoFuncionario?.departamento ?? ""} error={getError("departamento")} touched={getTouched("departamento")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label required>Tipo de contrato</Label>
                      <Select
                        value={form.contratoFuncionario.tipoContratoId ? String(form.contratoFuncionario.tipoContratoId) : ""}
                        onValueChange={(v) => {
                          const id = v ? parseInt(v, 10) : 0;
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, tipoContratoId: id }
                              : emptyContrato(),
                          }));
                          handleChange("tipoContratoId", v ?? "", (x) => validateRequiredSelect(x, "Tipo de contrato é obrigatório."));
                        }}
                      >
                        <SelectTrigger disabled={!ativarContrato}>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_CONTRATO_OPCOES.map((opt) => (
                            <SelectItem key={opt.id} value={String(opt.id)}>
                              {opt.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldExpectedStatus fieldKey="tipoContratoId" value={form.contratoFuncionario?.tipoContratoId ? String(form.contratoFuncionario.tipoContratoId) : ""} error={getError("tipoContratoId")} touched={getTouched("tipoContratoId")} />
                    </div>
                    <div className="space-y-2 flex items-center gap-2 pt-8">
                      <Checkbox
                        id="contrato-ativo"
                        checked={form.contratoFuncionario.ativo}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, ativo: !!checked }
                              : emptyContrato(),
                          }))
                        }
                      />
                      <Label htmlFor="contrato-ativo">Contrato ativo</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label required>Data admissão</Label>
                      <Input
                        disabled={!ativarContrato}
                        type="date"
                        value={form.contratoFuncionario.dataAdmissao}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, dataAdmissao: v }
                              : emptyContrato(),
                          }));
                          handleChange("dataAdmissao", v, (x) => validateDataAdmissao(x, true));
                        }}
                        onBlur={() => handleBlur("dataAdmissao", form.contratoFuncionario?.dataAdmissao ?? "", (x) => validateDataAdmissao(x, true))}
                      />
                      <FieldExpectedStatus fieldKey="dataAdmissao" value={form.contratoFuncionario?.dataAdmissao ?? ""} error={getError("dataAdmissao")} touched={getTouched("dataAdmissao")} />
                    </div>
                    {formOpen === "edit" && (
                      <div className="space-y-2">
                        <Label>Data demissão (opcional)</Label>
                        <Input
                          disabled={!ativarContrato}
                          type="date"
                          value={form.contratoFuncionario.dataDemissao ?? ""}
                          onChange={(e) => {
                            const v = e.target.value || null;
                            setForm((prev) => ({
                              ...prev,
                              contratoFuncionario: prev.contratoFuncionario
                                ? { ...prev.contratoFuncionario, dataDemissao: v }
                                : emptyContrato(),
                            }));
                            handleChange("dataDemissao", v ?? "", (x) => validateData(x, false));
                          }}
                          onBlur={() => handleBlur("dataDemissao", form.contratoFuncionario?.dataDemissao ?? "", (x) => validateData(x, false))}
                          aria-invalid={!!getError("dataDemissao")}
                        />
                        <FieldExpectedStatus fieldKey="dataDemissao" value={form.contratoFuncionario?.dataDemissao ?? ""} error={getError("dataDemissao")} touched={getTouched("dataDemissao")} />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label required>Salário mensal</Label>
                      <Input
                        disabled={!ativarContrato}
                        type="text"
                        inputMode="numeric"
                        value={formatSalarioDisplay(salarioFromDigits(salarioMensalInput))}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                          setSalarioMensalInput(digits);
                          const valorDecimal = salarioFromDigits(digits);
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, salarioMensal: valorDecimal }
                              : { ...emptyContrato(), salarioMensal: valorDecimal },
                          }));
                          handleChange("salarioMensal", valorDecimal, (v: number) => validateSalarioObrigatorio(v, "Salário mensal"));
                        }}
                        onBlur={() => handleBlur("salarioMensal", form.contratoFuncionario?.salarioMensal ?? 0, (v: number) => validateSalarioObrigatorio(v, "Salário mensal"))}
                        placeholder="0,00"
                      />
                      <FieldExpectedStatus fieldKey="salarioMensal" value={form.contratoFuncionario?.salarioMensal ?? 0} error={getError("salarioMensal")} touched={getTouched("salarioMensal")} />
                    </div>
                    <div className="space-y-2">
                      <Label required>Salário hora</Label>
                      <Input
                        disabled={!ativarContrato}
                        type="text"
                        inputMode="numeric"
                        value={formatSalarioDisplay(salarioFromDigits(salarioHoraInput))}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                          setSalarioHoraInput(digits);
                          const valorDecimal = salarioFromDigits(digits);
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, salarioHora: valorDecimal }
                              : { ...emptyContrato(), salarioHora: valorDecimal },
                          }));
                          handleChange("salarioHora", valorDecimal, (v: number) => validateSalarioObrigatorio(v, "Salário hora"));
                        }}
                        onBlur={() => handleBlur("salarioHora", form.contratoFuncionario?.salarioHora ?? 0, (v: number) => validateSalarioObrigatorio(v, "Salário hora"))}
                        placeholder="0,00"
                      />
                      <FieldExpectedStatus fieldKey="salarioHora" value={form.contratoFuncionario?.salarioHora ?? 0} error={getError("salarioHora")} touched={getTouched("salarioHora")} />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="jornada" className="space-y-3 pt-2 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden sm:space-y-4 sm:pt-4">
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium sm:text-base">Incluir jornada</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">Ao ativar, o será enviado para {formOpen === "create" ? "cadastrar" : "editar"}.</p>
                </div>
                <Switch checked={ativarJornada} onCheckedChange={setAtivarJornada} className="shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">Durações no formato 08:00 (horas:minutos), convertidas em PT internamente.</p>
              {form.jornadaFuncionarioConfig && (
                <div className={cn(!ativarJornada && "opacity-60 pointer-events-none")}>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label required>Tipo de escala jornada</Label>
                      <Select
                        value={form.jornadaFuncionarioConfig.tipoEscalaJornadaId ? String(form.jornadaFuncionarioConfig.tipoEscalaJornadaId) : ""}
                        onValueChange={(v) => {
                          const id = v ? parseInt(v, 10) : 0;
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, tipoEscalaJornadaId: id }
                              : emptyJornada(),
                          }));
                          handleChange("tipoEscalaJornadaId", v ?? "", (x) => validateRequiredSelect(x, "Tipo de escala jornada é obrigatório."));
                        }}
                      >
                        <SelectTrigger disabled={!ativarJornada}>
                          <SelectValue placeholder="Selecione a escala" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_ESCALA_JORNADA_OPCOES.map((opt) => (
                            <SelectItem key={opt.id} value={String(opt.id)}>
                              {opt.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldExpectedStatus fieldKey="tipoEscalaJornadaId" value={form.jornadaFuncionarioConfig?.tipoEscalaJornadaId ? String(form.jornadaFuncionarioConfig.tipoEscalaJornadaId) : ""} error={getError("tipoEscalaJornadaId")} touched={getTouched("tipoEscalaJornadaId")} />
                    </div>
                    <div className="space-y-2">
                      <Label required>Carga diária</Label>
                      <Input
                        disabled={!ativarJornada}
                        value={durationDisplays.cargaHorariaDiaria ?? durationToHHmm(form.jornadaFuncionarioConfig.cargaHorariaDiaria ?? "")}
                        onChange={(e) => {
                          const hhmm = clampDurationHHmmTo12(e.target.value);
                          setDurationDisplays((p) => ({ ...p, cargaHorariaDiaria: hhmm }));
                          handleChange("cargaHorariaDiaria", hhmm, (x) => validateDurationHhmmCargaDiaria(x));
                        }}
                        onBlur={() => {
                          const d = durationDisplays.cargaHorariaDiaria ?? durationToHHmm(form.jornadaFuncionarioConfig?.cargaHorariaDiaria ?? "");
                          const iso = hhmmToDuration(d);
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, cargaHorariaDiaria: iso }
                              : emptyJornada(),
                          }));
                          setDurationDisplays((p) => ({ ...p, cargaHorariaDiaria: durationToHHmm(iso) }));
                          handleBlur("cargaHorariaDiaria", durationToHHmm(iso), (x) => validateDurationHhmmCargaDiaria(x));
                        }}
                        placeholder="08:00"
                        maxLength={5}
                      />
                      <FieldExpectedStatus fieldKey="cargaHorariaDiaria" value={durationDisplays.cargaHorariaDiaria ?? durationToHHmm(form.jornadaFuncionarioConfig?.cargaHorariaDiaria ?? "")} error={getError("cargaHorariaDiaria")} touched={getTouched("cargaHorariaDiaria")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label required>Carga semanal</Label>
                      <Input
                        disabled={!ativarJornada}
                        value={durationDisplays.cargaHorariaSemanal ?? durationToHHmm(form.jornadaFuncionarioConfig.cargaHorariaSemanal ?? "")}
                        onChange={(e) => {
                          const hhmm = clampDurationHHmmTo44(e.target.value);
                          setDurationDisplays((p) => ({ ...p, cargaHorariaSemanal: hhmm }));
                          handleChange("cargaHorariaSemanal", hhmm, (x) => validateDurationHhmm(x, true, "Carga semanal"));
                        }}
                        onBlur={() => {
                          const d = durationDisplays.cargaHorariaSemanal ?? durationToHHmm(form.jornadaFuncionarioConfig?.cargaHorariaSemanal ?? "");
                          const iso = hhmmToDuration(d);
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, cargaHorariaSemanal: iso }
                              : emptyJornada(),
                          }));
                          setDurationDisplays((p) => ({ ...p, cargaHorariaSemanal: durationToHHmm(iso) }));
                          handleBlur("cargaHorariaSemanal", durationToHHmm(iso), (x) => validateDurationHhmm(x, true, "Carga semanal"));
                        }}
                        placeholder="44:00"
                        maxLength={5}
                      />
                      <FieldExpectedStatus fieldKey="cargaHorariaSemanal" value={durationDisplays.cargaHorariaSemanal ?? durationToHHmm(form.jornadaFuncionarioConfig?.cargaHorariaSemanal ?? "")} error={getError("cargaHorariaSemanal")} touched={getTouched("cargaHorariaSemanal")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tolerância (opcional)</Label>
                      <Input
                        disabled={!ativarJornada}
                        value={durationDisplays.toleranciaPadrao ?? durationToHHmm(form.jornadaFuncionarioConfig.toleranciaPadrao ?? "PT0S")}
                        onChange={(e) => {
                          const hhmm = clampDurationHHmmTo6(e.target.value);
                          setDurationDisplays((p) => ({ ...p, toleranciaPadrao: hhmm }));
                          handleChange("toleranciaPadrao", hhmm, (x) => validateDurationHhmmTolerancia(x, false));
                        }}
                        onBlur={() => {
                          const d = durationDisplays.toleranciaPadrao ?? durationToHHmm(form.jornadaFuncionarioConfig?.toleranciaPadrao ?? "PT0S");
                          const iso = hhmmToDuration(d) || "PT0S";
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, toleranciaPadrao: iso }
                              : emptyJornada(),
                          }));
                          setDurationDisplays((p) => ({ ...p, toleranciaPadrao: durationToHHmm(iso) }));
                          handleBlur("toleranciaPadrao", durationToHHmm(iso), (x) => validateDurationHhmmTolerancia(x, false));
                        }}
                        placeholder="00:00"
                        aria-invalid={!!getError("toleranciaPadrao")}
                      />
                      <FieldExpectedStatus fieldKey="toleranciaPadrao" value={durationDisplays.toleranciaPadrao ?? durationToHHmm(form.jornadaFuncionarioConfig?.toleranciaPadrao ?? "PT0S")} error={getError("toleranciaPadrao")} touched={getTouched("toleranciaPadrao")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label required>Intervalo</Label>
                      <Input
                        disabled={!ativarJornada}
                        value={durationDisplays.intervaloPadrao ?? durationToHHmm(form.jornadaFuncionarioConfig.intervaloPadrao ?? "")}
                        onChange={(e) => {
                          const hhmm = clampDurationHHmmTo6(e.target.value);
                          setDurationDisplays((p) => ({ ...p, intervaloPadrao: hhmm }));
                          handleChange("intervaloPadrao", hhmm, (x) => validateDurationHhmmIntervalo(x));
                        }}
                        onBlur={() => {
                          const d = durationDisplays.intervaloPadrao ?? durationToHHmm(form.jornadaFuncionarioConfig?.intervaloPadrao ?? "");
                          const iso = hhmmToDuration(d);
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, intervaloPadrao: iso }
                              : emptyJornada(),
                          }));
                          setDurationDisplays((p) => ({ ...p, intervaloPadrao: durationToHHmm(iso) }));
                          handleBlur("intervaloPadrao", durationToHHmm(iso), (x) => validateDurationHhmmIntervalo(x));
                        }}
                        placeholder="01:00"
                        maxLength={5}
                      />
                      <FieldExpectedStatus fieldKey="intervaloPadrao" value={durationDisplays.intervaloPadrao ?? durationToHHmm(form.jornadaFuncionarioConfig?.intervaloPadrao ?? "")} error={getError("intervaloPadrao")} touched={getTouched("intervaloPadrao")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descanso entre jornadas (opcional)</Label>
                      <Input
                        disabled={!ativarJornada}
                        value={durationDisplays.tempoDescansoEntreJornada ?? durationToHHmm(form.jornadaFuncionarioConfig.tempoDescansoEntreJornada ?? "")}
                        onChange={(e) => {
                          const hhmm = clampDurationHHmmTo44(e.target.value);
                          setDurationDisplays((p) => ({ ...p, tempoDescansoEntreJornada: hhmm }));
                          handleChange("tempoDescansoEntreJornada", hhmm, (x) => validateDurationHhmm(x, false, "Descanso entre jornadas"));
                        }}
                        onBlur={() => {
                          const d = durationDisplays.tempoDescansoEntreJornada ?? durationToHHmm(form.jornadaFuncionarioConfig?.tempoDescansoEntreJornada ?? "");
                          const iso = d ? hhmmToDuration(d) : "";
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, tempoDescansoEntreJornada: iso || null }
                              : emptyJornada(),
                          }));
                          setDurationDisplays((p) => ({ ...p, tempoDescansoEntreJornada: iso ? durationToHHmm(iso) : "" }));
                          handleBlur("tempoDescansoEntreJornada", iso ? durationToHHmm(iso) : "", (x) => validateDurationHhmm(x, false, "Descanso entre jornadas"));
                        }}
                        placeholder="11:00"
                        maxLength={5}
                        aria-invalid={!!getError("tempoDescansoEntreJornada")}
                      />
                      <FieldExpectedStatus fieldKey="tempoDescansoEntreJornada" value={durationDisplays.tempoDescansoEntreJornada ?? durationToHHmm(form.jornadaFuncionarioConfig?.tempoDescansoEntreJornada ?? "")} error={getError("tempoDescansoEntreJornada")} touched={getTouched("tempoDescansoEntreJornada")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label required>Entrada padrão</Label>
                      <Input
                        disabled={!ativarJornada}
                        type="time"
                        value={form.jornadaFuncionarioConfig.entradaPadrao}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, entradaPadrao: v }
                              : emptyJornada(),
                          }));
                          handleChange("entradaPadrao", v, (x) => validateHorario(x, true, "Entrada padrão"));
                        }}
                        onBlur={() => handleBlur("entradaPadrao", form.jornadaFuncionarioConfig?.entradaPadrao ?? "", (x) => validateHorario(x, true, "Entrada padrão"))}
                      />
                      <FieldExpectedStatus fieldKey="entradaPadrao" value={form.jornadaFuncionarioConfig?.entradaPadrao ?? ""} error={getError("entradaPadrao")} touched={getTouched("entradaPadrao")} />
                    </div>
                    <div className="space-y-2">
                      <Label required>Saída padrão</Label>
                      <Input
                        disabled={!ativarJornada}
                        type="time"
                        value={form.jornadaFuncionarioConfig.saidaPadrao}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, saidaPadrao: v }
                              : emptyJornada(),
                          }));
                          handleChange("saidaPadrao", v, (x) => validateHorario(x, true, "Saída padrão"));
                        }}
                        onBlur={() => handleBlur("saidaPadrao", form.jornadaFuncionarioConfig?.saidaPadrao ?? "", (x) => validateHorario(x, true, "Saída padrão"))}
                      />
                      <FieldExpectedStatus fieldKey="saidaPadrao" value={form.jornadaFuncionarioConfig?.saidaPadrao ?? ""} error={getError("saidaPadrao")} touched={getTouched("saidaPadrao")} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="grava-geo"
                      disabled={!ativarJornada}
                      checked={form.jornadaFuncionarioConfig.gravaGeoObrigatoria}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({
                          ...prev,
                          jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                            ? { ...prev.jornadaFuncionarioConfig, gravaGeoObrigatoria: !!checked }
                            : emptyJornada(),
                        }))
                      }
                    />
                    <Label htmlFor="grava-geo">Gravação de geolocalização obrigatória</Label>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="geofences" className="space-y-3 pt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden data-[state=inactive]:hidden sm:space-y-4 sm:pt-4 px-1 py-0.5">
              {geofencesList.length > 0 && (
                <div className="flex items-center justify-between gap-2 rounded-lg border p-3 sm:p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium sm:text-base">Incluir áreas de ponto</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">Ao ativar, as áreas selecionadas serão enviadas na request.</p>
                  </div>
                  <Switch checked={ativarGeofences} onCheckedChange={setAtivarGeofences} className="shrink-0" />
                </div>
              )}
              <p className="text-xs text-muted-foreground sm:text-sm">Selecione as áreas de ponto às quais o funcionário terá acesso.</p>
              {geofencesList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma área de ponto cadastrada. Cadastre em Áreas de ponto.</p>
              ) : (
                <div className={cn("max-h-48 overflow-y-auto space-y-2 rounded-md border p-3", !ativarGeofences && "opacity-60 pointer-events-none")}>
                  {geofencesList.map((g) => {
                    const id = g.id;
                    const checked = form.geofenceIds?.includes(id) ?? false;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 cursor-pointer select-none py-1.5 px-2 rounded hover:bg-muted/50"
                        onClick={() =>
                          ativarGeofences &&
                          setForm((prev) => {
                            const ids = prev.geofenceIds ?? [];
                            const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
                            return { ...prev, geofenceIds: next };
                          })
                        }
                      >
                        <Checkbox disabled={!ativarGeofences} checked={checked} onCheckedChange={() => {}} />
                        <span className="text-sm font-medium">{g.nome}</span>
                        <span className="text-xs text-muted-foreground">({g.coordenadas})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </div>
          <DialogFooter className="flex-shrink-0 gap-2 pt-3 border-t mt-3 sm:pt-4 sm:mt-4">
            <Button variant="outline" size="sm" onClick={() => { setFormOpen(null); queryClient.invalidateQueries({ queryKey: ["empresa", "funcionarios"] }); }} className="text-xs sm:text-sm">
              Cancelar
            </Button>
            <Button
              size="sm"
              className="text-xs sm:text-sm"
              onClick={formOpen === "create" ? handleSubmitCreate : handleSubmitEdit}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                (formOpen === "create" &&
                  (!form.username?.trim() ||
                    !form.nomeCompleto?.trim() ||
                    !form.primeiroNome?.trim() ||
                    !form.ultimoNome?.trim() ||
                    !form.cpf?.trim() ||
                    !form.email?.trim() ||
                    !form.senha?.trim() ||
                    !!validateCpf(form.cpf, true))) ||
                (formOpen === "edit" && !!form.cpf?.trim() && !!validateCpf(form.cpf, true))
              }
            >
              {formOpen === "create" ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Resetar senha */}
      <Dialog open={!!resetSenhaTarget} onOpenChange={() => setResetSenhaTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Nova senha para <strong>{resetSenhaTarget?.username}</strong>
          </p>
          <div className="space-y-2 py-2">
            <Label required>Nova senha</Label>
            <Input
              type="password"
              value={senhaNova}
              onChange={(e) => {
                setSenhaNova(e.target.value);
                handleChange("resetSenhaNova", e.target.value, (v) => validateSenha(v, true, "Nova senha"));
              }}
              onBlur={() => handleBlur("resetSenhaNova", senhaNova, (v) => validateSenha(v, true, "Nova senha"))}
              placeholder="••••••••"
              aria-invalid={!!getError("resetSenhaNova")}
            />
            <p className="text-xs text-muted-foreground">Esperado: {getFieldExpected("senha")}</p>
            {getError("resetSenhaNova") && <p role="alert" className="text-sm text-destructive">{getError("resetSenhaNova")}</p>}
            {!getError("resetSenhaNova") && senhaNova.length > 0 && (
              <p className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1">Válido</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetSenhaTarget(null)}>Cancelar</Button>
            <Button
              disabled={!senhaNova.trim() || !!getError("resetSenhaNova") || resetSenhaMutation.isPending}
              onClick={() =>
                resetSenhaTarget && resetSenhaMutation.mutate({ id: resetSenhaTarget.usuarioId, senhaNova })
              }
            >
              {resetSenhaMutation.isPending ? "Salvando..." : "Alterar senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Resetar e-mail */}
      <Dialog open={!!resetEmailTarget} onOpenChange={() => setResetEmailTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar e-mail</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Novo e-mail para <strong>{resetEmailTarget?.username}</strong>
          </p>
          <div className="space-y-2 py-2">
            <Label required>Novo e-mail</Label>
            <Input
              type="email"
              value={emailNovo}
              onChange={(e) => {
                const next = maskEmailInput(e.target.value);
                setEmailNovo(next);
                handleChange("resetEmailNovo", next, (v) => validateEmail(v, true));
              }}
              onBlur={() => handleBlur("resetEmailNovo", emailNovo, (v) => validateEmail(v, true))}
              placeholder="email@empresa.com"
              aria-invalid={!!getError("resetEmailNovo")}
            />
            <p className="text-xs text-muted-foreground">Esperado: {getFieldExpected("email")}</p>
            {getError("resetEmailNovo") && <p role="alert" className="text-sm text-destructive">{getError("resetEmailNovo")}</p>}
            {!getError("resetEmailNovo") && emailNovo.trim().length > 0 && (
              <p className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1">Válido</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetEmailTarget(null)}>Cancelar</Button>
            <Button
              disabled={!emailNovo.trim() || !!getError("resetEmailNovo") || resetEmailMutation.isPending}
              onClick={() =>
                resetEmailTarget &&
                resetEmailMutation.mutate({ id: resetEmailTarget.usuarioId, emailNovo })
              }
            >
              {resetEmailMutation.isPending ? "Salvando..." : "Alterar e-mail"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              O funcionário &quot;{deleteTarget?.username}&quot; será desativado. Esta ação pode ser
              revertida pelo suporte. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.usuarioId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removendo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
