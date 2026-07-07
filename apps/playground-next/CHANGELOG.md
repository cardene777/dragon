# dragon playground-next changelog

## v0.1.0 (2026-07-07) — Initial release

Complete rewrite from Astro 5 to Next.js 15 with rough.js.

### Why

Previous `apps/playground` (Astro 5) had 3 compounding failure modes:

1. Catalog thumbnail viewBox scale caused `feDisplacementMap` displace to distort stroke/text into `filter region` outside area (Handdrawn theme "text disappearing" bug).
2. Theme system depended on CSS specificity war against inline SVG `fill=` / `stroke=`, unstable across shape variants.
3. Preset gallery modal hydrate lag from Astro Island `client:load` caused user-reported "modal doesn't open" clicks.

Partial fixes could not resolve the root, so a rebuild was undertaken.

### New stack

- Next.js 15 (app router) + React 19 + TypeScript 5.9
- Tailwind CSS 4 + CSS variable-based theming
- Radix UI (Dialog / DropdownMenu / Select / Tabs / Toast / Tooltip)
- Monaco Editor (JSON preset edit)
- **rough.js** for Handdrawn theme (Excalidraw-style sketch stroke)
- lucide-react for icon set

### Features

#### Themes (6)

- **Blueprint** — technical drawing, blue paper + grid graticule (24px minor + 120px major)
- **Neumorphism** — soft raised bumps + dual shadow filter + subtle border
- **Circuit** — PCB dark green board + gold solder pads (r=4.5, 4 corners) + mint trace glow filter
- **Handdrawn** — rough.js sketch, hachureGap=12, kraft palette + Caveat cursive + marker red accent
- **Pinboard** — sticky note tan board + Kalam handwritten + seed-based tilt (-3° to +3°)
- **Isometric** — 3D depth cream + cast shadow filter

All themes fully support both light and dark mode.

#### Presets (10)

swimlane / flow / sequence / topology / er / stateMachine / classDiagram / mindMap / flowchart / pubsub

Each preset defines viewBox / lanes / nodes / edges. Nodes support 6 shape kinds (rect / cylinder / cloud / diamond / hexagon / ellipse) with title / subtitle / eyebrow / tags.

#### Pages

- `/` — Catalog gallery with 10 preset cards + search box + hero live preview + fade-up entrance animation
- `/editor` — Monaco JSON edit + live preview + theme picker + share URL (zlib deflate + base64) + Reset button + JSON parse error toast
- `/docs` — Documentation: Quick start / Themes / Presets / Try it now CTA
- `/compare` — 6 theme grid comparison for 1 preset (preset dropdown)
- `/preset/[id]` — Permalink (SSG pre-rendered 10 preset) with stats + code sample (JSON / TypeScript with syntax highlight)

#### Modal (Radix Dialog)

- Click preset card to open modal
- ESC / background click / X button to close
- ArrowLeft / ArrowRight to prev/next preset navigation
- Counter "N / 10"
- URL fragment `#preset=<id>` sync via `history.replaceState`
- "Open in editor" button (marker red) + "Permalink" button

#### Interactions

- Keyboard shortcuts: `?` help, `T` theme cycle (Shift+T = backward), `E` editor, `D` docs, `/` search
- Cmd+K / Ctrl+K command palette (Presets / Themes / Pages categories)
- Radix Toast for success / error / info feedback
- 3-way dark mode toggle (light / dark / system)
- ThemeStrip (6 palette dot switcher, lg+ only)

#### A11y

- Skip nav link
- Focus-visible ring (2px accent + offset)
- SVG diagram role=img + aria-label + `<title>`/`<desc>`
- @media (prefers-reduced-motion: reduce) for fade-up + Pinboard tilt + animation
- Screen reader kbd hints
- Semantic HTML

#### SEO / PWA

- Full metadata (openGraph + twitter card + robots)
- Static sitemap.xml (13 URL: static + 10 preset permalink)
- robots.txt
- manifest.webmanifest
- favicon (icon.svg + apple-icon.svg)
- Server-side generated OG image (SVG)

### Build

- 8 route SSG pre-rendered as static content
- First Load JS shared = 102 kB
- Per-page: 143-180 kB
- Full static, ready for Vercel Edge (nrt1)

### Test

23 Playwright screenshot + interaction tests covering:

- 7 theme × full page (regression baseline)
- Handdrawn zoom card
- Editor / docs / permalink pages
- Modal open/close (click + ESC + arrow nav)
- Dark mode (neumorphism / handdrawn / circuit)
- Mobile view (390x844)
- Keyboard shortcut (`?` help + `T` cycle)
- Command palette
- Theme comparison

### Migration path

The old `apps/playground` remains for backwards compatibility during transition. Vercel deployment can point to either:

- `apps/playground/` → Astro 5 static
- `apps/playground-next/` → Next.js 15 SSG + Edge

See `apps/playground-next/vercel.json` for target build/install config.
