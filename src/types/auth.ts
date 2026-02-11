export type TipoCredencial = "EMAIL" | "TELEFONE" | "CPF" | "CNPJ" | "USERNAME";
export type TipoUsuario = "EMPRESA" | "FUNCIONARIO" | "ADMIN";

export interface LoginRequest {
  valor: string;
  tipoCredencial: TipoCredencial;
  senha: string;
}

export interface LoginResponse {
  jwt: string;
  jwtExpires: string;
  refreshToken: string;
  refreshTokenExpires: string;
}

export interface RefreshResponse {
  token: string;
  expiresToken: string;
  refreshToken: string;
  expiresRefreshToken: string;
}

export interface RecuperarSenhaRequest {
  email: string;
}

export interface ValidarCodigoRequest {
  codigo: string;
}

export interface ValidarCodigoResponse {
  token: string;
}

export interface ResetarSenhaRequest {
  token: string;
  senhaNova: string;
}

export interface CadastroEmpresaRequest {
  username: string;
  email: string;
  senha: string;
  razaoSocial: string;
  cnpj: string;
  empresaEndereco: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  usuarioTelefone: {
    codigoPais: string;
    ddd: string;
    numero: string;
  };
}

export interface AuthUser {
  tipo: TipoUsuario;
}

export interface AuthTokens {
  jwt: string;
  jwtExpires: string;
  refreshToken: string;
  refreshTokenExpires: string;
}
