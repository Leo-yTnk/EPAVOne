import { Card, Icon, SectionHeader } from '../../design-system/components/index.js';

export function SettingsSection({ id, title, description, icon = 'settings', children }) {
  return (
    <Card as="section" id={id} tabIndex={-1} className="settings-section" aria-label={title}>
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
