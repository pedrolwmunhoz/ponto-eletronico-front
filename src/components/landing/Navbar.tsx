import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Clock } from "lucide-react";

const navLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === "/";
  const isCadastro = location.pathname === "/cadastro";
  const isLogin = location.pathname === "/login" || location.pathname === "/recuperar-senha";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (isLanding) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/" + href);
    }
  };

  const handleCtaClick = () => {
    setOpen(false);
    if (isCadastro) {
      navigate("/login");
    } else if (isLogin) {
      navigate("/cadastro");
    } else {
      document.querySelector("#cta-final")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const ctaLabel = isCadastro ? "Login" : isLogin ? "Criar minha conta grátis" : "Criar minha conta grátis";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding ? "bg-background/95 backdrop-blur shadow-sm border-b" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center px-4 relative">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary shrink-0">
          <Clock className="h-6 w-6" />
          PontoSeg
        </Link>

        {/* Desktop - 3 links centralizados */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Direita: Login + CTA (desktop) / Login + Menu (mobile) */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">
          {isLanding && (
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              Login
            </Link>
          )}
          <Button size="sm" onClick={handleCtaClick} className="hidden md:inline-flex">
            {ctaLabel}
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex flex-col gap-6 mt-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left text-base font-medium text-foreground"
                >
                  {link.label}
                </button>
              ))}
              {isLanding && (
                <Link to="/login" className="text-left text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Login
                </Link>
              )}
              <Button onClick={handleCtaClick}>{ctaLabel}</Button>
            </div>
          </SheetContent>
          </Sheet>
      </div>
    </header>
  );
};

export default Navbar;
