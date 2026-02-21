import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Settings2, Plus, Trash2, Locate, PencilLine, Check, HelpCircle, FileKey } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/useValidation";
import { validateDurationHhmm, validateDurationHhmmCargaDiaria, validateDurationHhmmIntervalo, validateDurationHhmmTolerancia, validateHorario, validateRequiredSelect, validateTimezone, validateTotalDiasVencimento } from "@/lib/validations";
import { FieldExpectedStatus } from "@/components/ui/field-with-expected";
import { cn } from "@/lib/utils";
import { configInicialEmpresa } from "@/lib/api-empresa";
import { durationToHHmm, hhmmToDuration, clampDurationHHmmTo44, clampDurationHHmmTo6, clampDurationHHmmTo12 } from "@/lib/duration";
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
  const [durationInputs, setDurationInputs] = useState<Record<string, string>>({});
  const [editTimezone, setEditTimezone] = useState(false);
  const [certificadoFile, setCertificadoFile] = useState<File | null>(null);
  const [certificadoSenha, setCertificadoSenha] = useState("");
  const refTimezone = useRef<HTMLDivElement>(null);
  const refCertInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (editTimezone && refTimezone.current && !refTimezone.current.contains(target)) setEditTimezone(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [editTimezone]);

  const getDurationDisplay = (key: string, iso: string) =>
    durationInputs[key] !== undefined ? durationInputs[key] : durationToHHmm(iso ?? "");

  const commitDuration = (key: string, jornadaKey: keyof EmpresaJornadaConfigRequest, display: string) => {
    const iso = display.trim() === "" ? "" : hhmmToDuration(display) || "";
    setJornada((p) => ({ ...p, [jornadaKey]: iso }));
    setDurationInputs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    return iso;
  };

  const mutation = useMutation({
    mutationFn: (payload: { body: EmpresaConfigInicialRequest; certificadoFile?: File | null; certificadoSenha?: string }) => {
      const { body, certificadoFile: file, certificadoSenha: senha } = payload;
      const ok = validateAll([
        ["tipoEscalaJornadaId", String(body.empresaJornadaConfig.tipoEscalaJornadaId ?? ""), (v) => validateRequiredSelect(v, "Tipo de escala jornada é obrigatório.")],
        ["cargaDiariaPadrao", durationToHHmm(body.empresaJornadaConfig.cargaHorariaDiaria ?? ""), (v) => validateDurationHhmmCargaDiaria(v)],
        ["cargaSemanalPadrao", durationToHHmm(body.empresaJornadaConfig.cargaHorariaSemanal ?? ""), (v) => validateDurationHhmm(v, true, "Carga semanal")],
        ["intervaloPadrao", durationToHHmm(body.empresaJornadaConfig.intervaloPadrao ?? ""), (v) => validateDurationHhmmIntervalo(v)],
        ["entradaPadrao", body.empresaJornadaConfig.entradaPadrao ?? "", (v) => validateHorario(v, true, "Entrada padrão")],
        ["saidaPadrao", body.empresaJornadaConfig.saidaPadrao ?? "", (v) => validateHorario(v, true, "Saída padrão")],
        ["timezone", body.empresaJornadaConfig.timezone, (v) => validateTimezone(v, true)],
        ["totalDiasVencimento", body.empresaBancoHorasConfig?.totalDiasVencimento ?? 0, validateTotalDiasVencimento],
      ]);
      if (!ok) {
        toast({ variant: "destructive", title: "Corrija os erros antes de salvar." });
        throw new Error("Validação falhou");
      }
      return configInicialEmpresa(body, file ?? null, senha ?? null);
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
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const count = isDesktop ? 3 : 1;
    const newItems: UsuarioGeofenceRequest[] = Array.from({ length: count }, (_, idx) => ({
      descricao: "",
      latitude: 0,
      longitude: 0,
      raioMetros: 100,
      ativo: idx === 0,
    }));
    setGeofences((prev) => [...prev, ...newItems]);
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
      (g) => g.ativo && g.descricao?.trim() && typeof g.latitude === "number" && typeof g.longitude === "number" && g.raioMetros >= 1
    );
    const body: EmpresaConfigInicialRequest = {
      empresaJornadaConfig: jornada,
      empresaBancoHorasConfig: banco,
      usuarioGeofence: validGeofences.length ? validGeofences : undefined,
    };
    mutation.mutate({ body, certificadoFile: certificadoFile ?? undefined, certificadoSenha: certificadoSenha || undefined });
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
                  handleChange("tipoEscalaJornadaId", v ?? "", (x) => validateRequiredSelect(x, "Tipo de escala jornada é obrigatório."));
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
              <FieldExpectedStatus fieldKey="tipoEscalaJornadaId" value={jornada.tipoEscalaJornadaId ? String(jornada.tipoEscalaJornadaId) : ""} error={getError("tipoEscalaJornadaId")} touched={getTouched("tipoEscalaJornadaId")} />
            </div>
            <div className="space-y-2">
              <Label required>Carga diária</Label>
              <Input
                value={getDurationDisplay("cargaDiaria", jornada.cargaHorariaDiaria ?? "")}
                onChange={(e) => {
                  const next = clampDurationHHmmTo12(e.target.value);
                  setDurationInputs((p) => ({ ...p, cargaDiaria: next }));
                  handleChange("cargaDiariaPadrao", next, (x) => validateDurationHhmmCargaDiaria(x));
                }}
                onBlur={() => {
                  const display = getDurationDisplay("cargaDiaria", jornada.cargaHorariaDiaria ?? "");
                  const iso = commitDuration("cargaDiaria", "cargaHorariaDiaria", display);
                  handleBlur("cargaDiariaPadrao", durationToHHmm(iso || ""), (x) => validateDurationHhmmCargaDiaria(x));
                }}
                placeholder="08:00"
                maxLength={5}
              />
              <FieldExpectedStatus fieldKey="cargaDiariaPadrao" value={getDurationDisplay("cargaDiaria", jornada.cargaHorariaDiaria ?? "")} error={getError("cargaDiariaPadrao")} touched={getTouched("cargaDiariaPadrao")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Carga semanal</Label>
              <Input
                value={getDurationDisplay("cargaSemanal", jornada.cargaHorariaSemanal ?? "")}
                onChange={(e) => {
                  const next = clampDurationHHmmTo44(e.target.value);
                  setDurationInputs((p) => ({ ...p, cargaSemanal: next }));
                  handleChange("cargaSemanalPadrao", next, (x) => validateDurationHhmm(x, true, "Carga semanal"));
                }}
                onBlur={() => {
                  const display = getDurationDisplay("cargaSemanal", jornada.cargaHorariaSemanal ?? "");
                  const iso = commitDuration("cargaSemanal", "cargaHorariaSemanal", display);
                  handleBlur("cargaSemanalPadrao", durationToHHmm(iso || ""), (x) => validateDurationHhmm(x, true, "Carga semanal"));
                }}
                placeholder="44:00"
                maxLength={5}
              />
              <FieldExpectedStatus fieldKey="cargaSemanalPadrao" value={getDurationDisplay("cargaSemanal", jornada.cargaHorariaSemanal ?? "")} error={getError("cargaSemanalPadrao")} touched={getTouched("cargaSemanalPadrao")} />
            </div>
            <div className="space-y-2">
              <Label required>Tolerância</Label>
              <Input
                value={getDurationDisplay("tolerancia", jornada.toleranciaPadrao ?? "")}
                onChange={(e) => {
                  const next = clampDurationHHmmTo6(e.target.value);
                  setDurationInputs((p) => ({ ...p, tolerancia: next }));
                  handleChange("toleranciaPadrao", next, (x) => validateDurationHhmmTolerancia(x, false));
                }}
                onBlur={() => {
                  const display = getDurationDisplay("tolerancia", jornada.toleranciaPadrao ?? "");
                  let iso = commitDuration("tolerancia", "toleranciaPadrao", display);
                  if (iso === "") {
                    setJornada((p) => ({ ...p, toleranciaPadrao: "PT0S" }));
                    iso = "PT0S";
                  }
                  handleBlur("toleranciaPadrao", durationToHHmm(iso), (x) => validateDurationHhmmTolerancia(x, false));
                }}
                placeholder="00:00"
                maxLength={5}
              />
              <FieldExpectedStatus fieldKey="toleranciaPadrao" value={getDurationDisplay("tolerancia", jornada.toleranciaPadrao ?? "")} error={getError("toleranciaPadrao")} touched={getTouched("toleranciaPadrao")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Intervalo</Label>
              <Input
                value={getDurationDisplay("intervalo", jornada.intervaloPadrao ?? "")}
                onChange={(e) => {
                  const next = clampDurationHHmmTo6(e.target.value);
                  setDurationInputs((p) => ({ ...p, intervalo: next }));
                  handleChange("intervaloPadrao", next, (x) => validateDurationHhmmIntervalo(x));
                }}
                onBlur={() => {
                  const display = getDurationDisplay("intervalo", jornada.intervaloPadrao ?? "");
                  const iso = commitDuration("intervalo", "intervaloPadrao", display);
                  handleBlur("intervaloPadrao", durationToHHmm(iso || ""), (x) => validateDurationHhmmIntervalo(x));
                }}
                placeholder="01:00"
                maxLength={5}
              />
              <FieldExpectedStatus fieldKey="intervaloPadrao" value={getDurationDisplay("intervalo", jornada.intervaloPadrao ?? "")} error={getError("intervaloPadrao")} touched={getTouched("intervaloPadrao")} />
            </div>
            <div className="space-y-2">
              <Label>Descanso entre jornadas (opcional)</Label>
              <Input
                value={getDurationDisplay("descanso", jornada.tempoDescansoEntreJornada ?? "")}
                onChange={(e) => {
                  const next = clampDurationHHmmTo44(e.target.value);
                  setDurationInputs((p) => ({ ...p, descanso: next }));
                }}
                onBlur={() => {
                  const display = getDurationDisplay("descanso", jornada.tempoDescansoEntreJornada ?? "");
                  commitDuration("descanso", "tempoDescansoEntreJornada", display);
                }}
                placeholder="11:00"
                maxLength={5}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label required>Entrada padrão</Label>
              <Input
                type="time"
                value={jornada.entradaPadrao}
                onChange={(e) => {
                  const v = e.target.value;
                  setJornada((p) => ({ ...p, entradaPadrao: v }));
                  handleChange("entradaPadrao", v, (x) => validateHorario(x, true, "Entrada padrão"));
                }}
                onBlur={() => handleBlur("entradaPadrao", jornada.entradaPadrao ?? "", (x) => validateHorario(x, true, "Entrada padrão"))}
              />
              <FieldExpectedStatus fieldKey="entradaPadrao" value={jornada.entradaPadrao ?? ""} error={getError("entradaPadrao")} touched={getTouched("entradaPadrao")} />
            </div>
            <div className="space-y-2">
              <Label required>Saída padrão</Label>
              <Input
                type="time"
                value={jornada.saidaPadrao}
                onChange={(e) => {
                  const v = e.target.value;
                  setJornada((p) => ({ ...p, saidaPadrao: v }));
                  handleChange("saidaPadrao", v, (x) => validateHorario(x, true, "Saída padrão"));
                }}
                onBlur={() => handleBlur("saidaPadrao", jornada.saidaPadrao ?? "", (x) => validateHorario(x, true, "Saída padrão"))}
              />
              <FieldExpectedStatus fieldKey="saidaPadrao" value={jornada.saidaPadrao ?? ""} error={getError("saidaPadrao")} touched={getTouched("saidaPadrao")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label required>Timezone</Label>
            <div ref={refTimezone} className="relative">
              <Input
                value={jornada.timezone}
                disabled={!editTimezone}
                onChange={(e) => {
                  const v = e.target.value;
                  setJornada((p) => ({ ...p, timezone: v }));
                  handleChange("timezone", v, (x) => validateTimezone(x, true));
                }}
                onBlur={() => {
                  handleBlur("timezone", jornada.timezone, (x) => validateTimezone(x, true));
                  setEditTimezone(false);
                }}
                placeholder="America/Sao_Paulo"
                autoComplete="off"
                className={cn("pr-12", !editTimezone && "bg-muted")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => (editTimezone ? (handleBlur("timezone", jornada.timezone, (x) => validateTimezone(x, true)), setEditTimezone(false)) : setEditTimezone(true))}
              >
                {editTimezone ? <Check className="h-4 w-4 text-green-600" /> : <PencilLine className="h-4 w-4" />}
              </Button>
            </div>
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
              max={365}
              value={banco.totalDiasVencimento || ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "" || raw === null) {
                  setBanco((p) => ({ ...p, totalDiasVencimento: 0 }));
                  handleChange("totalDiasVencimento", 0, validateTotalDiasVencimento);
                  return;
                }
                const n = Math.min(365, Math.max(0, parseInt(raw, 10) || 0));
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
          <p className="text-sm text-muted-foreground">Desativados não serão enviados para cadastro.</p>
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
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={g.ativo}
                    onCheckedChange={(c) => updateGeofence(i, "ativo", !!c)}
                  />
                  <Label className="cursor-pointer font-normal">{g.ativo ? "Ativo" : "Desativado"}</Label>
                </div>
                <div className={cn("space-y-3", !g.ativo && "opacity-60 pointer-events-none")}>
                  <div className="grid gap-2">
                    <Label required>Descrição</Label>
                    <Input
                      value={g.descricao}
                      onChange={(e) => updateGeofence(i, "descricao", e.target.value)}
                      placeholder="Ex: Sede"
                      disabled={!g.ativo}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-4">
                    <Label required>Coordenadas</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" title="Quando o navegador pedir permissão, escolha Permitir e marque Lembrar ou Sempre para não perguntar de novo." className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-0.5" aria-label="Ajuda">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[260px] z-[100]" sideOffset={8}>
                        Quando o navegador pedir permissão, escolha &quot;Permitir&quot; e marque &quot;Lembrar&quot; ou &quot;Sempre&quot; para não perguntar de novo.
                      </TooltipContent>
                    </Tooltip>
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
                        disabled={!g.ativo}
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
                        disabled={!g.ativo}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 text-sm"
                    onClick={() => puxarLocal(i)}
                    disabled={buscandoLocal === i || !g.ativo}
                  >
                    <Locate className="h-4 w-4 text-green-600 shrink-0" />
                    {buscandoLocal === i ? "Buscando..." : "Usar minha localização atual"}
                  </Button>
                  <div className="grid gap-2 max-w-[120px]">
                    <Label>Raio (m)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5000}
                      value={g.raioMetros || ""}
                      onChange={(e) => updateGeofence(i, "raioMetros", parseInt(e.target.value, 10) || 100)}
                      disabled={!g.ativo}
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileKey className="h-4 w-4" />
            Certificado A1 (opcional)
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Envie o arquivo .pfx ou .p12. A data de expiração é obtida automaticamente pelo sistema.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Arquivo do certificado</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                ref={refCertInput}
                type="file"
                accept=".pfx,.p12"
                className="max-w-xs"
                onChange={(e) => setCertificadoFile(e.target.files?.[0] ?? null)}
              />
              {certificadoFile && (
                <span className="text-sm text-muted-foreground">{certificadoFile.name}</span>
              )}
              {certificadoFile && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setCertificadoFile(null); if (refCertInput.current) refCertInput.current.value = ""; }}>
                  Remover
                </Button>
              )}
            </div>
          </div>
          {certificadoFile && (
            <div className="space-y-2">
              <Label>Senha do certificado (obrigatória na maioria dos A1)</Label>
              <Input
                type="password"
                placeholder="Informe a senha do .pfx"
                value={certificadoSenha}
                onChange={(e) => setCertificadoSenha(e.target.value)}
                autoComplete="off"
              />
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
