import { SalesPage } from './sales/SalesPage.jsx';
import { useMemo, useState } from 'preact/hooks';
import { ModalPresence, Alert, Button, ErrorState, Heading, PageHeader, Select, Skeleton } from '../../design-system/components/index.js';
import { dateLabel, emptyWeek, shiftDay, weekStart, validDay } from './models/planner.js';
import { usePlanner } from './hooks/usePlanner.js';
import { Overview } from './components/Overview.jsx';
import { WeekPlan } from './components/WeekPlan.jsx';
import { ClientList } from './components/ClientList.jsx';
import { ClientProfile } from './components/ClientProfile.jsx';
import { ClientEditor } from './components/ClientEditor.jsx';
import { DeleteClientDialog } from './components/DeleteClientDialog.jsx';
import { Performance } from './components/Performance.jsx';
import { createRemotePlannerRepository } from './repositories/remotePlannerRepository.js';
import { createPlannerService } from './services/plannerService.js';
import { commercialContext } from '../../shared/services/commercialContext.js';
import './planner.css';
const info = {
  pedidos: ['Cada venda conta.', 'Pedidos, indicadores e histórico da sua conta.'],
  '': ['Início', 'Seu próximo passo, os contatos e os combinados da semana.'],
  semana: ['Semana', 'Planejar, atender e concluir no mesmo lugar.'],
  clientes: ['Clientes', 'Conheça as pessoas e encontre a próxima conversa.'],
  resultados: ['Resultados', 'Acompanhe seus atendimentos e aprenda com cada conversa.']
};
export function PlannerRoutes({ route = { segments: [] }, service, account, onOpenAccount }) {
  const chosenService = useMemo(
    () => service || (account?.session ? createPlannerService(createRemotePlannerRepository()) : undefined),
    [service, account?.session?.user?.id]
  );
  const resource = usePlanner(chosenService);
  const [weekId, setWeekId] = useState(() => {
    try {
      const stored = sessionStorage.getItem('epavone-planner-week');
      return validDay(stored) && weekStart(stored) === stored ? stored : weekStart();
    } catch {
      return weekStart();
    }
  });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const section = route.segments[0] || '';
  const recognized = Object.hasOwn(info, section);
  const title = info[section] || ['Página não encontrada', 'Volte ao início do Planner.'];
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
  const props = { state: resource.state, week, act: resource.act, busy: resource.busy || resource.refreshing };
  const customer = resource.state?.customers.find((item) => item.id === route.segments[1]);
  const clientProfile = section === 'clientes' && route.segments[1] && route.segments[1] !== 'oportunidades';
  return (
    <section className="product-page planner-page">
      <PageHeader
        product="planner"
        title={title[0]}
        description={title[1]}
        actions={
          section !== 'pedidos' ? (
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
          ) : undefined
        }
      />
      {section !== 'pedidos' && (
        <div className="planner-demo-note">
          <strong>{account?.session ? 'Seu planejamento' : 'Modo demonstração'}</strong>
          <span>{account?.session ? 'Planejamento salvo na sua conta.' : 'Dados de exemplo. Entre para usar sua carteira real.'}</span>
          {account?.session ? (
            <div className="ds-inline">
              <span role="status">
                {resource.loading
                  ? 'Carregando sua conta…'
                  : resource.refreshing
                    ? 'Atualizando dados…'
                    : resource.busy
                      ? 'Salvando na conta…'
                      : resource.error || resource.saveError || resource.syncWarning
                        ? 'Sincronização indisponível'
                        : 'Sincronizado com sua conta'}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={resource.loading || resource.busy || resource.refreshing}
                onClick={resource.reload}
              >
                Atualizar dados
              </Button>
            </div>
          ) : (
            onOpenAccount && (
              <Button size="sm" onClick={onOpenAccount}>
                Entrar para sincronizar
              </Button>
            )
          )}
        </div>
      )}
      {section !== 'pedidos' && resource.syncWarning && (
        <Alert tone="warning" title="Sincronização parcial">
          {resource.syncWarning}
        </Alert>
      )}
      {section !== 'pedidos' && resource.volatile && (
        <Alert tone="warning" title="Armazenamento indisponível">
          Alterações disponíveis somente nesta sessão. O navegador não permitiu salvar localmente.
        </Alert>
      )}
      {section !== 'pedidos' && resource.notice && (
        <p className="planner-notice" role={resource.saveError ? 'alert' : 'status'}>
          {resource.notice}
        </p>
      )}
      <div id="planner-panel" role="region" aria-label="Conteúdo do Planner" className="planner-panel">
        {section === 'pedidos' ? (
          <SalesPage key={account?.session?.user?.id || 'guest'} account={account} onOpenAccount={onOpenAccount} />
        ) : resource.loading || account?.initializing ? (
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
              Início
            </Button>
          </>
        ) : clientProfile ? (
          customer ? (
            <ClientProfile
              key={`${customer.id}-${weekId}`}
              {...props}
              customer={customer}
              tab={route.segments[2]}
              onEdit={() => setEditing(customer)}
              onDelete={() => setDeleting(customer)}
            />
          ) : (
            <ErrorState
              title="Cliente não encontrado"
              description="Esse cliente não está na carteira atual."
              actionLabel="Voltar à carteira"
              onAction={() => {
                window.location.hash = '#/planner/clientes';
              }}
            />
          )
        ) : section === 'clientes' ? (
          <ClientList {...props} opportunities={route.segments[1] === 'oportunidades'} onCreate={() => setEditing('new')} />
        ) : section === 'semana' ? (
          <WeekPlan key={weekId} {...props} mode={route.segments[1]} customerId={route.segments[2]} />
        ) : section === 'resultados' ? (
          <Performance {...props} />
        ) : (
          <Overview {...props} />
        )}
      </div>
      <ModalPresence>
        {deleting && (
          <DeleteClientDialog
            customer={deleting}
            act={resource.act}
            busy={resource.busy}
            notice={resource.notice}
            saveError={resource.saveError}
            onClose={() => setDeleting(null)}
            onDeleted={() => {
              if (commercialContext.get()?.customerId === deleting.id) commercialContext.clear();
              setDeleting(null);
              window.location.hash = '#/planner/clientes';
            }}
          />
        )}
      </ModalPresence>
      <ModalPresence>
        {editing && (
          <ClientEditor
            customer={editing === 'new' ? null : editing}
            act={resource.act}
            busy={resource.busy}
            notice={resource.notice}
            saveError={resource.saveError}
            onClose={() => setEditing(null)}
          />
        )}
      </ModalPresence>
    </section>
  );
}
