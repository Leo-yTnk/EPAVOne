import { render, fireEvent, screen } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Tabs } from '../src/design-system/components/Tabs.jsx';

function Example({ onChange = () => {}, orientation = 'horizontal' }) {
  const [value, setValue] = useState('one');
  return (
    <Tabs
      stitchedIndicator
      orientation={orientation}
      value={value}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
      items={[
        { value: 'one', label: 'One' },
        { value: 'blocked', label: 'Blocked', disabled: true },
        { value: 'two', label: 'Two' }
      ]}
    />
  );
}
function pointer(node, name, x, y = 20, pointerId = 1) {
  const event = new Event(name, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: x, clientY: y, pointerId, button: 0, isPrimary: true });
  fireEvent(node, event);
  return event;
}
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const index = ['One', 'Blocked', 'Two'].indexOf(this.textContent);
    return this.matches('[role="tab"]')
      ? { left: index * 100, top: index * 50, width: 100, height: 40 }
      : { left: 0, top: 0, width: 300, height: 200 };
  });
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1)
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('previews without changing the selected app, commits on release and suppresses the old click', () => {
  const change = vi.fn();
  const { container } = render(<Example onChange={change} />);
  const one = screen.getByRole('tab', { name: 'One' });
  const two = screen.getByRole('tab', { name: 'Two' });
  pointer(one, 'pointerdown', 50);
  pointer(document, 'pointermove', 250);
  expect(one.getAttribute('aria-selected')).toBe('true');
  expect(change).not.toHaveBeenCalled();
  expect(container.querySelector('.ds-selection-indicator').style.getPropertyValue('--selection-drag-x')).toBe('200px');
  pointer(document, 'pointerup', 250);
  expect(change).toHaveBeenCalledExactlyOnceWith('two');
  expect(two.getAttribute('aria-selected')).toBe('true');
  fireEvent.click(one, { detail: 1 });
  expect(change).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.ds-selection-indicator').style.getPropertyValue('--selection-drag-x')).toBe('');
});
it('keeps ordinary clicks and gestures starting on inactive tabs intact', () => {
  const change = vi.fn();
  render(<Example onChange={change} />);
  const two = screen.getByRole('tab', { name: 'Two' });
  pointer(two, 'pointerdown', 250);
  pointer(document, 'pointermove', 50);
  pointer(document, 'pointerup', 50);
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(two);
  expect(change).toHaveBeenCalledExactlyOnceWith('two');
});
it('lets perpendicular scrolling proceed and clamps dragging within enabled targets', () => {
  const change = vi.fn();
  const { container } = render(<Example onChange={change} />);
  const one = screen.getByRole('tab', { name: 'One' });
  pointer(one, 'pointerdown', 50);
  expect(pointer(document, 'pointermove', 52, 90).defaultPrevented).toBe(false);
  pointer(document, 'pointerup', 52, 90);
  expect(change).not.toHaveBeenCalled();
  pointer(one, 'pointerdown', 50);
  pointer(document, 'pointermove', 9999);
  expect(container.querySelector('.ds-selection-indicator').style.getPropertyValue('--selection-drag-x')).toBe('200px');
  pointer(document, 'pointerup', 9999);
  expect(change).toHaveBeenCalledExactlyOnceWith('two');
});
it.each(['pointercancel', 'resize', 'blur', 'Escape'])('restores the thumb on %s without navigating', (action) => {
  const change = vi.fn();
  const { container } = render(<Example onChange={change} />);
  pointer(screen.getByRole('tab', { name: 'One' }), 'pointerdown', 50);
  pointer(document, 'pointermove', 230);
  if (action === 'pointercancel') pointer(document, action, 230);
  else if (action === 'Escape') fireEvent.keyDown(document, { key: 'Escape' });
  else fireEvent(window, new Event(action));
  pointer(document, 'pointerup', 230);
  expect(change).not.toHaveBeenCalled();
  expect(container.querySelector('.ds-selection-indicator').style.getPropertyValue('--selection-drag-x')).toBe('');
});
it('ignores other pointers and supports vertical stitched tabs', () => {
  const change = vi.fn();
  render(<Example onChange={change} orientation="vertical" />);
  pointer(screen.getByRole('tab', { name: 'One' }), 'pointerdown', 50, 20);
  pointer(document, 'pointermove', 50, 120, 2);
  expect(change).not.toHaveBeenCalled();
  pointer(document, 'pointermove', 50, 120);
  pointer(document, 'pointerup', 50, 120);
  expect(change).toHaveBeenCalledExactlyOnceWith('two');
});
it('ignores the implicit touch capture transferred from a tab to its track', () => {
  const change = vi.fn();
  render(<Example onChange={change} />);
  const one = screen.getByRole('tab', { name: 'One' });
  pointer(one, 'pointerdown', 50);
  pointer(document, 'pointermove', 250);
  pointer(one, 'lostpointercapture', 250);
  pointer(document, 'pointerup', 250);
  expect(change).toHaveBeenCalledExactlyOnceWith('two');
  expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Two' }));
});
it('updates the drag axis when the layout changes orientation without changing the selected tab', () => {
  const change = vi.fn();
  const { rerender } = render(<Example onChange={change} />);
  rerender(<Example onChange={change} orientation="vertical" />);
  pointer(screen.getByRole('tab', { name: 'One' }), 'pointerdown', 50, 20);
  pointer(document, 'pointermove', 50, 120);
  pointer(document, 'pointerup', 50, 120);
  expect(change).toHaveBeenCalledExactlyOnceWith('two');
});
