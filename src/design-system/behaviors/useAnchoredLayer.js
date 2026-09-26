import { useLayoutEffect, useState } from 'preact/hooks';

const VIEWPORT_GAP = 12;

export function useAnchoredLayer(triggerRef, layerRef, open, { offset=8, minWidth=0, matchWidth=false, placement='auto' }={}) {
  const [position,setPosition]=useState(null);

  useLayoutEffect(()=>{
    if(!open){
      setPosition(null);
      return undefined;
    }

    function update(){
      const trigger=triggerRef.current;
      const layer=layerRef.current;
      if(!trigger || !layer) return;

      const rect=trigger.getBoundingClientRect();
      const measuredWidth=matchWidth ? rect.width : layer.offsetWidth;
      const width=Math.min(Math.max(measuredWidth,minWidth),window.innerWidth-(VIEWPORT_GAP*2));
      const below=window.innerHeight-rect.bottom-offset-VIEWPORT_GAP;
      const above=rect.top-offset-VIEWPORT_GAP;
      const side=placement==='top' ? 'top' : placement==='bottom' ? 'bottom' : (below>=Math.min(180,layer.scrollHeight) || below>=above ? 'bottom' : 'top');
      const available=Math.max(96,side==='bottom' ? below : above);
      const triggerCenter=rect.left+(rect.width/2);
      const left=Math.min(Math.max(VIEWPORT_GAP,triggerCenter-(width/2)),window.innerWidth-VIEWPORT_GAP-width);
      const originX=Math.min(Math.max(12,triggerCenter-left),Math.max(12,width-12));

      setPosition({
        side,
        style:{
          '--layer-left':left+'px',
          '--layer-width':width+'px',
          '--layer-origin-x':originX+'px',
          '--layer-max-height':Math.min(288,available)+'px',
          ...(side==='bottom'
            ? {'--layer-top':rect.bottom+offset+'px'}
            : {'--layer-bottom':window.innerHeight-rect.top+offset+'px'})
        }
      });
    }

    update();
    window.addEventListener('resize',update);
    window.addEventListener('scroll',update,true);
    return ()=>{
      window.removeEventListener('resize',update);
      window.removeEventListener('scroll',update,true);
    };
  },[layerRef,matchWidth,minWidth,offset,open,placement,triggerRef]);

  return position;
}
