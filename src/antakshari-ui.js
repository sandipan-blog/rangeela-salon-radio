// Rangeela Salon Radio — Antakshari game UI (browser only).
// A school-competition blackboard: chalk text, burning agarbatti timer,
// diya lives, and Bhaiya as the opponent.
import { createGame, lastAkshar, matchesAkshar, aksharLabel, findInPlaylist } from './antakshari.js';
import { pickLine } from './quotes.js';

const $ = (id) => document.getElementById(id);
const BEST_KEY = 'antakshariBest';

function loadBest() {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}
function saveBest(n) {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch {}
}

export function initAntakshari({ songs, player, say, pauseRadio, resumeRadio }) {
  const section = $('antakshari');
  if (!section) return null;

  const board = $('anti-board');
  const startBtn = $('anti-start');
  const endBtn = $('anti-end');
  const input = $('anti-input');
  const sendBtn = $('anti-send');
  const micBtn = $('anti-mic');
  const statusEl = $('anti-status');
  const usedList = $('anti-used');
  const aksharDev = $('anti-akshar-dev');
  const aksharRom = $('anti-akshar-rom');
  const scoreEl = $('anti-score');
  const livesEl = $('anti-lives');
  const incense = $('anti-incense');
  const bestEl = $('anti-best');

  let game = null;
  let timerId = null;
  let checking = false;      // the server check pauses the countdown
  let radioPausedByGame = false;
  let recentTease = [];

  const aiOn = (() => { let v = null; fetch('/api/config').then((r) => r.json()).then((j) => { v = !!j.ai; }).catch(() => {}); return () => v; })();
  const aiAvailable = () => aiOn() !== false;

  function tease(kind) {
    const line = pickLine({ tags: ['antakshari'], recent: recentTease, rng: Math.random });
    recentTease.push(line);
    if (recentTease.length > 10) recentTease.shift();
    return line;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || '';
  }

  function renderAkshar() {
    const st = game ? game.state() : null;
    const a = st && st.phase === 'player' ? st.akshar : null;
    if (a) {
      if (aksharDev) aksharDev.textContent = aksharLabel(a);
      if (aksharRom) aksharRom.textContent = '"' + a + '"';
    } else {
      if (aksharDev) aksharDev.textContent = '?';
      if (aksharRom) aksharRom.textContent = 'Bhaiya ki baari…';
    }
  }

  function renderState() {
    const st = game.state();
    if (scoreEl) scoreEl.textContent = String(st.score);
    if (livesEl) livesEl.innerHTML = Array.from({ length: 3 }, (_, i) =>
      `<span class="diya${i < st.lives ? '' : ' out'}" title="${i < st.lives ? 'zinda' : 'bujhi'}">🪔</span>`).join('');
    if (usedList) {
      usedList.innerHTML = st.used.slice(-8).map((t) => `<li>${escapeHtml(pretty(t))}</li>`).join('');
    }
    renderAkshar();
    if (bestEl) bestEl.textContent = String(Math.max(loadBest(), st.phase === 'over' ? st.score : 0));
  }

  const pretty = (t) => t.replace(/\b\w/g, (c) => c.toUpperCase());
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // The burning agarbatti: it burns down over the turn time.
  function startIncense(ms) {
    stopIncense();
    if (!incense) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      incense.style.setProperty('--burn', '1');
      return;
    }
    const t0 = Date.now();
    timerId = setInterval(() => {
      if (!game || checking) return;                 // paused while the AI checks
      const left = Math.max(0, deadlineLeft(t0, ms));
      incense.style.setProperty('--burn', String(left / ms));
      if (left <= 0) {
        stopIncense();
        onTimeout();
      }
    }, 200);
  }
  const deadlineLeft = (t0, ms) => ms - (Date.now() - t0);
  function stopIncense() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    if (incense) incense.style.setProperty('--burn', '0');
  }

  function pauseForGame() {
    if (player && typeof player.pause === 'function') {
      try { player.pause(); radioPausedByGame = true; } catch {}
    }
    if (typeof pauseRadio === 'function') pauseRadio();
  }
  function unpauseForGame() {
    if (typeof resumeRadio === 'function') resumeRadio();
    radioPausedByGame = false;
  }

  // Play a song for 40 s, then fade out and continue.
  function playSnippet(song, done) {
    if (!player || !song || !song.youtubeId) { if (done) setTimeout(done, 1200); return; }
    try {
      player.load(song, { autoplay: true });
      player.fadeTo(80, 300);
    } catch {}
    setTimeout(() => {
      try { player.fadeTo(15, 1500); } catch {}
      setTimeout(() => { if (done) done(); }, 1600);
    }, 40000);
  }

  function bhaiyaMove(now) {
    const st = game.state();
    const res = game.bhaiyaTurn(st.phase === 'bhaiya' ? null : null, now);
    if (!res) { gameOver(); return; }
    const line = res.bonus
      ? `Arre! ${tease()} Do point tumhare, aur naya gaana lagata hoon…`
      : `Meri baari! Suno zara… "${res.song.title}"`;
    if (typeof say === 'function') say(line);
    setStatus(res.bonus ? 'Bhaiya atke! +2 points tumhare 🎉' : `Bhaiya bola: ${res.song.title} · ab tumhari baari`);
    playSnippet(res.song, () => {});
    renderState();
    startIncense(game.state().deadline != null ? Math.max(1000, game.state().deadline - Date.now()) : 30000);
  }

  function onTimeout() {
    if (!game || game.state().phase !== 'player') return;
    const r = game.timeout(Date.now());
    if (typeof say === 'function') say(tease());
    setStatus('Time up! Ek zindagi gayi 💔');
    afterLoss(r);
  }

  function afterLoss(r) {
    renderState();
    if (game.state().phase === 'over') { gameOver(); return; }
    // Same letter stays; give a fresh countdown.
    startIncense(30000);
    if (game.state().deadline == null) {
      // createGame keeps deadline handling internal; just restart visuals.
    }
  }

  function gameOver() {
    stopIncense();
    const st = game.state();
    const best = Math.max(loadBest(), st.score);
    saveBest(best);
    setStatus(`Aapka score: ${st.score} · Bhaiya bole: ${tease()}`);
    if (typeof say === 'function') say(`Game khatam! Score ${st.score}. ${tease()}`);
    if (endBtn) endBtn.classList.add('hidden');
    if (startBtn) { startBtn.textContent = 'Phir se khelo'; startBtn.classList.remove('hidden'); }
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    if (aksharDev) aksharDev.textContent = '🏆';
    if (aksharRom) aksharRom.textContent = `Score ${st.score}`;
    if (bestEl) bestEl.textContent = String(best);
    unpauseForGame();
    game = null;
  }

  async function checkWithServer(text, akshar) {
    checking = true;
    setStatus('Ruko, yaad kar raha hoon…');
    try {
      const r = await fetch('/api/antakshari/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, akshar })
      });
      const j = await r.json();
      return j;
    } catch {
      return { ok: true, valid: null, mode: 'builtin' };
    } finally {
      checking = false;
    }
  }

  async function submitAnswer(text) {
    if (!game || game.state().phase !== 'player' || checking) return;
    const st = game.state();
    text = (text || '').trim();
    if (!text) return;

    // 1) Playlist match first: no server call needed.
    const inList = findInPlaylist(text, songs);
    if (inList) {
      const r = game.playerAnswer({ title: inList.title, film: inList.film, year: inList.year, inPlaylistId: inList.id }, Date.now());
      handleResult(r, inList);
      return;
    }

    // 2) No AI → only playlist songs count.
    if (!aiAvailable()) {
      const r = game.playerAnswer({ title: text }, Date.now());
      handleResult(r, null);
      return;
    }

    // 3) Ask the fast model whether this is a real song with the right letter.
    const j = await checkWithServer(text, st.akshar);
    if (j && j.valid === null) {
      // AI down → fall back to local-only validation.
      const r = game.playerAnswer({ title: text }, Date.now());
      handleResult(r, null);
      return;
    }
    if (j && j.valid) {
      const r = game.playerAnswer({ title: j.title, film: j.film, year: j.year }, Date.now());
      handleResult(r, null, j.reason);
    } else {
      const reason = (j && j.reason) || 'Yeh gaana nahi chala!';
      const r = game.loseLife(reason, Date.now());   // rejected by the server
      setStatus(reason + ' 💔');
      if (typeof say === 'function') say(tease());
      afterLoss(r);
      renderState();
    }
  }

  function handleResult(r, playlistSong, extraReason) {
    if (r.ok) {
      if (playlistSong && playlistSong.youtubeId) {
        setStatus(`Sahi jawab! ${playlistSong.title} 🎵`);
        playSnippet(playlistSong, () => {});
      } else {
        setStatus(`Sahi jawab! Par yeh cassette mere paas nahi hai 😅`);
        if (typeof say === 'function') say('Sahi jawab! Par yeh cassette mere paas nahi hai.');
      }
      if (typeof say === 'function') say(tease());
      renderState();
      // Bhaiya's turn next.
      setTimeout(() => bhaiyaMove(Date.now()), 1800);
    } else {
      if (typeof say === 'function') say(tease());
      setStatus((extraReason || r.reason || 'Galat jawab') + ' 💔');
      afterLoss(r);
      renderState();
    }
  }

  function startGame() {
    game = createGame({ songs, rng: Math.random, lives: 3, turnMs: 30000 });
    recentTease = [];
    if (input) { input.disabled = false; input.value = ''; input.focus(); }
    if (sendBtn) sendBtn.disabled = false;
    if (startBtn) startBtn.classList.add('hidden');
    if (endBtn) endBtn.classList.remove('hidden');
    if (bestEl) bestEl.textContent = String(loadBest());
    setStatus(aiAvailable() ? 'Bhaiya pehla gaana bajate hain…' : 'AI off hai, sirf mere cassette wale gaane chalenge!');
    pauseForGame();
    renderState();
    bhaiyaMove(Date.now());
  }

  function endGame() {
    if (game) { gameOver(); return; }
  }

  if (startBtn) startBtn.addEventListener('click', startGame);
  if (endBtn) endBtn.addEventListener('click', endGame);
  if (sendBtn) sendBtn.addEventListener('click', () => { if (input) submitAnswer(input.value); });
  if (input) input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitAnswer(input.value); }
  });

  // 🎤 voice input via SpeechRecognition (hidden when unavailable)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (micBtn && SR) {
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    micBtn.addEventListener('click', () => {
      if (input) input.value = '';
      try { rec.start(); micBtn.classList.add('listening'); setStatus('Suno… bolo!'); } catch {}
    });
    rec.onresult = (e) => {
      const said = e.results && e.results[0] && e.results[0][0] ? e.results[0][0].transcript : '';
      if (input) input.value = said;
      submitAnswer(said);
    };
    rec.onend = () => micBtn.classList.remove('listening');
    rec.onerror = () => { micBtn.classList.remove('listening'); setStatus('Mic samajh nahi aaya, likh ke bhejo.'); };
  } else if (micBtn) {
    micBtn.classList.add('hidden');
  }

  if (bestEl) bestEl.textContent = String(loadBest());

  return { startGame, endGame, get active() { return !!game; } };
}
