import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createApp, loadConfig } from '../server.js';

function listen(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler);
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}
function request(port, method, p, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: p, headers }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const SONG_BODY = JSON.stringify({
  song: { title: 'Tujhe Dekha To', film: 'Dilwale Dulhania Le Jayenge', year: 1995, singers: ['Lata Mangeshkar', 'Kumar Sanu'], composer: 'Jatin-Lalit' },
  mood: 'romance', part: 'shaam'
});

// A fake fetch that answers like the LLM API.
function fakeFetchOk(content, calls = []) {
  return async (url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body) });
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content } }] })
    };
  };
}

test('loadConfig reads a temp file and env overrides win', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g6-'));
  const f = path.join(dir, 'secrets.json');
  fs.writeFileSync(f, JSON.stringify({ llmApiKey: 'file-key', llmModel: 'GLM-9.9', llmBaseUrl: 'https://example.com/v1' }));
  const cfg = loadConfig({ env: {}, secretsPath: f });
  assert.equal(cfg.llmApiKey, 'file-key');
  assert.equal(cfg.llmModel, 'GLM-9.9');
  assert.equal(cfg.llmBaseUrl, 'https://example.com/v1');
  const cfg2 = loadConfig({ env: { LLM_API_KEY: 'env-key', LLM_MODEL: 'GLM-5.3' }, secretsPath: f });
  assert.equal(cfg2.llmApiKey, 'env-key');
  assert.equal(cfg2.llmModel, 'GLM-5.3');
  // missing file → empty values
  const cfg3 = loadConfig({ env: {}, secretsPath: path.join(dir, 'nope.json') });
  assert.equal(cfg3.llmApiKey, '');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('/api/dj returns the parsed line (fake fetch)', async () => {
  const calls = [];
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: 'k', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: fakeFetchOk('{"line": "Arre shaam ka mausam aur yeh gaana — perfect jodi!"}', calls)
  }));
  const r = await request(port, 'POST', '/api/dj', SONG_BODY, { 'Content-Type': 'application/json' });
  assert.equal(r.status, 200);
  const j = JSON.parse(r.body);
  assert.equal(j.ok, true);
  assert.equal(j.line, 'Arre shaam ka mausam aur yeh gaana — perfect jodi!');
  assert.equal(j.model, 'GLM-5.3');
  // request shape: chat/completions with messages, no non-standard fields
  assert.ok(calls[0].url.endsWith('/chat/completions'));
  assert.ok(Array.isArray(calls[0].body.messages));
  assert.equal(calls[0].body.temperature, 0.8);
  assert.ok(!('reasoning_effort' in calls[0].body) && !('enable_thinking' in calls[0].body));
  srv.close();
});

test('empty content with only reasoning_content falls back, then builtin', async () => {
  // main model returns empty content; fallback returns a good line
  const calls = [];
  let n = 0;
  const fetchImpl = async (url, opts) => {
    n++;
    calls.push(JSON.parse(opts.body).model);
    if (n === 1) return { ok: true, json: async () => ({ choices: [{ message: { content: '', reasoning_content: 'thinking...' } }] }) };
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"line":"Fallback line from backup model."}' } }] }) };
  };
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: 'k', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'llama-3.1-8b-instruct', llmMaxTokens: 8000 },
    fetchImpl
  }));
  const r = await request(port, 'POST', '/api/dj', SONG_BODY, { 'Content-Type': 'application/json' });
  const j = JSON.parse(r.body);
  assert.equal(j.line, 'Fallback line from backup model.');
  assert.equal(j.model, 'llama-3.1-8b-instruct');
  assert.deepEqual(calls, ['GLM-5.3', 'llama-3.1-8b-instruct']);
  srv.close();

  // both fail → builtin
  const { srv: s2, port: p2 } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: 'k', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: async () => { throw new Error('network down'); }
  }));
  const r2 = await request(p2, 'POST', '/api/dj', SONG_BODY, { 'Content-Type': 'application/json' });
  const j2 = JSON.parse(r2.body);
  assert.equal(j2.ok, true);
  assert.equal(j2.mode, 'builtin');
  assert.equal(j2.line, null);
  s2.close();
});

