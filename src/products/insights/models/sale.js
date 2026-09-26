export function normalizeSale(raw) {
  return {
    id:String(raw.id),
    date:raw.date,
    customerId:raw.customerId ?? null,
    sellerId:raw.sellerId ?? null,
    total:Number(raw.total ?? 0),
    items:Array.isArray(raw.items) ? raw.items : []
  };
}
