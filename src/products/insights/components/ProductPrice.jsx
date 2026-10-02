import { money, productPricing } from '../models/catalog.js';

export function ProductPrice({ product }) {
  const price = productPricing(product);
  return (
    <div className="insights-price">
      <p>
        <strong>{price.regular ? money(price.regular) : 'Preço indisponível'}</strong>
        {price.regular && <span> / {price.unit}</span>}
      </p>
      {price.promo && (
        <p className="insights-promotion">
          <strong>
            {money(price.promo)} / {price.unit}
          </strong>{' '}
          a partir de {price.minimum} un.
        </p>
      )}
      {price.regular && price.needsConfirmation && <small>Preço de referência · confirme na Swift</small>}
      {product.pricing_type === 'VARIABLE_WEIGHT' && <small>O valor final depende do peso da peça.</small>}
    </div>
  );
}
