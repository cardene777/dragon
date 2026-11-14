const a=`architecture 箱の中の処理

box アプリ
box サーバー

step 送る
  say アプリが署名した注文をサーバーへ送る。
  アプリ -> サーバー: 注文

step 確かめる
  say act で、線を引かずに箱の中で起きる処理を見せる。
  act サーバー: 署名を確かめる

step 返す
  say 処理の後に線を続けられる。
  サーバー -> アプリ: 受け付けた
`,o=`architecture Action

box app as App
box server as Server

step Send
  say The app sends a signed order to the server.
  app -> server: order

step Check
  say act shows work done inside a box, with no edge.
  act server: check signature

step Reply
  say Edges can follow the action.
  server -> app: accepted
`,s=`flow 箱の中の処理

box form as 申請を受ける
choice ok as 書類はそろう？
box pass as 承認する [color: green]
box back as 差し戻す [color: rose]

ok -> back: いいえ

step 受ける
  say 申請が届き、手順が始まる。
  start -> form

step 確かめる
  say act で、線を引かずに箱の中で起きる処理を見せる。
  act form: 書類を照らし合わせる
  form -> ok: 調べる

step 通す
  say 処理の後に線を続けられる。
  ok -> pass: はい
`,t=`flow Inside a box

box form as Receive the request
choice ok as Papers complete?
box pass as Approve [color: green]
box back as Send back [color: rose]

ok -> back: No

step Receive
  say A request arrives and the procedure starts.
  start -> form

step Check
  say act shows work done inside a box without drawing a line.
  act form: Compare the papers
  form -> ok: Check

step Pass
  say A line can follow the work.
  ok -> pass: Yes
`,r=`git 箱の中の処理

branch main

box 作業ツリー

step 積む
  say main に A を積む。
  commit A on main

step 確かめる
  say act で、commit を積まずに箱の中で起きる処理を見せる。
  act 作業ツリー: 検査を回す

step 続ける
  say 処理の後に commit を続けられる。
  commit B on main
`,i=`git Action

branch main

box worktree as Worktree

step Commit
  say Add A on main.
  commit A on main

step Check
  say act shows work done inside a box without adding a commit.
  act worktree: Run the checks

step Go on
  say A commit can follow the action.
  commit B on main
`,l=`sequence 箱の中の処理

box アプリ
box サーバー

step 送る
  say アプリが署名した注文をサーバーへ送る。
  アプリ -> サーバー: 注文

step 確かめる
  say act で、線を引かずに箱の中で起きる処理を見せる。
  act サーバー: 署名を確かめる

step 返す
  say 処理の後に線を続けられる。
  サーバー -> アプリ: 受け付けた
`,c=`sequence Action

box app as App
box server as Server

step Send
  say The app sends a signed order to the server.
  app -> server: order

step Check
  say act shows work done inside a box, with no edge.
  act server: check signature

step Reply
  say Edges can follow the action.
  server -> app: accepted
`,p=`state 箱の中の処理

box 受付
box 確認中
box 承認

step 出す
  say 申請が届き、確認中に移る。
  受付 -> 確認中: 申請する

step 確かめる
  say act で、状態を移らずに箱の中で起きる処理を見せる。
  act 確認中: 書類を照らし合わせる

step 通す
  say 処理の後に線を続けられる。
  確認中 -> 承認: 承認する
`,g=`state Action

box received as Received
box checking as Checking
box approved as Approved

step Submit
  say The request arrives and moves to Checking.
  received -> checking: submit

step Check
  say act shows work done inside the box without moving to another state.
  act checking: match the papers

step Approve
  say An edge can follow the work.
  checking -> approved: approve
`,d=`time 処理

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者 [icon: user]
box ブロック [icon: box]

step 処理する
  say act で、箱が自分で行う処理を箱の下の字に出す。
  act 提案者: ブロックを作る

step 渡す
  say 処理の後に線を引くと、作った物が次の箱へ届く。
  提案者 -> ブロック [at: 0]
  now -> 0
`,b=`time Action

scale slot 12s 6
row block
zoom 0-2

box proposer [icon: user]
box block [icon: box]

step Act
  say act shows what a box does by itself, in the small text under it.
  act proposer: build a block

step Hand over
  say Draw a line after the action, and what it made reaches the next box.
  proposer -> block [at: 0]
  now -> 0
`,h=`tree 箱の中の処理

box 記録

step 葉を出す
  say 葉を2つ出す。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 確かめる
  say act で、箱を足さずに箱の中で起きる処理を見せる。
  act 記録: 値を確かめる

step 組む
  say 処理の後に親を組める。
  node 根 of 取引1, 取引2 [hash: 7a21]
`,m=`tree Work in a box

box ledger as Ledger

step Add leaves
  say Add two leaves.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Check
  say act shows work happening inside a box without adding a box.
  act ledger: Check the values

step Join
  say The tree can grow again after the work.
  node root of tx1, tx2 [hash: 7a21]
`,y=`try 入力の帯

route 網: あなた - 中継 - 作る人 [from: あなた, to: 作る人]
queue 待ち [order: 手数料]
ask 送り手, 手数料 [into: 待ち, via: 網]
choose 手数料: 2, 4, 6

item 甲 [手数料: 4]

step 送る
  say ask の行で入力の帯を置く。最初の欄の値がチップの名前になり、via の網を通って into の待ち行列に入る。
  line 待ち: 甲
  ask あなた, 6
`,_=`try Input strip

route Net: You - Relay - Maker [from: You, to: Maker]
queue Pool [order: Fee]
ask Sender, Fee [into: Pool, via: Net]
choose Fee: 2, 4, 6

item a [Fee: 4]

step Send
  say An ask line places the input strip. The first field names the chip, which crosses the network in via into the queue in into.
  line Pool: a
  ask You, 6
`,u=`matrix 軸 [shape: scatter, table: none]

axis 手間 [from: 小さい, to: 大きい]
axis 危うさ [from: 低い, to: 高い, reverse: yes]

box now as 今やる
box plan as 計画する
box wait as 様子を見る
box drop as やらない

item login as ログインを速く [x: 2, y: 2]
item old as 古い画面を作り直す [x: 8, y: 7]

step 横の軸
  say axisの1行目が横の軸で、0から10の目盛りを左から右へ引く。
    fromに左の端の字、toに右の端の字を書く。
  line: login

step 縦の軸
  say axisの2行目が縦の軸で、下から上へ引く。
    reverse: yesを書くと大きい値を下に置き、危うさの低い課題が上に来る。
  line: old
`,k=`matrix Axes [shape: scatter, table: none]

axis Effort [from: low, to: high]
axis Risk [from: low, to: high, reverse: yes]

box now as Do now
box plan as Plan it
box wait as Watch it
box drop as Skip

item login as Faster login [x: 2, y: 2]
item old as Rebuild old screen [x: 8, y: 7]

step Horizontal axis
  say The first axis line is the horizontal axis, ruled from 0 to 10 from left to right.
    from is the text at the left end and to the text at the right end.
  line: login

step Vertical axis
  say The second axis line is the vertical axis, drawn from bottom to top.
    With reverse: yes it puts high values at the bottom, so low-risk items come to the top.
  line: old
`,x=`sankey 量の帯

box total as 全量
box comm as 仲間
box team as 作った人
box rew as 報酬
box don as 寄付

step 作る
  say 出どころの無い箱の棒は初めから出ている。

step 仲間へ
  say 線の名前の初めの数が量で、その段で量に比べた幅の帯が伸びる。
  total -> comm: 60%

step 作った人へ
  say 帯は出どころの棒の上から、書いた順に積む。
  total -> team: 40%

step 分ける
  say 行き先から出る量の和は、入る量の内に収める。
  comm -> rew: 45%
  comm -> don: 15%
`,v=`sankey Amount bands

box total as Total
box comm as Community
box team as Team
box rew as Rewards
box don as Donations

step Mint
  say The bar of a box with no source shows from the start.

step To the community
  say The number at the start of the label is the amount, and a band that wide grows in that step.
  total -> comm: 60%

step To the team
  say Bands stack down the source bar in the order written.
  total -> team: 40%

step Split
  say What leaves a target stays within what comes in.
  comm -> rew: 45%
  comm -> don: 15%
`,f=`architecture 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,w=`architecture Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,A=`cycle 箱

box draft as 下書きを書く
box review as 見直す
box publish as 公開する

step 書く
  say box の行で手順を 1 つ置く。as の後ろに見せる名前を書く。

step 見直す
  say 手順は書いた順に、輪の真上から右回りに並ぶ。
  draft -> review [tag: 下書き]

step 出す
  say 線は手順の名札で書き、輪の次の手順へ引く。
  review -> publish [tag: 直した版]
`,E=`cycle Boxes

box draft as Write a draft
box review as Review
box publish as Publish

step Write
  say A box line places one step. Write the name to show after as.

step Review
  say The steps sit on the ring clockwise from the top in the order written.
  draft -> review [tag: draft]

step Publish
  say A line names the steps by id and goes to the next step on the ring.
  review -> publish [tag: revised]
`,C=`flow 箱

box draft as 下書きを書く
box review as 見直す
box publish as 公開する

step 書く
  say box の行で手順を 1 つ置く。as の後ろに見せる名前を書く。
  draft -> review: 渡す

step 出す
  say 線は手順の名札で書き、段で通る順に上から並ぶ。
  review -> publish: 出す
`,D=`flow Box

box draft as Write a draft
box review as Review
box publish as Publish

step Write
  say A box line places one task. Write the shown name after as.
  draft -> review: Hand over

step Ship
  say Lines name the tasks, which stack top to bottom in the order the steps reach them.
  review -> publish: Ship
`,S=`git 箱

branch main

box 作業ツリー [note: 手元のファイル]

step 積む
  say box の行で、枝の帯の横に物を 1 つ置く。commit の外で変わる物に使う。
  commit A on main [hash: 3fa0c19]
  note 作業ツリー: A の中身

step 進める
  say 段の中の note の行で、箱の下の小さな字を書き換える。
  commit B on main [hash: 8b04f71]
  note 作業ツリー: B の中身
`,T=`git Box

branch main

box worktree as Worktree [note: Local files]

step Commit
  say A box line places one thing beside the branch lanes. Use it for things that change outside commits.
  commit A on main [hash: 3fa0c19]
  note worktree: A's files

step Move on
  say A note line inside a step rewrites the small text under the box.
  commit B on main [hash: 8b04f71]
  note worktree: B's files
`,B=`lineup 箱

box 待ち [note: 3件]
box 箱詰め

item 甲, 乙, 丙

step 並べる
  say box の行が列になり、宣言した順に上から同じ幅で並ぶ。
  line 待ち: 甲, 乙, 丙

step 移す
  say 段の中の note の行で、列の名前の下の値の札を書き換える。
  line 箱詰め: 甲, 乙
  line 待ち: 丙
  note 待ち: 1件
  note 箱詰め: 2件
`,R=`lineup Boxes

box waiting as Waiting [note: 3 items]
box packed as Packed

item a, b, c

step Line up
  say Each box line becomes a lane, stacked top to bottom in the order declared, all the same width.
  line waiting: a, b, c

step Move
  say A note line inside a step rewrites the value chip under the lane name.
  line packed: a, b
  line waiting: c
  note waiting: 1 item
  note packed: 2 items
`,P=`matrix 箱

axis 起きやすさ [from: 低い, to: 高い]
axis 影響 [from: 小さい, to: 大きい]

box plan as 備えを決める
box act as すぐ手を打つ
box accept as 受け入れる
box watch as 見張る

item leak as 鍵の漏れ
item slow as 画面が遅い

step 区画を置く
  say box の行で区画を置く。ちょうど 4 つ書き、書いた順に左上、右上、左下、右下に並ぶ。
    as の後ろの名前は区画の左上に出る。

step 区画へ置く
  say 課題を置く line の行は、区画を box の名札で名指す。
  line act: leak
  line watch: slow
`,q=`matrix Boxes

axis Likelihood [from: low, to: high]
axis Impact [from: small, to: large]

box plan as Plan ahead
box act as Act now
box accept as Accept
box watch as Watch

item leak as Key leak
item slow as Slow screen

step Place the areas
  say A box line places an area. Write exactly four; they go top left, top right, bottom left and bottom right in written order.
    The name after as shows at the top left of the area.

step Place into areas
  say A line line that places items names the area by its box id.
  line act: leak
  line watch: slow
`,H=`pipe 関係者

box alice as Alice
box router as Router
box usdc as USDC

hold alice: 10 USDC

step AliceがRouterを呼ぶ
  say 関係者は出てきた順に左から並び、種類は行から決まる。
  alice -> router: 交換

step Routerが戻る
  say 呼ばれた側が戻ると、呼び出しの管が閉じる。
  return router: ok
`,W=`pipe Parties

box alice as Alice
box router as Router
box usdc as USDC

hold alice: 10 USDC

step Alice calls the router
  say Parties line up from the left in the order they appear, and their kind comes from the lines.
  alice -> router: swap

step The router returns
  say When the callee returns, the call pipe closes.
  return router: ok
`,M=`sankey 箱

box sales as 売上
box cost as 原価
box profit as 利益

step 売る
  say box の行で出どころと行き先の箱を置く。as の後ろに見せる名前を書く。

step 分ける
  say 入る線の無い箱が左の列に、行き先がその右の列に並ぶ。
  sales -> cost: 60%
  sales -> profit: 40%
`,U=`sankey Boxes

box sales as Sales
box cost as Cost
box profit as Profit

step Sell
  say A box line places a source or a target. The name to show goes after as.

step Split
  say Boxes no line goes into sit in the left column, and targets sit to their right.
  sales -> cost: 60%
  sales -> profit: 40%
`,L=`sequence 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,O=`sequence Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,N=`state 箱

box 下書き
box 公開中 as 公開している

step 公開する
  say box の行で状態を 1 つ置く。as の後ろに見せる名前を書く。
  下書き -> 公開中: 公開する

step 戻す
  say 線は状態の名札で書く。
  公開中 -> 下書き: 取り下げる
`,G=`state Box

box draft as Draft
box live as Published

step Publish
  say A box line places one state. The name to show follows as.
  draft -> live: publish

step Withdraw
  say Edges name the states by their tags.
  live -> draft: withdraw
`,F=`time 箱

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者
box ブロック

step 出す
  say box の行で、拡大の帯の列ごとに同じ箱を並べる。
  提案者 -> ブロック [at: 0]
  now -> 0

step 進める
  say 箱は 1 度宣言すれば、どの列にも同じ並びで出る。
  提案者 -> ブロック [at: 1]
  now -> 1
`,I=`time Box

scale slot 12s 6
row block
zoom 0-2

box proposer
box block

step Propose
  say A box line puts the same box in every column of the zoom band.
  proposer -> block [at: 0]
  now -> 0

step Next
  say Declare a box once, and it shows in every column in the same order.
  proposer -> block [at: 1]
  now -> 1
`,V=`tree 箱

box 記録 [note: まだ無い]

step 葉を出す
  say box の行で、木の右に物を1つ置く。木の外で変わる物に使う。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  note 記録: 葉が2つ

step 組む
  say 段の中の note の行で、箱の下の小さな字を書き換える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 記録: 根 7a21
`,z=`tree Boxes

box ledger as Ledger [note: empty]

step Add leaves
  say A box line places one thing to the right of the tree. Use it for what changes outside the tree.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  note ledger: 2 leaves

step Join
  say A note line inside a step rewrites the small text under a box.
  node root of tx1, tx2 [hash: 7a21]
  note ledger: root 7a21
`,j=`git 枝

branch main [note: 取り込む先]
branch topic [note: 作業の枝]

step 宣言する
  say branch の行で枝を上から順に宣言し、枝ごとに帯を並べる。note で帯に添え書きを付ける。
  commit A on main
  commit B on main

step 枝を切る
  say 段の中で <枝> from <commit> と書くと、その commit から枝を切り、HEAD がその枝へ移る。
  topic from A
  commit C on topic
`,J=`git Branch

branch main [note: Merge target]
branch topic [note: Work branch]

step Declare
  say Declare branches top to bottom with branch lines, and each gets a lane. note adds a note to the lane.
  commit A on main
  commit B on main

step Cut
  say Inside a step, <branch> from <commit> cuts the branch at that commit, and HEAD moves to the branch.
  topic from A
  commit C on topic
`,Y=`pipe 換算

box alice as Alice
box pool as Pool

step 換算する
  say Poolが100 USDCを今の比率でWETHに換算する。
  alice -> pool: 見積もり
  calc pool: 100 USDC -> 0.05 WETH

step 確かめる
  say 換算した量が最低額以上かを確かめる。
  check pool: 0.05 WETH >= 0.04 WETH
  return pool: 0.05 WETH
`,K=`pipe Conversions

box alice as Alice
box pool as Pool

step Convert
  say The pool converts 100 USDC to WETH at the current rate.
  alice -> pool: quote
  calc pool: 100 USDC -> 0.05 WETH

step Check
  say It checks that the converted amount is at least the minimum.
  check pool: 0.05 WETH >= 0.04 WETH
  return pool: 0.05 WETH
`,$=`pipe 呼び出しの種類

box alice as Alice
box proxy as Proxy
box logic as Logic
box oracle as Oracle

hold proxy: count 0

step 処理を借りる
  say ProxyがLogicの処理を借り、Proxyの値を書き替える。
  alice -> proxy: 数える
  proxy -> logic: 数える [call: delegate]
  write logic: count 1

step 読むだけの呼び出し
  say Logicが価格を読む。この呼び出しの内側では何も書き替えられない。
  logic -> oracle: 価格 [call: static]
  return oracle: 3200

step 戻る
  say 借りた処理が終わり、一番外の呼び出しが戻る。
  return logic: true
  return proxy: true
`,Q=`pipe Call kinds

box alice as Alice
box proxy as Proxy
box logic as Logic
box oracle as Oracle

hold proxy: count 0

step Borrow code
  say The proxy borrows the code of Logic, which rewrites a value of the proxy.
  alice -> proxy: count
  proxy -> logic: count [call: delegate]
  write logic: count 1

step A call that only reads
  say Logic reads a price. Nothing can be written inside this call.
  logic -> oracle: price [call: static]
  return oracle: 3200

step Return
  say The borrowed code ends, and the outermost call returns.
  return logic: true
  return proxy: true
`,Z=`architecture 運ぶ物

box 財布
box 店

step 封筒
  say 何も書かなければ、線の上を封筒が走る。
  財布 -> 店: 注文

step 札
  say tag で、線の上を走る札に値を書く。
  店 -> 財布: 請求 [tag: #42]

step 硬貨
  say carry: coin で、お金が動くことを硬貨で見せる。
  財布 -> 店: 払う [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  店 -> 財布: 受け取った [carry: none]
`,X=`architecture Carry

box wallet as Wallet
box shop as Shop

step Envelope
  say With nothing written, an envelope runs along the edge.
  wallet -> shop: order

step Tag
  say tag writes a value on a tag that runs along the edge.
  shop -> wallet: bill [tag: #42]

step Coin
  say carry: coin shows money moving as a coin.
  wallet -> shop: pay [carry: coin]

step Nothing
  say carry: none draws the edge and runs nothing along it.
  shop -> wallet: received [carry: none]
`,nn=`cycle 運ぶ物

box order as 注文を受ける
box pay as 支払いを待つ
box ship as 発送する
box done as 閉じる

step 封筒
  say 何も書かなければ、封筒が弧の上を走る。
  order -> pay

step 札
  say tag で、弧の上を走る札に値を書く。
  pay -> ship [tag: #42]

step 運ばない
  say carry: none で弧だけを光らせ、carry: coin でお金が動くことを硬貨で見せる。
  ship -> done [carry: none]
  done -> order [carry: coin]
`,en=`cycle What travels

box order as Take the order
box pay as Wait for payment
box ship as Ship
box done as Close

step Envelope
  say With nothing written, an envelope runs along the arc.
  order -> pay

step Tag
  say tag writes a value on the chip that runs along the arc.
  pay -> ship [tag: #42]

step Nothing carried
  say carry: none only lights the arc, and carry: coin shows money moving as a coin.
  ship -> done [carry: none]
  done -> order [carry: coin]
`,an=`er 運ぶ物

table users as 客
  field id: U-7 [key]
  field 残高: 5000円

table orders as 注文
  field id: O-41 [key]
  field 客id: U-7 [ref: users.id]

table pays as 支払い
  field id: P-9 [key]
  field 注文id: O-41 [ref: orders.id]

step 札
  say tag で、線の上を走る札に値を書く。札は線の真ん中で止まる。
  orders.客id -> users.id [tag: U-7]

step 運ばない
  say carry: none で線だけを光らせる。
  pays.注文id -> orders.id [carry: none]

step 硬貨
  say carry: coin でお金が動くことを硬貨で見せる。
  users.id -> orders.客id [carry: coin]
`,on=`er What travels

table users as Customers
  field id: U-7 [key]
  field balance: $50

table orders as Orders
  field id: O-41 [key]
  field user_id: U-7 [ref: users.id]

table pays as Payments
  field id: P-9 [key]
  field order_id: O-41 [ref: orders.id]

step Chip
  say tag writes a value on the chip that runs along the line. The chip stops halfway.
  orders.user_id -> users.id [tag: U-7]

step Nothing
  say carry: none only lights the line.
  pays.order_id -> orders.id [carry: none]

step Coin
  say carry: coin shows money moving with a coin.
  users.id -> orders.user_id [carry: coin]
`,sn=`flow 運ぶ物

box order as 注文を受ける
box pay as 支払いを待つ
box ship as 発送する
box done as 閉じる

step 段の印
  say 何も書かなければ、手順の図では封筒の代わりに段の印の点が線の上を走る。
  order -> pay: 決済へ

step 札
  say tag で、線の上を走る札に値を書く。
  pay -> ship: 発送へ [tag: #42]

step 運ばない
  say carry: none で線だけを引き、carry: coin でお金が動くことを硬貨で見せる。
  ship -> done: 閉じる [carry: none]
  done -> finish [carry: coin]
`,tn=`flow Carried item

box order as Take the order
box pay as Wait for payment
box ship as Ship
box done as Close

step Step mark
  say With nothing written, a flow diagram runs the step mark, a dot, along the line instead of an envelope.
  order -> pay: To payment

step Tag
  say tag writes a value on a tag that travels along the line.
  pay -> ship: To shipping [tag: #42]

step Nothing
  say carry: none draws only the line, and carry: coin shows money moving as a coin.
  ship -> done: Close [carry: none]
  done -> finish [carry: coin]
`,rn=`git 運ぶ物

branch main

step 積む
  say main に A と B と C を積む。
  commit A on main
  commit B on main
  commit C on main

step 動かす札
  say 何も書かなければ、動かす札 (枝の名前か HEAD) が線を走る。
  HEAD -> A

step 札
  say tag で、線の上を走る札に値を書く。動かす札は着いた所へ移る。
  HEAD -> B [tag: 切り替え]

step 硬貨
  say carry: coin で、線の上に硬貨を走らせる。
  HEAD -> C [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  HEAD -> A [carry: none]
`,ln=`git Carry

branch main

step Commit
  say Add A, B and C on main.
  commit A on main
  commit B on main
  commit C on main

step The moving ref
  say Without carry, the moving ref (a branch name or HEAD) runs along the line.
  HEAD -> A

step Tag
  say tag writes a value on a tag that runs along the line. The moving ref moves to the end.
  HEAD -> B [tag: switch]

step Coin
  say carry: coin runs a coin along the line.
  HEAD -> C [carry: coin]

step Nothing
  say carry: none draws only the line and runs nothing.
  HEAD -> A [carry: none]
`,cn=`sequence 運ぶ物

box 財布
box 店

step 封筒
  say 何も書かなければ、線の上を封筒が走る。
  財布 -> 店: 注文

step 札
  say tag で、線の上を走る札に値を書く。
  店 -> 財布: 請求 [tag: #42]

step 硬貨
  say carry: coin で、お金が動くことを硬貨で見せる。
  財布 -> 店: 払う [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  店 -> 財布: 受け取った [carry: none]
`,pn=`sequence Carry

box wallet as Wallet
box shop as Shop

step Envelope
  say With nothing written, an envelope runs along the edge.
  wallet -> shop: order

step Tag
  say tag writes a value on a tag that runs along the edge.
  shop -> wallet: bill [tag: #42]

step Coin
  say carry: coin shows money moving as a coin.
  wallet -> shop: pay [carry: coin]

step Nothing
  say carry: none draws the edge and runs nothing along it.
  shop -> wallet: received [carry: none]
`,gn=`state 運ぶ物

box 注文済み
box 支払い待ち
box 完了

step 封筒
  say 何も書かなければ、線の上を封筒が走る。
  注文済み -> 支払い待ち: 決済へ

step 札
  say tag で、線の上を走る札に値を書く。
  支払い待ち -> 注文済み: 差し戻す [tag: #42]

step 硬貨
  say carry: coin で、お金が動くことを硬貨で見せる。
  注文済み -> 支払い待ち: 払う [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  支払い待ち -> 完了: 閉じる [carry: none]
`,dn=`state Carry

box ordered as Ordered
box paying as Awaiting payment
box done as Done

step Envelope
  say With nothing written, an envelope runs along the edge.
  ordered -> paying: check out

step Tag
  say tag writes a value on a tag that runs along the edge.
  paying -> ordered: send back [tag: #42]

step Coin
  say carry: coin shows money moving as a coin.
  ordered -> paying: pay [carry: coin]

step Nothing
  say carry: none draws the edge and runs nothing along it.
  paying -> done: close [carry: none]
`,bn=`time 運ぶ物

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者 [icon: user]
box ブロック [icon: box]
box 委員会

step 封筒
  say carry を書かなければ、線の上を封筒が走る。
  提案者 -> ブロック [at: 0]
  now -> 0

step 札
  say tag で、線の上を走る札に字を書く。
  委員会 -> ブロック [at: 1, tag: 票]
  now -> 1

step 硬貨
  say carry: coin で硬貨を走らせ、carry: none で線だけを引く。
  提案者 -> ブロック [at: 2, carry: coin]
  委員会 -> ブロック [at: 2, carry: none]
  now -> 2
`,hn=`time Carry

scale slot 12s 6
row block
zoom 0-2

box proposer [icon: user]
box block [icon: box]
box committee

step Envelope
  say Without carry, an envelope runs along the line.
  proposer -> block [at: 0]
  now -> 0

step Tag
  say tag writes a value on a tag that runs along the line.
  committee -> block [at: 1, tag: vote]
  now -> 1

step Coin
  say carry: coin runs a coin, and carry: none draws only the line.
  proposer -> block [at: 2, carry: coin]
  committee -> block [at: 2, carry: none]
  now -> 2
`,mn=`tree 運ぶ物

step 組む
  say 葉を2つ出して、親を組む。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  node 根 of 取引1, 取引2 [hash: 7a21]

step 封筒
  say 何も書かなければ、封筒が線の上を走る。
  取引1 -> 根

step 札
  say tag で、線の上を走る札に値を書く。
  取引2 -> 根 [tag: 8b04]

step 硬貨
  say carry: coin で、線の上に硬貨を走らせる。
  根 -> 取引1 [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  根 -> 取引2 [carry: none]
`,yn=`tree What travels

step Join
  say Add two leaves and join them under a parent.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  node root of tx1, tx2 [hash: 7a21]

step Envelope
  say With nothing written, an envelope runs along the line.
  tx1 -> root

step Tag
  say tag writes a value on a tag that runs along the line.
  tx2 -> root [tag: 8b04]

step Coin
  say carry: coin runs a coin along the line.
  root -> tx1 [carry: coin]

step Nothing
  say carry: none draws the line with nothing on it.
  root -> tx2 [carry: none]
`,_n=`try 機械の列

queue 待ち
chain 鎖 [edit: 量]
ask 名前, 量 [into: 待ち]
press 作る [from: 待ち, into: 鎖, take: 1]

item 甲 [量: 3]
item 乙 [量: 5]

step ブロックをつなぐ
  say chain の行で機械の列を置く。ブロックは 1 つ前のブロックの hash を prev に持つ。
  line 鎖: 甲
  line 鎖: 乙

step 中身を書き換える
  say edit の欄を書き換えると hash が変わり、次のブロックの prev と食い違う。
  item 甲 [量: 30]
`,un=`try Chain

queue Pool
chain Blocks [edit: Amount]
ask Name, Amount [into: Pool]
press Build [from: Pool, into: Blocks, take: 1]

item a [Amount: 3]
item b [Amount: 5]

step Link blocks
  say A chain line places a chain. Each block holds the previous block's hash as prev.
  line Blocks: a
  line Blocks: b

step Change a value
  say Changing the edit field changes the hash, and it no longer matches the next block's prev.
  item a [Amount: 30]
`,kn=`chart 好きな果物 [shape: donut]

item apple as りんご [color: rose]
item orange as みかん [color: amber]
item grape as ぶどう [color: violet]

step 集めた答え
  say item で比べる項目を宣言し、color で色を選ぶ。
    ドーナツは宣言した順に12時の向きから弧を並べる。
  set apple: 12
  set orange: 9
  set grape: 4
`,xn=`chart Favorite fruit [shape: donut]

item apple as Apple [color: rose]
item orange as Orange [color: amber]
item grape as Grape [color: violet]

step Answers so far
  say item declares an item to compare, and color picks its color.
    A donut lays the arcs from 12 o'clock in the order declared.
  set apple: 12
  set orange: 9
  set grape: 4
`,vn=`chart 週ごとの来客 [shape: bar]

item shop as 店頭
item web as 通販

step 1週目
  say set で段ごとの項目の値を書く。
  set shop: 40
  set web: 25

step 2週目
  say 段を送ると、棒が前の段の値から動く。
    set を書かない項目は前の段の値を保つ。
  set web: 55
`,fn=`chart Weekly visitors [shape: bar]

item shop as Store
item web as Online

step Week 1
  say set writes the value of an item for the step.
  set shop: 40
  set web: 25

step Week 2
  say Going to the next step moves the bars from the previous values.
    An item without set keeps its previous value.
  set web: 55
`,wn=`chart 1日に使う時間 [shape: dots, unit: 1]

item work as 仕事
item rest as 休み
item move as 移動

step 平日
  say 最初の行の shape で見た目を選ぶ。
    dots は件数を点の数で数え、unit で1点が表す時間を決める。donut は割合を弧の角度で、bar は量を横棒の長さで描く。
  set work: 9
  set rest: 13
  set move: 2
`,An=`chart Hours of the day [shape: dots, unit: 1]

item work as Work
item rest as Rest
item move as Travel

step Weekday
  say shape on the first line picks the look.
    dots counts in dots, and unit sets the hours one dot stands for. donut draws shares as arc angles, and bar draws amounts as bar lengths.
  set work: 9
  set rest: 13
  set move: 2
`,En=`pipe 確認

box alice as Alice
box pool as Pool

step 量を確かめる
  say Poolが、払う量が最低額以上かを確かめる。
  alice -> pool: 交換
  check pool: 0.05 WETH >= 0.04 WETH

step 持ち主を確かめる
  say 数でない確認は、fail の印を書いた時だけ落ちる。
  check pool: owner == alice [fail]
  revert pool: 持ち主でない
`,Cn=`pipe Checks

box alice as Alice
box pool as Pool

step Check the amount
  say The pool checks that the amount paid is at least the minimum.
  alice -> pool: swap
  check pool: 0.05 WETH >= 0.04 WETH

step Check the owner
  say A check of anything but numbers fails only with the fail mark.
  check pool: owner == alice [fail]
  revert pool: not the owner
`,Dn=`flow 判断

box form as 申し込み
choice ok as 書けている？
box send as 受け付ける [color: green]
box back as 書き直す [color: rose]

ok -> back: いいえ

step 確かめる
  say 判断はひし形で描き、出る線に名前を付ける。
  start -> form
  form -> ok: 出す

step 受け付ける
  say 最初の段より前に書いた線は、今回は通らない道として点線で右へ出る。
  ok -> send: はい
  send -> finish
`,Sn=`flow Choice

box form as Form
choice ok as Filled in?
box send as Accept [color: green]
box back as Fix it [color: rose]

ok -> back: No

step Check
  say A choice is a diamond, and each line leaving it has a name.
  start -> form
  form -> ok: Submit

step Accept
  say A line written before the first step is a path not taken, dotted to the right.
  ok -> send: Yes
  send -> finish
`,Tn=`venn 集まりの円

item read as 読書
item move as 運動
item cook as 料理 [color: violet]

step 読書
  say item で集まりを宣言し、set で初めて数を書いた段で円が現れる。円の色は color で決める。
  set read: 40

step 運動
  say & で繋いだ set は重なりの数で、その段で重なりの区画が光る。
  set move: 30
  set read & move: 12

step 料理
  say 区画の中には、それぞれだけの数が出る。
  set cook: 25
  set read & cook: 10
  set move & cook: 8
  set read & move & cook: 4

step どれにも
  say set none は、どれにも入らない数を円の外の枠に出す。
  set none: 15
`,Bn=`venn Set circles

item read as Reading
item move as Exercise
item cook as Cooking [color: violet]

step Reading
  say item declares a set, and its circle appears in the step where set first gives its count. color picks the circle color.
  set read: 40

step Exercise
  say A set joined with & is the count of an overlap, and that region lights up in that step.
  set move: 30
  set read & move: 12

step Cooking
  say Each region shows the count only in it.
  set cook: 25
  set read & cook: 10
  set move & cook: 8
  set read & move & cook: 4

step In none
  say set none shows the count in no set in the frame outside the circles.
  set none: 15
`,Rn=`architecture 色の役

group 手元 as 手元の端末 [color: slate]
  box 利用者 [color: slate]
end

group 店 as 店の仕組み [color: blue]
  box アプリ [color: blue]
  box 決済 [color: coin]
end

step 頼む
  say 箱と区画は同じ 7 つの役から色を選ぶ。
  利用者 -> アプリ: 買う

step 払う
  say 区画の中の箱にも、区画と違う役を付けられる。
  アプリ -> 決済: 請求
`,Pn=`architecture Color

group device as Device [color: slate]
  box user as User [color: slate]
end

group shop as Shop system [color: blue]
  box app as App [color: blue]
  box pay as Payment [color: coin]
end

step Ask
  say Boxes and groups pick their color from the same seven roles.
  user -> app: buy

step Pay
  say A box inside a group can take a different role from its group.
  app -> pay: bill
`,qn=`cycle 色の役

box draft as 下書き [color: slate]
box review as 審査 [color: amber]
box live as 公開する [color: green]

step 出す
  say color で、手順の箱に 7 つの役から色を選ぶ。
  draft -> review [tag: 下書き]

step 通る
  say 弧と札は、受ける側の手順の色で光る。
  review -> live [tag: 通った版]
`,Hn=`cycle Color roles

box draft as Draft [color: slate]
box review as Review [color: amber]
box live as Publish [color: green]

step Submit
  say color picks one of seven roles for a step box.
  draft -> review [tag: draft]

step Pass
  say The arc and the chip light in the color of the receiving step.
  review -> live [tag: approved]
`,Wn=`flow 色の役

box draft as 下書き [color: slate]
choice ok as 審査を通る？
box live as 公開する [color: green]
box fix as 直す [color: rose]

ok -> fix: いいえ

step 出す
  say color で、手順の箱に 7 つの役から色を選ぶ。判断は琥珀で描く。
  draft -> ok: 審査に出す

step 通る
  say 役は意味で選ぶ。終えた手順は green、戻す手順は rose のように揃える。
  ok -> live: はい
`,Mn=`flow Color role

box draft as Draft [color: slate]
choice ok as Review passed?
box live as Publish [color: green]
box fix as Fix it [color: rose]

ok -> fix: No

step Submit
  say color picks one of seven roles for a task box. A choice is drawn in amber.
  draft -> ok: Submit

step Pass
  say Pick roles by meaning, such as green for done and rose for going back.
  ok -> live: Yes
`,Un=`git 色の役

branch main

box 作業ツリー [color: violet]
box 置き場 [color: amber]

step 積む
  say color で、箱に 7 つの役から色を選ぶ。枝の帯の色は上から順に配る。
  commit A on main
  note 作業ツリー: 変えた

step 控える
  say 役は意味で選ぶ。手元の物は violet、控えは amber のように揃える。
  commit B on main
  note 置き場: 控えた
`,Ln=`git Color

branch main

box worktree as Worktree [color: violet]
box stash as Stash [color: amber]

step Commit
  say color picks one of seven roles for a box. Branch lanes get their colors in order from the top.
  commit A on main
  note worktree: Changed

step Stash
  say Pick roles by meaning: violet for what is at hand, amber for what is set aside.
  commit B on main
  note stash: Stashed
`,On=`lineup 色の役

box 待ち
box 選んだ列 [color: amber]

item 自分 [color: amber]
item 甲, 乙

step 並べる
  say color で、列とチップに7つの役から色を選ぶ。
  line 待ち: 甲, 自分, 乙

step 選ぶ
  say 色を付けた列は、選んだ時に縁がその色になる。役は意味で選び、自分の分を amber で揃える。
  line 選んだ列: 自分, 甲
  pick 選んだ列
`,Nn=`lineup Color

box waiting as Waiting
box chosen as Chosen [color: amber]

item mine [color: amber]
item a, b

step Line up
  say color picks one of seven roles for a lane or a chip.
  line waiting: a, mine, b

step Pick
  say A lane with a color lights up its edge in that color when picked. Pick roles by meaning, such as amber for your own chip.
  line chosen: mine, a
  pick chosen
`,Gn=`sankey 色の役

box pay as 給料 [color: slate]
box live as 暮らし [color: blue]
box save as 貯金 [color: green]

step 受け取る
  say color で、棒に 7 つの役から色を選ぶ。

step 分ける
  say 帯は、行き先の箱の色で塗る。
  pay -> live: 70%
  pay -> save: 30%
`,Fn=`sankey Color roles

box pay as Pay [color: slate]
box live as Living [color: blue]
box save as Savings [color: green]

step Get paid
  say color picks one of 7 roles for a bar.

step Split
  say A band takes the color of the box it goes into.
  pay -> live: 70%
  pay -> save: 30%
`,In=`sequence 色の役

box 利用者 [color: slate]
box アプリ [color: blue]
box 決済 [color: coin]
box 倉庫 [color: green]

step 頼む
  say color で箱に色の役を付ける。役は blue や coin など 7 つ。
  利用者 -> アプリ: 買う

step 払う
  say 色は色味ごとに決まり、役が同じ箱は同じ色で描く。
  アプリ -> 決済: 請求
  アプリ -> 倉庫: 出荷
`,Vn=`sequence Color

box user as User [color: slate]
box app as App [color: blue]
box pay as Payment [color: coin]
box store as Warehouse [color: green]

step Ask
  say color gives a box one of seven roles, such as blue or coin.
  user -> app: buy

step Pay
  say The palette sets the colors. Boxes with one role share a color.
  app -> pay: bill
  app -> store: ship
`,zn=`state 色の役

box 下書き [color: slate]
box 審査中 [color: amber]
box 公開中 [color: green]

step 出す
  say color で、状態の箱に 7 つの役から色を選ぶ。
  下書き -> 審査中: 審査に出す

step 通る
  say 役は意味で選ぶ。待つ状態は amber、終えた状態は green のように揃える。
  審査中 -> 公開中: 通す
`,jn=`state Color

box draft as Draft [color: slate]
box review as In review [color: amber]
box live as Published [color: green]

step Submit
  say color picks one of 7 roles for a state box.
  draft -> review: submit

step Approve
  say Pick roles by meaning, such as amber for waiting states and green for finished ones.
  review -> live: approve
`,Jn=`time 色

scale slot 12s 6
row ブロック [color: blue]
zoom 0-2

box 提案者 [color: violet]
box ブロック [color: blue]

step 色を付ける
  say color で箱に色の役を付ける。線は送る側の箱の色で引く。
  提案者 -> ブロック [at: 0]
  now -> 0

step 印の列
  say 印の列にも color を書くと、塗る印がその色になる。
  提案者 -> ブロック [at: 1]
  now -> 1
`,Yn=`time Color

scale slot 12s 6
row block [color: blue]
zoom 0-2

box proposer [color: violet]
box block [color: blue]

step Add color
  say color gives a box a color role. A line takes the color of the box that sends it.
  proposer -> block [at: 0]
  now -> 0

step Row of marks
  say Write color on a row too, and its marks fill in that color.
  proposer -> block [at: 1]
  now -> 1
`,Kn=`tree 色の役

box 記録 [color: violet]
box 控え [color: amber]

step 葉を出す
  say color で、箱に7つの役から色を選ぶ。木の箱の色は決まっている。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  note 記録: 葉が2つ

step 組む
  say 役は意味で選ぶ。元の記録は violet、控えは amber のように揃える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 控え: 根 7a21
`,$n=`tree Color roles

box ledger as Ledger [color: violet]
box backup as Backup [color: amber]

step Add leaves
  say color picks one of 7 roles for a box. Tree boxes have fixed colors.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  note ledger: 2 leaves

step Join
  say Pick roles by meaning: violet for the original and amber for the backup, say.
  node root of tx1, tx2 [hash: 7a21]
  note backup: root 7a21
`,Qn=`git commit

branch main

step 積む
  say commit <名札> on <枝> で枝に commit を積む。積んだ枝の札が新しい commit へ進む。
  commit A on main
  commit B on main

step 字を添える
  say hash と note で、丸の外に hash と一言を添える。
  commit C on main [hash: c41d0e5, note: 価格を丸める]
`,Zn=`git Commit

branch main

step Commit
  say commit <id> on <branch> adds a commit to the branch. The branch's ref moves to the new commit.
  commit A on main
  commit B on main

step Add text
  say hash and note put a hash and a short note beside the circle.
  commit C on main [hash: c41d0e5, note: Round prices]
`,Xn=`git 当て直し

branch main
branch topic

step 分かれる
  say main と topic にそれぞれ commit を積む。
  commit A on main
  topic from A
  commit C on topic
  commit B on main

step 当て直す
  say HEAD を B へ移し、copy で C の変更を B の上に当て直す。枝の札は動かない。
  HEAD -> B
  commit C' on main copy C

step 枝を移す
  say topic を C' へ動かすと、元の C はどの札からも辿れなくなり、点線の丸に変わる。
  topic -> C'
`,ne=`git Replay

branch main
branch topic

step Diverge
  say Add a commit on each of main and topic.
  commit A on main
  topic from A
  commit C on topic
  commit B on main

step Replay
  say Move HEAD to B, and copy replays the change in C on top of B. Branch refs do not move.
  HEAD -> B
  commit C' on main copy C

step Move the branch
  say Move topic to C', and the old C is no longer reached by any ref, so it turns into a dotted circle.
  topic -> C'
`,ee=`git 枝を消す

branch main [note: 残す枝]
branch topic [note: 消す枝]

step 枝を切る
  say main に A を積み、A から topic を切って C を積む。HEAD は topic へ移る。
  commit A on main
  topic from A
  commit C on topic

step main へ戻る
  say HEAD が指している枝は消せない。HEAD を A へ動かしてから main の札を A に重ね、HEAD を main へ戻す。
  HEAD -> A: main へ戻る
  main -> A

step 枝を消す
  say delete topic で topic を消す。topic の札が消え、どの枝からも辿れなくなった C は点線の丸になる。
  delete topic
`,ae=`git Delete a branch

branch main [note: Kept]
branch topic [note: Deleted]

step Cut
  say Add A on main, cut topic from A and add C. HEAD moves to topic.
  commit A on main
  topic from A
  commit C on topic

step Back to main
  say The branch HEAD points at cannot be deleted. Move HEAD to A, then move main onto A, which puts HEAD back on main.
  HEAD -> A: back to main
  main -> A

step Delete
  say delete topic deletes topic. Its ref is gone, and C, which no branch can reach any more, turns into a dotted circle.
  delete topic
`,oe=`architecture 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,se=`architecture Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,te=`flow 線の名前

box a as 甲
box b as 乙
box c as 丙

step 右に置く
  say コロンの後ろが線の名前。縦の線は書かなければ右に置く。
  a -> b: 右の名前

step 左に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  b -> c: 左の名前 [side: left]
`,re=`flow Line label

box a as Alpha
box b as Beta
box c as Gamma

step Right
  say The text after the colon names the line. A vertical line puts it on the right.
  a -> b: right label

step Left
  say side picks where the name goes: above, below, left or right.
  b -> c: left label [side: left]
`,ie=`git 線の名前

branch main

step 積む
  say main に A と B を積む。
  commit A on main
  commit B on main

step 上に置く
  say コロンの後ろが線の名前。書かなければ札の上に置く。
  HEAD -> A: 切り離す

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  HEAD -> B: 戻る [side: below]
`,le=`git Edge label

branch main

step Commit
  say Add A and B on main.
  commit A on main
  commit B on main

step Above
  say The text after the colon is the label. Without side it sits above the tags.
  HEAD -> A: detach

step Below
  say side picks where the label sits: above, below, left or right.
  HEAD -> B: go back [side: below]
`,ce=`sequence 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。横の線は above か below。
  乙 -> 甲: 下の名前 [side: below]
`,pe=`sequence Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above or below.
  b -> a: label below [side: below]
`,ge=`state 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,de=`state Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,be=`time 線の名前

scale epoch 6.4min 4
row 確定
point A at 0
point B at 2

step 下に置く
  say コロンの後ろが線の名前。節目どうしの線は、書かなければ線の下に置く。
  note A: 正当化 [color: violet]
  A -> B: 2/3 を超えた [carry: none]

step 上に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  note B: 正当化 [color: violet]
  A -> B: 次の epoch [carry: none, side: above]
`,he=`time Edge label

scale epoch 6.4min 4
row final
point A at 0
point B at 2

step Below
  say The text after the colon is the label. A line between points puts it below unless you say otherwise.
  note A: Justified [color: violet]
  A -> B: over 2/3 [carry: none]

step Above
  say side picks where the label sits: above, below, left or right.
  note B: Justified [color: violet]
  A -> B: next epoch [carry: none, side: above]
`,me=`tree 線の名前

box 記録

step 組む
  say 葉を2つ出して、親を組む。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  node 根 of 取引1, 取引2 [hash: 7a21]

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  根 -> 記録: 残す

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の4つ。
  記録 -> 根: 照らす [side: below]
`,ye=`tree Line names

box ledger as Ledger

step Join
  say Add two leaves and join them under a parent.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  node root of tx1, tx2 [hash: 7a21]

step Above
  say The text after the colon names the line. Without side it goes above the line.
  root -> ledger: Keep

step Below
  say side picks where the name goes: above, below, left or right.
  ledger -> root: Check [side: below]
`,_e=`architecture 線

box ブラウザ
box サーバー
box DB

step 呼ぶ
  say 線は送る側の名札から受ける側の名札へ -> で引く。
  ブラウザ -> サーバー: GET /items

step 読む
  say 1 つの段に線を何本でも並べられる。書いた順に引く。
  サーバー -> DB: SELECT
  DB -> サーバー: 行

step 返す
  say 返す線は逆向きに書く。
  サーバー -> ブラウザ: 200 OK
`,ue=`architecture Edge

box browser as Browser
box server as Server
box db as DB

step Call
  say An edge runs from the sender tag to the receiver tag with ->.
  browser -> server: GET /items

step Read
  say One step can hold any number of edges, drawn in the order written.
  server -> db: SELECT
  db -> server: rows

step Reply
  say Write the reply the other way round.
  server -> browser: 200 OK
`,ke=`cycle 線

box get as 受け付ける
box work as 対応する
box close as 閉じる

step 受ける
  say 線は前の手順の名札から、輪の次の手順の名札へ -> で引く。
  get -> work [tag: 問い合わせ]

step 閉じる
  say 段ごとに、その段で通る線を書く。1 つ飛ばす線と逆回りの線は書けない。
  work -> close [tag: 答え]

step 次の回へ
  say 最後の手順から最初の手順への線は、次の回へ入る線になる。
  close -> get [tag: 次の件]
`,xe=`cycle Lines

box get as Take it in
box work as Handle it
box close as Close it

step Take in
  say A line goes with -> from one step's id to the id of the next step on the ring.
  get -> work [tag: question]

step Close
  say Each step writes the lines it takes. Lines that skip a step or go backward are refused.
  work -> close [tag: answer]

step Next round
  say A line from the last step to the first one leads into the next round.
  close -> get [tag: next case]
`,ve=`er 線

table users as 客
  field id: U-7 [key]
  field 名前: 田中

table orders as 注文
  field id: O-41 [key]
  field 客id: U-7 [ref: users.id]

step 辿る
  say 線は表の名札と項目の名前を . で繋いで、-> で引く。
  orders.客id -> users.id [tag: U-7]
  pick users.id

step 戻る
  say ref で結んだ項目どうしなら、どちら向きにも引ける。結んでいない項目どうしの線は書けない。
  users.id -> orders.客id [tag: U-7]
  pick orders.id
`,fe=`er Lines

table users as Customers
  field id: U-7 [key]
  field name: Tanaka

table orders as Orders
  field id: O-41 [key]
  field user_id: U-7 [ref: users.id]

step Follow
  say Join the table id and the field name with a dot, and draw the line with ->.
  orders.user_id -> users.id [tag: U-7]
  pick users.id

step Go back
  say Fields linked by ref take a line in either direction. A line between fields that are not linked is refused.
  users.id -> orders.user_id [tag: U-7]
  pick orders.id
`,we=`flow 線

box get as 受け付ける
choice ok as 担当がいる？
box work as 対応する
box wait as 待つ

ok -> wait: いいえ

step 割り当てる
  say 線は前の手順の名札から、次の手順の名札へ -> で引く。
  get -> ok: 調べる

step 進める
  say 段ごとに、その段で通る線を書く。判断から出る線には名前を付ける。
  ok -> work: はい
`,Ae=`flow Line

box get as Accept
choice ok as Owner free?
box work as Handle it
box wait as Wait

ok -> wait: No

step Assign
  say Draw a line with -> from the id of one task to the id of the next.
  get -> ok: Check

step Go on
  say Each step writes the lines it takes. Lines leaving a choice carry a name.
  ok -> work: Yes
`,Ee=`git 線

branch main
branch topic

step 積む
  say main に A と B を積み、A から切った topic に C を積む。
  commit A on main
  commit B on main
  topic from A
  commit C on topic

step HEAD を動かす
  say 線は札の名前から commit の名札へ -> で引き、その札を commit へ動かす。HEAD から引くと、HEAD が枝から離れる。
  HEAD -> B

step 枝の札を動かす
  say 枝の札も同じ形で動かす。札を動かす線は commit を作らない。
  main -> C
`,Ce=`git Edge

branch main
branch topic

step Commit
  say Add A and B on main, cut topic at A, and add C on topic.
  commit A on main
  commit B on main
  topic from A
  commit C on topic

step Move HEAD
  say Draw a line with -> from a ref name to a commit id, and the ref moves there. A line from HEAD detaches HEAD from its branch.
  HEAD -> B

step Move a branch
  say A branch ref moves the same way. A line that moves a ref makes no commit.
  main -> C
`,De=`sankey 線

box fee as 手数料
box pool as 預けた人
box team as 運営

step 集める
  say 取引ごとに手数料を集める。

step 分ける
  say 線は出どころの名札から行き先の名札へ -> で引き、: の後ろに量を書く。
  fee -> pool: 80%
  fee -> team: 20%
`,Se=`sankey Lines

box fee as Fees
box pool as Depositors
box team as Team

step Collect
  say Each trade pays a fee.

step Split
  say A line goes from the source id to the target id with ->, and the amount goes after the :.
  fee -> pool: 80%
  fee -> team: 20%
`,Te=`sequence 線

box ブラウザ
box サーバー
box DB

step 呼ぶ
  say 線は送る側の名札から受ける側の名札へ -> で引く。
  ブラウザ -> サーバー: GET /items

step 読む
  say 1 つの段に線を何本でも並べられる。書いた順に引く。
  サーバー -> DB: SELECT
  DB -> サーバー: 行

step 返す
  say 返す線は逆向きに書く。
  サーバー -> ブラウザ: 200 OK
`,Be=`sequence Edge

box browser as Browser
box server as Server
box db as DB

step Call
  say An edge runs from the sender tag to the receiver tag with ->.
  browser -> server: GET /items

step Read
  say One step can hold any number of edges, drawn in the order written.
  server -> db: SELECT
  db -> server: rows

step Reply
  say Write the reply the other way round.
  server -> browser: 200 OK
`,Re=`state 線

box 受付
box 対応中
box 解決

step 割り当てる
  say 線は移る前の状態の名札から、移った後の状態の名札へ -> で引く。
  受付 -> 対応中: 担当を付ける

step 解く
  say 段ごとに、その段で移る線を書く。
  対応中 -> 解決: 直した

step 開き直す
  say 前の状態へ戻る線も同じ形で書く。
  解決 -> 対応中: 再び開く
`,Pe=`state Edge

box open as Open
box working as In progress
box solved as Solved

step Assign
  say An edge runs with -> from the state before the move to the state after it.
  open -> working: assign

step Solve
  say Each step writes the edges it moves along.
  working -> solved: fixed

step Reopen
  say An edge back to an earlier state is written the same way.
  solved -> working: reopen
`,qe=`time 線

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者
box ブロック

step 列の線
  say at の列の箱どうしを線で結ぶ。運ぶ物を書かなければ封筒が走る。
  提案者 -> ブロック [at: 0]
  now -> 0

step 次の列
  say 針は、その列の線が届くまで目盛りの中で待つ。
  提案者 -> ブロック [at: 1]
  now -> 1
`,He=`time Edge

scale slot 12s 6
row block
zoom 0-2

box proposer
box block

step Column line
  say A line joins the boxes of the column in at. Without carry, an envelope runs along it.
  proposer -> block [at: 0]
  now -> 0

step Next column
  say The needle waits in the unit until the line of that column arrives.
  proposer -> block [at: 1]
  now -> 1
`,We=`tree 線

box 記録

step 組む
  say 葉を2つ出して、親を組む。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  node 根 of 取引1, 取引2 [hash: 7a21]

step 親へ運ぶ
  say 線は名札から名札へ -> で引く。親子の箱どうしの線は木の線の上を走る。
  取引1 -> 根

step 箱へ送る
  say 親子でない箱どうしの線は、箱の向き合う辺を結ぶ。
  根 -> 記録
`,Me=`tree Lines

box ledger as Ledger

step Join
  say Add two leaves and join them under a parent.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  node root of tx1, tx2 [hash: 7a21]

step Up to the parent
  say Draw a line from id to id with ->. A line between a parent and its child runs along the tree line.
  tx1 -> root

step Over to the box
  say A line between boxes that are not parent and child joins their facing sides.
  root -> ledger
`,Ue=`pipe イベント

box alice as Alice
box usdc as USDC
box bob as Bob

hold alice: 100 USDC
hold bob: 0 USDC

step USDCがイベントを出す
  say USDCがAliceの10をBobへ移し、Transferのイベントを出す。
  alice -> usdc: 送る
  move usdc: 10 alice -> bob
  emit usdc: Transfer(alice, bob, 10)

step 呼び出しが戻る
  say 一番外の呼び出しが戻り、イベントが確定する。
  return usdc: true
`,Le=`pipe Events

box alice as Alice
box usdc as USDC
box bob as Bob

hold alice: 100 USDC
hold bob: 0 USDC

step USDC emits an event
  say USDC moves 10 from Alice to Bob and emits a Transfer event.
  alice -> usdc: send
  move usdc: 10 alice -> bob
  emit usdc: Transfer(alice, bob, 10)

step The call returns
  say The outermost call returns, and the event becomes final.
  return usdc: true
`,Oe=`pipe 畳み

box alice as Alice
box agg as Aggregator
box pool as Pool
box weth as WETH

hold pool: 10 WETH
hold alice: 0 WETH

step AliceがAggregatorに任せる
  say AliceがAggregatorを呼ぶ。内側の段は1つの箱にまとまる。
  alice -> agg: まとめて交換 [fold]

step Poolを呼ぶ
  say AggregatorがPoolを呼ぶ。
  agg -> pool: 交換

step WETHを送る
  say PoolがWETHに1を送らせる。
  pool -> weth: 送る
  move weth: 1 pool -> alice
  return weth: true
  return pool: 1 WETH

step 戻る
  say Aggregatorが戻り、変更が確定する。
  return agg: 1 WETH
`,Ne=`pipe Folds

box alice as Alice
box agg as Aggregator
box pool as Pool
box weth as WETH

hold pool: 10 WETH
hold alice: 0 WETH

step Alice hands it to the aggregator
  say Alice calls the aggregator. The steps inside fold into one box.
  alice -> agg: swap all [fold]

step Call the pool
  say The aggregator calls the pool.
  agg -> pool: swap

step Send WETH
  say The pool has WETH send 1.
  pool -> weth: send
  move weth: 1 pool -> alice
  return weth: true
  return pool: 1 WETH

step Return
  say The aggregator returns, and the changes become final.
  return agg: 1 WETH
`,Ge=`pipe 要点

box alice as Alice
box vault as Vault

hold vault: total 0

step 預ける
  say AliceがVaultに預け、Vaultが預かった額を書き込む。
  gist 書き込んだ値は、一番外の呼び出しが戻るまで暫定のまま
  alice -> vault: 預ける
  write vault: total 100

step 戻る
  say Vaultが戻る。
  gist 一番外の呼び出しが戻った時に、全ての変更が確定する
  return vault: ok
`,Fe=`pipe Key points

box alice as Alice
box vault as Vault

hold vault: total 0

step Deposit
  say Alice deposits into the vault, and the vault writes the amount it holds.
  gist The written value stays provisional until the outermost call returns
  alice -> vault: deposit
  write vault: total 100

step Return
  say The vault returns.
  gist Every change becomes final when the outermost call returns
  return vault: ok
`,Ie=`architecture 区画

group 手元 as 手元の端末 [note: 利用者の側, color: slate, icon: user]
  box ブラウザ
end

group 雲 as クラウド [note: サービスの側, color: blue, icon: cloud]
  box アプリ
  box DB
end

step 開く
  say group から end までの箱を 1 つの区画に囲む。
  ブラウザ -> アプリ: 開く

step 読む
  say 区画にも、名前の下の小さな字と色の役と絵を付けられる。
  アプリ -> DB: 読む
`,Ve=`architecture Group

group device as Device [note: the user side, color: slate, icon: user]
  box browser as Browser
end

group cloud as Cloud [note: the service side, color: blue, icon: cloud]
  box app as App
  box db as DB
end

step Open
  say The boxes between group and end sit inside one group.
  browser -> app: open

step Read
  say A group takes small text, a color role and a picture too.
  app -> db: read
`,ze=`pipe 槽

box alice as Alice
box usdc as USDC
box bob as Bob

hold alice: 100 USDC
hold bob: 0 USDC

step USDCが残高を移す
  say USDCがAliceの10をBobへ移す。移した分は暫定。
  alice -> usdc: 送る
  move usdc: 10 alice -> bob

step 呼び出しが戻る
  say 一番外の呼び出しが戻り、移した分が確定する。
  return usdc: true
`,je=`pipe Tanks

box alice as Alice
box usdc as USDC
box bob as Bob

hold alice: 100 USDC
hold bob: 0 USDC

step USDC moves a balance
  say USDC moves 10 from Alice to Bob. The move is pending.
  alice -> usdc: send
  move usdc: 10 alice -> bob

step The call returns
  say The outermost call returns, and the move becomes final.
  return usdc: true
`,Je=`architecture 絵

group 雲 as クラウド [icon: cloud]
  box アプリ [icon: app]
  box DB [icon: db]
end

group 手元 as 手元の端末 [icon: user]
  box 利用者 [icon: user]
end

step 開く
  say 箱と区画のどちらにも icon で絵を付けられる。
  利用者 -> アプリ: 開く

step 読む
  say 区画の絵は区画の名前の左に置く。
  アプリ -> DB: 読む
`,Ye=`architecture Icon

group cloud as Cloud [icon: cloud]
  box app as App [icon: app]
  box db as DB [icon: db]
end

group device as Device [icon: user]
  box user as User [icon: user]
end

step Open
  say Both boxes and groups take a picture with icon.
  user -> app: open

step Read
  say A group shows its picture left of the group name.
  app -> db: read
`,Ke=`cycle 絵

box draft as 下書き [icon: doc]
box review as 審査 [icon: clock]
box live as 公開 [icon: globe]

step 出す
  say icon で手順の箱に絵を付ける。
  draft -> review [tag: 下書き]

step 通る
  say 絵は名前の上に置く。
  review -> live [tag: 通った版]
`,$e=`cycle Icons

box draft as Draft [icon: doc]
box review as Review [icon: clock]
box live as Publish [icon: globe]

step Submit
  say icon puts a picture on a step box.
  draft -> review [tag: draft]

step Pass
  say The picture sits above the name.
  review -> live [tag: approved]
`,Qe=`flow 絵

box draft as 下書き [icon: doc]
box review as 審査 [icon: clock]
box live as 公開 [icon: globe]

step 出す
  say icon で手順の箱に絵を付ける。
  draft -> review: 審査に出す

step 通る
  say 絵は名前の上に置く。
  review -> live: 通す
`,Ze=`flow Icon

box draft as Draft [icon: doc]
box review as Review [icon: clock]
box live as Live [icon: globe]

step Submit
  say icon puts a picture on a task box.
  draft -> review: Submit

step Pass
  say The picture sits above the name.
  review -> live: Pass
`,Xe=`git 絵

branch main

box 作業ツリー [icon: doc]
box 遠く as 遠くの repo [icon: cloud]

step 積む
  say icon で箱に絵を付ける。
  commit A on main
  note 作業ツリー: A を書いた

step 送る
  say 絵は箱の名前の上に置く。
  commit B on main
  note 遠く: B を受け取った
`,na=`git Icon

branch main

box worktree as Worktree [icon: doc]
box remote as Remote repo [icon: cloud]

step Commit
  say icon puts a picture on a box.
  commit A on main
  note worktree: Wrote A

step Push
  say The picture sits above the box name.
  commit B on main
  note remote: Received B
`,ea=`pipe 絵

box alice as Alice
box vault as Vault [icon: shield]

step AliceがVaultを呼ぶ
  say 形を書いた関係者は、その形で描く。
  alice -> vault: 預ける

step Vaultが戻る
  say 呼ばれた側が戻ると、呼び出しの管が閉じる。
  return vault: ok
`,aa=`pipe Icons

box alice as Alice
box vault as Vault [icon: shield]

step Alice calls the vault
  say A party with an icon is drawn with that shape.
  alice -> vault: deposit

step The vault returns
  say When the callee returns, the call pipe closes.
  return vault: ok
`,oa=`sequence 絵

box 利用者 [icon: user]
box アプリ [icon: app]
box 鍵 as 鍵の置き場 [icon: key]
box DB [icon: db]

step 開く
  say icon で箱の名前の上に絵を置く。絵は user や db の名前で選ぶ。
  利用者 -> アプリ: 開く

step 読む
  say 絵があると、箱が何かを名前より先に見分けられる。
  アプリ -> 鍵: 鍵を借りる
  アプリ -> DB: 読む
`,sa=`sequence Icon

box user as User [icon: user]
box app as App [icon: app]
box vault as Key vault [icon: key]
box db as DB [icon: db]

step Open
  say icon puts a picture above the box name, such as user or db.
  user -> app: open

step Read
  say The picture tells what a box is before you read its name.
  app -> vault: borrow key
  app -> db: read
`,ta=`state 絵

box 下書き [icon: doc]
box 審査中 [icon: clock]
box 公開中 [icon: globe]

step 出す
  say icon で状態の箱に絵を付ける。
  下書き -> 審査中: 審査に出す

step 通る
  say 運ぶ物は、着いた状態の絵柄の横の置き場に留まる。
  審査中 -> 公開中: 通す
`,ra=`state Icon

box draft as Draft [icon: doc]
box review as In review [icon: clock]
box live as Published [icon: globe]

step Submit
  say icon puts a picture on a state box.
  draft -> review: submit

step Approve
  say The carried item rests in the slot beside the icon of the state it reaches.
  review -> live: approve
`,ia=`time 絵

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者 [icon: user]
box ブロック [icon: box]

step 絵を付ける
  say icon で、箱の名前の上に絵柄を付ける。
  提案者 -> ブロック [at: 0]
  now -> 0

step 続ける
  say 使える絵柄の名前は、絵の部品の頁に並んでいる。
  提案者 -> ブロック [at: 1]
  now -> 1
`,la=`time Icon

scale slot 12s 6
row block
zoom 0-2

box proposer [icon: user]
box block [icon: box]

step Add an icon
  say icon puts a picture above the box name.
  proposer -> block [at: 0]
  now -> 0

step Next
  say The icon names you can use are listed on the icon part page.
  proposer -> block [at: 1]
  now -> 1
`,ca=`tree 絵

box 記録 [icon: doc]
box 遠く as 遠くの台帳 [icon: cloud]

step 葉を出す
  say icon で箱に絵を付ける。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  note 記録: 葉が2つ

step 組む
  say 絵は箱の名前の上に置く。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 遠く: 根を受け取った
`,pa=`tree Icons

box ledger as Ledger [icon: doc]
box remote as Remote ledger [icon: cloud]

step Add leaves
  say icon gives a box a picture.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  note ledger: 2 leaves

step Join
  say The picture sits above the box name.
  node root of tx1, tx2 [hash: 7a21]
  note remote: got the root
`,ga=`mind 考え

step 題を置く
  say of の無い idea の行が真ん中の題になる。
  idea 題 as 考える題

step 枝を伸ばす
  say of <親> を書いた考えは、その段で親からの枝の線と一緒に現れる。
  idea 左 as 左の枝 of 題 [color: blue]
  idea 右 as 右の枝 of 題

step 葉を足す
  say 枝の子の葉は枝の外側に並び、枝の色を引き継ぐ。
  idea 葉1 as 左の葉 of 左
  idea 葉2 as 右の葉 of 右
`,da=`mind Ideas

step Put the title
  say An idea line without of becomes the centre.
  idea title as The topic

step Grow branches
  say An idea with of <parent> appears in its step with a branch line from its parent.
  idea left as Left branch of title [color: blue]
  idea right as Right branch of title

step Add leaves
  say Leaves sit outside their branch and take its color.
  idea leaf1 as Left leaf of left
  idea leaf2 as Right leaf of right
`,ba=`lineup チップ

box 待ち

item 甲, 乙 [color: amber]
item 丙
item 済1, 済2 [color: green, label: ✓]

step 並べる
  say item で、列に並べるチップを最初の step より前に宣言する。color で色を付ける。
  line 待ち: 甲, 乙, 丙

step 字を載せる
  say label で、チップに4字までの字を載せる。
  line 待ち: 甲, 乙, 丙, 済1, 済2
`,ha=`lineup Chips

box waiting as Waiting

item a, b [color: amber]
item c
item done1, done2 [color: green, label: ✓]

step Line up
  say item declares the chips the lanes hold, before the first step. color fills a chip.
  line waiting: a, b, c

step Add labels
  say label puts up to 4 characters on a chip.
  line waiting: a, b, c, done1, done2
`,ma=`tree 葉と札

step 葉を出す
  say leaf の行で葉を出す。hash に値を書くと、箱に値を、葉の下の札に名札を出す。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 親を組む
  say 札は最初の段から出ていて、葉が現れると点線で結ばれる。
  node 根 of 取引1, 取引2 [hash: 7a21]
`,ya=`tree Leaf and card

step Add leaves
  say A leaf line adds a leaf. With a hash, the box shows the value and a card below shows the id.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Cards are there from the first step, and a dotted line ties them to the leaf when it appears.
  node root of tx1, tx2 [hash: 7a21]
`,_a=`lineup 凡例

box 窓口

item 申請, 照会 [note: 届いた書類]
item 至急 [color: amber, note: 急ぎの書類]

step 並べる
  say item の説明は図の下の凡例に、説明ごとに 1 行で出る。
  line 窓口: 至急, 申請, 照会
`,ua=`lineup Legend

box Desk

item apply, query [note: A paper that arrived]
item rush [color: amber, note: An urgent paper]

step Line up
  say Item notes appear in the legend under the diagram, one row per note.
  line Desk: rush, apply, query
`,ka=`sequence 生存線

box 利用者
box アプリ
box サーバー

step 開く
  say 時系列図では、箱の下に縦の線が伸び、上から下へ時が進む。
  利用者 -> アプリ: 開く

step 取りに行く
  say 段が進むほど、線は下の行に引かれる。
  アプリ -> サーバー: 読む
  サーバー -> アプリ: 返す
`,xa=`sequence Lifeline

box user as User
box app as App
box server as Server

step Open
  say A line runs down from each box, and time moves down the page.
  user -> app: open

step Fetch
  say Each later step draws its edges on a lower row.
  app -> server: read
  server -> app: data
`,va=`lineup 上限

box やること
box 作業中 [color: violet, limit: 2]

item 検索, 通知, 決済

step 並べる
  say やることに 3 件を並べる。
  line やること: 検索, 通知, 決済

step 取る
  say limit: 2 の箱には、札を 2 件まで並べられる。
  line 作業中: 検索, 通知
  line やること: 決済
`,fa=`lineup Limit

box Todo
box Doing [color: violet, limit: 2]

item search, notify, pay

step Queue
  say Three chips wait in Todo.
  line Todo: search, notify, pay

step Take
  say A box with limit: 2 holds at most two chips.
  line Doing: search, notify
  line Todo: pay
`,wa=`lineup 列の並び

box 待ち
box 箱詰め

item 甲 [color: amber]
item 乙, 丙, 丁

step 並べる
  say 段の中の line の行で、列のチップを書いた順に並べる。
  line 待ち: 甲, 乙, 丙, 丁

step 並べ替える
  say ほかの列に居たチップは、その席から滑って来る。元の列を書かなければ、元の席にも残る。
  line 箱詰め: 丙, 甲, 乙

step 減らす
  say 列から外したチップは消える。1列に並べられるのは12枚まで。
  line 待ち: 丁
`,Aa=`lineup Lane order

box waiting as Waiting
box packed as Packed

item a [color: amber]
item b, c, d

step Line up
  say A line line inside a step lines up the chips of a lane in the order written.
  line waiting: a, b, c, d

step Reorder
  say A chip that was in another lane slides over from its seat. If that lane is not rewritten, the chip stays there too.
  line packed: c, a, b

step Remove
  say A chip left out of a lane disappears. A lane holds up to 12 chips.
  line waiting: d
`,Ea=`architecture 飛び先

box アプリ
box 決済 as 決済の仕組み [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  アプリ -> 決済: 請求

step 返す
  say 箱の中の仕組みを別の図に描いた時は、その図の頁を飛び先にする。
  決済 -> アプリ: 済
`,Ca=`architecture Link

box app as App
box pay as Payment system [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  app -> pay: Charge

step Answer
  say When another diagram draws what is inside the box, link to its page.
  pay -> app: Done
`,Da=`cycle 飛び先

box order as 注文を受ける
box pay as 支払いを確かめる [link: https://github.com/cardene777/dragon]

step 受ける
  say link で手順の箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  order -> pay [tag: 注文]

step 確かめる
  say 確かめ方を別の図に描いた時は、その図の頁を飛び先にする。
  pay -> order [tag: 次の注文]
`,Sa=`cycle Links

box order as Take the order
box pay as Check the payment [link: https://github.com/cardene777/dragon]

step Take
  say link gives a step box a target. Press the box in the drawn diagram to go there.
  order -> pay [tag: order]

step Check
  say When the check is drawn in another diagram, link to that diagram's page.
  pay -> order [tag: next order]
`,Ta=`flow 飛び先

box order as 注文を受ける
box pay as 支払いを確かめる [link: https://github.com/cardene777/dragon]

step 受ける
  say link で手順の箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  start -> order

step 確かめる
  say 確かめ方を別の図に描いた時は、その図の頁を飛び先にする。
  order -> pay: 払った
  pay -> finish
`,Ba=`flow Link

box order as Take the order
box pay as Check the payment [link: https://github.com/cardene777/dragon]

step Take
  say link gives a task box a target, so pressing the box in the drawn figure opens it.
  start -> order

step Check
  say When the check has its own diagram, link to that page.
  order -> pay: Paid
  pay -> finish
`,Ra=`git 飛び先

branch main

box 遠く as 遠くの repo [link: https://github.com/cardene777/dragon]

step 積む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  commit A on main

step 送る
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  commit B on main
  note 遠く: B を受け取った
`,Pa=`git Link

branch main

box remote as Remote repo [link: https://github.com/cardene777/dragon]

step Commit
  say link on a box makes the box a link to that place in the drawn diagram.
  commit A on main

step Push
  say Write a path that starts with / or a URL that starts with http:// or https://.
  commit B on main
  note remote: Received B
`,qa=`sequence 飛び先

box 利用者
box 認可 as 認可サーバー [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  利用者 -> 認可: 許可を求める

step 返す
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  認可 -> 利用者: 許可した
`,Ha=`sequence Link

box user as User
box auth as Auth server [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  user -> auth: Ask for access

step Answer
  say Write a path that starts with / or a URL that starts with http:// or https://.
  auth -> user: Granted
`,Wa=`state 飛び先

box 注文 as 注文を受けた
box 支払い as 支払いを確かめる [link: https://github.com/cardene777/dragon]

step 受ける
  say link で状態の箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  start -> 注文

step 確かめる
  say 確かめ方を別の図に描いた時は、その図の頁を飛び先にする。
  注文 -> 支払い: 払った
  支払い -> finish
`,Ma=`state Link

box order as Order received
box check as Checking payment [link: https://github.com/cardene777/dragon]

step Receive
  say link on a state box makes the box a link to that place in the drawn diagram.
  start -> order

step Check
  say When another diagram draws how the check works, link to its page.
  order -> check: Paid
  check -> finish
`,Ua=`time 飛び先

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者
box ブロック [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  提案者 -> ブロック [at: 0]
  now -> 0

step 続ける
  say 箱の中の仕組みを別の図に描いた時は、その図の頁を飛び先にする。
  提案者 -> ブロック [at: 1]
  now -> 1
`,La=`time Link

scale slot 12s 6
row block
zoom 0-2

box proposer
box block [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  proposer -> block [at: 0]
  now -> 0

step Next
  say When another diagram draws what is inside the box, link to its page.
  proposer -> block [at: 1]
  now -> 1
`,Oa=`tree 飛び先

box 遠く as 遠くの台帳 [link: https://github.com/cardene777/dragon]

step 葉を出す
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 遠く: 根を受け取った
`,Na=`tree Links

box remote as Remote ledger [link: https://github.com/cardene777/dragon]

step Add leaves
  say link gives a box a target. Clicking the box in the drawn diagram goes there.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Write a path starting with / or a URL starting with http:// or https://.
  node root of tx1, tx2 [hash: 7a21]
  note remote: got the root
`,Ga=`try 記録の列

queue 甲組 [order: 期限]
queue 乙組 [order: 期限]
log 記録 [all: 答え = 可, yes: 通す, no: 戻す]
ask 名前, 組, 答え, 期限 [into: 組]
choose 組: 甲組, 乙組
choose 答え: 可, 不可
press 甲組を決める [from: 甲組, into: 記録, take: 2]
press 乙組を決める [from: 乙組, into: 記録, take: 2]
side 甲組, 乙組

item 一 [組: 甲組, 答え: 可, 期限: 3]
item 二 [組: 甲組, 答え: 可, 期限: 2]
item 三 [組: 乙組, 答え: 不可, 期限: 4]

step 組ごとに並ぶ
  say into に組の欄を書くと、チップは組で選んだ値と同じ名札の待ち行列に並ぶ。
  line 甲組: 一, 二
  line 乙組: 三

step 選んだ組へ送る
  say 組に乙組を選んで送ると、チップは乙組に入る。
  ask 四, 乙組, 可, 1

step 記録にまとめる
  say 釦を押すと、待ち行列の上から 2 件が 1 つの記録にまとまる。記録は番号と中のチップだけを持ち、prev と hash を持たない。
  press 甲組を決める

step 印を出す
  say all の欄が全て 可 なら 通す、1 つでも違えば 戻す の印が付く。
  press 乙組を決める
`,Fa=`try Log

queue GroupA [order: Due]
queue GroupB [order: Due]
log Records [all: Vote = Yes, yes: Pass, no: Return]
ask Name, Group, Vote, Due [into: Group]
choose Group: GroupA, GroupB
choose Vote: Yes, No
press DecideA [from: GroupA, into: Records, take: 2]
press DecideB [from: GroupB, into: Records, take: 2]
side GroupA, GroupB

item a [Group: GroupA, Vote: Yes, Due: 3]
item b [Group: GroupA, Vote: Yes, Due: 2]
item c [Group: GroupB, Vote: No, Due: 4]

step Lined up by group
  say With a field in into, a chip joins the queue whose id matches the value chosen for that field.
  line GroupA: a, b
  line GroupB: c

step Send to the chosen group
  say Choose GroupB and send, and the chip enters GroupB.
  ask d, GroupB, Yes, 1

step Gather into a record
  say Pressing the button gathers the top 2 chips of the queue into one numbered record. A record holds only its number and chips, with no prev or hash.
  press DecideA

step Show the mark
  say When every all field is Yes the record gets Pass, and if even one differs it gets Return.
  press DecideB
`,Ia=`matrix 置く課題

axis 手間 [from: 小さい, to: 大きい]
axis 効き目 [from: 小さい, to: 大きい]

box now as 今やる
box plan as 計画する
box spare as 手が空いたら
box drop as やらない

item login as ログインを速く
item pay as 決済を足す
item word as 文言の直し
item docs as 手引きを足す

step 並べる
  say item の行で課題を宣言すると、左の一覧に書いた順に並ぶ。

step 置く
  say line の行で、課題の札を一覧から区画へ滑らせる。
  line now: login
  line plan: pay

step まとめて置く
  say , で区切ると 1 行で何枚でも置ける。
  line spare: word, docs
`,Va=`matrix Placed items

axis Effort [from: low, to: high]
axis Impact [from: low, to: high]

box now as Do now
box plan as Plan it
box spare as When free
box drop as Skip

item login as Faster login
item pay as Add payments
item word as Fix wording
item docs as Add a guide

step Line up
  say Each item line declares an item, and the items wait in the list on the left in written order.

step Place
  say A line line slides an item's card from the list into an area.
  line now: login
  line plan: pay

step Place several
  say Separate items with , to place any number on one line.
  line spare: word, docs
`,za=`git merge commit

branch main
branch topic

step 分かれる
  say main と topic にそれぞれ commit を積む。
  commit A on main
  topic from A
  commit C on topic
  commit B on main

step 取り込む
  say merge で topic を取り込むと、B と C の 2 つを親に持つ M ができる。main の札だけが進む。
  commit M on main merge topic
`,ja=`git Merge commit

branch main
branch topic

step Diverge
  say Add a commit on each of main and topic.
  commit A on main
  topic from A
  commit C on topic
  commit B on main

step Merge
  say merge brings topic in and makes M, with B and C as parents. Only main's ref moves.
  commit M on main merge topic
`,Ja=`tree 組んだ親

step 葉を出す
  say 親を組む前に、子になる葉を書く。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  leaf 取引3 [hash: c41d]
  leaf 取引4 [hash: e5f8]

step 親を組む
  say node の行で、of の後ろに書いた子から親を組む。親は子の真ん中の上に置かれる。
  node 左 of 取引1, 取引2 [hash: 7a21]
  node 右 of 取引3, 取引4 [hash: b9e4]

step 根まで組む
  say 親を持たない箱が最後に1つ残り、それが根になる。
  node 根 of 左, 右 [hash: e71c]
`,Ya=`tree Parent node

step Add leaves
  say Write the leaves that become children before the parent.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  leaf tx3 [hash: c41d]
  leaf tx4 [hash: e5f8]

step Build parents
  say A node line builds a parent from the children written after of. The parent sits above the middle of them.
  node left of tx1, tx2 [hash: 7a21]
  node right of tx3, tx4 [hash: b9e4]

step Up to the root
  say One box is left without a parent at the end. That box is the root.
  node root of left, right [hash: e71c]
`,Ka=`architecture 小さな字

group 手元 as 手元の端末 [note: 利用者の側]
  box 財布 [note: 残高 5000 円]
end

group 売り場 as 店の仕組み [note: 売る側]
  box 店 as 店のアプリ [note: 待っている]
end

step 払う
  say note で箱と区画の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,$a=`architecture Note

