import { useEffect, useId, useState } from 'preact/hooks';
import { Alert, ActionGroup, Button, Card, FileInput, Icon, SectionHeader } from '../../../design-system/components/index.js';
export function WeeklyUpload({ template, busy, error, onUpload, onRemove }) {
  const [removing, setRemoving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const uploadId = useId();
  useEffect(() => setReplacing(false), [template]);
  return (
    <Card className={`writer-upload${template ? ' is-attached' : ''}`}>
      <SectionHeader
        eyebrow="Formulário da semana"
        title={template ? 'Seu Excel está anexado.' : 'Comece pelo pedido atual'}
        description={
          template
            ? `${template.filename} · ${template.period.label} · ${template.products.length} produtos disponíveis.`
            : 'Carregue o arquivo original recebido do EPAV. Conferimos a semana, os menus e as fórmulas antes de começar.'
        }
      />
      {template && (
        <div className="writer-attachment-actions">
          <span className="writer-muted">
            <Icon name="check" /> Formulário da semana validado
          </span>
          <ActionGroup align="start">
            <Button
              variant="secondary"
              disabled={busy}
              aria-expanded={replacing}
              aria-controls={uploadId}
              onClick={() => setReplacing((value) => !value)}
            >
              {replacing ? 'Manter Excel atual' : 'Trocar Excel'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setRemoving(true)}>
              <Icon name="close" /> Remover Excel
            </Button>
          </ActionGroup>
        </div>
      )}
      <div id={uploadId} hidden={Boolean(template) && !replacing}>
        <FileInput
          label={template ? 'Trocar formulário (reinicia o pedido)' : 'Carregar pedido semanal · obrigatório'}
          accept=".xlsx"
          disabled={busy}
          loading={busy}
          filename={template?.filename}
          helper="Excel .xlsx, até 15 MB. O arquivo continua nesta aba, mesmo após recarregar, até você removê-lo."
          onFile={onUpload}
        />
      </div>
      {busy && <p role="status">Verificando período, menus e fórmulas…</p>}
      {error && (
        <Alert tone="danger" title="Não foi possível usar este formulário">
          {error}
        </Alert>
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
