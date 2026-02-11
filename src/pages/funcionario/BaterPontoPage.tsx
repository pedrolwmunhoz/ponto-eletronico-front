import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function BaterPontoPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
          <Button size="lg" className="h-16 w-full gap-3 text-lg">
            <Clock className="h-6 w-6" /> Bater Ponto
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Batidas de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma batida registrada ainda.</p>
        </CardContent>
      </Card>
    </div>
  );
}
