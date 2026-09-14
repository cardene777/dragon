# spec: parts as actor kind (unified writing style)

**status** = active (2026-07-17)
**issue** = CAR-1657 (parts 間接続機能 parent tracker)
**supersedes** = `docs/spec-widgets-syntax.md` (grilling 版、 `parts:` 新 keyword 案 → 却下)
**decision-log** = `~/projects/claude-memory/decisions/personal/decision-log/2026-07-17-dragon-parts-unify-with-actors-syntax.md`

## 0. 目的

parts.cdl.ts の 80 diagram (arc-gauge / wave-gauge 等) を editor で drag → 既存 diagram に「追加」 する経路を実装する。 wrong direction (JSON escape hatch で全 REPLACE) を rebuild、 dragon の既存 `actors:` pattern に統一して human が書きやすい形にする。

## 1. 前提事実

- dragon には 2 DSL が既存: **Human YAML DSL** (`v05/parser.ts`) + **LLM JSON DSL** (`json-parser.ts`)、 両 DSL は独立 parser で入口分離、 `compileToCdl` で共通の CdlDiagram AST に落ちる
- 既存 kind list = 28 個 (`actor / function / service / database / cache / queue / api / person / entity / state / container / card / lambda / kms / secret / alb / ecs / rds / s3 / iam / user / browser / contract / eoa / multisig / proxy / library / interface`)、 `NODE_KIND_VALID` set で管理
- parts identifier list = 80 個 (`parts-arc-gauge` / `parts-wave-gauge` / etc.、 全て `parts-*` prefix、 内部 kind は `dyn-arc` / `dyn-wave` 等の別体系)
- 既存 SAMPLES 12 個は全て `actors:` inline mapping (`- API: { kind: function }`) を活用済、 backward compat 必須

## 2. 決定事項 (前 decision-log 反映)

### 2.1 記述形式 = 既存 `actors:` 統一

**Human YAML DSL** = parts を actors[] に kind = parts identifier で書く。

```yaml
actors:
  - ユーザー                                              # 既存: 単純名 (kind default actor)
  - API: { kind: function }                              # 既存: kind override
  - arc1: { kind: arc-gauge, v: 50, lane: ユーザー }     # 新: kind = parts identifier
```

**LLM JSON DSL** = actors[] object に `kind = parts identifier` を書く。

```json
{
  "actors": [
    "ユーザー",
    { "name": "API", "kind": "function" },
    { "name": "arc1", "kind": "arc-gauge", "state": { "v": 50 }, "lane": "ユーザー" }
  ]
}
```

### 2.2 parts identifier の prefix なし

- **採用** = `kind: arc-gauge` (prefix なし、 short、 human 手書きやすい)
- **却下** = `kind: parts-arc-gauge` (typing 長、 冗長)
- **命名保証** = parts.cdl.ts の全 export id は `parts-{name}` prefix だが、 syntax で書く時は `{name}` のみ、 内部 lookup で `parts-{name}` に mapping
- **衝突回避** = parts identifier (80 個の `{name}`) が既存 28 kind と重ならないことを parts 命名規約で保証、 現状衝突なし (arc-gauge / wave-gauge / dyn-* 全て distinct)

### 2.3 state override = inline 拡散 + `state: {}` fallback

- **default** = kind 以外の inline field が parts state 名なら state initial override として拾う
  ```yaml
  - arc1: { kind: arc-gauge, v: 50 }         # v は parts arc-gauge の state 名
  ```
- **予約語衝突時** = parts state 名が `lane / stack / subtitle / eyebrow / value / rows / initial / final` と衝突する場合、 `state: {}` 明示 fallback
  ```yaml
  - my-obj: { kind: some-part, lane: l1, state: { value: 100, subtitle: "..." } }
  ```
- **parser 実装** = 既存 `parseInlineMapping` で全 field を map で受け取り、 `parseActor` で予約語を actor field に落とし、 残りを state override として保持

### 2.4 位置指定 = `lane: {laneName}` (既存 syntax 流用)

- parts の内部 lane (`lane.x=0` baked-in) を捨てて、 drop target の lane に stack 積み
- `stack: N` で lane 内 順序指定 (既存 syntax)
- Phase 3 で `at: { x, y }` 拡張検討、 Phase 2 では lane/stack のみ

### 2.5 id 命名 = user alias が prefix (auto namespace)

- user が書く actor 名 (`arc1`) が unique namespace prefix になる
- parts 内部 id (`gauge` node / `lv` state / `p` phase) は `{alias}__{originalId}` 形式で自動 rename
  - `arc1` + `gauge` = `arc1__gauge` (node id)
  - `arc1` + `lv` = `arc1__lv` (state id)
  - `arc1` + `p` = `arc1__p` (phase id)
