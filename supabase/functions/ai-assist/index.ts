// Supabase Edge Function: ai-assist
//
// Server-side proxy to the OpenAI (ChatGPT) API. Keeps the API key OFF the
// device — the mobile/web client never sees it. Cost-effective by default:
// uses gpt-4o-mini and caps output tokens.
//
// Setup (where to paste the token):
//   supabase secrets set OPENAI_API_KEY=sk-...        # required
//   supabase secrets set OPENAI_MODEL=gpt-4o-mini     # optional (default)
//   supabase functions deploy ai-assist
//
// Only authenticated app users can call it (their JWT is verified), which
// prevents anonymous abuse of your OpenAI quota.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_OUTPUT_TOKENS = 800;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    // Verify the caller is a real signed-in user.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: 'Unauthorized' }, 401);

    // Per-user daily quota to prevent using this as a free general-purpose LLM.
    const dailyLimit = Number(Deno.env.get('AI_DAILY_LIMIT') || '30');
    const { data: allowed, error: quotaError } = await supabase.rpc('consume_ai_quota', {
      daily_limit: dailyLimit,
    });
    if (quotaError) return json({ error: quotaError.message }, 500);
    if (allowed === false) return json({ error: 'Daily AI limit reached' }, 429);

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return json({ error: 'OPENAI_API_KEY is not configured' }, 503);

    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt ?? '').toString();
    const system: string | undefined = body.system ? body.system.toString() : undefined;
    const maxTokens = Math.min(Number(body.maxTokens) || 400, MAX_OUTPUT_TOKENS);
    if (!prompt.trim()) return json({ error: 'prompt is required' }, 400);

    const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini';

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      return json({ error: `OpenAI error: ${errText.slice(0, 300)}` }, 502);
    }

    const data = await openaiResp.json();
    const text = (data?.choices?.[0]?.message?.content ?? '').trim();
    return json({ text }, 200);
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
