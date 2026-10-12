# Scroll animations (scrollcraft)

The public site uses the **scrollcraft** engine from [nateherkai/scroll-craft](https://github.com/nateherkai/scroll-craft)
(MIT, v0.3.1), vendored unmodified in `src/vendor/scrollcraft/`. The engine reads `data-sc-*`
attributes on our own markup; it never builds DOM. It is mounted on every public page by
`src/components/site/ScrollCraftMount.tsx` and torn down on client-side navigation.

Its stylesheet is imported into the lowest cascade layer, so Rotary's colours, fonts and layout always
win; only the animation devices take effect. Theme tokens (`--sc-*`) are set in `src/app/globals.css`.

## Brief (self-authored under the club's creative delegation)

The site keeps its Rotary identity (royal blue, gold, Open Sans and Georgia, the official logo). Motion
should add depth and a sense of a story unfolding, never get in the way of reading, and never invent
facts (numbers only count up to real, sourced figures).

| Section | Device | Why |
|---|---|---|
| Hero | `parallax` layers | The photo and the gold roots lines move at different rates, so the hero has depth; the headline stays still and readable |
| Next meeting card | pointer `tilt` (3°) | The flyer leans toward the cursor on desktop; off on touch and reduced motion |
| Who we are | `in` + stagger | The club facts settle in one after another |
| Impact numbers | `count` | Real figures tick up once on entry (600+, 24+, 35, 7); reduced motion shows final values |
| Project stories | `parallax` inside the frame | Photos drift slowly behind their frames as you scroll |
| Rotary family | `kinetic` headline | "One club can create many more." assembles line by line |
| **History (signature move)** | pinned `pan` | The section holds still while 2021 → today → next slides sideways under the reader's scroll; the soil-red line draws as you go and each milestone settles in turn |
| Events, news, sponsors | `in` + stagger | Lists arrive in reading order |
| Join | `kinetic` headline + stagger | "There is a seat for you on Sunday." assembles, then the six ways to get involved settle in |

No two neighbouring sections use the same device.

## Accessibility and fallbacks

* `prefers-reduced-motion`: movement is removed (fades only), counters show final values, and the
  history rail becomes an ordinary swipe/scroll row so every milestone stays reachable.
* Without JavaScript all content is shown (a `<noscript>` rule in `src/app/layout.tsx`).
* Verified with scroll-craft's own harness (`scripts/shoot.mjs`) at 1440×900, 390×844 and reduced
  motion: no dead scroll, all animated text ≥ 4.5:1 contrast at its worst frame, no console errors.

## Adding motion to another section

Mark the section as an act (`data-sc-act="flow"`, or `pin`/`pan` with `data-sc-span`) and add devices
inside it, e.g. `data-sc-in` + `data-sc-stagger="70"` on a list, `data-sc-parallax="1.2"` on an image
layer (give it extra height so the edge never shows), or `data-sc-cue="0.06" data-sc-kinetic="lines"` on
a headline. Keep body copy off parallax layers, use at most one kinetic headline per section, and do not
edit the engine files.
