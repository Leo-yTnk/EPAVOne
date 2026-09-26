import { flushSync } from 'preact/compat';

let activeTransition=null;

export function withViewTransition(update) {
  const reduced=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if(typeof document==='undefined'||!document.startViewTransition||reduced){
    flushSync(update);
    return null;
  }

  try{
    activeTransition?.skipTransition?.();
    const transition=document.startViewTransition(()=>flushSync(update));
    activeTransition=transition;
    transition.finished.finally(()=>{if(activeTransition===transition) activeTransition=null;});
    return transition;
  }catch{
    flushSync(update);
    activeTransition=null;
    return null;
  }
}
