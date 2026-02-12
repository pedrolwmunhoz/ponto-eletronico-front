import { Clock } from "lucide-react";

const Footer = () => (
  <footer className="border-t py-12 bg-background">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4">
        <div className="flex flex-col gap-1 md:flex-1 md:items-start w-full md:w-auto">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <Clock className="h-5 w-5" />
            PontoSeg
          </div>
          <p className="text-xs text-muted-foreground">PontoSeg é um produto ClockInTech</p>
        </div>
        <nav className="flex gap-6 text-sm text-muted-foreground justify-center md:flex-1">
          <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <p className="text-sm text-muted-foreground md:flex-1 md:text-right w-full md:w-auto">
          © {new Date().getFullYear()} ClockInTech. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
