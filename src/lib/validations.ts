/**
 * Validações do frontend — espelho das regras da API (DTOs Java).
 * Usado para validação em tempo real (onChange/onBlur) e antes do envio.
 * Manter sincronizado com os DTOs em infrastructure/input/dto (backend).
 */

/** Resultado: mensagem de erro ou undefined se válido */
export type ValidationResult = string | undefined;

/** Regex e constantes espelhadas da API (documentação no JSDoc por campo). */

// ----- Username (empresa/funcionário/admin) - UsuarioPerfilAtualizarRequest, FuncionarioCreateRequest, EmpresaCreateRequest, AdminCriarRequest -----
/** Apenas letras minúsculas, números, . e - | Size(max=255) */
export const REGEX_USERNAME = /^[a-z0-9.-]+$/u;
export const MAX_LEN_USERNAME = 255;

// ----- Email - UsuarioEmailRequest, FuncionarioCreateRequest, EmpresaCreateRequest, FuncionarioResetarEmailRequest, RecuperarSenhaRequest -----
/** Email padrão | Size(max=255) na API onde aplicável */
export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u;
export const MAX_LEN_EMAIL = 255;

// ----- Senha - LoginRequest, ResetarSenhaRequest, EmpresaCreateRequest, FuncionarioCreateRequest, EmpresaResetarSenhaRequest, FuncionarioResetarSenhaRequest -----
/** Mínimo 6 caracteres, ao menos 1 maiúscula e 1 número ou pontuação */
export const REGEX_SENHA = /^(?=.*[A-Z])(?=.*[0-9\p{P}\p{S}]).*$/u;
export const MIN_LEN_SENHA = 6;

// ----- CPF - FuncionarioCreateRequest, FuncionarioUpdateRequest -----
/** 11 dígitos, com ou sem máscara 000.000.000-00 */
export const REGEX_CPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

// ----- CNPJ - EmpresaCreateRequest -----
/** 14 dígitos, com ou sem formatação */
export const REGEX_CNPJ = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

// ----- Endereço - EmpresaEnderecoRequest -----
/** Rua, bairro, cidade: letras, números, espaços e pontuação | Size(max=255) */
export const REGEX_ENDERECO_TEXTO = /^[\p{L}0-9\s\p{P}\p{S}]+$/u;
/** Complemento: mesmo, mas pode ser vazio | Size(max=255) */
export const REGEX_COMPLEMENTO = /^[\p{L}0-9\s\p{P}\p{S}]*$/u;
/** Número do endereço: apenas dígitos, até 9999 (máx. 4 dígitos) */
export const REGEX_NUMERO_ENDERECO = /^[0-9]{1,4}$/;
export const MAX_LEN_RUA = 255;
export const MAX_LEN_NUMERO = 4;
export const MAX_LEN_COMPLEMENTO = 255;
export const MAX_LEN_BAIRRO = 255;
export const MAX_LEN_CIDADE = 255;

// ----- UF - EmpresaEnderecoRequest -----
/** Exatamente 2 letras (ex: SP) */
export const REGEX_UF = /^[A-Za-z]{2}$/;

// ----- CEP - EmpresaEnderecoRequest -----
/** 8 dígitos, com ou sem hífen (12345-678 ou 12345678) */
export const REGEX_CEP = /^\d{5}-?\d{3}$|^\d{8}$/;

// ----- Telefone - UsuarioTelefoneRequest, UsuarioTelefoneAdicionarRequest -----
/** Código país e DDD/número: apenas dígitos */
export const REGEX_TELEFONE_NUMERO = /^[0-9]+$/;
export const MAX_LEN_CODIGO_PAIS = 10;
export const MAX_LEN_DDD = 5;
export const MAX_LEN_NUMERO_TELEFONE = 20;

// ----- Código recuperação senha - ValidarCodigoRequest -----
export const LEN_CODIGO_RECUPERACAO = 6;

// ----- Motivo (reprovação) - ReprovarSolicitacaoRequest -----
export const MIN_LEN_MOTIVO = 2;
export const MAX_LEN_MOTIVO = 500;

// ----- Justificativa registro ponto - RegistroPontoManualRequest, EmpresaCriarRegistroPontoRequest -----
export const MIN_LEN_JUSTIFICATIVA = 1;
export const MAX_LEN_JUSTIFICATIVA = 500;

