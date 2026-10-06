import { useEffect, useRef, useState } from 'preact/hooks';
import { Alert, Button, Dialog, ErrorState, Icon, Spinner } from '../../../../design-system/components/index.js';
import { creationService } from '../services/creationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { editorValues, entities } from '../models/editor.js';
import { EntityFields } from './EntityFields.jsx';
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
  const [values, setValues] = useState(() => editorValues(data.detail.recipe || item || {}, data.detail));
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
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
      await creationService.save(type, scope, data.detail.recipe || item, values);
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
        {error && (
          <Alert tone="danger" title="Não foi possível salvar">
            {error} Suas alterações continuam neste formulário. Tente salvar novamente.
          </Alert>
        )}
        <EntityFields
          type={type}
          scope={scope}
          item={item}
          values={values}
          vocabulary={data.vocabulary}
          disabled={busy}
          change={(patch) => {
            setDirty(true);
            setValues((current) => ({ ...current, ...patch }));
          }}
        />
        {discard && (
          <Alert tone="warning" title="Descartar alterações?">
            <p>As alterações deste formulário ainda não foram salvas.</p>
            <Button type="button" variant="secondary" onClick={onClose}>
              Descartar e fechar
            </Button>
          </Alert>
        )}
        <div className="creation-actions">
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
