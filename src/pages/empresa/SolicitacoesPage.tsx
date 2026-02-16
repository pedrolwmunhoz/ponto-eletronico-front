import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import { validateMotivo } from "@/lib/validations";
import {
  listarSolicitacoesPonto,
  aprovarSolicitacaoPonto,
  reprovarSolicitacaoPonto,
} from "@/lib/api-empresa";
import type { SolicitacaoPontoItemResponse } from "@/types/empresa";

function formatDate(s: string) {
  if (!s) return "—";
  try {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}

function statusBadge(status: string) {
  const v = (status || "").toLowerCase();
  if (v === "aprovado") return "bg-green-100 text-green-800";
  if (v === "reprovado") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function SolicitacoesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getError, getTouched, handleBlur, handleChange, validateAll } = useValidation();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [nome, setNome] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [reprovarTarget, setReprovarTarget] = useState<SolicitacaoPontoItemResponse | null>(null);
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["empresa", "solicitacoes-ponto", page, size, nome],
    queryFn: () => listarSolicitacoesPonto({ page, size, nome: nome || undefined }),
  });

  useEffect(() => {
    if (isError && error) {
      const msg = (error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar solicitações.";
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

  const aprovarMutation = useMutation({
    mutationFn: (id: string) => aprovarSolicitacaoPonto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "solicitacoes-ponto"] });
      toast({ title: "Solicitação aprovada" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro", description: err.response?.data?.mensagem ?? "Não foi possível aprovar." });
    },
  });

  const reprovarMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { motivo: string; observacao?: string } }) =>
      reprovarSolicitacaoPonto(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "solicitacoes-ponto"] });
      setReprovarTarget(null);
      setMotivo("");
      setObservacao("");
      toast({ title: "Solicitação reprovada" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro", description: err.response?.data?.mensagem ?? "Não foi possível reprovar." });
    },
  });

  const handleReprovarSubmit = () => {
    if (!validateAll([["motivo", motivo, (v) => validateMotivo(v, true)]])) return;
    const m = motivo.trim();
    if (reprovarTarget) {
      reprovarMutation.mutate({
        id: reprovarTarget.id,
        body: { motivo: m, observacao: observacao.trim() || undefined },
      });
    }
  };

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / size)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Solicitações de ponto</h1>
        <p className="text-sm text-muted-foreground">
          Aprove ou reprove solicitações de criação ou exclusão de registro de ponto
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            Pendências
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[180px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma solicitação encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.items ?? []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nomeFuncionario ?? "—"}</TableCell>
                        <TableCell>{s.tipo ?? "—"}</TableCell>
                        <TableCell>{formatDate(s.data)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{s.motivo ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(s.status)}`}
                          >
                            {(s.status ?? "—").toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {(s.status ?? "").toLowerCase() === "pendente" && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1"
                                onClick={() => aprovarMutation.mutate(s.id)}
                                disabled={aprovarMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => setReprovarTarget(s)}
                              >
                                <X className="h-4 w-4" />
                                Reprovar
                              </Button>
                            </div>
                          )}
                        </TableCell>
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

      <AlertDialog open={!!reprovarTarget} onOpenChange={() => !reprovarMutation.isPending && setReprovarTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprovar solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da reprovação. Este campo é obrigatório.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="motivo" required>Motivo</Label>
              <Input
                id="motivo"
                value={motivo}
                onChange={(e) => { setMotivo(e.target.value); handleChange("motivo", e.target.value, (v) => validateMotivo(v, true)); }}
                onBlur={() => handleBlur("motivo", motivo, (v) => validateMotivo(v, true))}
                placeholder="Ex: Horário fora do permitido"
                aria-invalid={!!getError("motivo")}
                className="mt-1"
              />
              <FieldExpectedStatus fieldKey="motivo" value={motivo} error={getError("motivo")} touched={getTouched("motivo")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Detalhes adicionais"
                rows={2}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reprovarMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleReprovarSubmit();
              }}
              disabled={reprovarMutation.isPending || !motivo.trim()}
            >
              {reprovarMutation.isPending ? "Enviando..." : "Reprovar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SolicitacoesPage;
