# dragon playground-next

Next.js 15 で書き直された dragon Text DSL playground。

## Why this exists

前 `apps/playground` (Astro 5) が catalog thumbnail の viewBox 縮小 SVG で `feDisplacementMap` displace 破綻 + theme system CSS specificity 勝負 + preset gallery modal hydrate 遅延 の 3 重破綻を抱えていた。 部分修正では根本解決不能のため、 全書き直しを実施。

## Stack

- **Next.js 15** app router + React 19 + TypeScript 5.9
- **Tailwind CSS 4** + CSS variable-based theming
- **Radix UI** (Dialog / DropdownMenu / Select / Tabs / Toast / Tooltip)
- **Monaco Editor** (JSON preset editor)
- **rough.js** (Handdrawn theme の Excalidraw 相当 sketch stroke)
- **lucide-react** (icon set)

## Features

- 6 theme × 10 preset × live preview
- Handdrawn theme = rough.js による sketch stroke + hachure fill
- Neumorphism / Circuit / Blueprint / Pinboard / Isometric theme
- Modal preset viewer (Radix Dialog、 ESC / ← / → nav)
- Keyboard shortcuts (`?` help、 `T` theme cycle、 `E` editor、 `D` docs、 `/` search)
- Search box で preset 絞り込み (title / tag / eyebrow)
- Editor page (Monaco JSON edit + live preview + share URL)
- Docs page (Quick start + Themes + Presets)
- Permalink `/preset/[id]` (SSG pre-rendered 10 preset)
- Dark mode (3-way toggle: light / dark / system)
- PWA manifest + sitemap + robots.txt
- Radix Toast for feedback
- Full a11y (skip nav / focus ring / aria-label / role / reduced-motion)
- Mobile responsive (< 768px)

## Development

```bash
pnpm install
pnpm dev  # http://localhost:4322
```

## Build

```bash
pnpm build      # production build
pnpm start      # production preview
pnpm typecheck  # tsc --noEmit
```

## Test

```bash
pnpm exec playwright test  # 21 visual regression + interaction tests
```

## Deployment

Vercel の subdirectory deploy 想定、 `apps/playground-next/vercel.json` を参照して project 設定。

- Framework: nextjs (auto detected)
- Build: `cd ../.. && pnpm --filter @cardenelabs/anim build && pnpm --filter @cardenelabs/cdl build && pnpm --filter dragon-playground-next build`
- Install: `cd ../.. && pnpm install --frozen-lockfile`
- Region: nrt1 (Tokyo edge)

## Architecture

```
src/
├── app/                    # Next.js app router
│   ├── layout.tsx          # SvgDefs + AnimatedEdgeStyle + ToastProvider
│   ├── page.tsx            # / catalog gallery
│   ├── editor/             # /editor Monaco + live preview
│   ├── docs/               # /docs
│   ├── preset/[id]/        # /preset/<id> SSG permalink
│   ├── not-found.tsx       # 404
│   ├── error.tsx           # error boundary
│   ├── sitemap.ts          # /sitemap.xml
│   ├── robots.ts           # /robots.txt
│   ├── manifest.ts         # /manifest.webmanifest
│   ├── icon.svg            # favicon
│   └── apple-icon.svg      # PWA apple icon
├── components/
│   ├── DiagramView.tsx     # SVG root + defs
│   ├── DiagramNode.tsx     # node shape + text
│   ├── DiagramEdge.tsx     # edge routing + label
│   ├── SolderPads          # Circuit theme gold pads
│   ├── PresetCard.tsx      # gallery card + modal
│   ├── ThemePicker.tsx     # Radix Select
│   ├── ThemeStrip.tsx      # 6 palette dot compact
│   ├── DarkModeToggle.tsx  # light / dark / system
│   ├── KeyboardShortcuts.tsx  # ? / T / E / D / /
│   ├── Toast.tsx           # Radix Toast wrapper
│   ├── SvgDefs.tsx         # 6 theme filter / pattern SSOT
│   └── AnimatedEdge.tsx    # dot-flow CSS keyframe
├── lib/
│   ├── theme.ts            # 6 theme runtime config SSOT
│   ├── shape-generator.ts  # rough.js + straight path
│   ├── presets.ts          # 10 preset SSOT
│   ├── share-url.ts        # zlib deflate + base64 URL
│   ├── auto-layout.ts      # lane-based node layout (scaffold)
│   └── cn.ts               # clsx + tailwind-merge
└── themes/
    └── tokens.css          # 6 theme × 15 CSS var
```

## References

- Engine SSOT: `.context/design/engine-ssot.md` (dragon repo root)
- Competitive research: mermaid.live / excalidraw.com / d2lang.com / tldraw.dev
