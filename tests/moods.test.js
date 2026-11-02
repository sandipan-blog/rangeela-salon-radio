import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchRequest, buildFarmaishMessages, parseFarmaishReply } from '../src/moods.js';

const SONGS = [
  { id: 'baarish-1', title: 'Rimjhim Rimjhim', film: '1942 A Love Story', year: 1994, singers: ['Kavita Krishnamurthy'], composer: 'R. D. Burman', moods: ['baarish'] },
  { id: 'baarish-2', title: 'Barso Re', film: 'Guru', year: 2007, singers: ['Shreya Ghoshal'], composer: 'A. R. Rahman', moods: ['baarish', 'chai'] },
  { id: 'romance-1', title: 'Pehla Nasha', film: 'Jo Jeeta Wohi Sikandar', year: 1992, singers: ['Udit Narayan', 'Sadhana Sargam'], composer: 'Jatin-Lalit', moods: ['romance'] },
  { id: 'romance-2', title: 'Tujhe Dekha To', film: 'Dilwale Dulhania Le Jayenge', year: 1995, singers: ['Lata Mangeshkar', 'Kumar Sanu'], composer: 'Jatin-Lalit', moods: ['romance'] },
  { id: 'sad-1', title: 'Tadap Tadap Ke', film: 'Hum Dil De Chuke Sanam', year: 1999, singers: ['Kumar Sanu'], composer: 'Ismail Darbar', moods: ['dard'] },
  { id: 'party-1', title: 'Koi Kahe Kehta Rahe', film: 'Dil Chahta Hai', year: 2001, singers: ['Shankar Mahadevan', 'KK', 'Shaan'], composer: 'Shankar-Ehsaan-Loy', moods: ['masti'] },
  { id: 'road-1', title: 'Yeh Dil Deewana', film: 'Pardes', year: 1997, singers: ['Sonu Nigam'], composer: 'Nadeem-Shravan', moods: ['roadtrip'] },
  { id: 'chai-1', title: 'Chaiyya Chaiyya', film: 'Dil Se', year: 1998, singers: ['Sukhwinder Singh'], composer: 'A. R. Rahman', moods: ['chai'] }
];

test('mood request: "Baarish wale gaane"', () => {
  const r = matchRequest('Baarish wale gaane', SONGS);
  assert.equal(r.kind, 'mood');
  assert.equal(r.mood, 'baarish');
  assert.deepEqual(r.songIds.sort(), ['baarish-1', 'baarish-2'].sort());
  assert.ok(r.reply.length > 0);
});

test('mood request in English: "something for a rainy evening"', () => {
  const r = matchRequest('something for a rainy evening', SONGS);
  assert.equal(r.kind, 'mood');
  assert.equal(r.mood, 'baarish');
});

test('mood words: sad / party / pyaar / chai', () => {
  assert.equal(matchRequest('kuch sad sa chalao', SONGS).kind, 'mood');
  assert.equal(matchRequest('party shuru karo', SONGS).mood, 'masti');
  assert.equal(matchRequest('pyaar wala gaana', SONGS).mood, 'romance');
  assert.equal(matchRequest('chai ke saath gaana', SONGS).mood, 'chai');
});

test('artist request: "Kumar Sanu ke gaane" (partial name)', () => {
  const r = matchRequest('Kumar Sanu ke gaane', SONGS);
  assert.equal(r.kind, 'artist');
  assert.deepEqual(r.songIds.sort(), ['romance-2', 'sad-1'].sort());
});

test('artist request by composer partial word: "rahman"', () => {
  const r = matchRequest('rahman ka kuch', SONGS);
  assert.equal(r.kind, 'artist');
  assert.ok(r.songIds.includes('baarish-2'));
  assert.ok(r.songIds.includes('chai-1'));
});

test('song title / film request puts that song first', () => {
  const r = matchRequest('Pehla Nasha bajao bhaiya', SONGS);
  assert.equal(r.kind, 'song');
  assert.equal(r.songIds[0], 'romance-1');
  const r2 = matchRequest('Dil Chahta Hai film ka gaana', SONGS);
  assert.equal(r2.kind, 'song');
  assert.equal(r2.songIds[0], 'party-1');
});

test('year and decade requests', () => {
  const r = matchRequest('1995 ka gaana', SONGS);
  assert.equal(r.kind, 'year');
  assert.deepEqual(r.songIds, ['romance-2']);
  const r2 = matchRequest('90s gaane sunao', SONGS);
  assert.equal(r2.kind, 'year');
  assert.ok(r2.songIds.length >= 6);
  const r3 = matchRequest('2000s ke gaane', SONGS);
  assert.equal(r3.kind, 'year');
  assert.deepEqual(r3.songIds.sort(), ['baarish-2', 'party-1'].sort());
});

test('unknown request gives a friendly reply with examples', () => {
  const r = matchRequest('zzz qqq xyz', SONGS);
  assert.equal(r.kind, 'unknown');
  assert.equal(r.songIds.length, 0);
  assert.ok(/baarish|Kumar Sanu/i.test(r.reply));
  const empty = matchRequest('', SONGS);
  assert.equal(empty.kind, 'unknown');
});

test('buildFarmaishMessages lists the songs and the request', () => {
  const msgs = buildFarmaishMessages({ text: 'Kumar Sanu ke gaane', songs: SONGS });
  assert.equal(msgs[0].role, 'system');
  assert.match(msgs[0].content, /Pappu Bhaiya/);
  assert.match(msgs[1].content, /Kumar Sanu ke gaane/);
  assert.match(msgs[1].content, /romance-1/); // ids are listed
  assert.match(msgs[1].content, /Pehla Nasha/);
});

test('parseFarmaishReply: clean, fenced, invalid, URL rejection, cap at 8', () => {
  assert.deepEqual(
    parseFarmaishReply('{"songIds":["a","b"],"reply":"Ho gaya janaab!"}'),
    { songIds: ['a', 'b'], reply: 'Ho gaya janaab!' }
  );
  assert.deepEqual(
    parseFarmaishReply('```json\n{"songIds":["a"],"reply":"ok"}\n```'),
    { songIds: ['a'], reply: 'ok' }
  );
  assert.equal(parseFarmaishReply('no json here'), null);
  const bad = parseFarmaishReply('{"songIds":["a"],"reply":"see http://spam.example"}');
  assert.equal(bad.reply, ''); // URL stripped from the reply, ids kept
  const many = parseFarmaishReply(JSON.stringify({ songIds: Array.from({ length: 12 }, (_, i) => 'id' + i), reply: 'x' }));
  assert.equal(many.songIds.length, 8);
});
