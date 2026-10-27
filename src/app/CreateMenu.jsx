import { Icon, Menu } from '../design-system/components/index.js';

export function CreateMenu() {
  return (
    <Menu
      label="Criar"
      variant="secondary"
      triggerLabel={
        <>
          <Icon name="plus" /> <span>Criar</span>
        </>
      }
      items={[
        { label: 'Preparar pedido', icon: 'writer', href: '#/writer', group: 'Atendimento' },
        { label: 'Cadastrar cliente', icon: 'user', href: '#/planner/clientes/novo', group: 'Atendimento' },
        { label: 'Registrar venda', icon: 'orders', href: '#/planner/resultados/pedidos/novo', group: 'Atendimento' },
        { label: 'Criar receita', icon: 'recipe', href: '#/insights/criacao/receitas/novo', group: 'Minha biblioteca' },
        { label: 'Criar produto', icon: 'product', href: '#/insights/criacao/produtos/novo', group: 'Minha biblioteca' },
        { label: 'Criar categoria', icon: 'category', href: '#/insights/criacao/categorias/novo', group: 'Minha biblioteca' }
      ]}
    />
  );
}
