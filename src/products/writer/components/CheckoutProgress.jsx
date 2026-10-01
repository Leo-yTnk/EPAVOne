import { useRef } from 'preact/hooks';
import { Button, SelectionIndicator } from '../../../design-system/components/index.js';
export const CHECKOUT_STEPS = ['Cliente', 'Produtos', 'Entrega', 'Conferência'];
export function CheckoutProgress({ step, canVisit, busy, onNavigate }) {
  const progressRef = useRef(null);
  return (
    <nav ref={progressRef} aria-label="Etapas do pedido" className="writer-progress">
      <SelectionIndicator containerRef={progressRef} value={step} />
      <ol>
        {CHECKOUT_STEPS.map((label, index) => (
          <li key={label}>
            <Button
              type="button"
              variant={step === index ? 'primary' : 'ghost'}
              disabled={busy || !canVisit(index)}
              aria-current={step === index ? 'step' : undefined}
              onClick={() => onNavigate(index)}
            >
              {index + 1}. {label}
            </Button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
