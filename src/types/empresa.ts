/** Tipos alinhados à documentação e aos DTOs do backend (doc.html + Java). */

export interface Paginacao {
  totalPaginas: number;
  totalElementos: number;
  totalElementosPaginaAtual: number;
  paginaAtual: number;
}

export interface TelefoneListagemDto {
  codigoPais: string;
  ddd: string;
  numero: string;
}

/** Listagem exibe primeiroNome + ultimoNome na tabela. */
export interface FuncionarioListagemResponse {
  usuarioId: string;
  primeiroNome: string;
  ultimoNome: string;
  username: string;
  emails: string[];
  telefones: TelefoneListagemDto[];
}

/** GET /api/empresa/funcionario — Doc id 18 */
export interface FuncionarioListagemPageResponse {
  paginacao: Paginacao;
  conteudo: FuncionarioListagemResponse[];
}

export interface FuncionarioListarParams {
  page?: number;
  pageSize?: number;
  nome?: string;
}

/** GET /api/empresa/espelho-ponto/listagem — Doc id 40b */
export interface EspelhoPontoListagemResponse {
  usuarioId: string;
  nomeCompleto: string;
  totalHorasEsperadas: string;
  totalHorasTrabalhadas: string;
  totalHorasTrabalhadasFeriado: string;
}

export interface EspelhoPontoListagemPageResponse {
  paginacao: Paginacao;
  conteudo: EspelhoPontoListagemResponse[];
}

export interface EspelhoPontoListarParams {
  page?: number;
  pageSize?: number;
  nome?: string;
  ano?: number;
  mes?: number;
}

/** Telefone (usuario_telefone). Doc id 12/16. */
export interface UsuarioTelefoneRequest {
  codigoPais: string;
  ddd: string;
  numero: string;
}

/** Tipo de contrato (tipo_contrato no schema: CLT, PJ, ESTAGIO). Só front; backend resolve por nome. */
export const TIPO_CONTRATO = ["CLT", "PJ", "ESTAGIO"] as const;
export type TipoContrato = (typeof TIPO_CONTRATO)[number];

/** Opções para select: id na ordem do INSERT (1=CLT, 2=PJ, 3=ESTAGIO). */
export const TIPO_CONTRATO_OPCOES: { id: number; descricao: TipoContrato }[] = [
  { id: 1, descricao: "CLT" },
  { id: 2, descricao: "PJ" },
  { id: 3, descricao: "ESTAGIO" },
];

export function tipoContratoFromId(id: number): TipoContrato | null {
  const o = TIPO_CONTRATO_OPCOES.find((x) => x.id === id);
  return o ? o.descricao : null;
}

export function tipoContratoToId(descricao: string): number | null {
  const o = TIPO_CONTRATO_OPCOES.find((x) => x.descricao === descricao);
  return o ? o.id : null;
}

/** Contrato funcionário (contrato_funcionario). Doc id 12/16. */
export interface ContratoFuncionarioRequest {
  matricula?: string | null;
  pisPasep?: string | null;
  cargo: string;
  departamento?: string | null;
  tipoContratoId: number;
  ativo: boolean;
  dataAdmissao: string; // yyyy-MM-dd
  dataDemissao?: string | null; // yyyy-MM-dd
  salarioMensal: number;
  salarioHora: number;
}

/** Tipo de escala jornada (tipo_escala_jornada no schema: 5x2, 6x1, 12x36). Só front; backend resolve por nome. */
export const TIPO_ESCALA_JORNADA = ["5x2", "6x1", "12x36"] as const;
export type TipoEscalaJornada = (typeof TIPO_ESCALA_JORNADA)[number];

/** Opções para select: id na ordem do INSERT (1=5x2, 2=6x1, 3=12x36). */
export const TIPO_ESCALA_JORNADA_OPCOES: { id: number; descricao: TipoEscalaJornada }[] = [
  { id: 1, descricao: "5x2" },
  { id: 2, descricao: "6x1" },
  { id: 3, descricao: "12x36" },
];

