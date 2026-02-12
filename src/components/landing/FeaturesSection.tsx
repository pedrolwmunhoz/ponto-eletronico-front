import { MapPin, Clock, CalendarClock, CheckSquare, Palmtree, ClipboardList, FileBarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: MapPin, title: "Geofence", desc: "Defina áreas permitidas para registro de ponto. Fora da área, o ponto é bloqueado." },
  { icon: Clock, title: "Banco de Horas", desc: "Cálculo automático de horas extras, compensações e saldo atualizado em tempo real." },
  { icon: CalendarClock, title: "Jornada Flexível", desc: "Configure jornadas diferentes por empresa, setor ou funcionário individual." },
  { icon: CheckSquare, title: "Aprovação de Ajustes", desc: "Funcionário solicita ajuste, gestor aprova ou rejeita. Tudo registrado e auditável." },
  { icon: Palmtree, title: "Férias e Afastamentos", desc: "Controle completo de férias, atestados e afastamentos integrado à folha de ponto." },
  { icon: ClipboardList, title: "Auditoria Completa", desc: "Cada ação gera um log permanente. Rastreabilidade total para fiscalizações." },
  { icon: FileBarChart, title: "Relatórios PDF/Excel", desc: "Relatórios mensais prontos para enviar ao contador com um clique." },
];

const FeaturesSection = () => (
  <section id="funcionalidades" className="py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Funcionalidades</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Tudo que sua empresa precisa em um só lugar
        </h2>
        <p className="text-muted-foreground text-lg">
          Um sistema completo de ponto eletrônico pensado para a realidade das empresas brasileiras.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {features.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
