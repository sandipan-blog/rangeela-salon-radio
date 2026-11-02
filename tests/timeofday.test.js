import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partOfDay, greeting } from '../src/timeofday.js';

const T = (h, m) => new Date(2024, 5, 10, h, m);

test('partOfDay boundaries', () => {
  assert.equal(partOfDay(T(4, 59)), 'raat');
  assert.equal(partOfDay(T(5, 0)), 'subah');
  assert.equal(partOfDay(T(11, 59)), 'subah');
  assert.equal(partOfDay(T(12, 0)), 'dopahar');
  assert.equal(partOfDay(T(16, 29)), 'dopahar');
  assert.equal(partOfDay(T(16, 30)), 'shaam');
  assert.equal(partOfDay(T(19, 29)), 'shaam');
  assert.equal(partOfDay(T(19, 30)), 'raat');
  assert.equal(partOfDay(T(23, 59)), 'raat');
  assert.equal(partOfDay(T(0, 0)), 'raat');
});

test('greeting is deterministic for a given seed and matches the part', () => {
  const g1 = greeting('shaam', 'seed-x');
  assert.equal(g1, greeting('shaam', 'seed-x'));
  assert.ok(g1.length > 5);
  // All seeds return one of that part's lines.
  const shaamLines = new Set(['Shaam ho gayi, bulb jalao aur gaane ki volume thodi badhao.', 'Shaam ki hawa mein purane gaane aur bhi pyaare lagte hain.', 'Bazaar ki shaam, salon ki kursi aur radio ka gaana — life set hai.']);
  for (let i = 0; i < 50; i++) assert.ok(shaamLines.has(greeting('shaam', 's' + i)));
});

test('every part has at least 3 greetings and unknown parts fall back', () => {
  for (const p of ['subah', 'dopahar', 'shaam', 'raat']) {
    const seen = new Set();
    for (let i = 0; i < 100; i++) seen.add(greeting(p, 'k' + i));
    assert.ok(seen.size >= 3, `${p} has ${seen.size} greetings`);
  }
  assert.equal(typeof greeting('nonsense', 'x'), 'string');
});
