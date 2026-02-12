import type { AuthTokens, TipoUsuario } from "@/types/auth";

const TOKENS_KEY = "ponto_tokens";
const USER_TYPE_KEY = "ponto_user_type";

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export const tokenStorage = {
  setTokens(tokens: AuthTokens) {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    const payload = parseJwt(tokens.jwt);
    const raw = (payload?.scope ?? payload?.tipo) as string | undefined;
    const tipo = raw?.replace(/^SCOPE_/, "") ?? null;
    if (tipo) {
      localStorage.setItem(USER_TYPE_KEY, tipo);
    }
  },

  getTokens(): AuthTokens | null {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  getUserType(): TipoUsuario | null {
    return localStorage.getItem(USER_TYPE_KEY) as TipoUsuario | null;
  },

  clearTokens() {
    localStorage.removeItem(TOKENS_KEY);
    localStorage.removeItem(USER_TYPE_KEY);
  },

  isAuthenticated(): boolean {
    const tokens = this.getTokens();
    return !!tokens?.jwt;
  },

  /** ID do usuário logado (subject do JWT). */
  getUserId(): string | null {
    const tokens = this.getTokens();
    if (!tokens?.jwt) return null;
    const payload = parseJwt(tokens.jwt);
    const sub = payload?.sub as string | undefined;
    return sub ?? null;
  },
};
