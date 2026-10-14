import { act, render } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useForegroundInterval } from '../src/design-system/behaviors/useForegroundInterval.js';
function Clock({ refresh, active = true }) {
  useForegroundInterval(refresh, 30000, active);
  return null;
}
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe('UI clocks on slower devices', () => {
  it('stops while hidden or inactive, refreshes immediately on return and cleans up', () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const refresh = vi.fn();
    const { rerender, unmount } = render(<Clock refresh={refresh} />);
    expect(refresh).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(30000));
    expect(refresh).toHaveBeenCalledTimes(2);
    hidden.mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    act(() => vi.advanceTimersByTime(90000));
    expect(refresh).toHaveBeenCalledTimes(2);
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(refresh).toHaveBeenCalledTimes(3);
    rerender(<Clock refresh={refresh} active={false} />);
    act(() => vi.advanceTimersByTime(90000));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(refresh).toHaveBeenCalledTimes(3);
    rerender(<Clock refresh={refresh} />);
    expect(refresh).toHaveBeenCalledTimes(4);
    unmount();
    act(() => vi.advanceTimersByTime(60000));
    expect(refresh).toHaveBeenCalledTimes(4);
    expect(vi.getTimerCount()).toBe(0);
  });
});
