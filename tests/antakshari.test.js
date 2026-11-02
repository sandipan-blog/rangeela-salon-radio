import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLUSTERS, SAME, lastAkshar, firstAkshar, matchesAkshar, aksharLabel,
  findInPlaylist, createGame, buildCheckMessages, parseCheckReply
} from '../src/antakshari.js';

// A tiny deterministic rng: picks index (seed % n) and advances the seed.
function seededRng(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return (s % 1000) / 1000;
  };
}

const SONGS = [
  { id: 'tujhe-dekha-to', title: 'Tujhe Dekha To', film: 'Dilwale Dulhania Le Jayenge', year: 1995 },
  { id: 'pehla-nasha', title: 'Pehla Nasha', film: 'Jo Jeeta Wohi Sikandar', year: 1992 },
  { id: 'chaiyya-chaiyya', title: 'Chaiyya Chaiyya', film: 'Dil Se', year: 1998 },
  { id: 'rimjhim-rimjhim', title: 'Rimjhim Rimjhim', film: '1942 A Love Story', year: 1994 },
  { id: 'ae-mere-humsafar', title: 'Aye Mere Humsafar', film: 'Qayamat Se Qayamat Tak', year: 1988 },
  { id: 'mitwa', title: 'Mitwa', film: 'Lagaan', year: 2001 },
  { id: 'masakali', title: 'Masakali', film: 'Delhi-6', year: 2009 },
  { id: 'tanhaayee', title: 'Tanhayee', film: 'Dil Chahta Hai', year: 2001 },
  { id: 'chak-de-phatte', title: 'Chak De Phatte', film: 'Khosla Ka Ghosla', year: 2006 },
  { id: 'sooraj-hua-madham', title: 'Sooraj Hua Madham', film: 'Kabhi Khushi Kabhie Gham', year: 2001 }
];

// ---------- lastAkshar / firstAkshar on real titles ----------
test('lastAkshar on real playlist titles (hand-checked)', () => {
  assert.equal(lastAkshar('Tujhe Dekha To'), 't');            // "to" → t
  assert.equal(lastAkshar('Pehla Nasha'), 'sh');              // cluster
  assert.equal(lastAkshar('Chaiyya Chaiyya'), 'ch');          // strip "ayyaia" leaves "ch"
  assert.equal(lastAkshar('Rimjhim Rimjhim'), 'm');           // "rimjhim" → m
  assert.equal(lastAkshar('Aye Mere Humsafar'), 'r');         // "humsafar" → r
  assert.equal(lastAkshar('Mitwa'), 'w');                     // "mitwa" → w
  assert.equal(lastAkshar('Masakali'), 'l');                  // strip i → l
  assert.equal(lastAkshar('Tanhayee'), 'h');                  // strip e,e,y,a → "tanh", h follows n → stays
  assert.equal(lastAkshar('Chak De Phatte'), 't');            // "phatte" → phatt → t
  assert.equal(lastAkshar('Sooraj Hua Madham'), 'm');
  assert.equal(lastAkshar('Kajra Re'), 'r');                  // "re" → r
  assert.equal(lastAkshar('Mera Kuch Samaan'), 'n');          // "samaan" → saman → n
});

test('lastAkshar edge cases: all-vowel last word uses the previous word; trailing "ah"', () => {
  assert.equal(lastAkshar('Aashiqui Aa'), 'q');               // "aa" is all vowels → "aashiqui" → q
  assert.equal(lastAkshar('Dil Aai'), 'l');                   // "aai" all vowels → "dil" → l
  assert.equal(lastAkshar('Aah'), null);                      // single all-vowel word, nothing before it
  assert.equal(lastAkshar('Jaanam Aah'), 'm');                // "aah" all vowels after strip → previous "jaanam" → m
  assert.equal(lastAkshar(''), null);
});

test('firstAkshar with clusters, consonants and leading vowels', () => {
  assert.equal(firstAkshar('Chaiyya Chaiyya'), 'ch');
  assert.equal(firstAkshar('Chak De Phatte'), 'ch');
  assert.equal(firstAkshar('Pehla Nasha'), 'p');
  assert.equal(firstAkshar('Tujhe Dekha To'), 't');
  assert.equal(firstAkshar('Aye Mere Humsafar'), 'a');        // leading vowel
  assert.equal(firstAkshar('Ishq Bina'), 'i');
  assert.equal(firstAkshar('Urvasi Urvasi'), 'u');
  assert.equal(firstAkshar('Khamoshi'), 'kh');
  assert.equal(firstAkshar('Shava Shava'), 'sh');
  assert.equal(firstAkshar('Thoda Thoda Pyaar'), 'th');
});

