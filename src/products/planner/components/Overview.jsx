import { IntelligenceBrief } from './IntelligenceBrief.jsx';
import { useIntelligence } from '../hooks/useIntelligence.js';
import { Badge, Button, Card, EmptyState, Heading, Progress, SectionHeader, SummaryList } from '../../../design-system/components/index.js';
import { dateLabel, performance, today } from '../models/planner.js';
import { attendanceLink, contactDue, nextAction, orderedQueue, pendingCommitments, preparationLink } from '../models/workspace.js';

export function Overview({ state, week }) {
  const metrics = performance(state, week);
  const intelligence = useIntelligence();
  const urgent = intelligence?.ranked.find((r) => r.due);
  const fallback = nextAction(state, week);
  const action = urgent
    ? { title: urgent.name, description: urgent.reason, label: urgent.action.label, href: urgent.action.href }
    : fallback;
  const next = orderedQueue(week)
    .filter((entry) => !entry.outcome)
    .slice(0, 4);
  const pending = pendingCommitments(state);
  const due = pending.filter((item) => item.due <= today());
  const attention = (
    intelligence
      ? intelligence.ranked
          .filter((r) => !r.deferred && !r.completed && r.score !== null)
          .map((r) => state.customers.find((c) => c.id === r.customerId))
      : state.customers
  )
    .filter((customer) => contactDue(customer, state))
    .slice(0, 3);
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(new Date())
  );
  return (
    <>
      <Card className="planner-hero">
        <div>
          <span className="ds-overline">{hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'} · seu próximo passo</span>
          <Heading display="small">{action.title}</Heading>
          <p className="planner-muted">{action.description}</p>
          <div>
            <Button as="a" href={action.href}>
              {action.label}
            </Button>
          </div>
          {!state.customers.length && (
            <p className="planner-muted">Depois: escolha quem atender na Semana e registre o resultado da conversa.</p>
          )}
        </div>
        <div>
          <SectionHeader
            size="sm"
            title="Sua semana"
            actions={
              <Button as="a" size="sm" variant="ghost" href="#/planner/semana">
                Organizar
              </Button>
            }
          />
          <Progress
            label="Meta de atendimentos"
            value={metrics.attended}
            max={week.goal}
            formatValue={() => `${metrics.attended} de ${week.goal}`}
          />
          <SummaryList
            items={[
              { label: 'Na fila', value: week.queue.filter((item) => !item.outcome).length },
              {
                label: 'Preparados',
                value: week.queue.filter(
                  (entry) => !entry.outcome && state.customers.find((c) => c.id === entry.customerId)?.preparation.trim()
                ).length
              },
              { label: 'Retornos até hoje', value: due.length }
            ]}
          />
        </div>
      </Card>
      <IntelligenceBrief />
      <div className="planner-two-columns">
        <Card className="planner-flow-card">
          <SectionHeader
            title="Próximas conversas"
            actions={
              <Button as="a" href="#/planner/semana" variant="ghost" size="sm">
                Ver semana
              </Button>
            }
          />
          {next.length ? (
            <ol className="planner-simple-list">
              {next.map((entry, index) => {
                const customer = state.customers.find((item) => item.id === entry.customerId);
                return (
                  <li key={customer.id}>
                    <span className="planner-position">{index + 1}</span>
                    <div>
                      <a href={customer.preparation.trim() ? attendanceLink(customer.id) : preparationLink(customer.id)}>{customer.name}</a>
                      <p className="planner-muted">
                        {entry.role === 'reserve' ? 'Reserva' : 'Titular'} ·{' '}
                        {customer.preparation.trim() ? 'Abordagem pronta' : 'Preparar conversa'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState
              title="Sua próxima conversa começa aqui"
              description="Escolha clientes na carteira para montar a fila."
              actionLabel="Escolher clientes"
              onAction={() => {
                window.location.hash = '#/planner/clientes';
              }}
            />
          )}
        </Card>
        <Card className="planner-flow-card">
          <SectionHeader
            title="Combinados e retornos"
            actions={due.length ? <Badge tone="warning">{due.length} até hoje</Badge> : undefined}
          />
          <ul className="planner-simple-list">
            {pending.slice(0, 4).map((item) => (
              <li key={item.id}>
                <div>
                  <a href={`#/planner/clientes/${item.customerId}/combinados`}>
                    {state.customers.find((c) => c.id === item.customerId)?.name}
                  </a>
                  <p>{item.text}</p>
                  <p className="planner-muted">
                    {dateLabel(item.due)}
                    {item.due < today() ? ' · Pendente' : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {!pending.length && <p className="planner-muted">Nenhum combinado em aberto. Os próximos retornos aparecerão aqui.</p>}
        </Card>
      </div>
      <Card className="planner-flow-card">
        <SectionHeader
          title="Vale retomar o contato"
          description="Pela frequência desejada de cada cliente."
          actions={
            <Button as="a" variant="ghost" size="sm" href="#/planner/clientes/oportunidades">
              Explorar oportunidades
            </Button>
          }
        />
        <div className="planner-contact-strip">
          {attention.map((customer) => (
            <div key={customer.id}>
              <a href={`#/planner/clientes/${customer.id}`}>{customer.name}</a>
              <p className="planner-muted">{customer.intent ? 'Intenção de compra registrada' : 'Converse para atualizar o contexto'}</p>
            </div>
          ))}
        </div>
        {!attention.length && <p className="planner-muted">Contatos em dia.</p>}
      </Card>
    </>
  );
}
