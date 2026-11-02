// Rangeela Salon Radio — main entry: wires the radio UI to the player and queue.
import { initScene } from './scene.js';
import { SONGS, playableSongs, songLabel } from './playlist.js';
import { createQueue, dialFrequency } from './queue.js';
import { createPlayer } from './player.js';
import { createAmbience } from './ambience.js';
import { partOfDay } from './timeofday.js';
import { createRain } from './rain.js';
import { pickLine } from './quotes.js';
import { introFor, createTalkPolicy } from './dj.js';
import { speak } from './voice.js';

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
initScene();

// ---------- broken songs (localStorage, 7 days) ----------
const BROKEN_KEY = 'brokenSongs';
function loadBroken() {
  try {
    const raw = JSON.parse(localStorage.getItem(BROKEN_KEY) || '{}');
    if (!raw.date || !Array.isArray(raw.ids)) return new Set();
    const age = Date.now() - new Date(raw.date).getTime();
    if (age > 7 * 24 * 3600 * 1000) return new Set();
    return new Set(raw.ids);
  } catch { return new Set(); }
}
function saveBroken(set) {
  try { localStorage.setItem(BROKEN_KEY, JSON.stringify({ date: new Date().toISOString(), ids: [...set] })); } catch {}
}
const broken = loadBroken();

// ---------- queue & player ----------
const playable = playableSongs(SONGS, broken);
const queue = createQueue(playable, {});
const savedVolume = (() => { try { return Number(localStorage.getItem('radioVolume')) || 80; } catch { return 80; } })();

let playCount = 0;
let consecutiveErrors = 0;
let transitioning = false;
let isPlaying = false;

// ---------- ambience ----------
const ambience = createAmbience();
const AMB_KEY = 'ambienceSettings';
function loadAmbSettings() {
  try { return JSON.parse(localStorage.getItem(AMB_KEY)) || {}; } catch { return {}; }
}
const ambSettings = Object.assign({ fan: true, salon: true, static: true, volume: 0.7 }, loadAmbSettings());
function saveAmbSettings() {
  try { localStorage.setItem(AMB_KEY, JSON.stringify(ambSettings)); } catch {}
}

// ---------- DOM refs ----------
const $ = (id) => document.getElementById(id);
const powerKnob = $('power-knob');
const btnPrev = $('btn-prev');
const btnToggle = $('btn-toggle');
const btnNext = $('btn-next');
const onair = $('onair');
const needle = $('needle');
const cassLabel = $('cass-label');
const grille = $('grille');
const testcard = $('testcard');
const scene = $('scene');

// Ambience mini-mixer under the radio
let mixerEl = document.querySelector('.ambience-mixer');
if (!mixerEl) {
  mixerEl = document.createElement('div');
  mixerEl.className = 'ambience-mixer';
  mixerEl.innerHTML = `
    <span class="amb-title">Ambience</span>
    <label class="amb-switch"><input type="checkbox" id="amb-fan"><span>Fan</span></label>
    <label class="amb-switch"><input type="checkbox" id="amb-salon"><span>Salon sounds</span></label>
    <label class="amb-switch"><input type="checkbox" id="amb-static"><span>Static between songs</span></label>
    <label class="amb-slider">Vol <input type="range" id="amb-vol" min="0" max="100"></label>`;
  const counter = document.querySelector('.counter') || scene;
  if (counter && counter.parentNode) counter.parentNode.insertBefore(mixerEl, counter.nextSibling);
  else document.body.appendChild(mixerEl);
}
const ambFan = $('amb-fan'), ambSalon = $('amb-salon'), ambStatic = $('amb-static'), ambVol = $('amb-vol');
if (ambFan) {
  ambFan.checked = ambSettings.fan; ambSalon.checked = ambSettings.salon;
  ambStatic.checked = ambSettings.static; ambVol.value = Math.round(ambSettings.volume * 100);
  ambFan.addEventListener('change', () => { ambSettings.fan = ambFan.checked; saveAmbSettings(); ambience.setEnabled('fan', ambFan.checked); });
  ambSalon.addEventListener('change', () => { ambSettings.salon = ambSalon.checked; saveAmbSettings(); });
  ambStatic.addEventListener('change', () => { ambSettings.static = ambStatic.checked; saveAmbSettings(); });
  ambVol.addEventListener('input', () => {
    ambSettings.volume = Number(ambVol.value) / 100; saveAmbSettings();
    ambience.setLevel('fan', ambSettings.volume);
    ambience.setLevel('rain', ambSettings.volume);
  });
}

// Now Playing strip
let npStrip = document.querySelector('.now-playing');
if (!npStrip) {
  npStrip = document.createElement('div');
  npStrip.className = 'now-playing';
  npStrip.innerHTML = `
    <div class="np-text">
      <strong id="np-title">Radio band hai</strong>
      <span id="np-meta">Power knob ghumao aur gaana shuru karo</span>
    </div>
    <button id="np-heart" class="np-heart" aria-label="Add to favourites" title="Favourites (STEP 12)">♡</button>`;
  if (scene && scene.nextSibling) scene.parentNode.insertBefore(npStrip, scene.nextSibling);
  else if (scene) scene.parentNode.appendChild(npStrip);
  else document.body.appendChild(npStrip);
}

