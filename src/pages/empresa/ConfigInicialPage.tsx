import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Settings2, Plus, Trash2, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import { validateDurationHhmm, validateTimezone, validateTotalDiasVencimento } from "@/lib/validations";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";
import { configInicialEmpresa } from "@/lib/api-empresa";
import { durationToHHmm, hhmmToDuration } from "@/lib/duration";
import type {
  EmpresaConfigInicialRequest,
  EmpresaJornadaConfigRequest,
  EmpresaBancoHorasConfigRequest,
  UsuarioGeofenceRequest,
} from "@/types/empresa";
import { TIPO_ESCALA_JORNADA_OPCOES } from "@/types/empresa";

/** Valores padrão por escala: carga diária, carga semanal, descanso entre jornadas (ISO-8601). */
const ESCALA_DEFAULTS: Record<number, { cargaHorariaDiaria: string; cargaHorariaSemanal: string; tempoDescansoEntreJornada: string }> = {
  1: { cargaHorariaDiaria: "PT8H", cargaHorariaSemanal: "PT44H", tempoDescansoEntreJornada: "PT11H" },   // 5x2
  2: { cargaHorariaDiaria: "PT7H20M", cargaHorariaSemanal: "PT44H", tempoDescansoEntreJornada: "PT11H" }, // 6x1
  3: { cargaHorariaDiaria: "PT12H", cargaHorariaSemanal: "PT36H", tempoDescansoEntreJornada: "PT36H" },  // 12x36
};

const defaultJornada: EmpresaJornadaConfigRequest = {
  tipoEscalaJornadaId: 1,
  cargaHorariaDiaria: "PT8H",
  cargaHorariaSemanal: "PT44H",
  toleranciaPadrao: "PT0S",
  intervaloPadrao: "PT1H",
  tempoDescansoEntreJornada: "PT11H",
  entradaPadrao: "08:00",
  saidaPadrao: "17:00",
  timezone: "America/Sao_Paulo",
  gravaGeoObrigatoria: false,
  gravaPontoApenasEmGeofence: false,
  permiteAjustePonto: false,
};

const defaultBanco: EmpresaBancoHorasConfigRequest = {
  ativo: true,
  totalDiasVencimento: 90,
};

