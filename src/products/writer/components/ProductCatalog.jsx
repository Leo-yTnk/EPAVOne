import { useCallback, useMemo, useState } from 'preact/hooks';
import { Button, Dialog, EmptyState, Input } from '../../../design-system/components/index.js';
import { normalize } from '../models/order.js';
import { ProductOption } from './ProductOption.jsx';
const PAGE_SIZE = 24;
export function ProductCatalog({ products, lines, onAdd }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const indexed = useMemo(
    () => products.map((product) => ({ product, name: normalize(product.name), code: String(product.code ?? '') })),
    [products]
  );
  const quantities = useMemo(() => new Map(lines.map((line) => [line.name, line.quantity])), [lines]);
  const filtered = useMemo(() => {
    if (!open) return [];
    const search = normalize(query);
    return indexed.filter((item) => item.name.includes(search) || item.code.includes(search));
  }, [indexed, query, open]);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  return (
    <section aria-labelledby="writer-catalog-title" className="writer-catalog">
      <div className="writer-catalog-heading">
        <div>
          <span className="ds-overline">2 · Produtos</span>
          <h2 id="writer-catalog-title" className="ds-heading-h3">
            Monte o pedido
          </h2>
          <p className="writer-muted">Escolha um produto e ajuste a quantidade na lista do carrinho.</p>
        </div>
        <Button onClick={() => setOpen(true)}>Adicionar produto</Button>
      </div>
      {open && (
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
                setPage(0);
              }}
            />
            <p className="writer-muted" role="status">
              {filtered.length} produtos encontrados. Preços do formulário semanal.
            </p>
          </div>
          <ul className="writer-catalog-list" aria-label="Produtos disponíveis">
            {filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map(({ product }) => (
              <li key={product.name}>
                <ProductOption
                  product={product}
                  quantity={quantities.get(product.name) ?? 0}
                  onAdd={() => {
                    onAdd(product.name);
                    close();
                  }}
                />
              </li>
            ))}
          </ul>
          {!filtered.length && (
            <EmptyState
              title="Nenhum produto encontrado"
              description="Tente outro nome ou código. Apenas produtos do menu semanal aparecem aqui."
            />
          )}
          {pageCount > 1 && (
            <nav className="writer-catalog-pagination" aria-label="Páginas de produtos">
              <Button variant="secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                Anterior
              </Button>
              <span className="writer-muted" role="status">
                Página {currentPage + 1} de {pageCount}
              </span>
              <Button variant="secondary" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>
                Próxima
              </Button>
            </nav>
          )}
        </Dialog>
      )}
    </section>
  );
}
