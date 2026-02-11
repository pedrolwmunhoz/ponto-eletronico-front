

# Sistema de Ponto Eletrônico SaaS — Plano de Implementação

## Visão Geral
Sistema completo de ponto eletrônico com **3 áreas**: Pública (login/cadastro), Empresa (administração), e Funcionário (app de ponto). Todas as telas conectadas aos 55 endpoints reais da API.

---

## FASE 1 — Infraestrutura & Autenticação

### Configuração Base
- Cliente Axios com interceptors para JWT (Authorization header) e refresh token automático
- Gerenciamento de sessão (armazenamento seguro de tokens, expiração, logout)
- Rotas protegidas por tipo de usuário (EMPRESA vs FUNCIONÁRIO vs ADMIN)
- Layout SaaS com sidebar + topbar (separado por área)

### Telas Públicas

**Login** — `POST /api/auth`
- Formulário: credencial (email/username/CPF/CNPJ), tipo de credencial, senha
- Redireciona para área correta conforme tipo de usuário

**Recuperar Senha** — `POST /api/auth/recuperar-senha` → `POST /api/auth/validar-codigo` → `POST /api/auth/resetar-senha`
- Fluxo em 3 etapas: email → código → nova senha

**Cadastro de Empresa** — `POST /api/empresa`
- Formulário multi-step: dados da empresa (razão social, CNPJ), endereço, telefone, credenciais de acesso

---

## FASE 2 — Área da Empresa (Admin)

### Dashboard
- Visão geral: total de funcionários, solicitações pendentes, resumo de banco de horas
- Atalhos rápidos para ações frequentes

### Perfil da Empresa — `GET /api/empresa/perfil` + `PUT /api/empresa/endereco` + `POST /api/empresa/resetar-senha`
- Exibição dos dados da empresa com edição de endereço
- Gestão de emails (`POST/DELETE /api/usuario/email`), telefones (`POST/DELETE /api/usuario/telefone`), credenciais (`POST/DELETE /api/usuario/credential`)
- Alteração de senha

### Configuração Inicial — `POST /api/empresa/config-inicial`
- Wizard de setup: jornada padrão + banco de horas + geofences (opcional)
- Exibido no primeiro acesso da empresa

### Jornada Padrão — `PUT /api/empresa/jornada-padrao`
- Formulário: tipo de escala, carga horária diária/semanal, tolerância, intervalo, horários entrada/saída, timezone, flags (geo obrigatória, ponto em geofence, ajuste de ponto)

### Banco de Horas Config — `PUT /api/empresa/banco-horas-config`
- Toggle ativo/inativo + dias de vencimento

### Geofences (Mapa) — `GET /api/empresa/geofences` + `POST /api/empresa/geofences`
- Mapa interativo mostrando geofences existentes (círculos com raio)
- Formulário para criar novo geofence: nome, descrição, latitude/longitude (clique no mapa), raio em metros
- Lista lateral com geofences ativos/inativos

### Funcionários (CRUD) — `GET /api/empresa/funcionario` + `POST /api/empresa/funcionario` + `PUT /api/empresa/funcionario/:id` + `DELETE /api/empresa/funcionario/:id`
- Tabela paginada com filtro por nome
- Modal/página de cadastro com formulário completo: dados pessoais, contrato, jornada, geofences associados
- Ações por funcionário: editar, excluir, resetar senha (`POST .../resetar-senha`), resetar email (`POST .../resetar-email`), desbloquear (`POST .../desbloquear`)

### Ponto por Funcionário — `GET /api/empresa/funcionario/:id/ponto` + `POST /api/empresa/funcionario/:id/registro-ponto` + `DELETE /api/empresa/funcionario/:id/registro-ponto/:registroId`
- Calendário mensal mostrando marcações de cada dia
- Visualização detalhada: batidas, total de horas, status (OK, atraso, falta, etc.)
- Ação: criar registro manual (horário + justificativa + observação) e excluir registro

### Ponto Público (Tablet) — `POST /api/empresa/registro-ponto/publico`
- Tela fullscreen simplificada para tablet: código de ponto (6 dígitos) + geolocalização automática
- Idempotency-Key no header

### Solicitações de Ponto — `GET /api/empresa/solicitacoes-ponto` + `POST .../aprovar` + `POST .../reprovar`
- Tabela paginada: tipo, data, motivo, funcionário, status
- Ações: aprovar (um clique) ou reprovar (com motivo obrigatório + observação)

### Férias e Afastamentos — `GET /api/empresa/ferias-afastamentos` + `GET /api/empresa/funcionario/:id/ferias-afastamentos` + `POST /api/empresa/funcionario/:id/afastamentos`
- Tabela geral de todos os afastamentos da empresa (paginada)
- Visualização por funcionário específico
- Formulário de criação: tipo de afastamento, data início/fim, observação

### Banco de Horas — `GET .../resumo-banco-horas` + `GET .../banco-horas-historico` + `POST .../banco-horas/fechamento`
- Dashboard por funcionário: horas vencidas, esperadas, trabalhadas, saldo final
- Histórico de fechamentos mensais (tabela paginada)
- Ação de fechamento de mês (ano + mês de referência)

### Relatórios — `POST /api/empresa/relatorios/ponto-detalhado` + `POST /api/empresa/relatorios/ponto-resumo`
- Tela com seleção de ano, mês e formato (PDF ou Excel)
- Dois tipos: detalhado (todas as batidas) e resumo (totais por funcionário)
- Download automático do arquivo gerado

### Auditoria — `GET /api/empresa/auditoria` + `GET /api/empresa/auditoria/:logId`
- Tabela paginada: ação, descrição, data, usuário, sucesso/falha
- Modal de detalhe: dados antigos vs novos (JSON diff), dispositivo, mensagem de erro

---

## FASE 3 — Área do Funcionário

### Bater Ponto — `POST /api/empresa/funcionario/registro-ponto`
- Botão grande centralizado "Bater Ponto" com captura automática de geolocalização
- Registro manual disponível: `POST /api/funcionario/registro-ponto/manual` (horário + justificativa)
- Exibição das batidas do dia atual

### Meu Calendário de Ponto — `GET /api/funcionario/:id/ponto`
- Calendário mensal com navegação por mês/ano
- Cada dia mostra marcações, total de horas e status
- Ação: excluir registro (`DELETE /api/empresa/registro-ponto/:id`)

### Meu Banco de Horas
- Resumo com saldo atual (usando mesmos endpoints via contexto do funcionário)

### Meu Perfil — `GET /api/funcionario/perfil` + `PUT /api/usuario/perfil`
- Exibição completa: dados pessoais, contrato, jornada configurada
- Edição de username, emails e telefones

### Férias e Afastamentos — `GET /api/funcionario/ferias-afastamentos`
- Tabela paginada (somente leitura): tipo, período, status

---

## Design & UX

- **Layout**: Sidebar colapsável com ícones + topbar com nome do usuário e logout
- **Tema**: Profissional corporativo, cores neutras com acentos em azul
- **Responsivo**: Desktop-first com adaptação para tablet (tela de ponto público)
- **Estados**: Loading skeletons, mensagens de erro com toast, estados vazios informativos
- **Componentes reutilizáveis**: DataTable com paginação, FormModal, Calendar com marcações, MapView para geofences

