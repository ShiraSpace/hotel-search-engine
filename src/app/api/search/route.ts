import { NextRequest } from 'next/server';
import { search } from '@/lib/search';
import { providers } from '@/lib/providers';
import type { SearchQuery } from '@/lib/providers/types';

interface SearchRequestBody {
  skiSiteId: number;
  fromDate: string;
  toDate: string;
  groupSize: number;
}

function parseBody(rawBody: unknown): SearchQuery | null {
  if (!rawBody || typeof rawBody !== 'object') return null;
  const b = rawBody as Partial<SearchRequestBody>;
  if (
    typeof b.skiSiteId !== 'number' ||
    typeof b.fromDate !== 'string' ||
    typeof b.toDate !== 'string' ||
    typeof b.groupSize !== 'number'
  ) {
    return null;
  }
  return {
    skiSiteId: b.skiSiteId,
    fromDate: b.fromDate,
    toDate: b.toDate,
    groupSize: b.groupSize,
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  const rawBody = await req.json().catch(() => null);
  const query = parseBody(rawBody);

  if (!query) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller): Promise<void> {
      const encoder = new TextEncoder();
      try {
        for await (const batch of search(query, providers)) {
          controller.enqueue(encoder.encode(JSON.stringify(batch) + '\n'));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
    },
  });
}