// Mobile fallback tap button
let tapBtn = null;
function showTapButton() {
  if (tapBtn) return;
  tapBtn = document.createElement('button');
  tapBtn.className = 'tap-fallback';
  tapBtn.textContent = '▶ Agla gaana chalao';
  tapBtn.addEventListener('click', () => {
    hideTapButton();
    player.play();
  });
  const radio = $('radio') || document.body;
  radio.appendChild(tapBtn);
}
function hideTapButton() {
  if (tapBtn) { tapBtn.remove(); tapBtn = null; }
}

// ---------- dial needle ----------
function setNeedle(songId) {
  if (!needle) return;
  const f = dialFrequency(songId);
  const pct = ((f - 88.1) / (107.9 - 88.1)) * 100;
  needle.style.left = `calc(${pct.toFixed(2)}% - 1px)`;
  needle.title = `FM ${f.toFixed(1)}`;
}

// ---------- progress line along the bottom of the dial ----------
let progressLine = null;
function ensureProgressLine() {
  if (progressLine) return progressLine;
  const dial = document.querySelector('.dial-window');
  if (!dial) return null;
  progressLine = document.createElement('div');
  progressLine.className = 'dial-progress';
  progressLine.innerHTML = '<i></i>';
  dial.appendChild(progressLine);
  return progressLine;
}
function setProgress(frac) {
  const pl = ensureProgressLine();
  if (!pl) return;
  pl.querySelector('i').style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
}

// ---------- UI updates ----------
function updateNowPlaying(song) {
  if (!song) return;
  const t = $('np-title'); const m = $('np-meta');
  if (t) t.textContent = song.title;
  if (m) m.textContent = `${song.film} · ${song.year} · ${(song.singers || []).join(', ')}`;
  if (cassLabel) cassLabel.textContent = song.title;
  liveRegion.textContent = `Ab baj raha hai: ${song.title}`;
  updateMediaSession(song);
  setNeedle(song.id);
}
function setPlayingUI(on) {
  isPlaying = on;
  document.body.classList.toggle('is-playing', on);
  if (onair) onair.classList.toggle('lit', on);
  if (grille) grille.classList.toggle('pulse', on);
  document.querySelectorAll('.reel').forEach((r) => r.classList.toggle('spin', on));
  if (btnToggle) btnToggle.textContent = on ? '⏸' : '⏯';
}
function setBufferingUI() {
  if (onair) onair.classList.add('blink');
  if (cassLabel) cassLabel.textContent = 'tuning…';
}
function clearBufferingUI() {
  if (onair) onair.classList.remove('blink');
}

// ---------- the player ----------
const player = createPlayer({
  onEnded: () => transition(),
  onError: (code) => handleError(code),
  onPlaying: () => {
    clearBufferingUI();
    hideTapButton();
    setPlayingUI(true);
    consecutiveErrors = 0;
    if (powered) ambience.resume();
  },
  onPaused: () => { setPlayingUI(false); if (document.hidden && powered) ambience.suspend(); },
  onBuffering: () => setBufferingUI(),
  onUnstarted: (late) => { if (late) showTapButton(); },
  onProgress: ({ time, duration }) => setProgress(time / duration)
});

// ---------- transitions ----------
function startSong(song) {
  if (!song) return;
  recordPlayed(song);
  updateHeartUI();
  updateNowPlaying(song);
  if (testcard) testcard.classList.add('hidden');
  player.load(song, { autoplay: true });
  player.setVolume(player.getVolume());
}

function transition() {
  if (transitioning) return;
  transitioning = true;
  setPlayingUI(false);
  const vol = player.getVolume();
  player.fadeTo(0, 600);
  setTimeout(() => {
    if (ambSettings.static && powered) ambience.tuningStatic(1200);
    const next = queue.next();
    if (next) {
      updateNowPlaying(next);
      setNeedle(next.id);
      setTimeout(() => {
        startSong(next);
        playCount++;
        if (bhaiyaTalk && talkPolicy.next(playCount)) bhaiyaSpeaks(next);
        setTimeout(() => player.fadeTo(vol || savedVolume, 800), 400);
      }, ambSettings.static && powered ? 700 : 0);
    }
    setTimeout(() => { transitioning = false; }, ambSettings.static && powered ? 1000 : 300);
  }, 650);
}

function handleError(code) {
  const cur = queue.current();
  if (cur) {
    queue.skipBroken(cur.id);
    broken.add(cur.id);
    saveBroken(broken);
  }
  consecutiveErrors++;
  toast('Yeh gaana abhi nahi chal sakta, agla…');
  if (ambSettings.static && powered) ambience.tuningStatic(900);
  if (consecutiveErrors >= 5) {
    toast('Aaj radio ka signal kamzor hai');
    const retry = document.createElement('button');
    retry.className = 'tap-fallback';
    retry.textContent = '↻ Retry';
    retry.addEventListener('click', () => {
      retry.remove();
      consecutiveErrors = 0;
      transition();
    });
    ($('radio') || document.body).appendChild(retry);
    return;
  }
  transition();
}

