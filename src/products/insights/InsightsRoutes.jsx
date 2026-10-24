import { lazy, Suspense } from 'preact/compat';
import { Breadcrumb, Button, AppLogo, PageHeader, Spinner } from '../../design-system/components/index.js';
import { ProductCatalogPage } from './components/ProductCatalogPage.jsx';
import { RecipesPage } from './components/RecipesPage.jsx';
import { InsightsHomePage } from './components/InsightsHomePage.jsx';
import './insights.css';
import './catalog-cards.css';
import './detail-sheet.css';
import './insights-design.css';
import { InsightsPageHeader } from './components/InsightsPageHeader.jsx';
const CreationPage = lazy(() => import('./creation/CreationPage.jsx').then((module) => ({ default: module.CreationPage })));

const sections = {
  receitas: {
    title: 'Receitas'
  },
  produtos: {
    title: 'Produtos'
  }
};
export function InsightsRoutes({ route, account, onOpenAccount }) {
  const section = route.segments[0] || 'home';
  const info = sections[section];
  if (section === 'criacao')
    return (
      <Suspense fallback={<Spinner />}>
        <CreationPage key={account?.session?.user?.id || 'guest'} route={route} account={account} onOpenAccount={onOpenAccount} />
      </Suspense>
    );
  const home = section === 'home';
  return (
    <section className="product-page insights-page">
      {!home && (
        <Breadcrumb
          items={[
            { label: 'EPAVOne', href: '#/' },
            { label: 'Insights', href: home ? undefined : '#/insights' },
            ...(!home ? [{ label: info ? section[0].toUpperCase() + section.slice(1) : 'Página não encontrada' }] : [])
          ]}
        />
      )}
      {info && <InsightsPageHeader title={info.title} />}
      {home ? (
        <InsightsHomePage />
      ) : section === 'receitas' ? (
        <RecipesPage key={route.segments.join('/')} initialSection={route.segments[1] === 'secao' ? route.segments[2] || '' : ''} />
      ) : section === 'produtos' ? (
        <ProductCatalogPage
          key={route.segments.join('/')}
          initialSection={route.segments[1] === 'secao' ? route.segments[2] || '' : ''}
          initialQuery={
            route.segments[1] === 'busca'
              ? (() => {
                  try {
                    return decodeURIComponent(route.segments[2] || '');
                  } catch {
                    return '';
                  }
                })()
              : ''
          }
          initialCategory={route.segments[1] === 'categoria' ? route.segments[2] || '' : ''}
        />
      ) : (
        <PageHeader
          eyebrow={<AppLogo product="insights" wordmark />}
          title="Página não encontrada"
          description="Volte ao catálogo do EPAVInsights."
          actions={
            <Button as="a" href="#/insights" target="_blank" rel="noopener noreferrer" variant="secondary">
              Abrir Insights
            </Button>
          }
        />
      )}
    </section>
  );
}
