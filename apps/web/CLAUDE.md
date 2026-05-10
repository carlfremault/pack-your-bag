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

## Accessibility

- All components should adhere strictly to a11y guidelines and patterns.

## Specialized Context & Patterns

When performing tasks related to the following areas, read the specified files first to ensure compliance with project standards:

- **Next.js App Router:** If modifying routes or server components, read `.skills/next-best-practices/SKILL.md`.
- **Performance Optimization:** If optimizing rendering or bundle size, read `.skills/vercel-react-best-practices/rules/_sections.md`.
- **Component Design:** When creating or refactoring components, read `.skills/vercel-composition-patterns/README.md`.
- **Accessibility/UI:** Before finalizing UI changes, refer to `.skills/web-design-guidelines/SKILL.md`.
