import { OrderProductAction } from './OrderProductAction.jsx';
import { Badge, Button, Icon, EmptyState, ErrorState, Spinner } from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { swiftLink } from '../models/catalog.js';
import { CatalogImage } from './CatalogImage.jsx';
import { ProductPrice } from './ProductPrice.jsx';

export function ProductOverview({ product, onOpenRecipe, titleId }) {
  const recipes = useCatalogResource(catalogService.relatedRecipes, product.id);
  const link = swiftLink(product.swift_product_url);
  return (
    <section className="insights-detail" aria-label={product.name}>
      <header className="insights-product-overview">
        <CatalogImage stitched={false} fit="contain" url={product.image_url} name={product.name} />
        <div className="insights-product-summary">
          <Badge>{product.category?.name || 'Outros produtos'}</Badge>
          <h2 id={titleId} className="insights-product-detail-title">
            {product.name}
          </h2>
          {product.product_code && <p className="insights-muted">Código {product.product_code}</p>}
          <ProductPrice product={product} />
          <OrderProductAction key={product.id} product={product} />
          {link && (
            <Button as="a" href={link} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
              Consultar na Swift ↗
            </Button>
          )}
          <p className="insights-muted insights-product-note">
            Consulte a disponibilidade e os preços no formulário da semana antes de preencher o pedido.
          </p>
        </div>
      </header>
      <section className="insights-detail-section insights-recipe-panel" aria-labelledby="related-recipes-title">
        <h3 id="related-recipes-title">
          <Icon name="recipe" /> Receitas com este produto
        </h3>
        <p className="insights-muted">Transforme este ingrediente em uma sugestão de refeição.</p>
        {recipes.loading ? (
          <p role="status">
            <Spinner /> Carregando receitas…
          </p>
        ) : recipes.error ? (
          <ErrorState title="Receitas indisponíveis" description={recipes.error} onAction={recipes.retry} />
        ) : !recipes.data.length ? (
          <EmptyState title="Nenhuma receita relacionada" description="Este produto ainda não tem uma receita publicada no catálogo." />
        ) : (
          <ul className="insights-related">
            {recipes.data.map((item) => (
              <li key={item.id} className="insights-related-recipe">
                <CatalogImage stitched={false} url={item.image_url} name={item.name} />
                <div>
                  <h4>{item.name}</h4>
                  <p className="insights-muted">
                    {[item.prep_time && `${item.prep_time} min`, item.servings && `${item.servings} porções`].filter(Boolean).join(' · ')}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => onOpenRecipe(item)}>
                    Ver receita
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
