import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  downloadRelatorioPontoDetalhado,
  downloadRelatorioPontoResumo,
  type FormatoRelatorio,
} from "@/lib/api-empresa";

const MESES = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export default function RelatoriosPage() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [ano, setAno] = useState(currentYear);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [formato, setFormato] = useState<FormatoRelatorio>("PDF");
  function applyDownload(blob: Blob, nomeBase: string, formato: FormatoRelatorio, ano: number, mes: number) {
    const ext = formato === "PDF" ? "pdf" : "xlsx";
    const filename = `${nomeBase}-${ano}-${String(mes).padStart(2, "0")}.${ext}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const detalhadoMutation = useMutation({
    mutationFn: () => downloadRelatorioPontoDetalhado(ano, mes, formato),
    onSuccess: (blob) => {
      applyDownload(blob, "ponto-detalhado", formato, ano, mes);
      toast({ title: "Download iniciado", description: "Relatório detalhado" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: err.response?.data?.message ?? "Tente novamente.",
      });
    },
  });

  const resumoMutation = useMutation({
    mutationFn: () => downloadRelatorioPontoResumo(ano, mes, formato),
    onSuccess: (blob) => {
      applyDownload(blob, "ponto-resumo", formato, ano, mes);
      toast({ title: "Download iniciado", description: "Relatório resumo" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: err.response?.data?.message ?? "Tente novamente.",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Gere relatórios de ponto detalhado e resumo por ano e mês, em PDF ou Excel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Parâmetros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Ano</Label>
              <Select
                value={String(ano)}
                onValueChange={(v) => setAno(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Mês</Label>
              <Select
                value={String(mes)}
                onValueChange={(v) => setMes(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-muted-foreground">Selecione o formato (PDF, Excel)</Label>
              <Select
                value={formato}
                onValueChange={(v) => setFormato(v as FormatoRelatorio)}
              >
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 h-9"
              onClick={() => resumoMutation.mutate()}
              disabled={resumoMutation.isPending}
            >
              <Download className="h-4 w-4" />
              {resumoMutation.isPending ? "Gerando..." : "Download ponto resumo"}
            </Button>
            <Button
              size="sm"
              className="gap-2 h-9"
              onClick={() => detalhadoMutation.mutate()}
              disabled={detalhadoMutation.isPending}
            >
              <Download className="h-4 w-4" />
              {detalhadoMutation.isPending ? "Gerando..." : "Download ponto detalhado"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
