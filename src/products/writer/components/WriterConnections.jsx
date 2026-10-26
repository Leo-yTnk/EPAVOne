import { Card, Button } from '../../../design-system/components/index.js';
import { useWeeklyOrder } from '../../../shared/services/useWeeklyOrder.js';
import { PlannerHandoff } from './PlannerHandoff.jsx';
import { InsightsProductHandoff } from './InsightsProductHandoff.jsx';
import { RecipeOrderHandoff } from './RecipeOrderHandoff.jsx';
export function WriterConnections({ handoff, template, busy, expired, onApply, onAdd, onAddRecipe }) {
  const { request, templateVersion } = useWeeklyOrder();
  if (!handoff.context && !request) return null;
  return (
    <Card className="writer-connections" padding="compact" aria-label="Seleção dos apps">
      {handoff.context && (
        <div className="ds-inline">
          <PlannerHandoff compact context={handoff.context} template={template} busy={busy} onApply={onApply} />
          <Button as="a" size="sm" variant="ghost" href={handoff.context.returnTo || '#/planner'}>
            Voltar ao Planner
          </Button>
        </div>
      )}
      {request?.kind === 'recipe' ? (
        <RecipeOrderHandoff
          key={`${request.id}-${templateVersion}`}
          request={request}
          template={template}
          busy={busy}
          expired={expired}
          onAdd={onAddRecipe}
        />
      ) : (
        <InsightsProductHandoff compact template={template} busy={busy} expired={expired} onAdd={onAdd} />
      )}
    </Card>
  );
}
