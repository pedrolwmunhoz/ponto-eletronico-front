/**
 * Chamadas à API da área Funcionário.
 * URLs e parâmetros conforme doc.html e controllers Java.
 */
import api from "./api";
import type {
  FeriasAfastamentosListagemResponse,
  FuncionarioPerfilResponse,
  PontoDiaResponse,
  ResumoBancoHorasResponse,
  BancoHorasHistoricoPageResponse,
  RegistroPontoManualRequest,
} from "@/types/empresa";

/** GET /api/funcionario/perfil — Doc id 26 */
export function getPerfilFuncionario(): Promise<FuncionarioPerfilResponse> {
  return api.get<FuncionarioPerfilResponse>("/api/funcionario/perfil").then((r) => r.data);
}

/** GET /api/funcionario/:funcionarioId/ponto — Doc id 28. Params: ano, mes. Backend retorna array de jornadas. */
export function listarMeuPonto(
  funcionarioId: string,
  ano: number,
  mes: number
): Promise<PontoDiaResponse[]> {
  return api
    .get<PontoDiaResponse[]>(`/api/funcionario/${funcionarioId}/ponto`, {
      params: { ano, mes },
    })
    .then((r) => r.data);
}

/** POST /api/empresa/funcionario/registro-ponto — Doc id 31. Batida pelo app; data/hora no servidor. Header Idempotency-Key obrigatório. */
export function registrarPontoApp(
  idempotencyKey: string,
  body?: { registroMetadados?: { geoLatitude?: number; geoLongitude?: number; assinaturaDigital?: string; certificadoSerial?: string; timestampAssinatura?: string } }
): Promise<void> {
  return api
    .post("/api/empresa/funcionario/registro-ponto", body ?? {}, {
      headers: { "Idempotency-Key": idempotencyKey },
    })
    .then(() => undefined);
}

/** POST /api/funcionario/registro-ponto/manual — Doc id 29. Header Idempotency-Key obrigatório. */
export function registrarPontoManual(
  idempotencyKey: string,
  body: RegistroPontoManualRequest
): Promise<void> {
  return api
    .post("/api/funcionario/registro-ponto/manual", body, {
      headers: { "Idempotency-Key": idempotencyKey },
    })
    .then(() => undefined);
}

/** DELETE /api/empresa/registro-ponto/:idRegistro — Doc id 33. Solicitação de remoção ou remoção direta conforme config empresa. */
export function deletarRegistroFuncionario(
  idRegistro: string,
  body?: { geoLatitude?: number; geoLongitude?: number; assinaturaDigital?: string; certificadoSerial?: string; timestampAssinatura?: string }
): Promise<void> {
  return api
    .delete(`/api/empresa/registro-ponto/${idRegistro}`, { data: body ?? {} })
    .then(() => undefined);
}

/** GET /api/usuario/banco-horas/resumo — Resumo do próprio funcionário (JWT SCOPE_FUNCIONARIO) */
export function resumoBancoHorasFuncionario(
  _funcionarioId?: string
): Promise<ResumoBancoHorasResponse> {
  return api
    .get<ResumoBancoHorasResponse>("/api/usuario/banco-horas/resumo")
    .then((r) => r.data);
}

/** GET /api/usuario/banco-horas/historico — Histórico do próprio funcionário (JWT SCOPE_FUNCIONARIO) */
export function listarBancoHorasHistoricoFuncionario(
  _funcionarioId?: string,
  params: { page?: number; size?: number } = {}
): Promise<BancoHorasHistoricoPageResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<BancoHorasHistoricoPageResponse>("/api/usuario/banco-horas/historico", {
      params: { page, size },
    })
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
