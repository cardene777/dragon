# spec — dragon `parts:` widgets syntax (CAR-1657)

**status** = superseded (2026-07-17)
**superseded-by** = `docs/spec-parts-actors-unified.md`
**却下理由** = `parts:` を top-level keyword として新設する案を採らず、parts を actor の一種と
して既存の `actors` 記法に寄せる案を採った。 記法の入口を増やさずに済むため。

**本 file は履歴として残している**。 grilling の全枝走査結果 (5 critical + 2 optional 論点) が
書かれており、なぜこの案を採らなかったかを読むのに要る。 **実装はこの spec に従っていない**。

実装との対応を確かめる場合は次のとおり。 本 spec が挙げる識別子は `parts:` keyword /
`prefixIds` / `applyLaneOffset` / `convertJsonPartsToWidgetsSyntax` / `DslPartsRef` のいずれも
実装に存在せず、実際に動いているのは actors 版の `mergePartsFromActors`
(`packages/dragon/src/compile.ts`) になる。

以下は grilling 全枝走査結果と 4 survey (editor / parser / parts / test-infra) findings を
統合した当時の内容で、**当時は実装着手前の SSOT として書かれた**。

## 0. 目的 (Why)

user 期待は「drag で既存 dragon DSL に parts が **追加** される。 first-class identifier 参照、 JSON hidden、 位置指定 / 移動可能」。 既 merge の JSON escape hatch (`#!parts` marker + `JSON.stringify(CdlDiagram)` で editor 全内容 REPLACE、 internal AST を user に晒す、 位置指定なし) は wrong direction、 本 spec で全面置換する。

user 判断 (2026-07-17 decision-log `2026-07-17-dragon-parts-widgets-syntax-rebuild`) = 「ベストな方法でやれ」 委任。 本 spec は grilling 経路で 5 critical + 2 optional 論点を全枝走査した結果を lock する。

## 1. 前提事実 (survey 実測)

### parser 側 (v05)

- top-level keyword 9 種 = `title` / `type` / `actors` / `flow` / `states` / `animation` / `viewport` / `lanes` / `groups`
- `parseInlineMapping` は generic、 新 keyword の追加は non-breaking
- 既存 keyword 命名規約 = 単数 (単一実体) / 複数 (collection) の使い分け明確
  - 単数 = `title` / `type` / `animation` / `viewport`
  - 複数 = `actors` / `states` / `lanes` / `groups`
- `flow` は例外的単数 (collective noun として使用)

### parts 側 (実測 n=80)

| 指標 | 実測値 |
|---|---|
| top-level export 数 | 80 |
| avg lanes / parts | 1.32 (max 5) |
| avg nodes / parts | 1.54 (合計 123、 うち hidden stub `_h` 17 件) |
| avg states / parts | 1.64 (合計 131) |
| avg phases / parts | 1.23 (合計 98) |
| avg edges / parts | 0.03 (2 件のみ) |
| 単一 lane に閉じる parts | 68 / 80 = 85% |
| animate 実装 | 全 80 parts (static 0 件) |
| single-phase parts | 70 / 80 = 87.5% |
| lane x=0 baked-in | 全 parts (呼出側 injection 経路なし) |

### id 衝突 (naive merge 80 parts、 namespace 無し)

| id 種別 | top 衝突 |
|---|---|
| lane | `l` = 68 件 / `la` = 8 / `lb` = 8 |
| phase | `p` = 70 件 / `p1` = 10 / `p2` = 10 |
| node | 6 id で 29 instances (全 24%)、 `_h` 17 / `bar` 4 / `upBar` 2 |
| state | 20+ id (`bg` 9 / `v` 4 / `net` 3 / `mem` 3) |

**結論** = namespace prefix 経路無しの naive merge は物理的に不可能。

### editor 側

