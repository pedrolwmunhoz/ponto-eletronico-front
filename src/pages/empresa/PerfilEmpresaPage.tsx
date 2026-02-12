import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPerfilEmpresa } from "@/lib/api-empresa";

export default function PerfilEmpresaPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["empresa", "perfil"],
    queryFn: getPerfilEmpresa,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Perfil da empresa</h1>
        <p className="text-sm text-muted-foreground">Dados cadastrais e configurações da empresa.</p>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      )}
      {isError && (
        <div className="py-8 text-center text-sm text-destructive">
          {(error as Error)?.message ?? "Erro ao carregar perfil."}
        </div>
      )}
      {!isLoading && !isError && data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5" />
              Dados cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <p><span className="text-muted-foreground">Razão social:</span> {data.razaoSocial ?? "—"}</p>
              <p><span className="text-muted-foreground">CNPJ:</span> {data.cnpj ?? "—"}</p>
              <p><span className="text-muted-foreground">Username:</span> {data.username ?? "—"}</p>
              <p><span className="text-muted-foreground">E-mail:</span> {data.email ?? "—"}</p>
              {(data.ddd || data.numero) && (
                <p><span className="text-muted-foreground">Telefone:</span> +{data.codigoPais ?? ""} ({data.ddd}) {data.numero}</p>
              )}
            </div>
            {(data.rua || data.cidade) && (
              <div className="border-t pt-4">
                <p className="text-muted-foreground text-xs mb-2">Endereço</p>
                <p className="text-sm">{[data.rua, data.numeroEndereco, data.complemento, data.bairro, data.cidade, data.uf, data.cep].filter(Boolean).join(", ") || "—"}</p>
              </div>
            )}
            <div className="border-t pt-4 grid gap-2 text-sm">
              <p><span className="text-muted-foreground">Carga diária padrão:</span> {data.cargaDiariaPadrao ?? "—"}</p>
              <p><span className="text-muted-foreground">Carga semanal padrão (min):</span> {data.cargaSemanalPadrao ?? "—"}</p>
              <p><span className="text-muted-foreground">Gravar geolocalização obrigatória:</span> {data.gravarGeolocalizacaoObrigatoria ? "Sim" : "Não"}</p>
              <p><span className="text-muted-foreground">Permitir ajuste de ponto direto:</span> {data.permitirAjustePontoDireto ? "Sim" : "Não"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
