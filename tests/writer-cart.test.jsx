import { useState } from 'preact/hooks';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { ProductCatalog } from '../src/products/writer/components/ProductCatalog.jsx';
import { OrderCart } from '../src/products/writer/components/OrderCart.jsx';
import { findSwiftImage } from '../src/products/writer/services/swiftImagesService.js';

vi.mock('../src/products/writer/services/swiftImagesService.js', () => ({ findSwiftImage: vi.fn().mockResolvedValue(null) }));
const products = [
  { name: 'Filé de Frango 1kg', code: '123', price: 20 },
  { name: 'Pão de Queijo 400g', code: '456', price: 10 }
];

function CartSession() {
  const [lines, setLines] = useState([]);
  return (
    <>
      <ProductCatalog
        products={products}
        lines={lines}
        onAdd={(name) =>
          setLines((current) => {
            const exists = current.some((line) => line.name === name);
            return exists
              ? current.map((line) => (line.name === name ? { ...line, quantity: line.quantity + 1 } : line))
              : [...current, { name, quantity: 1 }];
          })
        }
      />
      <OrderCart
        template={{ products, capacity: 12, kitOptions: ['sim'] }}
        lines={lines}
        onChange={(name, patch) => setLines((current) => current.map((line) => (line.name === name ? { ...line, ...patch } : line)))}
        onRemove={(name) => setLines((current) => current.filter((line) => line.name !== name))}
      />
    </>
  );
}

describe('Product picker and list cart', () => {
  it('keeps the catalog unmounted when closed, limits each page and searches by code without images', () => {
    findSwiftImage.mockClear();
    const many = Array.from({ length: 633 }, (_, i) => ({ name: `Produto ${i}`, code: String(1000 + i), price: 5 }));
    render(<ProductCatalog products={many} lines={[]} onAdd={vi.fn()} />);
    expect(screen.queryByRole('article')).toBeNull();
    expect(findSwiftImage).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'Adicionar produto' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar produto' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(24);
    expect(within(dialog).queryByText('Produto 0')).toBeNull();
    expect(within(dialog).getByText('Produto 24')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(24);
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: '1029' } });
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Páginas de produtos' })).toBeNull();
    expect(within(dialog).getByText('Produto 29')).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Anterior' }).disabled).toBe(true);
    expect(within(dialog).getByText('Produto 0')).toBeTruthy();
    expect(findSwiftImage).not.toHaveBeenCalled();
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: 'inexistente' } });
    expect(within(dialog).getByText('Nenhum produto encontrado')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Adicionar produto' }));
  });

  it('shows full long names, keeps unavailable prices disabled and bounds the last page', () => {
    const name = 'Filé de peito de frango temperado com ervas finas e especiarias Swift embalagem econômica congelada 1,5 kg';
    const add = vi.fn();
    const items = Array.from({ length: 25 }, (_, i) => ({
      name: i === 24 ? name : `Item ${i}`,
      code: String(i),
      price: i === 24 ? null : 10
    }));
    render(<ProductCatalog products={items} lines={[]} onAdd={add} />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar produto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(1);
    expect(within(dialog).getByRole('heading', { name }).textContent).toBe(name);
    expect(screen.getByRole('button', { name: 'Próxima' }).disabled).toBe(true);
    const button = within(dialog).getByRole('button', { name: 'Adicionar ao pedido' });
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(add).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(24);
  });

  it('adds list rows, preserves search when reopening, updates totals, merges duplicates and removes items', () => {
    findSwiftImage.mockClear();
    render(<CartSession />);
    const open = () => fireEvent.click(screen.getByRole('button', { name: 'Adicionar produto' }));
    const select = () =>
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Adicionar ao pedido|Adicionar mais/ }));
    open();
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: 'file' } });
    select();
    const cart = screen.getByRole('region', { name: 'Seu carrinho' });
    expect(within(cart).getAllByRole('article')).toHaveLength(2);
    const quantity = screen.getByLabelText('Quantidade de Filé de Frango 1kg');
    fireEvent.input(quantity, { target: { value: '3' } });
    expect(within(cart).getAllByText(/R\$\s*60,00/)).toHaveLength(2);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Kit' }));
    expect(screen.getByRole('checkbox', { name: 'Kit' }).checked).toBe(true);
    open();
    expect(screen.getByLabelText('Buscar produto').value).toBe('file');
    select();
    expect(quantity.value).toBe('4');
    expect(within(cart).getAllByRole('article')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Remover Filé de Frango 1kg' }));
    expect(screen.queryByLabelText('Quantidade de Filé de Frango 1kg')).toBeNull();
    expect(screen.getByText('Seu carrinho está vazio')).toBeTruthy();
    expect(within(cart).getByText(/R\$\s*0,00/)).toBeTruthy();
    expect(findSwiftImage).not.toHaveBeenCalled();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
