import { useState } from 'preact/hooks';
import { Alert, Button, Card, FileInput, Icon } from '../../../design-system/components/index.js';
export function WeeklyUpload({ template, busy, error, onUpload, onRemove }) {
  const [removing, setRemoving] = useState(false);
  return (
    <Card className={`writer-upload${template ? ' is-attached' : ''}`}>
      <div>
        <span className="ds-overline">Formulário da semana</span>
        <h2 className="ds-heading-h3">{template ? 'Seu Excel está anexado.' : 'Comece pelo pedido atual'}</h2>
        <p className="writer-muted">
          {template
            ? `${template.period.label} · ${template.products.length} produtos disponíveis.`
            : 'Carregue o arquivo original recebido do EPAV. Conferimos a semana, os menus e as fórmulas antes de começar.'}
        </p>
      </div>
      <FileInput
        label={template ? 'Trocar formulário (reinicia o pedido)' : 'Carregar pedido semanal · obrigatório'}
        accept=".xlsx"
        disabled={busy}
        loading={busy}
        filename={template?.filename}
        helper="Excel .xlsx, até 15 MB. O arquivo continua nesta aba, mesmo após recarregar, até você removê-lo."
        onFile={onUpload}
      />
      {busy && <p role="status">Verificando período, menus e fórmulas…</p>}
      {error && (
        <Alert tone="danger" title="Não foi possível usar este formulário">
          {error}
        </Alert>
      )}
      {template && (
        <div className="writer-attachment-actions">
          <span className="writer-muted">
            <Icon name="check" /> Formulário da semana validado
          </span>
          <Button variant="ghost" disabled={busy} onClick={() => setRemoving(true)}>
            <Icon name="close" /> Remover Excel
          </Button>
        </div>
      )}
      {template && removing && (
        <Alert tone="warning" title="Remover o Excel desta sessão?">
          <p>O pedido em andamento também será limpo. Para continuar depois, será necessário carregar o arquivo novamente.</p>
          <div className="writer-step-buttons">
            <Button variant="secondary" disabled={busy} onClick={() => setRemoving(false)}>
              Manter Excel
            </Button>
            <Button disabled={busy} loading={busy} onClick={onRemove}>
              Remover Excel e pedido
            </Button>
          </div>
        </Alert>
      )}
    </Card>
  );
}
