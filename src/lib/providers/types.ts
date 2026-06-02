export interface SearchQuery {
  skiSiteId: number;
  fromDate: string;
  toDate: string;
  groupSize: number;
}

export interface HotelResult {
  id: string;
  name: string;
  stars: number;
  location: string;
  pricePerPerson: number;
  imageUrl: string;
}

export interface SearchBatch {
  providerId: string;
  groupSize: number;
  hotels: HotelResult[];
}

export interface HotelProvider {
  readonly id: string;
  search(query: SearchQuery): AsyncIterable<HotelResult[]>;
}