// ---------- tiny toast ----------
let toastEl = null;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

// ---------- controls ----------
let powered = false;
function powerOn() {
  powered = true;
  ambience.start();
  ambience.setEnabled('fan', ambSettings.fan);
  ambience.setLevel('fan', ambSettings.volume);
  ambience.setLevel('rain', ambSettings.volume);
  powerKnob.textContent = '🔊';
  powerKnob.setAttribute('aria-label', 'Volume knob');
  player.setVolume(savedVolume);
  const first = queue.next();
  if (first) {
    recordPlayed(first);
    updateHeartUI();
    updateNowPlaying(first);
    if (testcard) testcard.classList.add('hidden');
    player.load(first, { autoplay: true });
    playCount = 1;
    if (bhaiyaTalk) bhaiyaSpeaks(first); // talks before the first song
  }
}
if (powerKnob) powerKnob.addEventListener('click', () => { if (!powered) powerOn(); });

if (btnToggle) btnToggle.addEventListener('click', () => player.toggle());
if (btnNext) btnNext.addEventListener('click', () => transition());
if (btnPrev) btnPrev.addEventListener('click', () => {
  const cur = player.getCurrentTime();
  if (cur > 5) { player.seekTo(0); return; }
  if (transitioning) return;
  transitioning = true;
  const prev = queue.prev();
  if (prev) {
    startSong(prev);
    setTimeout(() => { transitioning = false; }, 300);
  } else transitioning = false;
});

// Volume: drag or scroll on the knob; tooltip with the number.
let volTip = null;
function showVolTip(v) {
  if (!volTip) {
    volTip = document.createElement('span');
    volTip.className = 'vol-tip';
    if (powerKnob && powerKnob.parentElement) powerKnob.parentElement.appendChild(volTip);
  }
  volTip.textContent = String(v);
  volTip.classList.add('show');
  clearTimeout(showVolTip._t);
  showVolTip._t = setTimeout(() => volTip.classList.remove('show'), 1200);
}
function changeVolume(delta) {
  const v = Math.max(0, Math.min(100, player.getVolume() + delta));
  player.setVolume(v);
  showVolTip(v);
  try { localStorage.setItem('radioVolume', String(v)); } catch {}
}
if (powerKnob) {
  let dragging = false;
  let startY = 0; let startVol = 0;
  powerKnob.addEventListener('pointerdown', (e) => {
    if (!powered) return;
    dragging = true; startY = e.clientY; startVol = player.getVolume();
    powerKnob.setPointerCapture(e.pointerId);
  });
  powerKnob.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dv = Math.round((startY - e.clientY) / 2);
    const v = Math.max(0, Math.min(100, startVol + dv));
    player.setVolume(v);
    showVolTip(v);
  });
  powerKnob.addEventListener('pointerup', () => {
    if (dragging) { try { localStorage.setItem('radioVolume', String(player.getVolume())); } catch {} }
    dragging = false;
  });
  powerKnob.addEventListener('wheel', (e) => {
    if (!powered) return;
    e.preventDefault();
    changeVolume(e.deltaY < 0 ? 5 : -5);
  }, { passive: false });
}

// ---------- keyboard ----------
document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
  switch (e.key) {
    case ' ': e.preventDefault(); if (powered) player.toggle(); else powerOn(); break;
    case 'n': case 'N': if (powered) transition(); break;
    case 'p': case 'P': if (powered && btnPrev) btnPrev.click(); break;
    case 'ArrowUp': e.preventDefault(); if (powered) changeVolume(5); break;
    case 'ArrowDown': e.preventDefault(); if (powered) changeVolume(-5); break;
  }
});

// ---------- STEP 8: Bhaiya the DJ ----------
const djBubble = $('dj-bubble');
const djText = $('dj-text');
const TALK_KEY = 'bhaiyaTalk';
const VOICE_KEY = 'bhaiyaVoice';
let bhaiyaTalk = (() => { try { return localStorage.getItem(TALK_KEY) !== 'off'; } catch { return true; } })();
let bhaiyaVoice = (() => { try { return localStorage.getItem(VOICE_KEY) !== 'off'; } catch { return true; } })();
const talkPolicy = createTalkPolicy({});
let recentLines = [];
let typingTimer = null;

function typeOut(text) {
  if (!djText) return;
  clearInterval(typingTimer);
  let i = 0;
  djText.textContent = '';
  typingTimer = setInterval(() => {
    i++;
    djText.textContent = text.slice(0, i);
    if (i >= text.length) clearInterval(typingTimer);
  }, 22);
}

function showBubble(text) {
  if (!djBubble) return;
  djText.textContent = '';
  djBubble.classList.remove('hidden');
  typeOut(text);
}

function hideBubble() {
  if (djBubble) djBubble.classList.add('hidden');
  clearInterval(typingTimer);
}

