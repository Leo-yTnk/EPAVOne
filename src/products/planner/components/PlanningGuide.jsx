import { Button, Card, Heading, Icon } from '../../../design-system/components/index.js';
import { weekStart } from '../models/planner.js';

export function PlanningGuide({ state, week }) {
  const pending = week.queue.filter((entry) => !entry.outcome);
  const unprepared = pending.find((entry) => !state.customers.find((customer) => customer.id === entry.customerId)?.preparation.trim());
  const current = week.id === weekStart();
  const steps = [
    {
      title: '1. Conhecer os clientes',
      description: `${state.customers.length} clientes na carteira. Cadastre preferências e restrições.`,
      href: '#/planner/clientes',
      complete: state.customers.length > 0
    },
    {
      title: '2. Organizar a semana',
      description: `${week.queue.length} na fila · meta de ${week.goal} atendimentos. Titulares são atendidos primeiro.`,
      href: '#/planner/semana',
      complete: week.queue.length > 0
    },
    {
      title: '3. Preparar e conversar',
      description: unprepared
        ? 'Há conversas sem abordagem. Abra o perfil para se preparar.'
        : pending.length
          ? 'Abordagens preparadas. Consulte o contexto antes de atender.'
          : 'Registre o resultado das conversas para acompanhar a evolução.',
      href: unprepared ? `#/planner/clientes/${unprepared.customerId}` : '#/planner/desempenho',
      complete: week.queue.length > 0 && !unprepared
    }
  ];
  const next = !state.customers.length
    ? { label: 'Cadastrar primeiro cliente', href: '#/planner/clientes' }
    : !week.queue.length
      ? { label: 'Escolher clientes da semana', href: '#/planner/clientes' }
      : unprepared
        ? { label: 'Preparar próxima conversa', href: `#/planner/clientes/${unprepared.customerId}` }
        : { label: current && pending.length ? 'Abrir fila de atendimento' : 'Revisar planejamento', href: '#/planner/semana' };
  return (
    <section className="planner-guide" aria-label="Como usar o Planner">
      <div className="planner-section-head">
        <Heading level={3}>Por onde começar</Heading>
        <Button as="a" href={next.href} size="sm">
          {next.label}
        </Button>
      </div>
      <div className="planner-guide-steps">
        {steps.map((step) => (
          <Card key={step.title} className="planner-guide-step">
            <Heading level={4}>
              <Icon name={step.complete ? 'check' : 'next'} /> {step.title}
            </Heading>
            <p className="planner-muted">{step.description}</p>
            <Button as="a" variant="ghost" size="sm" href={step.href}>
              Abrir etapa
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
