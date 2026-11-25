# dragon記法の書き方

dragon の図は、人も AI も dragon記法で書き、道具は JSON (原本) で持つ。
行の種類は行の頭の英語の語で決まり、段の `step` の行の下に、その段で起きることを起きる順に並べる。
書き方の全部を使った例は、同じ directory の `oauth.dragon` (時系列図) と `ccip.dragon` (構成図) と `order.dragon` (状態遷移図) と `rebase.dragon` (枝分かれの図) にある。

記法の語は英語だけで、箱の名前や段の本文は日本語で書ける。
英語の書き方は同じ directory の `quick-start.en.md` にある。

## 最小の図

```dragon
sequence

ブラウザ -> アプリ: GET /login
```

最初の行の図の種類の語と、箱どうしを `->` で結ぶ行だけで図になる。
時系列図と構成図と状態遷移図は、1 行目の題と、箱の宣言と、段を省ける。
`box` の行を書かない図は、線に出た名前を出た順に箱にする。
1 字だけ違う名前の箱が出ると、書き間違いかもしれないと、図を描いたまま知らせる。
`step` の行を書かない図は、線 1 本を 1 段にして書いた順に光らせる。
`say` を書かない段は線の名前を段の本文にし、名前の無い線は箱の名前を「→」で結んだ字を本文にする。
段を書いた図の段の外の線と、`box` を 1 つでも書いた図の宣言の無い名前は、誤りになる。

箱に見せる名前や添え書きや色を付け、段に題と本文を付ける時は、宣言と段を書く。

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
| 図の種類と題 | `sequence <題>`、`architecture <題>`、`state <題>`、`git <題>`、`time <題>`、`tree <題>`、`pipe <題>`、`flow <題>`、`cycle <題>` (時計の文字盤に置く見た目は `[shape: clock]`、左から右への帯に並べる見た目は `[shape: band]`)、`mind <題>`、`er <題>`、`matrix <題>` (点数で点を打つ見た目は `[shape: scatter]`)、`venn <題>`、`sankey <題>` (段ごとに帯を積む見た目は `[shape: rows]`、全量の四角を面積で割る見た目は `[shape: treemap]`)、`chart <題> [shape: donut]` (か `[shape: bar]` か `[shape: funnel]` か `[shape: dots]` か `[shape: line]`) のどれか。見せ方は行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ | `architecture CCIP でトークンを送る [view: follow]` |
| 区画 | `group <名札> as <名前> [note: <添え書き>]` の行で開き、`end` の行で閉じる。間に書いた `box` の行の箱が区画の中に置かれる | `group 送信元 as 送信元チェーン [note: 例 Ethereum, color: blue]` |
| 箱 | `box <名札> as <名前> [note: <下の小さな字>]`。`as <名前>` を省くと名札が名前になる | `box OnRamp [note: 確かめて送り出す]` |
| 判断 | `choice <名札> as <問い>`。問いを中に書いたひし形になり、出る線の名前が答えになる。手順の図だけで書ける | `choice ok as 書けている？` |
| 中身の帯 | `strip <題>: <欄>, <欄>`。時間軸の図では欄の名前の後ろに `[meter: <割合>]` を付けると物差しになる | `strip メッセージ: ID, 宛先, 状態` |
| 枝 | `branch <枝> [note: <添え書き>]`。枝分かれの図だけで書け、宣言した順に上から帯が並ぶ | `branch feature [note: 作業の枝]` |
| 目盛り | `scale <単位> <長さ> <数> [from: <最初の番号>]`。長さは数と単位 (`ms`、`s`、`min`、`h`、`d`) の組で書き、その数の目盛りが軸に等間隔で並ぶ。時間軸の図だけで書ける | `scale slot 12s 64` |
| 区切り | `period <名前> <目盛りの数> [from: <最初の番号>]`。境ごとに名前と番号を置く | `period epoch 32` |
| 印の列 | `row <名札> [color: <色>, empty: <目盛り>]`。目盛りごとに印が並び、`empty` に書いた目盛りは空きの印になる | `row ブロック [color: blue, empty: 5]` |
| 作業の棒 | `task <名札> as <名前> <範囲> [color: <色>]`。作業ごとに行を持ち、範囲の目盛りの上に続いた太い棒を引く。棒の中に `1〜3日` のように始まりと終わりの目盛りの名前で期間が出て (1つの目盛りは `14日`)、針が通った分を濃く塗る。作業を持つ図は `row` を書かなくてよい | `task build as 実装 3-8 [color: violet]` |
| 節目 | `point <名札> at <目盛り>`。軸の下に旗の丸と名札を置く | `point C0 at 0` |
| 拡大の帯 | `zoom <範囲>`。その目盛りごとに上の帯へ列を作り、宣言した箱を列ごとに同じ並びで置く | `zoom 0-1` |

段の中には、次の行を起きる順に字下げして並べる。

| 行 | 書き方 | 例 |
|---|---|---|
| 段の題 | `step <題>`。段は次の `step` か file の終わりまで続く | `step トークンを預ける` |
| 段の本文 | `say <本文>`。2 行以上に分ける時は、`say` だけの行の下にさらに深く字下げして続ける | `say OnRamp が Token Pool を呼ぶ。` |
| 段で打つ命令 | `code <命令>`。1 つの段に 1 行まで | `code lockOrBurn()` |
| 段の出典 | `source <名前> [url: <URL>]`。1 つの段に何行でも書け、読み上げの段の一覧に名前の link で出る | `source CCIP の仕組み [url: /diagrams/ccip]` |
| 線 | `<名札> -> <名札>: <線の名前>`。名前は省ける | `OnRamp -> 送信元Pool: lockOrBurn() [carry: coin]` |
| 箱の中の処理 | `act <名札>: <処理の名前>` | `act OnRamp: 中身を確かめる` |
| 箱の下の字の書き換え | `note <名札>: <字>` | `note 送信元Pool: −100 USDC` |
| 中身の帯の値 | `set <欄>: <値>` か `set <欄> [tag: <札>]` | `set 状態: SUCCESS` |
| commit | `commit <名札> on <枝> [hash: <hash>, note: <一言>]`。`copy <元>` で当て直しの commit、`merge <枝>` で merge commit になる。枝分かれの図だけで書ける | `commit M on main merge fix [hash: 7d3a5e2]` |
| 枝を切る | `<枝> from <commit>`。HEAD がその枝へ移る | `feature from A` |
| 札を動かす | `<枝か HEAD> -> <commit>`。枝分かれの図では commit を作らずに札だけを動かす | `HEAD -> M` |
| 枝を消す | `delete <枝>`。消した段から後はその枝の札が図から消える。HEAD が指している枝は消せない。枝分かれの図だけで書ける | `delete feature` |
| 針を進める | `now -> <目盛り>`。針が決まった速さでその目盛りまで進み、過ぎた目盛りの印がその時に出る。時間軸の図だけで書ける | `now -> 31` |
| 印の色 | `mark <列> <範囲> [color: <色>]`。その列の範囲の印の色を変える | `mark ブロック 0-31 [color: green]` |
| 範囲 | `span <範囲>: <字>`。軸の下に範囲の括弧を出し、`[shape: box]` を付けると印の列を囲む枠になる | `span 0-31: 1 epoch = 6.4 分` |
| 拡大の帯の線 | `<名札> -> <名札> [at: <目盛り>, into: <目盛り>]`。`at` の列の箱から出て、`into` の列の箱が受ける | `提案者 -> ブロック [at: 0]` |
| 葉 | `leaf <名札> [hash: <値>]`。書いた順に左から並び、値を書くと箱に値を、葉の下の札に名札を出す。木の図だけで書ける | `leaf 取引1 [hash: 3fa0]` |
| 親 | `node <名札> of <子>, <子> [hash: <値>]`。子の真ん中の上に置かれ、どの親にも組まれなかった箱が根になる。木の図だけで書ける | `node 根 of 1と2, 3と4 [hash: e71c]` |
| 考え | `idea <名札> as <名前> of <親> [color: <色>]`。段の中に書き、`of` の無い考えが真ん中の題になる。題に繋げると枝、枝に繋げると葉で、3 段まで書ける。考えを広げる地図だけで書ける | `idea input as 入力 of app` |
| 軸 | `axis <名前> [from: <小さい側>, to: <大きい側>]`。最初の `step` より前に横の軸、縦の軸の順にちょうど 2 行書く。2つの軸で置く図だけで書ける | `axis 手間 [from: 小さい, to: 大きい]` |
| 置く課題 | `item <名札> as <名前>`。最初の `step` より前に書き、区画の左の置く前の一覧に書いた順に並ぶ。2つの軸で置く図だけで書ける | `item login as ログインを速く` |
| 区画へ置く | `line <区画>: <課題>, <課題>`。段の中に書き、課題の札を一覧から区画へ滑らせる。2つの軸で置く図だけで書ける | `line now: login` |

`fixed` は全体を止めて中だけ動かし、`follow` は今動いている所へ寄って動かし、隅の全体図で今どこかを示す。
見せ方を書かない時は、全体を枠に収めた字が 10.5px 以上なら `fixed`、下回るなら `follow` になる。

段には本文が要る。
読み上げの道具は、段の題と本文と出典を段の順に読む。

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

時間軸の図 (`time <題>`) では、`scale` で宣言した目盛りが軸に等間隔で並び、段の中の `now` で針を進める。
針は目盛り 1 つを決まった速さで進むので、秒数は書かない。`zoom` で選んだ目盛りは上の帯に列として並び、線は `[at: <目盛り>]` で列を選ぶ。
中身の帯の欄に `[meter: <割合>]` を付けると、`set` で書いた割合まで針と一緒に満ちる物差しになる。

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

木の図 (`tree <題>`) では、段の中の `leaf` で葉を、`node` で親を書き、書いた段で箱が現れる。
葉は書いた順に左から並び、親は子の真ん中の上に置かれ、どの親にも組まれなかった箱が根になる。
親子の箱どうしの線の運ぶ物は木の線の上を走り、通った木の線はその色で残る。

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

試す図 (`try <題>`) では、最初の段より前に部品の行を上から並べ、読み手が値を打ち込んで釦を押せる図にする。
`route` は網、`queue` は待ち行列、`chain` はブロックの鎖、`ask` は入力の帯、`press` は釦で、チップは `item <名札> [<欄>: <値>]` で書く。
段の中の `line` で並びを書き、`ask` と `press` と `item` で書き手の例の段を書く。再生の部品は最初の段で止まり、読み手が押すたびに段を 1 つ足す。

```dragon
try ブロックに入るまで

route 網: あなた - node-1 - 作る人 [from: あなた, to: 作る人]
queue メモリプール [order: 手数料]
chain 鎖 [edit: 量]
ask 送り手, 量, 手数料 [into: メモリプール, via: 網]
press 作る [from: メモリプール, into: 鎖, take: 2]

item 他1 [量: 3, 手数料: 7]
item 他2 [量: 5, 手数料: 5]

step 並んで待つ
  say メモリプールに手数料の高い順に並ぶ。
  line メモリプール: 他1, 他2

step ブロックを作る
  say 手数料の高い順に2件がブロック1に入る。
  press 作る
```

