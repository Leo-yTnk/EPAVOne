import './home.css';
import { useState } from 'preact/hooks';
import { useForegroundInterval } from '../../design-system/behaviors/useForegroundInterval.js';
import { getDayPeriod } from './dayPeriod.js';
import { Button, Card, Heading, Text, Icon, AppLogo } from '../../design-system/components/index.js';

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
    summary: 'Planeje sua semana, conheça seus clientes e acompanhe as metas para chegar mais preparado a cada conversa.',
    action: 'Ver o Planner',
    links: [
      { label: 'Minha semana', href: '#/planner/semana' },
      { label: 'Meus clientes', href: '#/planner/clientes' }
    ]
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

export function HomePage({ preferences = {} }) {
  const [now, setNow] = useState(() => new Date());
  useForegroundInterval(() => setNow(new Date()), 30_000);
  const period = getDayPeriod(now);
  const primary = apps.find((app) => app.theme === preferences.homeAction) || apps[1];
  const name = preferences.displayName?.trim();
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  return (
    <div className="one-home" data-period={period.key} data-background={preferences.homeBackground || 'adaptive'}>
      <section className="one-welcome" aria-labelledby="one-home-title">
        <div className="one-welcome-copy">
          <span className="ds-overline eyebrow">
            <Icon name={period.icon} />
            {period.label}
          </span>
          <Text size="sm">
            <time dateTime={now.toISOString()}>{dateLabel}</time> · Horário local
          </Text>
          <Heading as="h1" id="one-home-title" display="medium">
            {period.greeting}
            {name ? `, ${name}` : ''}.
            <br />
            <em>Que bom ter você por aqui.</em>
          </Heading>
          <Text>Seu espaço para transformar boas conversas em oportunidades. Vamos dar o próximo passo juntos?</Text>
          <div className="one-welcome-actions">
            <Button as="a" href={primary.href}>
              {primary.action} <Icon name="next" />
            </Button>
            <Button as="a" href="#/settings" variant="ghost">
              <Icon name="settings" />
              Deixar do meu jeito
            </Button>
          </div>
        </div>
        {preferences.showInspiration !== false && (
          <div className="one-inspiration">
            <Icon name={period.icon} size="2rem" />
            <Heading as="h2" display="small">
              {period.title}
            </Heading>
            <Text size="sm">{period.message}</Text>
          </div>
        )}
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
              <div className="product-flow-layout">
                <span className="product-step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <div className="product-step-content">
                  <div className="product-card-top">
                    <AppLogo product={app.theme} wordmark size="lg" />
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
              </div>
            </Card>
          ))}
        </ol>
      </section>
      {preferences.showWeeklyReminder !== false && (
        <Card as="section" className="one-week-note" aria-label="Antes de começar">
          <div className="one-week-note-content">
            <Heading as="h2" level={5}>
              Tenha o formulário da semana em mãos.
            </Heading>
            <Text size="sm">
              Ele confirma os produtos disponíveis, os preços e as condições do pedido. Use o Insights para sugerir e o Writer para
              preencher e conferir.
            </Text>
            <Button as="a" href="#/writer" variant="ghost" size="sm">
              Carregar no Writer →
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
