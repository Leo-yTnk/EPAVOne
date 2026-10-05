import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { beforeEach, expect, it, vi } from 'vitest';
import { CreationPage } from '../src/products/insights/creation/CreationPage.jsx';
import { MaintenancePanel } from '../src/products/insights/creation/admin/MaintenancePanel.jsx';
import { adminService } from '../src/products/insights/creation/services/adminService.js';
vi.mock('../src/products/insights/creation/services/adminService.js', () => ({ adminService: { cleanup: vi.fn(), sync: vi.fn() } }));
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
