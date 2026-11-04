# Aurelia Estates · Virtual Tour

A browser-based sales experience for property sold off-plan. It opens with a **cinematic scroll film**: scrolling scrubs through dusk aerials and interiors, with editorial titles over full-screen footage. It then hands off to an **interactive 3D tour**, where buyers fly over a dollhouse cut-away of the home, step into any room at eye level, move between rooms through doorway labels or the floor plan, and finish the guided tour at an inquiry form. Every lead records which rooms the buyer looked at.

Two demo properties ship with it:

| Property | Type | Highlights |
| --- | --- | --- |
| **Villa Serena** | 3-bed single-storey villa | Gallery hall, 70 m² living room, chef's kitchen, pool terrace with pergola |
| **Skyline Residence 12B** | 2-bed + study, 12th floor | Corner glazing, open-plan living, full-width city balcony |

The architecture (walls, glazing, ceilings, kitchens, baths) is generated in code from plain data, so a new property is a new data file. Realism comes from real scanned assets: photo-scanned PBR materials (oak, marble, plaster, fabrics, grass), a photographed HDRI sky that lights the scene, and real furniture and plant models, all CC0 from [Poly Haven](https://polyhaven.com).

**Live:** https://muhsin48ahmed.github.io/real-estate-virtual-tour/

## Run it

```bash
npm install
npm run assets   # downloads ~53 MB of CC0 textures, sky and models into public/assets (skips files already there)
npm run film     # downloads the approved stock clips and encodes the ~22 MB scroll film into public/film
npm run dev
```

Open http://localhost:5173 to start with the film. Useful deep links:

- `/?view=tour` skips the film and opens the 3D tour
- `/?property=villa-serena&room=terrace`
- `/?property=skyline-12b&room=lounge`

## Inquiry leads

Set `VITE_INQUIRY_ENDPOINT` (in `.env.local`) to any URL that accepts a JSON `POST`, such as a Formspree form, a Make/Zapier webhook or a CRM intake endpoint:

```bash
VITE_INQUIRY_ENDPOINT=https://formspree.io/f/your-form-id
```

Without it the app runs in **demo mode**: leads are saved in the browser's `localStorage` under `aurelia.inquiries`, and the thank-you screen says so.

The payload contains `name`, `email`, `phone`, `propertyId`, `intent`, `budget`, `contactMethod`, `message`, `consent`, `roomsViewed` and `submittedAt`. The form validates with zod and includes a honeypot field for bots. Rate limiting and spam filtering belong on the receiving endpoint.

## Adding or changing a property

Each property lives in `src/data/properties/*.ts` and is described in metres on a plan where +x is east and +z is south:

- **rooms**: a rectangle per room, with its floor finish, copy, features, furniture and an optional camera `view`
- **walls**: segments with door, window and sliding-door openings; the doorway links between rooms are worked out automatically
- **tour**: the order of the guided tour; the inquiry form follows the last stop

`npm test` checks every property for overlapping rooms, openings that don't fit their wall, furniture outside its room, and rooms that can't be reached through a doorway.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and production build to `dist/` |
| `npm test` | Unit and component tests (Vitest) |
| `npm run coverage` | Tests with a coverage report |
| `npm run e2e` | End-to-end tests in your installed Google Chrome, desktop and mobile; screenshots land in `e2e/screenshots/` |
| `npm run lint` | Oxlint |
| `npm run film` | Rebuild the scroll film from the clips listed in `scripts/build-film.mjs` (uses the bundled `ffmpeg-static`) |
| `npm run assets` | Fetch the Poly Haven assets listed in `scripts/fetch-assets.mjs` and refresh `public/assets/credits.json` |

## How it's built

- **React 19, TypeScript, Vite**, with **three.js** via `@react-three/fiber` and `drei`
- **Lighting:** a real HDRI sky (Poly Haven *Kloofendal 48d Partly Cloudy*) for background, reflections and fill; a shadow-casting sun placed where that sky's sun is; and a soft area light in the room you're standing in
- **Materials and models:** scanned PBR textures and glTF furniture loaded at real-world scale. Every model has a procedural stand-in if its file fails to load, and trees are built from alpha-cut leaf cards, because the scanned trees are 50–200 MB each.
- **Post-processing:** N8AO ambient occlusion, bloom on the downlights, Khronos PBR Neutral tone mapping, vignette and SMAA. Quality drops automatically on phones and slow GPUs.
- **State:** zustand, mirrored to the URL so any view can be shared as a link
- **Design tokens:** `design-system/aurelia-estates/` (the tour page overrides typography in `pages/tour.md`)

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: lint, unit tests and a production build, then the Playwright E2E suite on desktop and mobile. Only when both pass is the build published to GitHub Pages. The site is served from `/real-estate-virtual-tour/`, which the workflow passes to Vite as `PAGES_BASE`; locally the base stays `/`.

Leads run in demo mode on the live site until `VITE_INQUIRY_ENDPOINT` is added to the build step's `env` (for example from a repository secret).

## The cinematic film

The film uses free stock footage from Pexels by Alef Morais and Abdullah | 4K, under the [Pexels License](https://www.pexels.com/license/). It's labelled on screen as illustrative, and `public/film/credits.json` lists every clip. For a real client, swap in the developer's own CGI renders or drone footage: put the source URLs in `scripts/build-film.mjs`, run `npm run film`, and edit the chapter copy in `src/data/film.ts`.

Each clip is encoded with no audio at 30 fps, with a keyframe every 6 frames, so scroll-driven seeking stays smooth. Scrubbing eases towards the scroll position each frame, and the 3D tour starts downloading in the background while the film plays.

## Asset credits

All textures, the HDRI and the models are CC0 (public domain) from Poly Haven; `public/assets/credits.json` lists each asset and its authors. No attribution is legally required, but crediting Poly Haven on a live site is good practice.

## Code layout

```
src/
  data/        property definitions and types
  lib/         pure geometry, tour order, formatting
  state/       tour store and URL sync
  scene/       3D: lighting, effects, structure (walls/ceilings/roof), furniture, surroundings, camera
  ui/          panels, floor plan, labels over the scene, inquiry form
  inquiry/     schema and submission
```