- 複数 parts 同時使用時の衝突を構造的排除 (実測 lane `l`=68 件 / phase `p`=70 件 = naive merge 不可能)

### 2.6 phase 統合 = parallel default + `phase: false` opt-out

- default = parts phase を既存 phase と同時再生 (parallel merge)、 duration は max を取る
- opt-out = `- arc1: { kind: arc-gauge, phase: false, v: 50 }` で parts phase を破棄、 static merge のみ
- 87.5% single-phase 実測 + alias prefix で collision 排除
- 段が状態を動かす部品 (`state-indicator` の `lvl` 等) は、`phase: false` を書かないと上書きした値が最初の段の値に隠れる

### 2.6.1 色番号 = 初期値が色番号の状態へまとめて入れる (#1973)

- `color: "#d9534f"` は状態の名前 `color` ではなく色番号として読み、部品の状態のうち初期値が色番号のもの全てに入れる
- 名前を書いて上書きした状態 (`stFill: "#123456"`) はその値が勝つ
- 中括弧の形・縦に並べた形・JSON の 3 つで同じ図になる
- 初期値が色番号の状態を 1 つも持たない部品 (`arc-gauge` 等、塗りを図形に直接書く) に書くと `part-color-ignored` を知らせ、塗りは変えない
- 色の名前 (`color: 成功`) は部品に効かない。 3 つの形とも `part-color-ignored` を知らせ、塗りは変えない (名前の色は描く側の配色の変数で決まり、固定の色番号を持たない)

### 2.6.2 編集画面の本文欄 (#1973)

本文欄は部品を本文から抜いて図の上に重ねる。 抜いた後の扱いは次のとおり。

| 本文 | 扱い |
|---|---|
| 部品のほかに箱がある | 部品を重ね、状態の上書きと色番号は `部品に上書きを当てる` で部品の図に当てる (組み立て側と同じ値) |
| 部品しかない | 抜くと図が空になり組み立てに落ちるため、抜かずに組み立て側で部品ごと描く |

### 2.7 backward compat = `#!parts` marker auto-convert

- editor open 時に text buffer の 1 行目 `#!parts` を検出したら auto-convert
  - JSON.parse → parts id + inline state → actors: block に変換
- warn banner 1-shot 表示: 「旧 `#!parts` 記法を actors: に変換しました。 元に戻すには Cmd+Z」
- share URL 経路 (`#s=<base64>`) の既存 buffer が壊れない
- `serializePart` export は削除、 `deserializePartLegacy` を internal adapter として残存

## 3. 実装 sub PR breakdown

### PR-A = parser 拡張 (Human YAML + LLM JSON 両側)

- `v05/parser.ts` の `parseActor` で kind が未知 (NODE_KIND_VALID に無い) → parts identifier 候補として `DslActor.partId` に格納、 残 inline field を `stateOverride` map に集約
- `json-parser.ts` の `JsonActor` に `state?: Record<string, unknown>` 追加、 kind = 未知値でも accept
- 既存 SAMPLES 12 の parse は影響なし (全 kind が既存 28 個内)

### PR-B = compile 拡張 (parts catalog injection)

- `compileToCdl(doc, opts?: { partsCatalog?: Record<string, CdlDiagram> })` に signature 拡張
- `applyV05Extensions` の後段で「DslActor.partId が set された actor」 を検出、 `partsCatalog[partId]` から diagram を取得
- `mergePartIntoDiagram(target, part, alias, stateOverride)` で以下を merge
  - lane = alias prefix、 target 側 lane id ある場合は target lane に merge
  - node = `{alias}__{origId}` id で prefix、 lane 参照も rename
  - state = `{alias}__{origId}` id で prefix + stateOverride で initial 上書き
  - phase = `{alias}__{origId}` id で prefix、 activate / tweens / sets の id 参照も rename
- `partsCatalog` 未渡し時は parts kind の actor を「未解決」 として warn、 diagram render 継続

### PR-C = editor drag-drop path 変更

- CdlEditor.tsx で drop handler = `#!parts` REPLACE ではなく `- {alias}: { kind: {partId}, {stateOverrides} }` を actors: block に append する text patch
- alias 自動生成 = parts id から `arc-gauge` → `arc1` (連番、 既 actors 衝突回避)
- lane 選択 = drop 位置に最も近い lane を自動選択 (Phase 2 は lane[0] default、 Phase 3 で drop 位置 SVG 経由推定)
- confirm dialog は保持、 「編集内容が置き換わります」 → 「actors: に arc1 (arc-gauge) を追加します」 に message 変更 (destructive → additive UX)
- CdlEditor が `loadPartsItems()` の結果を `partsCatalog` として `textDslToDiagram` に inject

