import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Button, Dialog } from '../../../design-system/components/index.js';
import { ProductOverview } from './ProductOverview.jsx';
import { RecipeDetails } from './RecipeDetails.jsx';

export function InsightsDetailDialog({ initial, onClose }) {
  const [history, setHistory] = useState([initial]);
  const contentRef = useRef(null);
  const firstRender = useRef(true);
  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    contentRef.current?.focus();
    const scrollContainer = contentRef.current?.closest('.ds-dialog-content');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  }, [current]);
  const open = (kind, item) => setHistory((items) => [...items, { kind, item }]);
  return (
    <Dialog open title={current.item.name} onClose={onClose} size="lg">
      <div ref={contentRef} tabIndex="-1" className="insights-detail-content">
        {previous && (
          <Button variant="ghost" size="sm" className="insights-detail-back" onClick={() => setHistory((items) => items.slice(0, -1))}>
            {previous.kind === 'product' ? '← Voltar ao produto' : '← Voltar à receita'}
          </Button>
        )}
        {current.kind === 'product' ? (
          <ProductOverview key={`product-${current.item.id}`} product={current.item} onOpenRecipe={(item) => open('recipe', item)} />
        ) : (
          <RecipeDetails key={`recipe-${current.item.id}`} recipe={current.item} onOpenProduct={(item) => open('product', item)} />
        )}
      </div>
    </Dialog>
  );
}
