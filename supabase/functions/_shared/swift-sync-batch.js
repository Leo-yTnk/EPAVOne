export const SWIFT_SYNC_BATCH_SIZE = 6;

// Validate before acquiring a lease. Legacy single-product and cron calls remain valid.
export function validSwiftSyncSelection(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (body.productIds === undefined) return true;
  return (
    (!body.productId || body.productId === body.productIds?.[0]) &&
    Array.isArray(body.productIds) &&
    body.productIds.length > 0 &&
    body.productIds.length <= SWIFT_SYNC_BATCH_SIZE &&
    new Set(body.productIds).size === body.productIds.length &&
    body.productIds.every((id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
  );
}
