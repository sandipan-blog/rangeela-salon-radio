// Rangeela Salon Radio — play queue (pure logic, no DOM/browser APIs).

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dialFrequency(songId) {
  // Stable pseudo FM frequency between 88.1 and 107.9, odd tenths.
  const h = hashString(String(songId));
  const steps = Math.round((107.9 - 88.1) / 0.2); // 99 slots
  const freq = 88.1 + (h % (steps + 1)) * 0.2;
  // Fix floating point: keep one decimal, odd tenth.
  return Math.round(freq * 10) / 10;
}

function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createQueue(songs, opts = {}) {
  const { mood = null, rng = Math.random, historySize = 10 } = opts;
  if (!Array.isArray(songs) || songs.length === 0) throw new Error('createQueue needs a non-empty song list');

  const broken = new Set();       // session-skipped ids
  let currentMood = mood;
  let order = [];                 // upcoming shuffled order
  const requested = [];           // farmaish queue (plays next, in order)
  const history = [];             // most recent last
  let currentSong = null;

  function poolFor(m) {
    let list = m ? songs.filter((s) => s.moods && s.moods.includes(m)) : songs.slice();
    const brokenOrEmpty = new Set([...broken]);
    const usable = list.filter((s) => !brokenOrEmpty.has(s.id));
    return usable.length > 0 ? usable : list; // never let the queue die
  }

  function reshuffle(avoidFirstId) {
    const pool = poolFor(currentMood);
    for (let attempt = 0; attempt < 12; attempt++) {
      order = shuffle(pool, rng);
      if (order.length < 2 || order[0].id !== avoidFirstId) return;
    }
    // Deterministic fallback: rotate so the avoided id isn't first.
    const idx = order.findIndex((s) => s.id === avoidFirstId);
    if (idx > 0) order = order.slice(idx).concat(order.slice(0, idx));
    else if (idx === 0 && order.length > 1) order.push(order.shift());
  }

  reshuffle(null);

  function remember(song) {
    history.push(song.id);
    if (history.length > historySize * 4) history.splice(0, history.length - historySize * 4);
  }

  function pickNext() {
    if (requested.length > 0) return requested.shift();
    while (order.length === 0) {
      reshuffle(currentSong ? currentSong.id : null);
      if (order.length === 0) return null; // empty pool (shouldn't happen)
    }
    // Prefer a song not in recent history while alternatives exist.
    const recent = new Set(history.slice(-historySize));
    const idx = order.findIndex((s) => !recent.has(s.id));
    const take = idx >= 0 ? idx : 0;
    return order.splice(take, 1)[0];
  }

  function byId(id) {
    return songs.find((s) => s.id === id) || null;
  }

  return {
    current() {
      return currentSong;
    },
    next() {
      const song = pickNext();
      if (!song) return null;
      currentSong = song;
      remember(song);
      return song;
    },
    prev() {
      if (history.length < 2) return currentSong;
      // Drop the current song from history, then go back one.
      history.pop();
      const prevId = history.pop();
      const song = byId(prevId);
      if (!song) return currentSong;
      currentSong = song;
      history.push(prevId);
      return song;
    },
    peek(n = 1) {
      const out = [];
      const reqCopy = requested.slice();
      const orderCopy = order.slice();
      let avoidId = currentSong ? currentSong.id : null;
      let filled = 0;
      while (filled < n) {
        let song = null;
        if (reqCopy.length > 0) song = reqCopy.shift();
        else {
          if (orderCopy.length === 0) {
            const pool = poolFor(currentMood);
            for (let a = 0; a < 12 && orderCopy.length === 0; a++) {
              const sh = shuffle(pool, rng);
              if (sh.length < 2 || sh[0].id !== avoidId) orderCopy.push(...sh);
            }
            if (orderCopy.length === 0) break;
          }
          const recent = new Set(history.slice(-historySize));
          const idx = orderCopy.findIndex((s) => !recent.has(s.id));
          song = orderCopy.splice(idx >= 0 ? idx : 0, 1)[0];
        }
        if (!song) break;
        out.push(song);
        avoidId = song.id;
        filled++;
      }
      return out;
    },
    setMood(newMood) {
      currentMood = newMood;
      requested.length = 0;
      reshuffle(currentSong ? currentSong.id : null);
    },
    mood() {
      return currentMood;
    },
    playNow(songId) {
      const song = byId(songId);
      if (!song) return null;
      currentSong = song;
      remember(song);
      return song;
    },
    enqueue(songIds) {
      for (const id of songIds) {
        const song = byId(id);
        if (song && !broken.has(id)) requested.push(song);
      }
      return requested.length;
    },
    skipBroken(songId) {
      broken.add(songId);
      const ri = requested.findIndex((s) => s.id === songId);
      if (ri >= 0) requested.splice(ri, 1);
      const oi = order.findIndex((s) => s.id === songId);
      if (oi >= 0) order.splice(oi, 1);
    },
    isBroken(songId) {
      return broken.has(songId);
    },
    history() {
      return history.slice();
    }
  };
}
