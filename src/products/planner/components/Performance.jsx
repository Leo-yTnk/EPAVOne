import {
  Button,
  Card,
  ChartContainer,
  DataTable,
  EmptyState,
  MetricCard,
  Progress,
  SectionHeader
} from '../../../design-system/components/index.js';
import { dateLabel, OUTCOMES, performance } from '../models/planner.js';

export function Performance({ state, week }) {
  const metrics = performance(state, week);
  const rows = [...state.weeks]
    .sort((a, b) => b.id.localeCompare(a.id))
    .map((item) => ({ id: item.id, week: dateLabel(item.id), goal: item.goal, ...performance(state, item) }));
  const history = state.interactions.filter((item) => item.weekId === week.id).sort((a, b) => b.date.localeCompare(a.date));
  const evolution = [...rows].reverse().slice(-8);
  const scale = Math.max(1, ...evolution.map((item) => Math.max(item.attended, item.goal)));
  const pending = state.commitments.filter((item) => !item.done).length;
  return (
    <>
      <div className="planner-results-metrics">
        <MetricCard label="Clientes contatados" value={metrics.attended} trend={`Meta: ${week.goal} · ${metrics.attempts} tentativas`} />
        <MetricCard
          label="Conversão de atendimento"
          value={metrics.attended ? `${metrics.conversion}%` : '—'}
          trend={`${metrics.buyers} compradores / ${metrics.attended} contatados`}
        />
        <MetricCard
          label="Cobertura da carteira"
          value={state.customers.length ? `${metrics.coverage}%` : '—'}
          trend={`${state.customers.length} clientes na carteira atual`}
        />
      </div>
      <div className="planner-two-columns">
        <Card className="planner-flow-card">
          <SectionHeader title="Meta e próximo passo" />
          <Progress
            label="Atendimentos realizados"
            value={metrics.attended}
            max={week.goal}
            formatValue={() => `${metrics.attended} / ${week.goal}`}
          />
          <p>
            {metrics.attended >= week.goal
              ? 'Meta de contatos alcançada. Revise os combinados antes de planejar a próxima semana.'
              : `Faltam ${week.goal - metrics.attended} contatos para alcançar a meta.`}
          </p>
          <p className="planner-muted">{pending} combinados em aberto na carteira.</p>
          <div>
            <Button as="a" href="#/planner/semana">
              Revisar semana
            </Button>
          </div>
        </Card>
        <Card className="planner-flow-card">
          <SectionHeader title="O que vale aprender" />
          <ul className="planner-learnings">
            <li>
              {metrics.attended && !metrics.buyers
                ? 'Houve contatos sem compra. Revise as objeções antes de repetir a oferta.'
                : metrics.buyers
                  ? 'Confira no histórico o que ajudou cada cliente a decidir.'
                  : 'Registre as conversas para começar a identificar aprendizados.'}
            </li>
            <li>
              {metrics.coverage < 50
                ? 'Inclua um cliente sem contato recente para ampliar a cobertura.'
                : 'Mantenha o acompanhamento e respeite a frequência de cada cliente.'}
            </li>
          </ul>
          <p className="planner-muted">Vendas, faturamento, ticket médio, IPC e positivação de vendas ficam em Resultados → Pedidos.</p>
          <Button as="a" href="#/planner/resultados/pedidos" variant="ghost" size="sm">
            Ver indicadores de vendas
          </Button>
        </Card>
      </div>
      {state.interactions.length > 0 && (
        <ChartContainer
          title="Evolução de clientes contatados"
          subtitle="Até 8 semanas registradas · compare as metas na tabela abaixo"
          legend="Contatados"
          data={evolution.map((item) => ({
            label: item.week,
            height: (item.attended / scale) * 100,
            value: `${item.week}: ${item.attended} contatados; meta ${item.goal}`
          }))}
        />
      )}
      <SectionHeader
        title="Planejado e realizado"
        description="Contatos distintos por semana. Indisponíveis contam como tentativa, sem aumentar os contatos."
      />
      <DataTable
        caption="Evolução semanal de atendimentos"
        columns={[
          { key: 'week', label: 'Semana' },
          { key: 'planned', label: 'Titulares', numeric: true },
          { key: 'done', label: 'Concluídos', numeric: true },
          { key: 'attended', label: 'Contatados', numeric: true },
          { key: 'goal', label: 'Meta', numeric: true },
          { key: 'buyers', label: 'Compradores', numeric: true }
        ]}
        rows={rows}
      />
      <Card className="planner-flow-card">
        <SectionHeader title="Histórico da semana" />
        {history.length ? (
          <ol className="planner-timeline">
            {history.map((item) => (
              <li key={item.id}>
                <time dateTime={item.date}>{dateLabel(item.date)}</time>
                <div>
                  <strong>
                    {state.customers.find((customer) => customer.id === item.customerId)?.name || 'Cliente removido da carteira'}
                  </strong>
                  <p>
                    {OUTCOMES[item.outcome]} · {item.note || 'Sem observação adicional.'}
                  </p>
                  {state.customers.some((customer) => customer.id === item.customerId) && (
                    <a href={`#/planner/clientes/${item.customerId}/historico`}>Ver histórico do cliente</a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="Sem conversas registradas nesta semana"
            description="O histórico aparece após salvar o resultado de um atendimento."
          />
        )}
      </Card>
      <details className="planner-details">
        <summary>Como os indicadores são calculados</summary>
        <p className="planner-muted">
          Contatados = clientes distintos com resultado diferente de indisponível. Conversão = compradores distintos ÷ contatados nesta
          semana. Cobertura = clientes atuais contatados ÷ carteira atual. Compras históricas refletem registros de atendimento; para vendas
          confirmadas consulte Pedidos. Sem atendimentos, a conversão é exibida como —. No modo demonstração todos os registros são
          exemplos.
        </p>
      </details>
    </>
  );
}
