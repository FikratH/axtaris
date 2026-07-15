// Supabase Edge Function: parse-resume
//
// Downloads a candidate's uploaded CV from Storage, extracts its plain text
// (PDF via unpdf, DOCX via fflate), and asks OpenAI to structure it into a
// strict JSON resume shape the app can pre-fill an editable profile with.
//
// The OpenAI key stays OFF the device. Only authenticated users may call it,
// and every call is metered by the shared `consume_ai_quota` RPC so parsing
// draws from the same AI_DAILY_LIMIT as ai-assist.
//
// Setup:
//   supabase secrets set OPENAI_API_KEY=sk-...        # required
//   supabase secrets set OPENAI_MODEL=gpt-4o-mini     # optional (default)
//   supabase functions deploy parse-resume
//
// The client treats any non-200 / {error} / {code} response as "no autofill"
// and falls back to null — so failures here are non-fatal to the upload flow.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_TEXT_CHARS = 12000;
const MIN_TEXT_CHARS = 40;

const SYSTEM_PROMPT = [
  'You extract structured data from a resume/CV. Output ONLY a single JSON object,',
  'no markdown, matching exactly this shape:',
  '{',
  '  "title": string,',
  '  "bio": string,',
  '  "skills": string[],',
  '  "experience": [{ "jobTitle": string, "company": string, "location": string, "startDate": string, "endDate": string|null, "isCurrent": boolean, "description": string }],',
  '  "education": [{ "degree": string, "fieldOfStudy": string, "institution": string, "startDate": string, "endDate": string|null, "isCurrent": boolean, "description": string }],',
  '  "languages": [{ "language": string, "level": string }]',
  '}',
  'Rules:',
  '- Dates MUST be formatted YYYY-MM-DD. Use 01 for an unknown month or day (e.g. 2019 -> 2019-01-01, 2019-06 -> 2019-06-01).',
  '- For an ongoing role/study set endDate to null and isCurrent to true.',
  '- "level" MUST be strictly one of: beginner, intermediate, advanced, native.',
  '- Reply using the CV\'s own language for free-text fields (title, bio, descriptions).',
  '- If a field is unknown, use an empty string (or empty array). Never invent facts.',
  '- Output JSON only.',
].join('\n');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    // Verify the caller is a real signed-in user (anon client + caller JWT).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: 'Unauthorized' }, 401);

    // Shared per-user daily quota (same gate as ai-assist).
    const dailyLimit = Number(Deno.env.get('AI_DAILY_LIMIT') || '30');
    const { data: allowed, error: quotaError } = await supabase.rpc('consume_ai_quota', {
      daily_limit: dailyLimit,
    });
    if (quotaError) return json({ error: quotaError.message }, 500);
    if (allowed === false) return json({ error: 'Daily AI limit reached' }, 429);

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return json({ error: 'OPENAI_API_KEY is not configured' }, 503);

    const body = await req.json().catch(() => ({}));
    const bucket: string = (body.bucket ?? 'cv-uploads').toString();
    const path: string = (body.path ?? '').toString();
    const fileName: string = (body.fileName ?? '').toString();
    if (!path) return json({ error: 'path is required' }, 400);

    const lower = `${fileName || ''} ${path}`.toLowerCase();
    const isPdf = lower.includes('.pdf');
    const isDocx = lower.includes('.docx');
    const isLegacyDoc = !isDocx && lower.includes('.doc');

    if (isLegacyDoc) return json({ code: 'legacy_doc' }, 415);
    if (!isPdf && !isDocx) return json({ error: 'unsupported_file_type' }, 415);

    // Service-role client can read the private cv-uploads bucket.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: blob, error: downloadError } = await admin.storage.from(bucket).download(path);
    if (downloadError || !blob) {
      return json({ error: downloadError?.message || 'download_failed' }, 502);
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());

    let text = '';
    if (isPdf) {
      const { getDocumentProxy, extractText } = await import('https://esm.sh/unpdf');
      const pdf = await getDocumentProxy(bytes);
      const extracted = await extractText(pdf, { mergePages: true });
      text = Array.isArray(extracted.text) ? extracted.text.join('\n') : extracted.text;
    } else {
      const { unzipSync, strFromU8 } = await import('https://esm.sh/fflate');
      const files = unzipSync(bytes);
      const docXml = files['word/document.xml'];
      if (!docXml) return json({ code: 'no_text' }, 200);
      text = strFromU8(docXml)
        .replace(/<\/w:p>/g, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/g, ' ');
    }

    // Normalize whitespace.
    text = text.replace(/[ \t\f\v]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    // Scanned / image-only PDF (no embedded text) — nothing to parse.
    if (text.length < MIN_TEXT_CHARS) return json({ code: 'no_text' }, 200);

    if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);

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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Resume text:\n\n${text}` },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      return json({ error: `OpenAI error: ${errText.slice(0, 300)}` }, 502);
    }

    const completion = await openaiResp.json();
    const content = completion?.choices?.[0]?.message?.content ?? '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ error: 'invalid_model_output' }, 502);
    }

    return json({ data: parsed }, 200);
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
