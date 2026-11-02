import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQueue, dialFrequency } from '../src/queue.js';

// Seeded rng (mulberry32) for deterministic tests.
function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SONGS = Array.from({ length: 48 }, (_, i) => ({
  id: `song-${i}`,
  title: `Song ${i}`,
  moods: [i % 2 === 0 ? 'romance' : 'baarish']
}));

test('no repeats within the history window over 200 nexts', () => {
  const q = createQueue(SONGS, { rng: seeded(42), historySize: 10 });
  const seen = [];
  for (let i = 0; i < 200; i++) {
    const s = q.next();
    assert.ok(s);
    const last10 = seen.slice(-10);
    assert.ok(!last10.includes(s.id), `song ${s.id} repeated within window at step ${i}`);
    seen.push(s.id);
  }
});

test('a mood only gives that mood\'s songs', () => {
  const q = createQueue(SONGS, { mood: 'romance', rng: seeded(7) });
  for (let i = 0; i < 50; i++) {
    const s = q.next();
    assert.ok(s.moods.includes('romance'));
  }
});

test('setMood switches the pool', () => {
  const q = createQueue(SONGS, { rng: seeded(9) });
  q.setMood('baarish');
  for (let i = 0; i < 30; i++) assert.ok(q.next().moods.includes('baarish'));
  q.setMood(null);
  const all = new Set();
  for (let i = 0; i < 60; i++) all.add(q.next().id);
  assert.ok(all.size > 20);
});

test('requested songs come first and in order', () => {
  const q = createQueue(SONGS, { rng: seeded(3) });
  q.enqueue(['song-5', 'song-20', 'song-33']);
  assert.equal(q.next().id, 'song-5');
  assert.equal(q.next().id, 'song-20');
  assert.equal(q.next().id, 'song-33');
});

test('enqueue after playing puts songs next', () => {
  const q = createQueue(SONGS, { rng: seeded(11) });
  q.next();
  q.enqueue(['song-7']);
  assert.equal(q.peek()[0].id, 'song-7');
  assert.equal(q.next().id, 'song-7');
});

test('prev after next returns the previous song', () => {
  const q = createQueue(SONGS, { rng: seeded(5) });
  const a = q.next();
  const b = q.next();
  assert.notEqual(a.id, b.id);
  assert.equal(q.prev().id, a.id);
});

test('playNow plays it right away', () => {
  const q = createQueue(SONGS, { rng: seeded(13) });
  assert.equal(q.playNow('song-17').id, 'song-17');
  assert.equal(q.current().id, 'song-17');
});

test('skipBroken removes it from the rotation', () => {
  const q = createQueue(SONGS, { rng: seeded(21) });
  q.skipBroken('song-0');
  const ids = new Set();
  for (let i = 0; i < 300; i++) ids.add(q.next().id);
  assert.ok(!ids.has('song-0'));
});

test('skipBroken drops an enqueued song too', () => {
  const q = createQueue(SONGS, { rng: seeded(23) });
  q.enqueue(['song-4', 'song-9']);
  q.skipBroken('song-4');
  assert.equal(q.next().id, 'song-9');
});

test('the reshuffle never repeats the last song first', () => {
  const small = Array.from({ length: 3 }, (_, i) => ({ id: `s${i}`, moods: ['romance'] }));
  const q = createQueue(small, { rng: seeded(99), historySize: 2 });
  let last = q.next();
  // Drain the whole order so a reshuffle must happen.
  for (let i = 0; i < 40; i++) {
    const s = q.next();
    assert.ok(s);
    assert.notEqual(s.id, last.id, 'reshuffle repeated the last played song first');
    last = s;
  }
});

test('dialFrequency is stable, in range, with one decimal ending in odd digit', () => {
  const f1 = dialFrequency('tujhe-dekha-to');
  assert.equal(f1, dialFrequency('tujhe-dekha-to'));
  for (let i = 0; i < 200; i++) {
    const f = dialFrequency(`id-${i}`);
    assert.ok(f >= 88.1 && f <= 107.9, `${f} out of range`);
    const tenth = Math.round(f * 10);
    assert.equal(tenth % 2, 1, `${f} tenth not odd`);
    assert.equal(Math.round(f * 10), f * 10, `${f} has more than one decimal`);
  }
  // Different ids usually give different frequencies.
  const set = new Set(Array.from({ length: 60 }, (_, i) => dialFrequency(`id-${i}`)));
  assert.ok(set.size > 20);
});
