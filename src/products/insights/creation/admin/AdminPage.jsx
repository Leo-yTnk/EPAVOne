import { useRef, useState } from 'preact/hooks';
import { useContentMotion } from '../../../../design-system/behaviors/useContentMotion.js';
import { Alert, Button, Card, Icon, Select } from '../../../../design-system/components/index.js';
import { EntityManager } from '../components/EntityManager.jsx';
import { RequestsPage } from '../components/RequestsPage.jsx';
import { SectionsManager } from './SectionsManager.jsx';
import { ImportPanel } from './ImportPanel.jsx';
import { DuplicateCheckPanel } from './DuplicateCheckPanel.jsx';
import { MaintenancePanel } from './MaintenancePanel.jsx';
const areas = [
  ['recipes', 'Receitas públicas'],
  ['products', 'Produtos públicos'],
  ['categories', 'Categorias públicas'],
  ['sections', 'Páginas e seções'],
  ['requests', 'Revisar solicitações'],
  ['import', 'Importar catálogo'],
  ['duplicates', 'Verificar duplicatas'],
  ['maintenance', 'Preços e manutenção']
].map(([value, label]) => ({ value, label }));
const descriptions = {
  recipes: 'Edite receitas e confira seu estado de publicação.',
  products: 'Organize imagens, categorias e detalhes dos produtos.',
  categories: 'Mantenha a classificação do catálogo consistente.',
  sections: 'Escolha onde cada conteúdo aparece na vitrine.',
  requests: 'Avalie conteúdos enviados para publicação.',
  import: 'Confira o arquivo e escolha o conteúdo de cada duplicata.',
  duplicates: 'Encontre correspondências antes de alterar o catálogo.',
  maintenance: 'Acompanhe os preços e revise as observações da Swift.'
};
export function AdminPage({ profile }) {
  const [area, setArea] = useState('recipes');
  const contentRef = useRef(null);
  useContentMotion(
    contentRef,
    area,
    areas.findIndex((item) => item.value === area),
    'y'
  );
  if (profile?.role !== 'admin')
    return (
      <Alert tone="danger" title="Acesso restrito">
        Esta área exige uma conta administradora.
      </Alert>
    );
  return (
    <section className="creation-fields creation-admin-workspace">
      <Card as="header" className="creation-admin-header creation-fields">
        <div className="creation-section-heading">
          <h3 className="creation-section-title">
            <Icon name="settings" /> Catálogo e publicação
          </h3>
          <p>Revise o conteúdo, organize a vitrine e acompanhe os preços.</p>
        </div>
        <div className="creation-toolbar">
          <Button variant="secondary" onClick={() => setArea('import')}>
            Importar Excel do catálogo
          </Button>
          <Button variant="ghost" onClick={() => setArea('duplicates')}>
            Verificar duplicatas
          </Button>
          <Button variant="ghost" onClick={() => setArea('maintenance')}>
            Consultar preços Swift
          </Button>
        </div>
      </Card>
      <Card as="nav" aria-label="Navegação administrativa" className="creation-admin-navigation">
        <Select label="Área administrativa" value={area} options={areas} onChange={setArea} />
        <div className="creation-admin-context">
          <span className="ds-overline">Área selecionada</span>
          <h3>{areas.find((item) => item.value === area).label}</h3>
          <p>{descriptions[area]}</p>
        </div>
      </Card>
      <div ref={contentRef} className="creation-fields">
        {['recipes', 'products', 'categories'].includes(area) ? (
          <EntityManager key={area} type={area} scope="site" />
        ) : area === 'requests' ? (
          <RequestsPage admin />
        ) : area === 'sections' ? (
          <SectionsManager />
        ) : area === 'duplicates' ? (
          <DuplicateCheckPanel />
        ) : area === 'import' ? (
          <ImportPanel />
        ) : (
          <MaintenancePanel />
        )}
      </div>
    </section>
  );
}
