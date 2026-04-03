const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.ico':  'image/x-icon',
};

const VALID_SIGNS = new Set([
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
]);

// Simple in-memory rate limiter: max 30 requests per IP per minute
const rateLimiter = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimiter.get(ip) || { count: 0, reset: now + 60000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60000; }
  entry.count++;
  rateLimiter.set(ip, entry);
  return entry.count > 30;
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

http.createServer((req, res) => {
  const ip = req.socket.remoteAddress;
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Proxy: /api/horoscope/:sign
  if (url.pathname.startsWith('/api/horoscope/')) {
    if (isRateLimited(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
      res.end(JSON.stringify({ error: 'Too many requests' }));
      return;
    }

    const sign = url.pathname.split('/')[3]?.toLowerCase();
    if (!sign || !VALID_SIGNS.has(sign)) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
      res.end(JSON.stringify({ error: 'Invalid zodiac sign' }));
      return;
    }

    const apiUrl = `https://ohmanda.com/api/horoscope/${encodeURIComponent(sign)}/`;
    https.get(apiUrl, { headers: { 'Accept': 'application/json' } }, apiRes => {
      let data = '';
      apiRes.on('data', c => data += c);
      apiRes.on('end', () => {
        // Validate the response is JSON with expected shape before forwarding
        try {
          const parsed = JSON.parse(data);
          if (typeof parsed.horoscope !== 'string') throw new Error('unexpected shape');
          const safe = JSON.stringify({ sign: parsed.sign, date: parsed.date, horoscope: parsed.horoscope });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'http://localhost:3000', ...SECURITY_HEADERS });
          res.end(safe);
        } catch {
          res.writeHead(502, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
          res.end(JSON.stringify({ error: 'Service unavailable' }));
        }
      });
    }).on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
      res.end(JSON.stringify({ error: 'Service unavailable' }));
    });
    return;
  }

  // Static files
  let filePath;
  try {
    filePath = path.join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  } catch {
    res.writeHead(400, SECURITY_HEADERS); res.end(); return;
  }

  // Prevent directory traversal
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403, SECURITY_HEADERS); res.end(); return;
  }

  // Block sensitive file types from being served
  const ext = path.extname(filePath).toLowerCase();
  const blocked = new Set(['.sqlite', '.db', '.env', '.json', '.log', '.sh', '.key', '.pem']);
  if (blocked.has(ext)) {
    res.writeHead(403, SECURITY_HEADERS); res.end(); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, SECURITY_HEADERS); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', ...SECURITY_HEADERS });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