配管の図 (`pipe <題>`) では、最初の段より前に `hold <持ち主>: <量> <トークン>, ...` で残高を、`hold <持つ Contract>: <名前> <値>` で残高でない値を宣言する。
`<呼ぶ者> -> <呼ばれる者>: <字>` の行は呼び出しで、`[value: <量> ETH]` で ETH を添え、`[call: delegate]` か `[call: static]` で呼び出しの種類を決め、`[fold]` で内側の段を 1 つの箱に畳む。
段の中の `move <トークンの Contract>: <量> <送り手> -> <受け手>` は残高を移し、`write <者>: <名前> <値>` は値を書き替え、`check <者>: <左> <比べ方> <右>` は確かめ (数でない確認は `[fail]` を書いた時だけ落ちる)、`emit <者>: <名前>(<引数>, ...)` はイベントを出し、`calc <者>: <入る値> -> <出る値>` は換算する。
`return <戻る者>: <値>` はいちばん内側で開いている呼び出しを閉じ、`revert <者>: <理由>` はその呼び出しを落とす。変更は一番外の呼び出しが戻るまで暫定のまま。
配管の図は段の本文を図の下に出さないので、段の要点は `gist <要点>` で 1 つの段に 1 行まで書く。要点は段の矢印の後ろの札に出る。

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
  gist 一番外の呼び出しが戻った時に、全ての変更が確定する
  write ex: "swaps[alice]" 1
  emit ex: Swapped(alice, 3200)
  return ex: 3200 USDC
```

量の図 (`chart <題> [shape: donut]` か `chart <題> [shape: bar]`) は、項目どうしの大きさを段ごとに比べる。ドーナツは項目ごとの割合を弧の角度で、横棒は項目ごとの量を棒の長さで描く。
最初の段より前に `item <名札> as <名前> [color: <色>]` で比べる項目を 1 つ以上、8 個まで宣言する。
段の中の `set <名札>: <値>` は項目の値で、0 以上の数を単位を付けずに書く。`set` を書かない項目は前の段の値を保ち、弧と棒は前の段の値から新しい値へ動く。

```dragon
chart スマホのOSの割合 [shape: donut]

item ios as iOS [color: blue]
item android as Android [color: green]
item other as その他 [color: slate]

step 2018年
  say iOSが7割を占める。
  set ios: 70
  set android: 29
  set other: 1

step 2024年
  say Androidが4割近くまで伸びる。
  set ios: 60
  set android: 39
```

`chart <題> [shape: funnel]` は段を進むほど数が減る漏斗を描く。段を上から `item` で宣言し、段の数を `set` で書く。
段の棒は値を書いた段で現れ、前の段との差は薄い棒で残して去った数を書き、最後の段で最初の段のうち最後の段まで残った割合を出す。
前の段より大きい値は記法を読む時に誤りになる。

```dragon
chart 店で買うまでの人数 [shape: funnel]

item visit as 店を訪れた [color: blue]
item view as 商品を見た [color: violet]
item buy as 買った [color: green]

step 訪れる
  say 店のサイトを10,000人が訪れた。
  set visit: 10000

step 商品を見る
  say 商品の頁まで進んだのは4,200人だった。
  set view: 4200

step 買う
  say 買ったのは380人だった。
  set buy: 380
```

`chart <題> [shape: dots]` は件数を点の数で数えて見せる。
最初の段の前から全体の箱に空の点を並べ、項目に件数を書いた段で、その件数の分の点が箱から項目の群れへ寄る。
1点が何件かは、点が100個ほどになる数 (1か2か5に10の累乗を掛けた数) を図が選び、箱の上に全体の件数と並べて出す。
最初の行を `chart <題> [shape: dots, unit: <数>]` と書くと1点の件数を決められ、1つの段で点が200個を超える値は記法を読む時に誤りになる。
ドーナツと横棒と点で数える見た目は、段の中の `set none: <数>` でどの項目にも入らない数を書ける。
点で数える見た目ではその点が灰色のまま箱に残り、ドーナツと横棒では項目の後ろに灰色の弧か棒で描く。漏斗と折れ線は `set none` を断る。

```dragon
chart 1,000人に聞いた端末 [shape: dots]

item i as iPhone
item a as Android
item w as Windows
item m as Mac

step iPhone
  say いちばんよく使う端末がiPhoneの人は412人で、点41個になる。
  set i: 412

step Android
  say Androidの人は287人で、iPhoneの次に多い。
  set a: 287

step Windows
  say Windowsのパソコンの人は158人だった。
  set w: 158

step Mac
  say Macの人は93人で、点9個になる。
  set m: 93

step どれも使わない
  say どれも使わない50人は、点が灰色のまま全体の箱に残る。
  set none: 50
```

`chart <題> [shape: line]` は時間につれて量がどう変わったかを折れ線で描く。
`item` の行が1本の線になり、`step` の行が時間の軸の点の1つになって、段の題が横の軸の名前になる。
段を送ると線が前の段の点から新しい段の点へ伸び、その段の値が点の右に出る。`set` を書かない段は前の段の値を保つ。
段が1つだけの図と、どの段にも値を書かない項目と、`set none` は記法を読む時に誤りになる。

```dragon
chart ベーカリーの1週間の売り上げ (円) [shape: line]

item shop as 店頭 [color: amber]
item online as 通販 [color: blue]

step 月
  say 週の初めは、店頭が42,000円、通販が12,000円だった。
  set shop: 42000
  set online: 12000

step 火
  say 雨の火曜は、店頭が38,000円に減り、通販が15,000円に増えた。
  set shop: 38000
  set online: 15000

step 水
  say 水曜は、店頭が45,000円に戻った。
  set shop: 45000
```

列の図 (`lineup <題>`) は既定でボードの見た目になり、箱を書いた順に左から淡い色の縦の帯として並べ、帯の中にチップを札として上から積む。
帯の見出しには名前と札の数が並ぶ。箱に `[limit: <数>]` を書くと、札の数を `2/3` の形で出し、見出しの下に上限の数の目盛りを並べて札の数だけ塗る。
段の中の `line` でチップが前の帯へ戻ると差し戻しになり、戻りの線と「差し戻し」の札を引き、元の帯に抜けた跡を点線で残す。`:` の後ろに何も書かない `line <列>:` は、その列を空にする。
最初の行に `[shape: stations]` を足すと流れの線の見た目になり、箱を1本の線の上の駅として並べ、札を駅の下に積む。上限を書いた駅は、空いた席を点線の受け口で示す。
流れの線は `seal` と `open` と `pick` と `stamp` を描かないので、書くと断る。携帯の幅では、ボードは帯を上から積み、流れの線は線を縦に引く。

```dragon
lineup 変更を本番へ出す流れ [shape: stations]

box 開発
box レビュー [color: violet]
box ステージング [color: amber, limit: 2]
box 本番 [color: green, order: none]

item ログイン, 検索

step レビューに出す
  say 2件の変更をレビューに出す。
  line レビュー: ログイン, 検索

step ステージングで確かめる
  say レビューを通した2件をステージングに載せる。ステージングは2件で埋まる。
  line ステージング: ログイン, 検索
  line レビュー:

step 問題が出たら差し戻す
  say 検索に問題が出たので開発へ差し戻し、ログインだけを本番へ出す。
  line 開発: 検索
  line 本番: ログイン
  line ステージング:
```

列の図 (`lineup <題>`) の最初の行に `[shape: layers]` を足すと、箱を書いた順に上から横の帯として重ね、1件の頼みや取引が層を下りていく流れを描く。
帯の左には層の名前と `note` の説明と層の番号が並び、層の間に矢印は描かない。層は8つまで書ける。
段の中の `line <層>: <チップ>` はチップの居る層で、チップの居る帯を最も濃く、通った帯を薄く光らせる。`note <層>: <字>` はその層の印で、層でした事や掛かった時間を書く。
層の見た目は `[order: none]` と `role` と `seal` と `open` と `pick` と `stamp` を描かないので、書くと断る。

```dragon
lineup 保存の頼みが置き場に届くまで [shape: layers]

box browser as 画面 [note: 押した保存を頼みにして送る, color: blue]
box api as サーバー [note: ログインと中身を確かめる, color: amber]
box db as データの置き場 [note: 行を書いて控える, color: green]

item 頼み [color: blue, note: POST /notes]

step 画面で保存を押す
  say 保存を押すと、ブラウザが中身を頼みにして送る。
  line browser: 頼み
  note browser: 頼みを作った

step 置き場に書く
  say 頼みはサーバーで確かめられ、データの置き場へ下りて書かれる。
  line db: 頼み
  note db: 30ミリ秒で書いた
```

代わりに `[shape: stairs]` を足すと、層を下の層ほど同じ幅だけ右へずらした階段に置く。
全ての箱の行に `box encode as 変換する [time: 3min]` のように `[time: <長さ>]` を書くと、階段の右に経った時間の目盛りを置く。時間の掛からない層は `0s` と書ける。
目盛りの針は段ごとに、チップが下りた層までに経った時間の所へ進み、`1分3秒` のような札を添える。携帯の幅では目盛りを図の下に置く。

```dragon
lineup 動画が見られるようになるまで [shape: stairs]

box upload as 送る [color: violet, time: 40s]
box encode as 変換する [color: amber, time: 3min]
box viewer as 見る人の端末 [color: green, time: 3s]

item 動画 [color: blue]

step 送る
  say 動画を端末から置き場へ送る。
  line upload: 動画

step 変換する
  say 置き場が動画を4つの画質に作り直す。
  line encode: 動画

step 再生する
  say 見る人の端末が再生を始める。
  line viewer: 動画
```

手順の図 (`flow <題>`) では、手順を `box`、判断を `choice <名札> as <問い>` で書く。
段が通る箱と判断は、線が初めて辿り着く順に上から下へ 1 列に並び、判断がほかへ送る道は判断の右へ出る。
判断から出る線には答えを名前に書き、1 つの判断から出る道は 2 つまで。
状態遷移図と同じく、`start` と `finish` で始まりと終わりの印を結び、最初の `step` の行より前に書いた線は今回は通らない道として点線で残る。
段の線が 1 本も辿り着かない箱は縁が点線になり、名前も薄い色で書く。
段で動く線は青く引かれ、その上を点が走る。
`carry` と `tag` を書かない線では、封筒の代わりにこの点が走る。
長い問いは助詞か空白の後で 2 行に折る。

```dragon
flow 申し込みの受け付け

box form as 申し込みを受ける
choice ok as 書けている？
box send as 受け付ける [color: green]
box back as 書き直してもらう [color: rose]

ok -> back: いいえ

step 受ける
  say 申し込みが届いて手順が始まる。
  start -> form

step 確かめる
  say 書けているかを判断する。「いいえ」の道は点線で判断の右へ出る。
  form -> ok: 調べる

step 受け付ける
  say 書けていたので、「はい」の道を下へ進んで受け付ける。
  ok -> send: はい
  send -> finish
```

回り続ける図 (`cycle <題>`) では、輪の上の手順を最初の `step` の行より前に `box` で書く。
手順は書いた順に輪の真上から右回りに並び、隣どうしを弧の矢印で結ぶ。手順は 2 つから 8 つまで書ける。
段の中の `<名札> -> <名札> [tag: <字>]` は輪の次の手順への線で、札がその段で弧に沿って走り、走った弧は光ったまま残る。
最後の手順から最初の手順への線で次の回に入る。1 つ飛ばす線、逆回りの線と、名前を持つ線は書けない。
`strip <題>: <欄>, <欄>` は図の下でなく輪の真ん中に出て、段の中の `set <欄>: <値>` で値が入れ替わる。欄の名前は出さず、最初の欄の値を大きく出す。

```dragon
cycle 週の振り返り

box plan as 決める [note: 週の初め, color: blue]
box work as 進める [note: 毎日, color: green]
box look as 振り返る [note: 週の終わり, color: amber]

strip 週: 回, 曜日

step 決める
  say 週の初めに、その週にやることを決める。
  set 回: 第1週
  set 曜日: 月曜

step 進める
  say 決めたことを毎日進める。
  plan -> work [tag: やること]
  set 曜日: 火曜から木曜

step 振り返る
  say 週の終わりに、進んだことと残ったことを振り返る。
  work -> look [tag: 進み]
  set 曜日: 金曜

