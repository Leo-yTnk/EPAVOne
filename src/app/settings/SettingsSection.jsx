import { Card, Heading, Icon, Text } from '../../design-system/components/index.js';

export function SettingsSection({ title, description, icon = 'settings', children }) {
  return (
    <Card as="section" className="settings-section" aria-label={title}>
      <header className="settings-section-copy">
        <span className="settings-section-icon">
          <Icon name={icon} />
        </span>
        <div>
          <Heading as="h2" level={4}>
            {title}
          </Heading>
          <Text size="sm">{description}</Text>
        </div>
      </header>
      <div className="settings-controls">{children}</div>
    </Card>
  );
}
