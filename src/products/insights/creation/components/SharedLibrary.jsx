import { useState } from 'preact/hooks';
import { Alert, Button, Card, EmptyState, ErrorState, Icon, Input, Spinner } from '../../../../design-system/components/index.js';
import { collaborationService } from '../services/collaborationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
import { CreationThumbnail } from './CreationThumbnail.jsx';
import { SharedRecipeDialog } from './SharedRecipeDialog.jsx';
import { CopyDialog } from './CopyDialog.jsx';
export function SharedLibrary() {
  const resource = useCreationResource(collaborationService.shared, 'shared');
  const [query, setQuery] = useState('');
  const items = (resource.data || []).filter(({ recipe }) =>
    recipe.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
  );
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
      <Card as="section" className="creation-fields creation-operation">
        <div className="creation-section-heading">
          <h3 className="creation-section-title">Receba uma ideia para sua próxima venda</h3>
          <p>Resgate o código de outro vendedor. Você pode consultar a receita ou criar sua própria cópia.</p>
        </div>
        <form className="creation-toolbar" onSubmit={redeem}>
          <Input label="Código compartilhado" value={code} onInput={(e) => setCode(e.currentTarget.value)} required autoComplete="off" />
          <Button type="submit" loading={busy}>
            Resgatar receita
          </Button>
        </form>
      </Card>
      {error && (
        <Alert tone="danger" title="Não foi possível resgatar">
          {error}
        </Alert>
      )}
      {message && <p role="status">{message}</p>}
      <Input label="Buscar receitas compartilhadas" type="search" value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : !items.length ? (
        <EmptyState title="Nenhuma receita compartilhada encontrada" description="Use um código recebido para adicionar uma receita." />
      ) : (
        <div className="creation-list creation-gallery">
          {items.map(({ recipe: item }) => (
            <Card className="creation-row creation-content-card" key={item.id}>
              <CreationThumbnail item={item} />
              <div className="creation-card-copy">
                <h3>{item.name}</h3>
                <p className="insights-muted">Receita compartilhada · {item.recipe_code || 'Recebida por código'}</p>
              </div>
              <div className="creation-row-actions">
                <Button variant="secondary" size="sm" onClick={() => setRecipe(item)}>
                  Ver receita
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCopying(item)}>
                  <Icon name="copy" /> Criar cópia
                </Button>
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
