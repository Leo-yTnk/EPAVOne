import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WriterRoutes } from '../src/products/writer/WriterRoutes.jsx';
import { App } from '../src/app/App.jsx';
import { ProductCatalog } from '../src/products/writer/components/ProductCatalog.jsx';
import { writerTemplate } from './helpers/writerTemplate.js';
import { importTemplate } from '../src/products/writer/services/templateService.js';
vi.mock('../src/products/writer/services/swiftImagesService.js', () => ({ findSwiftImage: vi.fn().mockResolvedValue(null) }));
vi.mock('../src/products/writer/services/templateService.js', () => ({ importTemplate: vi.fn() }));
vi.mock('../src/app/account/useAccount.js', () => ({ useAccount: () => ({ session: null }) }));
vi.mock('../src/products/writer/models/order.js', async (importOriginal) => ({
  ...(await importOriginal()),
  saoPauloDay: () => '2026-09-30'
}));
beforeEach(() => importTemplate.mockReset());
describe('Writer interactions', () => {
  it('requires a weekly upload before displaying the catalog or export action', () => {
    render(<WriterRoutes />);
    expect(screen.getByLabelText(/Carregar pedido semanal · obrigatório/)).toBeTruthy();
    expect(screen.queryByLabelText('Buscar produto')).toBeNull();
    expect(screen.queryByText('Validar e baixar pedido')).toBeNull();
  });
  it('preserves the current customer and validated template when a replacement file fails', async () => {
    const actual = await vi.importActual('../src/products/writer/services/templateService.js');
    const template = await actual.importTemplate(await writerTemplate(), '2026-09-30');
    let rejectReplacement;
    importTemplate.mockResolvedValueOnce(template).mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          rejectReplacement = reject;
        })
    );
    render(<WriterRoutes />);
    fireEvent.input(screen.getByLabelText(/Carregar pedido semanal/), { target: { files: [new File(['x'], 'pedido.xlsx')] } });
    await screen.findByRole('region', { name: 'Etapa 1: Cliente' });
    for (const [label, value] of [
      [/Sala · obrigatória/, '8ºD'],
      [/Aluno · obrigatório/, 'Aluno'],
      [/Cliente · obrigatório/, 'Cliente']
    ]) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      fireEvent.click(screen.getByRole('option', { name: value }));
    }
    fireEvent.input(screen.getByLabelText(/CPF do cliente/), { target: { value: '01234567890' } });
    fireEvent.input(screen.getByLabelText(/Trocar formulário/), { target: { files: [new File(['broken'], 'outro.xlsx')] } });
    await screen.findByText('Verificando período, menus e fórmulas…');
    expect(screen.getByLabelText(/CPF do cliente/).value).toBe('01234567890');
    rejectReplacement(new Error('Arquivo inválido.'));
    await screen.findByText(/Seu formulário e pedido anteriores foram preservados/);
    expect(screen.getByLabelText(/CPF do cliente/).value).toBe('01234567890');
    expect(screen.getByText('Formulário da semana validado')).toBeTruthy();
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
    expect(screen.queryByLabelText('Buscar produto')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar produto' }));
    fireEvent.input(screen.getByLabelText('Buscar produto'), { target: { value: 'file' } });
    expect(screen.queryByText('Pão de Queijo 400g')).toBeNull();
    fireEvent.click(screen.getByText('Adicionar ao pedido'));
    expect(add).toHaveBeenCalledWith('Filé de Frango 1kg');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(screen.queryByRole('img')).toBeNull());
  });
  it('starts with client data, guards each step and preserves the cart and corrected CPF when returning', async () => {
    const actual = await vi.importActual('../src/products/writer/services/templateService.js');
    const template = await actual.importTemplate(await writerTemplate(), '2026-09-30');
    importTemplate.mockResolvedValueOnce(template);
    window.location.hash = '#/writer';
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<App />);
    fireEvent.input(screen.getByLabelText(/Carregar pedido semanal/), { target: { files: [new File(['x'], 'pedido.xlsx')] } });
    await screen.findByRole('region', { name: 'Etapa 1: Cliente' });
    expect(screen.queryByLabelText('Buscar produto')).toBeNull();
    expect(screen.getByRole('button', { name: 'Continuar para produtos' }).disabled).toBe(true);
    const choose = (label, value) => {
      fireEvent.click(screen.getByRole('button', { name: label }));
      fireEvent.click(screen.getByRole('option', { name: value }));
    };
    choose(/Sala · obrigatória/, '8ºD');
    choose(/Aluno · obrigatório/, 'Aluno');
    choose(/Cliente · obrigatório/, 'Cliente');
    expect(screen.queryByLabelText('Buscar cliente da sala')).toBeNull();
    fireEvent.input(screen.getByLabelText(/CPF do cliente · obrigatório/), { target: { value: '01234567890' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar para produtos' }));
    expect((await screen.findByRole('region', { name: 'Etapa 2: Produtos' })).dataset.direction).toBe('forward');
    expect(screen.getByRole('button', { name: 'Continuar para entrega' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar produto' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Adicionar ao pedido' })[0]);
    fireEvent.click(screen.getByRole('tab', { name: 'One' }));
    fireEvent(window, new Event('hashchange'));
    await screen.findByRole('heading', { name: 'Por onde vamos começar?' });
    expect(screen.queryByRole('button', { name: 'Adicionar produto' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Writer' }));
    fireEvent(window, new Event('hashchange'));
    await screen.findByRole('region', { name: 'Etapa 2: Produtos' });
    expect(screen.getByLabelText(/^Quantidade de/).value).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar para entrega' }));
    await screen.findByRole('region', { name: 'Etapa 3: Entrega' });
    choose(/Entrega ou retirada/, 'Retira - Outras Lojas');
    choose(/Loja para retirada/, 'Loja');
    fireEvent.input(screen.getByLabelText(/Data de entrega ou retirada/), { target: { value: '2026-10-02' } });
    choose(/Pagamento · obrigatório/, 'Pix');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar para conferência' }));
    await screen.findByRole('region', { name: 'Etapa 4: Conferência' });
    expect(screen.getByText('*01234567890')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Validar e baixar pedido' }).disabled).toBe(false);
    expect(screen.queryByLabelText(/^Quantidade de/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Editar cliente' }));
    expect(screen.getByRole('region', { name: 'Etapa 1: Cliente' }).dataset.direction).toBe('backward');
    expect(screen.getByLabelText(/CPF do cliente/).value).toBe('01234567890');
    fireEvent.input(screen.getByLabelText(/CPF do cliente/), { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Continuar para produtos' }).disabled).toBe(true);
    fireEvent.input(screen.getByLabelText(/CPF do cliente/), { target: { value: '01234567890' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar para produtos' }));
    expect(screen.getByLabelText(/^Quantidade de/).value).toBe('1');
  });
});
