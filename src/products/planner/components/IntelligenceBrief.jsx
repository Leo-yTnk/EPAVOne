import { Badge, Button, Card, SectionHeader } from '../../../design-system/components/index.js';
import { useIntelligence } from '../hooks/useIntelligence.js';
export function IntelligenceBrief() {
  const intelligence = useIntelligence();
  if (!intelligence) return null;
  const suggested = intelligence.ranked.filter((r) => !r.completed && !r.deferred && r.score !== null).slice(0, 3);
  return (
    <Card
      className="planner-flow-card"
      aria-label="Prioridades explicadas"
      aria-busy={intelligence.catalog.loading || intelligence.analyzing}
    >
      <SectionHeader
        title="Quem merece atenção agora"
        description="Pelos contatos, combinados e contexto da semana. A ordem da sua fila continua sendo sua."
      />
      {!suggested.length && (
        <p className="planner-muted">
          Ainda não há sinais suficientes para recomendar uma prioridade. Conheça os perfis e registre os próximos combinados.
        </p>
      )}
      <div className="planner-intelligence-list">
        {suggested.map((item) => (
          <div key={item.customerId} className="planner-intelligence-row">
            <div>
              <a href={`#/planner/clientes/${item.customerId}`}>
                <strong>{item.name}</strong>
              </a>
              <p>{item.reason}</p>
            </div>
            <Badge>{item.score} / 100</Badge>
            <Button as="a" size="sm" variant="secondary" href={item.action.href}>
              {item.action.label}
            </Button>
          </div>
        ))}
      </div>
      {intelligence.catalog.error && (
        <p className="planner-muted">
          {intelligence.catalog.error}{' '}
          <Button size="sm" variant="ghost" onClick={intelligence.retry}>
            Tentar catálogo novamente
          </Button>
        </p>
      )}
      <details className="planner-details">
        <summary>Como essas prioridades são calculadas</summary>
        <p className="planner-muted">
          Retornos até hoje: 30 pontos; recência em relação à frequência desejada: até 25; intenção declarada: 20; na semana: 10; compra
          registrada em atendimento: 5; produto real compatível: 10. Recusa recente: −30; atendimento concluído na semana: −40. Sem sinais
          datados ou intenção, não há nota. Não é uma probabilidade de compra.
        </p>
      </details>
    </Card>
  );
}
