import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Pencil, Trash2, Search } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import {
  validateData,
  validateDescricaoFeriado,
  validateRequiredSelect,
} from "@/lib/validations";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";
import {
  listarFeriados,
  criarFeriado,
  editarFeriado,
  excluirFeriado,
} from "@/lib/api-empresa";
import type { CriarFeriadoRequest, EditarFeriadoRequest, FeriadoItemResponse } from "@/types/empresa";
import { TIPO_FERIADO_OPCOES_EMPRESA } from "@/types/empresa";
import { Checkbox } from "@/components/ui/checkbox";

function formatDate(s: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}

export default function FeriadosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [nome, setNome] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [openCriar, setOpenCriar] = useState(false);
  const [editarTarget, setEditarTarget] = useState<FeriadoItemResponse | null>(null);
  const [excluirTarget, setExcluirTarget] = useState<FeriadoItemResponse | null>(null);

  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoFeriadoId, setTipoFeriadoId] = useState("");
  const [ativo, setAtivo] = useState(true);

  const { getError, getTouched, handleBlur, handleChange, validateAll, clearAll } = useValidation();

  const { data: listagem, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["empresa", "feriados", page, pageSize],
    queryFn: () => listarFeriados({ page, size: pageSize }),
    retry: false,
  });

  useEffect(() => {
    if (isError && error) {
      const msg = (error as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? "Erro ao carregar feriados.";
      toast({
        variant: "destructive",
        title: "Erro ao carregar",
        description: msg,
      });
    }
  }, [isError, error, toast]);

  const criarMutation = useMutation({
    mutationFn: (body: CriarFeriadoRequest) => criarFeriado(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "feriados"] });
      setOpenCriar(false);
      resetForm();
      toast({ title: "Feriado criado" });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar",
        description: (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? "Tente novamente.",
      });
    },
  });

  const editarMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: EditarFeriadoRequest }) =>
      editarFeriado(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "feriados"] });
      setEditarTarget(null);
      resetForm();
      toast({ title: "Feriado atualizado" });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: "Erro ao editar",
        description: (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? "Tente novamente.",
      });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (feriadoId: string) => excluirFeriado(feriadoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "feriados"] });
      setExcluirTarget(null);
      toast({ title: "Feriado excluído" });
    },
    onError: (err: unknown) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: (err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem ?? "Tente novamente.",
      });
    },
  });

  const resetForm = () => {
    setData("");
    setDescricao("");
    setTipoFeriadoId("");
    setAtivo(true);
    clearAll();
  };

  const openEditar = (f: FeriadoItemResponse) => {
    setEditarTarget(f);
    setData(f.data);
    setDescricao(f.descricao);
    setTipoFeriadoId(String(f.tipoFeriadoId));
    setAtivo(f.ativo);
    clearAll();
  };

  const validadoresCriarEditar = {
    data: (v: string) => validateData(v, true),
    descricao: (v: string) => validateDescricaoFeriado(v, true),
    tipoFeriadoId: (v: string) => validateRequiredSelect(v, "Selecione o tipo de feriado."),
  };

  const handleCriar = () => {
    if (!validateAll(validadoresCriarEditar)) {
      toast({ variant: "destructive", title: "Corrija os campos antes de criar." });
      return;
    }
    const tid = parseInt(tipoFeriadoId, 10);
    criarMutation.mutate({ data, descricao: descricao.trim(), tipoFeriadoId: tid, ativo });
  };

  const handleEditar = () => {
    if (!editarTarget) return;
    if (!validateAll(validadoresCriarEditar)) {
      toast({ variant: "destructive", title: "Corrija os campos antes de salvar." });
      return;
    }
    const tid = parseInt(tipoFeriadoId, 10);
    editarMutation.mutate({
      id: editarTarget.id,
      body: { data, descricao: descricao.trim(), tipoFeriadoId: tid, ativo },
    });
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

  const paginacao = listagem?.paginacao;
  const totalPaginas = paginacao?.totalPaginas ?? 1;
  const paginaAtual = paginacao?.paginaAtual ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Feriados</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre feriados estaduais e municipais. Feriados nacionais criados pelo admin também aparecem aqui.
          </p>
        </div>
        <Dialog open={openCriar} onOpenChange={(o) => { setOpenCriar(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo feriado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo feriado</DialogTitle>
              <DialogDescription>
                Informe a data, descrição e tipo. Empresa pode cadastrar apenas Estadual ou Municipal.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="criar-data" required>Data</Label>
                <Input
                  id="criar-data"
                  type="date"
                  value={data}
                  onChange={(e) => { setData(e.target.value); handleChange("data", e.target.value, validadoresCriarEditar.data); }}
                  onBlur={() => handleBlur("data", data, validadoresCriarEditar.data)}
                  aria-invalid={!!getError("data")}
                />
                <FieldExpectedStatus fieldKey="data" value={data} error={getError("data")} touched={getTouched("data")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="criar-descricao" required>Descrição</Label>
                <Input
                  id="criar-descricao"
                  value={descricao}
                  onChange={(e) => { setDescricao(e.target.value); handleChange("descricao", e.target.value, validadoresCriarEditar.descricao); }}
                  onBlur={() => handleBlur("descricao", descricao, validadoresCriarEditar.descricao)}
                  placeholder="Ex.: Natal, Ano Novo"
                  maxLength={255}
                  aria-invalid={!!getError("descricao")}
                />
                <FieldExpectedStatus fieldKey="descricaoFeriado" value={descricao} error={getError("descricao")} touched={getTouched("descricao")} />
              </div>
              <div className="grid gap-2">
                <Label required>Tipo</Label>
                <Select
                  value={tipoFeriadoId}
                  onValueChange={(v) => { setTipoFeriadoId(v); handleChange("tipoFeriadoId", v, validadoresCriarEditar.tipoFeriadoId); }}
                >
                  <SelectTrigger aria-invalid={!!getError("tipoFeriadoId")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_FERIADO_OPCOES_EMPRESA.map((op) => (
                      <SelectItem key={op.id} value={String(op.id)}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldExpectedStatus fieldKey="tipoFeriadoId" value={tipoFeriadoId} error={getError("tipoFeriadoId")} touched={getTouched("tipoFeriadoId")} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="criar-ativo"
                  checked={ativo}
                  onCheckedChange={(c) => setAtivo(!!c)}
                />
                <Label htmlFor="criar-ativo" className="font-normal cursor-pointer">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCriar(false)}>Cancelar</Button>
              <Button onClick={handleCriar} disabled={criarMutation.isPending}>
                {criarMutation.isPending ? "Salvando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5" />
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
          {!isLoading && (listagem || isError) && (
            <>
              <div className="h-[600px] overflow-y-auto rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listagem?.conteudo ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum feriado cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (listagem?.conteudo ?? []).map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{formatDate(f.data)}</TableCell>
                        <TableCell>{f.descricao}</TableCell>
                        <TableCell>{f.tipoFeriadoDescricao}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              f.ativo ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {f.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditar(f)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setExcluirTarget(f)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
              {paginacao && (listagem?.conteudo?.length ?? 0) > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {paginaAtual + 1} de {totalPaginas}
                    {` • ${paginacao.totalElementos} registro(s)`}
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
                        const start = Math.max(0, Math.min(paginaAtual - Math.floor(maxBtns / 2), totalPaginas - maxBtns));
                        const end = Math.min(totalPaginas - 1, start + maxBtns - 1);
                        return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i).map((p) => (
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
                        ));
                      })()}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (paginaAtual < totalPaginas - 1) setPage(paginaAtual + 1);
                          }}
                          className={paginaAtual >= totalPaginas - 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Editar */}
      <Dialog open={!!editarTarget} onOpenChange={(o) => { if (!o) { setEditarTarget(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar feriado</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-data" required>Data</Label>
              <Input
                id="edit-data"
                type="date"
                value={data}
                onChange={(e) => { setData(e.target.value); handleChange("data", e.target.value, validadoresCriarEditar.data); }}
                onBlur={() => handleBlur("data", data, validadoresCriarEditar.data)}
                aria-invalid={!!getError("data")}
              />
              <FieldExpectedStatus fieldKey="data" value={data} error={getError("data")} touched={getTouched("data")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-descricao" required>Descrição</Label>
              <Input
                id="edit-descricao"
                value={descricao}
                onChange={(e) => { setDescricao(e.target.value); handleChange("descricao", e.target.value, validadoresCriarEditar.descricao); }}
                onBlur={() => handleBlur("descricao", descricao, validadoresCriarEditar.descricao)}
                maxLength={255}
                aria-invalid={!!getError("descricao")}
              />
              <FieldExpectedStatus fieldKey="descricaoFeriado" value={descricao} error={getError("descricao")} touched={getTouched("descricao")} />
            </div>
            <div className="grid gap-2">
              <Label required>Tipo</Label>
              <Select
                value={tipoFeriadoId}
                onValueChange={(v) => { setTipoFeriadoId(v); handleChange("tipoFeriadoId", v, validadoresCriarEditar.tipoFeriadoId); }}
              >
                <SelectTrigger aria-invalid={!!getError("tipoFeriadoId")}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_FERIADO_OPCOES_EMPRESA.map((op) => (
                    <SelectItem key={op.id} value={String(op.id)}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldExpectedStatus fieldKey="tipoFeriadoId" value={tipoFeriadoId} error={getError("tipoFeriadoId")} touched={getTouched("tipoFeriadoId")} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-ativo"
                checked={ativo}
                onCheckedChange={(c) => setAtivo(!!c)}
              />
              <Label htmlFor="edit-ativo" className="font-normal cursor-pointer">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditarTarget(null)}>Cancelar</Button>
            <Button onClick={handleEditar} disabled={editarMutation.isPending}>
              {editarMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Excluir */}
      <AlertDialog open={!!excluirTarget} onOpenChange={() => !excluirMutation.isPending && setExcluirTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir feriado?</AlertDialogTitle>
            <AlertDialogDescription>
              {excluirTarget
                ? `Deseja excluir o feriado "${excluirTarget.descricao}" (${formatDate(excluirTarget.data)})? Apenas feriados criados pela empresa podem ser excluídos.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluirMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (excluirTarget) excluirMutation.mutate(excluirTarget.id);
              }}
              disabled={excluirMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluirMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
