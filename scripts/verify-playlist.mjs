// Verifies every song's youtubeId with YouTube's oEmbed endpoint (no key needed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SONGS } from '../src/playlist.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outPath = path.join(root, 'scripts', 'verify-result.json');

async function check(id) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return { ok: false, status: res.status };
    const j = await res.json();
    return { ok: true, title: j.title, author: j.author_name };
  } catch (e) {
    return { ok: false, status: 'ERR ' + e.message };
  }
}

const ok = [];
const failed = [];
let anyFail = false;

for (const s of SONGS) {
  if (!s.youtubeId) continue; // unchecked songs (no id yet) are skipped
  const r = await check(s.youtubeId);
  if (r.ok) {
    console.log(`OK   ${s.id}  ${s.youtubeId}  ${r.title}  |  ${r.author}`);
    ok.push(s.youtubeId);
  } else {
    console.log(`FAIL ${s.id}  ${s.youtubeId}  HTTP ${r.status}`);
    failed.push({ id: s.id, youtubeId: s.youtubeId, status: r.status });
    anyFail = true;
  }
  await new Promise(r2 => setTimeout(r2, 300));
}

fs.writeFileSync(outPath, JSON.stringify({ checkedAt: new Date().toISOString(), ok, failed }, null, 2));
console.log(`\n${ok.length} OK, ${failed.length} FAIL (result written to scripts/verify-result.json)`);
process.exit(anyFail ? 1 : 0);
