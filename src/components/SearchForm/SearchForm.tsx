'use client';

import { JSX, useState } from 'react';
import { getResorts } from '@/lib/resorts';
import type { SearchQuery } from '@/lib/providers/types';
import { TEST_IDS } from './constants';

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

interface Props {
  onSearch: (query: SearchQuery) => void;
}

export function SearchForm({ onSearch }: Props): JSX.Element {
  const resorts = getResorts();
  const [skiSiteId, setSkiSiteId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [fromDate, setFromDate] = useState(() => toISODate(new Date()));
  const [toDate, setToDate] = useState(() => daysFromNow(4));

  const isComplete =
    skiSiteId !== '' && groupSize !== '' && fromDate !== '' && toDate !== '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!isComplete) return;
    onSearch({
      skiSiteId: Number(skiSiteId),
      groupSize: Number(groupSize),
      fromDate,
      toDate,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="search-field">
        <svg
          className="seg-icon"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M3 12l9-9 9 9" />
          <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
        </svg>
        <select
          data-testid={TEST_IDS.DESTINATION_SELECT}
          value={skiSiteId}
          onChange={(e) => setSkiSiteId(e.target.value)}
          className="seg-text w-full cursor-pointer border-none bg-transparent outline-none"
        >
          <option value="" disabled>
            Destination
          </option>
          {resorts.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="search-field">
        <svg
          className="seg-icon"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <select
          data-testid={TEST_IDS.GROUP_SIZE_SELECT}
          value={groupSize}
          onChange={(e) => setGroupSize(e.target.value)}
          className="seg-text w-full cursor-pointer border-none bg-transparent outline-none"
        >
          <option value="" disabled>
            Guests
          </option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'person' : 'people'}
            </option>
          ))}
        </select>
      </div>

      <div className="search-field search-field-date">
        <svg
          className="seg-icon"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <input
          data-testid={TEST_IDS.FROM_DATE_INPUT}
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="seg-text cursor-pointer border-none bg-transparent outline-none"
        />
        <span className="date-sep">–</span>
        <input
          data-testid={TEST_IDS.TO_DATE_INPUT}
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="seg-text cursor-pointer border-none bg-transparent outline-none"
        />
      </div>

      <button
        data-testid={TEST_IDS.SUBMIT_BUTTON}
        type="submit"
        disabled={!isComplete}
        className="search-btn"
      >
        <svg
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Search
      </button>
    </form>
  );
}
