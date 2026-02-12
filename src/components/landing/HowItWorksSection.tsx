import { UserPlus, Users, Fingerprint, Cpu, FileDown } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Crie sua conta grátis", desc: "Cadastro em menos de 2 minutos. Sem cartão de crédito." },
  { icon: Users, title: "Cadastre seus funcionários", desc: "Adicione sua equipe e configure as jornadas de trabalho." },
  { icon: Fingerprint, title: "Funcionários batem ponto", desc: "Pelo app do celular ou pelo terminal de ponto na empresa." },
  { icon: Cpu, title: "Cálculo automático", desc: "Horas extras, banco de horas e faltas calculados em tempo real." },
  { icon: FileDown, title: "Baixe relatórios prontos", desc: "PDF e Excel mensais prontos para enviar ao contador." },
];

const HowItWorksSection = () => (
  <section id="como-funciona" className="py-16 md:py-24 bg-muted/40">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Como funciona</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Simples de usar, poderoso para proteger
        </h2>
        <p className="text-muted-foreground text-lg">
          Em 5 passos sua empresa está protegida contra processos trabalhistas.
        </p>
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-8">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="flex gap-6 items-start">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px h-full min-h-[2rem] bg-border mt-2" />
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