- 既 merge の `serializePart` / `deserializePart` = 55 行 pure fn 3 個
- serialize 先 = CodeMirror `src` state (text buffer) のみ、 localStorage 保存経路なし
- **share URL** = `#s=<base64(src)>` で text buffer 全体を base64 encode、 `#!parts` marker 付き buffer は URL に含まれ得る = **backward compat 必須**
- CodeMirror = `@uiw/react-codemirror` の controlled 経路、 `EditorView` instance ref は現状取得していない (cursor insert には ref 取得 5 行 + `posAtCoords` 5 行 + `dispatch changes` 5 行 = 15 行程度)
- SVG は `data-cdl-node` / `data-cdl-edge` / `data-cdl-diagram` / `data-cdl-role` を出力済、 drag-to-move via SVG DOM の下地あり
- `confirmReplaceIfDirty` (window.confirm 経路) が 5 経路で共有中、 widgets 経路への流用コストゼロ

### test 側

- `EDITOR_SAMPLES[]` = 12 entries、 全 sequence / flow / actors model のみ、 widgets syntax 0 hit
- `parts-serializer.test.ts` = 169 行 10 test (marker detect + JSON round-trip)、 相対 import 暫定配置
- animation test = 8 file、 「parts merge 経路の phase 3 mode」 未 cover
- visual regression (Playwright `toHaveScreenshot`) 未使用、 e2e で数値 assert が投資対効果高

## 2. 5 critical 論点 decision matrix

各論点で option × 4 判定基準 (実装コスト / user UX / backward compat / 将来拡張性) を採点、 推奨 1 案 + 却下理由を明示。

### 論点 1. keyword 正式名

| option | 実装コスト | user UX | backward compat | 将来拡張性 | 総合 |
|---|---|---|---|---|---|
| `parts:` (**Recommended**) | 低 | 高 (既存 sidebar パーツ tab と一致) | 高 | 高 | ⭐⭐⭐⭐⭐ |
| `widgets:` | 低 | 中 (「widget」 は一般語で意味希薄) | 中 | 中 | ⭐⭐⭐ |
| `atoms:` | 低 | 低 (parts library との関係不透明) | 中 | 中 | ⭐⭐ |
| `blocks:` | 低 | 低 (Notion / Slack と衝突する認知負荷) | 中 | 中 | ⭐⭐ |
| `components:` | 低 | 低 (React / Vue と重複、 一般語過ぎる) | 中 | 中 | ⭐⭐ |

**採用 = `parts:`**

**理由**
1. 既存 `parts.cdl.ts` / `PARTS_COUNT_ESTIMATE` / `loadPartsItems()` / sidebar 「パーツ」 tab の 4 layer で「parts」 が確立語彙、 同語再利用で認知負荷ゼロ
2. 命名規約 (複数 = collection) に整合、 `actors:` / `states:` / `lanes:` / `groups:` と並置しても違和感ゼロ
3. parts-survey 実測 = 80 export 全てが `parts` prefix (`partsWaveGauge` / `partsArcGauge` / ...)、 sidebar UI 表示も「パーツ」 で dogfoods 済

**却下**
- `widgets:` = user 元briefing の word だが、 内部で確立済語彙 (parts) に合わせる方が SSOT drift を防ぐ
- `atoms:` / `blocks:` / `components:` = 全て一般語で意味希薄、 既存規約と一貫しない

### 論点 2. 位置指定粒度

| option | 実装コスト | user UX | backward compat | 将来拡張性 | 総合 |
|---|---|---|---|---|---|
| `at: { x }` lane-offset injection (**Recommended**) | 低 (lane x rewrite のみ) | 高 (drag 座標が直接 mapping) | 高 | 中 (Phase 3 で `y` / `stack` 追加余地) | ⭐⭐⭐⭐⭐ |
| lane / stack ref only (既存 `lanes:` 経路借用) | 中 (parts の lane と外側 lane の名前空間統合が必要) | 低 (drag 直感と乖離) | 高 | 高 | ⭐⭐⭐ |
| x / y 自由座標 (layout engine 拡張) | 高 (layout engine が lane model 前提、 全面改修) | 高 | 低 (既存 layout 破壊) | 高 | ⭐⭐ |
| hybrid (lane/stack + optional x/y) | 高 (2 経路並存で spec 面積 2 倍) | 中 (認知負荷) | 中 | 高 | ⭐⭐ |
| 位置指定なし (Phase 2 で妥協) | 極低 | 極低 (user 期待から乖離) | 高 | 低 | ⭐ |

**採用 = `at: { x }` lane-offset injection**

