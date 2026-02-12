import { ShieldCheck, Scale, ScanSearch, DatabaseZap } from "lucide-react";

const seals = [
  { icon: ShieldCheck, title: "Segurança Total", desc: "Dados criptografados e protegidos com os mais altos padrões de segurança." },
  { icon: Scale, title: "Compliance CLT", desc: "Sistema alinhado às exigências da legislação trabalhista brasileira." },
  { icon: ScanSearch, title: "Rastreabilidade", desc: "Cada registro possui trilha de auditoria completa e imutável." },
  { icon: DatabaseZap, title: "Dados Auditáveis", desc: "Informações sempre disponíveis para fiscalizações e perícias trabalhistas." },
];

const TrustSection = () => (
  <section className="py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Confiabilidade</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Sua tranquilidade jurídica é nossa prioridade
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {seals.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustSection;
