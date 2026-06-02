'use client';

import { JSX, useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { HotelResults } from '@/components/HotelResults';
import { useHotelSearch } from '@/hooks/useHotelSearch';
import type { SearchQuery } from '@/lib/providers/types';

export default function Home(): JSX.Element {
  const { results, isLoading, error, search } = useHotelSearch();
  const [hasSearched, setHasSearched] = useState(false);

  function handleSearch(query: SearchQuery): void {
    setHasSearched(true);
    search(query);
  }

  return (
    <>
      <nav className="nav">
        <a
          href="/"
          style={{
            fontFamily: 'var(--font-logo)',
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--color-text)',
            textDecoration: 'none',
            letterSpacing: '-0.3px',
            flexShrink: 0,
          }}
        >
          WeSki<span style={{ color: 'var(--color-primary)' }}>.</span>
        </a>
        <SearchForm onSearch={handleSearch} />
      </nav>

      <main className="main">
        {!hasSearched && (
          <div style={{ marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '5px',
                letterSpacing: '-0.3px',
              }}
            >
              Find your perfect ski hotel
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-2)' }}>
              Search across properties in the world&apos;s best ski resorts
            </p>
          </div>
        )}

        {error && (
          <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </p>
        )}

        {hasSearched && (
          <HotelResults results={results} isLoading={isLoading} />
        )}
      </main>
    </>
  );
}
