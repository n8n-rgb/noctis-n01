# NOCTIS — N/01

A launch film for a car that doesn't exist. Single page, Vite + vanilla JS + GSAP.

## Run

```bash
npm install
npm run dev
```

## Footage

Both clips were generated with Seedance 2.5. The raw renders live in `media-src/`
(gitignored); what ships is the derived frame sequence.

- `media-src/hero.mp4` — 30s, 21:9, one continuous locked-off 360° orbit.
- `public/media/loader.mp4` — 5s macro surface pass, plays normally behind the loader.
- `public/parts/*.webp` — four component macros (Recraft V4.1), lit to match the
  film: magenta from one side, cyan from the other, hard overhead strip light.

The hero is **not** scrubbed by setting `currentTime` on a `<video>` — that
stutters and behaves differently in every browser. It is extracted to a numbered
WebP sequence and drawn to a canvas against scroll position:

```bash
node scripts/extract-frames.mjs media-src/hero.mp4
```

15fps, max 1600px wide, WebP. The script also writes `public/media/hero-poster.webp`
and regenerates `src/modules/frames.js` with the frame count and hold frame.

## Behaviour

| Condition | Hero | Anatomy |
| --- | --- | --- |
| Desktop | Idle playback, then scroll-scrubbed canvas sequence | Cursor-tracked component plate |
| Mobile / save-data | Poster frame, no sequence downloaded | Static 2-up image grid |
| `prefers-reduced-motion` | One held frame, no loader, normal scroll | Static 2-up image grid |

Every hover and pointer behaviour on the page — custom cursor, magnetic button,
nav underlines, spec row tracking, the anatomy plate — runs off the single
spring integrator in `src/modules/spring.js`. No CSS transitions drive motion.
