import { Card, Input, Select } from '../../../design-system/components/index.js';
import { orderCpf } from '../models/order.js';
function options(values) {
  return [{ value: '', label: 'Selecione…' }, ...values.map((value) => ({ value, label: value }))];
}
export function OrderDetails({ template, order, onChange }) {
  const client = template.clients.find((item) => item.name === order.client && item.room === order.room);
  const student = template.students.find((item) => item.name === order.student);
  const availableClients = template.clients.filter((item) => item.room === order.room);
  function chooseClient(name) {
    const selected = template.clients.find((item) => item.name === name && item.room === order.room);
    onChange({ client: name, phone: selected?.phone ?? '', cpfOverride: undefined });
  }
  return (
    <Card className="writer-details">
      <span className="ds-overline">1 · Cliente</span>
      <h2 className="ds-heading-h3">Para quem é o pedido?</h2>
      <div className="writer-fields">
        <Select
          label="Sala · obrigatória"
          options={options(template.rooms)}
          value={order.room}
          onChange={(room) => onChange({ room, student: '', client: '', phone: '', cpfOverride: undefined })}
        />
        <Select
          label="Aluno · obrigatório"
          disabled={!order.room}
          options={options(template.students.filter((item) => item.room === order.room).map((item) => item.name))}
          value={order.student}
          onChange={(name) => onChange({ student: name })}
        />
        <Select
          label="Cliente · obrigatório"
          searchable
          helper="Clientes cadastrados na turma selecionada no formulário semanal. Abra a lista para buscar pelo nome."
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
      {client && (
        <div className="writer-fields">
          <Input
            id="writer-cpf"
            label="CPF do cliente · obrigatório"
            type="text"
            inputMode="numeric"
            maxLength={14}
            value={orderCpf(template, order)}
            onInput={(event) => onChange({ cpfOverride: event.currentTarget.value.replace(/\D/g, '').slice(0, 11) })}
            helper="Confira ou corrija os 11 dígitos. Se começar com zero, o Excel receberá * antes do CPF."
          />
          <Input
            id="writer-phone"
            label="Telefone com DDD · obrigatório"
            type="tel"
            inputMode="tel"
            value={order.phone}
            onInput={(event) => onChange({ phone: event.currentTarget.value })}
          />
        </div>
      )}
      <p className="writer-muted">
        E-mail e nascimento vêm do cadastro do formulário. O CPF pode ser corrigido aqui, sem alterar os dados originais da base.
      </p>
    </Card>
  );
}