function bhaiyaSpeaks(song) {
  const ded = (typeof dedicationAnnouncement === 'function') ? dedicationAnnouncement(song) : null;
  const line = ded
    ? `💌 ${ded}`
    : pickLine({ tags: [currentPart, queue.mood()], recent: recentLines });
  recentLines.push(line);
  if (recentLines.length > 15) recentLines.shift();
  const text = introFor(song, { part: currentPart, mood: queue.mood(), line });
  const vol = player.getVolume() || savedVolume;
  showBubble(text);
  const finish = () => {
    setTimeout(() => {
      hideBubble();
      player.fadeTo(vol, 800);
    }, 2000);
  };
  if (bhaiyaVoice && powered) {
    player.fadeTo(20, 400);
    setTimeout(() => speak(text, { onEnd: finish }), 450);
  } else {
    // voice off (or not powered): bubble only for ~6 s
    setTimeout(finish, 6000);
  }
}

// "🎙️ Bhaiya ki Baatein" and "Voice" switches (saved in localStorage)
let djSwitches = document.querySelector('.dj-switches');
if (!djSwitches) {
  djSwitches = document.createElement('div');
  djSwitches.className = 'dj-switches';
  djSwitches.innerHTML = `
    <label class="amb-switch"><input type="checkbox" id="dj-talk" checked><span>🎙️ Bhaiya ki Baatein</span></label>
    <label class="amb-switch"><input type="checkbox" id="dj-voice" checked><span>Voice</span></label>`;
  if (mixerEl && mixerEl.parentElement) mixerEl.parentElement.insertBefore(djSwitches, mixerEl.nextSibling);
  else document.body.appendChild(djSwitches);
}
const djTalkEl = $('dj-talk'), djVoiceEl = $('dj-voice');
if (djTalkEl) {
  djTalkEl.checked = bhaiyaTalk;
  djVoiceEl.checked = bhaiyaVoice;
  djTalkEl.addEventListener('change', () => {
    bhaiyaTalk = djTalkEl.checked;
    try { localStorage.setItem(TALK_KEY, bhaiyaTalk ? 'on' : 'off'); } catch {}
    if (!bhaiyaTalk) hideBubble();
  });
  djVoiceEl.addEventListener('change', () => {
    bhaiyaVoice = djVoiceEl.checked;
    try { localStorage.setItem(VOICE_KEY, bhaiyaVoice ? 'on' : 'off'); } catch {}
    if (!bhaiyaVoice && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });
}
// ---------- STEP 13: social links, Media Session, accessibility ----------
const SOCIAL_LINKS = {
  WhatsApp: '',
  Instagram: '',
  YouTube: ''
};
(function renderSocial() {
  const nav = document.getElementById('footer-social');
  if (!nav) return;
  for (const [name, url] of Object.entries(SOCIAL_LINKS)) {
    if (!url) continue; // a link with an empty URL is NOT shown
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = name;
    nav.appendChild(a);
  }
})();

// visually hidden live region announcing the current song
const liveRegion = document.createElement('p');
liveRegion.className = 'visually-hidden-live';
liveRegion.setAttribute('aria-live', 'polite');
document.body.appendChild(liveRegion);

if ('mediaSession' in navigator) {
  try {
    navigator.mediaSession.setActionHandler('play', () => { if (powered) player.play(); else powerOn(); });
    navigator.mediaSession.setActionHandler('pause', () => player.pause());
    navigator.mediaSession.setActionHandler('nexttrack', () => transition());
    navigator.mediaSession.setActionHandler('previoustrack', () => { if (btnPrev) btnPrev.click(); });
  } catch { /* not all browsers support every handler */ }
}
function updateMediaSession(song) {
  if (!song || !('mediaSession' in navigator) || !navigator.mediaSession.metadata) {
    try { if (song && 'mediaSession' in navigator && navigator.mediaSession) navigator.mediaSession.metadata = null; } catch {}
    return;
  }
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: (song.singers || []).join(', '),
      album: song.film || 'Rangeela Salon Radio'
    });
  } catch {}
}


export { queue, player };
// ---------- STEP 10: Moods & Farmaish ----------
import { MOODS, MOOD_INFO } from './playlist.js';
import { matchRequest } from './moods.js';

function sayLine(text) {
  // show the bubble, optionally speak, then hide
  if (!djBubble) return;
  showBubble(text);
  const done = () => setTimeout(hideBubble, 2000);
  if (bhaiyaVoice && 'speechSynthesis' in window) speak(text, { onEnd: done });
  else setTimeout(done, 6000);
}

// --- mood cards ---
const moodGrid = $('mood-grid');
const moodAllBtn = $('mood-all');
let currentMoodUi = null;

function moodCount(mood) {
  return playable.filter((s) => s.moods && s.moods.includes(mood)).length;
}
function moodColor(mood) {
  return {
    baarish: 'linear-gradient(#5b7f9e, #8fb4c9)',
    romance: 'linear-gradient(#d84a6e, #f2a3b8)',
    masti: 'linear-gradient(#e8961f, #f4c95d)',
    dard: 'linear-gradient(#4a4a68, #7b7b9c)',
    roadtrip: 'linear-gradient(#3f7d4f, #7cb56f)',
    chai: 'linear-gradient(#9c6b3a, #d8a86a)'
  }[mood] || 'var(--cream)';
}

