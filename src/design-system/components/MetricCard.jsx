import { Card } from './Card.jsx';
import { cx } from '../../shared/utils/cx.js';
export function MetricCard({ label, value, trend, tone='neutral' }) { return <Card className="ds-metric-card"><span className="ds-metric-label">{label}</span><strong className="ds-metric-value">{value}</strong><span className={cx('ds-metric-trend','is-'+tone)}>{trend}</span></Card>; }
