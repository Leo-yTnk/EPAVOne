import { Card, Icon, SectionHeader } from '../../design-system/components/index.js';

export function SettingsSection({ title, description, icon = 'settings', children }) {
  return (
    <Card as="section" className="settings-section" aria-label={title}>
      <div className="settings-section-copy">
        <span className="settings-section-icon">
          <Icon name={icon} />
        </span>
        <SectionHeader title={title} description={description} />
      </div>
      <div className="settings-controls">{children}</div>
    </Card>
  );
}
