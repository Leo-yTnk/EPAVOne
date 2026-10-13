import { Icon } from '../../../../design-system/components/index.js';
import { CatalogImage } from '../../components/CatalogImage.jsx';
export function CreationThumbnail({ item, type = 'recipes' }) {
  return (
    <div className={`creation-thumbnail creation-thumbnail-${type}`}>
      {type === 'categories' ? (
        <Icon name="category" />
      ) : (
        <CatalogImage key={item.image_url} url={item.image_url} name={item.name} compactFallback />
      )}
    </div>
  );
}
