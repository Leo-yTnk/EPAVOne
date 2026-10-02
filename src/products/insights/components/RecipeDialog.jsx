import { Dialog } from '../../../design-system/components/index.js';
import { RecipeDetails } from './RecipeDetails.jsx';

export function RecipeDialog({ recipe, onClose }) {
  return (
    <Dialog open title={recipe.name} onClose={onClose} size="lg">
      <RecipeDetails recipe={recipe} />
    </Dialog>
  );
}
