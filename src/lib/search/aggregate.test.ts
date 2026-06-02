import { search } from './aggregate';
import type { HotelProvider, HotelResult, SearchQuery } from '../providers/types';

const QUERY: SearchQuery = {
  skiSiteId: 1,
  fromDate: '2025-03-04',
  toDate: '2025-03-11',
  groupSize: 4,
};

function makeHotel(id: string, price: number): HotelResult {
  return { id, name: id, stars: 3, location: 'Alps', pricePerPerson: price, imageUrl: '' };
}

function makeProvider(id: string, batches: HotelResult[][]): HotelProvider {
  return {
    id,
    async *search() {
      for (const batch of batches) {
        yield batch;
      }
    },
  };
}

async function collect(iter: AsyncIterable<HotelResult[]>): Promise<HotelResult[][]> {
  const results: HotelResult[][] = [];
  for await (const batch of iter) {
    results.push(batch);
  }
  return results;
}

describe('search aggregator', () => {
  it('yields all batches from a single provider', async () => {
    const hotel = makeHotel('h1', 500);
    const provider = makeProvider('p1', [[hotel]]);
    const batches = await collect(search(QUERY, [provider]));
    expect(batches).toHaveLength(1);
    expect(batches[0]).toEqual([hotel]);
  });

  it('merges batches from multiple providers', async () => {
    const h1 = makeHotel('h1', 500);
    const h2 = makeHotel('h2', 800);
    const providers = [makeProvider('p1', [[h1]]), makeProvider('p2', [[h2]])];
    const batches = await collect(search(QUERY, providers));
    const all = batches.flat();
    expect(all).toHaveLength(2);
    expect(all).toEqual(expect.arrayContaining([h1, h2]));
  });

  it('returns an empty iterable when providers list is empty', async () => {
    const batches = await collect(search(QUERY, []));
    expect(batches).toHaveLength(0);
  });
});