### PR-D = backward compat + JSON hide

- CdlEditor open 時 useEffect で `#!parts` marker 検出 → `deserializePartLegacy(src)` で CdlDiagram を復元 → `serializeAsActorSyntax(diagram)` で actors: 記法に変換 → setSrc
- warn banner 1-shot: `sessionStorage.setItem("dragon-parts-migrated", "1")` で 1 回のみ
- `parts-serializer.ts` の `serializePart` export を削除、 内部 fallback として `deserializePartLegacy` のみ残存
- test 更新 = editor-drag-drop-full.spec.ts の marker 判定を actors syntax 判定に変更

### PR-E = full test coverage (kiwa + codex + assert lock)

- **kiwa-vitest** = parser 拡張 assert (parts kind 認識 / stateOverride 拾い / 予約語 fallback) + compile merge assert (id prefix / lane rename / state initial override / phase merge)
- **kiwa-e2e** = drag-drop で actors append 経路 (drop 前後の text 比較) + `#!parts` legacy text open で auto-convert + warn banner 表示
- **codex-review light** = 4th opinion adversarial、 CRITICAL / MAJOR findings 検出時は assert test 追加で lock
- **regression** = 既 47 e2e + 29 vitest = 76 test は全 pass 継続、 新規 assert test で 100+ に増加想定

## 4. formal grammar (parser 変更点)

### Human YAML DSL

```ebnf
actor        ::= actor_simple | actor_inline
actor_simple ::= "- " name
actor_inline ::= "- " name ": " "{ " field ("," field)* " }"
field        ::= kind_field | reserved_field | state_field
kind_field   ::= "kind: " kind_value
kind_value   ::= NODE_KIND_VALID | parts_identifier  ← 新
parts_identifier ::= identifier_matching_parts_catalog
reserved_field   ::= ("subtitle" | "eyebrow" | "value" | "rows" | "lane" | "stack" | "initial" | "final") ": " value
state_field      ::= identifier_not_in_reserved ": " (number | string)  ← 新 (parts state override 経路)
```

### LLM JSON DSL

```typescript
interface JsonActor {
  name: string;
  kind?: NodeKind | string;  // ← 拡張: parts identifier も accept
  subtitle?: string;
  // 既存 field...
  state?: Record<string, number | string>;  // ← 新: parts state override
  lane?: string;
  stack?: number;
}
```

## 5. semantic (compile 時)

### 5.1 parts merge algorithm

```typescript
function mergePartIntoDiagram(
  target: CdlDiagram,
  part: CdlDiagram,
  alias: string,
  stateOverride: Record<string, number | string>,
  laneMapping: string,  // drop target lane
): CdlDiagram {
  const prefix = (id: string) => `${alias}__${id}`;

  // lane merge: 全 parts lane を target lane 参照に mapping
  // node: id を prefix、 lane を laneMapping に張替え
  target.nodes.push(...part.nodes.map(n => ({
    ...n,
    id: prefix(n.id),
    lane: laneMapping,
  })));

  // state: id を prefix、 initial は stateOverride で上書き可
  target.states.push(...part.states.map(s => ({
    id: prefix(s.id),
    initial: stateOverride[s.id] ?? s.initial,
  })));

  // phase: id を prefix、 activate / tweens.stateId / sets.stateId も rename
  target.phases.push(...part.phases.map(p => ({
    ...p,
    id: prefix(p.id),
    activate: p.activate.map(prefix),
    tweens: p.tweens.map(t => ({ ...t, stateId: prefix(t.stateId) })),
    sets: p.sets.map(s => ({ ...s, stateId: prefix(s.stateId) })),
  })));

  // edge: parts に edge があれば同 prefix (from / to node id も rename)
  target.edges.push(...part.edges.map(e => ({
    ...e,
    id: prefix(e.id),
    from: prefix(e.from),
    to: prefix(e.to),
  })));

  // shape 内 template ({v} → {arc1__v}) の解決
  // -- parts 内部 shape.source / .angle 等 の "{state}" template を prefix 経由 rewrite
  //    (Phase 2 では node.shape の template rewrite を実装、 Phase 3 で subtitle / value にも拡張)

  return target;
}
```

### 5.2 template rewrite (state 参照)

parts の shape / subtitle / value 内の `{stateName}` template を `{alias__stateName}` に rewrite:

