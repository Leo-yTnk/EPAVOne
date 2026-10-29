import { salesMetrics, saleMoney } from '../services/sales.js';
export function contactGoalInsight({ attended, goal, plannedRemaining = 0 }) {
  if (!Number.isInteger(goal) || goal < 1)
    return { title: 'Meta não informada', reason: 'Defina uma meta de atendimentos para comparar o progresso.' };
  const gap = Math.max(0, goal - attended);
  return {
    title: gap ? 'Há espaço para mais conversas' : 'Meta de contatos alcançada',
    reason: gap
      ? `Faltam ${gap} clientes contatados para a meta de ${goal}. Há ${plannedRemaining} atendimento(s) pendente(s) na fila. Tentativas indisponíveis não contam como contato.`
      : `${attended} clientes contatados para a meta de ${goal}. Revise os retornos combinados.`,
    action: { label: gap > plannedRemaining ? 'Revisar clientes da semana' : 'Revisar semana', href: '#/planner/semana' }
  };
}
export function salesInsights(rows) {
  const m = salesMetrics(rows);
  if (!m.count)
    return [
      {
        title: 'Os indicadores começam com uma venda',
        reason: 'Sem vendas neste período, TM e IPC permanecem sem medição. Ajuste as datas ou registre uma venda conferida.'
      }
    ];
  const result = [];
  if (m.legacy || m.ambiguous)
    result.push({
      title: 'Complete os registros para interpretar os resultados',
      reason: `${m.legacy} venda(s) sem detalhes e ${m.ambiguous} identidade(s) ambígua(s). IPC e positivação não representam todo o período.`
    });
  result.push({
    title: 'Leia o resultado antes de planejar a próxima oferta',
    reason: `Ticket médio de ${saleMoney(m.tm)} em ${m.count} venda(s). ${m.ipc === null ? 'Sem produtos distintos medidos.' : `IPC de ${m.ipc.toFixed(2)} produto(s) distinto(s) por venda detalhada.`} Positivação: ${m.positivity} cliente(s) identificado(s). Sem metas de vendas configuradas, não classificamos esses valores como bons ou ruins.`
  });
  return result;
}
