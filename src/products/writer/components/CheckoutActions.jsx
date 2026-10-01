import { Alert, Button } from '../../../design-system/components/index.js';
import { CHECKOUT_STEPS } from './CheckoutProgress.jsx';
export function CheckoutActions({ step, errors, busy, onNavigate }) {
  return (
    <div className="writer-checkout-actions">
      {errors.length > 0 && (
        <Alert tone="warning" title="Complete esta etapa">
          <span>{errors.join(' ')}</span>
        </Alert>
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
