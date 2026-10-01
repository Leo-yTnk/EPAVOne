import { useEffect, useRef, useState } from 'preact/hooks';
import { Badge, Button, Card } from '../../../design-system/components/index.js';
import { findSwiftImage } from '../services/swiftImagesService.js';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function ProductTile({ product, quantity, onAdd }) {
  const ref = useRef(null);
  const [image, setImage] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    let started = false;
    const load = async () => {
      if (started) return;
      started = true;
      const found = await findSwiftImage(product, controller.signal);
      if (!controller.signal.aborted) setImage(found);
    };
    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                load();
                observer.disconnect();
              }
            },
            { rootMargin: '100px' }
          )
        : null;
    if (observer && ref.current) observer.observe(ref.current);
    else load();
    return () => {
      controller.abort();
      observer?.disconnect();
    };
  }, [product]);
  return (
    <div ref={ref}>
      <Card className="writer-product">
        {image && <img className="writer-product-image" src={image} alt={product.name} loading="lazy" onError={() => setImage(null)} />}
        <h3>{product.name}</h3>
        {product.unit === 'KG' && <Badge>Peso estimado do formulário</Badge>}
        <strong className="writer-price">{product.price === null ? 'Preço indisponível' : money.format(product.price)}</strong>
        <Button variant="secondary" disabled={product.price === null || product.price <= 0} onClick={onAdd}>
          {quantity ? `Adicionar mais · ${quantity} no pedido` : 'Adicionar ao pedido'}
        </Button>
      </Card>
    </div>
  );
}
