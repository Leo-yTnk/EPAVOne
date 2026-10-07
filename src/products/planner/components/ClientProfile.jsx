import { useState } from 'preact/hooks';
import { Badge, Button, Card, Checkbox, Heading, Input, Textarea } from '../../../design-system/components/index.js';
import { dateLabel, lastInteraction, money, OUTCOMES, today } from '../models/planner.js';
import { PriorityDetails } from './PriorityDetails.jsx';
import { OfferList } from './OfferList.jsx';
export function ClientProfile({ customer, state, week, act, busy, onEdit }) {
  const [preparation, setPreparation] = useState(customer.preparation);
  const [text, setText] = useState('');
  const [due, setDue] = useState(today());
  const history = state.interactions.filter((item) => item.customerId === customer.id).sort((a, b) => b.date.localeCompare(a.date));
  const purchases = history.filter((item) => item.outcome === 'bought');
  const measured = purchases.filter((item) => Number.isInteger(item.amountCents));
  const commitments = state.commitments.filter((item) => item.customerId === customer.id);
  const planned = week.queue.some((entry) => entry.customerId === customer.id);
  const returnTo = `#/planner/clientes/${customer.id}`;
  async function commit(event) {
    event.preventDefault();
    if (await act({ type: 'commitment', customerId: customer.id, text, due }, 'Combinado registrado.')) setText('');
  }
  return (
    <>
      <div className="planner-section-head">
        <Button as="a" href="#/planner/clientes" variant="ghost">
          ← Carteira
        </Button>
        <Button variant="secondary" onClick={onEdit}>
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
            {customer.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
        <div>
          <PriorityDetails customer={customer} state={state} />
          <dl className="planner-facts">
            <div>
              <dt>Último contato</dt>
              <dd>{dateLabel(lastInteraction(customer, state.interactions)?.date)}</dd>
            </div>
            <div>
              <dt>Última compra</dt>
              <dd>{dateLabel(purchases[0]?.date)}</dd>
            </div>
            <div>
              <dt>Compras registradas</dt>
              <dd>{purchases.length}</dd>
            </div>
            <div>
              <dt>Ticket médio conhecido</dt>
              <dd>
                {measured.length
                  ? money(Math.round(measured.reduce((sum, item) => sum + item.amountCents, 0) / measured.length))
                  : 'Sem valores registrados'}
              </dd>
            </div>
          </dl>
        </div>
      </Card>
      <div className="planner-two-columns">
        <Card className="planner-flow-card">
          <Heading level={3}>Preparar a conversa</Heading>
          <dl className="planner-facts">
            <div>
              <dt>Preferências</dt>
              <dd>{customer.preferences.join(', ') || 'Ainda não informadas'}</dd>
            </div>
            <div>
              <dt>Restrições</dt>
              <dd>{customer.restrictions.join(', ') || 'Nenhuma registrada · confirme com o cliente'}</dd>
            </div>
          </dl>
          <p className="planner-muted">Sugestão: pergunte sobre a rotina, confirme restrições e relacione um principal a um complemento.</p>
          <Textarea
            id="planner-preparation"
            label="Sua abordagem"
            maxLength={4000}
            rows={4}
            value={preparation}
            onInput={(event) => setPreparation(event.currentTarget.value)}
          />
          <div className="ds-inline">
            <Button
              loading={busy}
              disabled={preparation === customer.preparation}
              onClick={() => act({ type: 'customer', customer: { ...customer, preparation } }, 'Abordagem salva.')}
            >
              Salvar preparação
            </Button>
            <Button
              variant="secondary"
              disabled={busy || planned}
              onClick={() => act({ type: 'add', customerId: customer.id, weekId: week.id }, 'Cliente adicionado à semana.')}
            >
              {planned ? 'Na semana' : 'Adicionar à semana'}
            </Button>
            {planned && (
              <Button as="a" href={`#/planner/atendimento/${customer.id}`}>
                Atender
              </Button>
            )}
          </div>
        </Card>
        <Card className="planner-flow-card">
          <Heading level={3}>Combinados e observações</Heading>
          <p>{customer.notes || 'Nenhuma observação registrada.'}</p>
          {commitments.length ? (
            <ul className="planner-commitments">
              {commitments.map((item) => (
                <li key={item.id}>
                  <Checkbox
                    disabled={busy}
                    checked={item.done}
                    onChange={() => act({ type: 'resolve', customerId: customer.id, id: item.id }, 'Combinado atualizado.')}
                  >
                    {item.text} · {dateLabel(item.due)}
                  </Checkbox>
                </li>
              ))}
            </ul>
          ) : (
            <p className="planner-muted">Nenhum combinado pendente.</p>
          )}
          <form className="planner-form" onSubmit={commit}>
            <Input
              id="planner-promise"
              label="Novo combinado"
              maxLength={1000}
              required
              value={text}
              onInput={(event) => setText(event.currentTarget.value)}
            />
            <Input
              id="planner-promise-date"
              label="Retomar em"
              type="date"
              required
              value={due}
              onInput={(event) => setDue(event.currentTarget.value)}
            />
            <Button variant="secondary" type="submit" loading={busy}>
              Registrar combinado
            </Button>
          </form>
        </Card>
      </div>
      <Card className="planner-flow-card">
        <Heading level={3}>Principais e complementos</Heading>
        <p className="planner-muted">
          Ideias demonstrativas de abordagem. Preço, estoque e disponibilidade pertencem ao catálogo e ao Excel.
        </p>
        <OfferList customer={customer} state={state} weekId={week.id} returnTo={returnTo} />
      </Card>
      <Card className="planner-flow-card">
        <Heading level={3}>Histórico do relacionamento</Heading>
        {!history.length ? (
          <p className="planner-muted">O primeiro atendimento inicia esta timeline.</p>
        ) : (
          <ol className="planner-timeline">
            {history.map((item) => (
              <li key={item.id}>
                <time dateTime={item.date}>{dateLabel(item.date)}</time>
                <div>
                  <strong>{OUTCOMES[item.outcome]}</strong>
                  <p>{item.note || 'Sem observação adicional.'}</p>
                  {item.outcome === 'bought' && (
                    <span className="planner-muted">
                      {Number.isInteger(item.amountCents) ? `${money(item.amountCents)} · ${item.units} unidades` : 'Valor não registrado'}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
