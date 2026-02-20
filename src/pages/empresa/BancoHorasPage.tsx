import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, User, Plus, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  listarFuncionarios,
  resumoBancoHoras,
  listarBancoHorasHistorico,
  registrarCompensacaoBancoHoras,
  fechamentoBancoHoras,
} from "@/lib/api-empresa";

export default function BancoHorasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [funcionarioId, setFuncionarioId] = useState<string>("");
  const [compensacaoOpen, setCompensacaoOpen] = useState(false);
  const [fechamentoOpen, setFechamentoOpen] = useState(false);
  const [compensacaoForm, setCompensacaoForm] = useState({ historicoId: "", minutos: 0 });
  const [fechamentoForm, setFechamentoForm] = useState({ anoReferencia: new Date().getFullYear(), mesReferencia: new Date().getMonth() + 1 });
  const [histPage, setHistPage] = useState(0);
  const histSize = 10;

  const { data: funcionariosData } = useQuery({
    queryKey: ["empresa", "funcionarios", 0, 500],
    queryFn: () => listarFuncionarios({ page: 0, pageSize: 500 }),
  });

  const { data: resumoData } = useQuery({
    queryKey: ["empresa", "banco-horas-resumo", funcionarioId],
    queryFn: () => resumoBancoHoras(funcionarioId),
    enabled: !!funcionarioId,
  });

  const { data: historicoData } = useQuery({
    queryKey: ["empresa", "banco-horas-historico", funcionarioId, histPage, histSize],
    queryFn: () => listarBancoHorasHistorico(funcionarioId, { page: histPage, size: histSize }),
    enabled: !!funcionarioId,
  });

  const compensacaoMutation = useMutation({
    mutationFn: (body: { historicoId: string; minutos: number }) =>
      registrarCompensacaoBancoHoras(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-resumo"] });
      queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-historico"] });
      setCompensacaoOpen(false);
      setCompensacaoForm({ historicoId: "", minutos: 0 });
      toast({ title: "Compensação registrada" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.response?.data?.mensagem ?? "Não foi possível registrar compensação.",
      });
    },
  });

  const fechamentoMutation = useMutation({
    mutationFn: ({ fid, body }: { fid: string; body: { anoReferencia: number; mesReferencia: number } }) =>
      fechamentoBancoHoras(fid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-resumo"] });
      queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-historico"] });
      setFechamentoOpen(false);
      toast({ title: "Fechamento solicitado" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err.response?.data?.mensagem ?? "Não foi possível realizar fechamento.",
      });
    },
  });

  const funcionarios = funcionariosData?.conteudo ?? [];
  const funcionarioNome = funcionarios.find((f) => f.usuarioId === funcionarioId)?.username ?? "—";
  const historico = historicoData?.conteudo ?? [];
  const totalHist = historicoData?.paginacao?.totalElementos ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalHist / histSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Banco de horas</h1>
        <p className="text-sm text-muted-foreground">
          Resumo, histórico, compensação e fechamento de banco de horas por funcionário.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5" />
            Funcionário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-2">
            <Label>Selecione o funcionário</Label>
            <Select value={funcionarioId} onValueChange={(v) => { setFuncionarioId(v); setHistPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((f) => (
                  <SelectItem key={f.usuarioId} value={f.usuarioId}>
                    {f.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {funcionarioId && (
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5" />
                Resumo — {funcionarioNome}
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setCompensacaoOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Compensação
                </Button>
                <Button size="sm" variant="outline" onClick={() => setFechamentoOpen(true)}>
                  <FileCheck className="h-4 w-4 mr-1" />
                  Fechamento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {resumoData ? (
                <div className="grid gap-2 text-sm">
                  <p><span className="text-muted-foreground">Horas vencidas:</span> {resumoData.totalHorasVencidas ?? "—"}</p>
                  <p><span className="text-muted-foreground">Horas esperadas:</span> {resumoData.totalHorasEsperadas ?? "—"}</p>
                  <p><span className="text-muted-foreground">Horas trabalhadas:</span> {resumoData.totalHorasTrabalhadas ?? "—"}</p>
                  <p><span className="text-muted-foreground">Total final banco:</span> {resumoData.totalFinalBanco ?? "—"}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Carregando resumo...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum registro no histórico.</p>
              ) : (
                <>
                  <div className="h-[600px] overflow-y-auto rounded-md border">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ano/Mês</TableHead>
                        <TableHead>Esperadas</TableHead>
                        <TableHead>Trabalhadas</TableHead>
                        <TableHead>Banco final</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historico.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>{h.anoReferencia}/{String(h.mesReferencia).padStart(2, "0")}</TableCell>
                          <TableCell>{h.totalHorasEsperadas}</TableCell>
                          <TableCell>{h.totalHorasTrabalhadas}</TableCell>
                          <TableCell>{h.totalBancoHorasFinal}</TableCell>
                          <TableCell>{h.status ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                  {totalPaginas > 1 && (
                    <div className="mt-4 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => { e.preventDefault(); if (histPage > 0) setHistPage(histPage - 1); }}
                              className={histPage === 0 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-2 text-sm">Pág. {histPage + 1} de {totalPaginas}</span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => { e.preventDefault(); if (histPage < totalPaginas - 1) setHistPage(histPage + 1); }}
                              className={histPage >= totalPaginas - 1 ? "pointer-events-none opacity-50" : ""}
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
        </>
      )}

      <Dialog open={compensacaoOpen} onOpenChange={(o) => { setCompensacaoOpen(o); if (!o) { queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-resumo"] }); queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-historico"] }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar compensação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Funcionário: {funcionarioNome}</p>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>ID do histórico (período a compensar)</Label>
              <Input
                value={compensacaoForm.historicoId}
                onChange={(e) => setCompensacaoForm((p) => ({ ...p, historicoId: e.target.value }))}
                placeholder="UUID do registro de histórico"
              />
            </div>
            <div className="space-y-2">
              <Label>Minutos a compensar</Label>
              <Input
                type="number"
                value={compensacaoForm.minutos || ""}
                onChange={(e) => setCompensacaoForm((p) => ({ ...p, minutos: parseInt(e.target.value, 10) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompensacaoOpen(false)}>Cancelar</Button>
            <Button
              disabled={!compensacaoForm.historicoId.trim() || compensacaoMutation.isPending}
              onClick={() => compensacaoMutation.mutate(compensacaoForm)}
            >
              {compensacaoMutation.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fechamentoOpen} onOpenChange={(o) => { setFechamentoOpen(o); if (!o) { queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-resumo"] }); queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-historico"] }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechamento de banco de horas</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Funcionário: {funcionarioNome}</p>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Ano referência</Label>
              <Input
                type="number"
                value={fechamentoForm.anoReferencia}
                onChange={(e) => setFechamentoForm((p) => ({ ...p, anoReferencia: parseInt(e.target.value, 10) || p.anoReferencia }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Mês referência</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={fechamentoForm.mesReferencia}
                onChange={(e) => setFechamentoForm((p) => ({ ...p, mesReferencia: parseInt(e.target.value, 10) || p.mesReferencia }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFechamentoOpen(false); queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-resumo"] }); queryClient.invalidateQueries({ queryKey: ["empresa", "banco-horas-historico"] }); }}>Cancelar</Button>
            <Button
              disabled={fechamentoMutation.isPending}
              onClick={() =>
                fechamentoMutation.mutate({
                  fid: funcionarioId,
                  body: fechamentoForm,
                })
              }
            >
              {fechamentoMutation.isPending ? "Processando..." : "Fechar período"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
