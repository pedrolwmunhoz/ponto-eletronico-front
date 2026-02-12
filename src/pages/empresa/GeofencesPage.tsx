import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { listarGeofences, criarGeofence, listarFuncionarios } from "@/lib/api-empresa";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function formatInstant(s: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("pt-BR");
  } catch {
    return s;
  }
}

export default function GeofencesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [raioMetros, setRaioMetros] = useState("100");
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [funcionarioIds, setFuncionarioIds] = useState<string[]>([]);
  const [acessoParcialAtivo, setAcessoParcialAtivo] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["empresa", "geofences", page, pageSize],
    queryFn: () => listarGeofences({ page, size: pageSize }),
  });

  const { data: funcionariosData } = useQuery({
    queryKey: ["empresa", "funcionarios", 0, 500],
    queryFn: () => listarFuncionarios({ page: 0, pageSize: 500 }),
    enabled: open,
  });

  const criarMutation = useMutation({
    mutationFn: criarGeofence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", "geofences"] });
      setOpen(false);
      setNome("");
      setDescricao("");
      setLatitude("");
      setLongitude("");
      setRaioMetros("100");
      setFuncionarioIds([]);
      setAcessoParcialAtivo(false);
      toast({ title: "Área de ponto criada" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar",
        description: err.response?.data?.message ?? "Tente novamente.",
      });
    },
  });

  const puxarLocalAtual = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocalização não disponível neste navegador." });
      return;
    }
    setBuscandoLocal(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setBuscandoLocal(false);
        toast({ title: "Local atual preenchido", description: "Latitude e longitude atualizados." });
      },
      (err) => {
        setBuscandoLocal(false);
        const msg =
          err.code === 1
            ? "Permissão de localização negada."
            : err.code === 2
              ? "Posição indisponível."
              : "Timeout ao obter localização.";
        toast({ variant: "destructive", title: "Não foi possível obter o local", description: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const toggleFuncionario = (usuarioId: string) => {
    setFuncionarioIds((prev) =>
      prev.includes(usuarioId) ? prev.filter((id) => id !== usuarioId) : [...prev, usuarioId]
    );
  };

  const handleSubmit = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const raio = parseInt(raioMetros, 10);
    if (!nome.trim() || !descricao.trim() || isNaN(lat) || isNaN(lng) || isNaN(raio) || raio < 1) {
      toast({ variant: "destructive", title: "Preencha nome, descrição, latitude, longitude e raio (número)." });
      return;
    }
    criarMutation.mutate({
      nome: nome.trim(),
      descricao: descricao.trim(),
      latitude: lat,
      longitude: lng,
      raioMetros: raio,
      ...(funcionarioIds.length > 0 ? { funcionarioIds } : {}),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Áreas de ponto</h1>
          <p className="text-sm text-muted-foreground">
            Áreas permitidas para registro de ponto. Cadastre endereços e defina quem pode bater ponto em cada um.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setAcessoParcialAtivo(false);
              setFuncionarioIds([]);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova área de ponto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova área de ponto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-end justify-between gap-2">
                  <Label className="shrink-0">Coordenadas *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={puxarLocalAtual}
                    disabled={buscandoLocal}
                  >
                    <Locate className="h-4 w-4 text-green-600" />
                    {buscandoLocal ? "Obtendo..." : "Puxar local atual"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Quando o navegador pedir permissão, escolha &quot;Permitir&quot; e marque &quot;Lembrar&quot; ou &quot;Sempre&quot; para não perguntar de novo.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="-23.5505"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="-46.6333"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="raioMetros">Raio (metros) *</Label>
                <Input
                  id="raioMetros"
                  type="number"
                  min={1}
                  value={raioMetros}
                  onChange={(e) => setRaioMetros(e.target.value)}
                />
              </div>
              <div className="grid gap-2 mt-8">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      acessoParcialAtivo ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {acessoParcialAtivo ? "Parcial" : "Todos"}
                  </span>
                  <Label>Funcionários</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {acessoParcialAtivo
                    ? "Clique na linha para marcar quais funcionários têm acesso. Deixe vazio = todos."
                    : "Ao ativar, somente alguns funcionários terão acesso a essa geolocalização, ou deixe desativado para selecionar empresa inteira."}
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="acesso-parcial"
                    checked={acessoParcialAtivo}
                    onCheckedChange={(checked) => {
                      setAcessoParcialAtivo(!!checked);
                      if (!checked) setFuncionarioIds([]);
                    }}
                  />
                  <label htmlFor="acesso-parcial" className="text-sm font-medium cursor-pointer select-none">
                    Ativar parcial
                  </label>
                </div>
                <div
                  className={`max-h-40 overflow-y-auto rounded-md border border-border p-3 space-y-2 transition-opacity ${
                    acessoParcialAtivo ? "" : "opacity-50 pointer-events-none"
                  }`}
                >
                  {!funcionariosData?.conteudo?.length ? (
                    <p className="text-sm text-muted-foreground">Nenhum funcionário cadastrado.</p>
                  ) : (
                    funcionariosData.conteudo.map((f) => {
                        const isChecked = funcionarioIds.includes(f.usuarioId);
                        const toggle = () => toggleFuncionario(f.usuarioId);
                        return (
                          <div
                            key={f.usuarioId}
                            onClick={toggle}
                            className="flex items-center gap-2 cursor-pointer select-none rounded py-1.5 px-2 hover:bg-muted/50"
                          >
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={isChecked} onCheckedChange={toggle} />
                            </div>
                            <span className="text-sm">
                              {f.username}
                              {f.emails?.[0] ? ` (${f.emails[0]})` : ""}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={criarMutation.isPending}>
                {criarMutation.isPending ? "Salvando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            Listagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
          )}
          {isError && (
            <div className="py-8 text-center text-sm text-destructive">
              {(error as Error)?.message ?? "Erro ao carregar."}
            </div>
          )}
          {!isLoading && !isError && data && (
            <>
            <div className="space-y-3">
              {data.conteudo.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Nenhuma área de ponto cadastrada.
                </div>
              ) : (
                data.conteudo.map((g, idx) => (
                  <div
                    key={idx}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground uppercase">{g.nome}</h4>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            g.ativo ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {g.ativo ? "Ativo" : "Inativo"}
                        </span>
                        {g.acessoParcial && (g.quantidadeFuncionariosAcesso ?? 0) > 0 ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                            Parcial ({g.quantidadeFuncionariosAcesso} funcionário{(g.quantidadeFuncionariosAcesso ?? 0) !== 1 ? "s" : ""})
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Todos os Funcionários
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Coordenadas</p>
                          <p className="font-mono text-foreground">{g.coordenadas}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Raio</p>
                          <p className="text-foreground">{g.raio} metros</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                      <p>Criado em: {formatInstant(g.createdAt)}</p>
                      <p>Atualizado em: {formatInstant(g.updatedAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {data.paginacao && data.conteudo.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Página {data.paginacao.paginaAtual + 1} de {data.paginacao.totalPaginas}
                  {` • ${data.paginacao.totalElementos} registro(s)`}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (data.paginacao.paginaAtual > 0) setPage(data.paginacao.paginaAtual - 1);
                        }}
                        className={data.paginacao.paginaAtual === 0 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {(() => {
                      const maxBtns = 5;
                      const totalPaginas = data.paginacao.totalPaginas;
                      const paginaAtual = data.paginacao.paginaAtual;
                      const start = Math.max(0, Math.min(paginaAtual - Math.floor(maxBtns / 2), totalPaginas - maxBtns));
                      const end = Math.min(totalPaginas - 1, start + maxBtns - 1);
                      return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(p);
                            }}
                            isActive={p === paginaAtual}
                          >
                            {p + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ));
                    })()}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (data.paginacao.paginaAtual < data.paginacao.totalPaginas - 1) setPage(data.paginacao.paginaAtual + 1);
                        }}
                        className={data.paginacao.paginaAtual >= data.paginacao.totalPaginas - 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
