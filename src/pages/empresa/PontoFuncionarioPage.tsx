import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Trash2, Plus, Search, Pencil } from "lucide-react";
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
  listarFuncionarios,
  listarPontoFuncionario,
  deletarRegistroPonto,
  criarRegistroPontoFuncionario,
  editarRegistroPonto,
} from "@/lib/api-empresa";
import type { PontoDiaResponse } from "@/types/empresa";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Opções de tipo de justificativa (tipo_justificativa no backend) */
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

function formatTelefones(telefones: { codigoPais: string; ddd: string; numero: string }[]): string {
  if (!telefones?.length) return "—";
  return telefones.map((t) => `+${t.codigoPais} (${t.ddd}) ${t.numero}`).join(", ");
}

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
  const [createData, setCreateData] = useState({ data: "", horario: "", justificativa: "", observacao: "" });
  const [nome, setNome] = useState("");
  const [nomeInput, setNomeInput] = useState("");

  const { data: funcionariosData } = useQuery({
    queryKey: ["empresa", "funcionarios", 0, 500, nome],
    queryFn: () => listarFuncionarios({ page: 0, pageSize: 500, nome: nome || undefined }),
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
        description: err.response?.data?.message ?? "Não foi possível remover.",
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
      setCreateData({ data: "", horario: "", justificativa: "", observacao: "" });
      toast({ title: "Registro criado" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar",
        description: err.response?.data?.message ?? "Não foi possível criar o registro.",
      });
    },
  });

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
        description: err.response?.data?.message ?? "Não foi possível editar o registro.",
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

  const handleSearch = () => setNome(nomeInput.trim());
  const handleClearSearch = () => {
    setNomeInput("");
    setNome("");
  };

  const funcionarios = funcionariosData?.conteudo ?? [];
  const selectedFuncionario = funcionarios.find((f) => f.usuarioId === selectedFuncionarioId);
  const funcionarioNome = selectedFuncionario?.username ?? "—";

  const handleCriarRegistro = () => {
    const horarioISO = `${createData.data}T${createData.horario}:00`;
    if (!createData.justificativa.trim()) {
      toast({ variant: "destructive", title: "Justificativa é obrigatória." });
      return;
    }
    createRegistroMutation.mutate({
      fid: selectedFuncionarioId,
      body: {
        horario: horarioISO,
        justificativa: createData.justificativa.trim(),
        observacao: createData.observacao.trim() || null,
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
          {funcionarios.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhum funcionário cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>E-mails</TableHead>
                  <TableHead>Telefones</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => (
                  <TableRow key={f.usuarioId}>
                    <TableCell className="font-medium">{f.username}</TableCell>
                    <TableCell>{f.tipo ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {f.emails?.length ? f.emails.join(", ") : "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {formatTelefones(f.telefones ?? [])}
                    </TableCell>
                    <TableCell className="p-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-black hover:text-black hover:bg-stone-100"
                        onClick={() => openEspelho(f.usuarioId)}
                        aria-label="Abrir espelho de ponto"
                      >
                        <Clock className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Espelho de ponto */}
      <Dialog open={espelhoModalOpen} onOpenChange={setEspelhoModalOpen}>
        <DialogContent className="max-w-5xl h-[85vh] max-h-[85vh] flex flex-col overflow-hidden bg-white border border-stone-200 p-6 rounded-lg">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-xl font-bold text-stone-800">Espelho de Ponto</h3>
              <div className="flex gap-2">
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
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Novo Registro
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
            {isLoading && (
              <div className="py-8 text-center text-sm text-stone-500">Carregando...</div>
            )}
            {isError && (
              <div className="py-8 text-center text-sm text-red-600">
                {(error as Error)?.message ?? "Erro ao carregar ponto."}
              </div>
            )}
            {!isLoading && !isError && pontoData && (() => {
              const items = pontoData.items as PontoDiaResponse[];
              const maxMarcacoes = items.length
                ? Math.max(...items.map((d) => d.marcacoes?.length ?? 0), 1)
                : 0;
              const totalCols = 4 + maxMarcacoes + 1 + 1;
              // Cabeçalhos na ordem da lista: Entrada 1, Saída 1, Entrada 2, Saída 2, ...
              const getLabel = (index: number) => {
                const n = Math.floor(index / 2) + 1;
                return index % 2 === 0 ? "Entrada" + n : "Saída" + n;
              };
              return (
              <div className="flex-1 min-h-0 overflow-auto border border-stone-200 rounded-lg">
                <table className="w-full text-sm border-collapse min-w-full">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-stone-700">Jornada</th>
                      <th className="px-4 py-2 text-left text-stone-700">Data</th>
                      <th className="px-4 py-2 text-left text-stone-700">Dia</th>
                      <th className="px-4 py-2 text-left text-stone-700">Status</th>
                      {Array.from({ length: maxMarcacoes }, (_, j) => (
                        <th key={`col-${j}`} className="px-4 py-2 text-left text-stone-700">{getLabel(j)}</th>
                      ))}
                      <th className="px-4 py-2 text-left text-stone-700">Total</th>
                      <th className="px-4 py-2 text-left text-stone-700">Ações</th>
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
                        const fmt = (h: string) => new Date(h).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <tr key={`${dia.jornada}-${dia.data}`} className="border-b border-stone-200">
                            <td className="px-4 py-2">{dia.jornada ?? "—"}</td>
                            <td className="px-4 py-2">{dataFmt}</td>
                            <td className="px-4 py-2">{dia.diaSemana ?? "—"}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs rounded ${isNormal ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                {dia.status ?? "Normal"}
                              </span>
                            </td>
                            {Array.from({ length: maxMarcacoes }, (_, j) => (
                              <td key={`cell-${j}`} className="px-4 py-2">
                                {dia.marcacoes?.[j] ? fmt(dia.marcacoes[j].horario) : "—"}
                              </td>
                            ))}
                            <td className="px-4 py-2 font-medium">{dia.totalHoras ?? "—"}</td>
                            <td className="px-4 py-2">
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

      {/* Modal Editar dia — batidas do dia para deletar ou abrir Novo Registro */}
      <Dialog open={!!editarDiaTarget} onOpenChange={(open) => !open && setEditarDiaTarget(null)}>
        <DialogContent className="max-w-xl bg-white border border-stone-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <DialogTitle className="text-xl font-bold text-stone-800">
              Editar Registros — {editarDiaTarget
                ? (() => {
                    const [y, mo, d] = editarDiaTarget.data.split("-");
                    return `${d}/${mo}/${y}`;
                  })()
                : ""} {editarDiaTarget?.diaSemana ?? ""}
            </DialogTitle>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
              onClick={() => {
                if (editarDiaTarget) {
                  setCreateData((p) => ({ ...p, data: editarDiaTarget.data }));
                  setEditarDiaTarget(null);
                  setCreateOpen(true);
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Novo Registro
            </Button>
          </div>
          <p className="text-sm text-stone-600 mb-4">
            Batidas da jornada. Edite ou exclua um registro se necessário.
          </p>
          <div className="space-y-3">
            {editarDiaTarget?.marcacoes?.length ? (
              editarDiaTarget.marcacoes.map((m) => {
                const d = new Date(m.horario);
                const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                return (
                  <div
                    key={m.registroId}
                    className="flex items-center justify-between py-2 px-3 border border-stone-200 rounded-lg"
                  >
                    <span className="font-medium text-stone-800 flex items-center gap-2">
                      {d.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      {m.tipo && (
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            m.tipo === "ENTRADA" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {m.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-stone-600 hover:text-stone-800 hover:bg-stone-100"
                        onClick={() => {
                          setEditTarget({
                            funcionarioId: selectedFuncionarioId,
                            registroId: m.registroId,
                            data: m.horario.slice(0, 10),
                            horario: m.horario,
                          });
                          setEditForm({
                            horario: timeStr,
                            justificativa: "",
                            observacao: "",
                          });
                          setEditarDiaTarget(null);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => {
                          setDeleteTarget({
                            funcionarioId: selectedFuncionarioId,
                            registroId: m.registroId,
                            data: m.horario.slice(0, 10),
                            horario: m.horario,
                          });
                          setEditarDiaTarget(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-stone-500 py-2">Nenhuma batida neste dia.</p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditarDiaTarget(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label>Justificativa *</Label>
              <Select
                value={editForm.justificativa || ""}
                onValueChange={(v) => setEditForm((p) => ({ ...p, justificativa: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a justificativa" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar registro de ponto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Funcionário: {funcionarioNome}</p>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={createData.data}
                  onChange={(e) => setCreateData((p) => ({ ...p, data: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário (HH:MM)</Label>
                <Input
                  type="time"
                  value={createData.horario}
                  onChange={(e) => setCreateData((p) => ({ ...p, horario: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Select
                value={createData.justificativa || ""}
                onValueChange={(v) => setCreateData((p) => ({ ...p, justificativa: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a justificativa" />
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
                value={createData.observacao}
                onChange={(e) => setCreateData((p) => ({ ...p, observacao: e.target.value }))}
                placeholder="Observações"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              disabled={!createData.data || !createData.horario || !createData.justificativa.trim() || createRegistroMutation.isPending}
              onClick={handleCriarRegistro}
            >
              {createRegistroMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
