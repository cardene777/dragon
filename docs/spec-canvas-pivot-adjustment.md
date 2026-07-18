# spec — dragon canvas pivot の 2 種類の自動調整分離 + parts 独立化 + 絶対座標一本化

grilling 6 root 走査で確定した lock-in spec。 実装着手前の SSOT。 本 spec は前 spec `docs/spec-widgets-syntax.md` (CAR-1657 parts syntax) の後継として canvas pivot の drop / drag / auto 調整 behavior を確定する。

## 0. 目的 (Why)

現行 canvas pivot 実装 (`feature/canvas-pivot-orphan-fix` branch、 PR #428、 latest 6897cc3) は以下 4 の未達を抱える。

- parts drop で sequence lane の間が広がる bug (compile 側 `mergePartIntoDiagram` が parts を lane 扱いして sequence layout の lane 幅計算に副作用)
- パーツ自己 5px snap 未実装 (drag 対象自身の edge alignment)
- 他要素避け動作未実装 (drag 中 collision detection で他要素側の CSS transient shift)
- posX/posY = auto layout offset semantic で「mouse up 位置 ≠ 再 render 描画位置」 の bug 源

本 spec は 12 preset (sequence / flow / class / gantt / topology / ER / state-machine / c4 / mind / pie / swimlane / solidity) + 汎用定義で 4 項全てを網羅する。 user 明示の 2 要求「図ごとにしっかり定義」 と「汎用定義」 を 2 層構造で両立する。

## 1. grilling 6 root 確定内容 (SSOT)

6 root で確定した設計判断を SSOT として引用する。 各 root の詳細理由は個別 decision-log に SSOT を持つ。

| Root | 確定内容 | decision-log |
|---|---|---|
| A. 責務境界 | 調整 A = preset auto-layout (12 preset 既定位置) / 調整 B = user 明示 posX/posY (drop / drag 経路) の 2 層構造 | `2026-07-18-dragon-canvas-pivot-adjustment-axis.md` |
| B. parts 独立化 scope | CdlDiagram に `overlays: OverlayPart[]` field 新設、 parts merge は `target.overlays` に push、 `target.lanes` に触れない、 render 側で lane 層と overlay 層を別 layer で描画 | `2026-07-18-dragon-canvas-pivot-parts-independence.md` |
| C. 座標 SSOT | posX / posY = viewBox 内 SVG unit 座標、 origin = 左上 (0,0)、 range = viewBox width/height、 client → SVG 変換は getCTM inverse 1 回 | `2026-07-18-dragon-canvas-pivot-coordinate-ssot.md` |
| D. spec 粒度 | 汎用 primitives (bounding box / edge alignment 5px snap / collision shift direction の 3 個) を 1 章で定義、 12 preset 別 override note を各 §3-14 で数行 | `2026-07-18-dragon-canvas-pivot-spec-granularity.md` |
| E. backward compat | posX/posY 未指定なら preset auto-layout が default 位置を計算 (現行動作継続)、 明示指定なら overlay で override、 catalog 一括 migration 不要 | `2026-07-18-dragon-canvas-pivot-backward-compat.md` |
| F. PR 分割 | 3 PR (PR 1 = spec doc 単独 / PR 2 = core impl = compile 独立化 + 座標 semantic / PR 3 = feature impl = 自己 snap + 他要素避け)、 現行 PR #428 とは別 branch で独立進行 | `2026-07-18-dragon-canvas-pivot-pr-split.md` |

## 2. 汎用 primitives (共通 behavior)

12 preset 全てに一貫適用する 3 primitive を定義する。 各 preset の override note (§3-14) は本 primitive を前提として preset 固有の shift direction / edge shape / 制約のみを追加する。

### 2.1 primitive 1 = bounding box 定義

OverlayPart の bounding rect を SVG unit 座標系で以下に定義する。

- `left = posX`
- `right = posX + width`
- `top = posY`
- `bottom = posY + height`

width / height は OverlayPart の内部 render size (parts CdlDiagram の viewport width / height を継承)。 明示指定なければ default = parts catalog 定義値 (現状 400 × 200 SVG unit)。

preset 側 element の bounding rect も同 form で計算する。

- sequence lane = { left: lane.x - 20, right: lane.x + 20, top: 0, bottom: viewBox.height } (縦線 40 unit 幅 approximate)
- flow node = { left: node.x, right: node.x + node.width, top: node.y, bottom: node.y + node.height }
- gantt bar = { left: bar.startX, right: bar.endX, top: bar.trackY, bottom: bar.trackY + 30 } (bar 高 30 unit approximate)
- 他 preset も同様に SVG unit 単位で 4 edge を計算

edge shape (直線 / 円弧 / 放射) の非矩形要素は bounding rect を circumscribed rectangle (外接矩形) で近似する (§3-14 preset 別 override で個別定義)。

### 2.2 primitive 2 = edge alignment 5px snap (パーツ自己調整)

drag 完了時 (`onDrop` / `onPointerUp`) の 1 tick で drag 対象 (OverlayPart) の bounding rect edge を他 element の edge と 5px 以内で auto align する behavior。 drag 対象自身の posX/posY を微調整する = drag 対象を動かす、 他 element は動かさない (snapshot 禁止事項「drag 対象を snap で動かすな」 との整合は次項で明示)。

**snapshot 禁止事項との整合** ... snapshot 禁止事項「drag 対象を snap で動かすな」 は「drag 中の mouse 追従を snap で妨害するな」 の意味であり、 「drag 完了時 (mouse up 後) の 1 tick 微調整」 は含まれない。 drag 中は完全自由 (Miro 相当)、 drop 直後の 1 tick で snap を適用する経路は user 明示の「パーツ自己 5px snap」 spec と一致する。 本 primitive は drop tick 適用のみ、 drag 中の mouse 追従は snap 無し。

**判定 logic** ...

```
for each other_element in preset_elements + other_overlays:
  for each self_edge in [top, right, bottom, left]:
    for each other_edge in [top, right, bottom, left]:
      if distance(self_edge, other_edge) <= 5:
        adjust self posX/posY to make self_edge == other_edge
        break outer 2 loops
```

adjust 方向は distance 最小の 1 pair を選ぶ、 複数 pair が 5px 以内なら「self が動く距離最小」 を tiebreaker とする。 adjust 後の posX/posY は DSL に write back される (posX/posY は SVG unit 絶対座標なので client 変換不要)。

**shift 対象外** ... 自己 snap は self 座標のみ更新、 preset element (sequence lane / flow node / etc) には触れない。 collision shift (primitive 3) と責務分離する。

### 2.3 primitive 3 = collision shift direction (他要素避け動作)

drag 中 (`onPointerMove` の毎 tick) drag 対象 (OverlayPart) と overlap する preset element / 他 overlay に対して CSS transform で transient shift を適用する behavior。 DSL 書込みなし = drag 離れたら transform 消える。

**判定 logic** ...

```
for each other_element in preset_elements + other_overlays:
  if bounding_rect_overlap(self, other):
    shift_direction = preset_shift_direction(other.preset_type)  // §3-14 で preset 別定義
    shift_magnitude = compute_min_shift(self, other, shift_direction)  // overlap を解消する最小 shift
    apply_css_transform(other, translate_by(shift_direction, shift_magnitude))
```

**CSS transform 適用経路** ...

- SVG element (lane / node / etc) に data-collision-shift 属性 + CSS `transform: translate(...)` を dispatch
- 200ms ease-out transition で smooth
- drop / pointer leave / drag cancel で transform を除去 (element は元位置に戻る)

**shift 方向の汎用 fallback** ... 特定 preset の shift direction が §3-14 で未定義なら「overlap を解消する最小移動方向」 を fallback 計算する (bounding rect の重なり面積が最小になる 4 方向 (上下左右) のうち最短 shift)。

**shift 対象外** ... collision shift は preset element / 他 overlay 側のみ transient shift、 self (drag 対象) は動かさない (snapshot 禁止事項「drag 対象を snap で動かすな」 と一致)。 self posX/posY は mouse に完全追従。

## 3. sequence preset override note

- element edge shape = lane は縦線 (x=lane.x、 y 全域)、 note は矩形
- primitive 3 shift direction = 横方向 X (他 lane を右または左に shift、 他 note は元位置維持で lane のみ shift)
- 制約 = parts drop 時 sequence lane 幅計算に副作用禁止 (現行 bug の直接対応、 parts は target.overlays に入り target.lanes に触れないため lane 幅計算から完全除外)
- 実測 shift magnitude = 40 unit approximate (sequence lane 標準間隔と一致)

## 4. flow preset override note

- element edge shape = node は矩形 (title box + subtitle 領域を含む outer rect)
- primitive 3 shift direction = 縦方向 Y (parts overlay と重なる node を下方向 shift)
- 制約 = edge (flow arrow) は shift 対象外、 node のみ shift。 arrow は node 位置に自動追従して curve 再計算
- 実測 shift magnitude = 60 unit approximate (flow node 標準縦間隔)

## 5. class preset override note

- element edge shape = class box は矩形 (header + attribute list + method list の 3 段 outer rect)
- primitive 3 shift direction = 横方向 X (右方向 shift)
- 制約 = inheritance / association line は shift 対象外 (class box に自動追従)
- 実測 shift magnitude = 80 unit approximate (class 間標準間隔)

## 6. gantt preset override note

- element edge shape = bar は横棒 (startX / endX / trackY / trackY+30 の矩形)、 track 見出しは横帯
- primitive 3 shift direction = 順序 stack 挿入 (parts overlay と重なる track を下方向に stack 挿入、 他 bar は track ごと下 shift)
- 制約 = timeline 軸 (top 見出し) は shift 対象外、 track のみ shift
- 実測 shift magnitude = 40 unit approximate (gantt track 標準高)

## 7. topology preset override note

- element edge shape = topology node は矩形 or 円 (kind 別)、 link は curve
- primitive 3 shift direction = 汎用 fallback (overlap 解消の最小移動方向、 8 方向中最短)
- 制約 = link は shift 対象外 (node 位置に自動追従)
- 実測 shift magnitude = node size 依存 (default 60 unit)

## 8. ER preset override note

- element edge shape = entity は矩形 (attribute list を含む outer rect)、 relationship は菱形
- primitive 3 shift direction = 横方向 X (右方向 shift)
- 制約 = relationship line は shift 対象外、 entity のみ shift、 relationship 菱形は entity と一緒に shift
- 実測 shift magnitude = 100 unit approximate (ER entity 標準間隔)

## 9. state-machine preset override note

- element edge shape = state node は角丸矩形 or 円 (composite / atomic 別)
- primitive 3 shift direction = 汎用 fallback (state 配置の自由度が高いため最小移動)
- 制約 = transition arrow は shift 対象外 (state 位置に自動追従)
- 実測 shift magnitude = 60 unit approximate (state 間標準間隔)

## 10. c4 preset override note

- element edge shape = context / container / component box は矩形 (nested layout の outer rect)
- primitive 3 shift direction = 横方向 X (右方向 shift)、 nested container は親 box 内で相対 shift
- 制約 = c4 boundary (点線 rect) は shift 対象外、 container のみ shift
- 実測 shift magnitude = 120 unit approximate (c4 container 標準間隔)

## 11. mind preset override note

- element edge shape = mind node は円 or 楕円 (branch depth 別 size)
- primitive 3 shift direction = 放射方向 (root からの方向を維持しつつ radial 方向に shift)
- 制約 = **中央 root node は shift 対象外** (mind map の center 固定)、 leaf node のみ shift
- **posX/posY 意味論の例外** = 中央 root への posX/posY 明示指定は無効 (auto fallback で自動配置)
- 実測 shift magnitude = 40 unit approximate (branch 間標準間隔)

## 12. pie preset override note

- element edge shape = pie slice は扇形 (center + radius + angle range)
- primitive 3 shift direction = **shift 無効** (pie は circular layout で shift 概念が成立しない)
- 制約 = pie slice は静的 layout、 overlay drop 時は pie 全体を新規 position に移動する経路のみ
- **posX/posY 意味論の例外** = pie は overlay として drop 可、 但し pie 内部 slice の shift 不可
- 実測 shift magnitude = N/A

## 13. swimlane preset override note

- element edge shape = swimlane は横帯 (y=lane.y、 x 全域、 高 = lane.height)
- primitive 3 shift direction = 縦方向 Y (他 swimlane を上または下に shift)
- 制約 = swimlane 見出し (left column) は shift 対象外、 lane 内部の task box は shift 対象
- 実測 shift magnitude = swimlane.height (default 80 unit)

## 14. solidity preset override note

- element edge shape = contract box は矩形 (function list + storage list の outer rect)、 external call は curve
- primitive 3 shift direction = 汎用 fallback (contract 配置の自由度高、 最小移動方向)
- 制約 = external call arrow は shift 対象外 (contract 位置に自動追従)、 storage struct は contract 内部 layout
- 実測 shift magnitude = 100 unit approximate (contract 間標準間隔)

## 15. backward compat (auto fallback)

posX/posY 未指定の parts は preset auto-layout が default 位置を計算する現行動作を継続する。 catalog 100+ diagram の書換不要。

**判定経路** ...

```
if actor.partId === undefined:
  // 通常 actor (parts 以外) は preset auto-layout 経路
  continue with preset

if actor.partId !== undefined:
  if actor.posX === undefined && actor.posY === undefined:
    // auto fallback = preset default 位置で target.lanes 経路 (現行動作継続)
    apply_current_merge_part_into_diagram_via_lanes(actor)
  else:
    // 新経路 = target.overlays に push
    target.overlays.push({
      partId: actor.partId,
      alias: actor.name,
      posX: actor.posX,
      posY: actor.posY,
      width: parts.viewport.width,
      height: parts.viewport.height,
      bindSpec: parse_bind(actor.bind),
      stateOverride: actor.stateOverride,
    })
```

**catalog 100+ diagram の互換保証** ... 既存 catalog の parts 使用箇所は posX/posY 未指定が default、 上記 auto fallback branch に入るため描画位置が変化しない。 visual regression e2e は 12 preset で 1 diagram ずつ verify すれば全 catalog カバー相当。

## 16. 実装 phase (3 PR 分割)

### PR 1 = spec doc 単独 (本 file)

- `docs/spec-canvas-pivot-adjustment.md` の 1 file 追加
- code 変更なし、 user 目視 review + merge
- base = main branch (現行 PR #428 の Phase 1-6 merge 完了後)
- branch = `feature/canvas-pivot-spec-v2-doc`

### PR 2 = core impl (compile 独立化 + 座標 semantic 一本化)

- PR 1 merge 後着手、 base = main、 branch = `feature/canvas-pivot-spec-v2-core`
- 変更 file (主要) ...
  - `packages/dragon/src/types.ts` = `CdlDiagram` に `overlays?: OverlayPart[]` field 追加、 `OverlayPart` 型定義
  - `packages/dragon/src/compile.ts` = `mergePartIntoDiagram` を 2 branch に分岐 (auto fallback = 現行維持 / overlay 経路 = target.overlays push)
  - `packages/dragon/src/render.ts` (or Renderer) = overlay layer 描画 pass 追加、 lane 層と別 `<g class="overlay-layer">` で 12 preset 描画後に順次 render
  - `apps/playground-spa/src/components/CdlEditor.tsx` = drop / drag interaction で SVG viewBox 座標系に client 座標を getCTM inverse で変換、 DSL 書出しで posX/posY 明示指定
- 3 marker + user 目視 verify + merge
- e2e verify = 12 preset で 1 diagram ずつ「parts overlay drop / drag / DSL 保存 / 再 render」 の 4 step regression

### PR 3 = feature impl (自己 5px snap + 他要素避け動作)

- PR 2 merge 後着手、 base = main、 branch = `feature/canvas-pivot-spec-v2-feature`
- 変更 file (主要) ...
  - `apps/playground-spa/src/components/CdlEditor.tsx` = `onPointerUp` で primitive 2 (edge alignment 5px snap) 適用、 `onPointerMove` で primitive 3 (collision shift) 適用
  - `packages/dragon/src/render.ts` (or Renderer) = CSS transform dispatch 経路 (data-collision-shift 属性 + transition 200ms ease-out)
  - preset registry = 12 preset の shift direction / shift magnitude / edge shape approximate を preset config として登録
- 3 marker + user 目視 verify + merge
- e2e verify = 12 preset で「parts drag → 他要素 shift → drop → snap → transform 消去」 の 5 step regression

## 17. 型定義 (実装時の参考)

```typescript
export interface OverlayPart {
  /** parts catalog の partId (kind: parts-* から抽出) */
  partId: string;
  /** user が書く actor 名 = merge 時の namespace prefix */
  alias: string;
  /** SVG viewBox 内 SVG unit 座標、 origin = 左上 (0,0) */
  posX: number;
  posY: number;
  /** parts の内部 render size (parts CdlDiagram.viewport から継承) */
  width: number;
  height: number;
  /** binding source (counter1.n 等の解析結果) */
  bindSpec?: { sourceAlias: string; sourceState: string };
  /** state override (parts 内 state initial の上書き) */
  stateOverride?: Record<string, number | string | boolean>;
}

export interface CdlDiagram {
  // 既存 field
  title?: string;
  type?: string;
  actors: DslActor[];
  lanes: Lane[];
  nodes: Node[];
  edges: Edge[];
  states: State[];
  // 新 field
  overlays?: OverlayPart[];
}
```

## 18. e2e verify 経路

各 PR 完了時に 3 marker (test-passed / verify-passed / review-passed) を発行、 marker body に以下 3 field を明記する。

- 実行 test 一覧 (unit / e2e / visual regression)
- pass 結果の log 抜粋
- user 目視 verify の screenshot path 3 枚以上 (`rules/quality.md § review-passed marker 発行前提` = hook 084 強制)

subagent 経由の marker 詐称禁止 (snapshot 禁止事項、 CAR-1697 前 session の codex-runner fabrication と同 pattern の再発防止)。 main session が実 marker 検証 + 実 screenshot Read 必須。