**理由**
1. parts-survey 実測 = 全 parts が `lane.x = 0` baked-in、 呼出側 `lane.x += offset` で書き換えるのが最小変更で完結
2. 全 parts の 85% は単一 lane、 lane offset = そのまま widget 全体の x 座標として drag 座標と 1:1 対応
3. drag 座標 → `at: { x: 座標 }` の generate は generic SVG DOM API で完結、 layout engine 改修不要
4. `y` は Phase 3 で hybrid 化余地 (単一 lane 内 stack 制御を必要とする複合 widget が出た時に追加)
5. optional field = 省略時 `at: { x: 0 }` fallback、 spec 面積を段階拡張可能

**却下**
- lane/stack ref only = drag 座標 → lane id への変換が不自然、 user は「x 座標」 で考える
- x/y 自由座標 = layout engine (`compile.ts` の lane model 前提) 全面改修が必要、 scope 過大
- hybrid = 2 経路並存で spec 面積 2 倍、 Phase 2 では premature
- 位置指定なし = user 期待から明確乖離、 spec の存在意義失う

### 論点 3. merge 時の id 命名

parts-survey で確定 = **naive merge は物理的に不可能** (lane `l`=68、 phase `p`=70)、 namespace prefix 必須。

| option | 実装コスト | user UX | backward compat | 将来拡張性 | 総合 |
|---|---|---|---|---|---|
| user-facing alias が prefix (**Recommended**) | 中 (prefix 経路 1 fn) | 高 (alias が readable + 参照可能) | 高 | 高 (state wire で alias 経路確立) | ⭐⭐⭐⭐⭐ |
| 自動連番 (`arcGauge-1` / `arcGauge-2`) | 低 | 中 (drag 順で連番、 意味不透明) | 高 | 中 | ⭐⭐⭐ |
| 全 field UUID (`arc-{uuid}__gauge`) | 低 | 低 (人間 unreadable) | 高 | 中 | ⭐⭐ |
| modal で user 選択 | 中 | 低 (drag flow 中断) | 高 | 低 | ⭐ |

**採用 = user-facing alias が prefix**

**syntax**
```
parts:
  arc1: partsArcGauge { at: { x: 0 } }
  arc2: partsArcGauge { at: { x: 400 } }
  bar1: partsHorizontalBar { at: { x: 800 } }
```

**内部 mapping** (parts の全 id を alias で prefix)

- lane `l` → `arc1__l` / `arc2__l` / `bar1__l`
- node `gauge` → `arc1__gauge` / `arc2__gauge`
- state `v` → `arc1__v` / `arc2__v` / `bar1__pv`
- phase `p` → `arc1__p` / `arc2__p` / `bar1__p`
- edge (from / to node id) も同 prefix 適用

**理由**
1. user が書く alias (`arc1` / `bar1`) = 意味を持つ短名、 後続の state wire / phase reference で使いやすい
2. `{alias}__{originalId}` = deterministic + collision-free by construction (alias が unique な限り)
3. Phase 3 で cross-parts state wire を追加する時、 `wire: - arc1.v -> umbrella.radius` のように alias で参照可能
4. alias 衝突 (`arc1` を 2 回宣言) は parser で reject、 error message で user に明示

**却下**
- 自動連番 = drag 順に依存、 DSL text の可読性低下
- UUID = 人間が読めない、 手編集での再現性ゼロ
- modal = drag-drop flow を中断する、 user report の趣旨に反する

### 論点 4. phase 統合方針

parts-survey で確定 = 全 80 parts が animate、 87.5% single-phase、 static は 0 件。

| option | 実装コスト | user UX | backward compat | 将来拡張性 | 総合 |
|---|---|---|---|---|---|
| parallel default + `phase: false` opt-out (**Recommended**) | 中 (phase merge 経路 + prefix) | 高 (drag = widget が preview 通り animate) | 高 | 高 | ⭐⭐⭐⭐⭐ |
| sequential concat (parts phase を main の後に append) | 中 | 低 (main animation の後に無音 delay、 user 予期せず) | 高 | 中 | ⭐⭐ |
| user select per part | 高 (modal + phase mode field) | 中 | 高 | 中 | ⭐⭐⭐ |
| static (parts phase 破棄) | 低 | 低 (animate parts が static 化、 widget の主張消失) | 高 | 低 | ⭐ |

