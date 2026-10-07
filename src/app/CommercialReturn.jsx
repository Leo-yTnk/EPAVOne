import { Alert, Button } from '../design-system/components/index.js';
import { useCommercialContext } from '../shared/services/useCommercialContext.js';
import { commercialContext } from '../shared/services/commercialContext.js';
export function CommercialReturn() {
  const context = useCommercialContext();
  if (!context) return null;
  return (
    <Alert tone="info" title={`Atendimento de ${context.customerName}`}>
      <div className="ds-inline">
        <span>O planejamento continua salvo.</span>
        <Button as="a" size="sm" variant="secondary" href={context.returnTo}>
          Voltar ao Planner
        </Button>
        <Button size="sm" variant="ghost" onClick={() => commercialContext.clear()}>
          Encerrar vínculo
        </Button>
      </div>
    </Alert>
  );
}
