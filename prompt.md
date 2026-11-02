# RANGEELA SALON RADIO: step-by-step prompt for the loop agent

## How to run this with loop (for the human)
Start loop in `~/loop/gaming_hackathon/` (so `.loop/APPEND_SYSTEM.md` with "Reasoning: low" is used), pick GLM-5.3 with `/model`, then send these messages ONE AT A TIME. Wait for each one to finish (and its CHECK to pass) before sending the next.

1. `Read rangeela-salon-radio/prompt.md. Do not plan or analyse. Do STEP 1 only.`
2. `Do STEP 2 only. Write the files now.`
3. `Do STEP 3 only. Write the files now.`
4. `Do STEP 4 only.`
5. `Do STEP 5 only. Write the files now.`
6. `Do STEP 6 only. Write the files now.`
7. `Do STEP 7 only. Write the files now.`
8. `Do STEP 8 only. Write the files now.`
9. `Do STEP 9 only. Write the files now.`
10. `Do STEP 10 only. Write the files now.`
11. `Do STEP 11 only. Write the files now.`
12. `Do STEP 12 only. Write the files now.`
13. `Do STEP 13 only. Write the files now.`
14. `Do STEP 14 only. Write the files now.`
15. `Do STEP 15 only.`

- Run `/new` before STEP 5 and before STEP 10 (big steps), then send `Read rangeela-salon-radio/prompt.md. Do not plan or analyse. Check what already exists in rangeela-salon-radio, then do STEP N only.`
- If it stalls or thinks too long: press esc and send `Write the file now, don't plan.`
- If a CHECK fails: send `The STEP N check failed. Fix the code (not the tests) and rerun the check.`
- If you see `sse error` / a connection error: send the same message again.
- To try it yourself after STEP 6: `cd ~/loop/gaming_hackathon/rangeela-salon-radio && npm start`, then open http://localhost:8086 and press the radio's power knob.
- The AI DJ uses GLM-5.3 with the login already saved in `~/.secrets/salon-radio.json` (outside the project). Never paste the key into loop or into a project file. Without that file the radio still works with its built-in DJ lines.

---

## What we are building
A browser-first **retro Hindi music radio** that feels like sitting in a small 1990s Indian neighbourhood hair-cutting salon on a lazy afternoon: mint-green walls, a big mirror with bulbs, a ceiling fan turning, an old CRT TV on the wall shelf playing the song, a transistor radio on the counter, a wall calendar, a rate card painted by hand, and the "bhaiya" behind you chatting between songs.

The name is our own: **Rangeela Salon Radio** (रंगीला सैलून रेडियो). Do NOT copy the name, text, logo, quotes or design of any existing website.

