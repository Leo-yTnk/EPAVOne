import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { beforeEach, expect, it, vi } from 'vitest';
import { CreationPage } from '../src/products/insights/creation/CreationPage.jsx';
import { MaintenancePanel } from '../src/products/insights/creation/admin/MaintenancePanel.jsx';
import { adminService, catalogPriceSync } from '../src/products/insights/creation/services/adminService.js';
vi.mock('../src/products/insights/creation/services/adminService.js', () => ({
  adminService: { cleanup: vi.fn() },
  catalogPriceSync: {
    snapshot: () => ({ phase: 'idle', processed: 0, total: 0, updated: 0, unchanged: 0, failed: 0, failures: [] }),
    subscribe: vi.fn(() => () => {}),
    start: vi.fn()
  }
}));
beforeEach(() => vi.clearAllMocks());
it('denies a regular account a manually entered admin route', () => {
  render(
    <CreationPage route={{ segments: ['criacao', 'admin'] }} account={{ session: { user: { id: 'user' } }, profile: { role: 'seller' } }} />
  );
  expect(screen.getByText('Acesso restrito')).toBeTruthy();
  expect(screen.queryByLabelText('Área administrativa')).toBeNull();
});
it('requires password, exact confirmation and acknowledgement for permanent cleanup', async () => {
  adminService.cleanup.mockResolvedValue({});
  render(<MaintenancePanel />);
  fireEvent.click(screen.getByRole('button', { name: 'Excluir todas as receitas e produtos públicos' }));
  const confirm = screen.getByRole('button', { name: 'Confirmar exclusão permanente' });
  expect(confirm.disabled).toBe(true);
  fireEvent.input(screen.getByLabelText('Digite EXCLUIR'), { target: { value: 'EXCLUIR' } });
  fireEvent.input(screen.getByLabelText('Sua senha de administrador'), { target: { value: 'fixture-password' } });
  expect(confirm.disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(confirm);
  await waitFor(() => expect(adminService.cleanup).toHaveBeenCalledWith('all', 'fixture-password'));
  expect(screen.queryByLabelText('Sua senha de administrador')).toBeNull();
});
it('shows real progress and resumes a paused catalog update', async () => {
  let update;
  catalogPriceSync.subscribe.mockImplementation((callback) => {
    update = callback;
    return () => {};
  });
  catalogPriceSync.start.mockImplementation(async () => {
    update({ phase: 'paused', processed: 2, total: 5, updated: 1, unchanged: 1, failed: 0, failures: [], error: 'Rede indisponível' });
  });
  render(<MaintenancePanel />);
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar preços públicos' }));
  await screen.findByText('Atualização pausada');
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2');
  expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('5');
  expect(screen.queryByText('Consulta concluída')).toBeNull();
  catalogPriceSync.start.mockImplementation(async () => {
    update({ phase: 'completed', processed: 5, total: 5, updated: 3, unchanged: 2, failed: 0, failures: [] });
  });
  fireEvent.click(screen.getByRole('button', { name: 'Retomar atualização' }));
  await screen.findByText('Consulta concluída');
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('5');
});

it('displays the estimated remaining time alongside confirmed progress', async () => {
  catalogPriceSync.start.mockImplementation(async () => {});
  let update;
  catalogPriceSync.subscribe.mockImplementation((callback) => {
    update = callback;
    return () => {};
  });
  render(<MaintenancePanel />);
  update({ phase: 'running', processed: 6, total: 1002, updated: 6, unchanged: 0, failed: 0, failures: [], remainingMs: 996000 });
  expect(await screen.findByText('Tempo restante estimado: 17 min')).toBeTruthy();
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('6');
  update({ phase: 'running', processed: 6, total: 1002, updated: 6, unchanged: 0, failed: 0, failures: [], waiting: true });
  expect(await screen.findByText('Tempo restante: aguardando confirmação do serviço…')).toBeTruthy();
});
