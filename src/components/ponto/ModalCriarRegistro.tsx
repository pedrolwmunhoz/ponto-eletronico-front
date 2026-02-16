import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useValidation } from "@/hooks/useValidation";
import { validateData, validateHorario, validateJustificativa, getFieldExpected } from "@/lib/validations";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";

/** Valores devem ser iguais aos INSERT em doc/schema.sql (tipo_justificativa) — linha ~182 */
const TIPO_JUSTIFICATIVA_OPCOES = [
  "ATRASO_TRANSPORTE",
  "EMERGENCIA_MEDICA",
  "PROBLEMA_TECNICO",
  "ESQUECI_BATER",
  "AJUSTE_MANUAL",
  "FALHA_SISTEMA",
  "REGISTRO_DUPLICADO",
  "REGISTRO_ERRADO",
  "OUTROS",
] as const;

export type ModalCriarRegistroVariant = "empresa" | "funcionario";

export interface ModalCriarRegistroProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    horario: string;
    justificativa: string;
    observacao?: string | null;
  }) => void;
  isLoading: boolean;
  variant: ModalCriarRegistroVariant;
  /** Data inicial (yyyy-MM-dd) para preencher no modo empresa */
  dataInicial?: string;
  /** Ex.: "Funcionário: João" */
  subtitulo?: string;
}

export function ModalCriarRegistro({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  variant,
  dataInicial,
  subtitulo,
}: ModalCriarRegistroProps) {
  const hoje = new Date();
  const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const timeHoje = `${String(hoje.getHours()).padStart(2, "0")}:${String(hoje.getMinutes()).padStart(2, "0")}`;

  const [data, setData] = useState(dataInicial ?? dataHoje);
  const [time, setTime] = useState(timeHoje);
  const [justificativa, setJustificativa] = useState("");
  const [observacao, setObservacao] = useState("");
  const { getError, getTouched, handleBlur, handleChange, validateAll, clearAll } = useValidation();

  useEffect(() => {
    if (open) {
      const hoje = new Date();
      const d = dataInicial ?? `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
      const t = `${String(hoje.getHours()).padStart(2, "0")}:${String(hoje.getMinutes()).padStart(2, "0")}`;
      setData(d);
      setTime(t);
      setJustificativa("");
      setObservacao("");
      clearAll();
    }
  }, [open, dataInicial, clearAll]);

  const horario = `${data}T${time}:00`;

  const handleSubmit = () => {
    const ok = validateAll([
      ["data", data, (v) => validateData(v, true)],
      ["time", time, (v) => validateHorario(v, true)],
      ["justificativa", justificativa, (v) => validateJustificativa(v, true)],
    ]);
    if (!ok) return;
    onSubmit({
      horario,
      justificativa: justificativa.trim(),
      observacao: observacao.trim() || null,
    });
  };

  const canSubmit = !!data && !!time && !!justificativa.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar registro de ponto</DialogTitle>
          {subtitulo && (
            <p className="text-sm text-muted-foreground">{subtitulo}</p>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Data e Horário — iguais nos dois modos */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label required>Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => { setData(e.target.value); handleChange("data", e.target.value, (v) => validateData(v, true)); }}
                onBlur={() => handleBlur("data", data, (v) => validateData(v, true))}
                aria-invalid={!!getError("data")}
              />
              <FieldExpectedStatus fieldKey="data" value={data} error={getError("data")} touched={getTouched("data")} />
            </div>
            <div className="space-y-2">
              <Label required>Horário (HH:MM)</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => { setTime(e.target.value); handleChange("time", e.target.value, (v) => validateHorario(v, true)); }}
                onBlur={() => handleBlur("time", time, (v) => validateHorario(v, true))}
                aria-invalid={!!getError("time")}
              />
              <FieldExpectedStatus fieldKey="time" value={time} error={getError("time")} touched={getTouched("time")} />
            </div>
          </div>

          {variant === "empresa" ? (
            <>
              <div className="space-y-2">
                <Label required>Motivo</Label>
                <Select
                  value={justificativa || ""}
                  onValueChange={(v) => { setJustificativa(v); handleChange("justificativa", v, (x) => validateJustificativa(x, true)); }}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!getError("justificativa")}>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_JUSTIFICATIVA_OPCOES.map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {valor
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldExpectedStatus fieldKey="justificativa" value={justificativa} error={getError("justificativa")} touched={getTouched("justificativa")} />
              </div>
              <div className="space-y-2">
                <Label>Observação (opcional)</Label>
                <Textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observações"
                  rows={2}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label required>Motivo</Label>
                <Select
                  value={justificativa || ""}
                  onValueChange={(v) => { setJustificativa(v); handleChange("justificativa", v, (x) => validateJustificativa(x, true)); }}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!getError("justificativa")}>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_JUSTIFICATIVA_OPCOES.map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {valor
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldExpectedStatus fieldKey="justificativa" value={justificativa} error={getError("justificativa")} touched={getTouched("justificativa")} />
              </div>
              <div className="space-y-2">
                <Label>Observação (opcional)</Label>
                <Textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observações"
                  rows={2}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? "Enviando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
