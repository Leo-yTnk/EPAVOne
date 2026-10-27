import { useState } from 'preact/hooks';
import { Button, Card, SectionHeader, SummaryList, Textarea } from '../../../design-system/components/index.js';

export function ClientPreparation({ customer, week, act, busy }) {
  const [preparation, setPreparation] = useState(customer.preparation);
  return (
    <Card className="planner-flow-card">
      <SectionHeader title="Preparar a conversa" description={customer.context || 'Pergunte sobre a rotina e o que o cliente precisa.'} />
      <SummaryList
        items={[
          { label: 'Preferências', value: customer.preferences.join(', ') || 'Ainda não informadas' },
          { label: 'Restrições', value: customer.restrictions.join(', ') || 'Nenhuma registrada · confirme com o cliente' }
        ]}
      />
      <Textarea
        id="planner-preparation"
        label="Sua abordagem"
        rows={3}
        maxLength={4000}
        value={preparation}
        onInput={(event) => setPreparation(event.currentTarget.value)}
      />
      <div>
        <Button
          loading={busy}
          disabled={preparation === customer.preparation}
          onClick={() => act({ type: 'customer', customer: { ...customer, preparation }, weekId: week.id }, 'Abordagem salva.')}
        >
          Salvar preparação
        </Button>
      </div>
    </Card>
  );
}
