/**
 * Chamadas à API da área Empresa.
 * URLs e parâmetros conforme doc.html e controllers Java.
 */
import api from "./api";
import type {
  EspelhoPontoListagemPageResponse,
  EspelhoPontoListarParams,
  FuncionarioListagemPageResponse,
  FuncionarioListarParams,
  FuncionarioCreateRequest,
  FuncionarioUpdateRequest,
  FuncionarioResetarSenhaRequest,
  FuncionarioResetarEmailRequest,
  SolicitacoesPontoListagemResponse,
  ReprovarSolicitacaoRequest,
  FeriasAfastamentosListagemResponse,
  CriarAfastamentoRequest,
  FeriadoListagemPageResponse,
  CriarFeriadoRequest,
  EditarFeriadoRequest,
  GeofenceItemResponse,
  GeofenceListagemPageResponse,
  CriarGeofenceRequest,
  AuditoriaListagemResponse,
  AuditoriaDetalheResponse,
  PontoListagemResponse,
  ResumoBancoHorasResponse,
  BancoHorasHistoricoPageResponse,
  FechamentoBancoHorasRequest,
  BancoHorasCompensacaoRequest,
  EmpresaPerfilResponse,
  EmpresaEnderecoRequest,
  EmpresaResetarSenhaRequest,
  ConfigInicialStatusResponse,
  EmpresaConfigInicialRequest,
  FuncionarioPerfilResponse,
  MetricasDiariaEmpresaResponse,
  AtividadeRecenteResponse,
} from "@/types/empresa";

const BASE = "/api/empresa";

/** GET /api/empresa/funcionario — Doc id 18. Params: page, pageSize, nome */
export function listarFuncionarios(
  params: FuncionarioListarParams = {}
): Promise<FuncionarioListagemPageResponse> {
  const { page = 0, pageSize = 10, nome } = params;
  return api
    .get<FuncionarioListagemPageResponse>(`${BASE}/funcionario`, {
      params: { page, pageSize, ...(nome != null && nome !== "" ? { nome } : {}) },
    })
    .then((r) => r.data);
}

/** POST /api/empresa/funcionario — Doc id 12 */
export function criarFuncionario(body: FuncionarioCreateRequest): Promise<{ funcionarioId: string }> {
  return api.post<{ funcionarioId: string }>(`${BASE}/funcionario`, body).then((r) => r.data);
}

/** PUT /api/empresa/funcionario/:funcionarioId — Doc id 16 */
export function atualizarFuncionario(
  funcionarioId: string,
  body: FuncionarioUpdateRequest
): Promise<void> {
  return api.put(`${BASE}/funcionario/${funcionarioId}`, body).then(() => undefined);
}

/** POST /api/empresa/funcionario/:funcionarioId/resetar-senha — Doc id 13 */
export function resetarSenhaFuncionario(
  funcionarioId: string,
  body: FuncionarioResetarSenhaRequest
): Promise<void> {
  return api.post(`${BASE}/funcionario/${funcionarioId}/resetar-senha`, body).then(() => undefined);
}

/** POST /api/empresa/funcionario/:funcionarioId/resetar-email — Doc id 14 */
export function resetarEmailFuncionario(
  funcionarioId: string,
  body: FuncionarioResetarEmailRequest
): Promise<void> {
  return api.post(`${BASE}/funcionario/${funcionarioId}/resetar-email`, body).then(() => undefined);
}

/** POST /api/empresa/funcionario/:funcionarioId/desbloquear — Doc id 15 */
export function desbloquearFuncionario(funcionarioId: string): Promise<void> {
  return api.post(`${BASE}/funcionario/${funcionarioId}/desbloquear`, {}).then(() => undefined);
}

/** DELETE /api/empresa/funcionario/:funcionarioId — Doc id 17 */
export function deletarFuncionario(funcionarioId: string): Promise<void> {
  return api.delete(`${BASE}/funcionario/${funcionarioId}`).then(() => undefined);
}

/** GET /api/empresa/funcionario/:funcionarioId/perfil — Perfil do funcionário (para empresa editar) */
export function getPerfilFuncionario(funcionarioId: string): Promise<FuncionarioPerfilResponse> {
  return api
    .get<FuncionarioPerfilResponse>(`${BASE}/funcionario/${funcionarioId}/perfil`)
    .then((r) => r.data);
}

// --- Solicitações de ponto ---

/** GET /api/empresa/solicitacoes-ponto — Doc id 36. Params: page, size, nome */
export function listarSolicitacoesPonto(
  params: { page?: number; size?: number; nome?: string } = {}
): Promise<SolicitacoesPontoListagemResponse> {
  const { page = 0, size = 10, nome } = params;
  return api
    .get<SolicitacoesPontoListagemResponse>(`${BASE}/solicitacoes-ponto`, {
      params: { page, size, ...(nome != null && nome !== "" ? { nome } : {}) },
    })
    .then((r) => r.data);
}

