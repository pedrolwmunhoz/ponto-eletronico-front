import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTASection = () => (
  <section id="cta-final" className="py-16 md:py-24 bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        Proteja sua empresa agora mesmo
      </h2>
      <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
        Crie sua conta gratuita e comece a registrar o ponto dos seus funcionários com validade
        jurídica, geolocalização e auditoria completa.
      </p>
      <Button
        size="lg"
        variant="secondary"
        className="text-base gap-2 font-semibold"
        asChild
      >
        <Link to="/cadastro">
          Criar minha conta grátis
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <p className="mt-4 text-sm opacity-75">
        Sem cartão de crédito • Configuração em 5 minutos • Suporte incluso
      </p>
    </div>
  </section>
);

export default FinalCTASection;
