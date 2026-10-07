import { useState } from 'preact/hooks';
import { Alert, Button, ErrorState, Heading, PageHeader, Select, Skeleton } from '../../design-system/components/index.js';
import { dateLabel, emptyWeek, shiftDay, weekStart, validDay } from './models/planner.js';
import { usePlanner } from './hooks/usePlanner.js';
import { Overview } from './components/Overview.jsx';
import { WeekPlan } from './components/WeekPlan.jsx';
import { ClientList } from './components/ClientList.jsx';
import { ClientProfile } from './components/ClientProfile.jsx';
import { ClientEditor } from './components/ClientEditor.jsx';
import { Opportunities } from './components/Opportunities.jsx';
import { Performance } from './components/Performance.jsx';
import { Attendance } from './components/Attendance.jsx';
import './planner.css';
const info = {
  '': ['Uma boa semana começa pelas pessoas.', 'Decida quem atender, prepare a conversa e acompanhe os próximos passos.'],
  semana: ['Sua semana, com intenção.', 'Organize titulares e reservas, respeitando a janela de atendimento.'],
  clientes: ['Conhecer melhor. Atender melhor.', 'Contexto, preferências e combinados para construir um relacionamento.'],
  oportunidades: ['A oferta certa começa no contexto.', 'Relacione ideias e campanhas aos clientes, respeitando suas restrições.'],
  desempenho: ['Aprender com cada conversa.', 'Compare o que foi planejado com o que aconteceu para decidir a próxima semana.'],
  atendimento: ['Uma conversa de cada vez.', 'O essencial à mão: contexto, sugestões e o próximo passo.']
};
export function PlannerRoutes({ route = { segments: [] }, service }) {
  const resource = usePlanner(service);
  const [weekId, setWeekId] = useState(() => {
    try {
      const stored = sessionStorage.getItem('epavone-planner-week');
      return validDay(stored) && weekStart(stored) === stored ? stored : weekStart();
    } catch {
      return weekStart();
    }
  });
  const [editing, setEditing] = useState(null);
  const section = route.segments[0] || '';
  const recognized = Object.hasOwn(info, section);
  const title = info[section] || ['Página não encontrada', 'Volte à visão geral do Planner.'];
  const week = resource.state?.weeks.find((item) => item.id === weekId) || emptyWeek(weekId);
  const options = [...new Set([...(resource.state?.weeks || []).map((item) => item.id), weekStart(), shiftDay(weekStart(), 7), weekId])]
    .sort()
    .reverse();
  function chooseWeek(value) {
    setWeekId(value);
    try {
      sessionStorage.setItem('epavone-planner-week', value);
    } catch {
      /* Selection remains available in memory. */
    }
  }
  const props = { state: resource.state, week, act: resource.act, busy: resource.busy };
  const customer = resource.state?.customers.find((item) => item.id === route.segments[1]);
  return (
    <section className="product-page planner-page">
      <PageHeader
        eyebrow="EPAVPlanner"
        title={title[0]}
        description={title[1]}
        actions={
          <div className="planner-week-selector">
            <Select
              label="Semana de planejamento"
              value={weekId}
              options={options.map((id) => ({
                value: id,
                label: `${dateLabel(id)} – ${dateLabel(shiftDay(id, 6))}${id === weekStart() ? ' · atual' : ''}`
              }))}
              onChange={chooseWeek}
            />
          </div>
        }
      />
      <div className="planner-demo-note">
        <strong>Modo demonstração</strong>
        <span>Perfis e sugestões de exemplo. Suas alterações ficam neste navegador; não são dados reais da carteira.</span>
      </div>
      {resource.volatile && (
        <Alert tone="warning" title="Armazenamento indisponível">
          Alterações disponíveis somente nesta sessão. O navegador não permitiu salvar localmente.
        </Alert>
      )}
      {resource.notice && (
        <p className="planner-notice" role="status">
          {resource.notice}
        </p>
      )}
      <div id="planner-panel" role="region" aria-label="Conteúdo do Planner" className="planner-panel">
        {resource.loading ? (
          <div aria-label="Carregando planejamento" role="status" className="planner-loading">
            <Skeleton variant="title" />
            <Skeleton className="planner-loading-block" />
            <Skeleton className="planner-loading-block" />
          </div>
        ) : resource.error ? (
          <ErrorState title="Planejamento indisponível" description={resource.error} onAction={resource.reload} />
        ) : !recognized ? (
          <>
            <Heading level={3}>Essa área não existe.</Heading>
            <Button as="a" href="#/planner">
              Visão geral
            </Button>
          </>
        ) : section === 'clientes' && route.segments[1] ? (
          customer ? (
            <ClientProfile key={`${customer.id}-${weekId}`} {...props} customer={customer} onEdit={() => setEditing(customer)} />
          ) : (
            <ErrorState
              title="Cliente não encontrado"
              description="Esse cliente não está na carteira deste navegador."
              actionLabel="Voltar à carteira"
              onAction={() => {
                window.location.hash = '#/planner/clientes';
              }}
            />
          )
        ) : section === 'clientes' ? (
          <ClientList {...props} onCreate={() => setEditing('new')} />
        ) : section === 'semana' ? (
          <WeekPlan key={weekId} {...props} />
        ) : section === 'oportunidades' ? (
          <Opportunities {...props} />
        ) : section === 'desempenho' ? (
          <Performance {...props} />
        ) : section === 'atendimento' ? (
          <Attendance key={`${route.segments[1] || 'next'}-${weekId}`} {...props} customerId={route.segments[1]} />
        ) : (
          <Overview {...props} />
        )}
      </div>
      {editing && (
        <ClientEditor
          customer={editing === 'new' ? null : editing}
          act={resource.act}
          busy={resource.busy}
          notice={resource.notice}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
