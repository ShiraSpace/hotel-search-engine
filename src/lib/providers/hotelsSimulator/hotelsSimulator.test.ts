import { hotelsSimulator } from './index';
import type { SearchQuery } from '../types';

const QUERY: SearchQuery = {
  skiSiteId: 1,
  fromDate: '2025-03-04',
  toDate: '2025-03-11',
  groupSize: 4,
};

const MOCK_RAW_HOTEL = {
  HotelCode: 'hotel-1',
  HotelName: 'Alpine Resort',
  HotelDescriptiveContent: {
    Images: [{ MainImage: 'True', URL: 'https://example.com/img.jpg' }],
  },
  HotelInfo: {
    Position: { Latitude: '45.29', Longitude: '6.57', Distances: [] },
    Rating: '4',
    Beds: '2',
  },
  PricesInfo: {
    AmountAfterTax: '1200',
    AmountBeforeTax: '1100',
  },
};

const EMPTY_RESPONSE = {
  statusCode: 200,
  body: { success: 'true', accommodations: [] },
};

function mockFetch(responseFactory: () => object): void {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(responseFactory()),
  } as Response);
}

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('hotelsSimulator', () => {
  it('has id "hotels-simulator"', () => {
    expect(hotelsSimulator.id).toBe('hotels-simulator');
  });

  it('fans out to group sizes 4..10 when groupSize=4 (7 requests)', async () => {
    mockFetch(() => EMPTY_RESPONSE);

    const batches: object[][] = [];
    for await (const batch of hotelsSimulator.search(QUERY)) {
      batches.push(batch);
    }

    expect(global.fetch).toHaveBeenCalledTimes(7);
    expect(batches).toHaveLength(7);
  });

  it('sends correctly-shaped POST bodies', async () => {
    mockFetch(() => EMPTY_RESPONSE);

    for await (const batch of hotelsSimulator.search(QUERY)) {
      void batch;
    }

    const calls = (global.fetch as jest.Mock).mock.calls as [
      string,
      RequestInit,
    ][];
    const bodies = calls.map((c) => JSON.parse(c[1].body as string));

    const groupSizes = bodies
      .map((b) => b.query.group_size)
      .sort((a: number, b: number) => a - b);
    expect(groupSizes).toEqual([4, 5, 6, 7, 8, 9, 10]);

    const first = bodies[0].query;
    expect(first.ski_site).toBe(1);
    expect(first.from_date).toBe('03/04/2025');
    expect(first.to_date).toBe('03/11/2025');
  });

  it('maps raw response fields to HotelResult', async () => {
    mockFetch(() => ({
      statusCode: 200,
      body: { success: 'true', accommodations: [MOCK_RAW_HOTEL] },
    }));

    const batches = [];
    for await (const batch of hotelsSimulator.search(QUERY)) {
      batches.push(batch);
    }

    const flat = batches.flat();
    expect(flat[0]).toMatchObject({
      id: 'hotel-1',
      name: 'Alpine Resort',
      stars: 4,
      location: '45.29, 6.57',
      pricePerPerson: 1200,
      imageUrl: 'https://example.com/img.jpg',
      groupSize: expect.any(Number),
    });
  });

  it('fans out only for group size 10 when groupSize=10 (1 request)', async () => {
    mockFetch(() => EMPTY_RESPONSE);

    for await (const batch of hotelsSimulator.search({
      ...QUERY,
      groupSize: 10,
    })) {
      void batch;
    }

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
