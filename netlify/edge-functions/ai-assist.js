const SYSTEM_PROMPTS = {
  write:
    'You are a skilled spiritual writer for Vodouizan — a website offering psychic readings, astrology, oracle sessions, and Vodou education. Write engaging, mystical, poetic content that is accessible and compelling.',
  edit:
    "You are a precise spiritual editor. Improve the clarity, flow, and style of the provided text while preserving the author's voice and spiritual tone. Return only the improved text with no commentary.",
  expand:
    'You are a creative spiritual writer. Expand the provided passage into a fuller, richer piece. Deepen the imagery and maintain the mystical tone.',
  summarize:
    'You are a concise editor. Summarize the provided text into a compelling 2-3 sentence excerpt suitable for a blog preview.',
  research:
    'You are a knowledgeable researcher in spirituality, astrology, Vodou, divination, and metaphysics. Provide accurate, well-structured information on the requested topic.',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    console.log('[ai-assist] Request received', request.method);

    const KIMI_API_KEY = Netlify.env.get('KIMI_API_KEY');
    if (!KIMI_API_KEY) {
      console.error('[ai-assist] KIMI_API_KEY not set');
      return jsonResponse({ error: 'KIMI_API_KEY not configured in Netlify environment variables.' }, 500);
    }
    console.log('[ai-assist] API key present, length:', KIMI_API_KEY.length);

    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[ai-assist] JSON parse error:', parseErr.message);
      return jsonResponse({ error: 'Invalid JSON in request body.' }, 400);
    }

    const { prompt, mode } = body;
    console.log('[ai-assist] mode:', mode, '| prompt length:', prompt?.length);

    if (!prompt || typeof prompt !== 'string' || prompt.length > 6000) {
      return jsonResponse({ error: 'Invalid or missing prompt.' }, 400);
    }

    const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.write;
    console.log('[ai-assist] Using system prompt for mode:', mode ?? 'write (default)');

    let kimiResponse;
    try {
      console.log('[ai-assist] Calling Kimi API...');
      kimiResponse = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KIMI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'kimi-k2.5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          stream: true,
          max_tokens: 2048,
          temperature: 0.72,
        }),
      });
    } catch (fetchErr) {
      console.error('[ai-assist] Fetch to Kimi failed:', fetchErr.message);
      return jsonResponse({ error: `Failed to reach Kimi API: ${fetchErr.message}` }, 502);
    }

    console.log('[ai-assist] Kimi response status:', kimiResponse.status);

    if (!kimiResponse.ok) {
      const errText = await kimiResponse.text().catch(() => 'unknown');
      console.error('[ai-assist] Kimi API error:', kimiResponse.status, errText);
      return jsonResponse({ error: `Kimi API error ${kimiResponse.status}: ${errText}` }, 502);
    }

    console.log('[ai-assist] Streaming response back to client');
    return new Response(kimiResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    console.error('[ai-assist] Unhandled exception:', err.message, err.stack);
    return jsonResponse({ error: `Edge function exception: ${err.message}` }, 500);
  }
};

export const config = { path: '/api/ai-assist' };
