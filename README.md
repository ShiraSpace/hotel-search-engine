# WeSki Hotel Search

A streaming hotel search app built with Next.js 16 (App Router), React, and TypeScript.
<img width="1655" height="505" alt="image" src="https://github.com/user-attachments/assets/0a846d3c-4c00-4835-8a8f-dccf4878d98b" />

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

## How it works

Enter a ski resort, travel dates, and group size. Results appear incrementally as the server streams them — each hotel card renders the moment its data arrives, without waiting for the full response.

---

## Architecture

Two requirements from the brief drive every design decision:

1. **Multiple providers** — adding a new hotel API should be a one-liner, not a refactor.
2. **Streaming results** — cards should appear as responses arrive, not after all requests finish.

Both point to the same solution: **async iterables all the way down**.

### Provider interface

Every provider satisfies one interface:

```ts
interface HotelProvider {
  readonly id: string;
  search(query: SearchQuery): AsyncIterable<HotelResult[]>;
}
```

Each call yields batches of results as they become available. Adding a second provider means creating a new folder and appending it to `registry.ts` — nothing else changes.

### Fan-out inside HotelsSimulator

The external API only returns rooms for the **exact** group size requested. To also show larger-capacity rooms (a brief requirement), the provider fans out `groupSize..10` in parallel:

```
groupSize=2 → fetches sizes [2, 3, 4, 5, 6, 7, 8, 9, 10] concurrently
groupSize=9 → fetches sizes [9, 10] concurrently
```

`Promise.race` over the in-flight set means the first response is yielded immediately — the caller never waits for the slowest request.

### Aggregator + merge

`aggregate.ts` maps each provider to its async iterable and feeds them into `mergeAsyncIterables`, which runs all iterables concurrently via `Promise.race` and yields in arrival order. A slow provider never blocks a fast one.

### NDJSON streaming transport

The route handler calls `search(query, providers)` and streams each yielded batch as a newline-delimited JSON line (`application/x-ndjson`). Each line is a JSON array of hotel results:

```
[{"id":"123","name":"Hotel A","pricePerPerson":450,...}]
[{"id":"456","name":"Hotel B","pricePerPerson":320,...},{"id":"789",...}]
...
```

### Client-side hook

`useHotelSearch` opens a streaming `fetch` to `/api/search`, reads `response.body` chunk by chunk, and merges each parsed batch into a running list sorted ascending by price. The list is deduplicated by `id:groupSize` (cheapest price wins). The UI re-renders after every batch.

### Data flow

```
SearchForm
  └─ useHotelSearch.search(query)
       └─ POST /api/search  ──────────────────────────────────────────────────────
            └─ aggregate.search(query, [hotelsSimulator, ...])                    │
                 └─ mergeAsyncIterables([provider.search(), ...])            NDJSON stream
                      └─ hotelsSimulator.search(query)                            │
                           └─ fetch(sizes 2..10) in parallel ────────────────────┘
                                each resolves → yield batch → HTTP chunk
       └─ parse chunk → dedupe + sort → re-render HotelResults
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
    useHotelSearch.ts       ← streaming fetch + client-side dedupe/sort
  lib/
    providers/
      types.ts              ← shared interfaces
      registry.ts           ← provider list
      hotelsSimulator/      ← HotelsSimulator provider + fan-out logic
    resorts/                ← static resort list loaded from resorts.json at build time
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

`-N` disables buffering so you see lines arrive as they stream. Each line is a JSON array of hotel results for one group size.

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

- **Resorts list is static.** The destination dropdown loads from a bundled `resorts.json`. In production with a database-driven list it should be an API endpoint.
- **No authentication or rate limiting** — out of scope for the brief.
- **Desktop only (1920×1080)** — the brief explicitly excludes responsive/mobile support.

---

## Known limitations and what I'd improve

- **Same hotel appears as one card per matched group size.** A hotel that sleeps 4 and also sleeps 6 shows as two separate cards. In a real product these would be unified into a single card with a room-size range selector for better UX.

- **No second provider yet.** The architecture supports it: create `src/lib/providers/secondProvider/`, implement `HotelProvider`, add to `registry.ts`. The `groupSizeRange` config handles whether a provider needs fan-out.

- **Per-provider error isolation.** A failed fetch currently aborts the stream. Production would catch per-provider errors, log them, and continue streaming from healthy providers.
