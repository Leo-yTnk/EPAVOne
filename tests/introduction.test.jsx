import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { IntroductionPage } from '../src/app/welcome/IntroductionPage.jsx';
import { completeIntroduction, hasSeenIntroduction } from '../src/app/welcome/introduction.js';
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it('explains all three steps and connects both entry actions', () => {
  const complete = vi.fn();
  render(<IntroductionPage onComplete={complete} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getByText(/enviado por você ao suporte/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Começar minha experiência/ }));
  fireEvent.click(screen.getByRole('button', { name: /Já conheço/ }));
  expect(complete).toHaveBeenCalledTimes(2);
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
