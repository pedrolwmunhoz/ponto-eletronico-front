import type { AuthTokens, TipoUsuario } from "@/types/auth";

const TOKENS_KEY = "ponto_tokens";

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
  },

  getTokens(): AuthTokens | null {
    const raw = localStorage.getItem(TOKENS_KEY);
    if (!raw || typeof raw !== "string") return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && typeof parsed.jwt === "string") return parsed as AuthTokens;
      return null;
    } catch {
      return null;
    }
  },

  /** Tipo do usuário extraído do payload do JWT (não usa localStorage). */
  getUserType(): TipoUsuario | null {
    const tokens = this.getTokens();
    if (!tokens?.jwt) return null;
    const payload = parseJwt(tokens.jwt);
    const raw = (payload?.scope ?? payload?.tipo) as string | undefined;
    const tipo = raw?.replace(/^SCOPE_/, "") ?? null;
    return (tipo as TipoUsuario) ?? null;
  },

  clearTokens() {
    localStorage.removeItem(TOKENS_KEY);
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
