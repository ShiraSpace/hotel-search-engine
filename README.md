# [App Name]

## How to run locally

1. Clone the repo
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Open `http://localhost:3000`
> If the app requires API keys or secrets, copy `.env.example` to `.env.local` and fill in the values before running.

## Assumptions

- **Resorts list is static, not served via API.** The destination dropdown is populated by importing `resorts.json` directly in the client component rather than fetching a `/api/resorts` endpoint. Because the list is short and fixed at build time, the extra network round-trip adds no value. In a real product where the list is database-driven, user-specific, or frequently updated, it should be served as a proper API endpoint instead.

## What I'd improve with more time

- **Hotel deduplication across group-size fan-out.** Because the HotelsSimulator provider only returns rooms for the exact group size requested, we fan out across sizes (e.g. 2…10 for a group of 2). The same hotel can therefore appear in multiple sub-responses — once per group size in which it has availability — and currently surfaces as separate result rows. I'd dedupe by hotel id and surface the cheapest matching room per hotel, so the price-ascending list shows each hotel once. Deferred to keep the initial scope focused on the provider abstraction and streaming pipeline.