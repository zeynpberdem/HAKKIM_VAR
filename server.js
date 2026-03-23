const http = require('http');
const fs = require('fs');
const path = require('path');

// .env dosyasını yükle
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {}

const PORT = 3000;
const ROOT = path.join(__dirname, 'app');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

http.createServer(async (req, res) => {
  let urlPath = req.url.split('?')[0];
  const queryStr = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : '';

  // /api/upload — Supabase Storage'a proxy upload
  if (urlPath === '/api/upload' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        const contentType = req.headers['content-type'] || 'application/octet-stream';
        const fileName = req.headers['x-file-name'] || `${Date.now()}.jpg`;
        const fileBuffer = Buffer.concat(chunks);

        const sbRes = await fetch(`${supabaseUrl}/storage/v1/object/complaint-images/${fileName}`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': contentType,
            'x-upsert': 'false',
          },
          body: fileBuffer,
        });

        const sbText = await sbRes.text();
        if (!sbRes.ok) {
          res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: sbText }));
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/complaint-images/${fileName}`;
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ url: publicUrl }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // /api/generate — serverless fonksiyonu direkt çalıştır
  if (urlPath === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const handler = require('./api/generate').handler;
        const result = await handler({
          httpMethod: 'POST',
          headers: req.headers,
          body,
        });
        res.writeHead(result.statusCode || 200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          ...(result.headers || {}),
        });
        res.end(result.body);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // /api/geocode proxy
  if (urlPath === '/api/geocode') {
    const params = new URLSearchParams(queryStr);
    const q = params.get('q') || '';
    if (!q) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: 'Missing query' }));
    }
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=tr`;
      const r = await fetch(nominatimUrl, { headers: { 'Accept-Language': 'tr', 'User-Agent': 'HakkimVar/1.0' } });
      const data = await r.json();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found: ' + urlPath);
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
