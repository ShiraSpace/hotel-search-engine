'use client';

import { useState, useCallback } from 'react';
import type { HotelResult, SearchQuery } from '@/lib/providers/types';

export interface UseHotelSearchReturn {
  results: HotelResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: SearchQuery) => void;
}

const byPriceAscending = (a: HotelResult, b: HotelResult): number =>
  a.pricePerPerson - b.pricePerPerson;

function mergeAndDedupe(
  prev: HotelResult[],
  batch: HotelResult[]
): HotelResult[] {
  const key = (h: HotelResult): string => `${h.id}:${h.groupSize}`;
  const map = new Map(prev.map((h) => [key(h), h]));
  for (const hotel of batch) {
    const existing = map.get(key(hotel));
    if (!existing || hotel.pricePerPerson < existing.pricePerPerson) {
      map.set(key(hotel), hotel);
    }
  }
  return Array.from(map.values()).sort(byPriceAscending);
}

async function* readNdjsonStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<HotelResult[]> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.trim()) yield JSON.parse(line) as HotelResult[];
    }
  }

  if (buffer.trim()) yield JSON.parse(buffer) as HotelResult[];
}

export function useHotelSearch(): UseHotelSearchReturn {
  const [results, setResults] = useState<HotelResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback((query: SearchQuery): void => {
    setIsLoading(true);
    setResults([]);
    setError(null);

    const fetchAndStream = async (): Promise<void> => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query),
        });

        if (!response.body) {
          setError('No response body');
          return;
        }

        for await (const batch of readNdjsonStream(response.body)) {
          setResults((prev) => mergeAndDedupe(prev, batch));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAndStream();
  }, []);

  return { results, isLoading, error, search };
}
