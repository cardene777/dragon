# @cardenelabs/dragon

動く図を、人も AI も dragon記法で書くための package。

[English](README.md)

dragon は、短い文の file から段ごとに動く図を描く。
見本帳 (全ての種類の図と、書くとその場で動く編集画面) は <https://cardene777.github.io/dragon/> にある。

## 考え方

dragon は、ブロックを組み立てて図を作る道具である。
レゴのように、決まった形のブロックを組み合わせて、どの種類の図も同じ見た目で組み立てる。

| ブロック | 何か | 例 |
|---|---|---|
| コアブロック | 2 つ以上の種類の図で使い回すブロック | 箱 (`box`)、段 (`step`)、色、絵柄 |
| 個別ブロック | 1 つの種類の図だけで使うブロック | 時系列図の生存線、構成図の区画 (`group`) |
| 接続ブロック | 2 つのブロックを結ぶブロック | 線 (`->`)、枝分かれの図の merge |

図は、ブロックを組み立てたものである。
図の種類は、ブロックの並べ方と、受け付ける付け方だけを決める。
どの図でどのブロックを使えるかは、ブロックの付け方から決まる。
色と字の大きさと余白は 1 つの表が持ち、全てのブロックがそこから読むので、どの図も同じ見た目に揃う。

ブロックは、使う人が自分の手元でも足せる。
今の箱と線と印のどれかを元にして形と色の役を替えたブロックを、データだけの定義で書く ([ブロックを足す](https://github.com/cardene777/dragon/blob/main/packages/dragon/README.ja.md#ブロックを足す))。
図の種類と、元にできるブロックを増やす時は、この repo への pull request か fork で足す。

もう 1 つの軸は、mermaid と同じ手軽さで書けて、そのまま表示まで出ることである。

- 書く字が短い。図の種類の語と `A -> B: 名前` の 2 行で図になり、線に出た名前が箱になる
- script の 1 行で出る。頁に script の 1 行と記法の塊を置くだけで、動く図になる
- AI が速く書ける。AI も人と同じ記法で書き、読む処理の誤りの文が示す行と列を直す。JSON は原本として残り、記法と行き来できる
- 軽くて速い。頁は、書いた図が使うブロックだけを読む

記法は mermaid を手本にした独自の形で、mermaid とは互換にしない。
`-->|文|` のような読みにくい形を持たず、行の頭の英語の語だけで何の行かが分かる形を選んだ。

## 入れ方

```sh
npm install @cardenelabs/dragon
```

この package は次の 4 つを持つ。

| 持つ物 | 形 |
|---|---|
| 原本 | 図の種類と題と段の骨組みに、ブロックの名前ごとの欄 (`blocks`) を持つ JSON (下の節)。版を持ち、古い版は読む時に変換する |
| 記法 | 行の頭の英語の語で行の種類が決まる dragon記法 (下の節)。JSON と行き来でき、名前と文は日本語でも書ける ([書き方](https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md)、[英語の書き方](https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md)) |
| 描く部品 | 原本を頁に描き、段ごとに動かす部品。時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図、列の図、試す図を描く |
| 書き出し | 同じ原本から mp4、GIF、HTML、PNG を書き出す命令 `dragon export` |

前の版から上げる時に書き直す所は [`CHANGELOG.ja.md`](https://github.com/cardene777/dragon/blob/main/CHANGELOG.ja.md) にある。

## AI に図を書かせる

dragon の skill は、AI に dragon記法で図を書かせ、`dragon check` で確かめて読めるまで直させる。
Claude Code では、GitHub の repo cardene777/dragon をプラグインの置き場に足してから、プラグインを入れる。

```text
/plugin marketplace add cardene777/dragon
/plugin install dragon@dragon
```

ほかの AI では、GitHub の repo cardene777/dragon の skill の dir (`plugins/dragon/skills/dragon`) を、その AI が skill を読む場所へ写す。
AI は `SKILL.md` から読み始め、描く図の種類の参照の file だけを読む。
プラグインの版は npm の `@cardenelabs/dragon` の版と同じで、skill は入れた版を `dragon --version` で確かめる。

## 最初の図

```dragon
sequence

ブラウザ -> アプリ: GET /login
アプリ -> ブラウザ: ログインの頁を返す
```

図の種類の語と、箱どうしを `->` で結ぶ行だけで図になる。
線に出た名前が箱になり、線 1 本が 1 段になって書いた順に光る。
箱に見せる名前や添え書きを付け、段に題と本文を付ける時は、`box` と `step` の行を書く。

```dragon
sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する]
box アプリ [note: ログインを頼む側]

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
```

見本帳の編集画面に貼るとその場で動き、次の節の書き方で自分の頁にも置ける。

## script の 1 行で頁に出す

HTML の頁に script の 1 行と、記法を書いた `<pre class="dragon">` の塊を置くと、塊が動く図に置き換わる。
入れる作業も束ねる作業も要らない。

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon@0.61/dist/cdn/dragon.js"></script>

<pre class="dragon">
sequence ログインを頼む

box ブラウザ as 利用者のブラウザ
box アプリ

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
</pre>
```

script は jsDelivr から、版の真ん中の数まで固定した URL (`@0.57`) で読む。
後の直しの版は頁を直さずに届き、記法を変える版は届かない。
最初に読むのは `sequence` と `architecture` の描く部品で、ほかの種類の部品は、頁の塊がその種類を使う時だけ読む。
同梱の 2 つの字の CSS を jsDelivr から読む `<link>` を、頁に 1 度だけ足す。
頁を読み終えた時に在る塊を全て描き、後から足した塊は描かない。
塊の全ての行に共通の字下げは外して読む。
記法の中の `<` は `&lt;` と書く。
記法に誤りのある塊は図にせず、塊の場所に誤りの文を行ごとに出す (`<pre class="dragon-error">`)。
図の中の字と誤りの文は、頁の `lang` が `ja` で始まれば日本語、ほかは英語で出る。

通信の無い所で開ける 1 file にするには、頁を `dragon embed` に渡す。
script の 1 行を、全ての図の種類を持つ束ねた script に置き換え、頁の隣に `page.offline.html` を書く (`--out <file>` で書く file を選ぶ)。
この file は外から何も読まず、同梱の字を埋めないので端末の字で描く。

```sh
dragon embed page.html
```

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
再生の部品が出す字 (釦の読み上げの名前、全体図の札) は英語で出る。
日本語で出すには、`mountDiagram` の 3 つ目の引数に `{ lang: "ja" }` を渡し、誤りの文を日本語にするには `parseNotation` にも渡す。
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
既定の入口と同じ部品を出すが、`git`、`lineup`、`pipe`、`state`、`time`、`tree`、`try` の描く部品と、その種類だけが使うブロックの読み方を持たない。
これから読む記法か JSON を渡して `loadFor` を待つと、その図の種類の描く部品と、その図が使うブロックの読み方だけを読む。
`parseNotation` で記法から読んだ図は描く時に原本の形の検査を省くので、記法の図を描く頁は検査を読まない。JSON を渡した時は `loadFor` が原本の形の検査も読み、読む前に JSON を読むか描くと `loadFor` を待つよう示す誤りで止まる。
読んだ後は既定の入口と同じ関数で、待たずに同じ図を読み、描き、書き戻す。

```ts
import { loadFor, mountDiagram, parseNotation } from "@cardenelabs/dragon/light";

await loadFor(text);
const parsed = parseNotation(text);
if (parsed.ok) mountDiagram(host, parsed.diagram);
```

種類を先に読んでおく時は、種類の名前を渡して `loadKind` を待つ。
その種類の描く部品と、その種類の全てのブロックの読み方と、原本の形の検査を読む。
描かずに図の題と種類だけを引く時は `loadReadings` を待つ。ブロックの読み方だけを読み、描く部品は読まない。
`diagramKind` は、読む前の記法か JSON の図の種類を返す。`definesBlocks` は記法が足すブロックの定義を持つかを返し、持つ記法は `loadReadings` か `loadFor` を待ってから読む。
読んでいない種類を描くと種類の名前を含む誤りで、読んでいないブロックの行を読むとブロックの名前を含む誤りで止まる。
読み込みが落ちると `loadFor` と `loadKind` が拒否され、次に呼ぶと読み直す。
`sequence` と `architecture` は描く部品とブロックの読み方を初めから持つので、記法の図は何も待たずに読んで描ける。
1 つの頁で既定の入口と混ぜると、全ての種類の部品が頁に入る。

## ブロックを足す

今の箱と線と印のどれかを元にして、形と色の役を替えたブロックを、自分の手元で足せる。
置き場所と動きと置ける図の種類は元のブロックのままで、色は色味の表から読むので、足したブロックも他のブロックと同じ見た目に揃う。

定義は `blocks 1` の行の後に、`block +<名前>` から `end` までで書く。
名前は `+` で始める。
後で dragon が同じ名前のブロックを足しても、書いた図の意味は変わらない。

```text
architecture 橋を渡る

blocks 1
block +bridge
  base box
  shape path "M 0 70 Q 50 0 100 70 Z"
  color violet
end
block +wire
  base edge
  shape dashed
  color amber
end

box eth as Ethereum
+bridge cc as CCIP
box base as Base

step 送る
  say トークンを橋へ送る。
  eth -> cc: 送る

step 渡す
  say 橋がトークンを渡す。
  cc +wire base: 渡す
```

| 元 (`base`) | 記法の書き方 | 形 (`shape`) | 色 (`color`) |
|---|---|---|---|
| `box` | 箱の行の `box` の代わりに `+<名前>` を書く | `round` / `circle` / `cylinder` / `diamond` / `hexagon` か、100 四方に描く `path "…"` | 色の役 |
| `edge` | 線の行の `->` の代わりに `+<名前>` を書く | `solid` / `dashed` / `dotted` | 色の役 |
| `icon` | 箱の行に `[icon: +<名前>]` を書く | 中心を (0, 0) に置いて 20 四方に描く `path "…"` | 載せた箱の色 |

定義はデータだけで、path に書けるのは path の文法の字 (命令の字と数と区切り) だけである。
URL と code と SVG の要素は書けないので、他の人が書いた定義を読んでも何も実行されない。
版の行 (`blocks 1`) を書かない定義と、知らない版の定義は断る。

定義は 3 つの入口で読む。

- 図の頭に書くと、その図だけで使える
- 定義を 1 つの file に置き、頁の `<link rel="dragon-blocks" href="bridge.dragon">` で読むと、頁の全ての記法の塊で使える
- code では `readBlocks` で読み、`parseNotation` と `renderDiagram` の引数 `blocks` に渡す

```ts
import { parseNotation, readBlocks, renderDiagram } from "@cardenelabs/dragon";

// 記法の字か、{ "format": 1, "blocks": [...] } の JSON を渡す
const read = readBlocks(definition);
if (read.ok) {
  const parsed = parseNotation(notation, { blocks: read.blocks });
  if (parsed.ok) renderDiagram(parsed.diagram, { blocks: read.blocks });
}
```

図の種類と、元にできるブロックを増やす時は、この repo への pull request か fork で足す。

## dragon記法

どの行も次の決まり 4 つに従う。

1. 行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる
2. 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる
3. 空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む
4. 入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする

行の頭の語は `sequence` `architecture` `state` `git` `time` `tree` `group` `end` `box` `branch` `scale` `period` `row` `point` `zoom` `strip` `step` `say` `code` `source` `commit` `mark` `span` `leaf` `node` `act` `note` `set` で、線の行は `名札 -> 名札` と書く。
時系列図と構成図と状態遷移図は、1 行目の題と、箱の宣言と、段と、段の本文を省ける。
`box` の行を書かない図は線に出た名前を出た順に箱にし、1 字だけ違う名前の箱を、図を描いたまま知らせる。
`step` の行を書かない図は線 1 本を 1 段にし、`say` を書かない段は線の名前を本文にする。
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
`printNotation` は宣言と段を省ける図を省いて書き、`{ short: false }` を渡すと省かずに書く。
誤りの文の言葉は `parseNotation(text, { lang: "ja" })` のように渡した言葉で決まり、渡さなければ英語になる。
前の形の記法 (`時系列図` か `構成図` で始まる形) は読まず、その行の新しい形を示す誤りで止まる。
前の形と新しい形の対応表は [`CHANGELOG.ja.md`](https://github.com/cardene777/dragon/blob/main/CHANGELOG.ja.md) にある。

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

### 試す図

`try` で始めると、読み手が値を打ち込み、釦を押して動かせる試す図になる。部品の行を最初の段より前に上から並べて書くと、その順に上から積んで描く。

- `route <名札>: <節> - <節> - ..., ... [from: <節>, to: <節>]` は網。送ったチップを `from` から `to` まで最短の道で運ぶ
- `queue <名札> [order: <欄>]` は待ち行列。`order` の欄の値の高い順に上から並べる
- `chain <名札> [edit: <欄>]` は機械の列。ブロックは 1 つ前のブロックの `hash` を `prev` に持ち、`edit` を書くと読み手がブロックの中のチップのその欄を書き換えられる
- `log <名札> [all: <欄> = <値>, yes: <印>, no: <印>]` は記録の列。釦がまとめたチップを番号の付いた記録に並べ、機械の列と違って `prev` と `hash` を持たない。`all` を書くと、記録の中のチップのその欄が全てその値なら `yes` の印を、1 つでも違えば `no` の印を記録に出す
- `ask <欄>, <欄>, ... [into: <待ち行列か欄>, via: <網>]` は入力の帯。最初の欄の値がチップの名前になる。`into` に欄を書くと、送ったチップはその欄の値と同じ名札の待ち行列へ入る。その欄には `choose` の行を書き、`choose` の値ごとに同じ名札の待ち行列を置く
- `choose <欄>: <値>, <値>, ...` はその欄の選択肢。読み手は値を打たずに、書いた順に並ぶ選択肢から選ぶ。最初の欄にも書け、ブロックの中のチップを書き換える欄も同じ選択肢から選ぶ
- `press <名札> [from: <待ち行列>, into: <機械の列か記録の列>, take: <件数>, at: <部品>]` は釦。待ち行列の上から `take` 件を新しいブロックか新しい記録へ移す。`at` を書くとその部品の所に置き、書かなければ入力の帯に置く
- `side <部品>, <部品>, ...` は、枠が広い時に網と待ち行列と機械の列と記録の列のうち書いた部品を、書いた順に左から 1 つの行に並べる。待ち行列はチップが入る幅だけを取り、残りの幅を網と機械の列に渡す。横に並べると字が読める大きさより小さくなる枠では、この行が無い時と同じく上から積む

チップは `item <名札> [<欄>: <値>]` で書く。段の中の `line` で待ち行列の並びとブロックを書き、`ask <値>, ...` と `press <名札>` と `item <名札> [<欄>: <値>]` で書き手の例 (送る、作る、書き換える) を書く。
再生の部品は最初の段で止まって読み手を待ち、送るか押すか書き換えるたびに段を 1 つ足して流す。画像と動画と印刷には書き手の例の段を描く。

```dragon
try トランザクションがブロックに入るまで

route ノードの網: あなた - node-1 - 作る人, あなた - node-2 - node-3 - 作る人 [from: あなた, to: 作る人]
queue メモリプール [order: 手数料]
chain 機械の列 [edit: 量]
ask 送り手, 宛先, 量, 手数料 [into: メモリプール, via: ノードの網]
choose 宛先: Bob, Carol, Dave, Erin
press ブロックを作る [from: メモリプール, into: 機械の列, take: 2]

item 他1 [宛先: Carol, 量: 3, 手数料: 7]
item 他2 [宛先: Dave, 量: 5, 手数料: 5]
item 他3 [宛先: Erin, 量: 2, 手数料: 4]

step トランザクションが並んで待つ
  say メモリプールのトランザクションは手数料の高い順に並ぶ。
  line 機械の列: 他1
  line メモリプール: 他2, 他3

step あなたが送る
  say あなたのトランザクションが網を伝わって作る人に届く。
  ask あなた, Bob, 5, 12

step ブロックを作る
  say 手数料の高い順に2件がブロック2に入り、prevにブロック1のhashを持つ。
  press ブロックを作る
```

### 配管の図

`pipe` で始めると、1 つのトランザクションの中で、Contract の呼び出しと残高と記録の値が段ごとにどう動くかを追う配管の図になる。
関係者は `box` で宣言する。送り手、Contract、トークンの Contract、口座のどれかは行から決まるので書かない。

- `hold <持ち主>: <量> <トークン>, <量> <トークン>` は最初の段より前に書く残高で、`hold <持つ Contract>: <名前> <値>` は残高でない値。トークンは `box usdc as USDC` のように宣言した関係者の名前で書き、ETH は宣言せずに書ける。量として読める名前と `[` を含む名前は `"` で囲む
- `<呼ぶ者> -> <呼ばれる者>: <字>` は呼び出し。`[value: <量> ETH]` で ETH を添えて送り、`[call: delegate]` で呼ばれた側の処理を借りて呼んだ側の値に書き、`[call: static]` は書き込めない呼び出しになる。`[fold]` を付けると内側の段を 1 つの箱に畳み、押すと開く
- `return <戻る者>: <値>` はいちばん内側で開いている呼び出しを閉じ、`revert <者>: <理由>` はその呼び出しを落として内側の変更だけを元へ戻す
- `move <トークンの Contract>: <量> <送り手> -> <受け手>` はトークンの管を通して残高を移し、`write <者>: <名前> <値>` は値の札を書き替える
- `check <者>: <左> <比べ方> <右>` は確認で、比べ方は `>=`、`<=`、`==`、`!=`、`>`、`<`。両側が数なら dragon が比べ、数でない確認は `[fail]` を書いた時だけ落ちる
- `emit <者>: <名前>(<引数>, ...)` はイベントで、`calc <者>: <入る値> -> <出る値>` は換算

槽の水位はトークンごとに量に比例して描く。変更は一番外の呼び出しが戻るまで斜線の暫定で描き、戻った段で全て確定の緑に替わる。`revert` で戻した変更には赤の取り消しの印が付く。

```dragon
pipe 1 ETHをUSDCに替える

box alice as Alice
box ex as Exchange
box old as OldPool
box pool as Pool
box usdc as USDC

hold alice: 1 ETH, 0 USDC
hold ex: 0 ETH
hold pool: 5000 USDC
hold ex: "swaps[alice]" 0

step AliceがExchangeに1 ETHを添えて頼む
  say 呼び出しに添えたETHは、呼んだ所で相手の槽へ移る。
  alice -> ex: swap [value: 1 ETH]

step 古いPoolは閉じている
  say 確かめた所で落ち、そこまでの変更が元へ戻る。
  ex -> old: swap
  check old: open == true [fail]
  revert old: 閉じている

step Poolの価格を読む
  say 書き込めない呼び出しで価格だけを読む。
  ex -> pool: price [call: static]
  return pool: 3200

step Poolに交換を任せる
  say 内側の段は1つの箱に畳まれ、押すと開く。
  ex -> pool: swap [fold]

step 払う量を計算する
  say 1 ETHが今の価格でいくらのUSDCになるかを計算する。
  calc pool: 1 ETH -> 3200 USDC

step USDCがAliceへ移る
  say USDCがPoolの残高を減らしてAliceに足す。
  pool -> usdc: transfer
  move usdc: 3200 pool -> alice
  emit usdc: Transfer(pool, alice, 3200)
  return usdc: true

step Poolが払った量を返す
  say 内側の呼び出しが戻っても、変更は暫定のまま。
  return pool: 3200 USDC

step 交換が終わる
  say Exchangeが記録を書いて戻り、ここで全ての変更が確定する。
  write ex: "swaps[alice]" 1
  emit ex: Swapped(alice, 3200)
  return ex: 3200 USDC
```

## 原本の JSON

原本の JSON は、版 (`version`)、図の種類 (`kind`)、題 (`title`)、段 (`steps`) の骨組みを持ち、図に置くブロックをブロックの名前ごとの欄 (`blocks`) に並べる。
箱は `blocks.box`、区画は `blocks.group`、中身の帯は `blocks.strip` に書く。
枝分かれの図の枝は `blocks.branch`、状態遷移図の通らない道は `blocks.path`、列の図のチップは `blocks.item`、役は `blocks.role` に書く。
時間軸の図の目盛りと区切りと印の列と節目と拡大の範囲は、`blocks.scale`、`blocks.period`、`blocks.row`、`blocks.point`、`blocks.zoom` に書く。
段の中で起きること (線や箱の中の処理) は、段ごとの `events` に書く。

```json
{
  "version": 2,
  "kind": "sequence",
  "title": "送って受ける",
  "blocks": {
    "box": [
      { "id": "a", "name": "送る側" },
      { "id": "b", "name": "受ける側" }
    ]
  },
  "steps": [
    {
      "title": "送る",
      "body": "送る側が受ける側へ送る。",
      "events": [{ "type": "edge", "from": "a", "to": "b", "carry": { "kind": "envelope" } }]
    }
  ]
}
```

版1の原本 (`boxes` や `regions` を根に持つ形) も読める。
`readDiagram` は版1の原本を版2の形に移して返し、移したことを `warnings` に書く。
原本の file そのものを書き換えるには、`@cardenelabs/dragon/node` の `migrateFile` を使う。
版1と版2の欄の対応は [`CHANGELOG.ja.md`](https://github.com/cardene777/dragon/blob/main/CHANGELOG.ja.md) にある。

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
| `--palette <名前>` | 色味 (`clear` / `paper` / `night` / `arcade` / `sea`、既定は `paper` で、配管の図は `sea`)。`arcade` は図の箱の右上と左下を落として描く |
| `--theme <明暗>` | `light` か `dark` |
| `--lang <言葉>` | 図の中の字 (全体図の札、HTML の読み上げの名前、描けない時の断りの文) と、命令が出す使い方の文と誤りの文の言葉 (`ja` か `en`)。記法の file でも JSON の原本でも、既定は `en` |
| `--fps <数>` | mp4 の 1 秒のコマの数 (既定 30) |
| `--gif-fps <数>` | GIF の 1 秒のコマの数 (既定 10) |
| `--format <形>` | 書き出す形を `,` で区切る (既定 `mp4,gif,html,png`) |

PNG は最後の段の止め絵を、全体を止めた見せ方で撮る。
図の中で字が重なる段がある時は、書き出したうえで重なりを段と文で 1 件 1 行ずつ標準エラーに出す (例 `段 5: 段の番号 1 と段の番号 5 が重なる`)。終わり方は 0 のまま変えない。
HTML は図で描く字だけに削った字の file を埋めた 1 file で、外へ何も取りに行かない。
node から呼ぶ時は `@cardenelabs/dragon/export` の `exportDiagram` を使う。

## license

MIT
