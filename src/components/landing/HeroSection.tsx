import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, Wallet, Clock } from "lucide-react";

const HeroSection = () => {
  const scrollTo = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="space-y-6 mt-8 md:mt-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Sua empresa está protegida contra{" "}
              <span className="text-primary">processos trabalhistas</span>?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Controle de ponto digital com validade jurídica, geolocalização e
              assinatura digital. Elimine riscos de multas e fraudes de uma vez
              por todas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="text-base gap-2" onClick={() => scrollTo("#cta-final")}>
                Criar minha conta grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base gap-2"
                onClick={() => scrollTo("#como-funciona")}
              >
                <Play className="h-4 w-4" />
                Ver como funciona
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sem cartão de crédito • Configuração em 5 minutos
            </p>
          </div>

          {/* Dashboard Mock */}
          <div className="relative">
            <div className="rounded-xl border bg-card shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-sm text-muted-foreground">Dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Users, label: "Funcionários", value: "47", iconClass: "text-primary" },
                  { icon: Clock, label: "Registros dia", value: "94", iconClass: "text-info" },
                  { icon: Wallet, label: "Total de horas", value: "168h", iconClass: "text-primary" },
                ].map(({ icon: Icon, label, value, iconClass }) => (
                  <div key={label} className="rounded-lg bg-muted p-3 text-center">
                    <Icon className={`h-5 w-5 mx-auto mb-1 ${iconClass ?? "text-primary"}`} />
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {["Maria Silva — 08:02 ✓", "João Santos — 08:05 ✓", "Ana Costa — 08:07 ✓"].map(
                  (entry) => (
                    <div
                      key={entry}
                      className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-sm"
                    >
                      <span className="text-foreground">{entry}</span>
                      <span className="text-xs text-green-600 font-medium">Geoloc. OK</span>
                    </div>
                  )
                )}
              </div>
            </div>
            {/* Decorative blobs */}
            <div className="absolute -z-10 -top-8 -right-8 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -z-10 -bottom-8 -left-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
