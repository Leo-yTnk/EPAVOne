import { useState } from 'preact/hooks';
import { Alert, Button, Card, Icon, NavItem, PageHeader, Spinner } from '../../../design-system/components/index.js';
import { EntityManager } from './components/EntityManager.jsx';
import { SharedLibrary } from './components/SharedLibrary.jsx';
import { RequestsPage } from './components/RequestsPage.jsx';
import { ShareDialog } from './components/ShareDialog.jsx';
import { SubmitDialog } from './components/SubmitDialog.jsx';
import { AdminPage } from './admin/AdminPage.jsx';
import './creation.css';
const sections = [
  { value: 'receitas', label: 'Minhas receitas', type: 'recipes' },
  { value: 'produtos', label: 'Meus produtos', type: 'products' },
  { value: 'categorias', label: 'Minhas categorias', type: 'categories' },
  { value: 'compartilhadas', label: 'Receitas compartilhadas' },
  { value: 'solicitacoes', label: 'Minhas solicitações' }
];
export function CreationPage({ route, account, onOpenAccount }) {
  const [sharing, setSharing] = useState(null);
  const [submission, setSubmission] = useState(null);
  if (account?.initializing) return <Spinner />;
  if (!account?.session)
    return (
      <Card className="creation-welcome">
        <PageHeader
          eyebrow="EPAVInsights"
          title="Seu espaço de criação"
          description="Entre com a credencial do Yourcipe para acessar suas receitas, produtos e categorias."
        />
        <Button onClick={onOpenAccount}>
          <Icon name="user" /> Entrar para criar
        </Button>
      </Card>
    );
  if (!account.profile)
    return (
      <Alert title="Carregando seu perfil" tone={account.error ? 'danger' : 'info'}>
        {account.error || 'Verificando suas permissões…'}
        {account.error && <Button onClick={account.retryProfile}>Tentar novamente</Button>}
      </Alert>
    );
  if (route.segments[1] === 'admin' && account.profile.role !== 'admin')
    return (
      <Alert tone="danger" title="Acesso restrito">
        Esta área exige uma conta administradora.
      </Alert>
    );
  const available = account.profile.role === 'admin' ? [...sections, { value: 'admin', label: 'Administração' }] : sections;
  const section = available.find((x) => x.value === route.segments[1]) || sections[0];
  return (
    <section className="creation-fields" key={account.session.user.id}>
      <PageHeader
        eyebrow="EPAVInsights"
        title="Modo de criação"
        description="Crie e organize sua biblioteca. Seus conteúdos pessoais continuam vinculados à sua conta."
      />
      <div className="creation-workspace">
        <nav className="creation-workspace-nav" aria-label="Biblioteca e criação">
          {available.map((item) => (
            <NavItem
              key={item.value}
              href={`#/insights/criacao/${item.value}`}
              active={item.value === section.value}
              aria-current={item.value === section.value ? 'page' : undefined}
            >
              {item.label}
            </NavItem>
          ))}
        </nav>
        <div className="creation-workspace-content">
          <div className="creation-workspace-heading">
            <h2>{section.label}</h2>
            <p className="insights-muted">
              {section.type
                ? 'Organize seus conteúdos, edite os detalhes e acompanhe suas publicações.'
                : section.value === 'admin'
                  ? 'Gerencie o catálogo público, suas seções e a manutenção dos preços.'
                  : section.value === 'compartilhadas'
                    ? 'Encontre as receitas recebidas e gerencie o acesso à sua biblioteca.'
                    : 'Acompanhe o retorno das suas solicitações de publicação.'}
            </p>
          </div>
          {section.type ? (
            <EntityManager
              key={section.type}
              type={section.type}
              onShare={setSharing}
              onSubmit={(type, item) => setSubmission({ type, item })}
            />
          ) : section.value === 'admin' ? (
            <AdminPage profile={account.profile} />
          ) : section.value === 'compartilhadas' ? (
            <SharedLibrary />
          ) : (
            <RequestsPage />
          )}
        </div>
      </div>
      {sharing && <ShareDialog recipe={sharing} onClose={() => setSharing(null)} />}
      {submission && <SubmitDialog {...submission} onClose={() => setSubmission(null)} />}
    </section>
  );
}
