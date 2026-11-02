// Rangeela Salon Radio — text-to-speech (browser only).
export function speak(text, { onStart, onEnd } = {}) {
  if (!('speechSynthesis' in window) || !text) {
    // Not supported: caller shows the bubble for ~6 s instead.
    if (onStart) onStart();
    setTimeout(() => { if (onEnd) onEnd(); }, 6000);
    return;
  }
  const synth = window.speechSynthesis;

  function pickVoice() {
    const voices = synth.getVoices();
    if (voices.length === 0) return null;
    return (
      voices.find((v) => v.lang === 'en-IN') ||
      voices.find((v) => v.lang === 'hi-IN') ||
      voices.find((v) => v.lang === 'en-GB') ||
      voices.find((v) => /^en/.test(v.lang)) ||
      voices[0]
    );
  }

  function utter() {
    synth.cancel(); // cancel any previous utterance
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1.0;
    let started = false;
    u.onstart = () => { started = true; if (onStart) onStart(); };
    u.onend = () => { if (onEnd) onEnd(); };
    u.onerror = () => { if (!started && onStart) onStart(); if (onEnd) onEnd(); };
    synth.speak(u);
    // Safety: some browsers never fire onstart.
    setTimeout(() => { if (!started && onStart) { started = true; onStart(); } }, 300);
  }

  if (synth.getVoices().length === 0) {
    let done = false;
    const go = () => { if (done) return; done = true; utter(); };
    synth.addEventListener('voiceschanged', go, { once: true });
    setTimeout(go, 800); // don't wait forever
  } else {
    utter();
  }
}