/** POST /api/empresa/solicitacoes-ponto/:idRegistroPendente/aprovar — Doc id 37 */
export function aprovarSolicitacaoPonto(idRegistroPendente: string): Promise<void> {
  return api.post(`${BASE}/solicitacoes-ponto/${idRegistroPendente}/aprovar`).then(() => undefined);
}

/** POST /api/empresa/solicitacoes-ponto/:idRegistroPendente/reprovar — Doc id 38 */
export function reprovarSolicitacaoPonto(
  idRegistroPendente: string,
  body: ReprovarSolicitacaoRequest
): Promise<void> {
  return api
    .post(`${BASE}/solicitacoes-ponto/${idRegistroPendente}/reprovar`, body)
    .then(() => undefined);
}

// --- Férias e afastamentos ---

/** GET /api/empresa/ferias-afastamentos — Doc id 41. Params: page, size, nome */
export function listarFeriasAfastamentosEmpresa(
  params: { page?: number; size?: number; nome?: string } = {}
): Promise<FeriasAfastamentosListagemResponse> {
  const { page = 0, size = 10, nome } = params;
  return api
    .get<FeriasAfastamentosListagemResponse>(`${BASE}/ferias-afastamentos`, {
      params: { page, size, ...(nome != null && nome !== "" ? { nome } : {}) },
    })
    .then((r) => r.data);
}

/** GET /api/empresa/espelho-ponto/listagem — Doc id 40b. Params: page, pageSize, nome, ano, mes */
export function listagemEspelhoPonto(
  params: EspelhoPontoListarParams = {}
): Promise<EspelhoPontoListagemPageResponse> {
  const { page = 0, pageSize = 20, nome, ano, mes } = params;
  return api
    .get<EspelhoPontoListagemPageResponse>(`${BASE}/espelho-ponto/listagem`, {
      params: {
        page,
        pageSize,
        ...(nome != null && nome !== "" ? { nome } : {}),
        ...(ano != null ? { ano } : {}),
        ...(mes != null ? { mes } : {}),
      },
    })
    .then((r) => r.data);
}

/** GET /api/empresa/funcionario/:funcionarioId/ponto — Doc id 33. Params: ano, mes */
export function listarPontoFuncionario(
  funcionarioId: string,
  ano: number,
  mes: number
): Promise<PontoListagemResponse> {
  return api
    .get<PontoListagemResponse>(`${BASE}/funcionario/${funcionarioId}/ponto`, {
      params: { ano, mes },
    })
    .then((r) => r.data);
}

/** DELETE /api/empresa/funcionario/:funcionarioId/registro-ponto/:registroId — Doc id 34 */
export function deletarRegistroPonto(
  funcionarioId: string,
  registroId: string
): Promise<void> {
  return api
    .delete(`${BASE}/funcionario/${funcionarioId}/registro-ponto/${registroId}`)
    .then(() => undefined);
}

/** POST /api/empresa/funcionario/:funcionarioId/registro-ponto — Doc id 35 (manual). Header Idempotency-Key obrigatório. */
export function criarRegistroPontoFuncionario(
  funcionarioId: string,
  body: { horario: string; justificativa: string; observacao?: string | null },
  idempotencyKey?: string
): Promise<void> {
  const key = idempotencyKey ?? crypto.randomUUID();
  return api
    .post(`${BASE}/funcionario/${funcionarioId}/registro-ponto`, body, {
      headers: { "Idempotency-Key": key },
    })
    .then(() => undefined);
}

/** PUT /api/empresa/funcionario/:funcionarioId/registro-ponto/:registroId — Editar registro (desativa e cria novo). Header Idempotency-Key obrigatório. */
export function editarRegistroPonto(
  funcionarioId: string,
  registroId: string,
  body: { horario: string; justificativa: string; observacao?: string | null },
  idempotencyKey?: string
): Promise<void> {
  const key = idempotencyKey ?? crypto.randomUUID();
  return api
    .put(`${BASE}/funcionario/${funcionarioId}/registro-ponto/${registroId}`, body, {
      headers: { "Idempotency-Key": key },
    })
    .then(() => undefined);
}

/** GET /api/empresa/funcionario/:funcionarioId/ferias-afastamentos — Doc id 40. Params: page, size */
export function listarFeriasPorFuncionario(
  funcionarioId: string,
  params: { page?: number; size?: number } = {}
): Promise<FeriasAfastamentosListagemResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<FeriasAfastamentosListagemResponse>(
      `${BASE}/funcionario/${funcionarioId}/ferias-afastamentos`,
      { params: { page, size } }
    )
    .then((r) => r.data);
}

