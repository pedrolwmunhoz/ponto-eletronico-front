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
    if (payload?.tipo) {
      localStorage.setItem(USER_TYPE_KEY, payload.tipo as string);
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
};
