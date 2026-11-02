const HINDI_MONTHS = ['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
const HINDI_DAYS = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

export function initScene(date = new Date()) {
  const month = document.getElementById('cal-month');
  const day = document.getElementById('cal-day');
  const week = document.getElementById('cal-week');
  if (month) month.textContent = HINDI_MONTHS[date.getMonth()] + ' ' + date.getFullYear();
  if (day) day.textContent = String(date.getDate());
  if (week) week.textContent = HINDI_DAYS[date.getDay()];

  const tube = document.getElementById('tubelight');
  if (tube && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tube.classList.add('flicker');
    tube.addEventListener('animationend', () => tube.classList.remove('flicker'), { once: true });
  }
}
