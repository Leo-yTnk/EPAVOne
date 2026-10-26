import { useState } from 'preact/hooks';
import { Alert, Button, Dialog } from '../../../design-system/components/index.js';

export function DeleteClientDialog({ customer, act, busy, notice, saveError, onClose, onDeleted }) {
  const [attempted, setAttempted] = useState(false);
  async function remove() {
    setAttempted(true);
    if (await act({ type: 'deleteCustomer', customerId: customer.id }, 'Cliente excluído. Vendas e resultados anteriores preservados.'))
      onDeleted();
  }
  return (
    <Dialog
      open
      title="Excluir cliente?"
      onClose={() => {
        if (!busy) onClose();
      }}
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" loading={busy} onClick={remove}>
            Confirmar exclusão
          </Button>
        </>
      }
    >
      <p>
        Excluir <strong>{customer.name}</strong> da carteira?
      </p>
      <p>
        O perfil, os combinados e a participação nas filas serão removidos. Vendas e atendimentos já registrados permanecem no histórico de
        resultados. Esta ação não pode ser desfeita.
      </p>
      {attempted && saveError && notice && (
        <Alert tone="danger" title="Não foi possível excluir">
          {notice}
        </Alert>
      )}
    </Dialog>
  );
}
