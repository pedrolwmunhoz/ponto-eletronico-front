import { jsPDF } from "jspdf";
import { Plus, Trash2, Pencil, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PontoDiaResponse } from "@/types/empresa";

function formatData(horario: string): string {
  try {
    return new Date(horario).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatHorario(horario: string): string {
  try {
    return new Date(horario).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return horario;
  }
}

export type ModalDetalharJornadaModo = "empresa" | "funcionario";

export interface ModalDetalharJornadaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jornada: PontoDiaResponse | null;
  modo: ModalDetalharJornadaModo;
  onRemover: (registroId: string) => void;
  onAdicionarRegistro: () => void;
  onEditar?: (registroId: string) => void;
}

export function ModalDetalharJornada({
  open,
  onOpenChange,
  jornada,
  modo,
  onRemover,
  onAdicionarRegistro,
  onEditar,
}: ModalDetalharJornadaProps) {
  const handleGerarPdf = () => {
    if (!jornada) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageW = doc.getPageWidth();
    let y = margin;

    const dataEmissao = new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Cabeçalho (azul PontoSeg #2563eb + ícone relógio + texto branco)
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 36, "F");
    // Ícone de relógio (círculo + ponteiros) à esquerda do título
    const iconX = pageW / 2 - 28;
    const iconY = 14;
    const iconR = 5;
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.circle(iconX, iconY, iconR, "S");
    doc.line(iconX, iconY, iconX + 1.2, iconY - 2.2);   // ponteiro hora (12h30)
    doc.line(iconX, iconY, iconX + 0.6, iconY + 2.8);  // ponteiro minuto (6h)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PontoSeg", pageW / 2, 14, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Comprovante de Ponto", pageW / 2, 24, { align: "center" });
    doc.setFontSize(9);
    doc.text("Registro de jornada de trabalho", pageW / 2, 30, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y = 48;

    // Resumo
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Data:", margin, y);
    doc.setTextColor(0, 0, 0);
    doc.text(jornada.data ?? "—", margin + 28, y);
    y += 6;
    doc.setTextColor(100, 100, 100);
    doc.text("Dia:", margin, y);
    doc.setTextColor(0, 0, 0);
    doc.text(jornada.diaSemana ?? "—", margin + 28, y);
    y += 6;
    doc.setTextColor(100, 100, 100);
    doc.text("Total:", margin, y);
    doc.setTextColor(0, 0, 0);
    doc.text(jornada.totalHoras ?? "—", margin + 28, y);
    y += 6;
    doc.setTextColor(100, 100, 100);
    doc.text("Status:", margin, y);
    doc.setTextColor(0, 0, 0);
    doc.text(jornada.status ?? "—", margin + 28, y);
    y += 12;

    // Tabela de batidas
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    if (jornada.marcacoes && jornada.marcacoes.length > 0) {
      const colW = [(pageW - 2 * margin) * 0.08, (pageW - 2 * margin) * 0.22, (pageW - 2 * margin) * 0.35, (pageW - 2 * margin) * 0.35];
      const rowH = 8;
      doc.setFillColor(245, 245, 244);
      doc.rect(margin, y, pageW - 2 * margin, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("#", margin + 2, y + 5.5);
      doc.text("Data", margin + colW[0] + 2, y + 5.5);
      doc.text("Hora", margin + colW[0] + colW[1] + 2, y + 5.5);
      doc.text("Tipo", margin + colW[0] + colW[1] + colW[2] + 2, y + 5.5);
      y += rowH;
      doc.setFont("helvetica", "normal");
      for (let i = 0; i < jornada.marcacoes.length; i++) {
        if (y > 260) {
          doc.addPage();
          y = margin;
        }
        const m = jornada.marcacoes[i];
        doc.rect(margin, y, pageW - 2 * margin, rowH, "S");
        doc.text(String(i + 1), margin + 2, y + 5.5);
        doc.text(formatData(m.horario), margin + colW[0] + 2, y + 5.5);
        doc.text(formatHorario(m.horario), margin + colW[0] + colW[1] + 2, y + 5.5);
        doc.text(m.tipo ?? "—", margin + colW[0] + colW[1] + colW[2] + 2, y + 5.5);
        y += rowH;
      }
      y += 10;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("Nenhuma batida nesta jornada.", margin, y + 5);
      doc.setTextColor(0, 0, 0);
      y += 16;
    }

    // Rodapé
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Documento emitido em ${dataEmissao} — Comprovante sem valor jurídico, apenas informativo.`,
      pageW / 2,
      y,
      { align: "center" }
    );

    const nomeArquivo = `comprovante-ponto-${(jornada.data ?? "jornada").replace(/\//g, "-")}.pdf`;
    doc.save(nomeArquivo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Jornada — {jornada?.data} ({jornada?.diaSemana})
          </DialogTitle>
          <DialogDescription>
            Total: {jornada?.totalHoras} · Status: {jornada?.status}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="text-sm font-medium">Batidas</h4>
              <Button
                size="sm"
                onClick={onAdicionarRegistro}
                className="gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> {modo === "empresa" ? "Novo Registro" : "Adicionar registro"}
              </Button>
            </div>
            {jornada?.marcacoes && jornada.marcacoes.length > 0 ? (
              <ul className="divide-y rounded border">
                {jornada.marcacoes.map((m) => (
                  <li
                    key={m.registroId}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="text-sm">
                      <span className="text-muted-foreground">{formatData(m.horario)}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="font-mono">{formatHorario(m.horario)}</span>
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {m.tipo ?? "—"}
                    </span>
                    <div className="flex items-center gap-1">
                      {modo === "empresa" && onEditar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-stone-600 hover:text-stone-800"
                          onClick={() => onEditar(m.registroId)}
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={
                          modo === "funcionario"
                            ? "text-destructive hover:text-destructive"
                            : "text-red-600 hover:text-red-800 hover:bg-red-50"
                        }
                        onClick={() => onRemover(m.registroId)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {modo === "funcionario" ? "Solicitar remoção" : "Excluir"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma batida nesta jornada.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleGerarPdf} className="gap-2">
            <FileDown className="h-4 w-4 text-blue-600" />
            Gerar PDF
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
