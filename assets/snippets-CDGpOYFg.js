const o=`architecture 箱の中の処理

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
`,a=`architecture Action

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
`,t=`git 箱の中の処理

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
`,s=`git Action

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
`,r=`sequence 箱の中の処理

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
`,l=`state 箱の中の処理

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
`,i=`state Action

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
`,p=`time 処理

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
`,g=`time Action

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
`,d=`tree 箱の中の処理

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
`,b=`tree Work in a box

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
`,h=`try 入力の帯

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
`,m=`architecture 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,u=`architecture Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,y=`git 箱

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
`,k=`git Box

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
`,x=`lineup 箱

box 待ち [note: 3件]
box 箱詰め

item 甲, 乙, 丙

step 並べる
  say box の行が列になり、宣言した順に上から同じ幅で並ぶ。
  line 待ち: 甲, 乙, 丙

step 移す
  say 段の中の note の行で、列の右上の字を書き換える。
  line 箱詰め: 甲, 乙
  line 待ち: 丙
  note 待ち: 1件
  note 箱詰め: 2件
`,v=`lineup Boxes

box waiting as Waiting [note: 3 items]
box packed as Packed

item a, b, c

step Line up
  say Each box line becomes a lane, stacked top to bottom in the order declared, all the same width.
  line waiting: a, b, c

step Move
  say A note line inside a step rewrites the text at the top right of a lane.
  line packed: a, b
  line waiting: c
  note waiting: 1 item
  note packed: 2 items
`,f=`pipe 関係者

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
`,w=`pipe Parties

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
`,A=`sequence 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,E=`sequence Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,C=`state 箱

box 下書き
box 公開中 as 公開している

step 公開する
  say box の行で状態を 1 つ置く。as の後ろに見せる名前を書く。
  下書き -> 公開中: 公開する

step 戻す
  say 線は状態の名札で書く。
  公開中 -> 下書き: 取り下げる
`,B=`state Box

box draft as Draft
box live as Published

step Publish
  say A box line places one state. The name to show follows as.
  draft -> live: publish

step Withdraw
  say Edges name the states by their tags.
  live -> draft: withdraw
`,D=`time 箱

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
`,T=`time Box

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
`,S=`tree 箱

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
`,R=`tree Boxes

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
`,q=`git 枝

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
`,P=`git Branch

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
`,H=`pipe 換算

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
`,W=`pipe Conversions

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
`,U=`pipe 呼び出しの種類

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
`,M=`pipe Call kinds

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
`,L=`architecture 運ぶ物

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
`,N=`architecture Carry

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
`,G=`git 運ぶ物

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
`,O=`git Carry

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
`,I=`sequence 運ぶ物

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
`,V=`sequence Carry

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
`,z=`state 運ぶ物

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
`,F=`state Carry

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
`,J=`time 運ぶ物

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
`,j=`time Carry

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
`,Y=`tree 運ぶ物

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
`,K=`tree What travels

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
`,Q=`try 機械の列

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
`,Z=`try Chain

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
`,$=`pipe 確認

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
`,X=`pipe Checks

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
`,nn=`architecture 色の役

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
`,en=`architecture Color

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
`,on=`git 色の役

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
`,an=`git Color

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
`,tn=`lineup 色の役

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
`,sn=`lineup Color

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
`,rn=`sequence 色の役

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
`,cn=`sequence Color

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
`,ln=`state 色の役

box 下書き [color: slate]
box 審査中 [color: amber]
box 公開中 [color: green]

step 出す
  say color で、状態の箱に 7 つの役から色を選ぶ。
  下書き -> 審査中: 審査に出す

step 通る
  say 役は意味で選ぶ。待つ状態は amber、終えた状態は green のように揃える。
  審査中 -> 公開中: 通す
`,pn=`state Color

box draft as Draft [color: slate]
box review as In review [color: amber]
box live as Published [color: green]

step Submit
  say color picks one of 7 roles for a state box.
  draft -> review: submit

step Approve
  say Pick roles by meaning, such as amber for waiting states and green for finished ones.
  review -> live: approve
`,gn=`time 色

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
`,dn=`time Color

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
`,bn=`tree 色の役

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
`,hn=`tree Color roles

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
`,_n=`git commit

branch main

step 積む
  say commit <名札> on <枝> で枝に commit を積む。積んだ枝の札が新しい commit へ進む。
  commit A on main
  commit B on main

step 字を添える
  say hash と note で、丸の外に hash と一言を添える。
  commit C on main [hash: c41d0e5, note: 価格を丸める]
`,mn=`git Commit

branch main

step Commit
  say commit <id> on <branch> adds a commit to the branch. The branch's ref moves to the new commit.
  commit A on main
  commit B on main

step Add text
  say hash and note put a hash and a short note beside the circle.
  commit C on main [hash: c41d0e5, note: Round prices]
`,un=`git 当て直し

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
`,yn=`git Replay

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
`,kn=`architecture 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,xn=`architecture Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,vn=`git 線の名前

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
`,fn=`git Edge label

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
`,wn=`sequence 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。横の線は above か below。
  乙 -> 甲: 下の名前 [side: below]
`,An=`sequence Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above or below.
  b -> a: label below [side: below]
`,En=`state 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,Cn=`state Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,Bn=`time 線の名前

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
`,Dn=`time Edge label

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
`,Tn=`tree 線の名前

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
`,Sn=`tree Line names

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
`,Rn=`architecture 線

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
`,qn=`architecture Edge

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
`,Pn=`git 線

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
`,Hn=`git Edge

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
`,Wn=`sequence 線

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
`,Un=`sequence Edge

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
`,Mn=`state 線

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
`,Ln=`state Edge

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
`,Nn=`time 線

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
`,Gn=`time Edge

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
`,On=`tree 線

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
`,In=`tree Lines

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
`,Vn=`pipe イベント

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
`,zn=`pipe Events

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
`,Fn=`pipe 畳み

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
`,Jn=`pipe Folds

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
`,jn=`architecture 区画

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
`,Yn=`architecture Group

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
`,Kn=`pipe 槽

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
`,Qn=`pipe Tanks

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
`,Zn=`architecture 絵

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
`,$n=`architecture Icon

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
`,Xn=`git 絵

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
`,ne=`git Icon

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
`,ee=`pipe 絵

box alice as Alice
box vault as Vault [icon: shield]

step AliceがVaultを呼ぶ
  say 形を書いた関係者は、その形で描く。
  alice -> vault: 預ける

step Vaultが戻る
  say 呼ばれた側が戻ると、呼び出しの管が閉じる。
  return vault: ok
`,oe=`pipe Icons

box alice as Alice
box vault as Vault [icon: shield]

step Alice calls the vault
  say A party with an icon is drawn with that shape.
  alice -> vault: deposit

step The vault returns
  say When the callee returns, the call pipe closes.
  return vault: ok
`,ae=`sequence 絵

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
`,te=`sequence Icon

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
`,se=`state 絵

box 下書き [icon: doc]
box 審査中 [icon: clock]
box 公開中 [icon: globe]

step 出す
  say icon で状態の箱に絵を付ける。
  下書き -> 審査中: 審査に出す

step 通る
  say 運ぶ物は、着いた状態の絵柄の横の置き場に留まる。
  審査中 -> 公開中: 通す
`,re=`state Icon

box draft as Draft [icon: doc]
box review as In review [icon: clock]
box live as Published [icon: globe]

step Submit
  say icon puts a picture on a state box.
  draft -> review: submit

step Approve
  say The carried item rests in the slot beside the icon of the state it reaches.
  review -> live: approve
`,ce=`time 絵

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
`,le=`time Icon

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
`,ie=`tree 絵

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
`,pe=`tree Icons

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
`,ge=`lineup チップ

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
`,de=`lineup Chips

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
`,be=`tree 葉と札

step 葉を出す
  say leaf の行で葉を出す。hash に値を書くと、箱に値を、葉の下の札に名札を出す。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 親を組む
  say 札は最初の段から出ていて、葉が現れると点線で結ばれる。
  node 根 of 取引1, 取引2 [hash: 7a21]
`,he=`tree Leaf and card

step Add leaves
  say A leaf line adds a leaf. With a hash, the box shows the value and a card below shows the id.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Cards are there from the first step, and a dotted line ties them to the leaf when it appears.
  node root of tx1, tx2 [hash: 7a21]
`,_e=`lineup 凡例

box 窓口

item 申請, 照会 [note: 届いた書類]
item 至急 [color: amber, note: 急ぎの書類]

step 並べる
  say item の説明は図の下の凡例に、説明ごとに 1 行で出る。
  line 窓口: 至急, 申請, 照会
`,me=`lineup Legend

box Desk

item apply, query [note: A paper that arrived]
item rush [color: amber, note: An urgent paper]

step Line up
  say Item notes appear in the legend under the diagram, one row per note.
  line Desk: rush, apply, query
`,ue=`sequence 生存線

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
`,ye=`sequence Lifeline

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
`,ke=`lineup 列の並び

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
`,xe=`lineup Lane order

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
`,ve=`architecture 飛び先

box アプリ
box 決済 as 決済の仕組み [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  アプリ -> 決済: 請求

step 返す
  say 箱の中の仕組みを別の図に描いた時は、その図の頁を飛び先にする。
  決済 -> アプリ: 済
`,fe=`architecture Link

box app as App
box pay as Payment system [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  app -> pay: Charge

step Answer
  say When another diagram draws what is inside the box, link to its page.
  pay -> app: Done
`,we=`git 飛び先

branch main

box 遠く as 遠くの repo [link: https://github.com/cardene777/dragon]

step 積む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  commit A on main

step 送る
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  commit B on main
  note 遠く: B を受け取った
`,Ae=`git Link

branch main

box remote as Remote repo [link: https://github.com/cardene777/dragon]

step Commit
  say link on a box makes the box a link to that place in the drawn diagram.
  commit A on main

step Push
  say Write a path that starts with / or a URL that starts with http:// or https://.
  commit B on main
  note remote: Received B
`,Ee=`sequence 飛び先

box 利用者
box 認可 as 認可サーバー [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  利用者 -> 認可: 許可を求める

step 返す
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  認可 -> 利用者: 許可した
`,Ce=`sequence Link

box user as User
box auth as Auth server [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  user -> auth: Ask for access

step Answer
  say Write a path that starts with / or a URL that starts with http:// or https://.
  auth -> user: Granted
`,Be=`state 飛び先

box 注文 as 注文を受けた
box 支払い as 支払いを確かめる [link: https://github.com/cardene777/dragon]

step 受ける
  say link で状態の箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  start -> 注文

step 確かめる
  say 確かめ方を別の図に描いた時は、その図の頁を飛び先にする。
  注文 -> 支払い: 払った
  支払い -> finish
`,De=`state Link

box order as Order received
box check as Checking payment [link: https://github.com/cardene777/dragon]

step Receive
  say link on a state box makes the box a link to that place in the drawn diagram.
  start -> order

step Check
  say When another diagram draws how the check works, link to its page.
  order -> check: Paid
  check -> finish
`,Te=`time 飛び先

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
`,Se=`time Link

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
`,Re=`tree 飛び先

box 遠く as 遠くの台帳 [link: https://github.com/cardene777/dragon]

step 葉を出す
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 遠く: 根を受け取った
`,qe=`tree Links

box remote as Remote ledger [link: https://github.com/cardene777/dragon]

step Add leaves
  say link gives a box a target. Clicking the box in the drawn diagram goes there.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Write a path starting with / or a URL starting with http:// or https://.
  node root of tx1, tx2 [hash: 7a21]
  note remote: got the root
`,Pe=`try 記録の列

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
`,He=`try Log

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
`,We=`git merge commit

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
`,Ue=`git Merge commit

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
`,Me=`tree 組んだ親

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
`,Le=`tree Parent node

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
`,Ne=`architecture 小さな字

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
`,Ge=`architecture Note

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
`,Oe=`git 小さな字

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
`,Ie=`git Note

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
`,Ve=`lineup 小さな字

box 入札A [note: 0 ETH]
box 入札B [note: 0 ETH]

item 一, 二, 三

step 並べる
  say note で、列の右上に小さな字を添える。
  line 入札A: 一, 二
  line 入札B: 三, 一

step 書き換える
  say 段の中の note の行で、その段から列の右上の字を書き換える。
  note 入札A: 0.05 ETH
  note 入札B: 0.12 ETH
`,ze=`lineup Small text

box bidA as Bid A [note: 0 ETH]
box bidB as Bid B [note: 0 ETH]

item one, two, three

step Line up
  say note adds small text at the top right of a lane.
  line bidA: one, two
  line bidB: three, one

step Rewrite
  say A note line inside a step rewrites that text from that step on.
  note bidA: 0.05 ETH
  note bidB: 0.12 ETH
`,Fe=`sequence 小さな字

box 財布 [note: 残高 5000 円]
box 店 [note: 待っている]

step 払う
  say note で箱の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,Je=`sequence Note

