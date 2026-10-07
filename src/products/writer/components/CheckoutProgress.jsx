import { useRef } from 'preact/hooks';
import { Button, Icon, SelectionIndicator } from '../../../design-system/components/index.js';
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
              <span className="writer-step-number">
                <Icon name={['user', 'product', 'home', 'check'][index]} />
              </span>
              <span className="writer-step-label">
                {index + 1}. {label}
                <small aria-hidden="true">{['Quem vai receber', 'Monte o carrinho', 'Como e quando', 'Revise e baixe'][index]}</small>
              </span>
            </Button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