group device as Device [note: the user side]
  box wallet as Wallet [note: balance 50 USD]
end

group store as Shop system [note: the selling side]
  box shop as Shop app [note: waiting]
end

step Pay
  say note adds small text under the name of a box or a group.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites a box's small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,Qa=`cycle 小さな字

box stock as 在庫を見る [note: 残り 1 個]
box sell as 売る [note: 入荷待ち]

step 見る
  say note で手順の名前の下に小さな字を添える。
  stock -> sell [tag: 最後の 1 個]

step 売り切れる
  say 段の中の note の行で、その段から小さな字を書き換える。
  sell -> stock [tag: 注文]
  note stock: 残り 0 個
`,Za=`cycle Small text

box stock as Check stock [note: 1 left]
box sell as Sell [note: awaiting stock]

step Check
  say note adds small text under a step name.
  stock -> sell [tag: last one]

step Sell out
  say A note line inside a step rewrites the small text from that step.
  sell -> stock [tag: order]
  note stock: 0 left
`,Xa=`flow 小さな字

box stock as 在庫を見る [note: 残り 1 個]
box sell as 売る [note: 入荷待ち]

step 見る
  say note で手順の名前の下に小さな字を添える。
  start -> stock

step 売り切れる
  say 段の中の note の行で、その段から小さな字を書き換える。
  stock -> sell: 最後の 1 個
  note stock: 残り 0 個