// ----- Geofence - CriarGeofenceRequest -----
export const MAX_LEN_NOME_GEOFENCE = 255;
export const MIN_LEN_DESCRICAO_GEOFENCE = 2;
export const MAX_LEN_DESCRICAO_GEOFENCE = 500;
export const MIN_RAIO_METROS = 1;
export const MAX_RAIO_METROS = 50_000;

// ----- Nome / Razão social (mínimo para não aceitar 1 letra) -----
/** Mínimo de caracteres para nome completo, primeiro nome, último nome e razão social */
export const MIN_LEN_NOME = 2;

// ----- Feriado - CriarFeriadoRequest, EditarFeriadoRequest -----
export const MIN_LEN_DESCRICAO_FERIADO = 2;
export const MAX_LEN_DESCRICAO_FERIADO = 255;

// ----- Horário HH:mm (jornada) -----
export const REGEX_HORARIO = /^([01]?\d|2[0-3]):([0-5]\d)$/;

// ----- Duração no formato HH:mm (ex: 08:00, 44:00) convertida para ISO-8601 -----
export const REGEX_DURATION_HHMM = /^(\d{1,3}):([0-5]\d)$/;

/**
 * Remove caracteres não numéricos (para CPF, CNPJ, CEP, telefone).
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// ========== Validadores (retornam mensagem de erro ou undefined) ==========

export function validateRequired(value: string | null | undefined, label: string): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return `${label} é obrigatório.`;
  return undefined;
}

/** Valida seleção obrigatória (Select). */
export function validateRequiredSelect(value: string | null | undefined, message = "Selecione uma opção."): ValidationResult {
  if ((value ?? "").trim().length === 0) return message;
  return undefined;
}

/** Credencial de login: valida conforme o tipo selecionado (EMAIL, USERNAME, CPF, CNPJ, TELEFONE). */
export function validateCredencialByTipo(
  value: string | null | undefined,
  tipo: "EMAIL" | "USERNAME" | "CPF" | "CNPJ" | "TELEFONE",
  required = true
): ValidationResult {
  switch (tipo) {
    case "EMAIL":
      return validateEmail(value, required);
    case "USERNAME":
      return validateUsername(value, required);
    case "CPF":
      return validateCpf(value, required);
    case "CNPJ":
      return validateCnpj(value, required);
    case "TELEFONE":
      return validateNumeroTelefone(value, required);
    default:
      return "Tipo de credencial inválido.";
  }
}

export function validateUsername(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Username é obrigatório." : undefined;
  if (v.length < MIN_LEN_NOME) return "Username deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_USERNAME) return "Username deve ter no máximo 255 caracteres.";
  if (!REGEX_USERNAME.test(v)) return "Apenas letras minúsculas, números, . e -.";
  return undefined;
}

export function validateEmail(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "E-mail é obrigatório." : undefined;
  if (v.length > MAX_LEN_EMAIL) return "E-mail deve ter no máximo 255 caracteres.";
  if (!REGEX_EMAIL.test(v)) return "E-mail inválido.";
  return undefined;
}

export function validateSenha(value: string | null | undefined, required = true, label = "Senha"): ValidationResult {
  const v = value ?? "";
  if (v.length === 0) return required ? `${label} é obrigatória.` : undefined;
  if (v.length < MIN_LEN_SENHA) return `${label} deve ter no mínimo 6 caracteres.`;
  if (!REGEX_SENHA.test(v)) return `${label} deve conter ao menos uma letra maiúscula e um número ou caractere de pontuação.`;
  return undefined;
}

export function validateCpf(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "CPF é obrigatório." : undefined;
  const digits = onlyDigits(v);
  if (digits.length !== 11) return "CPF deve ter 11 dígitos.";
  if (!REGEX_CPF.test(v)) return "CPF inválido.";
  return undefined;
}

export function validateCnpj(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "CNPJ é obrigatório." : undefined;
  const digits = onlyDigits(v);
  if (digits.length !== 14) return "CNPJ deve ter 14 dígitos.";
  if (!REGEX_CNPJ.test(v)) return "CNPJ inválido.";
  return undefined;
}

export function validateRua(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Rua é obrigatória." : undefined;
  if (v.length < MIN_LEN_NOME) return "Rua deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_RUA) return "Rua deve ter no máximo 255 caracteres.";
  if (!REGEX_ENDERECO_TEXTO.test(v)) return "Apenas letras, números, espaços e pontuação.";
  return undefined;
}

