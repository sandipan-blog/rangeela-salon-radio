# Rangeela Salon Radio · रंगीला सैलून रेडियो

A browser-first neon night-shift Hindi music radio that feels like a small Indian neighbourhood hair-cutting salon after 11pm — CRT TV, transistor radio, monsoon rain, chai steam, and Pappu Bhaiya chatting between 90s & 2000s film songs.

**Built with [Loop](https://loop.cursor.com)** — written step-by-step from a loop agent prompt (`prompt.md`), not a hand-coded from-scratch app.

## Live demo

**https://games6.vercel.app**

## Run locally

```bash
cd rangeela-salon-radio
npm start
```

Open **http://localhost:8086** and press the radio **POWER** knob (“Radio chalu karo”).  
(Browsers block sound until a click; YouTube does not work from `file://`.)

Node 18+. No npm dependencies.

## Features

- Retro playlist of 90s & 2000s Hindi film songs via official YouTube embeds
- Moods: Baarish, Romance, Masti, Dard Bhare, Road Trip, Chai Time
- Rain mode + Web Audio salon ambience
- AI DJ “Pappu Bhaiya” (GLM when configured; built-in lines otherwise)
- Farmaish, dedications, Aaj ki Diary
- Neon night salon scene graphics

## AI DJ (optional)

Create `~/.secrets/salon-radio.json` (outside this repo) or set env vars:

- `LLM_API_KEY` / `SOKET_API_KEY`
- `LLM_BASE_URL` (default `https://api.soket.ai/v1`)
- `LLM_MODEL`, `LLM_FALLBACK_MODEL`, `LLM_MAX_TOKENS`

Without keys, the radio still runs with built-in DJ lines.

On Vercel, set the same env vars in the project settings.

## Add a song

Edit `src/playlist.js` (`SONGS` array), then:

```bash
npm run verify:playlist
```

Only official, embeddable YouTube uploads. Nothing is hosted or ripped locally.

## Made with Loop

This project was produced by the **Loop** agent using the step-by-step instructions in `prompt.md` (skeleton → neon scene → playlist → player → rain → AI DJ → polish → verify).

## License / music

Songs © their respective owners. Playback is only through official YouTube embeds. No audio files are stored in this repository.
