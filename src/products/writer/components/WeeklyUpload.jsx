import { Alert, Card, FileInput } from '../../../design-system/components/index.js';
export function WeeklyUpload({ template, busy, error, onUpload }) {
  return (
    <Card className="writer-upload">
      <div>
        <span className="ds-overline">Formulário da semana</span>
        <h2 className="ds-heading-h3">Comece pelo pedido atual</h2>
        <p>Carregue o arquivo original recebido do EPAV. A semana e as opções serão verificadas dentro do Excel.</p>
      </div>
      <FileInput
        label={template ? 'Trocar formulário (reinicia o pedido)' : 'Carregar pedido semanal · obrigatório'}
        accept=".xlsx"
        disabled={busy}
        loading={busy}
        filename={template?.filename}
        helper="Excel .xlsx, até 15 MB. Os dados ficam somente nesta sessão."
        onFile={onUpload}
      />
      {busy && <p role="status">Verificando período, menus e fórmulas…</p>}
      {error && (
        <Alert tone="danger" title="Não foi possível usar este formulário">
          {error}
        </Alert>
      )}
      {template && (
        <Alert tone="success" title="Formulário da semana validado">
          {template.period.label}. {template.products.length} opções distintas no menu de produtos.
        </Alert>
      )}
    </Card>
  );
}