step 次の週へ
  say 残ったことを持って、次の週の決めることへ戻る。
  look -> plan [tag: 残り]
  set 回: 第2週
  set 曜日: 月曜
```

図の種類の行を `cycle <題> [shape: clock]` と書くと、手順を時計の文字盤に置く。
手順の `box` には `[time: 25min]` の形で手順の長さ (0 でない数と `ms`、`s`、`min`、`h`、`d` の単位) を書き、手順は 12 時から長さに合わせた弧で並ぶ。
針は段ごとにその段の手順の弧の始まりを指し、札は針の先に乗って走る。`[shape: clock, turn: left]` で左回りになる。

```dragon
cycle 集中と休みの時間割 [shape: clock]

box focus as 集中する [time: 25min, color: blue]
box short as 短く休む [time: 5min, color: green]
box review as 振り返る [time: 10min, color: amber]
box long as 長く休む [time: 20min, color: rose]

strip 時間割: 回, 集中した時間

step 集中を始める
  say 通知を切り、手元の作業に25分集中する。
  set 回: 1回目
  set 集中した時間: 0分

step 短く休む
  say 25分たったら手を止め、5分だけ立って体を伸ばす。
  focus -> short [tag: 25分]
  set 集中した時間: 25分

step 振り返る
  say 休みを終えたら、進んだ所と詰まった所を10分で書き出す。
  short -> review

step 長く休む
  say 書き出したら、20分しっかり休んで頭を空ける。
  review -> long [tag: メモ]

step 次の回へ
  say 休みを終えて、2回目の集中を始める。
  long -> focus
  set 回: 2回目
```

図の種類の行を `cycle <題> [shape: band]` と書くと、回ごとの帯に手順を左から右へ並べる。
どの手順の `box` にも `[time: <長さ>]` を書くと、帯の上に手順の始まる時刻の目盛りが出る。長さはどの手順にも書くか、どの手順にも書かない。
線の札は山形から次の山形へ走り、最後の手順から最初の手順への線は下の回の帯へ戻る矢印を辿る。

```dragon
cycle 畑の1年 [shape: band]

box sow as 種をまく [time: 60d, color: green]
box grow as 育てる [time: 120d, color: blue]
box harvest as 収穫する [time: 60d, color: amber]
box rest as 土を休める [time: 120d, color: slate]

strip 畑: 年, 季節

step 種をまく
  say 春に土を耕し、畑へ種をまく。
  set 年: 1年目
  set 季節: 春

step 育てる
  say 芽が出たら、夏の間は水をやって苗を育てる。
  sow -> grow [tag: 苗]
  set 季節: 夏

step 収穫する
  say 秋に実った作物を収穫する。
  grow -> harvest [tag: 実]
  set 季節: 秋

step 土を休める
  say 収穫を終えた畑に堆肥をまき、冬の間は土を休める。
  harvest -> rest [tag: 堆肥]
  set 季節: 冬

step 2年目へ
  say 春が来たら、休めた土にまた種をまく。
  rest -> sow [tag: 種]
  set 年: 2年目
  set 季節: 春

step 2年目も育てる
  say 2年目も、芽が出た苗を夏の間に育てる。
  sow -> grow [tag: 苗]
  set 季節: 夏
```


考えを広げる地図 (`mind <題>`) では、段の中の `idea` の行で考えを書き、書いた段で考えが濃くなって親からの線が引かれる。
`of` の無い考えが真ん中の題で、1 つだけ書ける。`idea <名札> as <名前> of <親>` で題に繋げると枝、枝に繋げると葉になり、4 段目は書けない。
枝は書いた順に左上から右回りに伸び (4 つなら左上、右上、右下、左下)、葉は枝の外側に縦に並ぶ。
枝に `[color: <色>]` を書くと線と葉がその色を引き継ぐ。`box` と `strip` と箱どうしの線は書けない。

```dragon
mind 家計簿のアプリの機能

step 題を置く
  say 毎月のお金の出入りを続けて付けられる、家計簿のアプリを真ん中に置く。
  idea app as 家計簿のアプリ

step 入力の枝
  say 付ける手間を減らす機能を考える。
  idea input as 入力 of app [color: blue]
  idea receipt as レシートを撮って読む of input
  idea bank as 口座の明細を取り込む of input

step 通知の枝
  say 使いすぎに気付ける知らせを考える。
  idea alert as 通知 of app
  idea over as 予算を超えそうな時 of alert
  idea payday as 引き落としの前の日 of alert
```

表どうしの関係の図 (`er <題>`) では、表を最初の `step` の行より前に `table <名札> as <名前>` で書き、その下に `field <名前>: <値>` の行で項目を書く。
表は書いた順に左から右へ横 1 列に並ぶ。表は 1 つから 6 つまで書ける。
`[key]` は鍵の印 (PK) で、`field <名前>: <値> [ref: <表>.<項目>]` は別の表の項目への結び (FK) になり、結びを書いた項目から指した項目へ線を引く。
段の中の `pick <表>.<項目>` は行と表を光らせ、`<表>.<項目> -> <表>.<項目> [tag: <値>]` は結んだ項目どうしの線に沿って値の札を走らせる。結んでいない項目どうしの線は書けない。
`set <表>.<項目>: <値>` は項目の値を書き換え、`note <表>.<項目>: <文>` は表の下に式の札を出す。

```dragon
er 注文から客を引く

table users as 客
  field id: U-7 [key]
  field 名前: 田中
  field 注文の数: 2

table orders as 注文
  field id: O-41 [key]
  field 客id: U-7 [ref: users.id]
  field 金額: 1200円

step 注文を引く
  say 注文O-41の行を引く。
  pick orders.id

step 客を辿る
  say 注文の客idを結びに沿って辿り、客U-7の田中さんの行を引く。
  orders.客id -> users.id [tag: U-7]
  pick users.id

step 数を増やす
  say 田中さんの注文の数を1つ増やす。
  note users.注文の数: 2 + 1 = 3
  set users.注文の数: 3
  pick users.注文の数
```

2つの軸で置く図 (`matrix <題>`) では、最初の `step` の行より前に `axis <名前> [from: <小さい側>, to: <大きい側>]` を横の軸、縦の軸の順に 2 行書く。
横の軸は区画の下を左から右へ、縦の軸は区画の左を下から上へ矢印で引き、軸の名前と両端の字を軸の外に出す。
区画は `box <名札> as <名前>` でちょうど 4 つ書き、書いた順に左上、右上、左下、右下に並ぶ。分ける課題は `item <名札> as <名前>` で書き、区画の左の置く前の一覧に書いた順に並ぶ。
段の中の `line <区画>: <課題>, <課題>` で課題を区画へ置くと、札が一覧から区画へ滑り、区画が光る。置いた札は後の段で別の区画へ置き直すまで残る。
軸が 2 本でない図、区画が 4 つでない図、無い区画か課題を名指す `line` は誤りで止まる。箱どうしの線と `strip` は書けない。
課題の行に `[x: <横>, y: <縦>]` で0から10の点数を書くと、段の中の `line: <課題>` で区画を書かずに点数から決まる区画へ置ける。軸ごとに5以上を大きい側に数え、軸の行に `reverse: yes` を足すとその軸は大きい値を左か下に置く。
最初の行を `matrix <題> [shape: scatter]` にすると、課題を点数どおりの所の点で打ち、左に課題と点数の表を並べる。表は `[shape: scatter, table: none]` で消せる。

```dragon
matrix 仕事を手間と効き目で分ける

axis 手間 [from: 小さい, to: 大きい]
axis 効き目 [from: 小さい, to: 大きい]

box now as 今やる
box plan as 計画する
box spare as 手が空いたら
box drop as やらない

item login as ログインを速く
item pay as 決済を足す
item word as 文言の直し

step 並べる
  say 仕事を左に並べる。

step 今やる
  say 手間が小さく効き目の大きい仕事を先にやる。
  line now: login

step 残りを分ける
  say 残りを手間と効き目で分ける。
  line plan: pay
  line spare: word
```

```dragon
matrix 仕事を点数で打つ [shape: scatter]

axis 手間 [from: 小さい, to: 大きい]
axis 効き目 [from: 小さい, to: 大きい]

box now as 今やる
box plan as 計画する
box spare as 手が空いたら
box drop as やらない

item login as ログインを速く [x: 2, y: 8]
item pay as 決済を足す [x: 8, y: 7.5]
item word as 文言の直し [x: 3, y: 3]

step 並べる
  say 仕事と点数を左の表に並べる。

step ログイン
  say 手間が小さく効き目の大きい仕事を打つ。
  line: login

step 決済
  say 効き目も手間も大きい仕事を打つ。
  line: pay

step 文言
  say 手間も効き目も小さい仕事を打つ。
  line: word
```

集合の重なりの図 (`venn <題>`) は、最初の `step` の行より前に `item <名札> as <名前>` で集まりを 2 つか 3 つ書く。
段の中の `set <名札>: <数>` で集まりの全体の数を書くと、その段で円が現れ、円の外に名前と全体の数が出る。
`set <名札> & <名札>: <数>` で重なりの数を書くと、その段で重なりの区画が光る。区画の中には、全体と重なりの数から出したそれぞれだけの数が出る。
`set none: <数>` は、どれにも入らない数を円の外の枠に出す。重なりの数が重なる集まりのどれかの数より大きい図は誤りで止まる。
最初の行に `[shape: dots]` を足すと、円の代わりに点で数える見た目になる。集まりごとの群れと重なりの群れへ点が寄り、2つ以上に入る点は入る集まりの色の扇形で塗る。`[shape: dots, unit: <数>]` と書くと1点の件数を決められる。

```dragon
venn 朝と夜に走る人

item morning as 朝に走る
item night as 夜に走る

step 朝
  say 朝に走る人は30人いる。
  set morning: 30

step 夜と両方
  say 夜に走る人は20人で、そのうち5人は朝も走る。
  set night: 20
  set morning & night: 5

step どちらでもない
  say どちらにも走らない人は12人いる。
  set none: 12
```

量の行き先の図 (`sankey <題>`) は、最初の `step` の行より前に `box <名札> as <名前>` で出どころと行き先を書く。
段の中の `<出どころ> -> <行き先>: <量>` で、その段で出どころの棒から行き先の棒へ帯が伸び、量の札が帯を渡る。
線の名前の初めの数が量で、`40%` は 40、`1,200円` は 1200 と読み、帯の幅は出どころの棒のうちその量が占める割合の分になる。
数で始まらない名前、流れを辿ると元の箱へ戻る線、入る量より出る量の和が大きい箱は誤りで止まる。

```dragon
sankey お小遣いの使い道

box pay as お小遣い1万円 [color: slate]
box food as 食べる [color: amber]
box save as 貯める [color: green]
box fun as 遊ぶ [color: rose]

step 受け取る
  say 1か月のお小遣いは1万円。

step 食べる分
  say 半分の5,000円を食べる分に回す。
  pay -> food: 5,000円

step 残り
  say 3,000円を貯めて、2,000円で遊ぶ。
  pay -> save: 3,000円
  pay -> fun: 2,000円
```

図の種類の行に `[shape: rows]` を足すと、段ごとに図の幅いっぱいの帯を1行ずつ上から積む。
各行はその段までの線で分かれた区画に分かれ、その段で新しく分かれた区画と最後の行の区画に名前と量が出る。
出どころの無い箱のまだ分けていない残りは灰色の帯に `残り16時間` の形で出て、名前が区画に入らない区画は名前を帯の下に並べる。

```dragon
sankey 1日の使い方 [shape: rows]

box day as 1日 [color: slate]
box sleep as 寝る [color: blue]
box awake as 起きている [color: amber]
box work as 仕事 [color: violet]
box free as 自由な時間 [color: rose]

