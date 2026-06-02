import type { HotelProvider, HotelResult, SearchQuery } from '../providers/types';
import { mergeAsyncIterables } from './mergeAsyncIterables';

export function search(query: SearchQuery, providers: HotelProvider[]): AsyncIterable<HotelResult[]> {
  return mergeAsyncIterables(providers.map((p) => p.search(query)));
}
