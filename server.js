import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// ---------- config / secrets ----------
let configLogged = false;

export function loadConfig({ env = process.env, secretsPath } = {}) {
  const file = secretsPath || env.SECRETS_FILE || path.join(os.homedir(), '.secrets', 'salon-radio.json');
  let fileCfg = {};
  try {
    const raw = fs.readFileSync(file, 'utf8');
    fileCfg = JSON.parse(raw);
    if (!fileCfg || typeof fileCfg !== 'object') fileCfg = {};
  } catch {
    // missing or broken file → empty values (never log contents)
    fileCfg = {};
  }
  return {
    llmApiKey: env.LLM_API_KEY || env.SOKET_API_KEY || fileCfg.llmApiKey || fileCfg.apiKey || '',
    llmBaseUrl: env.LLM_BASE_URL || fileCfg.llmBaseUrl || 'https://api.soket.ai/v1',
    llmModel: env.LLM_MODEL || fileCfg.llmModel || 'GLM-5.3',
    llmFallbackModel: env.LLM_FALLBACK_MODEL || fileCfg.llmFallbackModel || 'llama-3.1-8b-instruct',
    llmMaxTokens: Number(env.LLM_MAX_TOKENS || fileCfg.llmMaxTokens || 8000) || 8000
  };
}

function readBody(req, limit = 20 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        // Stop reading; the caller answers 413. Don't destroy the socket
        // so the client still gets the response.
        req.pause();
        reject(new Error('too-large'));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ---------- app ----------
export function createApp(options = {}) {
  const root = options.root || process.cwd();
  const fetchImpl = options.fetchImpl || fetch;
  const now = options.now || Date.now;
  const config = options.config || loadConfig();

  const aiOn = !!(config.llmApiKey && config.llmBaseUrl && config.llmModel);

  async function callLlm(messages) {
    const body = JSON.stringify({
      model: config.llmModel,
      messages,
      temperature: 0.8,
      max_tokens: config.llmMaxTokens
    });
    const headers = { 'Content-Type': 'application/json' };
    if (config.llmApiKey) headers.Authorization = `Bearer ${config.llmApiKey}`;

    const withTimeout = (ms) => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), ms);
      return { signal: ctl.signal, clear: () => clearTimeout(t) };
    };

    // Main model: 90 s timeout (GLM thinks ~30 s).
    {
      const { signal, clear } = withTimeout(90000);
      try {
        const r = await fetchImpl(`${config.llmBaseUrl}/chat/completions`, { method: 'POST', headers, body, signal });
        clear();
        if (r.ok) {
          const data = await r.json();
          const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (typeof content === 'string' && content.trim()) return { line: content.trim(), model: config.llmModel };
        }
      } catch { clear(); }
    }
    // Fallback model once: 20 s.
    if (config.llmFallbackModel) {
      const { signal, clear } = withTimeout(20000);
      try {
        const r = await fetchImpl(`${config.llmBaseUrl}/chat/completions`, {
          method: 'POST', headers,
          body: JSON.stringify({ model: config.llmFallbackModel, messages, temperature: 0.8, max_tokens: config.llmMaxTokens }),
          signal
        });
        clear();
        if (r.ok) {
          const data = await r.json();
          const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (typeof content === 'string' && content.trim()) return { line: content.trim(), model: config.llmFallbackModel };
        }
      } catch { clear(); }
    }
    return null;
  }

  async function handleDjPost(req, res) {
    let parsed;
    try {
      const raw = await readBody(req, 20 * 1024);
      parsed = JSON.parse(raw);
    } catch (e) {
      if (e && e.message === 'too-large') { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'too large' })); return; }
      res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'bad json' })); return;
    }
    // Validate fields and lengths.
    const clean = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);
    const song = parsed.song || {};
    const payload = {
      song: {
        title: clean(song.title, 120),
        film: clean(song.film, 120),
        year: Number(song.year) || undefined,
        singers: Array.isArray(song.singers) ? song.singers.filter((s) => typeof s === 'string').slice(0, 6).map((s) => s.slice(0, 60)) : [],
        composer: clean(song.composer, 80)
      },
      mood: clean(parsed.mood, 20),
      part: clean(parsed.part, 10),
      dedication: clean(parsed.dedication, 300),
      recentLines: Array.isArray(parsed.recentLines) ? parsed.recentLines.filter((s) => typeof s === 'string').slice(0, 15).map((s) => s.slice(0, 160)) : []
    };
    if (!payload.song.title) {
      res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'song.title required' })); return;
    }
    if (!aiOn) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, line: null, mode: 'builtin' }));
      return;
    }
    const { buildDjMessages } = await import('./src/dj.js');
    const result = await callLlm(buildDjMessages(payload));
    if (result) {
      const { parseDjReply } = await import('./src/dj.js');
      const line = parseDjReply(result.line);
      if (line) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, line, model: result.model }));
        return;
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, line: null, mode: 'builtin' }));
  }

  async function handleFarmaishPost(req, res) {
    let parsed;
    try {
      const raw = await readBody(req, 60 * 1024);
      parsed = JSON.parse(raw);
    } catch (e) {
      if (e && e.message === 'too-large') { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'too large' })); return; }
      res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'bad json' })); return;
    }
    const text = typeof parsed.text === 'string' ? parsed.text.slice(0, 300) : '';
    if (!text.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'text required' })); return;
    }
    // Keep a clean song list (ids only are trusted later).
    const songs = (Array.isArray(parsed.songs) ? parsed.songs : [])
      .filter((s) => s && typeof s === 'object' && typeof s.id === 'string')
      .slice(0, 200)
      .map((s) => ({
        id: s.id.slice(0, 80),
        title: typeof s.title === 'string' ? s.title.slice(0, 120) : '',
        film: typeof s.film === 'string' ? s.film.slice(0, 120) : '',
        year: Number(s.year) || undefined,
        singers: Array.isArray(s.singers) ? s.singers.filter((x) => typeof x === 'string').slice(0, 6).map((x) => x.slice(0, 60)) : [],
        composer: typeof s.composer === 'string' ? s.composer.slice(0, 80) : ''
      }));
    if (songs.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'songs required' })); return;
    }
    if (!aiOn) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, mode: 'builtin', songIds: [], reply: '' }));
      return;
    }
    const { buildFarmaishMessages, parseFarmaishReply } = await import('./src/moods.js');
    const result = await callLlm(buildFarmaishMessages({ text, songs }));
    if (result) {
      const parsed2 = parseFarmaishReply(result.line);
      if (parsed2) {
        // Keep only ids that exist in the given list, in order, no duplicates.
        const valid = new Set(songs.map((s) => s.id));
        const seen = new Set();
        const songIds = [];
        for (const id of parsed2.songIds) {
          if (valid.has(id) && !seen.has(id)) { seen.add(id); songIds.push(id); }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, songIds, reply: parsed2.reply, model: result.model }));
        return;
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, mode: 'builtin', songIds: [], reply: '' }));
  }

  async function handleAntakshariCheck(req, res) {
    let parsed;
    try {
      const raw = await readBody(req, 20 * 1024);
      parsed = JSON.parse(raw);
    } catch (e) {
      if (e && e.message === 'too-large') { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'too large' })); return; }
      res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'bad json' })); return;
    }
    const text = typeof parsed.text === 'string' ? parsed.text.slice(0, 200).trim() : '';
    const akshar = typeof parsed.akshar === 'string' ? parsed.akshar.slice(0, 3).toLowerCase() : '';
    if (!text || !akshar) {
      res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'text and akshar required' })); return;
    }
    if (!aiOn) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, valid: null, mode: 'builtin' }));
      return;
    }
    const headers = { 'Content-Type': 'application/json' };
    if (config.llmApiKey) headers.Authorization = `Bearer ${config.llmApiKey}`;
    const { buildCheckMessages, parseCheckReply, matchesAkshar } = await import('./src/antakshari.js');
    // FAST model only: a 30-second game can't wait for GLM's thinking.
    const messages = buildCheckMessages({ text, akshar });
    let result = null;
    if (config.llmFallbackModel) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 15000);
      try {
        const r = await fetchImpl(`${config.llmBaseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: config.llmFallbackModel, messages, temperature: 0.2, max_tokens: config.llmMaxTokens }),
          signal: ctl.signal
        });
        clearTimeout(t);
        if (r.ok) {
          const data = await r.json();
          const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (typeof content === 'string' && content.trim()) result = parseCheckReply(content);
        }
      } catch { clearTimeout(t); }
    }
    if (!result) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, valid: null, mode: 'builtin' }));
      return;
    }
    // The server double-checks the akshar itself and rejects a mismatch.
    if (result.valid && result.title && !matchesAkshar(result.title, akshar)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, valid: false, title: '', film: '', reason: `Yeh "${aksharLabelOf(akshar)}" se shuru nahi hota`, model: config.llmFallbackModel }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true, valid: result.valid, title: result.title, film: result.film,
      year: result.year, reason: result.reason, model: config.llmFallbackModel
    }));
  }

  function aksharLabelOf(a) {
    const D = { k: 'क', kh: 'ख', g: 'ग', gh: 'घ', ch: 'च', chh: 'छ', j: 'ज', jh: 'झ', t: 'त', th: 'थ', d: 'द', dh: 'ध', n: 'न', p: 'प', ph: 'फ', b: 'ब', bh: 'भ', m: 'म', y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', sh: 'श', h: 'ह', z: 'ज़', f: 'फ़', q: 'क़', a: 'अ', e: 'ए', i: 'इ', o: 'ओ', u: 'उ' };
    return D[a] || a.toUpperCase();
  }

  return async (req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

    if (urlPath === '/api/antakshari/check' && req.method === 'POST') {
      try { await handleAntakshariCheck(req, res); } catch { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'server error' })); }
      return;
    }
    if (urlPath === '/api/farmaish' && req.method === 'POST') {
      try { await handleFarmaishPost(req, res); } catch { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'server error' })); }
      return;
    }
    if (urlPath === '/api/config' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ai: aiOn }));
      return;
    }
    if (urlPath === '/api/dj' && req.method === 'POST') {
      try { await handleDjPost(req, res); } catch { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: 'server error' })); }
      return;
    }

    // static files
    let filePath;
    try {
      filePath = path.normalize(path.join(root, urlPath));
    } catch {
      res.writeHead(400); res.end('Bad request'); return;
    }
    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
      res.writeHead(403, { 'Content-Type': 'text/plain' }); res.end('Forbidden'); return;
    }
    fs.stat(filePath, (err, st) => {
      let target = filePath;
      if (!err && st.isDirectory()) target = path.join(filePath, 'index.html');
      fs.readFile(target, (err2, data) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return;
        }
        const ext = path.extname(target).toLowerCase();
        const type = TYPES[ext] || 'application/octet-stream';
        const headers = { 'Content-Type': type };
        if (['.html', '.js', '.mjs', '.css'].includes(ext)) headers['Cache-Control'] = 'no-cache';
        res.writeHead(200, headers); res.end(data);
      });
    });
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = process.env.PORT || 8086;
  const cfg = loadConfig();
  if (!configLogged) {
    configLogged = true;
    if (cfg.llmApiKey) console.log(`AI DJ: on (${cfg.llmModel}, backup ${cfg.llmFallbackModel})`);
    else console.log('AI DJ: off (built-in lines)');
  }
  http.createServer(createApp({ root: path.dirname(new URL(import.meta.url).pathname) }))
    .listen(port, () => console.log(`Rangeela Salon Radio on http://localhost:${port}`));
}