export function tipoEscalaJornadaFromId(id: number): TipoEscalaJornada | null {
  const o = TIPO_ESCALA_JORNADA_OPCOES.find((x) => x.id === id);
  return o ? o.descricao : null;
}

export function tipoEscalaJornadaToId(descricao: string): number | null {
  const o = TIPO_ESCALA_JORNADA_OPCOES.find((x) => x.descricao === descricao);
  return o ? o.id : null;
}

/** Jornada funcionário (jornada_funcionario_config). Doc id 12/16. Durações em ISO-8601 (ex: PT8H). */
export interface JornadaFuncionarioConfigRequest {
  tipoEscalaJornadaId: number;
  cargaHorariaDiaria: string; // PT8H
  cargaHorariaSemanal: string; // PT44H
  toleranciaPadrao?: string | null; // PT0S
  intervaloPadrao: string; // PT1H
  tempoDescansoEntreJornada?: string | null; // PT11H
  entradaPadrao: string; // HH:mm
  saidaPadrao: string; // HH:mm
  gravaGeoObrigatoria: boolean;
}

/** POST /api/empresa/funcionario — Doc id 12. Corpo conforme FuncionarioCreateRequest Java */
export interface FuncionarioCreateRequest {
  username: string;
  nomeCompleto: string;
  primeiroNome: string;
  ultimoNome: string;
  cpf: string;
  dataNascimento?: string | null;
  email: string;
  senha: string;
  usuarioTelefone?: UsuarioTelefoneRequest | null;
  contratoFuncionario?: ContratoFuncionarioRequest | null;
  jornadaFuncionarioConfig?: JornadaFuncionarioConfigRequest | null;
  geofenceIds?: string[] | null;
}

/** PUT /api/empresa/funcionario/:id — Doc id 16 */
export interface FuncionarioUpdateRequest {
  username: string;
  nomeCompleto: string;
  primeiroNome: string;
  ultimoNome: string;
  cpf: string;
  dataNascimento?: string | null;
  email: string;
  usuarioTelefone?: UsuarioTelefoneRequest | null;
  contratoFuncionario?: ContratoFuncionarioRequest | null;
  jornadaFuncionarioConfig?: JornadaFuncionarioConfigRequest | null;
  geofenceIds?: string[] | null;
}

/** POST .../resetar-senha — Doc id 13 */
export interface FuncionarioResetarSenhaRequest {
  senhaNova: string;
}

/** POST .../resetar-email — Doc id 14 */
export interface FuncionarioResetarEmailRequest {
  emailNovo: string;
}

/** GET /api/empresa/funcionario/:id/ponto ou /api/funcionario/:id/ponto — Doc 28/33. Itens = jornadas do mês (resumo_ponto_dia). */
export interface PontoListagemResponse {
  items: PontoDiaResponse[];
}
/** Uma jornada pode atravessar o dia; data = data da primeira batida. */
export interface PontoDiaResponse {
  jornada: string;
  data: string;
  diaSemana: string;
  status: string;
  marcacoes: { registroId: string; horario: string; tipo?: "ENTRADA" | "SAIDA" }[];
  totalHoras: string;
}

/** GET /api/empresa/funcionario/:id/resumo-banco-horas — Doc id 43 */
export interface ResumoBancoHorasResponse {
  totalHorasVencidas: string;
  totalHorasEsperadas: string;
  totalHorasTrabalhadas: string;
  totalFinalBanco: string;
}

/** GET /api/empresa/funcionario/:id/banco-horas-historico — Doc id 44 */
export interface BancoHorasHistoricoResponse {
  id: string;
  funcionarioId: string;
  anoReferencia: number;
  mesReferencia: number;
  totalHorasEsperadas: string;
  totalHorasTrabalhadas: string;
  totalBancoHorasFinal: string;
  status: string;
  valorCompensadoParcial?: number;
  tipoStatusPagamento?: string;
  ativo?: boolean;
  dataDesativacao?: string | null;
}
export interface BancoHorasHistoricoPageResponse {
  paginacao: Paginacao;
  conteudo: BancoHorasHistoricoResponse[];
}

