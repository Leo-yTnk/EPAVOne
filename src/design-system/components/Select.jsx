import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { useAnchoredLayer } from '../behaviors/useAnchoredLayer.js';
import { Option } from './Option.jsx';
import { Portal } from './Portal.jsx';

export function Select({ label, options, value, onChange, disabled=false, helper }) {
  const autoId=useId();
  const labelId=autoId+'-label';
  const valueId=autoId+'-value';
  const menuId=autoId+'-menu';
  const triggerRef=useRef(null);
  const menuRef=useRef(null);
  const [open,setOpen]=useState(false);
  const [highlighted,setHighlighted]=useState(0);
  const selectedIndex=Math.max(0,options.findIndex(option=>option.value===value));
  const selected=options[selectedIndex] || options[0];
  const position=useAnchoredLayer(triggerRef,menuRef,open,{offset:7,minWidth:180,matchWidth:true});

  const enabledIndexes=options.map((option,index)=>option.disabled?null:index).filter(index=>index!==null);

  useEffect(()=>{
    if(!open) return undefined;
    setHighlighted(options[selectedIndex]?.disabled ? (enabledIndexes[0] ?? 0) : selectedIndex);

    function closeOnPointer(event){
      if(triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('pointerdown',closeOnPointer);
    return ()=>document.removeEventListener('pointerdown',closeOnPointer);
  },[open,selectedIndex]);

  function choose(index){
    const option=options[index];
    if(!option || option.disabled) return;
    onChange?.(option.value);
    setOpen(false);
    requestAnimationFrame(()=>triggerRef.current?.focus());
  }

  function moveHighlight(direction){
    const current=Math.max(0,enabledIndexes.indexOf(highlighted));
    const next=enabledIndexes[(current+direction+enabledIndexes.length)%enabledIndexes.length];
    if(next!==undefined) setHighlighted(next);
  }

  function onKeyDown(event){
    if(!open){
      if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){
        event.preventDefault();
        setOpen(true);
        if(event.key==='ArrowUp') setHighlighted(enabledIndexes.at(-1) ?? selectedIndex);
      }
      return;
    }

    if(event.key==='ArrowDown'){event.preventDefault();moveHighlight(1);}
    else if(event.key==='ArrowUp'){event.preventDefault();moveHighlight(-1);}
    else if(event.key==='Home'){event.preventDefault();setHighlighted(enabledIndexes[0] ?? 0);}
    else if(event.key==='End'){event.preventDefault();setHighlighted(enabledIndexes.at(-1) ?? 0);}
    else if(event.key==='Enter' || event.key===' '){event.preventDefault();choose(highlighted);}
    else if(event.key==='Escape'){event.preventDefault();setOpen(false);triggerRef.current?.focus();}
    else if(event.key==='Tab'){setOpen(false);}
  }

  return <div className="ds-field ds-selectbox">
    <span className="ds-input-label" id={labelId}>{label}</span>
    <button
      ref={triggerRef}
      className="ds-select-trigger"
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open?menuId:undefined}
      aria-activedescendant={open?autoId+'-option-'+highlighted:undefined}
      aria-labelledby={labelId+' '+valueId}
      disabled={disabled}
      onClick={()=>setOpen(current=>!current)}
      onKeyDown={onKeyDown}
    >
      <span id={valueId}>{selected?.label}</span>
      <span className="ds-select-trigger-icon" aria-hidden="true">⌄</span>
    </button>
    {helper && <span className="ds-input-helper">{helper}</span>}
    {open && <Portal>
      <div
        ref={menuRef}
        id={menuId}
        className="ds-layer-anchor ds-select-menu"
        data-kind="select"
        data-side={position?.side ?? 'bottom'}
        data-positioned={position?'true':'false'}
        style={position?.style}
        role="listbox"
        aria-labelledby={labelId}
      >
        <div className="ds-layer-scroll">
          {options.map((option,index)=><Option
            key={option.value}
            id={autoId+'-option-'+index}
            selected={option.value===value}
            highlighted={index===highlighted}
            disabled={option.disabled}
            onPointerMove={()=>!option.disabled&&setHighlighted(index)}
            onClick={()=>choose(index)}
          >{option.label}</Option>)}
        </div>
      </div>
    </Portal>}
  </div>;
}
