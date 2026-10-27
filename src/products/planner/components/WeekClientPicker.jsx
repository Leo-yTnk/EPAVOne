import { useState } from 'preact/hooks';
import { Button, Card, Input, SectionHeader } from '../../../design-system/components/index.js';
export function WeekClientPicker({ state, week, act, busy }) {
  const [query, setQuery] = useState('');
  const candidates = state.customers.filter(
    (item) =>
      !week.queue.some((entry) => entry.customerId === item.id) &&
      item.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))
  );
  return (
    <Card className="planner-flow-card">
      <SectionHeader
        size="sm"
        title="Adicionar à semana"
        actions={
          <Button as="a" variant="ghost" size="sm" href="#/planner/clientes">
            Abrir carteira
          </Button>
        }
      />
      <Input label="Buscar cliente para a semana" type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} />
      {candidates.slice(0, 8).map((item) => (
        <div key={item.id} className="planner-section-head">
          <span>{item.name}</span>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => act({ type: 'add', customerId: item.id, weekId: week.id }, 'Cliente adicionado à semana.')}
          >
            Adicionar {item.name}
          </Button>
        </div>
      ))}
      {!candidates.length && <p className="planner-muted">Nenhum cliente disponível com essa busca.</p>}
      {candidates.length > 8 && <p className="planner-muted">Mostrando 8 de {candidates.length}. Refine a busca ou abra a carteira.</p>}
    </Card>
  );
}
