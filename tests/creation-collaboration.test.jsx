import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { beforeEach, expect, it, vi } from 'vitest';
import { ShareDialog } from '../src/products/insights/creation/components/ShareDialog.jsx';
import { SharedRecipeDialog } from '../src/products/insights/creation/components/SharedRecipeDialog.jsx';
import { SubmitDialog } from '../src/products/insights/creation/components/SubmitDialog.jsx';
import { collaborationService } from '../src/products/insights/creation/services/collaborationService.js';
import { creationService } from '../src/products/insights/creation/services/creationService.js';
vi.mock('../src/products/insights/creation/services/collaborationService.js', () => ({
  collaborationService: { sharing: vi.fn(), shareAction: vi.fn(), dependencies: vi.fn() }
}));
vi.mock('../src/products/insights/creation/services/creationService.js', () => ({ creationService: { detail: vi.fn(), submit: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('requires confirmation before revoking granted access', async () => {
  collaborationService.sharing.mockResolvedValue({ share: { active: true, share_code: 'TEST' }, count: 2 });
  collaborationService.shareAction.mockResolvedValue({});
  render(<ShareDialog recipe={{ id: 'one', name: 'Receita' }} onClose={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Revogar todos os acessos' }));
  expect(collaborationService.shareAction).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  await waitFor(() => expect(collaborationService.shareAction).toHaveBeenCalledWith('one', 'revoke'));
});
it('loads private shared ingredients through the authenticated creation service', async () => {
  creationService.detail.mockResolvedValue({
    recipe: { instructions: ['Misture'], servings: 2, prep_time: 10 },
    ingredients: [{ id: 'ing', quantity: 1, product: { name: 'Produto pessoal', unit: 'kg' } }]
  });
  render(<SharedRecipeDialog recipe={{ id: 'private', name: 'Receita privada' }} onClose={vi.fn()} />);
  await screen.findByText('1 kg · Produto pessoal');
  expect(creationService.detail).toHaveBeenCalledWith('recipes', { id: 'private', name: 'Receita privada' });
});
it('blocks submitting a recipe while personal dependencies remain', async () => {
  collaborationService.dependencies.mockResolvedValue({ blocked: true, product_refs: [{ name: 'Produto pessoal' }], category_refs: [] });
  render(<SubmitDialog type="recipes" item={{ id: 'one', name: 'Receita' }} onClose={vi.fn()} />);
  await screen.findByText('Publique as dependências primeiro');
  expect(screen.getByRole('button', { name: 'Enviar solicitação' }).disabled).toBe(true);
  expect(creationService.submit).not.toHaveBeenCalled();
});