box wallet as Wallet [note: balance 50 USD]
box shop as Shop [note: waiting]

step Pay
  say note adds small text under the box name.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites the small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,je=`state 小さな字

box 在庫あり [note: 残り 1 個]
box 品切れ [note: 入荷待ち]

step 売り切れる
  say note で状態の名前の下に小さな字を添える。
  在庫あり -> 品切れ: 最後の 1 個が売れた

step 入荷する
  say 段の中の note の行で、その段から状態の小さな字を書き換える。
  品切れ -> 在庫あり: 入荷した
  note 在庫あり: 残り 10 個
`,Ye=`state Note

box stocked as In stock [note: 1 left]
box out as Sold out [note: awaiting stock]

step Sell out
  say note adds small text under the state name.
  stocked -> out: last one sold

step Restock
  say A note line inside a step rewrites the small text from that step on.
  out -> stocked: restocked
  note stocked: 10 left
`,Ke=`time 小さな字

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
`,Qe=`time Note

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
`,Ze=`tree 小さな字

box 記録 [note: まだ無い]

step 葉を出す
  say note で箱の名前の下に小さな字を添える。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 記録: 根 7a21
`,$e=`tree Small text

box ledger as Ledger [note: empty]

step Add leaves
  say note adds small text under the box name.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say A note line inside a step rewrites that small text from that step on.
  node root of tx1, tx2 [hash: 7a21]
  note ledger: root 7a21
`,Xe=`lineup 置き場

box 受付 [order: none]
box 窓口

item 申請, 照会, 変更

step 置く
  say order: none の箱は順番の無い置き場になり、チップを格子に並べる。
  line 受付: 申請, 照会, 変更

step 並べる
  say 札の箱には、チップを書いた順に上から積む。
  line 窓口: 照会, 申請, 変更
`,no=`lineup Pool

box Inbox [order: none]
box Desk

item apply, query, change

step Drop
  say A box with order: none is a pool with no order, and its chips sit on a grid.
  line Inbox: apply, query, change

step Stack
  say A card stacks its chips from the top in the order written.
  line Desk: query, apply, change
`,eo=`lineup 選ぶ

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
`,oo=`lineup Pick

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
`,ao=`time 節目

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
`,to=`time Point

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
`,so=`try 釦

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
`,ro=`try Button

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
`,co=`try 待ち行列

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
`,lo=`try Queue

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
`,io=`pipe 呼び出しの管

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
`,po=`pipe Call pipes

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
`,go=`pipe 取り消し

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
`,bo=`pipe Reverts

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
`,ho=`lineup 役

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
`,_o=`lineup Roles

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
`,mo=`try 網

route 網: あなた - 甲 - 作る人, あなた - 乙 - 丙 - 作る人 [from: あなた, to: 作る人]
queue 待ち
ask 名前, 値 [into: 待ち, via: 網]

step 網を伝わる
  say route の行で節を - でつなぐ。送ったチップは from から to まで、節の数が最も少ない道を通る。
  ask 私, 1
`,uo=`try Network

route Net: You - n1 - Maker, You - n2 - n3 - Maker [from: You, to: Maker]
queue Pool
ask Name, Value [into: Pool, via: Net]

step Cross the network
  say A route line joins nodes with -. A sent chip takes the path with the fewest nodes from from to to.
  ask Me, 1
`,yo=`time 印の列

scale slot 12s 8
row ブロック [color: blue, empty: 2 5]
row 票 [color: amber]

step 印を塗る
  say row で印の列を上から宣言する。針が過ぎた目盛りの印が塗られ、empty の目盛りは空きの印になる。
  now -> 7

step 色を変える
  say 段の中の mark で、列の目盛りの範囲の印の色を変える。
  mark ブロック 0-3 [color: green]
`,ko=`time Row of marks

scale slot 12s 8
row block [color: blue, empty: 2 5]
row vote [color: amber]

step Fill the marks
  say Declare rows from top to bottom with row. Marks fill once the needle passes, and units in empty stay empty.
  now -> 7

step Recolor
  say mark inside a step recolors a range of marks in a row.
  mark block 0-3 [color: green]
`,xo=`time 目盛りと針

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
`,vo=`time Scale and needle

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
`,fo=`lineup 封

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
`,wo=`lineup Seal

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
`,Ao=`state 通らない道

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
`,Eo=`state Path not taken

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
`,Co=`try 横に並べる

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
`,Bo=`try Side by side

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
`,Do=`architecture 出典

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
`,To=`architecture Source

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
`,So=`git 出典

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
`,Ro=`git Source

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
`,qo=`lineup 出典

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
`,Po=`lineup Sources

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
`,Ho=`pipe 出典

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
`,Wo=`pipe Sources

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
`,Uo=`sequence 出典

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
`,Mo=`sequence Source

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
`,Lo=`state 出典

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
`,No=`state Source

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
`,Go=`time 出典

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
`,Oo=`time Source

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
`,Io=`tree 出典

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
`,Vo=`tree Sources

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
`,zo=`lineup 札

box 申請 [color: amber]

item 書類1, 書類2, 書類3

step 並べる
  say 列にチップを並べる。
  line 申請: 書類1, 書類2, 書類3

step 札を押す
  say stamp で、列の右に傾いた札を押す。中身に触れずに起きたことを見せる。
  stamp 申請: 承認済み
`,Fo=`lineup Stamp

box request as Request [color: amber]

item doc1, doc2, doc3

step Line up
  say A lane gets its chips.
  line request: doc1, doc2, doc3

step Stamp
  say stamp lands a tilted stamp on the right of a lane. It shows what happens without touching the contents.
  stamp request: Approved
`,Jo=`state 始まりと終わり

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
`,jo=`state Start and end

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
`,Yo=`architecture 段 [view: fixed]

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
`,Ko=`architecture Step [view: fixed]

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
`,Qo=`git 段 [view: fixed]

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
`,Zo=`git Step [view: fixed]

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
`,$o=`lineup 段 [view: fixed]

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
`,Xo=`lineup Steps [view: fixed]

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
`,na=`pipe 段 [view: fixed]

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
`,ea=`pipe Steps [view: fixed]

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
`,oa=`sequence 段 [view: fixed]

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
`,aa=`sequence Step [view: fixed]

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
`,ta=`state 段 [view: fixed]

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
`,sa=`state Step [view: fixed]

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
`,ra=`time 段 [view: fixed]

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
`,ca=`time Step [view: fixed]

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
`,la=`tree 段 [view: fixed]

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
`,ia=`tree Steps [view: fixed]

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
`,pa=`architecture 中身の帯と欄

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
`,ga=`architecture Strip

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
`,da=`git 中身の帯と欄

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
`,ba=`git Strip

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
`,ha=`lineup 中身の帯と欄

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
`,_a=`lineup Strip and fields

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
`,ma=`sequence 中身の帯と欄

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
`,ua=`sequence Strip

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
`,ya=`state 中身の帯と欄

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
`,ka=`state Strip

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
`,xa=`time 中身の帯と欄

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
`,va=`time Strip and fields

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
`,fa=`tree 中身の帯と欄

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
`,wa=`tree Strip and fields

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
`,Aa=`pipe ETHの送金

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
`,Ea=`pipe ETH transfers

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
`,Ca=`pipe 値の札

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
`,Ba=`pipe Value cards

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
`,Da=`time 拡大の帯

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
`,Ta=`time Zoom band

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
`,Sa=Object.assign({"../../../../packages/dragon/src/blocks/act/gallery/act.architecture.dragon":o,"../../../../packages/dragon/src/blocks/act/gallery/act.architecture.en.dragon":a,"../../../../packages/dragon/src/blocks/act/gallery/act.git.dragon":t,"../../../../packages/dragon/src/blocks/act/gallery/act.git.en.dragon":s,"../../../../packages/dragon/src/blocks/act/gallery/act.sequence.dragon":r,"../../../../packages/dragon/src/blocks/act/gallery/act.sequence.en.dragon":c,"../../../../packages/dragon/src/blocks/act/gallery/act.state.dragon":l,"../../../../packages/dragon/src/blocks/act/gallery/act.state.en.dragon":i,"../../../../packages/dragon/src/blocks/act/gallery/act.time.dragon":p,"../../../../packages/dragon/src/blocks/act/gallery/act.time.en.dragon":g,"../../../../packages/dragon/src/blocks/act/gallery/act.tree.dragon":d,"../../../../packages/dragon/src/blocks/act/gallery/act.tree.en.dragon":b,"../../../../packages/dragon/src/blocks/ask/gallery/ask.try.dragon":h,"../../../../packages/dragon/src/blocks/ask/gallery/ask.try.en.dragon":_,"../../../../packages/dragon/src/blocks/box/gallery/box.architecture.dragon":m,"../../../../packages/dragon/src/blocks/box/gallery/box.architecture.en.dragon":u,"../../../../packages/dragon/src/blocks/box/gallery/box.git.dragon":y,"../../../../packages/dragon/src/blocks/box/gallery/box.git.en.dragon":k,"../../../../packages/dragon/src/blocks/box/gallery/box.lineup.dragon":x,"../../../../packages/dragon/src/blocks/box/gallery/box.lineup.en.dragon":v,"../../../../packages/dragon/src/blocks/box/gallery/box.pipe.dragon":f,"../../../../packages/dragon/src/blocks/box/gallery/box.pipe.en.dragon":w,"../../../../packages/dragon/src/blocks/box/gallery/box.sequence.dragon":A,"../../../../packages/dragon/src/blocks/box/gallery/box.sequence.en.dragon":E,"../../../../packages/dragon/src/blocks/box/gallery/box.state.dragon":C,"../../../../packages/dragon/src/blocks/box/gallery/box.state.en.dragon":B,"../../../../packages/dragon/src/blocks/box/gallery/box.time.dragon":D,"../../../../packages/dragon/src/blocks/box/gallery/box.time.en.dragon":T,"../../../../packages/dragon/src/blocks/box/gallery/box.tree.dragon":S,"../../../../packages/dragon/src/blocks/box/gallery/box.tree.en.dragon":R,"../../../../packages/dragon/src/blocks/branch/gallery/branch.git.dragon":q,"../../../../packages/dragon/src/blocks/branch/gallery/branch.git.en.dragon":P,"../../../../packages/dragon/src/blocks/calc/gallery/calc.pipe.dragon":H,"../../../../packages/dragon/src/blocks/calc/gallery/calc.pipe.en.dragon":W,"../../../../packages/dragon/src/blocks/call/gallery/call.pipe.dragon":U,"../../../../packages/dragon/src/blocks/call/gallery/call.pipe.en.dragon":M,"../../../../packages/dragon/src/blocks/carry/gallery/carry.architecture.dragon":L,"../../../../packages/dragon/src/blocks/carry/gallery/carry.architecture.en.dragon":N,"../../../../packages/dragon/src/blocks/carry/gallery/carry.git.dragon":G,"../../../../packages/dragon/src/blocks/carry/gallery/carry.git.en.dragon":O,"../../../../packages/dragon/src/blocks/carry/gallery/carry.sequence.dragon":I,"../../../../packages/dragon/src/blocks/carry/gallery/carry.sequence.en.dragon":V,"../../../../packages/dragon/src/blocks/carry/gallery/carry.state.dragon":z,"../../../../packages/dragon/src/blocks/carry/gallery/carry.state.en.dragon":F,"../../../../packages/dragon/src/blocks/carry/gallery/carry.time.dragon":J,"../../../../packages/dragon/src/blocks/carry/gallery/carry.time.en.dragon":j,"../../../../packages/dragon/src/blocks/carry/gallery/carry.tree.dragon":Y,"../../../../packages/dragon/src/blocks/carry/gallery/carry.tree.en.dragon":K,"../../../../packages/dragon/src/blocks/chain/gallery/chain.try.dragon":Q,"../../../../packages/dragon/src/blocks/chain/gallery/chain.try.en.dragon":Z,"../../../../packages/dragon/src/blocks/check/gallery/check.pipe.dragon":$,"../../../../packages/dragon/src/blocks/check/gallery/check.pipe.en.dragon":X,"../../../../packages/dragon/src/blocks/color/gallery/color.architecture.dragon":nn,"../../../../packages/dragon/src/blocks/color/gallery/color.architecture.en.dragon":en,"../../../../packages/dragon/src/blocks/color/gallery/color.git.dragon":on,"../../../../packages/dragon/src/blocks/color/gallery/color.git.en.dragon":an,"../../../../packages/dragon/src/blocks/color/gallery/color.lineup.dragon":tn,"../../../../packages/dragon/src/blocks/color/gallery/color.lineup.en.dragon":sn,"../../../../packages/dragon/src/blocks/color/gallery/color.sequence.dragon":rn,"../../../../packages/dragon/src/blocks/color/gallery/color.sequence.en.dragon":cn,"../../../../packages/dragon/src/blocks/color/gallery/color.state.dragon":ln,"../../../../packages/dragon/src/blocks/color/gallery/color.state.en.dragon":pn,"../../../../packages/dragon/src/blocks/color/gallery/color.time.dragon":gn,"../../../../packages/dragon/src/blocks/color/gallery/color.time.en.dragon":dn,"../../../../packages/dragon/src/blocks/color/gallery/color.tree.dragon":bn,"../../../../packages/dragon/src/blocks/color/gallery/color.tree.en.dragon":hn,"../../../../packages/dragon/src/blocks/commit/gallery/commit.git.dragon":_n,"../../../../packages/dragon/src/blocks/commit/gallery/commit.git.en.dragon":mn,"../../../../packages/dragon/src/blocks/copy/gallery/copy.git.dragon":un,"../../../../packages/dragon/src/blocks/copy/gallery/copy.git.en.dragon":yn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.architecture.dragon":kn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.architecture.en.dragon":xn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.git.dragon":vn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.git.en.dragon":fn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.sequence.dragon":wn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.sequence.en.dragon":An,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.state.dragon":En,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.state.en.dragon":Cn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.time.dragon":Bn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.time.en.dragon":Dn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.tree.dragon":Tn,"../../../../packages/dragon/src/blocks/edge-label/gallery/edge-label.tree.en.dragon":Sn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.architecture.dragon":Rn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.architecture.en.dragon":qn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.git.dragon":Pn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.git.en.dragon":Hn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.sequence.dragon":Wn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.sequence.en.dragon":Un,"../../../../packages/dragon/src/blocks/edge/gallery/edge.state.dragon":Mn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.state.en.dragon":Ln,"../../../../packages/dragon/src/blocks/edge/gallery/edge.time.dragon":Nn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.time.en.dragon":Gn,"../../../../packages/dragon/src/blocks/edge/gallery/edge.tree.dragon":On,"../../../../packages/dragon/src/blocks/edge/gallery/edge.tree.en.dragon":In,"../../../../packages/dragon/src/blocks/emit/gallery/emit.pipe.dragon":Vn,"../../../../packages/dragon/src/blocks/emit/gallery/emit.pipe.en.dragon":zn,"../../../../packages/dragon/src/blocks/fold/gallery/fold.pipe.dragon":Fn,"../../../../packages/dragon/src/blocks/fold/gallery/fold.pipe.en.dragon":Jn,"../../../../packages/dragon/src/blocks/group/gallery/group.architecture.dragon":jn,"../../../../packages/dragon/src/blocks/group/gallery/group.architecture.en.dragon":Yn,"../../../../packages/dragon/src/blocks/hold/gallery/hold.pipe.dragon":Kn,"../../../../packages/dragon/src/blocks/hold/gallery/hold.pipe.en.dragon":Qn,"../../../../packages/dragon/src/blocks/icon/gallery/icon.architecture.dragon":Zn,"../../../../packages/dragon/src/blocks/icon/gallery/icon.architecture.en.dragon":$n,"../../../../packages/dragon/src/blocks/icon/gallery/icon.git.dragon":Xn,"../../../../packages/dragon/src/blocks/icon/gallery/icon.git.en.dragon":ne,"../../../../packages/dragon/src/blocks/icon/gallery/icon.pipe.dragon":ee,"../../../../packages/dragon/src/blocks/icon/gallery/icon.pipe.en.dragon":oe,"../../../../packages/dragon/src/blocks/icon/gallery/icon.sequence.dragon":ae,"../../../../packages/dragon/src/blocks/icon/gallery/icon.sequence.en.dragon":te,"../../../../packages/dragon/src/blocks/icon/gallery/icon.state.dragon":se,"../../../../packages/dragon/src/blocks/icon/gallery/icon.state.en.dragon":re,"../../../../packages/dragon/src/blocks/icon/gallery/icon.time.dragon":ce,"../../../../packages/dragon/src/blocks/icon/gallery/icon.time.en.dragon":le,"../../../../packages/dragon/src/blocks/icon/gallery/icon.tree.dragon":ie,"../../../../packages/dragon/src/blocks/icon/gallery/icon.tree.en.dragon":pe,"../../../../packages/dragon/src/blocks/item/gallery/item.lineup.dragon":ge,"../../../../packages/dragon/src/blocks/item/gallery/item.lineup.en.dragon":de,"../../../../packages/dragon/src/blocks/leaf/gallery/leaf.tree.dragon":be,"../../../../packages/dragon/src/blocks/leaf/gallery/leaf.tree.en.dragon":he,"../../../../packages/dragon/src/blocks/legend/gallery/legend.lineup.dragon":_e,"../../../../packages/dragon/src/blocks/legend/gallery/legend.lineup.en.dragon":me,"../../../../packages/dragon/src/blocks/lifeline/gallery/lifeline.sequence.dragon":ue,"../../../../packages/dragon/src/blocks/lifeline/gallery/lifeline.sequence.en.dragon":ye,"../../../../packages/dragon/src/blocks/line/gallery/line.lineup.dragon":ke,"../../../../packages/dragon/src/blocks/line/gallery/line.lineup.en.dragon":xe,"../../../../packages/dragon/src/blocks/link/gallery/link.architecture.dragon":ve,"../../../../packages/dragon/src/blocks/link/gallery/link.architecture.en.dragon":fe,"../../../../packages/dragon/src/blocks/link/gallery/link.git.dragon":we,"../../../../packages/dragon/src/blocks/link/gallery/link.git.en.dragon":Ae,"../../../../packages/dragon/src/blocks/link/gallery/link.sequence.dragon":Ee,"../../../../packages/dragon/src/blocks/link/gallery/link.sequence.en.dragon":Ce,"../../../../packages/dragon/src/blocks/link/gallery/link.state.dragon":Be,"../../../../packages/dragon/src/blocks/link/gallery/link.state.en.dragon":De,"../../../../packages/dragon/src/blocks/link/gallery/link.time.dragon":Te,"../../../../packages/dragon/src/blocks/link/gallery/link.time.en.dragon":Se,"../../../../packages/dragon/src/blocks/link/gallery/link.tree.dragon":Re,"../../../../packages/dragon/src/blocks/link/gallery/link.tree.en.dragon":qe,"../../../../packages/dragon/src/blocks/log/gallery/log.try.dragon":Pe,"../../../../packages/dragon/src/blocks/log/gallery/log.try.en.dragon":He,"../../../../packages/dragon/src/blocks/merge/gallery/merge.git.dragon":We,"../../../../packages/dragon/src/blocks/merge/gallery/merge.git.en.dragon":Ue,"../../../../packages/dragon/src/blocks/node/gallery/node.tree.dragon":Me,"../../../../packages/dragon/src/blocks/node/gallery/node.tree.en.dragon":Le,"../../../../packages/dragon/src/blocks/note/gallery/note.architecture.dragon":Ne,"../../../../packages/dragon/src/blocks/note/gallery/note.architecture.en.dragon":Ge,"../../../../packages/dragon/src/blocks/note/gallery/note.git.dragon":Oe,"../../../../packages/dragon/src/blocks/note/gallery/note.git.en.dragon":Ie,"../../../../packages/dragon/src/blocks/note/gallery/note.lineup.dragon":Ve,"../../../../packages/dragon/src/blocks/note/gallery/note.lineup.en.dragon":ze,"../../../../packages/dragon/src/blocks/note/gallery/note.sequence.dragon":Fe,"../../../../packages/dragon/src/blocks/note/gallery/note.sequence.en.dragon":Je,"../../../../packages/dragon/src/blocks/note/gallery/note.state.dragon":je,"../../../../packages/dragon/src/blocks/note/gallery/note.state.en.dragon":Ye,"../../../../packages/dragon/src/blocks/note/gallery/note.time.dragon":Ke,"../../../../packages/dragon/src/blocks/note/gallery/note.time.en.dragon":Qe,"../../../../packages/dragon/src/blocks/note/gallery/note.tree.dragon":Ze,"../../../../packages/dragon/src/blocks/note/gallery/note.tree.en.dragon":$e,"../../../../packages/dragon/src/blocks/order/gallery/order.lineup.dragon":Xe,"../../../../packages/dragon/src/blocks/order/gallery/order.lineup.en.dragon":no,"../../../../packages/dragon/src/blocks/pick/gallery/pick.lineup.dragon":eo,"../../../../packages/dragon/src/blocks/pick/gallery/pick.lineup.en.dragon":oo,"../../../../packages/dragon/src/blocks/point/gallery/point.time.dragon":ao,"../../../../packages/dragon/src/blocks/point/gallery/point.time.en.dragon":to,"../../../../packages/dragon/src/blocks/press/gallery/press.try.dragon":so,"../../../../packages/dragon/src/blocks/press/gallery/press.try.en.dragon":ro,"../../../../packages/dragon/src/blocks/queue/gallery/queue.try.dragon":co,"../../../../packages/dragon/src/blocks/queue/gallery/queue.try.en.dragon":lo,"../../../../packages/dragon/src/blocks/return/gallery/return.pipe.dragon":io,"../../../../packages/dragon/src/blocks/return/gallery/return.pipe.en.dragon":po,"../../../../packages/dragon/src/blocks/revert/gallery/revert.pipe.dragon":go,"../../../../packages/dragon/src/blocks/revert/gallery/revert.pipe.en.dragon":bo,"../../../../packages/dragon/src/blocks/role/gallery/role.lineup.dragon":ho,"../../../../packages/dragon/src/blocks/role/gallery/role.lineup.en.dragon":_o,"../../../../packages/dragon/src/blocks/route/gallery/route.try.dragon":mo,"../../../../packages/dragon/src/blocks/route/gallery/route.try.en.dragon":uo,"../../../../packages/dragon/src/blocks/row/gallery/row.time.dragon":yo,"../../../../packages/dragon/src/blocks/row/gallery/row.time.en.dragon":ko,"../../../../packages/dragon/src/blocks/scale/gallery/scale.time.dragon":xo,"../../../../packages/dragon/src/blocks/scale/gallery/scale.time.en.dragon":vo,"../../../../packages/dragon/src/blocks/seal/gallery/seal.lineup.dragon":fo,"../../../../packages/dragon/src/blocks/seal/gallery/seal.lineup.en.dragon":wo,"../../../../packages/dragon/src/blocks/side-path/gallery/side-path.state.dragon":Ao,"../../../../packages/dragon/src/blocks/side-path/gallery/side-path.state.en.dragon":Eo,"../../../../packages/dragon/src/blocks/side/gallery/side.try.dragon":Co,"../../../../packages/dragon/src/blocks/side/gallery/side.try.en.dragon":Bo,"../../../../packages/dragon/src/blocks/source/gallery/source.architecture.dragon":Do,"../../../../packages/dragon/src/blocks/source/gallery/source.architecture.en.dragon":To,"../../../../packages/dragon/src/blocks/source/gallery/source.git.dragon":So,"../../../../packages/dragon/src/blocks/source/gallery/source.git.en.dragon":Ro,"../../../../packages/dragon/src/blocks/source/gallery/source.lineup.dragon":qo,"../../../../packages/dragon/src/blocks/source/gallery/source.lineup.en.dragon":Po,"../../../../packages/dragon/src/blocks/source/gallery/source.pipe.dragon":Ho,"../../../../packages/dragon/src/blocks/source/gallery/source.pipe.en.dragon":Wo,"../../../../packages/dragon/src/blocks/source/gallery/source.sequence.dragon":Uo,"../../../../packages/dragon/src/blocks/source/gallery/source.sequence.en.dragon":Mo,"../../../../packages/dragon/src/blocks/source/gallery/source.state.dragon":Lo,"../../../../packages/dragon/src/blocks/source/gallery/source.state.en.dragon":No,"../../../../packages/dragon/src/blocks/source/gallery/source.time.dragon":Go,"../../../../packages/dragon/src/blocks/source/gallery/source.time.en.dragon":Oo,"../../../../packages/dragon/src/blocks/source/gallery/source.tree.dragon":Io,"../../../../packages/dragon/src/blocks/source/gallery/source.tree.en.dragon":Vo,"../../../../packages/dragon/src/blocks/stamp/gallery/stamp.lineup.dragon":zo,"../../../../packages/dragon/src/blocks/stamp/gallery/stamp.lineup.en.dragon":Fo,"../../../../packages/dragon/src/blocks/start-finish/gallery/start-finish.state.dragon":Jo,"../../../../packages/dragon/src/blocks/start-finish/gallery/start-finish.state.en.dragon":jo,"../../../../packages/dragon/src/blocks/step/gallery/step.architecture.dragon":Yo,"../../../../packages/dragon/src/blocks/step/gallery/step.architecture.en.dragon":Ko,"../../../../packages/dragon/src/blocks/step/gallery/step.git.dragon":Qo,"../../../../packages/dragon/src/blocks/step/gallery/step.git.en.dragon":Zo,"../../../../packages/dragon/src/blocks/step/gallery/step.lineup.dragon":$o,"../../../../packages/dragon/src/blocks/step/gallery/step.lineup.en.dragon":Xo,"../../../../packages/dragon/src/blocks/step/gallery/step.pipe.dragon":na,"../../../../packages/dragon/src/blocks/step/gallery/step.pipe.en.dragon":ea,"../../../../packages/dragon/src/blocks/step/gallery/step.sequence.dragon":oa,"../../../../packages/dragon/src/blocks/step/gallery/step.sequence.en.dragon":aa,"../../../../packages/dragon/src/blocks/step/gallery/step.state.dragon":ta,"../../../../packages/dragon/src/blocks/step/gallery/step.state.en.dragon":sa,"../../../../packages/dragon/src/blocks/step/gallery/step.time.dragon":ra,"../../../../packages/dragon/src/blocks/step/gallery/step.time.en.dragon":ca,"../../../../packages/dragon/src/blocks/step/gallery/step.tree.dragon":la,"../../../../packages/dragon/src/blocks/step/gallery/step.tree.en.dragon":ia,"../../../../packages/dragon/src/blocks/strip/gallery/strip.architecture.dragon":pa,"../../../../packages/dragon/src/blocks/strip/gallery/strip.architecture.en.dragon":ga,"../../../../packages/dragon/src/blocks/strip/gallery/strip.git.dragon":da,"../../../../packages/dragon/src/blocks/strip/gallery/strip.git.en.dragon":ba,"../../../../packages/dragon/src/blocks/strip/gallery/strip.lineup.dragon":ha,"../../../../packages/dragon/src/blocks/strip/gallery/strip.lineup.en.dragon":_a,"../../../../packages/dragon/src/blocks/strip/gallery/strip.sequence.dragon":ma,"../../../../packages/dragon/src/blocks/strip/gallery/strip.sequence.en.dragon":ua,"../../../../packages/dragon/src/blocks/strip/gallery/strip.state.dragon":ya,"../../../../packages/dragon/src/blocks/strip/gallery/strip.state.en.dragon":ka,"../../../../packages/dragon/src/blocks/strip/gallery/strip.time.dragon":xa,"../../../../packages/dragon/src/blocks/strip/gallery/strip.time.en.dragon":va,"../../../../packages/dragon/src/blocks/strip/gallery/strip.tree.dragon":fa,"../../../../packages/dragon/src/blocks/strip/gallery/strip.tree.en.dragon":wa,"../../../../packages/dragon/src/blocks/value/gallery/value.pipe.dragon":Aa,"../../../../packages/dragon/src/blocks/value/gallery/value.pipe.en.dragon":Ea,"../../../../packages/dragon/src/blocks/write/gallery/write.pipe.dragon":Ca,"../../../../packages/dragon/src/blocks/write/gallery/write.pipe.en.dragon":Ba,"../../../../packages/dragon/src/blocks/zoom/gallery/zoom.time.dragon":Da,"../../../../packages/dragon/src/blocks/zoom/gallery/zoom.time.en.dragon":Ta}),Ra=Object.fromEntries(Object.entries(Sa).map(([n,e])=>[`./parts/${n.slice(n.lastIndexOf("/")+1)}`,e]));export{Ra as SNIPPETS};
