import { beforeEach, expect, it, vi } from 'vitest';
import { personalRecipesRepository } from '../src/products/insights/repositories/personalRecipesRepository.js';
import { authenticatedClient } from '../src/shared/services/accountService.js';
vi.mock('../src/shared/services/accountService.js', () => ({ authenticatedClient: { from: vi.fn() } }));
let query;
beforeEach(() => {
  query = Object.fromEntries(['select', 'eq', 'order', 'range'].map((method) => [method, vi.fn().mockReturnThis()]));
  query.abortSignal = vi.fn().mockResolvedValue({ data: [] });
  authenticatedClient.from.mockReturnValue(query);
});
it('requires an owner and filters personal rows by owner, with pagination', async () => {
  expect(await personalRecipesRepository.recipes(null)).toEqual([]);
  expect(authenticatedClient.from).not.toHaveBeenCalled();
  query.abortSignal.mockResolvedValueOnce({ data: [{ id: 'a' }] }).mockResolvedValueOnce({ data: [] });
  expect(await personalRecipesRepository.recipes('A')).toEqual([{ id: 'a' }]);
  expect(query.eq).toHaveBeenCalledWith('scope', 'personal');
  expect(query.eq).toHaveBeenCalledWith('owner_id', 'A');
  expect(query.range.mock.calls).toEqual([
    [0, 199],
    [1, 200]
  ]);
});
it('reads private ingredients through an authenticated owner-scoped join and propagates errors', async () => {
  query.abortSignal.mockResolvedValueOnce({ error: { message: 'denied' } });
  await expect(personalRecipesRepository.ingredients({ id: 'r', owner_id: 'A', scope: 'personal' })).rejects.toThrow('Não foi possível');
  expect(query.eq).toHaveBeenCalledWith('recipe_id', 'r');
  expect(query.eq).toHaveBeenCalledWith('recipe.owner_id', 'A');
  expect(query.eq).toHaveBeenCalledWith('recipe.scope', 'personal');
});
