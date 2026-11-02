// Rangeela Salon Radio — rain on the salon window (canvas, browser only).

export function createRain(canvas, opts = {}) {
  const ctx2d = canvas.getContext('2d');
  let raf = null;
  let running = false;
  let streaks = [];
  let drops = []; // glass droplets sliding down
  let splashes = []; // brief splatter rings when drops land on the sill
  const slant = 0.35;

  function size() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(10, Math.round(rect.width * dpr));
    canvas.height = Math.max(10, Math.round(rect.height * dpr));
    return { w: canvas.width, h: canvas.height };
  }

  function isMobile() {
    return window.matchMedia('(max-width: 820px)').matches;
  }

  function build() {
    const { w, h } = size();
    const count = isMobile() ? 80 : 200;
    streaks = Array.from({ length: count }, () => ({
      x: Math.random() * (w + 100) - 50,
      y: Math.random() * h,
      len: (8 + Math.random() * 14) * (h / 300),
      speed: (3 + Math.random() * 4) * (h / 300)
    }));
    drops = Array.from({ length: isMobile() ? 10 : 22 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (1.5 + Math.random() * 2.5) * (h / 300),
      v: 0.15 + Math.random() * 0.5
    }));
    splashes = [];
  }

  // wind gusts make the rain breathe instead of falling at one flat rate
  let gust = 0;
  let gustTarget = 0;
  let gustTimer = 0;

  function frame() {
    if (!running) return;
    const { w, h } = { w: canvas.width, h: canvas.height };
    ctx2d.clearRect(0, 0, w, h);

    // ease the gust strength toward a new random target every ~90 frames
    if (--gustTimer <= 0) { gustTarget = Math.random() * 0.8; gustTimer = 60 + Math.random() * 60; }
    gust += (gustTarget - gust) * 0.02;
    const rate = 1 + gust;

    // slanted streaks
    ctx2d.strokeStyle = 'rgba(210,230,245,0.55)';
    ctx2d.lineWidth = Math.max(1, h / 400);
    ctx2d.beginPath();
    for (const s of streaks) {
      ctx2d.moveTo(s.x, s.y);
      ctx2d.lineTo(s.x - s.len * slant, s.y + s.len);
      s.y += s.speed * rate;
      s.x -= s.speed * rate * slant;
      if (s.y > h) {
        s.y = -s.len; s.x = Math.random() * (w + 100);
        // now and then the streak ends in a small splatter on the sill
        if (Math.random() < 0.06 && splashes.length < 14) {
          splashes.push({ x: s.x, y: h - 4 - Math.random() * 6, r: 1, life: 1 });
        }
      }
      if (s.x < -60) s.x += w + 100;
    }
    ctx2d.stroke();

    // glass droplets with small trails
    for (const d of drops) {
      ctx2d.fillStyle = 'rgba(225,240,250,0.75)';
      ctx2d.beginPath();
      ctx2d.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.fillStyle = 'rgba(225,240,250,0.25)';
      ctx2d.fillRect(d.x - d.r * 0.4, d.y - d.r * 4, d.r * 0.8, d.r * 4);
      d.y += d.v * (1 + gust * 0.5);
      if (d.y - d.r > h) { d.y = -d.r; d.x = Math.random() * w; }
    }

    // expanding, fading splatter rings near the sill
    for (let i = splashes.length - 1; i >= 0; i--) {
      const sp = splashes[i];
      ctx2d.strokeStyle = `rgba(225,240,250,${0.45 * sp.life})`;
      ctx2d.lineWidth = Math.max(1, h / 500);
      ctx2d.beginPath();
      ctx2d.ellipse(sp.x, sp.y, sp.r, sp.r * 0.45, 0, 0, Math.PI * 2);
      ctx2d.stroke();
      sp.r += 0.5; sp.life -= 0.07;
      if (sp.life <= 0) splashes.splice(i, 1);
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    build();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  }

  // static rainy window for prefers-reduced-motion
  function drawStatic() {
    const { w, h } = size();
    ctx2d.clearRect(0, 0, w, h);
    ctx2d.strokeStyle = 'rgba(210,230,245,0.45)';
    ctx2d.lineWidth = Math.max(1, h / 400);
    ctx2d.beginPath();
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * w, y = Math.random() * h, len = 8 + Math.random() * 14;
      ctx2d.moveTo(x, y);
      ctx2d.lineTo(x - len * slant, y + len);
    }
    ctx2d.stroke();
    for (let i = 0; i < 18; i++) {
      ctx2d.fillStyle = 'rgba(225,240,250,0.7)';
      ctx2d.beginPath();
      ctx2d.arc(Math.random() * w, Math.random() * h, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
      ctx2d.fill();
    }
  }

  // pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (!running) return;
    if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
    else if (!raf) raf = requestAnimationFrame(frame);
  });

  window.addEventListener('resize', () => {
    if (running && !opts.reducedMotion) build();
    else if (opts.reducedMotion) drawStatic();
  });

  return {
    start,
    stop,
    drawStatic,
    isRunning: () => running
  };
}
