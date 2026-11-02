import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanName, buildDedication, dedicationText, encodeDedication, decodeDedication
} from '../src/dedication.js';

const SONGS = [
  { id: 'pehla-nasha', title: 'Pehla Nasha', film: 'Jo Jeeta Wohi Sikandar', year: 1992 },
  { id: 'tujhe-dekha-to', title: 'Tujhe Dekha To', film: 'Dilwale Dulhania Le Jayenge', year: 1995 }
];

test('cleanName removes HTML/URLs, keeps Hindi and Bengali names', () => {
  assert.equal(cleanName('  Rahul   Verma '), 'Rahul Verma');
  assert.equal(cleanName('Rahul <script>x</script>'), 'Rahul script x script'); // only the <> chars go
  assert.equal(cleanName("Rahul\"';{}"), 'Rahul');
  assert.equal(cleanName('राहुल'), 'राहुल');          // Hindi survives
  assert.equal(cleanName('अनन्या कुमारी'), 'अनन्या कुमारी');
  assert.equal(cleanName('অনন্যা'), 'অনন্যা');         // Bengali survives
  assert.equal(cleanName('see http://spam.example now'), 'see now');
  assert.equal(cleanName('http://only-url.com'), '');
  assert.equal(cleanName('A'.repeat(40)), 'A'.repeat(24)); // cut to max
  assert.equal(cleanName('   '), '');
});

test('buildDedication: required fields, optional town default, cleaned names', () => {
  const bad1 = buildDedication({ from: '', town: 'Delhi', to: 'Priya', songId: 'x' });
  assert.equal(bad1.ok, false);
  assert.ok(bad1.error);
  const bad2 = buildDedication({ from: 'Rahul', to: '', songId: 'x' });
  assert.equal(bad2.ok, false);
  const bad3 = buildDedication({ from: 'Rahul', to: 'Priya', songId: '' });
  assert.equal(bad3.ok, false);

  const good = buildDedication({ from: 'Rahul <b>Verma</b>', town: '', to: 'Priya', songId: 'pehla-nasha' });
  assert.equal(good.ok, true);
  assert.deepEqual(good.data, { f: 'Rahul b Verma b', t: 'Priya', o: 'Jhumri Telaiya', s: 'pehla-nasha' });


  const withTown = buildDedication({ from: 'Rahul', town: ' Jhumri  Telaiya ', to: 'Priya', songId: 'pehla-nasha' });
  assert.equal(withTown.data.o, 'Jhumri Telaiya');
});

test('encode → decode round trip works', () => {
  const d = buildDedication({ from: 'राहुल', town: 'Jhumri Telaiya', to: 'অনন্যা', songId: 'pehla-nasha' }).data;
  const enc = encodeDedication(d);
  assert.ok(enc.length > 0);
  assert.ok(!/[+/=]/.test(enc)); // URL-safe
  assert.deepEqual(decodeDedication(enc), d);

  const d2 = buildDedication({ from: 'Rahul', town: 'Kanpur', to: 'Priya', songId: 'tujhe-dekha-to' }).data;
  assert.deepEqual(decodeDedication(encodeDedication(d2), SONGS), d2);
});

test('tampered strings, bad JSON, unknown songs give null', () => {
  assert.equal(decodeDedication(''), null);
  assert.equal(decodeDedication('!!!not-base64!!!'), null);
  assert.equal(decodeDedication(btoa('not json at all')), null);
  assert.equal(decodeDedication(btoa(JSON.stringify({ f: '', t: 'Priya', o: 'X', s: 'y' }))), null); // missing name after cleaning
  assert.equal(decodeDedication('A'.repeat(301)), null); // over 300 chars
  // unknown song when a list is given
  const d = buildDedication({ from: 'Rahul', to: 'Priya', songId: 'no-such-song' }).data;
  assert.equal(decodeDedication(encodeDedication(d), SONGS), null);
  // but valid without a list
  assert.ok(decodeDedication(encodeDedication(d)));
});

test('the same data always gives the same text variation; text has names, town and song', () => {
  const d = buildDedication({ from: 'Rahul', town: 'Jhumri Telaiya', to: 'Priya', songId: 'pehla-nasha' }).data;
  const song = SONGS[0];
  const a = dedicationText(d, song);
  const b = dedicationText(d, song);
  assert.equal(a, b); // deterministic
  assert.ok(a.includes('Rahul') && a.includes('Priya'));
  assert.ok(a.includes('Jhumri Telaiya'));
  assert.ok(a.includes('Pehla Nasha') && a.includes('Jo Jeeta Wohi Sikandar'));
  // different data can pick a different variation (all 3 exist in the bank)
  const texts = new Set();
  for (let i = 0; i < 60; i++) {
    const dd = buildDedication({ from: 'N' + i, town: 'T' + i, to: 'F' + i, songId: 'pehla-nasha' }).data;
    texts.add(dedicationText(dd, song));
  }
  assert.ok(texts.size >= 2, 'more than one variation should be reachable');
});
