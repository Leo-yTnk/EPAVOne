const names = { one: 'One', insights: 'Insights', planner: 'Planner', writer: 'Writer' };

export function AppLogo({ product = 'one', wordmark = false, size = 'md', className = '' }) {
  const app = Object.hasOwn(names, product) ? product : 'one';
  return (
    <span className={`ds-app-logo ds-app-logo-${size} ${className}`} data-product={app}>
      <img src={`${import.meta.env.BASE_URL}brand/epav-${app}.svg`} width="64" height="64" alt={wordmark ? '' : `EPAV${names[app]}`} draggable="false" />
      {wordmark && <span className="ds-app-wordmark">EPAV<span>{names[app]}</span></span>}
    </span>
  );
}
