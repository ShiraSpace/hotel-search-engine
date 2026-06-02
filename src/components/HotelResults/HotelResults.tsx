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
      className="flex overflow-hidden bg-[var(--color-surface)] rounded-[var(--radius-card)] transition-shadow duration-200"
      style={{ boxShadow: 'var(--shadow-card)' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <img
        src={hotel.imageUrl}
        alt={hotel.name}
        className="object-cover flex-shrink-0"
        style={{ width: '218px', height: '160px' }}
      />
      <div className="flex flex-col justify-between flex-1 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-[var(--color-text)] leading-tight">{hotel.name}</h3>
          <StarRating count={hotel.stars} />
          <p className="text-sm text-[var(--color-text-2)] flex items-center gap-1">
            <span aria-hidden="true">📍</span>
            {hotel.location}
          </p>
        </div>
        <p className="text-right font-bold text-[var(--color-primary)]">
          {formatPrice(hotel.pricePerPerson)}
          <span className="font-normal text-[var(--color-text-2)] text-sm"> {LABELS.perPerson}</span>
        </p>
      </div>
    </article>
  );
}

export function HotelResults({ results, isLoading }: HotelResultsProps): JSX.Element {
  const showEmpty = !isLoading && results.length === 0;

  return (
    <section data-testid={TEST_IDS.container} className="flex flex-col gap-4">
      {results.map((hotel) => (
        <HotelCard key={hotel.id} hotel={hotel} />
      ))}

      {isLoading && (
        <p data-testid={TEST_IDS.loadingIndicator} className="text-center text-sm text-[var(--color-text-2)] py-4">
          {LABELS.loadingMore}
        </p>
      )}

      {showEmpty && (
        <p data-testid={TEST_IDS.emptyState} className="text-center text-sm text-[var(--color-text-2)] py-8">
          {LABELS.noResults}
        </p>
      )}
    </section>
  );
}
