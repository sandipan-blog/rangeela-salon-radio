// Rangeela Salon Radio — Farmaish ("Ask Bhaiya") matching (pure logic, no DOM/browser APIs).
import { MOODS } from './playlist.js';

const MOOD_WORDS = {
  baarish: ['baarish', 'barish', 'barsaat', 'barsaat', 'rain', 'rainy', 'monsoon', 'bund', 'boond'],
  romance: ['pyaar', 'pyar', 'love', 'romance', 'romantic', 'ishq', 'mohabbat', 'prem'],
  masti: ['party', 'dance', 'masti', 'mazak', 'fun', 'nach', 'bhangra', 'dhamaal'],
  dard: ['sad', 'dard', 'udaas', 'breakup', 'dukh', 'rona', 'aansu', 'emotional', 'dil toot'],
  roadtrip: ['safar', 'road trip', 'roadtrip', 'drive', 'driving', 'travel', 'gaadi', 'highway', 'safar'],
  chai: ['chai', 'subah', 'morning', 'relax', 'shaam', 'chai time', 'nashta', 'sukoon']
};

function norm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function findMood(text) {
  const t = ' ' + norm(text) + ' ';
  for (const mood of MOODS) {
    for (const w of MOOD_WORDS[mood]) {
      if (t.includes(' ' + w + ' ') || t.includes(' ' + w + 's ') || t.trim() === w) return mood;
    }
  }
  // looser: substring anywhere (e.g. "baarishwale")
  const flat = norm(text).replace(/[^a-z ]/g, ' ');
  for (const mood of MOODS) {
    for (const w of MOOD_WORDS[mood]) {
      if (w.length >= 5 && flat.includes(w)) return mood;
    }
  }
  return null;
}

function peopleOf(song) {
  const names = [];
  if (Array.isArray(song.singers)) names.push(...song.singers);
  if (song.composer) names.push(song.composer);
  return names.filter(Boolean);
}

function findArtistSongs(text, songs) {
  const t = norm(text);
  if (t.length < 3) return [];
  const out = [];
  for (const song of songs) {
    let hit = false;
    for (const person of peopleOf(song)) {
      const p = norm(person);
      if (!p) continue;
      if (t.includes(p)) { hit = true; break; }
      // partial words like "sanu", "rahman"
      for (const word of p.split(' ')) {
        if (word.length >= 4 && t.includes(word)) { hit = true; break; }
      }
      if (hit) break;
    }
    if (hit) out.push(song);
  }
  return out;
}

function findTitleSong(text, songs) {
  const t = norm(text);
  if (t.length < 3) return null;
  let best = null;
  for (const song of songs) {
    const title = norm(song.title);
    const film = norm(song.film);
    if ((title.length >= 4 && t.includes(title)) || (film.length >= 4 && t.includes(film))) {
      // prefer the longer (more specific) match
      if (!best || Math.max(title.length, film.length) > best.len) {
        best = { song, len: Math.max(title.length, film.length) };
      }
    }
  }
  return best ? best.song : null;
}

function findYearSongs(text, songs) {
  const t = norm(text);
  const years = songs.map((s) => Number(s.year)).filter(Boolean);
  if (years.length === 0) return [];
  const min = Math.min(...years);
  const max = Math.max(...years);
  // exact year
  const ym = t.match(/\b(19|20)\d{2}\b/);
  if (ym) {
    const y = Number(ym[0]);
    if (y >= min - 1 && y <= max + 1) return songs.filter((s) => Number(s.year) === y);
  }
  // decades
  if (/(90s|nineties|nauve)/.test(t)) return songs.filter((s) => s.year >= 1990 && s.year <= 1999);
  if (/(2000s|two thousands|do hazaar)/.test(t)) return songs.filter((s) => s.year >= 2000 && s.year <= 2009);
  return [];
}

/**
 * matchRequest(text, songs) → { kind, mood, songIds, reply }
 * kind: 'mood' | 'artist' | 'song' | 'year' | 'unknown'
 */