**採用 = parallel default + `phase: false` opt-out**

**syntax**
```
parts:
  arc1: partsArcGauge                        # phase parallel default
  bar1: partsHorizontalBar { phase: false }  # static 表示のみ
```

**semantic**
- parallel = parts の phase を既存 main animation phase と **同時再生** (timeline 同時開始)
- 各 parts の phase id は alias で prefix 済 (`arc1__p`)、 collision なし
- state 名も alias prefix 済 (`arc1__v`)、 tween/set は自 parts state のみ触る
- `phase: false` = parts の phase / tween / set を全て drop、 node のみ merge (dyn-* shape は state 初期値のみ表示)

**理由**
1. user が widget を drag = preview で見た animation ごと持ってきたい (mental model 一致)
2. parts-survey で 87.5% single-phase、 parallel での duration mismatch は起きにくい
3. 各 parts state は alias prefix で独立、 tween cascade の risk なし
4. `phase: false` opt-out で「static 装飾として使いたい」 use case を吸収

**却下**
- sequential = main animation 後に無音 delay、 user surprise
- user select modal = drag flow 中断
- static only = 全 80 parts が animate なのに default で killed する、 spec の主張が弱くなる

### 論点 5. JSON escape hatch (`#!parts` marker) の扱い

editor-survey で確定 = share URL に `#!parts` buffer が野に出ている可能性、 完全削除は URL 死亡 risk。

| option | 実装コスト | user UX | backward compat | 将来拡張性 | 総合 |
|---|---|---|---|---|---|
| user 経路廃止 + internal 移行 adapter として残す (**Recommended**) | 中 (auto-convert fn 1 個) | 高 (buffer 開くと勝手に convert + warn banner) | 高 (既存 share URL 全 rescue) | 高 (widget syntax 完全単独 SSOT) | ⭐⭐⭐⭐⭐ |
| 完全削除 | 低 | 低 (既存 share URL 開くと error) | 極低 | 高 | ⭐⭐ |
| user 経路として並存 (dual path) | 低 | 中 (2 経路で認知負荷) | 高 | 低 (maintenance burden) | ⭐⭐ |
| test 用のみ残す | 中 | 中 | 中 | 低 | ⭐ |
| read-only 表示可 | 高 | 低 | 高 | 低 | ⭐ |

**採用 = user 経路廃止 + internal 移行 adapter として残す**

**具体**
- drag-drop / click は `serializePart` を **呼ばない** (widgets syntax 経路のみ)
- editor open (initial parse / share URL decode) 時に `isPartsMarker(src)` を check
  - marker あり → `deserializePart` で AST 復元 → widgets syntax text に auto-convert → `setSrc(convertedText)` + one-shot warn banner (「旧 JSON 形式の parts を新 `parts:` 形式に変換しました。 元 URL は動作継続します」)
  - marker なし → 通常の text DSL parse 経路
- `PARTS_MARKER` / `isPartsMarker` / `deserializePart` は internal adapter として保持、 `serializePart` は削除 (逆方向 = widgets → JSON は不要)

**理由**
1. share URL に `#!parts` buffer が既に野に出ている可能性 → 完全削除は URL 死亡
2. auto-convert = user が何もしなくても新 syntax に移行、 UX 最良
3. warn banner で「変換された」 事実を明示、 undo (Cmd+Z) で旧 JSON に戻る余地も残す
4. `serializePart` 削除で「新規 JSON escape hatch が生まれる経路」 を構造的に遮断、 SSOT drift 防止
5. N release (例 3 release) 後に adapter も削除、 最終形は widgets syntax 単独

**却下**
- 完全削除 = share URL 死亡 risk 大
- dual path = 2 経路 maintenance、 SSOT drift の温床
- test 用のみ = dead code + 意図が不明瞭
- read-only 表示可 = user 混乱 (「編集できない parts が表示された」)

## 3. 2 additional 論点 decision matrix

### 論点 6. backward compat migration

論点 5 の結論と統合 = **auto convert on open + one-shot warn banner + Cmd+Z 経路確保**

具体挙動。

