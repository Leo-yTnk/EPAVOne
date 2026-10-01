import { useEffect, useRef, useState } from 'preact/hooks';
import { findSwiftImage } from '../services/swiftImagesService.js';
export function ProductImage({ product }) {
  const ref = useRef(null);
  const [image, setImage] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    let started = false;
    const load = async () => {
      if (started) return;
      started = true;
      const found = await findSwiftImage(product, controller.signal);
      if (!controller.signal.aborted) setImage(found);
    };
    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                load();
                observer.disconnect();
              }
            },
            { rootMargin: '100px' }
          )
        : null;
    if (observer && ref.current) observer.observe(ref.current);
    else load();
    return () => {
      controller.abort();
      observer?.disconnect();
    };
  }, [product]);
  return (
    <div ref={ref} className="writer-product-media">
      {image && <img className="writer-product-image" src={image} alt={product.name} loading="lazy" onError={() => setImage(null)} />}
    </div>
  );
}
