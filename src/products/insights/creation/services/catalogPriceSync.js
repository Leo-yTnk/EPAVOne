// Bounded batches use server concurrency while keeping catalog size out of one request.
// The queue belongs to the session, so changing creation pages does not lose it.
export function createCatalogPriceSync({
  loadProducts,
  refresh,
  refreshBatch,
  now = Date.now,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  let state = { phase: 'idle', total: 0, processed: 0, updated: 0, unchanged: 0, failed: 0, failures: [], remainingMs: null };
  let products = null;
  let msPerProduct = null;
  let running = null;
  const listeners = new Set();
  const publish = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };
  async function execute() {
    publish({ phase: 'running', error: '', remainingMs: null });
    try {
      if (!products) {
        products = (await loadProducts()).filter((item) => item.active);
        publish({ total: products.length });
      }
      while (state.processed < products.length) {
        const product = products[state.processed];
        // Six products per lease, up to three simultaneous provider requests by default.
        // Stop before missing URLs so these are counted locally, without skewing ETA.
        const batch = [product];
        if (refreshBatch && product.swift_product_url) {
          for (const next of products.slice(state.processed + 1, state.processed + 6)) {
            if (!next.swift_product_url) break;
            batch.push(next);
          }
        }
        const batchStarted = now();
        publish({ currentName: batch.map((item) => item.name).join(', '), waiting: false });
        let response;
        if (!product.swift_product_url) {
          response = {
            error: { metrics: { products_failed: 1 }, failures: [{ product_name: product.name, code: 'Página Swift não cadastrada' }] }
          };
        } else {
          const deadline = now() + 300000;
          for (;;) {
            response = await (refreshBatch ? refreshBatch(batch.map((item) => item.id)) : refresh(product.id));
            if (response.data?.pending || response.error?.code === 'network_error') {
              if (now() >= deadline) throw new Error('A consulta continua sem resultado. Retome para verificar este mesmo produto.');
              publish({ runId: response.data?.run_id || response.error?.runId, waiting: true, remainingMs: null });
              await delay(2500);
              continue;
            }
            if (response.error?.code === 'sync_other_run_completed') {
              publish({ waiting: true, remainingMs: null });
              if (now() >= deadline) throw new Error('Outra atualização está ocupando o serviço. Retome quando ela terminar.');
              await delay(2500);
              continue;
            }
            break;
          }
        }
        const metrics = response.data || response.error?.metrics;
        if (response.error && !Number.isFinite(metrics?.products_failed)) throw new Error(response.error.message);
        if (!Number.isFinite(metrics?.products_failed)) throw new Error('O serviço não confirmou o resultado deste produto.');
        if (refreshBatch && product.swift_product_url) {
          const confirmed = (metrics.products_updated || 0) + (metrics.products_unchanged || 0) + metrics.products_failed;
          if (confirmed !== batch.length)
            throw new Error('O serviço não confirmou todos os produtos do lote. Publique a versão atual da função Swift antes de retomar.');
        }
        if (product.swift_product_url) {
          const sample = Math.max(1, now() - batchStarted) / batch.length;
          msPerProduct = msPerProduct === null ? sample : msPerProduct * 0.5 + sample * 0.5;
        }
        const processed = state.processed + batch.length;
        const remaining = products.slice(processed).filter((item) => item.swift_product_url).length;
        publish({
          processed,
          remainingMs: msPerProduct === null ? null : Math.ceil(msPerProduct * remaining),
          updated: state.updated + (metrics.products_updated || 0),
          unchanged: state.unchanged + (metrics.products_unchanged || 0),
          failed: state.failed + (metrics.products_failed || 0),
          failures: [...state.failures, ...(response.data?.failures || response.error?.failures || [])],
          waiting: false
        });
      }
      publish({ phase: 'completed', currentName: '', waiting: false, remainingMs: 0 });
    } catch (error) {
      publish({ phase: 'paused', error: error.message, waiting: false, remainingMs: null });
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
        msPerProduct = null;
        state = { phase: 'idle', total: 0, processed: 0, updated: 0, unchanged: 0, failed: 0, failures: [], remainingMs: null };
      }
      running = execute().finally(() => {
        running = null;
      });
      return running;
    }
  };
}
