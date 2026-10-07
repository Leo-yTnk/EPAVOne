import { plannerRepository } from '../repositories/plannerRepository.js';
import { emptyWeek, OUTCOMES, today, validateCustomer, weekStart, validDay } from '../models/planner.js';
export function createPlannerService(repository = plannerRepository) {
  return {
    load: (now = today()) => repository.load(now),
    async update(state, command) {
      const next = structuredClone(state);
      const customer = next.customers.find((item) => item.id === command.customerId);
      const weekId = command.weekId || weekStart();
      let week = next.weeks.find((item) => item.id === weekId);
      if (!week) {
        week = emptyWeek(weekId);
        next.weeks.push(week);
      }
      if (command.type === 'customer') {
        validateCustomer(command.customer);
        const existing = next.customers.findIndex((item) => item.id === command.customer.id);
        if (existing < 0) next.customers.push({ ...command.customer, id: crypto.randomUUID() });
        else next.customers[existing] = command.customer;
      } else if (command.type === 'goal') {
        if (!Number.isInteger(command.value) || command.value < 1 || command.value > 100)
          throw new Error('A meta deve ser um número inteiro entre 1 e 100.');
        week.goal = command.value;
      } else {
        if (!customer) throw new Error('Cliente não encontrado.');
        const entry = week.queue.find((item) => item.customerId === customer.id);
        if (command.type === 'add') {
          if (!entry) week.queue.push({ customerId: customer.id, role: 'primary', outcome: null });
        } else if (command.type === 'remove') {
          if (entry?.outcome) throw new Error('Um atendimento registrado permanece no planejamento para preservar o histórico.');
          week.queue = week.queue.filter((item) => item.customerId !== customer.id);
        } else if (command.type === 'role') {
          if (!entry || entry.outcome) throw new Error('Não é possível alterar esse atendimento.');
          entry.role = entry.role === 'primary' ? 'reserve' : 'primary';
        } else if (command.type === 'move') {
          const index = week.queue.indexOf(entry);
          const target = index + command.direction;
          if (index >= 0 && target >= 0 && target < week.queue.length)
            [week.queue[index], week.queue[target]] = [week.queue[target], week.queue[index]];
        } else if (command.type === 'commitment') {
          if (!command.text.trim() || !validDay(command.due)) throw new Error('Informe um combinado e sua data.');
          next.commitments.push({
            id: crypto.randomUUID(),
            customerId: customer.id,
            text: command.text.trim(),
            due: command.due,
            done: false
          });
        } else if (command.type === 'resolve') {
          const commitment = next.commitments.find((item) => item.id === command.id && item.customerId === customer.id);
          if (!commitment) throw new Error('Combinado não encontrado.');
          commitment.done = !commitment.done;
        } else if (command.type === 'outcome') {
          if (weekId !== weekStart()) throw new Error('Registre atendimentos somente na semana atual.');
          if (!entry || entry.outcome) throw new Error('Esse atendimento já foi registrado ou saiu da fila.');
          if (!OUTCOMES[command.outcome]) throw new Error('Selecione o resultado do atendimento.');
          if (
            command.outcome === 'bought' &&
            (!Number.isInteger(command.amountCents) || command.amountCents <= 0 || !Number.isInteger(command.units) || command.units <= 0)
          )
            throw new Error('Informe o valor e o total de unidades da compra.');
          if (command.outcome === 'later' && !validDay(command.followUp)) throw new Error('Informe quando retomar o contato.');
          if (command.outcome === 'later' && command.followUp < today()) throw new Error('O retorno deve ser hoje ou em uma data futura.');
          entry.outcome = command.outcome;
          next.interactions.push({
            id: crypto.randomUUID(),
            customerId: customer.id,
            weekId,
            date: today(),
            outcome: command.outcome,
            note: command.note || '',
            ...(command.outcome === 'bought' ? { amountCents: command.amountCents, units: command.units } : {})
          });
          customer.intent = command.outcome === 'interested';
          if (command.outcome === 'later')
            next.commitments.push({
              id: crypto.randomUUID(),
              customerId: customer.id,
              text: command.note || 'Retomar a conversa',
              due: command.followUp,
              done: false
            });
        } else throw new Error('Ação não reconhecida.');
      }
      return repository.save(next);
    }
  };
}
export const plannerService = createPlannerService();
