// Rangeela Salon Radio — DJ intro logic (pure, no DOM/browser APIs).

export function introFor(song, opts = {}) {
  const { part = null, mood = null, line = null, dedication = null } = opts;
  const bits = [];
  if (dedication) bits.push(dedication); // dedication sentence goes FIRST
  if (line) bits.push(line);
  const singers = Array.isArray(song.singers) ? song.singers.join(' aur ') : (song.singers || '');
  bits.push(`Ab sunte hain ${song.title}, film ${song.film}, saal ${song.year}, aawaz ${singers}.`);
  let text = bits.join(' ');
  if (text.length > 300) text = text.slice(0, 297).replace(/\s+\S*$/, '') + '…';
  return text;
}

export function shouldTalk(playCount, rng = Math.random, silenceStreak = 0) {
  // Talks before the first song; then about 1 in 2 songs;
  // never silent more than 3 times in a row.
  if (playCount <= 1) return true;
  if (silenceStreak >= 3) return true;
  return rng() < 0.5;
}

// Tracks the silence streak for callers (pure; streak passed explicitly).
export function createTalkPolicy({ rng = Math.random } = {}) {
  let silenceStreak = 0;
  return {
    next(playCount) {
      const talk = shouldTalk(playCount, rng, silenceStreak);
      if (talk) silenceStreak = 0; else silenceStreak++;
      return talk;
    },
    silenceStreak() { return silenceStreak; }
  };
}

// ---------- STEP 9: AI DJ (GLM) ----------

export function buildDjMessages({ song, mood, part, dedication, recentLines }) {
  const facts = [
    `Song: ${song.title}`,
    song.film ? `Film: ${song.film}` : null,
    song.year ? `Year: ${song.year}` : null,
    song.singers && song.singers.length ? `Singers: ${song.singers.join(', ')}` : null,
    song.composer ? `Music director: ${song.composer}` : null
  ].filter(Boolean).join('\n');
  const context = [
    mood ? `Listener's mood: ${mood}` : null,
    part ? `Time of day: ${part}` : null,
    dedication ? `There is a dedication: ${dedication}` : null
  ].filter(Boolean).join('\n');
  const recent = (recentLines || []).length
    ? `Recent lines you said (never repeat them):\n- ${(recentLines || []).join('\n- ')}`
    : 'No recent lines.';

  const system = `You are "Pappu Bhaiya", the friendly owner of a small 1990s Indian hair-cutting salon who also plays the radio for customers. You speak Hinglish in Roman script, warm and filmy, with light humour. Write ONE short line (max 2 sentences, max 150 characters) to say just before the given song plays, connecting it to the salon, the weather or the time of day. You may mention the film, year, singers or music director, but invent no other facts about the song. No religion, politics, insults or real people's private lives. Never repeat any of the recent lines. Reply with ONLY a JSON object {"line": "..."}.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: `${facts}\n${context}\n${recent}\n\nWrite the line now.` }
  ];
}

export function parseDjReply(text) {
  if (typeof text !== 'string') return null;
  // Extract the first {...} even inside code fences or after prose.
  const start = text.indexOf('{');
  if (start < 0) return null;
  const end = text.indexOf('}', start);
  if (end < 0) return null;
  let line;
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    line = obj && typeof obj.line === 'string' ? obj.line : null;
  } catch {
    return null;
  }
  if (!line) return null;
  line = line.trim().replace(/^["'“”]+|["'“”]+$/g, '');
  if (!line) return null;
  // Reject links / HTML-ish content.
  const low = line.toLowerCase();
  if (low.includes('http') || line.includes('<') || line.includes('>')) return null;
  // Cut to 160 characters at a word boundary.
  if (line.length > 160) {
    const cut = line.slice(0, 160);
    const sp = cut.lastIndexOf(' ');
    line = (sp > 100 ? cut.slice(0, sp) : cut).trim() + '…';
  }
  return line;
}
