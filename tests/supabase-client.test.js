import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveSupabaseConfig } from '../src/shared/config/supabase.js';
import { createSupabaseClient } from '../src/shared/services/supabaseClient.js';

afterEach(() => vi.unstubAllGlobals());
const client = createSupabaseClient({ url: 'https://example.supabase.co', key: 'sb_publishable_test' });
describe('shared Supabase foundation', () => {
  it('keeps the Yourcipe project and supports both build configuration names', () => {
    expect(resolveSupabaseConfig().url).toBe('https://ytvztfvypiwgnslisxep.supabase.co');
    expect(resolveSupabaseConfig({ VITE_CATALOG_URL: 'https://legacy.test/', VITE_CATALOG_PUBLISHABLE_KEY: 'old' })).toEqual({
      url: 'https://legacy.test',
      key: 'old'
    });
    expect(
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: 'https://new.test/',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'new',
        VITE_CATALOG_URL: 'https://legacy.test',
        VITE_CATALOG_PUBLISHABLE_KEY: 'old'
      })
    ).toEqual({ url: 'https://new.test', key: 'new' });
  });
  it('rejects an already cancelled request before starting transport', async () => {
    const transport = vi.fn();
    vi.stubGlobal('fetch', transport);
    const controller = new AbortController();
    controller.abort();
    await expect(client.readRows('products', {}, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(transport).not.toHaveBeenCalled();
  });
  it('does not leak server response details and preserves status for consumers', async () => {
    const json = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, json }));
    await expect(client.readRows('products')).rejects.toMatchObject({ code: 'SUPABASE_HTTP_ERROR', status: 403 });
    expect(json).not.toHaveBeenCalled();
  });
  it('rejects malformed row payloads and network failures with stable codes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ error: 'unexpected' }) }));
    await expect(client.readRows('products')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));
    await expect(client.readRows('products')).rejects.toMatchObject({ code: 'SUPABASE_REQUEST_FAILED' });
  });
  it('treats malformed totals as unknown so pagination can continue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [], headers: new Headers({ 'content-range': '0-0/invalid' }) })
    );
    expect(await client.readRows('products')).toEqual({ rows: [], total: null });
  });
  it('rejects paths outside a PostgREST resource before fetching', async () => {
    const transport = vi.fn();
    vi.stubGlobal('fetch', transport);
    await expect(client.readRows('../auth/v1')).rejects.toMatchObject({ code: 'INVALID_RESOURCE' });
    expect(transport).not.toHaveBeenCalled();
  });
});
