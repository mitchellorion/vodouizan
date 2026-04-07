const SYSTEM_PROMPTS = {
  write:
    'You are a skilled spiritual writer for Vodouizan — a website offering psychic readings, astrology, oracle sessions, and Vodou education. Write engaging, mystical, poetic content that is accessible and compelling. Use evocative language that honors the spiritual traditions.',
  edit:
    'You are a precise spiritual editor. Improve the clarity, flow, and style of the provided text while preserving the author\'s voice and spiritual tone. Return only the improved text with no commentary.',
  expand:
    'You are a creative spiritual writer. Expand the provided passage into a fuller, richer piece. Deepen the imagery, add context, and maintain the mystical tone throughout.',
  summarize:
    'You are a concise editor. Summarize the provided text into a compelling 2–3 sentence excerpt suitable for a blog preview. Keep the spiritual tone and make it enticing.',
  research:
    'You are a knowledgeable researcher in spirituality, astrology, Vodou, divination, and metaphysics. Provide accurate, well-structured information on the requested topic. Be thorough but accessible.',
};

export default async (request) => {
  // CORS preflight
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
    return new Response('Method Not Allowed', { status: 405 });
  }

  const KIMI_API_KEY = Netlify.env.get('KIMI_API_KEY');
  if (!KIMI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API key not configured.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { prompt, mode } = body;
  if (!prompt || typeof prompt !== 'string' || prompt.length > 6000) {
    return new Response(
      JSON.stringify({ error: 'Invalid prompt.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.write;

  let kimiResponse;
  try {
    kimiResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
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
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to reach Kimi API.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!kimiResponse.ok) {
    const errText = await kimiResponse.text();
    console.error('Kimi API error:', errText);
    return new Response(
      JSON.stringify({ error: 'Kimi API returned an error.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Stream the SSE response directly to the client
  return new Response(kimiResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

export const config = { path: '/api/ai-assist' };
