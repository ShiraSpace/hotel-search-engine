/** @jest-environment node */
import { hotelsSimulator } from './index';
import type { HotelResult, SearchQuery } from '../types';

jest.setTimeout(30_000);

function isValidHotelResult(h: HotelResult): boolean {
  return (
    typeof h.id === 'string' &&
    h.id.length > 0 &&
    typeof h.name === 'string' &&
    h.name.length > 0 &&
    typeof h.stars === 'number' &&
    !isNaN(h.stars) &&
    typeof h.location === 'string' &&
    typeof h.pricePerPerson === 'number' &&
    !isNaN(h.pricePerPerson) &&
    h.pricePerPerson > 0 &&
    typeof h.imageUrl === 'string' &&
    h.imageUrl.startsWith('http')
  );
}

async function collectAll(query: SearchQuery): Promise<HotelResult[]> {
  const results: HotelResult[] = [];
  for await (const batch of hotelsSimulator.search(query)) {
    results.push(...batch);
  }
  return results;
}

describe('hotelsSimulator — real API', () => {
  it('group_size=4: returns valid HotelResult objects across all batches', async () => {
    const results = await collectAll({
      skiSiteId: 1,
      fromDate: '2025-03-04',
      toDate: '2025-03-11',
      groupSize: 4,
    });

    expect(results.length).toBeGreaterThan(0);
    results.forEach((h) => expect(isValidHotelResult(h)).toBe(true));
  });

  it('group_size=10: returns exactly one batch (no fan-out)', async () => {
    const batches: HotelResult[][] = [];
    for await (const batch of hotelsSimulator.search({
      skiSiteId: 1,
      fromDate: '2025-03-04',
      toDate: '2025-03-11',
      groupSize: 10,
    })) {
      batches.push(batch);
    }

    expect(batches).toHaveLength(1);
  });

  it('different date range: still returns valid results', async () => {
    const results = await collectAll({
      skiSiteId: 1,
      fromDate: '2025-01-10',
      toDate: '2025-01-17',
      groupSize: 6,
    });

    results.forEach((h) => expect(isValidHotelResult(h)).toBe(true));
  });

  it('group_size=8: fans out to 8..10 (3 batches)', async () => {
    const batches: HotelResult[][] = [];
    for await (const batch of hotelsSimulator.search({
      skiSiteId: 1,
      fromDate: '2025-03-04',
      toDate: '2025-03-11',
      groupSize: 8,
    })) {
      batches.push(batch);
    }

    expect(batches).toHaveLength(3);
  });

  it('ski_site=2: returns valid results for a different resort', async () => {
    const results = await collectAll({
      skiSiteId: 2,
      fromDate: '2025-03-04',
      toDate: '2025-03-11',
      groupSize: 10,
    });

    results.forEach((h) => expect(isValidHotelResult(h)).toBe(true));
  });
});