step 1日
  say 1日は24時間。

step 寝る
  say 8時間を寝る。
  day -> sleep: 8時間

step 起きている
  say 残りの16時間は起きている。
  day -> awake: 16時間

step 分ける
  say 起きている時間を仕事と自由な時間に分ける。
  awake -> work: 10時間
  awake -> free: 6時間
```

図の種類の行に `[shape: treemap]` を足すと、全量を1つの四角にし、段ごとに切る線を引いて量の面積に割る。
まだ分けていない残りは長い辺を量の割合で切り、同じ段に同じ出どころから書いた線は1つの帯を切り出して帯の中を書いた順に分ける。
行き先の区画をさらに分けると区画の枠と名前の札が残り、出どころの無い箱のまだ分けていない残りは灰色の区画に `残り48GB` の形で出る。

```dragon
sankey スマホの保存領域 [shape: treemap]

box all as 保存領域 [color: slate]
box photo as 写真 [color: blue]
box app as アプリ [color: green]
box game as 遊び [color: rose]
box work as 仕事 [color: blue]

step 保存領域
  say 保存領域は128GB。

step 写真とアプリ
  say 写真が48GB、アプリが32GBを使う。
  all -> photo: 48GB
  all -> app: 32GB

step アプリの内訳
  say アプリの32GBを遊びと仕事に分ける。
  app -> game: 20GB
  app -> work: 12GB
```

持ち主ごとのカードの図 (`cards <題>`) は、最初の`step`の行より前に`box <名札> as <名前>`で持ち主の列を、`item <名札> as <名前> in <列>, <列>`でカードを書く。
カードは`in`に書いた全ての列に写しが1枚ずつ載る。段の中の`item`はその段でカードを作り、在るカードの`item <名札> in <列>`はカードをその列へ動かす。
`delete <カード>`はカードを消し線で残し、`refuse <カードか列>: <理由>`は何も変えずに断られた札を出す。

```dragon
cards 商品券で払う

box aki as Aki [note: 客]
box shop as 店 [mark: 受け取り]

item g1 as 商品券#1 in aki [amount: 500円, mark: shop]
item g2 as 商品券#2 in aki [amount: 500円, mark: shop]
item c1 as 割引券 in aki [amount: 100円, total: none]

step 払う
  say Akiが商品券#1で払う。券は店の列へ動き、店の印が付く。
  aki -> g1: 払う
  item g1 in shop

step 断られる
  say 割引券は期限が切れているので使えない。
  aki -> c1: 使う
  refuse c1: 期限切れ

step 捨てる
  say 期限の切れた割引券を捨てる。合計に足さない券なので、合計は変わらない。
  delete c1
```

## 属性

行の終わりの `[ ]` の中に `<鍵>: <値>` を `,` で区切って並べ、見た目と運ぶ物を指定する。

| 付ける行 | 鍵 | 意味 |
|---|---|---|
| 図の種類と題 | `view` | 見せ方。`fixed` か `follow` |
| 図の種類と題 | `shape` | 量の図の見た目。`donut` か `bar`。量の図だけが持ち、必ず書く |
| 図の種類と題 | `note` | 箱の説明の見せ方。`pop` は押すと出る札で見せ、`under` は名前の下の字で見せる ([押すと出る札](#押すと出る札)) |
| 図の種類と題 | `scenes` | 場面の見せ方。`stack` は場面を縦に並べて同時に送り、`pick` は場面の名前の釦で選んだ場面を追う ([場面](#場面)) |
| 区画と箱 | `note` | 区画の添え書きか、箱の下の小さな字 |
| 区画と箱 | `color` | 色の役。`blue` / `amber` / `green` / `violet` / `rose` / `slate` / `coin` のどれか |
| 区画と箱 | `icon` | 名前の横に置く印 |
| 考え | `color` | 考えを広げる地図の考えの色。書ける色は区画と箱と同じ。枝に書くと線と葉が引き継ぎ、色を書かない枝には、ほかの枝が使っていない色が付く |
| 軸 | `from`、`to` | 2つの軸で置く図の軸の両端の字。`from` が小さい側 (横の軸は左、縦の軸は下)、`to` が大きい側。省くと端の字を出さない |
| 箱 | `example` | 箱の札の下に出す例。札で見せる図の、`note`を持つ箱だけが書ける |
| 箱 | `link` | 飛び先。描いた図で箱が飛び先への link になる。`/` で始まる path か、`http://` か `https://` で始まる URL か、`#` で始まる頁の中の場所 |
| 段の出典 | `url` | 出典の在り処。書ける形は `link` と同じ |
| 線 | `carry` | 線の上を走る物。`coin` か `none`。書かなければ封筒が走る |
| 線と帯の値 | `tag` | 線の上を走る札の字か、帯の欄に付ける札 |
| 線 | `side` | 線の名前を置く側。`above` / `below` / `left` / `right`。自動で決めた置き場所が崩れた時だけ書く |

`,` か `]` を含む値は `"` で囲み、囲みの中の `"` と `\` は `\"` と `\\` と書く。
`//` で始まる行と空行は読まない。

## 押すと出る札

時系列図、構成図、状態遷移図、枝分かれの図、時間軸の図、木の図、手順の図は、1行目に`[note: pop]`を書くと、箱の`note`を名前の下に描かず札で見せる。
`note`を持つ箱だけが右上に丸いiの印を持ち、長い説明を書いても箱は広がらない。
箱を押すと、そのすぐ下に箱の名前と`note`の全文を持つ札が出る。
札は札の外か閉じるのアイコンを押すと閉じ、段を送っても閉じる。
札で見せる図の箱には`example: <例>`も書け、札の下に灰色の帯で例が出る。
`[note: under]`は名前の下の字で見せ、書かない図と同じになる。
`note`のほかの値と、`note`を持たない箱か`[note: pop]`を書かない図の箱の`example`は、その行を名指して断る。
頁を印刷すると、全ての札が箱の下に開いて描かれる。
Markdownの頁では、上の行に`note: pop`を書くと、頁の全ての図が札で見せる。

```dragon
sequence 注文を受ける [note: pop]

box 店 [note: 注文を受けて在庫を確かめ、倉庫に出荷を頼む, example: 3個の注文を受けた日に倉庫へまとめて頼む]
box 倉庫 [note: 品物を預かって送る]

step 頼む
  say 店が倉庫に出荷を頼む。
  店 -> 倉庫: 出荷
```

## 場面

手順の図と列の図は、1つの図に場面を3つまで持てる。
箱と全ての場面に共通の段は1回だけ書き、その後ろに`scene <名前>`と`end`の間に、分かれる所から先のその場面だけの段を書く。
場面が止まる段の中に`stop <理由>`を書くと、場面はその段で止まって理由の文を出す。
見せ方は1行目の`[scenes: stack]`か`[scenes: pick]`で選び、書かなければ`stack`になる。
`stack`は場面を縦に並べ、同じ箱を全ての場面で同じ横の位置に描き、段を送ると全ての場面が同時に進む。
共通の段の線は灰色、場面の段の線は場面の色で描き、分かれる所に縦の点線を引く。
`pick`は場面の名前の釦を出し、押した場面の1段目に戻って、その場面の段だけを進める。
1行目に`[note: pop]`も書くと、札は押した場面の箱のすぐ下に開く。
頁を印刷すると、どちらの見せ方でも全ての場面を最後の段まで進めて縦に並べる。
4つ目の`scene`、`stack`と`pick`の外の`scenes`の値、ほかの図の種類の`scene`、`scene`の外の段の`stop`、`end`で閉じない`scene`は、その行を名指して断る。

```dragon
flow 送金の2つの場面 [scenes: stack]

box ask as 送金を頼む
box look as 宛先を確かめる
box send as 送る
box back as 差し戻す

step 頼む
  say 利用者が送金を頼む。ここまではどの場面も同じ段を通る。
  start -> ask

step 確かめる
  say 宛先が登録されているかを確かめる。ここから場面が分かれる。
  ask -> look: 宛先

scene 通る送金
  step 送る
    say 宛先が正しいので送る。
    look -> send: 正しい
end

scene 宛先が違う送金
  step 差し戻す
    say 宛先が違うので差し戻す。この場面はここで止まる。
    look -> back: 違う
    stop 宛先が登録されていない
end
```

## 誤りの文

読めない行は、行と列を示した誤りで止まる。
誤りの文の言葉は呼ぶ側が渡し (`parseNotation(text, { lang: "ja" })` や `dragon export --lang ja`)、渡さなければ英語で出す。
AI に書かせた記法も、誤りの文をそのまま AI に渡すと、示した行を直させられる。
箱を宣言しない図の似た名前は誤りにせず、図を描いたまま知らせる。知らせは `parseNotation` の結果の `notices` に誤りと同じ形で入り、書き出しの命令は標準エラーに出す。
前の形の行 (`時系列図` や `#` で始まる行) は、その行の新しい形を示す誤りで止まる。
前の形と新しい形の対応表は repo の `CHANGELOG.ja.md` にある。

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

## 図の種類

図の種類ごとに、上の行の形に足す行がある。節は README の図の種類の一覧と同じ順に並ぶ。

### 時系列図

`sequence <題>` で始めると時系列図になる。箱はそれぞれ縦の線を持つ相手で、段ごとに相手の間でやり取りを順に送る。

- `box <名札> as <名前> [note: <説明>]` は相手。`box` の行の無い図は、線に出る名前ごとに相手を作る
- `<送る側> -> <受ける側>: <名前>` はやり取り。線の上を運ぶ物は属性の `carry` と `tag` で書く
- `step` の行の無い図は、線を 1 本ずつ段にする

#### 時系列図の配管の見た目

時系列図の最初の行に `[shape: pipe]` を足すと、配管の図の部品で描く。生存線は管になり、箱は管の上に載る。
この見た目では、最初の段より前の `hold <持ち主>: <量> <トークン>` の行で、箱の下に持ち主の残高を置ける。`[shape: pipe]` を書かない時系列図は `hold` を断る。
見た目を書かない時系列図は今の見た目のまま描く。
`@cardenelabs/dragon/light` では `loadFor` がこの見た目を別の塊として読むので、今の見た目だけを描く頁が読む量は増えない。

時系列図の線の行は、どちらの見た目でも `[op: <番号>]` で線を起こした操作の番号を持てる。描いた線は `data-op` に段と番号を `0/3` の形で持ち、図を置いた頁が線と記録やコードの行を結ぶのに使える。ほかの種類の図の線には書けない。

```dragon
sequence USDCを送る [shape: pipe]

box alice as Alice
box usdc as USDC
box bob as Bob

hold alice: 100 USDC
hold bob: 0 USDC

step Aliceがtransferを呼ぶ
  say AliceがUSDCのtransferを呼び、Bobへ10を送る。
  alice -> usdc: transfer(to: bob, amount: 10) [carry: none, op: 3]
  alice -> bob: 10 USDC [carry: coin, op: 4]

step USDCが戻る
  say USDCがtrueを返す。
  usdc -> alice: true [carry: none, op: 5]
```

### 構成図

`architecture <題>` で始めると構成図になる。箱は仕組みの部品で、区画が箱をまとめ、段ごとに箱の間の線に沿って物を運ぶ。

- `group <名札> as <名前> [note: <説明>]` で区画を開き、`end` で閉じる。間に書いた `box` の行の箱を区画の中に置く
- `box <名札> as <名前> [note: <説明>, icon: <絵柄>]` は部品
- `<送る側> -> <受ける側>: <名前> [tag: <字>]` は、その段で線に沿って札を動かす

### 状態遷移図

`state <題>` で始めると、1 つの物が状態を移る様子を段ごとに追う状態遷移図になる。箱が状態で、線は状態から状態への移り変わり。
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

