import { Badge, Breadcrumb, Card, Nav, PageHeader } from '../../design-system/components/index.js';
import { routeHash } from '../../app/routes.js';

const navItems = ['','receitas','produtos','indicadores','historico','perfil'].map(slug => ({ slug, label: slug ? slug[0].toUpperCase()+slug.slice(1) : 'Visão geral' }));

export function InsightsRoutes({ route }) {
  const section = route.segments[0] || '';
  const title = route.segments.length ? route.segments.at(-1).replace(/[-_]/g,' ') : 'Visão geral';
  const items = navItems.map(item => ({ href:item.slug?routeHash('insights',[item.slug]):'#/insights', label:item.label, active:item.slug===section }));
  const crumbs = [{label:'EPAVOne',href:'#/'},{label:'Insights',href:'#/insights'},...route.segments.map((segment,index)=>({label:segment.replace(/[-_]/g,' '),href:index===route.segments.length-1?undefined:routeHash('insights',route.segments.slice(0,index+1))}))];
  return <section className="product-page"><Breadcrumb items={crumbs}/><PageHeader eyebrow="EPAVInsights" title={title[0].toUpperCase()+title.slice(1)} description="Estrutura pronta para receber o piloto real sem criar CSS específico por página." actions={<Badge tone="info">Rota modular</Badge>}/><Nav items={items} label="Navegação do EPAVInsights"/><Card className="placeholder-card"><Badge>Em preparação</Badge><h2 className="ds-heading-h3">Conteúdo isolado dentro do produto</h2><p>Esta página já pertence a <code>src/products/insights</code>. Serviços, modelos e componentes específicos do Insights permanecerão aqui.</p></Card></section>;
}
