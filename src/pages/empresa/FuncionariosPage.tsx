import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Plus, Trash2, MoreVertical, Pencil, Key, Mail, Unlock } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import { formatCpf, maskCpfInput } from "@/lib/format";
import {
  validateUsername,
  validateEmail,
  validateCpf,
  validateNomeCompleto,
  validatePrimeiroNome,
  validateUltimoNome,
  validateSenha,
  validateCargo,
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

/** Auto-completa primeiro, último e username a partir do nome completo (só no front). */
function fillFromNomeCompleto(nomeCompleto: string): { primeiroNome: string; ultimoNome: string; username: string } {
  const t = nomeCompleto.trim();
  if (!t) return { primeiroNome: "", ultimoNome: "", username: "" };
  const parts = t.split(/\s+/).filter(Boolean);
  const primeiro = parts[0] ?? "";
  const ultimo = parts.length > 1 ? (parts[parts.length - 1] ?? "") : primeiro;
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

import { durationToHHmm, hhmmToDuration } from "@/lib/duration";

export default function FuncionariosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getError, getTouched, handleBlur, handleChange, validateAll } = useValidation();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(8);
  const [nome, setNome] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FuncionarioListagemResponse | null>(null);

  const [formOpen, setFormOpen] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<FuncionarioListagemResponse | null>(null);
  const [form, setForm] = useState<FuncionarioCreateRequest>(emptyForm());
  const [senhaNova, setSenhaNova] = useState("");
  const [emailNovo, setEmailNovo] = useState("");
  const [resetSenhaTarget, setResetSenhaTarget] = useState<FuncionarioListagemResponse | null>(null);
  const [resetEmailTarget, setResetEmailTarget] = useState<FuncionarioListagemResponse | null>(null);

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
    setEditTarget(null);
    setFormOpen("create");
  };

  const openEdit = async (f: FuncionarioListagemResponse) => {
    setEditTarget(f);
    setFormOpen("edit");
    try {
      const p = await getPerfilFuncionario(f.usuarioId);
      const j = p.jornadaFuncionarioConfig;
      const toTime = (v: string | undefined) => (v && v.length >= 5 ? v.slice(0, 5) : "08:00");
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
        contratoFuncionario: p.contratoFuncionario ?? emptyContrato(),
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
        geofenceIds: [],
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar perfil",
        description: (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? "Não foi possível carregar os dados do funcionário.",
      });
      setFormOpen(null);
    }
  };

  const buildTelefone = () => {
    const t = form.usuarioTelefone;
    if (!t?.codigoPais?.trim() || !t?.ddd?.trim() || !t?.numero?.trim()) return null;
    return { codigoPais: t.codigoPais.trim(), ddd: t.ddd.trim(), numero: t.numero.trim() };
  };

  const buildContrato = (): ContratoFuncionarioRequest | null => {
    const c = form.contratoFuncionario;
    if (!c || !c.cargo?.trim() || !c.tipoContratoId || !c.dataAdmissao?.trim() || c.salarioMensal == null || c.salarioHora == null) return null;
    return {
      matricula: c.matricula?.trim() || null,
      pisPasep: c.pisPasep?.trim() || null,
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

  const handleSubmitCreate = () => {
    const ok = validateAll([
      ["nomeCompleto", form.nomeCompleto ?? "", (v) => validateNomeCompleto(v, true)],
      ["primeiroNome", form.primeiroNome ?? "", (v) => validatePrimeiroNome(v, true)],
      ["ultimoNome", form.ultimoNome ?? "", (v) => validateUltimoNome(v, true)],
      ["username", form.username ?? "", (v) => validateUsername(v, true)],
      ["cpf", form.cpf ?? "", (v) => validateCpf(v, true)],
      ["email", form.email ?? "", (v) => validateEmail(v, true)],
      ["senha", form.senha ?? "", (v) => validateSenha(v, true)],
      ["cargo", form.contratoFuncionario?.cargo ?? "", (v) => validateCargo(v, true)],
    ]);
    if (!ok) {
      toast({ variant: "destructive", title: "Corrija os erros antes de salvar." });
      return;
    }
    const body: FuncionarioCreateRequest = {
      username: form.username.trim(),
      nomeCompleto: form.nomeCompleto.trim(),
      primeiroNome: form.primeiroNome.trim(),
      ultimoNome: form.ultimoNome.trim(),
      cpf: form.cpf.trim(),
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
      ["nomeCompleto", form.nomeCompleto ?? "", (v) => validateNomeCompleto(v, true)],
      ["primeiroNome", form.primeiroNome ?? "", (v) => validatePrimeiroNome(v, true)],
      ["ultimoNome", form.ultimoNome ?? "", (v) => validateUltimoNome(v, true)],
      ["username", form.username ?? "", (v) => validateUsername(v, true)],
      ["cpf", form.cpf ?? "", (v) => validateCpf(v, true)],
      ["email", form.email ?? "", (v) => validateEmail(v, true)],
    ]);
    if (!ok) {
      toast({ variant: "destructive", title: "Corrija os erros antes de salvar." });
      return;
    }
    const body: FuncionarioUpdateRequest = {
      username: form.username.trim(),
      nomeCompleto: form.nomeCompleto.trim(),
      primeiroNome: form.primeiroNome.trim(),
      ultimoNome: form.ultimoNome.trim(),
      cpf: form.cpf.trim(),
      dataNascimento: form.dataNascimento ?? null,
      email: form.email.trim(),
      usuarioTelefone: buildTelefone(),
      contratoFuncionario: buildContrato(),
      jornadaFuncionarioConfig: buildJornada(),
      geofenceIds: form.geofenceIds?.length ? form.geofenceIds : null,
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
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Página {paginaAtual + 1} de {totalPaginas}
                  {paginacao != null && ` • ${paginacao.totalElementos} registro(s)`}
                </p>
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
                      const maxBtns = 5;
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar / Editar funcionário */}
      <Dialog open={formOpen !== null} onOpenChange={(open) => !open && setFormOpen(null)}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] min-h-[70vh] flex flex-col overflow-hidden px-8 py-6">
          <DialogHeader className="flex-shrink-0 pb-2">
            <DialogTitle>{formOpen === "create" ? "Novo funcionário" : "Editar funcionário"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="dados" className="w-full flex flex-col flex-1 min-h-0">
            <TabsList className="flex flex-wrap gap-1 flex-shrink-0 mb-6">
              <TabsTrigger value="dados" className="gap-1.5">
                Dados <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-blue-100 text-blue-800">Obrigatório</Badge>
              </TabsTrigger>
              <TabsTrigger value="telefone" className="gap-1.5">
                Telefone <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-amber-100 text-amber-800">Opcional</Badge>
              </TabsTrigger>
              <TabsTrigger value="contrato" className="gap-1.5">
                Contrato <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-amber-100 text-amber-800">Opcional</Badge>
              </TabsTrigger>
              <TabsTrigger value="jornada" className="gap-1.5">
                Jornada <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-amber-100 text-amber-800">Opcional</Badge>
              </TabsTrigger>
              <TabsTrigger value="geofences" className="gap-1.5">
                Áreas de ponto <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-amber-100 text-amber-800">Opcional</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dados" className="space-y-4 pt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
              <div className="space-y-2">
                <Label required>Nome completo</Label>
                <Input
                  value={form.nomeCompleto}
                  onChange={(e) => {
                    const v = e.target.value;
                    const filled = fillFromNomeCompleto(v);
                    setForm((prev) => ({
                      ...prev,
                      nomeCompleto: v,
                      primeiroNome: filled.primeiroNome,
                      ultimoNome: filled.ultimoNome,
                      username: filled.username,
                    }));
                    handleChange("nomeCompleto", v, (x) => validateNomeCompleto(x, true));
                  }}
                  onBlur={() => handleBlur("nomeCompleto", form.nomeCompleto ?? "", (x) => validateNomeCompleto(x, true))}
                  placeholder="Ex: João Pedro da Silva"
                />
                <FieldExpectedStatus fieldKey="nomeCompleto" value={form.nomeCompleto ?? ""} error={getError("nomeCompleto")} touched={getTouched("nomeCompleto")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label required>Primeiro nome</Label>
                  <Input
                    value={form.primeiroNome}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, primeiroNome: e.target.value }));
                      handleChange("primeiroNome", e.target.value, (x) => validatePrimeiroNome(x, true));
                    }}
                    onBlur={() => handleBlur("primeiroNome", form.primeiroNome ?? "", (x) => validatePrimeiroNome(x, true))}
                    placeholder="Ex: João"
                  />
                  <FieldExpectedStatus fieldKey="primeiroNome" value={form.primeiroNome ?? ""} error={getError("primeiroNome")} touched={getTouched("primeiroNome")} />
                </div>
                <div className="space-y-2">
                  <Label required>Sobrenome</Label>
                  <Input
                    value={form.ultimoNome}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, ultimoNome: e.target.value }));
                      handleChange("ultimoNome", e.target.value, (x) => validateUltimoNome(x, true));
                    }}
                    onBlur={() => handleBlur("ultimoNome", form.ultimoNome ?? "", (x) => validateUltimoNome(x, true))}
                    placeholder="Ex: Silva"
                  />
                  <FieldExpectedStatus fieldKey="ultimoNome" value={form.ultimoNome ?? ""} error={getError("ultimoNome")} touched={getTouched("ultimoNome")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label required>Usuário (login)</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, username: e.target.value }));
                      handleChange("username", e.target.value, (v) => validateUsername(v, true));
                    }}
                    onBlur={() => handleBlur("username", form.username ?? "", (v) => validateUsername(v, true))}
                    placeholder="primeiro.ultimonome"
                  />
                  <FieldExpectedStatus fieldKey="username" value={form.username ?? ""} error={getError("username")} touched={getTouched("username")} />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data nascimento (opcional)</Label>
                  <Input
                    type="date"
                    value={form.dataNascimento ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dataNascimento: e.target.value || null }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label required>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, email: e.target.value }));
                    handleChange("email", e.target.value, (v) => validateEmail(v, true));
                  }}
                  onBlur={() => handleBlur("email", form.email ?? "", (v) => validateEmail(v, true))}
                  placeholder="email@empresa.com"
                />
                <FieldExpectedStatus fieldKey="email" value={form.email ?? ""} error={getError("email")} touched={getTouched("email")} />
              </div>
              {formOpen === "create" && (
                <div className="space-y-2">
                  <Label>Senha</Label>
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
            <TabsContent value="telefone" className="space-y-4 pt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
              <p className="text-sm text-muted-foreground">Opcional. Preencha para cadastrar telefone.</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label required>Cód. país</Label>
                  <Input
                    value={form.usuarioTelefone?.codigoPais ?? "55"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usuarioTelefone: {
                          ...(prev.usuarioTelefone ?? { codigoPais: "55", ddd: "", numero: "" }),
                          codigoPais: e.target.value,
                        },
                      }))
                    }
                    placeholder="55"
                  />
                </div>
                <div className="space-y-2">
                  <Label required>DDD</Label>
                  <Input
                    value={form.usuarioTelefone?.ddd ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usuarioTelefone: {
                          ...(prev.usuarioTelefone ?? { codigoPais: "55", ddd: "", numero: "" }),
                          ddd: e.target.value,
                        },
                      }))
                    }
                    placeholder="11"
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Número</Label>
                  <Input
                    value={form.usuarioTelefone?.numero ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        usuarioTelefone: {
                          ...(prev.usuarioTelefone ?? { codigoPais: "55", ddd: "", numero: "" }),
                          numero: e.target.value,
                        },
                      }))
                    }
                    placeholder="999999999"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contrato" className="space-y-4 pt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
              <p className="text-sm text-muted-foreground">Opcional. Preencha todos os campos obrigatórios para enviar contrato.</p>
              {form.contratoFuncionario && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Matrícula (opcional)</Label>
                      <Input
                        value={form.contratoFuncionario.matricula ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, matricula: e.target.value || null }
                              : emptyContrato(),
                          }))
                        }
                        placeholder="Matrícula"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PIS/PASEP (opcional)</Label>
                      <Input
                        value={form.contratoFuncionario.pisPasep ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, pisPasep: e.target.value || null }
                              : emptyContrato(),
                          }))
                        }
                        placeholder="PIS/PASEP"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label required>Cargo</Label>
                      <Input
                        value={form.contratoFuncionario.cargo}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, cargo: e.target.value }
                              : emptyContrato(),
                          }))
                        }
                        placeholder="Cargo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Departamento (opcional)</Label>
                      <Input
                        value={form.contratoFuncionario.departamento ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, departamento: e.target.value || null }
                              : emptyContrato(),
                          }))
                        }
                        placeholder="Departamento"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
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
                        }}
                      >
                        <SelectTrigger>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label required>Data admissão</Label>
                      <Input
                        type="date"
                        value={form.contratoFuncionario.dataAdmissao}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, dataAdmissao: e.target.value }
                              : emptyContrato(),
                          }))
                        }
                      />
                    </div>
                    {formOpen === "edit" && (
                      <div className="space-y-2">
                        <Label>Data demissão (opcional)</Label>
                        <Input
                          type="date"
                          value={form.contratoFuncionario.dataDemissao ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              contratoFuncionario: prev.contratoFuncionario
                                ? { ...prev.contratoFuncionario, dataDemissao: e.target.value || null }
                                : emptyContrato(),
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Salário mensal</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={form.contratoFuncionario.salarioMensal || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, salarioMensal: parseFloat(e.target.value) || 0 }
                              : emptyContrato(),
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Salário hora</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={form.contratoFuncionario.salarioHora || ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            contratoFuncionario: prev.contratoFuncionario
                              ? { ...prev.contratoFuncionario, salarioHora: parseFloat(e.target.value) || 0 }
                              : emptyContrato(),
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="jornada" className="space-y-4 pt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
              <p className="text-sm text-muted-foreground">Opcional. Durações no formato 08:00 (horas:minutos), convertidas em PT internamente.</p>
              {form.jornadaFuncionarioConfig && (
                <>
                  <div className="grid grid-cols-2 gap-4">
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
                        }}
                      >
                        <SelectTrigger>
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
                    </div>
                    <div className="space-y-2">
                      <Label>Carga diária</Label>
                      <Input
                        value={durationToHHmm(form.jornadaFuncionarioConfig.cargaHorariaDiaria ?? "")}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, cargaHorariaDiaria: hhmmToDuration(e.target.value) }
                              : emptyJornada(),
                          }))
                        }
                        placeholder="08:00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label required>Carga semanal</Label>
                      <Input
                        value={durationToHHmm(form.jornadaFuncionarioConfig.cargaHorariaSemanal ?? "")}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, cargaHorariaSemanal: hhmmToDuration(e.target.value) }
                              : emptyJornada(),
                          }))
                        }
                        placeholder="44:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label required>Tolerância</Label>
                      <Input
                        value={durationToHHmm(form.jornadaFuncionarioConfig.toleranciaPadrao ?? "PT0S")}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, toleranciaPadrao: hhmmToDuration(e.target.value) || "PT0S" }
                              : emptyJornada(),
                          }))
                        }
                        placeholder="00:00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label required>Intervalo</Label>
                      <Input
                        value={durationToHHmm(form.jornadaFuncionarioConfig.intervaloPadrao ?? "")}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, intervaloPadrao: hhmmToDuration(e.target.value) }
                              : emptyJornada(),
                          }))
                        }
                        placeholder="01:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label required>Descanso entre jornadas</Label>
                      <Input
                        value={durationToHHmm(form.jornadaFuncionarioConfig.tempoDescansoEntreJornada ?? "")}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, tempoDescansoEntreJornada: hhmmToDuration(e.target.value) }
                              : emptyJornada(),
                          }))
                        }
                        placeholder="11:00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Entrada padrão</Label>
                      <Input
                        type="time"
                        value={form.jornadaFuncionarioConfig.entradaPadrao}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, entradaPadrao: e.target.value }
                              : emptyJornada(),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label required>Saída padrão</Label>
                      <Input
                        type="time"
                        value={form.jornadaFuncionarioConfig.saidaPadrao}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            jornadaFuncionarioConfig: prev.jornadaFuncionarioConfig
                              ? { ...prev.jornadaFuncionarioConfig, saidaPadrao: e.target.value }
                              : emptyJornada(),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="grava-geo"
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
                </>
              )}
            </TabsContent>
            <TabsContent value="geofences" className="space-y-4 pt-4 flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden">
              <p className="text-sm text-muted-foreground">Opcional. Selecione as áreas de ponto às quais o funcionário terá acesso.</p>
              {geofencesList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma área de ponto cadastrada. Cadastre em Áreas de ponto.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border p-3">
                  {geofencesList.map((g) => {
                    const id = g.id;
                    const checked = form.geofenceIds?.includes(id) ?? false;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 cursor-pointer select-none py-1.5 px-2 rounded hover:bg-muted/50"
                        onClick={() =>
                          setForm((prev) => {
                            const ids = prev.geofenceIds ?? [];
                            const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
                            return { ...prev, geofenceIds: next };
                          })
                        }
                      >
                        <Checkbox checked={checked} onCheckedChange={() => {}} />
                        <span className="text-sm font-medium">{g.nome}</span>
                        <span className="text-xs text-muted-foreground">({g.coordenadas})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setFormOpen(null)}>
              Cancelar
            </Button>
            <Button
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
                    !form.senha?.trim()))
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
              onChange={(e) => setSenhaNova(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetSenhaTarget(null)}>Cancelar</Button>
            <Button
              disabled={!senhaNova.trim() || resetSenhaMutation.isPending}
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
              onChange={(e) => setEmailNovo(e.target.value)}
              placeholder="email@empresa.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetEmailTarget(null)}>Cancelar</Button>
            <Button
              disabled={!emailNovo.trim() || resetEmailMutation.isPending}
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
