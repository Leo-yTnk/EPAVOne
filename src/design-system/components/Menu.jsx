import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { useAnchoredLayer } from '../behaviors/useAnchoredLayer.js';
import { Button } from './Button.jsx';
import { Portal } from './Portal.jsx';

export function Menu({ label, items, variant='ghost', size='sm' }) {
  const id=useId();
  const triggerRef=useRef(null);
  const layerRef=useRef(null);
  const itemRefs=useRef([]);
  const [open,setOpen]=useState(false);
  const [highlighted,setHighlighted]=useState(0);
  const position=useAnchoredLayer(triggerRef,layerRef,open,{offset:7,minWidth:180});
  const enabledIndexes=items.map((item,index)=>item.disabled?null:index).filter(index=>index!==null);

  useLayoutEffect(()=>{
    if(!open) return;
    const first=enabledIndexes[0] ?? 0;
    setHighlighted(first);
    itemRefs.current[first]?.focus();
  },[open]);

  useEffect(()=>{
    if(!open) return undefined;

    function closeOnPointer(event){
      if(triggerRef.current?.contains(event.target) || layerRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown',closeOnPointer);
    return ()=>document.removeEventListener('pointerdown',closeOnPointer);
  },[open]);

  function close({focusTrigger=true}={}){
    setOpen(false);
    if(focusTrigger) requestAnimationFrame(()=>triggerRef.current?.focus());
  }

  function move(direction){
    const currentIndex=enabledIndexes.indexOf(highlighted);
    const next=enabledIndexes[(Math.max(0,currentIndex)+direction+enabledIndexes.length)%enabledIndexes.length];
    if(next===undefined) return;
    setHighlighted(next);
    itemRefs.current[next]?.focus();
  }

  function onMenuKeyDown(event){
    if(event.key==='ArrowDown'){event.preventDefault();move(1);}
    else if(event.key==='ArrowUp'){event.preventDefault();move(-1);}
    else if(event.key==='Home'){event.preventDefault();const next=enabledIndexes[0];setHighlighted(next);itemRefs.current[next]?.focus();}
    else if(event.key==='End'){event.preventDefault();const next=enabledIndexes.at(-1);setHighlighted(next);itemRefs.current[next]?.focus();}
    else if(event.key==='Escape'){event.preventDefault();close();}
    else if(event.key==='Tab'){close();}
  }

  return <>
    <Button ref={triggerRef} variant={variant} size={size} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setOpen(current=>!current)}>{label}</Button>
    {open && <Portal><div
      ref={layerRef}
      id={id}
      className="ds-layer-anchor ds-menu-layer"
      data-kind="menu"
      data-side={position?.side ?? 'bottom'}
      data-positioned={position?'true':'false'}
      style={position?.style}
      role="menu"
      onKeyDown={onMenuKeyDown}
    ><div className="ds-layer-scroll">{items.map((item,index)=>{
      const common={
        ref:node=>{itemRefs.current[index]=node;},
        className:'ds-menu-item'+(index===highlighted?' is-highlighted':''),
        role:'menuitem',
        tabIndex:index===highlighted?0:-1,
        'aria-disabled':item.disabled||undefined,
        onFocus:()=>setHighlighted(index),
        onPointerMove:()=>!item.disabled&&setHighlighted(index),
        onClick:()=>{if(item.disabled)return;item.onSelect?.();close({focusTrigger:false});}
      };
      return item.href
        ? <a key={item.label} {...common} href={item.disabled?undefined:item.href}>{item.label}</a>
        : <button key={item.label} {...common} type="button" disabled={item.disabled}>{item.label}</button>;
    })}</div></div></Portal>}
  </>;
}
