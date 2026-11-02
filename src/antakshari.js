// Rangeela Salon Radio — Antakshari with Bhaiya (pure logic, no DOM/browser APIs).
//
// AKSHAR RULES (Roman-script titles):
// - Titles are lowercased and everything except a–z and spaces is dropped.
// - lastAkshar: take the LAST word, strip trailing vowels (a e i o u y) and a
//   trailing "h" that follows a vowel (as in "aah"), then read the last
//   consonant cluster (chh/kh/gh/ch/jh/th/dh/ph/bh/sh, longest first) or the
//   last letter. A last word that is ALL vowels uses the previous word.
//   Examples: "Tujhe Dekha To" → t · "Pehla Nasha" → sh · "Chaiyya Chaiyya" → ch
//   (stripping the trailing "a y y a i a" from "chaiyya" leaves "ch").
// - firstAkshar: the first consonant cluster of the FIRST word; a leading vowel
//   is its own akshar (a, e, i, o, u).
// - SAME-sound pairs (v/w, z/j, f/ph, q/k) count as equal in matchesAkshar.

export const CLUSTERS = ['chh', 'kh', 'gh', 'ch', 'jh', 'th', 'dh', 'ph', 'bh', 'sh'];
const LONGEST_FIRST = [...CLUSTERS].sort((a, b) => b.length - a.length);
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

export const SAME = { v: 'w', w: 'v', z: 'j', j: 'z', f: 'ph', ph: 'f', q: 'k', k: 'q' };
const CANON = { f: 'ph', ph: 'ph', v: 'w', w: 'w', z: 'j', j: 'j', q: 'k', k: 'k' };
const canon = (a) => CANON[a] || a;