export function validateNumeroEndereco(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim().replace(/\D/g, "") || (value ?? "").trim();
  if (v.length === 0) return required ? "Número é obrigatório." : undefined;
  if (v.length > MAX_LEN_NUMERO) return "Número deve ter no máximo 20 caracteres.";
  if (!REGEX_NUMERO_ENDERECO.test(v)) return "Apenas números.";
  return undefined;
}

export function validateComplemento(value: string | null | undefined): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length > MAX_LEN_COMPLEMENTO) return "Complemento deve ter no máximo 255 caracteres.";
  if (v.length && !REGEX_COMPLEMENTO.test(v)) return "Apenas letras, números, espaços e pontuação.";
  return undefined;
}

export function validateBairro(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Bairro é obrigatório." : undefined;
  if (v.length < MIN_LEN_NOME) return "Bairro deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_BAIRRO) return "Bairro deve ter no máximo 255 caracteres.";
  if (!REGEX_ENDERECO_TEXTO.test(v)) return "Apenas letras, números, espaços e pontuação.";
  return undefined;
}

export function validateCidade(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Cidade é obrigatória." : undefined;
  if (v.length < MIN_LEN_NOME) return "Cidade deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_CIDADE) return "Cidade deve ter no máximo 255 caracteres.";
  if (!REGEX_ENDERECO_TEXTO.test(v)) return "Apenas letras, números, espaços e pontuação.";
  return undefined;
}

export function validateUf(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim().toUpperCase();
  if (v.length === 0) return required ? "UF é obrigatória." : undefined;
  if (v.length !== 2) return "UF deve ter 2 caracteres (ex: SP).";
  if (!REGEX_UF.test(v)) return "UF: 2 letras (ex: SP).";
  return undefined;
}

/** CEP: 8 dígitos, com ou sem hífen (12345-678 ou 12345678). Fonte: EmpresaEnderecoRequest. */
export function validateCep(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  const digits = onlyDigits(v);
  if (digits.length === 0) return required ? "CEP é obrigatório." : undefined;
  if (digits.length !== 8) return "CEP deve ter 8 dígitos.";
  return undefined;
}

export function validateCodigoPais(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Código do país é obrigatório." : undefined;
  if (v.length > MAX_LEN_CODIGO_PAIS) return "Código do país deve ter no máximo 10 caracteres.";
  if (!REGEX_TELEFONE_NUMERO.test(v)) return "Apenas números.";
  return undefined;
}

export function validateDdd(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "DDD é obrigatório." : undefined;
  if (v.length > MAX_LEN_DDD) return "DDD deve ter no máximo 5 caracteres.";
  if (!REGEX_TELEFONE_NUMERO.test(v)) return "Apenas números.";
  return undefined;
}

export function validateNumeroTelefone(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Número é obrigatório." : undefined;
  if (v.length > MAX_LEN_NUMERO_TELEFONE) return "Número deve ter no máximo 20 caracteres.";
  if (!REGEX_TELEFONE_NUMERO.test(v.replace(/\D/g, "")) || (v.replace(/\D/g, "").length < 8)) return "Informe um número válido (apenas números).";
  return undefined;
}

export function validateCodigoRecuperacao(value: string | null | undefined): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return "Código é obrigatório.";
  if (v.length !== LEN_CODIGO_RECUPERACAO) return "Código deve ter 6 dígitos.";
  return undefined;
}

export function validateMotivo(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Motivo é obrigatório." : undefined;
  if (v.length < MIN_LEN_MOTIVO) return "Motivo deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_MOTIVO) return "Motivo deve ter no máximo 500 caracteres.";
  return undefined;
}

export function validateJustificativa(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Justificativa é obrigatória." : undefined;
  if (v.length > MAX_LEN_JUSTIFICATIVA) return "Justificativa deve ter no máximo 500 caracteres.";
  return undefined;
}

export function validateRazaoSocial(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Razão social é obrigatória." : undefined;
  if (v.length < MIN_LEN_NOME) return "Razão social deve ter no mínimo 2 caracteres.";
  if (v.length > 255) return "Razão social deve ter no máximo 255 caracteres.";
  return undefined;
}

