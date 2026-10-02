import { InsightsDetailDialog } from './InsightsDetailDialog.jsx';

export function RecipeDialog({ recipe, onClose }) {
  return <InsightsDetailDialog initial={{ kind: 'recipe', item: recipe }} onClose={onClose} />;
}
