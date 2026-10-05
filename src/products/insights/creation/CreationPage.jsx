import { Alert, Button, Icon, PageHeader, Select, Spinner } from '../../../design-system/components/index.js';
import { EntityManager } from './components/EntityManager.jsx';
import './creation.css';
const sections = [
  { value: 'receitas', label: 'Minhas receitas', type: 'recipes' },
  { value: 'produtos', label: 'Meus produtos', type: 'products' },
  { value: 'categorias', label: 'Minhas categorias', type: 'categories' }
];
export function CreationPage({ route, account, onOpenAccount }) {
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
  const section = sections.find((x) => x.value === route.segments[1]) || sections[0];
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
        options={sections}
        onChange={(value) => {
          window.location.hash = `#/insights/criacao/${value}`;
        }}
      />
      <EntityManager key={section.type} type={section.type} />
    </section>
  );
}
