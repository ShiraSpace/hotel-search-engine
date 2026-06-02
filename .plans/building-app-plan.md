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

## Step 1 — Types & provider interface

**Goal**: lock the contract every later step depends on.

**Files**
- [x] `src/lib/providers/types.ts` — `HotelProvider`, `SearchQuery`, `HotelResult`, `SearchBatch`.

**Verify**:
- [x] `npm run type-check` passes.
- [x] A test file constructs a mock that satisfies `HotelProvider`.

---

## Step 2 — Resorts module

**Goal**: have the destination list available end-to-end.

**Data shape**: `Array<{ id: number; name: string }>`. `id` is the value the external API expects as `ski_site`; `name` is the display label for the dropdown.

**Files**
- [x] `src/lib/resorts/resorts.json` — static list of resorts.
- [x] `src/lib/resorts/types.ts` — `Resort = { id: number; name: string }`.
- [x] `src/lib/resorts/index.ts` — `getResorts(): Resort[]`, `getResortById(id: number): Resort | null`.
- [x] `src/lib/resorts/resorts.test.ts` — unit tests.

**Note**: No `/api/resorts` route — the list is static and short so `SearchForm` imports `getResorts()` directly. A real product with a DB-driven list would use an API route instead.

**Note for Step 1**: `SearchQuery` must carry `skiSiteId: number` (camelCase). The HotelsSimulator provider is responsible for translating it to `ski_site` when serializing the outbound request body — no snake_case leaks above the provider boundary.

**Verify**:
- [x] `npm test` green.

---

## Step 3 — HotelsSimulator provider ✅

**Goal**: one working provider implementing the interface, with fan-out + streaming yields.

**Files**
- [x] `src/lib/providers/hotelsSimulator/config.ts` — endpoint URL, group-size range fn, date format.
- [x] `src/lib/providers/hotelsSimulator/hotelsSimulator.ts` — implements `HotelProvider`. Fans out group sizes N..10 in parallel, yields each response as it resolves.
- [x] `src/lib/providers/hotelsSimulator/index.ts` — named re-export.
- [x] `src/lib/providers/hotelsSimulator/hotelsSimulator.test.ts` — mocked fetch; asserts fan-out count, request shape, field mapping.
- [x] `src/lib/providers/hotelsSimulator/hotelsSimulator.integration.test.ts` — real API calls with varied bodies (group_size 4/8/10, different dates, ski_site 2).

**Note**: Real API shape differed from initial assumption. Response is `{ statusCode, body: { accommodations[] } }` with PascalCase fields. `SimulatorResponse` and `mapHotel` updated accordingly. `location` is derived from lat/lng (no resort name in API response).

**Verify**:
- [x] `npm test` green (24 tests, all passing).

---

## Step 4 — Registry + aggregator ✅

**Goal**: a single function that runs every registered provider and yields a merged stream.

**Files**
- [x] `src/lib/providers/registry.ts` — `export const providers: HotelProvider[] = [hotelsSimulator]`.
- [x] `src/lib/search/mergeAsyncIterables.ts` — generic utility that merges N async iterables, yielding whichever produces next.
- [x] `src/lib/search/mergeAsyncIterables.test.ts`.
- [x] `src/lib/search/aggregate.ts` — `search(query, providers): AsyncIterable<HotelResult[]>` — maps providers to their search iterables and merges.
- [x] `src/lib/search/aggregate.test.ts` — uses fake providers to assert merge behavior.

**Verify**:
- [x] `npm test` green.

---

## Step 5 — `/api/search` route (first curl-able moment)

**Goal**: a real streaming HTTP endpoint.

**Files**
- [ ] `src/app/api/search/route.ts` — parses query from the POST body, calls `aggregate.search(query)`, returns a `Response` wrapping a `ReadableStream` that writes one NDJSON line per batch. `Content-Type: application/x-ndjson`.

