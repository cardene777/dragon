# spec: parts as actor kind (unified writing style)

**status** = active (2026-07-17)
**issue** = CAR-1657 (parts 間接続機能 parent tracker)
**supersedes** = `docs/spec-widgets-syntax.md` (grilling 版、 `parts:` 新 keyword 案 → 却下)
**decision-log** = `~/projects/claude-memory/decisions/personal/decision-log/2026-07-17-dragon-parts-unify-with-actors-syntax.md`

## 0. 目的

parts.cdl.ts の 80 diagram (arc-gauge / wave-gauge 等) を editor で drag → 既存 diagram に「追加」 する経路を実装する。 wrong direction (JSON escape hatch で全 REPLACE) を rebuild、 dragon の既存 `actors:` pattern に統一して human が書きやすい形にする。

## 1. 前提事実

- dragon には 2 DSL が既存: **Human YAML DSL** (`v05/parser.ts`) + **LLM JSON DSL** (`json-parser.ts`)、 両 DSL は独立 parser で入口分離、 `compileToCdl` で共通の CdlDiagram AST に落ちる
- 既存 kind list は `v05/parser.ts` の `NODE_KIND_VALID` が SSOT (`NODE_KINDS` と `DSL_ONLY_KINDS` と `INFRA_KIND_ALIAS` の鍵を合わせた集合)、 数も綴りもその定義が持つ
- parts identifier list は `apps/playground-spa/src/topics/catalog/parts.cdl.ts` の export が SSOT (全て `parts-*` prefix、 内部 kind は `dyn-arc` / `dyn-wave` 等の別体系)
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
- **衝突回避** = parts identifier の `{name}` が既存 kind と重ならないことを parts 命名規約で保証、 現状衝突なし (arc-gauge / wave-gauge / dyn-* 全て distinct)

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

