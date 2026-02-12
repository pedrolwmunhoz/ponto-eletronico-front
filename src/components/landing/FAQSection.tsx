import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "O ponto eletrônico digital tem validade jurídica?",
    a: "Sim. O PontoSeg utiliza assinatura digital e geolocalização em cada registro, garantindo validade jurídica perante a CLT e portarias do MTE. Seus registros são aceitos em fiscalizações e processos trabalhistas.",
  },
  {
    q: "Como o sistema previne fraude de ponto?",
    a: "Cada registro é vinculado à localização GPS do funcionário (geofence), possui assinatura digital única e é armazenado com controle de idempotência. É impossível registrar ponto fora da área autorizada ou duplicar registros.",
  },
  {
    q: "E se a fiscalização do trabalho aparecer na minha empresa?",
    a: "Com o PontoSeg, você gera relatórios completos em PDF em segundos. Todos os registros possuem trilha de auditoria e são rastreáveis. Sua empresa estará sempre preparada para qualquer fiscalização.",
  },
  {
    q: "Meu contador consegue usar os relatórios?",
    a: "Sim! O sistema gera relatórios mensais em PDF e Excel prontos para o fechamento da folha. Seu contador recebe os dados no formato que já conhece, sem precisar aprender nada novo.",
  },
  {
    q: "Os dados dos meus funcionários estão seguros?",
    a: "Totalmente. Utilizamos criptografia de ponta, servidores seguros e controle de acesso rigoroso. Seus dados nunca são compartilhados com terceiros e estão protegidos conforme a LGPD.",
  },
  {
    q: "Preciso instalar algum software?",
    a: "Não. O PontoSeg é 100% online. Basta acessar pelo navegador ou baixar o app para os funcionários. Sem instalação, sem manutenção, sem servidor local.",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
          Perguntas frequentes
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Tire suas dúvidas
        </h2>
      </div>
      <div className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map(({ q, a }, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-foreground">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </section>
);

export default FAQSection;
