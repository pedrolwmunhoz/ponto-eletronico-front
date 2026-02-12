/**
 * Chamadas à API da área Funcionário.
 * URLs e parâmetros conforme doc.html e controllers Java.
 */
import api from "./api";
import type {
  FeriasAfastamentosListagemResponse,
  FuncionarioPerfilResponse,
  PontoListagemResponse,
  ResumoBancoHorasResponse,
  BancoHorasHistoricoPageResponse,
  RegistroPontoManualRequest,
} from "@/types/empresa";

/** GET /api/funcionario/perfil — Doc id 26 */
export function getPerfilFuncionario(): Promise<FuncionarioPerfilResponse> {
  return api.get<FuncionarioPerfilResponse>("/api/funcionario/perfil").then((r) => r.data);
}

/** GET /api/funcionario/:funcionarioId/ponto — Doc id 28. Params: ano, mes. (funcionarioId = usuário logado) */
export function listarMeuPonto(
  funcionarioId: string,
  ano: number,
  mes: number
): Promise<PontoListagemResponse> {
  return api
    .get<PontoListagemResponse>(`/api/funcionario/${funcionarioId}/ponto`, {
      params: { ano, mes },
    })
    .then((r) => r.data);
}

/** POST /api/empresa/funcionario/registro-ponto — Doc id 31. Batida pelo app; data/hora no servidor. Body opcional (registroMetadados: geo, assinatura). */
export function registrarPontoApp(body?: { registroMetadados?: { geoLatitude?: number; geoLongitude?: number; assinaturaDigital?: string; certificadoSerial?: string; timestampAssinatura?: string } }): Promise<void> {
  return api.post("/api/empresa/funcionario/registro-ponto", body ?? {}).then(() => undefined);
}

/** POST /api/funcionario/registro-ponto/manual — Doc id 29 */
export function registrarPontoManual(body: RegistroPontoManualRequest): Promise<void> {
  return api.post("/api/funcionario/registro-ponto/manual", body).then(() => undefined);
}

/** GET /api/empresa/funcionario/:id/resumo-banco-horas — Doc id 43 (funcionário usa mesmo endpoint com próprio id) */
export function resumoBancoHorasFuncionario(
  funcionarioId: string
): Promise<ResumoBancoHorasResponse> {
  return api
    .get<ResumoBancoHorasResponse>(
      `/api/empresa/funcionario/${funcionarioId}/resumo-banco-horas`
    )
    .then((r) => r.data);
}

/** GET /api/empresa/funcionario/:id/banco-horas-historico — Doc id 44 (funcionário usa mesmo endpoint) */
export function listarBancoHorasHistoricoFuncionario(
  funcionarioId: string,
  params: { page?: number; size?: number } = {}
): Promise<BancoHorasHistoricoPageResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<BancoHorasHistoricoPageResponse>(
      `/api/empresa/funcionario/${funcionarioId}/banco-horas-historico`,
      { params: { page, size } }
    )
    .then((r) => r.data);
}

/** GET /api/funcionario/ferias-afastamentos — Doc id 39. Params: page, size */
export function listarFeriasAfastamentosFuncionario(
  params: { page?: number; size?: number } = {}
): Promise<FeriasAfastamentosListagemResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<FeriasAfastamentosListagemResponse>("/api/funcionario/ferias-afastamentos", {
      params: { page, size },
    })
    .then((r) => r.data);
}
