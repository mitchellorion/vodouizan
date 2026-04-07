const ALLOWED_ORIGINS = new Set([
  'https://vodouizan.com',
  'https://www.vodouizan.com',
  'http://localhost:8888',
  'http://localhost:3000',
]);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://vodouizan.com';
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default async (request) => {
  const origin = request.headers.get('origin') || '';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const KIMI_API_KEY = Netlify.env.get('KIMI_API_KEY');
  if (!KIMI_API_KEY) {
    return new Response(JSON.stringify({ error: 'KIMI_API_KEY not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    const res  = await fetch('https://api.moonshot.ai/v1/users/me/balance', {
      headers: { Authorization: `Bearer ${KIMI_API_KEY}` },
    });
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
};

export const config = { path: '/api/kimi-balance' };