if (moodGrid) {
  for (const mood of MOODS) {
    const info = MOOD_INFO[mood];
    const btn = document.createElement('button');
    btn.className = 'mood-card';
    btn.dataset.mood = mood;
    btn.style.background = moodColor(mood);
    btn.innerHTML = `
      <span class="mc-emoji" aria-hidden="true">${info.emoji}</span>
      <span class="mc-hindi">${info.hindi}</span>
      <span class="mc-label">${info.label}</span>
      <span class="mc-count">${moodCount(mood)} gaane</span>`;
    btn.addEventListener('click', () => setMood(mood));
    moodGrid.appendChild(btn);
  }
  if (moodAllBtn) moodAllBtn.addEventListener('click', () => setMood(null));
}

function markPressedMood(mood) {
  document.querySelectorAll('.mood-card').forEach((c) => {
    c.classList.toggle('pressed', c.dataset.mood === mood);
  });
}

function setMood(mood) {
  currentMoodUi = mood;
  markPressedMood(mood);
  queue.setMood(mood);
  if (mood === 'baarish') setRain(true); // the Baarish mood turns rain on automatically
  if (powered) {
    if (ambSettings.static) ambience.tuningStatic(1200); // tune the dial
    sayLine(pickLine({ tags: [mood || currentPart], recent: recentLines }));
    transition();
  } else {
    sayLine(pickLine({ tags: [mood || currentPart], recent: recentLines }));
  }
}

// --- Farmaish ("Ask Bhaiya") ---
const farmaishText = $('farmaish-text');
const farmaishSend = $('farmaish-send');
const farmaishCancel = $('farmaish-cancel');
const farmaishTimer = $('farmaish-timer');
const farmaishResult = $('farmaish-result');

document.querySelectorAll('#farmaish-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    if (farmaishText) { farmaishText.value = chip.dataset.q; farmaishText.focus(); }
  });
});

let aiAbort = null;
function stopAiWait() {
  if (aiAbort) { aiAbort.abort(); aiAbort = null; }
  if (farmaishTimer) { farmaishTimer.classList.add('hidden'); clearInterval(farmaishTimer._t); }
  if (farmaishCancel) farmaishCancel.classList.add('hidden');
  if (farmaishSend) farmaishSend.disabled = false;
}

function applyFarmaish(songIds, reply) {
  const songs = songIds.map((id) => playable.find((s) => s.id === id)).filter(Boolean);
  if (songs.length > 0) queue.enqueue(songs.map((s) => s.id));
  sayLine(reply);
  if (farmaishResult) {
    farmaishResult.classList.remove('hidden');
    farmaishResult.innerHTML = `
      <p>💌 ${reply || 'Farmaish mil gayi!'}</p>
      ${songs.length ? `<ul>${songs.map((s) => `<li>${songLabel(s)}</li>`).join('')}</ul>` : ''}`;
  }
  if (songs.length > 0 && powered) transition(); // play the request next
}

async function sendFarmaish() {
  const text = (farmaishText && farmaishText.value || '').trim();
  if (!text) { if (farmaishText) farmaishText.focus(); return; }

  // Built-in matcher answers instantly when it understands.
  const local = matchRequest(text, playable);
  if (local.kind !== 'unknown') {
    applyFarmaish(local.songIds, local.reply);
    return;
  }

  // Unknown → ask the AI (with a 12 s countdown and a cancel link).
  if (farmaishSend) farmaishSend.disabled = true;
  if (farmaishCancel) farmaishCancel.classList.remove('hidden');
  let left = 12;
  if (farmaishTimer) {
    farmaishTimer.classList.remove('hidden');
    farmaishTimer.textContent = `Bhaiya soch rahe hain… ${left}s`;
    farmaishTimer._t = setInterval(() => {
      left--;
      if (left <= 0) { clearInterval(farmaishTimer._t); return; }
      farmaishTimer.textContent = `Bhaiya soch rahe hain… ${left}s`;
    }, 1000);
  }
  aiAbort = new AbortController();
  if (farmaishCancel) farmaishCancel.onclick = (e) => { e.preventDefault(); stopAiWait(); };
  try {
    const res = await fetch('/api/farmaish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        songs: playable.map(({ id, title, film, year, singers, composer, moods }) => ({ id, title, film, year, singers, composer, moods }))
      }),
      signal: aiAbort.signal
    });
    const data = await res.json();
    stopAiWait();
    if (data && Array.isArray(data.songIds) && data.songIds.length > 0) {
      applyFarmaish(data.songIds, data.reply);
    } else if (data && data.mode === 'builtin') {
      applyFarmaish([], 'Arre, yeh farmaish samajh nahi aayi. "Baarish wale gaane" ya "Kumar Sanu" jaisa kuch likho!');
    } else {
      applyFarmaish([], data && data.reply || 'Aaj bhaiya ka dimaag kaam nahi kar raha, thodi der baad try karo.');
    }
  } catch (e) {
    stopAiWait();
    if (e && e.name === 'AbortError') return;
    applyFarmaish([], 'Chitthi kho gayi lagta hai… dobara bhejo.');
  }
}
if (farmaishSend) farmaishSend.addEventListener('click', sendFarmaish);
if (farmaishText) farmaishText.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFarmaish(); } });

// ---------- STEP 11: Dedications, the old radio way ----------
import {
  buildDedication, dedicationText, encodeDedication, decodeDedication
} from './dedication.js';