test('no key → builtin without calling fetch', async () => {
  let called = false;
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: '', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: async () => { called = true; return { ok: false }; }
  }));
  const r = await request(port, 'POST', '/api/dj', SONG_BODY, { 'Content-Type': 'application/json' });
  const j = JSON.parse(r.body);
  assert.equal(j.mode, 'builtin');
  assert.equal(called, false);
  srv.close();
});

test('/api/config reports ai on/off and never a secret', async () => {
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: 'super-secret-key', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 }
  }));
  const r = await request(port, 'GET', '/api/config');
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(r.body).ai, true);
  assert.ok(!r.body.includes('super-secret-key'));
  srv.close();

  const { srv: s2, port: p2 } = await listen(createApp({ root: process.cwd(), config: { llmApiKey: '' } }));
  const r2 = await request(p2, 'GET', '/api/config');
  assert.equal(JSON.parse(r2.body).ai, false);
  s2.close();
});

// ---------- STEP 10: /api/farmaish ----------

const FARMAISH_BODY = JSON.stringify({
  text: 'Kumar Sanu ke gaane chalao',
  songs: [
    { id: 'a', title: 'Song A', film: 'Film A', year: 1995, singers: ['Kumar Sanu'], composer: 'X', moods: ['romance'] },
    { id: 'b', title: 'Song B', film: 'Film B', year: 1999, singers: ['Kumar Sanu'], composer: 'Y', moods: ['dard'] },
    { id: 'c', title: 'Song C', film: 'Film C', year: 2001, singers: ['Sonu Nigam'], composer: 'Z', moods: ['masti'] }
  ]
});

test('/api/farmaish keeps only valid ids, drops duplicates and unknown ids (fake fetch)', async () => {
  const calls = [];
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: 'k', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: fakeFetchOk('{"songIds":["b","nope","a","b","c"],"reply":"Kumar Sanu ki yaadein aa gayi, line laga di!"}', calls)
  }));
  const r = await request(port, 'POST', '/api/farmaish', FARMAISH_BODY, { 'Content-Type': 'application/json' });
  assert.equal(r.status, 200);
  const j = JSON.parse(r.body);
  assert.equal(j.ok, true);
  assert.deepEqual(j.songIds, ['b', 'a', 'c']); // order kept, no dupes, "nope" dropped
  assert.match(j.reply, /Kumar Sanu/);
  assert.equal(j.model, 'GLM-5.3');
  assert.ok(calls[0].url.endsWith('/chat/completions'));
  assert.ok(Array.isArray(calls[0].body.messages));
  srv.close();
});

test('/api/farmaish with no key → builtin without calling fetch', async () => {
  let called = false;
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: '', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: async () => { called = true; return { ok: false }; }
  }));
  const r = await request(port, 'POST', '/api/farmaish', FARMAISH_BODY, { 'Content-Type': 'application/json' });
  const j = JSON.parse(r.body);
  assert.equal(j.mode, 'builtin');
  assert.equal(called, false);
  srv.close();
});

test('/api/farmaish: LLM failure → builtin; bad body → 400', async () => {
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: 'k', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: async () => { throw new Error('down'); }
  }));
  const r = await request(port, 'POST', '/api/farmaish', FARMAISH_BODY, { 'Content-Type': 'application/json' });
  const j = JSON.parse(r.body);
  assert.equal(j.mode, 'builtin');
  const r2 = await request(port, 'POST', '/api/farmaish', '{bad', { 'Content-Type': 'application/json' });
  assert.equal(r2.status, 400);
  const r3 = await request(port, 'POST', '/api/farmaish', JSON.stringify({ text: 'x' }), { 'Content-Type': 'application/json' });
  assert.equal(r3.status, 400); // no songs
  srv.close();
});

test('oversized /api/farmaish body → 413', async () => {
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: 'k', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: fakeFetchOk('{"songIds":[],"reply":"x"}')
  }));
  const big = JSON.stringify({ text: 'x'.repeat(70 * 1024), songs: [] });
  const r = await request(port, 'POST', '/api/farmaish', big, { 'Content-Type': 'application/json' });
  assert.equal(r.status, 413);
  srv.close();
});