`git <題>` で始めると、git の枝に commit を積み、取り込むまでを段ごとに追う枝分かれの図になる。枝は `branch <枝>` の行で上から順に宣言し、枝ごとに帯が並ぶ。
段の中では `commit <名札> on <枝>` で枝の先に commit を積み、`copy <元>` で当て直しの commit を、`merge <枝>` で merge commit を作る。`hash` と `note` で丸の外に hash と一言を添える。
`<枝> from <commit>` で `from` の後ろの commit から枝を切り、`HEAD` はその枝へ移る。`<枝> -> <commit>` か `HEAD -> <commit>` で、commit を作らずに枝の札か `HEAD` を動かす。どの札からも辿れなくなった commit は点線の丸に変わる。
`delete <枝>` で枝を消す。消した段から後はその枝の札が図から消え、帯は残る。`HEAD` が指している枝は消せないので、先に `HEAD` を別の枝へ移す。

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

`time <題>` で始めると、決まった間隔で進む時間の上で、出来事がどの目盛りで起きたかを段ごとに追う時間軸の図になる。`scale <単位> <長さ> <数>` で目盛りを宣言し、`period <名前> <目盛りの数>` で区切りを、`row <名札>` で印の列を、`point <名札> at <目盛り>` で軸の下の節目を、`zoom <範囲>` で上の帯に拡大する目盛りを宣言する。
段の中では `now -> <目盛り>` で針を進める。針は目盛り 1 つを決まった速さで進み、過ぎた目盛りの印がその時に出る。`mark <列> <範囲>` で印の色を変え、`span <範囲>: <字>` で軸の下に範囲の括弧か、印の列を囲む枠を出す。
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

工程表のように作業の期間を見せる時は、最初の `step` より前に `task <名札> as <名前> <範囲> [color: <色>]` を書く。
作業は1つずつ自分の行を持ち、範囲の目盛りの上に続いた太い棒で描かれる。範囲は `mark` と同じく0から数える目盛りで、`0-2` か `13` と書く。
行の左に作業の名前、棒の中に `1〜3日` のように始まりと終わりの目盛りの名前で期間が出て、針が通った分の棒が濃く塗られる。
作業を持つ図は `row` を書かなくてよく、`row` と並べる時は宣言した順に上から並ぶ。

```dragon
time リリースまでの工程

scale 日 1d 14 [from: 1]

task design as 設計 0-2 [color: blue]
task build as 実装 3-8 [color: violet]
task test as テスト 7-10 [color: amber]
task ship as リリース 13 [color: green]

step 実装とテスト
  say 4日目から実装し、8日目からテストを重ねて進める。
  now -> 10
```

### 木の図

`tree <題>` で始めると、葉の値を親へ畳み上げて1つの根にまとめる構造を段ごとに追う木の図になる。段の中の `leaf <名札> [hash: <値>]` で葉を、`node <名札> of <子>, <子> [hash: <値>]` で親を書くと、書いた段で箱が現れる。
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

### 列の図

`lineup <題>` で始めると列の図になり、列の中の札を段ごとに追う。1 行目の属性の `shape` で、次の見た目のどれかを選ぶ。

#### 列の図のボードと流れの線の見た目

`lineup <題>` で始めると、列に並ぶチップを段ごとに追う列の図になる。
既定はボードの見た目で、最初の行に `[shape: stations]` を足すと流れの線の見た目になる。

- ボードは箱を書いた順に左から淡い色の縦の帯として並べ、帯の中にチップを札として上から積む。帯の見出しには名前と札の数が並ぶ
- 箱に `[limit: <数>]` を書くと、札の数を `2/3` の形で出す。ボードは見出しの下に上限の数の目盛りを並べて札の数だけ塗り、流れの線は空いた席を点線の受け口で示す
- `[order: none]` の箱は名前の下に「順番なし」の札を出し、札に番号を付けない。段の中の `note <列>: <字>` は名前の下に値の札を出し、同じ列の次の `note` まで残る
- `line` でチップが前の列へ戻ると差し戻しになる。戻りの線と「差し戻し」の札を引き、札に戻る印を付け、元の列に抜けた跡を点線で残す
- `:` の後ろに何も書かない `line <列>:` は、その列を空にする
- 流れの線は箱を1本の線の上の駅として並べ、札を駅の下に積む。`seal` と `open` と `pick` と `stamp` を描かないので、書くと断る

携帯の幅では、ボードは帯を上から積んで札を1行に2枚ずつ並べ、流れの線は線を図の左に縦に引く。

```dragon
lineup 変更を本番へ出す流れ [shape: stations]

box 開発
box レビュー [color: violet]
box ステージング [color: amber, limit: 2]
box 本番 [color: green, order: none]

item ログイン, 検索

step レビューに出す
  say 2件の変更をレビューに出す。
  line レビュー: ログイン, 検索

step ステージングで確かめる
  say レビューを通した2件をステージングに載せる。ステージングは2件で埋まる。
  line ステージング: ログイン, 検索
  line レビュー:

step 問題が出たら差し戻す
  say 検索に問題が出たので開発へ差し戻し、ログインだけを本番へ出す。
  line 開発: 検索
  line 本番: ログイン
  line ステージング:
```

#### 列の図の層の見た目

`lineup <題>` で始めると、列に並ぶチップを段ごとに追う列の図になる。
最初の行に `[shape: layers]` を足すと、箱を横の層として重ね、1件の頼みや取引が層を下りていく流れを描く。

- 箱は書いた順に上から重なる。帯の左に層の名前と `note` の説明と層の番号が並ぶ。層は8つまで書け、層の間に矢印は描かない
- 段の中の `line <層>: <チップ>` はチップの居る層。チップの居る帯を最も濃く描き、通った帯は光ったまま残る
- `note <層>: <字>` はその層の印で、層でした事や掛かった時間を書く。同じ層の次の `note` まで残る
- `note` を持つチップは、札の2行目にその字を出す
- 層の見た目は `[order: none]` と `role` と `seal` と `open` と `pick` と `stamp` を描かないので、書くと断る

幅の狭い枠では、印と札を層の名前と説明の下に置く。

```dragon
lineup L2の取引が確定するまで [shape: layers]

box wallet as ウォレット [note: 鍵で署名する, color: violet]
box l2 as L2 (ロールアップ) [note: 取引をまとめて縮める, color: amber]
box l1 as L1 (Ethereum) [note: 戻せなくなるまで待つ, color: green]

item 取引 [color: blue, note: 100 USDCを替える]

step ウォレットが署名する
  say 取引を持ち主の鍵で署名する。
  line wallet: 取引
  note wallet: 1秒で署名した

step L2がまとめる
  say L2がほかの取引とまとめ、数秒で結果を返す。
  line l2: 取引
  note l2: 2秒でまとめた

step L1で確定する
  say L1のブロックが確定すると、取引はもう戻せない。
  line l1: 取引
  note l1: 13分で確定した
```

#### 列の図の階段の見た目

最初の行に `[shape: stairs]` を足すと、層の見た目の層を、下の層ほど同じ幅だけ右へずらした階段に置く。
層の見た目と同じ `box` と `item` と `line` と `note` の行で書き、層の見た目と同じ行を断る。

- `box <名札> as <名前> [time: <長さ>]` はその層で掛かった時間で、数と単位 (`ms`、`s`、`min`、`h`、`d`) の組で書く。`time` は全ての箱に書くか、どの箱にも書かない。時間の掛からない層は `0s` と書ける
- `time` を書いた図は、階段の右に経った時間の目盛りを置く。数字は0から切りのよい間隔 (1、2、5に10の累乗を掛けた数) で、単位は箱に書いた中で一番大きい単位
- 目盛りの針は段ごとに、チップが下りた層までに経った時間 (その層の時間を含む) の所へ進み、`1分3秒` のような札を添える
- 層と層の間に、チップが歩く線は描かない

携帯の幅では、階段を幅いっぱいに描き、目盛りを図の下に横向きで置く。

```dragon
lineup 動画が見られるようになるまで [shape: stairs]

box upload as 送る [note: 動画を置き場へ送る, color: violet, time: 40s]
box encode as 変換する [note: 画質ごとの動画に作り直す, color: amber, time: 3min]
box viewer as 見る人の端末 [note: 動画を再生する, color: green, time: 3s]

item 動画 [color: blue, note: 旅行の動画]

step 送る
  say 動画を端末から置き場へ送る。
  line upload: 動画

step 変換する
  say 置き場が動画を4つの画質に作り直す。
  line encode: 動画

step 再生する
  say 見る人の端末が再生を始める。
  line viewer: 動画
```

### 試す図

`try <題>` で始めると、読み手が値を打ち込み、釦を押して動かせる試す図になる。部品の行を最初の段より前に上から並べて書くと、その順に上から積んで描く。

- `route <名札>: <節> - <節> - ..., ... [from: <節>, to: <節>]` は網。送ったチップを `from` から `to` まで最短の道で運ぶ
- `queue <名札> [order: <欄>, accept: <名前>]` は待ち行列。`order` の欄の値の高い順に上から並べる。`accept` を書くと、入力の帯はその名前のチップだけをこの待ち行列へ送れ、ほかの名前では送る釦を押せない。名前を 2 つ以上書く時は `accept: "<名前>, <名前>"` と囲む。最初の欄に `choose` の行を書いた時は、`accept` の名前をその選択肢から選ぶ
- `chain <名札> [edit: <欄>]` は機械の列。ブロックは 1 つ前のブロックの `hash` を `prev` に持ち、`edit` を書くと読み手がブロックの中のチップのその欄を書き換えられる
- `log <名札> [all: <欄> = <値>, yes: <印>, no: <印>]` は記録の列。釦がまとめたチップを番号の付いた記録に並べ、機械の列と違って `prev` と `hash` を持たない。`all` を書くと、記録の中のチップのその欄が全てその値なら `yes` の印を、1 つでも違えば `no` の印を記録に出す
- `ask <欄>, <欄>, ... [into: <待ち行列か欄>, via: <網>]` は入力の帯。最初の欄の値がチップの名前になる。`into` に欄を書くと、送ったチップはその欄の値と同じ名札の待ち行列へ入る。その欄には `choose` の行を書き、`choose` の値ごとに同じ名札の待ち行列を置く
- `choose <欄>: <値>, <値>, ...` はその欄の選択肢。読み手は値を打たずに、書いた順に並ぶ選択肢から選ぶ。最初の欄にも書け、ブロックの中のチップを書き換える欄も同じ選択肢から選ぶ
- `press <名札> [from: <待ち行列>, into: <機械の列か記録の列>, take: <件数>, at: <部品>]` は釦。待ち行列の上から `take` 件を新しいブロックか新しい記録へ移す。`from: "<待ち行列>, <待ち行列>"` と 2 つ以上の待ち行列を書くと、書いた順にそれぞれの上から `take` 件ずつを 1 つのブロックか記録にまとめ、どれかの待ち行列が `take` 件に満たない間は押せない。`at` を書くとその部品の所に置き、書かなければ入力の帯に置く
- `side <部品>, <部品>, ...` は、枠が広い時に網と待ち行列と機械の列と記録の列のうち書いた部品を、書いた順に左から 1 つの行に並べる。待ち行列はチップが入る幅だけを取り、残りの幅を網と機械の列と記録の列に渡す。横に並べると字が読める大きさより小さくなる枠では、この行が無い時と同じく上から積む
- `check <節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>]` は網の節の関門。節は `ask` の `via` の網の最短の道の節で、送ったチップは着いた節の関門を書いた順に確かめ、条件が成り立たない最初の関門でその節に止まる。止まったチップはどの待ち行列にも入らず、`all` を持たない `into` の記録の列に、チップと止まった節と `no` のエラーの名前と再試行できるかを持つ記録が 1 件増える。比べ方は `>=`、`<=`、`>`、`<`、`==`、`!=`。値が数なら欄の値も数として比べ、数でない欄の値は通らない。数でない値は `==` と `!=` で字として比べる。`retry` を書いた関門の記録には「再試行できる」の印が、書かない関門の記録には「直して送り直す」の印が付く

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

