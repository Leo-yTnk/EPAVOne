import { CardStitch } from './CardStitch.jsx';
import { cx } from '../../shared/utils/cx.js';

export function Card({ as: Component = 'article', className = '', children, stitched = true, stitchContrast = false, padding, ...props }) {
  return (
    <Component className={cx('ds-card', stitched && 'ds-stitched-card', padding && `ds-card-padding-${padding}`, className)} {...props}>
      {children}
      {stitched && <CardStitch contrast={stitchContrast} />}
    </Component>
  );
}
