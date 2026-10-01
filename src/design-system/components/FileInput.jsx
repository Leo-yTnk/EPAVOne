import { useId, useRef } from 'preact/hooks';
import { Button } from './Button.jsx';

export function FileInput({ label, helper, filename, accept, disabled = false, loading = false, onFile }) {
  const id = useId();
  const input = useRef(null);
  return (
    <div className="ds-field ds-file-field">
      <span id={id + '-label'} className="ds-input-label">
        {label}
      </span>
      <div className="ds-file-control">
        <input
          ref={input}
          type="file"
          className="ds-file-native"
          tabIndex={-1}
          accept={accept}
          disabled={disabled || loading}
          aria-labelledby={id + '-label'}
          aria-describedby={helper ? id + '-helper' : undefined}
          onInput={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) onFile?.(file);
          }}
        />
        <Button type="button" variant="secondary" loading={loading} disabled={disabled} onClick={() => input.current?.click()}>
          {filename ? 'Trocar arquivo' : 'Escolher arquivo Excel'}
        </Button>
        <span className="ds-file-name" title={filename || undefined} role="status">
          {loading ? 'Verificando arquivo…' : filename || 'Nenhum arquivo carregado'}
        </span>
      </div>
      {helper && (
        <span id={id + '-helper'} className="ds-input-helper">
          {helper}
        </span>
      )}
    </div>
  );
}
