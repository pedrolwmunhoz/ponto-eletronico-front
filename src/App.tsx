import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Layouts
import { EmpresaLayout } from "@/components/layouts/EmpresaLayout";
import { FuncionarioLayout } from "@/components/layouts/FuncionarioLayout";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RecuperarSenhaPage from "./pages/auth/RecuperarSenhaPage";
import CadastroEmpresaPage from "./pages/auth/CadastroEmpresaPage";

// Empresa pages
import DashboardPage from "./pages/empresa/DashboardPage";
import PlaceholderPage from "./pages/empresa/PlaceholderPage";

// Funcionario pages
import BaterPontoPage from "./pages/funcionario/BaterPontoPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
              <Route path="funcionarios" element={<PlaceholderPage />} />
              <Route path="solicitacoes" element={<PlaceholderPage />} />
              <Route path="ferias" element={<PlaceholderPage />} />
              <Route path="geofences" element={<PlaceholderPage />} />
              <Route path="relatorios" element={<PlaceholderPage />} />
              <Route path="auditoria" element={<PlaceholderPage />} />
              <Route path="configuracoes" element={<PlaceholderPage />} />
              <Route path="perfil" element={<PlaceholderPage />} />
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
              <Route path="calendario" element={<PlaceholderPage />} />
              <Route path="banco-horas" element={<PlaceholderPage />} />
              <Route path="ferias" element={<PlaceholderPage />} />
              <Route path="perfil" element={<PlaceholderPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
