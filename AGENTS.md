# EPAVOne agent rules

## Architecture boundaries

- Put application shell/router/theme in `src/app`.
- Put reusable UI only in `src/design-system`.
- Put product-specific code only in `src/products/<product>`.
- Put cross-product utilities/services/errors in `src/shared`.
- Put development-only showcases in `src/dev`.
- Products must never import internals from another product.
- Product UI must never call Supabase directly. Use a product service/repository.

## Design system

- Reuse exported components from `src/design-system/components/index.js`.
- Never create a new button/input/card style inside a page.
- Every card surface must use `<Card>`. Card is stitched by default.
- Do not use the legacy `yc-*` prefix.
- Do not use `transition: all`.
- Do not use `!important`.
- Inline styles are permitted only for data-driven CSS custom properties such as `--bar-height`.

## Files and complexity

- Do not add new application files at repository root.
- Prefer one public component per file.
- Keep page components focused on composition; move business logic to services/models/hooks.
- A feature that is useful to multiple products moves to `shared`; it must not be imported from another product.

## Quality gate

Before merging run:

```
npm run verify
```

New behavior requires tests. Architectural exceptions must be documented explicitly instead of bypassing the checker.
