import { Alert } from '../../../design-system/components/index.js';
export function TemplateFeedback({ template, expired, storageWarning }) {
  return (
    <>
      {storageWarning && (
        <Alert tone="warning" title="Excel nesta sessão">
          {storageWarning}
        </Alert>
      )}
      {expired && (
        <Alert tone="danger" title="Formulário vencido">
          Carregue o pedido da semana atual para continuar. A exportação está bloqueada.
        </Alert>
      )}
      {!expired &&
        template?.warnings.map((warning) => (
          <Alert key={warning} tone="warning" title="Atenção ao modelo recebido">
            {warning}
          </Alert>
        ))}
    </>
  );
}