export function validateNomeCompleto(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Nome completo é obrigatório." : undefined;
  if (v.length < MIN_LEN_NOME) return "Nome completo deve ter no mínimo 2 caracteres.";
  if (v.length > 255) return "Nome completo deve ter no máximo 255 caracteres.";
  return undefined;
}

export function validatePrimeiroNome(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Primeiro nome é obrigatório." : undefined;
  if (v.length < MIN_LEN_NOME) return "Primeiro nome deve ter no mínimo 2 caracteres.";
  if (v.length > 100) return "Primeiro nome deve ter no máximo 100 caracteres.";
  return undefined;
}

export function validateUltimoNome(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Último nome é obrigatório." : undefined;
  if (v.length < MIN_LEN_NOME) return "Último nome deve ter no mínimo 2 caracteres.";
  if (v.length > 100) return "Último nome deve ter no máximo 100 caracteres.";
  return undefined;
}

export function validateNomeGeofence(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Nome é obrigatório." : undefined;
  if (v.length < MIN_LEN_NOME) return "Nome deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_NOME_GEOFENCE) return "Nome deve ter no máximo 255 caracteres.";
  return undefined;
}

export function validateDescricaoGeofence(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Descrição é obrigatória." : undefined;
  if (v.length < MIN_LEN_DESCRICAO_GEOFENCE) return "Descrição deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_DESCRICAO_GEOFENCE) return "Descrição deve ter no máximo 500 caracteres.";
  return undefined;
}

export function validateLatitude(value: number | string | null | undefined): ValidationResult {
  if (value === null || value === undefined || value === "") return "Latitude é obrigatória.";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "Latitude inválida.";
  if (n < -90 || n > 90) return "Latitude deve estar entre -90 e 90.";
  return undefined;
}

export function validateLongitude(value: number | string | null | undefined): ValidationResult {
  if (value === null || value === undefined || value === "") return "Longitude é obrigatória.";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "Longitude inválida.";
  if (n < -180 || n > 180) return "Longitude deve estar entre -180 e 180.";
  return undefined;
}

export function validateRaioMetros(value: number | string | null | undefined, required = true): ValidationResult {
  if (value === null || value === undefined || value === "") return required ? "Raio é obrigatório." : undefined;
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (Number.isNaN(n)) return "Raio deve ser um número.";
  if (n < MIN_RAIO_METROS || n > MAX_RAIO_METROS) return `Raio deve estar entre ${MIN_RAIO_METROS} e ${MAX_RAIO_METROS} metros.`;
  return undefined;
}

export function validateDescricaoFeriado(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Descrição é obrigatória." : undefined;
  if (v.length < MIN_LEN_DESCRICAO_FERIADO) return "Descrição deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_DESCRICAO_FERIADO) return "Descrição deve ter no máximo 255 caracteres.";
  return undefined;
}

/** Cargo - ContratoFuncionarioRequest (mín. 2, máx. 255) */
export const MIN_LEN_CARGO = 2;
export const MAX_LEN_CARGO = 255;

export function validateCargo(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Cargo é obrigatório." : undefined;
  if (v.length < MIN_LEN_CARGO) return "Cargo deve ter no mínimo 2 caracteres.";
  if (v.length > MAX_LEN_CARGO) return "Cargo deve ter no máximo 255 caracteres.";
  return undefined;
}

/** Valida formato HH:mm (ex: 08:00, 17:00) */
export function validateHorario(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Horário é obrigatório." : undefined;
  if (!REGEX_HORARIO.test(v)) return "Horário inválido (use HH:mm).";
  return undefined;
}

/** Valida duração no formato HH:mm (ex: 08:00, 44:00) */
export function validateDurationHhmm(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Campo é obrigatório." : undefined;
  if (!REGEX_DURATION_HHMM.test(v)) return "Formato inválido (use HH:mm, ex: 08:00).";
  return undefined;
}

export function validateData(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Data é obrigatória." : undefined;
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return "Data inválida.";
  return undefined;
}

export function validateTotalDiasVencimento(value: number | string | null | undefined): ValidationResult {
  if (value === null || value === undefined || value === "") return "Total de dias é obrigatório.";
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (Number.isNaN(n) || n < 1) return "Deve ser um número positivo.";
  return undefined;
}

export function validateTimezone(value: string | null | undefined, required = true): ValidationResult {
  const v = (value ?? "").trim();
  if (v.length === 0) return required ? "Timezone é obrigatório." : undefined;
  if (v.length > 50) return "Timezone deve ter no máximo 50 caracteres.";
  return undefined;
}

