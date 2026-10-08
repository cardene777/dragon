# @cardenelabs/dragon

Dragon は [@cardenelabs/cdl](https://www.npmjs.com/package/@cardenelabs/cdl) engine の上に乗る、 Mermaid 感覚の Text DSL。
箇条書きで書ける宣言的 syntax から animated SVG diagram を生成する。

## Why Dragon

Mermaid は静的、 cdl 直書きは TypeScript builder が必要。
Dragon は両者の中間 ... Mermaid に似た短文 syntax で書きつつ、 cdl の animation engine 上で動く。

- Mermaid 風 syntax (1 行 = 1 step、 `A -> B` 矢印、 box-drawing 不要)
- Mermaid にない animation (state tween / phase highlight / badge)
- 出力は cdl の `CdlDiagram`、 そのまま `CdlDiagramView` 等に渡せる
- engine 部 (layout / render / animation) は cdl に委譲、 dragon は parser + compiler に専念

## Quickstart

```bash
npm install @cardenelabs/dragon @cardenelabs/cdl
```

```ts
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const diagram = textDslToDiagram(`
title: "送金フロー"
type: sequence

actors:
  - Alice
  - Vault: storage
  - Bob

flow:
  - Alice -> Vault: "deposit"
  - Vault -> Bob: "send" (success)
`);

// React で render
<CdlDiagramView diagram={diagram} />
```

## 記法に書ける欄

**この節の一覧は検査が実装と突き合わせる** (`test/readme-notation-keys.test.ts`)。
実装に欄が増えてここを直さないと落ちる。

### 最上位のブロック

<!-- notation:top-level:start -->

| 欄          | 何を書くか                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`     | 図の題                                                                                                                                     |
| `type`      | 図種 (`sequence` / `flow` / `flowchart` / `swimlane` / `record` / `topology` / `gantt` / `mind` / `tree` / `c4` / `chart` / その他)。 古い綴りは組に読み替える = `solidity` は `sequence` と `order: 種類`、数を描く 9 つ (`pie` 等) は `chart` と同じ綴りの `shape` |
| `actors`    | 箱                                                                                                                                         |
| `flow`      | 矢印                                                                                                                                       |
| `states`    | 状態の初期値                                                                                                                               |
| `values`    | 他の状態から決まる値 (式)                                                                                                                  |
| `animation` | 段                                                                                                                                         |
| `viewport`  | 図全体の大きさと間隔                                                                                                                       |
| `lanes`     | 縦列の見出しと幅                                                                                                                           |
| `groups`    | 縦列を束ねる枠                                                                                                                             |
| `eyebrow`   | 図全体を 1 箱にする図種で、その箱の上に出す小見出し                                                                                        |
| `axes`      | 2 軸で仕分ける図の軸の名前                                                                                                                 |
| `regions`   | 2 軸で仕分ける図の区画に出す名前                                                                                                          |
| `readouts`  | 値を見せる部品 (割合の輪 / 数え上げ / 目盛り)                                                                                              |
| `inputs`    | 読む人が動かすつまみ (すべり / 選び / 入り切り など。 書ける種類は、知らない種類を書いた時の知らせが `使える種類 = ...` の形で全て並べる。 選択肢を `{ value, label }` の組で、入り切りを `onLabel` / `offLabel` で書くと、値は綴りのまま名前で描く) |
| `formulas`  | つまみの値から決まる値 (式。 `values` は段が動かす状態を読み、こちらはつまみを読む。 `{ expression, label }` の組で書くと操作部に名札を出す) |
| `events`    | 押下などの出来事で動く仕掛け (相手は名前で指す)                                                                                            |
| `scrolls`   | 巻き上げに応じて進む値 (画面を巻き上げた量から 0 から 1 を作る)                                                                            |
| `bands`     | 動いている間の帯 (順序図。 `- DB: 1..2` の形で言づての番号の区間を書く。 0 から数える)                                                                        |
| `reveal`    | 矢印をいつ出すか (`phase` = 段が名指しする矢印はその段まで描かない (既定) / `all` = 最初から全部描く)                                      |
| `relations` | 触れた箱の関係を光らせるか (`off` = 何もしない (既定) / `hover` = 触れた箱と繋がる線と相手の箱だけが光る)                     |
| `direction` | 図の並ぶ向き (`縦` / `横`、英語なら `vertical` / `horizontal`)。 効くのは `flow` と `swimlane` だけ |
| `order`     | 箱を並べ替える軸 (`種類`、英語なら `kind`)。 効くのは `sequence` だけで、書くと `kind:` の順 (人 → 契約 → 保管 → 出来事) に箱が並ぶ |
| `shape`     | 図種ごとの形。`chart` は `pie` / `bar` / `line` / `gauge` / `radial` / `stat` / `waffle` / `stacked` / `slope` (書かなければ `bar`)、`swimlane` は `stages` / `metro` / `timeline` |
| `form`      | `shape: pie` の見せ方 (`ring` / `arcs` / `table`、和名は `輪` / `積層の弧` / `銘板`)。 `見せ方:` とも書ける |
| `ticks`     | `type: gantt` の目盛りを左から順に並べる (`目盛り:` とも書ける)。 書かなければ工程の始まりから作る |
| `theme`     | 図の意匠 (`kinari` = 生成りに茶 / `celadon` = 青磁に墨 / `blueprint` = 図面 / `letterpress` = 活版 / `catalog` = 図録 / `terminal` = 端末 / `sketch` = 手描き / `neon` = 電飾 / `relief` = 浮彫、日本語なら `生成り` / `青磁` / `図面` / `活版` / `図録` / `端末` / `手描き` / `電飾` / `浮彫`)。 `palette:` も別名として読み、両方書くと `theme:` が勝って知らせが出る |
| `legend`    | 図の下へ置く凡例。 `凡例:` とも書ける。 1 項目は `{ mark, text }`、和名なら `{ 印, 説明 }`。 印の 10 種は下の節を参照 |
| `legendFontSize` | 凡例の字の大きさ |
| `stageHeaders` | `shape: stages` の見出し寸法を意匠名ごとに書く (`leftPad` / `topPad` / `numberSize` / `gap` / `nameSize` / `bottomPad`) |

<!-- notation:top-level:end -->

### 円の見せ方、四象限の座標、ガントの細かな位置

円は `form: table` (`見せ方: 銘板`) で名前と値の表、`arcs` で積層した弧、`ring` で輪になる。
書かなければ従来どおり輪で、円以外に書いた欄と読めない値は知らせて無視する。

四象限の箱には `at: [0.2, 0.8]` (`点の位置`) の形で x、y の順に座標を書ける。左下が
`[0, 0]`、右上が `[1, 1]` で、数の代わりに `"{状態名}"` も書ける。0..1 の範囲外は知らせ、
CDL の描画時に最寄りの端へ寄せる。区画の語と併記した時は座標を採り、象限が食い違えば知らせる。

ガントは `ticks: [6月, 7月, 8月, 9月, 10月]` で尺と目盛り順を固定する。始まりと終わりは
`"6月+0.55"` のように月内の割合 (0..1) を足せる。始まりの割合を省けば月初、`end` の割合を
省けば月末である。CDL は 1 目盛り未満の帯を描けないため、変換後の終わりが始まりより前になる
指定は知らせて 1 目盛りの幅へ倒す。工程が指さない目盛りの字は、CDL に独立した目盛り名の欄が
無いため空になる。

### 図の下に凡例を書く

`legend:` の下へ、印と説明を中括弧で 1 項目ずつ書く。全ての図種で、図の下に指定順の横一列で描かれる。`legend:` を書かない図の配置と出力は変わらない。

```yaml
legend:
  - { mark: diamond, text: "分かれ道" }
  - { mark: filled-circle, text: "始まり" }
```

最上位の語、項目名、印はいずれも和名で書ける。英語と和名を同じ項目に併記した時は英語を使う。

```yaml
凡例:
  - { 印: 菱形, 説明: "分かれ道" }
  - { 印: 塗った丸, 説明: "始まり" }
```

| `mark` | `印` |
| --- | --- |
| `diamond` | 菱形 |
| `filled-circle` | 塗った丸 |
| `double-circle` | 二重丸 |
| `dotted-line` | 点線 |
| `solid-line` | 実線 |
| `curved-line` | 曲線 |
| `rounded-label` | 角丸の札 |
| `numbered-circle` | 番号の丸 |
| `station` | 駅 |
| `arrow` | 矢印 |

### 箱に書ける欄

`- 名前: { 欄: 値, ... }` の形で書く。

<!-- notation:actor:start -->

| 欄              | 何を書くか                                                                     |
| --------------- | ------------------------------------------------------------------------------ |
| `kind`          | 見た目の種別 (`card` / `storage` / `service` / `person` 等、`種類` とも書ける)。 種別に無い名前は部品の名前として部品の一覧 (`partsCatalog`) から引き、一覧にも無ければ種別を書かなかった箱になる。 部品を持つ一覧を渡した時は、書いた行に知らせ (`onNotice`) が出て綴りの近い名前を案内する |
| `subtitle`      | 題の下の補足 (`補足` とも書ける)                                               |
| `stationNamePosition` | 路線図の駅名を下へ置く (`bottom`) |
| `subtitlePlacement` | 時間軸の担当を札の右へ置く (`right`) |
| `titleFontSize` | 流れ図の `function` の札の題の大きさ |
| `markGap` | 流れ図の始まり・終わりの印と次の箱との間 |
| `eyebrow`       | 題の上の小見出し                                                               |
| `value`         | 箱に出す値 (`値` とも書ける)                                                   |
| `previous`      | 前の時点の値 (`前の値` とも書ける)。 `type: stacked` が 2 本目の帯として描く   |
| `rows`          | 箱の中に並べる行 (`行` とも書ける)                                             |
| `marks`         | 行頭の印 (`印` とも書ける。 `rows` と同じ並び。 ER は `pk` / `fk` / `opt`、状態は `entry` / `exit` / `do` / `internal`) |
| `stage`         | `shape: stages` の泳法図で箱を入れる段階 (`段階` とも書ける)                  |
| `lane`          | どの縦列に置くか                                                               |
| `stack`         | 縦列の中の何段目に置くか                                                       |
| `initial`       | 状態遷移図で始まりの状態か                                                     |
| `final`         | 状態遷移図で終わりの状態か                                                     |
| `tone`          | 色                                                                             |
| `color`         | 色 (`tone` と同じ意味。 両方書いた時は `tone` を採る)                          |
| `touchpoint`    | ユーザージャーニーで、利用者が触れる場所                                               |
| `opportunity`   | ユーザージャーニーで、改善の余地                                                       |
| `owner`         | 工程の並びで、担当                                                             |
| `end`           | 工程の並びで、終わりの位置。 始まりより前の時期は始まりと同じに倒し、知らせ (`onNotice`) が出る |
| `at`            | 四象限の点の座標 `[x, y]` (`点の位置` とも書ける)。 左下が 0,0、右上が 1,1 |
| `posX`          | 置く場所の横位置                                                               |
| `posY`          | 置く場所の縦位置                                                               |
| `posW`          | 箱の幅                                                                         |
| `posH`          | 箱の高さ                                                                       |
| `offsetX`       | 自動で決まった位置から横へずらす量 (JSON の `pos.x`。 `posX` は座標で、こちらはずらし) |
| `offsetY`       | 自動で決まった位置から縦へずらす量 (JSON の `pos.y`。 片方だけ書くと残りは 0)  |
| `scale`         | 見本 (parts) の倍率 (`倍率` とも書ける)                                        |
| `shape`         | 箱の中に描く図形 (水位 / 角度 / 半径を状態で動かす、`図形` とも書ける)         |
| `visibleIf`     | その箱を出すかどうかの条件 (`出す条件` とも書ける)                             |
| `title`         | 箱に出す題。 書かなければ名前がそのまま題になる (`題` とも書ける)              |
| `wBind`         | 箱の幅を値に追随させる (状態の名前を `{名前}` の形で書く)                      |
| `hBind`         | 箱の高さを値に追随させる (`wBind` と同じ読み方)                                |
| `opacity`       | 箱の濃さ (0 から 1 の数か、状態の名前)                                         |
| `renderOffsetX` | 描く時だけ箱を横へずらす量 (配置と矢印はずらす前の位置を使う)                  |
| `renderOffsetY` | 描く時だけ箱を縦へずらす量 (`renderOffsetX` と同じ読み方)                      |

<!-- notation:actor:end -->

### 矢印に書ける欄

`- A -> B: "説明" (色, 線種) { 欄: 値, ... }` の形で書く。

<!-- notation:flow:start -->

| 欄               | 何を書くか                                                          |
| ---------------- | ------------------------------------------------------------------- |
| `sub`            | 説明の下の補足。`relation` と一緒に書いた record では行き先の端の多重度 |
| `tailSub`        | 出どころ側の端に添える字 (`1` 等)。`relation` と一緒なら UML 関係の多重度 |
| `guard`          | 状態遷移の条件                                                      |
| `cardinality`    | ER 図の関係の多重度 (`1:1` / `1:N` / `N:1` / `N:M` / `0..1` / `1..*`)。 両端の形が語から決まり (`tailHead` / `head` を書けばそちらが勝つ)、語は説明の下の行に出る。 6 語以外の語と、ER 図以外に書いた多重度は端の形にならず、知らせ (`onNotice`) が出る |
| `widthBind`      | 線の太さを値に追随させる (状態やつまみの名前を `{名前}` の形で書く) |
| `strokeBind`     | 線の色を値に追随させる (`widthBind` と同じ読み方)                   |
| `dashOffsetBind` | 破線の位置を値に追随させる (流れているように見せる)                 |
| `side`           | 矢印がどの辺から出るか (`top` / `right` / `bottom` / `left`)        |
| `fromSide`       | 矢印が出どころのどの辺から出るか (`top` / `right` / `bottom` / `left`) |
| `toSide`         | 矢印が行き先のどの辺へ入るか (`top` / `right` / `bottom` / `left`) |
| `head`           | 矢印の先の形 (`triangle` 継承・実装 / `diamond` 集約・コンポジション / `open` 関連・依存 / `crow` 多 / `one` `zero-one` `many` `zero-many` ER の端 / `none` 描かない) |
| `tailHead`       | 出どころ側の端の形 (ER は端ごとに違う個数を示すので両端に要る) |
| `headFill`       | 端の印の塗り (`solid` 塗る / `hollow` 白抜き) |
| `tailHeadFill`   | 出どころ側の印の塗り |
| `relation`       | record に書く UML 関係の種類 (`extends` 継承 / `implements` 実装 / `aggregates` 集約 / `composes` コンポジション / `associates` 関連 / `uses` 依存)。 書くと線と端の形と塗りと付く側がまとめて決まる |
| `kind`           | 順序図の言づての種類 (`call` 呼ぶ / `return` 返す / `fire` 投げる) |
| `role`           | 辺の役目 (`main` 主となる道)。 書いた辺だけ「いま」 の色で引く。 主となる 1 本 (または 1 続き) にだけ書く |
| `labelPlate`     | 説明文の下地を敷くか (`false` で外す)。 丸い下地は箱と同じ形なので、罫の細い図では名前が小さな箱に見える |
| `labelOffsetX`   | 説明文の位置を横にずらす                                            |
| `labelOffsetY`   | 説明文の位置を縦にずらす                                            |
| `overlay`        | `true` で説明文を線の上に重ねる (分岐図の条件ラベル用)              |
| `fromPartNode`   | 出どころが部品 (kind に部品の名前を書いた箱) の時、矢印を繋ぐ部品の中の要素の id。 要素を 1 つだけ持つ部品は書かなくてもその要素に繋がり、2 つ以上持つ部品は書かないと矢印を外して知らせる |
| `toPartNode`     | 行き先が部品の時、矢印を繋ぐ部品の中の要素の id (`fromPartNode` と同じ読み方) |

<!-- notation:flow:end -->

## 記法の癖

### 分かれ道の図の形

`type: flowchart` は、既定の横向きでは普通の手順を小見出しの無い札、`decision` を菱形、
題を書かない `mark-start` / `mark-end` を塗った丸 / 二重丸で描く。印に `title:` を書いた時は、
開始・終了の小見出しを持つ札のままにする。`loop` も「繰り返し」の小見出しを持つ札のままにする。
`database` など、そのほかに種類を明記した箱は、横向きでも書いた種類の見た目を保つ。
`direction: 縦` では、担当と種類を札の小見出しへまとめる従来の描き方を保つ。

### 箱の `lane:` が効く図種は限られる

`type: swimlane` と `shape: stages` を組み合わせると、`stage:` (`段階:`) ごとに同じ上端と
高さの列を左から並べ、列の見出しに「段階 N」と段階の名前を出す。箱は列の中へ書いた順に積む札
(`card`) になり、書いた `kind` は効かない (知らせが 1 件出る)。この形では `lane:` は縦列ではなく
担当を表し、札の右に小さな字で出る。`lanes:` に同じ id の `label` があれば、その名前を使う。

列の中の札は真下の線で結び、右の列へ進む線は列の間を曲線で渡る。札は左の列から入る線が
真横に通る段から積み始める。左の列や同じ列の上の札へ戻る線は、列の見出しより上を回る。

```yaml
type: swimlane
shape: stages

actors:
  - 受付: { stage: 申請, lane: front }
  - 確認: { 段階: 審査, lane: review }
```

`shape: metro` は担当 (`lane`) ごとに横の線路を 1 本作り、箱を駅として左から並べる。
`lanes:` の `label` は担当の名札の名前、`subtitle` はその下の補足になり、名札から線路の右端まで
一点鎖線の案内線を引く。
担当が替わる線は、横線と 45 度の斜線をつないだ乗り換え線になる。

```yaml
type: swimlane
shape: metro

lanes:
  shipper: { label: 荷主, subtitle: 頼む人 }
  courier: { label: 配送便, subtitle: 運ぶ }

actors:
  - 始まり: { kind: mark-start, lane: shipper }
  - 集荷を頼む: { lane: shipper }
  - 在宅?: { kind: decision, lane: courier }
  - 受け取る: { lane: shipper }
  - 持ち戻る: { lane: courier }
  - 終わり: { kind: mark-end, lane: shipper }

flow:
  - 始まり -> 集荷を頼む
  - 集荷を頼む -> 在宅?
  - 在宅? -> 受け取る: "はい"
  - 在宅? -> 持ち戻る: "いいえ"
  - 持ち戻る -> 集荷を頼む: "翌日もう一度" (dashed)
  - 受け取る -> 終わり
```

担当を書かない箱は、その箱の名前を線路名に使い、図全体で 1 件知らせる。
分かれ道から出る 1 本目は「はい」の色、2 本目以降は「いいえ」の色になり、後ろへ続く線と駅も
同じ色を引き継ぐ。
同じ担当へ向かう 2 本目以降の枝の駅は分かれ道の真下へ下ろし、横の線路上の駅としては数えない。
本線と「はい」「いいえ」の実線には矢じりを付けない。
前の駅へ戻る `(dashed)` の線は点線になり、戻り先の駅の下へ入る矢印を付ける。

`animation` がある路線図でも全ての線を描く。
初めて `focus` される段がまだ来ていない線には `data-cdl-pending="true"` が付き、画面側でまだの区間を
薄く見せられる。

`shape: timeline` は普通の段へ 1 から番号を振り、丸い番号を実線の縦軸上へ置く。
札は `card` で固定し、札を持つ段の上から順に軸の左右へ交互に並べる。
`lane` の名前は札の右端へ担当として添え、札から同じ段の番号へ点線の補助線を引く。

```yaml
type: swimlane
shape: timeline

lanes:
  front: { label: 窓口 }
  review: { label: 審査係 }

actors:
  - 受付: { lane: front }
  - 審査: { lane: review }
  - 修正: { lane: front }

flow:
  - 受付 -> 審査
  - 審査 -> 修正
  - 修正 -> 審査
```

`decision` からだけ入る普通の段のうち、`decision` の直後に書かれていない段は分かれ道の脇へ置く。
脇の札は番号と補助線を持たず、分かれ道と同じ高さで担当を名前の下へ中央揃えで置く。
脇の札は、軸から札の内側までを見本の 220 以上とする。
戻る線を持つ脇の札は、軸から札の内側まで 220 空ける。
普通の段の間は見本どおり 125 とする。
次の段へ進む線は番号か軸上の印どうしを結び、終わりへ入る線を除いて矢頭を付けない。
線に書いた色と種類は軸上でも保ち、分かれ道から色付きの線で入る番号はその線と同じ色を持つ。
字のある線には `overlay: true` を渡し、描く側が線上に置ける札は線へ重ねる。
固定 7 意匠では線の札を success / error の線色で塗り、高さ 40・字 21 の太字にする。角は通常 9、端末 4、浮彫 20 とする。
電飾の分かれ道は面 `#09070f`、水色 `#00e5ff` の 3 の縁と同色の光で描く。
軸と「はい」と戻る線は 6、「いいえ」は 5、補助線は 2、番号の縁は 4、終わりの外輪は 3.5 とする。
前の段へ戻る線は札どうしを `back-detour` で結び、それ以外の分かれ道は札か軸上の印を結ぶ。
戻る線は太さ 6、丸い線端、`0 9.6` の細かな点の並びで描く。
2 段以上前へ戻る線は、道筋が途中の札や番号と交わる時だけ、それらを避けた一番近い外側の列を回る。
交わらない線の道筋は変えず、外側を回る線の札は横の区間の中点に置く。

戻る線には `fromSide` / `toSide` を書ける。時間軸は右から右、段の箱は右から上へ結ぶ。
`leaderTo` の無い脇の札は `subtitlePlacement: right` で担当を右へ置ける。

### 段の箱・路線図・時間軸に分かれ道と始まりと終わりを書く

泳法図の3形では、箱の `kind` に `decision` / `mark-start` / `mark-end` を書ける。
同じ印でも、形に応じて次のように描く。

| 形 | `decision` | `mark-start` | `mark-end` |
|---|---|---|---|
| `shape: stages` | 札の右へ「分かれ道」を添える | 描かない | 描かない |
| `shape: metro` | 線路上の分かれ道 | 線路の始まり | 線路の終わり |
| `shape: timeline` | 軸上の分かれ道 | 描かない | 軸上の終わり |

描かない印の前後に線がある時は、前の段と後ろの段を直接結ぶ。
始まりから出る線だけ、または終わりへ入る線だけのように片側しかない線は図から外す。

```yaml
title: 荷物を届ける
type: swimlane
shape: timeline

actors:
  - 始まり: { kind: mark-start, lane: 荷主 }
  - 配達に出る: { lane: 配送便 }
  - 在宅?: { kind: decision, lane: 配送便 }
  - 受け取る: { lane: 荷主 }
  - 持ち戻る: { lane: 配送便 }
  - 終わり: { kind: mark-end, lane: 荷主 }

flow:
  - 始まり -> 配達に出る
  - 配達に出る -> 在宅?
  - 在宅? -> 受け取る: "はい" (success)
  - 在宅? -> 持ち戻る: "いいえ" (error)
  - 持ち戻る -> 配達に出る: "翌日もう一度" (error, dashed)
  - 受け取る -> 終わり
```

分かれ道から進む線には「はい」「いいえ」のような答えを書く。
前の段へ戻る線は、説明の後ろへ `(dashed)` を添えると破線になる。

縦列を並べるために使う図種 (`flow` / `topology` / `swimlane`) では効く。 縦列が骨格その
ものになる図種 (`sequence` は縦列がそのまま時間軸の線) では効かず、知らせが出る。

効く図種でも **全ての箱に書いた時だけ** 効く。 一部だけ書くと、書かなかった箱をどこに
置くか決められないため知らせが出る。

```yaml
type: flow

lanes:
  left: { width: 320 }
  right: { width: 320 }

actors:
  - A: { kind: card, lane: left }
  - B: { kind: card, lane: right }
```

`lanes:` の id は組み立て側が作る形に合わせて、字 / 数 / 下線 / hyphen を受ける
(`lane-idle` のような自動で作られた縦列の幅も書き直せる)。

`groups:` は並べた縦列のうち何本かを 1 つの枠で囲む。 枠は縦列の位置が決まった後に、束ねた縦列と
中の箱を全て含む位置と大きさで描かれ、縦列と箱の位置は組を書かない図と変わらない。

```yaml
lanes:
  web: { label: "受付の層" }
  app: { label: "処理の層" }
  db: { label: "保存の層" }

groups:
  inside: { label: "社内の網", lanes: [app, db] }
```

図に無い縦列は除いて囲み、1 本も無ければ枠を描かない。 束ねる縦列の間に束ねない縦列を挟むと、
その縦列ごと囲む。 どちらも知らせが出る。

### 静止した `type: flow` は書いた矢印の端を使わない

この図種は **登場人物を書いた順に鎖状に繋ぐ**。 矢印の説明文は「その箱を to に持つ行」
から拾い、書いた側の端は使わない。

```yaml
type: flow

actors: [A, B, C]

flow:
  - A -> C: "x" # 出来るのは A -> B
  - C -> B: "y" # 出来るのは B -> C
```

書いた端どおりに繋ぎたい時は `direction: 縦` を書くか、箱に `lane:` を書く。 向きか縦列を書いた形は
別の組み立てを通り、書いた端がそのまま矢印になる。 `direction: 縦` は並びも鎖の時と変わらない。
段 (`animation`) を書いた形も同じく書いた端を使う。 端が使われなかった行には知らせが出る。

部品 (`kind` に部品の名前を書いた箱) は、どの行の端にも書かれていなければ鎖に入らない。
部品は図の下に並び、`受付 / 部品 / 出荷` と書いても `受付 -> 出荷` が繋がる。

図の下に並ぶ部品と位置を書いた部品は、部品のすぐ上に登場人物の名前の名札を 1 つ出す
(`flow` / `sequence` / `topology` / `c4`)。 部品の中に縦列を 2 本以上持つ部品でも名札は 1 つで、
部品が自分の縦列に書いた名札はそのまま残る。 部品をいくつ並べても、縦列が右へ送られて図が横に伸びることはない。

部品の中の要素は、部品の頁と同じ間で並ぶ。 頁で空けた箱の間と段の間が図に置いても詰まらないので、
部品の中の要素どうしが間隔の検査に掛からない。 頁の配置が使えない部品だけは、部品に書いた縦列の位置と
段の番号で置く。

### 段の `focus:` で部品の全体か中の 1 つを光らせる

段の `focus:` に部品の名前を書くと、部品の要素と部品の中の線が全て光る。
中の 1 つだけを光らせる時は `{部品の名前}__{要素の id}` か `{部品の名前}__{中の線の id}` を書く。
要素の id は矢印の `fromPartNode` / `toPartNode` に書く id と同じ。

```yaml
title: "注文を 2 つの窓口へ分ける"
type: swimlane

actors:
  - 受注: { kind: card }
  - split: { kind: split-router, phase: false }

flow:
  - 受注 -> split: "注文" { toPartNode: inP }

animation:
  - step: "注文が入る" 1.2s
    focus: [split__inP]
  - step: "A へ渡す" 1.2s
    focus: [split__outA, split__sr-a]
  - step: "まとめて見せる" 1.2s
    focus: [split]
```

| 段 | 光る所 |
|---|---|
| 注文が入る | 振り分け器の入口 (`inP`) だけ |
| A へ渡す | 出口 A (`outA`) と、入口から出口 A への中の線 (`sr-a`) |
| まとめて見せる | 振り分け器の要素と中の線の全て |

部品に無い名前を書くと何も光らず、知らせ (`focus-target-missing`) が部品の要素と中の線の名前を案内する。
部品の名前そのものが `__` を含む時は、一番長く一致する部品の名前で読む。

### 順序図の段は `focus:` で強調する言づてを選ぶ

`sequence` の図は 1 枚の板に言づてを行で並べる。 段ごとに 1 通を強調し、それより前は
描き済みとして残し、後ろは隠す。 どの言づてを強調するかは段の `focus:` から決まる。

| `focus:` に書いたもの | 合う言づて |
|---|---|
| 矢印 `A -> B` | 元が A で先が B |
| 箱の名前 2 つ以上 | 元と先の両方が書いた箱に含まれる |
| 箱の名前 1 つ | 元か先がその箱 |

矢印を 1 本でも書いた段は、矢印だけで言づてを選ぶ。 同じ段の箱の名前は数えない。

言づては先頭から段の数に切り分け、各段が続きの言づてを受け持つ。 切り分けは次の順に良いものを選ぶ。

1. 合う言づてを持つ段が多い (どの段も板を進める)
2. 段に合う言づての数が多い
3. 2 つの段に合う言づてを、図全体で合う言づてが少ない段 (狭く指した段) に置く

段はその区間で合う最後の言づてを強調する。 合う言づてが無い段は前の段の強調を保つ。

```yaml
flow:
  - 利用者 -> 認証窓口: "POST 認証情報"
  - 認証窓口 -> DB: "照合"
  - 認証窓口 -> 利用者: "JWT を発行"

animation:
  - step: "照合" 1.5s
    focus: [利用者, 認証窓口, DB]   # 1-2 通目を束ね、「照合」 を強調する
  - step: "発行" 1.0s
    focus: [認証窓口, 利用者]       # 3 通目を強調する
```

段の題と強調する言づてを確実に揃えたい時は、矢印で書く。 同じ 2 者の矢印が続く時は、同じ矢印を段の数だけ
並べれば 1 通ずつ進む。

## API

**Text DSL (人向け YAML)**

- `textDslToDiagram(src: string): CdlDiagram` ... 一発変換 (v0.4 / v0.5 auto-detect、 recommended entry)
- `parseTextDslV05(src: string): V05ParseResult` ... v0.5 parser を直接呼出 (error 詳細取得)
- `compileToCdl(doc: DslDocument): CdlDiagram` ... AST → CdlDiagram

**JSON DSL (LLM 向け)**

- `jsonToDiagram(json: unknown, opts?): CdlDiagram` ... JSON DSL → CdlDiagram、 validation error は throw。 `opts` は部品の一覧 (`partsCatalog`)、 書いた通りにならなかったことの受け取り口 (`onNotice`)、 書いた場所から行を引く表 (`行の表`) の 3 つ
- `書いた場所の鍵(...道): string` ... `行の表` の鍵を作る (`書いた場所の鍵("actors", 1)` が `/actors/1`)。 本文の行が分かる入口 (編集画面の YAML 欄) が表を作る時に使い、`jsonToDiagram` が同じ関数で引く
- `validateDragonJson(json: unknown): { ok, data | errors }` ... compile なしで validation のみ
- `diagramJsonSchema` ... JSON Schema (Draft 7)、 LLM の tool schema にそのまま注入可能

**Deprecated (2026-12-31 削除予定)**

- `parseTextDsl(src: string): ParseResult` ... v0.4 parser、 `textDslToDiagram` に移行推奨

## LLM 向け JSON DSL

LLM (Anthropic Claude / OpenAI GPT) が structured output で確実に diagram を生成できるよう、 YAML DSL と 1:1 対応する JSON 記法を提供する。

### 最小 example

```ts
import { jsonToDiagram } from "@cardenelabs/dragon";
import { CdlDiagramView } from "@cardenelabs/cdl/react";

const diagram = jsonToDiagram({
  title: "ログインAPI",
  type: "sequence",
  actors: ["ユーザー", "API", "DB"],
  flow: [
    { from: "ユーザー", to: "API", label: "ログイン要求" },
    { from: "API", to: "DB", label: "ユーザー検索" },
    { from: "DB", to: "API", label: "結果", tone: "success" },
    { from: "API", to: "ユーザー", label: "認証成功", tone: "success" },
  ],
  animation: [
    { step: "call", duration: 1.4, focus: ["ユーザー", "API"] },
    { step: "query", duration: 1.4, focus: ["API", "DB"] },
    { step: "return", duration: 1.4, focus: ["DB", "API"] },
    { step: "ok", duration: 1.4, focus: ["API", "ユーザー"] },
  ],
});
// <CdlDiagramView diagram={diagram} />
```

### Anthropic Claude で LLM に書かせる example

```ts
import Anthropic from "@anthropic-ai/sdk";
import { jsonToDiagram, diagramJsonSchema, validateDragonJson } from "@cardenelabs/dragon";

const client = new Anthropic();

async function generateDiagramFromLLM(userRequest: string, maxRetry = 3) {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userRequest }];
  for (let attempt = 0; attempt < maxRetry; attempt++) {
    const res = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tools: [
        {
          name: "create_diagram",
          description: "Create an animated diagram from user's request using Dragon DSL.",
          input_schema: diagramJsonSchema,
        },
      ],
      tool_choice: { type: "tool", name: "create_diagram" },
      messages,
    });
    const toolUse = res.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("no tool_use in LLM response");
    const validation = validateDragonJson(toolUse.input);
    if (validation.ok) {
      return jsonToDiagram(validation.data);
    }
    // retry loop = error path を prompt に注入して LLM に修正させる
    const errorSummary = validation.errors.map((e) => `  ${e.path}: ${e.message}`).join("\n");
    messages.push({ role: "assistant", content: res.content });
    messages.push({
      role: "user",
      content: `The diagram JSON has validation errors:\n${errorSummary}\nPlease fix and retry.`,
    });
  }
  throw new Error(`LLM failed to generate valid diagram after ${maxRetry} attempts`);
}

// 使用例
const diagram = await generateDiagramFromLLM(
  "ユーザーが API 経由で DB に検索をかけて結果を受け取るシーケンス図を作って",
);
```

### OpenAI GPT で structured output に使う場合

```ts
import OpenAI from "openai";
import { jsonToDiagram, diagramJsonSchema } from "@cardenelabs/dragon";

const client = new OpenAI();
const res = await client.chat.completions.create({
  model: "gpt-4o-2024-08-06",
  messages: [{ role: "user", content: "..." }],
  response_format: {
    type: "json_schema",
    json_schema: { name: "diagram", strict: true, schema: diagramJsonSchema },
  },
});
const json = JSON.parse(res.choices[0].message.content!);
const diagram = jsonToDiagram(json);
```

### JSON Schema の場所

- SSOT = `packages/dragon/src/schemas/diagram.json`
- npm 経由取得 = `@cardenelabs/dragon/schemas/diagram.json` (package.json exports)
- TypeScript import = `import { diagramJsonSchema } from "@cardenelabs/dragon"`

### YAML と JSON の 1:1 対応

同じ図を両方の記法で書ける。 人 → YAML、 LLM → JSON が推奨だが、 混在可能。

| YAML                   | JSON                                                    |
| ---------------------- | ------------------------------------------------------- |
| `title: "..."`         | `{title: "..."}`                                        |
| `actors: [A, B: kind]` | `{actors: [{name: "A"}, {name: "B", kind: "storage"}]}` |
| `- A -> B: "label"`    | `{from: "A", to: "B", label: "label"}`                  |
| `step: "..." 1.4s`     | `{step: "...", duration: 1.4}`                          |
| `focus: [A, B]`        | `{focus: ["A", "B"]}`                                   |

箱に書ける項目 (`tone` / `owner` / `posX` 等) は両方の記法で同じ。 一覧は実装
(`INLINE_ACTOR_KEYS`) が持ち、`packages/dragon/test/json-actor-fields.test.ts` が
両入口の一致を確かめる。 ここに一覧を写すと項目が増えた時に取り残されるため書かない。

## License

MIT
