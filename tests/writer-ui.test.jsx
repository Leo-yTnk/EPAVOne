import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { WriterRoutes } from '../src/products/writer/WriterRoutes.jsx';
import { ProductCatalog } from '../src/products/writer/components/ProductCatalog.jsx';
vi.mock('../src/products/writer/services/swiftImagesService.js', () => ({ findSwiftImage: vi.fn().mockResolvedValue(null) }));
describe('Writer interactions', () => {
  it('requires a weekly upload before displaying the catalog or export action', () => {
    render(<WriterRoutes />);
    expect(screen.getByLabelText(/Carregar pedido semanal · obrigatório/)).toBeTruthy();
    expect(screen.queryByLabelText('Buscar produto')).toBeNull();
    expect(screen.queryByText('Validar e baixar pedido')).toBeNull();
  });
  it('filters accent-insensitively and adds the exact menu product', async () => {
    const add = vi.fn();
    render(
      <ProductCatalog
        products={[
          { name: 'Filé de Frango 1kg', code: '123', price: 20 },
          { name: 'Pão de Queijo 400g', code: '456', price: 10 }
        ]}
        lines={[]}
        onAdd={add}
      />
    );
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: 'file' } });
    expect(screen.queryByText('Pão de Queijo 400g')).toBeNull();
    fireEvent.click(screen.getByText('Adicionar ao pedido'));
    expect(add).toHaveBeenCalledWith('Filé de Frango 1kg');
    await waitFor(() => expect(screen.queryByRole('img')).toBeNull());
  });
});
