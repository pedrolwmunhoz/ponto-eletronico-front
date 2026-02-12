import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
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
import { listarFeriasAfastamentosFuncionario } from "@/lib/api-funcionario";

function formatDate(s: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}

export default function FeriasFuncionarioPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["funcionario", "ferias-afastamentos", page, size],
    queryFn: () => listarFeriasAfastamentosFuncionario({ page, size }),
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / size)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Meus férias e afastamentos</h1>
        <p className="text-sm text-muted-foreground">
          Consulte seus períodos de férias e afastamentos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
            Listagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          )}
          {isError && (
            <div className="py-8 text-center text-sm text-destructive">
              {(error as Error)?.message ?? "Erro ao carregar."}
            </div>
          )}
          {!isLoading && !isError && data && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo / Afastamento</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.nomeAfastamento ?? "—"}</TableCell>
                        <TableCell>{formatDate(item.inicio)}</TableCell>
                        <TableCell>{formatDate(item.fim ?? null)}</TableCell>
                        <TableCell>{item.status ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page + 1} de {totalPaginas} • {data.total} registro(s)
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
