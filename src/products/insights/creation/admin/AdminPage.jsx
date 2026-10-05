import { useState } from 'preact/hooks';
import { Alert, Select } from '../../../../design-system/components/index.js';
import { EntityManager } from '../components/EntityManager.jsx';
import { RequestsPage } from '../components/RequestsPage.jsx';
import { SectionsManager } from './SectionsManager.jsx';
import { ImportPanel } from './ImportPanel.jsx';
import { MaintenancePanel } from './MaintenancePanel.jsx';
const areas = [
  ['recipes', 'Receitas públicas'],
  ['products', 'Produtos públicos'],
  ['categories', 'Categorias públicas'],
  ['sections', 'Páginas e seções'],
  ['requests', 'Revisar solicitações'],
  ['import', 'Importar catálogo'],
  ['maintenance', 'Preços e manutenção']
].map(([value, label]) => ({ value, label }));
export function AdminPage({ profile }) {
  const [area, setArea] = useState('recipes');
  if (profile?.role !== 'admin')
    return (
      <Alert tone="danger" title="Acesso restrito">
        Esta área exige uma conta administradora.
      </Alert>
    );
  return (
    <section className="creation-fields">
      <Select label="Área administrativa" value={area} options={areas} onChange={setArea} />
      {['recipes', 'products', 'categories'].includes(area) ? (
        <EntityManager key={area} type={area} scope="site" />
      ) : area === 'requests' ? (
        <RequestsPage admin />
      ) : area === 'sections' ? (
        <SectionsManager />
      ) : area === 'import' ? (
        <ImportPanel />
      ) : (
        <MaintenancePanel />
      )}
    </section>
  );
}
