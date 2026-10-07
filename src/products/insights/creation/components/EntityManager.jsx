import { useMemo, useState } from 'preact/hooks';
import {
  Alert,
  Badge,
  Card,
  Button,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  Menu,
  Pagination,
  Spinner
} from '../../../../design-system/components/index.js';
import { creationService } from '../services/creationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { entities, statusLabels } from '../models/editor.js';
import { EntityEditor } from './EntityEditor.jsx';
import { DeleteDialog } from './DeleteDialog.jsx';
export function EntityManager({ type, scope = 'personal', onShare, onSubmit }) {
  const resource = useCreationResource(() => creationService.load(type, scope), `${type}:${scope}`);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const items = useMemo(
    () =>
      (resource.data || []).filter(
        (item) =>
          item.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')) &&
          (filter === 'all' || (type === 'recipes' ? item.status === filter : (item.active ? 'active' : 'inactive') === filter))
      ),
    [resource.data, query, filter, type]
  );
  const current = Math.min(page, Math.max(1, Math.ceil(items.length / 20)));
  const meta = entities[type];
  function saved() {
    setEditor(null);
    setDeleting(null);
    setMessage('Alterações salvas.');
    resource.reload();
  }
  async function toggle(item) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await creationService.toggle(type, item);
      saved();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="creation-fields creation-library" aria-label={`${scope === 'site' ? 'Catálogo' : 'Biblioteca'}: ${meta.label}`}>
      <div className="creation-toolbar">
        <Input
          label={`Buscar ${meta.label.toLowerCase()}`}
          type="search"
          value={query}
          onInput={(e) => {
            setQuery(e.currentTarget.value);
            setPage(1);
          }}
        />
        <Button onClick={() => setEditor({ item: null })}>
          <Icon name="plus" /> Criar {meta.singular}
        </Button>
      </div>
      {!resource.loading && !resource.error && (
        <div className="creation-library-overview">
          <div>
            <span className="ds-overline">{scope === 'site' ? 'Catálogo público' : 'Sua biblioteca'}</span>
            <p>
              <strong>{resource.data?.length || 0}</strong> {resource.data?.length === 1 ? meta.singular : meta.label.toLowerCase()} ·{' '}
              {scope === 'personal' ? 'Você decide o que compartilhar.' : 'Conteúdo disponível para publicação.'}
            </p>
          </div>
          <div className="creation-library-filters" role="group" aria-label="Filtrar biblioteca">
            {(type === 'recipes'
              ? ['all', ...new Set((resource.data || []).map((item) => item.status).filter(Boolean))]
              : ['all', 'active', 'inactive']
            ).map((value) => (
              <Button
                key={value}
                variant={filter === value ? 'secondary' : 'ghost'}
                aria-pressed={filter === value}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
              >
                {value === 'all'
                  ? 'Todos'
                  : value === 'active'
                    ? 'Ativos'
                    : value === 'inactive'
                      ? 'Inativos'
                      : statusLabels[value] || value}
              </Button>
            ))}
          </div>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <Alert tone="danger" title="Não foi possível concluir">
          {error}
        </Alert>
      )}
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : !items.length ? (
        <EmptyState
          title={query || filter !== 'all' ? 'Nenhum resultado para estes filtros' : `Sua primeira ${meta.singular} começa aqui`}
          description={
            query || filter !== 'all'
              ? 'Ajuste a busca ou volte a mostrar todos os itens.'
              : 'Crie, salve na sua biblioteca e compartilhe quando estiver pronto.'
          }
          actionLabel={query || filter !== 'all' ? 'Limpar filtros' : `Criar ${meta.singular}`}
          onAction={() => {
            if (query || filter !== 'all') {
              setQuery('');
              setFilter('all');
            } else setEditor({ item: null });
          }}
        />
      ) : (
        <>
          <p className="insights-muted" role="status">
            {items.length} {items.length === 1 ? 'item' : 'itens'} na biblioteca{query ? ' para esta busca' : ''}.
          </p>
          <div className="creation-list">
            {items.slice((current - 1) * 20, current * 20).map((item) => (
              <Card className="creation-row" key={item.id}>
                <Icon name={meta.icon} />
                <div>
                  <h3>{item.name}</h3>
                  <p className="insights-muted">
                    {item.recipe_code || item.product_code || item.category_code} · {item.category?.name || item.type || ''}
                  </p>
                  <Badge>{statusLabels[item.status] || (item.active ? 'Ativo' : 'Inativo')}</Badge>
                </div>
                <div className="creation-row-actions">
                  <Button variant="secondary" aria-label={`Editar ${item.name}`} onClick={() => setEditor({ item })}>
                    <Icon name="writer" /> Editar
                  </Button>
                  <Menu
                    label={`Ações de ${item.name}`}
                    triggerLabel="Ações"
                    items={[
                      { label: 'Editar', onSelect: () => setEditor({ item }) },
                      ...(type !== 'recipes'
                        ? [{ label: item.active ? 'Desativar' : 'Ativar', disabled: busy, onSelect: () => toggle(item) }]
                        : []),
                      ...(scope === 'personal' && type === 'recipes' && onShare
                        ? [{ label: 'Compartilhar', onSelect: () => onShare(item) }]
                        : []),
                      ...(scope === 'personal' && onSubmit
                        ? [{ label: 'Solicitar publicação', onSelect: () => onSubmit(type, item) }]
                        : []),
                      { label: 'Excluir', onSelect: () => setDeleting(item) }
                    ]}
                  />
                </div>
              </Card>
            ))}
          </div>
          {items.length > 20 && <Pagination page={current} pageCount={Math.ceil(items.length / 20)} onChange={setPage} />}
        </>
      )}
      {editor && <EntityEditor type={type} scope={scope} item={editor.item} onClose={() => setEditor(null)} onSaved={saved} />}
      {deleting && <DeleteDialog type={type} item={deleting} onClose={() => setDeleting(null)} onSaved={saved} />}
    </section>
  );
}
