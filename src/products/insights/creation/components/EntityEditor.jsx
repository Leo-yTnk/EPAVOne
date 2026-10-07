import { useEffect, useRef, useState } from 'preact/hooks';
import { Alert, Button, Dialog, ErrorState, Icon, Spinner } from '../../../../design-system/components/index.js';
import { creationService } from '../services/creationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { editorValues, entities } from '../models/editor.js';
import { EntityFields } from './EntityFields.jsx';
import { ContentPreview } from './ContentPreview.jsx';
export function EntityEditor({ type, scope, item, onClose, onSaved }) {
  const resource = useCreationResource(
    async () => {
      const [vocabulary, detail] = await Promise.all([creationService.vocabulary(scope), item ? creationService.detail(type, item) : {}]);
      return { vocabulary, detail };
    },
    `${type}:${scope}:${item?.id || 'new'}`
  );
  if (!resource.loading && !resource.error)
    return <EditorForm type={type} scope={scope} item={item} data={resource.data} onClose={onClose} onSaved={onSaved} />;
  return (
    <Dialog open size="lg" title="Preparando editor" onClose={onClose}>
      {resource.loading ? <Spinner /> : <ErrorState description={resource.error} onAction={resource.reload} />}
    </Dialog>
  );
}

function EditorForm({ type, scope, item, data, onClose, onSaved }) {
  const [values, setValues] = useState(() => editorValues(data.detail.recipe || data.detail.item || item || {}, data.detail));
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [preview, setPreview] = useState(false);
  const close = () => {
    if (!pending.current) {
      if (dirty) setDiscard(true);
      else onClose();
    }
  };
  useEffect(() => {
    if (!dirty) return;
    const leave = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty]);
  async function save(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await creationService.save(type, scope, data.detail.recipe || data.detail.item || item, values);
      onSaved();
    } catch (failure) {
      setError(failure.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog open size="lg" title={`${item ? 'Editar' : 'Criar'} ${entities[type].singular}`} onClose={close}>
      <form className="creation-fields" onSubmit={save}>
        <div className="creation-editor-intro">
          <span className="ds-overline">{scope === 'site' ? 'Catálogo público' : 'Biblioteca pessoal'}</span>
          <p>
            {scope === 'site'
              ? 'Organize os detalhes e confira a publicação antes de salvar.'
              : 'Salve primeiro na sua biblioteca. Depois, compartilhe ou solicite a publicação.'}
          </p>
          <span className="creation-save-status" role="status">
            {busy ? 'Salvando alterações…' : dirty ? 'Alterações ainda não salvas' : 'Nenhuma alteração pendente'}
          </span>
        </div>
        {error && (
          <Alert tone="danger" title="Não foi possível salvar">
            {error} Suas alterações continuam neste formulário.
          </Alert>
        )}
        <EntityFields
          type={type}
          scope={scope}
          item={data.detail.recipe || data.detail.item || item}
          values={values}
          vocabulary={data.vocabulary}
          disabled={busy}
          change={(patch) => {
            setDirty(true);
            setValues((current) => ({ ...current, ...patch }));
          }}
        />
        {type !== 'categories' && (
          <>
            <Button type="button" variant="secondary" aria-expanded={preview} onClick={() => setPreview((value) => !value)}>
              {preview ? 'Ocultar prévia' : 'Conferir prévia'}
            </Button>
            {preview && <ContentPreview type={type} values={values} vocabulary={data.vocabulary} />}
          </>
        )}
        {discard && (
          <Alert tone="warning" title="Descartar alterações?">
            <p>As alterações deste formulário ainda não foram salvas.</p>
            <Button type="button" variant="secondary" onClick={onClose}>
              Descartar e fechar
            </Button>
          </Alert>
        )}
        <div className="creation-actions">
          <span className="insights-muted">
            {scope === 'site' ? 'Salvar atualiza o catálogo.' : 'Visível somente para você até compartilhar.'}
          </span>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => (dirty ? setDiscard(true) : onClose())}>
            Cancelar
          </Button>
          <Button type="submit" loading={busy}>
            <Icon name="save" /> {busy ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
