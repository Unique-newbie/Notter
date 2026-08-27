import { NextResponse } from 'next/server';

const ZEN_QUOTES_URL =
  'https://zenquotes.io/api/quotes';

export async function GET() {
  try {
    const response = await fetch(
      ZEN_QUOTES_URL,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch quotes.',
        },
        {
          status: 502,
        }
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        {
          error: 'Invalid quote response.',
        },
        {
          status: 502,
        }
      );
    }

    const quotes = data
      .filter(
        (quote) =>
          typeof quote?.q === 'string' &&
          typeof quote?.a === 'string' &&
          quote.q.trim() &&
          quote.a.trim()
      )
      .map((quote) => ({
        q: quote.q.trim(),
        a: quote.a.trim(),
      }));

    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json(
      {
        error: 'Quote service unavailable.',
      },
      {
        status: 503,
      }
    );
  }
}