import { useState } from 'preact/hooks';
import { Alert, Button, Dialog, ErrorState, Select, Spinner, Textarea } from '../../../../design-system/components/index.js';
import { collaborationService } from '../services/collaborationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { statusLabels } from '../models/editor.js';
export function RequestDetails({ request, admin, onClose, onUpdated }) {
  const resource = useCreationResource(() => collaborationService.revisions(request.id), request.id);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState('published');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const pending = ['submitted', 'resubmitted'].includes(request.status);
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await collaborationService.requestAction(request, action, note, mode);
      onUpdated();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open size="lg" title={`Solicitação ${request.source_code || request.request_code || ''}`} onClose={() => !busy && onClose()}>
      <div className="creation-fields">
        <p>
          {statusLabels[request.status] || request.status} · {request.requester_display_name_snapshot}
        </p>
        {request.reason && <p>{request.reason}</p>}
        {request.admin_note && <Alert title="Orientação da revisão">{request.admin_note}</Alert>}
        {resource.loading ? (
          <Spinner />
        ) : resource.error ? (
          <ErrorState description={resource.error} onAction={resource.reload} />
        ) : (
          <div className="creation-history">
            {resource.data.map((revision) => (
              <section key={revision.id} className="creation-fields">
                <h3>Revisão {revision.revision_number}</h3>
                {revision.message && <p>{revision.message}</p>}
                <Payload value={revision.payload} />
              </section>
            ))}
          </div>
        )}
        {!admin && request.status === 'changes_requested' && (
          <p>Edite o item na sua biblioteca antes de reenviar. O reenvio cria uma revisão com os dados atuais.</p>
        )}
        <Textarea
          label={admin ? 'Orientação para o autor' : 'Mensagem da revisão'}
          rows={3}
          value={note}
          onInput={(e) => setNote(e.currentTarget.value)}
          disabled={busy}
        />
        {admin && pending && (
          <Select
            label="Ao aprovar"
            value={mode}
            options={[
              { value: 'published', label: 'Publicar no catálogo' },
              { value: 'draft', label: 'Salvar como rascunho / inativo' }
            ]}
            onChange={setMode}
            disabled={busy}
          />
        )}
        <div className="creation-toolbar">
          {admin && pending && (
            <>
              <Button disabled={busy || resource.loading || Boolean(resource.error)} onClick={() => setAction('approve')}>
                Aprovar
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setAction('return')}>
                Pedir ajustes
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setAction('reject')}>
                Recusar
              </Button>
            </>
          )}
          {!admin && request.status === 'changes_requested' && (
            <Button disabled={busy} onClick={() => setAction('resubmit')}>
              Reenviar
            </Button>
          )}
          {!admin && ['submitted', 'resubmitted', 'changes_requested'].includes(request.status) && (
            <Button variant="secondary" disabled={busy} onClick={() => setAction('cancel')}>
              Cancelar solicitação
            </Button>
          )}
        </div>
        {action && (
          <Alert tone="warning" title="Confirmar decisão">
            <p>A ação será registrada no histórico da solicitação.</p>
            <Button loading={busy} onClick={confirm}>
              Confirmar
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setAction('')}>
              Voltar
            </Button>
          </Alert>
        )}
        {error && (
          <Alert tone="danger" title="Não foi possível concluir">
            {error}
          </Alert>
        )}
      </div>
    </Dialog>
  );
}
const labels = {
  name: 'Nome',
  category_id: 'Categoria',
  unit: 'Unidade',
  price: 'Preço',
  image_url: 'Imagem',
  prep_time: 'Minutos',
  servings: 'Porções',
  difficulty: 'Dificuldade',
  instructions: 'Preparo',
  extras: 'Extras',
  tips: 'Dicas',
  ingredients: 'Ingredientes',
  quantity: 'Quantidade',
  product_id: 'Produto',
  status: 'Publicação',
  active: 'Ativo',
  type: 'Tipo'
};
function Payload({ value }) {
  if (value === null || value === undefined) return <span>—</span>;
  if (Array.isArray(value))
    return (
      <ul>
        {value.map((item, i) => (
          <li key={i}>
            <Payload value={item} />
          </li>
        ))}
      </ul>
    );
  if (typeof value === 'object')
    return (
      <dl>
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <dt>{labels[key] || key.replaceAll('_', ' ')}</dt>
            <dd>
              <Payload value={item} />
            </dd>
          </div>
        ))}
      </dl>
    );
  return <span>{String(value)}</span>;
}
