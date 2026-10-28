// Only explicitly opted-in anonymous resources may enter this short-lived cache.
// Personal recipes and account-dependent queries retain their abort-on-unmount flow.
const stores = new WeakMap();
let revision = 0;
export function invalidatePublicCatalog() {
  revision++;
}
const MAX_AGE = 60_000;
export function publicResource(loader, id) {
  if (!stores.has(loader)) stores.set(loader, new Map());
  const store = stores.get(loader);
  if (!store.has(id)) store.set(id, { state: { loading: true, data: null, error: null }, listeners: new Set(), updated: 0 });
  return store.get(id);
}
export function refreshPublicResource(entry, loader, id, force = false) {
  if (entry.pending || (!force && entry.revision === revision && entry.updated && Date.now() - entry.updated < MAX_AGE)) return;
  const startedRevision = revision;
  const publish = (state) => {
    entry.state = state;
    entry.listeners.forEach((listener) => listener(state));
  };
  publish({ ...entry.state, error: null, refreshError: null, loading: entry.state.data === null, refreshing: true });
  // The public transport already imposes a 15s timeout per request. Shared reads
  // outlive an individual subscriber so switching tabs cannot cancel another read.
  entry.pending = Promise.resolve()
    .then(() => loader(id, {}))
    .then(
      (data) => {
        entry.updated = Date.now();
        entry.revision = startedRevision;
        publish({ data, loading: false, refreshing: false, error: null });
      },
      (error) =>
        publish({
          ...entry.state,
          loading: false,
          refreshing: false,
          error: entry.state.data === null ? error.message : null,
          refreshError: entry.state.data === null ? null : error.message
        })
    )
    .finally(() => {
      entry.pending = null;
    });
}

export async function readSharedPublicResource(loader, id) {
  const entry = publicResource(loader, id);
  refreshPublicResource(entry, loader, id);
  await entry.pending;
  if (entry.state.error || entry.state.refreshError) throw new Error(entry.state.error || entry.state.refreshError);
  return entry.state.data;
}
