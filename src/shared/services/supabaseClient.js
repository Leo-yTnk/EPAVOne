import { supabaseConfig } from '../config/supabase.js';
import { AppError } from '../errors/AppError.js';

export class SupabaseError extends AppError {
  constructor(message, { code, status, cause } = {}) {
    super(message, { code, cause });
    this.name = 'SupabaseError';
    this.status = status;
  }
}

// Shared PostgREST transport. Auth and writes are added in later migration PRs.
export function createSupabaseClient(config = supabaseConfig) {
  return {
    async readRows(table, params = {}, { signal } = {}) {
      if (!/^[a-z][a-z0-9_]*$/.test(table)) {
        throw new SupabaseError('Recurso inválido.', { code: 'INVALID_RESOURCE' });
      }
      signal?.throwIfAborted();
      const controller = new AbortController();
      const abort = () => controller.abort(signal.reason);
      signal?.addEventListener('abort', abort, { once: true });
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 15000);
      try {
        const response = await fetch(`${config.url}/rest/v1/${table}?${new URLSearchParams(params)}`, {
          headers: { apikey: config.key, Prefer: 'count=exact' },
          signal: controller.signal
        });
        if (!response.ok) {
          throw new SupabaseError('Não foi possível consultar o catálogo. Tente novamente.', {
            code: 'SUPABASE_HTTP_ERROR',
            status: response.status
          });
        }
        const rows = await response.json();
        if (!Array.isArray(rows)) {
          throw new SupabaseError('O catálogo retornou uma resposta inválida.', { code: 'INVALID_RESPONSE' });
        }
        const totalText = response.headers.get('content-range')?.split('/')[1];
        const total = totalText && /^\d+$/.test(totalText) ? Number(totalText) : null;
        return { rows, total: Number.isSafeInteger(total) ? total : null };
      } catch (error) {
        if (signal?.aborted) throw signal.reason;
        if (timedOut) {
          throw new SupabaseError('A consulta demorou mais que o esperado. Tente novamente.', {
            code: 'SUPABASE_TIMEOUT',
            cause: error
          });
        }
        if (error instanceof SupabaseError) throw error;
        throw new SupabaseError('Não foi possível consultar o catálogo. Tente novamente.', {
          code: 'SUPABASE_REQUEST_FAILED',
          cause: error
        });
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
      }
    }
  };
}

export const supabaseClient = createSupabaseClient();
