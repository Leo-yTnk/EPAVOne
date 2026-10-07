import { Badge } from '../../../design-system/components/index.js';
import { priority } from '../models/planner.js';
export function PriorityDetails({ customer, state }) {
  const result = priority(customer, state);
  return (
    <details className="planner-priority">
      <summary>
        <Badge>Prioridade {result.score}</Badge>
        <span>Entenda os fatores</span>
      </summary>
      <ul>
        {result.factors.map((factor) => (
          <li key={factor.label}>
            <span>{factor.label}</span>
            <strong>
              {factor.points > 0 ? '+' : ''}
              {factor.points}
            </strong>
          </li>
        ))}
      </ul>
      <p className="planner-muted">Regras fixas, limitadas a 0–100. Não representa probabilidade de compra.</p>
    </details>
  );
}
