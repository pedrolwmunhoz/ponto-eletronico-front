import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrarPontoApp, listarMeuPonto } from "@/lib/api-funcionario";
import { tokenStorage } from "@/lib/token-storage";
import { useToast } from "@/hooks/use-toast";

export default function BaterPontoPage() {
  const [now, setNow] = useState(new Date());
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
  const batidasHoje =
    (pontoData ?? [])
      .flatMap((j) => j.marcacoes ?? [])
      .filter((m) => m.horario.startsWith(hojeStr))
      .sort((a, b) => a.horario.localeCompare(b.horario));

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
            <ul className="space-y-1 text-sm">
              {batidasHoje.map((r) => (
                <li key={r.registroId} className="font-mono">
                  {typeof r.horario === "string" ? r.horario.slice(11, 19) : r.horario}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
