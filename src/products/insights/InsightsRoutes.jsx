import { Breadcrumb, Button, PageHeader } from '../../design-system/components/index.js';
import { YOURCIPE_URL } from '../../shared/config/catalog.js';
import { ProductCatalogPage } from './components/ProductCatalogPage.jsx';
import './insights.css';

export function InsightsRoutes({ route }) {
  const catalogRoute = !route.segments.length || route.segments[0] === 'produtos';
  return (
    <section className="product-page">
      <Breadcrumb
        items={[
          { label: 'EPAVOne', href: '#/' },
          { label: 'Insights', href: catalogRoute ? undefined : '#/insights' },
          ...(!catalogRoute ? [{ label: 'Continuar no Yourcipe' }] : [])
        ]}
      />
      <PageHeader
        eyebrow="EPAVInsights"
        title={catalogRoute ? 'Produtos para sua próxima venda' : 'Seu Yourcipe continua disponível'}
        description={
          catalogRoute
            ? 'Explore o catálogo Swift e encontre receitas para ajudar no atendimento.'
            : 'A migração está começando pelo catálogo. Acesse os demais recursos no Yourcipe.'
        }
        actions={
          <Button as="a" href={YOURCIPE_URL} target="_blank" rel="noopener noreferrer" variant="secondary">
            Abrir Yourcipe ↗
          </Button>
        }
      />
      {catalogRoute ? (
        <ProductCatalogPage />
      ) : (
        <Button as="a" href="#/insights/produtos">
          Explorar produtos
        </Button>
      )}
    </section>
  );
}