/** POST .../banco-horas/fechamento — Doc id 45 */
export interface FechamentoBancoHorasRequest {
  anoReferencia: number;
  mesReferencia: number;
}

/** POST /api/empresa/banco-horas/compensacao — Doc id 44b */
export interface BancoHorasCompensacaoRequest {
  historicoId: string;
  minutos: number;
}

/** GET /api/empresa/perfil — Doc id 27 */
export interface EmpresaPerfilResponse {
  username: string;
  cnpj: string;
  razaoSocial: string;
  email: string;
  telefoneId?: string | null;
  codigoPais?: string;
  ddd?: string;
  numero?: string;
  rua?: string;
  numeroEndereco?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  timezone?: string;
  /** ISO-8601 Duration (ex: PT8H) */
  cargaDiariaPadrao?: string;
  /** ISO-8601 Duration (ex: PT44H) */
  cargaSemanalPadrao?: string;
  /** ISO-8601 Duration (ex: PT0S, PT30M, PT1H) */
  toleranciaPadrao?: string;
  /** ISO-8601 Duration (ex: PT1H) */
  intervaloPadrao?: string;
  controlePontoObrigatorio?: boolean;
  tipoModeloPonto?: string;
  tempoRetencao?: number;
  auditoriaAtiva?: boolean;
  assinaturaDigitalObrigatoria?: boolean;
  gravarGeolocalizacaoObrigatoria?: boolean;
  permitirAjustePontoDireto?: boolean;
}

