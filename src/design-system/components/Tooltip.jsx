import { useId, useRef, useState } from 'preact/hooks';
import { useAnchoredLayer } from '../behaviors/useAnchoredLayer.js';
import { Portal } from './Portal.jsx';

export function Tooltip({ label, children }) {
  const id=useId();
  const triggerRef=useRef(null);
  const layerRef=useRef(null);
  const [open,setOpen]=useState(false);
  const position=useAnchoredLayer(triggerRef,layerRef,open,{offset:8,placement:'top'});

  return <span
    ref={triggerRef}
    className="ds-tooltip-host"
    aria-describedby={open?id:undefined}
    onMouseEnter={()=>setOpen(true)}
    onMouseLeave={()=>setOpen(false)}
    onFocusIn={()=>setOpen(true)}
    onFocusOut={()=>setOpen(false)}
  >
    {children}
    {open && <Portal><span
      ref={layerRef}
      id={id}
      role="tooltip"
      className="ds-layer-anchor"
      data-kind="tooltip"
      data-side={position?.side ?? 'top'}
      data-positioned={position?'true':'false'}
      style={position?.style}
    >{label}</span></Portal>}
  </span>;
}
