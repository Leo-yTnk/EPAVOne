import { Breadcrumb, Button, PageHeader } from '../../design-system/components/index.js';
import { YOURCIPE_URL } from '../../shared/config/catalog.js';
import { ProductCatalogPage } from './components/ProductCatalogPage.jsx';
import { RecipesPage } from './components/RecipesPage.jsx';
import { InsightsHomePage } from './components/InsightsHomePage.jsx';
import './insights.css';

const sections = {
  receitas: {
    title: 'Receitas para inspirar o atendimento',
    description: 'Encontre ideias de preparo, confira ingredientes e sugira uma refeição completa.'
  },
  produtos: {
    title: 'Produtos para sua próxima venda',
    description: 'Consulte o catálogo Swift, compare preços e encontre receitas relacionadas.'
  }
};
export function InsightsRoutes({ route }) {
  const section = route.segments[0] || 'home';
  const info = sections[section];
  const home = section === 'home';
  return (
    <section className="product-page">
      <Breadcrumb
        items={[
          { label: 'EPAVOne', href: '#/' },
          { label: 'Insights', href: home ? undefined : '#/insights' },
          ...(!home ? [{ label: info ? section[0].toUpperCase() + section.slice(1) : 'Continuar no Yourcipe' }] : [])
        ]}
      />
      {info && <PageHeader eyebrow="EPAVInsights" title={info.title} description={info.description} />}
      {home ? (
        <InsightsHomePage />
      ) : section === 'receitas' ? (
        <RecipesPage />
      ) : section === 'produtos' ? (
        <ProductCatalogPage initialCategory={route.segments[1] === 'categoria' ? route.segments[2] || '' : ''} />
      ) : (
        <PageHeader
          eyebrow="EPAVInsights"
          title="Seu Yourcipe continua disponível"
          description="Acesse sua conta e os recursos ainda não migrados no Yourcipe."
          actions={
            <Button as="a" href={YOURCIPE_URL} target="_blank" rel="noopener noreferrer" variant="secondary">
              Abrir Yourcipe ↗
            </Button>
          }
        />
      )}
    </section>
  );
}
