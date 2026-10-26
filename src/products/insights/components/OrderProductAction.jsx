import { Alert, Button } from '../../../design-system/components/index.js';
import { weeklyOrder } from '../../../shared/services/weeklyOrder.js';
import { useWeeklyOrder } from '../../../shared/services/useWeeklyOrder.js';
import { matchProduct } from '../../../shared/services/orderMatching.js';
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export function OrderProductAction({ product }) {
  const { template } = useWeeklyOrder();
  const current = template && template.period.start <= today() && template.period.end >= today();
  const match = current ? matchProduct(product, template.products) : null;
  const single = match?.candidates.length === 1 ? match.candidates[0] : null;
  return (
    <Alert tone="info" title="Levar para o pedido">
      <p>
        {!current
          ? 'Carregue o Excel da semana no Writer para conferir disponibilidade e preço.'
          : single
            ? `${single.name} · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(single.price)} no Excel. Confira a embalagem antes de adicionar.`
            : match.candidates.length
              ? 'Mais de uma apresentação encontrada. Escolha no Writer.'
              : 'Sem correspondência segura no Excel. Procure a apresentação correta no Writer.'}
      </p>
      {match && <p>{match.explanation}</p>}
      <Button
        size="sm"
        onClick={() => {
          weeklyOrder.request(product);
          window.location.hash = '#/writer';
        }}
      >
        Conferir no Writer
      </Button>
    </Alert>
  );
}
