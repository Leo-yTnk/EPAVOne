import { useEffect, useRef, useState } from 'preact/hooks';
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, Spinner } from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { swiftLink } from '../models/catalog.js';
import { CatalogImage } from './CatalogImage.jsx';
import { ProductPrice } from './ProductPrice.jsx';
import { RecipeDetails } from './RecipeDetails.jsx';

export function ProductDetails({ product, onClose }) {
  const recipes = useCatalogResource(catalogService.relatedRecipes, product.id);
  const [recipe, setRecipe] = useState(null);
  const contentRef = useRef(null);
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    contentRef.current?.focus();
  }, [recipe]);
  const link = swiftLink(product.swift_product_url);
  return (
    <Dialog open title={recipe ? recipe.name : product.name} onClose={onClose} size="lg">
      <div ref={contentRef} tabIndex="-1" className="insights-detail-content">
        {recipe ? (
          <RecipeDetails recipe={recipe} onBack={() => setRecipe(null)} />
        ) : (
          <div className="insights-detail">
            <CatalogImage url={product.image_url} name={product.name} />
            <Badge>{product.category?.name || 'Outros produtos'}</Badge>
            {product.product_code && <p className="insights-muted">Código {product.product_code}</p>}
            <ProductPrice product={product} />
            {link && (
              <Button as="a" href={link} target="_blank" rel="noopener noreferrer" variant="secondary">
                Consultar na Swift ↗
              </Button>
            )}
            <p className="insights-muted">Consulte a disponibilidade e os preços no formulário da semana antes de preencher o pedido.</p>
            <h3 className="ds-heading-h3">Receitas com este produto</h3>
            {recipes.loading ? (
              <p role="status">
                <Spinner /> Carregando receitas…
              </p>
            ) : recipes.error ? (
              <ErrorState title="Receitas indisponíveis" description={recipes.error} onAction={recipes.retry} />
            ) : !recipes.data.length ? (
              <EmptyState title="Nenhuma receita relacionada" description="Este produto ainda não tem uma receita publicada no catálogo." />
            ) : (
              <div className="insights-related">
                {recipes.data.map((item) => (
                  <Card key={item.id}>
                    <h4>{item.name}</h4>
                    <p className="insights-muted">
                      {[item.prep_time && `${item.prep_time} min`, item.servings && `${item.servings} porções`].filter(Boolean).join(' · ')}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setRecipe(item)}>
                      Ver receita
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
