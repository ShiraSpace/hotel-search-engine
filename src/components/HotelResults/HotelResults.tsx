import { JSX } from 'react';
import Image from 'next/image';
import type { HotelResult } from '@/lib/providers/types';
import { TEST_IDS, LABELS } from './constants';

interface HotelResultsProps {
  results: HotelResult[];
  isLoading: boolean;
}

function StarRating({ count }: { count: number }): JSX.Element {
  return (
    <span style={{ color: 'var(--color-star)' }} aria-label={`${count} stars`}>
      {'★'.repeat(count)}
    </span>
  );
}

function PinIcon(): JSX.Element {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function formatPrice(price: number): string {
  return `£${price.toLocaleString('en-GB')}`;
}

function HotelCard({ hotel }: { hotel: HotelResult }): JSX.Element {
  return (
    <article
      data-testid={TEST_IDS.card}
      className="flex overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface)] transition-shadow duration-200"
      style={{ boxShadow: 'var(--shadow-card)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          'var(--shadow-card-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <Image
        src={hotel.imageUrl}
        alt={hotel.name}
        width={260}
        height={180}
        className="flex-shrink-0 object-cover"
        style={{ height: '100%', minHeight: '180px' }}
        unoptimized
      />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base leading-tight font-semibold text-[var(--color-text)]">
            {hotel.name}
          </h3>
          <StarRating count={hotel.stars} />
          <p
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-2)]"
            style={{ marginTop: '2px' }}
          >
            <PinIcon />
            {hotel.location}
          </p>
          <p className="text-sm text-[var(--color-text-2)]">
            🛏️ {LABELS.sleeps(hotel.groupSize)}
          </p>
        </div>
        <div>
          <hr
            style={{ borderColor: 'var(--color-border)', marginBottom: '12px' }}
          />
          <p className="text-right font-bold text-[var(--color-text)]">
            {formatPrice(hotel.pricePerPerson)}
            <span className="text-sm font-normal text-[var(--color-text-2)]">
              {' '}
              {LABELS.perPerson}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}

export function HotelResults({
  results,
  isLoading,
}: HotelResultsProps): JSX.Element {
  const showEmpty = !isLoading && results.length === 0;

  return (
    <section data-testid={TEST_IDS.container} className="flex flex-col gap-4">
      {results.map((hotel) => (
        <HotelCard key={`${hotel.id}:${hotel.groupSize}`} hotel={hotel} />
      ))}

      {isLoading && (
        <p
          data-testid={TEST_IDS.loadingIndicator}
          className="py-4 text-center text-sm text-[var(--color-text-2)]"
        >
          {LABELS.loadingMore}
        </p>
      )}

      {showEmpty && (
        <p
          data-testid={TEST_IDS.emptyState}
          className="py-8 text-center text-sm text-[var(--color-text-2)]"
        >
          {LABELS.noResults}
        </p>
      )}
    </section>
  );
}