test('oversized body → 413; bad json → 400; static still works', async () => {
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: 'k', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: fakeFetchOk('{"line":"x"}')
  }));
  const big = JSON.stringify({ song: { title: 'x'.repeat(30 * 1024) } });
  const r1 = await request(port, 'POST', '/api/dj', big, { 'Content-Type': 'application/json' });
  assert.equal(r1.status, 413);
  const r2 = await request(port, 'POST', '/api/dj', '{not json', { 'Content-Type': 'application/json' });
  assert.equal(r2.status, 400);
  const r3 = await request(port, 'GET', '/');
  assert.equal(r3.status, 200);
  assert.ok(r3.body.includes('id="scene"'));
  srv.close();
});

// ---------- STEP 15: /api/antakshari/check ----------
const AI_CFG = { llmApiKey: 'k', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'llama-3.1-8b-instruct', llmMaxTokens: 8000 };

test('/api/antakshari/check: valid song, uses the FAST model only', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body) });
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"valid":true,"title":"Pehla Nasha","film":"Jo Jeeta Wohi Sikandar","year":1992,"reason":"Sahi jawab!"}' } }] }) };
  };
  const { srv, port } = await listen(createApp({ root: process.cwd(), config: AI_CFG, fetchImpl }));
  const r = await request(port, 'POST', '/api/antakshari/check',
    JSON.stringify({ text: 'pehla nasha', akshar: 'p' }), { 'Content-Type': 'application/json' });
  assert.equal(r.status, 200);
  const j = JSON.parse(r.body);
  assert.equal(j.ok, true);
  assert.equal(j.valid, true);
  assert.equal(j.title, 'Pehla Nasha');
  assert.equal(j.model, 'llama-3.1-8b-instruct');   // the fast model, not GLM
  assert.equal(calls.length, 1);                    // exactly one call
  assert.ok(Array.isArray(calls[0].body.messages));
  srv.close();
});

test('/api/antakshari/check: akshar mismatch is rejected by the server itself', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '{"valid":true,"title":"Tujhe Dekha To","film":"DDLJ","year":1995,"reason":"real song"}' } }] })
  });
  const { srv, port } = await listen(createApp({ root: process.cwd(), config: AI_CFG, fetchImpl }));
  // "t" does not start with p → the server must reject it even though the LLM said valid.
  const r = await request(port, 'POST', '/api/antakshari/check',
    JSON.stringify({ text: 'tujhe dekha to', akshar: 'p' }), { 'Content-Type': 'application/json' });
  const j = JSON.parse(r.body);
  assert.equal(j.valid, false);
  assert.equal(j.title, '');
  srv.close();
});

test('/api/antakshari/check: no key → builtin without calling fetch; failure → builtin', async () => {
  let called = false;
  const { srv, port } = await listen(createApp({
    root: process.cwd(),
    config: { llmApiKey: '', llmBaseUrl: 'https://fake/v1', llmModel: 'GLM-5.3', llmFallbackModel: 'fb', llmMaxTokens: 8000 },
    fetchImpl: async () => { called = true; return { ok: false }; }
  }));
  const r = await request(port, 'POST', '/api/antakshari/check',
    JSON.stringify({ text: 'pehla nasha', akshar: 'p' }), { 'Content-Type': 'application/json' });
  const j = JSON.parse(r.body);
  assert.equal(j.ok, true);
  assert.equal(j.valid, null);
  assert.equal(j.mode, 'builtin');
  assert.equal(called, false);
  // bad body → 400
  const r2 = await request(port, 'POST', '/api/antakshari/check', '{bad', { 'Content-Type': 'application/json' });
  assert.equal(r2.status, 400);
  srv.close();

  // fetch throws → builtin, never a crash
  const { srv: s2, port: p2 } = await listen(createApp({
    root: process.cwd(), config: AI_CFG, fetchImpl: async () => { throw new Error('down'); }
  }));
  const r3 = await request(p2, 'POST', '/api/antakshari/check',
    JSON.stringify({ text: 'x', akshar: 'p' }), { 'Content-Type': 'application/json' });
  const j3 = JSON.parse(r3.body);
  assert.equal(j3.valid, null);
  assert.equal(j3.mode, 'builtin');
  s2.close();
});