`pipe <題>` で始めると、1 つのトランザクションの中で、Contract の呼び出しと残高と記録の値が段ごとにどう動くかを追う配管の図になる。
関係者は `box` で宣言する。送り手、Contract、トークンの Contract、口座のどれかは行から決まるので書かない。

- `hold <持ち主>: <量> <トークン>, <量> <トークン>` は最初の段より前に書く残高で、`hold <持つ Contract>: <名前> <値>` は残高でない値。トークンは `box usdc as USDC` のように宣言した関係者の名前で書き、ETH は宣言せずに書ける。量として読める名前と `[` を含む名前は `"` で囲む
- `<呼ぶ者> -> <呼ばれる者>: <字>` は呼び出し。`[value: <量> ETH]` で ETH を添えて送り、`[call: delegate]` で呼ばれた側の処理を借りて呼んだ側の値に書き、`[call: static]` は書き込めない呼び出しになる。`[fold]` を付けると内側の段を 1 つの箱に畳み、押すと開く
- `return <戻る者>: <値>` はいちばん内側で開いている呼び出しを閉じ、`revert <者>: <理由>` はその呼び出しを落として内側の変更だけを元へ戻す
- `move <トークンの Contract>: <量> <送り手> -> <受け手>` はトークンの管を通して残高を移し、`write <者>: <名前> <値>` は値の札を書き替える
- `mint <トークンの Contract>: <量> -> <受け手>` は発行で受け手の槽だけを増やし、`burn <トークンの Contract>: <量> <持ち主>` は焼却で持ち主の槽だけを減らす。ゼロのアドレスを関係者として描かない
- NFT と ERC-1155 は `#` の後をトークンの番号、前を数にして、`move art: #1 alice -> bob`、`move items: 2 #1 alice -> bob`、`mint art: #3 -> alice`、`hold alice: 5 #1 ITEMS` のように書く。数を省くと 1 つで、番号ごとに槽を持つ。`#` の後に番号の無い行は誤りとして止まる
- `check <者>: <左> <比べ方> <右>` は確認で、比べ方は `>=`、`<=`、`==`、`!=`、`>`、`<`。両側が数なら dragon が比べ、数でない確認は `[fail]` を書いた時だけ落ちる
- `emit <者>: <名前>(<引数>, ...)` はイベントで、`calc <者>: <入る値> -> <出る値>` は換算
- 最初の段より前の `layout <形>` は、トークンの箱と槽の置き方を選ぶ。`top` と `bottom` はトークンの箱を人の列の上か下に置き、`ledger`、`mesh`、`bus` は槽をトークンごとの行に並べ、`auto` はトークンの箱が4つまでの図で `top` と `bottom` と箱の並びを試し、線の交わりが最も少ない形を選ぶ。置き場所は `box` と `hold` の行だけで決まるので、呼ぶ人や引数を替えても箱と槽は動かず、呼び出しに関わらない人と箱は薄く描く。トークンの箱が無い図は人の上に箱と札入れの高さを空けないので、呼び出しの札が出る図では札の高さの分だけ人と槽が下に来る
- `gist <要点>` はその段の要点で、図の下の段の矢印の後ろに要点の札を出す。配管の図は段の本文を図の下に出さないので、本文だけで伝えていた要点はここに書く。1 つの段に 1 行まで書け、配管の図でない図には書けない
- `box <トークン> as <名前> [note: <字>]` は、トークンの箱の名前の下に出す字。書かない箱は `balanceOf` を描く。`hold` の行で量の単位に名前を書いた箱にだけ書け、人の箱と契約の箱に書くと誤りで止まる

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
  gist 一番外の呼び出しが戻った時に、全ての変更が確定する
  write ex: "swaps[alice]" 1
  emit ex: Swapped(alice, 3200)
  return ex: 3200 USDC
```

### 量の図

`chart <題>` で始めると、項目どうしの大きさを段ごとに比べる量の図になる。見た目は最初の行に書く。
`chart <題> [shape: donut]` は項目ごとの割合をドーナツの弧の角度で描き、`chart <題> [shape: bar]` は項目ごとの量を横棒の長さで描く。

- `item <名札> as <名前> [color: <色>]` は最初の段より前に書く比べる項目。ドーナツは宣言した順に 12 時の向きから時計回りに弧を並べ、凡例に名前と整数に丸めた割合を出す。横棒は上から棒を並べ、棒の左に名前を出す。`color` を書かない項目には宣言した順に色を配り、項目は 1 つ以上、8 個まで書ける
- `set <名札>: <値>` は段の中に書く項目の値で、0 以上の数を単位を付けずに書く。`set` を書かない項目は前の段の値を保ち、まだ値の無い項目は弧も棒も出さない

段を送ると、弧と棒は前の段の値から新しい値へ動く。横棒は全ての段で一番大きい値の棒を一番長くし、棒の端に値を出す。
見た目は段ごとに替えず、量の図には `box` と `group` と `strip` と線を書けない。

`chart <題> [shape: funnel]` は段を進むほど数が減る漏斗を描く。段を上から `item` で宣言し、段の数を `set` で書く。
段の棒は値を書いた段で現れ、左端を揃えて、長さを最初の段の値に比べて決める。前の段との差は薄い棒で残して去った数を書き、段の数の右に前の段に対する割合を出す。
最後の段では、最初の段のうち最後の段まで残った割合の行を足す。前の段より大きい値と、どの段にも値を書かない段は、記法を読む時に誤りになる。

```dragon
chart 店で買うまでの人数 [shape: funnel]

item visit as 店を訪れた [color: blue]
item view as 商品を見た [color: violet]
item buy as 買った [color: green]

step 訪れる
  say 店のサイトを10,000人が訪れた。
  set visit: 10000

step 商品を見る
  say 商品の頁まで進んだのは4,200人だった。
  set view: 4200

step 買う
  say 買ったのは380人だった。
  set buy: 380
```

`chart <題> [shape: dots]` は件数を点の数で数えて見せる。
最初の段の前から全体の箱に空の点を並べ、項目に件数を書いた段で、その件数の分の点が箱から項目の群れへ寄る。
1点が何件かは、点が100個ほどになる数 (1か2か5に10の累乗を掛けた数) を図が選び、箱の上に全体の件数と並べて出す。
最初の行を `chart <題> [shape: dots, unit: <数>]` と書くと1点の件数を決められ、1つの段で点が200個を超える値は記法を読む時に誤りになる。
ドーナツと横棒と点で数える見た目は、段の中の `set none: <数>` でどの項目にも入らない数を書ける。
点で数える見た目ではその点が灰色のまま箱に残り、ドーナツと横棒では項目の後ろに灰色の弧か棒で描く。漏斗と折れ線は `set none` を断る。

```dragon
chart 1,000人に聞いた端末 [shape: dots]

item i as iPhone
item a as Android
item w as Windows
item m as Mac

step iPhone
  say いちばんよく使う端末がiPhoneの人は412人で、点41個になる。
  set i: 412

step Android
  say Androidの人は287人で、iPhoneの次に多い。
  set a: 287

step Windows
  say Windowsのパソコンの人は158人だった。
  set w: 158

step Mac
  say Macの人は93人で、点9個になる。
  set m: 93

step どれも使わない
  say どれも使わない50人は、点が灰色のまま全体の箱に残る。
  set none: 50
```

`chart <題> [shape: line]` は時間につれて量がどう変わったかを折れ線で描く。
`item` の行が色の違う1本の線になって図の上の凡例に名前が出て、`step` の行が時間の軸の点の1つになり、段の題が横の軸の名前になる。
`set <名札>: <値>` はその段の項目の値で、`set` を書かない段は前の段の値を保つ。
縦の軸は0から、一番大きい値を1か2か2.5か5に10の累乗を掛けた刻みで切り上げた上端までにする。
段を送ると、線が前の段の点から新しい段の点へ伸び、その段の値が点の近くの線に掛からない所に出る。
段は2つ以上書き、どの段にも値を書かない項目と `set none` は記法を読む時に誤りになる。

```dragon
chart ベーカリーの1週間の売り上げ (円) [shape: line]

item shop as 店頭 [color: amber]
item online as 通販 [color: blue]

step 月
  say 週の初めは、店頭が42,000円、通販が12,000円だった。
  set shop: 42000
  set online: 12000

step 火
  say 雨の火曜は、店頭が38,000円に減り、通販が15,000円に増えた。
  set shop: 38000
  set online: 15000

step 水
  say 水曜は、店頭が45,000円に戻った。
  set shop: 45000
```

```dragon
chart 窓口ごとの問い合わせの件数 [shape: bar]

item mail as メール [color: blue]
item chat as チャット [color: green]
item phone as 電話 [color: amber]

step 4月
  say 問い合わせの多くはメールで来る。
  set mail: 120
  set phone: 64

step 5月
  say チャットの窓口を開き、電話が減る。
  set mail: 104
  set chat: 38
  set phone: 58
```

### 手順の図

`flow <題>` で始めると、手順を上から下へ追い、判断で道が分かれる手順の図になる。
段が通る箱と判断は、線が初めて辿り着く順に上から下へ 1 列に並び、判断がほかへ送る道は判断の右へ出る。

- `box <名札> as <名前>` は手順の 1 つ
- `choice <名札> as <問い>` は判断で、問いを中に書いたひし形になる。長い問いは助詞か空白の後で 2 行に折る。判断から出る線の名前が答えになり、出る道は 2 つまで
- 始まりの印から出る線は送る側に `start`、終わりの印へ入る線は受ける側に `finish` と書く
- 最初の `step` より前に書いた線は今回は通らない道で、点線で残る。段の線が 1 本も辿り着かない箱は縁が点線になり、名前も薄い色で書く
- 段で動く線は青く引かれ、その上を点が走って着くと消える。通り終えた線は濃い色で残り、点が着いた判断は琥珀の薄い色で塗られる。`carry` と `tag` を書かない線では、封筒の代わりにこの点が走る

```dragon
flow ログインの判断

box input as 入力
choice pw as パスワードは正しい？
choice otp as 2FAは正しい？
box done as ログイン [color: green]
box err as エラーを出す [color: rose]

pw -> err: いいえ
otp -> err: いいえ

step 入力する
  say 利用者がIDとパスワードを入れる。
  start -> input

step パスワードを確かめる
  say サーバーがパスワードを照らし合わせる。
  input -> pw: 送る

step 2FAを確かめる
  say パスワードが合ったので、2FAのコードを確かめる。
  pw -> otp: はい

step ログインする
  say コードも合い、ログインが済む。「いいえ」の道は点線のまま残る。
  otp -> done: はい
  done -> finish
```

### 回り続ける図

`cycle <題>` で始めると、同じ手順を何度も回る流れを段ごとに追う回り続ける図になる。
手順は書いた順に輪の真上から右回りに並び、隣どうしを弧の矢印で結ぶ。

- `box <名札> as <名前>` は輪の上の手順で、最初の `step` より前に書く。手順は 2 つから 8 つまで書ける
- 段の中の `<名札> -> <名札> [tag: <字>]` は輪の次の手順への線。その段で札が弧に沿って次の手順へ走り、走った弧と矢じりは受ける側の手順の色で光ったまま残る
- 最後の手順から最初の手順への線も次の手順への線で、そこから次の回に入る。1 つ飛ばす線、逆回りの線、同じ手順へ戻る線と、`: <名前>` を付けた線は誤りで止まる。`act` と `group` の行も書けない
- 段の番号は、その段で札が着いた手順の箱の横に出る。線の無い段は、前の段の手順の箱の横に出る
- `strip <題>: <欄>, <欄>` を書くと、輪の真ん中に帯の題と欄の値が出る。段の中の `set <欄>: <値>` で値が入れ替わる。最初の欄の値は大きく、2 つ目からの欄の値は小さく出て、欄の名前は出ない。最初に書いた後で変わった値は、変わった段の間だけその段の手順の色で出る

```dragon
cycle 週の振り返り

