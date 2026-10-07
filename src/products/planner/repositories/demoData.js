import { shiftDay, weekStart } from '../models/planner.js';
export function demoData(now) {
  const id = weekStart(now);
  const names = [
    'Bruna (exemplo)',
    'Denis (exemplo)',
    'Danielle (exemplo)',
    'Erika (exemplo)',
    'Mariana (exemplo)',
    'Guilherme (exemplo)',
    'Renata (exemplo)',
    'Pedro (exemplo)',
    'Fernanda (exemplo)',
    'Alex (exemplo)',
    'Mara (exemplo)',
    'Luccas (exemplo)'
  ];
  const customers = names.map((name, index) => ({
    id: `demo-${index + 1}`,
    name,
    segment: ['Famílias', 'Praticidade', 'Churrasco', 'Exploração'][index % 4],
    position: `Mesa ${Math.floor(index / 4) + 1} · cadeira ${(index % 4) + 1}`,
    tags: index < 3 ? ['Recorrente'] : ['Conhecer melhor'],
    preferences:
      index === 4
        ? ['aves', 'bovinos', 'complementos']
        : [
            ['aves', 'padaria'],
            ['bovinos', 'suínos'],
            ['sobremesas', 'padaria'],
            ['pescados', 'complementos']
          ][index % 4],
    restrictions: index === 4 ? ['pescados', 'feijão'] : [],
    intent: index < 2,
    frequencyDays: 14,
    context:
      index === 4
        ? 'Cozinha para a família. Prefere montar refeições em casa.'
        : 'Converse sobre a rotina da casa antes de sugerir quantidades.',
    notes: '',
    preparation:
      index < 3 ? 'Confirmar o combinado, perguntar o que falta para a semana e oferecer uma combinação de principal e complemento.' : ''
  }));
  const interactions = customers.slice(0, 8).map((customer, index) => ({
    id: `history-${index}`,
    customerId: customer.id,
    weekId: weekStart(shiftDay(id, -((index % 3) + 1) * 7)),
    date: shiftDay(id, -((index % 3) + 1) * 7 + 3),
    outcome: index % 3 ? 'interested' : 'bought',
    note: 'Registro demonstrativo de uma conversa anterior.',
    ...(index % 3 ? {} : { amountCents: 18000 + index * 1500, units: 8 + index })
  }));
  return {
    version: 1,
    customers,
    interactions,
    commitments: [
      { id: 'promise-1', customerId: 'demo-1', text: 'Retomar a seleção para o almoço em família', due: shiftDay(id, 3), done: false }
    ],
    weeks: [0, -7, -14, -21].map((offset) => ({
      id: shiftDay(id, offset),
      goal: 8,
      queue: offset
        ? []
        : customers
            .slice(0, 7)
            .map((customer, index) => ({ customerId: customer.id, role: index > 4 ? 'reserve' : 'primary', outcome: null }))
    })),
    offers: [
      { id: 'family', title: 'Refeições em família', query: 'frango', categories: ['aves'], kind: 'principal' },
      { id: 'grill', title: 'Churrasco do fim de semana', query: 'linguiça', categories: ['suínos'], kind: 'principal' },
      { id: 'fish', title: 'Variar o almoço', query: 'tilápia', categories: ['pescados'], kind: 'principal' },
      { id: 'bread', title: 'Completar o café da manhã', query: 'pão de queijo', categories: ['padaria'], kind: 'complemento' },
      { id: 'sweet', title: 'Encerrar com uma sobremesa', query: 'petit gâteau', categories: ['sobremesas'], kind: 'complemento' },
      { id: 'side', title: 'Acompanhamento para compartilhar', query: 'batata', categories: ['complementos'], kind: 'complemento' },
      { id: 'beef', title: 'Preparar o almoço da semana', query: 'patinho', categories: ['bovinos'], kind: 'principal' }
    ]
  };
}
