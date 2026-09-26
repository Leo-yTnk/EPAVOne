import { IconButton } from './IconButton.jsx';

export function Pagination({ page, pageCount, onChange, label='Paginação' }) {
  const safeCount=Math.max(1,pageCount);
  const safePage=Math.min(Math.max(1,page),safeCount);
  return <nav className="ds-pagination" aria-label={label}>
    <IconButton size="sm" label="Página anterior" disabled={safePage<=1} onClick={()=>onChange?.(safePage-1)}>←</IconButton>
    <span className="ds-pagination-status" aria-live="polite">Página {safePage} de {safeCount}</span>
    <IconButton size="sm" label="Próxima página" disabled={safePage>=safeCount} onClick={()=>onChange?.(safePage+1)}>→</IconButton>
  </nav>;
}
