import { useState } from 'preact/hooks';
import { Card } from '../../../design-system/components/index.js';
import { safeImage } from '../models/catalog.js';

export function CatalogImage({ url, name }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const source = safeImage(url);
  return (
    <Card as="div" className="insights-image">
      {source && failedUrl !== source ? (
        <img src={source} alt={name} loading="lazy" decoding="async" onError={() => setFailedUrl(source)} />
      ) : (
        <span className="insights-image-fallback">Imagem indisponível</span>
      )}
    </Card>
  );
}
