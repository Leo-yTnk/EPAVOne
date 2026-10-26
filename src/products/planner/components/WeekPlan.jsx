import { useState } from 'preact/hooks';
import {
  Badge,
  SectionHeader,
  Button,
  Card,
  ContextMenu,
  EmptyState,
  Heading,
  IconButton,
  Input,
  Progress
} from '../../../design-system/components/index.js';
import { OUTCOMES, performance } from '../models/planner.js';
import { PriorityDetails } from './PriorityDetails.jsx';
export function WeekPlan({ state, week, busy, act }) {
  const [goal, setGoal] = useState(week.goal);
  const metrics = performance(state, week);
  const prepared = week.queue.filter((entry) =>
    state.customers.find((customer) => customer.id === entry.customerId)?.preparation.trim()
  ).length;
  return (
    <>
      <Card className="planner-week-summary">
        <div>
          <Heading level={3}>Uma hora. Conversas bem preparadas.</Heading>
          <p className="planner-muted">Quinta-feira, 9h30–10h30 · titulares primeiro; reservas quando houver espaço.</p>
          <Progress
            label="Cobertura planejada da carteira"
            value={week.queue.length}
            max={state.customers.length || 1}
            formatValue={() => `${week.queue.length}/${state.customers.length} clientes`}
          />
          <p>
            {prepared} preparados · {metrics.done} titulares concluídos de {metrics.planned}
          </p>
        </div>
        <form
          className="planner-goal-form"
          onSubmit={(event) => {
            event.preventDefault();
            act({ type: 'goal', weekId: week.id, value: Number(goal) }, 'Meta atualizada.');
          }}
        >
          <Input
            id="planner-goal"
            label="Meta de atendimentos"
            type="number"
            min="1"
            max="100"
            required
            value={goal}
            onInput={(event) => setGoal(event.currentTarget.value)}
          />
          <Button variant="secondary" loading={busy} type="submit">
            Salvar meta
          </Button>
        </form>
      </Card>
      <SectionHeader
        title="Sua fila de atendimento"
        actions={
          <Button as="a" variant="secondary" href="#/planner/clientes">
            Escolher clientes
          </Button>
        }
      />
      {!week.queue.length && (
        <EmptyState
          title="Planeje sua primeira conversa"
          description="Selecione clientes na carteira e defina os titulares e reservas."
          actionLabel="Abrir carteira"
          onAction={() => {
            window.location.hash = '#/planner/clientes';
          }}
        />
      )}
      <ol className="planner-queue">
        {week.queue.map((entry, index) => {
          const customer = state.customers.find((item) => item.id === entry.customerId);
          return (
            <li key={entry.customerId}>
              <Card
                as={ContextMenu}
                className="planner-queue-row"
                label={`Atalhos de ${customer.name}`}
                items={[
                  { label: 'Preparar conversa', icon: 'user', href: `#/planner/clientes/${customer.id}` },
                  ...(!entry.outcome ? [{ label: 'Atender cliente', icon: 'writer', href: `#/planner/atendimento/${customer.id}` }] : []),
                  {
                    label: 'Subir na fila',
                    icon: 'up',
                    disabled: busy || index === 0,
                    onSelect: () => act({ type: 'move', weekId: week.id, customerId: customer.id, direction: -1 }, 'Posição atualizada.')
                  },
                  {
                    label: 'Descer na fila',
                    icon: 'down',
                    disabled: busy || index === week.queue.length - 1,
                    onSelect: () => act({ type: 'move', weekId: week.id, customerId: customer.id, direction: 1 }, 'Posição atualizada.')
                  },
                  {
                    label: entry.role === 'primary' ? 'Mudar para reserva' : 'Mudar para titular',
                    disabled: busy || Boolean(entry.outcome),
                    onSelect: () => act({ type: 'role', weekId: week.id, customerId: customer.id }, 'Papel atualizado.')
                  }
                ]}
              >
                <span className="planner-position" aria-label={`Posição ${index + 1}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="planner-queue-copy">
                  <Heading level={4}>
                    <a href={`#/planner/clientes/${customer.id}`}>{customer.name}</a>
                  </Heading>
                  <p className="planner-muted">
                    {customer.position || 'Sem posição'} · {customer.preparation.trim() ? 'Abordagem preparada' : 'Preparação pendente'}
                  </p>
                  <PriorityDetails customer={customer} state={state} />
                </div>
                <div className="planner-queue-controls">
                  <div className="ds-inline">
                    <Badge>{entry.role === 'primary' ? 'Titular' : 'Reserva'}</Badge>
                    {entry.outcome && <Badge tone="success">{OUTCOMES[entry.outcome]}</Badge>}
                  </div>
                  <div className="ds-inline">
                    <IconButton
                      label={`Subir ${customer.name}`}
                      size="sm"
                      disabled={busy || index === 0}
                      onClick={() => act({ type: 'move', weekId: week.id, customerId: customer.id, direction: -1 }, 'Posição atualizada.')}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      label={`Descer ${customer.name}`}
                      size="sm"
                      disabled={busy || index === week.queue.length - 1}
                      onClick={() => act({ type: 'move', weekId: week.id, customerId: customer.id, direction: 1 }, 'Posição atualizada.')}
                    >
                      ↓
                    </IconButton>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || Boolean(entry.outcome)}
                      onClick={() => act({ type: 'role', weekId: week.id, customerId: customer.id }, 'Papel atualizado.')}
                    >
                      {entry.role === 'primary' ? 'Tornar reserva' : 'Tornar titular'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || Boolean(entry.outcome)}
                      onClick={() => act({ type: 'remove', weekId: week.id, customerId: customer.id }, 'Cliente removido da fila.')}
                    >
                      Remover
                    </Button>
                    {!entry.outcome && (
                      <Button as="a" size="sm" href={`#/planner/atendimento/${customer.id}`}>
                        Atender
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </>
  );
}
