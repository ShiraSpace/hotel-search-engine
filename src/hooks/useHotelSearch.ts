'use client';

import { useState, useCallback } from 'react';
import type { HotelResult, SearchQuery } from '@/lib/providers/types';

export interface UseHotelSearchReturn {
  results: HotelResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: SearchQuery) => void;
}

export function useHotelSearch(): UseHotelSearchReturn {
  const [results, setResults] = useState<HotelResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback((query: SearchQuery): void => {
    setIsLoading(true);
    setResults([]);
    setError(null);

    const run = async (): Promise<void> => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(query),
        });

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const batch: HotelResult[] = JSON.parse(line);
            setResults((prev) =>
              [...prev, ...batch].sort((a, b) => a.pricePerPerson - b.pricePerPerson),
            );
          }
        }

        if (buffer.trim()) {
          const batch: HotelResult[] = JSON.parse(buffer);
          setResults((prev) =>
            [...prev, ...batch].sort((a, b) => a.pricePerPerson - b.pricePerPerson),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, []);

  return { results, isLoading, error, search };
}
