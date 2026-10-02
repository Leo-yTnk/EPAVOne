import { CatalogImage } from './CatalogImage.jsx';

export function RecipeIngredients({ ingredients }) {
  return (
    <ul className="insights-ingredient-list" aria-label="Produtos da receita">
      {ingredients.map((item) => (
        <li key={item.id} className="insights-ingredient">
          <CatalogImage url={item.product?.image_url} name={item.product?.name || 'Ingrediente indisponível'} />
          <div>
            <strong>{item.product?.name || 'Ingrediente indisponível'}</strong>
            <span className="insights-muted">
              {item.quantity} {item.product?.unit}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
