// Rangeela Salon Radio — time of day (pure logic, no DOM/browser APIs).

export function partOfDay(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const mins = h * 60 + m;
  if (mins >= 300 && mins < 720) return 'subah';       // 5:00–11:59
  if (mins >= 720 && mins < 990) return 'dopahar';     // 12:00–16:29
  if (mins >= 990 && mins < 1170) return 'shaam';      // 16:30–19:29
  return 'raat';                                       // 19:30–4:59
}

const GREETINGS = {
  subah: [
    'Subah ki chai ke saath ek achha gaana hi asli jagah hai.',
    'Subah subah mirror ke saamne baitho, garam chai aur purana gaana — din ban gaya.',
    'Aaj subah ka mausam kamaal ka hai, ek meetha sa gaana lagate hain.'
  ],
  dopahar: [
    'Dopahar ki neend bhagao, ek jhanka-beat gaana lagate hain.',
    'Dopahar ka suraj sar pe hai, thanda paani piyo aur gaana suno.',
    'Lunch ke baad ka yeh waqt hai jab salon mein sab aaram se baithe hain.'
  ],
  shaam: [
    'Shaam ho gayi, bulb jalao aur gaane ki volume thodi badhao.',
    'Shaam ki hawa mein purane gaane aur bhi pyaare lagte hain.',
    'Bazaar ki shaam, salon ki kursi aur radio ka gaana — life set hai.'
  ],
  raat: [
    'Raat ke sannate mein radio ki awaaz aur bhi gehri lagti hai.',
    'Raat ko sab ghar chale gaye, par radio aur hum tumhare saath hain.',
    'Andheri raat mein ek dard bhara gaana kitna sahi lagta hai, hai na?'
  ]
};

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function greeting(part, seed = '') {
  const list = GREETINGS[part] || GREETINGS.subah;
  const h = hashString(String(seed));
  return list[h % list.length];
}
