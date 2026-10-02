import { useLayoutEffect } from 'preact/hooks';

let modalLockCount=0;

export function useModalLayer(ref, open, onClose) {
  useLayoutEffect(()=>{
    if(!open) return undefined;

    const previous=document.activeElement;
    modalLockCount+=1;
    document.body.classList.add('ds-layer-open');
    ref.current?.focus();

    function onKeyDown(event){
      if(event.key==='Escape'){
        event.preventDefault();
        onClose?.();
        return;
      }
      if(event.key!=='Tab'||!ref.current) return;

      const focusable=[...ref.current.querySelectorAll('button,input,textarea,a[href],[tabindex]:not([tabindex="-1"])')]
        .filter(node=>!node.disabled&&node.getAttribute('aria-hidden')!=='true');

      if(!focusable.length){
        event.preventDefault();
        ref.current.focus();
        return;
      }

      const first=focusable[0];
      const last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){
        event.preventDefault();
        last.focus();
      }else if(!event.shiftKey&&document.activeElement===last){
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown',onKeyDown);
    return ()=>{
      document.removeEventListener('keydown',onKeyDown);
      modalLockCount=Math.max(0,modalLockCount-1);
      if(modalLockCount===0) document.body.classList.remove('ds-layer-open');
      previous?.focus?.();
    };
  },[onClose,open,ref]);
}