export function matchRequest(text, songs) {
  const raw = String(text || '');
  const list = Array.isArray(songs) ? songs : [];
  const base = { mood: null, songIds: [], reply: '' };

  if (!raw.trim()) {
    return { ...base, kind: 'unknown', reply: 'Arre kuchh to likho! Jaise "baarish wale gaane" ya "Kumar Sanu ke gaane".' };
  }

  // 1. mood words
  const mood = findMood(raw);
  if (mood) {
    const ids = list.filter((s) => Array.isArray(s.moods) && s.moods.includes(mood)).map((s) => s.id);
    if (ids.length > 0) {
      return { kind: 'mood', mood, songIds: ids, reply: `Haan ji, ${MOOD_LABEL[mood]} ka mausam ban gaya — ${ids.length} gaane line mein laga diye!` };
    }
  }

  // 2. singer / composer
  const artistSongs = findArtistSongs(raw, list);
  if (artistSongs.length > 0) {
    const ids = artistSongs.map((s) => s.id);
    return { kind: 'artist', mood: null, songIds: ids, reply: `Wah, unka fan ho! ${ids.length} gaane line mein laga diye!` };
  }

  // 3. film / song title
  const song = findTitleSong(raw, list);
  if (song) {
    const sameFilm = list.filter((s) => norm(s.film) === norm(song.film) && s.id !== song.id).map((s) => s.id);
    return { kind: 'song', mood: null, songIds: [song.id, ...sameFilm], reply: `Yeh to badhiya farmaish hai! "${song.title}" agla hi bajega.` };
  }

  // 4. year / decade
  const yearSongs = findYearSongs(raw, list);
  if (yearSongs.length > 0) {
    const ids = yearSongs.map((s) => s.id);
    return { kind: 'year', mood: null, songIds: ids, reply: `Purane zamane ki yaad dila di! ${ids.length} gaane us daur ke line mein aa gaye.` };
  }

  return {
    ...base,
    kind: 'unknown',
    reply: 'Hmm, yeh farmaish samajh nahi aayi. Aise try karo: "Baarish wale gaane", "Kumar Sanu", "90s gaane" ya kisi film ka naam.'
  };
}

const MOOD_LABEL = {
  baarish: 'baarish', romance: 'romance', masti: 'masti', dard: 'dard', roadtrip: 'road trip', chai: 'chai'
};

// ---------- AI farmaish (server side helpers) ----------

export function buildFarmaishMessages({ text, songs }) {
  const lines = songs.map((s) =>
    `${s.id} | ${s.title} | film: ${s.film} | ${s.year} | singers: ${(s.singers || []).join(', ')} | composer: ${s.composer || ''}`
  ).join('\n');
  return [
    {
      role: 'system',
      content: 'You are "Pappu Bhaiya", the friendly owner of a small 1990s Indian hair-cutting salon who takes song requests (farmaish) on his radio. You speak warm Hinglish in Roman script with light humour. From ONLY the given song list, pick up to 8 song ids that best match the listener\'s request. Never invent ids. Then write ONE short confirmation line (max 2 sentences, max 160 characters) in your voice. No religion, politics, insults or real people\'s private lives. Reply with ONLY a JSON object: {"songIds": ["id1","id2"], "reply": "..."}'
    },
    {
      role: 'user',
      content: `Listener\'s farmaish: "${text}"\n\nAvailable songs (id | title | film | year | singers | composer):\n${lines}`
    }
  ];
}

export function parseFarmaishReply(text) {
  if (typeof text !== 'string') return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let obj;
  try { obj = JSON.parse(m[0]); } catch { return null; }
  if (!obj || typeof obj !== 'object') return null;
  let ids = obj.songIds;
  if (!Array.isArray(ids)) return null;
  ids = ids.filter((x) => typeof x === 'string' && x.length <= 80).slice(0, 8);
  let reply = '';
  if (typeof obj.reply === 'string') {
    reply = obj.reply.trim().replace(/^["']|["']$/g, '');
    if (/http|<|>/i.test(reply)) reply = '';
    if (reply.length > 160) reply = reply.slice(0, 160).replace(/\s+\S*$/, '');
  }
  if (ids.length === 0 && !reply) return null;
  return { songIds: ids, reply };
}
