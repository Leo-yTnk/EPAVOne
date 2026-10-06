import { Badge, Button, Card, Heading, PageHeader, Text } from '../../design-system/components/index.js';
export function PlannerRoutes() {
  return (
    <section className="product-page">
      <PageHeader
        eyebrow="EPAVPlanner"
        title="Uma semana bem planejada faz diferença."
        description="O espaço para organizar clientes, atendimentos e metas está em preparação."
      />
      <Card as="section" className="planner-preview" aria-labelledby="planner-status-title">
        <Badge>Em desenvolvimento</Badge>
        <Heading as="h2" id="planner-status-title" level={3}>
          Seu próximo atendimento começa aqui.
        </Heading>
        <Text>
          Enquanto o Planner fica pronto, explore ideias no Insights e use o formulário da semana para preparar seu pedido no Writer.
        </Text>
        <div className="ds-inline">
          <Button as="a" href="#/insights" variant="secondary">
            Explorar ideias
          </Button>
          <Button as="a" href="#/writer">
            Preparar pedido
          </Button>
        </div>
      </Card>
    </section>
  );
}
