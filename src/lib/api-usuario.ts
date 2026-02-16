/**
 * Chamadas à API de usuário (empresa e funcionário).
 * Doc ids 19–25.
 */
import api from "./api";

/** PUT /api/usuario/perfil — Doc id 19. Atualizar username. */
export function atualizarPerfilUsuario(body: { username: string }): Promise<void> {
  return api.put("/api/usuario/perfil", body).then(() => undefined);
}

/** PUT /api/usuario/email — Atualizar email primário (transação atômica). */
export function atualizarEmail(body: { novoEmail: string }): Promise<void> {
  return api.put("/api/usuario/email", body).then(() => undefined);
}

/** POST /api/usuario/email — Doc id 22. Adicionar novo email. */
export function adicionarEmail(body: { novoEmail: string }): Promise<void> {
  return api.post("/api/usuario/email", body).then(() => undefined);
}

/** DELETE /api/usuario/email — Doc id 23. Remover email (body: email a remover). */
export function removerEmail(body: { novoEmail: string }): Promise<void> {
  return api.delete("/api/usuario/email", { data: body }).then(() => undefined);
}

/** POST /api/usuario/telefone — Doc id 24. Adicionar novo telefone. */
export function adicionarTelefone(body: {
  codigoPais: string;
  ddd: string;
  numero: string;
}): Promise<void> {
  return api.post("/api/usuario/telefone", body).then(() => undefined);
}

/** DELETE /api/usuario/telefone/:telefoneId — Doc id 25. */
export function removerTelefone(telefoneId: string): Promise<void> {
  return api.delete(`/api/usuario/telefone/${telefoneId}`).then(() => undefined);
}
