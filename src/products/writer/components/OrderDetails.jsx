import { useEffect, useState } from 'preact/hooks';
import { studentDefaults } from '../services/studentDefaults.js';
import { StudentDefaultDialog } from './StudentDefaultDialog.jsx';
import { Button, Card, SummaryList, Input, Select, SectionHeader, FieldGrid } from '../../../design-system/components/index.js';
import { orderCpf } from '../models/order.js';
function options(values) {
  return [{ value: '', label: 'Selecione…' }, ...values.map((value) => ({ value, label: value }))];
}
export function OrderDetails({ template, order, onChange }) {
  const [preference, setPreference] = useState(null);
  const [saved, setSaved] = useState(studentDefaults.read);
  useEffect(() => {
    const value = studentDefaults.read();
    if (
      value &&
      !order.student &&
      !order.client &&
      template.rooms.includes(value.room) &&
      template.students.some((item) => item.name === value.student && item.room === value.room)
    )
      onChange({ student: value.student, room: value.room });
  }, [template]);
  function chooseStudent(name) {
    onChange({ student: name });
    if (name && (saved?.student !== name || saved?.room !== order.room)) setPreference({ student: name, room: order.room });
  }
  const client = template.clients.find((item) => item.name === order.client && item.room === order.room);
  const student = template.students.find((item) => item.name === order.student);
  const availableClients = template.clients.filter((item) => item.room === order.room);
  function chooseClient(name) {
    const selected = template.clients.find((item) => item.name === name && item.room === order.room);
    onChange({ client: name, phone: selected?.phone ?? '', cpfOverride: undefined });
  }
  return (
    <Card className="writer-details">
      <SectionHeader eyebrow="1 · Cliente" title="Para quem é o pedido?" />
      <FieldGrid>
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
          onChange={chooseStudent}
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
      </FieldGrid>
      {saved && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            try {
              studentDefaults.remove();
              setSaved(null);
            } catch {
              setPreference({ student: order.student, room: order.room });
            }
          }}
        >
          Limpar aluno e sala padrão
        </Button>
      )}
      {preference && (
        <StudentDefaultDialog
          value={preference}
          onClose={() => {
            setPreference(null);
            setSaved(studentDefaults.read());
          }}
        />
      )}
      {(client || student) && (
        <SummaryList
          layout="rows"
          items={[
            ...(student ? [{ label: 'E-mail escolar', value: student.email || 'Ausente na base' }] : []),
            ...(client
              ? [
                  { label: 'E-mail do cliente', value: client.email || 'Ausente na base' },
                  {
                    label: 'Nascimento',
                    value:
                      typeof client.birth === 'number'
                        ? new Date(Date.UTC(1899, 11, 30) + client.birth * 86400000).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : 'Ausente na base'
                  }
                ]
              : [])
          ]}
        />
      )}
      {client && (
        <FieldGrid>
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
        </FieldGrid>
      )}
      <p className="writer-muted">
        E-mail e nascimento vêm do cadastro do formulário. O CPF pode ser corrigido aqui, sem alterar os dados originais da base.
      </p>
    </Card>
  );
}
