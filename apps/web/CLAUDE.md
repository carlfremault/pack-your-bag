# CLAUDE.md — apps/web

## Architecture and Boundaries

- Prefer Server Components by default; use `'use client'` only when interactivity or browser-only APIs are required.
- UI primitives come from `packages/react-common`. Domain-logic components live in `src/components`; feature-specific logic in `src/features/<feature>`.
- Keep business logic out of presentational components — move data shaping and side effects into feature-level actions/queries/hooks.

## Data and State

- Use server-side data fetching for initial page data when practical.
- Keep client state minimal and local; avoid global state unless multiple distant parts of the UI truly share it.
- Keep async flows explicit with typed return values and clear error-handling paths.

## Component APIs

- Small, composable props over boolean-prop proliferation.
- Prefer composition patterns (slots/children/compound) over large monolithic components.

## UX and Styling

- Semantic HTML, keyboard support, and meaningful labels for interactive controls.
- Consistent loading, empty, and error states for async UI.
- Follow the established styling system — avoid one-off patterns.

## Reference Skills (read only when the task clearly matches)

- **Next.js App Router patterns** (RSC boundaries, route handlers, async APIs, metadata, file conventions, hydration errors):
  Read `.cursor/skills/next-best-practices/SKILL.md` then follow the links to the relevant sub-files.

- **React/Next.js performance** (rendering, bundle size, data loading, interaction latency):
  Read `.cursor/skills/vercel-react-best-practices/rules/_sections.md` to identify the relevant rules, then read those rule files.

- **Component API design** (refactoring props, reducing boolean props, compound components):
  Read `.cursor/skills/vercel-composition-patterns/README.md` then the relevant rule files under `rules/`.

- **UI/UX/accessibility audit**:
  Read `.cursor/skills/web-design-guidelines/SKILL.md` and follow the instructions there (fetches live guidelines).
