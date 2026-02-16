# PontoSeg — Frontend

Interface web do sistema de ponto eletrônico SaaS: área **Empresa** (gestão) e área **Funcionário** (bater ponto, calendário, banco de horas, férias, perfil). Consome a API REST do backend (JWT, refresh token).

---

## Stack

| Tecnologia | Uso |
|------------|-----|
| **Vite** | Build e dev server |
| **React 18** + **TypeScript** | UI |
| **React Router 6** | Rotas públicas e protegidas por tipo (EMPRESA / FUNCIONARIO) |
| **TanStack Query** | Cache e requisições à API |
| **Axios** | Cliente HTTP; base URL em `src/lib/api.ts` (default `http://localhost:8081`) |
| **Tailwind CSS** | Estilos |
| **shadcn/ui** (Radix) | Componentes em `src/components/ui/` |
| **Recharts** | Gráficos no Dashboard (métricas do mês) |
| **date-fns** | Datas |
| **Lucide React** | Ícones |
| **Zod** + **React Hook Form** | Validação e formulários |
| **Vitest** + **Testing Library** | Testes |

---

## Pré-requisitos

- Node.js 18+ e npm (ou bun)

---

## Comandos

```bash
npm install          # dependências
npm run dev          # dev server (hot reload), ex.: http://localhost:5173
npm run build        # build de produção → dist/
npm run build:dev    # build em modo development
npm run preview      # servir dist/ localmente
npm run lint         # ESLint
npm run test         # Vitest (uma execução)
npm run test:watch   # Vitest em watch
```

A API é chamada em `http://localhost:8081` por padrão; altere em `src/lib/api.ts` ou use a variável de ambiente `VITE_API_URL` se o backend estiver em outra URL.

### Acessar o front da máquina host (de fora da VM)

1. **Rede**: Garanta que as portas **8080** (front) e **8081** (API) da VM estejam acessíveis do host (rede em modo bridge ou port forwarding).
2. **Na VM**, suba o front com a URL da API apontando para o IP/hostname da VM (para o browser do host conseguir chamar a API):
   ```bash
   VITE_API_URL=http://<IP_DA_VM>:8081 npm run dev
   ```
   Substitua `<IP_DA_VM>` pelo IP que o host usa para chegar na VM (ex.: `192.168.1.100`).
3. **No host**, abra no navegador: `http://<IP_DA_VM>:8080`.

---

## Rotas e páginas

### Públicas (sem login)

| Rota | Página | Arquivo |
|------|--------|---------|
| `/` | Landing | `src/pages/Index.tsx` |
| `/login` | Login | `src/pages/auth/LoginPage.tsx` |
| `/recuperar-senha` | Recuperar senha | `src/pages/auth/RecuperarSenhaPage.tsx` |
| `/cadastro` | Cadastro de empresa | `src/pages/auth/CadastroEmpresaPage.tsx` |
| `*` (qualquer outra) | 404 | `src/pages/NotFound.tsx` |

### Área Empresa (`/empresa/*`)

Protegido por `ProtectedRoute` (tipo EMPRESA). Layout: `EmpresaLayout` (sidebar + outlet).

| Rota | Menu (label) | Página | Arquivo |
|------|--------------|--------|---------|
| `/empresa` | Dashboard | Dashboard (métricas + gráficos do mês) | `src/pages/empresa/DashboardPage.tsx` |
| `/empresa/config-inicial` | — | Configuração inicial (jornada, banco horas, geofences) | `src/pages/empresa/ConfigInicialPage.tsx` |
| `/empresa/funcionarios` | Funcionários | Listagem e CRUD funcionários | `src/pages/empresa/FuncionariosPage.tsx` |
| `/empresa/espelho-ponto` | Espelho de ponto | Ponto por funcionário | `src/pages/empresa/PontoFuncionarioPage.tsx` |
| `/empresa/banco-horas` | Banco de horas | Banco de horas da empresa | `src/pages/empresa/BancoHorasPage.tsx` |
| `/empresa/solicitacoes` | Solicitações | Solicitações de ponto | `src/pages/empresa/SolicitacoesPage.tsx` |
| `/empresa/ferias` | Férias/Afastamentos | Férias e afastamentos | `src/pages/empresa/FeriasPage.tsx` |
| `/empresa/geofences` | Áreas de ponto | Geofences | `src/pages/empresa/GeofencesPage.tsx` |
| `/empresa/relatorios` | Relatórios | Relatórios (PDF/Excel) | `src/pages/empresa/RelatoriosPage.tsx` |
| `/empresa/auditoria` | Auditoria | Logs de auditoria | `src/pages/empresa/AuditoriaPage.tsx` |
| `/empresa/configuracoes` | Configurações | Placeholder | `src/pages/empresa/PlaceholderPage.tsx` |
| `/empresa/perfil` | Perfil | Perfil da empresa | `src/pages/empresa/PerfilEmpresaPage.tsx` |

