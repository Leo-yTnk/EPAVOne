import { useState } from 'preact/hooks';
import { Alert, Button, Icon, PageHeader, Select, Spinner } from '../../../design-system/components/index.js';
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
      <section className="creation-fields">
        <PageHeader
          eyebrow="EPAVInsights"
          title="Seu espaço de criação"
          description="Entre com a credencial do Yourcipe para acessar suas receitas, produtos e categorias."
        />
        <Button onClick={onOpenAccount}>
          <Icon name="user" /> Entrar para criar
        </Button>
      </section>
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
      <Select
        label="Área de criação"
        value={section.value}
        options={available}
        onChange={(value) => {
          window.location.hash = `#/insights/criacao/${value}`;
        }}
      />
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
      {sharing && <ShareDialog recipe={sharing} onClose={() => setSharing(null)} />}
      {submission && <SubmitDialog {...submission} onClose={() => setSubmission(null)} />}
    </section>
  );
}
