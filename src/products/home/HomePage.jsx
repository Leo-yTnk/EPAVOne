import './home.css';
import { Badge, Button, Card, Heading, Text } from '../../design-system/components/index.js';

const apps = [
  {
    href: '#/insights',
    theme: 'insights',
    glyph: '↗',
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
    href: '#/writer',
    theme: 'writer',
    glyph: '✎',
    name: 'Writer',
    task: 'Vamos preparar o pedido?',
    summary: 'Carregue o formulário da semana, escolha os produtos e confira cada etapa antes de exportar.',
    action: 'Abrir o Writer',
    links: [{ label: 'Preparar formulário', href: '#/writer' }]
  },
  {
    href: '#/planner',
    theme: 'one',
    glyph: '▦',
    name: 'Planner',
    task: 'Organize sua próxima semana.',
    summary: 'O espaço para planejar atendimentos, acompanhar metas e priorizar clientes está em construção.',
    action: 'Ver o Planner',
    upcoming: true,
    links: []
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
          <Text>Encontre uma ideia para o cliente, prepare o pedido e siga com o atendimento. Seus apps estão sempre nas abas acima.</Text>
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
          <Text size="sm">Um app para cada momento do atendimento.</Text>
        </div>
        <div className="product-grid">
          {apps.map((app) => (
            <Card key={app.name} className="product-card" data-product={app.theme}>
              <div className="product-card-top">
                <span className="product-glyph" aria-hidden="true">
                  {app.glyph}
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
            </Card>
          ))}
        </div>
      </section>
      <section className="one-week-note" aria-label="Antes de começar">
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
      </section>
    </div>
  );
}