`,no=`flow Small text

box stock as Check stock [note: 1 left]
box sell as Sell [note: awaiting stock]

step Check
  say note adds small text under the name of a task.
  start -> stock

step Sell out
  say A note line inside a step rewrites the small text from that step on.
  stock -> sell: The last one
  note stock: 0 left
`,eo=`git 小さな字

branch main

box 作業ツリー [note: 変更なし]

step 書き換える
  say note で箱の名前の下に小さな字を添える。
  commit A on main
  note 作業ツリー: 2 つ書き換えた

step 積む
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  commit B on main
  note 作業ツリー: 変更なし
`,ao=`git Note

branch main

box worktree as Worktree [note: Clean]

step Edit
  say note adds small text under the name of a box.
  commit A on main
  note worktree: Two files changed

step Commit
  say A note line inside a step rewrites the small text of the box from that step.
  commit B on main
  note worktree: Clean
`,oo=`lineup 小さな字

box 入札A [note: 0 ETH]
box 入札B [note: 0 ETH]

item 一, 二, 三

step 並べる
  say note で、列の名前の下に値の札を添える。
  line 入札A: 一, 二
  line 入札B: 三, 一

step 書き換える
  say 段の中の note の行で、その段から値の札の字を書き換える。
  note 入札A: 0.05 ETH
  note 入札B: 0.12 ETH
