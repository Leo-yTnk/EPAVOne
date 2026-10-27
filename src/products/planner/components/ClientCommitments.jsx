import { useState } from 'preact/hooks';
import { Button, Card, Checkbox, FieldGrid, Input, SectionHeader } from '../../../design-system/components/index.js';
import { dateLabel, today } from '../models/planner.js';

export function ClientCommitments({ customer, state, week, act, busy }) {
  const [text, setText] = useState('');
  const [due, setDue] = useState(today());
  const commitments = state.commitments
    .filter((item) => item.customerId === customer.id)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));
  async function commit(event) {
    event.preventDefault();
    if (await act({ type: 'commitment', customerId: customer.id, text, due, weekId: week.id }, 'Combinado registrado.')) setText('');
  }
  return (
    <Card className="planner-flow-card">
      <SectionHeader title="Combinados e retornos" />
      {commitments.length ? (
        <ul className="planner-commitments">
          {commitments.map((item) => (
            <li key={item.id}>
              <Checkbox
                disabled={busy}
                checked={item.done}
                onChange={() => act({ type: 'resolve', customerId: customer.id, id: item.id, weekId: week.id }, 'Combinado atualizado.')}
              >
                {item.text} · {dateLabel(item.due)}
                {!item.done && item.due < today() ? ' · Pendente' : ''}
              </Checkbox>
            </li>
          ))}
        </ul>
      ) : (
        <p className="planner-muted">Nenhum combinado registrado.</p>
      )}
      <form className="planner-form" onSubmit={commit}>
        <FieldGrid>
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
        </FieldGrid>
        <div>
          <Button variant="secondary" type="submit" loading={busy}>
            Registrar combinado
          </Button>
        </div>
      </form>
    </Card>
  );
}
