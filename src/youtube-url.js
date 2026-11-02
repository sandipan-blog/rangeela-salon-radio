// Rangeela Salon Radio — parse a YouTube id from any URL form (pure logic).

/**
 * parseYouTubeId(text) → the 11-character video id or null.
 * Accepts watch?v=, youtu.be/, /shorts/, m.youtube with &t=, /embed/ and a bare id.
 */
export function parseYouTubeId(text) {
  if (typeof text !== 'string') return null;
  const t = text.trim();
  if (!t) return null;

  // bare 11-char id
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;

  let url = null;
  try { url = new URL(t); } catch { return null; }

  const host = url.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return isId(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v');
    if (isId(v)) return v;
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
      return isId(parts[1]) ? parts[1] : null;
    }
  }
  return null;
}

function isId(s) {
  return typeof s === 'string' && /^[A-Za-z0-9_-]{11}$/.test(s);
}
