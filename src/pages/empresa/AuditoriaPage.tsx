import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
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
import { listarAuditoria } from "@/lib/api-empresa";
import type { AuditoriaItemResponse } from "@/types/empresa";

function formatDateTime(s: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("pt-BR");
  } catch {
    return s;
  }
}

export default function AuditoriaPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["empresa", "auditoria", page, size],
    queryFn: () => listarAuditoria({ page, size }),
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
        <h1 className="font-display text-2xl font-bold text-foreground">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Log de ações realizadas na conta da empresa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5" />
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
                    <TableHead>Ação</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Sucesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum registro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.items ?? []).map((item: AuditoriaItemResponse, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.acao ?? "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.descricao ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDateTime(item.data)}
                        </TableCell>
                        <TableCell>{item.nomeUsuario ?? "—"}</TableCell>
                        <TableCell>{item.sucesso ? "Sim" : "Não"}</TableCell>
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
