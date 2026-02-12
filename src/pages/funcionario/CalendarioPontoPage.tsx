import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listarMeuPonto } from "@/lib/api-funcionario";
import { tokenStorage } from "@/lib/token-storage";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function CalendarioPontoPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const userId = tokenStorage.getUserId();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["funcionario", "ponto", userId, ano, mes],
    queryFn: () => listarMeuPonto(userId!, ano, mes),
    enabled: !!userId,
  });

  const mudarMes = (delta: number) => {
    let n = mes + delta;
    let a = ano;
    if (n > 12) { n = 1; a++; }
    if (n < 1) { n = 12; a--; }
    setMes(n);
    setAno(a);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Meu calendário de ponto</h1>
        <p className="text-sm text-muted-foreground">Registros de ponto do mês.</p>
      </div>

      {!userId && (
        <div className="py-8 text-center text-sm text-muted-foreground">Sessão inválida. Faça login novamente.</div>
      )}

      {userId && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5" />
              {MESES[mes - 1]} / {ano}
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => mudarMes(-1)}
                className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={() => mudarMes(1)}
                className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                Próximo →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
            )}
            {isError && (
              <div className="py-8 text-center text-sm text-destructive">
                {(error as Error)?.message ?? "Erro ao carregar ponto."}
              </div>
            )}
            {!isLoading && !isError && data && (
              <div className="space-y-2">
                {data.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum registro neste período.</p>
                ) : (
                  <ul className="divide-y">
                    {data.items.map((jornada) => (
                      <li key={`${jornada.jornada}-${jornada.data}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span className="font-medium">{jornada.jornada}</span>
                        <span className="text-muted-foreground text-sm">{jornada.data}</span>
                        <span className="text-muted-foreground text-sm">{jornada.diaSemana}</span>
                        <span className="text-sm">{jornada.status}</span>
                        <span className="text-sm">Total: {jornada.totalHoras}</span>
                        {jornada.marcacoes?.length > 0 && (
                          <span className="w-full text-xs text-muted-foreground">
                            Batidas: {jornada.marcacoes.map((m) => new Date(m.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })).join(", ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
