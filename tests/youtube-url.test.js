import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTubeId } from '../src/youtube-url.js';

test('parses every supported URL form', () => {
  assert.equal(parseYouTubeId('https://www.youtube.com/watch?v=cNV5hLSa9H8'), 'cNV5hLSa9H8');
  assert.equal(parseYouTubeId('https://youtu.be/cNV5hLSa9H8'), 'cNV5hLSa9H8');
  assert.equal(parseYouTubeId('https://www.youtube.com/shorts/cNV5hLSa9H8'), 'cNV5hLSa9H8');
  assert.equal(parseYouTubeId('https://m.youtube.com/watch?v=cNV5hLSa9H8&t=30s'), 'cNV5hLSa9H8');
  assert.equal(parseYouTubeId('https://www.youtube.com/embed/cNV5hLSa9H8'), 'cNV5hLSa9H8');
  assert.equal(parseYouTubeId('http://youtube.com/watch?v=cNV5hLSa9H8&list=x'), 'cNV5hLSa9H8');
  assert.equal(parseYouTubeId('https://www.youtube-nocookie.com/embed/cNV5hLSa9H8'), 'cNV5hLSa9H8');
  assert.equal(parseYouTubeId('  https://www.youtube.com/watch?v=cNV5hLSa9H8  '), 'cNV5hLSa9H8');
});

test('a bare 11-character id is accepted', () => {
  assert.equal(parseYouTubeId('cNV5hLSa9H8'), 'cNV5hLSa9H8');
  assert.equal(parseYouTubeId('abc123XYZ_-'), 'abc123XYZ_-'); // - and _ allowed
});

test('invalid strings return null', () => {
  assert.equal(parseYouTubeId('hello'), null);
  assert.equal(parseYouTubeId('cNV5hLSa9H'), null);       // 10 chars
  assert.equal(parseYouTubeId('cNV5hLSa9H88'), null);     // 12 chars
  assert.equal(parseYouTubeId('https://vimeo.com/12345'), null); // non-YouTube
  assert.equal(parseYouTubeId('https://example.com/watch?v=cNV5hLSa9H8'), null);
  assert.equal(parseYouTubeId('https://youtube.com/playlist?list=PL123'), null);
  assert.equal(parseYouTubeId(''), null);
  assert.equal(parseYouTubeId(null), null);
  assert.equal(parseYouTubeId(42), null);
});