**Verify**:
- [ ] JSON lines arrive incrementally from curl.
- [ ] Date format verified — if results are empty, flip DD/MM ↔ MM/DD in `hotelsSimulator/config.ts`.
- [ ] curl snippet added to README under "Manual smoke checks."

---

## Step 6 — `useHotelSearch` hook

**Goal**: client-side consumer of the NDJSON stream.

**Files**
- [ ] `src/hooks/useHotelSearch.ts` — opens streaming `fetch`, reads `response.body`, splits on `\n`, parses each line, accumulates into a sorted-by-price list. Exposes `{ results, isLoading, error, search(query) }`.
- [ ] `src/hooks/useHotelSearch.test.ts` — mocks `ReadableStream` and `fetch`, asserts accumulation + sort order + loading transitions.

**Verify**:
- [ ] `npm test` green.

---

## Step 7 — `SearchForm` component

**Goal**: collect destination, group size, date range; submit a `SearchQuery`.

**Files**
- [ ] `src/components/SearchForm/SearchForm.tsx` — imports `getResorts()` directly for the dropdown; group-size 1–10; date inputs. All fields mandatory. Match the segmented nav search bar from the mockup: destination | guests | dates | blue Search button. Use `--radius-input`, `--color-border`, `--color-divider` for the dividers between segments.
- [ ] `src/components/SearchForm/constants.ts` — test IDs.
- [ ] `src/components/SearchForm/SearchForm.test.tsx` — render, fill, submit, assert callback receives the right query.
- [ ] `src/components/SearchForm/index.ts` — named re-export.

**Verify**:
- [ ] `npm test` green.

---

## Step 8 — `HotelResults` component

**Goal**: render the accumulated, sorted hotel list.

**Files**
- [ ] `src/components/HotelResults/HotelResults.tsx` — receives `results: HotelResult[]`, renders one row per result. Shows a "loading more…" indicator when `isLoading`. Card layout: image 218px left, info right (hotel name bold → stars in `--color-star` → location with pin icon → price bottom-right as `£X,XXX /per person`). Use `--radius-card`, `--shadow-card`, `--shadow-card-hover`.
- [ ] `src/components/HotelResults/constants.ts`.
- [ ] `src/components/HotelResults/HotelResults.test.tsx` — render with fixture array; assert price-ascending order.
- [ ] `src/components/HotelResults/index.ts`.

**Verify**:
- [ ] `npm test` green.

---

## Step 9 — Page composition (first browser moment)

**Goal**: working app end-to-end.

**Files**
- [ ] `src/app/page.tsx` — `"use client"`. Renders `SearchForm`; on submit, calls `useHotelSearch.search(query)`; renders `HotelResults`.
- [ ] `src/app/layout.tsx` — add a 4px `--color-primary` top accent stripe and ensure `<body>` uses `--color-bg` as background. Wire the Google Fonts import (Nunito + Inter) via `next/font/google` instead of the CSS `@import url()` currently in globals.css (remove the url import once done).

**Verify**:
- [ ] `npm run dev` starts clean.
- [ ] Open `localhost:3000` and run a search — results stream in.
- [ ] Confirm price-ascending order.
- [ ] Edge cases: group size 1, group size 10, very long date range.

---

## Step 10 — README + cleanup

- [ ] Delete `public/mockup.html` (design reference only, not part of the app).
- [ ] Fill out README: setup instructions, manual smoke checks (curl snippets), Assumptions section, "What I'd improve".
- [ ] Delete any unused files (`.gitkeep`, etc.).
- [ ] Run `npm run lint` — fix all warnings.
- [ ] `npm test` — full green.
- [ ] Fresh-clone smoke test: `rm -rf node_modules && npm install && npm run dev` works.

---

## Out of scope for v1

- Hotel deduplication across group-size fan-out (documented in README as next step).
- Adding a second provider (the architecture supports it; not part of submission).
- Design polish — applied after Step 9, against the HTML mockup the design session is producing.