// ---------- STEP 12: Aaj ki Diary (favourites, played today, own songs) ----------
import { parseYouTubeId } from './youtube-url.js';

const DIARY_KEY = 'salonDiary-v1';
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function loadDiary() {
  try {
    const raw = JSON.parse(localStorage.getItem(DIARY_KEY));
    if (!raw || typeof raw !== 'object') throw new Error('bad');
    return {
      favourites: Array.isArray(raw.favourites) ? raw.favourites.filter((f) => f && f.id && f.title) : [],
      played: Array.isArray(raw.played) ? raw.played.filter((p) => p && p.id && p.title) : [],
      playedDate: typeof raw.playedDate === 'string' ? raw.playedDate : '',
      custom: Array.isArray(raw.custom) ? raw.custom.filter((c) => c && c.id && c.title && c.youtubeId) : []
    };
  } catch { return { favourites: [], played: [], playedDate: '', custom: [] }; }
}
let diary = loadDiary();
function saveDiary() {
  try { localStorage.setItem(DIARY_KEY, JSON.stringify(diary)); } catch {}
}
// reset "played today" each new day
if (diary.playedDate !== todayKey()) { diary.played = []; diary.playedDate = todayKey(); saveDiary(); }

// custom songs join the pool for "Sab Gaane" and the diary
for (const c of diary.custom) {
  if (!playable.some((s) => s.id === c.id)) {
    playable.push({ id: c.id, title: c.title, film: 'Aapki Playlist', year: new Date().getFullYear(), singers: ['—'], composer: '', moods: [], youtubeId: c.youtubeId });
  }
}

const favList = $('fav-list'), favEmpty = $('fav-empty');
const playedList = $('played-list'), playedEmpty = $('played-empty');

function diarySong(id) {
  return playable.find((s) => s.id === id) || null;
}
function renderFavourites() {
  if (!favList) return;
  favList.innerHTML = '';
  if (favEmpty) favEmpty.classList.toggle('hidden', diary.favourites.length > 0);
  for (const f of diary.favourites.slice().reverse()) {
    const li = document.createElement('li');
    const playBtn = document.createElement('button');
    playBtn.textContent = '▶';
    playBtn.addEventListener('click', () => {
      queue.playNow(f.id); updateNowPlaying(queue.current()); startSong(queue.current());
    });
    const removeBtn = document.createElement('button');
    removeBtn.className = 'dl-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      diary.favourites = diary.favourites.filter((x) => x.id !== f.id);
      saveDiary(); renderFavourites(); updateHeartUI();
    });
    const span = document.createElement('span');
    span.className = 'dl-title';
    span.textContent = `${f.title}${f.film ? ` · ${f.film}` : ''}`;
    li.append(playBtn, span, removeBtn);
    favList.appendChild(li);
  }
}
function recordPlayed(song) {
  if (!song) return;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  diary.played.push({ id: song.id, title: song.title, film: song.film, time });
  if (diary.played.length > 50) diary.played.shift();
  saveDiary();
  renderPlayed();
}
function renderPlayed() {
  if (!playedList) return;
  playedList.innerHTML = '';
  if (playedEmpty) playedEmpty.classList.toggle('hidden', diary.played.length > 0);
  for (const p of diary.played.slice().reverse()) { // newest first
    const li = document.createElement('li');
    li.innerHTML = `<span class="dl-time">${p.time}</span><span class="dl-title"></span>`;
    li.querySelector('.dl-title').textContent = `${p.title}${p.film ? ` · ${p.film}` : ''}`;
    playedList.appendChild(li);
  }
}
renderFavourites();
renderPlayed();

// heart button in Now Playing
const npHeart = $('np-heart');
function isFavourite(id) { return diary.favourites.some((f) => f.id === id); }
function updateHeartUI() {
  if (!npHeart) return;
  const cur = queue.current();
  const on = cur && isFavourite(cur.id);
  npHeart.textContent = on ? '❤️' : '♡';
  npHeart.setAttribute('aria-label', on ? 'Remove from favourites' : 'Add to favourites');
  npHeart.title = '';
}
if (npHeart) npHeart.addEventListener('click', () => {
  const cur = queue.current();
  if (!cur) return;
  if (isFavourite(cur.id)) {
    diary.favourites = diary.favourites.filter((f) => f.id !== cur.id);
  } else {
    diary.favourites.push({ id: cur.id, title: cur.title, film: cur.film });
  }
  saveDiary(); renderFavourites(); updateHeartUI();
});