### Área Funcionário (`/funcionario/*`)

Protegido por `ProtectedRoute` (tipo FUNCIONARIO). Layout: `FuncionarioLayout`.

| Rota | Menu (label) | Página | Arquivo |
|------|--------------|--------|---------|
| `/funcionario` | Bater Ponto | Bater ponto | `src/pages/funcionario/BaterPontoPage.tsx` |
| `/funcionario/calendario` | Meu Calendário | Calendário de ponto | `src/pages/funcionario/CalendarioPontoPage.tsx` |
| `/funcionario/banco-horas` | Banco de Horas | Resumo e histórico | `src/pages/funcionario/BancoHorasPage.tsx` |
| `/funcionario/ferias` | Férias | Férias/afastamentos do funcionário | `src/pages/funcionario/FeriasPage.tsx` |
| `/funcionario/perfil` | Meu Perfil | Perfil do funcionário | `src/pages/funcionario/PerfilPage.tsx` |

---

## Estrutura do projeto (`src/`)

```
src/
├── App.tsx                    # Rotas (BrowserRouter, ProtectedRoute, AuthProvider)
├── main.tsx
├── index.css
├── vite-env.d.ts
│
├── pages/
│   ├── Index.tsx              # Landing (usa components/landing/*)
│   ├── NotFound.tsx           # 404
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RecuperarSenhaPage.tsx
│   │   └── CadastroEmpresaPage.tsx
│   ├── empresa/
│   │   ├── DashboardPage.tsx
│   │   ├── ConfigInicialPage.tsx
│   │   ├── FuncionariosPage.tsx
│   │   ├── PontoFuncionarioPage.tsx
│   │   ├── BancoHorasPage.tsx
│   │   ├── SolicitacoesPage.tsx
│   │   ├── FeriasPage.tsx
│   │   ├── GeofencesPage.tsx
│   │   ├── RelatoriosPage.tsx
│   │   ├── AuditoriaPage.tsx
│   │   ├── PlaceholderPage.tsx
│   │   ├── PerfilEmpresaPage.tsx
│   └── funcionario/
│       ├── BaterPontoPage.tsx
│       ├── CalendarioPontoPage.tsx
│       ├── BancoHorasPage.tsx
│       ├── FeriasPage.tsx
│       └── PerfilPage.tsx
│
├── components/
│   ├── layouts/
│   │   ├── EmpresaLayout.tsx   # Sidebar empresa + Outlet
│   │   └── FuncionarioLayout.tsx
│   ├── landing/                 # Seções da landing (Index)
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ProblemSection.tsx
│   │   ├── SolutionSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── BenefitsSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── TargetAudienceSection.tsx
│   │   ├── TrustSection.tsx
│   │   ├── FAQSection.tsx
│   │   ├── FinalCTASection.tsx
│   │   └── Footer.tsx
│   ├── ui/                     # shadcn (Radix + Tailwind): button, card, table, dialog, form, etc.
│   ├── NavLink.tsx
│   └── ProtectedRoute.tsx      # Redireciona se não autenticado ou tipo errado
│
├── contexts/
│   └── AuthContext.tsx         # Login, logout, user type, token
│
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── lib/
│   ├── api.ts                  # Axios instance, interceptors (JWT, refresh)
│   ├── api-empresa.ts          # GET/POST/PUT/DELETE /api/empresa/*
│   ├── api-funcionario.ts      # /api/funcionario/* e registro de ponto
│   ├── duration.ts             # Helpers Duration (métricas)
│   ├── token-storage.ts        # Persistência do token
│   └── utils.ts                # cn, etc.
│
├── types/
│   ├── auth.ts
│   └── empresa.ts              # DTOs alinhados ao backend (doc.html)
│
└── test/
    ├── setup.ts
    └── example.test.ts
```

---

## Build para produção

```bash
npm run build
```

Saída em `dist/`. Para SPA: configurar servidor (Nginx, etc.) para redirecionar todas as rotas para `index.html` quando necessário.
