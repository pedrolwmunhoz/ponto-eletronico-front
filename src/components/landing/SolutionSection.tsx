import { MapPin, Fingerprint, ClipboardCheck, Monitor, Smartphone } from "lucide-react";

const items = [
  {
    icon: MapPin,
    title: "Geolocalização obrigatória",
    desc: "Cada registro de ponto é vinculado à localização exata do funcionário. Você sabe quem bateu ponto e de onde.",
  },
  {
    icon: Fingerprint,
    title: "Assinatura digital",
    desc: "Todo ponto é assinado digitalmente, garantindo autenticidade e validade jurídica perante a CLT.",
  },
  {
    icon: ClipboardCheck,
    title: "Auditoria completa",
    desc: "Histórico rastreável de cada ação: quem fez, quando fez, de onde fez. Impossível adulterar.",
  },
  {
    icon: Monitor,
    title: "Terminal de ponto",
    desc: "Terminal coletivo para uso na empresa. Funcionários registram o ponto com segurança e praticidade.",
  },
  {
    icon: Smartphone,
    title: "App do funcionário",
    desc: "Registro de ponto pelo celular com geofence. Ideal para equipes externas, home office e filiais.",
  },
];

const SolutionSection = () => (
  <section className="py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left — texto */}
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            A solução
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ponto eletrônico com prova jurídica real
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            O PontoSeg transforma o registro de ponto da sua empresa em um documento digital
            inviolável, com validade jurídica e rastreabilidade completa.
          </p>
          <div className="space-y-6">
            {items.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — visual */}
        <div className="relative flex items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl border bg-card shadow-xl p-8 space-y-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Fingerprint className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-bold text-foreground text-lg">Ponto registrado!</p>
              <p className="text-sm text-muted-foreground">08:02 — 11 fev 2026</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Localização</span>
                <span className="text-foreground font-medium">Dentro da área ✓</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Assinatura</span>
                <span className="text-foreground font-medium">Verificada ✓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auditoria</span>
                <span className="text-foreground font-medium">Registrada ✓</span>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </div>
    </div>
  </section>
);

export default SolutionSection;