// ---------- matchesAkshar with the SAME table ----------
test('matchesAkshar uses the SAME sound table', () => {
  assert.ok(matchesAkshar('Vada Karo', 'v'));
  assert.ok(matchesAkshar('Wada Karo', 'w'));                 // v/w are the same sound
  assert.ok(!matchesAkshar('Wada Karo', 'v') === false);      // both directions match
  assert.ok(matchesAkshar('Zara Sa Jhoom Loon', 'z'));
  assert.ok(matchesAkshar('Jaanam', 'j'));
  assert.ok(matchesAkshar('Fiza', 'f'));
  assert.ok(matchesAkshar('Phir Bhi Dil Hai Hindustani', 'ph')); // f/ph same
  assert.ok(matchesAkshar('Qayamat Se Qayamat Tak', 'q'));
  assert.ok(matchesAkshar('Kuch Kuch Hota Hai', 'k'));        // q/k same
  assert.ok(!matchesAkshar('Tujhe Dekha To', 'p'));
  assert.ok(!matchesAkshar('', 'p'));
});

// ---------- aksharLabel ----------
test('aksharLabel gives Devanagari letters', () => {
  assert.equal(aksharLabel('k'), 'क');
  assert.equal(aksharLabel('kh'), 'ख');
  assert.equal(aksharLabel('ch'), 'च');
  assert.equal(aksharLabel('chh'), 'छ');
  assert.equal(aksharLabel('sh'), 'श');
  assert.equal(aksharLabel('w'), 'व');
  assert.equal(aksharLabel('v'), 'व');
  assert.equal(aksharLabel('a'), 'अ');
  assert.equal(aksharLabel('x'), 'X');                        // unknown → Roman upper
});

// ---------- findInPlaylist ----------
test('findInPlaylist matches title and title+film, ignoring punctuation/case', () => {
  const s = findInPlaylist('tujhe dekha to', SONGS);
  assert.equal(s && s.id, 'tujhe-dekha-to');
  const s2 = findInPlaylist('Tujhe Dekha To - Dilwale Dulhania Le Jayenge', SONGS);
  assert.equal(s2 && s2.id, 'tujhe-dekha-to');
  assert.equal(findInPlaylist('gaana jo hai hi nahi', SONGS), null);
});

// ---------- a full scripted game ----------
test('full scripted game: bhaiya opens, right answer, wrong answer, timeout, used-song rejection, stuck bhaiya, game over', () => {
  const rng = seededRng(7);
  const g = createGame({ songs: SONGS, rng, lives: 3, turnMs: 30000 });

  // Bhaiya opens with a random song.
  const open = g.bhaiyaTurn(null, 1000);
  assert.ok(open);
  assert.ok(SONGS.some((s) => s.title === open.song.title)); // a real playlist song
  const st = g.state();
  assert.equal(st.phase, 'player');
  assert.equal(st.lives, 3);
  assert.equal(st.score, 0);
  assert.ok(st.deadline > 1000);
  assert.equal(st.used.length, 1);

  // Wrong akshar → lose a life but stay in the game.
  const bad = g.playerAnswer({ title: 'Zindagi Maut Na Ban Jaaye' }, 12000);
  assert.equal(bad.ok, false);
  assert.equal(g.state().lives, 2);
  assert.equal(g.state().phase, 'player');

  // The already-used song is rejected without costing a life? — spec says a
  // wrong answer costs one; a used song is also wrong. Check it is rejected.
  const usedAgain = g.playerAnswer({ title: open.song.title }, 13000);
  assert.equal(usedAgain.ok, false);
  assert.equal(g.state().lives, 1);

  // Timeout costs the last life → game over.
  const to = g.timeout(50000);
  assert.equal(to.ok, false);
  assert.equal(g.state().lives, 0);
  assert.equal(g.state().phase, 'over');
});

