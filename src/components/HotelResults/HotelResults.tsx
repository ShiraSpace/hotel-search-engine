import { JSX } from 'react';
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
      {'☆'.repeat(Math.max(0, 5 - count))}
    </span>
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
      <img
        src={hotel.imageUrl}
        alt={hotel.name}
        className="flex-shrink-0 object-cover"
        style={{ width: '218px', height: '160px' }}
      />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-base leading-tight font-bold text-[var(--color-text)]">
            {hotel.name}
          </h3>
          <StarRating count={hotel.stars} />
          <p className="flex items-center gap-1 text-sm text-[var(--color-text-2)]">
            <span aria-hidden="true">📍</span>
            {hotel.location}
          </p>
          <p className="flex items-center gap-1 text-sm text-[var(--color-text-2)]">
            <span aria-hidden="true">🛏️</span>
            {LABELS.sleeps(hotel.groupSize)}
          </p>
        </div>
        <p className="text-right font-bold text-[var(--color-primary)]">
          {formatPrice(hotel.pricePerPerson)}
          <span className="text-sm font-normal text-[var(--color-text-2)]">
            {' '}
            {LABELS.perPerson}
          </span>
        </p>
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
