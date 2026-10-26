import { useState } from 'preact/hooks';
import { Button, Dialog } from '../../../design-system/components/index.js';
import { studentDefaults } from '../services/studentDefaults.js';
export function StudentDefaultDialog({ value, onClose }) {
  const [error, setError] = useState('');
  return (
    <Dialog
      open
      title="Usar aluno e sala por padrão?"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Só neste pedido
          </Button>
          <Button
            onClick={() => {
              try {
                studentDefaults.save(value);
                onClose();
              } catch {
                setError('O navegador não permitiu salvar o padrão. O pedido atual foi mantido.');
              }
            }}
          >
            Salvar como padrão
          </Button>
        </>
      }
    >
      <p>
        <strong>{value.student}</strong> · {value.room}
      </p>
      <p>
        Preencher automaticamente nos próximos pedidos deste navegador, quando o aluno estiver no Excel. Você pode trocar ou limpar o padrão
        depois.
      </p>
      {error && <p role="alert">{error}</p>}
    </Dialog>
  );
}
