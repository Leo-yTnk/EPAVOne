# EPAVOne agent rules

## Architecture boundaries

- Put application shell/router/theme/navigation motion in `src/app`.
- Put reusable UI and UI behaviors only in `src/design-system`.
- Put product-specific code only in `src/products/<product>`.
- Put cross-product utilities/services/errors in `src/shared`.
- Put development-only showcases in `src/dev`.
- Products must never import internals from another product.
- Product UI must never call Supabase or fetch directly.

## Component rules

- Reuse exports from `src/design-system/components/index.js`.
- Never recreate Button, Input, Select, Card, Alert, Tabs, Dialog, Drawer, Toast or other DS components with classes inside a page.
- Never use a native `<select>`; use `Select`.
- Every card surface must use `<Card>`; Card is stitched by default.
- Explicit product exception: Insights detail dialogs and individual product Cards retain stitching. Internal recipe fact/section Cards and detail images use `stitched={false}` with quiet, slightly darker surfaces. Catalog cards retain the default treatment.
- A visually enabled action must have behavior or feedback.
- Do not render a removable/retry/create action without its callback.

## Floating UI

- Select, Menu, Tooltip, Dialog, Drawer and Toast must use Portal.
- Anchored layers use `useAnchoredLayer`.
- Modal layers use `useModalLayer`.
- Do not position a dropdown inside a local overflow container.

## Motion

- Motion is functional and uses opacity, small translations and subtle scale. Do not use blur filters or backdrop filters.
- Do not use `transition: all`.
- Keep durations short and use design-system tokens.
- Anchored layers must transform from the trigger origin.
- Navigation must preserve reduced-motion support.
- Never add motion that delays the action itself.

## Geometry

- Use semantic radius tokens.
- For nested surfaces near container edges, derive inner radius from outer radius minus padding.
- Do not hardcode a visually unrelated child radius inside a rounded container.

## Typography

- Use compact line-height tokens.
- Do not introduce body line-height >= 1.5 without an explicit architecture decision.

## CSS

- Do not use `!important`.
- Do not use legacy `yc-*`.
- Inline styles are allowed only for data-driven CSS custom properties.

## Files and complexity

- Do not add application source at repository root.
- Prefer one public component per file.
- Keep page components focused on composition.
- Shared behavior goes to design-system behaviors or shared, not copied between products.

## Quality gate

Before merging:

```
npm run verify
```

New interaction behavior requires tests.