- editor 起動 / share URL decode / paste 時に marker check
- marker あり → decode 成功なら widgets syntax に auto convert (loss-less、 lane x=0 + alias = parts id そのまま)
- warn banner 1 回表示 = 「旧 JSON 形式を検出、 `parts:` 形式に自動変換しました。 元に戻すには Cmd+Z」
- decode 失敗 (JSON invalid) → error 表示 (現行と同じ)、 auto convert しない

conversion mapping。

```
#!parts
{"id":"partsArcGauge","topic":"...","nodes":[...],"lanes":[{"id":"l","x":0,...}],...}
```

↓

```
title: ""
type: sequence
actors: []
flow: []

parts:
  partsArcGauge: partsArcGauge { at: { x: 0 } }
```

alias は元 diagram.id をそのまま使う (deterministic + user が編集可能な readable text)。

### 論点 7. catalog demo「counter → 傘上昇」

parts-survey で確定 = single-parts 内での state → shape bind は既存実装 (`partsBindCounterRadius` / `partsBindRingCounter` 等 12 件)、 **cross-parts state wire は未実装**。

| option | 実装コスト | user UX | backward compat | 将来拡張性 | 総合 |
|---|---|---|---|---|---|
| Phase 3 で separate PR (**Recommended**) | 高 (cross-parts state wire infra 必須) | 高 (final demo で spec の主張確立) | 高 | 高 | ⭐⭐⭐⭐⭐ |
| Phase 2 で先行実装 | 高 | 高 | 高 | 中 (infra 未成熟で risk 大) | ⭐⭐ |
| Phase 2 で single-parts 版だけ demo (既存 `partsBindCounterRadius` 使用) | 極低 | 中 (cross-parts の主張なし) | 高 | 高 | ⭐⭐⭐⭐ |
| 別 Issue に完全分離 | 高 | 中 | 高 | 低 (context loss) | ⭐⭐⭐ |

**採用 = Phase 3 で separate PR**

**理由**
1. cross-parts state wire = 新 infra (`wire: - {aliasA}.{state} -> {aliasB}.{state}` syntax + engine 経路)、 Phase 2 infra が stable 化してから積む方が安全
2. Phase 2 では single-parts 版 (既存 `partsBindCounterRadius`) を samples に追加、 state → shape bind の可能性を先行 demo
3. Phase 3 で「counter parts + umbrella parts の 2 個 drag → wire で連動」 の cross-parts demo を積んで spec の主張を完成
4. separate PR で review scope を管理、 Phase 2 の 4 PR chain に混ぜると diff が大きくなり過ぎる

## 4. Formal syntax spec

### 4.1 top-level keyword 追加

parser (`packages/dragon/src/v05/parser.ts`) に `parts` を 10 番目の top-level keyword として追加。

```ts
if (head.key === "parts") {
  const { items, next } = collectIndentedList(lines, i + 1, line.indent);
  const partsMap: Record<string, DslPartsRef> = {};
  for (const it of items) {
    const ref = parsePartsEntry(it, errors);
    if (ref) partsMap[ref.alias] = ref;
  }
  i = next;
  continue;
}
```

### 4.2 entry syntax

```
parts:
  {alias}: {partsRef}
  {alias}: {partsRef} { at: { x: N }, phase: false }
```

**規則**
- `{alias}` = `[a-zA-Z_][a-zA-Z0-9_]*` (parser 側の identifier regex 流用)
- `{partsRef}` = 同 regex、 `parts.cdl.ts` の export const 名を参照 (build 時 resolve)
- inline mapping (`{ at: {...}, phase: ... }`) = existing `parseInlineMapping` 経路流用、 nested `{ x: N }` は depth count で正確 parse (`matchActorInlineMapping` と同じ経路)
- `at` field = `{ x: number }` のみ受入 (Phase 2)、 `y` / `stack` は Phase 3 で追加
- `phase` field = `true` (default 省略時) / `false` (opt-out)、 boolean 以外は default

### 4.3 alias 制約

- 同一 DSL 内で alias 重複禁止、 重複時は error (`duplicate parts alias: "{alias}"`)
- alias は既存 actors / lanes / groups id と名前空間分離 (parts 内部 id が prefix されるため衝突しない)
- alias の recommendation = short semantic name (`arc1` / `bar1` / `counter`)、 長い名前も許容

### 4.4 未知 partsRef 処理