`,so=`lineup Small text

box bidA as Bid A [note: 0 ETH]
box bidB as Bid B [note: 0 ETH]

item one, two, three

step Line up
  say note adds a value chip under the lane name.
  line bidA: one, two
  line bidB: three, one

step Rewrite
  say A note line inside a step rewrites that text from that step on.
  note bidA: 0.05 ETH
  note bidB: 0.12 ETH
`,to=`sequence 小さな字

box 財布 [note: 残高 5000 円]
box 店 [note: 待っている]

step 払う
  say note で箱の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,ro=`sequence Note

box wallet as Wallet [note: balance 50 USD]
box shop as Shop [note: waiting]

step Pay
  say note adds small text under the box name.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites the small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,io=`state 小さな字

box 在庫あり [note: 残り 1 個]
box 品切れ [note: 入荷待ち]

step 売り切れる
  say note で状態の名前の下に小さな字を添える。
  在庫あり -> 品切れ: 最後の 1 個が売れた

step 入荷する
  say 段の中の note の行で、その段から状態の小さな字を書き換える。
  品切れ -> 在庫あり: 入荷した
  note 在庫あり: 残り 10 個
`,lo=`state Note

box stocked as In stock [note: 1 left]
box out as Sold out [note: awaiting stock]

step Sell out
  say note adds small text under the state name.
  stocked -> out: last one sold

