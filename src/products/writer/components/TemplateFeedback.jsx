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
      {!expired && template?.warnings?.length > 0 && (
        <details className="writer-model-notes">
          <summary>Detalhes do formulário ({template.warnings.length})</summary>
          <ul>
            {template.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
