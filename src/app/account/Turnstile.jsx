import { useEffect, useRef, useState } from 'preact/hooks';
import { Alert } from '../../design-system/components/index.js';

let loading;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading)
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      const timer = setTimeout(() => fail(), 15000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        loading = null;
        reject(new Error('Verificação indisponível. Feche e abra a janela para tentar novamente.'));
      }
      script.onload = () => {
        clearTimeout(timer);
        window.turnstile ? resolve(window.turnstile) : fail();
      };
      script.onerror = fail;
      document.head.append(script);
    });
  return loading;
}

export function Turnstile({ attempt, onToken }) {
  const container = useRef(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let widget;
    let api;
    callback.current('');
    setError('');
    loadTurnstile()
      .then((value) => {
        if (cancelled) return;
        api = value;
        widget = api.render(container.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAED4OOkYJr1mKBgo',
          size: 'flexible',
          callback: (token) => {
            if (!cancelled) {
              setError('');
              callback.current(token);
            }
          },
          'expired-callback': () => {
            if (!cancelled) callback.current('');
          },
          'error-callback': () => {
            if (!cancelled) {
              callback.current('');
              setError('Não foi possível validar a verificação de segurança.');
            }
          }
        });
      })
      .catch((reason) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
      if (widget !== undefined) api.remove(widget);
    };
  }, [attempt]);
  return (
    <>
      <div ref={container} aria-label="Verificação de segurança" />
      {error && (
        <Alert tone="danger" title="Verificação indisponível">
          {error}
        </Alert>
      )}
    </>
  );
}
