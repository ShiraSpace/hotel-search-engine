e# WeSki Hotel Search

A streaming hotel search app built with Next.js 16 (App Router), React, and TypeScript.

---

## Setup

```bash
git clone <repo-url>
cd hotel-search-engine
npm install
npm run dev
```

Open `http://localhost:3000`. No API keys required — the external hotel simulator is a public mock endpoint.

---

## Architecture

The brief has two competing requirements that shape every design decision:

1. **Multiple future providers** — the system must make adding a new hotel API a one-liner, not a refactor.
2. **Streaming results** — users should see cards appear as responses arrive, not wait for all requests to finish.

Both requirements point to the same answer: **async iterables all the way down**.

### Provider abstraction

```
src/lib/providers/
  types.ts              ← HotelProvider interface, SearchQuery, HotelResult
  registry.ts           ← export const providers: HotelProvider[] = [hotelsSimulator]
  hotelsSimulator/      ← one concrete provider
    hotelsSimulator.ts
    config.ts
    index.ts
```

Every provider satisfies a single interface:

```ts
interface HotelProvider {
  readonly id: string;
  search(query: SearchQuery): AsyncIterable<HotelResult[]>;
}
```

Each provider yields batches of results as they become available. Adding a second provider means creating a new folder and appending it to `registry.ts` — the rest of the system is untouched.

### Fan-out inside HotelsSimulator

The external API only returns rooms for the **exact** group size requested. To show larger-capacity rooms too (a requirement from the brief), the provider fans out `groupSize..10` in parallel — up to 9 concurrent requests for a solo traveller:

```
groupSize=2 → fetches sizes [2, 3, 4, 5, 6, 7, 8, 9, 10] in parallel
groupSize=9 → fetches sizes [9, 10] in parallel
```

This fan-out is encapsulated inside `hotelsSimulator.ts`. The rest of the system sees a single `AsyncIterable<HotelResult[]>` and has no knowledge of the fan-out.

The fan-out uses `Promise.race` over a set of in-flight fetches. Each resolved fetch is yielded immediately, so the caller receives the first batch as soon as any one request finishes rather than waiting for the slowest.

### Aggregator + merge utility

```
src/lib/search/
  aggregate.ts              ← search(query, providers): AsyncIterable<HotelResult[]>
  mergeAsyncIterables.ts    ← generic concurrent merge, arrival-order
```

`aggregate.ts` maps each provider to its async iterable and feeds them into `mergeAsyncIterables`. The merge utility runs all iterables concurrently via `Promise.race`, yielding whichever produces a value first. A slow provider never blocks a fast one.

This is where multi-provider support lives: `search()` is provider-agnostic and scales to N providers with no code changes.

### NDJSON streaming transport

```
src/app/api/search/route.ts
```

The route handler calls `search(query, providers)` and streams each batch as a newline-delimited JSON line (`application/x-ndjson`) via a `ReadableStream`. Each `yield` from the aggregator becomes one HTTP chunk:

```
{"id":"123","name":"Hotel A","pricePerPerson":450,...}
{"id":"456","name":"Hotel B","pricePerPerson":320,...}
...
```

The route is intentionally thin: validate input → call lib → stream response.

### Client-side hook

```
src/hooks/useHotelSearch.ts
```

`useHotelSearch` opens a streaming `fetch` to `/api/search`, reads `response.body` chunk by chunk, and merges each parsed batch into the running results list sorted ascending by price. The UI re-renders after every batch, so cards appear incrementally as the server yields them.

### Data flow summary

```
SearchForm
  └─ useHotelSearch.search(query)
       └─ POST /api/search  ──────────────────────────────────────────────────────
            └─ aggregate.search(query, [hotelsSimulator, ...])                    │
                 └─ mergeAsyncIterables([provider.search(), ...])            NDJSON stream
                      └─ hotelsSimulator.search(query)                            │
                           └─ fetch(sizes 2..10) in parallel ────────────────────┘
                                each resolves → yield batch → HTTP chunk
       └─ parse chunk → merge into sorted results → re-render HotelResults
```

---

## Project structure

```
src/
  app/
    api/search/route.ts     ← streaming POST endpoint
    page.tsx                ← page shell ("use client")
    layout.tsx              ← top stripe, fonts, global background
    globals.css             ← Tailwind v4 design tokens
  components/
    SearchForm/             ← destination, group size, date range inputs
    HotelResults/           ← card list + loading indicator
  hooks/
    useHotelSearch.ts       ← streaming fetch + client-side sort
  lib/
    providers/
      types.ts              ← shared interfaces
      registry.ts           ← provider list
      hotelsSimulator/      ← HotelsSimulator provider + fan-out
    resorts/                ← static resort list (imported directly, no API)
    search/
      aggregate.ts          ← multi-provider coordinator
      mergeAsyncIterables.ts ← arrival-order async merge
```

---

## Smoke test with curl

```bash
curl -N -X POST http://localhost:3000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"skiSiteId":1,"fromDate":"2025-04-03","toDate":"2025-04-10","groupSize":4}' 
```

`-N` disables buffering so you see lines arrive as they stream. Each line is one batch of hotel results.

---

## Testing

```bash
npm test           # unit + integration tests
npm run type-check # TypeScript strict mode
npm run lint       # ESLint + Prettier
```

Every module has a co-located test file. Mocks live in `__mocks__/` to avoid duplication across test files.

---

## Assumptions

- **Resorts list is static, not served via API.** The destination dropdown imports `resorts.json` directly in the client component. Because the list is short and fixed at build time, the extra network round-trip adds no value. In a real product with a database-driven or user-specific list it should be a proper API endpoint.

- **No authentication or rate limiting** — out of scope for the brief.

- **Desktop only (1920×1080)** — the brief explicitly excludes responsive/mobile support.

---

## Known limitations and what I'd improve

- **Hotel deduplication across group-size fan-out.** Because the provider returns the same hotel for multiple group sizes, a hotel can appear several times in the results list — once per matching group size. The fix would be to deduplicate by hotel id, keeping the cheapest matching room per hotel. Deferred to keep the initial scope focused on the provider abstraction and streaming pipeline.

- **No second provider yet.** The architecture supports it: create `src/lib/providers/secondProvider/`, implement `HotelProvider`, add to `registry.ts`. One of the providers could be configured to return all available room sizes (no fan-out needed) — the `groupSizeRange` config in each provider handles that variation per-provider.

- **Error handling per-provider.** Currently a failed fetch inside a provider propagates and aborts the stream. A production system would catch per-provider errors, log them, and continue yielding from healthy providers.