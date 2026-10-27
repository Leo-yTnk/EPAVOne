import { useRef } from 'preact/hooks';
import { Badge, Card, Menu } from '../../../design-system/components/index.js';
import { useContentMotion } from '../../../design-system/behaviors/useContentMotion.js';
import { OUTCOMES } from '../models/planner.js';
import { preparationLink } from '../models/workspace.js';

export function WeekQueue({ state, week, busy, act, customerId }) {
  const ref = useRef(null);
  useContentMotion(ref, week.queue.map((item) => `${item.customerId}:${item.role}:${item.outcome}`).join('|'), 0, 'y');
  return (
    <Card padding="compact">
      <ol className="planner-queue" ref={ref}>
        {week.queue.map((item, index) => {
          const person = state.customers.find((c) => c.id === item.customerId);
          return (
            <li key={person.id} className="planner-queue-item">
              <div className="planner-queue-person">
                <a href={preparationLink(person.id)} aria-current={person.id === customerId ? 'true' : undefined}>
                  <strong>
                    {index + 1}. {person.name}
                  </strong>
                </a>
                <p className="planner-muted">{person.preparation.trim() ? 'Abordagem pronta' : 'Preparação pendente'}</p>
                <Badge tone={item.outcome ? 'success' : 'neutral'}>
                  {item.outcome ? OUTCOMES[item.outcome] : item.role === 'reserve' ? 'Reserva' : 'Titular'}
                </Badge>
              </div>
              <Menu
                label={`Organizar ${person.name}`}
                triggerLabel="Organizar"
                items={[
                  {
                    label: 'Subir na fila',
                    icon: 'up',
                    disabled: busy || index === 0,
                    onSelect: () => act({ type: 'move', weekId: week.id, customerId: person.id, direction: -1 }, 'Posição atualizada.')
                  },
                  {
                    label: 'Descer na fila',
                    icon: 'down',
                    disabled: busy || index === week.queue.length - 1,
                    onSelect: () => act({ type: 'move', weekId: week.id, customerId: person.id, direction: 1 }, 'Posição atualizada.')
                  },
                  {
                    label: item.role === 'primary' ? 'Tornar reserva' : 'Tornar titular',
                    disabled: busy || Boolean(item.outcome),
                    onSelect: () => act({ type: 'role', weekId: week.id, customerId: person.id }, 'Papel atualizado.')
                  },
                  {
                    label: 'Remover da semana',
                    disabled: busy || Boolean(item.outcome),
                    onSelect: () => act({ type: 'remove', weekId: week.id, customerId: person.id }, 'Cliente removido da fila.')
                  },
                  { label: 'Ver perfil completo', href: `#/planner/clientes/${person.id}` }
                ]}
              />
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