```typescript
function rewriteStateTemplates(node: CdlNode, alias: string, stateIds: Set<string>): CdlNode {
  const rewrite = (s: string | undefined) => s?.replace(
    /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
    (m, name) => stateIds.has(name) ? `{${alias}__${name}}` : m,
  );
  return {
    ...node,
    title: rewrite(node.title),
    subtitle: rewrite(node.subtitle),
    value: rewrite(node.value),
    shape: node.shape ? { ...node.shape, /* shape の source / angle / level / fill 等を rewrite */ } : undefined,
  };
}
```

## 6. backward compat

### 6.1 `#!parts` legacy 検出 + auto-convert

```typescript
function migrateLegacyPartsMarker(src: string): { src: string; migrated: boolean } {
  if (!isPartsMarker(src)) return { src, migrated: false };
  const part = deserializePartLegacy(src);
  if (!part) return { src, migrated: false };
  return { src: serializeAsActorSyntax(part), migrated: true };
}

function serializeAsActorSyntax(part: CdlDiagram): string {
  // parts.id (parts-arc-gauge) → alias (arc1) を推測、 state initial を inline に展開
  const alias = generateAliasFromPartId(part.id);
  const stateOverrides = part.states.reduce((acc, s) => {
    acc[s.id] = s.initial;
    return acc;
  }, {} as Record<string, unknown>);
  return `title: "${part.topic}"
type: sequence

actors:
  - ${alias}: { kind: ${stripPartsPrefix(part.id)}, ${formatStateOverrides(stateOverrides)} }
`;
}
```

### 6.2 warn banner (1-shot)

```typescript
useEffect(() => {
  const migrated = sessionStorage.getItem("dragon-parts-migrated-warned");
  if (result.migrated && !migrated) {
    showBanner("旧 #!parts 記法を actors: 統一形に変換しました。 Cmd+Z で undo 可能。");
    sessionStorage.setItem("dragon-parts-migrated-warned", "1");
  }
}, [src]);
```

## 7. test coverage

### 7.1 parser test (kiwa-vitest)

- parts kind 認識: `- arc1: { kind: arc-gauge, v: 50 }` → DslActor { name: "arc1", partId: "arc-gauge", stateOverride: { v: 50 } }
- 予約語衝突時 state: {} fallback
- 既存 kind (function) は従来通り
- LLM JSON DSL 側の同等 assert

### 7.2 compile test (kiwa-vitest)

- 単一 parts merge = node.id / state.id / phase.id 全て `arc1__` prefix
- 複数 parts merge = lane l 衝突なし
- template rewrite = `{v}` → `{arc1__v}` in subtitle / shape.source
- stateOverride 反映 = state.initial が override 値になっている
- phase parallel merge = duration は max、 activate は集合

### 7.3 e2e test (kiwa-e2e)

- editor で drag → actors: に append される (REPLACE ではない)
- 既存 content 保存確認 (drag 前の flow: block が drag 後も存在)
- `#!parts` legacy text open で auto-convert + warn banner
- confirm dialog は保持、 message 変更 (additive)

### 7.4 codex adversarial + assert lock

- CRITICAL / MAJOR fix 検出時は assert test 追加で lock (前 PR #415 と同 pattern)
- edge case: alias 衝突 / template rewrite の false positive / stateOverride の key ordering

## 8. risks + mitigations

- parts identifier list drift = parts.cdl.ts に新 parts 追加時、 parser / compile が知る経路 → catalog を CdlEditor 側で inject する設計 (parser は catalog 不要、 unknown kind を partId 候補として pass-through)
- template rewrite false positive = `{status}` が state 参照 vs 単なる text → stateIds set で厳密判定 (state.id set に含まれる key のみ rewrite)
- backward compat warn banner が邪魔 = 1-shot + Cmd+Z 経路で dismiss 可能、 sessionStorage で永続
- LLM JSON DSL が state: 記法を採用しない可能性 = JSON is naturally nested、 state: {} 明示が natural、 human と分岐を許容
- alias 生成の重複 = 既 actors: 内の name 全走査 + 連番 (`arc1` → `arc2` → `arc3`)

## 9. non-goals (Phase 3 に defer)

- 自由座標 (`at: { x, y }`) → lane/stack で不足感を感じたら別 Issue
- drag-to-move via SVG DOM → drop 位置 SVG 経由推定
- cross-parts state wire (「Part A の counter → Part B の傘」) → 高度な feature、 Phase 3 で spec 再設計

## 10. Phase 2 gate (実装着手 checklist)

- [x] spec (本 file) written
- [ ] parts identifier list の自動 discovery 経路確認 (compile 側で partsCatalog inject)
- [ ] 既存 SAMPLES 12 の backward compat = 全 pass 想定 (kind = 既存 28 個内で影響なし)
- [ ] `#!parts` legacy adapter 経路 = share URL 検出 test
- [ ] kiwa 3 layer + codex + assert test lock chain 準備
