import { useState, Fragment, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Trash2, Plus, Search, Pencil, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import {
  listagemEspelhoPonto,
  listarPontoFuncionario,
  deletarRegistroPonto,
  criarRegistroPontoFuncionario,
  editarRegistroPonto,
} from "@/lib/api-empresa";
import type { PontoDiaResponse } from "@/types/empresa";
import { ModalDetalharJornada } from "@/components/ponto/ModalDetalharJornada";
import { ModalCriarRegistro } from "@/components/ponto/ModalCriarRegistro";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Valores = doc/schema.sql tipo_justificativa (INSERT ~linha 182). Usado no modal editar registro. */
const TIPO_JUSTIFICATIVA_OPCOES = [
  "ATRASO_TRANSPORTE",
  "EMERGENCIA_MEDICA",
  "PROBLEMA_TECNICO",
  "ESQUECI_BATER",
  "AJUSTE_MANUAL",
  "FALHA_SISTEMA",
  "REGISTRO_DUPLICADO",
  "REGISTRO_ERRADO",
  "OUTROS",
] as const;

function PontoFuncionarioPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [espelhoModalOpen, setEspelhoModalOpen] = useState(false);
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<{ funcionarioId: string; registroId: string; data: string; horario: string } | null>(null);
  const [editarDiaTarget, setEditarDiaTarget] = useState<PontoDiaResponse | null>(null);
  const [editTarget, setEditTarget] = useState<{ funcionarioId: string; registroId: string; data: string; horario: string } | null>(null);
  const [editForm, setEditForm] = useState({ horario: "", justificativa: "", observacao: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [createDataInicial, setCreateDataInicial] = useState<string | undefined>(undefined);
  const [nome, setNome] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const { data: funcionariosData, isError: listagemError, error: listagemErr } = useQuery({
    queryKey: ["empresa", "espelho-ponto-listagem", page, pageSize, nome, ano, mes],
    queryFn: () => listagemEspelhoPonto({ page, pageSize, nome: nome || undefined, ano, mes }),
  });

  const { data: pontoData, isLoading, isError, error } = useQuery({
    queryKey: ["empresa", "espelho-ponto", selectedFuncionarioId, ano, mes],
    queryFn: () => listarPontoFuncionario(selectedFuncionarioId, ano, mes),
    enabled: !!selectedFuncionarioId && espelhoModalOpen,
  });

  const deleteRegistroMutation = useMutation({
    mutationFn: ({ fid, rid }: { fid: string; rid: string }) =>
      deletarRegistroPonto(fid, rid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "espelho-ponto"] });
      setDeleteTarget(null);
      toast({ title: "Registro removido" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: err.response?.data?.mensagem ?? "Não foi possível remover.",
      });
    },
  });

  const createRegistroMutation = useMutation({
    mutationFn: ({
      fid,
      body,
    }: {
      fid: string;
      body: { horario: string; justificativa: string; observacao?: string | null };
    }) => criarRegistroPontoFuncionario(fid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "espelho-ponto"] });
      setCreateOpen(false);
      setCreateDataInicial(undefined);
      toast({ title: "Registro criado" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar",
        description: err.response?.data?.mensagem ?? "Não foi possível criar o registro.",
      });
    },
  });

  useEffect(() => {
    if (listagemError && listagemErr) {
      const msg = (listagemErr as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (listagemErr as Error)?.message ?? "Erro ao carregar.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    }
  }, [listagemError, listagemErr, toast]);

  useEffect(() => {
    if (isError && error) {
      const msg = (error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar ponto.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    }
  }, [isError, error, toast]);

  const editRegistroMutation = useMutation({
    mutationFn: ({
      fid,
      rid,
      body,
    }: {
      fid: string;
      rid: string;
      body: { horario: string; justificativa: string; observacao?: string | null };
    }) => editarRegistroPonto(fid, rid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "espelho-ponto"] });
      setEditTarget(null);
      setEditarDiaTarget(null);
      toast({ title: "Registro atualizado" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao editar",
        description: err.response?.data?.mensagem ?? "Não foi possível editar o registro.",
      });
    },
  });

  const mudarMes = (delta: number) => {
    let n = mes + delta;
    let a = ano;
    if (n > 12) { n = 1; a++; }
    if (n < 1) { n = 12; a--; }
    setMes(n);
    setAno(a);
  };

  const openEspelho = (funcionarioId: string) => {
    setSelectedFuncionarioId(funcionarioId);
    setEspelhoModalOpen(true);
  };

  const handleSearch = () => {
    setNome(nomeInput.trim());
    setPage(0);
  };
  const handleClearSearch = () => {
    setNomeInput("");
    setNome("");
    setPage(0);
  };

  const funcionarios = funcionariosData?.conteudo ?? [];
  const paginacao = funcionariosData?.paginacao;
  const totalElementos = paginacao?.totalElementos ?? 0;
  const totalPaginas =
    paginacao != null ? Math.max(1, Math.ceil(totalElementos / pageSize)) : 1;
  const paginaAtual = paginacao?.paginaAtual ?? 0;
  const selectedFuncionario = funcionarios.find((f) => f.usuarioId === selectedFuncionarioId);
  const funcionarioNome = selectedFuncionario?.nomeCompleto ?? selectedFuncionario?.username ?? "—";

  const handleCriarRegistroSubmit = (data: { horario: string; justificativa: string; observacao?: string | null }) => {
    createRegistroMutation.mutate({
      fid: selectedFuncionarioId,
      body: {
        horario: data.horario,
        justificativa: data.justificativa.trim(),
        observacao: data.observacao?.trim() || null,
      },
    });
  };

  const handleEditarRegistro = () => {
    if (!editTarget) return;
    const horarioISO = `${editTarget.data}T${editForm.horario}:00`;
    if (!editForm.justificativa.trim()) {
      toast({ variant: "destructive", title: "Justificativa é obrigatória." });
      return;
    }
    editRegistroMutation.mutate({
      fid: editTarget.funcionarioId,
      rid: editTarget.registroId,
      body: {
        horario: horarioISO,
        justificativa: editForm.justificativa.trim(),
        observacao: editForm.observacao.trim() || null,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Espelho de ponto</h1>
        <p className="text-sm text-muted-foreground">
          Consulte e gerencie os registros de ponto de cada funcionário.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5" />
            Funcionários
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(mes)}
              onValueChange={(v) => setMes(parseInt(v, 10))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(ano)}
              onValueChange={(v) => setAno(parseInt(v, 10))}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[ano, ano - 1, ano - 2, ano + 1].sort((a, b) => a - b).map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="h-[600px] overflow-y-auto rounded-md border">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Horas esperadas</TableHead>
                <TableHead>Horas trabalhadas</TableHead>
                <TableHead>Horas trabalhadas feriado</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum funcionário cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                funcionarios.map((f) => (
                  <TableRow key={f.usuarioId}>
                    <TableCell className="font-medium">{f.nomeCompleto ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{f.totalHorasEsperadas ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{f.totalHorasTrabalhadas ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{f.totalHorasTrabalhadasFeriado ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEspelho(f.usuarioId)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" /> Detalhar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
          {paginacao != null && (
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
          )}
        </CardContent>
      </Card>

      {/* Modal Espelho de ponto */}
      <Dialog open={espelhoModalOpen} onOpenChange={setEspelhoModalOpen}>
        <DialogContent className="max-w-5xl h-[85vh] max-h-[85vh] flex flex-col overflow-hidden bg-white border border-stone-200 p-6 rounded-lg">
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="text-xl font-bold text-stone-800 mb-3 flex-shrink-0">Espelho de Ponto</h3>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <Select
                  value={String(mes)}
                  onValueChange={(v) => setMes(parseInt(v, 10))}
                >
                  <SelectTrigger className="w-[130px] border-stone-300 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(ano)}
                  onValueChange={(v) => setAno(parseInt(v, 10))}
                >
                  <SelectTrigger className="w-[90px] border-stone-300 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[ano, ano - 1, ano - 2, ano + 1].sort((a, b) => a - b).map((a) => (
                      <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                onClick={() => {
                  setCreateDataInicial(undefined);
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Novo Registro
              </Button>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
            {isLoading && (
              <div className="py-8 text-center text-sm text-stone-500">Carregando...</div>
            )}
            {!isLoading && (pontoData || isError) && (() => {
              const items = (isError ? [] : (pontoData ?? [])) as PontoDiaResponse[];
              const maxMarcacoes = items.length
                ? Math.max(...items.map((d) => d.marcacoes?.length ?? 0), 1)
                : 0;
              const totalCols = 4 + maxMarcacoes * 2 + 1 + 1;
              const getLabel = (index: number) => {
                const n = Math.floor(index / 2) + 1;
                return index % 2 === 0 ? "ENTRADA" + n : "SAÍDA" + n;
              };
              const fmtDiaHora = (h: string) => {
                const d = new Date(h);
                const dia = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(/\.$/g, "");
                const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                return { dia, hora };
              };
              return (
              <div className="flex-1 min-h-0 overflow-auto border border-stone-200 rounded-lg">
                <table className="w-full text-sm border-collapse min-w-full">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-stone-700">Jornada</th>
                      <th className="px-4 py-2 text-left text-stone-700">Dia</th>
                      <th className="px-4 py-2 text-left text-stone-700">Data</th>
                      <th className="px-4 py-2 text-left text-stone-700">Status</th>
                      {Array.from({ length: maxMarcacoes }, (_, j) => (
                        <Fragment key={`head-${j}`}>
                          <th className="px-4 py-2 text-left text-stone-700 whitespace-nowrap">{getLabel(j)} Dia</th>
                          <th className="px-4 py-2 text-left text-stone-700 whitespace-nowrap">{getLabel(j)} Hora</th>
                        </Fragment>
                      ))}
                      <th className="px-4 py-2 text-left text-stone-700">Total</th>
                      <th className="sticky right-0 z-10 px-4 py-2 text-left text-stone-700 bg-stone-50 border-l border-stone-200 shadow-[-4px_0_8px_rgba(0,0,0,0.04)]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={totalCols} className="px-4 py-6 text-center text-stone-500">Nenhum registro neste período.</td></tr>
                    ) : (
                      items.map((dia: PontoDiaResponse) => {
                        const [y, mo, d] = dia.data.split("-");
                        const dataFmt = `${d}/${mo}/${y}`;
                        const isNormal = (dia.status || "").toLowerCase().includes("normal") || !(dia.status || "").toLowerCase().includes("atraso");
                        return (
                          <tr key={`${dia.jornada}-${dia.data}`} className="border-b border-stone-200">
                            <td className="px-4 py-2">{dia.jornada ?? "—"}</td>
                            <td className="px-4 py-2">{dia.diaSemana ?? "—"}</td>
                            <td className="px-4 py-2">{dataFmt}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs rounded ${isNormal ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                {dia.status ?? "Normal"}
                              </span>
                            </td>
                            {Array.from({ length: maxMarcacoes }, (_, j) => {
                              const f = dia.marcacoes?.[j] ? fmtDiaHora(dia.marcacoes[j].horario) : null;
                              return (
                                <Fragment key={`cell-${j}`}>
                                  <td className="px-4 py-2">{f ? f.dia : "—"}</td>
                                  <td className="px-4 py-2">{f ? f.hora : "—"}</td>
                                </Fragment>
                              );
                            })}
                            <td className="px-4 py-2 font-medium">{dia.totalHoras ?? "—"}</td>
                            <td className="sticky right-0 z-10 px-4 py-2 bg-white border-l border-stone-200 shadow-[-4px_0_8px_rgba(0,0,0,0.04)]">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-transparent p-0 h-auto font-medium"
                                onClick={() => setEditarDiaTarget(dia)}
                              >
                                Editar
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              );
            })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModalDetalharJornada
        open={!!editarDiaTarget}
        onOpenChange={(open) => !open && setEditarDiaTarget(null)}
        jornada={editarDiaTarget}
        modo="empresa"
        onRemover={(registroId) => {
          const m = editarDiaTarget?.marcacoes?.find((x) => x.registroId === registroId);
          if (m) {
            setDeleteTarget({
              funcionarioId: selectedFuncionarioId,
              registroId,
              data: m.horario.slice(0, 10),
              horario: m.horario,
            });
            setEditarDiaTarget(null);
          }
        }}
        onAdicionarRegistro={() => {
          if (editarDiaTarget) {
            setCreateDataInicial(editarDiaTarget.data);
            setEditarDiaTarget(null);
            setCreateOpen(true);
          }
        }}
        onEditar={(registroId) => {
          const m = editarDiaTarget?.marcacoes?.find((x) => x.registroId === registroId);
          if (m) {
            const d = new Date(m.horario);
            const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            setEditTarget({
              funcionarioId: selectedFuncionarioId,
              registroId: m.registroId,
              data: m.horario.slice(0, 10),
              horario: m.horario,
            });
            setEditForm({ horario: timeStr, justificativa: "", observacao: "" });
            setEditarDiaTarget(null);
          }
        }}
      />

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar registro de ponto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Funcionário: {funcionarioNome}</p>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={editTarget?.data ?? ""} readOnly className="bg-stone-50" />
              </div>
              <div className="space-y-2">
                <Label>Horário (HH:MM)</Label>
                <Input
                  type="time"
                  value={editForm.horario}
                  onChange={(e) => setEditForm((p) => ({ ...p, horario: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select
                value={editForm.justificativa || ""}
                onValueChange={(v) => setEditForm((p) => ({ ...p, justificativa: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_JUSTIFICATIVA_OPCOES.map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {valor.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                value={editForm.observacao}
                onChange={(e) => setEditForm((p) => ({ ...p, observacao: e.target.value }))}
                placeholder="Observações"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button
              disabled={!editForm.horario || !editForm.justificativa.trim() || editRegistroMutation.isPending}
              onClick={handleEditarRegistro}
            >
              {editRegistroMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalCriarRegistro
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCriarRegistroSubmit}
        isLoading={createRegistroMutation.isPending}
        variant="empresa"
        dataInicial={createDataInicial}
        subtitulo={`Funcionário: ${funcionarioNome}`}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro de ponto?</AlertDialogTitle>
            <AlertDialogDescription>
              Registro do dia {deleteTarget?.data} às{" "}
              {deleteTarget?.horario
                ? new Date(deleteTarget.horario).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}{" "}
              será removido. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget &&
                deleteRegistroMutation.mutate({
                  fid: deleteTarget.funcionarioId,
                  rid: deleteTarget.registroId,
                })
              }
              disabled={deleteRegistroMutation.isPending}
            >
              {deleteRegistroMutation.isPending ? "Removendo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PontoFuncionarioPage;
