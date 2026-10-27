import { useState } from 'preact/hooks';
import {
  ActionGroup,
  Button,
  Card,
  EmptyState,
  Input,
  Progress,
  SectionHeader,
  SummaryList,
  Tabs
} from '../../../design-system/components/index.js';
import { OUTCOMES, performance, weekStart } from '../models/planner.js';
import { attendanceLink, orderedQueue } from '../models/workspace.js';
import { ClientPreparation } from './ClientPreparation.jsx';
import { Attendance } from './Attendance.jsx';
import { WeekQueue } from './WeekQueue.jsx';
import { WeekClientPicker } from './WeekClientPicker.jsx';

export function WeekPlan({ state, week, busy, act, mode = 'planejar', customerId }) {
  const [goal, setGoal] = useState(week.goal);
  const [adding, setAdding] = useState(false);
  const metrics = performance(state, week);
  const queue = orderedQueue(week);
  const prepared = queue.filter((entry) => state.customers.find((c) => c.id === entry.customerId)?.preparation.trim()).length;
  const entry = queue.find((item) => item.customerId === customerId) || queue.find((item) => !item.outcome);
  const customer = state.customers.find((item) => item.id === entry?.customerId);
  const stage = mode === 'atender' ? 'atender' : mode === 'concluir' ? 'concluir' : 'planejar';
  const current = week.id === weekStart();
  return (
    <>
      {stage === 'planejar' && (
        <Card className="planner-flow-card">
          <div className="planner-flow-card">
            <SectionHeader
              title="Planeje com espaço para conversar"
              description="Quinta-feira · 9h30–10h30. Titulares primeiro; reservas quando houver espaço."
            />
            <Progress
              label="Meta da semana"
              value={metrics.attended}
              max={week.goal}
              formatValue={() => `${metrics.attended} de ${week.goal} atendimentos`}
            />
            <p className="planner-muted">
              {metrics.planned} titulares · {queue.length - metrics.planned} reservas · {prepared} preparados
            </p>
          </div>
          <details className="planner-details">
            <summary>Ajustar meta da semana</summary>
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
              <Button variant="secondary" loading={busy} type="submit" disabled={Number(goal) === week.goal}>
                Salvar meta
              </Button>
            </form>
          </details>
        </Card>
      )}
      <Tabs
        label="Momentos da semana"
        size="compact"
        value={stage}
        onChange={(value) => {
          window.location.hash =
            value === 'atender'
              ? attendanceLink(entry?.outcome ? undefined : customer?.id)
              : value === 'concluir'
                ? '#/planner/semana/concluir'
                : '#/planner/semana';
        }}
        items={[
          { value: 'planejar', label: 'Planejar' },
          { value: 'atender', label: 'Atender' },
          { value: 'concluir', label: 'Concluir' }
        ]}
      />
      {stage === 'planejar' && (
        <>
          <SectionHeader
            title="Sua fila de atendimento"
            actions={
              <Button variant="secondary" aria-expanded={adding} onClick={() => setAdding(!adding)}>
                {adding ? 'Fechar seleção' : 'Escolher clientes'}
              </Button>
            }
          />
          {adding && <WeekClientPicker state={state} week={week} act={act} busy={busy} />}
          {!queue.length && (
            <EmptyState
              title="Planeje sua primeira conversa"
              description="Escolha os clientes aqui mesmo. Depois, organize titulares e reservas."
              actionLabel="Selecionar clientes"
              onAction={() => setAdding(true)}
            />
          )}
          <div className={customer ? `planner-week-workspace${mode === 'preparar' ? ' is-preparing' : ''}` : 'planner-flow-card'}>
            <WeekQueue state={state} week={week} busy={busy} act={act} customerId={customer?.id} />
            {customer && (
              <div className="planner-flow-card">
                <SectionHeader
                  title={customer.name}
                  size="sm"
                  actions={
                    <Button as="a" size="sm" variant="ghost" href={`#/planner/clientes/${customer.id}`}>
                      Ver perfil
                    </Button>
                  }
                />
                <ClientPreparation key={customer.id} customer={customer} state={state} week={week} act={act} busy={busy} />
                {current && !entry.outcome && (
                  <div>
                    <Button as="a" href={attendanceLink(customer.id)}>
                      Atender {customer.name}
                    </Button>
                  </div>
                )}
                <p className="planner-muted">
                  Selecione um nome na fila para preparar a conversa. A ordem de atendimento mantém titulares antes das reservas.
                </p>
              </div>
            )}
          </div>
        </>
      )}
      {stage === 'atender' && (
        <Attendance
          key={`${customerId || 'next'}-${week.id}`}
          state={state}
          week={week}
          customerId={customerId}
          act={act}
          busy={busy}
          embedded
          onAdvance={(next) => {
            window.location.hash = next ? attendanceLink(next) : '#/planner/semana/concluir';
          }}
        />
      )}
      {stage === 'concluir' && (
        <>
          <Card className="planner-flow-card">
            <SectionHeader
              title={metrics.attended >= week.goal ? 'Meta de contatos alcançada' : 'Fechamento da semana'}
              description="Revise o que aconteceu e o próximo passo de cada conversa."
            />
            <SummaryList
              emphasis
              items={[
                { label: 'Contatados', value: metrics.attended },
                { label: 'Tentativas', value: metrics.attempts },
                { label: 'Aguardando na fila', value: queue.filter((item) => !item.outcome).length }
              ]}
            />
            <ActionGroup>
              {current && queue.some((item) => !item.outcome) && (
                <Button as="a" href={attendanceLink()}>
                  Retomar atendimento
                </Button>
              )}
              <Button as="a" href="#/planner/resultados" variant="secondary">
                Analisar resultados
              </Button>
              <Button as="a" href="#/planner/pedidos" variant="ghost">
                Conferir vendas em Pedidos
              </Button>
            </ActionGroup>
          </Card>
          <Card className="planner-flow-card">
            <SectionHeader title="Conversas e próximos passos" />
            {state.interactions
              .filter((item) => item.weekId === week.id)
              .map((item) => (
                <div key={item.id} className="planner-section-head">
                  <div>
                    <strong>{state.customers.find((c) => c.id === item.customerId)?.name || 'Cliente removido da carteira'}</strong>
                    <p className="planner-muted">
                      {OUTCOMES[item.outcome]} · {item.note || 'Sem observação adicional.'}
                    </p>
                  </div>
                  {state.customers.some((c) => c.id === item.customerId) && (
                    <Button as="a" size="sm" variant="ghost" href={`#/planner/clientes/${item.customerId}/combinados`}>
                      Próximo passo
                    </Button>
                  )}
                </div>
              ))}
            {!metrics.attempts && <p className="planner-muted">Nenhum atendimento registrado nesta semana.</p>}
          </Card>
        </>
      )}
    </>
  );
}
