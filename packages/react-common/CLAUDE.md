# CLAUDE.md — packages/react-common

## Component Rules

- Every component must have a colocated `.stories.tsx` file — stories are the source of truth for valid states.
- Components are purely presentational: no data fetching, no API calls. All data enters via props.
- Define the prop interface in the same file as the component (or a colocated `.types.ts`). No `any`.
- Optional props must have sensible defaults via default parameters.

## Story Structure (CSF3)

- Use object syntax, not function syntax.
- Define `args` at the story level, not inline in a render function.
- Required stories per component: `Default` (happy path) + one per meaningful visual variant + one per prop combination likely to break layout (e.g. very long text).
- No mocked API calls, MSW handlers, or store providers in stories — if a component needs these, it is not presentational and should be refactored.

## Styling

- Tailwind utility classes only — no inline `style` props, no CSS modules.
- If a class combination is reused across components, extract it to a shared constant, not a new CSS file.
- Responsive variants must be visible in stories.

## Exports

- Add the component to `package.json`'s `exports` before considering it done.
- Do not export internal subcomponents unless they are independently reusable.

## Reference Skills (read only when the task clearly matches)

- **UI/UX/accessibility audit**:
  Read `.cursor/skills/web-design-guidelines/SKILL.md` and follow the instructions there.

- **Component API design** (compound components, boolean prop reduction):
  Read `.cursor/skills/vercel-composition-patterns/README.md` then the relevant rule files.
