import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SALON_LINES, pickLine } from '../src/quotes.js';

function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('at least 60 lines, none over 160 characters', () => {
  assert.ok(SALON_LINES.length >= 60, `only ${SALON_LINES.length} lines`);
  for (const l of SALON_LINES) {
    assert.equal(typeof l.text, 'string');
    assert.ok(l.text.length > 0);
    assert.ok(l.text.length <= 160, `too long (${l.text.length}): ${l.text}`);
    assert.ok(['general','baarish','romance','masti','dard','roadtrip','chai','subah','dopahar','shaam','raat','antakshari'].includes(l.tag), `bad tag ${l.tag}`);
  }
});

test('every required tag group has at least 3 lines', () => {
  const groups = ['general','baarish','romance','masti','dard','roadtrip','chai','subah','dopahar','shaam','raat'];
  for (const g of groups) {
    const n = SALON_LINES.filter((l) => l.tag === g).length;
    assert.ok(n >= 3, `${g} has only ${n}`);
  }
});

test('pickLine respects tags', () => {
  for (let i = 0; i < 30; i++) {
    const line = pickLine({ tags: ['chai'], rng: seeded(i) });
    const match = SALON_LINES.find((l) => l.text === line);
    assert.equal(match.tag, 'chai');
  }
});

test('pickLine never returns a recent line', () => {
  const chaiLines = SALON_LINES.filter((l) => l.tag === 'chai').map((l) => l.text);
  const line = pickLine({ tags: ['chai'], recent: chaiLines, rng: seeded(1) });
  assert.ok(!chaiLines.includes(line)); // fell back to general
  assert.ok(SALON_LINES.some((l) => l.text === line));
});

test('pickLine falls back to general for unknown tags', () => {
  const line = pickLine({ tags: ['nonexistent'], rng: seeded(2) });
  const match = SALON_LINES.find((l) => l.text === line);
  assert.equal(match.tag, 'general');
});

test('pickLine with several tags prefers the first matching one', () => {
  const line = pickLine({ tags: ['dard', 'chai'], rng: seeded(3) });
  const match = SALON_LINES.find((l) => l.text === line);
  assert.equal(match.tag, 'dard');
});
