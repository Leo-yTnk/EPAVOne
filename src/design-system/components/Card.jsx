import { CardStitch } from './CardStitch.jsx';
import { cx } from '../../shared/utils/cx.js';

export function Card({ as: Component = 'article', className = '', children, stitchContrast = false, ...props }) {
  return (
    <Component className={cx('ds-card', 'ds-stitched-card', className)} {...props}>
      {children}
      <CardStitch contrast={stitchContrast} />
    </Component>
  );
}
