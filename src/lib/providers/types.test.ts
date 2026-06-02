import type { HotelProvider, HotelResult } from './types';

describe('HotelProvider contract', () => {
  it('accepts a valid mock provider', () => {
    const mockProvider: HotelProvider = {
      id: 'mock',
      async *search(): AsyncIterable<HotelResult[]> {
        yield [];
      },
    };

    expect(mockProvider.id).toBe('mock');
    expect(typeof mockProvider.search).toBe('function');
  });
});
