import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
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
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination-constants";
import { resumoBancoHorasFuncionario, listarBancoHorasHistoricoFuncionario } from "@/lib/api-funcionario";
import { tokenStorage } from "@/lib/token-storage";

export default function BancoHorasFuncionarioPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const userId = tokenStorage.getUserId();

  const { data: resumoData } = useQuery({
    queryKey: ["funcionario", "banco-horas-resumo", userId],
    queryFn: () => resumoBancoHorasFuncionario(userId!),
    enabled: !!userId,
  });

  const { data: historicoData } = useQuery({
    queryKey: ["funcionario", "banco-horas-historico", userId, page, size],
    queryFn: () => listarBancoHorasHistoricoFuncionario(userId!, { page, size }),
    enabled: !!userId,
  });

  const historico = historicoData?.conteudo ?? [];
  const paginacao = historicoData?.paginacao;
  const totalPaginas = paginacao
    ? Math.max(1, Math.ceil(paginacao.totalElementos / size))
    : 1;
  const paginaAtual = paginacao?.paginaAtual ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Meu banco de horas</h1>
        <p className="text-sm text-muted-foreground">
          Resumo e histórico do seu banco de horas.
        </p>
      </div>

      {!userId && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Sessão inválida. Faça login novamente.
        </div>
      )}

      {userId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resumoData ? (
                <div className="grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Horas vencidas:</span>{" "}
                    {resumoData.totalHorasVencidas ?? "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Horas esperadas:</span>{" "}
                    {resumoData.totalHorasEsperadas ?? "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Horas trabalhadas:</span>{" "}
                    {resumoData.totalHorasTrabalhadas ?? "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Total final banco:</span>{" "}
                    {resumoData.totalFinalBanco ?? "—"}
                  </p>
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
                          <TableCell>
                            {h.anoReferencia}/{String(h.mesReferencia).padStart(2, "0")}
                          </TableCell>
                          <TableCell>{h.totalHorasEsperadas}</TableCell>
                          <TableCell>{h.totalHorasTrabalhadas}</TableCell>
                          <TableCell>{h.totalBancoHorasFinal}</TableCell>
                          <TableCell>{h.status ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                  {(totalPaginas > 1 || historico.length > 0) && (
                    <div className="mt-2 sm:mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Página {paginaAtual + 1} de {totalPaginas}
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
                          <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(0); }}>
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
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
