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

function parseBody(body: unknown): SearchQuery | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Partial<SearchRequestBody>;
  if (
    typeof b.skiSiteId !== 'number' ||
    typeof b.fromDate !== 'string' ||
    typeof b.toDate !== 'string' ||
    typeof b.groupSize !== 'number'
  ) {
    return null;
  }
  return { skiSiteId: b.skiSiteId, fromDate: b.fromDate, toDate: b.toDate, groupSize: b.groupSize };
}

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.json().catch(() => null);
  const query = parseBody(body);

  if (!query) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
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
