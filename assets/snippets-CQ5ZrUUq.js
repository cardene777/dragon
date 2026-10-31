const n=`architecture 箱の中の処理

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
`,e=`architecture Action

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
`,o=`git Action

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
`,a=`sequence 箱の中の処理

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
`,s=`sequence Action

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
`,r=`state 箱の中の処理

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
`,c=`time 処理

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
`,p=`time Action

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
`,l=`tree 箱の中の処理

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
`,d=`tree Work in a box

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
`,h=`architecture 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,b=`architecture Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,g=`git 箱

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
`,m=`git Box

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
`,_=`lineup 箱

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
`,u=`lineup Boxes

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
`,y=`sequence 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,x=`sequence Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,v=`state 箱

box 下書き
box 公開中 as 公開している

step 公開する
  say box の行で状態を 1 つ置く。as の後ろに見せる名前を書く。
  下書き -> 公開中: 公開する

step 戻す
  say 線は状態の名札で書く。
  公開中 -> 下書き: 取り下げる
`,w=`state Box

box draft as Draft
box live as Published

step Publish
  say A box line places one state. The name to show follows as.
  draft -> live: publish

step Withdraw
  say Edges name the states by their tags.
  live -> draft: withdraw
`,f=`time 箱

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
`,k=`time Box

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
`,A=`tree 箱

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
`,E=`tree Boxes

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
`,B=`git 枝

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
`,C=`git Branch

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
`,D=`architecture 運ぶ物

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
`,S=`architecture Carry

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
`,R=`git 運ぶ物

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
`,q=`git Carry

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
`,T=`sequence 運ぶ物

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
`,M=`sequence Carry

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
`,L=`state 運ぶ物

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
`,W=`state Carry

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
`,H=`time 運ぶ物

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
`,P=`time Carry

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
`,O=`tree 運ぶ物

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
`,z=`tree What travels

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
`,U=`architecture 色の役

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
`,N=`architecture Color

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
`,I=`git 色の役

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
`,J=`git Color

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
`,G=`lineup 色の役

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
`,K=`lineup Color

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
`,j=`sequence 色の役

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
`,F=`sequence Color

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
`,V=`state 色の役

box 下書き [color: slate]
box 審査中 [color: amber]
box 公開中 [color: green]

step 出す
  say color で、状態の箱に 7 つの役から色を選ぶ。
  下書き -> 審査中: 審査に出す

step 通る
  say 役は意味で選ぶ。待つ状態は amber、終えた状態は green のように揃える。
  審査中 -> 公開中: 通す
`,Z=`state Color

box draft as Draft [color: slate]
box review as In review [color: amber]
box live as Published [color: green]

step Submit
  say color picks one of 7 roles for a state box.
  draft -> review: submit

step Approve
  say Pick roles by meaning, such as amber for waiting states and green for finished ones.
  review -> live: approve
`,Q=`time 色

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
`,X=`time Color

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
`,Y=`tree 色の役

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
`,$=`tree Color roles

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
`,nn=`git commit

branch main

step 積む
  say commit <名札> on <枝> で枝に commit を積む。積んだ枝の札が新しい commit へ進む。
  commit A on main
  commit B on main

step 字を添える
  say hash と note で、丸の外に hash と一言を添える。
  commit C on main [hash: c41d0e5, note: 価格を丸める]
`,en=`git Commit

branch main

step Commit
  say commit <id> on <branch> adds a commit to the branch. The branch's ref moves to the new commit.
  commit A on main
  commit B on main

step Add text
  say hash and note put a hash and a short note beside the circle.
  commit C on main [hash: c41d0e5, note: Round prices]
`,tn=`git 当て直し

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
`,on=`git Replay

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
`,an=`architecture 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,sn=`architecture Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,rn=`git 線の名前

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
`,cn=`git Edge label

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
`,pn=`sequence 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。横の線は above か below。
  乙 -> 甲: 下の名前 [side: below]
`,ln=`sequence Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above or below.
  b -> a: label below [side: below]
`,dn=`state 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,hn=`state Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,bn=`time 線の名前

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
`,gn=`time Edge label

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
`,mn=`tree 線の名前

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
`,_n=`tree Line names

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
`,un=`architecture 線

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
`,yn=`architecture Edge

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
`,xn=`git 線

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
`,vn=`git Edge

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
`,wn=`sequence 線

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
`,fn=`sequence Edge

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
`,kn=`state 線

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
`,An=`state Edge

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
`,En=`time 線

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
`,Bn=`time Edge

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
`,Cn=`tree 線

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
`,Dn=`tree Lines

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
`,Sn=`architecture 区画

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
`,Rn=`architecture Group

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
`,qn=`architecture 絵

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
`,Tn=`architecture Icon

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
`,Mn=`git 絵

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
`,Ln=`git Icon

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
`,Wn=`sequence 絵

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
`,Hn=`sequence Icon

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
`,Pn=`state 絵

box 下書き [icon: doc]
box 審査中 [icon: clock]
box 公開中 [icon: globe]

step 出す
  say icon で状態の箱に絵を付ける。
  下書き -> 審査中: 審査に出す

step 通る
  say 運ぶ物は、着いた状態の絵柄の横の置き場に留まる。
  審査中 -> 公開中: 通す
`,On=`state Icon

box draft as Draft [icon: doc]
box review as In review [icon: clock]
box live as Published [icon: globe]

step Submit
  say icon puts a picture on a state box.
  draft -> review: submit

step Approve
  say The carried item rests in the slot beside the icon of the state it reaches.
  review -> live: approve
`,zn=`time 絵

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
`,Un=`time Icon

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
`,Nn=`tree 絵

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
`,In=`tree Icons

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
`,Jn=`lineup チップ

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
`,Gn=`lineup Chips

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
`,Kn=`tree 葉と札

step 葉を出す
  say leaf の行で葉を出す。hash に値を書くと、箱に値を、葉の下の札に名札を出す。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 親を組む
  say 札は最初の段から出ていて、葉が現れると点線で結ばれる。
  node 根 of 取引1, 取引2 [hash: 7a21]
`,jn=`tree Leaf and card

step Add leaves
  say A leaf line adds a leaf. With a hash, the box shows the value and a card below shows the id.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Cards are there from the first step, and a dotted line ties them to the leaf when it appears.
  node root of tx1, tx2 [hash: 7a21]
`,Fn=`sequence 生存線

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
`,Vn=`sequence Lifeline

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
`,Zn=`lineup 列の並び

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
`,Qn=`lineup Lane order

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
`,Xn=`architecture 飛び先

box アプリ
box 決済 as 決済の仕組み [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  アプリ -> 決済: 請求

step 返す
  say 箱の中の仕組みを別の図に描いた時は、その図の頁を飛び先にする。
  決済 -> アプリ: 済
`,Yn=`architecture Link

box app as App
box pay as Payment system [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  app -> pay: Charge

step Answer
  say When another diagram draws what is inside the box, link to its page.
  pay -> app: Done
`,$n=`git 飛び先

branch main

box 遠く as 遠くの repo [link: https://github.com/cardene777/dragon]

step 積む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  commit A on main

step 送る
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  commit B on main
  note 遠く: B を受け取った
`,ne=`git Link

branch main

box remote as Remote repo [link: https://github.com/cardene777/dragon]

step Commit
  say link on a box makes the box a link to that place in the drawn diagram.
  commit A on main

step Push
  say Write a path that starts with / or a URL that starts with http:// or https://.
  commit B on main
  note remote: Received B
`,ee=`sequence 飛び先

box 利用者
box 認可 as 認可サーバー [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  利用者 -> 認可: 許可を求める

step 返す
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  認可 -> 利用者: 許可した
`,te=`sequence Link

box user as User
box auth as Auth server [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  user -> auth: Ask for access

step Answer
  say Write a path that starts with / or a URL that starts with http:// or https://.
  auth -> user: Granted
`,oe=`state 飛び先

box 注文 as 注文を受けた
box 支払い as 支払いを確かめる [link: https://github.com/cardene777/dragon]

step 受ける
  say link で状態の箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  start -> 注文

step 確かめる
  say 確かめ方を別の図に描いた時は、その図の頁を飛び先にする。
  注文 -> 支払い: 払った
  支払い -> finish
`,ae=`state Link

box order as Order received
box check as Checking payment [link: https://github.com/cardene777/dragon]

step Receive
  say link on a state box makes the box a link to that place in the drawn diagram.
  start -> order

step Check
  say When another diagram draws how the check works, link to its page.
  order -> check: Paid
  check -> finish
`,se=`time 飛び先

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
`,re=`time Link

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
`,ie=`tree 飛び先

box 遠く as 遠くの台帳 [link: https://github.com/cardene777/dragon]

step 葉を出す
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 遠く: 根を受け取った
`,ce=`tree Links

box remote as Remote ledger [link: https://github.com/cardene777/dragon]

step Add leaves
  say link gives a box a target. Clicking the box in the drawn diagram goes there.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Write a path starting with / or a URL starting with http:// or https://.
  node root of tx1, tx2 [hash: 7a21]
  note remote: got the root
`,pe=`git merge commit

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
`,le=`git Merge commit

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
`,de=`tree 組んだ親

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
`,he=`tree Parent node

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
`,be=`architecture 小さな字

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
`,ge=`architecture Note

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
`,me=`git 小さな字

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
`,_e=`git Note

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
`,ue=`lineup 小さな字

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
`,ye=`lineup Small text

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
`,xe=`sequence 小さな字

box 財布 [note: 残高 5000 円]
box 店 [note: 待っている]

step 払う
  say note で箱の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,ve=`sequence Note