box plan as 決める [note: 週の初め, color: blue]
box work as 進める [note: 毎日, color: green]
box look as 振り返る [note: 週の終わり, color: amber]

strip 週: 回, 曜日

step 決める
  say 週の初めに、その週にやることを決める。
  set 回: 第1週
  set 曜日: 月曜

step 進める
  say 決めたことを毎日進める。
  plan -> work [tag: やること]
  set 曜日: 火曜から木曜

step 振り返る
  say 週の終わりに、進んだことと残ったことを振り返る。
  work -> look [tag: 進み]
  set 曜日: 金曜

step 次の週へ
  say 残ったことを持って、次の週の決めることへ戻る。
  look -> plan [tag: 残り]
  set 回: 第2週
  set 曜日: 月曜
```

`cycle <題> [shape: clock]` と書くと、手順を輪の代わりに時計の文字盤に置く。

- 手順の `box` には `[time: 25min]` の形で手順の長さを書く。長さは 0 でない数と単位 (`ms`、`s`、`min`、`h`、`d`) の組で、どの手順にも書く。手順は 12 時から右回りに、長さに合わせた弧で並ぶ
- 文字盤の外の目盛りには、書いた中で一番大きい単位で 0 から切りのよい間隔の数字が出る。針は 1 本で、段ごとにその段の手順の弧の始まりを指し、線の札は針の先に乗って走る
- その回 (針が 12 時を越えるまで) に入った手順の弧は、手順の色で光ったまま残る
- `[shape: clock, turn: left]` と書くと文字盤が左回りになる。`turn` は `[shape: clock]` の図にだけ書ける
- 携帯の幅では、文字盤の外に手順の名前の代わりに手順の番号が出て、番号と名前と長さの一覧が文字盤の下に並ぶ

```dragon
cycle 集中と休みの時間割 [shape: clock]

box focus as 集中する [time: 25min, color: blue]
box short as 短く休む [time: 5min, color: green]
box review as 振り返る [time: 10min, color: amber]
box long as 長く休む [time: 20min, color: rose]

strip 時間割: 回, 集中した時間

step 集中を始める
  say 通知を切り、手元の作業に25分集中する。
  set 回: 1回目
  set 集中した時間: 0分

step 短く休む
  say 25分たったら手を止め、5分だけ立って体を伸ばす。
  focus -> short [tag: 25分]
  set 集中した時間: 25分

step 振り返る
  say 休みを終えたら、進んだ所と詰まった所を10分で書き出す。
  short -> review

step 長く休む
  say 書き出したら、20分しっかり休んで頭を空ける。
  review -> long [tag: メモ]

step 次の回へ
  say 休みを終えて、2回目の集中を始める。
  long -> focus
  set 回: 2回目
```

`cycle <題> [shape: band]` と書くと、輪を開いた帯に手順を左から右へ並べる。

- 手順は書いた順に等しい幅の山形で並ぶ。名前は山形の下に、段の番号は山形の上に出る
- どの `box` にも `[time: <長さ>]` を書くと、帯の上に手順の始まる時刻の目盛りが 0 から出る。目盛りの字は、どの時刻も整数か小数 1 桁で書ける一番大きい単位で書く。長さはどの手順にも書くか、どの手順にも書かない
- 回ごとに帯が 1 本ずつ上から下へ積まれ、まだ来ていない回の帯は薄く出る。帯の頭には中身の帯の題と、その回の欄の値が出る
- 線の札は帯の真ん中を山形から次の山形へ走り、着いた山形は光ったまま残る。最後の手順から最初の手順への線の札は、右の端から下の回の帯の左の端へ戻る矢印を辿る
- `turn` は `[shape: band]` の図には書けない
- 携帯の幅では山形が縮んで中に手順の番号が出て、番号と名前と長さの一覧が帯の下に並ぶ

```dragon
cycle 畑の1年 [shape: band]

box sow as 種をまく [time: 60d, color: green]
box grow as 育てる [time: 120d, color: blue]
box harvest as 収穫する [time: 60d, color: amber]
box rest as 土を休める [time: 120d, color: slate]

strip 畑: 年, 季節

step 種をまく
  say 春に土を耕し、畑へ種をまく。
  set 年: 1年目
  set 季節: 春

step 育てる
  say 芽が出たら、夏の間は水をやって苗を育てる。
  sow -> grow [tag: 苗]
  set 季節: 夏

step 収穫する
  say 秋に実った作物を収穫する。
  grow -> harvest [tag: 実]
  set 季節: 秋

step 土を休める
  say 収穫を終えた畑に堆肥をまき、冬の間は土を休める。
  harvest -> rest [tag: 堆肥]
  set 季節: 冬

step 2年目へ
  say 春が来たら、休めた土にまた種をまく。
  rest -> sow [tag: 種]
  set 年: 2年目
  set 季節: 春

step 2年目も育てる
  say 2年目も、芽が出た苗を夏の間に育てる。
  sow -> grow [tag: 苗]
  set 季節: 夏
```

### 考えを広げる地図

`mind <題>` で始めると、真ん中の題から枝を広げて考えを書き出していく考えを広げる地図になる。
枝は書いた順に左上から右回りに伸び (4 つなら左上、右上、右下、左下)、枝の葉は枝の外側に縦に並ぶ。

- 段の中の `idea <名札> as <名前>` は真ん中の題。`of` の無い考えは 1 つだけ書け、2 つ目を書いた時と 1 つも書かない時は誤りで止まる
- 段の中の `idea <名札> as <名前> of <親>` は親に繋がる考え。題に繋げると枝、枝に繋げると葉になる。考えは題、枝、葉の 3 段まで書け、4 段目と、まだ書いていない親は誤りで止まる
- `as <名前>` は省け、省くと名札が名前として出る。語の `of` を含む名前は `"` で囲む
- `[color: <色>]` で考えの色を決める。色を書かない枝には、ほかの枝が使っていない色が書いた順に付き、葉は枝の色を引き継ぐ
- 考えと線は初めから薄く出ていて、書いた段で濃くなる。親からの線はその段で親の側から引かれ、段の番号はその段の最初の考えの横に出る
- `box`、`strip`、箱どうしの線、`act` の行は書けない

```dragon
mind 勉強会の準備

step 題を置く
  say 準備することを真ん中に置く。
  idea meetup as 勉強会

step 話の枝
  say 話す中身を枝に出し、話の組み立てを葉に書き出す。
  idea talk as 話すこと of meetup [color: blue]
  idea intro as はじめの5分 of talk
  idea demo as 動かして見せる of talk

step 場所の枝
  say 場所も同じく枝と葉にする。
  idea room as 場所 of meetup
  idea seats as 席の数 of room
  idea screen as 映す画面 of room
```

### 表どうしの関係の図

`er <題>` で始めると、1 つの値がどの表のどの行を辿るかを段ごとに追う表どうしの関係の図になる。
表は書いた順に左から右へ横 1 列に並び、結びを書いた項目の行から、指した項目の行へ線を引く。

- `table <名札> as <名前>` は表で、最初の `step` より前に書く。次の `table` の行までの `field <名前>: <値>` の行がその表の項目になる。表は 1 つから 6 つまで書け、`[color: <色>]` で表の色を決める
- 項目の `[key]` は鍵の印 (PK) で、`field <名前>: <値> [ref: <表>.<項目>]` は別の表の項目への結び (FK) になる。結びを書いた項目が何件もの側で線の端に三つ叉が付き、指した項目が 1 件の側で縦の棒が付く。無い表か無い項目を指すと誤りで止まる
- 段の中の `pick <表>.<項目>` はその段で行と表の枠を光らせ、表の枠は後の段でも細く色を残す
- `<表>.<項目> -> <表>.<項目> [tag: <値>]` は結んだ項目どうしの線に沿って値の札を走らせ、札は線の真ん中で止まる。結んでいない項目どうしの線と、`: <名前>` を付けた線は誤りで止まる
- `set <表>.<項目>: <値>` はその段から項目の値を書き換える。`note <表>.<項目>: <文>` はその段から表の下に式の札を出し、同じ表の札は下へ積む
- 段の番号は、その段で行を選んだ表の見出しの右に出る

```dragon
er 注文から客を引く

table users as 客
  field id: U-7 [key]
  field 名前: 田中
  field 注文の数: 2

table orders as 注文
  field id: O-41 [key]
  field 客id: U-7 [ref: users.id]
  field 金額: 1200円

step 注文を引く
  say 注文O-41の行を引く。
  pick orders.id

step 客を辿る
  say 注文の客idを結びに沿って辿り、客U-7の田中さんの行を引く。
  orders.客id -> users.id [tag: U-7]
  pick users.id

step 数を増やす
  say 田中さんの注文の数を1つ増やす。
  note users.注文の数: 2 + 1 = 3
  set users.注文の数: 3
  pick users.注文の数
```

### 2つの軸で置く図

`matrix <題>` で始めると、2つの物差しで課題を4つの区画に段ごとに分ける2つの軸で置く図になる。
横の軸は区画の下を左から右へ、縦の軸は区画の左を下から上へ引き、課題は段で置かれるまで区画の左の一覧に並ぶ。

- `axis <名前> [from: <小さい側>, to: <大きい側>]` は軸で、最初の `step` より前に横の軸、縦の軸の順に書く。軸の名前と両端の字は矢印の外に出る。軸が 2 本でない図は誤りで止まる
- `box <名札> as <名前>` は区画で、ちょうど 4 つ書く。書いた順に左上、右上、左下、右下に並び、名前は区画の左上に出る。区画が 4 つでない図は誤りで止まる
- `item <名札> as <名前>` は分ける課題で、最初の `step` より前に書く。課題は「まだ置いていない」の一覧に書いた順に並ぶ
- 段の中の `line <区画>: <課題>, <課題>` は課題を区画へ置く。その段で札が一覧から区画へ滑り、区画が光る。置いた札は後の段で別の区画へ置き直すまで残る。無い区画か課題と、1 行に同じ課題を 2 度書いた行は誤りで止まる
- `as <名前>` を省くと名札がそのまま名前になる。箱どうしの線と `strip` の行は書けない
- `item <名札> as <名前> [x: <横>, y: <縦>]` は課題に0から10の点数を小数1桁まで書く。段の中の `line: <課題>` は区画を書かずに、点数から決まる区画へ課題を置き、軸ごとに5以上を大きい側に数える。点数を持つ課題を `line <区画>: <課題>` で置く行は、点数の区画と同じ時だけ読む。0から10の外の点数と、片方だけの点数は誤りで止まる
- 軸の行に `reverse: yes` を足して `axis <名前> [from: <小さい側>, to: <大きい側>, reverse: yes]` と書くと、その軸は大きい値を左か下に置き、矢印の先も左か下になる
- 最初の行を `matrix <題> [shape: scatter]` にすると、札を動かす代わりに課題を点数どおりの所の点で打つ。0から10の目盛りの軸の左に課題と点数の表が並び、課題を打った段に両方の軸から点まで線を引いて点数を出し、点が入った区画を光らせる。同じ点数の課題は1つの点にまとめる。`[shape: scatter, table: none]` で表を出さず、狭い枠では表を上に、点の図を下に積む
- 打った段の軸の点数の札が、その時に見える点の名前に触れる時は、その段だけ縦の軸の札を軸の左へ、横の軸の札を軸の下へ出し、端を軸の線に付ける。点の名前は動かさず、札の大きさも変えない

