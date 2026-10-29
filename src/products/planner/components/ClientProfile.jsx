import { useIntelligence } from '../hooks/useIntelligence.js';
import { Badge, Button, Card, Heading, SectionHeader, SummaryList, Tabs } from '../../../design-system/components/index.js';
import { dateLabel, lastInteraction, money, OUTCOMES, weekStart } from '../models/planner.js';
import { attendanceLink } from '../models/workspace.js';
import { PriorityDetails } from './PriorityDetails.jsx';
import { OfferList } from './OfferList.jsx';
import { ClientPreparation } from './ClientPreparation.jsx';
import { ClientCommitments } from './ClientCommitments.jsx';

export function ClientProfile({ customer, state, week, act, busy, onEdit, onDelete, tab = 'preparar' }) {
  const intelligence = useIntelligence();
  const opportunity = intelligence?.byId.get(customer.id);
  const history = state.interactions.filter((item) => item.customerId === customer.id).sort((a, b) => b.date.localeCompare(a.date));
  const purchases = history.filter((item) => item.outcome === 'bought');
  const measured = purchases.filter((item) => Number.isInteger(item.amountCents));
  const entry = week.queue.find((item) => item.customerId === customer.id);
  const returnTo = `#/planner/clientes/${customer.id}/${tab}`;
  const props = { customer, state, week, act, busy };
  const selected = ['preparar', 'combinados', 'historico', 'oportunidades'].includes(tab) ? tab : 'preparar';
  return (
    <>
      <div className="planner-section-head">
        <Button as="a" href="#/planner/clientes" variant="ghost">
          ← Carteira
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onEdit}>
          Editar perfil
        </Button>
      </div>
      <Card className="planner-profile">
        <div>
          <span className="ds-overline">
            {customer.segment} · {customer.position || 'Sem posição'}
          </span>
          <Heading display="small">{customer.name}</Heading>
          <p>{customer.context || 'Registre o contexto para conversar com mais segurança.'}</p>
          <div className="ds-inline">
            {customer.intent && <Badge>Quer comprar</Badge>}
            {customer.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
        <div>
          <SectionHeader size="sm" title="Próximo passo" />
          <p className="planner-muted">
            {entry?.outcome
              ? `Atendimento registrado: ${OUTCOMES[entry.outcome]}`
              : entry
                ? 'Na fila desta semana. Prepare a abordagem e converse.'
                : 'Adicione à semana quando quiser planejar uma conversa.'}
          </p>
          {!entry ? (
            <Button
              disabled={busy}
              onClick={() => act({ type: 'add', customerId: customer.id, weekId: week.id }, 'Cliente adicionado à semana.')}
            >
              Adicionar à semana
            </Button>
          ) : !entry.outcome && week.id === weekStart() ? (
            <Button as="a" href={attendanceLink(customer.id)}>
              Atender
            </Button>
          ) : (
            <Button as="a" variant="secondary" href="#/planner/semana">
              Ver semana
            </Button>
          )}
          {opportunity && <p className="planner-muted">{opportunity.reason}</p>}
          <PriorityDetails customer={customer} state={state} />
          <p className="planner-muted">Último contato: {dateLabel(lastInteraction(customer, state.interactions)?.date)}</p>
        </div>
      </Card>
      <Tabs
        label="Informações do cliente"
        value={selected}
        onChange={(value) => {
          window.location.hash = `#/planner/clientes/${customer.id}/${value}`;
        }}
        items={[
          { value: 'preparar', label: 'Preparar' },
          { value: 'combinados', label: 'Combinados' },
          { value: 'historico', label: 'Histórico' },
          { value: 'oportunidades', label: 'Oportunidades' }
        ]}
      />
      {selected === 'preparar' && <ClientPreparation key={customer.id} {...props} />}
      {selected === 'combinados' && <ClientCommitments key={customer.id} {...props} />}
      {selected === 'oportunidades' && (
        <Card className="planner-flow-card">
          <SectionHeader
            title="Ideias para este cliente"
            description="Sugestões de abordagem. Confira preço, estoque e disponibilidade no catálogo e no Excel."
          />
          <OfferList customer={customer} state={state} weekId={week.id} returnTo={returnTo} />
        </Card>
      )}
      {selected === 'historico' && (
        <Card className="planner-flow-card">
          <SectionHeader title="Histórico do relacionamento" />
          {!history.length ? (
            <p className="planner-muted">O primeiro atendimento inicia este histórico.</p>
          ) : (
            <ol className="planner-timeline">
              {history.map((item) => (
                <li key={item.id}>
                  <time dateTime={item.date}>{dateLabel(item.date)}</time>
                  <div>
                    <strong>{OUTCOMES[item.outcome]}</strong>
                    <p>{item.note || 'Sem observação adicional.'}</p>
                    {item.outcome === 'bought' && (
                      <p className="planner-muted">
                        {Number.isInteger(item.amountCents)
                          ? `${money(item.amountCents)} · ${item.units} unidades · registro histórico`
                          : 'Valor não registrado'}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
          <SummaryList
            items={[
              { label: 'Última compra', value: dateLabel(purchases[0]?.date) },
              { label: 'Compras no histórico', value: purchases.length },
              {
                label: 'Ticket conhecido no histórico',
                value: measured.length
                  ? money(Math.round(measured.reduce((sum, item) => sum + item.amountCents, 0) / measured.length))
                  : 'Sem valores registrados'
              }
            ]}
          />
          <p className="planner-muted">Valores dos atendimentos históricos. Consulte os registros de vendas em Pedidos.</p>
        </Card>
      )}
      <details className="planner-details">
        <summary>Mais sobre este cliente</summary>
        <Card className="planner-flow-card">
          <SectionHeader title="Informações complementares" size="sm" />
          <p>{customer.notes || 'Nenhuma observação registrada.'}</p>
          <p className="planner-muted">Frequência desejada: {customer.frequencyDays} dias</p>
          <div>
            <Button variant="danger" disabled={busy} onClick={onDelete}>
              Excluir cliente
            </Button>
          </div>
        </Card>
      </details>
    </>
  );
}