function cleanWords(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Strip trailing vowels (and a trailing "h" after a vowel) from a word.
function stem(word) {
  let w = word;
  while (w.length > 0) {
    const last = w[w.length - 1];
    if (VOWELS.has(last)) { w = w.slice(0, -1); continue; }
    if (last === 'h' && w.length > 1 && VOWELS.has(w[w.length - 2])) { w = w.slice(0, -1); continue; }
    break;
  }
  return w;
}

export function lastAkshar(title) {
  const words = cleanWords(title);
  for (let i = words.length - 1; i >= 0; i--) {
    const s = stem(words[i]);
    if (!s) continue; // all-vowel word → use the previous word
    for (const c of LONGEST_FIRST) if (s.endsWith(c)) return c;
    return s[s.length - 1];
  }
  return null;
}

export function firstAkshar(title) {
  const words = cleanWords(title);
  if (words.length === 0) return null;
  const w = words[0];
  if (VOWELS.has(w[0])) return w[0]; // a leading vowel is its own akshar
  for (const c of LONGEST_FIRST) if (w.startsWith(c)) return c;
  return w[0];
}

export function matchesAkshar(title, akshar) {
  const f = firstAkshar(title);
  if (!f || !akshar) return false;
  return canon(f) === canon(String(akshar).toLowerCase());
}

const DEVANAGARI = {
  k: 'क', kh: 'ख', g: 'ग', gh: 'घ',
  ch: 'च', chh: 'छ', j: 'ज', jh: 'झ',
  t: 'त', th: 'थ', d: 'द', dh: 'ध', n: 'न',
  p: 'प', ph: 'फ', b: 'ब', bh: 'भ', m: 'म',
  y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व', s: 'स', sh: 'श', h: 'ह',
  z: 'ज़', f: 'फ़', q: 'क़',
  a: 'अ', e: 'ए', i: 'इ', o: 'ओ', u: 'उ'
};

export function aksharLabel(akshar) {
  const a = String(akshar || '').toLowerCase();
  return DEVANAGARI[a] || a.toUpperCase();
}

const normTitle = (t) =>
  String(t || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Match the player's typed text against the playlist: exact title,
// "title + film" (either order), or the text containing the title.
export function findInPlaylist(text, songs) {
  const q = normTitle(text);
  if (!q) return null;
  const list = Array.isArray(songs) ? songs : [];
  for (const s of list) {
    const t = normTitle(s.title);
    if (!t) continue;
    if (q === t || q === normTitle(`${s.title} ${s.film || ''}`) || q === normTitle(`${s.film || ''} ${s.title}`)) return s;
  }
  for (const s of list) {
    const t = normTitle(s.title);
    if (t && q.includes(t)) return s;
  }
  return null;
}

// ---------- the game ----------
export function createGame({ songs, rng = Math.random, lives = 3, turnMs = 30000 }) {
  const list = (Array.isArray(songs) ? songs : []).filter((s) => s && s.title);

  let phase = 'bhaiya'; // Bhaiya opens the game with a song
  let akshar = null;
  let score = 0;
  let livesLeft = lives;
  let deadline = null;
  let lastSong = null;
  const used = []; // normalised titles, never reused in a game

  const isUsed = (t) => used.includes(normTitle(t));

  function pickFrom(candidates) {
    const arr = candidates.filter((s) => s && s.title && !isUsed(s.title));
    if (arr.length === 0) return null;
    return arr[Math.floor(rng() * arr.length) % arr.length];
  }

  function lose(reason, now) {
    livesLeft -= 1;
    if (livesLeft <= 0) {
      livesLeft = 0;
      phase = 'over';
      deadline = null;
    } else {
      deadline = now != null ? now + turnMs : deadline;
    }
    return { ok: false, reason, lives: livesLeft, over: phase === 'over' };
  }

  return {
    state() {
      return { phase, akshar, score, lives: livesLeft, used: [...used], lastSong, deadline };
    },

    // Bhaiya answers with a song starting with `requiredAkshar` (null at the
    // start of the game). If he has none left: +2 points and a fresh song.
    bhaiyaTurn(requiredAkshar = null, now = null) {
      if (phase !== 'bhaiya') return null;
      let song = null;
      let bonus = false;
      if (requiredAkshar) {
        song = pickFrom(list.filter((s) => matchesAkshar(s.title, requiredAkshar)));
        if (!song) {
          score += 2; // Bhaiya is stuck: 2 points to you
          bonus = true;
          song = pickFrom(list);
        }
      } else {
        song = pickFrom(list);
      }
      if (!song) { phase = 'over'; return null; }
      used.push(normTitle(song.title));
      lastSong = song;
      akshar = lastAkshar(song.title);
      phase = 'player';
      deadline = now != null ? now + turnMs : null;
      return { song, bonus, akshar };
    },

    // The player's answer. Songs not in our playlist must be checked by the
    // server BEFORE calling this. Returns { ok: true } or a loss.
    playerAnswer(answer = {}, now = null) {
      if (phase !== 'player') return { ok: false, reason: 'Abhi aapki baari nahi hai', over: phase === 'over' };
      let title = null;
      if (answer.inPlaylistId) {
        const s = list.find((x) => x.id === answer.inPlaylistId);
        if (s) title = s.title;
      }
      if (!title && answer.title) title = answer.title;
      if (!title) return { ok: false, reason: 'Gaana ka naam toh bolo' };
      if (isUsed(title)) return lose('Yeh gaana pehle hi ho chuka hai', now);
      if (!matchesAkshar(title, akshar)) return lose(`Akshar "${akshar}" se shuru karo`, now);
      score += 1;
      used.push(normTitle(title));
      lastSong = { title, film: answer.film || null, year: answer.year || null, id: answer.inPlaylistId || null };
      akshar = lastAkshar(title);
      phase = 'bhaiya';
      deadline = null;
      return { ok: true, akshar, score };
    },

    timeout(now = null) {
      if (phase !== 'player') return { ok: false, reason: 'Abhi aapki baari nahi hai' };
      return lose('Time up! Soch ke bolna tha', now);
    },

    // The server rejected an outside song (not real / wrong letter): costs a life.
    loseLife(reason, now = null) {
      if (phase !== 'player') return { ok: false, reason: 'Abhi aapki baari nahi hai' };
      return lose(reason || 'Yeh gaana nahi chala', now);
    }
  };
}

// ---------- LLM helpers for the server-side song check ----------
export function buildCheckMessages({ text, akshar }) {
  const label = aksharLabel(akshar);
  return [
    {
      role: 'system',
      content:
        'You are a friendly expert on Hindi film songs (Bollywood), checking answers in a game of Antakshari. ' +
        'The user names a Hindi film song. Decide whether it is a REAL, well-known Hindi film song whose title ' +
        'starts with the given akshar (sound). Judge the title by how it is written in Roman script (Hinglish). ' +
        'Reply with ONLY a JSON object: {"valid": true/false, "title": "the proper song title", "film": "the film", ' +
        '"year": 1995, "reason": "a short Hinglish reason"}. If it is not a real song or does not start with the ' +
        'akshar, valid is false. Never invent facts you are not sure about; if unsure, valid is false.'
    },
    {
      role: 'user',
      content: `Akshar: "${akshar}" (${label}). User's answer: "${text}". Is this a real Hindi film song starting with this sound?`
    }
  ];
}

export function parseCheckReply(text) {
  if (typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  let obj;
  try { obj = JSON.parse(text.slice(start, end + 1)); } catch { return null; }
  if (!obj || typeof obj !== 'object' || typeof obj.valid !== 'boolean') return null;
  const clean = (v, max) => {
    if (typeof v !== 'string') return '';
    const s = v.trim().slice(0, max);
    if (/http|<|>/i.test(s)) return '';
    return s;
  };
  const title = clean(obj.title, 120);
  const reason = clean(obj.reason, 200);
  if (obj.valid && !title) return null;
  const year = Number(obj.year);
  return {
    valid: obj.valid,
    title: obj.valid ? title : '',
    film: obj.valid ? clean(obj.film, 120) : '',
    year: obj.valid && Number.isFinite(year) && year > 1900 && year < 2030 ? year : undefined,
    reason: reason || (obj.valid ? 'Sahi jawab!' : 'Yeh gaana nahi chala')
  };
}
