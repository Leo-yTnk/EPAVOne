import { useState } from 'preact/hooks';
import { Alert, Button, Dialog, ErrorState, Spinner } from '../../../../design-system/components/index.js';
import { collaborationService } from '../services/collaborationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
export function CopyDialog({ recipe, onClose, onCopied }) {
  const resource = useCreationResource(() => collaborationService.copyContext(recipe.id), recipe.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function copy() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await collaborationService.copy(
        recipe.id,
        resource.data.map((ref) => ({ ref_type: ref.refType, ref_id: ref.refId, action: 'add', target_id: null }))
      );
      onCopied();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      title={`Copiar ${recipe.name}`}
      onClose={() => !busy && onClose()}
      actions={
        <Button loading={busy} disabled={resource.loading || Boolean(resource.error)} onClick={copy}>
          Criar cópia na minha biblioteca
        </Button>
      }
    >
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : (
        <div className="creation-fields">
          <p>A cópia será sua e poderá ser editada. Os produtos públicos serão reutilizados.</p>
          {resource.data.length > 0 && (
            <>
              <p>Estes itens pessoais do autor também serão copiados para sua biblioteca:</p>
              <ul>
                {resource.data.map((ref) => (
                  <li key={`${ref.refType}:${ref.refId}`}>{ref.label}</li>
                ))}
              </ul>
            </>
          )}
          {error && (
            <Alert tone="danger" title="Cópia não concluída">
              {error}
            </Alert>
          )}
        </div>
      )}
    </Dialog>
  );
}
