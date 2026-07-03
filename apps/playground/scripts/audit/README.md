# audit scripts

dragon playground の visual / layout / SVG geometry を Playwright で機械的に検査する SSOT script 群。

## 前提

- `pnpm dev` で editor が localhost:4322 で起動中
- Playwright は monorepo root の `node_modules` から利用 (dragon PR #99 以降で追加済)

## script 一覧

### `svg-world.mjs`

SVG audit の座標変換 SSOT。 SVG 内 element の位置を **viewBox 座標系** で正確に計測する helper 群を string として export、 Playwright `page.evaluate(fn, svgWorldAuditLib)` の第 2 引数に渡して `eval()` で注入する形式。

提供 API (Playwright evaluate 内で使用):
- `svgWorldBBox(el, svg)` = element の bbox を viewBox 座標で返す
- `isInsideViewBox(worldBB, vb)` = bbox が viewBox 内に完全に収まるか
- `overflowAmount(worldBB, vb)` = viewBox からの overflow 量 (L/R/T/B)

SVG 座標系の 3 段階を全変換で処理:
1. `el.getBBox()` = local coordinate (親 transform 前)
2. `el.getCTM()` = screen coordinate (親 chain + SVG root の viewBox→screen mapping 込み)
3. `svg.getCTM()` 逆変換 = viewBox coordinate

過去 audit script が段階 2 を viewBox 座標として比較して false positive を大量発生させた反省を踏まえた SSOT (2026-07-03 事故対応)。

### `editor-svg-text-overflow.mjs`

editor の全 12 sample で SVG 内 text が viewBox 外に飛んでいないか audit。

実行:
```bash
cd apps/playground
pnpm exec node scripts/audit/editor-svg-text-overflow.mjs
```

exit code:
- 0 = 全 sample で overflow 0
- 1 = 少なくとも 1 sample で overflow あり
- 2 = script error

## 開発 note

- audit 追加時は必ず `svg-world.mjs` を経由、 独自の座標変換を書かない
- sample 切替後は `waitForFunction` で `data-cdl-diagram` 属性変化を polling、 compile fail race を検出
- phase autoplay 中の実 render 位置は phase 別に変わる可能性あり、 phase 固定 audit が必要な場合は autoplay pause を追加