Features:
1. **Retro Station**: a continuous playlist of 90s and 2000s Hindi film songs, played through the official YouTube embedded player (shown on the salon's CRT TV), controlled by our own radio-style controls.
2. **Moods**: Baarish (rain), Romance, Masti (party), Dard Bhare (sad), Road Trip and Chai Time. Each filters and orders the playlist.
3. **Rain Mood**: rain falling on the salon window, glass droplets, a darker sky, thunder flashes, and a generated rain-and-thunder sound layer under the music.
4. **Salon ambience**: a ceiling-fan hum, scissors snipping, a chai glass clink and radio tuning static between songs, all generated with the Web Audio API (no audio files).
5. **Bhaiya the AI DJ**: between songs, a short, funny Hinglish line about the next song in the voice of the salon bhaiya, written by GLM-5.3 (or picked from a built-in bank of lines when the AI is off), shown in a speech bubble and read aloud with the browser's text-to-speech while the music volume dips.
6. **Farmaish (requests)**: "Ask Bhaiya" with a text box. Type "something for a rainy evening" or "Kumar Sanu ke gaane" and he builds a queue from the playlist.
7. **Dedications, the old radio way**: "Yeh gaana Jhumri Telaiya se Rahul ki taraf se Priya ke liye…". Enter your name, your town and a friend's name and pick a song; bhaiya announces the dedication on air and you get a link to share. When the friend opens the link, the dedication plays for them.
8. **Aaj ki Diary**: favourites, today's played list and "add your own YouTube song".
9. About, FAQ and footer sections, mobile-friendly, no login, no app, no payments.

---

## Rules for the agent (read once, follow every step)
- Do ONLY the step you are asked for, run that step's CHECK, then stop and report the real check output. Do not plan or start later steps.
- ALL files go inside `rangeela-salon-radio/` (create it in STEP 1). Never create, edit or delete anything outside `rangeela-salon-radio/`. Never touch `echoloop`, `turbo-kart`, `turbo-kart-2`, `snakes-and-ladders`, `live-earth-tracker`, or any prompt file.
- Write real, working code to disk with the write tool. No placeholders, no "lorem ipsum", no TODO stubs.
- Never edit an earlier step's tests to make them pass; fix the code. Never delete a working feature.
- Do not claim something was tested unless you ran the command and saw the output.
- **Music and copyright (strict):** songs play ONLY through the official YouTube IFrame Player API. Never download, rip, proxy, cache or host any audio or video. Never hide the YouTube player (it stays visible, at least 200 × 200 px, as the CRT TV screen) and never cover its branding. If a video can't be embedded, skip it. Use only official uploads (music labels' channels such as T-Series, Saregama, Tips, Venus, Zee Music, Sony Music India, YRF; or the film's official channel).
- **Original content only:** every DJ line, quote, sign, joke and text is written by you. Do not copy text from other websites.
- **SECRETS:** the real login is in `~/.secrets/salon-radio.json`. NEVER open, read, cat, print, copy or grep that file or anything in `~/.secrets/`. Only `server.js` (via `loadConfig`, STEP 9) reads it at runtime. Never put a key in a project file, a test, the browser code, a log or TEST_REPORT.md. Tests inject FAKE config values.
- No dark patterns: never require sharing to unlock anything; never fake counters, listener numbers or "live" numbers.
- Respect `prefers-reduced-motion` (stop the fan, rain and flicker animations; keep everything usable).

## Tech (fixed, do not debate)
- Plain HTML + CSS + vanilla JavaScript ES modules. No frameworks, no bundler, no npm dependencies.
- `package.json` (exactly): `{"name":"rangeela-salon-radio","private":true,"type":"module","scripts":{"start":"node server.js","test":"node --test tests/*.test.js","verify:playlist":"node scripts/verify-playlist.mjs"}}`. Use the `tests/*.test.js` glob (on Node 24, `node --test tests/` fails).
- Node 18+ `server.js` with built-in modules only (`node:http`, `node:fs`, `node:path`, `node:url`, `node:os`) and the global `fetch`. Port 8086 (`PORT` overrides). The YouTube player does NOT work from `file://`, so the site is always served by `server.js`.
- Allowed external resources ONLY: the YouTube IFrame API (`https://www.youtube.com/iframe_api`) and Google Fonts (one `<link>`): **Rozha One** (big Bollywood poster titles), **Yatra One** (Devanagari signboards), **Kalam** (handwritten chalk/marker text), **Special Elite** (typewriter labels), **Poppins** (body text). Everything else (images, icons, textures, sounds) is made with CSS, inline SVG, canvas or Web Audio. No image files except the generated `assets/og.svg`.
- Tests use `node:test` + `node:assert/strict`.
- **Pure-logic files must not touch the DOM, `window`, `YT`, `speechSynthesis`, Web Audio, `fetch` or the clock directly** (time is passed in), so Node can test them: `src/playlist.js`, `src/queue.js`, `src/moods.js`, `src/quotes.js`, `src/dj.js`, `src/dedication.js`, `src/timeofday.js`, `src/youtube-url.js`.

## Final file layout (inside rangeela-salon-radio/)
```
index.html  package.json  server.js  README.md  TEST_REPORT.md
assets/og.svg
scripts/verify-playlist.mjs
src/ styles.css scene.css main.js scene.js player.js ambience.js rain.js ui.js voice.js
     playlist.js queue.js moods.js quotes.js dj.js dedication.js timeofday.js youtube-url.js
tests/ playlist.test.js queue.test.js moods.test.js quotes.test.js dj.test.js dedication.test.js timeofday.test.js youtube-url.test.js server.test.js
```

---

## THE LOOK (the most important part: read this before STEPS 2, 7 and 14)
The whole page is ONE illustrated salon scene built with HTML, CSS and inline SVG, NOT a generic website with a dark card layout. The sections below the scene (About, FAQ) keep the same retro style, like pages of an old film magazine.

**Palette (CSS variables in `:root`):** `--wall: #9fd8c8` (mint distemper wall), `--wall-shade: #7cbfae`, `--wood: #8b5a2b`, `--wood-dark: #5e3a1a`, `--chrome: #d9dde0`, `--mirror: #cfe7ef`, `--poster-red: #c8102e`, `--marigold: #f4a300`, `--turmeric: #e8b923`, `--cream: #fff4dc`, `--ink: #2b1d14`, `--tube-light: #f4fbff`, `--night: #1b2238`. Text is `--ink` on `--cream`; never pure black on pure white.

**The salon scene (`#scene`, full width, about 100 vh on desktop, stacked on mobile):**
- **Wall**: mint green with a subtle distemper texture (a CSS `repeating-radial-gradient` noise or an SVG `feTurbulence` filter), a darker band at the bottom (dado), and a thin painted border line.
- **Signboard** across the top: a hand-painted board, "रंगीला हेयर कटिंग सैलून" in Yatra One and "RANGEELA HAIR CUTTING SALON · A/C · Prop. Pappu Bhai" in Rozha One, with red and yellow paint, a drop shadow, and slightly uneven letters (a small rotate on alternate words).
- **Mirror**: a big rounded-rectangle mirror with a wooden frame and 10 round bulbs around it that glow warm (box-shadow) and twinkle gently. A light diagonal reflection streak moves slowly across the glass.
- **CRT TV** on a wooden wall shelf: a chunky TV cabinet (wood-grain gradient, rounded screen, two knobs and a speaker grille) whose SCREEN is the YouTube player (`#yt-player`, at least 320 × 240 on desktop and 240 × 180 on mobile, never smaller than 200 × 200 in total). A faint scanline overlay sits on the TV frame AROUND the screen, never on top of the video. When nothing plays, the screen shows our own "colour bars" test card with "RANGEELA TV" (CSS).
- **Transistor radio** on the counter: THIS IS THE MAIN PLAYER UI (STEP 5). A leather-and-cream radio with a tuning dial window (frequency numbers 88–108 with a red needle that slides to a new position for every song), a big round POWER/VOLUME knob, chrome buttons (⏮ ⏯ ⏭), a little red "ON AIR" lamp, and a speaker grille that pulses softly with the beat (a CSS animation while playing).
- **Cassette label**: under the radio, a cassette whose paper label shows the current song title in Kalam handwriting, with two reels that spin while playing.
- **Ceiling fan**: an SVG fan at the top that spins with a CSS rotation (slow wobble). It speeds up a little in Masti mood.
- **Window** on the left with a view outside: sky, a neem tree, electric wires with a crow, and a "PCO STD ISD" shop board across the street. The sky changes with time of day (STEP 7) and rain (STEP 7).
- **Wall details**: a wall calendar (shows today's real date in Hindi month names, with a simple floral illustration), a hand-painted rate card ("Hair Cut ₹15 · Shave ₹5 · Champi ₹10 · Facial ₹25 · Bachchon ka Hair Cut ₹10"), framed generic retro film-poster ART that you draw yourself (bold shapes and fake film titles like "DIL KA RADIO" and "PYAAR KI CHAI", NOT real posters or real actors), a tube light that flickers once when the page loads, a small "No Credit · Aaj Nagad Kal Udhaar" sign, and a hook with a towel.
- **Barber chair** in the foreground (SVG, red leather, chrome): sitting customers are not needed; the empty chair is the "you" seat.
- **Bhaiya's speech bubble** (`#dj-bubble`): a comic-style bubble near the mirror that shows the DJ line, typed out letter by letter, with a small "Bhaiya" name tag.
- **Overall grain**: a very light film-grain overlay over the whole page (an animated SVG noise at 4% opacity) and a warm vignette. A "Purana TV effect" toggle adds stronger scanlines, colour fringing on headings and a slight flicker.

**Typography:** headings in Rozha One with a red-and-yellow layered text-shadow (Bollywood poster style); Hindi text in Yatra One; handwritten notes in Kalam; labels and buttons in Special Elite (typewriter); body text in Poppins. Buttons look like old plastic and chrome switches (bevelled, pressed-in state on click).

**Motion:** subtle and cosy. Fan rotation, bulb twinkle, radio grille pulse, reels spinning, the dial needle sliding with an ease-out-back, the speech bubble popping in, rain falling. All decorative motion stops under `prefers-reduced-motion`.

---

## HOW SONGS PLAY (read before STEPS 4, 5, 6, 8 and 14)
Songs are NEVER stored on our site. Each song in `src/playlist.js` only has a `youtubeId` (the 11 characters after `watch?v=` in a YouTube link). The browser plays it with YouTube's official **IFrame Player API**, inside the salon's CRT TV, and our radio controls send commands to that player. The audio streams straight from YouTube to the listener.

### The whole flow
```
user clicks the POWER knob ("Radio chalu karo")      <- a click is required: browsers block sound until the user interacts
  -> ambience.start()  (AudioContext created inside the click handler)
  -> player.load(queue.current(), { autoplay: true })
       -> YouTube state 3 BUFFERING -> 1 PLAYING        -> UI: ON AIR lamp on, reels spin, needle at dialFrequency, Now Playing strip
       -> while PLAYING: onProgress 4x/s                  -> progress line; at the START of each song, request the NEXT song's AI line (STEP 9)
       -> state 0 ENDED  (or the user presses next)
  -> transition():
       1. fadeTo(0, 600 ms)
       2. ambience.tuningStatic(1200 ms) + needle slides to the next frequency
       3. if shouldTalk: show bubble, speak the intro (music stays silent or ducked under the voice)
       4. queue.next() -> player.load(next, { autoplay: true }) -> fadeTo(savedVolume, 800 ms)
  -> on error 2/5/100/101/150/153: queue.skipBroken(id) -> toast "Yeh gaana abhi nahi chal sakta, agla…" -> transition()
```

### Loading the API (once)
- Add the script tag ONCE from `player.js`: `https://www.youtube.com/iframe_api`. YouTube calls the GLOBAL function `window.onYouTubeIframeAPIReady` when it is ready, so `player.js` sets that function and resolves a promise (`ready`). Never add the script twice (guard with a module-level flag).
- If the script fails to load within 15 s (offline, blocked by an ad blocker or a school network), show on the TV: "YouTube se signal nahi mil raha. Internet ya ad-blocker check karo." and a Retry button. The rest of the page keeps working.

### Creating the player (once)
```js
new YT.Player('yt-player', {
  width: '100%', height: '100%',
  videoId: firstSong.youtubeId,           // cued, not played, until the knob is clicked
  playerVars: { autoplay: 0, controls: 1, rel: 0, playsinline: 1, modestbranding: 1, fs: 1, iv_load_policy: 3, origin: location.origin },
  events: { onReady, onStateChange, onError }
});
```
- `playsinline: 1` stops iPhones from jumping to full screen. `rel: 0` keeps the related videos to the same channel. `origin` must be the page's own origin (this is why the site is served by `server.js` and never opened as `file://`; error 153 means the origin/referrer is missing).
- The `#yt-player` element sits inside the TV screen. The player must stay VISIBLE (at least 200 × 200 px), must never be covered by another element, and must never have `opacity: 0`, `display: none` or `visibility: hidden`. YouTube's own logo, ads and controls stay as they are.
- ONE player for the whole session. Never create a second (hidden) player to preload songs.

### Player states and what we do
| `event.data` | Name | What our UI does |
|---|---|---|
| -1 | UNSTARTED | nothing; if it stays here 5 s after `load(..., {autoplay:true})`, show the "▶ Agla gaana chalao" tap button (see Mobile) |
| 3 | BUFFERING | the ON AIR lamp blinks slowly; the cassette label shows "tuning…" |
| 1 | PLAYING | ON AIR lamp on, reels spin, grille pulses, Media Session state "playing", start the progress interval |
| 2 | PAUSED | lamp dim, reels stop, the ⏯ button shows play; if the user paused from the YouTube controls on the TV, our UI follows |
| 0 | ENDED | stop the progress interval and run `transition()` |
| 5 | CUED | the video is ready but not playing (the first song before the knob is clicked) |

### Errors and skipping
| Code | Meaning | Action |
|---|---|---|
| 2 | invalid video id | skip |
| 5 | HTML5 player error | retry ONCE with `loadVideoById` after 2 s, then skip |
| 100 | video removed or private | skip |
| 101, 150 | the owner doesn't allow embedding | skip |
| 153 | missing origin/referrer | log once to the console with a hint about serving over http://localhost; skip |
- Skipped ids go into a session list AND into `localStorage` key `brokenSongs` with the date, so they are skipped on the next visit for 7 days.
- If 5 songs in a row fail, stop trying and show "Aaj radio ka signal kamzor hai" with a Retry button (never loop forever).

### Our controls -> player methods
| Our control | Player call |
|---|---|
| Power knob (first time) | `ambience.start()`, then `loadVideoById(id)` (inside the click handler, so the browser allows sound) |
| ⏯ | `pauseVideo()` / `playVideo()` |
| ⏭ / N | `transition()` (fade, static, next) |
| ⏮ / P | if `getCurrentTime() > 5`: `seekTo(0, true)`; else `queue.prev()` and load it |
| Volume knob / ↑ ↓ | `setVolume(0–100)` and remember it in localStorage; `unMute()` if muted |
| Mood card, Farmaish, Dedication | change the queue, then `transition()` (or enqueue for "next") |
- `fadeTo(target, ms)`: change the volume in steps every 50 ms with `setTimeout` (NOT `requestAnimationFrame`, which stops in background tabs). Cancel a running fade before starting a new one.
- **One transition at a time**: a `transitioning` flag; pressing next twice quickly, or ENDED arriving during a manual next, must never start two songs, two static sounds or two DJ lines.
- **Background tabs**: browsers slow timers in hidden tabs, but the YouTube audio keeps playing and ENDED still fires. So `transition()` must work using only events and `setTimeout` (no `requestAnimationFrame`, no waiting on animations); the visuals can catch up when the tab is visible again.

### Sound levels and the DJ voice
- The YouTube volume (0–100) and our Web Audio ambience are separate. Ambience stays quiet (fan about 6%, rain about 25% of the ambience slider) so the music always leads.
- When bhaiya talks: `fadeTo(20, 400)`, speak, then `fadeTo(savedVolume, 800)`. Speech happens between songs or over the first seconds of the new song, never cutting a song in the middle.
- YouTube may show ADS before some videos. We cannot and must not skip or hide them. While an ad plays, the state is PLAYING as usual; that's fine.

### Mobile and lock screen (be honest about limits)
- iPhone/Android need the first tap (the knob). After that, the next song usually starts automatically. If the browser blocks it (the state stays UNSTARTED or CUED for 5 s), show a big "▶ Agla gaana chalao" button over the radio; one tap continues.
- When the phone screen locks, many mobile browsers pause YouTube embeds. That is a platform limit: say so in the FAQ ("Phone lock hone par gaana ruk sakta hai"). Media Session (STEP 13) helps where it works.

### What the playlist check guarantees (STEP 4)
- The oEmbed check (`https://www.youtube.com/oembed?url=…&format=json`) returns 200 for public, embeddable videos, 401/403 when embedding is disabled, and 404 when the video doesn't exist. It cannot detect country blocks or videos that later get removed, so the player's error handling above is still required.
- Before saving an id, compare the oEmbed `title` with our song title and the `author_name` with an official channel; reject mismatches.

---

## STEP 1: Skeleton and static server
Create `rangeela-salon-radio/package.json` (exactly as above), `rangeela-salon-radio/server.js`, `rangeela-salon-radio/index.html`, `rangeela-salon-radio/src/styles.css`, `rangeela-salon-radio/src/main.js`.
- `server.js` (static only for now): export `createApp(options)` that returns a `(req, res)` handler; start listening on `PORT || 8086` ONLY when run directly (`if (import.meta.url === pathToFileURL(process.argv[1]).href)`). Serve files from `rangeela-salon-radio/` with correct content types (html, js, mjs, css, json, svg, png, ico). Block path traversal (resolved path outside the folder → 403); unknown file → 404. Send `Cache-Control: no-cache` for html/js/css.
- `index.html`: `lang="en"`, viewport meta, title "Rangeela Salon Radio · 90s Hindi Gaane", a meta description, the Google Fonts `<link>` (the 5 fonts above), `src/styles.css`, and `<script type="module" src="src/main.js">`. Body structure:
  - `a.skip-link` ("Skip to radio"), `header#topbar` (a small logo text and nav links: Radio · Moods · Farmaish · Dedication · Diary · About · FAQ),
  - `section#scene` (empty for now, filled in STEP 2),
  - `section#moods`, `section#farmaish`, `section#dedication`, `section#diary`, `section#about`, `section#faq`, `footer#footer` (each with its heading for now).
- `main.js`: for now only log nothing and set the footer year.
- `styles.css`: the palette variables from THE LOOK, a cream background, body font Poppins, headings Rozha One, `.hidden { display:none !important }`, and `.skip-link` visible only on focus.
CHECK: `cd rangeela-salon-radio && (node server.js >/dev/null 2>&1 &) && sleep 1 && curl -s localhost:8086/ | grep -c 'id="scene"' && curl -s -o /dev/null -w "%{http_code}\n" localhost:8086/src/main.js && curl -s -o /dev/null -w "%{http_code}\n" "localhost:8086/../credentials.json"; pkill -f "node server.js"` → prints `1`, `200`, and `403` or `404`.

## STEP 2: The salon scene (HTML, CSS, SVG art)
Create `src/scene.css` and `src/scene.js`; fill `section#scene` in `index.html`; link `scene.css`.
- Build EVERYTHING listed under "The salon scene" in THE LOOK: wall with texture, signboard, mirror with 10 bulbs and a moving reflection streak, CRT TV on its shelf (with `<div id="yt-player"></div>` inside the screen area plus the colour-bars test card shown until a song plays), transistor radio (its controls are placeholders until STEP 5 but must already look finished: dial, needle, knob, three buttons, ON AIR lamp, grille), cassette with label and reels, ceiling fan, window with sky, tree, wires, crow and the PCO board, wall calendar, rate card, two framed made-up film posters, tube light, the two small signs, towel hook, barber chair, and `#dj-bubble` (hidden for now).
- Use CSS grid/absolute positioning inside a scene box with a fixed aspect ratio on desktop (16:9, `max-height: 100vh`) that scales with `clamp()` so it looks right from 1280 to 1920 px wide. Under 820 px wide, re-flow into a vertical stack: signboard → TV → radio → mirror with bubble → small strip of wall details. Nothing may overflow sideways on a 390 px phone.
- `scene.js` exports `initScene()`: fills the calendar with today's date (day number, Hindi month name from a list such as जनवरी … दिसंबर, and the weekday in Hindi), and plays the tube-light flicker once.
- Film grain overlay and warm vignette over the page; the "Purana TV effect" toggle can come later (STEP 14).
CHECK: start the server and take headless screenshots: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 --virtual-time-budget=5000 --screenshot=/tmp/g6-step2-desktop.png http://localhost:8086/` and the same at `--window-size=390,844` to `/tmp/g6-step2-phone.png`. Describe what is visible in each (list every scene element you can see and anything that overlaps or overflows). Fix overlaps before finishing. Stop the server.

## STEP 3: Playlist data (pure) + tests
Create `src/playlist.js` and `tests/playlist.test.js`.
- `export const MOODS = ['baarish','romance','masti','dard','roadtrip','chai'];` with display data `MOOD_INFO = { baarish: { label: 'Baarish', hindi: 'बारिश', emoji: '🌧️' }, romance: { …'रोमांस', '💞' }, masti: { …'मस्ती', '🕺' }, dard: { label: 'Dard Bhare', …'दर्द भरे', '💔' }, roadtrip: { label: 'Road Trip', …'सफ़र', '🛵' }, chai: { label: 'Chai Time', …'चाय', '☕' } }`.
- `export const SONGS = [...]`: each `{ id, title, film, year, singers: [], composer, moods: [], youtubeId }`. `id` is a short slug (`tujhe-dekha-to`). For now, fill in AT LEAST 48 well-known Hindi film songs from 1990–2009 (at least 8 per mood; a song may have up to 3 moods) with correct title, film, year, singers and composer, and `youtubeId: ''` (STEP 4 fills the IDs).
- `validateSongs(list)` → an array of error strings: missing fields; a year outside 1985–2012; an unknown mood; a duplicate `id`; a duplicate `youtubeId` (ignore empty ones); a `youtubeId` that is not empty and doesn't match `/^[A-Za-z0-9_-]{11}$/`.
- `playableSongs(list)` → songs with a valid `youtubeId` and not in a `disabled` set passed as the 2nd argument.
- `songLabel(s)` → `"Tujhe Dekha To · Dilwale Dulhania Le Jayenge (1995)"`.
Tests: the real `SONGS` list passes `validateSongs` (allowing empty youtubeIds for now); each kind of bad data produces an error; `playableSongs` skips empty, invalid and disabled ids; every mood has at least 8 songs.
CHECK: `npm test` → all pass.

## STEP 4: Find and verify the YouTube videos
Create `scripts/verify-playlist.mjs` and fill the `youtubeId`s in `src/playlist.js`.
- For each song, use web search to find the OFFICIAL upload (label or film channel; the search query can be `"<title>" <film> <year> official video youtube`). Take the 11-character id from the `watch?v=` URL. Prefer full-song videos (not jukeboxes, not 30-second shorts, not lyric covers by random channels).
- `scripts/verify-playlist.mjs`: for every song, request `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json` (no key needed), wait 300 ms between requests, and print one line per song: `OK  <id>  <title from YouTube>  <author_name>` or `FAIL <id> <HTTP status>` (404 = video doesn't exist; 401/403 = embedding is disabled). It exits with code 1 if any song fails and writes `scripts/verify-result.json` with `{ checkedAt, ok: [...ids], failed: [{ id, status }] }`.
- Run it. For every FAIL, find another official upload and rerun, until at least 40 songs pass AND every mood still has at least 6 passing songs. Songs that still fail after 2 tries get `youtubeId: ''` (they are skipped by `playableSongs`). Check each OK line's YouTube title/author: if it is clearly a different song or an unofficial channel, replace it.
- Add to `TEST_REPORT.md` a "Playlist" section: how many were checked, how many passed, and the list of songs left without a video.
CHECK: `npm run verify:playlist` → exit code 0 (only songs with a non-empty id are checked) and at least 40 OK lines; `npm test` → all pass.

## STEP 5: Queue logic (pure) + the radio player
Create `src/queue.js`, `tests/queue.test.js` and `src/player.js`; wire up the radio controls in `main.js`.
- `queue.js` (pure): `createQueue(songs, { mood = null, rng = Math.random, historySize = 10 })` → `{ current(), next(), prev(), peek(n = 1), setMood(mood), playNow(songId), enqueue(songIds), skipBroken(songId), history() }`.
  - Order: with a mood, only that mood's songs, shuffled; without a mood, all playable songs shuffled. A song played in the last `historySize` plays is not chosen again while other songs are available. When the order runs out, reshuffle (and the first song of the new round is never the last song played).
  - `enqueue(ids)` puts requested songs (Farmaish, STEP 10) next, in order, before the shuffled order. `playNow(id)` plays it right away. `prev()` goes back through history. `skipBroken(id)` removes a song for this session (an embed error) and moves on.
  - `dialFrequency(songId)` → a stable "FM frequency" between 88.1 and 107.9 (odd tenths, like a real band) computed from a hash of the id, used for the dial needle.
- Tests: no repeats within the history window (with a seeded rng: 200 nexts over 48 songs); a mood only gives that mood's songs; requested songs come first and in order; `prev` after `next` returns the previous song; `skipBroken` removes it; the reshuffle never repeats the last song first; `dialFrequency` is stable and in range with one decimal ending in an odd digit.
- `player.js` (browser): follow "HOW SONGS PLAY" exactly (loading, states, errors, fading, one transition at a time, the mobile tap fallback). It loads `https://www.youtube.com/iframe_api` ONCE, creates `new YT.Player('yt-player', { videoId, playerVars: { autoplay: 0, controls: 1, rel: 0, playsinline: 1, modestbranding: 1, origin: location.origin }, events: { onReady, onStateChange, onError } })` and exports `createPlayer({ onEnded, onError, onPlaying, onPaused, onProgress })` → `{ ready, load(song, { autoplay }), play(), pause(), toggle(), setVolume(0–100), getVolume(), fadeTo(volume, ms) }`.
  - State `0` (ended) → `onEnded`. Errors `100`, `101`, `150` (and `2`, `5`, `153`) → `onError(code)`; main.js then calls `queue.skipBroken` and plays the next song after the tuning static (STEP 6).
  - `onProgress` fires 4 times a second while playing with `{ time, duration }` (one `setInterval`, started once, cleared on pause/end, never duplicated).
- Radio UI (`main.js`): browsers block sound until the user clicks, so the big POWER knob says "Radio chalu karo" until clicked. Clicking it starts the first song. ⏮ / ⏯ / ⏭ work, the knob turned by drag or scroll changes the volume (and shows a little tooltip with the number), the ON AIR lamp glows while playing, the dial needle slides to `dialFrequency` for each song, the cassette label shows the song title, reels spin while playing, and a thin progress line runs along the bottom of the dial. A "Now Playing" strip under the scene shows the title, film, year, singers and a heart button (heart works in STEP 12).
- Keyboard: Space = play/pause (not while typing in an input), N = next, P = previous, ↑/↓ = volume.
CHECK: `npm test` → all pass; `node --check` on every file in src/. Start the server, take a headless screenshot at 1440×900 and describe the radio. (The headless browser can't press play with sound, so report honestly that playback needs a human check.)

## STEP 6: Salon ambience and tuning static (Web Audio)
Create `src/ambience.js`; use it in `main.js`.
- ONE `AudioContext`, created on the first power-knob click. A master gain → a small compressor → destination. Every sound below is SYNTHESISED (noise buffers, oscillators, filters, envelopes); no audio files.
  - `fan`: a quiet low hum (brown noise through a low-pass at 300 Hz, with a very slow 0.3 Hz amplitude wobble). On by default at a very low level.
  - `scissors()`: two quick metallic "snip" clicks (short band-passed noise bursts at about 4–6 kHz with fast decay). Plays at random every 25–60 s while ambience is on, quietly.
  - `chai()`: a glass clink (two sine partials around 2.6 kHz and 4.1 kHz with a 300 ms decay). Plays at random every 60–120 s.
  - `tuningStatic(ms = 1200)`: old radio tuning between songs: white noise through a band-pass whose frequency sweeps from 800 Hz to 3 kHz and back, with a couple of short whistles (a sine sliding from 1.2 kHz to 600 Hz). Used between every song and on embed errors.
  - `rain` (used by STEP 7): steady rain (pink noise, high-pass 400 Hz, low-pass 8 kHz), random drip "plinks" (short sine blips at 1.5–3 kHz), and `thunder()` (low-pass brown noise at 120 Hz with a slow 3 s swell and decay).
- `createAmbience()` → `{ start(), setEnabled(name, on), setLevel(name, 0–1), tuningStatic(ms), thunder(), suspend(), resume() }`. Suspend when the tab is hidden and the radio is paused; resume on play.
- An "Ambience" mini-mixer under the radio: switches for Fan, Salon sounds and Static between songs, and one ambience volume slider. Saved in `localStorage` (wrapped in try/catch).
- Between songs: fade the YouTube volume down over 600 ms → `tuningStatic` → the dial needle slides → the next song loads → fade up.
CHECK: `node --check` every file; `npm test` passes; screenshot shows the mixer. Report that the sounds need a human to listen.

## STEP 7: Rain Mood, time of day and the window
Create `src/rain.js` and `src/timeofday.js` (pure) + `tests/timeofday.test.js`; update `scene.css` and `main.js`.
- `timeofday.js`: `partOfDay(date)` → `'subah'` (5:00–11:59), `'dopahar'` (12:00–16:29), `'shaam'` (16:30–19:29) or `'raat'` (19:30–4:59), from the user's LOCAL time. `greeting(part)` → "Subah ki chai ke saath…", "Dopahar ki neend bhagao…", "Shaam ho gayi…", "Raat ke sannate mein…" (write your own variations, at least 3 per part, and pick one using a seed). Tests for the boundaries (4:59, 5:00, 11:59, 12:00, 16:29, 16:30, 19:29, 19:30) and for the greeting being deterministic for a given seed.
- The window sky and the room light follow `partOfDay`: subah = pale yellow-blue with soft sunbeams across the wall; dopahar = bright blue, strong light; shaam = orange-pink sunset, warm wall; raat = deep blue with a few stars, and the tube light ON (cool white glow on the wall, light falloff). Changing it is a CSS class on `#scene` with transitions; it re-checks every 5 minutes.
- **Rain Mood** toggle (a big chrome switch "🌧️ Baarish Mode" next to the radio, and the Baarish mood turns it on automatically):
  - `rain.js` draws on a `<canvas>` that covers the WINDOW only: slanted rain streaks (about 200 at desktop size, fewer on mobile, `requestAnimationFrame` loop started once and stopped when rain is off or the tab is hidden), and drops that slide down the window glass with small trails.
  - The sky turns grey-blue, the room darkens slightly, the mirror bulbs glow warmer, and every 20–45 s a thunder flash (the whole scene brightens for 120 ms twice) followed by `ambience.thunder()` 0.5–2 s later.
  - The rain sound layer fades in under the music.
- Saved in `localStorage`. Under `prefers-reduced-motion`, show a static rainy window (no animation) and keep the rain sound.
CHECK: `npm test` → all pass; `node --check` every file; headless screenshots at 1440×900 with rain off and with rain on (add `?rain=1` support in main.js for testing, and `?time=raat` / `?time=subah` overrides), and describe the differences.

## STEP 8: Bhaiya's voice: built-in DJ lines + text-to-speech
Create `src/quotes.js`, `src/dj.js`, `src/voice.js`, `tests/quotes.test.js` and `tests/dj.test.js`; update `main.js`.
- `quotes.js`: `SALON_LINES`: at least 60 ORIGINAL short Hinglish lines in Roman script (one or two sentences each, under 160 characters), in the voice of a friendly, slightly filmy 90s salon bhaiya. Mix: about the haircut and the salon ("Baal chhote karein ya filmy? Pehle gaana suno"), about chai, about the weather and rain, about cricket and old TV, about love and the old days, and fun gyaan. Group them by tag: `general`, `baarish`, `romance`, `masti`, `dard`, `roadtrip`, `chai`, plus `subah`, `dopahar`, `shaam`, `raat`. Clean, family-friendly, no religion, politics, insults or real people's private lives (mentioning a film, its singer or its music director is fine).
  - `pickLine({ tags, recent, rng })` → a line matching any of the tags (falling back to `general`), never one of the `recent` 15.
- `dj.js` (pure): `introFor(song, { part, mood, line, dedication })` → the text bhaiya says before a song: optionally the greeting, the line, then the song intro: "Ab sunte hain <title>, film <film>, saal <year>, aawaz <singers>." With a dedication (STEP 11) the dedication sentence goes first. Keep it under 300 characters.
  - `shouldTalk(playCount, rng)` → bhaiya talks before the first song, then before about 1 in 2 songs (never twice in a row silent more than 3 times).
- `voice.js` (browser): `speak(text, { onStart, onEnd })` uses `speechSynthesis`. Pick the voice in this order: `en-IN`, `hi-IN`, any `en-GB`, any English; rate 0.95, pitch 1.0. Wait for `voiceschanged` if the voice list is empty. Cancel any previous utterance. If speech isn't supported, just show the bubble for 6 s.
- In `main.js`: before a song (when `shouldTalk`), duck the YouTube volume to 20% (fade 400 ms), show `#dj-bubble` with the text typing out, speak it, then fade the music back up and hide the bubble 2 s after speaking ends. A "🎙️ Bhaiya ki Baatein" on/off switch (saved in localStorage) and a "Voice" on/off switch (bubble only when the voice is off).
Tests: `pickLine` never returns a recent line and respects tags, with a fallback; there are at least 60 lines and none is over 160 characters; `introFor` contains the title, film, year and singers and stays under 300 characters; `shouldTalk` follows its rules with a seeded rng.
CHECK: `npm test` → all pass; `node --check` every file.

## STEP 9: The AI DJ with GLM (server) + tests
Extend `server.js`; extend `src/dj.js` and `tests/dj.test.js`; create `tests/server.test.js`.
- `loadConfig({ env = process.env, secretsPath })` in `server.js` → `{ llmApiKey, llmBaseUrl, llmModel, llmFallbackModel, llmMaxTokens }`. `secretsPath` defaults to `env.SECRETS_FILE` or `path.join(os.homedir(), '.secrets', 'salon-radio.json')`. Read the JSON file if it exists (a missing or broken file means empty values; log once WITHOUT its contents); env vars override it: `LLM_API_KEY` (or `SOKET_API_KEY`), `LLM_BASE_URL` (default `https://api.soket.ai/v1`), `LLM_MODEL`, `LLM_FALLBACK_MODEL`, `LLM_MAX_TOKENS` (default 8000). At startup print only `AI DJ: on (GLM-5.3, backup llama-3.1-8b-instruct)` or `AI DJ: off (built-in lines)`, never values.
- `createApp({ fetchImpl = fetch, now = Date.now, root, config })`.
- `GET /api/config` → `{ ai: true|false }`. Never any secret.
- `POST /api/dj` with body `{ song: {title, film, year, singers, composer}, mood, part, dedication, recentLines }` (cap the body at 20 KB; validate the fields and their lengths) → `{ ok: true, line, model }` or `{ ok: true, line: null, mode: 'builtin' }`.
- `dj.js` adds `buildDjMessages({ song, mood, part, dedication, recentLines })` → OpenAI chat messages. The system message: you are "Pappu Bhaiya", the friendly owner of a small 1990s Indian hair-cutting salon who also plays the radio; you speak Hinglish in Roman script, warm and filmy, with light humour; write ONE short line (max 2 sentences, max 150 characters) to say just before the given song plays, connecting it to the salon, the weather or the time of day; you may mention the film, year, singers or music director, but invent no other facts about the song; no religion, politics, insults or real people's private lives; never repeat any of the recent lines; reply with ONLY a JSON object `{"line": "..."}`. And `parseDjReply(text)` → the line string or `null`: extract the first `{...}` (even inside code fences or after prose), require a non-empty string, trim it, strip surrounding quotes, cut it to 160 characters at a word boundary, and reject lines containing `http`, `<` or `>`.
- Calling the LLM: `POST ${llmBaseUrl}/chat/completions` with `{ model, messages, temperature: 0.8, max_tokens: llmMaxTokens }`. Do NOT send `reasoning_effort`, `enable_thinking` or other non-standard fields. **GLM-5.3 always thinks first: about 1,800–2,000 reasoning tokens and 30–35 s even for one line; with `max_tokens` 2000 it returned EMPTY content.** So keep `max_tokens` at 8000, read ONLY `choices[0].message.content` (ignore `reasoning_content`), trim it, and treat empty content as a failure. Timeout 90 s for the main model; on failure, try `llmFallbackModel` once (timeout 20 s). If both fail → `mode: 'builtin'`.
- **Because GLM takes about 30 s, the browser asks for the NEXT song's line while the current song is playing** (`queue.peek()`), as soon as a song starts. Songs last 4–6 minutes, so the line is ready in time. Keep the prepared line with its song id; if the queue changes, discard it and ask again. If no AI line is ready when the song changes, use `pickLine` at once (never make the music wait).
- In the UI, a small "AI" badge on the bubble when the line came from the model.
Tests: `parseDjReply` with clean JSON, fenced JSON, JSON after prose, empty content, too-long lines and lines with a URL; `buildDjMessages` includes the song facts and the recent lines; `loadConfig` with a temporary fake file in the OS temp dir, env overrides, and a missing file; server tests on port 0 with a FAKE fetch: `/api/dj` returns the parsed line; an empty `content` with only `reasoning_content` makes it try the fallback model; both failing → `mode: 'builtin'`; no key → `mode: 'builtin'` without calling fetch; `/api/config` has no secret; an oversized body → 413. No test may call the real internet.
CHECK: `npm test` → all pass. Then start the server, run `curl -s -X POST localhost:8086/api/dj -H 'Content-Type: application/json' -d '{"song":{"title":"Tujhe Dekha To","film":"Dilwale Dulhania Le Jayenge","year":1995,"singers":["Lata Mangeshkar","Kumar Sanu"],"composer":"Jatin-Lalit"},"mood":"romance","part":"shaam"}'` (it can take about 40 s), and show the reply.

## STEP 10: Moods and Farmaish ("Ask Bhaiya") + tests
Create `src/moods.js` and `tests/moods.test.js`; extend `server.js` and `tests/server.test.js`; fill `section#moods` and `section#farmaish`.
- Moods section: six big mood cards styled like old cassette covers (the mood colour, the Hindi word in Yatra One, the English label, the emoji, and "<n> gaane"). Clicking one sets the queue mood, tunes the dial (static), and bhaiya says a mood line. "Sab Gaane" clears the mood. The current mood card looks pressed.
- `moods.js` (pure): `matchRequest(text, songs)` → `{ kind, mood, songIds, reply }` for the built-in Farmaish:
  - mood words in Hinglish and English (baarish/rain/barsaat/monsoon, pyaar/love/romantic, party/dance/masti, sad/dard/udaas/breakup, safar/road trip/drive/travel, chai/subah/morning/relax) → that mood;
  - a singer or composer name (match against the playlist's names, case-insensitive, partial words like "kumar sanu", "sanu", "rahman", "alka") → their songs;
  - a film or song title → that song first;
  - a year or decade ("1995", "90s", "2000s", "nineties") → songs from then;
  - otherwise `kind: 'unknown'` with a friendly reply listing examples.
  - `reply` is a short bhaiya-style Hinglish confirmation ("Haan ji, Kumar Sanu ke 6 gaane line mein laga diye!").
- `POST /api/farmaish` with `{ text, songs: [{id,title,film,year,singers,composer,moods}] }` (cap at 60 KB) → asks the LLM to pick up to 8 song ids FROM THE GIVEN LIST ONLY and to write one Hinglish reply line, returning JSON `{"songIds": [...], "reply": "..."}`. The server keeps only ids that exist in the list (in order, no duplicates) and returns `{ ok, songIds, reply, model }`, or `mode: 'builtin'` on failure (same GLM rules and timeouts as STEP 9).
- Farmaish UI: a "chitthi" (letter) card with a lined-paper background and Kalam handwriting: a textarea "Bhaiya, ek gaana bajao…", a "Farmaish bhejo" button, and 5 example chips ("Baarish wale gaane", "Kumar Sanu", "90s romance", "Road trip pe chalo", "Kuch sad sa"). The built-in `matchRequest` answers INSTANTLY when it understands the request; only `kind: 'unknown'` goes to `/api/farmaish` (with a "Bhaiya soch rahe hain… 12s" timer and a "Rehne do" cancel link). The result enqueues the songs (`queue.enqueue`), shows the reply as bhaiya's bubble and lists the queued songs under the letter.
Tests: each request kind with exact results on a small hand-written song list; an unknown request; the server keeps only valid ids and drops duplicates and unknown ids (fake fetch); `mode: 'builtin'` when there is no key.
CHECK: `npm test` → all pass; `node --check` every file.

## STEP 11: Dedications, the old radio way + tests
Create `src/dedication.js` and `tests/dedication.test.js`; fill `section#dedication`.
- `dedication.js` (pure):
  - `cleanName(s, max = 24)`: trim, collapse spaces, remove `<>"'{}`, `http` and anything that isn't a letter (any script), number, space, `.` or `-`; cut to `max`; an empty result is invalid.
  - `buildDedication({ from, town, to, songId })` → `{ ok, error?, data }`. `from` and `to` are required; `town` is optional (it defaults to "Jhumri Telaiya", the classic radio town).
  - `dedicationText(d, song)` → "Agla gaana hai <title>, film <film> se. Aur yeh farmaish aayi hai <town> se, <from> ki taraf se <to> ke liye. <to> ji, yeh gaana sirf aapke liye!" (write 3 variations and pick one by a hash so the same link always reads the same).
  - `encodeDedication(d)` → a compact URL-safe string (base64url of a short JSON with keys f, t, o, s); `decodeDedication(str)` → the data or `null` for anything invalid (bad base64, bad JSON, missing names after cleaning, unknown song id, over 300 characters).
- Dedication UI: styled as an old post card (stamp, postmark with today's date, "Akashvani style" wavy border). Fields: Aapka naam, Shehar/Gaon (optional), Kiske liye, and a song picker (searchable list from the playlist). "Dedication bhejo" → queues the song next, and before it plays bhaiya reads `dedicationText` (and the AI line if any), and the bubble shows a 💌. It also shows a share box with the link `…/?d=<encoded>`, a "Copy link" button and "Share on WhatsApp" (`https://wa.me/?text=` with a short message and the link). Sharing is optional and never unlocks anything.
- When the page opens with `?d=…`: show a welcome card "📻 <from> ne aapke liye ek gaana bheja hai!" with a big "Sunao" button (it starts the radio, which needs a click anyway); the dedication plays first. An invalid link shows "Yeh chitthi kho gayi 😅" and the normal radio.
Tests: `cleanName` removes HTML/URLs and keeps Hindi and Bengali names (`"राहुल"`, `"অনন্যা"`); required fields; encode → decode round trip; tampered strings and unknown songs give `null`; the same data always gives the same text variation; the text contains the names, town and song.
CHECK: `npm test` → all pass; `node --check` every file.

## STEP 12: Aaj ki Diary: favourites, history, your own songs + tests
Create `src/youtube-url.js` and `tests/youtube-url.test.js`; fill `section#diary`.
- `youtube-url.js` (pure): `parseYouTubeId(text)` → the 11-character id from `https://www.youtube.com/watch?v=ID`, `https://youtu.be/ID`, `https://www.youtube.com/shorts/ID`, `https://m.youtube.com/watch?v=ID&t=30s`, `https://www.youtube.com/embed/ID`, or a bare id; otherwise `null`.
- The diary looks like a ruled notebook page (blue lines, red margin, Kalam handwriting, a coffee-cup ring stain drawn with CSS):
  - **Pasandida gaane** (favourites): the heart button in "Now Playing" toggles; each entry can be played or removed.
  - **Aaj bajaaye gaye** (played today): time (local) and song, newest first, reset each new day.
  - **Apna gaana jodo** (add your own): paste a YouTube link and a title → `parseYouTubeId` → check it with `https://www.youtube.com/oembed?...` from the browser (if oEmbed fails with 401/403/404, say "Yeh video radio pe nahi chal sakta") → it's saved as a custom song (mood: none, plays in "Sab Gaane" and from the diary).
- All saved in `localStorage` (try/catch; corrupted data → start fresh without crashing).
Tests: every URL form above; invalid strings (`"hello"`, a 10-character id, a non-YouTube URL) return `null`.
CHECK: `npm test` → all pass; `node --check` every file.

## STEP 13: About, FAQ, footer, sharing and the lock screen
- **About** ("Hamare baare mein"): styled as a film-magazine page (two columns on desktop, a big Rozha One headline, a pull quote in Kalam). It explains the idea in 3 short paragraphs: the feel of the neighbourhood salon radio, the 90s and 2000s songs, and that songs play from official YouTube uploads. Plus a small "Kaise kaam karta hai" list (Radio chalu karo → mood chuno → farmaish ya dedication bhejo).
- **FAQ**: `<details>` items styled as index cards: Kya account chahiye? (No.) Gaane kahan se aate hain? (Official YouTube videos played in the YouTube player; we don't host any music.) Bhaiya kaun hai? (An AI DJ when available, otherwise built-in lines; explain that it is AI-written.) Kya mobile pe chalega? Kuch gaane skip kyun ho jaate hain? (Some videos can't be embedded.) Mera data kahan jaata hai? (Favourites stay in your browser; when the AI DJ is on, the song name and your dedication names are sent to the AI service to write the line.) Gaana kaise suggest karein?
- **Footer**: the signboard logo again, "Made with ❤️ and chai", a "Social" row that is driven by `SOCIAL_LINKS` in `src/main.js` (WhatsApp, Instagram, YouTube; each `''` by default, and a link with an empty URL is NOT shown), and "Songs © their respective owners, played via YouTube."
- `assets/og.svg`: a 1200×630 share image (the signboard, a radio and "90s Hindi Gaane · Salon Radio"), referenced by `og:image`, plus `og:title`, `og:description` and `twitter:card` meta tags.
- **Media Session API**: set `navigator.mediaSession.metadata` (title, artist = singers, album = film) and the play, pause, next and previous handlers, so phone lock screens and headphone buttons work where supported.
- **Accessibility**: every control has an accessible name; the dial needle and reels are `aria-hidden`; a visually hidden live region announces "Ab baj raha hai: <title>"; focus rings are visible (a marigold outline); colour contrast is at least 4.5:1 for text; all features work with the keyboard only.
CHECK: `node --check` every file; `npm test` passes; headless screenshots of the About/FAQ area (scroll with `#about` in the URL) at 1440×900 and 390×844, and describe them.

## STEP 14: Polish the retro feeling
Go through THE LOOK again and make the whole page feel like one cosy 90s salon:
- **Purana TV effect** toggle (in the ambience mixer): stronger scanlines over the scene (never over the YouTube video itself), slight RGB fringing on headings, a soft screen-curvature vignette and a very slight brightness flicker. Off by default; saved in localStorage.
- **Loading**: on first load, a short "tuning in" intro (1.5 s): the scene is dim, the tube light flickers on, the signboard lights up letter by letter, then the "Radio chalu karo" knob pulses. Skippable by any click or key; skipped completely under reduced motion and on return visits (localStorage).
- **Details pass**: each mood colours the wall's light slightly (Baarish: blue-grey, Romance: rose, Masti: marigold, Dard: dusk violet, Road Trip: sunny orange, Chai: warm brown); a small steaming chai glass on the counter (CSS steam wisps); the crow on the wire hops every minute; the calendar page flutters when the fan speeds up; bulbs around the mirror dim slightly during bhaiya's speech; the "ON AIR" lamp blinks while bhaiya talks.
- **Performance**: the rain canvas and all animation loops pause when the tab is hidden; at most ONE `requestAnimationFrame` loop for rain and one for the progress/needle UI; no layout jumps when fonts load (`font-display: swap` and fixed sizes for the scene); the scene uses CSS transforms only (no animated layout properties); Lighthouse-style basics: the image has width/height, there are no console errors and no 404s.
- **Mobile**: on a 390 px phone, the scene stacks (TV → radio → bubble), controls are at least 44 px tall, the mixer is a collapsible drawer, nothing scrolls sideways, and the rain canvas is lighter (about 80 drops).
- **Edge cases**: all songs failing to embed shows a friendly "Aaj radio ka signal kamzor hai" message with a retry; the AI being down never blocks music; a very long title truncates with an ellipsis on the cassette label; double-clicking next quickly never starts two songs or two static sounds.
CHECK: `node --check` every file; `npm test` passes; headless screenshots at 1440×900 (normal), 1440×900 with `?rain=1&time=raat`, and 390×844, and describe each. Fix anything that overlaps, overflows or looks broken.

## STEP 15: Verify and document
1. `npm test` → all pass. `for f in server.js src/*.js scripts/*.mjs; do node --check "$f" || echo "FAIL $f"; done` → no FAIL.
2. `npm run verify:playlist` → report how many songs are OK.
3. Start the server; `curl` `/`, `/api/config`, `/src/main.js`, `/assets/og.svg` and the traversal URL, and record the status codes. Run the STEP 9 `/api/dj` curl once and record the reply and how long it took (or report honestly that the AI was unavailable).
4. Headless screenshots: 1440×900 normal, 1440×900 `?rain=1&time=raat`, 390×844, and the dedication welcome card (build a real `?d=` link with `encodeDedication`). Describe each.
5. `README.md`: what it is; how to run it (`npm start` → http://localhost:8086, then click the power knob); the features; how the AI DJ works and how to turn it on (`~/.secrets/salon-radio.json` field names only: `llmApiKey`, `llmBaseUrl`, `llmModel`, `llmFallbackModel`, `llmMaxTokens`, and the env variables that override them; NEVER real values); why GLM lines are prepared one song ahead; how to add songs (`src/playlist.js` + `npm run verify:playlist`); how to set the social links; the music/copyright note (official YouTube embeds only, nothing hosted); and the keyboard shortcuts.
6. `TEST_REPORT.md`: the test count, every check above with its real output, the playlist result, which parts need a human (actual sound: music, rain, static, voice; real phone lock screen; the AI DJ over a long session), and known limits (some videos may stop allowing embedding later; speech voices differ by device).
7. Delete temporary files inside `rangeela-salon-radio/` (screenshots belong in /tmp). Keep `scripts/verify-result.json`.
Finish with a short summary: the files, the test results, and how to run it.