/** GET /api/empresa/funcionario/:funcionarioId/resumo-banco-horas — Doc id 43 */
export function resumoBancoHoras(funcionarioId: string): Promise<ResumoBancoHorasResponse> {
  return api
    .get<ResumoBancoHorasResponse>(`${BASE}/funcionario/${funcionarioId}/resumo-banco-horas`)
    .then((r) => r.data);
}

/** GET /api/empresa/funcionario/:funcionarioId/banco-horas-historico — Doc id 44. Params: page, size */
export function listarBancoHorasHistorico(
  funcionarioId: string,
  params: { page?: number; size?: number } = {}
): Promise<BancoHorasHistoricoPageResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<BancoHorasHistoricoPageResponse>(
      `${BASE}/funcionario/${funcionarioId}/banco-horas-historico`,
      { params: { page, size } }
    )
    .then((r) => r.data);
}

/** POST /api/empresa/banco-horas/compensacao — Doc id 44b */
export function registrarCompensacaoBancoHoras(
  body: BancoHorasCompensacaoRequest
): Promise<void> {
  return api.post(`${BASE}/banco-horas/compensacao`, body).then(() => undefined);
}

/** POST /api/empresa/funcionario/:funcionarioId/banco-horas/fechamento — Doc id 45 */
export function fechamentoBancoHoras(
  funcionarioId: string,
  body: FechamentoBancoHorasRequest
): Promise<void> {
  return api
    .post(`${BASE}/funcionario/${funcionarioId}/banco-horas/fechamento`, body)
    .then(() => undefined);
}

/** GET /api/empresa/perfil — Doc id 27 */
export function getPerfilEmpresa(): Promise<EmpresaPerfilResponse> {
  return api.get<EmpresaPerfilResponse>(`${BASE}/perfil`).then((r) => r.data);
}

/** PUT /api/empresa/endereco — Doc id 7 */
export function atualizarEnderecoEmpresa(
  body: EmpresaEnderecoRequest
): Promise<void> {
  return api.put(`${BASE}/endereco`, body).then(() => undefined);
}

/** GET /api/empresa/config-inicial/status — primeira vez que a empresa faz login */
export function getConfigInicialStatus(): Promise<ConfigInicialStatusResponse> {
  return api.get<ConfigInicialStatusResponse>(`${BASE}/config-inicial/status`).then((r) => r.data);
}

/**
 * Duas chamadas: 1) POST /config-inicial com JSON (config). 2) Se tiver cert, POST /config-inicial/certificado com multipart (só arquivo + senha).
 */
export async function configInicialEmpresa(
  body: EmpresaConfigInicialRequest,
  certificadoA1?: File | null,
  certificadoA1Senha?: string | null
): Promise<void> {
  await api.post(`${BASE}/config-inicial`, body);
  const temCert = certificadoA1 != null && certificadoA1.size > 0;
  if (!temCert) return;
  const form = new FormData();
  form.append("certificadoA1", certificadoA1);
  if (certificadoA1Senha != null && certificadoA1Senha.trim() !== "") {
    form.append("certificadoA1Senha", certificadoA1Senha.trim());
  }
  // Forçar multipart: remover Content-Type da instância (axios coloca multipart/form-data + boundary quando data é FormData)
  await api.post(`${BASE}/config-inicial/certificado`, form, {
    headers: { "Content-Type": false } as unknown as Record<string, string>,
  });
}

/** POST /api/empresa/resetar-senha — Doc id 9 */
export function resetarSenhaEmpresa(body: EmpresaResetarSenhaRequest): Promise<void> {
  return api.post(`${BASE}/resetar-senha`, body).then(() => undefined);
}

/** PUT /api/empresa/jornada-padrao — Doc id 10 */
export function atualizarJornadaPadrao(body: Record<string, unknown>): Promise<void> {
  return api.put(`${BASE}/jornada-padrao`, body).then(() => undefined);
}

/** PUT /api/empresa/banco-horas-config — Doc id 11 */
export function atualizarBancoHorasConfig(body: {
  empresaBancoHorasConfig: { ativo: boolean; totalDiasVencimento: number };
}): Promise<void> {
  return api.put(`${BASE}/banco-horas-config`, body).then(() => undefined);
}

/** GET /api/empresa/metricas-dia — Métrica do dia (hoje ou última cadastrada). */
export function getMetricasDia(): Promise<MetricasDiariaEmpresaResponse> {
  return api.get<MetricasDiariaEmpresaResponse>(`${BASE}/metricas-dia`).then((r) => r.data);
}

/** GET /api/empresa/metricas-dia/por-periodo — Lista métricas diárias por data início e fim. */
export function getMetricasDiaPorPeriodo(dataInicio: string, dataFim: string): Promise<MetricasDiariaEmpresaResponse[]> {
  return api
    .get<MetricasDiariaEmpresaResponse[]>(`${BASE}/metricas-dia/por-periodo`, {
      params: { dataInicio, dataFim },
    })
    .then((r) => r.data);
}

