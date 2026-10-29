# dragon記法の書き方

dragon の図は、人は dragon記法で書き、道具は JSON (原本) で持つ。
行の種類は行の頭の英語の語で決まり、段の `step` の行の下に、その段で起きることを起きる順に並べる。
書き方の全部を使った例は、同じ directory の `oauth.dragon` (時系列図) と `ccip.dragon` (構成図) と `order.dragon` (状態遷移図) と `rebase.dragon` (枝分かれの図) にある。

記法の語は英語だけで、箱の名前や段の本文は日本語で書ける。
英語の書き方は同じ directory の `quick-start.en.md` にある。

## 最小の図

```dragon
sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する, color: slate]
box アプリ [note: ログインを頼む側, color: blue]

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
```

## 決まり

どの行も次の決まり 4 つに従う。

1. 行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる
2. 鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる
3. 空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む
4. 入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする

## 行の形

最初の `step` の行より前に、図の種類と題、区画、箱、中身の帯を宣言する。

| 行 | 書き方 | 例 |
|---|---|---|
| 図の種類と題 | `sequence <題>`、`architecture <題>`、`state <題>`、`git <題>` のどれか。見せ方は行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ | `architecture CCIP でトークンを送る [view: follow]` |
| 区画 | `group <名札> as <名前> [note: <添え書き>]` の行で開き、`end` の行で閉じる。間に書いた `box` の行の箱が区画の中に置かれる | `group 送信元 as 送信元チェーン [note: 例 Ethereum, color: blue]` |
| 箱 | `box <名札> as <名前> [note: <下の小さな字>]`。`as <名前>` を省くと名札が名前になる | `box OnRamp [note: 確かめて送り出す]` |
| 中身の帯 | `strip <題>: <欄>, <欄>` | `strip メッセージ: ID, 宛先, 状態` |
| 枝 | `branch <枝> [note: <添え書き>]`。枝分かれの図だけで書け、宣言した順に上から帯が並ぶ | `branch feature [note: 作業の枝]` |

段の中には、次の行を起きる順に字下げして並べる。

| 行 | 書き方 | 例 |
|---|---|---|
| 段の題 | `step <題>`。段は次の `step` か file の終わりまで続く | `step トークンを預ける` |
| 段の本文 | `say <本文>`。2 行以上に分ける時は、`say` だけの行の下にさらに深く字下げして続ける | `say OnRamp が Token Pool を呼ぶ。` |
| 段で打つ命令 | `code <命令>`。1 つの段に 1 行まで | `code lockOrBurn()` |
| 線 | `<名札> -> <名札>: <線の名前>`。名前は省ける | `OnRamp -> 送信元Pool: lockOrBurn() [carry: coin]` |
| 箱の中の処理 | `act <名札>: <処理の名前>` | `act OnRamp: 中身を確かめる` |
| 箱の下の字の書き換え | `note <名札>: <字>` | `note 送信元Pool: −100 USDC` |
| 中身の帯の値 | `set <欄>: <値>` か `set <欄> [tag: <札>]` | `set 状態: SUCCESS` |
| commit | `commit <名札> on <枝> [hash: <hash>, note: <一言>]`。`copy <元>` で当て直しの commit、`merge <枝>` で merge commit になる。枝分かれの図だけで書ける | `commit M on main merge fix [hash: 7d3a5e2]` |
| 枝を切る | `<枝> from <commit>`。HEAD がその枝へ移る | `feature from A` |
| 札を動かす | `<枝か HEAD> -> <commit>`。枝分かれの図では commit を作らずに札だけを動かす | `HEAD -> M` |

`fixed` は全体を止めて中だけ動かし、`follow` は今動いている所へ寄って動かし、隅の全体図で今どこかを示す。
見せ方を書かない時は、全体を枠に収めた字が 10.5px 以上なら `fixed`、下回るなら `follow` になる。

段には本文が要る。
読み上げの道具は、段の題と本文を段の順に読む。

同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きの箱を書く。
2 度目は名札だけを書き、名前と属性は最初の 1 度だけ書く。

状態遷移図 (`state <題>`) では、箱が状態になり、線は状態から状態への移り変わりになる。
線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。
最初の `step` の行より前に書いた線は、移れるが今回は通らない道として点線で引く。

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

枝分かれの図 (`git <題>`) では、`branch` の行で宣言した枝ごとに帯が並び、段の中で commit を積む。箱は無くてもよい。
`copy <元>` を付けた commit は元の commit を写した当て直しの commit になり、枝の札を動かさない。`merge <枝>` を付けた commit は、取り込む先とその枝の先端の 2 つを親に持つ。
札を動かす線は commit を作らず、`HEAD` を動かすと枝から離れる。どの札からも辿れなくなった commit は点線の丸に変わる。

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

## 属性

行の終わりの `[ ]` の中に `<鍵>: <値>` を `,` で区切って並べ、見た目と運ぶ物を指定する。

| 付ける行 | 鍵 | 意味 |
|---|---|---|
| 図の種類と題 | `view` | 見せ方。`fixed` か `follow` |
| 区画と箱 | `note` | 区画の添え書きか、箱の下の小さな字 |
| 区画と箱 | `color` | 色の役。`blue` / `amber` / `green` / `violet` / `rose` / `slate` / `coin` のどれか |
| 区画と箱 | `icon` | 名前の横に置く印 |
| 線 | `carry` | 線の上を走る物。`coin` か `none`。書かなければ封筒が走る |
| 線と帯の値 | `tag` | 線の上を走る札の字か、帯の欄に付ける札 |
| 線 | `side` | 線の名前を置く側。`above` / `below` / `left` / `right`。自動で決めた置き場所が崩れた時だけ書く |

`,` か `]` を含む値は `"` で囲み、囲みの中の `"` と `\` は `\"` と `\\` と書く。
`//` で始まる行と空行は読まない。

## 誤りの文

読めない行は、行と列を示した誤りで止まる。
誤りの文の言葉は呼ぶ側が渡し (`parseNotation(text, { lang: "en" })` や `dragon export --lang en`)、渡さなければ日本語で出す。
前の形の行 (`時系列図` や `#` で始まる行) は、その行の新しい形を示す誤りで止まる。
前の形と新しい形の対応表は repo の `CHANGELOG.md` にある。

## 文書に埋め込む

README や記事の中では、言語を `dragon` にした囲みに書く。
1 つの文書に何枚でも埋め込める。

````markdown
```dragon
sequence ログインを頼む
...
```
````

## JSON との行き来

記法と JSON は行き来できる。
JSON から記法へ書き戻す時は決まった並べ方に整えるので、書き手の行の並べ方と注釈の行は残らない。
JSON の形は `src/schemas/diagram.schema.json` が持ち、`version` の欄に形式の版を書く。