// ========== Textos "Esperado" (exibidos abaixo do campo) — espelho da API ==========

export const FIELD_EXPECTED: Record<string, string> = {
  username: "Apenas letras minúsculas, números, . e - (mín. 2 e máx. 255 caracteres).",
  email: "Formato de e-mail válido (máx. 255 caracteres).",
  senha: "Mín. 6 caracteres, ao menos 1 letra maiúscula e 1 número ou pontuação.",
  valor: "Credencial: mín. 2 e máx. 255 caracteres (e-mail, usuário, CPF, etc.).",
  credencial: "Credencial: mín. 2 e máx. 255 caracteres (e-mail, usuário, CPF, etc.).",
  cpf: "11 dígitos, com ou sem máscara (000.000.000-00).",
  cnpj: "14 dígitos, com ou sem formatação.",
  razaoSocial: "Razão social (mín. 2 e máx. 255 caracteres).",
  nomeCompleto: "Nome completo (mín. 2 e máx. 255 caracteres).",
  primeiroNome: "Primeiro nome (mín. 2 e máx. 100 caracteres).",
  ultimoNome: "Último nome (mín. 2 e máx. 100 caracteres).",
  rua: "Apenas letras, números, espaços e pontuação (mín. 2 e máx. 255).",
  numero: "Apenas números (mín. 1 e máx. 20).",
  numeroEndereco: "Apenas números (1 a 9999, máx. 4 dígitos).",
  complemento: "Opcional. Letras, números, espaços e pontuação (máx. 255).",
  bairro: "Apenas letras, números, espaços e pontuação (mín. 2 e máx. 255).",
  cidade: "Apenas letras, números, espaços e pontuação (mín. 2 e máx. 255).",
  uf: "Exatamente 2 letras (ex: SP).",
  cep: "8 dígitos, com ou sem hífen (12345-678).",
  codigoPais: "Apenas números (máx. 10, ex: 55).",
  ddd: "Apenas números (máx. 5, ex: 11).",
  numeroTelefone: "Apenas números (máx. 20, ex: 999999999).",
  telefone: "Apenas números (máx. 20, ex: 999999999).",
  codigo: "Código de 6 dígitos enviado por e-mail.",
  senhaNova: "Mín. 6 caracteres, 1 maiúscula e 1 número ou pontuação.",
  confirmarSenha: "Deve ser igual à senha.",
  motivo: "Motivo da reprovação (mín. 2 e máx. 500 caracteres).",
  justificativa: "Justificativa obrigatória (mín. 1 e máx. 500 caracteres).",
  data: "Data no formato da API (yyyy-MM-dd).",
  time: "Horário no formato HH:mm.",
  horario: "Horário no formato HH:mm.",
  cargaDiariaPadrao: "Duração no formato HH:mm (ex: 08:00).",
  cargaSemanalPadrao: "Duração no formato HH:mm (ex: 44:00).",
  toleranciaPadrao: "Duração no formato HH:mm (ex: 00:00).",
  intervaloPadrao: "Duração no formato HH:mm (ex: 01:00).",
  timezone: "Timezone (ex: America/Sao_Paulo, máx. 50 caracteres).",
  nome: "Nome (mín. 2 e máx. 255 caracteres).",
  descricao: "Descrição (mín. 2 e máx. 500 caracteres para geofence; mín. 2 e máx. 255 para feriado).",
  descricaoFeriado: "Descrição (mín. 2 e máx. 255 caracteres).",
  cargo: "Cargo (mín. 2 e máx. 255 caracteres).",
  latitude: "Número entre -90 e 90.",
  longitude: "Número entre -180 e 180.",
  raioMetros: "Raio em metros (entre 1 e 50000).",
  totalDiasVencimento: "Número inteiro positivo (ex: 365).",
  tipoFeriadoId: "Selecione o tipo (Estadual ou Municipal).",
  funcionarioId: "Selecione o funcionário.",
  tipoAfastamentoId: "Selecione o tipo de afastamento.",
  dataInicio: "Data de início (formato yyyy-MM-dd).",
  dataFim: "Data de fim, opcional (formato yyyy-MM-dd).",
};

export function getFieldExpected(key: string): string {
  return FIELD_EXPECTED[key] ?? "Preencha conforme a validação da API.";
}
