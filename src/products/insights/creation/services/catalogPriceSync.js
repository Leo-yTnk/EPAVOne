// One product per request keeps catalog size out of the Edge Function runtime.
// The queue belongs to the session, so changing creation pages does not lose it.
export function createCatalogPriceSync({ loadProducts, refresh, delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  let state = { phase: 'idle', total: 0, processed: 0, updated: 0, unchanged: 0, failed: 0, failures: [] };
  let products = null;
  let running = null;
  const listeners = new Set();
  const publish = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };
  async function execute() {
    publish({ phase: 'running', error: '' });
    try {
      if (!products) {
        products = (await loadProducts()).filter((item) => item.active);
        publish({ total: products.length });
      }
      while (state.processed < products.length) {
        const product = products[state.processed];
        publish({ currentName: product.name });
        let response;
        if (!product.swift_product_url) {
          response = {
            error: { metrics: { products_failed: 1 }, failures: [{ product_name: product.name, code: 'Página Swift não cadastrada' }] }
          };
        } else {
          const deadline = Date.now() + 300000;
          for (;;) {
            response = await refresh(product.id);
            if (response.data?.pending || response.error?.code === 'network_error') {
              if (Date.now() >= deadline) throw new Error('A consulta continua sem resultado. Retome para verificar este mesmo produto.');
              publish({ runId: response.data?.run_id || response.error?.runId, waiting: true });
              await delay(2500);
              continue;
            }
            if (response.error?.code === 'sync_other_run_completed') {
              if (Date.now() >= deadline) throw new Error('Outra atualização está ocupando o serviço. Retome quando ela terminar.');
              await delay(2500);
              continue;
            }
            break;
          }
        }
        const metrics = response.data || response.error?.metrics;
        if (response.error && !Number.isFinite(metrics?.products_failed)) throw new Error(response.error.message);
        if (!Number.isFinite(metrics?.products_failed)) throw new Error('O serviço não confirmou o resultado deste produto.');
        publish({
          processed: state.processed + 1,
          updated: state.updated + (metrics.products_updated || 0),
          unchanged: state.unchanged + (metrics.products_unchanged || 0),
          failed: state.failed + (metrics.products_failed || 0),
          failures: [...state.failures, ...(response.data?.failures || response.error?.failures || [])],
          waiting: false
        });
      }
      publish({ phase: 'completed', currentName: '', waiting: false });
    } catch (error) {
      publish({ phase: 'paused', error: error.message, waiting: false });
    }
    return state;
  }
  return {
    snapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      if (running) return running;
      if (state.phase === 'completed') {
        products = null;
        state = { phase: 'idle', total: 0, processed: 0, updated: 0, unchanged: 0, failed: 0, failures: [] };
      }
      running = execute().finally(() => {
        running = null;
      });
      return running;
    }
  };
}