// add your own YouTube song
const addUrl = $('add-url'), addTitle = $('add-title'), addSend = $('add-send'), addStatus = $('add-status');
if (addSend) addSend.addEventListener('click', async () => {
  if (!addStatus.classList.contains('hidden')) addStatus.classList.add('hidden');
  const ytId = parseYouTubeId(addUrl.value);
  const title = (addTitle.value || '').trim();
  if (!ytId) {
    addStatus.textContent = 'Yeh YouTube link samajh nahi aaya — watch?v=… ya youtu.be/… wala link lagao.';
    addStatus.classList.remove('hidden');
    return;
  }
  if (!title) {
    addStatus.textContent = 'Gaane ka naam bhi likho!';
    addStatus.classList.remove('hidden');
    return;
  }
  if (diary.custom.some((c) => c.youtubeId === ytId)) {
    addStatus.textContent = 'Yeh gaana pehle se diary mein hai!';
    addStatus.classList.remove('hidden');
    return;
  }
  addSend.disabled = true;
  addStatus.textContent = 'Video check ho raha hai…';
  addStatus.classList.remove('hidden');
  try {
    let ok = false; let author = '';
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + ytId)}&format=json`);
      if (r.ok) { ok = true; const j = await r.json(); author = j.author_name || ''; }
    } catch { /* offline → we still allow it; the player's error handling covers dead ids */ }
    if (!ok) {
      addStatus.textContent = 'Yeh video radio pe nahi chal sakta. Doosra link try karo.';
      addSend.disabled = false;
      return;
    }
    const id = 'custom-' + ytId;
    diary.custom.push({ id, title, youtubeId: ytId, author });
    saveDiary();
    if (!playable.some((s) => s.id === id)) {
      playable.push({ id, title, film: 'Aapki Playlist', year: new Date().getFullYear(), singers: [author || '—'], composer: '', moods: [], youtubeId: ytId });
    }
    addUrl.value = ''; addTitle.value = '';
    addStatus.textContent = `Likha diya! "${title}" ab "Sab Gaane" aur diary se bajega.`;
  } catch {
    addStatus.textContent = 'Kuch gadbad ho gayi, dobara try karo.';
  }
  addSend.disabled = false;
});


const dedFrom = $('ded-from'), dedTown = $('ded-town'), dedTo = $('ded-to');
const dedSearch = $('ded-search'), dedList = $('ded-list');
const dedSend = $('ded-send'), dedError = $('ded-error'), dedShare = $('ded-share');
const dedLink = $('ded-link'), dedCopy = $('ded-copy'), dedWa = $('ded-wa');
let dedSongId = null;

// postmark with today's date
if ($('pc-postmark')) {
  const d = new Date();
  $('pc-postmark').textContent = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}\nRANGEELA POST`;
}

function renderDedList(filter) {
  if (!dedList) return;
  const q = (filter || '').toLowerCase().trim();
  const matches = playable.filter((s) =>
    !q || s.title.toLowerCase().includes(q) || s.film.toLowerCase().includes(q)
  ).slice(0, 40);
  dedList.innerHTML = '';
  if (matches.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Aisa koi gaana nahi mila…';
    dedList.appendChild(li);
    return;
  }
  for (const s of matches) {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.id = s.id;
    li.textContent = songLabel(s);
    if (s.id === dedSongId) li.classList.add('selected');
    li.addEventListener('click', () => {
      dedSongId = s.id;
      if (dedSearch) dedSearch.value = s.title;
      renderDedList(s.title);
    });
    dedList.appendChild(li);
  }
}
if (dedSearch) {
  dedSearch.addEventListener('input', () => renderDedList(dedSearch.value));
  renderDedList('');
}

function showDedError(msg) {
  if (!dedError) return;
  dedError.textContent = msg;
  dedError.classList.remove('hidden');
}
function hideDedError() { if (dedError) dedError.classList.add('hidden'); }

if (dedSend) dedSend.addEventListener('click', () => {
  hideDedError();
  const result = buildDedication({ from: dedFrom ? dedFrom.value : '', town: dedTown ? dedTown.value : '', to: dedTo ? dedTo.value : '', songId: dedSongId });
  if (!result.ok) { showDedError(result.error); return; }
  const d = result.data;
  const song = playable.find((s) => s.id === d.s);
  if (!song) { showDedError('Yeh gaana abhi radio pe nahi hai, doosra chuno'); return; }

  // queue it next and announce it before it plays
  pendingDedication = d;
  queue.enqueue([d.s]);
  if (powered) transition();

  // share box
  const enc = encodeDedication(d);
  const url = `${location.origin}${location.pathname}?d=${enc}`;
  if (dedShare) dedShare.classList.remove('hidden');
  if (dedLink) dedLink.value = url;
  if (dedWa) dedWa.href = `https://wa.me/?text=${encodeURIComponent(`${d.f} ne aapke liye ek gaana bheja hai 💌 Radio pe suno: ${url}`)}`;
});

if (dedCopy) dedCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(dedLink.value);
    dedCopy.textContent = 'Copied!';
    setTimeout(() => (dedCopy.textContent = 'Copy link'), 1600);
  } catch {
    dedLink.select();
    document.execCommand && document.execCommand('copy');
  }
});

// Announce the dedication before its song plays (called from the transition path).
let pendingDedication = null;
function dedicationAnnouncement(song) {
  if (!pendingDedication || pendingDedication.s !== song.id) return null;
  const text = dedicationText(pendingDedication, song);
  pendingDedication = null;
  return text;
}

