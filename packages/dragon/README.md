# @cardenelabs/dragon

動く図を、人は dragon記法で、AI は JSON で書くための package。

## 入れ方

```sh
npm install @cardenelabs/dragon
```

0.35.0 は根本から作り直した版で、0.34.0 までの記法と入口は使えない。
今までの記法 (日本語の鍵の YAML と JSON)、`textDslToDiagram` と `jsonToDiagram` を含む入口、`@cardenelabs/cdl` へ渡して描く仕組みは [#2983](https://github.com/cardene777/dragon/issues/2983) で消した。
作り直しで決めたことは [#2982](https://github.com/cardene777/dragon/issues/2982) にまとめている。

0.36.0 では記法を dragon記法に作り直したため、0.35.x の記法の file は書き直さないと読めない。
原本の JSON は 0.35.x と同じ形で、そのまま読める。
書き直す時は、下の dragon記法の節と、前の形と新しい形の対応表を見る。

この package は次の 4 つを持つ。

| 持つ物 | 形 |
|---|---|
| 原本 | 共通の骨格と図の種類ごとの欄を持つ JSON。版を持ち、古い版は読む時に変換する |
| 記法 | 行の頭の英語の語で行の種類が決まる dragon記法 (下の節)。JSON と行き来でき、名前と文は日本語でも書ける ([書き方](https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md)、[英語の書き方](https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md)) |
| 描く部品 | 原本から時系列図と構成図を描き、段ごとに動かす部品。cdl には頼らない |
| 書き出し | 同じ原本から mp4、GIF、HTML、PNG を書き出す命令 |

## 頁に置く

頁で 1 度だけ字の入口 `@cardenelabs/dragon/fonts` を import し、記法を読んだ原本を `mountDiagram` に渡す。

```ts
import "@cardenelabs/dragon/fonts";
import { mountDiagram, parseNotation } from "@cardenelabs/dragon";

const source = await (await fetch("login.dragon")).text();
const parsed = parseNotation(source);
if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\n"));

const host = document.getElementById("figure");
if (host === null) throw new Error("#figure not found");
const player = mountDiagram(host, parsed.diagram);
```

字の入口は、同梱の 2 つの字 (Noto Sans JP と JetBrains Mono) の CSS を読み込むだけで、何も出さない。
図は同梱の字で測った字の幅で組むため、読み込まないと端末の字で描かれ、札から字がはみ出すことがある。
CSS と字の file は、束ねる道具 (Vite など) が頁へ運ぶ。
この入口は Node の組み込みの module を読まないため、Next.js の Turbopack のように頁を束ねる道具でもそのまま読める。
原本の file を今の版へ移す `migrateFile` は、Node でだけ動く入口 `@cardenelabs/dragon/node` から引く。

`mountDiagram` が返す `player` で段を動かす (`next`、`prev`、`play`、`pause`、`destroy`)。
3 つめの引数には色味や段が替わった時に呼ぶ関数などの設定 (`PlayerOptions`) を渡す。
置いた時に流さず決めた段の止め絵で止めて置くには `pausedAt` に段の番号 (0 から) を、1 度だけ流して最後の段で止めるには `playOnce: true` を渡す。
`still: true` を渡すと、最後の段の止め絵に全ての段の線の名前と箱の中の処理を最後の段と同じ濃さで出し、動かさない読者にも流れ全体を 1 枚で見せる。
`still` は `renderDiagram` にも渡せる。
どれも渡さなければ、置いた時から全ての段を繰り返し流す。

色味は名前 (`palette`) で選び、`colors` に色の変数の名前と値を渡すと、渡した色だけを描く明暗 (`theme`) の色として上書きする。
鍵は色味が持つ名前 (`bg`、`surf`、`ink`、`line`、`c-green`、`t-green` など。型は `ColorName`) で、渡さない色は名前で選んだ色味の値のまま残る。
置いた図、寄って追う時の全体図、釦と段の帯のどれも同じ色で塗る。`renderDiagram` も同じ `colors` を受ける。

```ts
mountDiagram(host, parsed.diagram, {
  palette: "night",
  colors: { bg: "#0a0f0a", surf: "#101810", ink: "#39ff14", line: "#1f9a0b", "c-green": "#39ff14" },
});
```

色味に無い名前と、`;`、`"`、`<` などを含む色として読めない値を渡すと、その名前を挙げて描かずに断る。

## 図の種類の部品を後から読む

頁が最初に読む量を抑えたい時は、`@cardenelabs/dragon/light` から読む。
既定の入口と同じ部品を出すが、`git`、`lineup`、`state`、`time`、`tree` の描く部品を持たず、`loadKind` を待った時に読む。
読んだ後は既定の入口と同じ関数で、待たずに同じ図を描く。

```ts
import { loadKind, mountDiagram, parseNotation } from "@cardenelabs/dragon/light";

const parsed = parseNotation(text);
if (parsed.ok) {
  await loadKind(parsed.diagram.kind);
  mountDiagram(host, parsed.diagram);
}
```

読んでいない種類を描くと、その種類の名前を含む誤りで止まる。
読み込みが落ちると `loadKind` が拒否され、次に呼ぶと読み直す。
`sequence` と `architecture` は初めから持つので、`loadKind` を呼ばなくても描ける。
1 つの頁で既定の入口と混ぜると、全ての種類の部品が頁に入る。

## dragon記法

どの行も次の決まり 4 つに従う。

1. 行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる
2. 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる
3. 空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む
4. 入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする

行の頭の語は `sequence` `architecture` `state` `git` `time` `tree` `group` `end` `box` `branch` `scale` `period` `row` `point` `zoom` `strip` `step` `say` `code` `source` `commit` `mark` `span` `leaf` `node` `act` `note` `set` で、線の行は `名札 -> 名札` と書く。
箱の行の属性 `link` に飛び先を書くと、描いた図でその箱が飛び先への link になる。
段の中の `source <名前> [url: <URL>]` の行は段の出典になり、1 つの段に何行でも書け、読み上げの段の一覧に名前の link で出る。
飛び先と出典の URL には、`/` で始まる path か、`http://` か `https://` で始まる URL だけを書ける。

```dragon
architecture 注文を倉庫へ回す

group 店側 as 店 [note: 注文を受ける側, color: blue, icon: cart]
  box 受付 [note: 注文を受ける, icon: app]
end

group 倉庫側 as 倉庫 [note: 品物を送る側, color: green, icon: box]
  box 出荷 [note: 品物を送る, icon: truck]
end

step 出荷に回す
  say
    受付が注文の番号を 2 つまとめて出荷に回す。
    出荷は届いた番号の順に品物を送る。
  受付 -> 出荷: 送ってよい [tag: "#42, #43"]
```

`parseNotation` は記法を原本の JSON に、`printNotation` は原本の JSON を記法に直す。
誤りの文の言葉は `parseNotation(text, { lang: "en" })` のように渡した言葉で決まり、渡さなければ日本語になる。
前の形の記法 (`時系列図` か `構成図` で始まる形) は読まず、その行の新しい形を示す誤りで止まる。
前の形と新しい形の対応表は [`CHANGELOG.md`](https://github.com/cardene777/dragon/blob/main/CHANGELOG.md) にある。

### 状態遷移図

`state` で始めると、1 つの物が状態を移る様子を段ごとに追う状態遷移図になる。箱が状態で、線は状態から状態への移り変わり。
線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。
最初の `step` より前に書いた線は、移れるが今回は通らない道として点線で引く。

```dragon
state 注文が届くまでの状態

box 支払い待ち [note: 入金を待つ, color: amber, icon: clock]
box 発送済み [note: 業者が運ぶ, color: violet, icon: truck]
box 配達完了 [note: 受け取られた, color: green, icon: check]
box キャンセル [note: 払った分は返す, color: rose, icon: x]

支払い待ち -> キャンセル: 取り消す
キャンセル -> finish

step 注文する
  say 注文を確定すると、支払い待ちから始まる。
  start -> 支払い待ち: 注文を確定 [tag: #1042]

step 発送する
  say 入金を確かめて品物を送り、発送済みに移る。
  支払い待ち -> 発送済み: 発送 [tag: #1042]

step 届く
  say 品物が届いて配達完了に移り、注文を閉じる。
  発送済み -> 配達完了: 受け取り [tag: #1042]
  配達完了 -> finish: 注文を閉じる [tag: #1042]
```

### 枝分かれの図

`git` で始めると、git の枝に commit を積み、取り込むまでを段ごとに追う枝分かれの図になる。枝は `branch` の行で上から順に宣言し、枝ごとに帯が並ぶ。
段の中では `commit <名札> on <枝>` で枝の先に commit を積み、`copy <元>` で当て直しの commit を、`merge <枝>` で merge commit を作る。`hash` と `note` で丸の外に hash と一言を添える。
`<枝> from <commit>` で枝を切り、`<札> -> <commit>` で commit を作らずに枝の札か `HEAD` を動かす。どの札からも辿れなくなった commit は点線の丸に変わる。

```dragon
git fix は merge commit で、feature は当て直して取り込む

branch main [note: 取り込む先]
branch feature [note: 作業の枝]
branch fix [note: 直しの枝]

step 枝を切る
  say main の A から fix と feature を切り、それぞれに commit を積む。
  commit A on main [hash: 3fa0c19, note: 最初の形]
  fix from A
  commit F on fix [hash: 9b2e4d1, note: 誤字を直す]
  feature from A
  commit C on feature [hash: c41d0e5, note: 検索を足す]

step merge commit で取り込む
  say fix を merge commit M で main へ取り込む。M は A と F の 2 つを親に持つ。
  commit M on main merge fix [hash: 7d3a5e2, note: fix を取り込む]

step 当て直す
  say HEAD を M へ動かして枝から離し、C を M の先へ写して C' を作る。
  HEAD -> M
  commit C' on main copy C [hash: a90c6b4, note: 検索を足す]

step 早送りする
  say feature を C' へ動かし、main も C' まで進める。元の C はどの枝からも辿れなくなる。
  feature -> C'
  main -> C'
```

### 時間軸の図

`time` で始めると、決まった間隔で進む時間の上で、出来事がどの目盛りで起きたかを段ごとに追う時間軸の図になる。`scale <単位> <長さ> <数>` で目盛りを宣言し、`period` で区切りを、`row` で印の列を、`point` で軸の下の節目を、`zoom <範囲>` で上の帯に拡大する目盛りを宣言する。
段の中では `now -> <目盛り>` で針を進める。針は目盛り 1 つを決まった速さで進み、過ぎた目盛りの印がその時に出る。`mark` で印の色を変え、`span` で軸の下に範囲の括弧か、印の列を囲む枠を出す。
中身の帯の欄に `[meter: <割合>]` を付けると物差しになり、`set` で書いた割合まで針と一緒に満ちる。

```dragon
time ブロックが確定して戻せなくなるまで

scale slot 12s 64
period epoch 32
row ブロック [color: blue, empty: 5]
point C0 at 0
point C1 at 32
zoom 0-1

box 提案者 [color: blue, icon: user]
box ブロック [color: blue, icon: box]

strip 確定の進み: 経過, 今の epoch の票 [meter: 2/3]

step ブロックを出す
  say slot ごとに提案者が 1 人選ばれ、ブロックを 1 つ出す。上の帯は最初の 2 slot を拡大した所。
  提案者 -> ブロック [at: 0]
  提案者 -> ブロック [at: 1]
  now -> 1
  set 経過: 24 秒

step 1 epoch 分の票を集める
  say 32 slot で 1 epoch。針が過ぎた slot にブロックの印が出て、提案者が応答しなかった slot は空きの印になる。
  note C0: 提案済み [color: blue]
  span 0-31: 1 epoch = 6.4 分 [color: slate]
  now -> 31
  set 経過: 6 分 24 秒
  set 今の epoch の票: 97%

step 次の epoch へ進む
  say C0 への票が全体の 2/3 を超えたので、C0 は正当化される。次の epoch では C1 へ票が集まる。
  note C0: 正当化 [color: violet]
  note C1: 提案済み [color: blue]
  now -> 63
  set 経過: 12 分 48 秒
  set 今の epoch の票: 97%

step C0 が確定する
  say C1 も正当化されると、続けて正当化された 2 つのうち前の C0 が確定する。確定したブロックは戻せない。
  C0 -> C1: 2/3 を超えた [carry: none]
  note C1: 正当化 [color: violet]
  note C0: 確定 [color: green]
  mark ブロック 0-31 [color: green]
  span 0-31: 確定して戻せない [shape: box, color: rose]
```

### 木の図

`tree` で始めると、葉の値を親へ畳み上げて1つの根にまとめる構造を段ごとに追う木の図になる。段の中の `leaf <名札> [hash: <値>]` で葉を、`node <名札> of <子>, <子> [hash: <値>]` で親を書くと、書いた段で箱が現れる。
葉は書いた順に左から並び、親は子の真ん中の上に置かれ、どの親にも組まれなかった箱が根になる。
親子の箱どうしの線の運ぶ物は木の線の上を走り、通った木の線はその色で残る。木の線を運ぶ物が通った段から後は、運ぶ物を送るか受けた箱だけを濃く出す。

```dragon
tree 取引が含まれることを確かめる

step 取引ごとに値を出す
  say 4件の取引それぞれから値を出す。この値が木の葉になる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  leaf 取引3 [hash: c41d]
  leaf 取引4 [hash: e5f8]

step 2つずつ組む
  say 隣どうしの値を2つずつつないで、もう1度値を出す。親が2つできる。
  node 1と2 of 取引1, 取引2 [hash: 7a21]
  node 3と4 of 取引3, 取引4 [hash: b9e4]

step 根ができる
  say 残った2つを組むと、全ての取引の値をまとめた根が1つできる。
  node 根 of 1と2, 3と4 [hash: e71c]

step 取引3から根まで上る
  say 隣の値を受け取りながら親へ上る。取引1と取引2を読まなくても、根の値が出る。
  取引3 -> 3と4 [tag: c41d]
  取引4 -> 3と4 [tag: e5f8]
  3と4 -> 根 [tag: b9e4]
  1と2 -> 根 [tag: 7a21]
```

## 書き出し

書き出しは画面なしの Chromium で、頁と同じ描画を時刻を止めて 1 コマずつ撮る。
撮ったコマは同じ Chromium の中で mp4 と GIF に詰めるので、ffmpeg は要らない。
Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。

```sh
pnpm add -D playwright-core
pnpm exec playwright-core install chromium
```

原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。

```sh
dragon export ccip.json --out out
```

| 設定 | 意味 |
|---|---|
| `--out <dir>` | 書き出す先。無ければ作る (既定は今の dir) |
| `--width <px>` | 枠の幅。見せ方 (全体を止める / 寄って追う) を選び、寄って追う窓の幅になる |
| `--palette <名前>` | 色味 (`clear` / `paper` / `night`、既定は `paper`) |
| `--theme <明暗>` | `light` か `dark` |
| `--lang <言葉>` | 図の中の字 (全体図の札、HTML の読み上げの名前、描けない時の断りの文) と、命令が出す使い方の文と誤りの文の言葉 (`ja` か `en`)。記法の file でも JSON の原本でも、既定は `ja` |
| `--fps <数>` | mp4 の 1 秒のコマの数 (既定 30) |
| `--gif-fps <数>` | GIF の 1 秒のコマの数 (既定 10) |
| `--format <形>` | 書き出す形を `,` で区切る (既定 `mp4,gif,html,png`) |

PNG は最後の段の止め絵を、全体を止めた見せ方で撮る。
図の中で字が重なる段がある時は、書き出したうえで重なりを段と文で 1 件 1 行ずつ標準エラーに出す (例 `段 5: 段の番号 1 と段の番号 5 が重なる`)。終わり方は 0 のまま変えない。
HTML は図で描く字だけに削った字の file を埋めた 1 file で、外へ何も取りに行かない。
node から呼ぶ時は `@cardenelabs/dragon/export` の `exportDiagram` を使う。

## license

MIT
