import { InsightsDetailDialog } from './InsightsDetailDialog.jsx';

export function ProductDetails({ product, onClose }) {
  return <InsightsDetailDialog initial={{ kind: 'product', item: product }} onClose={onClose} />;
}
