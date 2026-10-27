import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { IntroductionPage } from '../src/app/welcome/IntroductionPage.jsx';
import { completeIntroduction, hasSeenIntroduction } from '../src/app/welcome/introduction.js';
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it('covers the whole workflow with next, previous, topic selection and completion', () => {
  const complete = vi.fn();
  render(<IntroductionPage onComplete={complete} />);
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  expect(screen.getByRole('button', { name: /Anterior/ }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /Próximo/ }));
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2');
  fireEvent.click(screen.getByRole('button', { name: /Anterior/ }));
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  fireEvent.click(screen.getByRole('button', { name: /09 · Download e envio/ }));
  expect(screen.getByText(/Baixar o pedido não faz o envio automaticamente/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Próximo/ }));
  expect(screen.getByText(/ticket médio/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Começar a usar' }));
  expect(complete).toHaveBeenCalledOnce();
});
it('allows skipping at any point', () => {
  const complete = vi.fn();
  render(<IntroductionPage onComplete={complete} />);
  fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }));
  expect(complete).toHaveBeenCalledOnce();
});
it('remembers completion independently of preferences and handles unavailable storage', () => {
  expect(hasSeenIntroduction()).toBe(false);
  expect(completeIntroduction()).toBe(true);
  expect(hasSeenIntroduction()).toBe(true);
  localStorage.removeItem('epavone-preferences');
  expect(hasSeenIntroduction()).toBe(true);
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('unavailable');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('unavailable');
  });
  expect(hasSeenIntroduction()).toBe(false);
  expect(completeIntroduction()).toBe(false);
});
