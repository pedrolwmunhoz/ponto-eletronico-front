import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { registrarPontoApp, listarMeuPonto } from "@/lib/api-funcionario";
import { tokenStorage } from "@/lib/token-storage";
import { useToast } from "@/hooks/use-toast";

export default function BaterPontoPage() {
  const [now, setNow] = useState(new Date());
  const [pageBatidas, setPageBatidas] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const funcionarioId = tokenStorage.getUserId();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;

  const { data: pontoData } = useQuery({
    queryKey: ["funcionario", "ponto", funcionarioId, ano, mes],
    queryFn: () => listarMeuPonto(funcionarioId!, ano, mes),
    enabled: !!funcionarioId,
  });

  const registrarMutation = useMutation({
    mutationFn: ({ idempotencyKey }: { idempotencyKey: string }) => registrarPontoApp(idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionario", "ponto"] });
      toast({ title: "Ponto registrado", description: "Batida registrada com sucesso." });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao registrar",
        description: err.response?.data?.mensagem ?? "Tente novamente.",
      });
    },
  });

  const hojeStr = `${ano}-${String(mes).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const jornadas = pontoData ?? [];
  const jornadaHoje = jornadas.find(
    (j) => j.data === hojeStr || (j.marcacoes ?? []).some((m) => String(m.horario).startsWith(hojeStr))
  );
  const DIA_SEMANA_LABEL: Record<string, string> = {
    SEG: "Segunda-feira",
    TER: "Terça-feira",
    QUA: "Quarta-feira",
    QUI: "Quinta-feira",
    SEX: "Sexta-feira",
    SAB: "Sábado",
    DOM: "Domingo",
  };
  const diaSemanaHoje =
    (jornadaHoje?.diaSemana && DIA_SEMANA_LABEL[jornadaHoje.diaSemana]) ||
    now.toLocaleDateString("pt-BR", { weekday: "long" }).replace(/^\w/, (c) => c.toUpperCase());
  const dataHojeLabel = `${String(now.getDate()).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
  const batidasHoje = jornadas
    .flatMap((j) => j.marcacoes ?? [])
    .filter((m) => String(m.horario).startsWith(hojeStr))
    .sort((a, b) => String(b.horario).localeCompare(String(a.horario)));

  const totalPaginas = Math.max(1, Math.ceil(batidasHoje.length / size));
  const batidasExibidas =
    batidasHoje.length > size
      ? batidasHoje.slice(pageBatidas * size, pageBatidas * size + size)
      : batidasHoje;

  return (
    <div className="flex flex-col items-center gap-8 pt-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Bater Ponto</h1>
        <p className="text-sm text-muted-foreground">Registre sua entrada ou saída</p>
      </div>

      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="font-display text-5xl tabular-nums text-foreground">
            {now.toLocaleTimeString("pt-BR")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            className="h-16 w-full gap-3 text-lg"
            onClick={() => registrarMutation.mutate({ idempotencyKey: crypto.randomUUID() })}
            disabled={registrarMutation.isPending}
          >
            <Clock className="h-6 w-6" /> {registrarMutation.isPending ? "Registrando..." : "Bater Ponto"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Batidas de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {batidasHoje.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma batida registrada ainda.</p>
          ) : (
            <>
              <div className="h-[600px] overflow-y-auto overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/50">
                    <tr className="border-b bg-muted/50">
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Data</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Dia</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Horário</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batidasExibidas.map((r) => (
                      <tr key={r.registroId} className="border-b last:border-0 font-mono">
                        <td className="px-2 py-1.5">{dataHojeLabel}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{diaSemanaHoje}</td>
                        <td className="px-2 py-1.5">
                          {typeof r.horario === "string" ? r.horario.slice(11, 19) : String(r.horario)}
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">{r.tipo ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(totalPaginas > 1 || batidasHoje.length > 0) && (
                <div className="mt-2 sm:mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Página {pageBatidas + 1} de {totalPaginas}
                  </p>
                  <div className="flex justify-center scale-90 sm:scale-100 origin-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pageBatidas > 0) setPageBatidas(pageBatidas - 1);
                            }}
                            className={pageBatidas === 0 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pageBatidas < totalPaginas - 1) setPageBatidas(pageBatidas + 1);
                            }}
                            className={pageBatidas >= totalPaginas - 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                    <div className="flex items-center justify-end gap-2">
<span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Por página</span>
                        <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPageBatidas(0); }}>
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
    </div>
  );
}
