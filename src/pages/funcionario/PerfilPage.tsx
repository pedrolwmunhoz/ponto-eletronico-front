import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getPerfilFuncionario } from "@/lib/api-funcionario";
import { formatCpf } from "@/lib/format";
import { TIPO_CONTRATO_OPCOES } from "@/types/empresa";

export default function PerfilFuncionarioPage() {
  const { toast } = useToast();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["funcionario", "perfil"],
    queryFn: getPerfilFuncionario,
  });

  useEffect(() => {
    if (isError && error) {
      const msg = (error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar perfil.";
      toast({ variant: "destructive", title: "Erro", description: msg });
    }
  }, [isError, error, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">Seus dados cadastrais e preferências.</p>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      )}
      {isError && (
        <div className="py-8 text-center text-sm text-destructive">
          {(error as { response?: { data?: { mensagem?: string } }; message?: string })?.response?.data?.mensagem ?? (error as Error)?.message ?? "Erro ao carregar perfil."}
        </div>
      )}
      {!isLoading && !isError && data && (
        <Card className={!data ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Dados cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <p><span className="text-muted-foreground">Nome:</span> {data?.nomeCompleto ?? "—"}</p>
              <p><span className="text-muted-foreground">Username:</span> {data?.username ?? "—"}</p>
              <p><span className="text-muted-foreground">CPF:</span> {data?.cpf ? formatCpf(data.cpf) : "—"}</p>
              <p><span className="text-muted-foreground">E-mail:</span> {data?.email ?? "—"}</p>
              {data?.usuarioTelefone && (
                <p><span className="text-muted-foreground">Telefone:</span> +{data.usuarioTelefone.codigoPais} ({data.usuarioTelefone.ddd}) {data.usuarioTelefone.numero}</p>
              )}
              <p><span className="text-muted-foreground">Matrícula:</span> {data?.matricula ?? "—"}</p>
              <p><span className="text-muted-foreground">Cargo:</span> {data?.contratoFuncionario?.cargo ?? "—"}</p>
              <p><span className="text-muted-foreground">Departamento:</span> {data?.contratoFuncionario?.departamento ?? "—"}</p>
              <p><span className="text-muted-foreground">Tipo contrato:</span> {data?.contratoFuncionario ? (TIPO_CONTRATO_OPCOES.find((o) => o.id === data.contratoFuncionario!.tipoContratoId)?.descricao ?? "—") : "—"}</p>
              <p><span className="text-muted-foreground">Data admissão:</span> {data?.contratoFuncionario?.dataAdmissao ?? "—"}</p>
              <p><span className="text-muted-foreground">Entrada padrão:</span> {data?.jornadaFuncionarioConfig?.entradaPadrao ?? "—"}</p>
              <p><span className="text-muted-foreground">Saída padrão:</span> {data?.jornadaFuncionarioConfig?.saidaPadrao ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
