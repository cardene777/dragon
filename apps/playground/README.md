# dragon playground

[`@cardenelabs/dragon`](../../packages/dragon) (Mermaid 感覚で動く図を描く Text DSL) の visual playground (Astro app)。
Editor / Catalog / Docs の 3 つを 1 つの app にまとめている。
dragon は user 向けの表玄関、 [`@cardenelabs/cdl`](../../packages/cdl) engine が layout / render / animation を担う lower layer。

## install + 起動

```bash
pnpm install            # repo root で 1 回
pnpm dev                # http://localhost:4321
# or
pnpm --filter cdl-playground dev
```

(内部 package 名は `cdl-playground` のまま、 表玄関は dragon)

## 3 つの app

### `/editor` ... dragon Visual Editor

GUI で dragon DSL を書きながら animated SVG を live preview。

- 左 pane で dragon DSL v0.5 を入力、 右 pane に 300 ms 後の preview
- 12 preset の template から開始
- phase / state / tween の編集
- SVG export (Notion / slide / docs に貼り付け可能)
- 共有 URL コピー

### `/catalog/*` ... dragon Catalog

12 preset の visual 一覧。

- `/catalog/primitives` ... NodeKind 29 種 + EdgeStyle 8 種
- `/catalog/text-dsl` ... dragon DSL × 6 preset の demo
- `/catalog/animation` ... phase / state / tween / badge の動作例
- `/catalog/cookbook` ... 5+ 実用パターン
- `/catalog/styles` ... tone / EdgeStyle 別の見え方

### `/docs/*` ... cdl engine Documentation site

cdl engine (`@cardenelabs/cdl`) の 全 16 概念 × JA / EN 2 言語の docs。
Diátaxis 準拠 (Tutorial / How-to / Reference / Explanation 4 分類)。
dragon DSL の lower layer (layout / render / animation) を解説。

- humans tab + LLM tab 両方搭載
- pagefind による全 docs 検索 (Cmd + K)

## 開発 script

```bash
pnpm --filter cdl-playground dev               # dev server
pnpm --filter cdl-playground build             # static build + pagefind index
pnpm --filter cdl-playground preview           # build 結果を local preview
pnpm --filter cdl-playground typecheck         # astro check + tsc
pnpm --filter cdl-playground test:visual       # Playwright screenshot diff
pnpm --filter cdl-playground test:e2e          # Editor flow E2E
pnpm --filter cdl-playground test:visual:update    # screenshot 更新
```

## 構成

```
apps/playground/
├── astro.config.mjs    Astro 設定 (sitemap / mdx / react / tailwind)
├── src/
│   ├── components/     UI component (React + Astro)
│   ├── content/        docs content (markdown + cdl-docs collection)
│   │   ├── cdl-docs/   JA docs (cdl engine SSOT)
│   │   └── cdl-docs-en/ EN docs (cdl engine SSOT)
│   ├── layouts/        Astro layouts
│   ├── pages/          Astro routes (/, /editor, /catalog/*, /docs/*)
│   ├── topics/         catalog 用の cdl topic 集 (`*.cdl.ts`)
│   ├── lib/            playground 専用 helper
│   └── styles/         Tailwind 設定 + base CSS
├── tests/
│   ├── visual/         Playwright screenshot diff (visual regression)
│   └── e2e/            Editor flow E2E
└── public/             静的 asset
```

`*.cdl.ts` の file 名は build artifact 識別子として維持 (内部 cdl topic format)。
表向きは dragon DSL として扱う。

## brand 区分

- **dragon** ... user-facing brand (logo ◢ 青緑、 hero / nav / catalog の表向き表記)
- **cdl engine** (`@cardenelabs/cdl`) ... engine layer の用語 (layout / render / animation の lower layer、 docs site で詳細解説)
- **chainome** ⛓ (orange) ... 別 product (混同しないよう色で区別)

## dependency

- **Astro 5** ... static + SSR hybrid
- **React 19** ... Editor interactivity
- **Tailwind v3** ... styling
- **pagefind** ... static search index (build 時生成)
- **gsap** ... Editor の panel animation
- **Playwright** ... visual / e2e test

## build artifact

```bash
pnpm --filter cdl-playground build
# → apps/playground/dist/
#    ├── _pagefind/    search index
#    ├── catalog/      catalog pages
#    ├── docs/         docs pages
#    └── editor/       Visual Editor
```

`pnpm preview` で local 確認、 そのまま Cloudflare Pages / Vercel / Netlify 等に static deploy 可能。

## 既存 issue

playground 特化の bug / feature 提案は [`area:playground`](https://github.com/cardene777/cdl/labels/area%3Aplayground) label を使う。

## License

[MIT](../../LICENSE) (c) 2026 cardene777