```dragon
matrix 仕事を手間と効き目で分ける

axis 手間 [from: 小さい, to: 大きい]
axis 効き目 [from: 小さい, to: 大きい]

box now as 今やる
box plan as 計画する
box spare as 手が空いたら
box drop as やらない

item login as ログインを速く
item pay as 決済を足す
item word as 文言の直し

step 並べる
  say 仕事を左に並べる。

step 今やる
  say 手間が小さく効き目の大きい仕事を先にやる。
  line now: login

step 残りを分ける
  say 残りを手間と効き目で分ける。
  line plan: pay
  line spare: word
```

```dragon
matrix 仕事を点数で打つ [shape: scatter]

axis 手間 [from: 小さい, to: 大きい]
axis 効き目 [from: 小さい, to: 大きい]

box now as 今やる
box plan as 計画する
box spare as 手が空いたら
box drop as やらない

item login as ログインを速く [x: 2, y: 8]
item pay as 決済を足す [x: 8, y: 7.5]
item word as 文言の直し [x: 3, y: 3]

step 並べる
  say 仕事と点数を左の表に並べる。

step ログイン
  say 手間が小さく効き目の大きい仕事を打つ。
  line: login

step 決済
  say 効き目も手間も大きい仕事を打つ。
  line: pay

step 文言
  say 手間も効き目も小さい仕事を打つ。
  line: word
```

### 集合の重なりの図

`venn <題>` で始めると、2 つか 3 つの集まりを円で重ね、どの区画に何件入るかを段ごとに数える集合の重なりの図になる。
集まりが 2 つなら左右に、3 つなら左上と右上と下に円を置く。

- `item <名札> as <名前>` は集まりで、最初の `step` より前に書く。集まりは 2 つか 3 つ書け、`[color: <色>]` で円の色を決める
- 段の中の `set <名札>: <数>` は集まりの全体の数を書く。円は初めて数を書いた段で現れ、円の外に名前と全体の数を出す
- `set <名札> & <名札>: <数>` は重なりの数を書き、その段で重なりの区画を光らせて数の札を出す。重なりの数が重なる集まりのどれかの数より大きいと誤りで止まる
- 区画の中には、全体と重なりの数から出したそれぞれだけの数が出る。要る数が揃うまで、その区画には数を出さない
- `set none: <数>` はどれにも入らない数を書き、その段から円を囲む枠の中に出す。ほかの種類の図では `none` を今までどおり箱の名札として読む
- 最初の行に `[shape: dots]` を足すと、円の代わりに点で数える見た目になる。集まりごとの群れと重なりの群れへ点が寄り、2つ以上に入る点は入る集まりの色の扇形で塗る。`[shape: dots, unit: <数>]` と書くと1点の件数を決められる。
- 段の番号は、その段で現れた円の名前の隣か、その段で光らせた区画の数の下に出る

```dragon
venn 朝と夜に走る人

item morning as 朝に走る
item night as 夜に走る

step 朝
  say 朝に走る人は30人いる。
  set morning: 30

step 夜と両方
  say 夜に走る人は20人で、そのうち5人は朝も走る。
  set night: 20
  set morning & night: 5

step どちらでもない
  say どちらにも走らない人は12人いる。
  set none: 12
```

### 量の行き先の図

`sankey <題>` で始めると、1 つの量がどこへどれだけ分かれるかを、量に比べた幅の帯で段ごとに追う量の行き先の図になる。
入る線の無い箱が左の列に並び、行き先は出どころの右の列に並ぶ。

- `box <名札> as <名前>` は出どころか行き先で、最初の `step` より前に書く。`[color: <色>]` は棒と、その箱へ入る帯の色になり、箱に `note` と `icon` と `link` は書けない
- 段の中の `<出どころ> -> <行き先>: <量>` は、その段で出どころの棒から行き先の棒へ帯を伸ばし、量の札を帯に渡らせる。線の名前の初めの数が量で、`40%` は 40、`1,200円` は 1200 と読む
- 帯の幅は出どころの棒のうちその量が占める割合の分で、出どころの棒の上から書いた順に積む。行き先の棒は、帯が着くたびにその分だけ伸びる
- 出どころの無い箱の量は出る量の和で、行き先の量は入る量の和になる。1 つの図の量は同じ単位で書く
- 線の名前が数で始まらない線、流れを辿ると元の箱へ戻る線、入る量より出る量の和が大きい箱は誤りで止まる
- 量の札は線の名前を出すので、線に `tag` と `carry` と `side` は書けない。`group` と `strip` と `act` と `note` と `set` の行も書けない
- 段の番号は、その段で帯が着いた最初の行き先の右に出る

```dragon
sankey お小遣いの使い道

box pay as お小遣い1万円 [color: slate]
box food as 食べる [color: amber]
box save as 貯める [color: green]
box fun as 遊ぶ [color: rose]

step 受け取る
  say 1か月のお小遣いは1万円。

step 食べる分
  say 半分の5,000円を食べる分に回す。
  pay -> food: 5,000円

step 残り
  say 3,000円を貯めて、2,000円で遊ぶ。
  pay -> save: 3,000円
  pay -> fun: 2,000円
```

`sankey <題> [shape: rows]` と書くと、段ごとに図の幅いっぱいの帯を1行ずつ上から積む段ごとの帯の見た目になる。

- 箱と段と線の書き方は帯の図と同じで、行は段の数だけ上から積まれる。各行はその段までの線で分かれた区画に分かれ、区画の幅は出どころの無い箱の量の和に比べた量になる
- 線を読むたびに、出どころの区画の幅の内の左から、行き先の区画を書いた順に切り出す。出どころの無い箱のまだ分けていない残りは、灰色の帯に `残り16時間` の形で出る
- その段で新しく分かれた区画と最後の行の区画に名前と量が出て、前の段から続いている区画は字を出さない薄い帯になる
- 上の行から下りる帯と量の札は、その段で新しく分かれた区画にだけ引く
- 同じ段の量の札が携帯の幅のように狭い枠で重なる時は、後の札を1段上で止め、その段の上の下りる帯の間を札1段分伸ばす。札の大きさは変えず、札は自分の区画の真上に残る
- 名前が区画に入らない時は区画に量だけを書き、その行の帯の下に色の印と名前が並ぶ。携帯の幅でも帯は幅いっぱいのまま

```dragon
sankey 1日の使い方 [shape: rows]

box day as 1日 [color: slate]
box sleep as 寝る [color: blue]
box awake as 起きている [color: amber]
box work as 仕事 [color: violet]
box free as 自由な時間 [color: rose]

step 1日
  say 1日は24時間。

step 寝る
  say 8時間を寝る。
  day -> sleep: 8時間

step 起きている
  say 残りの16時間は起きている。
  day -> awake: 16時間

step 分ける
  say 起きている時間を仕事と自由な時間に分ける。
  awake -> work: 10時間
  awake -> free: 6時間
```

`sankey <題> [shape: treemap]` と書くと、全量を1つの四角にして段ごとに量の面積に割る、面積で割る四角の見た目になる。

- 箱と段と線の書き方は帯の図と同じ。出どころの無い箱が全量の四角になり、段ごとに切る線を引いて行き先の区画を切り出す。区画の面積は出どころの無い箱の量の和に比べた量になる
- まだ分けていない残りは長い辺を量の割合で切る。同じ段に同じ出どころから書いた線は、線の量の和の帯を1つ切り出し、帯の中を線を書いた順に分ける
- 出どころの無い箱のまだ分けていない残りは、灰色の区画に `残り48GB` の形で出る
- 行き先の区画をさらに分けると、区画の枠と名前の札が残り、札の下の内側が子の区画に分かれる
- 区画には名前と量が出て、量の札は出ない。名前が区画に入らない時は区画に量だけを書き、図の四角の下に色の印と名前が並ぶ

```dragon
sankey スマホの保存領域 [shape: treemap]

box all as 保存領域 [color: slate]
box photo as 写真 [color: blue]
box app as アプリ [color: green]
box game as 遊び [color: rose]
box work as 仕事 [color: blue]

step 保存領域
  say 保存領域は128GB。

step 写真とアプリ
  say 写真が48GB、アプリが32GBを使う。
  all -> photo: 48GB
  all -> app: 32GB

step アプリの内訳
  say アプリの32GBを遊びと仕事に分ける。
  app -> game: 20GB
  app -> work: 12GB
```

### 持ち主ごとのカードの図

`cards <題>`で始めると、持ち主ごとの縦の列にカードを積み、段でカードができ、消え、動き、断られる様子を追う持ち主ごとのカードの図になる。
列は`box`を書いた順に左から並び、列の中はカードを作った順に上から積む。

- `box <名札> as <名前>`は持ち主の列で、最初の`step`より前に書く。`[note: <添え書き>]`は名前の脇の添え書き、`[mark: <印の語>]`はその列で出す印の語になる。箱に`color`と`icon`と`link`は書けない
- `item <名札> as <名前> in <列>, <列> [amount: <量>]`はカードで、`in`に書いた全ての列に写しが1枚ずつ載る。量は`1000 USDC`のように数と単位で書き、`,`を含む量は`"`で囲む
- `[total: none]`のカードは量をカードに出すが、列の合計に足さない。`[mark: <列>]`は印を出す列を選び、選ぶ列は`mark`の語を持つ。`mark`はカードの行でだけ繰り返せる
- 最初の`step`より前のカードは初めから在る。段の中の`item`はその段でカードを作り、緑の縁と「できた」の札を出す
- 段の中で在るカードの`item <名札> in <列>`を書くと、カードがその列へ動く。動かす行に名前と属性は書けない
- `delete <カード>`はカードを消し線で残し、列の合計から外す。消したカードは後の段でも消し線のまま残る
- `refuse <カードか列>: <理由>`は何も変えずに、断られた札と理由の札を出す。札は、カードを呼んだ列 (呼び出しが無ければカードが載る最初の列) か、断られた列のカードの下に出る
- `<列> -> <カード>: <名前>`の線は、列の見出しからカードへの呼び出しになる。線に`tag`と`carry`と`side`は書けない。`group`と`strip`と`act`と`note`と`set`の行も書けない
- 列の下の帯に、列ごとの合計が単位ごとに出る。段で変わった合計は、前の量を消し線で添える

```dragon
cards 証書で100 USDCを送る

box alice as Alice [note: 送る人]
box bob as Bob [note: 受け取る人]
box usdc as USDCの台帳 [mark: 署名]

item n1 as 証書#1 in alice, usdc [amount: 1000 USDC, mark: usdc]
item n2 as 証書#2 in bob, usdc [amount: 200 USDC, mark: usdc]

step AliceがBobへ100を送る
  say 証書#1を使い切り、新しい証書2枚に替わる。
  alice -> n1: 100を送る
  delete n1
  item n3 as 証書#3 in alice, usdc [amount: 900 USDC, mark: usdc]
  item n4 as 証書#4 in bob, usdc [amount: 100 USDC, mark: usdc]

step Bobが500を送ろうとする
  say 証書の額が足りないので、何も変わらない。
  bob -> n2: 500を送る
  refuse n2: 残高が足りない
```

### 購入操作図

`checkout <題>` で始めると購入操作図になる。読む人が条件を変えられる購入の模型で、関係者、注文の流れ、商品、配送、予算、承認、支払い、注文、場面のブロックは [`src/checkout/README.md`](https://github.com/cardene777/dragon/blob/main/packages/dragon/src/checkout/README.md) に書いてある。見本は `examples/purchase-*.dragon` の file。
