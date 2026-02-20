import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Eye, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  listarMeuPonto,
  registrarPontoManual,
  deletarRegistroFuncionario,
} from "@/lib/api-funcionario";
import { tokenStorage } from "@/lib/token-storage";
import type { PontoDiaResponse } from "@/types/empresa";
import { ModalDetalharJornada } from "@/components/ponto/ModalDetalharJornada";
import ModalCriarRegistro from "@/components/ponto/ModalCriarRegistro";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function CalendarioPontoPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const userId = tokenStorage.getUserId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /** Só guardamos a chave da jornada; o conteúdo vem sempre dos dados atuais da query (evita modal com snapshot antigo após create/delete). */
  const [modalJornadaKey, setModalJornadaKey] = useState<{ data: string; jornada: string } | null>(null);
  const [criarRegistroOpen, setCriarRegistroOpen] = useState(false);
  const [criarRegistroDataInicial, setCriarRegistroDataInicial] = useState<string | undefined>(undefined);
  const [removerRegistroId, setRemoverRegistroId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["funcionario", "ponto", userId, ano, mes],
    queryFn: () => listarMeuPonto(userId!, ano, mes),
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  const items = (isError ? [] : (data ?? [])) as PontoDiaResponse[];
  const jornadaForModal = modalJornadaKey
    ? items.find((j) => j.data === modalJornadaKey.data && j.jornada === modalJornadaKey.jornada) ?? null
    : null;

  useEffect(() => {
    if (isError && error) {
      const msg = (error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar ponto.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (modalJornadaKey && !jornadaForModal && items.length > 0) {
      setModalJornadaKey(null);
    }
  }, [modalJornadaKey, jornadaForModal, items.length]);

  const registrarManualMutation = useMutation({
    mutationFn: ({ idempotencyKey, horario, justificativa, observacao }: { idempotencyKey: string; horario: string; justificativa: string; observacao?: string | null }) =>
      registrarPontoManual(idempotencyKey, { horario, justificativa, observacao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionario", "ponto"] });
      setCriarRegistroOpen(false);
      setCriarRegistroDataInicial(undefined);
      toast({ title: "Solicitação enviada", description: "Registro manual solicitado. Aguarde aprovação ou confirmação." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro", description: err.response?.data?.mensagem ?? "Tente novamente." });
    },
  });

  const deletarMutation = useMutation({
    mutationFn: (idRegistro: string) => deletarRegistroFuncionario(idRegistro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionario", "ponto"] });
      setRemoverRegistroId(null);
      toast({ title: "Solicitação enviada", description: "Remoção do registro solicitada ou realizada." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro", description: err.response?.data?.mensagem ?? "Tente novamente." });
    },
  });

  const mudarMes = (delta: number) => {
    let n = mes + delta;
    let a = ano;
    if (n > 12) { n = 1; a++; }
    if (n < 1) { n = 12; a--; }
    setMes(n);
    setAno(a);
  };

  const handleAbrirModal = (jornada: PontoDiaResponse) => {
    setModalJornadaKey({ data: jornada.data, jornada: jornada.jornada });
    setCriarRegistroOpen(false);
    setRemoverRegistroId(null);
  };

  const handleCriarRegistroSubmit = (data: { horario: string; justificativa: string; observacao?: string | null }) => {
    registrarManualMutation.mutate({
      idempotencyKey: crypto.randomUUID(),
      horario: data.horario,
      justificativa: data.justificativa,
      observacao: data.observacao,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Meu calendário de ponto</h1>
        <p className="text-sm text-muted-foreground">Registros de ponto do mês. Clique em Detalhar para ver batidas e solicitar ajustes.</p>
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
              <Button
                size="sm"
                className="gap-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setCriarRegistroDataInicial("");
                  setCriarRegistroOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Adicionar registro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
            )}
            {isError && (
              <div className="py-8 text-center text-sm text-destructive">
                {(error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar ponto."}
              </div>
            )}
            {!isLoading && !isError && items.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum registro neste período.</p>
            )}
            {!isLoading && items.length > 0 && (
              <div className="h-[600px] overflow-y-auto rounded-md border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jornada</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Dia</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((jornada) => (
                    <TableRow key={`${jornada.jornada}-${jornada.data}`}>
                      <TableCell className="font-medium">{jornada.jornada}</TableCell>
                      <TableCell className="text-muted-foreground">{jornada.data}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{jornada.diaSemana}</TableCell>
                      <TableCell className="text-sm">{jornada.status}</TableCell>
                      <TableCell className="text-sm">{jornada.totalHoras}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAbrirModal(jornada)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" /> Detalhar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ModalDetalharJornada
        open={!!modalJornadaKey}
        onOpenChange={(open) => { if (!open) { setModalJornadaKey(null); queryClient.invalidateQueries({ queryKey: ["funcionario", "ponto"] }); } }}
        jornada={jornadaForModal}
        modo="funcionario"
        onRemover={(registroId) => setRemoverRegistroId(registroId)}
        onAdicionarRegistro={() => {
          setCriarRegistroDataInicial(modalJornadaKey?.data);
          setCriarRegistroOpen(true);
        }}
      />

      <ModalCriarRegistro
        key={criarRegistroOpen ? "open" : "closed"}
        open={criarRegistroOpen}
        onOpenChange={(open) => {
          setCriarRegistroOpen(open);
          if (!open) {
            setCriarRegistroDataInicial(undefined);
            queryClient.invalidateQueries({ queryKey: ["funcionario", "ponto"] });
          }
        }}
        onSubmit={handleCriarRegistroSubmit}
        isLoading={registrarManualMutation.isPending}
        variant="funcionario"
        dataInicial={criarRegistroDataInicial}
      />

      {/* Confirmação remoção */}
      <AlertDialog open={!!removerRegistroId} onOpenChange={(open) => !open && setRemoverRegistroId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitar remoção do registro</AlertDialogTitle>
            <AlertDialogDescription>
              Será enviada uma solicitação para remover esta batida. Se sua empresa permitir ajuste direto, o registro será removido. Caso contrário, aguarde aprovação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removerRegistroId && deletarMutation.mutate(removerRegistroId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletarMutation.isPending ? "Enviando..." : "Solicitar remoção"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
