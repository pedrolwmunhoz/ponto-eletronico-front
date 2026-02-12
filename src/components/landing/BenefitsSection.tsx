import { ShieldCheck, FileDown, Zap, Eye, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  { icon: ShieldCheck, title: "Nunca mais perca uma fiscalização", desc: "Todos os registros prontos para auditar a qualquer momento." },
  { icon: FileDown, title: "Relatórios prontos em 1 clique", desc: "PDF e Excel mensais gerados automaticamente para seu contador." },
  { icon: Zap, title: "Zero retrabalho no RH", desc: "Horas extras, banco de horas e faltas calculados automaticamente." },
  { icon: Eye, title: "Controle total antifraude", desc: "Geolocalização + assinatura digital eliminam fraude de ponto." },
  { icon: Clock, title: "Economia de tempo", desc: "O que seu RH levava dias agora leva minutos." },
  { icon: TrendingUp, title: "Escale sem dor de cabeça", desc: "De 10 a 200 funcionários sem mudar de sistema." },
];

const BenefitsSection = () => (
  <section className="py-16 md:py-24 bg-muted/40">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Benefícios</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Resultados reais para sua empresa
        </h2>
        <p className="text-muted-foreground text-lg">
          Mais segurança jurídica, menos trabalho manual, total tranquilidade.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {benefits.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
