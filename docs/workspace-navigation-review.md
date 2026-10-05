# Compact navigation and creation workspace

- One compact row groups brand, app tabs, settings and account. Horizontal navigation is the default; the Insights sections use the second row only while Insights is active.
- Settings now have appearance, card density, navigation orientation, reduced motion and account sections. Preferences are validated and stored locally; resetting them does not delete account content or Writer orders.
- Vertical navigation uses a desktop sidebar and Up/Down keys. Below 64rem it becomes the compact horizontal bar and restores the sidebar when the viewport grows. The creation navigation becomes horizontal within the sidebar layout to avoid two adjacent sidebars.
- Creation has one library navigation, a framed list workspace, item counts and grouped editor fields. Existing permissions, save/discard safeguards and service boundaries are retained.
- Image cards remain flush, with no padding; copy/actions share column geometry, and mobile catalog items pair a thumbnail with their content.
- Component Lab is preserved in `src/dev/component-lab/ComponentLab.jsx`, without a route, app navigation entry or production import. Documentation reflects this change.

## Validation

`npm run verify`: lint, architecture, 136 tests, production build.

Local Chromium inspection: horizontal and vertical navigation, settings in light/dark themes, authenticated creation library and recipe editor using mocked services (no database writes). Settings checked at 320, 390 and 768 px with document width equal to viewport width. Catalog layout checked on desktop and at 390 px with fixture products. Account icon remains available on narrow screens; tabs scroll inside their own container.

Browser fixtures exercise layout and interactions; they do not verify live authentication or database contents. Screenshots used the environment's fallback fonts when remote webfonts were unavailable.