- build 時に `parts.cdl.ts` の export に存在しない `{partsRef}` を error 化 (`unknown parts ref: "{partsRef}"`、 hint = 「利用可能 parts は sidebar パーツ tab 参照」)
- 実行時 dynamic import で resolve 失敗した場合も同 error

## 5. Semantic spec (merge behavior)

### 5.1 AST merge pipeline

`textDslToDiagram` (compile 経路) の最終 step に `mergeParts` を追加。

```ts
function mergeParts(baseDiagram: CdlDiagram, partsRefs: DslPartsRef[]): CdlDiagram {
  const merged = { ...baseDiagram };
  for (const ref of partsRefs) {
    const partsDiagram = resolveParts(ref.partsRef);  // parts.cdl.ts export 参照
    const prefixed = prefixIds(partsDiagram, ref.alias);
    if (ref.at?.x !== undefined) applyLaneOffset(prefixed, ref.at.x);
    if (ref.phase === false) dropPhases(prefixed);
    merged.lanes = [...(merged.lanes ?? []), ...prefixed.lanes];
    merged.nodes = [...(merged.nodes ?? []), ...prefixed.nodes];
    merged.states = { ...merged.states, ...prefixed.states };
    merged.phases = mergePhases(merged.phases, prefixed.phases);  // parallel
    merged.edges = [...(merged.edges ?? []), ...prefixed.edges];
  }
  return merged;
}
```

### 5.2 prefixIds spec

- 全 lane / node / state / phase / edge の id に `{alias}__` prefix を付与
- node の `lane` field (lane 参照) も prefix 化
- state 参照 (`{stateName}` in `subtitle` / `shape.source` / `shape.level` / `shape.angle` / `shape.fill`) を alias prefix に置換
  - 正規表現 = `/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g` で match、 state map に存在するもののみ置換
- phase の `activate` / `tween.state` / `set.state` field も prefix 化
- edge の `from` / `to` (node id 参照) も prefix 化

### 5.3 applyLaneOffset spec

- prefixed diagram の全 lane の `x` field に offset を加算
- 単純 sum、 negative offset も許容 (user が canvas 左に置きたい場合)
- viewport width は自動拡張 (`max(existing viewport.width, max lane.x + lane.width + margin)`)

### 5.4 mergePhases spec (parallel)

- 既存 main phase 配列 + parts phase 配列を単純 concat
- 各 phase は独立 timeline entry として re-order、 duration は longest phase の duration に統一
- 実際の layout は既存 `compile.ts` の phase → timeline 変換に委譲、 本 fn は phase 配列を渡すだけ
- collision は起きない (prefixIds で保証)

### 5.5 dropPhases spec

- parts の全 phase を削除、 state 初期値のみ merged 側に残す (dyn-* shape の初期表示は残る)
- edges も同 parts の phase を activate 依存するものは削除

## 6. Backward compat spec

論点 5 / 6 の結論を実装 spec 化。

### 6.1 auto-convert 経路

`CdlEditor.tsx` の debounce parse (`useEffect`, line 502) の先頭に convert 分岐を挿入。

```ts
if (isPartsMarker(src)) {
  const part = deserializePart(src);
  if (part) {
    const converted = convertJsonPartsToWidgetsSyntax(part);
    setSrc(converted);
    lastLoadedSrcRef.current = converted;
    setMigrationWarn("旧 JSON 形式の parts を新 `parts:` 形式に自動変換しました。 元に戻すには Cmd+Z。");
    return;  // 次 debounce cycle で converted を parse
  }
  setError(`${PARTS_MARKER} marker があるが JSON が invalid です。`);
  return;
}
```

### 6.2 convertJsonPartsToWidgetsSyntax spec

```ts
function convertJsonPartsToWidgetsSyntax(part: CdlDiagram): string {
  const alias = part.id;  // partsArcGauge そのまま alias 化
  return [
    `title: ""`,
    `type: sequence`,
    ``,
    `actors: []`,
    ``,
    `flow: []`,
    ``,
    `parts:`,
    `  ${alias}: ${alias} { at: { x: 0 } }`,
  ].join("\n");
}
```

### 6.3 warn banner 経路

`dropHintMessage` state 経路 (line 221) を流用、 migration warn 専用 timer で 8 秒表示。

