@AGENTS.md

## Skill Usage

Before invoking any superpowers skill, ask the user for approval first. Do not auto-trigger skills.

## Code Style Guidelines

### Mandatory Code Standards

1. **Quotes**: Use single quotes throughout
2. **Exports**: Use named exports ONLY (no default exports)
3. **Return Types**: Add explicit return types to ALL functions
4. **Component Composition**: Extract to small, focused components when needed
5. **ESLint Rules**: Never modify ESLint configuration to suppress warnings or errors — always fix the code itself
6. Files should not pass 200 lines, if it does trigger a question what to do to refactor it.
7. Hard coded values should be a dedicated constant file.

### TypeScript

- All functions must have explicit return types (`JSX.Element`, `void`, `number`, etc.)
- Use strict mode
- Prefer interfaces for props and types

### Testing

- Each component has a dedicated test file
- Use `data-testid` for element selection in tests
- Store test IDs and content in constants file
- Place `render()` in `beforeEach` block
- Use `getByTestId` for element queries
- Mock dependencies appropriately
- Use centralized mocks in `__mocks__/` directory for shared module mocks (e.g., `__mocks__/next/image.tsx`) — do not
  duplicate `jest.mock()` calls across test files

### Code Formatting

- **Prettier** is configured for automatic code formatting
- Configuration (`.prettierrc`):
    - Single quotes for strings (`singleQuote: true`)
    - Semicolons required (`semi: true`)
    - Tab width: 2 spaces
    - Print width: 100 characters
    - Trailing commas: ES5 style
    - Arrow function parentheses: always
- Integrated with ESLint via `eslint-plugin-prettier`
- Formatting happens automatically when running `npm run lint`
- ESLint will both check and fix code style and formatting issues

## Architecture

### Framework & Routing

- **Next.js 16 App Router** — all routes live under `src/app/`
- **`src/app/page.tsx`** — main UI shell, mark `"use client"` if it uses state or events
- **`src/app/api/`** — one folder per API endpoint (e.g. `src/app/api/search/route.ts`)
- **`src/components/`** — shared UI components; add `"use client"` to any that use state/events. Each component lives in
  its own folder:

```
src/components/
  MyComponent/
    MyComponent.tsx       ← component implementation
    MyComponent.test.tsx  ← dedicated test file
    constants.ts          ← test IDs, string literals, and other constants for this component
    index.ts              ← named re-export only
```

- **`src/hooks/`** — shared custom React hooks (React-specific, not framework-agnostic). If a hook is only used by one
  component, co-locate it inside that component's folder instead. Only move to `src/hooks/` when reused across two or
  more places.
- **`src/lib/`** — all business logic, framework-agnostic; this is what gets unit-tested
- **`src/db/`** — persistence layer (DB file, storage module, etc.)

### Key Rule: Keep API Routes Thin

API routes should only: validate input → call a `src/lib` function → return JSON. No business logic in route handlers.

```ts
// src/app/api/search/route.ts
import {searchMovies} from '@/lib/movies';

export async function GET(req: Request): Promise<Response> {
    const {searchParams} = new URL(req.url);
    const query = searchParams.get('q') ?? '';
    const results = await searchMovies(query);
    return Response.json(results);
}
```

---

## Interview Context

### Before Writing Any Code

1. Read the brief in full
2. If anything is ambiguous, state your assumption in the README under "Assumptions" — do not silently guess
3. Write a short plan to `.plans/building-app-plan.md` listing features in order of priority
4. Confirm the plan covers every required feature before touching code

### Step-by-Step Workflow (one feature at a time)

1. Write a Jest test for the core logic in `src/lib/__tests__/`
2. Run `npm test` — confirm it **fails**
3. Implement minimal code in `src/lib/` to make it pass
4. Run `npm test` — confirm it **passes**
5. Write the thin API route in `src/app/api/`
6. Wire up the UI component + tests
7. Verify all tests pass
8. Simultaneously: trigger code-review skill + Ask user to verify in the browser
9. Update readme and the plan.mp files with the progress
10. Commit and push: `git commit -m "[FEAT]: [feature name]"`

### Code Quality Checklist (before submitting)

- [ ] Errors surface to the user — nothing swallowed silently
- [ ] Loading states shown while data is fetching
- [ ] README has working setup instructions a stranger can follow
- [ ] No .gitkeep files, delete unused files.
- [ ] `npm run dev` works on a fresh clone
- [ ] If the brief requires API keys: stored in `.env.local` (never committed), `.env.example` has key names with empty
  values

### Next.js 16 Pitfalls

**1. Missing `"use client"`** — any component using `useState`, `useEffect`, `onClick`, or browser APIs needs
`"use client"` at the top. Without it you get a cryptic runtime error.

**2. Importing a Server Component into a Client Component** — breaks at runtime. Pass server content as `children`
instead.

**3. Fetch caching** — Next.js may cache `fetch()` calls. For calls that must be fresh:

```ts
fetch(url, {cache: 'no-store'});
```

### What should be kept

| Dimension        | What to check for                                                                                 |
|------------------|---------------------------------------------------------------------------------------------------|
| **It works**     | All features run on a fresh clone; error states handled                                           |
| **Architecture** | Clear FE / API / lib separation; intentional choices                                              |
| **Code quality** | Keeping each method concise, clear, readable, doing one thing, aligns with clean code guidelines. |
