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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { resumoBancoHorasFuncionario, listarBancoHorasHistoricoFuncionario } from "@/lib/api-funcionario";
import { tokenStorage } from "@/lib/token-storage";

export default function BancoHorasFuncionarioPage() {
  const [page, setPage] = useState(0);
  const size = 10;
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
                  {totalPaginas > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Página {paginaAtual + 1} de {totalPaginas}
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
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
