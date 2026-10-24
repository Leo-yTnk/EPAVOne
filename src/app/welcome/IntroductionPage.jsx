import { AppLogo, Button, Card, Heading, Icon, Text } from '../../design-system/components/index.js';
import './introduction.css';

const steps = [
  {
    app: 'planner',
    number: '01',
    title: 'Planeje cada conversa.',
    copy: 'Organize sua semana, conheça seus clientes e escolha a próxima oportunidade.'
  },
  {
    app: 'insights',
    number: '02',
    title: 'Encontre a ideia certa.',
    copy: 'Explore produtos e receitas para oferecer algo que faça sentido para cada cliente.'
  },
  {
    app: 'writer',
    number: '03',
    title: 'Transforme em pedido.',
    copy: 'Anexe o formulário da semana, monte o pedido e confira tudo antes de enviar ao suporte.'
  }
];
export function IntroductionPage({ onComplete }) {
  return (
    <section className="introduction-page" aria-label="Introdução ao EPAVOne">
      <div className="introduction-heading">
        <AppLogo product="one" wordmark size="lg" />
        <Text as="p" className="ds-overline">
          Seu próximo atendimento começa aqui
        </Text>
        <Heading as="h1" display="large">
          Três apps.
          <br />
          Uma rotina mais leve.
        </Heading>
        <Text className="introduction-lead">
          Da primeira ideia ao pedido conferido, o EPAVOne acompanha cada etapa da sua experiência de vendas.
        </Text>
      </div>
      <ol className="introduction-steps">
        {steps.map((step) => (
          <li key={step.app}>
            <Card className="introduction-step" data-product={step.app}>
              <div className="introduction-step-top">
                <AppLogo product={step.app} wordmark />
                <span aria-hidden="true">{step.number}</span>
              </div>
              <Heading as="h2" level={3}>
                {step.title}
              </Heading>
              <Text size="sm">{step.copy}</Text>
            </Card>
          </li>
        ))}
      </ol>
      <div className="introduction-start">
        <Button size="lg" onClick={onComplete}>
          Começar minha experiência <Icon name="next" />
        </Button>
        <Text size="sm">Comece sem uma conta. Entre quando quiser salvar sua biblioteca.</Text>
        <Button variant="ghost" onClick={onComplete}>
          Já conheço o EPAVOne
        </Button>
      </div>
      <p className="introduction-footnote">O pedido final é baixado no Writer e enviado por você ao suporte do EPAV.</p>
    </section>
  );
}