export default function ConfigInicialPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { getError, getTouched, handleBlur, handleChange, validateAll } = useValidation();
  const [jornada, setJornada] = useState<EmpresaJornadaConfigRequest>(defaultJornada);
  const [banco, setBanco] = useState<EmpresaBancoHorasConfigRequest>(defaultBanco);
  const [geofences, setGeofences] = useState<UsuarioGeofenceRequest[]>([]);
  const [buscandoLocal, setBuscandoLocal] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (body: EmpresaConfigInicialRequest) => {
      const ok = validateAll([
        ["cargaDiariaPadrao", durationToHHmm(body.empresaJornadaConfig.cargaHorariaDiaria ?? ""), (v) => validateDurationHhmm(v, true)],
        ["cargaSemanalPadrao", durationToHHmm(body.empresaJornadaConfig.cargaHorariaSemanal ?? ""), (v) => validateDurationHhmm(v, true)],
        ["intervaloPadrao", durationToHHmm(body.empresaJornadaConfig.intervaloPadrao ?? ""), (v) => validateDurationHhmm(v, true)],
        ["timezone", body.empresaJornadaConfig.timezone, (v) => validateTimezone(v, true)],
        ["totalDiasVencimento", body.empresaBancoHorasConfig?.totalDiasVencimento ?? 0, validateTotalDiasVencimento],
      ]);
      if (!ok) {
        toast({ variant: "destructive", title: "Corrija os erros antes de salvar." });
        throw new Error("Validação falhou");
      }
      return configInicialEmpresa(body);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["empresa", "config-inicial-status"] });
      toast({ title: "Configuração inicial salva", description: "Sua empresa está configurada." });
      navigate("/empresa", { replace: true });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.response?.data?.mensagem ?? "Não foi possível salvar a configuração.",
      });
    },
  });

  const addGeofence = () => {
    setGeofences((prev) => [
      ...prev,
      { descricao: "", latitude: 0, longitude: 0, raioMetros: 100, ativo: true },
    ]);
  };

  const updateGeofence = (index: number, field: keyof UsuarioGeofenceRequest, value: unknown) => {
    setGeofences((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeGeofence = (index: number) => {
    setGeofences((prev) => prev.filter((_, i) => i !== index));
  };

  const puxarLocal = (index: number) => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocalização não disponível." });
      return;
    }
    setBuscandoLocal(index);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateGeofence(index, "latitude", pos.coords.latitude);
        updateGeofence(index, "longitude", pos.coords.longitude);
        setBuscandoLocal(null);
        toast({ title: "Local preenchido" });
      },
      () => {
        setBuscandoLocal(null);
        toast({ variant: "destructive", title: "Não foi possível obter o local." });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = () => {
    if (!jornada.tipoEscalaJornadaId || !jornada.cargaHorariaDiaria || !jornada.cargaHorariaSemanal || !jornada.entradaPadrao || !jornada.saidaPadrao || !jornada.intervaloPadrao) {
      toast({ variant: "destructive", title: "Preencha jornada (tipo, cargas, entrada, saída, intervalo)." });
      return;
    }
    const validGeofences = geofences.filter(
      (g) => g.descricao?.trim() && typeof g.latitude === "number" && typeof g.longitude === "number" && g.raioMetros >= 1
    );
    const body: EmpresaConfigInicialRequest = {
      empresaJornadaConfig: jornada,
      empresaBancoHorasConfig: banco,
      usuarioGeofence: validGeofences.length ? validGeofences : undefined,
    };
    mutation.mutate(body);
  };

  return (
    <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings2 className="h-7 w-7" />
          Configuração inicial
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Defina a jornada padrão da empresa, configure o banco de horas e, se quiser, as áreas permitidas para registro de ponto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Jornada padrão
            <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-blue-100 text-blue-800">Obrigatório</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Configuração de jornada padrão da empresa aplicada sobre todos os funcionários.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Tipo de escala jornada</Label>
              <Select
                value={jornada.tipoEscalaJornadaId ? String(jornada.tipoEscalaJornadaId) : ""}
                onValueChange={(v) => {
                  const id = v ? parseInt(v, 10) : 0;
                  const defaults = id ? ESCALA_DEFAULTS[id] : null;
                  setJornada((p) => ({
                    ...p,
                    tipoEscalaJornadaId: id,
                    ...(defaults && {
                      cargaHorariaDiaria: defaults.cargaHorariaDiaria,
                      cargaHorariaSemanal: defaults.cargaHorariaSemanal,
                      tempoDescansoEntreJornada: defaults.tempoDescansoEntreJornada,
                    }),
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escala" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_ESCALA_JORNADA_OPCOES.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Carga diária</Label>
              <Input
                value={durationToHHmm(jornada.cargaHorariaDiaria ?? "")}
                onChange={(e) => {
                  const v = hhmmToDuration(e.target.value);
                  setJornada((p) => ({ ...p, cargaHorariaDiaria: v }));
                  handleChange("cargaDiariaPadrao", durationToHHmm(v ?? ""), (x) => validateDurationHhmm(x, true));
                }}
                onBlur={() => handleBlur("cargaDiariaPadrao", durationToHHmm(jornada.cargaHorariaDiaria ?? ""), (x) => validateDurationHhmm(x, true))}
                placeholder="08:00"
              />
              <FieldExpectedStatus fieldKey="cargaDiariaPadrao" value={durationToHHmm(jornada.cargaHorariaDiaria ?? "")} error={getError("cargaDiariaPadrao")} touched={getTouched("cargaDiariaPadrao")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Carga semanal</Label>
              <Input
                value={durationToHHmm(jornada.cargaHorariaSemanal ?? "")}
                onChange={(e) => {
                  const v = hhmmToDuration(e.target.value);
                  setJornada((p) => ({ ...p, cargaHorariaSemanal: v }));
                  handleChange("cargaSemanalPadrao", durationToHHmm(v ?? ""), (x) => validateDurationHhmm(x, true));
                }}
                onBlur={() => handleBlur("cargaSemanalPadrao", durationToHHmm(jornada.cargaHorariaSemanal ?? ""), (x) => validateDurationHhmm(x, true))}
                placeholder="44:00"
              />
              <FieldExpectedStatus fieldKey="cargaSemanalPadrao" value={durationToHHmm(jornada.cargaHorariaSemanal ?? "")} error={getError("cargaSemanalPadrao")} touched={getTouched("cargaSemanalPadrao")} />
            </div>
            <div className="space-y-2">
              <Label>Tolerância</Label>
              <Input
                value={durationToHHmm(jornada.toleranciaPadrao ?? "PT0S")}
                onChange={(e) => {
                  const v = hhmmToDuration(e.target.value) || "PT0S";
                  setJornada((p) => ({ ...p, toleranciaPadrao: v }));
                  handleChange("toleranciaPadrao", durationToHHmm(v), (x) => validateDurationHhmm(x, false));
                }}
                onBlur={() => handleBlur("toleranciaPadrao", durationToHHmm(jornada.toleranciaPadrao ?? "PT0S"), (x) => validateDurationHhmm(x, false))}
                placeholder="00:00"
              />
              <FieldExpectedStatus fieldKey="toleranciaPadrao" value={durationToHHmm(jornada.toleranciaPadrao ?? "PT0S")} error={getError("toleranciaPadrao")} touched={getTouched("toleranciaPadrao")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Intervalo</Label>
              <Input
                value={durationToHHmm(jornada.intervaloPadrao ?? "")}
                onChange={(e) => {
                  const v = hhmmToDuration(e.target.value);
                  setJornada((p) => ({ ...p, intervaloPadrao: v }));
                  handleChange("intervaloPadrao", durationToHHmm(v ?? ""), (x) => validateDurationHhmm(x, true));
                }}
                onBlur={() => handleBlur("intervaloPadrao", durationToHHmm(jornada.intervaloPadrao ?? ""), (x) => validateDurationHhmm(x, true))}
                placeholder="01:00"
              />
              <FieldExpectedStatus fieldKey="intervaloPadrao" value={durationToHHmm(jornada.intervaloPadrao ?? "")} error={getError("intervaloPadrao")} touched={getTouched("intervaloPadrao")} />
            </div>
            <div className="space-y-2">
              <Label>Descanso entre jornadas</Label>
              <Input
                value={durationToHHmm(jornada.tempoDescansoEntreJornada ?? "")}
                onChange={(e) => setJornada((p) => ({ ...p, tempoDescansoEntreJornada: hhmmToDuration(e.target.value) }))}
                placeholder="11:00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Entrada padrão</Label>
              <Input
                type="time"
                value={jornada.entradaPadrao}
                onChange={(e) => setJornada((p) => ({ ...p, entradaPadrao: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label required>Saída padrão</Label>
              <Input
                type="time"
                value={jornada.saidaPadrao}
                onChange={(e) => setJornada((p) => ({ ...p, saidaPadrao: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={jornada.timezone}
              onChange={(e) => {
                setJornada((p) => ({ ...p, timezone: e.target.value }));
                handleChange("timezone", e.target.value, (x) => validateTimezone(x, true));
              }}
              onBlur={() => handleBlur("timezone", jornada.timezone, (x) => validateTimezone(x, true))}
              placeholder="America/Sao_Paulo"
            />
            <FieldExpectedStatus fieldKey="timezone" value={jornada.timezone} error={getError("timezone")} touched={getTouched("timezone")} />
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">Marque as opções desejadas para o registro de ponto:</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="grava-geo"
                checked={jornada.gravaGeoObrigatoria}
                onCheckedChange={(c) => setJornada((p) => ({ ...p, gravaGeoObrigatoria: !!c }))}
              />
              <Label htmlFor="grava-geo" className="font-normal cursor-pointer">Gravar localização quando funcionário bater ponto</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="grava-geofence"
                checked={jornada.gravaPontoApenasEmGeofence}
                onCheckedChange={(c) => setJornada((p) => ({ ...p, gravaPontoApenasEmGeofence: !!c }))}
              />
              <Label htmlFor="grava-geofence" className="font-normal cursor-pointer">Bater ponto somente dentro das áreas cadastradas (ex.: sede, filial)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="permite-ajuste"
                checked={jornada.permiteAjustePonto}
                onCheckedChange={(c) => setJornada((p) => ({ ...p, permiteAjustePonto: !!c }))}
              />
              <Label htmlFor="permite-ajuste" className="font-normal cursor-pointer">Permite funcionário ajustar ponto manualmente</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Banco de horas
            <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-amber-100 text-amber-800">Opcional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="banco-ativo"
              checked={banco.ativo}
              onCheckedChange={(c) => setBanco((p) => ({ ...p, ativo: !!c }))}
            />
            <Label htmlFor="banco-ativo">Ativo</Label>
          </div>
          <div className="space-y-2 max-w-xs">
            <Label required>Total dias para vencimento</Label>
            <Input
              type="number"
              min={1}
              value={banco.totalDiasVencimento || ""}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10) || 0;
                setBanco((p) => ({ ...p, totalDiasVencimento: n }));
                handleChange("totalDiasVencimento", n, validateTotalDiasVencimento);
              }}
              onBlur={() => handleBlur("totalDiasVencimento", banco.totalDiasVencimento ?? 0, validateTotalDiasVencimento)}
              placeholder="365"
            />
            <FieldExpectedStatus fieldKey="totalDiasVencimento" value={String(banco.totalDiasVencimento ?? "")} error={getError("totalDiasVencimento")} touched={getTouched("totalDiasVencimento")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Áreas de ponto
            <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-amber-100 text-amber-800">Opcional</Badge>
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addGeofence} className="gap-1">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {geofences.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma área cadastrada. Adicione locais onde o ponto pode ser registrado (ex.: sede, filial).</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {geofences.map((g, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Área {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeGeofence(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Input
                    value={g.descricao}
                    onChange={(e) => updateGeofence(i, "descricao", e.target.value)}
                    placeholder="Ex: Sede"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={g.ativo}
                    onCheckedChange={(c) => updateGeofence(i, "ativo", !!c)}
                  />
                  <Label>Ativo</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      value={g.latitude || ""}
                      onChange={(e) => updateGeofence(i, "latitude", parseFloat(e.target.value) || 0)}
                      placeholder="-23.5505"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      value={g.longitude || ""}
                      onChange={(e) => updateGeofence(i, "longitude", parseFloat(e.target.value) || 0)}
                      placeholder="-46.6333"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 text-base"
                  onClick={() => puxarLocal(i)}
                  disabled={buscandoLocal === i}
                >
                  <Locate className="h-4 w-4 text-green-600 shrink-0" />
                  {buscandoLocal === i ? "Buscando..." : "Usar minha localização atual"}
                </Button>
                <p className="text-xs text-muted-foreground">Quando o navegador pedir permissão, escolha &quot;Permitir&quot; e marque &quot;Lembrar&quot; ou &quot;Sempre&quot; para não perguntar de novo.</p>
                <div className="grid gap-2 max-w-[120px]">
                  <Label>Raio (m)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5000}
                    value={g.raioMetros || ""}
                    onChange={(e) => updateGeofence(i, "raioMetros", parseInt(e.target.value, 10) || 100)}
                  />
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="mb-[5.5rem]" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar configuração inicial"}
        </Button>
      </div>
    </div>
  );
}