// ---------- ?d=… welcome card ----------
(function initDedicationLink() {
  const params = new URLSearchParams(location.search);
  const enc = params.get('d');
  if (!enc) return;
  const d = decodeDedication(enc, playable);
  const wrap = document.createElement('div');
  wrap.className = 'ded-welcome';
  if (d) {
    const song = playable.find((s) => s.id === d.s);
    wrap.innerHTML = `
      <p>📻 <strong>${d.f}</strong> ne aapke liye ek gaana bheja hai!${song ? ` <em>${songLabel(song)}</em>` : ''}</p>
      <button class="btn-primary" id="ded-play">Sunao</button>`;
    document.body.prepend(wrap);
    const btn = $('ded-play');
    if (btn) btn.addEventListener('click', () => {
      wrap.remove();
      pendingDedication = d;
      if (!powered) {
        powerOn(); // starts the radio; then jump to the dedication song
        if (queue.current() && queue.current().id !== d.s) {
          queue.playNow(d.s);
          updateNowPlaying(queue.current());
          startSong(queue.current());
        }
      } else {
        queue.playNow(d.s);
        updateNowPlaying(queue.current());
        startSong(queue.current());
      }
    });
  } else {
    wrap.innerHTML = `<p>Yeh chitthi kho gayi 😅 Chalo, normal radio chalate hain!</p><button class="chip" id="ded-dismiss">Theek hai</button>`;
    document.body.prepend(wrap);
    const btn = $('ded-dismiss');
    if (btn) btn.addEventListener('click', () => wrap.remove());
  }
})();



// ---------- STEP 7: time of day + rain ----------
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// URL overrides for testing: ?time=raat / ?rain=1
const urlParams = new URLSearchParams(location.search);
let currentPart = null;
function applyPart(part) {
  if (!scene || part === currentPart) return;
  currentPart = part;
  scene.classList.remove('subah', 'dopahar', 'shaam', 'raat');
  scene.classList.add(part);
}
function checkTime() {
  const override = urlParams.get('time');
  applyPart(override && ['subah', 'dopahar', 'shaam', 'raat'].includes(override) ? override : partOfDay(new Date()));
}
checkTime();
setInterval(checkTime, 5 * 60 * 1000);

// Rain mode
const RAIN_KEY = 'rainMode';
function loadRainPref() {
  try { return localStorage.getItem(RAIN_KEY) === 'on'; } catch { return false; }
}
let rainOn = urlParams.has('rain') ? urlParams.get('rain') === '1' : loadRainPref();
const rainCanvas = $('rain-canvas');
const rain = rainCanvas ? createRain(rainCanvas, { reducedMotion }) : null;
let thunderTimer = null;

function scheduleThunder() {
  clearTimeout(thunderTimer);
  if (!rainOn || reducedMotion) return;
  const delay = (20 + Math.random() * 25) * 1000; // every 20–45 s
  thunderTimer = setTimeout(() => {
    if (!rainOn) return;
    // flash the whole scene twice for ~120 ms each
    scene.classList.add('thunder');
    scene.addEventListener('animationend', () => scene.classList.remove('thunder'), { once: true });
    setTimeout(() => scene.classList.remove('thunder'), 800); // safety
    setTimeout(() => ambience.thunder(), 500 + Math.random() * 1500); // 0.5–2 s later
    scheduleThunder();
  }, delay);
}

function setRain(on, { save = true } = {}) {
  rainOn = !!on;
  if (scene) scene.classList.toggle('rain-on', rainOn);
  if (rain) {
    if (rainOn) { reducedMotion ? rain.drawStatic() : rain.start(); }
    else rain.stop();
  }
  if (powered) {
    ambience.setEnabled('rain', rainOn);
    ambience.setLevel('rain', ambSettings.volume);
  }
  if (rainSwitch) rainSwitch.checked = rainOn;
  if (save) { try { localStorage.setItem(RAIN_KEY, rainOn ? 'on' : 'off'); } catch {} }
  if (rainOn) scheduleThunder(); else clearTimeout(thunderTimer);
}

// Big chrome switch next to the radio
let rainSwitch = document.querySelector('.rain-switch input');
if (!rainSwitch) {
  const wrap = document.createElement('label');
  wrap.className = 'rain-switch';
  wrap.innerHTML = '<input type="checkbox" id="rain-toggle"><span class="rs-track"><span class="rs-knob"></span></span><span class="rs-label">🌧️ Baarish Mode</span>';
  const radioEl = $('radio');
  if (radioEl && radioEl.parentElement) radioEl.parentElement.insertBefore(wrap, radioEl);
  else document.body.appendChild(wrap);
  rainSwitch = wrap.querySelector('input');
}
rainSwitch.addEventListener('change', () => setRain(rainSwitch.checked));

// ---------- STEP 15: Antakshari with Bhaiya ----------
import { initAntakshari } from './antakshari-ui.js';

const antakshari = initAntakshari({
  songs: playable,
  player,
  say: (text) => {
    showBubble(text);
    const done = () => setTimeout(hideBubble, 2000);
    if (bhaiyaVoice && 'speechSynthesis' in window) speak(text, { onEnd: done });
    else setTimeout(done, 6000);
  },
  pauseRadio: () => { try { player.pause(); } catch {} },
  resumeRadio: () => { /* the radio resumes on the next transition or play */ }
});
export { antakshari };
setRain(rainOn, { save: false });
