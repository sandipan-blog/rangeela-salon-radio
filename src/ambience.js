// Rangeela Salon Radio — salon ambience, all synthesised with the Web Audio API.
// ONE AudioContext, created on the first power-knob click.

export function createAmbience() {
  let ctx = null;
  let master = null;
  let started = false;
  let suspendedByHidden = false;

  // Layers: fan (on by default), rain (used by STEP 7).
  const layers = {
    fan: { node: null, level: 0.06, enabled: true },
    rain: { node: null, level: 0.25, enabled: false }
  };
  const mixer = { fan: 1, rain: 1 }; // per-layer slider multipliers

  let salonTimer = null; // random scissors + chai
  let suspended = false;

  function noiseBuffer(type = 'white', seconds = 2) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.0990460;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
      }
    } else { // brown
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    return buf;
  }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    return ctx;
  }

  // ---------- continuous layers ----------
  function buildFan() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer('brown', 3);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.value = layers.fan.level * mixer.fan;
    // slow 0.3 Hz amplitude wobble
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = layers.fan.level * 0.35 * mixer.fan;
    lfo.connect(lfoGain).connect(gain.gain);
    src.connect(lp).connect(gain).connect(master);
    src.start(); lfo.start();
    return { src, gain, lfo };
  }

  function buildRain() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer('pink', 3);
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 400;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 8000;
    const gain = ctx.createGain();
    gain.gain.value = 0; // faded in when enabled
    src.connect(hp).connect(lp).connect(gain).connect(master);
    src.start();

    // random drip plinks
    let dripTimer = setInterval(() => {
      if (!layers.rain.enabled || suspended) return;
      drip();
    }, 700);

    return { src, gain, dripTimer };
  }

  function applyLayer(name) {
    const L = layers[name];
    if (!L.node) return;
    const target = L.enabled ? L.level * mixer[name] : 0;
    try {
      L.node.gain.gain.cancelScheduledValues(ctx.currentTime);
      L.node.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.4);
    } catch {}
  }

  // ---------- one-shot sounds ----------
  function snip() {
    const t = ctx.currentTime;
    for (let k = 0; k < 2; k++) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer('white', 0.06);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 4200 + Math.random() * 1800; // 4–6 kHz
      bp.Q.value = 8;
      const g = ctx.createGain();
      const t0 = t + k * 0.07;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      src.connect(bp).connect(g).connect(master);
      src.start(t0); src.stop(t0 + 0.08);
    }
  }

  function clink() {
    const t = ctx.currentTime;
    [2600, 4100].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.01);
      const g = ctx.createGain();
      g.gain.setValueAtTime(i === 0 ? 0.06 : 0.035, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.32);
    });
  }

  function drip() {
    if (!ctx || suspended) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    const f = 1500 + Math.random() * 1500;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.03, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.1);
  }

  function thunder() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer('brown', 4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 120;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.8);   // slow swell
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3); // decay
    src.connect(lp).connect(g).connect(master);
    src.start(t); src.stop(t + 3.2);
  }

  function tuningStatic(ms = 1200) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = ms / 1000;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer('white', Math.max(1.5, dur));
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 3;
    // sweep 800 Hz -> 3 kHz -> 800 Hz
    bp.frequency.setValueAtTime(800, t);
    bp.frequency.linearRampToValueAtTime(3000, t + dur / 2);
    bp.frequency.linearRampToValueAtTime(800, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.05);
    g.gain.setValueAtTime(0.14, t + dur - 0.15);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + dur + 0.05);

    // a couple of short whistles: sine sliding 1.2 kHz -> 600 Hz
    const whistles = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < whistles; i++) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      const t0 = t + 0.1 + Math.random() * (dur - 0.5);
      o.frequency.setValueAtTime(1200, t0);
      o.frequency.exponentialRampToValueAtTime(600, t0 + 0.35);
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0.0001, t0);
      wg.gain.linearRampToValueAtTime(0.05, t0 + 0.05);
      wg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      o.connect(wg).connect(master);
      o.start(t0); o.stop(t0 + 0.45);
    }
  }

  // ---------- random salon sounds loop ----------
  function scheduleSalon() {
    clearTimeout(salonTimer);
    const next = (min, max) => (min + Math.random() * (max - min)) * 1000;
    const tick = () => {
      if (started && !suspended) {
        const r = Math.random();
        if (r < 0.5) snip(); else clink();
      }
      salonTimer = setTimeout(tick, next(25, 60)); // both fall inside 25–60 s on average
    };
    // first sound after 25–60 s, then keep going
    salonTimer = setTimeout(function first() {
      tick();
    }, next(25, 60));
  }

  // ---------- visibility ----------
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend();
    else resume();
  });

  return {
    start() {
      ensureCtx();
      if (started) { if (ctx.state === 'suspended') ctx.resume(); return; }
      started = true;
      layers.fan.node = buildFan().gain;
      const rainParts = buildRain();
      layers.rain.node = rainParts.gain;
      layers.rain.dripTimer = rainParts.dripTimer;
      applyLayer('fan');
      scheduleSalon();
      if (ctx.state === 'suspended') ctx.resume();
    },
    setEnabled(name, on) {
      if (!layers[name]) return;
      layers[name].enabled = !!on;
      applyLayer(name);
    },
    setLevel(name, v) {
      if (!layers[name]) return;
      mixer[name] = Math.max(0, Math.min(1, v));
      applyLayer(name);
    },
    getLevel(name) { return mixer[name]; },
    isEnabled(name) { return !!(layers[name] && layers[name].enabled); },
    tuningStatic,
    thunder,
    scissors: snip,
    chai: clink,
    suspend() { suspend(); },
    resume() { resume(); }
  };

  function suspend() {
    suspended = true;
    if (ctx && ctx.state === 'running') { suspendedByHidden = true; ctx.suspend(); }
  }
  function resume() {
    suspended = false;
    if (ctx && ctx.state === 'suspended' && suspendedByHidden) { suspendedByHidden = false; ctx.resume(); }
  }
}
