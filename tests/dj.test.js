import { test } from 'node:test';
import assert from 'node:assert/strict';
import { introFor, shouldTalk, createTalkPolicy } from '../src/dj.js';

const SONG = {
  id: 'tujhe-dekha-to', title: 'Tujhe Dekha To', film: 'Dilwale Dulhania Le Jayenge',
  year: 1995, singers: ['Lata Mangeshkar', 'Kumar Sanu'], composer: 'Jatin-Lalit'
};

function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('introFor contains title, film, year and singers', () => {
  const text = introFor(SONG, {});
  assert.ok(text.includes(SONG.title));
  assert.ok(text.includes(SONG.film));
  assert.ok(text.includes(String(SONG.year)));
  assert.ok(text.includes('Lata Mangeshkar'));
  assert.ok(text.includes('Kumar Sanu'));
});

test('introFor stays under 300 characters', () => {
  for (let i = 0; i < 20; i++) {
    const line = 'x'.repeat(i * 20);
    const text = introFor(SONG, { line });
    assert.ok(text.length <= 300, `len ${text.length}`);
  }
});

test('introFor puts the dedication first', () => {
  const ded = 'Yeh farmaish aayi hai Jhumri Telaiya se Rahul ki taraf se Priya ke liye.';
  const text = introFor(SONG, { dedication: ded, line: 'Ek khoobsurat shaam hai.' });
  assert.ok(text.startsWith(ded));
  assert.ok(text.includes(SONG.title));
});

test('shouldTalk talks before the first song', () => {
  assert.equal(shouldTalk(0, seeded(1)), true);
  assert.equal(shouldTalk(1, seeded(1)), true);
});

test('shouldTalk follows its rules with a seeded rng', () => {
  // With rng always < .5 → always talk after the first song.
  assert.equal(shouldTalk(2, () => 0.1), true);
  // With rng always >= .5 → silent after the first song.
  assert.equal(shouldTalk(2, () => 0.9), false);
});

test('policy never stays silent more than 3 times in a row', () => {
  const policy = createTalkPolicy({ rng: () => 0.99 }); // always "silent" by rng
  let streak = 0;
  for (let i = 1; i <= 30; i++) {
    if (policy.next(i)) streak = 0; else streak++;
    assert.ok(streak <= 3, `silent streak reached ${streak} at song ${i}`);
  }
});

// ---------- STEP 9: AI DJ helpers ----------
import { buildDjMessages, parseDjReply } from '../src/dj.js';

test('parseDjReply with clean JSON', () => {
  assert.equal(parseDjReply('{"line": "Chai ready hai, gaana bhi."}'), 'Chai ready hai, gaana bhi.');
});

test('parseDjReply with fenced JSON', () => {
  assert.equal(parseDjReply('```json\n{"line": "Fenced reply."}\n```'), 'Fenced reply.');
});

test('parseDjReply with JSON after prose', () => {
  assert.equal(parseDjReply('Yeh raha mera jawab: {"line": "Prose then JSON."} shukriya.'), 'Prose then JSON.');
});

test('parseDjReply with empty content returns null', () => {
  assert.equal(parseDjReply(''), null);
  assert.equal(parseDjReply(undefined), null);
  assert.equal(parseDjReply('no json here'), null);
  assert.equal(parseDjReply('{"line": ""}'), null);
  assert.equal(parseDjReply('{"other": 1}'), null);
});

test('parseDjReply cuts too-long lines at a word boundary', () => {
  const long = 'word '.repeat(50).trim(); // 250 chars
  const out = parseDjReply(`{"line": "${long}"}`);
  assert.ok(out.length <= 161);
  assert.ok(out.endsWith('…'));
});

test('parseDjReply rejects URLs and HTML', () => {
  assert.equal(parseDjReply('{"line": "Dekho https://example.com"}'), null);
  assert.equal(parseDjReply('{"line": "<b>bold</b>"}'), null);
  assert.equal(parseDjReply('{"line": "x > y"}'), null);
});

test('buildDjMessages includes song facts and recent lines', () => {
  const msgs = buildDjMessages({
    song: SONG,
    mood: 'romance',
    part: 'shaam',
    dedication: 'Rahul ki taraf se Priya ke liye',
    recentLines: ['pehla line', 'doosra line']
  });
  assert.equal(msgs[0].role, 'system');
  assert.ok(msgs[0].content.includes('Pappu Bhaiya'));
  assert.ok(msgs[0].content.includes('JSON'));
  const user = msgs[1].content;
  assert.ok(user.includes(SONG.title));
  assert.ok(user.includes(SONG.film));
  assert.ok(user.includes('Jatin-Lalit'));
  assert.ok(user.includes('Kumar Sanu'));
  assert.ok(user.includes('pehla line'));
  assert.ok(user.includes('Rahul ki taraf se'));
});
