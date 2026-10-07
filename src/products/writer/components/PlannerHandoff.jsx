import { useState } from 'preact/hooks';
import { Alert, Button, Dialog, Select } from '../../../design-system/components/index.js';
export function PlannerHandoff({ context, template, onApply, busy }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const client = selected ? template?.clients[Number(selected) - 1] : null;
  return (
    <>
      <Alert tone="info" title="Cliente vindo do Planner">
        <div className="ds-inline">
          <span>{context.customerName} · associe ao cadastro do Excel antes de preencher o pedido.</span>
          <Button size="sm" variant="secondary" disabled={busy || !template} onClick={() => setOpen(true)}>
            Usar este cliente
          </Button>
          {!template && <span>Carregue o Excel para continuar.</span>}
        </div>
      </Alert>
      <Dialog
        open={open}
        title="Associar cliente ao Excel"
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Manter pedido atual
            </Button>
            <Button
              disabled={!client}
              onClick={() => {
                onApply(client);
                setOpen(false);
              }}
            >
              Confirmar cliente
            </Button>
          </>
        }
      >
        <p>
          Escolha o cadastro correspondente a {context.customerName}. O cliente do pedido será substituído. Confira os produtos e demais
          dados já preenchidos.
        </p>
        <Select
          label="Cadastro do cliente no Excel"
          searchable
          value={selected}
          options={[
            { value: '', label: 'Selecione o cadastro correto' },
            ...(template?.clients || []).map((item, index) => ({ value: String(index + 1), label: `${item.name} · ${item.room}` }))
          ]}
          onChange={setSelected}
        />
      </Dialog>
    </>
  );
}
