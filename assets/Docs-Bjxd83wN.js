import{bb as v,bs as g,bj as e,bO as _,bg as T,bk as c,bl as m,bt as S,bB as j,bP as A}from"./index-Bhjjk-iu.js";const C=`sequence 注文を受ける

box 客 [note: 注文する人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 台帳 [note: 注文を残す, color: green, icon: db]

step 注文を送る
  say 客が店のアプリに注文を送り、店のアプリが台帳に残す。
  客 -> 店: 注文する
  店 -> 台帳: 残す
`,E=`sequence Take an order

box customer as Customer [note: places the order, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]
box ledger as Ledger [note: keeps the order, color: green, icon: db]

step Send the order
  say The customer sends an order to the shop app, and the shop app keeps it in the ledger.
  customer -> shop: place order
  shop -> ledger: keep
`,N=`sequence 運ばれる物を見分ける

box 客 [note: 払う人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 決済 [note: 代金を受け取る, color: violet, icon: card]

step 注文する
  say 客が店のアプリに注文を送る。
  客 -> 店: 注文する

step 払う
  say 店のアプリが注文の番号を付けて決済に回し、客が代金を払う。
  店 -> 決済: 支払いを頼む [tag: #42]
  客 -> 決済: 1200 円 [carry: coin]

step 知らせる
  say 決済が、払われたことを店のアプリに知らせる。
  決済 -> 店: 払われた [carry: none]
`,D=`sequence Tell what travels

box customer as Customer [note: pays, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]
box payment as Payment [note: takes the money, color: violet, icon: card]

step Place the order
  say The customer sends an order to the shop app.
  customer -> shop: place order

step Pay
  say The shop app passes the order number to the payment service, and the customer pays.
  shop -> payment: ask to pay [tag: #42]
  customer -> payment: 1200 yen [carry: coin]

step Tell the shop
  say The payment service tells the shop app that the order is paid.
  payment -> shop: paid [carry: none]
`,$=`chart 1週間の作業時間の割合 [shape: donut]

item build as 作る [color: blue]
item review as 見直す [color: green]
item meet as 話し合う [color: amber]

step 先週
  say 作る時間が半分を占める。
  set build: 20
  set review: 8
  set meet: 12

step 今週
  say 話し合う時間を減らし、見直す時間を増やした。
  set review: 14
  set meet: 6
`,O=`chart Share of work hours in a week [shape: donut]

item build as Build [color: blue]
item review as Review [color: green]
item meet as Meet [color: amber]

step Last week
  say Building takes half of the hours.
  set build: 20
  set review: 8
  set meet: 12

step This week
  say Less time in meetings, more time reviewing.
  set review: 14
  set meet: 6
`,P=`cycle 週の振り返り

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
`,W=`cycle The weekly review

box plan as Decide [note: start of week, color: blue]
box work as Do [note: every day, color: green]
box look as Look back [note: end of week, color: amber]

strip Week: round, day

step Decide
  say At the start of the week, decide what to do that week.
  set round: Week 1
  set day: Monday

step Do
  say Work on what was decided each day.
  plan -> work [tag: tasks]
  set day: Tuesday to Thursday

step Look back
  say At the end of the week, look back on what got done and what is left.
  work -> look [tag: progress]
  set day: Friday

step On to the next week
  say Take what is left back to deciding the next week.
  look -> plan [tag: left]
  set round: Week 2
  set day: Monday
`,q=`sequence 在庫を確かめる

box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 倉庫 [note: 在庫を持つ, color: amber, icon: box]

step 在庫を聞く
  say 店のアプリが倉庫に在庫を聞き、倉庫は棚を数えてから答える。
  店 -> 倉庫: 在庫はあるか
  act 倉庫: 棚を数える
  倉庫 -> 店: 3 個ある
`,H=`sequence Check the stock

box shop as Shop app [note: takes the order, color: blue, icon: app]
box warehouse as Warehouse [note: holds the stock, color: amber, icon: box]

step Ask for stock
  say The shop app asks the warehouse for stock, and the warehouse counts the shelf before it answers.
  shop -> warehouse: in stock?
  act warehouse: count the shelf
  warehouse -> shop: 3 left
`,I=`er 注文から客を引く

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
`,F=`er Look up the customer of an order

table users as Customers
  field id: U-7 [key]
  field name: Tanaka
  field orders: 2

table orders as Orders
  field id: O-41 [key]
  field user_id: U-7 [ref: users.id]
  field amount: $12

step Look up the order
  say Look up the row of order O-41.
  pick orders.id

step Follow the customer
  say Follow the user_id along the link and look up Tanaka, customer U-7.
  orders.user_id -> users.id [tag: U-7]
  pick users.id

step Count the order
  say Add one to the orders Tanaka has.
  note users.orders: 2 + 1 = 3
  set users.orders: 3
  pick users.orders
`,L=`architecture 足したブロックでBridgeを描く

blocks 1
block +bridge
  base box
  color violet
  icon tabler:building-bridge-2
end
block +relay
  base edge
  shape dashed
  color amber
end
block +key
  base icon
  shape path "M -8 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 0 0 h 8 M 5 0 v 3"
end

box eth as Ethereum [note: 送る側のチェーン]
+bridge cc as Bridge [note: チェーンをまたいで渡す]
box base as Base [note: 受け取る側のチェーン, icon: +key]

step 送る
  say EthereumがトークンをBridgeへ送る。Bridgeの箱は、足した箱の定義に書いた色と石の橋の絵柄で描かれる。
  eth -> cc: 送る

step 渡す
  say BridgeがBaseへトークンを渡す。破線は足した線の定義で、受け取る側の鍵の印は足した印の定義で描かれる。
  cc +relay base: 渡す
`,U=`architecture Draw a bridge with added blocks

blocks 1
block +bridge
  base box
  color violet
  icon tabler:building-bridge-2
end
block +relay
  base edge
  shape dashed
  color amber
end
block +key
  base icon
  shape path "M -8 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 0 0 h 8 M 5 0 v 3"
end

box eth as Ethereum [note: sending chain]
+bridge cc as Bridge [note: carries tokens across chains]
box base as Base [note: receiving chain, icon: +key]

step Send
  say Ethereum sends the token to the bridge. The bridge box is drawn in the color and stone bridge icon its definition gives.
  eth -> cc: send

step Hand over
  say The bridge hands the token to Base. The dashed line comes from the added line, and the key on the receiving side from the added icon.
  cc +relay base: hand over
`,M=`flow 申し込みの受け付け

box form as 申し込みを受ける
choice ok as 書けている？
box send as 受け付ける [color: green]
box back as 書き直してもらう [color: rose]

ok -> back: いいえ

step 受ける
  say 申し込みが届いて手順が始まる。
  start -> form

step 確かめる
  say 書けているかを判断する。最初の段より前の線は点線の通らない道で、判断の右へ出る。
  form -> ok: 調べる

step 受け付ける
  say 書けていたので、はいの道を下へ進んで受け付ける。
  ok -> send: はい
  send -> finish
`,B=`flow Taking an application

box form as Receive the form
choice ok as Filled in?
box send as Accept [color: green]
box back as Ask for a fix [color: rose]

ok -> back: No

step Receive
  say An application arrives and the procedure starts.
  start -> form

step Check
  say A choice decides whether it is filled in. The line before the first step is a dotted path not taken, leaving to the right.
  form -> ok: Check

step Accept
  say It is filled in, so the yes path goes down and the application is accepted.
  ok -> send: Yes
  send -> finish
`,J=`git fix は merge commit で、feature は当て直して取り込む

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
`,R=`git Merge fix with a merge commit and replay feature

branch main [note: Target]
branch feature [note: Work branch]
branch fix [note: Fix branch]

step Cut branches
  say Cut fix and feature from A on main, and add a commit to each.
  commit A on main [hash: 3fa0c19, note: First shape]
  fix from A
  commit F on fix [hash: 9b2e4d1, note: Fix a typo]
  feature from A
  commit C on feature [hash: c41d0e5, note: Add search]

step Merge commit
  say Merge fix into main with merge commit M. M has two parents, A and F.
  commit M on main merge fix [hash: 7d3a5e2, note: Merge fix]

step Replay
  say Move HEAD to M to detach it, and copy C onto M as C'.
  HEAD -> M
  commit C' on main copy C [hash: a90c6b4, note: Add search]

step Fast-forward
  say Move feature to C', and move main up to C' too. The old C can no longer be reached from any branch.
  feature -> C'
  main -> C'
`,G=`{
  "version": 2,
  "kind": "sequence",
  "title": "Ask to sign in",
  "blocks": {
    "box": [
      {
        "id": "browser",
        "name": "User's browser",
        "sub": "operated by the user"
      },
      {
        "id": "app",
        "name": "App",
        "sub": "asks for sign-in"
      }
    ]
  },
  "steps": [
    {
      "title": "Press sign in",
      "body": "The user presses the app's sign-in button.",
      "events": [
        {
          "type": "edge",
          "from": "browser",
          "to": "app",
          "label": "GET /login",
          "carry": {
            "kind": "envelope"
          }
        }
      ]
    }
  ]
}
`,z=`{
  "version": 2,
  "kind": "sequence",
  "title": "ログインを頼む",
  "blocks": {
    "box": [
      {
        "id": "ブラウザ",
        "name": "利用者のブラウザ",
        "sub": "利用者が操作する"
      },
      {
        "id": "アプリ",
        "name": "アプリ",
        "sub": "ログインを頼む側"
      }
    ]
  },
  "steps": [
    {
      "title": "ログインを押す",
      "body": "利用者がアプリのログインを押す。",
      "events": [
        {
          "type": "edge",
          "from": "ブラウザ",
          "to": "アプリ",
          "label": "GET /login",
          "carry": {
            "kind": "envelope"
          }
        }
      ]
    }
  ]
}
`,V=`architecture 注文を残す

box 画面 as 利用者の画面 [note: 注文を送る, color: blue, icon: app]
box 店 as 店のサーバー [note: 注文を受ける, color: amber, icon: server]
box 帳簿 [note: 注文を残す, color: green, icon: db]

step 注文を送る
  say 利用者の画面が店のサーバーへ注文を送る。
  画面 -> 店: 注文

step 帳簿に書く
  say 店のサーバーが注文を帳簿に書く。
  店 -> 帳簿: 書く
`,K=`architecture Keep the order

box screen as User's screen [note: sends the order, color: blue, icon: app]
box shop as Shop server [note: takes the order, color: amber, icon: server]
box ledger as Ledger [note: keeps the order, color: green, icon: db]

step Send the order
  say The user's screen sends the order to the shop server.
  screen -> shop: order

step Write it down
  say The shop server writes the order in the ledger.
  shop -> ledger: write
`,Y=`lineup 保存の頼みが置き場に届くまで [shape: layers]

box browser as 画面 (ブラウザ) [note: 押した保存を頼みにして送る, color: blue]
box api as サーバー (API) [note: ログインと中身を確かめる, color: amber]
box db as データの置き場 (DB) [note: 行を書いて控える, color: green]

item 頼み [color: blue, note: POST /notes]

step 画面で保存を押す
  say 保存を押すと、ブラウザが中身を頼みにして送る。
  line browser: 頼み
  note browser: 頼みを作った

step サーバーが確かめる
  say 頼みはサーバーへ下り、ログインと中身の形を確かめる。
  line api: 頼み
  note api: 80ミリ秒で確かめた

step 置き場に書く
  say 確かめた頼みはデータの置き場へ下り、メモの行として書かれる。
  line db: 頼み
  note db: 30ミリ秒で書いた
`,X=`lineup A save request on its way to the store [shape: layers]

box browser as Page (browser) [note: Turns the save tap into a request, color: blue]
box api as Server (API) [note: Checks the login and the content, color: amber]
box db as Data store (DB) [note: Writes the row and keeps it, color: green]

item Request [color: blue, note: POST /notes]

step Tap save on the page
  say Tapping save makes the browser send the content as a request.
  line browser: Request
  note browser: Made the request

step The server checks it
  say The request steps down to the server, which checks the login and the form of the note.
  line api: Request
  note api: Checked in 80 ms

step Write it to the store
  say The checked request steps down to the data store and is written as a row of notes.
  line db: Request
  note db: Written in 30 ms
`,Q=`matrix 店の新しいメニューを分ける

axis 手間 [from: 小さい, to: 大きい]
axis 売れ行き [from: 小さい, to: 大きい]

box now as すぐ出す
box plan as 仕込みを決める
box spare as 手が空いたら
box drop as 見送る

item tea as 季節のお茶
item cake as 焼きたてのケーキ
item soda as 果物のソーダ
item curry as 煮込みのカレー

step 並べる
  say 出したいメニューを左に並べる。

step すぐ出す
  say 手間が小さく売れそうなメニューは、すぐ出す。
  line now: tea

step 残りを分ける
  say 残りのメニューも手間と売れ行きで分ける。
  line plan: cake
  line spare: soda
  line drop: curry
`,Z=`matrix Sort the new menu of a shop

axis Effort [from: low, to: high]
axis Sales [from: low, to: high]

box now as Serve now
box plan as Plan the prep
box spare as When free
box drop as Skip

item tea as Seasonal tea
item cake as Fresh-baked cake
item soda as Fruit soda
item curry as Slow-cooked curry

step Line up
  say Line up the dishes to add on the left.

step Serve now
  say Dishes that are easy to make and likely to sell go on the menu now.
  line now: tea

step The rest
  say Sort the other dishes by effort and sales too.
  line plan: cake
  line spare: soda
  line drop: curry
`,ee=`mind 店の新しいメニュー

step 題を置く
  say 考える題を真ん中に置く。
  idea menu as 新しいメニュー

step 飲み物の枝
  say 飲み物の案を枝に出し、案を葉に書き出す。
  idea drink as 飲み物 of menu [color: blue]
  idea tea as 季節のお茶 of drink
  idea soda as 果物のソーダ of drink

step 食べ物の枝
  say 食べ物の案も同じく枝と葉にする。
  idea food as 食べ物 of menu
  idea toast as 厚切りのトースト of food
  idea cake as 焼きたてのケーキ of food
`,te=`mind A new menu for the cafe

step Put the title
  say Put the topic to think about in the middle.
  idea menu as New menu

step Drinks branch
  say Put drink ideas on a branch and list them as leaves.
  idea drink as Drinks of menu [color: blue]
  idea tea as Seasonal tea of drink
  idea soda as Fruit soda of drink

step Food branch
  say Do the same for food.
  idea food as Food of menu
  idea toast as Thick toast of food
  idea cake as Fresh-baked cake of food
`,ne=`pipe 1 ETHをUSDCに替える

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
`,ae=`pipe Swap 1 ETH for USDC

box alice as Alice
box ex as Exchange
box old as OldPool
box pool as Pool
box usdc as USDC

hold alice: 1 ETH, 0 USDC
hold ex: 0 ETH
hold pool: 5000 USDC
hold ex: "swaps[alice]" 0

step Alice asks Exchange with 1 ETH attached
  say ETH attached to a call moves into the callee's tank as the call is made.
  alice -> ex: swap [value: 1 ETH]

step The old pool is closed
  say The check fails, and every change up to it rolls back.
  ex -> old: swap
  check old: open == true [fail]
  revert old: closed

step Read the pool price
  say A call that cannot write reads only the price.
  ex -> pool: price [call: static]
  return pool: 3200

step Hand the swap to the pool
  say The inner steps fold into one box, which opens when pressed.
  ex -> pool: swap [fold]

step Work out the amount to pay
  say Work out how much USDC 1 ETH is worth at the current price.
  calc pool: 1 ETH -> 3200 USDC

step USDC moves to Alice
  say USDC takes the amount from the pool's balance and adds it to Alice's.
  pool -> usdc: transfer
  move usdc: 3200 pool -> alice
  emit usdc: Transfer(pool, alice, 3200)
  return usdc: true

step The pool returns the amount it paid
  say Even after the inner call returns, the changes stay provisional.
  return pool: 3200 USDC

step The swap ends
  say Exchange writes its record and returns, and every change becomes final here.
  gist Every change becomes final when the outermost call returns
  write ex: "swaps[alice]" 1
  emit ex: Swapped(alice, 3200)
  return ex: 3200 USDC
`,oe=`architecture 店と倉庫をつなぐ

group 店側 as 店 [note: 注文を受ける側, color: blue, icon: cart]
  box 受付 [note: 注文を受ける, icon: app]
  box 会計 [note: 代金を受け取る, icon: card]
end

group 倉庫側 as 倉庫 [note: 品物を送る側, color: green, icon: box]
  box 出荷 [note: 品物を送る, icon: truck]
end

step 代金を頼む
  say 受付が注文を受け、会計に代金を頼む。
  受付 -> 会計: 代金を頼む

step 出荷に回す
  say 代金が払われたら、会計が出荷に回す。
  会計 -> 出荷: 送ってよい
`,se=`architecture Connect the shop and the warehouse

group shopSide as Shop [note: takes orders, color: blue, icon: cart]
  box desk as Order desk [note: takes the order, icon: app]
  box till as Till [note: takes the payment, icon: card]
end

group warehouseSide as Warehouse [note: sends goods, color: green, icon: box]
  box shipping as Shipping [note: sends the goods, icon: truck]
end

step Ask for payment
  say The order desk takes the order and asks the till for the payment.
  desk -> till: ask for payment

step Pass to shipping
  say Once the payment is in, the till passes the order to shipping.
  till -> shipping: ready to send
`,ie=`architecture 注文を倉庫へ回す

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
`,re=`architecture Pass orders to the warehouse

group shopSide as Shop [note: takes orders, color: blue, icon: cart]
  box desk as Order desk [note: takes the order, icon: app]
end

group warehouseSide as Warehouse [note: sends goods, color: green, icon: box]
  box shipping as Shipping [note: sends the goods, icon: truck]
end

step Pass to shipping
  say
    The order desk passes two order numbers to shipping at once.
    Shipping sends the goods in the order the numbers arrived.
  desk -> shipping: ready to send [tag: "#42, #43"]
`,he=`sankey お小遣いの使い道

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
`,de=`sankey Where the pocket money goes

box pay as Pocket money 10,000 yen [color: slate]
box food as Food [color: amber]
box save as Savings [color: green]
box fun as Fun [color: rose]

step Get it
  say A month of pocket money is 10,000 yen.

step Food
  say Half of it, 5,000 yen, goes to food.
  pay -> food: 5,000 yen

step The rest
  say Save 3,000 yen and spend 2,000 yen on fun.
  pay -> save: 3,000 yen
  pay -> fun: 2,000 yen
`,le=`sequence

ブラウザ -> アプリ: ログインを押す
アプリ -> 認可: 認可の頁へ送る
認可 -> ブラウザ: ログインの頁を返す
`,ce=`sequence

browser -> app: Press sign in
app -> auth: Send to the sign-in page
auth -> browser: Return the sign-in page
`,pe=`sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する]
box アプリ [note: ログインを頼む側]

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
`,me=`sequence Ask to sign in

box browser as User's browser [note: operated by the user]
box app as App [note: asks for sign-in]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
`,ue=`state 注文が届くまでの状態

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
`,ge=`state States of an order until it arrives

box awaiting as Awaiting payment [note: Waits for funds, color: amber, icon: clock]
box shipped as Shipped [note: With the carrier, color: violet, icon: truck]
box delivered as Delivered [note: Handed over, color: green, icon: check]
box cancelled as Cancelled [note: Payment returned, color: rose, icon: x]

awaiting -> cancelled: Cancel
cancelled -> finish

step Place the order
  say Confirming the order starts it at Awaiting payment.
  start -> awaiting: Place order [tag: #1042]

step Ship
  say Once the payment clears, the goods go out and the order moves to Shipped.
  awaiting -> shipped: Ship [tag: #1042]

step Arrive
  say The goods arrive, the order moves to Delivered, and it closes.
  shipped -> delivered: Receive [tag: #1042]
  delivered -> finish: Close the order [tag: #1042]
`,be=`sequence 代金を払う

box 客 [note: 払う人, color: slate, icon: user]
box 決済 [note: 代金を受け取る, color: violet, icon: card]

step 支払いを頼む
  say
    客がカードで 1200 円を払う。
    決済はカードの持ち主を確かめてから受け取る。
  code pay(1200)
  客 -> 決済: 1200 円払う
  act 決済: 持ち主を確かめる

step 受け取る
  say 決済が代金を受け取り、受け取ったと記す。
  note 決済: 受け取った
`,fe=`sequence Pay for the order

box customer as Customer [note: pays, color: slate, icon: user]
box payment as Payment [note: takes the money, color: violet, icon: card]

step Ask to pay
  say
    The customer pays 1200 yen by card.
    The payment service checks the card holder before it takes the money.
  code pay(1200)
  customer -> payment: pay 1200 yen
  act payment: check the card holder

step Take the money
  say The payment service takes the money and marks it as received.
  note payment: received
`,we=`sequence 注文の状態を追う

box 客 [note: 注文する人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]

strip 注文: 番号, 状態

step 注文する
  say 客が注文を送り、店のアプリが番号を振る。
  客 -> 店: 注文する
  set 番号: 42
  set 状態: 受付

step 送る
  say 店のアプリが品物を送り、注文を送った状態にする。
  店 -> 客: 品物を送る
  set 状態 [tag: 送った]
`,xe=`sequence Follow the order

box customer as Customer [note: places the order, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]

strip Order: number, state

step Place the order
  say The customer sends an order, and the shop app gives it a number.
  customer -> shop: place order
  set number: 42
  set state: received

step Send the goods
  say The shop app sends the goods and marks the order as sent.
  shop -> customer: send the goods
  set state [tag: sent]
`,ye=`time ブロックが確定して戻せなくなるまで

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
`,ke=`time How a block becomes final

scale slot 12s 64
period epoch 32
row block [color: blue, empty: 5]
point C0 at 0
point C1 at 32
zoom 0-1

box proposer [color: blue, icon: user]
box block [color: blue, icon: box]

strip Finality: Elapsed, Votes this epoch [meter: 2/3]

step Propose blocks
  say In each slot one proposer is chosen and proposes one block. The top band zooms in on the first 2 slots.
  proposer -> block [at: 0]
  proposer -> block [at: 1]
  now -> 1
  set Elapsed: 24 s

step Collect one epoch of votes
  say 32 slots make one epoch. A block mark appears on each slot the needle passes, and a slot whose proposer did not answer gets an empty mark.
  note C0: Proposed [color: blue]
  span 0-31: 1 epoch = 6.4 min [color: slate]
  now -> 31
  set Elapsed: 6 min 24 s
  set Votes this epoch: 97%

step Move to the next epoch
  say Votes for C0 passed 2/3 of the total, so C0 is justified. In the next epoch, votes gather on C1.
  note C0: Justified [color: violet]
  note C1: Proposed [color: blue]
  now -> 63
  set Elapsed: 12 min 48 s
  set Votes this epoch: 97%

step C0 becomes final
  say Once C1 is justified too, the earlier of the two justified in a row, C0, becomes final. A final block cannot be undone.
  C0 -> C1: over 2/3 [carry: none]
  note C1: Justified [color: violet]
  note C0: Final [color: green]
  mark block 0-31 [color: green]
  span 0-31: Final, cannot be undone [shape: box, color: rose]
`,ve=`tree 取引が含まれることを確かめる

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
`,_e=`tree Proving a transaction is included

step Hash each transaction
  say Compute a value from each of the 4 transactions. These values become the leaves.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  leaf tx3 [hash: c41d]
  leaf tx4 [hash: e5f8]

step Pair them up
  say Join neighbouring values two at a time and hash again. Two parents appear.
  node 1to2 of tx1, tx2 [hash: 7a21]
  node 3to4 of tx3, tx4 [hash: b9e4]

step The root appears
  say Joining the last two gives one root that sums up every transaction.
  node root of 1to2, 3to4 [hash: e71c]

step Climb from tx3 to the root
  say Take the neighbouring value at each level and climb. The root comes out without reading tx1 or tx2.
  tx3 -> 3to4 [tag: c41d]
  tx4 -> 3to4 [tag: e5f8]
  3to4 -> root [tag: b9e4]
  1to2 -> root [tag: 7a21]
`,Te=`try トランザクションがブロックに入るまで

route ノードの網: あなた - node-1 - 作る人, あなた - node-2 - node-3 - 作る人 [from: あなた, to: 作る人]
queue メモリプール [order: 手数料]
chain 機械の列 [edit: 量]
ask 送り手, 宛先, 量, 手数料 [into: メモリプール, via: ノードの網]
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
`,Se=`try How a transaction gets into a block

route Network: You - node-1 - Builder, You - node-2 - node-3 - Builder [from: You, to: Builder]
queue Mempool [order: Fee]
chain Chain [edit: Amount]
ask Sender, To, Amount, Fee [into: Mempool, via: Network]
press Build [from: Mempool, into: Chain, take: 2]

item tx1 [To: Carol, Amount: 3, Fee: 7]
item tx2 [To: Dave, Amount: 5, Fee: 5]
item tx3 [To: Erin, Amount: 2, Fee: 4]

step Transactions wait in line
  say Transactions in the mempool line up from the highest fee.
  line Chain: tx1
  line Mempool: tx2, tx3

step You send one
  say Your transaction crosses the network to the builder.
  ask You, Bob, 5, 12

step The builder makes a block
  say The two highest fees go into block 2, which holds block 1's hash as prev.
  press Build
`,je=`venn 朝と夜に走る人

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
`,Ae=`venn People who run in the morning and at night

item morning as Run in the morning
item night as Run at night

step Morning
  say 30 people run in the morning.
  set morning: 30

step Night and both
  say 20 people run at night, and 5 of them also run in the morning.
  set night: 20
  set morning & night: 5

step Neither
  say 12 people run at neither time.
  set none: 12
`,Ce={section:"steps",ja:["`act <名札>: <処理の名前>` は、線を引かずに箱の中で行う処理を表す。受け取った物を確かめる、数を数える、のような箱の中だけで済む動きに使う。"],en:["`act <id>: <action>` is something a box does inside itself, without drawing a line. Use it for work that stays inside the box, such as checking what arrived or counting."]},Ee={none:"使い方の頁の試す図の節は部品をまたぐ段落だけで、入力の帯だけの段落が無い"},Ne={section:"matrix",ja:["2つの物差しで課題を4つの区画に分ける時は、最初の行を `matrix <題>` にする。最初の `step` より前に `axis <名前> [from: <小さい側>, to: <大きい側>]` を横の軸、縦の軸の順に 2 行書く。横の軸は区画の下を左から右へ、縦の軸は区画の左を下から上へ矢印で引き、軸の名前と両端の字を軸の外に出す。","区画は `box <名札> as <名前>` でちょうど 4 つ書き、書いた順に左上、右上、左下、右下に置いて、区画の左上に名前を出す。`[note: <字>]` を書くと名前の下に小さな字を出し、区画の色は置き場所で決まるので、ほかの属性は書けない。軸が 2 本でないか区画が 4 つでない図は、どの行が多いか足りないかを示して断る。線と中身の帯の行は書けない。"],en:["To sort items into four areas by two measures, start the first line with `matrix <title>`. Before the first `step`, write `axis <name> [from: <low end>, to: <high end>]` twice, the horizontal axis first and then the vertical one. The horizontal arrow runs below the areas from left to right and the vertical arrow left of them from bottom to top, with the axis name and both ends outside the axis.","Write exactly four areas as `box <id> as <name>`; they go top left, top right, bottom left and bottom right in written order, with the name at the top left of each area. `[note: <text>]` shows a small line under the name; an area's color comes from its spot, so it takes no other attribute. A matrix without exactly two axes or four areas is refused, naming the line that is extra or the spot that is short. Line and strip lines are not allowed."]},De={section:"sankey",ja:["1 つの量がどこへどれだけ分かれるかを段ごとに見せる時は、最初の行を `sankey <題>` にする。出どころと行き先は最初の `step` の行より前に `box <名札> as <名前>` の行で宣言する。入る線の無い箱が左の列に並び、行き先は出どころの右の列に並ぶ。`[color: <色>]` は棒と、その箱へ入る帯の色になる。","段の中の `<出どころ> -> <行き先>: <量>` の行で、その段で出どころの棒から行き先の棒へ帯が伸び、量の札が帯を渡る。線の名前の初めの数が量で、`40%` は 40、`1,200円` は 1200 と読む。帯の幅は出どころの棒のうちその量が占める割合の分になり、出どころの棒の上から書いた順に積む。","出どころの無い箱の量は出る量の和で、行き先の量は入る量の和になる。線の名前が数で始まらない線、流れを辿ると元の箱へ戻る線、入る量より出る量の和が大きい箱は誤りで止まる。1 つの図の量は同じ単位で書く。"],en:["To show, step by step, where one amount goes and how much goes to each place, start the first line with `sankey <title>`. Declare the sources and targets with `box <id> as <name>` lines before the first `step` line. Boxes no line goes into sit in the left column, and each target sits in a column to the right of its source. `[color: <color>]` sets the color of the bar and of the bands going into that box.","A `<source> -> <target>: <amount>` line in a step grows a band from the source bar to the target bar in that step, and an amount chip travels along it. The number at the start of the label is the amount: `40%` reads as 40 and `1,200` as 1200. A band takes the share of the source bar that its amount makes up, and the bands stack down the source bar in the order written.","A box with no source holds the sum of what leaves it, and a target holds the sum of what comes in. A label that does not start with a number, a line whose flow leads back to a box it came from, and a box sending out more than comes in are refused. Write every amount in one diagram in the same unit."]},$e={section:"boxes",ja:["箱は `box <名札> as <名前> [note: <下の字>]` で宣言する。名札は線や処理で箱を指す時の呼び名で、図には名前と下の字が出る。`as <名前>` を省くと、名札がそのまま名前になる。",'`[ ]` の中に `color: <色>` を足すと箱の色の役が、`icon: <印>` を足すと名前の横の印が付き、2 つ以上は `,` で区切る。色は `blue` や `green` のような色の役の名前で、印は `user` や `db` のような名前で選ぶ。名前に `[` を、値に `,` か `]` を含める時は `"` で囲む。'],en:["Declare a box with `box <id> as <name> [note: <caption>]`. The id is how lines and actions point at the box, and the name and caption are what the diagram shows. Without `as <name>`, the id is the name.",'Inside the `[ ]`, add `color: <color>` to give the box a colour role and `icon: <icon>` to put an icon next to its name, separating two or more with `,`. Colours are role names such as `blue` or `green`, and icons are names such as `user` or `db`. Wrap a name in `"` when it contains `[`, and a value when it contains `,` or `]`.']},Oe={section:"git",ja:["`<枝> from <commit>` でその commit から枝を切る。`<札> -> <commit>` は commit を作らずに枝の札か `HEAD` を動かし、`HEAD` を動かすと枝から離れる。どの札からも辿れなくなった commit (例の C) は点線の丸に変わる。"],en:["`<branch> from <commit>` cuts a branch at that commit. `<ref> -> <commit>` moves a branch ref or `HEAD` without making a commit, and moving `HEAD` detaches it from its branch. A commit that no ref can reach any more (C in the example) turns into a dotted circle."]},Pe={section:"pipe",ja:["`calc <者>: <入る値> -> <出る値>` は換算で、行う者の下に入る値と出る値と比率の札を出し、同じ者の次の確認の段まで残す。"],en:["`calc <who>: <in> -> <out>` is a conversion. It shows the input, the output and the rate under the converter and keeps them until that party's next check."]},We={section:"pipe",ja:["呼び出しの行に `[call: delegate]` を付けると処理を借りる呼び出しになり、管は 2 本線で描き、内側の `write` は呼んだ側の値を書き替える。`[call: static]` は書き込めない呼び出しで、管は半分の太さになり、内側で残高と値とイベントを変える行は止まる。"],en:["Add `[call: delegate]` to a call line for a call that borrows code. Its pipe is drawn as a double line, and a `write` inside it rewrites the caller's values. `[call: static]` is a call that cannot write. Its pipe is half as thick, and a line inside it that changes a balance, a value or an event stops."]},qe={section:"carry",ja:["線の上には、何が運ばれたかを示す物が走る。何も書かなければ封筒が走る。","線の行の終わりに `[tag: <値>]` を足すと字を書いた札を、`[carry: coin]` を足すと硬貨を走らせる。番号や証明のような値が動く線には札を、代金やトークンのように価値が動く線には硬貨を使う。","`[carry: none]` は何も走らせない。知らせるだけで物が動かない線に使う。"],en:["Something runs along each line to show what was carried. Without any option, an envelope travels.","Adding `[tag: <value>]` at the end of the line sends a tag with text on it, and `[carry: coin]` sends a coin. Use a tag for lines that move a value such as a number or a proof, and a coin for lines that move worth such as money or tokens.","`[carry: none]` sends nothing. Use it for lines that only tell, with nothing changing hands."]},He={none:"使い方の頁の試す図の節は部品をまたぐ段落だけで、機械の列だけの段落が無い"},Ie={section:"chart",ja:["`item <名札> as <名前> [color: <色>]` は比べる項目で、最初の `step` より前に宣言した順に並ぶ。ドーナツは 12 時の向きから時計回りに弧を並べて凡例に名前を出し、横棒は上から棒を並べて棒の左に名前を出す。`color` を書かない項目には宣言した順に色を配る。項目は 1 つ以上、8 個まで書ける。"],en:["`item <id> as <name> [color: <color>]` is an item to compare, placed in the order declared before the first `step`. A donut lays the arcs clockwise from 12 o'clock and shows the names in its legend, and a bar chart stacks the bars from the top with each name on the left. An item without `color` gets a color in the order declared. A chart takes from 1 to 8 items."]},Fe={section:"chart",ja:["`set <名札>: <値>` は段の中に書く項目の値で、0 以上の数を単位を付けずに書く。段を送ると、弧と棒は前の段の値から新しい値へ動く。`set` を書かない項目は前の段の値を保ち、まだ値の無い項目は弧も棒も出さない。","ドーナツと横棒と点で数える見た目は、段の中の `set none: <数>` でどの項目にも入らない数を書ける。ドーナツと横棒は項目の後ろに灰色の弧か棒で描き、点で数える見た目はその点を灰色のまま全体の箱に残す。漏斗は `set none` を宣言していない項目と同じく断る。"],en:["`set <id>: <value>` inside a step is the value of the item, a number of 0 or more written without a unit. Going to the next step moves the arcs and bars from the previous values to the new ones. An item without `set` keeps its previous value, and an item with no value yet shows no arc or bar.","Donuts, bars and dots take `set none: <count>` inside a step for the count in none of the items. A donut or a bar draws it as a grey arc or bar after the items, and dots leave those dots grey in the box of the whole. A funnel refuses `set none` as it refuses an item that is not declared."]},Le={section:"chart",ja:["`chart <題> [shape: donut]` は項目ごとの割合をドーナツの弧の角度で描き、輪の真ん中に段の名前を、凡例に名前と整数に丸めた割合を出す。`chart <題> [shape: bar]` は項目ごとの量を横棒の長さで描き、一番大きい値の棒を一番長くして、棒の端に値を出す。見た目はどれかを必ず書き、段ごとに替えない。","`chart <題> [shape: funnel]` は段を進むほど数が減る漏斗を描き、項目を宣言した順に上から段として並べる。段の棒は値を書いた段で現れ、左端を揃えて、長さを最初の段の値に比べて決める。前の段との差は薄い棒で残して去った数を書き、段の数の右に前の段に対する割合を出す。最後の段では、最初の段のうち最後の段まで残った割合の行を足す。前の段より大きい値と、どの段にも値を書かない段は、記法を読む時に誤りになる。","`chart <題> [shape: dots]` は件数を点の数で数えて見せる。最初の段の前から全体の箱に空の点を並べ、項目に件数を書いた段で、その件数の分の点が箱から項目の群れへ寄り、群れの下に名前と正確な件数を出す。1点が何件かは、点が100個ほどになる数 (1か2か5に10の累乗を掛けた数) を図が選び、箱の上に全体の件数と並べて出す。最初の行に `[shape: dots, unit: <数>]` と書くと1点の件数を決められる。1つの段で点が200個を超える値は、記法を読む時に誤りになる。"],en:["`chart <title> [shape: donut]` draws the share of each item as the angle of an arc of a donut, with the step name in the middle of the ring and the names and rounded percentages in the legend. `chart <title> [shape: bar]` draws the amount of each item as the length of a bar, makes the bar of the largest value the longest, and shows each value at the end of its bar. Write one of the shapes, and it stays the same through the steps.","`chart <title> [shape: funnel]` draws a funnel, where the count shrinks stage by stage, and stacks the items from the top as stages in the order declared. A stage's bar appears in the step that sets it, left-aligned and as long as its value compared with the first stage. The gap to the stage above stays as a pale bar with the number who left, and the rate kept from the stage above shows beside the count. The last step adds a row with the share of the first stage that made it to the last one. A value larger than the stage above, and a stage that never gets a value, are errors when the notation is read.","`chart <title> [shape: dots]` counts with dots. The box of the whole holds empty dots from before the first step, and in the step that sets an item, that many dots move from the box to the item's cluster, with its name and exact count under it. The diagram picks how many each dot stands for (1, 2 or 5 times a power of 10) so that the dots come to about 100, and shows it at the top of the box beside the total. Write `[shape: dots, unit: <count>]` on the first line to choose it yourself. A step with more than 200 dots is an error when the notation is read."]},Ue={section:"pipe",ja:["`check <者>: <左> <比べ方> <右>` は確認で、その段だけ行う者の下に計器を出し、後は名札の右上と図の上の端に印を残す。比べ方は `>=`、`<=`、`==`、`!=`、`>`、`<`。両側が数なら dragon が比べ、数でない確認は `[fail]` を書いた時だけ落ちる。"],en:["`check <who>: <left> <op> <right>` is a check. It shows a gauge under the checker in that step, then leaves a mark on the name card and at the top of the figure. The op is `>=`, `<=`, `==`, `!=`, `>` or `<`. dragon compares numbers itself, and a check of anything else fails only when `[fail]` is written."]},Me={section:"flow",ja:["判断で道が分かれる手順を段ごとに追う時は、最初の行を `flow <題>` にする。手順は `box` の行で、判断は `choice <名札> as <問い>` の行で宣言し、判断はひし形で描く。段の線が初めて辿り着く順に、手順と判断が上から下へ 1 列に並ぶ。","最初の `step` の行より前に書いた線は今回は通らない道で、最初の段から点線で引く。判断から出る線は名前を持つ 2 本までで、本筋に無い箱へ入る点線の道は判断の右の角から出る。前の手順へ戻る線と 3 つ以上に分かれる判断は書けず、戻る道は状態遷移図で描く。","全ての道を見せる時は、判断の「はい」と「いいえ」の線を同じ段に 2 本書く。2 本は同時に走り出し、段の印の点が両方の道を走る。先に書いた線が本筋で真下へ進み、後に書いた線は横へ分かれ、箱の並びは今回は通らない道を書いた図と同じになる。横に分かれた先の箱は段で辿り着くので、点線の縁と薄い字にしない。","段で動く線は青で引き、その上を段の印の点が走って着くと消える。通り終えた線は濃い墨の色で残り、点が着いた判断は琥珀の薄い色で塗る。長い問いは助詞か読点か空白の後で 2 行に折り、1 行で収まる短い問いは 1 行のまま書く。本筋に無い箱は、点線の縁に加えて名前の字も薄い色で書く。","線に `carry` と `tag` を書かなければ、封筒の代わりにこの点が走る。`carry: coin` と `tag` は運ぶ物のまま走り、その線に点は出ない。`carry: none` は線だけを引いて何も走らせない。"],en:["To follow, step by step, a procedure that branches at decisions, start the first line with `flow <title>`. Declare each task with a `box` line and each decision with a `choice <id> as <question>` line; a choice is drawn as a diamond. Tasks and choices stack top to bottom in the order the step lines first reach them.","Lines written before the first `step` line are paths not taken this time and are drawn dotted from the first step. A choice leads to at most two places and every line leaving it has a name. A dotted path to a box off the main path leaves the diamond from its right corner. Lines back to an earlier task and choices that split three ways are refused; draw loops in a state diagram.","To show every path, write both answers of a choice in the same step. The two lines start at the same moment and the step mark runs down both paths. The line written first goes straight down as the main path and the line written after it branches to the side, so the boxes sit where they do in a diagram with a path not taken. A box reached this way keeps a solid border and full-color text.","The line that moves in a step is drawn in blue, and the step mark, a dot, runs along it and vanishes when it arrives. A passed line stays dark, and a choice the dot reached is filled with light amber. A long question wraps onto two lines after a particle, a comma or a space, and a short one stays on one line. A box off the main path has a dotted border and a muted name.","A line without `carry` or `tag` runs this dot instead of an envelope. `carry: coin` and `tag` run as the thing itself, with no dot on that line. `carry: none` draws only the line and runs nothing."]},Be={section:"venn",ja:["2 つか 3 つの集まりの重なりと、重なった区画ごとの数を段ごとに見せる時は、最初の行を `venn <題>` にする。集まりは最初の `step` の行より前に `item <名札> as <名前>` の行で宣言し、2 つの集まりは左右に、3 つの集まりは左上と右上と下に同じ大きさの円で並ぶ。`[color: <色>]` は円の色になり、書かない集まりには宣言した順に色を配る。","段の中の `set <名札>: <数>` は集まりの数で、初めて書いた段でその集まりの円が現れ、円の外に名前と数が出る。`set <名札> & <名札>: <数>` は重なりの数で、その段の間だけその重なりの区画が光り、重なりの数の札が出る。3 つ全ての重なりは `set <名札> & <名札> & <名札>: <数>` と書く。","区画の中には、全体と重なりの数から出したそれぞれだけの数が出る。後の段で書く重なりがある区画は、その段まで数を出さない。`set none: <数>` はどれにも入らない数で、その段から円の外の枠の左下に出る。重なりの数が重なる集まりの数より大きい行と、集まりが 2 つより少ないか 3 つより多い図は誤りで止まる。","最初の行を `venn <題> [shape: dots]` にすると、円の代わりに点で数える見た目になる。全体の箱に空の点を並べ、段ごとに集まりと重なりの群れへ点が寄り、2つ以上に入る点は入る集まりの色の扇形で塗る。`set none` の点は灰色のまま箱に残る。`[shape: dots, unit: <数>]` で1点の件数を決められ、書かない時は点が100個ほどになる数を図が選ぶ。"],en:["To show, step by step, how two or three sets overlap and how many fall in each region, start the first line with `venn <title>`. Declare the sets with `item <id> as <name>` lines before the first `step` line; two sets sit left and right, and three sets sit top left, top right and bottom, as circles of the same size. `[color: <color>]` sets the circle color, and a set without it gets a color in the order declared.","`set <id>: <count>` in a step is the count of a set; its circle appears in the step where it is first written, with the name and count outside the circle. `set <id> & <id>: <count>` is the count of an overlap; that region lights up for that step and a chip shows the count. Write the overlap of all three as `set <id> & <id> & <id>: <count>`.","Each region shows the count only in it, worked out from the totals and the overlaps. A region that depends on an overlap written in a later step shows no count until that step. `set none: <count>` is the count in no set, shown from that step at the bottom left of the frame outside the circles. An overlap larger than a set it overlaps, and a diagram with fewer than 2 or more than 3 sets, are refused.","Start the first line with `venn <title> [shape: dots]` to count with dots instead of circles. Empty dots wait in the box of the whole, each step moves dots into a cluster for each set and each overlap, and a dot in two or more sets is painted in slices of their colors. The dots of `set none` stay grey in the box. `[shape: dots, unit: <count>]` sets how many each dot stands for, and without it the diagram picks a number that makes about 100 dots."]},Je={none:"使い方の頁は色の役を絵と同じ段落の中で書き、色の役だけの段落が無い。段落は箱と区画の節が持つ"},Re={section:"git",ja:["段の中では `commit <名札> on <枝>` で枝の先に commit を積み、`[hash: <hash>, note: <一言>]` で丸の外に hash と一言を添える。`copy <元>` を付けると元の commit を写した当て直しの commit に、`merge <枝>` を付けるとその枝の先端も親に持つ merge commit になる。"],en:["Inside a step, `commit <id> on <branch>` adds a commit at the tip of the branch, and `[hash: <hash>, note: <note>]` puts a hash and a short note beside the circle. Add `copy <source>` for a replayed copy of another commit, or `merge <branch>` for a merge commit whose parents include the tip of that branch."]},Ge={none:"使い方の頁の枝分かれの図の節は、当て直しの語を commit の行の段落 (commit のブロックの docs) で一緒に書く"},ze={section:"git",ja:["`delete <枝>` で枝を消す。消した段から後はその枝の札が消え、どの枝からも辿れなくなった commit は点線の丸に変わる。枝の帯は残る。`HEAD` が指している枝は消せないので、先に `HEAD -> <commit>` で離し、残す枝の札をその commit へ動かして `HEAD` をその枝へ戻す。消した枝へは commit を積めない。"],en:["`delete <branch>` deletes a branch. From that step on its ref is gone, and a commit that no branch can reach any more turns into a dotted circle. The branch's lane stays. The branch `HEAD` points at cannot be deleted, so first detach `HEAD` with `HEAD -> <commit>` and move the ref of a branch you keep to that commit, which puts `HEAD` back on that branch. No commit can be added to a deleted branch."]},Ve={section:"edges",ja:["線は `<名札> -> <名札>: <線の名前>` で書き、段の中に書いた順に走る。名前は省ける。"],en:["Write a line as `<id> -> <id>: <label>`. Lines run in the order they are written in the step, and the label can be left out."]},Ke={section:"edges",ja:["線の名前の置き場所は自動で決まる。崩れた時だけ、線の行の終わりに `[side: above]` か `below`、`left`、`right` を足して置く側を指す。"],en:["The label is placed automatically. Only when the placement breaks, add `[side: above]`, `below`, `left` or `right` at the end of the line to say which side it goes."]},Ye={section:"pipe",ja:["`emit <者>: <名前>(<引数>, ...)` はイベントで、図の上の端に `<者の名前>.<名前>` の札を積み、出した段だけ引数を出す。"],en:["`emit <who>: <name>(<args>, ...)` is an event. It stacks a `<party name>.<name>` card at the top of the figure and shows the arguments only in that step."]},Xe={section:"pipe",ja:["呼び出しの行に `[fold]` を付けると、その呼び出しの内側の段を 1 つの箱に畳み、内側の段の数と、内側にしか出ない関係者の数を出す。畳んだ間はその関係者の列を描かない。箱を押すと内側の段を開く。"],en:["Add `[fold]` to a call line and the steps inside that call fold into one box that shows how many steps are inside and how many parties appear only there. Those parties get no column while the box is closed. Click the box to open those steps."]},Qe={section:"pipe",ja:["`gist <要点>` はその段の要点で、図の下の段の矢印の後ろに要点の札を出す。配管の図は段の本文を図の下に出さないので、本文だけで伝えていた要点はここに書く。1 つの段に 1 行まで書ける。"],en:["`gist <key point>` is the key point of the step. It shows a note after the step's arrows under the figure. A pipe diagram does not show the step body under the figure, so write here a point the body alone would carry. A step takes at most one."]},Ze={section:"regions",ja:["構成図では、箱を区画に分けて置ける。区画は `group <名札> as <名前> [note: <添え書き>]` の行で開いて `end` の行で閉じ、その間に書いた `box` の行の箱が区画の中に置かれる。","区画も `color:` と `icon:` を持てる。仕組みの持ち主や置き場所の境目 (チェーンと網、店と倉庫) を見せる時に使う。","同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きの箱を書く。2 度目は名札だけを書き、名前と札は最初の 1 度だけ書く。"],en:["In an architecture diagram, boxes can be placed in regions. Open a region with a `group <id> as <name> [note: <note>]` line and close it with an `end` line, and the boxes on the `box` lines in between go inside it.","Regions can also take `color:` and `icon:`. Use them to show where ownership or placement changes, such as between chains and a network, or a shop and a warehouse.","When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes. The second time, write only the id, and give the name and attributes only the first time."]},et={section:"pipe",ja:['Solidity の関数を呼んだ時に中で何が起きたかを段ごとに追う時は、最初の行を `pipe <題>` にする。関係者は `box` で宣言し、種類 (送り手、Contract、トークンの Contract、口座) は書かずに行から決まる。最初の step より前に `hold <持ち主>: <量> <トークン>, <量> <トークン>` で残高を、`hold <持つ Contract>: <名前> <値>` で残高でない値を宣言する。トークンは `box usdc as USDC` のように宣言した関係者の名前で書き、ETH は宣言せずに書ける。量として読める名前と `[` を含む名前は `"` で囲む。',"段の中の `move <トークンの Contract>: <量> <送り手> -> <受け手>` は、トークンの管を通して残高を移す。槽の水位はトークンごとに量に比例し、移した分は一番外の呼び出しが戻るまで斜線の暫定で描く。持っている量より多く移す行は、その量を指して止まる。"],en:["To follow, step by step, what happens inside a call to a Solidity function, start the first line with `pipe <title>`. Declare parties with `box`; their kind (sender, contract, token contract, account) is not written but derived from the lines. Before the first step, `hold <owner>: <amount> <token>, <amount> <token>` declares balances and `hold <contract>: <name> <value>` declares a value that is not a balance. A token is written as the name of a declared party, as in `box usdc as USDC`, and ETH needs no declaration. Quote a name that reads as an amount or holds `[`.","In a step, `move <token contract>: <amount> <from> -> <to>` moves a balance through the token's pipe. Tank levels are true to scale per token, and the moved amount stays hatched as pending until the outermost call returns. A line that moves more than the sender holds stops at that amount."]},tt={none:"使い方の頁は絵を色の役と同じ段落の中で書き、絵だけの段落が無い。段落は箱と区画の節が持つ"},nt={section:"mind",ja:["1 つの題から考えを枝と葉に広げていく時は、最初の行を `mind <題>` にする。考えは段の中に `idea <名札> as <名前> of <親>` と書き、書いた段で考えが濃く現れて、親からの枝の線が伸びる。`of` の無い `idea` が真ん中の題で、1 つの図にちょうど 1 つ置く。親は前に書いた考えに限り、題、枝、葉の 3 段まで書ける。",'題の子の枝は左右に分かれ、書いた順に左上、右上、右下、左下の四方へ曲線で伸び、枝の子の葉は枝の外側に縦に並ぶ。枝に書いた `[color: <色>]` はその枝の線と葉の枠に引き継ぎ、色の無い枝には書いた順に色を配る。`as <名前>` を省くと名札がそのまま名前になり、語の `of` を含む名前は `"` で囲む。箱と線と中身の帯の行は書けない。'],en:["To grow ideas out of one title into branches and leaves, start the first line with `mind <title>`. Write each idea inside a step as `idea <id> as <name> of <parent>`; the idea comes into full colour in that step and a branch line grows from its parent. The `idea` without `of` is the centre, and a map has exactly one. A parent must be an idea written earlier, and ideas go three levels deep: the centre, branches and leaves.",'The branches of the centre split left and right and curve out four ways, top left, top right, bottom right and bottom left in written order, and the leaves of a branch stack outside it. A `[color: <color>]` on a branch carries over to its line and the frames of its leaves, and branches without a color get one in written order. Leave out `as <name>` and the id becomes the name; quote a name that contains the word `of` with `"`. Box, line and strip lines are not allowed.']},at={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},ot={section:"tree",ja:["葉の値を親へ畳み上げて1つの根にまとめる構造を段ごとに追う時は、最初の行を `tree <題>` にする。葉と親は段の中に書き、書いた段で箱が現れる。`leaf <名札> [hash: <値>]` が葉で、書いた順に左から並ぶ。`hash` を書くと箱に値を出し、名札は葉の下の札に出す。"],en:["To follow, step by step, how the values of leaves fold up through parents into one root, start the first line with `tree <title>`. Leaves and parents are written inside steps, and each box appears in the step that writes it. `leaf <id> [hash: <value>]` is a leaf, and leaves line up from the left in written order. With `hash`, the box shows the value and the id moves to a card below the leaf."]},st={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},it={section:"boxes",ja:["箱は宣言した順に並ぶ。時系列図では箱ごとに縦の線が左から右へ立ち、線はその間を走る。"],en:["Boxes line up in the order you declare them. In a sequence diagram each box gets a vertical line from left to right, and lines run between them."]},rt={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},ht={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},dt={section:"boxes",ja:["`link: <飛び先>` を足すと、描いた図でその箱が飛び先への link になり、箱の中の仕組みを描いた別の図の頁などへ移れる。飛び先は `/` で始まる path か、`http://` か `https://` で始まる URL で書く。"],en:["Add `link: <target>` and the box becomes a link to that target in the drawn diagram, for example to the page of another diagram that draws what is inside the box. Write the target as a path that starts with `/` or a URL that starts with `http://` or `https://`."]},lt={none:"使い方の頁の試す図の節は部品をまたぐ段落だけで、記録の列はその段落が書く"},ct={section:"matrix",ja:["分ける課題は最初の `step` より前に `item <名札> as <名前>` と書き、区画の左の「まだ置いていない」の一覧に書いた順に並ぶ。段の中に `line <区画>: <課題>` と書くと、その段で課題の札が一覧から区画へ滑り、区画が光る。`,` で区切って 1 行に何枚でも置け、置いた札は次の段も区画に残る。後の段で別の区画へ書くと置き直せる。","`line` に書いた区画か課題が無い時と、1 行に同じ課題を 2 度書いた時は、その名前の位置を示して断る。`as <名前>` を省くと名札がそのまま名前になる。"],en:['Declare the items to sort before the first `step` as `item <id> as <name>`; they wait in the "Not placed yet" list left of the areas in written order. Write `line <area>: <item>` in a step and the item\'s card slides from the list into that area while the area lights up. List several items with `,` on one line; a placed card stays in its area in later steps, and writing it to another area in a later step moves it there.',"A `line` that names an unknown area or item, or names the same item twice, is refused at that name. Leave out `as <name>` and the id becomes the name."]},pt={none:"使い方の頁の枝分かれの図の節は、merge commit の語を commit の行の段落 (commit のブロックの docs) で一緒に書く"},mt={section:"tree",ja:["`node <名札> of <子>, <子> [hash: <値>]` が親で、`of` の後ろに組む子を並べる。親は子の真ん中の上に置かれ、親と子を木の線が結ぶ。どの親にも組まれなかった箱が根で、上の真ん中に置かれる。根は1つにする。"],en:["`node <id> of <child>, <child> [hash: <value>]` is a parent, and the children to join follow `of`. A parent sits above the middle of its children, and tree lines join them. The box that no parent takes is the root and sits at the top in the middle. Keep to one root."]},ut={section:"steps",ja:["`note <名札>: <字>` は、その段から箱の下の字を書き換える。残高や状態のように、段を追って替わる値を箱の上で見せる。"],en:["`note <id>: <text>` rewrites the caption under a box from that step on. Use it to show a value that changes step by step, such as a balance or a state, right on the box."]},gt={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},bt={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},ft={none:"使い方の頁の時間軸の図の節に、節目だけの段落が無い"},wt={none:"使い方の頁の試す図の節は部品をまたぐ段落だけで、釦だけの段落が無い"},xt={none:"使い方の頁の試す図の節は部品をまたぐ段落だけで、待ち行列だけの段落が無い"},yt={section:"pipe",ja:["`<呼ぶ者> -> <呼ばれる者>: <字>` は呼び出しで、名札の上を走る呼び出しの管を開き、深くなるごとに管が 1 段下がる。`return <戻る者>: <値>` は今いちばん内側で開いている呼び出しを閉じ、戻る値を管の上の札に出す。ほかの者を書いた行は、その名前を指して止まる。一番外の呼び出しが戻った段で、暫定だった変更が全て確定の緑に替わる。"],en:["`<caller> -> <callee>: <text>` is a call. It opens a call pipe that runs above the name cards, one level lower for each deeper call. `return <returner>: <value>` closes the innermost open call and shows the returned value on the pipe. A line that names anyone else stops at that name. When the outermost call returns, every pending change turns final green."]},kt={section:"pipe",ja:["`revert <者>: <理由>` は今いちばん内側の呼び出しを落とし、その呼び出しの内側の変更だけを取り消しの印を付けて元へ戻す。呼んだ側は続けて次の行を書ける。"],en:["`revert <who>: <reason>` makes the innermost call fail and undoes only the changes inside it, marked as undone. The caller can go on with the next line."]},vt={section:"cycle",ja:["同じ手順を何度も回る流れを段ごとに追う時は、最初の行を `cycle <題>` にする。手順は最初の `step` の行より前に `box <名札> as <名前>` の行で宣言し、書いた順に輪の真上から右回りに並ぶ。手順は 2 つから 8 つまで書け、`[note: <字>]` は箱の名前の下に、`[color: <色>]` は箱の色になる。","段の中の `<名札> -> <名札> [tag: <字>]` の行は、輪の次の手順への線になる。最後の手順から最初の手順への線も次の手順への線で、そこから次の回に入る。1 つ飛ばす線、逆回りの線、同じ手順へ戻る線と、`: <名前>` を付けた線は誤りで止まる。`act` と `group` の行は書けない。","線の札はその段で弧に沿って次の手順へ走り、走った弧と矢じりは受ける側の手順の色で光ったまま残る。段の番号はその段で札が着いた手順の箱の横に出し、札の無い段は前の段の手順に出す。","`strip <題>: <欄>, <欄>` を書くと、図の下でなく輪の真ん中に帯の題と欄の値を出す。段の中の `set <欄>: <値>` で値が入れ替わり、最初の欄の値は大きく、2 つ目からの欄の値は小さく出る。欄の名前は出さないので、値だけで読める字にする。最初に書いた後で変わった値は、変わった段の間だけその段の手順の色で出る。`set <欄> [tag: <札>]` の札の字は、値と同じ所に出る。"],en:["To follow, step by step, a flow that goes around the same steps again and again, start the first line with `cycle <title>`. Declare the steps with `box <id> as <name>` lines before the first `step` line; they sit on a ring clockwise from the top in the order written. A ring takes 2 to 8 steps. `[note: <text>]` goes under the box name and `[color: <color>]` sets the box color.","A `<id> -> <id> [tag: <text>]` line in a step is a line to the next step on the ring. A line from the last step to the first one is also a line to the next step, and it starts the next round. A line that skips a step, goes backward, returns to the same step or carries a `: <name>` is refused. `act` and `group` lines are not allowed.","In that step the chip runs along the arc to the next step, and the arc and its arrowhead stay lit in the color of the receiving step. A step's number sits beside the box the chip reached, and a step without a line puts its number beside the box the step before ended at.","With `strip <title>: <field>, <field>`, the strip title and the field values go in the middle of the ring instead of under the diagram. `set <field>: <value>` in a step changes a value; the first field shows large and the others show smaller. Field names are not shown, so write values that read on their own. A value that changes after it was first written shows in the color of that step's box while the step lasts. The text of a `set <field> [tag: <tag>]` shows where the value goes."]},_t={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},Tt={none:"使い方の頁の試す図の節は部品をまたぐ段落だけで、網だけの段落が無い"},St={none:"使い方の頁の時間軸の図の節に、印の列だけの段落が無い"},jt={section:"time",ja:["決まった間隔で進む時間の上で、出来事がどの目盛りで起きたかを段ごとに追う時は、最初の行を `time <題>` にする。`scale <単位> <長さ> <数>` で目盛りを宣言すると、その数の目盛りが軸に等間隔で並ぶ。長さは数と単位 (`ms`、`s`、`min`、`h`、`d`) の組で書き、軸の時刻の字はこの長さから計算する。"],en:["To follow, step by step, which tick each event happens on while time moves at a fixed interval, start the first line with `time <title>`. `scale <unit> <length> <count>` declares the ticks, and that many ticks are spaced evenly along the axis. Write the length as a number and a unit (`ms`, `s`, `min`, `h`, `d`); the time labels on the axis are worked out from it."]},At={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},Ct={none:"使い方の頁の試す図の節は部品をまたぐ段落だけで、side の行はその段落が書く"},Et={section:"state",ja:["最初の `step` の行より前に書いた線は、移れるが今回は通らない道として点線で引き、運ぶ物を走らせない。どの段も辿り着かない状態 (例のキャンセル) は、図の右上の脇道の囲みに入る。"],en:["Lines written before the first `step` line are paths the diagram could take but does not take this time. They are drawn dotted, and nothing travels on them. A state that no step reaches (Cancelled in the example) goes in the side-path box at the top right."]},Nt={section:"steps",ja:["`source <名前> [url: <URL>]` の行は、その段の出典になる。1 つの段に何行でも書け、図と見える語りには出さず、読み上げの段の一覧に名前の link で出る。URL の形は箱の飛び先と同じ。"],en:["A `source <name> [url: <URL>]` line is a source for that step. A step can have any number of them. They stay out of the diagram and the shown text, and appear as links named by the source in the step list that screen readers read. The URL takes the same forms as a box link."]},Dt={none:"使い方の頁の列の図の節は本文が書き方をまとめて持つ"},$t={section:"state",ja:["線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。`start` と `finish` は箱の名札に使えない。"],en:["Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark. `start` and `finish` cannot be used as box ids."]},Ot={section:"steps",ja:["段は `step <見出し>` の行で区切り、図はこの単位で 1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。本文を 2 行以上に分ける時は、`say` だけの行の下に、さらに深く字下げして続ける。","例の `code pay(1200)` の行のように、`code` の行はその段で打つ命令になる。1 つの段に 1 行まで書ける。","見せ方は最初の行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ。`fixed` は全体を止めて中だけを動かし、`follow` は今動いている所へ寄って動かす。書かなければ、全体を枠に収めた時の字の大きさで決まる。"],en:["Steps are separated by `step <heading>` lines, and the diagram moves on one step at a time. Indent the lines inside a step, and every step needs a `say` line that tells what happens in it. To split the body over two or more lines, write `say` alone and continue on lines indented further below it.","A `code` line, like the `code pay(1200)` line in the example, is the command for that step. A step can have at most one.","Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the first line. `fixed` keeps the whole diagram still and moves only what is inside, and `follow` moves to where things are happening. Without it, the view is chosen by the text size when the whole diagram fits the frame."]},Pt={section:"strip",ja:["帯は図に添える中身の表で、段を追って替わる値を見せる。`strip <題>: <欄>, <欄>` で欄を宣言する。","段の中で `set <欄>: <値>` と書くとその欄に値が入り、`set <欄> [tag: <札>]` と書くとその欄に札が付く。","認可コードや注文の状態のように、やり取りの間に持ち物が替わる様子を、線とは別に追える。"],en:["The strip is a table that goes with the diagram and shows values that change step by step. Declare its fields with `strip <title>: <field>, <field>`.","Inside a step, `set <field>: <value>` puts a value in a field, and `set <field> [tag: <tag>]` puts a tag on it.","It lets you follow what is held while messages go back and forth, such as an authorization code or the state of an order, apart from the lines."]},Wt={section:"er",ja:["表は最初の `step` の行より前に `table <名札> as <名前>` の行で宣言し、次の `table` の行までの `field <名前>: <値>` の行がその表の項目になる。表は 1 つから 6 つまで書け、書いた順に左から右へ横 1 列に並ぶ。`as <名前>` を省くと名札がそのまま名前になり、`[color: <色>]` で表の色を決める。","項目の `[key]` は鍵の印 (PK) で、`field <名前>: <値> [ref: <表>.<項目>]` は別の表の項目への結び (FK) になる。結びを書いた項目が何件もの側で線の端に三つ叉を置き、指した項目が 1 件の側で縦の棒を置く。前に書いた表も後ろに書いた表も指せ、無い表か無い項目を指すと誤りで止まる。2 つを並べる時は `[key, ref: <表>.<項目>]` と書く。","段の中の `pick <表>.<項目>` はその段で行の地と表の枠を光らせ、表の枠は後の段でも細く色を残す。`<表>.<項目> -> <表>.<項目> [tag: <値>]` は結んだ項目どうしの線に沿って値の札を走らせ、札は線の真ん中で止まる。結んでいない項目どうしの線と、`: <名前>` を付けた線は誤りで止まる。","`set <表>.<項目>: <値>` はその段から項目の値を書き換え、書き換えた値を表の色で出す。`note <表>.<項目>: <文>` はその段から表の真下に式の札を出し、後の段も残す。同じ表の札は書いた順に下へ積む。段の番号は、その段で行を選んだ表の見出しの右に出す。"],en:["Declare a table with a `table <id> as <name>` line before the first `step` line; the `field <name>: <value>` lines up to the next `table` line become its fields. A diagram takes 1 to 6 tables, and they sit left to right in one row in the order written. Without `as <name>` the id is the name, and `[color: <color>]` sets the table color.","`[key]` on a field is the key mark (PK), and `field <name>: <value> [ref: <table>.<field>]` links it to a field of another table (FK). The field that holds the link is the many side and gets a three-pronged end; the field it points at is the one side and gets a bar end. A link may point at a table written before or after, and a link to a missing table or field is refused. To write both, use `[key, ref: <table>.<field>]`.","`pick <table>.<field>` in a step lights the row and the table frame in that step, and the frame keeps a thin color in later steps. `<table>.<field> -> <table>.<field> [tag: <value>]` runs a value chip along the line between linked fields, and the chip stops halfway. A line between fields that are not linked, or one with a `: <name>`, is refused.","`set <table>.<field>: <value>` rewrites the value of a field from that step on and shows the new value in the table color. `note <table>.<field>: <text>` shows a formula card right under the table from that step on, and it stays in later steps. Cards on the same table stack downward in the order written. A step's number sits at the right of the header of the table that step picks a row from."]},qt={section:"time",ja:["工程表のように作業の期間を見せる時は、最初の `step` より前に `task <名札> as <名前> <範囲> [color: <色>]` を書く。作業は 1 つずつ自分の行を持ち、範囲の目盛りの上に続いた太い棒で描かれる。範囲は `mark` と同じく 0 から数える目盛りで、`0-2` か `13` と書く。行の左に作業の名前、棒の中に `1〜3日` のように始まりと終わりの目盛りの名前で期間が出て、針が通った分の棒が濃く塗られる。軸の字も同じ番号で、番号の目盛りの真ん中に出る。作業を持つ図は `row` を書かなくてよく、`row` と並べる時は宣言した順に上から並ぶ。"],en:["To show how long tasks take, as in a schedule, write `task <id> as <name> <range> [color: <color>]` before the first `step`. Each task gets its own row and is drawn as one thick bar over the ticks of the range. A range counts ticks from 0 like `mark`, as `0-2` or `13`. The name sits to the left of the row and the first and last tick names with the scale name (such as `Day 1–3`) inside the bar, and the bar fills as the needle passes. The axis uses the same tick names, each centered on its tick. A diagram with tasks needs no `row`, and tasks and rows keep the declared order from top to bottom."]},Ht={section:"pipe",ja:["`[value: <量> ETH]` を付けると、呼び出しに ETH を添えて送る。呼んだ者の ETH の槽から呼ばれた者の ETH の槽へ移り、呼び出しが落ちると元へ戻る。"],en:["`[value: <amount> ETH]` sends ETH along with the call. It moves from the caller's ETH tank to the callee's ETH tank, and returns if the call is reverted."]},It={section:"pipe",ja:["`write <者>: <名前> <値>` は値の札を書き替え、前の値を消し線で残す。書き替える札の持ち主は開いている呼び出しから決まり、処理を借りる呼び出しの内側では呼んだ側の札を書き替える。"],en:["`write <writer>: <name> <value>` rewrites a value card and keeps the old value struck through. The owner of the card follows the open calls, so inside a call that borrows code the caller's card is rewritten."]},Ft={section:"time",ja:["`period <名前> <目盛りの数>` は区切りの境ごとに名前と番号を置き、`row <名札> [empty: <目盛り>]` は目盛りごとの印の列を、`point <名札> at <目盛り>` は軸の下の節目を宣言する。`zoom <範囲>` で選んだ目盛りは上の帯に列として並び、宣言した箱が列ごとに同じ並びで出る。線は `[at: <目盛り>]` でその列の箱どうしを結び、`[into: <目盛り>]` を足すと受ける箱を別の列から選ぶ。"],en:["`period <name> <ticks>` puts a name and a number at each period boundary, `row <id> [empty: <ticks>]` declares a row of marks with one mark per tick, and `point <id> at <tick>` declares a point below the axis. The ticks chosen with `zoom <range>` become columns in the top band, and the declared boxes appear in every column in the same order. A line with `[at: <tick>]` joins the boxes in that column, and `[into: <tick>]` picks the receiving box from another column."]},Lt={act:Ce,ask:Ee,axis:Ne,band:De,box:$e,branch:Oe,calc:Pe,call:We,carry:qe,chain:He,"chart-item":Ie,"chart-set":Fe,"chart-shape":Le,check:Ue,choice:Me,circle:Be,color:Je,commit:Re,copy:Ge,delete:ze,edge:Ve,"edge-label":Ke,emit:Ye,fold:Xe,gist:Qe,group:Ze,hold:et,icon:tt,idea:nt,item:at,leaf:ot,legend:st,lifeline:it,limit:rt,line:ht,link:dt,log:lt,"matrix-item":ct,merge:pt,node:mt,note:ut,order:gt,pick:bt,point:ft,press:wt,queue:xt,return:yt,revert:kt,ring:vt,role:_t,route:Tt,row:St,scale:jt,seal:At,side:Ct,"side-path":Et,source:Nt,stamp:Dt,"start-finish":$t,step:Ot,strip:Pt,table:Wt,task:qt,value:Ht,write:It,zoom:Ft},Ut=["start","short","rules","boxes","edges","regions","state","git","time","tree","lineup","try","chart","flow","cycle","mind","er","matrix","venn","sankey","pipe","extend","steps","strip","carry","json","place","export","line","migrate"];function t(n,s){return v.flatMap(r=>{const o=Lt[r];return"none"in o||o.section!==n?[]:[...o[s]]})}const Mt=["start","boxes","regions","steps","json","export"],Bt={start:{screen:"editor"},short:{screen:"editor"},rules:{section:"boxes"},boxes:{section:"edges"},edges:{section:"regions"},regions:{kind:"architecture"},state:{kind:"state"},git:{kind:"git"},time:{kind:"time"},tree:{kind:"tree"},lineup:{kind:"lineup"},try:{kind:"try"},chart:{kind:"chart"},flow:{kind:"flow"},cycle:{kind:"cycle"},mind:{kind:"mind"},er:{kind:"er"},matrix:{kind:"matrix"},venn:{kind:"venn"},sankey:{kind:"sankey"},pipe:{kind:"pipe"},extend:{screen:"editor"},steps:{section:"strip"},strip:{kind:"sequence"},carry:{section:"json"},json:{screen:"editor"},place:{section:"export"},export:{screen:"editor"},line:{screen:"editor"},migrate:{screen:"editor"}},Jt={extend:[null,null,['<link rel="dragon-blocks" href="bridge.dragon">',"",'<pre class="dragon">',"architecture Across the bridge","","box eth as Ethereum","+bridge cc as CCIP","box base as Base [icon: +key]","","step Hand over","  say The bridge hands the token over.","  cc +relay base: hand over","</pre>"].join(`
`),['import { parseNotation, readBlocks, renderDiagram } from "@cardenelabs/dragon";',"",'// Pass notation text, or JSON shaped as { "format": 1, "blocks": [...] }',"const read = readBlocks(definition);","if (read.ok) {","  const parsed = parseNotation(notation, { blocks: read.blocks });","  if (parsed.ok) renderDiagram(parsed.diagram, { blocks: read.blocks });","}"].join(`
`)],place:[['import "@cardenelabs/dragon/fonts";','import { mountDiagram, parseNotation } from "@cardenelabs/dragon";',"",'const source = await (await fetch("login.dragon")).text();',"const parsed = parseNotation(source);",'if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\\n"));',"",'const host = document.getElementById("figure");','if (host === null) throw new Error("#figure not found");',"const player = mountDiagram(host, parsed.diagram);"].join(`
`),null,null],export:["npm install @cardenelabs/dragon",`pnpm add -D playwright-core
pnpm exec playwright-core install chromium`,"dragon export login.dragon --out out"]},p={ja:{eyebrow:n=>`使い方の案内 · ${n}`,lead:"dragon記法の書き方を 1 枚にまとめた読み物。最初の 5 分で図を動かし、宣言と段を省いた短い書き方を見て、決まり 4 つを押さえてから、箱、線、区画、状態遷移図、枝分かれの図、時間軸の図、木の図、列の図、試す図、量の図、手順の図、回り続ける図、考えを広げる地図、表どうしの関係の図、2つの軸で置く図、集合の重なりの図、量の行き先の図、配管の図、段、帯、運ぶ物の順に記法の要素を掴み、使う人が手元でブロックを足す書き方も載せる。JSON との行き来と、mp4 や GIF への書き出しと、前の形から書き直す対応表もここで扱う。",start:"5 分で始める →",browse:"カタログで図を見る",iconLink:"使える絵柄を部品「絵」の頁で全て見る →",sections:{start:{title:"5 分で動かす",text:["何も入れずに試すなら、編集画面を開く。左の欄に記法を書くと、右にその場で動く図が出る。","記法は行の頭の語で、その行に何を書くかが決まる。最初の行に図の種類と題を書き、`sequence` なら時間の順に箱どうしのやり取りを、`architecture` なら区画に置いた箱のつながりを描く。","次に登場する箱を `box` の行で並べ、`step` の行の下に字下げして、その段で起きることを起きる順に書く。下の例は箱 2 つと段 1 つの図になる。"],exit:"編集画面で書いてみる →"},short:{title:"省いて書く",text:["時系列図と構成図と状態遷移図は、箱の宣言と段を省いて書ける。最初の行は図の種類の語だけでよく、箱どうしを `->` で結ぶ行を並べると、線 1 本が 1 段になり、書いた順に光る。","`box` の行を 1 つも書かない図は、線に出た名前を出た順に箱にする。`say` を書かない段は線の名前を段の本文にし、名前の無い線は箱の名前を「→」で結んだ字を出す。","1 字だけ違う名前の箱が出ると、書き間違いかもしれないと、図を描いたまま知らせる。箱に添え書きや色を付ける時と、段に題と本文を付ける時は `box` と `step` の行を書く。`box` を 1 つでも書いた図は、宣言の無い名前を誤りにする。"],exit:"編集画面で書いてみる →"},rules:{title:"決まり",text:["dragon記法は、どの行も次の決まり 4 つに従う。決まりを押さえておけば、初めて見る行も形から読める。",'下の例は 4 つの決まりを全部使う。区画を `group` と `end` で囲み、`,` を含む札の値を `"` で囲み、長い本文を `say` の下に字下げして続けている。'],exit:"続き → 箱"},boxes:{title:"箱",text:[...t("boxes","ja")],exit:"続き → 線"},edges:{title:"線",text:[...t("edges","ja")],exit:"続き → 区画"},regions:{title:"区画",text:[...t("regions","ja")],exit:"構成図の見本を見る →"},state:{title:"状態遷移図",text:["1 つの物が状態を移る様子を段ごとに追う時は、最初の行を `state <題>` にする。箱が状態になり、線は状態から状態への移り変わりになる。札が乗っている状態は光り、札が出た状態には済んだ印が残る。",...t("state","ja")],exit:"状態遷移図の見本を見る →"},git:{title:"枝分かれの図",text:["git の枝に commit を積み、取り込むまでを段ごとに追う時は、最初の行を `git <題>` にする。枝は `branch <枝> [note: <添え書き>]` の行で上から順に宣言し、枝ごとに帯が並ぶ。箱は無くてもよい。",...t("git","ja")],exit:"枝分かれの図の見本を見る →"},time:{title:"時間軸の図",text:[...t("time","ja"),"段の中では `now -> <目盛り>` で針を進める。針は目盛り 1 つを決まった速さで進み、過ぎた目盛りの印がその時に出るので、秒数は書かない。`mark <列> <範囲> [color: <色>]` は印の色を変え、`span <範囲>: <字>` は軸の下に範囲の括弧を出し、`[shape: box]` を付けると印の列を囲む枠になる。節目の状態は `note` で書き換え、節目どうしにも線を引ける。","中身の帯の欄の名前の後ろに `[meter: <割合>]` を付けると物差しになり、その割合の所に線を引く。`set <欄>: <割合>` を書いた段で、針と一緒に値まで満ちる。"],exit:"時間軸の図の見本を見る →"},tree:{title:"木の図",text:[...t("tree","ja"),"親子の箱どうしに `<子> -> <親> [tag: <値>]` の線を書くと、運ぶ物は木の線の上を走り、通った木の線はその色で残る。木の線を運ぶ物が通った段から後は、運ぶ物を送るか受けた箱だけを濃く出す。木の図では `group` を書けず、`box` で宣言した箱は木の右に並ぶ。"],exit:"木の図の見本を見る →"},lineup:{title:"列の図",text:[...t("lineup","ja"),"列に並ぶチップが段ごとに入れ替わる様子を追う時は、最初の行を `lineup <題>` にする。既定はボードの見た目で、`box <名札> as <名前>` の行が書いた順に左から淡い色の縦の帯になり、`item <名札>, <名札> [color: <色>, note: <説明>]` で宣言したチップが帯の中に札として上から積まれる。段の中の `line <列>: <チップ>, <チップ>` はその列のチップを書いた順に並べ、ほかの列に居たチップは滑って移る。`:` の後ろに何も書かない `line <列>:` は列を空にする。帯の見出しには名前と札の数が並び、`note <列>: <字>` は名前の下に値の札を出す。`pick` と `seal` と `open` と `stamp` は列を選び、封をし、封を外し、札を押す。","`box 作業中 [limit: 3]` のように箱に上限を書くと、札の数を `2/3` の形で出し、見出しの下に上限の数の目盛りを並べて札の数だけ塗る。チップが前の列へ戻る段は差し戻しになり、戻りの線と「差し戻し」の札を引き、元の列に抜けた跡を点線で残す。駅をつなぐ流れとして見せる時は、最初の行に `[shape: stations]` を足して `lineup <題> [shape: stations]` にする。箱は1本の線の上の駅になり、札は駅の下に積まれ、上限を書いた駅は空いた席を点線の受け口で示す。流れの線は `seal` と `open` と `pick` と `stamp` を描かないので、書くと断る。携帯の幅では、ボードは帯を上から積み、流れの線は線を縦に引く。","1件の頼みや取引が層を下りていく流れは、最初の行に `[shape: layers]` を足して `lineup <題> [shape: layers]` にする。箱は書いた順に上から横の帯になり、帯の左に層の名前と `note` の説明と層の番号が並ぶ。段の中の `line <層>: <チップ>` はチップの居る層を書き、チップの居る帯を最も濃く、通った帯を薄く光らせる。`note <層>: <字>` はその層の印で、層でした事や掛かった時間を書く。層は8つまで書け、層の間に矢印は描かない。層の見た目は `[order: none]` と `role` と `seal` と `open` と `pick` と `stamp` を描かないので、書くと断る。"],exit:"列の図の見本を見る →"},try:{title:"試す図",text:['読み手が値を打ち込み、釦を押して動かせる図にする時は、最初の行を `try <題>` にする。最初の段より前に部品の行を上から並べると、その順に上から積んで描く。`route <名札>: <節> - <節>, ... [from: <節>, to: <節>]` は網で、送ったチップを `from` から `to` まで最短の道で運ぶ。`queue <名札> [order: <欄>, accept: <名前>]` は待ち行列で、`order` の欄の値の高い順に上から並べる。`accept` を書くと、入力の帯はその名前のチップだけをこの待ち行列へ送れ、ほかの名前では送る釦を押せない。名前を 2 つ以上書く時は `accept: "<名前>, <名前>"` と囲み、最初の欄に `choose` の行を書いた時は `accept` の名前をその値から選ぶ。','`chain <名札> [edit: <欄>]` は機械の列で、ブロックは 1 つ前のブロックの `hash` を `prev` に持つ。`edit` を書くと、読み手はブロックの中のチップを押してその欄を書き換えられ、書き換えたブロックと次のブロックの間に食い違いの印 `≠` が出る。`log <名札> [all: <欄> = <値>, yes: <印>, no: <印>]` は記録の列で、釦がまとめたチップを番号の付いた記録に並べ、機械の列と違って `prev` と `hash` を持たない。`all` を書くと、記録の中のチップのその欄が全てその値なら `yes` の印を、1 つでも違えば `no` の印を記録に出す。`ask <欄>, <欄>, ... [into: <待ち行列か欄>, via: <網>]` は入力の帯で、最初の欄の値がチップの名前になる。`into` に欄を書くと、送ったチップはその欄の値と同じ名札の待ち行列へ入るので、その欄には `choose` の行を書き、`choose` の値ごとに同じ名札の待ち行列を置く。`choose <欄>: <値>, <値>, ...` を足すと、その欄は打たずに、書いた順に並ぶ値から選ぶ欄になり、ブロックの中のチップを書き換える欄も同じ値から選ぶ。`press <名札> [from: <待ち行列>, into: <機械の列か記録の列>, take: <件数>]` は釦で、`at: <部品>` を書くとその部品の所に置く。`from: "<待ち行列>, <待ち行列>"` と 2 つ以上の待ち行列を書くと、書いた順にそれぞれの上から `take` 件ずつを 1 つのブロックか記録にまとめ、どれかの待ち行列が `take` 件に満たない間は押せない。`side <部品>, <部品>, ...` を書くと、枠が広い時に網と待ち行列と機械の列と記録の列のうち書いた部品を、書いた順に左から 1 つの行に並べ、待ち行列はチップが入る幅だけを取る。枠の幅が足りず字が小さくなる時は、今どおり上から積む。',"`check <節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>]` は網の節の関門で、最初の段より前に書く。節は `ask` の `via` の網の最短の道の節で、送ったチップは着いた節の関門を書いた順に確かめ、条件が成り立たない最初の関門でその節に止まる。止まったチップはどの待ち行列にも入らず、`into` の記録の列 (`all` を持たない `log`) に、チップと止まった節と `no` のエラーの名前と再試行できるかを持つ記録が 1 件増える。比べ方は `>=`、`<=`、`>`、`<`、`==`、`!=` で、値が数なら欄の値も数として比べ、数でない欄の値は通らない。数でない値は `==` と `!=` で字として比べる。`retry` を書いた関門の記録には「再試行できる」の印が、書かない関門の記録には「直して送り直す」の印が付く。","チップは `item <名札> [<欄>: <値>]` で書く。段の中の `line` で待ち行列の並びとブロックを書き、`ask <値>, ...` と `press <名札>` と `item <名札> [<欄>: <値>]` で書き手の例 (送る、作る、書き換える) を書く。再生の部品は最初の段で止まって読み手を待ち、送るか押すか書き換えるたびに段を 1 つ足して流す。打ち込んだ値は保存しない。画像と動画と印刷には書き手の例の段を描く。"],exit:"試す図の見本を見る →"},chart:{title:"量の図",text:[...t("chart","ja")],exit:"量の図の見本を見る →"},flow:{title:"手順の図",text:[...t("flow","ja")],exit:"手順の図の見本を見る →"},cycle:{title:"回り続ける図",text:[...t("cycle","ja")],exit:"回り続ける図の見本を見る →"},mind:{title:"考えを広げる地図",text:[...t("mind","ja")],exit:"考えを広げる地図の見本を見る →"},er:{title:"表どうしの関係の図",text:[...t("er","ja")],exit:"表どうしの関係の図の見本を見る →"},matrix:{title:"2つの軸で置く図",text:[...t("matrix","ja")],exit:"2つの軸で置く図の見本を見る →"},venn:{title:"集合の重なりの図",text:[...t("venn","ja")],exit:"集合の重なりの図の見本を見る →"},sankey:{title:"量の行き先の図",text:[...t("sankey","ja")],exit:"量の行き先の図の見本を見る →"},pipe:{title:"配管の図",text:[...t("pipe","ja")],exit:"配管の図の見本を見る →"},extend:{title:"ブロックを足す",text:["dragon が持つブロックの他に、使う人が自分の手元でブロックを足せる。今の箱 (`box`)、線 (`edge`)、箱に付く印 (`icon`) のどれかを元にして、形と色の役を替えた物を足す。足したブロックは元の置き場所と動きのまま描かれ、色を色味の表から読むので、他のブロックと同じ見た目に揃う。","定義は図の頭に、`blocks 1` の行の後へ `block +<名前>` から `end` までを書く。`base` に元を、`shape` に形を、`color` に色の役を書く。形は名前の付いた形 (箱は `round`、`circle`、`cylinder`、`diamond`、`hexagon`、線は `solid`、`dashed`、`dotted`) か、path の文法だけで書いた `path` にする。図では、箱の行の `box` と線の行の `->` の代わりに `+<名前>` を書き、印は `[icon: +<名前>]` と書く。箱を元にした定義は `icon` の行に箱の絵柄も書ける。書ける名前は箱の行の `icon:` と同じ (手描きの絵柄か `tabler:<名前>`) で、箱の行に書いた絵柄が勝つ。",'同じブロックを複数の図で使う時は、定義を 1 つの file に置く。頁で描く時は `<link rel="dragon-blocks">` でその file を指すと、頁の全ての図がその定義を読む。',"code で描く時は `readBlocks` で定義を読み、`parseNotation` と `renderDiagram` の `blocks` に渡す。定義は字のデータだけで、URL や code や SVG の要素を書くと誤りで断るので、他の人が書いた定義を読んでも何も実行されない。"],exit:"編集画面で書いてみる →"},steps:{title:"段",text:[...t("steps","ja")],exit:"続き → 帯"},strip:{title:"帯",text:[...t("strip","ja")],exit:"時系列図の見本を見る →"},carry:{title:"運ぶ物",text:[...t("carry","ja")],exit:"続き → JSON"},json:{title:"JSON",text:["記法と JSON は行き来できる。人は記法で書き、道具や AI は JSON (原本) で持つ。下の例は 5 分で動かすの節の図を JSON で書いた物で、図はその JSON をそのまま読んで描いている。","JSON は `version` に形式の版を持ち、古い版は読む時に今の形へ直す。形は package の `src/schemas/diagram.schema.json` が持つ。","`parseNotation` は記法を JSON に、`printNotation` は JSON を記法に直し、`readDiagram` は JSON を確かめて読む。JSON から記法へ書き戻すと決まった並べ方に整うので、書き手の行の並べ方と `//` で始まる注釈の行は残らない。"],exit:"編集画面で JSON を取り込む →"},place:{title:"頁に置く",text:["自分の頁に図を置く時は、頁で 1 度だけ字の入口 `@cardenelabs/dragon/fonts` を import し、記法を読んだ原本を `mountDiagram` に渡す。下の例は package の README と同じ物。","字の入口は、同梱の 2 つの字 (Noto Sans JP と JetBrains Mono) の CSS を読み込むだけで、何も出さない。図は同梱の字で測った字の幅で組むため、読み込まないと端末の字で描かれ、札から字がはみ出すことがある。CSS と字の file は、束ねる道具 (Vite など) が頁へ運ぶ。","`mountDiagram` が返す `player` で段を動かす (`next`、`prev`、`play`、`pause`、`destroy`)。3 つめの引数には、色味や段が替わった時に呼ぶ関数などの設定 (`PlayerOptions`) を渡す。"],exit:"続き → 書き出し"},export:{title:"書き出し",text:["同じ原本から、mp4、GIF、HTML、PNG を書き出せる。package を入れると `dragon` の命令が使える。","書き出しは画面なしの Chromium で、頁と同じ描画を 1 コマずつ撮る。Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。","原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。PNG は最後の段の止め絵になる。"],exit:"編集画面から書き出す →"},line:{title:"線の描き方",text:["図の線は、定規で引いたまっすぐな線 (`ruler`、既定) か、手で引いたようにゆるく揺れるペンの線 (`pen`) で描ける。線の描き方は色味と同じく描く時に選び、記法には書かない。","手描きの線は、箱の縁と線と矢印と段の番号の輪を揺れる線で描く。絵柄と字と図の地の枠はそのまま描き、線の端と折れ目と尖った角は元の位置に残すので、矢じりの先は箱に着いたまま。同じ図は何度描いても同じ形に揺れる。下の図は手描きの線で描いた見本。",'書き出しの命令では `--line pen`、頁に置く時は `mountDiagram` の 3 つめの引数に `line: "pen"` を渡す。編集画面では、図の上の帯の色味の丸の隣の釦で選ぶ。'],exit:"編集画面で手描きを選ぶ →"},migrate:{title:"前の形から書き直す",text:["前の形の記法 (`時系列図` か `構成図` で始まり、段を `#` で区切る形) は読めなくなった。前の形の行を読むと、その行の新しい形を示す誤りで止まる。","前の形を新しい形へ移す命令は無いので、下の表を見て行ごとに書き直す。左が前の形、右が新しい形になる。"],exit:"編集画面で書き直す →"}},cards:{start:"導入なし。編集画面を開いて書くだけで図が動く。",boxes:"名前と下の字と色と印で、登場する物を描く。",regions:"構成図の箱を、持ち主ごとの区画に分けて置く。",steps:"図は段ごとに進み、本文がその段の動きを語る。",json:"人は記法で、道具は JSON で、同じ図を持つ。",export:"同じ図を mp4、GIF、HTML、PNG に書き出す。"},options:{head:["設定","意味"],rows:(n,s)=>[["--out <dir>","書き出す先。無ければ作る (既定は今の dir)"],["--width <px>","枠の幅。見せ方 (`fixed` / `follow`) を選び、`follow` の時の窓の幅になる"],["--palette <名前>",`色味 (${n}、既定は \`${s}\`)`],["--line <名前>","線の描き方 (`ruler` / `pen`、既定は `ruler`)。`pen` は手描きのペンの線で描く"],["--theme <明暗>","`light` か `dark`"],["--lang <言葉>","図の中の字と命令の文の言葉 (`ja` か `en`)。無ければ、図の中の字は図の題か `say` に日本語の字があれば `ja`、無ければ `en` で、命令の文は `en`"],["--fps <数>","mp4 の 1 秒のコマの数 (既定 30)"],["--gif-fps <数>","GIF の 1 秒のコマの数 (既定 10)"],["--format <形>","書き出す形を `,` で区切る (既定 `mp4,gif,html,png`)"],["--step <段>","PNG に撮る段 (1 から数える。既定は最後の段)"],["--blocks <file>","足したブロックの定義の file。その定義で図を描き、HTML にも定義を入れる"]]},rules:["行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる","鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる",'空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む',"入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする"],migration:{head:["前の形","新しい形"],rows:[["`時系列図 <題>`","`sequence <題>`"],["`構成図 <題>`","`architecture <題>`"],["`見せ方 止める`、`見せ方 寄る`","`sequence <題> [view: fixed]`、`sequence <題> [view: follow]`"],["`区画 <名札> = <名前>「<添え書き>」`","`group <名札> as <名前> [note: <添え書き>]` から `end` まで"],["箱の行の `[区画 <名札>]`","`group <名札>` と `end` の間に `box` の行を書く"],["`<名札> = <名前>「<下の字>」`","`box <名札> as <名前> [note: <下の字>]`"],["`[色 <色>]`、`[印 <印>]`","`box <名札> [color: <色>, icon: <印>]`"],["`帯 <題> = <欄>, <欄>`","`strip <題>: <欄>, <欄>`"],["`# <題>`","`step <題>`"],["`> <本文>`","`say <本文>`"],["バッククォートで囲んだ行","`code <命令>`"],["`<名札> -> <名札> : <線の名前>`","`<名札> -> <名札>: <線の名前>`"],["`[札 <値>]`、`[硬貨]`、`[なし]`","`<名札> -> <名札> [tag: <値>]`、`<名札> -> <名札> [carry: coin]`、`<名札> -> <名札> [carry: none]`"],["`[名前 上]`","`<名札> -> <名札> [side: above]`"],["`[名前 下]`","`<名札> -> <名札> [side: below]`"],["`[名前 左]`","`<名札> -> <名札> [side: left]`"],["`[名前 右]`","`<名札> -> <名札> [side: right]`"],["`<名札> : <処理の名前>`","`act <名札>: <処理の名前>`"],["`<名札>「<字>」`","`note <名札>: <字>`"],["`帯 <欄> = <値>`","`set <欄>: <値>`"],["`帯 <欄> [<札>]`","`set <欄> [tag: <札>]`"]]}},en:{eyebrow:n=>`guide • ${n}`,lead:"One page that lays out how to write dragon notation. Get a diagram moving in the first five minutes, see the short form that leaves out declarations and steps, learn the four rules, then take in the parts of the notation in order: boxes, lines, regions, state diagrams, git graphs, time diagrams, tree diagrams, lineup diagrams, try diagrams, charts, flow diagrams, cycle diagrams, mind maps, table relation diagrams, two-axis matrices, set overlap diagrams, Sankey diagrams, pipe diagrams, steps, the strip and what travels, and how to add your own blocks. Going between the notation and JSON, exporting to mp4 or GIF, and a table for rewriting the old form are covered here too.",start:"Start in five minutes →",browse:"Browse the catalog",iconLink:"See every icon on the Icon part page →",sections:{start:{title:"Up and running in five minutes",text:["To try it without installing anything, open the editor. Write notation in the box on the left and a moving diagram appears on the right as you type.","The first word of each line says what the line holds. The first line gives the diagram kind and title: `sequence` draws boxes exchanging messages in time order, and `architecture` draws how boxes placed in regions connect.","Then list the boxes that take part with `box` lines, and indented under a `step` line, write what happens in that step in the order it happens. The example below has two boxes and one step."],exit:"Write one in the editor →"},short:{title:"Leave things out",text:["Sequence, architecture and state diagrams can leave out the box declarations and the steps. The first line can be just the diagram kind, and when you list lines joining boxes with `->`, each line becomes one step that lights up in the order written.","A diagram with no `box` line makes a box of each name on the lines, in the order the names appear. A step without `say` uses the line label as its body, and a line without a label shows the box names joined by an arrow.","When two box names differ by one character, the editor and the export command point it out as a possible typo and still draw the diagram. Write `box` and `step` lines when a box needs a caption or a color, or a step needs a title and a body. Once a diagram has one `box` line, a name that is not declared is an error."],exit:"Write one in the editor →"},rules:{title:"Rules",text:["Every line of dragon notation follows the four rules below. Once you know them, you can read a line you have not seen before from its shape.",'The example below uses all four rules. It wraps the regions in `group` and `end`, wraps a tag value that contains `,` in `"`, and continues a long body indented under `say`.'],exit:"Next → Boxes"},boxes:{title:"Boxes",text:[...t("boxes","en")],exit:"Next → Lines"},edges:{title:"Lines",text:[...t("edges","en")],exit:"Next → Regions"},regions:{title:"Regions",text:[...t("regions","en")],exit:"See the architecture samples →"},state:{title:"State diagrams",text:["To follow one thing as it moves between states step by step, start the first line with `state <title>`. Each box is a state, and each line is a move from one state to another. The state the tag sits on lights up, and a state the tag has left keeps a done mark.",...t("state","en")],exit:"See the state diagram samples →"},git:{title:"Git graphs",text:["To follow commits on git branches step by step until they are merged, start the first line with `git <title>`. Declare branches from top to bottom with `branch <branch> [note: <note>]` lines, and each branch gets its own band. Boxes are optional.",...t("git","en")],exit:"See the git graph samples →"},time:{title:"Time diagrams",text:[...t("time","en"),"Inside a step, `now -> <tick>` moves the needle. The needle moves one tick at a fixed speed and the marks it passes appear as it goes, so no seconds are written. `mark <row> <range> [color: <color>]` recolors marks, `span <range>: <text>` puts a bracket under the axis, and `[shape: box]` turns it into a frame around the rows. `note` rewrites the state of a point, and lines can join points too.","Add `[meter: <ratio>]` after the name of a strip field to make it a meter with a line at that ratio. In a step with `set <field>: <ratio>`, it fills up to the value along with the needle."],exit:"See the time diagram samples →"},tree:{title:"Tree diagrams",text:[...t("tree","en"),"A line `<child> -> <parent> [tag: <value>]` between a parent and a child sends its carrier along the tree line, and the tree line keeps that color once passed. From the step where a carrier first runs a tree line, only the boxes that have sent or received a carrier stay strong. A tree diagram takes no `group`, and boxes declared with `box` sit to the right of the tree."],exit:"See the tree diagram samples →"},lineup:{title:"Lineup diagrams",text:[...t("lineup","en"),"To follow chips that line up in lanes and change places step by step, start the first line with `lineup <title>`. By default it uses the board look: each `box <id> as <name>` line becomes a pale vertical column from left to right in the written order, and the chips declared with `item <id>, <id> [color: <color>, note: <note>]` stack in the columns as cards from the top. Inside a step, `line <lane>: <chip>, <chip>` sets the chips of that lane in the written order, and a chip that was in another lane slides over. `line <lane>:` with nothing after the `:` empties the lane. The column head shows the name and the number of cards, and `note <lane>: <text>` shows a value chip under the name. `pick`, `seal`, `open`, and `stamp` pick a lane, seal it, take the seal off, and land a stamp on it.",'Write a limit on a box, as in `box Doing [limit: 3]`, to show the count as `2/3` and to put that many ticks under the head, filled for each card. When a chip moves back to an earlier lane, the step is a send-back: a return line and a "Sent back" label are drawn, and a dashed trace stays in the lane it left. To show the lanes as stops on a flow, add `[shape: stations]` to the first line: `lineup <title> [shape: stations]`. The boxes become stops on one line, the cards stack under each stop, and a stop with a limit shows its free seats as dashed slots. The stations look refuses `seal`, `open`, `pick`, and `stamp`, because it does not draw them. On a phone-width frame, the board stacks its columns from the top and the stations line runs down.',"For one request or transaction going down through layers, add `[shape: layers]` to the first line: `lineup <title> [shape: layers]`. The boxes become horizontal bands from top to bottom in the written order, and the left of each band shows the layer's name, its `note`, and its number. Inside a step, `line <layer>: <chip>` writes the layer the chip is in, drawing that band strongest and the bands it has passed lighter. `note <layer>: <text>` is the mark of that layer, such as what it did and how long it took. A layers lineup takes up to 8 layers and draws no arrows between them. It refuses `[order: none]`, `role`, `seal`, `open`, `pick`, and `stamp`, because the layers look does not draw them."],exit:"See the lineup samples →"},try:{title:"Try diagrams",text:['To make a figure readers move themselves by typing values and pressing buttons, start the first line with `try <title>`. Write the part lines before the first step, from top to bottom, and they are stacked in that order. `route <name>: <node> - <node>, ... [from: <node>, to: <node>]` is a network that carries a sent chip from `from` to `to` along the shortest path. `queue <name> [order: <field>, accept: <name>]` is a waiting line that sorts chips from the highest value of the `order` field. With `accept`, the input strip sends only chips with those names into the queue, and the send button cannot be pressed for any other name. Wrap two or more names as `accept: "<name>, <name>"`, and when the first field has a `choose` line, take the names in `accept` from its choices.',"`chain <name> [edit: <field>]` is a chain of blocks, and each block holds the previous block's `hash` as `prev`. With `edit`, the reader taps a chip inside a block to change that field, and the mismatch mark `≠` appears between the changed block and the next one. `log <name> [all: <field> = <value>, yes: <mark>, no: <mark>]` is a log that lists the chips a button gathers as numbered records, and unlike a chain a record has no `prev` or `hash`. With `all`, a record shows the `yes` mark when that field of every chip in it has the value, and the `no` mark when even one differs. `ask <field>, <field>, ... [into: <queue or field>, via: <route>]` is the input strip, and the first field's value becomes the chip's name. When `into` names a field, a sent chip enters the queue whose name matches that field's value, so give that field a `choose` line and place a queue named after each choice. Add `choose <field>: <value>, <value>, ...` and that field becomes a pick from the choices in the written order instead of typing, and changing that field of a chip inside a block picks from the same choices. `press <name> [from: <queue>, into: <chain or log>, take: <count>]` is a button, and `at: <part>` places it on that part. Write two or more queues as `from: \"<queue>, <queue>\"` and it gathers the top `take` chips of each, in the written order, into one block or record, and cannot be pressed while any of those queues holds fewer than `take`. Write `side <part>, <part>, ...` and the named route, queue, chain, and log parts sit on one row, left to right in the written order, when the frame is wide, with the queue taking only the width its chips need. When the frame is too narrow for readable text, they stack from the top as before.","`check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]` is a gate on a route node, written before the first step. The node is on the shortest path of the route that `ask` sends through (`via`). A sent chip checks the gates of each node it reaches in the written order, and stops at that node on the first gate whose condition does not hold. A stopped chip enters no queue, and the `into` log (a `log` without `all`) gains one record with the chip, the node, the `no` error and whether it can be retried. The op is `>=`, `<=`, `>`, `<`, `==` or `!=`. When the value is a number, the field is compared as a number and a field that is not a number does not pass. A value that is not a number is compared as text with `==` and `!=`. Records of a gate with `retry` are marked retryable, and those of a gate without it are marked fix and resend.","Declare chips with `item <name> [<field>: <value>]`. Inside a step, `line` writes a queue's contents or a block, and `ask <value>, ...`, `press <name>`, and `item <name> [<field>: <value>]` write the author's example (send, build, change). The player stops at the first step and waits for the reader, and adds one step and plays it each time the reader sends, presses, or changes a value. Nothing the reader types is stored. Images, videos, and print draw the author's example steps."],exit:"See the try diagram samples →"},chart:{title:"Charts",text:[...t("chart","en")],exit:"See the chart samples →"},flow:{title:"Flow diagrams",text:[...t("flow","en")],exit:"See the flow diagram samples →"},cycle:{title:"Cycle diagrams",text:[...t("cycle","en")],exit:"See the cycle diagram samples →"},mind:{title:"Mind maps",text:[...t("mind","en")],exit:"See the mind map samples →"},er:{title:"Table relation diagrams",text:[...t("er","en")],exit:"See the table relation diagram samples →"},matrix:{title:"Two-axis matrices",text:[...t("matrix","en")],exit:"See the two-axis matrix samples →"},venn:{title:"Set overlap diagrams",text:[...t("venn","en")],exit:"See the set overlap diagram samples →"},sankey:{title:"Sankey diagrams",text:[...t("sankey","en")],exit:"See the Sankey diagram samples →"},pipe:{title:"Pipe diagrams",text:[...t("pipe","en")],exit:"See the pipe diagram samples →"},extend:{title:"Adding blocks",text:["Besides the blocks dragon has, you can add your own blocks in your own project. Base one on a box (`box`), a line (`edge`), or an icon on a box (`icon`), and change its shape and color role. An added block is drawn with the placement and motion of its base and reads its colors from the palette table, so it looks like every other block.","Write the definitions at the head of a diagram, after a `blocks 1` line, each from `block +<name>` to `end`. Write the base after `base`, the shape after `shape`, and the color role after `color`. A shape is a named shape (`round`, `circle`, `cylinder`, `diamond`, `hexagon` for boxes, `solid`, `dashed`, `dotted` for lines) or a `path` of path syntax only. In the diagram, write `+<name>` in place of `box` on a box line and in place of `->` on a line, and write an icon as `[icon: +<name>]`. A definition based on a box can also give its boxes an icon on an `icon` line. It takes the same names as `icon:` on a box line (a hand-drawn icon or `tabler:<name>`), and an icon written on the box line wins.",'To use the same blocks in several diagrams, keep the definitions in one file. On a page, point `<link rel="dragon-blocks">` at that file, and every diagram on the page reads them.',"In code, read the definitions with `readBlocks` and pass them as the `blocks` option of `parseNotation` and `renderDiagram`. A definition is data only, and one with URLs, code, or SVG elements is refused, so reading a definition someone else wrote runs nothing."],exit:"Write one in the editor →"},steps:{title:"Steps",text:[...t("steps","en")],exit:"Next → The strip"},strip:{title:"The strip",text:[...t("strip","en")],exit:"See the sequence samples →"},carry:{title:"What travels",text:[...t("carry","en")],exit:"Next → JSON"},json:{title:"JSON",text:["The notation and JSON convert both ways. People write the notation, and tools and AI keep the JSON (the source). The example below is the diagram from the five-minute section written as JSON, and the diagram is drawn by reading that JSON as it is.","The JSON holds the format version in `version`, and older versions are converted to the current shape when read. The shape is defined in the package's `src/schemas/diagram.schema.json`.","`parseNotation` turns the notation into JSON, `printNotation` turns JSON back into the notation, and `readDiagram` checks and reads JSON. Writing JSON back as notation uses a fixed layout, so the writer's line order and the comment lines that start with `//` are not kept."],exit:"Import JSON in the editor →"},place:{title:"Placing on a page",text:["To place a diagram on your own page, import the font entry `@cardenelabs/dragon/fonts` once on the page, and pass the source read from the notation to `mountDiagram`. The example below is the same as in the package README.","The font entry only loads the CSS for the two bundled fonts (Noto Sans JP and JetBrains Mono) and exports nothing. Diagrams are laid out with character widths measured from the bundled fonts, so without it they are drawn in the device's fonts and text can overflow its labels. A bundler (such as Vite) carries the CSS and font files to the page.","Use the `player` returned by `mountDiagram` to move through the steps (`next`, `prev`, `play`, `pause`, `destroy`). The third argument takes settings such as the palette and a function called when the step changes (`PlayerOptions`)."],exit:"Next → Export"},export:{title:"Export",text:["The same source can be exported to mp4, GIF, HTML and PNG. Install the package and the `dragon` command is available.","Export uses a headless Chromium and captures the same drawing as the page one frame at a time. Install `playwright-core`, which runs Chromium, only when you use export.","Pass the source JSON (`.json`) or the notation (`.dragon`) and it writes four files with the same name. The PNG is a still of the last step."],exit:"Export from the editor →"},line:{title:"How lines are drawn",text:["Lines can be drawn straight, as with a ruler (`ruler`, the default), or as gently wobbling pen lines, as if drawn by hand (`pen`). Pick how lines are drawn when drawing, as with the palette; the notation does not say it.","Pen lines draw box edges, lines, arrows and step number rings as wobbling lines. Icons, text and the diagram frame stay as they are, and line ends, bends and sharp corners stay where they were, so arrow tips still touch their boxes. The same diagram wobbles the same way every time it is drawn. The diagram below is drawn with pen lines.",'Pass `--line pen` to the export command, or `line: "pen"` in the third argument of `mountDiagram` on your page. In the editor, pick it with the buttons next to the palette dots above the diagram.'],exit:"Pick pen lines in the editor →"},migrate:{title:"Rewriting the old form",text:["The old form of the notation (steps separated by `#`, bodies starting with `>`, and the same lines in Japanese words) is no longer read. Reading an old line stops with an error that shows the new form of that line.","There is no command that moves the old form to the new one, so rewrite each line with the table below. The left column is the old form with English words, and the right column is the new form."],exit:"Rewrite in the editor →"}},cards:{start:"Nothing to set up. Open the editor and write.",boxes:"Draw what takes part with a name, a caption, a colour and an icon.",regions:"Put the boxes of an architecture diagram in regions by owner.",steps:"The diagram moves step by step, and the body tells what each step does.",json:"People keep the notation, and tools keep the same diagram as JSON.",export:"Export the same diagram to mp4, GIF, HTML and PNG."},options:{head:["Option","Meaning"],rows:(n,s)=>[["--out <dir>","Where to write. Created if missing (default: the current dir)"],["--width <px>","Frame width. Picks the view (`fixed` / `follow`) and sets the window width for `follow`"],["--palette <name>",`Colours (${n}, default \`${s}\`)`],["--line <name>","How lines are drawn (`ruler` / `pen`, default `ruler`). `pen` draws hand-drawn pen lines"],["--theme <mode>","`light` or `dark`"],["--lang <lang>","Language of the diagram text and command messages (`ja` or `en`). Without it, the diagram text is `ja` when the title or a `say` line has kana or kanji and `en` otherwise, and the messages are `en`"],["--fps <n>","Frames per second of the mp4 (default 30)"],["--gif-fps <n>","Frames per second of the GIF (default 10)"],["--format <list>","Formats to write, separated by `,` (default `mp4,gif,html,png`)"],["--step <n>","Step the PNG shows (counted from 1, default: the last step)"],["--blocks <file>","A file of block definitions. The diagram is drawn with them, and the HTML carries them"]]},rules:["The first English word of a line decides its kind. Only arrow lines start with a box id","A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`",'Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`',"The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`"],migration:{head:["Old form","New form"],rows:[["`sequence <title>`, `architecture <title>`","`sequence <title>`, `architecture <title>` (unchanged)"],["`view fixed`, `view follow`","`sequence <title> [view: fixed]`, `sequence <title> [view: follow]`"],['`region <id> = <name> "<note>"`',"`group <id> as <name> [note: <note>]` through `end`"],["`[region <id>]` on a box line","`box` lines between `group <id>` and `end`"],['`<id> = <name> "<caption>"`',"`box <id> as <name> [note: <caption>]`"],["`[color <color>]`, `[icon <icon>]`","`box <id> [color: <color>, icon: <icon>]`"],["`strip <title> = <field>, <field>`","`strip <title>: <field>, <field>`"],["`# <heading>`","`step <heading>`"],["`> <body>`","`say <body>`"],["A line wrapped in backticks","`code <command>`"],["`<id> -> <id> : <label>`","`<id> -> <id>: <label>`"],["`[tag <value>]`, `[coin]`, `[none]`","`<id> -> <id> [tag: <value>]`, `<id> -> <id> [carry: coin]`, `<id> -> <id> [carry: none]`"],["`[label above]`","`<id> -> <id> [side: above]`"],["`[label below]`","`<id> -> <id> [side: below]`"],["`[label left]`","`<id> -> <id> [side: left]`"],["`[label right]`","`<id> -> <id> [side: right]`"],["`<id> : <action>`","`act <id>: <action>`"],['`<id> "<text>"`',"`note <id>: <text>`"],["`strip <field> = <value>`","`set <field>: <value>`"],["`strip <field> [<tag>]`","`set <field> [tag: <tag>]`"]]}}},Rt=Object.assign({"./examples/boxes.dragon":C,"./examples/boxes.en.dragon":E,"./examples/carry.dragon":N,"./examples/carry.en.dragon":D,"./examples/chart.dragon":$,"./examples/chart.en.dragon":O,"./examples/cycle.dragon":P,"./examples/cycle.en.dragon":W,"./examples/edges.dragon":q,"./examples/edges.en.dragon":H,"./examples/er.dragon":I,"./examples/er.en.dragon":F,"./examples/extend.dragon":L,"./examples/extend.en.dragon":U,"./examples/flow.dragon":M,"./examples/flow.en.dragon":B,"./examples/git.dragon":J,"./examples/git.en.dragon":R,"./examples/json.en.json":G,"./examples/json.json":z,"./examples/line.dragon":V,"./examples/line.en.dragon":K,"./examples/lineup.dragon":Y,"./examples/lineup.en.dragon":X,"./examples/matrix.dragon":Q,"./examples/matrix.en.dragon":Z,"./examples/mind.dragon":ee,"./examples/mind.en.dragon":te,"./examples/pipe.dragon":ne,"./examples/pipe.en.dragon":ae,"./examples/regions.dragon":oe,"./examples/regions.en.dragon":se,"./examples/rules.dragon":ie,"./examples/rules.en.dragon":re,"./examples/sankey.dragon":he,"./examples/sankey.en.dragon":de,"./examples/short.dragon":le,"./examples/short.en.dragon":ce,"./examples/start.dragon":pe,"./examples/start.en.dragon":me,"./examples/state.dragon":ue,"./examples/state.en.dragon":ge,"./examples/steps.dragon":be,"./examples/steps.en.dragon":fe,"./examples/strip.dragon":we,"./examples/strip.en.dragon":xe,"./examples/time.dragon":ye,"./examples/time.en.dragon":ke,"./examples/tree.dragon":ve,"./examples/tree.en.dragon":_e,"./examples/try.dragon":Te,"./examples/try.en.dragon":Se,"./examples/venn.dragon":je,"./examples/venn.en.dragon":Ae});function Gt(n,s){return Rt[`./examples/${n}${s==="en"?".en":""}.${n==="json"?"json":"dragon"}`]?.trimEnd()}function l(n){return n.split("`").map((s,r)=>e.jsx(g.Fragment,{children:r%2===1?e.jsx("code",{children:s}):s},r))}function zt(n){return"section"in n?`#${n.section}`:"kind"in n?`${c.catalog}/${n.kind}`:c[n.screen]}function y({head:n,rows:s,docs:r}){return e.jsxs("table",{className:"docs-options","data-docs":r,children:[e.jsx("thead",{children:e.jsx("tr",{children:n.map(o=>e.jsx("th",{children:o},o))})}),e.jsx("tbody",{children:s.map(([o,a],h)=>e.jsxs("tr",{children:[e.jsx("td",{children:o}),e.jsx("td",{children:a})]},h))})]})}function Vt({id:n,index:s,lang:r,theme:o,palette:a}){const h=p[r].sections[n],u=Gt(n,r),b=Jt[n]??[],f=Bt[n],{options:w,rules:k,migration:x}=p[r];return e.jsxs("section",{id:n,className:"docs-sec","data-docs":"section",children:[e.jsxs("div",{className:"docs-sec-head",children:[e.jsx("span",{className:"docs-sec-no","data-docs":"section-no",children:String(s+1).padStart(2,"0")}),e.jsx("h2",{children:h.title})]}),h.text.map((i,d)=>e.jsxs(g.Fragment,{children:[e.jsx("p",{className:"docs-sec-text","data-docs":"text",children:l(i)}),b[d]!=null&&e.jsx("pre",{className:"docs-command","data-docs":"command",children:e.jsx("code",{children:b[d]})})]},i)),n==="boxes"&&e.jsx("a",{className:"docs-sec-cta","data-docs":"icon-link",href:`${c.catalog}/part/icon`,onClick:i=>m(i),children:p[r].iconLink}),n==="rules"&&e.jsx("ol",{className:"docs-rules","data-docs":"rules",children:k.map(i=>e.jsx("li",{"data-docs":"rule",children:l(i)},i))}),u!==void 0&&e.jsxs("div",{className:"docs-example","data-docs":"example",children:[e.jsx("pre",{className:"docs-example-code","data-docs":"example-code",children:e.jsx("code",{children:u})}),e.jsx(S,{className:"docs-example-figure",notation:u,json:n==="json",lang:r,theme:o,palette:a,...n==="line"?{line:"pen"}:{},whole:!0})]}),n==="export"&&e.jsx(y,{head:w.head,rows:w.rows(Object.keys(j).map(i=>`\`${i}\``).join(" / "),A).map(([i,d])=>[e.jsx("code",{children:i},"option"),l(d)])}),n==="migrate"&&e.jsx(y,{head:x.head,rows:x.rows.map(([i,d])=>[l(i),l(d)]),docs:"migration"}),e.jsx("a",{className:"docs-sec-cta","data-docs":"section-cta",href:zt(f),onClick:"section"in f?void 0:i=>m(i),children:h.exit})]})}function Yt({lang:n,theme:s,palette:r}){const o=p[n];return g.useEffect(()=>{const a=decodeURIComponent(location.hash.slice(1));a!==""&&document.getElementById(a)?.scrollIntoView()},[]),e.jsxs("div",{className:"docs",children:[e.jsxs("section",{className:"docs-hero","data-docs":"hero",children:[e.jsx("div",{className:"docs-eyebrow","data-docs":"eyebrow",children:o.eyebrow(_)}),e.jsx("h1",{children:T[n].site.screens.docs.title}),e.jsx("p",{className:"docs-lead","data-docs":"lead",children:o.lead}),e.jsxs("div",{className:"docs-cta","data-docs":"cta",children:[e.jsx("a",{className:"docs-btn-primary",href:c.editor,onClick:a=>m(a),children:o.start}),e.jsx("a",{className:"docs-btn-secondary",href:c.catalog,onClick:a=>m(a),children:o.browse})]})]}),e.jsx("nav",{className:"docs-features","data-docs":"features",children:Mt.map(a=>e.jsxs("a",{className:"docs-card","data-docs":"card",href:`#${a}`,children:[e.jsx("span",{className:"docs-card-icon","data-icon":a,"aria-hidden":"true"}),e.jsx("span",{className:"docs-card-name","data-docs":"card-name",children:o.sections[a].title}),e.jsx("p",{children:o.cards[a]})]},a))}),e.jsx("div",{className:"docs-sections",children:Ut.map((a,h)=>e.jsx(Vt,{id:a,index:h,lang:n,theme:s,palette:r},a))})]})}export{Yt as Docs};
