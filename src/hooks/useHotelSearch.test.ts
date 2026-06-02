import { renderHook, act } from '@testing-library/react';
import { useHotelSearch } from './useHotelSearch';
import type { HotelResult, SearchQuery } from '@/lib/providers/types';

const mockQuery: SearchQuery = {
  skiSiteId: 1,
  fromDate: '2025-01-01',
  toDate: '2025-01-07',
  groupSize: 2,
};

const mockHotels1: HotelResult[] = [
  {
    id: '1',
    name: 'Hotel A',
    stars: 3,
    location: 'Alps',
    pricePerPerson: 200,
    imageUrl: 'a.jpg',
    groupSize: 2,
  },
  {
    id: '2',
    name: 'Hotel B',
    stars: 4,
    location: 'Alps',
    pricePerPerson: 400,
    imageUrl: 'b.jpg',
    groupSize: 2,
  },
];

const mockHotels2: HotelResult[] = [
  {
    id: '3',
    name: 'Hotel C',
    stars: 5,
    location: 'Alps',
    pricePerPerson: 300,
    imageUrl: 'c.jpg',
    groupSize: 3,
  },
];

function createMockBody(chunks: string[]): {
  getReader: () => ReadableStreamDefaultReader<Uint8Array>;
} {
  const encoder = new TextEncoder();
  const encoded = chunks.map((c) => encoder.encode(c));
  let index = 0;

  return {
    getReader: () =>
      ({
        read: (): Promise<ReadableStreamReadResult<Uint8Array>> => {
          if (index < encoded.length) {
            return Promise.resolve({ done: false, value: encoded[index++] });
          }
          return Promise.resolve({ done: true, value: undefined });
        },
        releaseLock: () => {},
      }) as ReadableStreamDefaultReader<Uint8Array>,
  };
}

describe('useHotelSearch', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts with empty results, no loading, no error', () => {
    const { result } = renderHook(() => useHotelSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('accumulates and sorts results by pricePerPerson ascending', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockBody([
        JSON.stringify(mockHotels1) + '\n',
        JSON.stringify(mockHotels2) + '\n',
      ]),
    });

    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      result.current.search(mockQuery);
    });

    expect(result.current.results).toHaveLength(3);
    expect(result.current.results.map((r) => r.pricePerPerson)).toEqual([
      200, 300, 400,
    ]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets isLoading to true while streaming and false after', async () => {
    let resolveResponse!: (value: unknown) => void;
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      })
    );

    const { result } = renderHook(() => useHotelSearch());

    act(() => {
      result.current.search(mockQuery);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveResponse({
        ok: true,
        body: createMockBody([JSON.stringify(mockHotels1) + '\n']),
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets error on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      result.current.search(mockQuery);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
  });

  it('deduplicates same hotel + same groupSize, keeping the cheaper price', async () => {
    const batch1: HotelResult[] = [
      {
        id: '1',
        name: 'Hotel A',
        stars: 3,
        location: 'Alps',
        pricePerPerson: 400,
        imageUrl: 'a.jpg',
        groupSize: 2,
      },
    ];
    const batch2: HotelResult[] = [
      {
        id: '1',
        name: 'Hotel A',
        stars: 3,
        location: 'Alps',
        pricePerPerson: 300,
        imageUrl: 'a.jpg',
        groupSize: 2,
      },
      {
        id: '2',
        name: 'Hotel B',
        stars: 4,
        location: 'Alps',
        pricePerPerson: 200,
        imageUrl: 'b.jpg',
        groupSize: 2,
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockBody([
        JSON.stringify(batch1) + '\n',
        JSON.stringify(batch2) + '\n',
      ]),
    });

    const { result } = renderHook(() => useHotelSearch());
    await act(async () => {
      result.current.search(mockQuery);
    });

    expect(result.current.results).toHaveLength(2);
    expect(result.current.results[0]).toMatchObject({
      id: '2',
      pricePerPerson: 200,
    });
    expect(result.current.results[1]).toMatchObject({
      id: '1',
      pricePerPerson: 300,
    });
  });

  it('keeps same hotel as separate entries when groupSize differs', async () => {
    const batch1: HotelResult[] = [
      {
        id: '1',
        name: 'Hotel A',
        stars: 3,
        location: 'Alps',
        pricePerPerson: 400,
        imageUrl: 'a.jpg',
        groupSize: 2,
      },
    ];
    const batch2: HotelResult[] = [
      {
        id: '1',
        name: 'Hotel A',
        stars: 3,
        location: 'Alps',
        pricePerPerson: 350,
        imageUrl: 'a.jpg',
        groupSize: 4,
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockBody([
        JSON.stringify(batch1) + '\n',
        JSON.stringify(batch2) + '\n',
      ]),
    });

    const { result } = renderHook(() => useHotelSearch());
    await act(async () => {
      result.current.search(mockQuery);
    });

    expect(result.current.results).toHaveLength(2);
    expect(result.current.results[0]).toMatchObject({
      id: '1',
      groupSize: 4,
      pricePerPerson: 350,
    });
    expect(result.current.results[1]).toMatchObject({
      id: '1',
      groupSize: 2,
      pricePerPerson: 400,
    });
  });

  it('clears previous results and error when search is called again', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useHotelSearch());

    await act(async () => {
      result.current.search(mockQuery);
    });
    expect(result.current.error).toBe('fail');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: createMockBody([JSON.stringify(mockHotels1) + '\n']),
    });

    await act(async () => {
      result.current.search(mockQuery);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.results).toHaveLength(2);
  });
});
