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
    write:     'You are a thoughtful spiritual writer for Vodouizan — a website covering psychic readings, astrology, oracle sessions, and Vodou education. Write with an anthropological and ethnographic sensibility: grounded, respectful, and intellectually engaged. Treat spiritual traditions with cultural seriousness rather than spectacle.',
    edit:      "You are a precise editor with an anthropological sensibility. Improve the clarity, flow, and style of the provided text while preserving the author's voice and the cultural integrity of the subject matter. Return only the improved text.",
    expand:    'You are a thoughtful spiritual writer. Expand the provided text into a fuller, richer passage. Deepen the cultural and spiritual context while keeping the tone grounded and ethnographically honest.',
    summarize: 'You are a concise editor. Summarize the provided text into a short, compelling excerpt suitable for a blog preview (2-3 sentences max).',
    research:  'You are a knowledgeable researcher in spirituality, astrology, Vodou, divination, and metaphysics. Approach topics with anthropological rigor — providing accurate, culturally grounded, well-structured information on the requested topic.',
  };

  const systemPrompt = systemPrompts[mode] || systemPrompts.write;

  try {
    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
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
