import { useState } from 'preact/hooks';
import { Card, Icon } from '../../../design-system/components/index.js';
import { safeImage } from '../models/catalog.js';

export function CatalogImage({ url, name, stitched = true, compactFallback = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const source = safeImage(url);
  return (
    <Card as="div" className={`insights-image${compactFallback ? ' is-thumbnail' : ''}`} stitched={stitched} stitchContrast>
      {source && failedUrl !== source ? (
        <img src={source} alt={name} loading="lazy" decoding="async" onError={() => setFailedUrl(source)} />
      ) : compactFallback ? (
        <>
          <Icon name="product" />
          <span className="sr-only">Imagem indisponível</span>
        </>
      ) : (
        <span className="insights-image-fallback">Imagem indisponível</span>
      )}
    </Card>
  );
}
