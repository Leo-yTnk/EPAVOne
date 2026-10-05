import { useState } from 'preact/hooks';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  Select,
  Spinner
} from '../../../../design-system/components/index.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { adminService } from '../services/adminService.js';
const pages = [
  { value: 'home', label: 'Home do Insights' },
  { value: 'recipes', label: 'Receitas' },
  { value: 'products', label: 'Produtos' }
];
export function SectionsManager() {
  const resource = useCreationResource(adminService.structure, 'sections');
  const [page, setPage] = useState('home');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pageId = resource.data?.pages.find((x) => x.key === page)?.id;
  const rows = (resource.data?.sections || [])
    .filter((x) => x.page_id === pageId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  async function move(index, direction) {
    if (busy) return;
    setBusy(true);
    setError('');
    const next = [...rows];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    try {
      await adminService.reorder(page, next);
      resource.reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="creation-fields">
      <p>Organize a Home e os catálogos. Vincule conteúdos às seções no editor de receitas e produtos públicos.</p>
      <div className="creation-toolbar">
        <Select label="Página" value={page} options={pages} onChange={setPage} />
        <Button onClick={() => setEditing({ section: null })}>
          <Icon name="plus" /> Criar seção
        </Button>
      </div>
      {error && (
        <Alert tone="danger" title="Não foi possível ordenar">
          {error}
        </Alert>
      )}
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : !rows.length ? (
        <EmptyState title="Nenhuma seção nesta página" />
      ) : (
        <div className="creation-list">
          {rows.map((section, i) => (
            <article className="creation-row creation-section-row" key={section.id}>
              <Icon name="category" />
              <div>
                <h3>{section.name}</h3>
                <p>{section.active ? 'Visível' : 'Oculta'}</p>
              </div>
              <div className="creation-toolbar">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy || i === 0}
                  aria-label={`Mover ${section.name} para cima`}
                  onClick={() => move(i, -1)}
                >
                  <Icon name="up" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy || i === rows.length - 1}
                  aria-label={`Mover ${section.name} para baixo`}
                  onClick={() => move(i, 1)}
                >
                  <Icon name="down" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing({ section })}>
                  Editar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <SectionEditor
          section={editing.section}
          page={page}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            resource.reload();
          }}
        />
      )}
    </section>
  );
}
function SectionEditor({ section, page, onClose, onSaved }) {
  const [name, setName] = useState(section?.name || '');
  const [order, setOrder] = useState(section?.sort_order || 0);
  const [active, setActive] = useState(section?.active !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await adminService.saveSection(section, { page, name, order, active });
      onSaved();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open title={section ? 'Editar seção' : 'Criar seção'} onClose={() => !busy && onClose()}>
      <form className="creation-fields" onSubmit={save}>
        <Input
          label="Nome da seção"
          required
          maxLength={120}
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
          disabled={busy}
        />
        <Input
          label="Ordem"
          type="number"
          min="0"
          step="1"
          required
          value={order}
          onInput={(e) => setOrder(e.currentTarget.value)}
          disabled={busy}
        />
        <Checkbox checked={active} onChange={(e) => setActive(e.currentTarget.checked)} disabled={busy}>
          Visível nesta página
        </Checkbox>
        {error && (
          <Alert tone="danger" title="Seção não salva">
            {error}
          </Alert>
        )}
        <Button type="submit" loading={busy}>
          Salvar seção
        </Button>
      </form>
    </Dialog>
  );
}
