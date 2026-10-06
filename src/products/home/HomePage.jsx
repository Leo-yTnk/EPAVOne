import './home.css';
import { Badge, Button, Card, Heading, Text, Icon } from '../../design-system/components/index.js';

const apps = [
  {
    href: '#/insights',
    theme: 'insights',
    glyph: 'insights',
    name: 'Insights',
    task: 'O que sugerir ao cliente?',
    summary: 'Explore receitas e produtos Swift para montar uma sugestão que combine com a ocasião.',
    action: 'Explorar o Insights',
    links: [
      { label: 'Receitas', href: '#/insights/receitas' },
      { label: 'Produtos', href: '#/insights/produtos' }
    ]
  },
  {
    href: '#/planner',
    theme: 'planner',
    glyph: 'planner',
    name: 'Planner',
    task: 'Organize sua próxima semana.',
    summary: 'O espaço para planejar atendimentos, acompanhar metas e priorizar clientes está em construção.',
    action: 'Ver o Planner',
    upcoming: true,
    links: []
  },
  {
    href: '#/writer',
    theme: 'writer',
    glyph: 'writer',
    name: 'Writer',
    task: 'Vamos preparar o pedido?',
    summary: 'Carregue o formulário da semana, escolha os produtos e confira cada etapa antes de exportar.',
    action: 'Abrir o Writer',
    links: [{ label: 'Preparar formulário', href: '#/writer' }]
  }
];

export function HomePage() {
  return (
    <div className="one-home">
      <section className="one-welcome" aria-labelledby="one-home-title">
        <div>
          <span className="ds-overline eyebrow">Seu ponto de partida</span>
          <Heading as="h1" id="one-home-title" display="medium">
            Uma semana de vendas.
            <br />
            <em>Tudo no mesmo lugar.</em>
          </Heading>
          <Text>
            Encontre uma ideia para o cliente, prepare o pedido e siga com o atendimento. Seus apps estão sempre disponíveis na navegação.
          </Text>
        </div>
        <div className="one-welcome-actions">
          <Button as="a" href="#/writer">
            Preparar um pedido ↗
          </Button>
          <Button as="a" href="#/insights/receitas" variant="ghost">
            Buscar inspiração →
          </Button>
        </div>
      </section>
      <section className="home-tools" aria-labelledby="one-apps-title">
        <div className="one-section-heading">
          <Heading as="h2" id="one-apps-title" level={3}>
            Por onde vamos começar?
          </Heading>
          <Text size="sm">Inspire no Insights, organize no Planner e prepare no Writer.</Text>
        </div>
        <ol className="product-flow">
          {apps.map((app, index) => (
            <Card as="li" key={app.name} className="product-flow-step" data-product={app.theme}>
              <span className="product-step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <div className="product-step-content">
                <div className="product-card-top">
                  <span className="product-glyph" aria-hidden="true">
                    <Icon name={app.glyph} />
                  </span>
                  <span className="ds-overline">EPAV{app.name}</span>
                  {app.upcoming && <Badge>Em desenvolvimento</Badge>}
                </div>
                <Heading as="h3" level={4}>
                  {app.task}
                </Heading>
                <Text size="sm">{app.summary}</Text>
                <Button as="a" href={app.href} variant="secondary" size="sm">
                  {app.action} →
                </Button>
                {app.links.length > 0 && (
                  <nav className="product-shortcuts" aria-label={`Atalhos do ${app.name}`}>
                    {app.links.map((link) => (
                      <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm">
                        {link.label}
                      </Button>
                    ))}
                  </nav>
                )}
              </div>
            </Card>
          ))}
        </ol>
      </section>
      <Card as="section" className="one-week-note" aria-label="Antes de começar">
        <Heading as="h2" level={5}>
          Tenha o formulário da semana em mãos.
        </Heading>
        <Text size="sm">
          Ele confirma os produtos disponíveis, os preços e as condições do pedido. Use o Insights para sugerir e o Writer para preencher e
          conferir.
        </Text>
        <Button as="a" href="#/writer" variant="ghost" size="sm">
          Carregar no Writer →
        </Button>
      </Card>
    </div>
  );
}
