import { ProductCatalog } from './ProductCatalog.jsx';
import { OrderDetails } from './OrderDetails.jsx';
import { DeliveryDetails } from './DeliveryDetails.jsx';
import { OrderCart } from './OrderCart.jsx';
import { OrderReview } from './OrderReview.jsx';
export function CheckoutContent({ step, template, order, today, change, add, updateLine, errors, busy, download, success, navigate }) {
  if (step === 0) return <OrderDetails template={template} order={order} onChange={change} />;
  if (step === 2) return <DeliveryDetails template={template} order={order} today={today} onChange={change} />;
  const cart = (
    <OrderCart
      template={template}
      lines={order.lines}
      onChange={updateLine}
      onRemove={(name) => change({ lines: order.lines.filter((line) => line.name !== name) })}
      errors={step === 3 ? errors : []}
      busy={busy}
      onExport={step === 3 ? download : undefined}
      success={success}
      readOnly={step === 3}
    />
  );
  if (step === 1)
    return (
      <div className="writer-products-stage">
        <ProductCatalog products={template.products} lines={order.lines} onAdd={add} />
        {cart}
      </div>
    );
  return (
    <div className="writer-workspace">
      <div className="writer-main">
        <OrderReview template={template} order={order} onNavigate={navigate} busy={busy} />
      </div>
      <aside>{cart}</aside>
    </div>
  );
}
