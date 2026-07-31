import { NextRequest, NextResponse } from 'next/server';
import { extractViaProvider } from '@/lib/ai/providers/unifiedProviderEngine';
import { ExistingEntitiesContext } from '@/lib/ai/validator';
import { createClient } from '@/lib/supabase/server';

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

    // If client didn't supply key, fetch active default BYOK key from Supabase for logged-in user
    if (!apiKey) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: keyRecord } = await supabase
            .from('user_api_keys')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_default', true)
            .single();

          if (keyRecord) {
            providerId = keyRecord.provider_id;
            apiKey = keyRecord.api_key_encrypted;
            model = keyRecord.default_model;
            baseUrl = keyRecord.base_url;
          }
        }
      } catch (err) {
        console.warn('Failed to load user BYOK key from Supabase:', err);
      }
    }

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
    console.error("AI Extraction Error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract chapter information' },
      { status: 500 }
    );
  }
}
