import { useState } from 'preact/hooks';
import { Alert, Button, Card, EmptyState, ErrorState, Icon, Input, Spinner } from '../../../../design-system/components/index.js';
import { collaborationService } from '../services/collaborationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { SharedRecipeDialog } from './SharedRecipeDialog.jsx';
import { CopyDialog } from './CopyDialog.jsx';
export function SharedLibrary() {
  const resource = useCreationResource(collaborationService.shared, 'shared');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [recipe, setRecipe] = useState(null);
  const [copying, setCopying] = useState(null);
  async function redeem(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await collaborationService.redeem(code);
      setCode('');
      resource.reload();
      setMessage('Receita adicionada à biblioteca compartilhada.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="creation-fields">
      <form className="creation-toolbar" onSubmit={redeem}>
        <Input label="Código compartilhado" value={code} onInput={(e) => setCode(e.currentTarget.value)} required autoComplete="off" />
        <Button type="submit" loading={busy}>
          Resgatar receita
        </Button>
      </form>
      {error && (
        <Alert tone="danger" title="Não foi possível resgatar">
          {error}
        </Alert>
      )}
      {message && <p role="status">{message}</p>}
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : !resource.data.length ? (
        <EmptyState title="Nenhuma receita compartilhada" description="Use um código recebido para adicionar uma receita." />
      ) : (
        <div className="creation-list">
          {resource.data.map(({ recipe: item }) => (
            <Card className="creation-row" key={item.id}>
              <Icon name="recipe" />
              <div>
                <h3>{item.name}</h3>
                <div className="creation-toolbar">
                  <Button variant="secondary" size="sm" onClick={() => setRecipe(item)}>
                    Ver receita
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCopying(item)}>
                    <Icon name="copy" /> Criar cópia
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {recipe && <SharedRecipeDialog recipe={recipe} onClose={() => setRecipe(null)} />}
      {copying && (
        <CopyDialog
          recipe={copying}
          onClose={() => setCopying(null)}
          onCopied={() => {
            setCopying(null);
            setMessage('Cópia criada em Minhas receitas.');
          }}
        />
      )}
    </section>
  );
}
