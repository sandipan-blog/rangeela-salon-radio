// Rangeela Salon Radio — YouTube IFrame player wrapper (browser only).
// Follows "HOW SONGS PLAY": loads the API once, one player, states, errors,
// fading with setTimeout, and a mobile tap fallback.

let apiPromise = null;

function loadIframeApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof window.YT !== 'undefined' && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') try { prev(); } catch {}
      resolve(window.YT);
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => reject(new Error('youtube-api-failed'));
    document.head.appendChild(s);
    setTimeout(() => {
      if (typeof window.YT !== 'undefined' && window.YT.Player) return;
      reject(new Error('youtube-api-timeout'));
    }, 15000);
  }).catch((err) => {
    apiPromise = null; // allow retry
    throw err;
  });
  return apiPromise;
}

export function createPlayer({ onEnded, onError, onPlaying, onPaused, onProgress, onBuffering, onUnstarted }) {
  let yt = null;
  let readyResolve;
  const ready = new Promise((r) => { readyResolve = r; });
  let progressTimer = null;
  let fadeTimer = null;
  let savedVolume = 80;
  let currentSongId = null;
  let wantAutoplay = false;
  let unstartedTimer = null;

  function stopProgress() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
  }

  function startProgress() {
    stopProgress();
    progressTimer = setInterval(() => {
      if (!yt || !yt.getCurrentTime || !yt.getDuration) return;
      const time = yt.getCurrentTime() || 0;
      const duration = yt.getDuration() || 0;
      if (onProgress && duration > 0) onProgress({ time, duration });
    }, 250);
  }

  function handleState(state) {
    if (unstartedTimer) { clearTimeout(unstartedTimer); unstartedTimer = null; }
    switch (state) {
      case -1: // UNSTARTED
        if (onUnstarted) onUnstarted();
        break;
      case 0: // ENDED
        stopProgress();
        if (onEnded) onEnded();
        break;
      case 1: // PLAYING
        startProgress();
        if (onPlaying) onPlaying();
        break;
      case 2: // PAUSED
        stopProgress();
        if (onPaused) onPaused();
        break;
      case 3: // BUFFERING
        if (onBuffering) onBuffering();
        break;
      case 5: // CUED
        break;
    }
  }

  loadIframeApi().then((YT) => {
    yt = new YT.Player('yt-player', {
      width: '100%',
      height: '100%',
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        playsinline: 1,
        modestbranding: 1,
        fs: 1,
        iv_load_policy: 3,
        origin: location.origin
      },
      events: {
        onReady: () => {
          try { yt.setVolume(savedVolume); } catch {}
          readyResolve();
        },
        onStateChange: (e) => handleState(e.data),
        onError: (e) => {
          if (onError) onError(e.data);
        }
      }
    });
  }).catch((err) => {
    if (onError) onError('api', err && err.message);
  });

  return {
    ready,
    load(song, { autoplay = false } = {}) {
      if (!song || !song.youtubeId) return;
      currentSongId = song.id;
      wantAutoplay = autoplay;
      ready.then(() => {
        if (!yt) return;
        try {
          if (autoplay) yt.loadVideoById(song.youtubeId);
          else yt.cueVideoById(song.youtubeId);
        } catch {}
        if (autoplay) {
          // Mobile fallback: if nothing starts within 5 s, tell the UI.
          if (unstartedTimer) clearTimeout(unstartedTimer);
          unstartedTimer = setTimeout(() => {
            let st = -1;
            try { st = yt.getPlayerState(); } catch {}
            if (st === -1 || st === 5) {
              if (onUnstarted) onUnstarted(true);
            }
          }, 5000);
        }
      });
    },
    play() {
      ready.then(() => { try { yt.playVideo(); } catch {} });
    },
    pause() {
      ready.then(() => { try { yt.pauseVideo(); } catch {} });
    },
    toggle() {
      ready.then(() => {
        try {
          const st = yt.getPlayerState();
          if (st === 1) yt.pauseVideo(); else yt.playVideo();
        } catch {}
      });
    },
    setVolume(v) {
      const vol = Math.max(0, Math.min(100, Math.round(v)));
      savedVolume = vol;
      ready.then(() => {
        try { yt.setVolume(vol); if (yt.isMuted && yt.isMuted()) yt.unMute(); } catch {}
      });
    },
    getVolume() {
      return savedVolume;
    },
    getCurrentTime() {
      try { return yt ? yt.getCurrentTime() : 0; } catch { return 0; }
    },
    seekTo(seconds) {
      ready.then(() => { try { yt.seekTo(seconds, true); } catch {} });
    },
    fadeTo(target, ms) {
      if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
      const from = this.getVolume();
      const to = Math.max(0, Math.min(100, Math.round(target)));
      const steps = Math.max(1, Math.floor(ms / 50));
      let i = 0;
      fadeTimer = setInterval(() => {
        i++;
        const v = Math.round(from + ((to - from) * i) / steps);
        this.setVolume(v);
        if (i >= steps) {
          clearInterval(fadeTimer);
          fadeTimer = null;
        }
      }, 50);
    },
    destroy() {
      stopProgress();
      if (fadeTimer) clearInterval(fadeTimer);
      if (unstartedTimer) clearTimeout(unstartedTimer);
    }
  };
}
