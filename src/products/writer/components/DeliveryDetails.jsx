import { Card, Input, Select } from '../../../design-system/components/index.js';
import { deliveryLimits, normalize } from '../models/order.js';
const options = (values) => [{ value: '', label: 'Selecione…' }, ...values.map((value) => ({ value, label: value }))];

export function DeliveryDetails({ template, order, today, onChange }) {
  const client = template.clients.find((item) => item.name === order.client && item.room === order.room);
  const storeNames = normalize(order.method).includes('mercado j&f')
    ? [template.market]
    : template.stores.map((item) => item.name).filter((name) => name !== template.market);
  const bounds = deliveryLimits(template, order.method, today);
  return (
    <Card className="writer-details">
      <span className="ds-overline">3 · Entrega e pagamento</span>
      <h2 className="ds-heading-h3">Como o cliente recebe?</h2>
      <div className="writer-fields">
        <Select
          label="Entrega ou retirada · obrigatória"
          options={options(template.methods)}
          value={order.method}
          onChange={(method) => onChange({ method, store: normalize(method).includes('mercado j&f') ? template.market : '', date: '' })}
        />
        {order.method && normalize(order.method) !== 'entrega em casa' && (
          <Select
            label="Loja para retirada · obrigatória"
            searchable
            options={options(storeNames)}
            value={order.store}
            onChange={(store) => onChange({ store })}
          />
        )}
        <Input
          id="writer-date"
          label="Data de entrega ou retirada · obrigatória"
          type="date"
          min={bounds.min}
          max={bounds.max}
          value={order.date}
          onInput={(event) => onChange({ date: event.currentTarget.value })}
          helper={`Limites do formulário: ${bounds.min} a ${bounds.max}.`}
        />
        <Select
          label="Pagamento · obrigatório"
          options={options(template.payments)}
          value={order.payment}
          onChange={(payment) => onChange({ payment })}
        />
      </div>
      {normalize(order.method) === 'entrega em casa' && (
        <p>
          <strong>Endereço cadastrado:</strong> {client?.address || 'Ausente na base do formulário. Atualize o cadastro antes de exportar.'}
        </p>
      )}
    </Card>
  );
}