step Restock
  say A note line inside a step rewrites the small text from that step on.
  out -> stocked: restocked
  note stocked: 10 left
`,co=`time 小さな字

scale slot 12s 6
row ブロック
point C at 0
zoom 0-2

box 提案者 [note: 1 人を選ぶ]
box ブロック

step 箱の下の字
  say note で、箱の名前の下に小さな字を添える。
  提案者 -> ブロック [at: 0]
  now -> 0

step 書き換える
  say 段の中の note の行で、節目の状態の字を書き換える。
  note C: 提案済み
`,po=`time Note

scale slot 12s 6
row block
point C at 0
zoom 0-2

box proposer [note: one is picked]
box block

step Small text
  say note adds small text under the box name.
  proposer -> block [at: 0]
  now -> 0

step Rewrite
  say A note line inside a step rewrites the state of a point.
  note C: Proposed
`,go=`tree 小さな字

box 記録 [note: まだ無い]

step 葉を出す
  say note で箱の名前の下に小さな字を添える。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 記録: 根 7a21
`,bo=`tree Small text

box ledger as Ledger [note: empty]

step Add leaves
  say note adds small text under the box name.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say A note line inside a step rewrites that small text from that step on.
  node root of tx1, tx2 [hash: 7a21]
  note ledger: root 7a21
`,ho=`lineup 置き場

box 受付 [order: none]
box 窓口

item 申請, 照会, 変更

step 置く
  say order: none の箱は順番の無い置き場になり、チップを格子に並べる。
  line 受付: 申請, 照会, 変更

step 並べる
  say 札の箱には、チップを書いた順に上から積む。
  line 窓口: 照会, 申請, 変更
`,mo=`lineup Pool

box Inbox [order: none]
box Desk

item apply, query, change

step Drop
  say A box with order: none is a pool with no order, and its chips sit on a grid.
  line Inbox: apply, query, change

step Stack
  say A card stacks its chips from the top in the order written.
  line Desk: query, apply, change
`,yo=`lineup 選ぶ

box 案A [note: 5]
box 案B [color: amber, note: 8]
box 案C [note: 3]

item 一, 二, 三, 四

step 並べる
  say 3つの列に、それぞれの並びを書く。
  line 案A: 一, 二, 三
  line 案B: 二, 四, 一
  line 案C: 三, 一

step 選ぶ
  say pick で、選んだ列の縁に色が付き、ほかの列が薄くなる。
  pick 案B
`,_o=`lineup Pick

box planA as Plan A [note: 5]
box planB as Plan B [color: amber, note: 8]
box planC as Plan C [note: 3]

item one, two, three, four

step Line up
  say Each of the three lanes gets its own order.
  line planA: one, two, three
  line planB: two, four, one
  line planC: three, one

step Pick
  say pick lights up the edge of a lane and fades the other lanes.
  pick planB
`,uo=`time 節目

scale epoch 6.4min 4 [from: 100]
row 確定
point C100 at 0
point C101 at 2

step 状態を変える
  say point で目盛りの印の下に節目の旗の丸を置き、note で状態の字を書き換える。
  note C100: 提案済み [color: blue]
  now -> 0

step 色を変える
  say note の color で丸の色を変える。節目どうしは線で結べる。
  note C100: 確定 [color: green]
  C100 -> C101: 次の epoch [carry: none]
  now -> 2
`,ko=`time Point

scale epoch 6.4min 4 [from: 100]
row final
point C100 at 0
point C101 at 2

step Change the state
  say point puts a flag circle under the marks of a unit, and note rewrites its state.
  note C100: Proposed [color: blue]
  now -> 0

step Change the color
  say color on note changes the color of the circle. Lines can join two points.
  note C100: Final [color: green]
  C100 -> C101: next epoch [carry: none]
  now -> 2
`,xo=`try 釦

queue 待ち [order: 手数料]
chain 鎖
ask 名前, 手数料 [into: 待ち]
press 作る [from: 待ち, into: 鎖, take: 2, at: 鎖]

item 甲 [手数料: 3]
item 乙 [手数料: 8]
item 丙 [手数料: 5]

step 待っている
  say press の行で釦を置く。at に書いた部品の所に出る。
  line 待ち: 甲, 乙, 丙

step 釦を押す
  say 押すと、待ち行列の上から take 件を機械の列の新しいブロックへ移す。
  press 作る
`,vo=`try Button

queue Pool [order: Fee]
chain Blocks
ask Name, Fee [into: Pool]
press Build [from: Pool, into: Blocks, take: 2, at: Blocks]

item a [Fee: 3]
item b [Fee: 8]
item c [Fee: 5]

step Waiting
  say A press line places a button. It sits on the part written in at.
  line Pool: a, b, c

step Press it
  say Pressing it moves the top take chips of the queue into a new block of the chain.
  press Build
`,fo=`try 待ち行列

queue 待ち [order: 手数料, accept: "甲, 乙, 丙, 丁"]
ask 名前, 手数料 [into: 待ち]

item 甲 [手数料: 3]
item 乙 [手数料: 8]

step 高い順に並ぶ
  say queue の行で待ち行列を置く。order に書いた欄の値の高い順に、上から並ぶ。
  line 待ち: 甲, 乙

step 間に入る
  say 送ったチップも、その欄の値の順の所に入る。accept に書いた名前のチップだけが入り、ほかの名前では送れない。
  ask 丙, 5
`,wo=`try Queue

queue Pool [order: Fee, accept: "a, b, c, d"]
ask Name, Fee [into: Pool]

item a [Fee: 3]
item b [Fee: 8]

step Highest first
  say A queue line places a queue. Chips line up from the highest value of the field in order.
  line Pool: a, b

step Cut in
  say A sent chip also takes its place by the value of that field. Only chips named in accept get in, and other names cannot be sent.
  ask c, 5
`,Ao=`pipe 呼び出しの管

box alice as Alice
box router as Router
box pool as Pool

step AliceがRouterを呼ぶ
  say AliceがRouterを呼び、管が開く。
  alice -> router: 交換

step RouterがPoolを呼ぶ
  say 呼び出しが深くなり、管が1段下がる。
  router -> pool: 見積もり

step Poolが戻る
  say Poolが値を返して戻り、管は点線になる。
  return pool: 0.05 WETH

step Routerが戻る
  say 一番外の呼び出しが戻る。
  return router: 済み
`,Eo=`pipe Call pipes

box alice as Alice
box router as Router
box pool as Pool

step Alice calls the router
  say Alice calls the router, and a pipe opens.
  alice -> router: swap

step The router calls the pool
  say The call goes deeper, and its pipe runs one level lower.
  router -> pool: quote

step The pool returns
  say The pool returns a value, and its pipe turns dotted.
  return pool: 0.05 WETH

step The router returns
  say The outermost call returns.
  return router: done
`,Co=`pipe 取り消し

box alice as Alice
box usdc as USDC
box pool as Pool

hold alice: 100 USDC
hold pool: 0 USDC

step 移す
  say USDCがAliceの100をPoolへ移す。変更はまだ暫定。
  alice -> usdc: 送る
  move usdc: 100 alice -> pool

step 落ちる
  say USDCが落ち、内側の変更が全て元へ戻る。
  revert usdc: 失敗
`,Do=`pipe Reverts

box alice as Alice
box usdc as USDC
box pool as Pool

hold alice: 100 USDC
hold pool: 0 USDC

step Move
  say USDC moves 100 from Alice to the pool. The change is still pending.
  alice -> usdc: send
  move usdc: 100 alice -> pool

step Fail
  say USDC fails, and every change inside it is undone.
  revert usdc: failed
`,So=`cycle 輪 [shape: clock, turn: left]

box plan as 決める [time: 1d]
box work as 進める [time: 3d]
box look as 振り返る [time: 1d]

step 決める
  say box の行で宣言した手順は、書いた順に輪の上へ並ぶ。shape: clock では手順の長さ (time) の弧で 12 時から並び、turn: left で左回りになる。

step 進める
  say 線は輪の次の手順へだけ引け、tag の札が針の先に乗って走る。
  plan -> work [tag: やること]

step 振り返る
  say 針が着いた手順の弧は、その回の間は手順の色で光ったまま残る。
  work -> look [tag: 進み]

step 次の回へ
  say 最後の手順から最初の手順への線で、次の回に入る。
  look -> plan [tag: 残り]
`,To=`cycle Ring [shape: clock, turn: left]

box plan as Decide [time: 1d]
box work as Do [time: 3d]
box look as Look back [time: 1d]

step Decide
  say The steps declared with box lines sit on the ring in the order written. With shape: clock they sit from 12 o'clock as arcs as long as their time, and turn: left turns them counterclockwise.

step Do
  say A line goes only to the next step on the ring, and its tag chip rides the tip of the hand.
  plan -> work [tag: tasks]

step Look back
  say The arc of a step the hand reached stays lit in the step color for the rest of the round.
  work -> look [tag: progress]

step Next round
  say A line from the last step to the first one starts the next round.
  look -> plan [tag: left]
`,Bo=`lineup 役

role 受付係 [note: 書類を受け取る]
role 審査係 [note: 中身を確かめる]

box 窓口

item 書類1, 書類2

step 受け取る
  say 宣言した役は箱の上に札として並び、段の中で名指した役が光る。
  role 受付係
  line 窓口: 書類1, 書類2

step 確かめる
  say 審査係が中身を確かめて札を押す。
  role 審査係
  stamp 窓口: 確認済み
`,Ro=`lineup Roles

role Clerk [note: Takes the papers]
role Reviewer [note: Checks the contents]

box Desk

item paper1, paper2

step Take
  say Declared roles sit above the boxes, and the role named in a step lights up.
  role Clerk
  line Desk: paper1, paper2

step Check
  say The reviewer checks the contents and stamps the card.
  role Reviewer
  stamp Desk: Checked
`,Po=`try 網

route 網: あなた - 甲 - 作る人, あなた - 乙 - 丙 - 作る人 [from: あなた, to: 作る人]
queue 待ち
ask 名前, 値 [into: 待ち, via: 網]

step 網を伝わる
  say route の行で節を - でつなぐ。送ったチップは from から to まで、節の数が最も少ない道を通る。
  ask 私, 1
`,qo=`try Network

route Net: You - n1 - Maker, You - n2 - n3 - Maker [from: You, to: Maker]
queue Pool
ask Name, Value [into: Pool, via: Net]

step Cross the network
  say A route line joins nodes with -. A sent chip takes the path with the fewest nodes from from to to.
  ask Me, 1
`,Ho=`time 印の列

scale slot 12s 8
row ブロック [color: blue, empty: 2 5]
row 票 [color: amber]

step 印を塗る
  say row で印の列を上から宣言する。針が過ぎた目盛りの印が塗られ、empty の目盛りは空きの印になる。
  now -> 7

step 色を変える
  say 段の中の mark で、列の目盛りの範囲の印の色を変える。
  mark ブロック 0-3 [color: green]
`,Wo=`time Row of marks

scale slot 12s 8
row block [color: blue, empty: 2 5]
row vote [color: amber]

step Fill the marks
  say Declare rows from top to bottom with row. Marks fill once the needle passes, and units in empty stay empty.
  now -> 7

step Recolor
  say mark inside a step recolors a range of marks in a row.
  mark block 0-3 [color: green]
`,Mo=`time 目盛りと針

scale slot 12s 8 [from: 3200]
period epoch 4 [from: 100]
row ブロック

strip 進み: 今の epoch の票 [meter: 2/3]

step 針を進める
  say scale で目盛りの名前と 1 つの長さと数を書く。段の中の now で、針がその目盛りの終わりまで決まった速さで進む。
  now -> 3
  set 今の epoch の票: 97%
  span 0-3: 1 epoch = 48 秒

step 範囲を囲む
  say period で区切りを置き、span の shape: box で範囲を囲む。
  now -> 7
  set 今の epoch の票: 97%
  span 0-3: 戻せない [shape: box, color: rose]
`,Uo=`time Scale and needle

scale slot 12s 8 [from: 3200]
period epoch 4 [from: 100]
row block

strip Progress: Votes this epoch [meter: 2/3]

step Move the needle
  say scale gives the unit name, the length of one unit and the count. now inside a step moves the needle at a fixed speed to the end of that unit.
  now -> 3
  set Votes this epoch: 97%
  span 0-3: 1 epoch = 48 s

step Box a range
  say period adds periods, and span with shape: box draws a box around a range.
  now -> 7
  set Votes this epoch: 97%
  span 0-3: cannot be reverted [shape: box, color: rose]
`,Lo=`lineup 封

box 列A
box 列B

item 一, 二, 三, 五
item 四 [color: amber]

step 並べる
  say 2つの列にチップを並べる。
  line 列A: 一, 二, 三
  line 列B: 四, 五

step 封をする
  say seal で、縞の封が列の左から伸びて中身を隠す。
  seal 列A
  seal 列B

step 開ける
  say open で封が消えて中身が戻る。開けなかった列は隠れたまま。
  open 列B
`,Oo=`lineup Seal

box laneA as Lane A
box laneB as Lane B

item one, two, three, five
item four [color: amber]

step Line up
  say Two lanes get their chips.
  line laneA: one, two, three
  line laneB: four, five

step Seal
  say seal grows a striped seal from the left of a lane and hides its contents.
  seal laneA
  seal laneB

step Open
  say open removes the seal and brings the contents back. A lane left sealed stays hidden.
  open laneB
`,No=`state 通らない道

box 受付
box 支払い済み
box 発送済み
box キャンセル

受付 -> キャンセル
支払い済み -> キャンセル: 取り消す

step 払う
  say 最初の段より前に書いた線は、移れるが今回は通らない道。
    点線で引き、運ぶ物は走らせない。
  受付 -> 支払い済み: 支払う

step 送る
  say どの段にも出ない状態は、点線の箱にして脇道の囲みへ寄せる。
    同じ線を段の中に書くと、通った道になる。
  支払い済み -> 発送済み: 発送する
`,Go=`state Path not taken

box received as Received
box paid as Paid
box shipped as Shipped
box cancelled as Cancelled

received -> cancelled
paid -> cancelled: cancel

step Pay
  say Edges written before the first step are paths that could be taken but are not this time.
    They are dotted and carry nothing.
  received -> paid: pay

step Ship
  say A state that no step reaches becomes a dotted box in the side path area.
    Writing the same edge inside a step makes it a path taken.
  paid -> shipped: ship
`,Fo=`try 横に並べる

route 網: 送る人 - 中継 - 作る人 [from: 送る人, to: 作る人]
queue 待ち [order: 手数料]
ask 名前, 手数料 [into: 待ち, via: 網]
side 網, 待ち

item 甲 [手数料: 3]

step 横に並ぶ
  say side の行に書いた部品は、枠が広い時に書いた順に左から並ぶ。待ち行列はチップが入る幅だけを取る。
  line 待ち: 甲

step 網から待ち行列へ
  say 送ったチップは網を通り、右の待ち行列へ入る。
  ask 乙, 5
`,Io=`try Side by side

route Net: Sender - Relay - Maker [from: Sender, to: Maker]
queue Pool [order: Fee]
ask Name, Fee [into: Pool, via: Net]
side Net, Pool

item a [Fee: 3]

step Side by side
  say Parts on a side line sit left to right in the written order when the frame is wide. The queue takes only the width its chips need.
  line Pool: a

step From the route to the queue
  say A sent chip travels the route and enters the queue on the right.
  ask b, 5
`,Vo=`architecture 出典

box アプリ
box 決済 as 決済の仕組み

step 頼む
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  アプリ -> 決済: 請求

step 返す
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  決済 -> アプリ: 済
`,zo=`architecture Source

box app as App
box pay as Payment system

step Ask
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  app -> pay: Charge

step Answer
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  pay -> app: Done
`,jo=`chart 出典 [shape: donut]

item a as 甲
item b as 乙

step 分ける
  say source で段に出典の名前と url を書く。1つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  set a: 2
  set b: 1

step 分け直す
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  set b: 3
`,Jo=`chart Sources [shape: donut]

item a as A
item b as B

step Split
  say source gives a step a source name and url. A step can have any number of them.
  source The dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  set a: 2
  set b: 1

