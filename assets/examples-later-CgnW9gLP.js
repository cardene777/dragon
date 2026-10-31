const e=`// API の往復の見本。行きの線と戻りの線を引き、戻りの線の名前は線の下に置く
sequence 注文の一覧を取る

box ブラウザ as 利用者のブラウザ [note: 一覧の画面を開く, color: slate, icon: globe]
box API as API サーバー [note: 注文の一覧を返す, color: blue, icon: server]
box DB as 注文の DB [note: 注文を持つ, color: violet, icon: db]

step 一覧を頼む
  say 利用者が注文の画面を開くと、ブラウザが API サーバーに注文の一覧を頼む。
  ブラウザ -> API: GET /orders

step 注文を読む
  say API サーバーが、その利用者の注文を DB から読む。
  API -> DB: SELECT orders

step 行が返る
  say DB が当てはまる行を返す。戻りの線の名前は線の下に置き、行きの線の名前と見分ける。
  DB -> API: 12 行 [side: below]

step 一覧を返す
  say API サーバーが行を JSON にして、ブラウザに 200 OK で返す。
  API -> ブラウザ: 200 OK [side: below]
`,n=`// API round trip example. Draw the request and the reply, and put the reply labels under the line
sequence Fetch the order list

box browser as User's browser [note: opens the order screen, color: slate, icon: globe]
box api as API server [note: returns the order list, color: blue, icon: server]
box db as Order DB [note: holds the orders, color: violet, icon: db]

step Ask for the list
  say The user opens the order screen, and the browser asks the API server for the order list.
  browser -> api: GET /orders

step Read the orders
  say The API server reads that user's orders from the DB.
  api -> db: SELECT orders

step Rows come back
  say The DB returns the matching rows. The reply label sits under the line so it reads apart from the request label.
  db -> api: 12 rows [side: below]

step Return the list
  say The API server turns the rows into JSON and returns them to the browser with 200 OK.
  api -> browser: 200 OK [side: below]
`,t=`// Ethereum で送ったトランザクションが、ビルダーの入札を経てブロックに入り、投票されるまで。
// 列の 1 つが 1 人の持ち物で、チップ 1 枚が 1 件のトランザクション。自分の分は色の付いたチップで追う。
// ビルダーは順序を替えて封をし、提案者は金額だけを見て選び、中身を見ずに署名する。
lineup 入札でブロックの中身が決まるまで

box メモリプール
box ビルダーA
box ビルダーB [color: amber]
box ビルダーC
box バリデーター [color: green]

item 自分 [color: amber]
item 取引1, 取引2, 取引3, 取引4, 取引5, 取引6, 取引7
item 裏1, 裏2 [color: blue]
item 票1, 票2, 票3, 票4, 票5, 票6, 票7, 票8, 票9, 票10, 票11, 票12 [color: green, label: ✓]

step トランザクションが列に並ぶ
  say 送ったトランザクションはメモリプールに入り、ほかの人の分と一緒に待つ。
  line メモリプール: 取引1, 取引2, 自分, 取引3, 取引4, 取引5, 取引6, 取引7

step ビルダーが順序を決めて入札する
  say ビルダーは順序を並べ替え、メモリプールに無い取引も足してブロックを組み、金額を付ける。
  line ビルダーA: 取引1, 取引2, 自分, 取引3, 取引4, 取引5, 取引6, 取引7
  line ビルダーB: 裏1, 裏2, 取引3, 自分, 取引1, 取引2, 取引4, 取引5
  line ビルダーC: 取引1, 取引2, 取引3, 取引4, 取引5, 取引6, 取引7
  note ビルダーA: 0.05 ETH
  note ビルダーB: 0.12 ETH
  note ビルダーC: 0.08 ETH

step リレーが封をして中身を隠す
  say リレーは中身を預かって隠す。提案者が中身を盗めないようにするため。
  seal ビルダーA
  seal ビルダーB
  seal ビルダーC

step 提案者に金額だけを見せる
  say 提案者に届くのは金額だけで、最も高いビルダーBを選ぶ。
  pick ビルダーB

step 提案者が中身を見ずに署名する
  say 提案者は中身を見ないまま、ブロックの頭に署名する。
  stamp ビルダーB: 署名済み

step 封を開けて全文を公開する
  say 署名を受けたリレーが全文を公開する。負けた列の中身は公開されない。
  open ビルダーB

step バリデーターが投票する
  say バリデーターが実行し直して確かめ、正しければ投票する。
  line バリデーター: 票1, 票2, 票3, 票4, 票5, 票6, 票7, 票8, 票9, 票10, 票11, 票12
`,o=`// How a transaction sent on Ethereum gets into a block through builder bids and is voted on.
// Each lane belongs to one party and each chip is one transaction. Your own transaction is the coloured chip.
// Builders reorder and seal their lanes, and the proposer picks by price alone and signs without seeing the contents.
lineup How an auction decides what goes in a block

box Mempool
box BuilderA as Builder A
box BuilderB as Builder B [color: amber]
box BuilderC as Builder C
box Validators [color: green]

item mine [color: amber]
item t1, t2, t3, t4, t5, t6, t7
item private1, private2 [color: blue]
item v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12 [color: green, label: ✓]

step Transactions line up
  say A transaction you send enters the mempool and waits with everyone else's.
  line Mempool: t1, t2, mine, t3, t4, t5, t6, t7

step Builders pick an order and bid
  say Builders reorder the transactions, add private ones the mempool never saw, and name a price.
  line BuilderA: t1, t2, mine, t3, t4, t5, t6, t7
  line BuilderB: private1, private2, t3, mine, t1, t2, t4, t5
  line BuilderC: t1, t2, t3, t4, t5, t6, t7
  note BuilderA: 0.05 ETH
  note BuilderB: 0.12 ETH
  note BuilderC: 0.08 ETH

step The relay seals the contents
  say The relay holds the contents and hides them, so the proposer cannot steal them.
  seal BuilderA
  seal BuilderB
  seal BuilderC

step The proposer sees only the price
  say Only the price reaches the proposer, who picks the highest bid, Builder B.
  pick BuilderB

step The proposer signs without looking
  say The proposer signs the block header without seeing the contents.
  stamp BuilderB: Signed

step The seal opens and the block is published
  say With the signature in hand, the relay publishes the full block. The losing lanes stay hidden.
  open BuilderB

step Validators vote
  say Validators re-execute the block and vote for it if it is correct.
  line Validators: v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12
`,a=`// Ethereum でブロックが出てから確定して戻せなくなるまで。
// 上の帯が最初の 4 slot の拡大、下が 3 epoch 分 (96 slot) の時間軸で、細い棒 1 本が 1 slot (12 秒)。
// 全体を止めたまま針を進め、checkpoint が提案、正当化、確定と進む様子を下の帯と一緒に追う。
time Ethereum のブロックが確定して戻せなくなるまで

scale slot 12s 96 [from: 3200]
period epoch 32 [from: 100]
row ブロック [color: blue, empty: 3 13 45 79]
row 票 [color: amber]
point C100 at 0
point C101 at 32
point C102 at 64
zoom 0-3

box 提案者 [color: blue, icon: user]
box ブロック [color: blue, icon: box]
box 委員会 [note: 全体の 1/32, color: amber]

strip 確定の進み: 経過, C100, C101, C102, 今の epoch の票 [meter: 2/3]

step ブロックを出す
  say 時間は 12 秒ごとの slot に区切られる。slot ごとに validator から 1 人が提案者に選ばれ、ブロックを 1 つ出す。
  提案者 -> ブロック [at: 0]
  set 経過: 0 秒

step 委員会が投票する
  say 各 validator は 1 epoch に 1 回、割り当てられた slot で投票 (attestation) する。票は先頭のブロックと checkpoint を指す。
  code attestation = { head, source, target }
  委員会 -> ブロック [tag: 票, at: 0]
  now -> 0
  set 経過: 12 秒
  set 今の epoch の票: 3%

step 空く slot もある
  say 提案者が応答しないと、その slot はブロックの無いまま過ぎる。チェーンは止まらず、その slot の票は 1 つ前のブロックを指す。
  提案者 -> ブロック [at: 1]
  委員会 -> ブロック [tag: 票, at: 1]
  提案者 -> ブロック [at: 2]
  委員会 -> ブロック [tag: 票, at: 2]
  委員会 -> ブロック [tag: 票, at: 3, into: 2]
  now -> 3
  set 経過: 48 秒
  set 今の epoch の票: 12%

step checkpoint を決める
  say 32 slot (6.4 分) で 1 epoch。epoch の最初の slot のブロックが、その epoch の checkpoint になる。ここでは C100 と呼ぶ。
  note C100: 提案済み [color: blue]
  span 0-31: 32 slot = 6.4 分 [color: slate]
  set C100: 提案済み

step 票が積み上がる
  say epoch の間に全 validator が 1 回ずつ投票するので、C100 への票は slot ごとに積み上がる。票の重さは持っている stake で量る。
  now -> 31
  set 経過: 6 分 24 秒
  set 今の epoch の票: 97%

step 正当化する
  say epoch の終わりの集計で、C100 への票が全体の stake の 2/3 を超えていれば、C100 は正当化 (justified) される。
  note C100: 正当化 [color: violet]
  set C100: 正当化

step 次の epoch も同じ
  say 次の epoch では C101 へ票が集まる。票は直前に正当化された C100 を起点 (source)、C101 を目標 (target) として数える。
  code source C100 → target C101
  note C101: 提案済み [color: blue]
  now -> 63
  set 経過: 12 分 48 秒
  set 今の epoch の票: 97%
  set C101: 提案済み

step 前の checkpoint が確定する
  say C101 も正当化されると、続けて正当化された 2 つのうち前の C100 が確定 (finalized) する。C100 の提案から約 2 epoch、12.8 分。
  C100 -> C101: 2/3 を超えた [carry: none]
  note C101: 正当化 [color: violet]
  note C100: 確定 [color: green]
  mark ブロック 0 [color: green]
  span 0-63: C100 の提案から確定まで 約 12.8 分 [color: green]
  set C101: 正当化
  set C100: 確定

step 確定が 1 epoch ずつ進む
  say 以後は epoch ごとに同じことが起き、C102 の正当化で C101 までのブロックが確定する。確定した範囲は 1 epoch ずつ伸びる。
  note C102: 提案済み [color: blue]
  now -> 95
  C101 -> C102: 2/3 を超えた [carry: none]
  note C102: 正当化 [color: violet]
  note C101: 確定 [color: green]
  mark ブロック 1-32 [color: green]
  set 経過: 19 分 12 秒
  set 今の epoch の票: 97%
  set C101: 確定
  set C102: 正当化

step 確定したら戻せない
  say 確定したブロックを戻すには、全体の stake の 1/3 以上を持つ validator が矛盾した票を出し、罰 (slashing) を受けなければならない。
  span 0-32: 確定して戻せない [shape: box, color: rose]
`,s=`// How an Ethereum block becomes final and cannot be reverted.
// The top band zooms into the first 4 slots, and the bottom is a timeline of 3 epochs (96 slots), one thin bar per slot (12 seconds).
// The whole view stays still while the needle moves, and the strip follows the checkpoints from proposed to justified to finalized.
time How an Ethereum block becomes final

scale slot 12s 96 [from: 3200]
period epoch 32 [from: 100]
row block [color: blue, empty: 3 13 45 79]
row vote [color: amber]
point C100 at 0
point C101 at 32
point C102 at 64
zoom 0-3

box proposer [color: blue, icon: user]
box block [color: blue, icon: box]
box committee [note: 1/32 of all, color: amber]

strip Finality: Elapsed, C100, C101, C102, Votes this epoch [meter: 2/3]

step Propose a block
  say Time is cut into 12-second slots. In each slot one validator is chosen as the proposer and puts out one block.
  proposer -> block [at: 0]
  set Elapsed: 0 s

step The committee votes
  say Each validator votes (attests) once per epoch, in its assigned slot. A vote points at the head block and at a checkpoint.
  code attestation = { head, source, target }
  committee -> block [tag: vote, at: 0]
  now -> 0
  set Elapsed: 12 s
  set Votes this epoch: 3%

step Some slots stay empty
  say When the proposer does not respond, the slot passes without a block. The chain does not stop, and the votes of that slot point at the block before it.
  proposer -> block [at: 1]
  committee -> block [tag: vote, at: 1]
  proposer -> block [at: 2]
  committee -> block [tag: vote, at: 2]
  committee -> block [tag: vote, at: 3, into: 2]
  now -> 3
  set Elapsed: 48 s
  set Votes this epoch: 12%

step Pick the checkpoint
  say 32 slots (6.4 minutes) make one epoch. The block in the first slot of an epoch becomes its checkpoint, called C100 here.
  note C100: Proposed [color: blue]
  span 0-31: 32 slots = 6.4 min [color: slate]
  set C100: Proposed

step Votes pile up
  say Every validator votes once during the epoch, so the votes for C100 pile up slot by slot. A vote weighs as much as the stake behind it.
  now -> 31
  set Elapsed: 6 min 24 s
  set Votes this epoch: 97%

step Justify
  say At the end of the epoch, if the votes for C100 pass 2/3 of all stake, C100 is justified.
  note C100: Justified [color: violet]
  set C100: Justified

step The next epoch does the same
  say In the next epoch the votes gather on C101. They count from C100, the last justified checkpoint (source), to C101 (target).
  code source C100 → target C101
  note C101: Proposed [color: blue]
  now -> 63
  set Elapsed: 12 min 48 s
  set Votes this epoch: 97%
  set C101: Proposed

step The earlier checkpoint is finalized
  say When C101 is justified too, the earlier of the two justified checkpoints in a row, C100, is finalized. About 2 epochs, 12.8 minutes, after C100 was proposed.
  C100 -> C101: passed 2/3 [carry: none]
  note C101: Justified [color: violet]
  note C100: Final [color: green]
  mark block 0 [color: green]
  span 0-63: From C100 proposed to final, about 12.8 min [color: green]
  set C101: Justified
  set C100: Final

step Finality moves one epoch at a time
  say The same happens every epoch after that. Justifying C102 finalizes the blocks up to C101, so the final range grows one epoch at a time.
  note C102: Proposed [color: blue]
  now -> 95
  C101 -> C102: passed 2/3 [carry: none]
  note C102: Justified [color: violet]
  note C101: Final [color: green]
  mark block 1-32 [color: green]
  set Elapsed: 19 min 12 s
  set Votes this epoch: 97%
  set C101: Final
  set C102: Justified

step Final cannot be reverted
  say Reverting a final block needs validators holding at least 1/3 of all stake to cast conflicting votes and be punished (slashed).
  span 0-32: Final and cannot be reverted [shape: box, color: rose]
`,i=`// 直しの枝 fix と作業の枝 feature を、merge commit で main へ取り込むまで。
// 上の帯が main、その下に fix と feature。merge commit は取り込む先の先端と取り込む枝の先端の 2 つを親に持つ。
// 取り込む先の札だけが merge commit へ進み、取り込んだ枝の札は元の commit に残る。
git 2 本の枝を merge commit で main へ取り込む

branch main [note: 取り込む先]
branch fix [note: 直しの枝]
branch feature [note: 作業の枝]

strip 参照: main, fix, feature

step main にある
  say main に commit A と B がある。main は B を指し、HEAD は main を指している。
  commit A on main [hash: 3fa0c19, note: 最初の形]
  commit B on main [hash: 8b04f71, note: 一覧を足す]
  set main: B 8b04f71

step 枝を 2 本切る
  say B から直しの枝 fix と作業の枝 feature を切る。どちらも B を指し、HEAD は後から切った feature を指す。
  code git branch fix → git switch -c feature
  fix from B
  feature from B
  set fix: B 8b04f71
  set feature: B 8b04f71

step 直しを積む
  say fix に誤字の直し F を積む。fix は F へ進み、feature と main は B のまま。
  commit F on fix [hash: 5b2e7a1, note: 誤字を直す]
  set fix: F 5b2e7a1

step 作業を積む
  say feature に C と D を積む。commit のたびに feature が新しい commit へ進む。
  code git commit
  commit C on feature [hash: c41d0e5, note: 価格を丸める]
  commit D on feature [hash: d72b9a3, note: 送料を足す]
  set feature: D d72b9a3

step 直しを取り込む
  say main で fix を取り込むと、merge commit の M1 ができる。M1 の親は main の先端の B と fix の先端の F の 2 つで、main だけが M1 へ進む。
  code git switch main → git merge fix
  commit M1 on main merge fix [hash: 9a1c3e4, note: fix を取り込む]
  set main: M1 9a1c3e4

step 作業を取り込む
  say 続けて feature を取り込むと、M1 と D を親に持つ M2 ができる。fix と feature の札は元の commit に残る。
  code git merge feature
  commit M2 on main merge feature [hash: 4e8f0b2, note: feature を取り込む]
  set main: M2 4e8f0b2

step 枝の形が残る
  say merge commit は枝の commit を作り直さないので、hash は変わらず、枝分かれの形も履歴に残る。rebase で 1 本にする時との違いはここにある。
  code git log --graph --oneline
`,r=`// Bringing the fix branch and the feature branch into main with merge commits.
// The top lane is main, with fix and feature below it. A merge commit has two parents: the tip of the target and the tip of the merged branch.
// Only the target's ref moves to the merge commit; the merged branch's ref stays on its own commit.
git Merge two branches into main with merge commits

branch main [note: Merge target]
branch fix [note: Fix branch]
branch feature [note: Work branch]

strip Refs: main, fix, feature

step On main
  say main has commits A and B. main points at B, and HEAD points at main.
  commit A on main [hash: 3fa0c19, note: First shape]
  commit B on main [hash: 8b04f71, note: Add the list]
  set main: B 8b04f71

step Cut two branches
  say Cut the fix branch fix and the work branch feature from B. Both point at B, and HEAD points at feature, the one cut last.
  code git branch fix → git switch -c feature
  fix from B
  feature from B
  set fix: B 8b04f71
  set feature: B 8b04f71

step Commit a fix
  say Add the typo fix F on fix. fix moves to F, while feature and main stay at B.
  commit F on fix [hash: 5b2e7a1, note: Fix a typo]
  set fix: F 5b2e7a1

step Commit work
  say Add C and D on feature. Each commit moves feature to the new commit.
  code git commit
  commit C on feature [hash: c41d0e5, note: Round prices]
  commit D on feature [hash: d72b9a3, note: Add shipping]
  set feature: D d72b9a3

step Merge the fix
  say Merging fix on main creates the merge commit M1. M1 has two parents, B at the tip of main and F at the tip of fix, and only main moves to M1.
  code git switch main → git merge fix
  commit M1 on main merge fix [hash: 9a1c3e4, note: Merge fix]
  set main: M1 9a1c3e4

step Merge the work
  say Merging feature next creates M2, with M1 and D as parents. The fix and feature refs stay on their own commits.
  code git merge feature
  commit M2 on main merge feature [hash: 4e8f0b2, note: Merge feature]
  set main: M2 4e8f0b2

step The branches stay
  say A merge commit does not rewrite the branch commits, so their hashes stay the same and the branching shape stays in the history. That is the difference from rebasing into one line.
  code git log --graph --oneline
`,c=`// 8件の取引から組んだ Merkle 木で、取引3が含まれることを根まで辿って証明する。
// 前半の4段で葉から根まで組み上げ、後半の4段で取引3の値から隣の値を受けて根まで上る。
// 根は上の真ん中に、葉は下に並ぶ。値を持つ葉は箱に値を、下の札に名札を出す。
tree Merkle 木で取引を証明する

box ブロックの頭 [note: 根 e71c, color: green, icon: box]

strip 証明: 確かめる取引, 使った値, 出した根, 結果

step 取引ごとに値を出す
  say 8件の取引それぞれから値を出す。この値が木の葉になる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  leaf 取引3 [hash: c41d]
  leaf 取引4 [hash: e5f8]
  leaf 取引5 [hash: a90c]
  leaf 取引6 [hash: d72b]
  leaf 取引7 [hash: f1e7]
  leaf 取引8 [hash: 5c3e]

step 2つずつ組む
  say 隣どうしの値を2つずつつないで、もう1度値を出す。親が4つできる。
  node 1から2 of 取引1, 取引2 [hash: 7a21]
  node 3から4 of 取引3, 取引4 [hash: b9e4]
  node 5から6 of 取引5, 取引6 [hash: 4d0f]
  node 7から8 of 取引7, 取引8 [hash: 92c6]

step さらに2つを組む
  say 親の値も同じように2つずつ組む。親が2つになる。
  node 1から4 of 1から2, 3から4 [hash: 1e8b]
  node 5から8 of 5から6, 7から8 [hash: 6f53]

step 根ができる
  say 残った2つを組むと、全ての取引の値をまとめた根が1つできる。ブロックの頭にはこの根だけを記録する。
  node 根 of 1から4, 5から8 [hash: e71c]

step 取引3の値を出す
  say 取引3が含まれることを確かめる。まず取引3そのものから値 c41d を出す。
  set 確かめる取引: 取引3 [tag: c41d]

step e5f8と組む
  say 隣の値 e5f8 を受け取って c41d と組み、親の値 b9e4 を出す。ほかの取引は読まなくてよい。
  取引3 -> 3から4 [tag: c41d]
  取引4 -> 3から4 [tag: e5f8]
  set 使った値: e5f8

step 7a21と組む
  say 隣の値 7a21 を受け取って b9e4 と組み、さらに上の親の値 1e8b を出す。
  3から4 -> 1から4 [tag: b9e4]
  1から2 -> 1から4 [tag: 7a21]
  set 使った値: e5f8, 7a21

step 6f53と組んで根と照らす
  say 隣の値 6f53 と組むと根の値が出る。ブロックの頭に記録した e71c と一致するので、取引3は確かに含まれている。
  1から4 -> 根 [tag: 1e8b]
  5から8 -> 根 [tag: 6f53]
  ブロックの頭 -> 根: 照らす [tag: e71c]
  set 使った値: e5f8, 7a21, 6f53
  set 出した根: e71c
  set 結果: 一致
`,h=`// Prove that transaction 3 is in a Merkle tree built from 8 transactions, by climbing to the root.
// The first 4 steps build the tree from the leaves to the root. The last 4 climb from the value of transaction 3 with the neighbouring values.
// The root sits at the top center and the leaves below. A leaf with a value shows the value in its box and its id on the card below.
tree Proving a transaction with a Merkle tree

box header as Block header [note: root e71c, color: green, icon: box]

strip Proof: Transaction, Values used, Computed root, Result

step Hash each transaction
  say Compute a value from each of the 8 transactions. These values become the leaves.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  leaf tx3 [hash: c41d]
  leaf tx4 [hash: e5f8]
  leaf tx5 [hash: a90c]
  leaf tx6 [hash: d72b]
  leaf tx7 [hash: f1e7]
  leaf tx8 [hash: 5c3e]

step Pair them up
  say Join neighbouring values two at a time and hash again. Four parents appear.
  node 1to2 of tx1, tx2 [hash: 7a21]
  node 3to4 of tx3, tx4 [hash: b9e4]
  node 5to6 of tx5, tx6 [hash: 4d0f]
  node 7to8 of tx7, tx8 [hash: 92c6]

step Pair the parents
  say Pair the parent values the same way. Two parents remain.
  node 1to4 of 1to2, 3to4 [hash: 1e8b]
  node 5to8 of 5to6, 7to8 [hash: 6f53]

step The root appears
  say Joining the last two gives one root that sums up every transaction. The block header records only this root.
  node root of 1to4, 5to8 [hash: e71c]

step Hash transaction 3
  say To check that transaction 3 is included, first compute its value c41d from the transaction itself.
  set Transaction: tx3 [tag: c41d]

step Pair with e5f8
  say Take the neighbouring value e5f8, pair it with c41d and compute the parent value b9e4. The other transactions stay unread.
  tx3 -> 3to4 [tag: c41d]
  tx4 -> 3to4 [tag: e5f8]
  set Values used: e5f8

step Pair with 7a21
  say Take the neighbouring value 7a21, pair it with b9e4 and compute the next parent value 1e8b.
  3to4 -> 1to4 [tag: b9e4]
  1to2 -> 1to4 [tag: 7a21]
  set Values used: e5f8, 7a21

step Pair with 6f53 and compare
  say Pairing with 6f53 gives the root value. It matches the e71c recorded in the block header, so transaction 3 is included.
  1to4 -> root [tag: 1e8b]
  5to8 -> root [tag: 6f53]
  header -> root: Compare [tag: e71c]
  set Values used: e5f8, 7a21, 6f53
  set Computed root: e71c
  set Result: Match
`,d=`// ネット通販の注文 #1042 が受け付けられ、届いた後に返品されて返金で閉じるまでの状態。
// 最初の段より前の線は、移れるが今回は通らない取り消しの道。
state ネット通販の注文が届いて返金されるまでの状態

box 注文受付 [note: 番号を付ける, color: blue, icon: doc]
box 支払い待ち [note: 入金を待つ, color: amber, icon: clock]
box 支払い済み [note: 決済が通った, color: amber, icon: card]
box 発送準備 [note: 棚から出す, color: blue, icon: box]
box 発送済み [note: 業者が運ぶ, color: violet, icon: truck]
box 配達完了 [note: 受け取られた, color: green, icon: check]
box 返品の受付 [note: 検品を待つ, color: rose, icon: undo]
box 返金済み [note: 代金を戻す, color: rose, icon: yen]
box キャンセル [note: 払った分は返す, color: rose, icon: x]

strip 注文 #1042: 支払い, 在庫, 伝票番号, 経過

支払い待ち -> キャンセル
支払い済み -> キャンセル: 取り消す
発送準備 -> キャンセル
キャンセル -> finish

step 注文を受け付ける
  say カートの中身で注文を確定すると、注文受付から始まる。注文番号 #1042 が付き、ここから先の動きは全て記録に残る。
  start -> 注文受付: 注文を確定 [tag: #1042]
  set 支払い: まだ
  set 在庫: 未確保
  set 経過: 0 分

step 支払いを待つ
  say 決済へ進むと支払い待ちに移る。期限までに払われなければ、この状態から取り消しへ移る。
  注文受付 -> 支払い待ち: 決済へ進む [tag: #1042]
  set 経過: 2 分

step 支払いが確定する
  say 決済会社から入金の知らせが届き、支払い済みに移る。金額の 4,980 円が記録に入る。
  支払い待ち -> 支払い済み: 支払いを確定 [tag: #1042]
  set 支払い: 4,980 円
  set 経過: 5 分

step 在庫を確保する
  say 倉庫が在庫を引き当て、発送準備に移る。ここまでは取り消せて、取り消すと払った分を返す。
  支払い済み -> 発送準備: 在庫を確保 [tag: #1042]
  set 在庫: 確保した
  set 経過: 3 時間

step 発送する
  say 配送業者に渡して伝票番号を発行し、発送済みに移る。発送した後は取り消しの道が閉じる。
  発送準備 -> 発送済み: 伝票を発行 [tag: #1042]
  set 在庫: 出荷した
  set 伝票番号: 4821-0937
  set 経過: 1 日

step 届く
  say 配送業者が受け取りを記録すると、配達完了に移る。普通の注文はここで終わる。
  発送済み -> 配達完了: 配達を記録 [tag: #1042]
  set 経過: 2 日

step 返品を申し込む
  say 購入者が返品を申し込み、返品の受付に移る。届いてから決まった日数の間だけ選べる道。
  配達完了 -> 返品の受付: 返品を申請 [tag: #1042]
  set 経過: 6 日

step 戻った品を確かめる
  say 戻った商品を検品する。状態は返品の受付のまま変わらないので、同じ状態へ戻る矢印で表す。
  返品の受付 -> 返品の受付: 検品する [tag: #1042]
  note 返品の受付: 検品を通った
  set 在庫: 棚へ戻した
  set 経過: 9 日

step 返金する
  say 検品を通ったので返金を実行し、返金済みに移る。支払いの欄が返金した、に変わる。
  返品の受付 -> 返金済み: 返金を実行 [tag: #1042]
  note 返金済み: 全額を戻した
  set 支払い: 返金した
  set 経過: 10 日

step 注文を閉じる
  say 返金済みは終わりの状態で、ここから先へは移らない。注文は閉じ、通った道は記録として残る。
  返金済み -> finish: 注文を閉じる [tag: #1042]
`,l=`// The states of online order #1042, from the order to delivery, then a return and a refund that close it.
// The lines before the first step are the cancel path, which the order could take but does not this time.
state States of an online order from delivery to refund

box received as Received [note: Gets a number, color: blue, icon: doc]
box awaiting as Awaiting payment [note: Waits for funds, color: amber, icon: clock]
box paid as Paid [note: Payment cleared, color: amber, icon: card]
box packing as Packing [note: Off the shelf, color: blue, icon: box]
box shipped as Shipped [note: With the carrier, color: violet, icon: truck]
box delivered as Delivered [note: Handed over, color: green, icon: check]
box returning as Return requested [note: Awaiting the check, color: rose, icon: undo]
box refunded as Refunded [note: Money goes back, color: rose, icon: yen]
box cancelled as Cancelled [note: Payment returned, color: rose, icon: x]

strip Order #1042: Payment, Stock, Tracking no., Elapsed

awaiting -> cancelled
paid -> cancelled: Cancel
packing -> cancelled
cancelled -> finish

step Receive the order
  say Confirming the cart starts the order at Received. It gets the number #1042, and every later move is recorded.
  start -> received: Place order [tag: #1042]
  set Payment: not yet
  set Stock: not held
  set Elapsed: 0 min

step Wait for payment
  say Going to checkout moves the order to Awaiting payment. If it is not paid in time, it moves from here to Cancelled.
  received -> awaiting: Check out [tag: #1042]
  set Elapsed: 2 min

step Confirm the payment
  say The payment company reports the deposit, and the order moves to Paid. The amount of 4,980 yen is recorded.
  awaiting -> paid: Confirm payment [tag: #1042]
  set Payment: 4,980 yen
  set Elapsed: 5 min

step Hold the stock
  say The warehouse holds the stock, and the order moves to Packing. Up to here it can be cancelled, and the payment is returned.
  paid -> packing: Hold stock [tag: #1042]
  set Stock: held
  set Elapsed: 3 h

step Ship
  say The parcel goes to the carrier with a tracking number, and the order moves to Shipped. After shipping, the cancel path is closed.
  packing -> shipped: Issue label [tag: #1042]
  set Stock: shipped
  set Tracking no.: 4821-0937
  set Elapsed: 1 day

step Deliver
  say The carrier records the handover, and the order moves to Delivered. A normal order ends here.
  shipped -> delivered: Record delivery [tag: #1042]
  set Elapsed: 2 days

step Request a return
  say The buyer asks for a return, and the order moves to Return requested. This path is open only for a set number of days after delivery.
  delivered -> returning: Request return [tag: #1042]
  set Elapsed: 6 days

step Check the returned item
  say The returned item is inspected. The state stays Return requested, so the arrow goes back to the same state.
  returning -> returning: Inspect [tag: #1042]
  note returning: Passed the check
  set Stock: back on shelf
  set Elapsed: 9 days

step Refund
  say The item passed, so the refund runs and the order moves to Refunded. The payment field changes to refunded.
  returning -> refunded: Run refund [tag: #1042]
  note refunded: Fully returned
  set Payment: refunded
  set Elapsed: 10 days

step Close the order
  say Refunded is a final state, and the order moves nowhere after it. The order closes, and the path it took stays on record.
  refunded -> finish: Close order [tag: #1042]
`,p=`// 支払いと後から届く知らせの見本。お金は硬貨で運び、注文の状態を帯で追う
sequence カードで払い、後から知らせを受ける

box 客 [note: 払う人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: cart]
box 決済 as 決済サービス [note: カードを処理する, color: violet, icon: card]

strip 注文: 番号, 金額, 状態

step 注文する
  say 客が店のアプリで注文を確定する。
  客 -> 店: 注文する
  set 番号: #1024
  set 金額: 3200 円
  set 状態: 支払い待ち

step 払う
  say 客がカードで払う。お金は決済サービスへ動く。
  客 -> 決済: 3200 円 [carry: coin]
  set 状態: 処理中

step 受け付けを返す
  say 決済サービスは、受け付けたことだけを先に客へ返す。支払いが済んだかは、まだ店に届いていない。
  決済 -> 客: 受け付けた [side: below]

step 後から知らせる
  say 支払いが済むと、決済サービスが店のアプリへ webhook で知らせる。店はこの知らせで注文を確定する。
  決済 -> 店: 支払い済み [tag: webhook]
  set 状態: 支払い済み [tag: 確定]

step 受け取ったと返す
  say 店のアプリは知らせを受け取ったと 200 で返す。返さなければ、決済サービスは同じ知らせを送り直す。
  店 -> 決済: 200 OK [carry: none, side: below]
`,m=`// Payment and later notice example. Money moves as a coin, and the strip follows the order state
sequence Pay by card and get notified later

box customer as Customer [note: pays, color: slate, icon: user]
box shop as Shop app [note: takes orders, color: blue, icon: cart]
box pay as Payment service [note: processes cards, color: violet, icon: card]

strip Order: number, amount, state

step Order
  say The customer confirms the order in the shop app.
  customer -> shop: place order
  set number: #1024
  set amount: 32 USD
  set state: awaiting payment

step Pay
  say The customer pays by card. The money moves to the payment service.
  customer -> pay: 32 USD [carry: coin]
  set state: processing

step Acknowledge
  say The payment service first tells the customer only that it accepted the request. The shop does not know yet whether the payment went through.
  pay -> customer: accepted [side: below]

step Notify later
  say When the payment goes through, the payment service notifies the shop app by webhook. The shop confirms the order on this notice.
  pay -> shop: paid [tag: webhook]
  set state: paid [tag: confirmed]

step Confirm receipt
  say The shop app answers 200 to say it got the notice. Without it, the payment service sends the same notice again.
  shop -> pay: 200 OK [carry: none, side: below]
`,f=`// 作業の枝 feature を main の先端へ rebase し、main を早送りで進めて履歴を 1 本にするまで。
// 上の帯が main、下の帯が feature。commit は丸で、hash と一言を丸の外に添える。
// 当て直した C' と D' は main の帯に積み、枝の札は動かさない。HEAD は枝から離れた間だけ札で出す。
git 作業の枝を rebase して main へ取り込む

branch main [note: 取り込む先]
branch feature [note: 作業の枝]

box 作業ツリー [note: 手元のファイル, color: violet, icon: doc]

strip 参照: main, feature, HEAD, 履歴の形

step main にある
  say main に commit A と B がある。main は B を指し、HEAD は main を指している。手元で開いているのは B の中身。
  commit A on main [hash: 3fa0c19, note: 最初の形]
  commit B on main [hash: 8b04f71, note: 一覧を足す]
  set main: B 8b04f71
  set HEAD: main
  set 履歴の形: 一直線

step 枝を切る
  say B から作業の枝 feature を作って移る。feature も B を指し、HEAD は feature を指す。中身はまだ main と同じ。
  code git switch -c feature
  feature from B
  set feature: B 8b04f71
  set HEAD: feature

step 作業を積む
  say feature に C と D を積む。commit のたびに feature が新しい commit へ進み、HEAD も付いていく。main は B のまま。
  code git commit
  commit C on feature [hash: c41d0e5, note: 価格を丸める]
  commit D on feature [hash: d72b9a3, note: 送料を足す]
  set feature: D d72b9a3

step main が進む
  say その間に他の人の変更 E が main に入り、手元の main も取り込んで E を指す。feature は古い B から分かれたまま。
  commit E on main [hash: e5f8312, note: 税率を直す]
  set main: E e5f8312
  set 履歴の形: 枝分かれ

step rebase を始める
  say Git は分かれ目の B まで戻って C と D を控え、HEAD を E へ移す。HEAD は枝を通さず E を直接指す (切り離し)。ここから 1 つずつ当て直す。
  code git rebase main
  HEAD -> E: git rebase main
  set HEAD: E (切り離し)
  set 履歴の形: 当て直し中

step 衝突で止まる
  say C を E の上へ当て直すと、E も同じ行を変えていたので衝突する。rebase はそこで止まり、直すのを待つ。
  note 作業ツリー: src/price.ts で衝突
  set 履歴の形: 衝突で停止

step 直して続ける
  say 衝突した行を直して続けると、C と同じ変更を持つ C' ができる。親が B から E に変わったので hash も変わる。
  code git add → git rebase --continue
  note 作業ツリー: 直して git add した
  commit C' on main copy C [hash: a90c6b4, note: 価格を丸める]
  set HEAD: C' (切り離し)
  set 履歴の形: 当て直し中

step D を当て直す
  say D は衝突せず D' になる。当て終わると feature が D' へ移り、HEAD も feature に戻る。元の C と D はどこからも指されない。
  commit D' on main copy D [hash: f1e7d28, note: 送料を足す]
  feature -> D'
  set feature: D' f1e7d28
  set HEAD: feature
  set 履歴の形: 早送りできる

step 検査が通る
  say D' は E の変更も含んだ形になっている。この形で検査を回し、全て通ることを確かめてから取り込む。
  note 作業ツリー: D' で検査を回す
  note 作業ツリー: 型、単体、結合が通った

step main を早送り
  say main を D' まで進める。main の先に C' と D' が一直線に続くので、merge commit を作らず参照を動かすだけで済む。
  code git switch main → git merge --ff-only feature
  main -> D': git merge --ff-only feature
  set main: D' f1e7d28
  set HEAD: main
  set 履歴の形: 一直線

step 一直線の履歴
  say main の履歴を先端から辿ると D'、C'、E、B、A の 1 本になる。元の C と D は reflog に残るが、期限が過ぎると掃除される。
  code git log --oneline
`,u=`// Rebasing the work branch feature onto the tip of main, then fast-forwarding main into one straight history.
// The top lane is main and the lower lane is feature. Commits are circles, with the hash and a short note beside them.
// The replayed C' and D' sit on the main lane and do not move branch refs. HEAD shows as a tag only while it is detached.
git Rebase a work branch and bring it into main

branch main [note: Merge target]
branch feature [note: Work branch]

box worktree as Worktree [note: Local files, color: violet, icon: doc]

strip Refs: main, feature, HEAD, History

step On main
  say main has commits A and B. main points at B, and HEAD points at main. The files you have open are B's.
  commit A on main [hash: 3fa0c19, note: First shape]
  commit B on main [hash: 8b04f71, note: Add the list]
  set main: B 8b04f71
  set HEAD: main
  set History: Straight

step Cut a branch
  say Create the work branch feature from B and switch to it. feature also points at B, and HEAD points at feature. The files are still the same as main.
  code git switch -c feature
  feature from B
  set feature: B 8b04f71
  set HEAD: feature

step Commit work
  say Add C and D on feature. Each commit moves feature to the new commit, and HEAD follows. main stays at B.
  code git commit
  commit C on feature [hash: c41d0e5, note: Round prices]
  commit D on feature [hash: d72b9a3, note: Add shipping]
  set feature: D d72b9a3

step main moves on
  say Meanwhile someone else's change E lands on main, and the local main pulls it in and points at E. feature still branches off the old B.
  commit E on main [hash: e5f8312, note: Fix the tax rate]
  set main: E e5f8312
  set History: Branched

step Start the rebase
  say Git walks back to the fork point B, sets C and D aside, and moves HEAD to E. HEAD points at E directly, not through a branch (detached). From here it replays one commit at a time.
  code git rebase main
  HEAD -> E: git rebase main
  set HEAD: E (detached)
  set History: Replaying

step Stop on a conflict
  say Replaying C on top of E conflicts, because E changed the same lines. The rebase stops there and waits for a fix.
  note worktree: Conflict in src/price.ts
  set History: Stopped on a conflict

step Fix and continue
  say Fix the conflicting lines and continue, and C' appears with the same change as C. Its parent changed from B to E, so its hash changes too.
  code git add → git rebase --continue
  note worktree: Fixed and staged
  commit C' on main copy C [hash: a90c6b4, note: Round prices]
  set HEAD: C' (detached)
  set History: Replaying

step Replay D
  say D replays without a conflict and becomes D'. When the replay ends, feature moves to D' and HEAD returns to feature. The old C and D are no longer pointed at by anything.
  commit D' on main copy D [hash: f1e7d28, note: Add shipping]
  feature -> D'
  set feature: D' f1e7d28
  set HEAD: feature
  set History: Can fast-forward

step Checks pass
  say D' now includes the change in E. Run the checks on this shape and make sure they all pass before bringing it in.
  note worktree: Running checks on D'
  note worktree: Types, unit, integration pass

step Fast-forward main
  say Move main up to D'. C' and D' continue in a straight line after main, so no merge commit is needed; only the ref moves.
  code git switch main → git merge --ff-only feature
  main -> D': git merge --ff-only feature
  set main: D' f1e7d28
  set HEAD: main
  set History: Straight

step A straight history
  say Following main back from its tip gives one line: D', C', E, B, A. The old C and D stay in the reflog until they expire and are cleaned up.
  code git log --oneline
`,b=`// 失敗してやり直す見本。同じ線を 2 度引き、待つ処理と何回目かを箱の中と下に見せる
sequence 決済を頼み直す

box アプリ as 店のアプリ [note: 1 回目, color: blue, icon: app]
box 決済 as 決済 API [note: 混んでいる, color: violet, icon: card]

step 頼む
  say 店のアプリが決済 API に支払いを頼む。
  アプリ -> 決済: POST /charges

step 断られる
  say 決済 API が混んでいて、503 で断る。
  決済 -> アプリ: 503 混んでいる [side: below]

step 待つ
  say アプリはすぐに頼み直さず、1 秒待ってから 2 回目を送る。
  act アプリ: 1 秒待つ
  note アプリ: 2 回目

step 頼み直す
  say 同じ頼みをもう一度送る。決済 API の混み具合は落ち着いている。
  アプリ -> 決済: POST /charges
  note 決済: 空いている

step 通る
  say 2 回目は通り、決済 API が支払いの番号を 200 OK で返す。
  決済 -> アプリ: 200 OK [side: below]
`,y=`// Retry example. Draw the same line twice, and show the wait and the attempt count inside and under the box
sequence Retry the payment

box app as Shop app [note: attempt 1, color: blue, icon: app]
box pay as Payment API [note: busy, color: violet, icon: card]

step Ask
  say The shop app asks the payment API to charge the card.
  app -> pay: POST /charges

step Turned away
  say The payment API is busy and answers 503.
  pay -> app: 503 busy [side: below]

step Wait
  say The app does not retry at once. It waits one second before the second attempt.
  act app: wait 1 second
  note app: attempt 2

step Ask again
  say The app sends the same request again. The payment API has calmed down.
  app -> pay: POST /charges
  note pay: free

step Through
  say The second attempt goes through, and the payment API returns the payment ID with 200 OK.
  pay -> app: 200 OK [side: below]
`,g=`// ウォレットで署名して取引を送る見本。署名した取引を札で運び、段ごとに呼ぶ命令を見せる
sequence ウォレットで署名して送る

box dApp as 取引所の dApp [note: 取引を組む, color: blue, icon: app]
box ウォレット [note: 鍵を持つ, color: amber, icon: key]
box ノード as RPC ノード [note: 取引を受け付ける, color: slate, icon: server]
box チェーン as ブロックチェーン [note: 取引を記録する, color: green, icon: chain]

step 署名を頼む
  say dApp が送る取引を組み、ウォレットに署名と送信を頼む。
  code eth_sendTransaction
  dApp -> ウォレット: 取引を頼む

step 署名する
  say 利用者がウォレットの画面で中身を確かめて承認し、ウォレットが鍵で署名する。
  act ウォレット: 承認して署名する

step 送る
  say ウォレットが署名した取引を RPC ノードへ送る。
  code eth_sendRawTransaction
  ウォレット -> ノード: 署名した取引 [tag: 0x02f8…]

step 取り込まれる
  say ノードが取引をネットワークへ広め、取引がブロックに取り込まれる。
  ノード -> チェーン: 取引を広める

step 受領書を受け取る
  say dApp が取引の受領書を引き、成功したことを画面に出す。
  code eth_getTransactionReceipt
  dApp -> ノード: 受領書を引く
  ノード -> dApp: status 1 [side: below]
`,w=`// Wallet signing example. The signed transaction runs as a tag, and each step shows the call it makes
sequence Sign in the wallet and send

box dapp as Exchange dApp [note: builds the transaction, color: blue, icon: app]
box wallet as Wallet [note: holds the key, color: amber, icon: key]
box node as RPC node [note: accepts transactions, color: slate, icon: server]
box chain as Blockchain [note: records transactions, color: green, icon: chain]

step Ask to sign
  say The dApp builds the transaction and asks the wallet to sign and send it.
  code eth_sendTransaction
  dapp -> wallet: request transaction

step Sign
  say The user checks the details in the wallet and approves, and the wallet signs with its key.
  act wallet: approve and sign

step Send
  say The wallet sends the signed transaction to the RPC node.
  code eth_sendRawTransaction
  wallet -> node: signed transaction [tag: 0x02f8…]

step Included
  say The node spreads the transaction to the network, and a block includes it.
  node -> chain: broadcast

step Get the receipt
  say The dApp fetches the transaction receipt and shows that it succeeded.
  code eth_getTransactionReceipt
  dapp -> node: get receipt
  node -> dapp: status 1 [side: below]
`,v=`// L2 から L1 へ資産を引き出す時の 7 日の待ち。
// 目盛り 1 つが 1 日で、10 日分を並べる。L1 へ出した状態に誰でも異議を出せる 7 日を囲みで示し、
// 針が 7 日を進んでから L1 で受け取れる様子を追う。箱と拡大の帯を持たない、目盛りと節目だけの図。
time L2 から L1 へ引き出すまでの 7 日の待ち

scale 日 1d 10
row 提出 as L1 への提出 [color: blue]
point 申し込み at 0
point 受け取り at 8

strip 引き出しの進み: 経過, 異議を出せる残り, 引き出し

step 引き出しを申し込む
  say 利用者は L2 で引き出しの取引を出す。L2 の中では数秒で済むが、L1 で受け取るのはまだ先になる。
  note 申し込み: 申し込んだ [color: violet]
  set 経過: 0 日
  set 引き出し: 申し込んだ

step 状態を L1 へ出す
  say L2 は取引をまとめた状態を L1 へ出す。この提出から、誰でも異議を出せる 7 日が始まる。
  now -> 0
  note 申し込み: L1 に提出 [color: blue]
  set 経過: 1 日
  set 異議を出せる残り: 7 日

step 7 日待つ
  say 出した状態が誤っていれば、誰でも 7 日の間に不正の証明を出して取り消せる。異議が無ければ状態は確かになる。
  span 1-7: 異議を出せる 7 日 [shape: box, color: amber]
  now -> 7
  set 経過: 8 日
  set 異議を出せる残り: 0 日

step L1 で受け取る
  say 7 日の間に異議が出なかったので、利用者は L1 で引き出しを確かめて資産を受け取る。
  申し込み -> 受け取り: 引き出す [carry: coin]
  note 受け取り: 受け取った [color: green]
  now -> 8
  set 経過: 9 日
  set 引き出し: 受け取った
`,x=`// The 7-day wait when withdrawing assets from L2 to L1.
// One unit is one day, and the axis shows 10 days. A box marks the 7 days in which anyone can dispute the state sent to L1,
// and the needle moves through those 7 days before the assets can be received on L1. A diagram of the axis and points only, with no boxes or zoom band.
time The 7-day wait to withdraw from L2 to L1

scale day 1d 10
row batch as Posted to L1 [color: blue]
point request at 0
point receive at 8

strip Withdrawal: Elapsed, Dispute days left, Withdrawal

step Request the withdrawal
  say The user sends a withdrawal on L2. It takes seconds inside L2, but receiving it on L1 is still a while away.
  note request: Requested [color: violet]
  set Elapsed: 0 d
  set Withdrawal: Requested

step Post the state to L1
  say L2 posts the state that bundles the transactions to L1. From this post, anyone has 7 days to dispute it.
  now -> 0
  note request: Posted to L1 [color: blue]
  set Elapsed: 1 d
  set Dispute days left: 7 d

step Wait 7 days
  say If the posted state is wrong, anyone can submit a fraud proof within the 7 days and cancel it. With no dispute the state becomes settled.
  span 1-7: 7 days to dispute [shape: box, color: amber]
  now -> 7
  set Elapsed: 8 d
  set Dispute days left: 0 d

step Receive on L1
  say No dispute came in the 7 days, so the user proves the withdrawal on L1 and receives the assets.
  request -> receive: withdraw [carry: coin]
  note receive: Received [color: green]
  now -> 8
  set Elapsed: 9 d
  set Withdrawal: Received
`,C={api:{ja:e,en:n},retry:{ja:b,en:y},payment:{ja:p,en:m},wallet:{ja:g,en:w},order:{ja:d,en:l},rebase:{ja:f,en:u},merge:{ja:i,en:r},finality:{ja:a,en:s},withdraw:{ja:v,en:x},merkle:{ja:c,en:h},auction:{ja:t,en:o}};export{C as LATER_EXAMPLES};