### 6.4 serializePart 削除

`parts-serializer.ts` から `serializePart` を削除。 `PARTS_MARKER` / `isPartsMarker` / `deserializePart` は internal adapter として保持。

## 7. Phase 2 / Phase 3 sub PR breakdown

grilling で 5-7 PR chain に分割、 各 PR は independent review 可能 + revert 可能。

### Phase 2 (CAR-1657 本 Issue、 4 PR chain)

| PR | scope | 変更 file 想定 | 追加 test |
|---|---|---|---|
| **PR-A**: `parts:` keyword parser | v05 parser 拡張 (top-level keyword 追加 + entry parse) | `packages/dragon/src/v05/parser.ts` / `packages/dragon/src/types.ts` (`DslPartsRef` 型追加) | parser unit 8 TC (基本 syntax / alias 重複 / 未知 partsRef / inline mapping nested) |
| **PR-B**: parts merge with auto-prefix | `mergeParts` / `prefixIds` / `applyLaneOffset` / `mergePhases` 実装 + compile pipeline 統合 | `packages/dragon/src/compile.ts` (or 新 file `packages/dragon/src/parts-merge.ts`) | merge unit 15 TC (prefix / offset / phase parallel / state 参照置換 / 複数 parts 同時 merge) |
| **PR-C**: drag-drop path change | REPLACE → append `parts:` block insertion (widgets syntax 生成) | `apps/playground-spa/src/components/CdlEditor.tsx` (handlePreviewDrop / click fallback / handleNewFile) | e2e 6 TC (drag 1 件 / 複数件 / 既存 parts: block 存在時 / drop 座標 → x offset mapping) |
| **PR-D**: backward compat auto-convert | `convertJsonPartsToWidgetsSyntax` + editor open branch + warn banner | `apps/playground-spa/src/lib/parts-serializer.ts` (serializePart 削除、 convert fn 追加) / CdlEditor debounce parse | unit 4 TC + e2e 2 TC (marker あり buffer 開く / share URL decode) |

Phase 2 完了条件。

- 全 4 PR merge 後、 sidebar パーツ tab で drag drop すると `parts:` syntax が editor bottom に append される
- 複数 parts drag で複数 entry 追加、 collision なく preview render
- 既存 `#!parts` marker buffer を開くと auto convert + warn banner 表示
- `serializePart` は削除、 新 JSON escape hatch が生まれる経路なし

### Phase 3 (別 Issue、 3 PR chain 想定)

| PR | scope | 依存 |
|---|---|---|
| **PR-E**: drag-to-move via preview SVG DOM | 既存 `data-cdl-node` attr 経路で widget 単位 hit-test、 drag delta で `at.x` 書換 | Phase 2 完了 (widgets syntax + at field) |
| **PR-F**: `at: { y }` / `stack:` override | Phase 2 の `at: { x }` を hybrid 化、 縦方向配置追加 | PR-E 完了 (drag-to-move で y 変更経路確立) |
| **PR-G**: cross-parts state wire + counter → 傘 demo | `wire: - {aliasA}.{state} -> {aliasB}.{state}` syntax 新設 + engine 経路 + samples に demo 追加 | PR-E / PR-F は independent |

## 8. Test coverage plan

### 8.1 samples-validate 拡張 (test-infra-survey findings 反映)

- `EDITOR_SAMPLES[]` に widgets syntax fixture を最小 3 件追加
  - `widgets-basic` = 単一 parts (`partsArcGauge` × 1)
  - `widgets-multi` = 3 parts 並置 (arc + bar + counter)
  - `widgets-static` = `phase: false` opt-out demo
- `samples-validate.test.ts` の count assert を 12 → 15 更新
- 全 15 sample が `textDslToDiagram + compile` throw なし + `phases.length > 0` 通過

### 8.2 parser unit (PR-A)

- 8 TC = 基本 syntax / alias 重複 error / 未知 partsRef error / inline mapping nested / at 省略 / at 部分 / phase: false / 全 field 指定

### 8.3 merge unit (PR-B)

- 15 TC = prefix single parts / prefix multiple parts / lane offset / state 参照置換 (subtitle / shape.source / shape.level) / phase parallel / phase collision protection / edge prefix / node lane ref prefix / dropPhases / state 初期値保持 / viewport 自動拡張 / negative offset / empty parts / 全 kind (dyn-wave / dyn-rect / dyn-circle / dyn-arc) 網羅

