import { useState } from 'preact/hooks';
import { Alert, Badge, Button, Card, Icon, SectionHeader } from '../../../../design-system/components/index.js';
import { adminService } from '../services/adminService.js';
import { findCatalogDuplicates } from './catalogDuplicates.js';
import { CreationThumbnail } from '../components/CreationThumbnail.jsx';
const labels = { products: 'Produtos', recipes: 'Receitas', categories: 'Categorias', sections: 'Seções' };
export function DuplicateCheckPanel() {
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  async function check() {
    if (busy) return;
    setBusy(true);
    setError('');
    setGroups(null);
    try {
      setGroups(findCatalogDuplicates(await adminService.context()));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="creation-fields">
      <Card className="creation-fields creation-operation">
        <SectionHeader
          as="h3"
          size="sm"
          title={<>Verificar duplicatas</>}
          description={<>Compare nomes, páginas e SKUs do catálogo completo, incluindo os itens inativos.</>}
        />
        <Button loading={busy} onClick={check}>
          <Icon name="search" /> Verificar catálogo
        </Button>
        <p className="insights-muted">
          A verificação não altera registros. Na importação Excel, escolha qual conteúdo manter para cada correspondência única.
        </p>
      </Card>
      {error && (
        <Alert tone="danger" title="Verificação não concluída">
          {error}
        </Alert>
      )}
      {groups && (
        <p role="status">
          {groups.length
            ? `${groups.length} grupo(s) de possíveis duplicatas.`
            : 'Nenhuma duplicata encontrada pelos critérios de nome, página e SKU.'}
        </p>
      )}
      {groups?.map((group, i) => (
        <Card key={i} className="creation-fields creation-operation">
          <h3>
            {labels[group.entity]} <Badge>{group.items.length} registros</Badge>
          </h3>
          <p>{group.reasons.join(' · ')}</p>
          {group.items.map((item) => (
            <div key={item.id} className="creation-observation-heading">
              {['products', 'recipes'].includes(group.entity) && <CreationThumbnail item={item} type={group.entity} />}
              <div>
                <strong>{item.name}</strong>
                <p className="insights-muted">
                  {item.product_code || item.recipe_code || item.category_code || item.id} ·{' '}
                  {item.status || (item.active === false ? 'Inativo' : 'Ativo')}
                </p>
              </div>
            </div>
          ))}
          <p className="insights-muted">Identidade ambígua: revise esses registros nos editores antes de importar uma substituição.</p>
        </Card>
      ))}
    </section>
  );
}
