import { describe, expect, it } from 'vitest';
import { parseHash, routeHash, routeScrollKey } from '../src/app/routes.js';

describe('router', () => {
  it('keeps deep Insights segments', () => {
    expect(parseHash('#/insights/clientes/123/historico')).toEqual({
      product: 'insights',
      segments: ['clientes', '123', 'historico'],
      raw: 'insights/clientes/123/historico'
    });
  });
  it('builds product routes', () => {
    expect(routeHash('insights', ['indicadores'])).toBe('#/insights/indicadores');
  });
  it('removes development routes from the app', () => {
    expect(parseHash('#/dev/components').product).toBe('home');
  });
  it('opens workspace settings', () => {
    expect(parseHash('#/settings').product).toBe('settings');
  });
});

it('shares scroll position across client list tabs and tabs of the same profile', () => {
  const key = (hash) => routeScrollKey(parseHash(hash));
  expect(key('#/planner/clientes/oportunidades')).toBe(key('#/planner/clientes'));
  expect(key('#/planner/clientes/ana/historico')).toBe(key('#/planner/clientes/ana/preparar'));
  expect(key('#/planner/clientes/ana/combinados')).toBe(key('#/planner/clientes/ana'));
  expect(key('#/planner/clientes/ana/oportunidades')).toBe(key('#/planner/clientes/ana'));
  expect(key('#/planner/clientes/ana')).not.toBe(key('#/planner/clientes/bruno'));
  expect(key('#/planner/clientes/ana')).not.toBe(key('#/planner/clientes'));
  expect(key('#/planner/clientes/novo')).not.toBe(key('#/planner/clientes'));
  expect(key('#/planner/semana')).not.toBe(key('#/planner/clientes'));
  expect(key('#/insights/produtos')).not.toBe(key('#/insights/receitas'));
});
