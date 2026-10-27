import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { BackupPanel } from '../src/products/insights/creation/admin/BackupPanel.jsx';
import { backupTables, validateCatalogBackup } from '../src/products/insights/creation/admin/catalogBackup.js';
import { adminService } from '../src/products/insights/creation/services/adminService.js';
vi.mock('../src/products/insights/creation/services/adminService.js', () => ({
  adminService: { restoreBackup: vi.fn(async () => ({ restored: 1 })), exportBackup: vi.fn() }
}));
const snapshot = () => ({ format: 'epavone-catalog', version: 1, data: Object.fromEntries(backupTables.map((key) => [key, []])) });
it('rejects incomplete formats and requires explicit restoration consent after a valid preview', async () => {
  expect(() => validateCatalogBackup({})).toThrow('incompatível');
  const backup = snapshot();
  backup.data.recipes = [{ id: 'recipe' }];
  render(<BackupPanel />);
  expect(screen.getByRole('button', { name: 'Escolher backup JSON' })).toBeTruthy();
  fireEvent.input(screen.getByLabelText('Arquivo de backup'), {
    target: { files: [{ name: 'backup.json', size: 100, text: async () => JSON.stringify(backup) }] }
  });
  const confirm = await screen.findByRole('button', { name: 'Confirmar restauração' });
  expect(confirm.disabled).toBe(true);
  expect(adminService.restoreBackup).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(confirm);
  await waitFor(() => expect(adminService.restoreBackup).toHaveBeenCalledWith(backup));
  expect(await screen.findByText(/Restauração concluída/)).toBeTruthy();
});
it('clears the previous backup when a replacement file is invalid', async () => {
  render(<BackupPanel />);
  const input = screen.getByLabelText('Arquivo de backup');
  fireEvent.input(input, { target: { files: [{ name: 'backup.json', size: 10, text: async () => JSON.stringify(snapshot()) }] } });
  await screen.findByRole('button', { name: 'Confirmar restauração' });
  fireEvent.input(input, { target: { files: [{ name: 'bad.json', size: 10, text: async () => 'broken' }] } });
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('JSON válido'));
  expect(screen.queryByRole('button', { name: 'Confirmar restauração' })).toBeNull();
});
