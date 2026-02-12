import { FileSpreadsheet, BookOpen, Calculator, Scale, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Planilha de Excel",
    desc: "Fácil de adulterar, sem validade jurídica. Não protege em processos.",
  },
  {
    icon: BookOpen,
    title: "Livro ponto manual",
    desc: "Letra ilegível, rasuras. O fiscal descarta em segundos.",
  },
  {
    icon: Calculator,
    title: "Erros de cálculo",
    desc: "Horas extras e banco de horas na mão geram passivos milionários.",
  },
  {
    icon: Scale,
    title: "Falta de prova jurídica",
    desc: "Sem assinatura digital, sua empresa perde 9 em 10 processos de jornada.",
  },
  {
    icon: Search,
    title: "Risco em fiscalizações",
    desc: "MTE pode multar em até R$ 4.000 por funcionário irregular.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-destructive uppercase tracking-wider mb-2">
            Atenção, empresário
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sua empresa pode estar correndo riscos agora mesmo
          </h2>
          <p className="text-muted-foreground text-lg">
            A maioria das empresas brasileiras ainda usa métodos ultrapassados que não protegem contra
            processos trabalhistas.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {problems.map(({ icon: Icon, title, desc }) => (
            <Card
              key={title}
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] border-destructive/20 bg-card hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-destructive" />
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
}
