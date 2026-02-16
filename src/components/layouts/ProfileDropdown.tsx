import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, LogOut, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPerfilEmpresa } from "@/lib/api-empresa";
import { getPerfilFuncionario } from "@/lib/api-funcionario";
import type { TipoUsuario } from "@/types/auth";
import { ModalPerfil } from "./ModalPerfil";

interface ProfileDropdownProps {
  userType: TipoUsuario;
  logout: () => void;
}

/** Empresa: primeira letra do nome (razaoSocial). Funcionário: primeira letra do primeiro nome + primeira letra do último nome. */
function getIniciais(
  userType: TipoUsuario,
  perfil: { razaoSocial?: string; nomeCompleto?: string; primeiroNome?: string; ultimoNome?: string } | undefined
): string {
  if (!perfil) return "?";
  if (userType === "EMPRESA") {
    const nome = (perfil.razaoSocial ?? "").trim();
    return nome ? nome[0].toUpperCase() : "E";
  }
  const primeiro = (perfil.primeiroNome ?? "").trim();
  const ultimo = (perfil.ultimoNome ?? "").trim();
  if (primeiro && ultimo) return (primeiro[0] + ultimo[0]).toUpperCase();
  const completo = (perfil.nomeCompleto ?? "").trim();
  if (!completo) return "?";
  const partes = completo.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  return partes[0][0].toUpperCase();
}

export function ProfileDropdown({ userType, logout }: ProfileDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isEmpresa = userType === "EMPRESA";
  const { data: perfil, isLoading } = useQuery({
    queryKey: ["perfil", userType],
    queryFn: isEmpresa ? getPerfilEmpresa : getPerfilFuncionario,
    enabled: userType === "EMPRESA" || userType === "FUNCIONARIO",
    retry: false,
  });

  const nome = isEmpresa
    ? (perfil as { razaoSocial?: string })?.razaoSocial
    : (perfil as { nomeCompleto?: string })?.nomeCompleto;
  const email = (perfil as { email?: string })?.email;
  const username = (perfil as { username?: string })?.username;
  const subtitulo = email || username || null;
  const iniciais = getIniciais(userType, perfil as Parameters<typeof getIniciais>[1]);

  const handleConfigurarPerfil = () => {
    setDropdownOpen(false);
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground ring-offset-background transition hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Abrir perfil"
            >
              {isLoading ? (
                <User className="h-5 w-5" />
              ) : (
                <span>{iniciais}</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-0">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                  {iniciais}
                </div>
                <div className="min-w-0 flex-1">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : (
                    <>
                      <p className="truncate text-sm font-medium text-foreground">
                        {nome ?? "—"}
                      </p>
                      {subtitulo ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {subtitulo}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full justify-start gap-2"
                onClick={handleConfigurarPerfil}
              >
                <UserCog className="h-4 w-4" />
                Configurar perfil
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>

      <ModalPerfil
        open={modalOpen}
        onOpenChange={setModalOpen}
        userType={userType}
        perfil={perfil}
      />
    </>
  );
}
