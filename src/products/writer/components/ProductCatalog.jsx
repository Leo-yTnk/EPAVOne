import { useCallback, useMemo, useState } from 'preact/hooks';
import { Button, Dialog, EmptyState, Input } from '../../../design-system/components/index.js';
import { normalize } from '../models/order.js';
import { ProductTile } from './ProductTile.jsx';
export function ProductCatalog({ products, lines, onAdd }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(24);
  const filtered = useMemo(
    () => products.filter((item) => normalize(item.name).includes(normalize(query)) || item.code?.includes(query.trim())),
    [products, query]
  );
  return (
    <section aria-labelledby="writer-catalog-title" className="writer-catalog">
      <div className="writer-catalog-heading">
        <div>
          <span className="ds-overline">2 · Produtos</span>
          <h2 id="writer-catalog-title" className="ds-heading-h3">
            Monte o pedido
          </h2>
          <p className="writer-muted">Escolha um produto e ajuste a quantidade no card do carrinho.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Adicionar produto</Button>
      </div>
      <Dialog open={open} title="Selecionar produto" size="lg" onClose={close}>
        <div className="writer-picker-search">
          <Input
            id="writer-search"
            type="search"
            label="Buscar produto"
            placeholder="Nome, ingrediente ou código do produto"
            value={query}
            onInput={(event) => {
              setQuery(event.currentTarget.value);
              setLimit(24);
            }}
          />
          <p className="writer-muted" role="status">
            {filtered.length} produtos encontrados. Preços do formulário semanal.
          </p>
        </div>
        <div className="writer-catalog-grid">
          {filtered.slice(0, limit).map((product) => (
            <ProductTile
              key={product.name}
              product={product}
              quantity={lines.find((line) => line.name === product.name)?.quantity ?? 0}
              onAdd={() => {
                onAdd(product.name);
                close();
              }}
            />
          ))}
        </div>
        {!filtered.length && (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Tente outro nome ou código. Apenas produtos do menu semanal aparecem aqui."
          />
        )}
        {filtered.length > limit && (
          <Button variant="secondary" onClick={() => setLimit((value) => value + 24)}>
            Mostrar mais produtos
          </Button>
        )}
      </Dialog>
    </section>
  );
}
