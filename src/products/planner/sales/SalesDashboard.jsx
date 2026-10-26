import { ChartContainer, MetricCard } from '../../../design-system/components/index.js';
import { salesMetrics, saleMoney } from '../../../shared/services/sales.js';
export function SalesDashboard({ rows }) {
  const metrics = salesMetrics(rows),
    days = new Map();
  for (const row of rows) {
    const day = row.sale_date.slice(0, 7);
    const entry = days.get(day) || { value: 0, count: 0 };
    entry.value += Number(row.value);
    entry.count++;
    days.set(day, entry);
  }
  const series = [...days].sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(1, ...series.map(([, value]) => value.value)),
    maxCount = Math.max(1, ...series.map(([, value]) => value.count));
  return (
    <>
      <div className="planner-sales-metrics">
        <MetricCard label="Faturamento bruto" value={saleMoney(metrics.gross)} trend="Produtos e frete informado no período" />
        <MetricCard label="Vendas" value={metrics.count} trend="Quantidade de vendas registradas" />
        <MetricCard label="Ticket Médio · TM" value={metrics.tm === null ? '—' : saleMoney(metrics.tm)} trend="Faturamento ÷ vendas" />
        <MetricCard
          label="Itens por Cupom · IPC"
          value={metrics.ipc === null ? '—' : metrics.ipc.toFixed(2)}
          trend="Produtos distintos médios por venda detalhada"
        />
        <MetricCard label="Positivação" value={metrics.positivity} trend="Clientes diferentes com compra identificada" />
      </div>
      {metrics.legacy > 0 && (
        <p className="planner-muted">
          {metrics.legacy} vendas anteriores sem produtos/cliente identificados entram no faturamento e TM, mas não no IPC e positivação.
          Complete os registros para incluí-las.
        </p>
      )}
      {metrics.ambiguous > 0 && (
        <p className="planner-muted">
          {metrics.ambiguous} vendas com homônimos sem referência precisam de conferência e não adicionam clientes à positivação.
        </p>
      )}
      <div className="planner-sales-charts">
        <ChartContainer
          title="Faturamento por mês"
          subtitle="Dentro do período selecionado"
          legend="R$"
          data={series.map(([label, item]) => ({
            label,
            value: saleMoney(Math.round(item.value * 100)),
            height: (item.value / max) * 100
          }))}
        />
        <ChartContainer
          title="Vendas por mês"
          subtitle="Quantidade de registros"
          data={series.map(([label, item]) => ({ label, value: String(item.count), height: (item.count / maxCount) * 100 }))}
        />
      </div>
    </>
  );
}
