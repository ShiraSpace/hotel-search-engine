import type { HotelProvider, HotelResult, SearchQuery } from '../types';
import {
  SIMULATOR_ENDPOINT,
  PROVIDER_ID,
  MAIN_IMAGE_SENTINEL,
  formatDate,
  groupSizeRange,
} from './config';

interface SimulatorImage {
  URL: string;
  MainImage?: string;
}

interface SimulatorHotel {
  HotelCode: string;
  HotelName: string;
  HotelDescriptiveContent: {
    Images: SimulatorImage[];
  };
  HotelInfo: {
    Position: {
      Latitude: string;
      Longitude: string;
    };
    Rating: string;
    Beds: string;
  };
  PricesInfo: {
    AmountAfterTax: string;
    AmountBeforeTax: string;
  };
}

interface SimulatorResponse {
  statusCode: number;
  body: {
    success: string;
    accommodations: SimulatorHotel[];
  };
}

function mapHotel(raw: SimulatorHotel, groupSize: number): HotelResult {
  const mainImage = raw.HotelDescriptiveContent.Images.find(
    (img) => img.MainImage === MAIN_IMAGE_SENTINEL
  );
  const imageUrl =
    mainImage?.URL ?? raw.HotelDescriptiveContent.Images[0]?.URL ?? '';
  const { Latitude, Longitude } = raw.HotelInfo.Position;

  return {
    id: raw.HotelCode,
    name: raw.HotelName,
    stars: Number(raw.HotelInfo.Rating),
    location: `${Latitude}, ${Longitude}`,
    pricePerPerson: Number(raw.PricesInfo.AmountAfterTax),
    imageUrl,
    groupSize,
  };
}

async function fetchGroupSize(
  query: SearchQuery,
  groupSize: number
): Promise<HotelResult[]> {
  const res = await fetch(SIMULATOR_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: {
        ski_site: query.skiSiteId,
        from_date: formatDate(query.fromDate),
        to_date: formatDate(query.toDate),
        group_size: groupSize,
      },
    }),
  });
  if (!res.ok) throw new Error(`Simulator API error: ${res.status}`);
  const data: SimulatorResponse = await res.json();
  return (data.body.accommodations ?? []).map((h) => mapHotel(h, groupSize));
}

async function* search(query: SearchQuery): AsyncGenerator<HotelResult[]> {
  const sizes = groupSizeRange(query.groupSize);

  type Tagged = { value: HotelResult[]; self: Promise<Tagged> };
  const pending = new Set<Promise<Tagged>>();

  for (const size of sizes) {
    const p: Promise<Tagged> = fetchGroupSize(query, size).then((value) => ({
      value,
      self: p,
    }));
    pending.add(p);
  }

  while (pending.size > 0) {
    const { value, self } = await Promise.race(pending);
    pending.delete(self);
    yield value;
  }
}

export const hotelsSimulator: HotelProvider = {
  id: PROVIDER_ID,
  search,
};
