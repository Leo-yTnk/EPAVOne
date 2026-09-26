import { flushSync } from 'preact/compat';

export function withViewTransition(update) {
  const reduced=typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(typeof document!=='undefined' && document.startViewTransition && !reduced){
    return document.startViewTransition(()=>flushSync(update));
  }
  flushSync(update);
  return null;
}
