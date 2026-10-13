// Read-only status and replay of persisted runs. Never claims an unfinished run succeeded.
export function swiftSyncRunResponse(run, now = Date.now()) {
  const ids = { run_id: run.id, correlation_id: run.correlation_id };
  const expired =
    !run.finished_at && (run.lease_expires_at ? Date.parse(run.lease_expires_at) : Date.parse(run.started_at) + 300000) <= now;
  if (expired || run.outcome === 'abandoned')
    return { status: 409, payload: { ...ids, code: 'sync_request_expired', error: 'sync_request_expired' } };
  if (!run.finished_at) return { status: 202, payload: { ...ids, pending: true, code: 'sync_request_in_progress' } };
  if (!['completed', 'partial'].includes(run.outcome))
    return { status: 500, payload: { ...ids, code: 'sync_internal_error', error: 'sync_run_failed' } };
  return {
    status: 200,
    payload: {
      ...ids,
      replayed: true,
      products_synced: run.products_synced || 0,
      products_updated: run.products_updated || 0,
      products_unchanged: run.products_unchanged || 0,
      products_failed: run.products_failed || 0,
      products_stale: run.products_stale || 0,
      duration_ms: run.duration_ms,
      failures: Array.isArray(run.error_summary) ? run.error_summary : run.error_summary?.failures || [],
      partial: run.products_failed > 0
    }
  };
}
