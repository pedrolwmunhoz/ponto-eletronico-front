import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getConfigInicialStatus } from "@/lib/api-empresa";
import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  Settings,
  MapPin,
  CalendarDays,
  Calendar,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Menu,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "./ProfileDropdown";
import { AppFooter } from "@/components/AppFooter";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/empresa", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/empresa/funcionarios", icon: Users, label: "Funcionários" },
  { to: "/empresa/espelho-ponto", icon: Clock, label: "Espelho de ponto" },
  { to: "/empresa/banco-horas", icon: Wallet, label: "Banco de horas" },
  { to: "/empresa/solicitacoes", icon: ClipboardList, label: "Solicitações" },
  { to: "/empresa/ferias", icon: CalendarDays, label: "Férias/Afastamentos" },
  { to: "/empresa/feriados", icon: Calendar, label: "Feriados" },
  { to: "/empresa/geofences", icon: MapPin, label: "Áreas de ponto" },
  { to: "/empresa/relatorios", icon: BarChart3, label: "Relatórios" },
  { to: "/empresa/auditoria", icon: Shield, label: "Auditoria" },
  { to: "/empresa/configuracoes", icon: Settings, label: "Configurações" },
];

export default function EmpresaLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: configStatus } = useQuery({
    queryKey: ["empresa", "config-inicial-status"],
    queryFn: getConfigInicialStatus,
    retry: false,
  });

  useEffect(() => {
    if (configStatus?.configInicialRealizada === false && !location.pathname.endsWith("/config-inicial")) {
      navigate("/empresa/config-inicial", { replace: true });
    }
  }, [configStatus, location.pathname, navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:relative",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <Clock className="h-7 w-7 shrink-0 text-sidebar-primary" />
          {!collapsed && (
            <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
              PontoSeg
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div className="hidden border-t border-sidebar-border p-2 lg:block">
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {userType && (
            <ProfileDropdown userType={userType} logout={logout} />
          )}
        </header>

        {/* Page content + footer no mesmo nível, footer depois da página */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-4 lg:p-6">
            <Outlet />
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
