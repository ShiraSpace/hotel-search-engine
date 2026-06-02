export const TEST_IDS = {
  container: 'hotel-results-container',
  card: 'hotel-result-card',
  loadingIndicator: 'hotel-results-loading',
  emptyState: 'hotel-results-empty',
} as const;

export const LABELS = {
  loadingMore: 'Loading more results…',
  noResults: 'No hotels found. Try adjusting your search.',
  perPerson: '/per person',
  sleeps: (n: number): string => `Sleeps ${n}`,
} as const;