step Split again
  say Sources stay out of the figure and appear as named links in the spoken step list.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source The dragon repo [url: https://github.com/cardene777/dragon]
  set b: 3
`,Yo=`cycle 出典

box order as 注文を受ける
box pay as 支払いを確かめる

step 受ける
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  order -> pay [tag: 注文]

step 確かめる
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  pay -> order [tag: 次の注文]
`,Ko=`cycle Sources

box order as Take the order
box pay as Check the payment

step Take
  say source writes a source name and url on a step. A step can hold any number of them.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  order -> pay [tag: order]

step Check
  say Sources stay out of the figure and the narration, and appear as named links in the step list of the reader.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  pay -> order [tag: next order]
`,$o=`er 出典

table users as 客
  field id: U-7 [key]
  field 名前: 田中

table orders as 注文
  field id: O-41 [key]
  field 客id: U-7 [ref: users.id]

step 引く
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  pick orders.id

step 辿る
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  orders.客id -> users.id [tag: U-7]
  pick users.id
`,Qo=`er Sources

table users as Customers
  field id: U-7 [key]
  field name: Tanaka

table orders as Orders
  field id: O-41 [key]
  field user_id: U-7 [ref: users.id]

step Look up
  say source writes the name and url of a source in a step. A step takes any number of them.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  pick orders.id

step Follow
  say Sources appear neither in the diagram nor in the narration; they show as name links in the list of narrated steps.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source The dragon repo [url: https://github.com/cardene777/dragon]
  orders.user_id -> users.id [tag: U-7]
  pick users.id
`,Zo=`flow 出典

box order as 注文を受ける
box pay as 支払いを確かめる

step 受ける
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  start -> order

step 確かめる
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  order -> pay: 払った
  pay -> finish
`,Xo=`flow Source

box order as Take the order
box pay as Check the payment

step Take
  say source writes the name and url of a reference on a step. A step can hold any number of them.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  start -> order

step Check
  say Sources stay out of the figure and the narration and appear as links in the read-aloud step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  order -> pay: Paid
  pay -> finish
`,ns=`git 出典

branch main

step 積む
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  commit A on main

step 続ける
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  commit B on main
`,es=`git Source

branch main

step Commit
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  commit A on main

step Continue
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  commit B on main
`,as=`lineup 出典

box 待ち

item 甲, 乙

step 並べる
  say source で段に出典の名前と url を書く。1つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  line 待ち: 甲, 乙

step 並べ替える
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  line 待ち: 乙, 甲
`,os=`lineup Sources

box waiting as Waiting

item a, b

step Line up
  say source gives a step a source name and url. A step can have any number of them.
  source The dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  line waiting: a, b

step Reorder
  say Sources stay out of the figure and appear as named links in the spoken step list.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source The dragon repo [url: https://github.com/cardene777/dragon]
  line waiting: b, a
`,ss=`matrix 出典

axis 手間 [from: 小さい, to: 大きい]
axis 効き目 [from: 小さい, to: 大きい]

box now as 今やる
box plan as 計画する
box spare as 手が空いたら
box drop as やらない

item login as ログインを速く
item pay as 決済を足す

step 今やる
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  line now: login

step 計画する
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  line plan: pay
`,ts=`matrix Sources

axis Effort [from: low, to: high]
axis Impact [from: low, to: high]

box now as Do now
box plan as Plan it
box spare as When free
box drop as Skip

item login as Faster login
item pay as Add payments

step Do now
  say source writes a source name and url on a step. A step can hold any number of them.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  line now: login

step Plan it
  say Sources stay out of the figure and the narration, and appear as named links in the step list of the reader.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  line plan: pay
`,rs=`mind 出典

step 題を置く
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  idea app as アプリの案

step 枝を伸ばす
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  idea use as 使う人 of app
`,is=`mind Sources

step Put the title
  say source writes a source name and url on a step. A step can hold any number of them.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  idea app as App idea

step Grow a branch
  say Sources stay out of the figure and the narration, and appear as named links in the step list of the reader.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  idea use as Users of app
`,ls=`pipe 出典

box alice as Alice
box vault as Vault

step 呼ぶ
  say source で段に出典の名前と url を書く。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  alice -> vault: 預ける

step 戻る
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source dragon の repo [url: https://github.com/cardene777/dragon]
  return vault: ok
`,cs=`pipe Sources

box alice as Alice
box vault as Vault

step Call
  say source gives a step a source name and url.
  source The dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  alice -> vault: deposit

step Return
  say Sources stay out of the figure and appear as named links in the spoken step list.
  source The dragon repo [url: https://github.com/cardene777/dragon]
  return vault: ok
`,ps=`sankey 出典

box sales as 売上
box cost as 原価
box rest as 残り

step 売る
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  sales -> cost: 60%

step 残す
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  sales -> rest: 40%
`,gs=`sankey Sources

box sales as Sales
box cost as Cost
box rest as Rest

step Sell
  say source puts the name and url of a source on a step. A step takes any number of them.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  sales -> cost: 60%

step Keep
  say Sources show neither in the figure nor in the narration, only as name links in the list of steps read aloud.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  sales -> rest: 40%
`,ds=`sequence 出典

box 利用者
box 認可 as 認可サーバー

step 頼む
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  利用者 -> 認可: 許可を求める

step 返す
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  認可 -> 利用者: 許可した
`,bs=`sequence Source

box user as User
box auth as Auth server

step Ask
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  user -> auth: Ask for access

step Answer
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  auth -> user: Granted
`,hs=`state 出典

box 注文 as 注文を受けた
box 支払い as 支払いを確かめる

step 受ける
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  start -> 注文

step 確かめる
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  注文 -> 支払い: 払った
  支払い -> finish
`,ms=`state Source

box order as Order received
box check as Checking payment

step Receive
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  start -> order

step Check
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  order -> check: Paid
  check -> finish
`,ys=`time 出典

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者
box ブロック

step 頼む
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  提案者 -> ブロック [at: 0]
  now -> 0

step 続ける
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  提案者 -> ブロック [at: 1]
  now -> 1
`,_s=`time Source

scale slot 12s 6
row block
zoom 0-2

box proposer
box block

step Ask
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  proposer -> block [at: 0]
  now -> 0

step Next
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  proposer -> block [at: 1]
  now -> 1
`,us=`tree 出典

step 葉を出す
  say source で段に出典の名前と url を書く。1つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  node 根 of 取引1, 取引2 [hash: 7a21]
`,ks=`tree Sources

step Add leaves
  say source gives a step a source name and url. A step can have any number of them.
  source The dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Sources stay out of the figure and appear as named links in the spoken step list.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source The dragon repo [url: https://github.com/cardene777/dragon]
  node root of tx1, tx2 [hash: 7a21]
`,xs=`venn 出典

item a as 甲
item b as 乙

step 数える
  say source で段に出典の名前と url を書く。1つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  set a: 4

step 重ねる
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  set b: 3
  set a & b: 1
`,vs=`venn Sources

item a as A
item b as B

step Count
  say source gives a step a source name and url. A step can have any number of them.
  source The dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  set a: 4

step Overlap
  say Sources stay out of the figure and appear as named links in the spoken step list.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source The dragon repo [url: https://github.com/cardene777/dragon]
  set b: 3
  set a & b: 1
`,fs=`lineup 札

box 申請 [color: amber]

item 書類1, 書類2, 書類3

step 並べる
  say 列にチップを並べる。
  line 申請: 書類1, 書類2, 書類3

step 札を押す
  say stamp で、列の右に傾いた札を押す。中身に触れずに起きたことを見せる。
  stamp 申請: 承認済み
`,ws=`lineup Stamp

box request as Request [color: amber]

item doc1, doc2, doc3

step Line up
  say A lane gets its chips.
  line request: doc1, doc2, doc3

step Stamp
  say stamp lands a tilted stamp on the right of a lane. It shows what happens without touching the contents.
  stamp request: Approved
`,As=`state 始まりと終わり

box 受付
box 完了

step 始める
  say start は始まりの印。start から最初の状態へ線を引く。
  start -> 受付: 申し込む

step 進める
  say 状態どうしは名札で結ぶ。
  受付 -> 完了: 片付ける

step 終える
  say finish は終わりの印。終わりの状態から finish へ線を引く。
    start へ入る線と、finish から出る線は書けない。
  完了 -> finish: 閉じる
`,Es=`state Start and end

box received as Received
box done as Done

step Begin
  say start is the start mark. Draw an edge from start to the first state.
  start -> received: apply

step Proceed
  say States are joined by their tags.
  received -> done: settle

step End
  say finish is the end mark. Draw an edge from the final state to finish.
    No edge can go into start or come out of finish.
  done -> finish: close
`,Cs=`architecture 段 [view: fixed]

box 端末
box サーバー

step 打つ
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code curl /api/items
  端末 -> サーバー: GET /api/items

step 返る
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  サーバー -> 端末: 200 OK
`,Ds=`architecture Step [view: fixed]

box term as Terminal
box server as Server

step Run
  say step starts a step and say writes its text.
    The command run in the step goes in code.
  code curl /api/items
  term -> server: GET /api/items

step Return
  say Steps play one at a time.
    view picks whether the frame follows the step
    or holds the whole diagram.
  server -> term: 200 OK
`,Ss=`chart 段 [shape: bar, view: fixed]

item a as 甲
item b as 乙

step 数える
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code count
  set a: 3
  set b: 5

step 数え直す
  say 段は1つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code recount
  set a: 6
`,Ts=`chart Steps [shape: bar, view: fixed]

item a as A
item b as B

step Count
  say step separates steps, and say writes the body of a step.
    code writes the command typed in that step.
  code count
  set a: 3
  set b: 5

step Count again
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code recount
  set a: 6
`,Bs=`cycle 段 [view: fixed]

box stop as 止まっている
box run as 動かす

step 起動する
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code systemctl start app
  stop -> run [tag: 起動]

step 止める
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code systemctl stop app
  run -> stop [tag: 停止]
`,Rs=`cycle Steps [view: fixed]

box stop as Stopped
box run as Running

step Start
  say step splits the steps, and say writes each step's text.
    Write the command typed in that step with code.
  code systemctl start app
  stop -> run [tag: start]

step Stop
  say Steps are played one at a time.
    view chooses whether the frame follows each step or shows the whole diagram still.
  code systemctl stop app
  run -> stop [tag: stop]
`,Ps=`er 段 [view: fixed]

table jobs as 仕事
  field id: J-3 [key]
  field 状態: 止まっている

table runs as 実行
  field id: R-1 [key]
  field 仕事id: J-3 [ref: jobs.id]

step 起動する
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code systemctl start app
  runs.仕事id -> jobs.id [tag: J-3]
  set jobs.状態: 動いている

step 止める
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code systemctl stop app
  set jobs.状態: 止まっている
  pick jobs.状態
`,qs=`er Steps [view: fixed]

table jobs as Jobs
  field id: J-3 [key]
  field state: stopped

table runs as Runs
  field id: R-1 [key]
  field job_id: J-3 [ref: jobs.id]

step Start
  say step splits the steps, and say writes the text of a step.
    Write the command run in that step with code.
  code systemctl start app
  runs.job_id -> jobs.id [tag: J-3]
  set jobs.state: running

step Stop
  say The steps are shown one at a time.
    view chooses whether the frame follows the steps or shows the whole diagram still.
  code systemctl stop app
  set jobs.state: stopped
  pick jobs.state
`,Hs=`flow 段 [view: fixed]

box stop as 止まっている
box run as 動かす

step 起動する
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code systemctl start app
  stop -> run: 起動

step 終える
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code systemctl stop app
  run -> finish
`,Ws=`flow Step [view: fixed]

box stop as Stopped
box run as Run

step Start
  say step separates the steps, and say writes the text of a step.
    A command to type in that step goes in code.
  code systemctl start app
  stop -> run: Start

step Finish
  say Steps are shown one at a time.
    view picks whether the frame follows the step or holds the whole figure still.
  code systemctl stop app
  run -> finish
`,Ms=`git 段 [view: fixed]

branch main

step 積む
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code git commit
  commit A on main

step 続ける
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code git commit
  commit B on main
`,Us=`git Step [view: fixed]

branch main

step Commit
  say step starts a step, and say writes its text.
    Write the command run in the step with code.
  code git commit
  commit A on main

step Go on
  say Steps are played one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code git commit
  commit B on main
`,Ls=`lineup 段 [view: fixed]

box 待ち

item 甲, 乙, 丙

step 並べる
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code send 甲 乙 丙
  line 待ち: 甲, 乙, 丙

step 並べ替える
  say 段は1つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code sort
  line 待ち: 丙, 乙, 甲
`,Os=`lineup Steps [view: fixed]

box waiting as Waiting

item a, b, c

step Line up
  say step separates steps, and say writes the body of a step.
    code writes the command typed in that step.
  code send a b c
  line waiting: a, b, c

step Reorder
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code sort
  line waiting: c, b, a
`,Ns=`matrix 段 [view: fixed]

axis 手間 [from: 小さい, to: 大きい]
axis 効き目 [from: 小さい, to: 大きい]

box now as 今やる
box plan as 計画する
box spare as 手が空いたら
box drop as やらない

item login as ログインを速く
item pay as 決済を足す

step 今やる
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code git switch -c login
  line now: login

step 計画する
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code git switch -c pay
  line plan: pay
`,Gs=`matrix Steps [view: fixed]

axis Effort [from: low, to: high]
axis Impact [from: low, to: high]

box now as Do now
box plan as Plan it
box spare as When free
box drop as Skip

item login as Faster login
item pay as Add payments

step Do now
  say step splits the diagram into steps and say writes the step's text.
    A command run in the step goes in code.
  code git switch -c login
  line now: login

step Plan it
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram still.
  code git switch -c pay
  line plan: pay
`,Fs=`mind 段 [view: fixed]

step 題を置く
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code mkdir app-idea
  idea app as アプリの案

step 枝を伸ばす
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code touch app-idea/users.md
  idea use as 使う人 of app
`,Is=`mind Steps [view: fixed]

step Put the title
  say step splits the diagram into steps and say writes the step's text.
    A command run in the step goes in code.
  code mkdir app-idea
  idea app as App idea

step Grow a branch
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram still.
  code touch app-idea/users.md
  idea use as Users of app
`,Vs=`pipe 段 [view: fixed]

box alice as Alice
box vault as Vault

step 呼ぶ
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code cast send vault "deposit()"
  alice -> vault: 預ける

step 戻る
  say 段は1つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code cast receipt
  return vault: ok
`,zs=`pipe Steps [view: fixed]

box alice as Alice
box vault as Vault

step Call
  say step separates steps, and say writes the body of a step.
    code writes the command typed in that step.
  code cast send vault "deposit()"
  alice -> vault: deposit

step Return
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code cast receipt
  return vault: ok
`,js=`sankey 段 [view: fixed]

box supply as 供給
box stake as 預け入れ
box free as 出回る分

step 預ける
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code npm run stake
  supply -> stake: 60%

step 出回る
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code npm run release
  supply -> free: 40%
`,Js=`sankey Steps [view: fixed]

box supply as Supply
box stake as Staked
box free as Circulating

step Stake
  say step starts a step and say writes its body.
    A command run in that step goes in code.
  code npm run stake
  supply -> stake: 60%

step Release
  say Steps are shown one at a time.
    view picks whether the frame follows the step or holds the whole figure still.
  code npm run release
  supply -> free: 40%
`,Ys=`sequence 段 [view: fixed]

box 端末
box サーバー

step 打つ
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code curl /api/items
  端末 -> サーバー: GET /api/items

step 返る
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  サーバー -> 端末: 200 OK
`,Ks=`sequence Step [view: fixed]

box term as Terminal
box server as Server

step Run
  say step starts a step and say writes its text.
    The command run in the step goes in code.
  code curl /api/items
  term -> server: GET /api/items

step Return
  say Steps play one at a time.
    view picks whether the frame follows the step
    or holds the whole diagram.
  server -> term: 200 OK
`,$s=`state 段 [view: fixed]

box 停止中
box 動作中

step 起動する
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code systemctl start app
  停止中 -> 動作中: 起動

step 止める
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code systemctl stop app
  動作中 -> 停止中: 停止
`,Qs=`state Step [view: fixed]

box stopped as Stopped
box running as Running

step Launch
  say step starts a step and say writes its text.
    The command run in the step goes in code.
  code systemctl start app
  stopped -> running: launch

step Halt
  say Steps play one at a time.
    view picks whether the frame follows the step
    or holds the whole diagram.
  code systemctl stop app
  running -> stopped: halt
`,Zs=`time 段 [view: fixed]

scale slot 12s 6
row ブロック

step 進める
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code attestation = { head, source, target }
  now -> 2

step 続ける
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  now -> 5
`,Xs=`time Step [view: fixed]

scale slot 12s 6
row block

step Advance
  say step starts a step, and say writes its text.
    Write the command for the step with code.
  code attestation = { head, source, target }
  now -> 2

step Continue
  say Steps are shown one at a time.
    view picks whether the frame follows each step or shows the whole diagram still.
  now -> 5
`,nt=`tree 段 [view: fixed]

step 葉を出す
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code hash 取引1 取引2
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 段は1つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code hash 3fa0 8b04
  node 根 of 取引1, 取引2 [hash: 7a21]
`,et=`tree Steps [view: fixed]

step Add leaves
  say step separates steps, and say writes the body of a step.
    code writes the command typed in that step.
  code hash tx1 tx2
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code hash 3fa0 8b04
  node root of tx1, tx2 [hash: 7a21]
`,at=`venn 段 [view: fixed]

item a as 甲
item b as 乙

step 数える
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code count
  set a: 3

step 数え直す
  say 段は1つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code recount
  set b: 5
  set a & b: 2
`,ot=`venn Steps [view: fixed]

item a as A
item b as B

step Count
  say step separates steps, and say writes the body of a step.
    code writes the command typed in that step.
  code count
  set a: 3

step Count again
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code recount
  set b: 5
  set a & b: 2
`,st=`architecture 中身の帯と欄

box アプリ
box サーバー

strip 注文: 番号, 状態

step 作る
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  アプリ -> サーバー: 注文する
  set 番号: 42
  set 状態: 受付

step 進める
  say set の tag で、欄の値に札を添える。
  act サーバー: 確かめる
  set 状態: 確定 [tag: 済]
`,tt=`architecture Strip

box app as App
box server as Server

strip Order: number, state

step Create
  say strip puts a strip of fields under the diagram. set fills a field.
  app -> server: place order
  set number: 42
  set state: received

step Advance
  say tag on a set line adds a tag to the field value.
  act server: check
  set state: confirmed [tag: done]
`,rt=`cycle 中身の帯と欄

box get as 受け付ける
box ship as 発送する
box done as 届ける

strip 注文: 番号, 状態

step 受ける
  say strip で輪の真ん中に帯の題と欄を置き、set で欄に値を入れる。
  set 番号: 42
  set 状態: 受け付けた

step 送る
  say 最初の欄の値は大きく、2 つ目からの欄の値は小さく出る。
  get -> ship [tag: 荷物]
  set 状態: 発送済み

step 届く
  say 最初に書いた後で変わった値は、その段の手順の色で出る。set の tag で書いた札の字は、輪の真ん中では値の所に出る。
  ship -> done [tag: 荷物]
  set 状態 [tag: 配達完了]
`,it=`cycle Strip and fields

box get as Take the order
box ship as Ship
box done as Deliver

strip Order: number, state

step Take
  say strip puts the strip title and fields in the middle of the ring, and set fills a field.
  set number: 42
  set state: received

step Send
  say The first field shows large and the others show smaller.
  get -> ship [tag: parcel]
  set state: shipped

step Arrive
  say A value that changes after it was first written shows in the color of that step's box. A tag written with set shows where the value goes in the middle of the ring.
  ship -> done [tag: parcel]
  set state [tag: delivered]
`,lt=`flow 中身の帯と欄

box get as 受け付ける
box ship as 発送する
box done as 届ける

strip 注文: 番号, 状態

step 送る
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  get -> ship: 発送へ
  set 番号: 42
  set 状態: 発送済み

step 届く
  say set の tag で、欄の値に札を添える。
  ship -> done: 届けた
  set 状態: 配達完了 [tag: 済]
`,ct=`flow Strip and fields

box get as Accept
box ship as Ship
box done as Deliver

strip Order: Number, Status

step Send
  say strip places a content strip with fields under the figure, and set puts a value in a field.
  get -> ship: To shipping
  set Number: 42
  set Status: Shipped

step Arrive
  say tag on set adds a tag to the value of a field.
  ship -> done: Delivered
  set Status: Delivered [tag: Done]
`,pt=`git 中身の帯と欄

branch main

strip 参照: main, HEAD

step 積む
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  commit A on main [hash: 3fa0c19]
  set main: A 3fa0c19
  set HEAD: main

step 進める
  say set の tag で、欄の値に札を添える。
  commit B on main [hash: 8b04f71]
  set main: B 8b04f71 [tag: 先端]
`,gt=`git Strip

branch main

strip Refs: main, HEAD

step Commit
  say strip puts a strip of fields under the diagram, and set fills a field.
  commit A on main [hash: 3fa0c19]
  set main: A 3fa0c19
  set HEAD: main

step Move on
  say tag on a set line adds a tag beside the field value.
  commit B on main [hash: 8b04f71]
  set main: B 8b04f71 [tag: tip]
`,dt=`lineup 中身の帯と欄

strip 状態: 件数, 先頭

box 待ち

item 甲, 乙, 丙

step 並べる
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  line 待ち: 甲, 乙, 丙
  set 件数: 3

step 並べ替える
  say set の tag で、欄の値に札を添える。
  line 待ち: 丙, 甲, 乙
  set 先頭: 丙 [tag: 替わった]
`,bt=`lineup Strip and fields

strip State: Count, First

box waiting as Waiting

item a, b, c

step Line up
  say strip places a strip with fields under the diagram, and set fills a field.
  line waiting: a, b, c
  set Count: 3

step Reorder
  say tag on set adds a tag to the field value.
  line waiting: c, a, b
  set First: c [tag: Changed]
`,ht=`sequence 中身の帯と欄

box アプリ
box サーバー

strip 注文: 番号, 状態

step 作る
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  アプリ -> サーバー: 注文する
  set 番号: 42
  set 状態: 受付

step 進める
  say set の tag で、欄の値に札を添える。
  act サーバー: 確かめる
  set 状態: 確定 [tag: 済]
`,mt=`sequence Strip

box app as App
box server as Server

strip Order: number, state

step Create
  say strip puts a strip of fields under the diagram. set fills a field.
  app -> server: place order
  set number: 42
  set state: received

step Advance
  say tag on a set line adds a tag to the field value.
  act server: check
  set state: confirmed [tag: done]
`,yt=`state 中身の帯と欄

box 受付
box 発送済み
box 配達完了

strip 注文: 番号, 状態

step 送る
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  受付 -> 発送済み: 発送する
  set 番号: 42
  set 状態: 発送済み

step 届く
  say set の tag で、欄の値に札を添える。
  発送済み -> 配達完了: 届けた
  set 状態: 配達完了 [tag: 済]
`,_t=`state Strip

box received as Received
box shipped as Shipped
box delivered as Delivered

strip Order: number, state

step Ship
  say strip puts a strip of fields under the diagram. set fills a field.
  received -> shipped: ship
  set number: 42
  set state: shipped

step Deliver
  say tag on a set line adds a tag to the field value.
  shipped -> delivered: hand over
  set state: delivered [tag: done]
`,ut=`time 中身の帯と欄

scale slot 12s 8
period epoch 4
row ブロック

strip 進み: 経過, 状態, 今の epoch の票 [meter: 2/3]

step 進める
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。物差しの欄は針と一緒に満ちる。
  now -> 3
  set 経過: 48 秒
  set 今の epoch の票: 97%

step 札を添える
  say set の tag で、欄の値に札を添える。
  set 状態: 正当化 [tag: 2/3]
`,kt=`time Strip and fields

scale slot 12s 8
period epoch 4
row block

strip Progress: Elapsed, State, Votes this epoch [meter: 2/3]

step Advance
  say strip puts a strip of fields under the diagram, and set fills a field. A meter field fills with the needle.
  now -> 3
  set Elapsed: 48 s
  set Votes this epoch: 97%

step Add a tag
  say tag on set adds a tag next to the value.
  set State: Justified [tag: 2/3]
`,xt=`tree 中身の帯と欄

strip 証明: 取引, 根

step 葉を出す
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  set 取引: 取引1

step 組む
  say set の tag で、欄の値に札を添える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  set 根: 7a21 [tag: 一致]
`,vt=`tree Strip and fields

strip Proof: Item, Root

step Add leaves
  say strip places a strip with fields under the diagram, and set fills a field.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  set Item: tx1

step Join
  say tag on set adds a tag to the field value.
  node root of tx1, tx2 [hash: 7a21]
  set Root: 7a21 [tag: Match]
`,ft=`er 表

table users as 客 [color: blue]
  field id: U-7 [key]
  field 名前: 田中
  field 注文の数: 2

table orders as 注文 [color: amber]
  field id: O-41 [key]
  field 客id: U-7 [ref: users.id]
  field 金額: 1200円

step 宣言する
  say table で表を、field で項目を宣言する。key は鍵の印、ref は別の表の項目への結びになる。
  pick orders.id

step 辿る
  say 結んだ項目どうしの線に沿って値の札を走らせ、pick で着いた表の行を光らせる。
  orders.客id -> users.id [tag: U-7]
  pick users.id

step 書き換える
  say note で表の下に式の札を出し、set で項目の値を書き換える。
  note users.注文の数: 2 + 1 = 3
  set users.注文の数: 3
  pick users.注文の数
`,wt=`er Tables

table users as Customers [color: blue]
  field id: U-7 [key]
  field name: Tanaka
  field orders: 2

table orders as Orders [color: amber]
  field id: O-41 [key]
  field user_id: U-7 [ref: users.id]
  field amount: $12

step Declare
  say Declare tables with table and fields with field. key is the key mark, and ref links to a field of another table.
  pick orders.id

step Follow
  say A value chip runs along the line between linked fields, and pick lights the row of the table it reaches.
  orders.user_id -> users.id [tag: U-7]
  pick users.id

step Rewrite
  say note shows a formula card under the table, and set rewrites the value of a field.
  note users.orders: 2 + 1 = 3
  set users.orders: 3
  pick users.orders
`,At=`time 工程表の棒

scale 日 1d 10 [from: 1]
task design as 設計 0-2 [color: blue]
task build as 実装 3-7 [color: violet]
task ship as リリース 9 [color: green]

step 作業を並べる
  say task で作業を上から宣言する。範囲の目盛りの上に棒が引かれ、針が通った分が濃く塗られる。
  now -> 4

step 最後まで進む
  say 針が棒の終わりを過ぎると、その棒の全てが濃くなる。
  now -> 9
`,Et=`time Task bar

scale day 1d 10 [from: 1]
task design as Design 0-2 [color: blue]
task build as Build 3-7 [color: violet]
task ship as Release 9 [color: green]

step Lay out the tasks
  say Declare tasks from top to bottom with task. A bar spans the ticks of the range, and the part the needle has passed fills in.
  now -> 4

step Run to the end
  say Once the needle passes the end of a bar, the whole bar is filled.
  now -> 9
`,Ct=`pipe ETHの送金

box alice as Alice
box vault as Vault

hold alice: 2 ETH
hold vault: 0 ETH

step AliceがETHを添えて呼ぶ
  say Aliceが1 ETHを添えてVaultを呼ぶ。
  alice -> vault: 預ける [value: 1 ETH]

step 呼び出しが戻る
  say 一番外の呼び出しが戻り、送ったETHが確定する。
  return vault: ok
`,Dt=`pipe ETH transfers

box alice as Alice
box vault as Vault

hold alice: 2 ETH
hold vault: 0 ETH

step Alice calls with ETH
  say Alice calls the vault and sends 1 ETH along.
  alice -> vault: deposit [value: 1 ETH]

step The call returns
  say The outermost call returns, and the ETH sent becomes final.
  return vault: ok
`,St=`pipe 値の札

box alice as Alice
box vault as Vault

hold vault: paused false

step AliceがVaultを止める
  say AliceがVaultを呼び、止めた印を書き替える。
  alice -> vault: 止める
  write vault: paused true

step 呼び出しが戻る
  say 一番外の呼び出しが戻り、書き替えが確定する。
  return vault: ok
`,Tt=`pipe Value cards

box alice as Alice
box vault as Vault

hold vault: paused false

step Alice pauses the vault
  say Alice calls the vault, which rewrites its paused value.
  alice -> vault: pause
  write vault: paused true

step The call returns
  say The outermost call returns, and the new value becomes final.
  return vault: ok
`,Bt=`time 拡大の帯

scale slot 12s 8 [from: 3200]
row ブロック [empty: 2]
zoom 0-2

box 提案者 [icon: user]
box ブロック [icon: box]
box 委員会

step 列を並べる
  say zoom で目盛りの範囲を書くと、上の帯にその目盛りを列にして箱を並べる。線は at の列の箱どうしを結ぶ。
  提案者 -> ブロック [at: 0]
  委員会 -> ブロック [at: 0, tag: 票]
  now -> 0

step 別の列へ
  say into で、受ける箱を別の列から選ぶ。空きの目盛りの列では、印の列と同じ名札の箱が空きの枠になる。
  提案者 -> ブロック [at: 1]
  委員会 -> ブロック [at: 2, into: 1, tag: 票]
  now -> 2
`,Rt=`time Zoom band

scale slot 12s 8 [from: 3200]
row block [empty: 2]
zoom 0-2

box proposer [icon: user]
box block [icon: box]
box committee

step Lay out columns
  say zoom gives a range of units, laid out as columns of boxes in the band above. A line joins the boxes of the column in at.
  proposer -> block [at: 0]
  committee -> block [at: 0, tag: vote]
  now -> 0

step Another column
  say into takes the receiving box from another column. In an empty unit, the box named like the row becomes an empty frame.
  proposer -> block [at: 1]
  committee -> block [at: 2, into: 1, tag: vote]
  now -> 2
`,Pt=Object.assign({"../../../../packages/dragon/src/blocks/act/gallery/act.architecture.dragon":a,"../../../../packages/dragon/src/blocks/act/gallery/act.architecture.en.dragon":o,"../../../../packages/dragon/src/blocks/act/gallery/act.flow.dragon":s,"../../../../packages/dragon/src/blocks/act/gallery/act.flow.en.dragon":t,"../../../../packages/dragon/src/blocks/act/gallery/act.git.dragon":r,"../../../../packages/dragon/src/blocks/act/gallery/act.git.en.dragon":i,"../../../../packages/dragon/src/blocks/act/gallery/act.sequence.dragon":l,"../../../../packages/dragon/src/blocks/act/gallery/act.sequence.en.dragon":c,"../../../../packages/dragon/src/blocks/act/gallery/act.state.dragon":p,"../../../../packages/dragon/src/blocks/act/gallery/act.state.en.dragon":g,"../../../../packages/dragon/src/blocks/act/gallery/act.time.dragon":d,"../../../../packages/dragon/src/blocks/act/gallery/act.time.en.dragon":b,"../../../../packages/dragon/src/blocks/act/gallery/act.tree.dragon":h,"../../../../packages/dragon/src/blocks/act/gallery/act.tree.en.dragon":m,"../../../../packages/dragon/src/blocks/ask/gallery/ask.try.dragon":y,"../../../../packages/dragon/src/blocks/ask/gallery/ask.try.en.dragon":_,"../../../../packages/dragon/src/blocks/axis/gallery/axis.matrix.dragon":u,"../../../../packages/dragon/src/blocks/axis/gallery/axis.matrix.en.dragon":k,"../../../../packages/dragon/src/blocks/band/gallery/band.sankey.dragon":x,"../../../../packages/dragon/src/blocks/band/gallery/band.sankey.en.dragon":v,"../../../../packages/dragon/src/blocks/box/gallery/box.architecture.dragon":f,"../../../../packages/dragon/src/blocks/box/gallery/box.architecture.en.dragon":w,"../../../../packages/dragon/src/blocks/box/gallery/box.cycle.dragon":A,"../../../../packages/dragon/src/blocks/box/gallery/box.cycle.en.dragon":E,"../../../../packages/dragon/src/blocks/box/gallery/box.flow.dragon":C,"../../../../packages/dragon/src/blocks/box/gallery/box.flow.en.dragon":D,"../../../../packages/dragon/src/blocks/box/gallery/box.git.dragon":S,"../../../../packages/dragon/src/blocks/box/gallery/box.git.en.dragon":T,"../../../../packages/dragon/src/blocks/box/gallery/box.lineup.dragon":B,"../../../../packages/dragon/src/blocks/box/gallery/box.lineup.en.dragon":R,"../../../../packages/dragon/src/blocks/box/gallery/box.matrix.dragon":P,"../../../../packages/dragon/src/blocks/box/gallery/box.matrix.en.dragon":q,"../../../../packages/dragon/src/blocks/box/gallery/box.pipe.dragon":H,"../../../../packages/dragon/src/blocks/box/gallery/box.pipe.en.dragon":W,"../../../../packages/dragon/src/blocks/box/gallery/box.sankey.dragon":M,"../../../../packages/dragon/src/blocks/box/gallery/box.sankey.en.dragon":U,"../../../../packages/dragon/src/blocks/box/gallery/box.sequence.dragon":L,"../../../../packages/dragon/src/blocks/box/gallery/box.sequence.en.dragon":O,"../../../../packages/dragon/src/blocks/box/gallery/box.state.dragon":N,"../../../../packages/dragon/src/blocks/box/gallery/box.state.en.dragon":G,"../../../../packages/dragon/src/blocks/box/gallery/box.time.dragon":F,"../../../../packages/dragon/src/blocks/box/gallery/box.time.en.dragon":I,"../../../../packages/dragon/src/blocks/box/gallery/box.tree.dragon":V,"../../../../packages/dragon/src/blocks/box/gallery/box.tree.en.dragon":z,"../../../../packages/dragon/src/blocks/branch/gallery/branch.git.dragon":j,"../../../../packages/dragon/src/blocks/branch/gallery/branch.git.en.dragon":J,"../../../../packages/dragon/src/blocks/calc/gallery/calc.pipe.dragon":Y,"../../../../packages/dragon/src/blocks/calc/gallery/calc.pipe.en.dragon":K,"../../../../packages/dragon/src/blocks/call/gallery/call.pipe.dragon":$,"../../../../packages/dragon/src/blocks/call/gallery/call.pipe.en.dragon":Q,"../../../../packages/dragon/src/blocks/carry/gallery/carry.architecture.dragon":Z,"../../../../packages/dragon/src/blocks/carry/gallery/carry.architecture.en.dragon":X,"../../../../packages/dragon/src/blocks/carry/gallery/carry.cycle.dragon":nn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.cycle.en.dragon":en,"../../../../packages/dragon/src/blocks/carry/gallery/carry.er.dragon":an,"../../../../packages/dragon/src/blocks/carry/gallery/carry.er.en.dragon":on,"../../../../packages/dragon/src/blocks/carry/gallery/carry.flow.dragon":sn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.flow.en.dragon":tn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.git.dragon":rn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.git.en.dragon":ln,"../../../../packages/dragon/src/blocks/carry/gallery/carry.sequence.dragon":cn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.sequence.en.dragon":pn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.state.dragon":gn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.state.en.dragon":dn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.time.dragon":bn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.time.en.dragon":hn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.tree.dragon":mn,"../../../../packages/dragon/src/blocks/carry/gallery/carry.tree.en.dragon":yn,"../../../../packages/dragon/src/blocks/chain/gallery/chain.try.dragon":_n,"../../../../packages/dragon/src/blocks/chain/gallery/chain.try.en.dragon":un,"../../../../packages/dragon/src/blocks/chart-item/gallery/chart-item.chart.dragon":kn,"../../../../packages/dragon/src/blocks/chart-item/gallery/chart-item.chart.en.dragon":xn,"../../../../packages/dragon/src/blocks/chart-set/gallery/chart-set.chart.dragon":vn,"../../../../packages/dragon/src/blocks/chart-set/gallery/chart-set.chart.en.dragon":fn,"../../../../packages/dragon/src/blocks/chart-shape/gallery/chart-shape.chart.dragon":wn,"../../../../packages/dragon/src/blocks/chart-shape/gallery/chart-shape.chart.en.dragon":An,"../../../../packages/dragon/src/blocks/check/gallery/check.pipe.dragon":En,"../../../../packages/dragon/src/blocks/check/gallery/check.pipe.en.dragon":Cn,"../../../../packages/dragon/src/blocks/choice/gallery/choice.flow.dragon":Dn,"../../../../packages/dragon/src/blocks/choice/gallery/choice.flow.en.dragon":Sn,"../../../../packages/dragon/src/blocks/circle/gallery/circle.venn.dragon":Tn,"../../../../packages/dragon/src/blocks/circle/gallery/circle.venn.en.dragon":Bn,"../../../../packages/dragon/src/blocks/color/gallery/color.architecture.dragon":Rn,"../../../../packages/dragon/src/blocks/color/gallery/color.architecture.en.dragon":Pn,"../../../../packages/dragon/src/blocks/color/gallery/color.cycle.dragon":qn,"../../../../packages/dragon/src/blocks/color/gallery/color.cycle.en.dragon":Hn,"../../../../packages/dragon/src/blocks/color/gallery/color.flow.dragon":Wn,"../../../../packages/dragon/src/blocks/color/gallery/color.flow.en.dragon":Mn,"../../../../packages/dragon/src/blocks/color/gallery/color.git.dragon":Un,"../../../../packages/dragon/src/blocks/color/gallery/color.git.en.dragon":Ln,"../../../../packages/dragon/src/blocks/color/gallery/color.lineup.dragon":On,"../../../../packages/dragon/src/blocks/color/gallery/color.lineup.en.dragon":Nn,"../../../../packages/dragon/src/blocks/color/gallery/color.sankey.dragon":Gn,"../../../../packages/dragon/src/blocks/color/gallery/color.sankey.en.dragon":Fn,"../../../../packages/dragon/src/blocks/color/gallery/color.sequence.dragon":In,"../../../../packages/dragon/src/blocks/color/gallery/color.sequence.en.dragon":Vn,"../../../../packages/dragon/src/blocks/color/gallery/color.state.dragon":zn,"../../../../packages/dragon/src/blocks/color/gallery/color.state.en.dragon":jn,"../../../../packages/dragon/src/blocks/color/gallery/color.time.dragon":Jn,"../../../../packages/dragon/src/blocks/color/gallery/color.time.en.dragon":Yn,"../../../../packages/dragon/src/blocks/color/gallery/color.tree.dragon":Kn,"../../../../packages/dragon/src/blocks/color/gallery/color.tree.en.dragon":$n,"../../../../packages/dragon/src/blocks/commit/gallery/commit.git.dragon":Qn,"../../../../packages/dragon/src/blocks/commit/gallery/commit.git.en.dragon":Zn,"../../../../packages/dragon/src/blocks/copy/gallery/copy.git.dragon":Xn,"../../../../packages/dragon/src/blocks/copy/gallery/copy.git.en.dragon":ne,"../../../../packages/dragon/src/blocks/delete/gallery/delete.git.dragon":ee,"../../../../packages/dragon/src/blocks/delete/gallery/delete.git.en.dragon":ae,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.architecture.dragon":oe,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.architecture.en.dragon":se,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.flow.dragon":te,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.flow.en.dragon":re,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.git.dragon":ie,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.git.en.dragon":le,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.sequence.dragon":ce,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.sequence.en.dragon":pe,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.state.dragon":ge,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.state.en.dragon":de,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.time.dragon":be,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.time.en.dragon":he,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.tree.dragon":me,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.tree.en.dragon":ye,"../../../../packages/dragon/src/blocks/edge/gallery/edge.architecture.dragon":_e,"../../../../packages/dragon/src/blocks/edge/gallery/edge.architecture.en.dragon":ue,"../../../../packages/dragon/src/blocks/edge/gallery/edge.cycle.dragon":ke,"../../../../packages/dragon/src/blocks/edge/gallery/edge.cycle.en.dragon":xe,"../../../../packages/dragon/src/blocks/edge/gallery/edge.er.dragon":ve,"../../../../packages/dragon/src/blocks/edge/gallery/edge.er.en.dragon":fe,"../../../../packages/dragon/src/blocks/edge/gallery/edge.flow.dragon":we,"../../../../packages/dragon/src/blocks/edge/gallery/edge.flow.en.dragon":Ae,"../../../../packages/dragon/src/blocks/edge/gallery/edge.git.dragon":Ee,"../../../../packages/dragon/src/blocks/edge/gallery/edge.git.en.dragon":Ce,"../../../../packages/dragon/src/blocks/edge/gallery/edge.sankey.dragon":De,"../../../../packages/dragon/src/blocks/edge/gallery/edge.sankey.en.dragon":Se,"../../../../packages/dragon/src/blocks/edge/gallery/edge.sequence.dragon":Te,"../../../../packages/dragon/src/blocks/edge/gallery/edge.sequence.en.dragon":Be,"../../../../packages/dragon/src/blocks/edge/gallery/edge.state.dragon":Re,"../../../../packages/dragon/src/blocks/edge/gallery/edge.state.en.dragon":Pe,"../../../../packages/dragon/src/blocks/edge/gallery/edge.time.dragon":qe,"../../../../packages/dragon/src/blocks/edge/gallery/edge.time.en.dragon":He,"../../../../packages/dragon/src/blocks/edge/gallery/edge.tree.dragon":We,"../../../../packages/dragon/src/blocks/edge/gallery/edge.tree.en.dragon":Me,"../../../../packages/dragon/src/blocks/emit/gallery/emit.pipe.dragon":Ue,"../../../../packages/dragon/src/blocks/emit/gallery/emit.pipe.en.dragon":Le,"../../../../packages/dragon/src/blocks/fold/gallery/fold.pipe.dragon":Oe,"../../../../packages/dragon/src/blocks/fold/gallery/fold.pipe.en.dragon":Ne,"../../../../packages/dragon/src/blocks/gist/gallery/gist.pipe.dragon":Ge,"../../../../packages/dragon/src/blocks/gist/gallery/gist.pipe.en.dragon":Fe,"../../../../packages/dragon/src/blocks/group/gallery/group.architecture.dragon":Ie,"../../../../packages/dragon/src/blocks/group/gallery/group.architecture.en.dragon":Ve,"../../../../packages/dragon/src/blocks/hold/gallery/hold.pipe.dragon":ze,"../../../../packages/dragon/src/blocks/hold/gallery/hold.pipe.en.dragon":je,"../../../../packages/dragon/src/blocks/icon/gallery/icon.architecture.dragon":Je,"../../../../packages/dragon/src/blocks/icon/gallery/icon.architecture.en.dragon":Ye,"../../../../packages/dragon/src/blocks/icon/gallery/icon.cycle.dragon":Ke,"../../../../packages/dragon/src/blocks/icon/gallery/icon.cycle.en.dragon":$e,"../../../../packages/dragon/src/blocks/icon/gallery/icon.flow.dragon":Qe,"../../../../packages/dragon/src/blocks/icon/gallery/icon.flow.en.dragon":Ze,"../../../../packages/dragon/src/blocks/icon/gallery/icon.git.dragon":Xe,"../../../../packages/dragon/src/blocks/icon/gallery/icon.git.en.dragon":na,"../../../../packages/dragon/src/blocks/icon/gallery/icon.pipe.dragon":ea,"../../../../packages/dragon/src/blocks/icon/gallery/icon.pipe.en.dragon":aa,"../../../../packages/dragon/src/blocks/icon/gallery/icon.sequence.dragon":oa,"../../../../packages/dragon/src/blocks/icon/gallery/icon.sequence.en.dragon":sa,"../../../../packages/dragon/src/blocks/icon/gallery/icon.state.dragon":ta,"../../../../packages/dragon/src/blocks/icon/gallery/icon.state.en.dragon":ra,"../../../../packages/dragon/src/blocks/icon/gallery/icon.time.dragon":ia,"../../../../packages/dragon/src/blocks/icon/gallery/icon.time.en.dragon":la,"../../../../packages/dragon/src/blocks/icon/gallery/icon.tree.dragon":ca,"../../../../packages/dragon/src/blocks/icon/gallery/icon.tree.en.dragon":pa,"../../../../packages/dragon/src/blocks/idea/gallery/idea.mind.dragon":ga,"../../../../packages/dragon/src/blocks/idea/gallery/idea.mind.en.dragon":da,"../../../../packages/dragon/src/blocks/item/gallery/item.lineup.dragon":ba,"../../../../packages/dragon/src/blocks/item/gallery/item.lineup.en.dragon":ha,"../../../../packages/dragon/src/blocks/leaf/gallery/leaf.tree.dragon":ma,"../../../../packages/dragon/src/blocks/leaf/gallery/leaf.tree.en.dragon":ya,"../../../../packages/dragon/src/blocks/legend/gallery/legend.lineup.dragon":_a,"../../../../packages/dragon/src/blocks/legend/gallery/legend.lineup.en.dragon":ua,"../../../../packages/dragon/src/blocks/lifeline/gallery/lifeline.sequence.dragon":ka,"../../../../packages/dragon/src/blocks/lifeline/gallery/lifeline.sequence.en.dragon":xa,"../../../../packages/dragon/src/blocks/limit/gallery/limit.lineup.dragon":va,"../../../../packages/dragon/src/blocks/limit/gallery/limit.lineup.en.dragon":fa,"../../../../packages/dragon/src/blocks/line/gallery/line.lineup.dragon":wa,"../../../../packages/dragon/src/blocks/line/gallery/line.lineup.en.dragon":Aa,"../../../../packages/dragon/src/blocks/link/gallery/link.architecture.dragon":Ea,"../../../../packages/dragon/src/blocks/link/gallery/link.architecture.en.dragon":Ca,"../../../../packages/dragon/src/blocks/link/gallery/link.cycle.dragon":Da,"../../../../packages/dragon/src/blocks/link/gallery/link.cycle.en.dragon":Sa,"../../../../packages/dragon/src/blocks/link/gallery/link.flow.dragon":Ta,"../../../../packages/dragon/src/blocks/link/gallery/link.flow.en.dragon":Ba,"../../../../packages/dragon/src/blocks/link/gallery/link.git.dragon":Ra,"../../../../packages/dragon/src/blocks/link/gallery/link.git.en.dragon":Pa,"../../../../packages/dragon/src/blocks/link/gallery/link.sequence.dragon":qa,"../../../../packages/dragon/src/blocks/link/gallery/link.sequence.en.dragon":Ha,"../../../../packages/dragon/src/blocks/link/gallery/link.state.dragon":Wa,"../../../../packages/dragon/src/blocks/link/gallery/link.state.en.dragon":Ma,"../../../../packages/dragon/src/blocks/link/gallery/link.time.dragon":Ua,"../../../../packages/dragon/src/blocks/link/gallery/link.time.en.dragon":La,"../../../../packages/dragon/src/blocks/link/gallery/link.tree.dragon":Oa,"../../../../packages/dragon/src/blocks/link/gallery/link.tree.en.dragon":Na,"../../../../packages/dragon/src/blocks/log/gallery/log.try.dragon":Ga,"../../../../packages/dragon/src/blocks/log/gallery/log.try.en.dragon":Fa,"../../../../packages/dragon/src/blocks/matrix-item/gallery/matrix-item.matrix.dragon":Ia,"../../../../packages/dragon/src/blocks/matrix-item/gallery/matrix-item.matrix.en.dragon":Va,"../../../../packages/dragon/src/blocks/merge/gallery/merge.git.dragon":za,"../../../../packages/dragon/src/blocks/merge/gallery/merge.git.en.dragon":ja,"../../../../packages/dragon/src/blocks/node/gallery/node.tree.dragon":Ja,"../../../../packages/dragon/src/blocks/node/gallery/node.tree.en.dragon":Ya,"../../../../packages/dragon/src/blocks/note/gallery/note.architecture.dragon":Ka,"../../../../packages/dragon/src/blocks/note/gallery/note.architecture.en.dragon":$a,"../../../../packages/dragon/src/blocks/note/gallery/note.cycle.dragon":Qa,"../../../../packages/dragon/src/blocks/note/gallery/note.cycle.en.dragon":Za,"../../../../packages/dragon/src/blocks/note/gallery/note.flow.dragon":Xa,"../../../../packages/dragon/src/blocks/note/gallery/note.flow.en.dragon":no,"../../../../packages/dragon/src/blocks/note/gallery/note.git.dragon":eo,"../../../../packages/dragon/src/blocks/note/gallery/note.git.en.dragon":ao,"../../../../packages/dragon/src/blocks/note/gallery/note.lineup.dragon":oo,"../../../../packages/dragon/src/blocks/note/gallery/note.lineup.en.dragon":so,"../../../../packages/dragon/src/blocks/note/gallery/note.sequence.dragon":to,"../../../../packages/dragon/src/blocks/note/gallery/note.sequence.en.dragon":ro,"../../../../packages/dragon/src/blocks/note/gallery/note.state.dragon":io,"../../../../packages/dragon/src/blocks/note/gallery/note.state.en.dragon":lo,"../../../../packages/dragon/src/blocks/note/gallery/note.time.dragon":co,"../../../../packages/dragon/src/blocks/note/gallery/note.time.en.dragon":po,"../../../../packages/dragon/src/blocks/note/gallery/note.tree.dragon":go,"../../../../packages/dragon/src/blocks/note/gallery/note.tree.en.dragon":bo,"../../../../packages/dragon/src/blocks/order/gallery/order.lineup.dragon":ho,"../../../../packages/dragon/src/blocks/order/gallery/order.lineup.en.dragon":mo,"../../../../packages/dragon/src/blocks/pick/gallery/pick.lineup.dragon":yo,"../../../../packages/dragon/src/blocks/pick/gallery/pick.lineup.en.dragon":_o,"../../../../packages/dragon/src/blocks/point/gallery/point.time.dragon":uo,"../../../../packages/dragon/src/blocks/point/gallery/point.time.en.dragon":ko,"../../../../packages/dragon/src/blocks/press/gallery/press.try.dragon":xo,"../../../../packages/dragon/src/blocks/press/gallery/press.try.en.dragon":vo,"../../../../packages/dragon/src/blocks/queue/gallery/queue.try.dragon":fo,"../../../../packages/dragon/src/blocks/queue/gallery/queue.try.en.dragon":wo,"../../../../packages/dragon/src/blocks/return/gallery/return.pipe.dragon":Ao,"../../../../packages/dragon/src/blocks/return/gallery/return.pipe.en.dragon":Eo,"../../../../packages/dragon/src/blocks/revert/gallery/revert.pipe.dragon":Co,"../../../../packages/dragon/src/blocks/revert/gallery/revert.pipe.en.dragon":Do,"../../../../packages/dragon/src/blocks/ring/gallery/ring.cycle.dragon":So,"../../../../packages/dragon/src/blocks/ring/gallery/ring.cycle.en.dragon":To,"../../../../packages/dragon/src/blocks/role/gallery/role.lineup.dragon":Bo,"../../../../packages/dragon/src/blocks/role/gallery/role.lineup.en.dragon":Ro,"../../../../packages/dragon/src/blocks/route/gallery/route.try.dragon":Po,"../../../../packages/dragon/src/blocks/route/gallery/route.try.en.dragon":qo,"../../../../packages/dragon/src/blocks/row/gallery/row.time.dragon":Ho,"../../../../packages/dragon/src/blocks/row/gallery/row.time.en.dragon":Wo,"../../../../packages/dragon/src/blocks/scale/gallery/scale.time.dragon":Mo,"../../../../packages/dragon/src/blocks/scale/gallery/scale.time.en.dragon":Uo,"../../../../packages/dragon/src/blocks/seal/gallery/seal.lineup.dragon":Lo,"../../../../packages/dragon/src/blocks/seal/gallery/seal.lineup.en.dragon":Oo,"../../../../packages/dragon/src/blocks/side-path/gallery/side-path.state.dragon":No,"../../../../packages/dragon/src/blocks/side-path/gallery/side-path.state.en.dragon":Go,"../../../../packages/dragon/src/blocks/side/gallery/side.try.dragon":Fo,"../../../../packages/dragon/src/blocks/side/gallery/side.try.en.dragon":Io,"../../../../packages/dragon/src/blocks/source/gallery/source.architecture.dragon":Vo,"../../../../packages/dragon/src/blocks/source/gallery/source.architecture.en.dragon":zo,"../../../../packages/dragon/src/blocks/source/gallery/source.chart.dragon":jo,"../../../../packages/dragon/src/blocks/source/gallery/source.chart.en.dragon":Jo,"../../../../packages/dragon/src/blocks/source/gallery/source.cycle.dragon":Yo,"../../../../packages/dragon/src/blocks/source/gallery/source.cycle.en.dragon":Ko,"../../../../packages/dragon/src/blocks/source/gallery/source.er.dragon":$o,"../../../../packages/dragon/src/blocks/source/gallery/source.er.en.dragon":Qo,"../../../../packages/dragon/src/blocks/source/gallery/source.flow.dragon":Zo,"../../../../packages/dragon/src/blocks/source/gallery/source.flow.en.dragon":Xo,"../../../../packages/dragon/src/blocks/source/gallery/source.git.dragon":ns,"../../../../packages/dragon/src/blocks/source/gallery/source.git.en.dragon":es,"../../../../packages/dragon/src/blocks/source/gallery/source.lineup.dragon":as,"../../../../packages/dragon/src/blocks/source/gallery/source.lineup.en.dragon":os,"../../../../packages/dragon/src/blocks/source/gallery/source.matrix.dragon":ss,"../../../../packages/dragon/src/blocks/source/gallery/source.matrix.en.dragon":ts,"../../../../packages/dragon/src/blocks/source/gallery/source.mind.dragon":rs,"../../../../packages/dragon/src/blocks/source/gallery/source.mind.en.dragon":is,"../../../../packages/dragon/src/blocks/source/gallery/source.pipe.dragon":ls,"../../../../packages/dragon/src/blocks/source/gallery/source.pipe.en.dragon":cs,"../../../../packages/dragon/src/blocks/source/gallery/source.sankey.dragon":ps,"../../../../packages/dragon/src/blocks/source/gallery/source.sankey.en.dragon":gs,"../../../../packages/dragon/src/blocks/source/gallery/source.sequence.dragon":ds,"../../../../packages/dragon/src/blocks/source/gallery/source.sequence.en.dragon":bs,"../../../../packages/dragon/src/blocks/source/gallery/source.state.dragon":hs,"../../../../packages/dragon/src/blocks/source/gallery/source.state.en.dragon":ms,"../../../../packages/dragon/src/blocks/source/gallery/source.time.dragon":ys,"../../../../packages/dragon/src/blocks/source/gallery/source.time.en.dragon":_s,"../../../../packages/dragon/src/blocks/source/gallery/source.tree.dragon":us,"../../../../packages/dragon/src/blocks/source/gallery/source.tree.en.dragon":ks,"../../../../packages/dragon/src/blocks/source/gallery/source.venn.dragon":xs,"../../../../packages/dragon/src/blocks/source/gallery/source.venn.en.dragon":vs,"../../../../packages/dragon/src/blocks/stamp/gallery/stamp.lineup.dragon":fs,"../../../../packages/dragon/src/blocks/stamp/gallery/stamp.lineup.en.dragon":ws,"../../../../packages/dragon/src/blocks/start-finish/gallery/start-finish.state.dragon":As,"../../../../packages/dragon/src/blocks/start-finish/gallery/start-finish.state.en.dragon":Es,"../../../../packages/dragon/src/blocks/step/gallery/step.architecture.dragon":Cs,"../../../../packages/dragon/src/blocks/step/gallery/step.architecture.en.dragon":Ds,"../../../../packages/dragon/src/blocks/step/gallery/step.chart.dragon":Ss,"../../../../packages/dragon/src/blocks/step/gallery/step.chart.en.dragon":Ts,"../../../../packages/dragon/src/blocks/step/gallery/step.cycle.dragon":Bs,"../../../../packages/dragon/src/blocks/step/gallery/step.cycle.en.dragon":Rs,"../../../../packages/dragon/src/blocks/step/gallery/step.er.dragon":Ps,"../../../../packages/dragon/src/blocks/step/gallery/step.er.en.dragon":qs,"../../../../packages/dragon/src/blocks/step/gallery/step.flow.dragon":Hs,"../../../../packages/dragon/src/blocks/step/gallery/step.flow.en.dragon":Ws,"../../../../packages/dragon/src/blocks/step/gallery/step.git.dragon":Ms,"../../../../packages/dragon/src/blocks/step/gallery/step.git.en.dragon":Us,"../../../../packages/dragon/src/blocks/step/gallery/step.lineup.dragon":Ls,"../../../../packages/dragon/src/blocks/step/gallery/step.lineup.en.dragon":Os,"../../../../packages/dragon/src/blocks/step/gallery/step.matrix.dragon":Ns,"../../../../packages/dragon/src/blocks/step/gallery/step.matrix.en.dragon":Gs,"../../../../packages/dragon/src/blocks/step/gallery/step.mind.dragon":Fs,"../../../../packages/dragon/src/blocks/step/gallery/step.mind.en.dragon":Is,"../../../../packages/dragon/src/blocks/step/gallery/step.pipe.dragon":Vs,"../../../../packages/dragon/src/blocks/step/gallery/step.pipe.en.dragon":zs,"../../../../packages/dragon/src/blocks/step/gallery/step.sankey.dragon":js,"../../../../packages/dragon/src/blocks/step/gallery/step.sankey.en.dragon":Js,"../../../../packages/dragon/src/blocks/step/gallery/step.sequence.dragon":Ys,"../../../../packages/dragon/src/blocks/step/gallery/step.sequence.en.dragon":Ks,"../../../../packages/dragon/src/blocks/step/gallery/step.state.dragon":$s,"../../../../packages/dragon/src/blocks/step/gallery/step.state.en.dragon":Qs,"../../../../packages/dragon/src/blocks/step/gallery/step.time.dragon":Zs,"../../../../packages/dragon/src/blocks/step/gallery/step.time.en.dragon":Xs,"../../../../packages/dragon/src/blocks/step/gallery/step.tree.dragon":nt,"../../../../packages/dragon/src/blocks/step/gallery/step.tree.en.dragon":et,"../../../../packages/dragon/src/blocks/step/gallery/step.venn.dragon":at,"../../../../packages/dragon/src/blocks/step/gallery/step.venn.en.dragon":ot,"../../../../packages/dragon/src/blocks/strip/gallery/strip.architecture.dragon":st,"../../../../packages/dragon/src/blocks/strip/gallery/strip.architecture.en.dragon":tt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.cycle.dragon":rt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.cycle.en.dragon":it,"../../../../packages/dragon/src/blocks/strip/gallery/strip.flow.dragon":lt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.flow.en.dragon":ct,"../../../../packages/dragon/src/blocks/strip/gallery/strip.git.dragon":pt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.git.en.dragon":gt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.lineup.dragon":dt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.lineup.en.dragon":bt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.sequence.dragon":ht,"../../../../packages/dragon/src/blocks/strip/gallery/strip.sequence.en.dragon":mt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.state.dragon":yt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.state.en.dragon":_t,"../../../../packages/dragon/src/blocks/strip/gallery/strip.time.dragon":ut,"../../../../packages/dragon/src/blocks/strip/gallery/strip.time.en.dragon":kt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.tree.dragon":xt,"../../../../packages/dragon/src/blocks/strip/gallery/strip.tree.en.dragon":vt,"../../../../packages/dragon/src/blocks/table/gallery/table.er.dragon":ft,"../../../../packages/dragon/src/blocks/table/gallery/table.er.en.dragon":wt,"../../../../packages/dragon/src/blocks/task/gallery/task.time.dragon":At,"../../../../packages/dragon/src/blocks/task/gallery/task.time.en.dragon":Et,"../../../../packages/dragon/src/blocks/value/gallery/value.pipe.dragon":Ct,"../../../../packages/dragon/src/blocks/value/gallery/value.pipe.en.dragon":Dt,"../../../../packages/dragon/src/blocks/write/gallery/write.pipe.dragon":St,"../../../../packages/dragon/src/blocks/write/gallery/write.pipe.en.dragon":Tt,"../../../../packages/dragon/src/blocks/zoom/gallery/zoom.time.dragon":Bt,"../../../../packages/dragon/src/blocks/zoom/gallery/zoom.time.en.dragon":Rt}),qt=Object.fromEntries(Object.entries(Pt).map(([n,e])=>[`./parts/${n.slice(n.lastIndexOf("/")+1)}`,e]));export{qt as SNIPPETS};