/** PUT /api/empresa/endereco — Doc id 7 */
export interface EmpresaEnderecoRequest {
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

/** POST /api/empresa/resetar-senha — Doc id 9 */
export interface EmpresaResetarSenhaRequest {
  senhaAntiga: string;
  senhaNova: string;
}

/** GET /api/empresa/config-inicial/status — Doc id 8. Primeira vez que a empresa faz login. */
export interface ConfigInicialStatusResponse {
  configInicialRealizada: boolean;
}

/** GET /api/empresa/metricas-dia — Métrica diária (hoje ou última cadastrada). */
export interface MetricasDiariaEmpresaResponse {
  id: string;
  dataRef: string;
  anoRef: number;
  mesRef: number;
  quantidadeFuncionarios: number;
  solicitacoesPendentes: number;
  totalDoDia: string; // Duration ISO-8601 (ex: PT8H30M)
  totalPontoHoje: number;
}

/** GET /api/empresa/atividades-recentes — Últimos 4 registros de ponto (card igual à landing). */
export interface AtividadeRecenteResponse {
  nomeCompleto: string;
  registradoEm: string; // ISO datetime
}

/** Jornada padrão da empresa (config inicial / jornada-padrao). Durações em ISO-8601. */
export interface EmpresaJornadaConfigRequest {
  tipoEscalaJornadaId: number;
  cargaHorariaDiaria: string;
  cargaHorariaSemanal: string;
  toleranciaPadrao: string;
  intervaloPadrao: string;
  tempoDescansoEntreJornada?: string | null;
  entradaPadrao: string; // HH:mm
  saidaPadrao: string; // HH:mm
  timezone: string;
  gravaGeoObrigatoria: boolean;
  gravaPontoApenasEmGeofence: boolean;
  permiteAjustePonto: boolean;
}

/** Banco de horas da empresa (config inicial). */
export interface EmpresaBancoHorasConfigRequest {
  ativo: boolean;
  totalDiasVencimento: number;
}

/** Geofence na configuração inicial (usuario_geofence). */
export interface UsuarioGeofenceRequest {
  descricao: string;
  latitude: number;
  longitude: number;
  raioMetros: number;
  ativo: boolean;
}

/** POST /api/empresa/config-inicial — Doc id 8. */
export interface EmpresaConfigInicialRequest {
  empresaJornadaConfig: EmpresaJornadaConfigRequest;
  empresaBancoHorasConfig: EmpresaBancoHorasConfigRequest;
  usuarioGeofence?: UsuarioGeofenceRequest[];
}

/** GET /api/funcionario/perfil — Doc id 26. Mesmo shape do editar (objetos aninhados). */
export interface FuncionarioPerfilResponse {
  username: string;
  funcionarioAtivo?: boolean;
  nomeCompleto?: string;
  primeiroNome?: string;
  ultimoNome?: string;
  cpf?: string;
  dataNascimento?: string;
  matricula?: string;
  email?: string;
  usuarioTelefone?: UsuarioTelefoneRequest | null;
  contratoFuncionario?: ContratoFuncionarioRequest | null;
  jornadaFuncionarioConfig?: JornadaFuncionarioConfigRequest | null;
  geofenceIds?: string[] | null;
}

/** POST /api/funcionario/registro-ponto/manual — Doc id 29 */
export interface RegistroPontoManualRequest {
  horario: string; // LocalDateTime ex: 2026-02-07T09:00:00
  justificativa: string;
  observacao?: string | null;
}

/** POST /api/funcionario/comprovante-jornada/assinar — Doc id 35. Body: payloadBase64. Não persiste; retorna dados para embutir no PDF. */
export interface AssinarComprovanteJornadaResponse {
  assinaturaDigital?: string | null;
  certificadoSerial?: string | null;
  timestampAssinatura?: string | null; // LocalDateTime ex: yyyy-MM-ddTHH:mm:ss
}

// --- Solicitações de ponto (Doc ids 36, 37, 38) ---

export interface SolicitacaoPontoItemResponse {
  id: string;
  tipo: string;
  data: string; // LocalDate yyyy-MM-dd
  motivo: string;
  nomeFuncionario: string;
  status: string;
}

/** GET /api/empresa/solicitacoes-ponto — Doc id 36. Params: page, size */
export interface SolicitacoesPontoListagemResponse {
  items: SolicitacaoPontoItemResponse[];
  total: number;
  page: number;
  size: number;
}

/** POST /api/empresa/solicitacoes-ponto/:idRegistroPendente/reprovar — Doc id 38 */
export interface ReprovarSolicitacaoRequest {
  motivo: string;
  observacao?: string | null;
}

// --- Férias e afastamentos (Doc ids 39–42) ---

export interface FeriasAfastamentoItemResponse {
  nomeFuncionario: string | null;
  nomeAfastamento: string;
  inicio: string; // LocalDate yyyy-MM-dd
  fim: string | null;
  status: string;
}

/** GET /api/empresa/ferias-afastamentos ou /funcionario/ferias-afastamentos — Doc 39/41 */
export interface FeriasAfastamentosListagemResponse {
  items: FeriasAfastamentoItemResponse[];
  total: number;
  page: number;
  size: number;
}

/** Tipo de afastamento (tipo_afastamento no schema). Ordem do seed: id 1..5. Backend recebe id e faz findByIdAndAtivoTrue. */
export const TIPO_AFASTAMENTO = ["FERIAS", "LICENCA_MEDICA", "ATESTADO", "LICENCA_MATERNIDADE", "FALTA_JUSTIFICADA"] as const;
export type TipoAfastamento = (typeof TIPO_AFASTAMENTO)[number];

/** Opções para combobox: id na ordem do INSERT no schema (1=FERIAS, 2=LICENCA_MEDICA, 3=ATESTADO, 4=LICENCA_MATERNIDADE, 5=FALTA_JUSTIFICADA). */
export const TIPO_AFASTAMENTO_OPCOES: { id: number; descricao: TipoAfastamento; label: string }[] = [
  { id: 1, descricao: "FERIAS", label: "Férias" },
  { id: 2, descricao: "LICENCA_MEDICA", label: "Licença médica" },
  { id: 3, descricao: "ATESTADO", label: "Atestado" },
  { id: 4, descricao: "LICENCA_MATERNIDADE", label: "Licença maternidade" },
  { id: 5, descricao: "FALTA_JUSTIFICADA", label: "Falta justificada" },
];

/** POST /api/empresa/funcionario/:funcionarioId/afastamentos — Doc id 42 */
export interface CriarAfastamentoRequest {
  tipoAfastamentoId: number;
  dataInicio: string; // yyyy-MM-dd
  dataFim?: string | null;
  observacao?: string | null;
  ativo?: boolean;
}

// --- Feriados (Doc ids 57–60) ---

export interface FeriadoItemResponse {
  id: string;
  data: string; // yyyy-MM-dd
  descricao: string;
  tipoFeriadoId: number;
  tipoFeriadoDescricao: string;
  ativo: boolean;
  createdAt: string;
}

/** GET /api/empresa/feriados — Doc id 57 */
export interface FeriadoListagemPageResponse {
  paginacao: Paginacao;
  conteudo: FeriadoItemResponse[];
}

/** POST /api/empresa/feriados — Doc id 58. Empresa só pode ESTADUAL ou MUNICIPAL. */
export interface CriarFeriadoRequest {
  data: string; // yyyy-MM-dd
  descricao: string;
  tipoFeriadoId: number;
  ativo?: boolean;
}

/** PUT /api/empresa/feriados/:feriadoId — Doc id 59 */
export interface EditarFeriadoRequest {
  data: string;
  descricao: string;
  tipoFeriadoId: number;
  ativo?: boolean;
}

/** Tipo feriado: schema INSERT ordem NACIONAL, ESTADUAL, MUNICIPAL (id 1,2,3). Empresa só pode ESTADUAL e MUNICIPAL. */
export const TIPO_FERIADO_OPCOES_EMPRESA: { id: number; descricao: string; label: string }[] = [
  { id: 2, descricao: "ESTADUAL", label: "Estadual" },
  { id: 3, descricao: "MUNICIPAL", label: "Municipal" },
];

// --- Geofences (Doc ids 46, 47) ---

export interface GeofenceItemResponse {
  id: string;
  nome: string;
  ativo: boolean;
  coordenadas: string;
  raio: number;
  createdAt: string;
  updatedAt: string;
  /** true = acesso parcial (funcionários específicos); false ou ausente = todos */
  acessoParcial?: boolean;
  /** 0 = todos; >0 = quantidade de funcionários com acesso (parcial) */
  quantidadeFuncionariosAcesso?: number;
}

/** GET /api/empresa/geofences — Doc id 46. Params: page, size */
export interface GeofenceListagemPageResponse {
  paginacao: Paginacao;
  conteudo: GeofenceItemResponse[];
}

/** POST /api/empresa/geofences — Doc id 47. funcionarioIds = acesso parcial (opcional). */
export interface CriarGeofenceRequest {
  nome: string;
  descricao: string;
  latitude: number;
  longitude: number;
  raioMetros: number;
  ativo?: boolean;
  funcionarioIds?: string[];
}

// --- Auditoria (Doc ids 50, 51) ---

export interface AuditoriaItemResponse {
  acao: string;
  descricao: string;
  data: string;
  nomeUsuario: string;
  sucesso: boolean;
}

export interface AuditoriaListagemResponse {
  items: AuditoriaItemResponse[];
  total: number;
  page: number;
  size: number;
}

export interface AuditoriaDetalheResponse {
  usuarioId: string;
  acao: string;
  descricao: string;
  dadosAntigos: Record<string, unknown> | null;
  dadosNovos: Record<string, unknown> | null;
  dispositivoId: string | null;
  sucesso: boolean;
  mensagemErro: string | null;
  createdAt: string;
}
