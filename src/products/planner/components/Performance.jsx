import { Card, DataTable, Heading } from '../../../design-system/components/index.js';
import { dateLabel, money, performance, shiftDay } from '../models/planner.js';
export function Performance({ state, week }) {
  const metrics = performance(state, week);
  const rows = [...state.weeks]
    .sort((a, b) => b.id.localeCompare(a.id))
    .map((item) => ({ id: item.id, week: dateLabel(item.id), goal: item.goal, ...performance(state, item) }));
  const history = (state.sales || []).filter((sale) => sale.sale_date >= week.id && sale.sale_date <= shiftDay(week.id, 6));
  const total = history.reduce((sum, sale) => sum + Math.round(Number(sale.value) * 100), 0);
  const units = history.reduce((sum, sale) => sum + sale.ipc, 0);
  return (
    <>
      {state.sales && (
        <Card className="planner-flow-card">
          <Heading level={3}>Vendas confirmadas no banco · semana selecionada</Heading>
          <p>
            {history.length} vendas · {money(total)} · Ticket médio {history.length ? money(Math.round(total / history.length)) : '—'} · IPC{' '}
            {history.length ? (units / history.length).toFixed(1) : '—'}
          </p>
          <p className="planner-muted">
            Inclui registros históricos e compras confirmadas no Planner, uma única vez por venda. O histórico antigo não informa clientes;
            não permite calcular positivação. Exportar no Writer não registra venda.
          </p>
        </Card>
      )}
      <Card className="planner-flow-card">
        <Heading level={3}>O que suas conversas produziram</Heading>
        <dl className="planner-metrics">
          <div>
            <dt>Atendimentos</dt>
            <dd>
              {metrics.attended} / {week.goal}
            </dd>
          </div>
          <div>
            <dt>Positivação</dt>
            <dd>
              {metrics.buyers} clientes · {metrics.conversion}%
            </dd>
          </div>
          <div>
            <dt>Ticket médio</dt>
            <dd>{metrics.ticket === null ? '—' : money(metrics.ticket)}</dd>
          </div>
          <div>
            <dt>IPC</dt>
            <dd>{metrics.ipc === null ? '—' : metrics.ipc.toFixed(1)}</dd>
          </div>
          <div>
            <dt>Vendas registradas</dt>
            <dd>{money(metrics.revenue)}</dd>
          </div>
          <div>
            <dt>Cobertura</dt>
            <dd>{metrics.coverage}% da carteira</dd>
          </div>
        </dl>
        <p className="planner-muted">
          Atendimento = cliente distinto contatado; indisponíveis contam só como tentativa ({metrics.attempts}). Positivação = compradores
          distintos / clientes contatados. Ticket e IPC = valor e unidades por compra registrada. Valores demonstrativos ou informados
          manualmente, sem conciliação com pedidos.
        </p>
        {metrics.unmeasured > 0 && <p>{metrics.unmeasured} compras sem valor/unidades não entram no ticket, IPC ou total.</p>}
      </Card>
      <Card className="planner-flow-card">
        <Heading level={3}>Aprendizados para a próxima janela</Heading>
        <ul className="planner-learnings">
          <li>
            {metrics.attended < week.goal
              ? `Faltam ${week.goal - metrics.attended} contatos para a meta. Confira a preparação dos titulares antes de ampliar a fila.`
              : 'Meta de contatos alcançada. Reserve tempo para cumprir os combinados.'}
          </li>
          <li>
            {metrics.attended && !metrics.buyers
              ? 'Houve contatos sem compra: reveja o contexto e registre objeções antes de repetir a oferta.'
              : metrics.buyers
                ? 'Houve compras: confirme os pedidos no Writer e registre o que motivou a decisão.'
                : 'Ainda não há resultados desta semana. Registre conversas para obter aprendizados.'}
          </li>
          <li>
            {metrics.coverage < 50
              ? 'A cobertura ainda está abaixo da metade da carteira. Inclua um cliente sem contato recente.'
              : 'Boa cobertura da carteira. Priorize a qualidade da conversa e os retornos combinados.'}
          </li>
        </ul>
      </Card>
      <Heading level={3}>Planejado × realizado · evolução semanal</Heading>
      <DataTable
        caption="Evolução semanal de atendimentos e vendas"
        columns={[
          { key: 'week', label: 'Semana' },
          { key: 'planned', label: 'Titulares', numeric: true },
          { key: 'done', label: 'Concluídos', numeric: true },
          { key: 'attended', label: 'Contatados', numeric: true },
          { key: 'goal', label: 'Meta', numeric: true },
          { key: 'buyers', label: 'Compradores', numeric: true },
          { key: 'revenue', label: 'Vendas', numeric: true, render: (row) => money(row.revenue) }
        ]}
        rows={rows}
      />
    </>
  );
}
