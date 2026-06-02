import { render, screen } from '@testing-library/react';
import { HotelResults } from './HotelResults';
import { TEST_IDS, LABELS } from './constants';
import type { HotelResult } from '@/lib/providers/types';

const makeHotel = (overrides: Partial<HotelResult>): HotelResult => ({
  id: '1',
  name: 'Test Hotel',
  stars: 3,
  location: 'Alps',
  pricePerPerson: 500,
  imageUrl: 'https://example.com/img.jpg',
  ...overrides,
});

const HOTELS: HotelResult[] = [
  makeHotel({ id: '3', name: 'Expensive Hotel', pricePerPerson: 1200 }),
  makeHotel({ id: '1', name: 'Cheap Hotel', pricePerPerson: 300 }),
  makeHotel({ id: '2', name: 'Mid Hotel', pricePerPerson: 750 }),
];

describe('HotelResults', () => {
  describe('with results', () => {
    beforeEach(() => {
      render(<HotelResults results={HOTELS} isLoading={false} />);
    });

    it('renders a card for each result', () => {
      expect(screen.getAllByTestId(TEST_IDS.card)).toHaveLength(3);
    });

    it('displays hotel names', () => {
      expect(screen.getByText('Cheap Hotel')).toBeInTheDocument();
      expect(screen.getByText('Mid Hotel')).toBeInTheDocument();
      expect(screen.getByText('Expensive Hotel')).toBeInTheDocument();
    });

    it('does not show loading indicator', () => {
      expect(
        screen.queryByTestId(TEST_IDS.loadingIndicator)
      ).not.toBeInTheDocument();
    });

    it('does not show empty state', () => {
      expect(screen.queryByTestId(TEST_IDS.emptyState)).not.toBeInTheDocument();
    });
  });

  describe('while loading with no results yet', () => {
    beforeEach(() => {
      render(<HotelResults results={[]} isLoading={true} />);
    });

    it('shows the loading indicator', () => {
      expect(screen.getByTestId(TEST_IDS.loadingIndicator)).toBeInTheDocument();
      expect(screen.getByText(LABELS.loadingMore)).toBeInTheDocument();
    });

    it('does not show empty state', () => {
      expect(screen.queryByTestId(TEST_IDS.emptyState)).not.toBeInTheDocument();
    });
  });

  describe('while loading with some results', () => {
    beforeEach(() => {
      render(<HotelResults results={HOTELS} isLoading={true} />);
    });

    it('shows cards and loading indicator simultaneously', () => {
      expect(screen.getAllByTestId(TEST_IDS.card)).toHaveLength(3);
      expect(screen.getByTestId(TEST_IDS.loadingIndicator)).toBeInTheDocument();
    });
  });

  describe('with no results and not loading', () => {
    beforeEach(() => {
      render(<HotelResults results={[]} isLoading={false} />);
    });

    it('shows empty state', () => {
      expect(screen.getByTestId(TEST_IDS.emptyState)).toBeInTheDocument();
      expect(screen.getByText(LABELS.noResults)).toBeInTheDocument();
    });
  });

  describe('price formatting', () => {
    beforeEach(() => {
      render(
        <HotelResults
          results={[makeHotel({ pricePerPerson: 1234 })]}
          isLoading={false}
        />
      );
    });

    it('formats price with £ symbol and comma separator', () => {
      expect(screen.getByText(/£1,234/)).toBeInTheDocument();
    });

    it('appends /per person label', () => {
      expect(screen.getByText(/\/per person/)).toBeInTheDocument();
    });
  });
});
