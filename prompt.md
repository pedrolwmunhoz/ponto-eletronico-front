Você é um arquiteto de software especialista em UX, SaaS e sistemas corporativos.

Sua tarefa é gerar o FRONTEND COMPLETO de um sistema SaaS de Ponto Eletrônico.

NÃO use mocks.
NÃO invente endpoints.
USE EXATAMENTE os endpoints fornecidos.
TODAS as telas devem estar conectadas a endpoints reais.

Antes de gerar código, você deve:

1) Analisar todos os endpoints
2) Agrupar endpoints por domínio funcional
3) Definir TODAS as telas necessárias
4) Definir o fluxo de navegação entre telas
5) Definir estados, formulários, tabelas e ações de cada tela
6) Só depois gerar o frontend

O sistema possui DOIS TIPOS DE USUÁRIO:
- EMPRESA (admin)
- FUNCIONÁRIO

O frontend deve separar claramente as áreas:
- Área da Empresa (administração completa)
- Área do Funcionário (app de ponto)

Baseie TODAS as telas exclusivamente nos endpoints abaixo.

### REGRAS CRÍTICAS

- Se existe endpoint, existe tela.
- Se existe POST/PUT, existe formulário.
- Se existe GET paginado, existe tabela com paginação e filtros.
- Se existe DELETE, existe ação na tabela.
- Se existe relatório, existe tela de geração e download.
- Se existe auditoria, existe tela de logs detalhados.
- Se existe geofence, existe tela de mapa.
- Se existe banco de horas, existe dashboard.
- Se existe solicitação, existe tela de aprovação.

### ORGANIZAÇÃO ESPERADA

Você deve estruturar o frontend nas seguintes seções:

#### PÚBLICO
- Login
- Recuperar senha
- Resetar senha
- Cadastro empresa

#### EMPRESA (admin)
- Dashboard
- Perfil empresa
- Configuração inicial
- Jornada padrão
- Banco de horas config
- Geofences (mapa)
- Funcionários (CRUD completo)
- Ponto por funcionário (calendário mensal)
- Solicitações de ponto (aprovar/reprovar)
- Férias e afastamentos
- Banco de horas (resumo + histórico + fechamento)
- Relatórios (detalhado e resumo)
- Auditoria (lista + detalhe)

#### FUNCIONÁRIO
- Bater ponto
- Meu calendário de ponto
- Meu banco de horas
- Meu perfil
- Férias e afastamentos

### PARA CADA TELA, DESCREVA:

- Nome da tela
- Qual endpoint consome
- Campos do formulário
- Ações do usuário
- Componentes (tabela, calendário, mapa, modal, etc)
- Fluxo de navegação
- Estados (loading, erro, vazio)

### DEPOIS DISSO

Gere o frontend em React + TypeScript com:

- React Query para chamadas API
- Axios client configurado com JWT e Refresh Token
- Estrutura de pastas por domínio
- Rotas protegidas por tipo de usuário
- Componentes reutilizáveis (Table, Form, Modal, Calendar, Map)
- Layout profissional de SaaS (sidebar + topbar)

AGORA, utilize a documentação de endpoints abaixo para construir tudo.
