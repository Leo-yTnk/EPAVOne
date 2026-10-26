import { Badge, Button, Card, Heading, Progress, SectionHeader } from '../../../design-system/components/index.js';
import { dateLabel, daysSince, lastInteraction, performance, priority, recommendations, today, weekStart } from '../models/planner.js';
import { PlanningGuide } from './PlanningGuide.jsx';
export function Overview({ state, week, busy, act }) {
  const metrics = performance(state, week);
  const next = week.queue.filter((entry) => !entry.outcome).sort((a, b) => Number(a.role === 'reserve') - Number(b.role === 'reserve'));
  const attention = state.customers
    .filter((customer) => {
      const elapsed = daysSince(lastInteraction(customer, state.interactions)?.date, today());
      return (
        elapsed === null ||
        elapsed >= 21 ||
        state.commitments.some((item) => item.customerId === customer.id && !item.done && item.due <= today())
      );
    })
    .slice(0, 4);
  const planned = new Set(week.queue.map((entry) => entry.customerId));
  const opportunities = state.customers
    .filter((customer) => !planned.has(customer.id) && recommendations(customer, state.offers).length)
    .map((customer) => ({ customer, score: priority(customer, state).score }))
    .sort((a, b) => b.score - a.score)
    .map(({ customer }) => customer)
    .slice(0, 3);
  return (
    <>
      <PlanningGuide state={state} week={week} />
      <Card className="planner-hero">
        <div>
          <span className="ds-overline">Quinta-feira · 9h30–10h30</span>
          <Heading display="small">O próximo passo tem nome.</Heading>
          <p className="planner-muted">Prepare o contexto, escute o cliente e transforme uma boa conversa em uma venda bem preenchida.</p>
          <Progress
            label="Meta da semana"
            value={metrics.attended}
            max={week.goal}
            formatValue={() => `${metrics.attended} de ${week.goal} atendimentos`}
          />
        </div>
        <div className="planner-hero-next">
          <Badge>{next.length ? 'Próximo da fila' : week.queue.length ? 'Fila concluída' : 'Semana ainda sem clientes'}</Badge>
          <Heading level={3}>
            {next.length ? state.customers.find((item) => item.id === next[0].customerId)?.name : 'Escolha sua próxima conversa'}
          </Heading>
          <p className="planner-muted">
            {next.length} clientes aguardando · {metrics.buyers} clientes compraram
          </p>
          <Button as="a" href={next.length && week.id === weekStart() ? `#/planner/atendimento/${next[0].customerId}` : '#/planner/semana'}>
            {next.length && week.id === weekStart() ? 'Iniciar atendimento' : 'Revisar semana'}
          </Button>
          {week.id !== weekStart() && (
            <p className="planner-muted">Você está revisando outra semana. Resultados são registrados apenas na semana atual.</p>
          )}
        </div>
      </Card>
      <div className="planner-two-columns">
        <Card className="planner-flow-card">
          <SectionHeader
            title="Próximas conversas"
            actions={
              <Button as="a" href="#/planner/semana" size="sm" variant="ghost">
                Ver fila
              </Button>
            }
          />
          {!next.length && <p className="planner-muted">Adicione clientes à semana para começar.</p>}
          <ol className="planner-simple-list">
            {next.slice(0, 4).map((entry, index) => {
              const customer = state.customers.find((item) => item.id === entry.customerId);
              return (
                <li key={customer.id}>
                  <span className="planner-position">{index + 1}</span>
                  <div>
                    <a href={`#/planner/clientes/${customer.id}`}>{customer.name}</a>
                    <p className="planner-muted">
                      {entry.role === 'reserve' ? 'Reserva' : 'Titular'} · {customer.preparation ? 'Preparado' : 'Preparação pendente'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
        <Card className="planner-flow-card">
          <SectionHeader title="Vale retomar o contato" description="Combinados vencendo, clientes sem contato ou distantes há 21 dias." />
          <ul className="planner-simple-list">
            {attention.map((customer) => (
              <li key={customer.id}>
                <div>
                  <a href={`#/planner/clientes/${customer.id}`}>{customer.name}</a>
                  <p className="planner-muted">Último contato: {dateLabel(lastInteraction(customer, state.interactions)?.date)}</p>
                </div>
              </li>
            ))}
          </ul>
          {!attention.length && <p>Todos os contatos estão em dia.</p>}
        </Card>
      </div>
      <Card className="planner-flow-card">
        <SectionHeader
          title="Amplie a cobertura"
          actions={
            <Button as="a" href="#/planner/oportunidades" size="sm" variant="ghost">
              Ver oportunidades
            </Button>
          }
        />
        <p className="planner-muted">Clientes com sugestões compatíveis que ainda não entraram na semana.</p>
        <div className="planner-opportunity-list">
          {opportunities.map((customer) => (
            <div key={customer.id} className="planner-offer">
              <div>
                <a href={`#/planner/clientes/${customer.id}`}>
                  <strong>{customer.name}</strong>
                </a>
                <p className="planner-muted">{recommendations(customer, state.offers)[0].reason}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => act({ type: 'add', weekId: week.id, customerId: customer.id }, 'Cliente adicionado à semana.')}
              >
                Adicionar à semana
              </Button>
            </div>
          ))}
        </div>
        {!opportunities.length && (
          <p className="planner-muted">Clientes compatíveis já estão planejados. Consulte a carteira para ampliar a preparação.</p>
        )}
      </Card>
    </>
  );
}
