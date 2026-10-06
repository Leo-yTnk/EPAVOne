import { CardStitch } from './CardStitch.jsx';
import { cx } from '../../shared/utils/cx.js';

export function Card({ as: Component = 'article', className = '', children, stitched = true, stitchContrast = false, ...props }) {
  return (
    <Component className={cx('ds-card', stitched && 'ds-stitched-card', className)} {...props}>
      {children}
      {stitched && <CardStitch contrast={stitchContrast} />}
    </Component>
  );
}
