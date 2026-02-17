import { useEffect, useState } from "react";

export type CidadeItem = { id_cidade: number; nomeCidade: string };
export type EstadoItem = { id: number; nomeEstado: string; sigla: string; cidades: CidadeItem[] };

type EstadosCidadesJson = { estados: EstadoItem[] };

/** Carrega estados e cidades do JSON público. Primeiro seleciona estado, depois cidade. */
export function useEstadosCidades() {
  const [data, setData] = useState<EstadosCidadesJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/estados-com-cidades.json")
      .then((r) => {
        if (!r.ok) throw new Error("Falha ao carregar estados e cidades.");
        return r.json();
      })
      .then((json: EstadosCidadesJson) => {
        setData(json);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      })
      .finally(() => setLoading(false));
  }, []);

  const estados = data?.estados ?? [];
  const getCidadesByUf = (uf: string): CidadeItem[] => {
    if (!uf) return [];
    const estado = estados.find((e) => e.sigla === uf);
    return estado?.cidades ?? [];
  };

  return { estados, getCidadesByUf, loading, error };
}
