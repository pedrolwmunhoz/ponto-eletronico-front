import { useState, useEffect } from "react";
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
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination-constants";
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
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["funcionario", "ferias-afastamentos", page, size],
    queryFn: () => listarFeriasAfastamentosFuncionario({ page, size }),
  });

  useEffect(() => {
    if (isError && error) {
      const msg = (error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    }
  }, [isError, error, toast]);

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
          {!isLoading && (data || isError) && (
            <>
              <div className="h-[600px] overflow-y-auto rounded-md border">
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
                  {(data?.items ?? []).length === 0 ? (
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
              </div>
              <div className="mt-2 sm:mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 border-t pt-2 sm:pt-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Página {page + 1} de {totalPaginas} • {data?.total ?? 0} registro(s)
                  </p>
                  <div className="flex justify-center scale-90 sm:scale-100 origin-center">
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
                        const maxBtns = 3;
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
