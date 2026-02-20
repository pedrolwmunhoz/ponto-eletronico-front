import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, ClipboardList, Wallet, Clock, Fingerprint } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMetricasDia, getMetricasDiaPorPeriodo, getAtividadesRecentes } from "@/lib/api-empresa";
import { durationToMinutes } from "@/lib/duration";
import type { MetricasDiariaEmpresaResponse } from "@/types/empresa";

/** Formata Duration ISO-8601 (ex: PT8H30M) para exibição. */
function formatDuration(iso?: string | null): string {
  if (!iso || iso === "PT0S") return "0 h";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/i);
  const h = match ? parseInt(match[1] || "0", 10) : 0;
  const m = match ? parseInt(match[2] || "0", 10) : 0;
  if (h === 0 && m === 0) return "0 h";
  if (m === 0) return `${h} h`;
  return `${h}h ${m}m`;
}

function formatMinutesToHours(m: number): string {
  if (m === 0) return "0h";
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  if (min === 0) return `${h}h`;
  return `${h}h ${min}m`;
}

export default function DashboardPage() {
  const hoje = new Date();
  const dataInicio = format(startOfMonth(hoje), "yyyy-MM-dd");
  const dataFim = format(hoje, "yyyy-MM-dd");

  const { data: metricas, isLoading } = useQuery({
    queryKey: ["empresa", "metricas-dia"],
    queryFn: async () => {
      try {
        return await getMetricasDia();
      } catch (e: unknown) {
        if (e && typeof e === "object" && "response" in e && (e as { response?: { status?: number } }).response?.status === 404) {
          return null;
        }
        throw e;
      }
    },
  });

  const { data: listaMetricas, isLoading: isLoadingPeriodo } = useQuery({
    queryKey: ["empresa", "metricas-dia-por-periodo", dataInicio, dataFim],
    queryFn: () => getMetricasDiaPorPeriodo(dataInicio, dataFim),
    enabled: !!dataInicio && !!dataFim && dataInicio <= dataFim,
  });

  const { data: atividadesRecentes = [] } = useQuery({
    queryKey: ["empresa", "atividades-recentes"],
    queryFn: getAtividadesRecentes,
  });

  const chartData = useMemo(() => {
    const inicioMes = startOfMonth(hoje);
    const dias: Date[] = [];
    for (let d = inicioMes; d <= hoje; d = addDays(d, 1)) {
      dias.push(d);
    }

    const mapPorData = new Map<string, MetricasDiariaEmpresaResponse>();
    if (listaMetricas && listaMetricas.length > 0) {
      for (const m of listaMetricas) {
        mapPorData.set(m.dataRef, m);
      }
    }

    const temMetricas = !!listaMetricas && listaMetricas.length > 0;

    let acumHorasMin = 0;
    let acumPontos = 0;
    let ultimoAcumHorasHoras = 0;
    let ultimoAcumPontos = 0;
    let ultimoQtdFunc = 0;

    let primeiraDataMetrica: Date | null = null;
    if (temMetricas) {
      const ordenadas = [...listaMetricas].sort((a, b) =>
        a.dataRef.localeCompare(b.dataRef)
      );
      primeiraDataMetrica = new Date(ordenadas[0].dataRef);
    }

    return dias.map((dia) => {
      const chave = format(dia, "yyyy-MM-dd");
      const m = mapPorData.get(chave);

      let totalDoDiaMin = 0;
      let pontosDoDia = 0;
      let qtdFunc = ultimoQtdFunc;

      if (m) {
        const minDoDia = durationToMinutes(m.totalDoDia);
        totalDoDiaMin = minDoDia;
        pontosDoDia = m.totalPontoHoje ?? 0;
        qtdFunc = m.quantidadeFuncionarios ?? ultimoQtdFunc;

        acumHorasMin += minDoDia;
        acumPontos += pontosDoDia;

        ultimoAcumHorasHoras = Math.round((acumHorasMin / 60) * 100) / 100;
        ultimoAcumPontos = acumPontos;
        ultimoQtdFunc = qtdFunc;
      } else if (!temMetricas) {
        // Nenhuma métrica ainda: tudo zerado.
        ultimoAcumHorasHoras = 0;
        ultimoAcumPontos = 0;
        ultimoQtdFunc = 0;
      } else if (primeiraDataMetrica && dia < primeiraDataMetrica) {
        // Antes da primeira métrica: zera linha e candle.
        ultimoAcumHorasHoras = 0;
        ultimoAcumPontos = 0;
        ultimoQtdFunc = 0;
      } else {
        // Depois da primeira métrica, mas sem registro nesse dia:
        // - Linha: repete o último valor acumulado (acumHorasHoras / acumPontos / quantidadeFuncionarios).
        // - Candle (barras): zera o valor do dia (totalDoDiaHoras / totalPontoHoje).
        // acumulados e qtdFunc já estão em ultimo*, então só deixamos totalDoDiaMin/pontosDoDia = 0.
      }

      return {
        dia: format(dia, "dd/MM", { locale: ptBR }),
        totalDoDiaHoras: Math.round((totalDoDiaMin / 60) * 100) / 100,
        acumHorasHoras: ultimoAcumHorasHoras,
        totalPontoHoje: pontosDoDia,
        acumPontos: ultimoAcumPontos,
        quantidadeFuncionarios: ultimoQtdFunc,
      };
    });
  }, [hoje, listaMetricas]);

  /** Um ponto zerado para exibir os gráficos com eixo em 0 quando a resposta for vazia. */
  const chartDataOuZerado = chartData.length > 0 ? chartData : [{ dia: "-", totalDoDiaHoras: 0, acumHorasHoras: 0, totalPontoHoje: 0, acumPontos: 0, quantidadeFuncionarios: 0 }];

  const ultimoChart = chartDataOuZerado.length > 0 ? chartDataOuZerado[chartDataOuZerado.length - 1] : null;
  const totalMesHoras = ultimoChart ? formatMinutesToHours(Math.round(ultimoChart.acumHorasHoras * 60)) : "0h";
  const registroMes = ultimoChart ? String(ultimoChart.acumPontos) : "0";

  const stats = [
    { label: "Horas dia", value: metricas ? formatDuration(metricas.totalDoDia) : "0 h", icon: Wallet, color: "text-primary" },
    { label: "Horas mês", value: totalMesHoras, icon: Wallet, color: "text-primary" },
    { label: "Registros dia", value: metricas ? String(metricas.totalPontoHoje) : "0", icon: Fingerprint, color: "text-info" },
    { label: "Registros mês", value: registroMes, icon: Fingerprint, color: "text-info" },
    { label: "Funcionários", value: metricas ? String(metricas.quantidadeFuncionarios) : "0", icon: Users, color: "text-primary" },
    { label: "Solicitações Pendentes", value: metricas ? String(metricas.solicitacoesPendentes) : "0", icon: ClipboardList, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do ponto eletrônico</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className={["Horas dia", "Registros dia"].includes(stat.label) ? "hidden sm:block" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {(isLoading || (["Horas mês", "Registros mês"].includes(stat.label) && isLoadingPeriodo)) ? "…" : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {atividadesRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro de ponto recente.</p>
            ) : (
              atividadesRecentes.map((a) => {
                const horario = a.registradoEm
                  ? new Date(a.registradoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                  : "—";
                const entry = `${a.nomeCompleto} — ${horario} ✓`;
                return (
                  <div
                    key={`${a.nomeCompleto}-${a.registradoEm}`}
                    className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">{entry}</span>
                    <span className="text-xs text-green-600 font-medium">Geoloc. OK</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/empresa/espelho-ponto">Ver mais</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos — período: início do mês até hoje */}
      <section className="space-y-6">
        <h2 className="font-display text-lg font-semibold text-foreground border-b pb-2">Gráficos do mês</h2>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total de horas mensal (acumulado)</CardTitle>
              <p className="text-xs text-muted-foreground">Soma dia a dia das horas trabalhadas</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartDataOuZerado} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatMinutesToHours(v * 60)} domain={[0, "auto"]} />
                  <Tooltip formatter={(v: number) => [formatMinutesToHours((v as number) * 60), "Acumulado"]} labelFormatter={(_, payload) => payload[0]?.payload?.dia} />
                  <Legend />
                  <Line type="monotone" dataKey="acumHorasHoras" name="Horas acumuladas" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total de horas por dia</CardTitle>
              <p className="text-xs text-muted-foreground">Horas trabalhadas em cada dia</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartDataOuZerado} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatMinutesToHours(v * 60)} domain={[0, "auto"]} />
                  <Tooltip formatter={(v: number) => [formatMinutesToHours((v as number) * 60), "Horas do dia"]} labelFormatter={(_, payload) => payload[0]?.payload?.dia} />
                  <Legend />
                  <Bar dataKey="totalDoDiaHoras" name="Horas do dia" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total registro de pontos (acumulado)</CardTitle>
              <p className="text-xs text-muted-foreground">Soma dia a dia dos registros de ponto</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartDataOuZerado} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} />
                  <Tooltip formatter={(v: number) => [v, "Pontos acumulados"]} labelFormatter={(_, payload) => payload[0]?.payload?.dia} />
                  <Legend />
                  <Line type="monotone" dataKey="acumPontos" name="Pontos acumulados" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total registro de pontos por dia</CardTitle>
              <p className="text-xs text-muted-foreground">Registros de ponto em cada dia</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartDataOuZerado} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} />
                  <Tooltip formatter={(v: number) => [v, "Pontos do dia"]} labelFormatter={(_, payload) => payload[0]?.payload?.dia} />
                  <Legend />
                  <Bar dataKey="totalPontoHoje" name="Pontos do dia" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total de funcionários</CardTitle>
            <p className="text-xs text-muted-foreground">Quantidade de funcionários por dia</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartDataOuZerado} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} domain={[0, "auto"]} />
                <Tooltip formatter={(v: number) => [v, "Funcionários"]} labelFormatter={(_, payload) => payload[0]?.payload?.dia} />
                <Legend />
                <Line type="monotone" dataKey="quantidadeFuncionarios" name="Funcionários" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
