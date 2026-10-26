import { readFileSync } from 'node:fs';
import { render } from '@testing-library/preact';
import { expect, it } from 'vitest';
import { OrderCart } from '../src/products/writer/components/OrderCart.jsx';
it('keeps the review summary as the positioning reference of its own stitch', () => {
  const style = document.createElement('style');
  style.textContent = readFileSync('src/products/writer/writer-cart.css', 'utf8');
  document.head.append(style);
  try {
    const { container } = render(
      <OrderCart
        readOnly
        template={{ products: [{ name: 'Frango', price: 10 }], capacity: 12, kitOptions: [] }}
        lines={[{ name: 'Frango', quantity: 1 }]}
      />
    );
    const summary = container.querySelector('.writer-cart-summary');
    expect(getComputedStyle(summary).position).toBe('relative');
    expect(summary.querySelector('.ds-stitch').parentElement).toBe(summary);
  } finally {
    style.remove();
  }
});
