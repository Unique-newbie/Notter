import { NextRequest, NextResponse } from 'next/server';
import { extractViaProvider } from '@/lib/ai/providers/unifiedProviderEngine';
import { ExistingEntitiesContext } from '@/lib/ai/validator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      chapterText,
      chapterTitle,
      chapterNumber,
      providerId: clientProviderId,
      apiKey: clientApiKey,
      model: clientModel,
      baseUrl: clientBaseUrl,
      context: existingContext
    } = body;

    if (!chapterText || chapterText.trim().length === 0) {
      return NextResponse.json({ error: 'Chapter content is required' }, { status: 400 });
    }

    const context: ExistingEntitiesContext = existingContext || {
      characters: [],
      abilities: [],
      items: [],
      locations: [],
      organizations: []
    };

    let providerId = clientProviderId || 'gemini';
    let apiKey = clientApiKey || process.env.GEMINI_API_KEY || '';
    let model = clientModel || 'gemini-1.5-flash';
    let baseUrl = clientBaseUrl;

    if (!apiKey && providerId !== 'ollama' && providerId !== 'lmstudio') {
      return NextResponse.json({
        error: 'No API Key configured. Please configure an API Key under Settings or provide one in your request.'
      }, { status: 401 });
    }

    const result = await extractViaProvider({
      providerId,
      apiKey,
      model,
      baseUrl,
      chapterText,
      chapterTitle,
      chapterNumber,
      context
    });

    return NextResponse.json({ extraction: result.extraction, source: result.source });
  } catch (error: any) {
    console.error('[API analyze-chapter] Exception:', error);
    return NextResponse.json({
      error: error.message || 'Internal AI Extraction Error'
    }, { status: 500 });
  }
}
