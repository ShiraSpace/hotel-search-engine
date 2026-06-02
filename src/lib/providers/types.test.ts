import type { HotelProvider, HotelResult, SearchBatch, SearchQuery } from './types';

describe('HotelProvider contract', () => {
  it('accepts a valid mock provider', () => {
    const mockProvider: HotelProvider = {
      id: 'mock',
      async *search(_query: SearchQuery): AsyncIterable<HotelResult[]> {
        yield [];
      },
    };

    expect(mockProvider.id).toBe('mock');
    expect(typeof mockProvider.search).toBe('function');
  });

  it('SearchBatch holds a provider id, group size, and hotel list', () => {
    const batch: SearchBatch = {
      providerId: 'mock',
      groupSize: 2,
      hotels: [],
    };

    expect(batch.providerId).toBe('mock');
    expect(batch.groupSize).toBe(2);
    expect(batch.hotels).toHaveLength(0);
  });
});
