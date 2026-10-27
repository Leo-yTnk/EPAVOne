import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { useEffect, useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App.jsx';
const lifecycle = vi.hoisted(() => ({ mounts: 0, unmounts: 0 }));
vi.mock('../src/app/account/useAccount.js', () => ({ useAccount: () => ({ session: null }) }));
vi.mock('../src/products/home/HomePage.jsx', () => ({ HomePage: () => <p>Home de teste</p> }));
vi.mock('../src/products/insights/InsightsRoutes.jsx', () => ({ InsightsRoutes: () => <p>Insights de teste</p> }));
vi.mock('../src/products/writer/WriterRoutes.jsx', () => ({
  WriterRoutes: function TestWriter({ active }) {
    const [value, setValue] = useState('');
    useEffect(() => {
      lifecycle.mounts++;
      return () => {
        lifecycle.unmounts++;
      };
    }, []);
    return active ? <input aria-label="Pedido em andamento" value={value} onInput={(e) => setValue(e.currentTarget.value)} /> : null;
  }
}));
function navigate(hash) {
  window.location.hash = hash;
  fireEvent(window, new Event('hashchange'));
}
describe('Deferred app loading', () => {
  it('defers Writer until first use and keeps its state across app switches and subpages', async () => {
    window.scrollTo = vi.fn();
    window.location.hash = '#/';
    localStorage.setItem('epavone-tutorial-v1', 'done');
    render(<App />);
    await screen.findByText('Home de teste');
    expect(lifecycle.mounts).toBe(0);
    navigate('#/writer');
    const input = await screen.findByLabelText('Pedido em andamento');
    fireEvent.input(input, { target: { value: 'Cliente e carrinho preservados' } });
    await waitFor(() => expect(lifecycle.mounts).toBe(1));
    navigate('#/insights/produtos');
    await screen.findByText('Insights de teste');
    expect(screen.queryByLabelText('Pedido em andamento')).toBeNull();
    navigate('#/insights/receitas');
    navigate('#/writer');
    expect((await screen.findByLabelText('Pedido em andamento')).value).toBe('Cliente e carrinho preservados');
    navigate('#/welcome');
    await screen.findByRole('dialog', { name: 'Como usar o EPAVOne' });
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }));
    navigate('#/writer');
    expect((await screen.findByLabelText('Pedido em andamento')).value).toBe('Cliente e carrinho preservados');
    expect(lifecycle.mounts).toBe(1);
    expect(lifecycle.unmounts).toBe(0);
  });
});

it('shows the tutorial once, remembers dismissal across routes and allows manual replay', async () => {
  localStorage.removeItem('epavone-tutorial-v1');
  window.scrollTo = vi.fn();
  window.location.hash = '#/';
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Pular tutorial' }));
  await screen.findByText('Home de teste');
  expect(localStorage.getItem('epavone-tutorial-v1')).toBe('done');
  navigate('#/insights/produtos');
  await screen.findByText('Insights de teste');
  expect(screen.queryByRole('dialog', { name: 'Como usar o EPAVOne' })).toBeNull();
  navigate('#/welcome');
  fireEvent.click(await screen.findByRole('button', { name: 'Pular tutorial' }));
  await screen.findByText('Home de teste');
  expect(window.location.hash).toBe('#/');
});

it('also introduces a first visit through a deep link and preserves its destination', async () => {
  localStorage.removeItem('epavone-tutorial-v1');
  window.scrollTo = vi.fn();
  window.location.hash = '#/insights/produtos';
  const view = render(<App />);
  await screen.findByRole('dialog', { name: 'Como usar o EPAVOne' });
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(localStorage.getItem('epavone-tutorial-v1')).toBe('done');
  expect(window.location.hash).toBe('#/insights/produtos');
  view.unmount();
  render(<App />);
  expect(screen.queryByRole('dialog', { name: 'Como usar o EPAVOne' })).toBeNull();
});
