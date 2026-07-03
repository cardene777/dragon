# audit scripts

dragon playground の visual / layout / SVG geometry を Playwright で機械的に検査する SSOT script 群。

## 前提

- `pnpm dev` で editor が localhost:4322 で起動中
- Playwright は monorepo root の `node_modules` から利用 (dragon PR #99 以降で追加済)

## script 一覧

### helper lib (Playwright evaluate 経路)

#### `svg-world.mjs`

SVG audit の座標変換 SSOT。 SVG 内 element の位置を **viewBox 座標系** で正確に計測する helper 群を string として export、 `page.evaluate(fn, svgWorldAuditLib)` の第 2 引数に渡して `eval()` で注入する形式。

提供 API:
- `svgWorldBBox(el, svg)` = element の bbox を viewBox 座標で返す
- `isInsideViewBox(worldBB, vb)` = bbox が viewBox 内に完全に収まるか
- `overflowAmount(worldBB, vb)` = viewBox からの overflow 量 (L/R/T/B)

SVG 座標系の 3 段階を全変換で処理:
1. `el.getBBox()` = local coordinate (親 transform 前)
2. `el.getCTM()` = screen coordinate (親 chain + SVG root の viewBox→screen mapping 込み)
3. `svg.getCTM()` 逆変換 = viewBox coordinate

過去 audit script が段階 2 を viewBox 座標として比較して false positive を大量発生させた反省を踏まえた SSOT (2026-07-03 事故対応)。

#### `contrast.mjs`

WCAG contrast ratio 計算の SSOT。 opacity 合成 (alpha compositing) を parent chain 全体で行い element の実効 bg 色を得る。

提供 API:
- `parseRgba(s)` = rgba 文字列 parse
- `relativeLuminance(rgb)` = WCAG 相対輝度 (0-1)
- `alphaCompose(fg, bg)` = alpha compositing で合成
- `composeChain(el)` = element の parent chain で opaque bg を alpha compose 決定
- `contrastRatio(fg, bg)` = WCAG contrast ratio (1-21)

WCAG 基準: AA large=3.0, AA normal=4.5, AAA large=4.5, AAA normal=7.0

制約: gradient / image bg は audit 対象外、 opacity property 未対応

### 実行 audit script

#### `editor-svg-text-overflow.mjs`

editor の全 12 sample で SVG 内 text が viewBox 外に飛んでいないか audit。

```bash
cd apps/playground
pnpm exec node scripts/audit/editor-svg-text-overflow.mjs
```

exit code: 0 (全 OK) / 1 (overflow あり) / 2 (script error)

#### `editor-dark-contrast.mjs`

editor UI 全体を dark theme で contrast audit、 WCAG ratio 未満を defect として検出。

```bash
pnpm exec node scripts/audit/editor-dark-contrast.mjs
# 閾値変更 = env MIN_RATIO=4.5
```

exit code: 0 (全 OK) / 1 (defect あり) / 2 (script error)

#### `pages-responsive.mjs`

主要 14 page × 6 viewport (1920/1440/1024/900/768/640) で body 横スクロール (PAGE_SCROLL_H) を検出。

```bash
pnpm exec node scripts/audit/pages-responsive.mjs
```

exit code: 0 (全 OK) / 1 (h_scroll あり) / 2 (script error)

#### `pages-i18n.mjs`

主要 page × 3 viewport × 2 lang (ja/en) で layout 崩れ audit。 共通 page は lang toggle 経由、 docs は URL 別 (/docs/ vs /docs/en/) で走査。

```bash
pnpm exec node scripts/audit/pages-i18n.mjs
```

exit code: 0 (全 OK) / 1 (layout 崩れあり) / 2 (script error)

## 開発 note

- audit 追加時は必ず `svg-world.mjs` を経由、 独自の座標変換を書かない
- sample 切替後は `waitForFunction` で `data-cdl-diagram` 属性変化を polling、 compile fail race を検出
- phase autoplay 中の実 render 位置は phase 別に変わる可能性あり、 phase 固定 audit が必要な場合は autoplay pause を追加
