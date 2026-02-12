# PontoSeg — Frontend

Interface web do sistema de ponto eletrônico SaaS. Área **Empresa** (gestão de funcionários, espelho de ponto, banco de horas, solicitações, férias/afastamentos, relatórios, auditoria) e área **Funcionário** (bater ponto, calendário, banco de horas, férias, perfil).

## Stack

- **Vite** — build e dev server
- **React 18** + **TypeScript**
- **React Router** — rotas públicas e protegidas por tipo de usuário (EMPRESA / FUNCIONARIO)
- **TanStack Query** — cache e requisições à API
- **Axios** — cliente HTTP (base URL configurável em `src/lib/api.ts`)
- **Tailwind CSS** + **shadcn/ui** (Radix) — UI
- **Recharts** — gráficos no Dashboard (métricas do mês)
- **date-fns** — datas
- **Lucide React** — ícones
- **Zod** + **React Hook Form** — validação e formulários

## Pré-requisitos

- Node.js 18+ e npm (ou bun)

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Subir o servidor de desenvolvimento (hot reload)
npm run dev
```

A aplicação abre em `http://localhost:5173` (ou outra porta indicada no terminal). O front chama a API em `http://localhost:8081` por padrão; altere `API_BASE_URL` em `src/lib/api.ts` se o backend estiver em outra URL.

## Scripts

| Comando        | Descrição                    |
|----------------|------------------------------|
| `npm run dev`  | Servidor de desenvolvimento   |
| `npm run build`| Build de produção            |
| `npm run build:dev` | Build em modo development |
| `npm run preview`   | Preview do build de produção |
| `npm run lint` | ESLint                       |
| `npm run test` | Vitest (testes unitários)    |

## Estrutura principal

```
src/
├── App.tsx                 # Rotas (públicas, /empresa/*, /funcionario/*)
├── main.tsx
├── components/
│   ├── layouts/            # EmpresaLayout, FuncionarioLayout (sidebar + outlet)
│   ├── ui/                 # shadcn (Button, Card, Table, etc.)
│   └── landing/            # Seções da landing (Index)
├── contexts/
│   └── AuthContext.tsx     # Login, logout, tipo de usuário, token
├── lib/
│   ├── api.ts              # Axios instance, interceptors (JWT, refresh)
│   ├── api-empresa.ts      # Chamadas /api/empresa/*
│   ├── api-funcionario.ts  # Chamadas /api/funcionario/* e registro de ponto
│   ├── duration.ts         # Helpers para Duration (métricas)
│   └── token-storage.ts    # Armazenamento do token
├── pages/
│   ├── auth/               # Login, recuperar senha, cadastro empresa
│   ├── empresa/            # Dashboard, funcionários, espelho ponto, banco horas, etc.
│   └── funcionario/        # Bater ponto, calendário, banco horas, férias, perfil
└── types/
    ├── auth.ts
    └── empresa.ts          # DTOs alinhados ao backend (doc.html)
```

## Rotas

- **Públicas:** `/`, `/login`, `/recuperar-senha`, `/cadastro`
- **Empresa** (após login com tipo EMPRESA): `/empresa` (Dashboard), `/empresa/funcionarios`, `/empresa/espelho-ponto`, `/empresa/banco-horas`, `/empresa/solicitacoes`, `/empresa/ferias`, `/empresa/geofences`, `/empresa/relatorios`, `/empresa/auditoria`, `/empresa/configuracoes`, `/empresa/perfil`, `/empresa/config-inicial`
- **Funcionário** (após login com tipo FUNCIONARIO): `/funcionario` (bater ponto), `/funcionario/calendario`, `/funcionario/banco-horas`, `/funcionario/ferias`, `/funcionario/perfil`

O Dashboard exibe cards de métricas (funcionários, solicitações pendentes, total do dia, registros hoje) e gráficos do mês (horas acumuladas, horas por dia, total registro de pontos acumulado e por dia, total de funcionários).

## Build para produção

```bash
npm run build
```

Saída em `dist/`. Para servir: `npm run preview` ou use o output em qualquer servidor estático (Nginx, etc.), garantindo que rotas client-side (ex.: `/empresa/perfil`) sejam redirecionadas para `index.html` se o projeto usar roteamento apenas no cliente.
