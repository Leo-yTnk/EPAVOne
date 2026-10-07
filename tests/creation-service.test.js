import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/shared/services/accountService.js', () => ({ authenticatedClient: {} }));
import { createCreationService, result } from '../src/products/insights/creation/services/creationService.js';
import { editorValues, validateEditor } from '../src/products/insights/creation/models/editor.js';
describe('Creation writes', () => {
  it('uses a single transactional recipe RPC and ignores spoofed ownership', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { id: 'r' } });
    const service = createCreationService({}, { rpc }, async () => ({ id: 'signed-in' }));
    const values = {
      ...editorValues(),
      name: 'Receita',
      categoryId: 'cat',
      instructions: 'Etapa 1\n\nEtapa 2',
      ingredients: [{ productId: 'p', quantity: '2' }],
      owner_id: 'someone-else'
    };
    await service.save('recipes', 'personal', { id: 'r', version: 4 }, values);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][0]).toBe('save_creation_recipe');
    expect(rpc.mock.calls[0][1]).toMatchObject({
      p_id: 'r',
      p_expected_version: 4,
      p_scope: 'personal',
      p_fields: { status: 'private', instructions: ['Etapa 1', 'Etapa 2'] },
      p_ingredients: [{ product_id: 'p', quantity: 2 }]
    });
    expect(rpc.mock.calls[0][1].p_fields.owner_id).toBeUndefined();
  });
  it('does not fall back to destructive multi-call writes when the RPC is missing', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { code: 'PGRST202' } });
    const service = createCreationService({}, { rpc }, async () => ({ id: 'a' }));
    await expect(
      service.save('products', 'personal', null, { ...editorValues(), name: 'Produto', categoryId: 'c', price: 10 })
    ).rejects.toThrow('diagnóstico');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('blocks invalid quantities, duplicate ingredients and unsafe image protocols before writing', () => {
    const values = { ...editorValues(), name: 'Nome', categoryId: 'c' };
    expect(validateEditor('recipes', { ...values, imageUrl: 'javascript:alert(1)' })).toMatch(/HTTP/);
    expect(validateEditor('recipes', { ...values, ingredients: [{ productId: 'a', quantity: -1 }] })).toMatch(/positiva/);
    expect(
      validateEditor('recipes', {
        ...values,
        ingredients: [
          { productId: 'a', quantity: 1 },
          { productId: 'a', quantity: 2 }
        ]
      })
    ).toMatch(/repetidos/);
  });
  it('requires the active user before creating a personal category', async () => {
    const createCategory = vi.fn().mockResolvedValue({ data: { id: 'c' } });
    const service = createCreationService({ createCategory }, {}, async () => ({ id: 'actual-user' }));
    await service.save('categories', 'personal', null, { ...editorValues(), name: 'Categoria' });
    expect(createCategory).toHaveBeenCalledWith('actual-user', expect.objectContaining({ name: 'Categoria' }));
  });
  it('translates conflict, permissions and missing dependencies without exposing technical messages', async () => {
    for (const [error, message] of [
      [{ code: 'P0001', message: 'version_conflict: db details' }, 'outra sessão'],
      [{ code: '42501', message: 'not_admin' }, 'permissão'],
      [{ code: '23503', message: 'constraint recipe_fk' }, 'deixou de estar disponível'],
      [{ code: '23505', message: 'constraint name_key' }, 'Já existe']
    ])
      await expect(result(Promise.resolve({ error }))).rejects.toThrow(message);
  });
  it('refreshes product values and version before reopening the editor', async () => {
    const item = { id: 'p', scope: 'personal', name: 'Atualizado', version: 7 };
    const fetchCreationItem = vi.fn().mockResolvedValue({ data: item });
    const service = createCreationService({ fetchCreationItem, fetchProductSections: vi.fn().mockResolvedValue({ data: [] }) });
    const detail = await service.detail('products', { id: 'p', scope: 'personal', version: 2 });
    expect(detail.item).toEqual(item);
    expect(fetchCreationItem).toHaveBeenCalledWith('products', 'p');
  });
});
