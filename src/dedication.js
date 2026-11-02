// Rangeela Salon Radio — dedications, the old radio way (pure logic, no DOM/browser APIs).

const NAME_STRIP_RE = /[^\p{L}\p{M}\p{N} .\-]/gu;

/**
 * cleanName(s, max = 24): trim, collapse spaces, remove <>"'{}, http and anything
 * that isn't a letter (any script), number, space, '.' or '-'; cut to max.
 * Returns '' when nothing valid is left.
 */
export function cleanName(s, max = 24) {
  let out = String(s || '');
  // drop URLs first so "http://x" can't survive as letters
  out = out.replace(/https?:\/\/\S+/gi, ' ').replace(/\bhttp\b/gi, ' ');
  out = out.replace(NAME_STRIP_RE, ' ');
  out = out.replace(/\s+/g, ' ').trim();
  if (out.length > max) out = out.slice(0, max).trim();
  return out;
}

/**
 * buildDedication({ from, town, to, songId }) → { ok, error?, data }
 * from and to are required; town defaults to "Jhumri Telaiya".
 */
export function buildDedication({ from, town, to, songId }) {
  const f = cleanName(from);
  const t = cleanName(to);
  const tw = cleanName(town) || 'Jhumri Telaiya';
  const sid = typeof songId === 'string' ? songId.trim().slice(0, 80) : '';
  if (!f) return { ok: false, error: 'Aapka naam likhna zaroori hai', data: null };
  if (!t) return { ok: false, error: 'Kiske liye gaana hai, woh naam likho', data: null };
  if (!sid) return { ok: false, error: 'Ek gaana chuno', data: null };
  return { ok: true, data: { f, t, o: tw, s: sid } };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const VARIATIONS = [
  (d, song) => `Agla gaana hai ${song.title}, film ${song.film} se. Aur yeh farmaish aayi hai ${d.o} se, ${d.f} ki taraf se ${d.t} ke liye. ${d.t} ji, yeh gaana sirf aapke liye!`,
  (d, song) => `Radio Rangeela pe agla track: ${song.title} — film ${song.film}. Yeh chitthi ${d.o} se aayi hai, ${d.f} ne ${d.t} ko bheji hai. ${d.t}, suno zara, yeh sirf aapke liye hai!`,
  (d, song) => `Ab bajega ${song.title}, film ${song.film} ki awaaz. ${d.o} ke ${d.f} ne ${d.t} ke naam ki hai yeh farmaish. ${d.t} ji, gaana aapke naam!`
];

/**
 * dedicationText(d, song): the on-air announcement. The same data always reads
 * the same variation (picked by a hash of the data).
 */
export function dedicationText(d, song) {
  if (!d || !song) return '';
  const key = `${d.f}|${d.o}|${d.t}|${d.s}`;
  const idx = hashString(key) % VARIATIONS.length;
  return VARIATIONS[idx](d, song);
}

// ---------- link encoding (base64url of {f,t,o,s}) ----------

function b64urlEncode(str) {
  // UTF-8 safe base64url without Buffer (works in Node and the browser)
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  try {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** encodeDedication(d) → compact URL-safe string */
export function encodeDedication(d) {
  if (!d || !d.f || !d.t || !d.s) return '';
  const json = JSON.stringify({ f: d.f, t: d.t, o: d.o || 'Jhumri Telaiya', s: d.s });
  return b64urlEncode(json);
}

/**
 * decodeDedication(str, songs?) → the data object or null for anything invalid:
 * bad base64, bad JSON, wrong shape, missing names after cleaning, over 300
 * characters, unknown song id (when a song list is given).
 */
export function decodeDedication(str, songs = null) {
  if (typeof str !== 'string' || str.length === 0 || str.length > 300) return null;
  const json = b64urlDecode(str);
  if (!json) return null;
  let obj;
  try { obj = JSON.parse(json); } catch { return null; }
  if (!obj || typeof obj !== 'object') return null;
  const f = cleanName(obj.f);
  const t = cleanName(obj.t);
  const o = cleanName(obj.o) || 'Jhumri Telaiya';
  const s = typeof obj.s === 'string' ? obj.s.trim().slice(0, 80) : '';
  if (!f || !t || !s) return null;
  if (songs && Array.isArray(songs) && !songs.some((song) => song.id === s)) return null;
  return { f, t, o, s };
}
