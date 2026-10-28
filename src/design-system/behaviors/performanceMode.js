import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

export const PerformanceModeContext = createContext('balanced');
export const usePerformanceMode = () => useContext(PerformanceModeContext);
export function fullMotion() {
  return document.documentElement.dataset.performanceMode === 'fabulous';
}
