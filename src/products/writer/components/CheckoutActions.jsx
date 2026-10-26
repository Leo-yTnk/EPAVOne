import { Button } from '../../../design-system/components/index.js';
import { CHECKOUT_STEPS } from './CheckoutProgress.jsx';
export function CheckoutActions({ step, errors, busy, onNavigate }) {
  return (
    <div className="writer-checkout-actions">
      {errors.length > 0 && (
        <details className="writer-stage-notes">
          <summary>
            Confira {errors.length} {errors.length === 1 ? 'pendência' : 'pendências'} desta etapa
          </summary>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="writer-step-buttons">
        {step > 0 && (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => onNavigate(step - 1)}>
            Voltar
          </Button>
        )}
        {step < 3 && (
          <Button type="button" disabled={busy || errors.length > 0} onClick={() => onNavigate(step + 1)}>
            Continuar para {CHECKOUT_STEPS[step + 1].toLowerCase()}
          </Button>
        )}
      </div>
    </div>
  );
}