位置 (`posX` / `posY` / `位置:`) を書かない部品の置き場所 (#1980)。 実装は `packages/dragon/src/compile.ts` の `縦列に置く部品` / `縦列に置いた部品を揃える` が持つ。

| 部品 | 置き場所 |
|---|---|
| `lane:` に図にある縦列を書いた | その縦列の中心。 縦列の他の箱の下端から 120 空け、同じ縦列の部品は書いた順に積む |
| 登場人物ごとに縦列を作る図種 (`swimlane` / `state` / `er` / `class`) で `lane:` を書かない | 部品の名前の縦列の中心 (部品用の縦列 `名前__l` を足さない) |
| 縦列を共有する図種 (`flow` / `topology` / `c4`)、図の縦列が 1 本 | 格子 (部品用の縦列 `名前__l`) |
| 他の箱の位置の基準になる | 格子に置き、`part-lane-ignored` で知らせる |

格子は **既存の図の下端の 120 下** から並べ始める (#2002)。 実装は `packages/dragon/src/compile.ts` の
`partsBaseBottom` / `partsGridCenters` が持つ。 下端は部品を除いた図を組み立てて測った図枠の下端で、
箱の数からの概算ではない。 測るのは図枠であって箱ではない = 格子は図枠どうしを 120 空けて並べるため、
箱で測ると既存の図との間だけが部品どうしの段の間より狭くなる。

既存の箱が 1 つも無い図 (部品だけを並べる図) は、下端の代わりに 240 から並べ始める。
「箱が無い」 を下端 0 として扱うと、部品が図の上端へ貼り付く。

直す前は箱の数で概算していた (`箱 1 つ = 1 段 280`)。 `flow` の箱は実際には高さ 68 で 168 おきに
並ぶため 1 段あたり 112 ずつ余分に見積もり、誤差が箱の数に比例して積み上がっていた
(実測 = 箱 2 つの図で空き 496、箱 4 つの図で 720)。

部品が縦列より広い時は縦列を部品の幅と左右 25 まで広げる。

縦列を 2 本以上持つ部品は、要素を 2 種類の縦列に分けて入れる (#2145)。
実装は `packages/dragon/src/compile/parts.ts` の `部品の縦列を図に差し込む` が持つ。

| 部品の縦列 | 要素を入れる縦列 |
|---|---|
| 1 本目 (部品の頁で一番左) | 置いた縦列 |
| 2 本目以降 | 置いた縦列のすぐ右に、部品の縦列の順で差し込んだ縦列 (`{置いた縦列}__列2` / `__列3`、名札なし) |

差し込む縦列は座標 (`posX` / `posY`) で固定しない普通の縦列で、並びと矢印の札のための間は描画側が決める。
要素は縦列ごとに縦列の中心へ寄せ、縦は部品全体を同じだけ動かす。
同じ縦列に置いた部品どうしは、同じ番目の差し込んだ縦列を共有する。

描画側は縦列を横位置 (`x`) の小さい順に並べ、同じ横位置の縦列は書いた順に並べる。
横位置を持たない縦列は、書いた順で 1 つ前の縦列の右に置かれる。
差し込む縦列が宿主のすぐ右に並ぶよう、横位置は宿主と描く順で次にある縦列から決める (#2147)。
実装は `packages/dragon/src/compile/parts.ts` の `差し込む縦列の横位置` が持つ。

| 宿主の縦列 | 描く順で宿主の次にある縦列 | 差し込む縦列の横位置 |
|---|---|---|
| 横位置を持たない | (問わない) | 持たない = 宿主のすぐ右に並ぶ |
| 持つ (`lanes:` に `x` を書いた) | 無い | 持たない |
| 持つ | 横位置を持たず、書いた順で宿主より後ろ | 持たない = 差し込むと、その縦列ごと右へずれる |
| 持つ | 上記以外 | 宿主と次の縦列の横位置の真ん中 (同じ横位置なら宿主と同じ) |

宿主と同じ横位置にする案は採らない。
描画側が縦列の中心の間隔を一番広い組に揃えるため、`x: 0` と `x: 900` を書いた図で右の縦列の左端が 1,900 まで押し出された (真ん中なら 980)。

`lanes:` に書いた縦列を型が作っていない時は、横位置を書いた時だけ横位置を持たせる (`packages/dragon/src/compile.ts`、#2147)。
横位置 0 を入れていた頃は、登場人物の縦列の後に書いた縦列が登場人物の縦列の間に描かれた。

全ての要素を 1 本の縦列にまとめていた頃は、同じ縦列に中心の違う箱が並び、図の検査が揃いの誤りを出していた (実測 = 振り分け器を `swimlane` に置いて 5 件)。
座標で固定した縦列に分ける案は、描画側の並べる処理と札の間を広げる処理から外れ、部品どうしを繋ぐ矢印の札が縦列の境を貫いたため採らない。
編集画面は、縦列に置く部品がある本文を重ねずに組み立て側で描く (`apps/playground-spa/src/lib/overlay-dsl.ts` の `図と重ねる部品に分ける`)。

格子に置く部品と位置を書いた部品の縦列 (部品用の縦列 `名前__{部品の縦列の id}`) は、全ての部品を組み込んだ後に部品の位置へ固定する (#1990)。
実装は `packages/dragon/src/compile.ts` の `部品の縦列を部品に固定する` が持つ。
横は組み込みで決めた位置と幅のまま変えず、縦は部品全体の上に名札の分 (60) を取り、下端を部品の下端に合わせる。
部品の縦列は全て同じ高さにする = 部品の頁の絵と同じく、縦列の名札が 1 列に並ぶ。
縦列の枠は絵に出ないが図の大きさには数えられるため、下に余白を足すと部品が一番下にある図だけ図の下の空きが広がる。

| 縦列 | 名札 |
|---|---|
| 左端が最も左の縦列 (同じなら部品の縦列の順で先) | 部品が書いた名札、無ければ登場人物の名前 |
| 他の縦列 | 部品が書いた名札だけ |

描画側は `posX` と `posY` を両方持つ縦列を置いた位置に置くため、名札が部品のすぐ上に出て、部品を並べても縦列が右へ送られない。

部品の中の要素と部品の縦列は、部品の頁で配置した位置で置く (#1992)。
実装は `packages/dragon/src/compile.ts` の `部品の置き方を読む` が持ち、組み込み (`mergePartIntoDiagram`)・大きさの見積り (`partExtent`)・`大きさ:` の横の基準 (`partScaleBase`) の 3 つが同じ値を読む。

| 値 | 読む先 |
|---|---|
| 部品の縦列の左端と幅 | 部品の頁の配置 (`layout(部品)`) の縦列 |
| 要素の横位置 | 頁の配置の要素の中心。 頁の縦列全体の横の中心を部品の中心にする |
| 要素の縦位置 | 頁の配置の要素の中心。 頁の要素全体の最上と最下の中心の中点を部品の中心にする |
| 要素に書いた `posX` | 書いた値。 縦列と同じ基準で横を写す |
| 要素に書いた `posY` | 書いた値をそのまま足す (倍率を掛けない) |

部品の頁では描画側が縦列を広げて箱の間を 70 空け、段の間を箱の高さに合わせて取る。
部品が書いた縦列の位置と、段の番号に送り幅 220 を掛けた縦位置で置くと、頁で空いた分が置いた図で消える (直す前の実測 = 部品 80 種のうち 14 種が、図に置いた時だけ間隔の検査 `clearance` に掛かった)。

頁の配置が使えない部品は、部品が書いた値 (縦列の `x` / `width`、段の番号 × 220) で置き、頁の値と混ぜない。
使えないのは、配置が失敗した時 (要素の数が上限を超える / 描画側が例外を出す) と、縦列の左端・幅・要素の中心のどれかが有限の数でない時、幅が正でない時。

`大きさ:` の縦の基準は段の数 × 220 のまま変えない。
縦は書いた高さではなく段の送り幅の合計に対する倍率で掛かる規則 (#1018) で既に本文が書かれており、頁の高さに変えると `大きさ:` を書いた既存の図の縦の倍率が全て変わるため。
横の基準は頁の縦列全体の幅にする = 書いた縦列のままにすると、頁で縦列が広がる部品が `大きさ:` に書いた幅より広く描かれる。

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

### 2.6.1.1 部品が持たない状態の名前 (#1976)

- 部品に書いた未知の名前は状態の上書き (`stateOverride`) に入るが、部品の状態に同じ名前が無ければ値は効かない
- その時は `part-state-missing` を知らせ、効かない名前をまとめて 1 件に並べる。 添え書きに部品が持つ状態の一覧を出し、状態を 1 つも持たない部品ではその旨を出す
- 段 (`phase`) は部品の状態ではないが部品の段を扱う欄として効くので、知らせの対象にしない
- 箱の中の要素ごとの位置の欄 (`nodes`) を外したので、部品に `nodes` を書いた時もこの知らせになる

### 2.6.1.2 1 行の形では読まない予約名 (#1996)

- 部品の中括弧に書いた名前は状態の上書きに入るが、予約の一覧 (`ACTOR_RESERVED_FIELDS`) に載る名前は入らない
- そのうち 1 行の形で読む欄 (`INLINE_ACTOR_KEYS`) にも無い名前は、どの欄も読まず状態にも入らない。 黙って捨てると「書いたのに図が変わらない」 が手掛かりなしで起きるため「項目名が読めません」 を知らせ、段を分けた形で書くよう案内する
- 対象の名前は手で並べず、予約の一覧から 1 行で読める一覧と状態の明示欄 (`state`) を引いた差から導く (`PART_INLINE_UNREADABLE_KEYS`)。 現時点の差は `位置` / `大きさ` / `色` の 3 つ
- 段を分けた形では 3 つとも効く (`位置` は `posX` / `posY`、`大きさ` は `posW` / `posH`、`色` は部品の色の名前)
- `state` を差から外すのは `extractStateOverride` が明示欄として読むため = 予約されていても消える名前ではない

### 2.6.1.3 部品の一覧に無い名前 (#2113)

- 種類 (`kind`) に箱の種類に無い名前を書くと部品の名前とみなすため、箱の種類の綴り違い (`evnet`) もここに来る。 部品の一覧に無ければ種類を書かなかった箱として描く
- 部品を持つ一覧を渡した組み立てでは `part-not-found` を書いた行で知らせ、同じ文を `console.warn` にも出す。 実装は `packages/dragon/src/compile/parts.ts` の `部品が一覧に無いことを伝える` が持つ
- 添え書きに、箱の種類と一覧の部品の名前から綴りの近い名前を 1 つ、区分 (箱の種類 / 部品) と合わせて出す。 部品の名前は `parts-` を外した形で勧め、書いた名前の `parts-` も外して比べる。 近い名前が無い時は、箱の種類か一覧の部品の名前を書くよう案内する
- 一覧を渡さない組み立てと、部品を 1 つも持たない一覧を渡した組み立てでは知らせず、`console.warn` だけに出す。 比べる部品の名前が無く、部品を書いたのか綴りを間違えたのかを決められない。 編集画面は部品を読み込み終わる前に空の一覧を渡すため、知らせると正しい部品の名前にも注意が出る

### 2.6.2 編集画面の本文欄 (#1973)

本文欄は部品を本文から抜いて図の上に重ねる。 抜いた後の扱いは次のとおり。

| 本文 | 扱い |
|---|---|
| 部品のほかに箱がある | 部品を重ね、状態の上書きと色番号は `部品に上書きを当てる` で部品の図に当てる (組み立て側と同じ値) |
| 部品しかない | 抜くと図が空になり組み立てに落ちるため、抜かずに組み立て側で部品ごと描く |
| 部品へ矢印を引いている (#1979) | 重ねた部品は図の外の層で矢印の端にできないため、抜かずに組み立て側で部品ごと描く |
| 縦列の中に置く部品がある (#1980) | 重ねる側は部品の幅で広がった縦列の位置を知らないため、抜かずに組み立て側で部品ごと描く |

組み立て側で描いた部品にも、重ねる部品と同じく「図の中に描く部品を持たない」 の知らせ (#1017) を出す。

部品を抜いた本文を組み立てると、組み立て側が返す行番号は抜いた後の本文の行になる。
矢印の行 (#998) と知らせの行 (#2113) は、同じ表 (`lineMap`) で元の本文の行へ戻してから使う。
表に無い行は、矢印では捨て (本文を書き換える操作に使うため、誤った行を書き換えない)、知らせでは行だけを外して文を残す。

### 2.6.3 部品へ引いた矢印 (#1979)

仮の箱へ引いた矢印は、部品の図の要素 (`{名前}__{要素の id}`) へ繋ぎ直す。 実装は `packages/dragon/src/compile.ts` の `部品の要素へ繋ぐ` が持つ。

| 部品 | 矢印に書くもの | 結果 |
|---|---|---|
| 要素 1 つ | 何も足さない | その要素に繋ぐ |
| 要素 2 つ以上 | `toPartNode` / `fromPartNode` に要素の id | 名指しした要素に繋ぐ |
| 要素 2 つ以上 | 名指しなし | 矢印を外し `part-edge-dropped` で知らせる |
| 名指しした要素が無い / 部品を取り込まなかった | — | 矢印を外し `part-edge-dropped` で知らせる |

- 繋ぐのは書いた矢印だけ。 静止した `type: flow` が並び順で作る矢印のうち、どの行にも対応しない矢印は知らせずに外す
- 静止した `type: flow` は、どの行の端にも書かれていない部品を並び順の鎖に入れない (#1987)。 部品は図の下の格子に置き、前後の箱をそのまま繋ぐ。 編集画面が部品を抜いてから鎖を作る形と同じ矢印になる。 部品の一覧に無い部品は仮の箱のまま描くので鎖に残し、大きすぎて取り込まない部品は鎖から外す
- 名指しの欄を部品でない端に書いた時と、順序図 (`sequence` / `solidity`) に書いた時は `part-node-ignored` で知らせる

### 2.6.4 編集画面の YAML 欄の知らせの行 (#2117)

YAML 欄は本文を `load()` で素の値に変えてから組み立てる。 素の値は書いた場所を持たないため、この経路の知らせは全て 0 行で、画面は `L{行}` を添えられなかった (本文欄は `L5` を指す図で、YAML 欄は `L0` だった)。

- 場所ごとの行は、同じ本文を事象の並びとしてもう一度読んで集める (`apps/playground-spa/src/lib/yaml-lines.ts` の `書いた行を読む`)。 素の値からは遡れないため、読み直す側に置く
- 場所の鍵は RFC 6901 (JSON Pointer) と同じ形 (`/actors/1`)。 作る側と引く側 (`jsonToDoc`) が同じ関数 (`書いた場所の鍵`) を呼ぶ。 名前を `.` で繋ぐ形にすると、`values` の `a.b` という名前と `values.a` の中の `b` という欄が同じ鍵になる
- 行を載せるのは表を渡した呼出だけ。 LLM が作った JSON を直に渡す経路は今までどおり全て 0 行 = 「行が分からない」 ことを 0 で表す
- 別名の取り込み (`<<: *ref`) と、鍵が入れ子になった形 (`? [a, b]`) の下は場所を作らない。 素の値の名前と繋げられないため、その欄だけ 0 行に戻る
- 行を持つと、同じ行に知らせを 2 件並べない判定 (#2111) が矢印ごとに効く。 行を持たない文書では全ての矢印が 0 行で、図種の組み立てが 1 件知らせるとその文書の多重度の知らせが出なかった

### 2.6.5 宿主の段が部品の中の値を動かす (#2125)

部品の中の値は `{部品の名前}__{値の名前}` で図に入る (§ 2.5)。 宿主の段の `tween` / `set` に
その名前を書くと、部品の中の値が宿主の段で動く。 部品の段と繋ぎ方を組み合わせると、
繋いだ先へ値が渡っていく形を 1 枚で書ける。

- **部品の名前は英字で書く**。 値の名前は `VALUE_NAME_RE` (`packages/dragon/src/value-syntax.ts`)
  が英字と `_` だけを受けるため、日本語の名前を付けた部品は矢印で繋げても
  `在庫__lv` を段に書けない (記法の読み取りが「使えない値の名前」 で弾く)。
  繋ぐだけで中の値を動かさない箱は日本語のままでよい
- **動かす部品には `phase: false` を書く**。 既定では部品の段が宿主の段と並行合成されるため、
  同じ値を部品の段と宿主の段の両方が動かす形になる (§ 2.6)
- JSON も箱の欄として `"phase": false` を書く。 欄で受けた値は状態の上書きの `phase` へ
  入れ直すので、`"state": { "phase": false }` と書いた形と同じ図になる。 普通の箱に書くと
  誤りとして返す (`state` / `scale` と同じ向き、§ 2.3)
- **段の `focus` に部品の名前を書くと、部品の要素と部品の中の線が光る** (#2150)。
  組み立ては部品の名前を仮の箱に解決し、部品を取り込む時に仮の箱を光らせる相手から外すため、
  取り込んだ後に書いた `focus` を読み直して `{部品の名前}__{要素}` と `{部品の名前}__{線}` を足す
  (`packages/dragon/src/compile/parts.ts` の `部品の名前で光らせる`)。 図種で仮の箱の id の形が
  違うので、仮の箱を置き換える形にはしない。 書いた段と組み立てた段は題で先頭から突き合わせる。
  部品の名前は slug の形 (`split-box`) でも引き、他の名前と slug が重なる時は引かない
- **段の `focus` に `{部品の名前}__{要素}` か `{部品の名前}__{中の線}` を書くと、その 1 つだけが光る** (#2151)。
  書き方は宿主の段で部品の中の値を動かす書き方 (`split__inLv`) と、矢印で要素を名指しする
  `fromPartNode: outA` の要素の名前に揃える。 名前の前半は、取り込んだ部品の名前のうち一番長く一致するもので
  決める (`印` と `印__2` の 2 部品で `印__2__inP` を `印` の要素 `2__inP` と読まない)。
  登場人物の名前と完全に一致する名前は、箱の名前として読む
- 部品に無い名前 (`split__nope`) は `focus-target-missing` で知らせ、案内に部品の要素と中の線の名前を
  8 件まで並べる。 知らせるのは部品を取り込んだ後の 1 か所だけ = 組み立ての入口
  (`reportMissingFocusTargets`) は部品の一覧を持たないため、前半が部品の名前なら中身を確かめずに通す。
  部品でない登場人物の名前に `__` を続けた名前 (`受付__x`) は、入口で今までどおり知らせる。
  部品を取り込まなかった時 (一覧に無い / 大きすぎる) は名指しも光らず、部品を取り込まなかった知らせが出る
- 見本は `apps/playground-spa/src/topics/catalog/parts-motion.cdl.ts`。
  中身の性質は `apps/playground-spa/src/lib/parts-motion-content.test.ts` が数え、段で部品が光ることは
  `packages/dragon/test/part-focus.test.ts` が数える
- 繋ぎ方の部品どうし (振り分け器の出口 A / B → 合流点の入口 A / B) を繋ぐ見本は「振り分けて合流させる」 (#2149)。
  矢印の両端を `fromPartNode` / `toPartNode` で名指しし、段では入口だけ・出口と入口だけを要素の名前で光らせる。
  繋いで使う部品の中の線の札は数字にしない = 振り分け器が 7 割を送った先で合流点が 6 割と書く食い違いが出るため、
  割合は箱の上の読み取りに任せる (中の線の札に数字が無いことを内容の検査が数える)

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
