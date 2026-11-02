import test from 'node:test';
import assert from 'node:assert/strict';
import { SONGS, MOODS, MOOD_INFO, validateSongs, playableSongs, songLabel } from '../src/playlist.js';

test('real SONGS list passes validateSongs (empty youtubeIds allowed)', () => {
  assert.deepEqual(validateSongs(SONGS), []);
});

test('at least 48 songs and every mood has at least 8 songs', () => {
  assert.ok(SONGS.length >= 48);
  for (const m of MOODS) {
    const n = SONGS.filter(s => s.moods.includes(m)).length;
    assert.ok(n >= 8, `mood ${m} has only ${n}`);
  }
});

test('MOODS matches MOOD_INFO keys', () => {
  assert.deepEqual(MOODS, Object.keys(MOOD_INFO));
});

test('missing fields produce errors', () => {
  const errs = validateSongs([{ id: 'x' }]);
  assert.ok(errs.some(e => e.includes('missing field title')));
});

test('year outside 1985-2012 produces an error', () => {
  const bad = [{ ...SONGS[0], id: 'bad-year', year: 1980 }];
  assert.ok(validateSongs(bad).some(e => e.includes('outside 1985-2012')));
});

test('unknown mood produces an error', () => {
  const bad = [{ ...SONGS[0], id: 'bad-mood', moods: ['jhoola'] }];
  assert.ok(validateSongs(bad).some(e => e.includes('unknown mood')));
});

test('duplicate ids produce an error', () => {
  const bad = [SONGS[0], { ...SONGS[0] }];
  assert.ok(validateSongs(bad).some(e => e.includes('duplicate id')));
});

test('duplicate youtubeIds produce an error', () => {
  const a = { ...SONGS[0], id: 'a1', youtubeId: 'abcdefghijk' };
  const b = { ...SONGS[0], id: 'b2', youtubeId: 'abcdefghijk' };
  assert.ok(validateSongs([a, b]).some(e => e.includes('duplicate youtubeId')));
});

test('empty youtubeIds do not count as duplicates', () => {
  const a = { ...SONGS[0], id: 'a1', youtubeId: '' };
  const b = { ...SONGS[0], id: 'b2', youtubeId: '' };
  assert.equal(validateSongs([a, b]).filter(e => e.includes('duplicate youtubeId')).length, 0);
});

test('bad youtubeId format produces an error', () => {
  const bad = [{ ...SONGS[0], id: 'short', youtubeId: 'abc123' }];
  assert.ok(validateSongs(bad).some(e => e.includes('bad youtubeId')));
});

test('playableSongs skips empty, invalid and disabled ids', () => {
  const list = [
    { ...SONGS[0], id: 'ok1', youtubeId: 'abcdefghijk' },
    { ...SONGS[0], id: 'empty', youtubeId: '' },
    { ...SONGS[0], id: 'bad', youtubeId: 'xyz' },
    { ...SONGS[0], id: 'off', youtubeId: 'klmnopqrstu' }
  ];
  const got = playableSongs(list, new Set(['klmnopqrstu']));
  assert.deepEqual(got.map(s => s.id), ['ok1']);
});

test('songLabel formats title · film (year)', () => {
  const s = SONGS.find(x => x.id === 'tujhe-dekha-to');
  assert.equal(songLabel(s), 'Tujhe Dekha To · Dilwale Dulhania Le Jayenge (1995)');
});
