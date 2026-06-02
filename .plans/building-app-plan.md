# Hotel Search Engine — Build Plan

Build the features in this order. Finish one before starting the next. Each step ends with something concrete you can run.

---

## Design Foundation (done)

- [x] `public/mockup.html` — visual reference for all UI work; **delete before final submission** (Step 10).
- [x] `src/app/globals.css` — Tailwind v4 `@theme` block is populated. All components must consume these tokens; no hardcoded colors or fonts.
- [x] Key tokens: `--color-primary` (#2563eb), `--color-bg` (#eef1fb), `--color-surface`, `--color-border`, `--color-star`, `--font-logo` (Nunito 800), `--font-sans` (Inter).
- [x] Layout rules from Figma: 4px primary-color top stripe, sticky white nav (60px) with inline segmented search bar, lavender-blue page background, single-column vertical list of horizontal hotel cards.

---

## Architecture (already decided)

- [x] **Providers**: a thin interface — `HotelProvider.search(query) → AsyncIterable<HotelResult[]>`. Each provider owns its own fan-out internally. Adding a new provider = new folder + one line in the registry.
- [x] **HotelsSimulator** fans out group sizes `N..10` in parallel and yields each response as it arrives.
- [x] **Transport**: NDJSON streamed from `/api/search` via `ReadableStream`. One JSON line per provider sub-response.
- [x] **Sorting**: client-side, ascending by price, as batches arrive.
- [x] **Deferred**: dedup of the same hotel across group sizes (noted in README).

---

## TDD loop for every step

1. Write a failing test in the relevant `*.test.ts(x)`.
2. `npm test` → confirm red.
3. Implement the minimum to go green.
4. `npm test` → confirm green.
5. Commit: `[FEAT]: <step name>`.

---

## Step 1 — Types & provider interface ✅

**Goal**: lock the shared contract that every later step depends on — no implementation yet, just types.

**Files**
- [x] `src/lib/providers/types.ts` — `HotelProvider`, `SearchQuery`, `HotelResult`, `SearchBatch`.

**How we check it**:
- [x] `npm run type-check` exits 0 — the types compile.
- [x] `types.test.ts` constructs a mock object that satisfies `HotelProvider` — TypeScript accepts it without casts.

---

## Step 2 — Resorts module ✅

**Goal**: a typed, testable function that returns the destination list, ready for the dropdown in Step 7.

**Files**
- [x] `src/lib/resorts/resorts.json` — static list of resorts.
- [x] `src/lib/resorts/types.ts` — `Resort = { id: number; name: string }`.
- [x] `src/lib/resorts/resorts.ts` — `getResorts(): Resort[]`, `getResortById(id: number): Resort | null`.
- [x] `src/lib/resorts/index.ts` — named re-export.
- [x] `src/lib/resorts/resorts.test.ts` — unit tests.

**Note**: No `/api/resorts` route — the list is static and short so `SearchForm` imports `getResorts()` directly.

**Note for Step 1**: `SearchQuery` carries `skiSiteId: number` (camelCase). The provider translates to `ski_site` when serializing — no snake_case above the provider boundary.

**How we check it**:
- [x] `npm test` green — `getResorts()` returns a non-empty array; each item has `id: number` and `name: string`; `getResortById` returns `null` for unknown ids and the matching resort for known ones.

---

## Step 3 — HotelsSimulator provider ✅

**Goal**: one concrete provider that fans out N parallel requests (groupSize..10) and yields each batch as it resolves — the first streaming data in the system.

**Files**
- [x] `src/lib/providers/hotelsSimulator/config.ts` — endpoint URL, `groupSizeRange(min)`, `formatDate(isoDate)`.
- [x] `src/lib/providers/hotelsSimulator/hotelsSimulator.ts` — implements `HotelProvider`; fans out `groupSize..10` in parallel; yields each resolved batch immediately.
- [x] `src/lib/providers/hotelsSimulator/hotelsSimulator.test.ts` — mocked fetch; asserts fan-out count, request body shape, and field mapping.
- [x] `src/lib/providers/hotelsSimulator/index.ts` — named re-export.

**Real API shape** (discovered via integration testing):
- Response envelope: `{ statusCode: 200, body: { success: 'true', accommodations: SimulatorHotel[] } }`
- Hotel fields (PascalCase): `HotelCode`, `HotelName`, `HotelDescriptiveContent.Images[{ MainImage, URL }]`, `HotelInfo.Rating`, `HotelInfo.Position.{ Latitude, Longitude }`, `PricesInfo.AmountAfterTax`
- `location` is derived as `"${Latitude}, ${Longitude}"` — no resort name in the response.
- Date format sent to the API: `MM/DD/YYYY`.

**How we check it**:
- [x] `npm test` green — fan-out count matches `11 - groupSize`; request bodies contain `ski_site`, `from_date` (MM/DD/YYYY), `to_date`, `group_size`; mapped `HotelResult` has camelCase fields with correct types.

---

## Step 4 — Registry + aggregator ✅

**Goal**: a single `search()` function that runs every registered provider and yields a merged stream — so the route and the hook never need to know about individual providers.

**Files**
- [x] `src/lib/providers/registry.ts` — `export const providers: HotelProvider[] = [hotelsSimulator]`.
- [x] `src/lib/providers/index.ts` — named re-export of `providers` and all shared types.
- [x] `src/lib/search/mergeAsyncIterables.ts` — generic utility; merges N async iterables, yielding whichever produces a value next (arrival order, not source order).
- [x] `src/lib/search/mergeAsyncIterables.test.ts` — asserts arrival-order yielding with controlled timing.
- [x] `src/lib/search/aggregate.ts` — `search(query, providers): AsyncIterable<HotelResult[]>`.
- [x] `src/lib/search/aggregate.test.ts` — fake providers; asserts all batches are yielded and merged.
- [x] `src/lib/search/index.ts` — named re-export.

**How we check it**:
- [x] `npm test` green — fast iterable items arrive before slow iterable items; all items from all providers appear in output; empty provider list produces empty output.

---

## Step 5 — `/api/search` route ✅

**Goal**: a streaming HTTP endpoint — the first thing you can hit with curl and watch results trickle in.

**Files**
- [x] `src/app/api/search/route.ts` — reads `SearchQuery` from POST body; calls `search(query, providers)`; returns a `Response` with a `ReadableStream` that encodes one NDJSON line (`JSON.stringify(batch) + '\n'`) per batch. `Content-Type: application/x-ndjson`.

---

## Step 6 — `useHotelSearch` hook ✅

**Goal**: a React hook that owns the full client-side streaming lifecycle — opens the NDJSON stream, accumulates results sorted by price, and exposes loading/error state.

**Files**
- [x] `src/hooks/useHotelSearch.ts` — `search(query)` opens a streaming fetch to `/api/search`; reads `response.body` line by line; parses each JSON line; merges into a price-ascending sorted list. Exposes `{ results, isLoading, error, search }`.
- [x] `src/hooks/useHotelSearch.test.ts` — mocks `fetch` with a fake `ReadableStream`; asserts accumulation, sort order, loading transitions, and error state.

**How we check it**:
- [x] `npm test` green.

---

## Step 7 — `SearchForm` component ✅

**Goal**: a form component that collects all three search fields and emits a well-typed `SearchQuery` on submit — no business logic, just UI wiring.

**Files**
- [x] `src/components/SearchForm/SearchForm.tsx` — destination dropdown (`getResorts()`), group-size select (1–10), two date inputs. All fields mandatory. Segmented bar layout from mockup: destination | guests | dates | blue Search button.
- [x] `src/components/SearchForm/constants.ts` — test IDs and string literals.
- [x] `src/components/SearchForm/SearchForm.test.tsx` — renders all fields; filling and submitting calls `onSearch` with the correct `SearchQuery` shape.
- [x] `src/components/SearchForm/index.ts` — named re-export.

**How we check it**:
- [x] `npm test` green.

---

## Step 8 — `HotelResults` component ✅

**Goal**: a pure display component that renders the sorted hotel list and shows a live loading indicator while results are still streaming.

**Files**
- [x] `src/components/HotelResults/HotelResults.tsx` — `results: HotelResult[]` + `isLoading: boolean`. Card layout: image 218px left, info right (bold name → stars → location → `£X,XXX /per person` bottom-right). Shows "loading more…" indicator when `isLoading`, empty state when no results and not loading.
- [x] `src/components/HotelResults/constants.ts` — test IDs and string literals.
- [x] `src/components/HotelResults/HotelResults.test.tsx` — renders with fixture data; loading indicator shown/hidden; empty state; price formatting.
- [x] `src/components/HotelResults/index.ts` — named re-export.

**How we check it**:
- [x] `npm test` green.

---

## Step 9 — Page composition (first browser moment)

**Goal**: full end-to-end flow working in the browser — search form triggers streaming fetch, results appear card-by-card as they arrive.

**Files**
- [ ] `src/app/page.tsx` — `"use client"`. Renders `SearchForm`; on submit calls `useHotelSearch.search(query)`; passes `results` + `isLoading` to `HotelResults`.
- [ ] `src/app/layout.tsx` — 4px `--color-primary` top stripe; `<body>` background `--color-bg`; Google Fonts via `next/font/google` (Nunito + Inter); remove the `@import url()` from `globals.css`.

**How we check it**:
- [ ] `npm run dev` starts with no errors.
- [ ] Open `localhost:3000`, run a search — hotel cards stream in incrementally (not all at once).
- [ ] Cards are price-ascending throughout streaming.
- [ ] Edge cases pass: group size 1 (10 fan-out requests), group size 10 (1 request), date range > 1 month.
- [ ] Visual: matches mockup — top stripe, sticky nav, lavender background, card layout.

---

## Step 10 — Design Alignment (WeSki Mockup Polish)

**Goal**: make the live app visually match the provided Figma mockup — logo, search bar layout, results header, and hotel card styling.

### Sub-steps (implement one at a time)

#### 10a — Logo ✅
- [x] Replace "WeSki." text with a mountain SVG icon + "WE·SKI" text, both in `--color-primary` blue.
- [x] Use the `.logo` CSS class; keep `--font-logo` (Nunito 800) and `letter-spacing`.

#### 10b — Search bar: 3 separate bordered inputs ✅
- [x] Remove the single connected `.search-bar` container.
- [x] Replace with `.search-form` (flex, gap) holding three individual `.search-field` bordered inputs (destination, guests, date range).
- [x] Combine `fromDate` + `toDate` into one visual `.search-field` with a "–" separator between the two native date inputs.
- [x] `.search-btn` becomes a standalone rounded button (not attached to the bar).
- [x] All existing test IDs (`data-testid`) must be preserved — tests should stay green.

#### 10c — Results header ✅
- [x] After a search, show `"Select your ski trip"` as an `<h1>` above the card list.
- [x] Below the heading, show a subtitle: `"{N} ski trip options • {Resort} • {fromDate} – {toDate} • {groupSize} people"`.
- [x] Track `lastQuery` in `page.tsx` state; use `getResortById` for the resort name; format dates as human-readable (e.g. "Dec 1").
- [x] The pre-search hero ("Find your perfect ski hotel") remains unchanged.

#### 10d — Hotel card polish ✅
- [x] Stars: show only filled stars (`★`.repeat(count)); remove the empty-star characters.
- [x] Location: replace the `📍` emoji with an inline SVG pin icon in `--color-text-2`.
- [x] Remove the "Sleeps N" row (not shown in mockup); `LABELS.sleeps` kept in constants but unused.
- [x] Add a horizontal `<hr>` divider above the price row.
- [x] Price: change text color from `--color-primary` blue to `--color-text` dark; `/per person` stays `--color-text-2`.

### How we check it
- [x] `npm test` still green — 44/44 tests passing.
- [ ] `npm run dev` — visual matches the mockup screenshot: logo, separated search fields, results heading with subtitle, polished cards.

---

## Step 11 — README + cleanup

**Goal**: a repo a stranger can clone, run, and understand in under 5 minutes.

**How we check it**:
- [ ] `public/mockup.html` deleted.
- [ ] README has: setup instructions, curl smoke-check snippets, Assumptions section, "What I'd improve".
- [ ] No `.gitkeep` or other unused files remain.
- [ ] `npm run lint` exits 0 — zero warnings.
- [ ] `npm test` — full green.
- [ ] `rm -rf node_modules && npm install && npm run dev` works on a fresh clone.

---

## Out of scope for v1

- Hotel deduplication across group-size fan-out (document in README as a known limitation).
- Adding a second provider (architecture supports it; not part of submission).
- Responsive/mobile layout (spec is desktop 1920×1080 only).