/** GET /api/empresa/atividades-recentes — Últimos 4 registros de ponto (mesmo card da landing). */
export function getAtividadesRecentes(): Promise<AtividadeRecenteResponse[]> {
  return api.get<AtividadeRecenteResponse[]>(`${BASE}/atividades-recentes`).then((r) => r.data);
}

/** POST /api/empresa/funcionario/:funcionarioId/afastamentos — Doc id 42 */
export function criarAfastamento(
  funcionarioId: string,
  body: CriarAfastamentoRequest
): Promise<void> {
  return api
    .post(`${BASE}/funcionario/${funcionarioId}/afastamentos`, body)
    .then(() => undefined);
}

// --- Feriados ---

/** GET /api/empresa/feriados — Doc id 57. Params: page, size, observacao, dataInicio, dataFim (opcionais). */
export function listarFeriados(
  params: { page?: number; size?: number; observacao?: string; dataInicio?: string; dataFim?: string } = {}
): Promise<FeriadoListagemPageResponse> {
  const { page = 0, size = 20, observacao, dataInicio, dataFim } = params;
  const query: Record<string, string | number> = { page, size };
  if (observacao != null && observacao.trim() !== "") query.observacao = observacao.trim();
  if (dataInicio != null && dataInicio.trim() !== "") query.dataInicio = dataInicio.trim();
  if (dataFim != null && dataFim.trim() !== "") query.dataFim = dataFim.trim();
  return api
    .get<FeriadoListagemPageResponse>(`${BASE}/feriados`, { params: query })
    .then((r) => r.data);
}

/** POST /api/empresa/feriados — Doc id 58. Empresa só pode ESTADUAL ou MUNICIPAL. */
export function criarFeriado(body: CriarFeriadoRequest): Promise<void> {
  return api.post(`${BASE}/feriados`, body).then(() => undefined);
}

/** PUT /api/empresa/feriados/:feriadoId — Doc id 59 */
export function editarFeriado(
  feriadoId: string,
  body: EditarFeriadoRequest
): Promise<void> {
  return api.put(`${BASE}/feriados/${feriadoId}`, body).then(() => undefined);
}

/** DELETE /api/empresa/feriados/:feriadoId — Doc id 60 */
export function excluirFeriado(feriadoId: string): Promise<void> {
  return api.delete(`${BASE}/feriados/${feriadoId}`).then(() => undefined);
}

// --- Geofences ---

/** GET /api/empresa/geofences — Doc id 46. Params: page, size */
export function listarGeofences(
  params: { page?: number; size?: number } = {}
): Promise<GeofenceListagemPageResponse> {
  const { page = 0, size = 10 } = params;
  return api.get<GeofenceListagemPageResponse>(`${BASE}/geofences`, { params: { page, size } }).then((r) => r.data);
}

/** POST /api/empresa/geofences — Doc id 47 */
export function criarGeofence(body: CriarGeofenceRequest): Promise<void> {
  return api.post(`${BASE}/geofences`, body).then(() => undefined);
}

// --- Auditoria ---

/** GET /api/empresa/auditoria — Doc id 50. Params: page, size */
export function listarAuditoria(
  params: { page?: number; size?: number } = {}
): Promise<AuditoriaListagemResponse> {
  const { page = 0, size = 10 } = params;
  return api
    .get<AuditoriaListagemResponse>(`${BASE}/auditoria`, { params: { page, size } })
    .then((r) => r.data);
}

/** GET /api/empresa/auditoria/:logId — Doc id 51 */
export function detalharAuditoria(logId: string): Promise<AuditoriaDetalheResponse> {
  return api.get<AuditoriaDetalheResponse>(`${BASE}/auditoria/${logId}`).then((r) => r.data);
}

// --- Relatórios (blob download) ---

export type FormatoRelatorio = "PDF" | "EXCEL";

/** POST /api/empresa/relatorios/ponto-detalhado — Doc id 48. Query: ano, mes, formato */
export function downloadRelatorioPontoDetalhado(
  ano: number,
  mes: number,
  formato: FormatoRelatorio
): Promise<Blob> {
  return api
    .post(
      `${BASE}/relatorios/ponto-detalhado`,
      null,
      { params: { ano, mes, formato }, responseType: "blob" }
    )
    .then((r) => r.data);
}

/** POST /api/empresa/relatorios/ponto-resumo — Doc id 49. Query: ano, mes, formato */
export function downloadRelatorioPontoResumo(
  ano: number,
  mes: number,
  formato: FormatoRelatorio
): Promise<Blob> {
  return api
    .post(
      `${BASE}/relatorios/ponto-resumo`,
      null,
      { params: { ano, mes, formato }, responseType: "blob" }
    )
    .then((r) => r.data);
}
