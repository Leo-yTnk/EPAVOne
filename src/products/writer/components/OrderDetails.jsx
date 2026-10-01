import { useState } from 'preact/hooks';
import { Card, Input, Select } from '../../../design-system/components/index.js';
import { deliveryLimits, normalize } from '../models/order.js';
function options(values) {
  return [{ value: '', label: 'Selecione…' }, ...values.map((value) => ({ value, label: value }))];
}
export function OrderDetails({ template, order, onChange }) {
  const [clientSearch, setClientSearch] = useState('');
  const client = template.clients.find((item) => item.name === order.client && item.room === order.room);
  const student = template.students.find((item) => item.name === order.student);
  const availableClients = template.clients.filter(
    (item) => item.room === order.room && (normalize(item.name).includes(normalize(clientSearch)) || item.name === order.client)
  );
  const storeNames = order.method.includes('Mercado J&F')
    ? [template.market]
    : template.stores.map((item) => item.name).filter((name) => name !== template.market);
  const bounds = deliveryLimits(template, order.method);
  function chooseClient(name) {
    const selected = template.clients.find((item) => item.name === name && item.room === order.room);
    onChange({ client: name, phone: selected?.phone ?? '' });
  }
  return (
    <Card className="writer-details">
      <span className="ds-overline">3 · Dados do pedido</span>
      <h2 className="ds-heading-h3">Quem compra e como recebe</h2>
      <div className="writer-fields">
        <Select
          label="Sala · obrigatória"
          options={options(template.rooms)}
          value={order.room}
          onChange={(room) => onChange({ room, student: '', client: '', phone: '' })}
        />
        <Select
          label="Aluno · obrigatório"
          disabled={!order.room}
          options={options(template.students.filter((item) => item.room === order.room).map((item) => item.name))}
          value={order.student}
          onChange={(name) => onChange({ student: name })}
        />
        <Input
          id="writer-client-search"
          label="Buscar cliente da sala"
          type="search"
          disabled={!order.room}
          value={clientSearch}
          onInput={(event) => setClientSearch(event.currentTarget.value)}
        />
        <Select
          label="Cliente · obrigatório"
          disabled={!order.room}
          options={options(availableClients.map((item) => item.name))}
          value={order.client}
          onChange={chooseClient}
        />
      </div>
      {(client || student) && (
        <dl className="writer-derived">
          {student && (
            <>
              <dt>E-mail escolar</dt>
              <dd>{student.email || 'Ausente na base'}</dd>
            </>
          )}
          {client && (
            <>
              <dt>E-mail do cliente</dt>
              <dd>{client.email || 'Ausente na base'}</dd>
              <dt>CPF</dt>
              <dd>{client.cpf || 'Ausente na base'}</dd>
              <dt>Nascimento</dt>
              <dd>
                {typeof client.birth === 'number'
                  ? new Date(Date.UTC(1899, 11, 30) + client.birth * 86400000).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                  : 'Ausente na base'}
              </dd>
            </>
          )}
        </dl>
      )}
      <div className="writer-fields">
        <Input
          id="writer-phone"
          label="Telefone com DDD · obrigatório"
          type="tel"
          inputMode="tel"
          value={order.phone}
          onInput={(event) => onChange({ phone: event.currentTarget.value })}
        />
        <Select
          label="Entrega ou retirada · obrigatória"
          options={options(template.methods)}
          value={order.method}
          onChange={(method) => onChange({ method, store: method.includes('Mercado J&F') ? template.market : '', date: '' })}
        />
        {order.method && normalize(order.method) !== 'entrega em casa' && (
          <Select
            label="Loja para retirada · obrigatória"
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
          helper={`Limites definidos no Excel: ${bounds.min} a ${bounds.max}.`}
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
      <p className="writer-muted">
        E-mail, CPF, nascimento, endereços e frete continuam automáticos no Excel. Se o cadastro estiver incompleto, será necessário
        carregar um formulário com a base corrigida.
      </p>
    </Card>
  );
}
