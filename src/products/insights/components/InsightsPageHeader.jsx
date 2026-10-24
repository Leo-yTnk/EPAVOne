import { AppLogo, Card } from '../../../design-system/components/index.js';

export function InsightsPageHeader({ title, description, children }) {
  return (
    <Card as="header" className="insights-page-context">
      <div className="insights-page-identity">
        <AppLogo product="insights" size="sm" />
        <span className="ds-overline">EPAVInsights</span>
      </div>
      <div className="insights-page-context-copy">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </Card>
  );
}
