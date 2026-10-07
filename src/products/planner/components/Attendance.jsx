import { useState } from 'preact/hooks';
import { Alert, Badge, Button, Card, EmptyState, Heading, Input, Select, Textarea } from '../../../design-system/components/index.js';
import { dateLabel, lastInteraction, OUTCOMES, today, weekStart } from '../models/planner.js';
import { commercialContext } from '../../../shared/services/commercialContext.js';
import { useCommercialContext } from '../../../shared/services/useCommercialContext.js';
import { OfferList } from './OfferList.jsx';
export function Attendance({ state, week, customerId, act, busy }) {
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [followUp, setFollowUp] = useState(today());
  const context = useCommercialContext();
  const queue = [...week.queue].sort((a, b) => Number(a.role === 'reserve') - Number(b.role === 'reserve'));
  const entry = customerId ? queue.find((item) => item.customerId === customerId) : queue.find((item) => !item.outcome);
  const customer = state.customers.find((item) => item.id === entry?.customerId);
  if (week.id !== weekStart())
    return (
      <EmptyState
        title="Atendimento disponível na semana atual"
        description="Selecione a semana atual para registrar uma conversa. Outras semanas permanecem disponíveis para planejamento e consulta."
      />
    );
  if (!customer || entry.outcome)
    return (
      <EmptyState
        title={entry?.outcome ? 'Atendimento já registrado' : 'Nenhum cliente aguardando'}
        description="Confira a semana para retomar a fila ou adicionar um novo cliente."
        actionLabel="Ver semana"
        onAction={() => {
          window.location.hash = '#/planner/semana';
        }}
      />
    );
  const pending = state.commitments.filter((item) => item.customerId === customer.id && !item.done);
  const returnTo = `#/planner/atendimento/${customer.id}`;
  function handoff() {
    commercialContext.begin({ customerId: customer.id, customerName: customer.name, weekId: week.id, returnTo });
  }
  async function finish(event) {
    event.preventDefault();
    const saved = await act(
      {
        type: 'outcome',
        customerId: customer.id,
        weekId: week.id,
        outcome,
        note,
        amountCents: Math.round(Number(amount.replace(',', '.')) * 100),
        units: Number(units),
        followUp
      },
      'Resultado registrado. Próximo cliente pronto.'
    );
    if (!saved) return;
    const next = queue.find((item) => !item.outcome && item.customerId !== customer.id);
    commercialContext.clear();
    window.location.hash = next ? `#/planner/atendimento/${next.customerId}` : '#/planner/semana';
  }
  return (
    <>
      <div className="planner-section-head">
        <Button as="a" variant="ghost" href="#/planner/semana">
          ← Voltar à fila
        </Button>
        <Badge>
          Cliente {queue.indexOf(entry) + 1} de {queue.length} · {entry.role === 'reserve' ? 'Reserva' : 'Titular'}
        </Badge>
      </div>
      <Card className="planner-profile">
        <div>
          <span className="ds-overline">Em atendimento · {customer.position || 'Sem posição'}</span>
          <Heading display="small">{customer.name}</Heading>
          <p>{customer.context || 'Pergunte sobre a rotina e confirme as preferências.'}</p>
        </div>
        <dl className="planner-facts">
          <div>
            <dt>Último contato</dt>
            <dd>{dateLabel(lastInteraction(customer, state.interactions)?.date)}</dd>
          </div>
          <div>
            <dt>Restrições</dt>
            <dd>{customer.restrictions.join(', ') || 'Confirme antes de oferecer'}</dd>
          </div>
          <div>
            <dt>Preferências</dt>
            <dd>{customer.preferences.join(', ') || 'Ainda não informadas'}</dd>
          </div>
        </dl>
      </Card>
      <div className="planner-two-columns">
        <Card className="planner-flow-card">
          <Heading level={3}>Conversa preparada</Heading>
          <p>{customer.preparation || 'Preparação pendente: comece perguntando o que o cliente precisa nesta semana.'}</p>
          <Heading level={5}>Combinados</Heading>
          {pending.length ? (
            <ul>
              {pending.map((item) => (
                <li key={item.id}>
                  {item.text} · {dateLabel(item.due)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="planner-muted">Nenhum combinado em aberto.</p>
          )}
          <div className="ds-inline">
            <Button as="a" href={`#/planner/clientes/${customer.id}`} variant="secondary">
              Ver perfil completo
            </Button>
            <Button as="a" href="#/writer" onClick={handoff}>
              Criar pedido no Writer
            </Button>
          </div>
          {context?.customerId === customer.id && context.orderStatus === 'exported' && (
            <Alert tone="info" title="Formulário gerado no Writer">
              Confirme a compra e registre o resultado abaixo. A exportação não confirma envio ou venda.
            </Alert>
          )}
        </Card>
        <Card className="planner-flow-card">
          <Heading level={3}>Registrar e seguir</Heading>
          <form className="planner-form" onSubmit={finish}>
            <Select
              label="Resultado do atendimento"
              value={outcome}
              options={[
                { value: '', label: 'Escolha um resultado' },
                ...Object.entries(OUTCOMES).map(([value, label]) => ({ value, label }))
              ]}
              onChange={setOutcome}
            />
            {outcome === 'bought' && (
              <div className="planner-two-columns">
                <Input
                  id="planner-sale-amount"
                  label="Valor da compra (R$)"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onInput={(event) => setAmount(event.currentTarget.value)}
                />
                <Input
                  id="planner-sale-units"
                  label="Total de unidades"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={units}
                  onInput={(event) => setUnits(event.currentTarget.value)}
                />
              </div>
            )}
            {outcome === 'later' && (
              <Input
                id="planner-followup"
                label="Data do retorno"
                type="date"
                required
                min={today()}
                value={followUp}
                onInput={(event) => setFollowUp(event.currentTarget.value)}
              />
            )}
            <Textarea
              id="planner-outcome-note"
              label="O que aprender com a conversa?"
              placeholder="Objeção, próximo passo ou detalhe útil"
              rows={3}
              maxLength={4000}
              value={note}
              onInput={(event) => setNote(event.currentTarget.value)}
            />
            <Button type="submit" loading={busy} disabled={!outcome}>
              {outcome === 'bought' && state.sales ? 'Confirmar compra e registrar venda' : 'Salvar e próximo cliente'}
            </Button>
          </form>
        </Card>
      </div>
      <Card className="planner-flow-card">
        <Heading level={3}>Ideias para oferecer</Heading>
        <p className="planner-muted">Consulte o produto no Insights e retorne à mesma conversa.</p>
        <OfferList customer={customer} state={state} weekId={week.id} returnTo={returnTo} />
      </Card>
    </>
  );
}
