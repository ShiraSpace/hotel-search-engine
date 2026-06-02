'use client';

import { JSX, useState } from 'react';
import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';
import { HotelResults } from '@/components/HotelResults';
import { useHotelSearch } from '@/hooks/useHotelSearch';
import { getResortById } from '@/lib/resorts';
import type { SearchQuery } from '@/lib/providers/types';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

export default function Home(): JSX.Element {
  const { results, isLoading, error, search } = useHotelSearch();
  const [hasSearched, setHasSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState<SearchQuery | null>(null);

  function handleSearch(query: SearchQuery): void {
    setHasSearched(true);
    setLastQuery(query);
    search(query);
  }

  const resort = lastQuery ? getResortById(lastQuery.skiSiteId) : null;

  return (
    <>
      <nav className="nav">
        <Link href="/" className="logo">
          <svg
            width="26"
            height="18"
            viewBox="0 0 26 18"
            fill="currentColor"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path d="M0 18L8 2l4.5 7.5L16 4l10 14H0z" />
          </svg>
          WE<span className="logo-dot">·</span>SKI
        </Link>
        <SearchForm onSearch={handleSearch} />
      </nav>

      <main className="main">
        {error && (
          <p style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </p>
        )}

        {!hasSearched && (
          <div className="hero">
            <h1 className="hero-title">Find your perfect ski hotel</h1>
            <p className="hero-sub">
              Search across properties in the world&apos;s best ski resorts
            </p>
          </div>
        )}

        {hasSearched && (
          <>
            <div className="results-header">
              <h1 className="results-title">Select your ski trip</h1>
              {lastQuery && resort && (
                <p className="results-subtitle">
                  {results.length} ski trip options
                  <span className="subtitle-dot">•</span>
                  {resort.name}
                  <span className="subtitle-dot">•</span>
                  {formatDate(lastQuery.fromDate)} –{' '}
                  {formatDate(lastQuery.toDate)}
                  <span className="subtitle-dot">•</span>
                  {lastQuery.groupSize}{' '}
                  {lastQuery.groupSize === 1 ? 'person' : 'people'}
                </p>
              )}
            </div>
            <HotelResults results={results} isLoading={isLoading} />
          </>
        )}
      </main>
    </>
  );
}
