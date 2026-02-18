import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Layouts
import EmpresaLayout from "@/components/layouts/EmpresaLayout";
import { FuncionarioLayout } from "@/components/layouts/FuncionarioLayout";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RecuperarSenhaPage from "./pages/auth/RecuperarSenhaPage";
import CadastroEmpresaPage from "./pages/auth/CadastroEmpresaPage";

// Empresa pages
import DashboardPage from "./pages/empresa/DashboardPage";
import FuncionariosPage from "./pages/empresa/FuncionariosPage";
import SolicitacoesPage from "./pages/empresa/SolicitacoesPage";
import FeriasPage from "./pages/empresa/FeriasPage";
import FeriadosPage from "./pages/empresa/FeriadosPage";
import GeofencesPage from "./pages/empresa/GeofencesPage";
import RelatoriosPage from "./pages/empresa/RelatoriosPage";
import AuditoriaPage from "./pages/empresa/AuditoriaPage";
import PerfilEmpresaPage from "./pages/empresa/PerfilEmpresaPage";
import PontoFuncionarioPage from "./pages/empresa/PontoFuncionarioPage";
import BancoHorasPage from "./pages/empresa/BancoHorasPage";
import PlaceholderPage from "./pages/empresa/PlaceholderPage";
import ConfigInicialPage from "./pages/empresa/ConfigInicialPage";
import BancoHorasFuncionarioPage from "./pages/funcionario/BancoHorasPage";

// Funcionario pages
import BaterPontoPage from "./pages/funcionario/BaterPontoPage";
import CalendarioPontoPage from "./pages/funcionario/CalendarioPontoPage";
import FeriasFuncionarioPage from "./pages/funcionario/FeriasPage";
import PerfilFuncionarioPage from "./pages/funcionario/PerfilPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
            <Route path="/cadastro" element={<CadastroEmpresaPage />} />

            {/* Empresa */}
            <Route
              path="/empresa"
              element={
                <ProtectedRoute allowedTypes={["EMPRESA"]}>
                  <EmpresaLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="config-inicial" element={<ConfigInicialPage />} />
              <Route path="funcionarios" element={<FuncionariosPage />} />
              <Route path="espelho-ponto" element={<PontoFuncionarioPage />} />
              <Route path="banco-horas" element={<BancoHorasPage />} />
              <Route path="solicitacoes" element={<SolicitacoesPage />} />
              <Route path="ferias" element={<FeriasPage />} />
              <Route path="feriados" element={<FeriadosPage />} />
              <Route path="geofences" element={<GeofencesPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="auditoria" element={<AuditoriaPage />} />
              <Route path="configuracoes" element={<PlaceholderPage />} />
              <Route path="perfil" element={<PerfilEmpresaPage />} />
            </Route>

            {/* Funcionário */}
            <Route
              path="/funcionario"
              element={
                <ProtectedRoute allowedTypes={["FUNCIONARIO"]}>
                  <FuncionarioLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<BaterPontoPage />} />
              <Route path="calendario" element={<CalendarioPontoPage />} />
              <Route path="banco-horas" element={<BancoHorasFuncionarioPage />} />
              <Route path="ferias" element={<FeriasFuncionarioPage />} />
              <Route path="perfil" element={<PerfilFuncionarioPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