### 8.4 e2e (PR-C / PR-D)

- 6 TC (PR-C) = drag 1 件 append / 複数 drag / click 経路 append / 既存 parts: block 存在時 append / 空 buffer に drag / 座標 → x offset
- 2 TC (PR-D) = marker あり buffer 開く / share URL decode で marker 検出 → auto convert

### 8.5 phase 統合 regression

- 15-20 TC 追加 (test-infra-survey findings)、 既存 `axis-laid-mutations` batch 経路の pattern 再利用
- parallel / opt-out static の 2 mode 網羅、 sequential は Phase 2 で対象外

## 9. 実装 risks & open questions

### 9.1 risk

- **CodeMirror controlled 経路** = `setSrc` で state 更新するが、 user が直接 edit 中に auto-convert がぶつかると cursor 位置消失。 debounce 300ms 経路で最初 parse 時のみ convert 発火する guard 必要
- **share URL migration** = 旧 marker URL を開いて convert 後、 user が再度 「共有 URL」 ボタンを押すと **新 syntax** の URL が生成される。 旧 URL は動作継続 (auto convert 経路)、 新 URL は widgets syntax の URL、 2 種混在する期間が発生する
- **parts の `_h` hidden layout stub** = 17 件、 alias prefix で `arc1___h` になるが lane 内 stub 数が 0 個防止用、 layout 経路がこの命名で正しく識別できるか要確認 (別 test 経路)

### 9.2 open questions (Phase 2 で decide しない、 Phase 3 spec で解決)

- Q1. `at: { y }` の spec (垂直方向配置は lane 内 stack 経路と何が違うか、 lane 高さの動的計算はどうするか)
- Q2. drag-to-move の SVG DOM 経路詳細 (`data-cdl-node` の parent → widget alias の traversal 経路)
- Q3. cross-parts state wire の syntax 最終形 (`wire:` keyword 追加 vs `parts:` 内 nested field)
- Q4. static / sequential phase mode の spec (Phase 3 で needs 出た時に追加)

## 10. decision-log 参照

本 spec で override される既存 decision-log 4 件 (全て A 案 = JSON escape hatch 前提)。

- `2026-07-16-dragon-editor-drag-and-drop-scope`
- `2026-07-16-dragon-editor-drag-patch-strategy-and-lib`
- `2026-07-16-dragon-editor-drop-semantic-replace`
- `2026-07-16-dragon-editor-parts-json-escape-hatch`

本 spec で新規に定まる judgment。

- `2026-07-17-dragon-parts-widgets-syntax-rebuild` (parent、 user 委任判断)
- `2026-07-17-dragon-parts-keyword-naming` (論点 1)
- `2026-07-17-dragon-parts-position-granularity` (論点 2)
- `2026-07-17-dragon-parts-id-namespace-alias` (論点 3)
- `2026-07-17-dragon-parts-phase-parallel-default` (論点 4)
- `2026-07-17-dragon-parts-json-hatch-internal-only` (論点 5)
- `2026-07-17-dragon-parts-backward-compat-auto-convert` (論点 6)
- `2026-07-17-dragon-parts-counter-umbrella-phase3` (論点 7)

decision-log の Write は本 spec の PR-A 起票時に 087 hook 経路で raw 捕捉、 各判断ごとに構造化 md を Write する経路で回収。

## 11. 実装着手 gate

本 spec が lock されたら PR-A から順に着手。 PR-A ↔ PR-B は type / merge fn が dependency で結合、 chain step 順は A → B → C → D 固定。

PR-A 着手前の final gate。

- [ ] spec 全 10 章を user が read + AC 一致確認
- [ ] Phase 2 で 4 PR / Phase 3 で 3 PR の分割粒度に合意
- [ ] `parts:` 名前で確定 (widgets 候補 も比較済)
- [ ] alias prefix 経路で id namespace 確定
- [ ] auto-convert + warn banner の backward compat 経路で確定
- [ ] counter → 傘 demo が Phase 3 送りで確定

全 6 gate 通過で PR-A 起票 → `/ship CAR-1657` chain 起動。
