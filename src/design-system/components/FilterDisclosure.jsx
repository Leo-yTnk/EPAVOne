import { useId, useState } from 'preact/hooks';
import { Button } from './Button.jsx';
import { Icon } from './Icon.jsx';
export function FilterDisclosure({ count = 0, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="ds-filter-disclosure" data-open={open}>
      <Button
        className="ds-filter-toggle"
        variant="secondary"
        size="sm"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <Icon name="filter" /> Filtros{count ? ` (${count})` : ''}
      </Button>
      <div id={id} className="ds-filter-fields">
        {children}
      </div>
    </div>
  );
}
