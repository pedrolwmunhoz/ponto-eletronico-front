import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Search } from "lucide-react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";
import { validateData, validateRequiredSelect } from "@/lib/validations";
import {
  listarFeriasAfastamentosEmpresa,
  criarAfastamento,
  listarFuncionarios,
} from "@/lib/api-empresa";
import type { CriarAfastamentoRequest } from "@/types/empresa";
import { TIPO_AFASTAMENTO_OPCOES } from "@/types/empresa";

function formatDate(s: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}

export default function FeriasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [nome, setNome] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [open, setOpen] = useState(false);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [tipoAfastamentoId, setTipoAfastamentoId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");

  const { getError, getTouched, handleBlur, handleChange, validateAll } = useValidation();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["empresa", "ferias-afastamentos", page, size, nome],
    queryFn: () => listarFeriasAfastamentosEmpresa({ page, size, nome: nome || undefined }),
  });

  useEffect(() => {
    if (isError && error) {
      const msg = (error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    }
  }, [isError, error, toast]);

  const handleSearch = () => {
    setNome(nomeInput.trim());
    setPage(0);
  };
  const handleClearSearch = () => {
    setNomeInput("");
    setNome("");
    setPage(0);
  };

  const { data: funcionariosData } = useQuery({
    queryKey: ["empresa", "funcionarios", 0, 100],
    queryFn: () => listarFuncionarios({ page: 0, pageSize: 100 }),
    enabled: open,
  });

  const criarMutation = useMutation({
    mutationFn: (body: CriarAfastamentoRequest) =>
      criarAfastamento(funcionarioId, {
        ...body,
        ativo: body.ativo ?? true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "ferias-afastamentos"] });
      setOpen(false);
      setFuncionarioId("");
      setTipoAfastamentoId("");
      setDataInicio("");
      setDataFim("");
      setObservacao("");
      toast({ title: "Afastamento criado" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar afastamento",
        description: err.response?.data?.mensagem ?? "Tente novamente.",
      });
    },
  });

  const validadoresAfastamento = {
    funcionarioId: (v: string) => validateRequiredSelect(v, "Selecione o funcionário."),
    tipoAfastamentoId: (v: string) => validateRequiredSelect(v, "Selecione o tipo de afastamento."),
    dataInicio: (v: string) => validateData(v, true),
    dataFim: (v: string) => validateData(v, false),
  };

  const handleSubmit = () => {
    const ok = validateAll([
      ["funcionarioId", funcionarioId, validadoresAfastamento.funcionarioId],
      ["tipoAfastamentoId", tipoAfastamentoId, validadoresAfastamento.tipoAfastamentoId],
      ["dataInicio", dataInicio, validadoresAfastamento.dataInicio],
      ["dataFim", dataFim, validadoresAfastamento.dataFim],
    ]);
    if (!ok) {
      toast({ variant: "destructive", title: "Corrija os campos antes de criar." });
      return;
    }
    const tid = parseInt(tipoAfastamentoId, 10);
    criarMutation.mutate({
      tipoAfastamentoId: tid,
      dataInicio,
      dataFim: dataFim.trim() || undefined,
      observacao: observacao.trim() || undefined,
      ativo: true,
    });
  };

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / size)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Férias e afastamentos</h1>
          <p className="text-sm text-muted-foreground">
            Consulte e cadastre afastamentos por funcionário
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo afastamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo afastamento</DialogTitle>
              <DialogDescription>
                Selecione o tipo de afastamento e informe a data de início. A data de fim é opcional.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label required>Funcionário</Label>
                <Select
                  value={funcionarioId}
                  onValueChange={(v) => { setFuncionarioId(v); handleChange("funcionarioId", v, validadoresAfastamento.funcionarioId); }}
                >
                  <SelectTrigger aria-invalid={!!getError("funcionarioId")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionariosData?.conteudo?.map((f) => (
                      <SelectItem key={f.usuarioId} value={f.usuarioId}>
                        {f.username} {f.emails?.[0] ? `(${f.emails[0]})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldExpectedStatus fieldKey="funcionarioId" value={funcionarioId} error={getError("funcionarioId")} touched={getTouched("funcionarioId")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipoAfastamentoId" required>Tipo de afastamento</Label>
                <Select
                  value={tipoAfastamentoId}
                  onValueChange={(v) => { setTipoAfastamentoId(v); handleChange("tipoAfastamentoId", v, validadoresAfastamento.tipoAfastamentoId); }}
                >
                  <SelectTrigger id="tipoAfastamentoId" aria-invalid={!!getError("tipoAfastamentoId")}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_AFASTAMENTO_OPCOES.map((op) => (
                      <SelectItem key={op.id} value={String(op.id)}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldExpectedStatus fieldKey="tipoAfastamentoId" value={tipoAfastamentoId} error={getError("tipoAfastamentoId")} touched={getTouched("tipoAfastamentoId")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dataInicio" required>Data início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => { setDataInicio(e.target.value); handleChange("dataInicio", e.target.value, validadoresAfastamento.dataInicio); }}
                    onBlur={() => handleBlur("dataInicio", dataInicio, validadoresAfastamento.dataInicio)}
                    aria-invalid={!!getError("dataInicio")}
                  />
                  <FieldExpectedStatus fieldKey="dataInicio" value={dataInicio} error={getError("dataInicio")} touched={getTouched("dataInicio")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dataFim">Data fim (opcional)</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => { setDataFim(e.target.value); handleChange("dataFim", e.target.value, validadoresAfastamento.dataFim); }}
                    onBlur={() => handleBlur("dataFim", dataFim, validadoresAfastamento.dataFim)}
                    aria-invalid={!!getError("dataFim")}
                  />
                  <FieldExpectedStatus fieldKey="dataFim" value={dataFim} error={getError("dataFim")} touched={getTouched("dataFim")} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Input
                  id="observacao"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Detalhes do afastamento"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={criarMutation.isPending}>
                {criarMutation.isPending ? "Salvando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
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
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo / Afastamento</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.items ?? []).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.nomeFuncionario ?? "—"}</TableCell>
                        <TableCell>{item.nomeAfastamento ?? "—"}</TableCell>
                        <TableCell>{formatDate(item.inicio)}</TableCell>
                        <TableCell>{formatDate(item.fim ?? null)}</TableCell>
                        <TableCell>{item.status ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPaginas} • {data?.total ?? 0} registro(s)
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 0) setPage(page - 1);
                          }}
                          className={page === 0 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {(() => {
                        const maxBtns = 5;
                        const start = Math.max(0, Math.min(page - Math.floor(maxBtns / 2), totalPaginas - maxBtns));
                        const end = Math.min(totalPaginas - 1, start + maxBtns - 1);
                        return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                              isActive={p === page}
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
                            if (page < totalPaginas - 1) setPage(page + 1);
                          }}
                          className={
                            page >= totalPaginas - 1 ? "pointer-events-none opacity-50" : ""
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
    </div>
  );
}
