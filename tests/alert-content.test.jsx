import { render, screen, fireEvent } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { Alert, Button } from '../src/design-system/components/index.js';
it('keeps retry feedback accessible without nesting block content inside a paragraph', () => {
  const retry = vi.fn();
  const { container } = render(
    <Alert tone="danger" title="Falha ao carregar">
      <p>Confira a conexão.</p>
      <Button onClick={retry}>Tentar novamente</Button>
    </Alert>
  );
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(container.querySelector('p p, p div')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(retry).toHaveBeenCalledOnce();
});
it('announces non-error feedback as status', () => {
  render(
    <Alert tone="success" title="Salvo">
      Alterações salvas.
    </Alert>
  );
  expect(screen.getByRole('status').textContent).toContain('Alterações salvas.');
});
