import { Building2, UserCog, Calculator, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const audiences = [
  { icon: Building2, title: "Donos de empresa", desc: "Proteja-se de multas e processos trabalhistas. Tenha controle total sobre a jornada dos seus funcionários." },
  { icon: UserCog, title: "Profissionais de RH", desc: "Elimine o retrabalho com planilhas. Relatórios automáticos, aprovações digitais e zero erro de cálculo." },
  { icon: Calculator, title: "Contadores", desc: "Receba relatórios mensais em PDF e Excel prontos para fechamento. Sem precisar cobrar o cliente." },
  { icon: Rocket, title: "Empresas em crescimento", desc: "Comece com 10, cresça para 200 funcionários. O sistema escala com você sem trocar de plataforma." },
];

const TargetAudienceSection = () => (
  <section className="py-16 md:py-24 bg-muted/40">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Para quem é</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Feito para quem precisa de controle e segurança
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {audiences.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="hover:shadow-md transition-shadow text-center">
            <CardContent className="pt-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-7 w-7 text-primary" />
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

export default TargetAudienceSection;