box wallet as Wallet [note: balance 50 USD]
box shop as Shop [note: waiting]

step Pay
  say note adds small text under the box name.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites the small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,we=`state 小さな字

box 在庫あり [note: 残り 1 個]
box 品切れ [note: 入荷待ち]

step 売り切れる
  say note で状態の名前の下に小さな字を添える。
  在庫あり -> 品切れ: 最後の 1 個が売れた

step 入荷する
  say 段の中の note の行で、その段から状態の小さな字を書き換える。
  品切れ -> 在庫あり: 入荷した
  note 在庫あり: 残り 10 個
`,fe=`state Note

box stocked as In stock [note: 1 left]
box out as Sold out [note: awaiting stock]

step Sell out
  say note adds small text under the state name.
  stocked -> out: last one sold

step Restock
  say A note line inside a step rewrites the small text from that step on.
  out -> stocked: restocked
  note stocked: 10 left
`,ke=`time 小さな字

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
`,Ae=`time Note

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
`,Ee=`tree 小さな字

box 記録 [note: まだ無い]

step 葉を出す
  say note で箱の名前の下に小さな字を添える。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 記録: 根 7a21
`,Be=`tree Small text

box ledger as Ledger [note: empty]

step Add leaves
  say note adds small text under the box name.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say A note line inside a step rewrites that small text from that step on.
  node root of tx1, tx2 [hash: 7a21]
  note ledger: root 7a21
`,Ce=`lineup 選ぶ

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
`,De=`lineup Pick

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
`,Se=`time 節目

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
`,Re=`time Point

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
`,qe=`time 印の列

scale slot 12s 8
row ブロック [color: blue, empty: 2 5]
row 票 [color: amber]

step 印を塗る
  say row で印の列を上から宣言する。針が過ぎた目盛りの印が塗られ、empty の目盛りは空きの印になる。
  now -> 7

step 色を変える
  say 段の中の mark で、列の目盛りの範囲の印の色を変える。
  mark ブロック 0-3 [color: green]
`,Te=`time Row of marks

scale slot 12s 8
row block [color: blue, empty: 2 5]
row vote [color: amber]

step Fill the marks
  say Declare rows from top to bottom with row. Marks fill once the needle passes, and units in empty stay empty.
  now -> 7

step Recolor
  say mark inside a step recolors a range of marks in a row.
  mark block 0-3 [color: green]
`,Me=`time 目盛りと針

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
`,Le=`time Scale and needle

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
`,We=`lineup 封

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
`,He=`lineup Seal

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
`,Pe=`state 通らない道

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
`,Oe=`state Path not taken

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
`,ze=`architecture 出典

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
`,Ue=`architecture Source

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
`,Ne=`git 出典

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
`,Ie=`git Source

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
`,Je=`lineup 出典

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
`,Ge=`lineup Sources

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
`,Ke=`sequence 出典

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
`,je=`sequence Source

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
`,Fe=`state 出典

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
`,Ve=`state Source

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
`,Ze=`time 出典

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
`,Qe=`time Source

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
`,Xe=`tree 出典

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
`,Ye=`tree Sources

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
`,$e=`lineup 札

box 申請 [color: amber]

item 書類1, 書類2, 書類3

step 並べる
  say 列にチップを並べる。
  line 申請: 書類1, 書類2, 書類3

step 札を押す
  say stamp で、列の右に傾いた札を押す。中身に触れずに起きたことを見せる。
  stamp 申請: 承認済み
`,nt=`lineup Stamp

box request as Request [color: amber]

item doc1, doc2, doc3

step Line up
  say A lane gets its chips.
  line request: doc1, doc2, doc3

step Stamp
  say stamp lands a tilted stamp on the right of a lane. It shows what happens without touching the contents.
  stamp request: Approved
`,et=`state 始まりと終わり

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
`,tt=`state Start and end

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
`,ot=`architecture 段 [view: fixed]

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
`,at=`architecture Step [view: fixed]

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
`,st=`git 段 [view: fixed]

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
`,rt=`git Step [view: fixed]

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
`,it=`lineup 段 [view: fixed]

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
`,ct=`lineup Steps [view: fixed]

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
`,pt=`sequence 段 [view: fixed]

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
`,lt=`sequence Step [view: fixed]

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
`,dt=`state 段 [view: fixed]

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
`,ht=`state Step [view: fixed]

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
`,bt=`time 段 [view: fixed]

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
`,gt=`time Step [view: fixed]

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
`,mt=`tree 段 [view: fixed]

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
`,_t=`tree Steps [view: fixed]

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
`,ut=`architecture 中身の帯と欄

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
`,yt=`architecture Strip

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
`,xt=`git 中身の帯と欄

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
`,vt=`git Strip

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
`,wt=`lineup 中身の帯と欄

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
`,ft=`lineup Strip and fields

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
`,kt=`sequence 中身の帯と欄

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
`,At=`sequence Strip

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
`,Et=`state 中身の帯と欄

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
`,Bt=`state Strip

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
`,Ct=`time 中身の帯と欄

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
`,Dt=`time Strip and fields

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
`,St=`tree 中身の帯と欄

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
`,Rt=`tree Strip and fields

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
`,qt=`time 拡大の帯

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
`,Tt=`time Zoom band

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
`,Mt=Object.assign({"./parts/act.architecture.dragon":n,"./parts/act.architecture.en.dragon":e,"./parts/act.git.dragon":t,"./parts/act.git.en.dragon":o,"./parts/act.sequence.dragon":a,"./parts/act.sequence.en.dragon":s,"./parts/act.state.dragon":r,"./parts/act.state.en.dragon":i,"./parts/act.time.dragon":c,"./parts/act.time.en.dragon":p,"./parts/act.tree.dragon":l,"./parts/act.tree.en.dragon":d,"./parts/box.architecture.dragon":h,"./parts/box.architecture.en.dragon":b,"./parts/box.git.dragon":g,"./parts/box.git.en.dragon":m,"./parts/box.lineup.dragon":_,"./parts/box.lineup.en.dragon":u,"./parts/box.sequence.dragon":y,"./parts/box.sequence.en.dragon":x,"./parts/box.state.dragon":v,"./parts/box.state.en.dragon":w,"./parts/box.time.dragon":f,"./parts/box.time.en.dragon":k,"./parts/box.tree.dragon":A,"./parts/box.tree.en.dragon":E,"./parts/branch.git.dragon":B,"./parts/branch.git.en.dragon":C,"./parts/carry.architecture.dragon":D,"./parts/carry.architecture.en.dragon":S,"./parts/carry.git.dragon":R,"./parts/carry.git.en.dragon":q,"./parts/carry.sequence.dragon":T,"./parts/carry.sequence.en.dragon":M,"./parts/carry.state.dragon":L,"./parts/carry.state.en.dragon":W,"./parts/carry.time.dragon":H,"./parts/carry.time.en.dragon":P,"./parts/carry.tree.dragon":O,"./parts/carry.tree.en.dragon":z,"./parts/color.architecture.dragon":U,"./parts/color.architecture.en.dragon":N,"./parts/color.git.dragon":I,"./parts/color.git.en.dragon":J,"./parts/color.lineup.dragon":G,"./parts/color.lineup.en.dragon":K,"./parts/color.sequence.dragon":j,"./parts/color.sequence.en.dragon":F,"./parts/color.state.dragon":V,"./parts/color.state.en.dragon":Z,"./parts/color.time.dragon":Q,"./parts/color.time.en.dragon":X,"./parts/color.tree.dragon":Y,"./parts/color.tree.en.dragon":$,"./parts/commit.git.dragon":nn,"./parts/commit.git.en.dragon":en,"./parts/copy.git.dragon":tn,"./parts/copy.git.en.dragon":on,"./parts/edge-label.architecture.dragon":an,"./parts/edge-label.architecture.en.dragon":sn,"./parts/edge-label.git.dragon":rn,"./parts/edge-label.git.en.dragon":cn,"./parts/edge-label.sequence.dragon":pn,"./parts/edge-label.sequence.en.dragon":ln,"./parts/edge-label.state.dragon":dn,"./parts/edge-label.state.en.dragon":hn,"./parts/edge-label.time.dragon":bn,"./parts/edge-label.time.en.dragon":gn,"./parts/edge-label.tree.dragon":mn,"./parts/edge-label.tree.en.dragon":_n,"./parts/edge.architecture.dragon":un,"./parts/edge.architecture.en.dragon":yn,"./parts/edge.git.dragon":xn,"./parts/edge.git.en.dragon":vn,"./parts/edge.sequence.dragon":wn,"./parts/edge.sequence.en.dragon":fn,"./parts/edge.state.dragon":kn,"./parts/edge.state.en.dragon":An,"./parts/edge.time.dragon":En,"./parts/edge.time.en.dragon":Bn,"./parts/edge.tree.dragon":Cn,"./parts/edge.tree.en.dragon":Dn,"./parts/group.architecture.dragon":Sn,"./parts/group.architecture.en.dragon":Rn,"./parts/icon.architecture.dragon":qn,"./parts/icon.architecture.en.dragon":Tn,"./parts/icon.git.dragon":Mn,"./parts/icon.git.en.dragon":Ln,"./parts/icon.sequence.dragon":Wn,"./parts/icon.sequence.en.dragon":Hn,"./parts/icon.state.dragon":Pn,"./parts/icon.state.en.dragon":On,"./parts/icon.time.dragon":zn,"./parts/icon.time.en.dragon":Un,"./parts/icon.tree.dragon":Nn,"./parts/icon.tree.en.dragon":In,"./parts/item.lineup.dragon":Jn,"./parts/item.lineup.en.dragon":Gn,"./parts/leaf.tree.dragon":Kn,"./parts/leaf.tree.en.dragon":jn,"./parts/lifeline.sequence.dragon":Fn,"./parts/lifeline.sequence.en.dragon":Vn,"./parts/line.lineup.dragon":Zn,"./parts/line.lineup.en.dragon":Qn,"./parts/link.architecture.dragon":Xn,"./parts/link.architecture.en.dragon":Yn,"./parts/link.git.dragon":$n,"./parts/link.git.en.dragon":ne,"./parts/link.sequence.dragon":ee,"./parts/link.sequence.en.dragon":te,"./parts/link.state.dragon":oe,"./parts/link.state.en.dragon":ae,"./parts/link.time.dragon":se,"./parts/link.time.en.dragon":re,"./parts/link.tree.dragon":ie,"./parts/link.tree.en.dragon":ce,"./parts/merge.git.dragon":pe,"./parts/merge.git.en.dragon":le,"./parts/node.tree.dragon":de,"./parts/node.tree.en.dragon":he,"./parts/note.architecture.dragon":be,"./parts/note.architecture.en.dragon":ge,"./parts/note.git.dragon":me,"./parts/note.git.en.dragon":_e,"./parts/note.lineup.dragon":ue,"./parts/note.lineup.en.dragon":ye,"./parts/note.sequence.dragon":xe,"./parts/note.sequence.en.dragon":ve,"./parts/note.state.dragon":we,"./parts/note.state.en.dragon":fe,"./parts/note.time.dragon":ke,"./parts/note.time.en.dragon":Ae,"./parts/note.tree.dragon":Ee,"./parts/note.tree.en.dragon":Be,"./parts/pick.lineup.dragon":Ce,"./parts/pick.lineup.en.dragon":De,"./parts/point.time.dragon":Se,"./parts/point.time.en.dragon":Re,"./parts/row.time.dragon":qe,"./parts/row.time.en.dragon":Te,"./parts/scale.time.dragon":Me,"./parts/scale.time.en.dragon":Le,"./parts/seal.lineup.dragon":We,"./parts/seal.lineup.en.dragon":He,"./parts/side-path.state.dragon":Pe,"./parts/side-path.state.en.dragon":Oe,"./parts/source.architecture.dragon":ze,"./parts/source.architecture.en.dragon":Ue,"./parts/source.git.dragon":Ne,"./parts/source.git.en.dragon":Ie,"./parts/source.lineup.dragon":Je,"./parts/source.lineup.en.dragon":Ge,"./parts/source.sequence.dragon":Ke,"./parts/source.sequence.en.dragon":je,"./parts/source.state.dragon":Fe,"./parts/source.state.en.dragon":Ve,"./parts/source.time.dragon":Ze,"./parts/source.time.en.dragon":Qe,"./parts/source.tree.dragon":Xe,"./parts/source.tree.en.dragon":Ye,"./parts/stamp.lineup.dragon":$e,"./parts/stamp.lineup.en.dragon":nt,"./parts/start-finish.state.dragon":et,"./parts/start-finish.state.en.dragon":tt,"./parts/step.architecture.dragon":ot,"./parts/step.architecture.en.dragon":at,"./parts/step.git.dragon":st,"./parts/step.git.en.dragon":rt,"./parts/step.lineup.dragon":it,"./parts/step.lineup.en.dragon":ct,"./parts/step.sequence.dragon":pt,"./parts/step.sequence.en.dragon":lt,"./parts/step.state.dragon":dt,"./parts/step.state.en.dragon":ht,"./parts/step.time.dragon":bt,"./parts/step.time.en.dragon":gt,"./parts/step.tree.dragon":mt,"./parts/step.tree.en.dragon":_t,"./parts/strip.architecture.dragon":ut,"./parts/strip.architecture.en.dragon":yt,"./parts/strip.git.dragon":xt,"./parts/strip.git.en.dragon":vt,"./parts/strip.lineup.dragon":wt,"./parts/strip.lineup.en.dragon":ft,"./parts/strip.sequence.dragon":kt,"./parts/strip.sequence.en.dragon":At,"./parts/strip.state.dragon":Et,"./parts/strip.state.en.dragon":Bt,"./parts/strip.time.dragon":Ct,"./parts/strip.time.en.dragon":Dt,"./parts/strip.tree.dragon":St,"./parts/strip.tree.en.dragon":Rt,"./parts/zoom.time.dragon":qt,"./parts/zoom.time.en.dragon":Tt});export{Mt as SNIPPETS};
