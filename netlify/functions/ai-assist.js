exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const KIMI_API_KEY = process.env.KIMI_API_KEY;
  if (!KIMI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  const { prompt, mode } = body;
  if (!prompt || typeof prompt !== 'string' || prompt.length > 4000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid prompt.' }) };
  }

  const systemPrompts = {
    write:     'You are a skilled spiritual writer. Write engaging, mystical, and thoughtful content for Vodouizan — a spiritual practice website offering psychic readings, astrology, oracle, and Vodou education. Keep the tone poetic but accessible.',
    edit:      'You are a precise editor. Improve the clarity, flow, and style of the provided text while preserving the author\'s voice and spiritual tone. Return only the improved text.',
    expand:    'You are a creative writer. Expand the provided text into a fuller, richer passage. Keep the mystical and spiritual tone consistent.',
    summarize: 'You are a concise editor. Summarize the provided text into a short, compelling excerpt suitable for a blog preview (2-3 sentences max).',
    research:  'You are a knowledgeable spiritual researcher. Provide accurate, well-sourced information about the requested topic relating to spirituality, astrology, Vodou, divination, or metaphysics.',
  };

  const systemPrompt = systemPrompts[mode] || systemPrompts.write;

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-32k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Kimi API error:', err);
      return { statusCode: 502, body: JSON.stringify({ error: 'AI service unavailable.' }) };
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content;
    if (!result) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Empty response from AI.' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error.' }) };
  }
};
