import { useMemo, useState } from 'preact/hooks';
import {
  Alert,
  Badge,
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
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const items = useMemo(
    () => (resource.data || []).filter((item) => item.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))),
    [resource.data, query]
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
    <section className="creation-fields" aria-label={`${scope === 'site' ? 'Catálogo' : 'Biblioteca'}: ${meta.label}`}>
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
        <EmptyState title="Nenhum item encontrado" description="Crie um item ou ajuste sua busca." />
      ) : (
        <>
          <div className="creation-list">
            {items.slice((current - 1) * 20, current * 20).map((item) => (
              <article className="creation-row" key={item.id}>
                <Icon name={meta.icon} />
                <div>
                  <h3>{item.name}</h3>
                  <p className="insights-muted">
                    {item.recipe_code || item.product_code || item.category_code} · {item.category?.name || item.type || ''}
                  </p>
                  <Badge>{statusLabels[item.status] || (item.active ? 'Ativo' : 'Inativo')}</Badge>
                </div>
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
                    ...(scope === 'personal' && onSubmit ? [{ label: 'Solicitar publicação', onSelect: () => onSubmit(type, item) }] : []),
                    { label: 'Excluir', onSelect: () => setDeleting(item) }
                  ]}
                />
              </article>
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
