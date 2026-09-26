import { describe,expect,it } from 'vitest';
import { parseHash,routeHash } from '../src/app/routes.js';

describe('router',()=>{
  it('keeps deep Insights segments',()=>{ expect(parseHash('#/insights/clientes/123/historico')).toEqual({product:'insights',segments:['clientes','123','historico'],raw:'insights/clientes/123/historico'}); });
  it('builds product routes',()=>{ expect(routeHash('insights',['indicadores'])).toBe('#/insights/indicadores'); });
  it('isolates dev routes',()=>{ expect(parseHash('#/dev/components').product).toBe('dev'); });
});