test('correct answer scores, moves to bhaiya, and bhaiya answers with the new akshar', () => {
  const g = createGame({ songs: SONGS, rng: seededRng(3), lives: 3 });
  const open = g.bhaiyaTurn(null, 0);
  const ak = open.akshar;

  // Find a playlist song starting with bhaiya's akshar.
  const reply = SONGS.find((s) => matchesAkshar(s.title, ak) && norm(s.title) !== norm(open.song.title));
  if (reply) {
    const ok = g.playerAnswer({ title: reply.title, film: reply.film, year: reply.year, inPlaylistId: reply.id }, 1000);
    assert.equal(ok.ok, true);
    assert.equal(g.state().score, 1);
    assert.equal(g.state().phase, 'bhaiya');
    assert.equal(g.state().akshar, lastAkshar(reply.title));

    // Bhaiya must now answer with a song starting with OUR akshar.
    const needed = g.state().akshar;                          // our song's last akshar
    const b = g.bhaiyaTurn(needed, 2000);
    assert.ok(b);
    assert.ok(matchesAkshar(b.song.title, needed) || b.bonus);
    assert.equal(g.state().phase, 'player');
    assert.equal(g.state().akshar, b.akshar);                 // his song sets the new letter
  }

  // Bhaiya gets stuck → +2 and a fresh song.
  const g2 = createGame({ songs: [{ id: 'x', title: 'Mitwa', film: 'Lagaan', year: 2001 }], rng: seededRng(2), lives: 3 });
  g2.bhaiyaTurn(null, 0);                                     // plays Mitwa (only song)
  const ok2 = g2.playerAnswer({ title: 'Mitwa', inPlaylistId: 'x' }, 100);
  assert.equal(ok2.ok, false);                                // already used
  // Bhaiya cannot find an unused song at all → game over gracefully.
  const g3 = createGame({ songs: [], rng: seededRng(1), lives: 3 });
  assert.equal(g3.bhaiyaTurn(null, 0), null);
  assert.equal(g3.state().phase, 'over');
});

test('bhaiya having no song for the letter gives +2 points and a fresh start', () => {
  const songs = [
    { id: 'a', title: 'Tujhe Dekha To', film: 'X', year: 1995 },
    { id: 'b', title: 'Pehla Nasha', film: 'Y', year: 1992 },
    { id: 'c', title: 'Tanha Tanha', film: 'Z', year: 1995 }
  ];
  const g = createGame({ songs, rng: seededRng(11), lives: 3 });
  const open = g.bhaiyaTurn(null, 0);
  // Answer with an outside song that starts with bhaiya's akshar but ENDS in
  // "g" — no song in the list starts with g, so bhaiya gets stuck.
  const outside = open.akshar + 'ig';
  const ok = g.playerAnswer({ title: outside, film: 'Outside Film', year: 2021 }, 100);
  assert.equal(ok.ok, true);
  assert.equal(g.state().score, 1);
  const b = g.bhaiyaTurn(g.state().akshar, 200);
  assert.ok(b);
  assert.equal(b.bonus, true);                                // he had nothing → +2
  assert.equal(g.state().score, 3);
  assert.equal(g.state().phase, 'player');                    // fresh start, your turn
});

function norm(t) { return String(t).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

// ---------- LLM check helpers ----------
test('buildCheckMessages includes the akshar and the answer', () => {
  const msgs = buildCheckMessages({ text: 'pehla nasha', akshar: 'p' });
  assert.equal(msgs.length, 2);
  assert.match(msgs[0].content, /Antakshari/i);
  assert.match(msgs[1].content, /pehla nasha/);
  assert.match(msgs[1].content, /p/);
});

test('parseCheckReply: clean JSON, fenced, invalid, missing title, URL junk', () => {
  const good = parseCheckReply('{"valid":true,"title":"Pehla Nasha","film":"Jo Jeeta Wohi Sikandar","year":1992,"reason":"Sahi!"}');
  assert.equal(good.valid, true);
  assert.equal(good.title, 'Pehla Nasha');
  assert.equal(good.year, 1992);
  const fenced = parseCheckReply('```json\n{"valid":false,"reason":"Aisa gaana nahi hai"}\n```');
  assert.equal(fenced.valid, false);
  assert.equal(fenced.title, '');
  const prose = parseCheckReply('Sure! Here you go: {"valid":true,"title":"Mitwa","film":"Lagaan","year":2001,"reason":"ok"} hope that helps');
  assert.equal(prose.valid, true);
  assert.equal(parseCheckReply('no json here'), null);
  assert.equal(parseCheckReply('{"valid":true,"title":""}'), null);   // valid needs a title
  assert.equal(parseCheckReply('{"valid":true,"title":"http://spam"}'), null);
  assert.equal(parseCheckReply(''), null);
});

test('CLUSTERS longest-first checking and SAME table shape', () => {
  assert.ok(CLUSTERS.includes('chh'));
  assert.equal(SAME.v, 'w');
  assert.equal(SAME.ph, 'f');
});
