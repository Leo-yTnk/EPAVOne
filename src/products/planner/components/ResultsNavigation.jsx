import { Icon, Tabs } from '../../../design-system/components/index.js';

export function ResultsNavigation({ showingOrders }) {
  return (
    <Tabs
      label="Áreas de resultados"
      value={showingOrders ? 'pedidos' : 'atendimentos'}
      onChange={(value) => {
        window.location.hash = value === 'pedidos' ? '#/planner/resultados/pedidos' : '#/planner/resultados';
      }}
      items={[
        {
          value: 'atendimentos',
          id: 'results-attendance-tab',
          panelId: 'planner-panel',
          label: (
            <>
              <Icon name="user" size="1rem" /> Atendimentos
            </>
          )
        },
        {
          value: 'pedidos',
          id: 'results-orders-tab',
          panelId: 'planner-panel',
          label: (
            <>
              <Icon name="orders" size="1rem" /> Pedidos
            </>
          )
        }
      ]}
    />
  );
}
