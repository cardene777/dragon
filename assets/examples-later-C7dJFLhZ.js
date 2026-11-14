const o=`checkout acp as 速達で予算を超える購入 [version: 1, note: 配送や数量を変えて、最新の購入条件を承認してみてください。]

// 注文フローの4者。商品や配送とは独立したブロック。
party buyer as あなた [role: buyer, note: 購入の判断, icon: user]
party agent as エージェント [role: agent, note: 情報をつなぐ, icon: agent]
party seller as 販売事業者 [role: seller, note: 条件と注文, icon: shop]
party processor as 決済事業者 [role: payment, note: 支払いの処理, icon: card]
flow orders as 注文フロー [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]

// 商品・数量と配送の選択肢。
product shoes as 白いランニングシューズ [price: 18000, min: 1, max: 3, initial: 1, unit: 足, merchant: シューズ店A, art: shoe]
delivery shipping as 配送方法を変える [initial: express]
option express as 速達 [for: shipping, fee: 2500, note: 早さを優先, icon: bolt]
option standard as 通常配送 [for: shipping, fee: 1000, note: 送料を抑える, icon: truck]
option pickup as 店頭受取 [for: shipping, fee: 0, note: 配送しない, icon: bag]

// 合計と承認。値を変えると total を再計算し、古い承認を無効にする。
budget spending as 送料込みの予算 [min: 15000, max: 60000, step: 500, initial: 20000]
total quote as 販売事業者が返した合計 [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as 最新条件の承認 [total: quote, invalidates: "quantity, delivery"]

// 支払いの上限は予算ではなく承認額。応答不達でも注文と決済を重複させない。
payment delegated as この購入に限った支払い [approval: consent, limit: approved-total]
order result as 注文 [payment: delegated, policy: once]

// ヘッダーで選ぶケース。固定の段階再生ではなく購入操作の結果を分岐する。
scenario normal as 通常の購入 [outcome: normal]
scenario declined as 決済拒否 [outcome: decline]
scenario missing as 応答不達 [outcome: lost]
`,s=`checkout acp as "Express delivery exceeds the budget" [version: 1, note: "Change delivery or quantity, then approve the latest quote."]
party buyer as "You" [role: buyer, note: "Purchase decision", icon: user]
party agent as "Agent" [role: agent, note: "Connect information", icon: agent]
party seller as "Merchant" [role: seller, note: "Terms and orders", icon: shop]
party processor as "Payment provider" [role: payment, note: "Process payment", icon: card]
flow orders as "Order flow" [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]
product shoes as "Running shoes" [price: 18000, min: 1, max: 3, initial: 1, unit: items, merchant: "Example shop", art: shoe]
delivery shipping as "Delivery" [initial: express]
option express as "Express" [for: shipping, fee: 2500, note: "Faster delivery", icon: bolt]
option standard as "Standard" [for: shipping, fee: 1000, note: "Lower delivery fee", icon: truck]
option pickup as "Pickup" [for: shipping, fee: 0, note: "No delivery", icon: bag]
budget spending as "Budget including delivery" [min: 15000, max: 60000, step: 500, initial: 20000]
total quote as "Merchant total" [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as "Approve latest terms" [total: quote, invalidates: "quantity, delivery"]
payment delegated as "Payment for this purchase" [approval: consent, limit: approved-total]
order result as "Order" [payment: delegated, policy: once]
scenario normal as "Normal purchase" [outcome: normal]
scenario declined as "Payment declined" [outcome: decline]
scenario missing as "Lost response" [outcome: lost]
`,a=`checkout acp as 通常配送の購入条件を承認する [version: 1, note: 配送や数量を変えて、最新の購入条件を承認してみてください。]

// 注文フローの4者。商品や配送とは独立したブロック。
party buyer as あなた [role: buyer, note: 購入の判断, icon: user]
party agent as エージェント [role: agent, note: 情報をつなぐ, icon: agent]
party seller as 販売事業者 [role: seller, note: 条件と注文, icon: shop]
party processor as 決済事業者 [role: payment, note: 支払いの処理, icon: card]
flow orders as 注文フロー [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]

// 商品・数量と配送の選択肢。
product shoes as 白いランニングシューズ [price: 18000, min: 1, max: 3, initial: 1, unit: 足, merchant: シューズ店A, art: shoe]
delivery shipping as 配送方法を変える [initial: standard]
option express as 速達 [for: shipping, fee: 2500, note: 早さを優先, icon: bolt]
option standard as 通常配送 [for: shipping, fee: 1000, note: 送料を抑える, icon: truck]
option pickup as 店頭受取 [for: shipping, fee: 0, note: 配送しない, icon: bag]

// 合計と承認。値を変えると total を再計算し、古い承認を無効にする。
budget spending as 送料込みの予算 [min: 15000, max: 60000, step: 500, initial: 20000]
total quote as 販売事業者が返した合計 [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as 最新条件の承認 [total: quote, invalidates: "quantity, delivery"]

// 支払いの上限は予算ではなく承認額。応答不達でも注文と決済を重複させない。
payment delegated as この購入に限った支払い [approval: consent, limit: approved-total]
order result as 注文 [payment: delegated, policy: once]

// ヘッダーで選ぶケース。固定の段階再生ではなく購入操作の結果を分岐する。
scenario normal as 通常の購入 [outcome: normal]
scenario declined as 決済拒否 [outcome: decline]
scenario missing as 応答不達 [outcome: lost]
`,r=`checkout acp as "Approve standard delivery" [version: 1, note: "Change delivery or quantity, then approve the latest quote."]
party buyer as "You" [role: buyer, note: "Purchase decision", icon: user]
party agent as "Agent" [role: agent, note: "Connect information", icon: agent]
party seller as "Merchant" [role: seller, note: "Terms and orders", icon: shop]
party processor as "Payment provider" [role: payment, note: "Process payment", icon: card]
flow orders as "Order flow" [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]
product shoes as "Running shoes" [price: 18000, min: 1, max: 3, initial: 1, unit: items, merchant: "Example shop", art: shoe]
delivery shipping as "Delivery" [initial: standard]
option express as "Express" [for: shipping, fee: 2500, note: "Faster delivery", icon: bolt]
option standard as "Standard" [for: shipping, fee: 1000, note: "Lower delivery fee", icon: truck]
option pickup as "Pickup" [for: shipping, fee: 0, note: "No delivery", icon: bag]
budget spending as "Budget including delivery" [min: 15000, max: 60000, step: 500, initial: 20000]
total quote as "Merchant total" [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as "Approve latest terms" [total: quote, invalidates: "quantity, delivery"]
payment delegated as "Payment for this purchase" [approval: consent, limit: approved-total]
order result as "Order" [payment: delegated, policy: once]
scenario normal as "Normal purchase" [outcome: normal]
scenario declined as "Payment declined" [outcome: decline]
scenario missing as "Lost response" [outcome: lost]
`,i=`checkout acp as 数量の変更後に条件を承認し直す [version: 1, note: 配送や数量を変えて、最新の購入条件を承認してみてください。]

// 注文フローの4者。商品や配送とは独立したブロック。
party buyer as あなた [role: buyer, note: 購入の判断, icon: user]
party agent as エージェント [role: agent, note: 情報をつなぐ, icon: agent]
party seller as 販売事業者 [role: seller, note: 条件と注文, icon: shop]
party processor as 決済事業者 [role: payment, note: 支払いの処理, icon: card]
flow orders as 注文フロー [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]

// 商品・数量と配送の選択肢。
product shoes as 白いランニングシューズ [price: 18000, min: 1, max: 3, initial: 2, unit: 足, merchant: シューズ店A, art: shoe]
delivery shipping as 配送方法を変える [initial: express]
option express as 速達 [for: shipping, fee: 2500, note: 早さを優先, icon: bolt]
option standard as 通常配送 [for: shipping, fee: 1000, note: 送料を抑える, icon: truck]
option pickup as 店頭受取 [for: shipping, fee: 0, note: 配送しない, icon: bag]

// 合計と承認。値を変えると total を再計算し、古い承認を無効にする。
budget spending as 送料込みの予算 [min: 15000, max: 60000, step: 500, initial: 40000]
total quote as 販売事業者が返した合計 [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as 最新条件の承認 [total: quote, invalidates: "quantity, delivery"]

// 支払いの上限は予算ではなく承認額。応答不達でも注文と決済を重複させない。
payment delegated as この購入に限った支払い [approval: consent, limit: approved-total]
order result as 注文 [payment: delegated, policy: once]

// ヘッダーで選ぶケース。固定の段階再生ではなく購入操作の結果を分岐する。
scenario normal as 通常の購入 [outcome: normal]
scenario declined as 決済拒否 [outcome: decline]
scenario missing as 応答不達 [outcome: lost]
`,l=`checkout acp as "Approve a changed quantity" [version: 1, note: "Change delivery or quantity, then approve the latest quote."]
party buyer as "You" [role: buyer, note: "Purchase decision", icon: user]
party agent as "Agent" [role: agent, note: "Connect information", icon: agent]
party seller as "Merchant" [role: seller, note: "Terms and orders", icon: shop]
party processor as "Payment provider" [role: payment, note: "Process payment", icon: card]
flow orders as "Order flow" [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]
product shoes as "Running shoes" [price: 18000, min: 1, max: 3, initial: 2, unit: items, merchant: "Example shop", art: shoe]
delivery shipping as "Delivery" [initial: express]
option express as "Express" [for: shipping, fee: 2500, note: "Faster delivery", icon: bolt]
option standard as "Standard" [for: shipping, fee: 1000, note: "Lower delivery fee", icon: truck]
option pickup as "Pickup" [for: shipping, fee: 0, note: "No delivery", icon: bag]
budget spending as "Budget including delivery" [min: 15000, max: 60000, step: 500, initial: 40000]
total quote as "Merchant total" [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as "Approve latest terms" [total: quote, invalidates: "quantity, delivery"]
payment delegated as "Payment for this purchase" [approval: consent, limit: approved-total]
order result as "Order" [payment: delegated, policy: once]
scenario normal as "Normal purchase" [outcome: normal]
scenario declined as "Payment declined" [outcome: decline]
scenario missing as "Lost response" [outcome: lost]
`,h=`checkout acp as 応答不達でも注文を重ねない [version: 1, note: 配送や数量を変えて、最新の購入条件を承認してみてください。]

// 注文フローの4者。商品や配送とは独立したブロック。
party buyer as あなた [role: buyer, note: 購入の判断, icon: user]
party agent as エージェント [role: agent, note: 情報をつなぐ, icon: agent]
party seller as 販売事業者 [role: seller, note: 条件と注文, icon: shop]
party processor as 決済事業者 [role: payment, note: 支払いの処理, icon: card]
flow orders as 注文フロー [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]

// 商品・数量と配送の選択肢。
product shoes as 白いランニングシューズ [price: 18000, min: 1, max: 3, initial: 1, unit: 足, merchant: シューズ店A, art: shoe]
delivery shipping as 配送方法を変える [initial: express]
option express as 速達 [for: shipping, fee: 2500, note: 早さを優先, icon: bolt]
option standard as 通常配送 [for: shipping, fee: 1000, note: 送料を抑える, icon: truck]
option pickup as 店頭受取 [for: shipping, fee: 0, note: 配送しない, icon: bag]

// 合計と承認。値を変えると total を再計算し、古い承認を無効にする。
budget spending as 送料込みの予算 [min: 15000, max: 60000, step: 500, initial: 20000]
total quote as 販売事業者が返した合計 [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as 最新条件の承認 [total: quote, invalidates: "quantity, delivery"]

// 支払いの上限は予算ではなく承認額。応答不達でも注文と決済を重複させない。
payment delegated as この購入に限った支払い [approval: consent, limit: approved-total]
order result as 注文 [payment: delegated, policy: once]

// ヘッダーで選ぶケース。固定の段階再生ではなく購入操作の結果を分岐する。
scenario normal as 通常の購入 [outcome: normal]
scenario declined as 決済拒否 [outcome: decline]
scenario missing as 応答不達 [outcome: lost]
`,c=`checkout acp as "Check an order after a lost response" [version: 1, note: "Change delivery or quantity, then approve the latest quote."]
party buyer as "You" [role: buyer, note: "Purchase decision", icon: user]
party agent as "Agent" [role: agent, note: "Connect information", icon: agent]
party seller as "Merchant" [role: seller, note: "Terms and orders", icon: shop]
party processor as "Payment provider" [role: payment, note: "Process payment", icon: card]
flow orders as "Order flow" [buyer: buyer, agent: agent, seller: seller, payment: processor, wire: horizontal, carry: message]
product shoes as "Running shoes" [price: 18000, min: 1, max: 3, initial: 1, unit: items, merchant: "Example shop", art: shoe]
delivery shipping as "Delivery" [initial: express]
option express as "Express" [for: shipping, fee: 2500, note: "Faster delivery", icon: bolt]
option standard as "Standard" [for: shipping, fee: 1000, note: "Lower delivery fee", icon: truck]
option pickup as "Pickup" [for: shipping, fee: 0, note: "No delivery", icon: bag]
budget spending as "Budget including delivery" [min: 15000, max: 60000, step: 500, initial: 20000]
total quote as "Merchant total" [product: shoes, delivery: shipping, rule: price * quantity + fee]
approval consent as "Approve latest terms" [total: quote, invalidates: "quantity, delivery"]
payment delegated as "Payment for this purchase" [approval: consent, limit: approved-total]
order result as "Order" [payment: delegated, policy: once]
scenario normal as "Normal purchase" [outcome: normal]
scenario declined as "Payment declined" [outcome: decline]
scenario missing as "Lost response" [outcome: lost]
`,p=`// AliceがRouterに頼み、100 USDCをWETHに替えてBobへ送るまで。
// 移した分は最後まで暫定で、一番外の呼び出しが戻った段で全てが確定する。
pipe 100 USDCをWETHに替えてBobへ送る

box alice as Alice
box router as SwapRouter
box usdc as USDC
box pool as LiquidityPool
box weth as WETH
box bob as Bob

hold alice: 1000 USDC
hold pool: 2000 USDC, 10 WETH
hold bob: 0 WETH
hold usdc: "allowance[alice][router]" 100

step AliceがRouterに交換を頼む
  say AliceがRouterに、100 USDCをWETHに替えてBobへ送るよう頼む。受け取る量は最低0.04 WETHにする。
  alice -> router: 100 USDCを交換

step Routerが道筋を確かめる
  say Routerが、交換の道筋にあるトークンの数を確かめる。
  check router: 2 == 2

step RouterがUSDCに移させる
  say RouterがUSDCに、Aliceの100 USDCをPoolへ移させる。
  router -> usdc: 100 USDCを移す

step USDCが許可額を確かめる
  say USDCが、AliceがRouterに許した額で足りるかを確かめる。
  check usdc: 100 >= 100

step 100 USDCがAliceからPoolへ移る
  say USDCがAliceの残高を減らしてPoolに足し、使った分だけ許可額を減らす。
  move usdc: 100 alice -> pool
  write usdc: "allowance[alice][router]" 0
  emit usdc: Transfer(alice, pool, 100)

step USDCが移し終えたと返す
  say USDCがRouterに、移し終えたと返す。変更はまだ暫定のまま。
  gist 移した分はまだ暫定で、取引が終わるまで確定しない
  return usdc: true

step RouterがPoolに交換を頼む
  say RouterがPoolに、受け取ったUSDCをWETHに替えてBobへ送るよう頼む。
  router -> pool: 100 USDCを交換

step Poolが払うWETHを計算する
  say Poolが今の比率で、100 USDCがWETHでいくらになるかを計算する。
  calc pool: 100 USDC -> 0.05 WETH

step 0.05 WETHはAliceの最低額を満たす
  say 払う0.05 WETHが、Aliceの決めた最低0.04 WETH以上かを確かめる。
  check pool: 0.05 WETH >= 0.04 WETH

step PoolがWETHに払わせる
  say PoolがWETHに、0.05 WETHをBobへ送らせる。
  pool -> weth: 0.05 WETHを送る

step 0.05 WETHがPoolからBobへ移る
  say WETHがPoolの残高を減らしてBobに足す。
  move weth: 0.05 pool -> bob
  emit weth: Transfer(pool, bob, 0.05)

step WETHが送り終えたと返す
  say WETHがPoolに、送り終えたと返す。
  return weth: true

step Poolが払った量を返す
  say PoolがRouterに、0.05 WETHを払ったと返す。内側の呼び出しが戻っても、変更は暫定のまま。
  gist 内側の呼び出しが戻っても、変更は暫定のまま
  return pool: 0.05 WETH

step 交換が終わる
  say 一番外の呼び出しが戻り、ここで全ての変更が確定する。
  gist 一番外の呼び出しが戻った時に、全ての変更が確定する
  return router: 0.05 WETH
`,d=`// Alice asks the router to turn 100 USDC into WETH and send it to Bob.
// What moves stays provisional to the end, and every change becomes final at the step where the outermost call returns.
pipe Swap 100 USDC into WETH for Bob

box alice as Alice
box router as SwapRouter
box usdc as USDC
box pool as LiquidityPool
box weth as WETH
box bob as Bob

hold alice: 1000 USDC
hold pool: 2000 USDC, 10 WETH
hold bob: 0 WETH
hold usdc: "allowance[alice][router]" 100

step Alice asks the router to swap
  say Alice asks the router to turn 100 USDC into WETH and send it to Bob. She wants at least 0.04 WETH.
  alice -> router: swap 100 USDC

step The router checks the path
  say The router checks how many tokens are on the swap path.
  check router: 2 == 2

step The router has USDC move the funds
  say The router asks USDC to move Alice's 100 USDC to the pool.
  router -> usdc: move 100 USDC

step USDC checks the allowance
  say USDC checks that what Alice allowed the router covers the amount.
  check usdc: 100 >= 100

step 100 USDC moves from Alice to the pool
  say USDC takes 100 from Alice, adds it to the pool, and lowers the allowance by what was used.
  move usdc: 100 alice -> pool
  write usdc: "allowance[alice][router]" 0
  emit usdc: Transfer(alice, pool, 100)

step USDC reports that it is done
  say USDC tells the router it has moved the funds. The changes are still provisional.
  gist The moved funds stay provisional until the swap ends
  return usdc: true

step The router asks the pool to swap
  say The router asks the pool to turn the USDC into WETH and send it to Bob.
  router -> pool: swap 100 USDC

step The pool prices the swap
  say At its current rate, the pool works out how much WETH 100 USDC is worth.
  calc pool: 100 USDC -> 0.05 WETH

step 0.05 WETH meets the minimum
  say The pool checks that the 0.05 WETH it pays is at least the 0.04 WETH Alice asked for.
  check pool: 0.05 WETH >= 0.04 WETH

step The pool has WETH pay Bob
  say The pool asks WETH to send 0.05 WETH to Bob.
  pool -> weth: send 0.05 WETH

step 0.05 WETH moves from the pool to Bob
  say WETH takes 0.05 from the pool and adds it to Bob.
  move weth: 0.05 pool -> bob
  emit weth: Transfer(pool, bob, 0.05)

step WETH reports that it is done
  say WETH tells the pool it has sent the funds.
  return weth: true

step The pool reports what it paid
  say The pool tells the router it paid 0.05 WETH. An inner call returning leaves the changes provisional.
  gist An inner call returning leaves the changes provisional
  return pool: 0.05 WETH

step The swap ends
  say The outermost call returns, and every change becomes final here.
  gist Every change becomes final when the outermost call returns
  return router: 0.05 WETH
`,u=`// 交換で受け取る量が最低額に届かず、取引の全てが取り消されるまで。
// 移した分も書き換えた値も出したイベントも、一番外の呼び出しが落ちた段で全て元に戻る。
pipe 受け取る量が足りず交換が取り消される

box alice as Alice
box router as SwapRouter
box usdc as USDC
box pool as LiquidityPool
box weth as WETH
box bob as Bob

hold alice: 1000 USDC
hold pool: 2000 USDC, 10 WETH
hold bob: 0 WETH
hold usdc: "allowance[alice][router]" 100

step AliceがRouterに交換を頼む
  say AliceがRouterに、100 USDCをWETHに替えてBobへ送るよう頼む。受け取る量は最低0.06 WETHにする。
  alice -> router: 100 USDCを交換

step Routerが道筋を確かめる
  say Routerが、交換の道筋にあるトークンの数を確かめる。
  check router: 2 == 2

step RouterがUSDCに移させる
  say RouterがUSDCに、Aliceの100 USDCをPoolへ移させる。
  router -> usdc: 100 USDCを移す

step USDCが許可額を確かめる
  say USDCが、AliceがRouterに許した額で足りるかを確かめる。
  check usdc: 100 >= 100

step 100 USDCがAliceからPoolへ移る
  say USDCがAliceの残高を減らしてPoolに足し、使った分だけ許可額を減らす。
  move usdc: 100 alice -> pool
  write usdc: "allowance[alice][router]" 0
  emit usdc: Transfer(alice, pool, 100)

step USDCが移し終えたと返す
  say USDCがRouterに、移し終えたと返す。変更はまだ暫定のまま。
  return usdc: true

step RouterがPoolに交換を頼む
  say RouterがPoolに、受け取ったUSDCをWETHに替えてBobへ送るよう頼む。
  router -> pool: 100 USDCを交換

step Poolが払うWETHを計算する
  say Poolが今の比率で、100 USDCがWETHでいくらになるかを計算する。
  calc pool: 100 USDC -> 0.05 WETH

step 0.05 WETHはAliceの最低額に届かない
  say 払える0.05 WETHは、Aliceの決めた最低0.06 WETHより少ない。
  check pool: 0.05 WETH >= 0.06 WETH

step 交換の全てが取り消される
  say Poolが落ち、受け止める者がいないままRouterも落ちる。移した分も書き換えた値もイベントも、全て元に戻る。
  revert pool: INSUFFICIENT_OUTPUT_AMOUNT
  revert router: INSUFFICIENT_OUTPUT_AMOUNT
`,m=`// The swap pays out less than the minimum, and the whole transaction is undone.
// What moved, the value that was written, and the event that was emitted all go back at the step where the outermost call fails.
pipe The swap pays too little and is undone

box alice as Alice
box router as SwapRouter
box usdc as USDC
box pool as LiquidityPool
box weth as WETH
box bob as Bob

hold alice: 1000 USDC
hold pool: 2000 USDC, 10 WETH
hold bob: 0 WETH
hold usdc: "allowance[alice][router]" 100

step Alice asks the router to swap
  say Alice asks the router to turn 100 USDC into WETH and send it to Bob. She wants at least 0.06 WETH.
  alice -> router: swap 100 USDC

step The router checks the path
  say The router checks how many tokens are on the swap path.
  check router: 2 == 2

step The router has USDC move the funds
  say The router asks USDC to move Alice's 100 USDC to the pool.
  router -> usdc: move 100 USDC

step USDC checks the allowance
  say USDC checks that what Alice allowed the router covers the amount.
  check usdc: 100 >= 100

step 100 USDC moves from Alice to the pool
  say USDC takes 100 from Alice, adds it to the pool, and lowers the allowance by what was used.
  move usdc: 100 alice -> pool
  write usdc: "allowance[alice][router]" 0
  emit usdc: Transfer(alice, pool, 100)

step USDC reports that it is done
  say USDC tells the router it has moved the funds. The changes are still provisional.
  return usdc: true

step The router asks the pool to swap
  say The router asks the pool to turn the USDC into WETH and send it to Bob.
  router -> pool: swap 100 USDC

step The pool prices the swap
  say At its current rate, the pool works out how much WETH 100 USDC is worth.
  calc pool: 100 USDC -> 0.05 WETH

step 0.05 WETH misses the minimum
  say The 0.05 WETH the pool can pay is less than the 0.06 WETH Alice asked for.
  check pool: 0.05 WETH >= 0.06 WETH

step The whole swap is undone
  say The pool fails, nobody catches it, and the router fails too. What moved, the written value, and the events all go back.
  revert pool: INSUFFICIENT_OUTPUT_AMOUNT
  revert router: INSUFFICIENT_OUTPUT_AMOUNT
`,y=`// AliceのUSDCを、2つのPoolを順に通してWETH経由でDAIに替えるまで。
// 関係者とトークンが増えても、置き場所は書かずに同じ決まりで並ぶ。
pipe USDCをWETH経由でDAIに替える

box alice as Alice
box router as SwapRouter
box usdc as USDC
box pool1 as Pool1
box weth as WETH
box pool2 as Pool2
box dai as DAI

hold alice: 1000 USDC, 0 DAI
hold pool1: 2000 USDC, 10 WETH
hold pool2: 5 WETH, 20000 DAI

step AliceがRouterに交換を頼む
  say AliceがRouterに、100 USDCをDAIに替えるよう頼む。受け取る量は最低150 DAIにする。
  alice -> router: 100 USDCをDAIに交換

step Routerが道筋を確かめる
  say Routerが、道筋にあるトークンの数を確かめる。USDCとWETHとDAIの3つ。
  check router: 3 == 3

step 100 USDCがAliceからPool1へ移る
  say RouterがUSDCに頼み、Aliceの100 USDCをPool1へ移させる。
  router -> usdc: 100 USDCを移す
  move usdc: 100 alice -> pool1
  emit usdc: Transfer(alice, pool1, 100)
  return usdc: true

step RouterがPool1に交換を頼む
  say RouterがPool1に、USDCをWETHに替えてPool2へ送るよう頼む。
  router -> pool1: 100 USDCを交換

step Pool1がWETHの量を計算する
  say Pool1が今の比率で、100 USDCがWETHでいくらになるかを計算する。
  calc pool1: 100 USDC -> 0.05 WETH

step 0.05 WETHがPool1からPool2へ移る
  say Pool1がWETHに頼み、0.05 WETHをPool2へ送らせる。
  pool1 -> weth: 0.05 WETHを送る
  move weth: 0.05 pool1 -> pool2
  emit weth: Transfer(pool1, pool2, 0.05)
  return weth: true

step Pool1が払った量を返す
  say Pool1がRouterに、0.05 WETHを払ったと返す。
  return pool1: 0.05 WETH

step RouterがPool2に交換を頼む
  say RouterがPool2に、届いたWETHをDAIに替えてAliceへ送るよう頼む。
  router -> pool2: 0.05 WETHを交換

step Pool2がDAIの量を計算する
  say Pool2が今の比率で、0.05 WETHがDAIでいくらになるかを計算する。
  calc pool2: 0.05 WETH -> 160 DAI

step 160 DAIはAliceの最低額を満たす
  say 払う160 DAIが、Aliceの決めた最低150 DAI以上かを確かめる。
  check pool2: 160 DAI >= 150 DAI

step 160 DAIがPool2からAliceへ移る
  say Pool2がDAIに頼み、160 DAIをAliceへ送らせる。
  pool2 -> dai: 160 DAIを送る
  move dai: 160 pool2 -> alice
  emit dai: Transfer(pool2, alice, 160)
  return dai: true

step Pool2が払った量を返す
  say Pool2がRouterに、160 DAIを払ったと返す。
  return pool2: 160 DAI

step 交換が終わる
  say 一番外の呼び出しが戻り、2回の交換の変更が全て確定する。
  gist 一番外の呼び出しが戻った時に、2回の交換の変更が全て確定する
  return router: 160 DAI
`,g=`// Alice's USDC passes through two pools in turn and becomes DAI by way of WETH.
// More parties and tokens still line up by the same rules, with no positions written.
pipe Turn USDC into DAI by way of WETH

box alice as Alice
box router as SwapRouter
box usdc as USDC
box pool1 as Pool1
box weth as WETH
box pool2 as Pool2
box dai as DAI

hold alice: 1000 USDC, 0 DAI
hold pool1: 2000 USDC, 10 WETH
hold pool2: 5 WETH, 20000 DAI

step Alice asks the router to swap
  say Alice asks the router to turn 100 USDC into DAI. She wants at least 150 DAI.
  alice -> router: swap 100 USDC into DAI

step The router checks the path
  say The router checks how many tokens are on the path. There are three: USDC, WETH, and DAI.
  check router: 3 == 3

step 100 USDC moves from Alice to pool 1
  say The router asks USDC to move Alice's 100 USDC to pool 1.
  router -> usdc: move 100 USDC
  move usdc: 100 alice -> pool1
  emit usdc: Transfer(alice, pool1, 100)
  return usdc: true

step The router asks pool 1 to swap
  say The router asks pool 1 to turn the USDC into WETH and send it to pool 2.
  router -> pool1: swap 100 USDC

step Pool 1 prices the WETH
  say At its current rate, pool 1 works out how much WETH 100 USDC is worth.
  calc pool1: 100 USDC -> 0.05 WETH

step 0.05 WETH moves from pool 1 to pool 2
  say Pool 1 asks WETH to send 0.05 WETH to pool 2.
  pool1 -> weth: send 0.05 WETH
  move weth: 0.05 pool1 -> pool2
  emit weth: Transfer(pool1, pool2, 0.05)
  return weth: true

step Pool 1 reports what it paid
  say Pool 1 tells the router it paid 0.05 WETH.
  return pool1: 0.05 WETH

step The router asks pool 2 to swap
  say The router asks pool 2 to turn the WETH that arrived into DAI and send it to Alice.
  router -> pool2: swap 0.05 WETH

step Pool 2 prices the DAI
  say At its current rate, pool 2 works out how much DAI 0.05 WETH is worth.
  calc pool2: 0.05 WETH -> 160 DAI

step 160 DAI meets the minimum
  say Pool 2 checks that the 160 DAI it pays is at least the 150 DAI Alice asked for.
  check pool2: 160 DAI >= 150 DAI

step 160 DAI moves from pool 2 to Alice
  say Pool 2 asks DAI to send 160 DAI to Alice.
  pool2 -> dai: send 160 DAI
  move dai: 160 pool2 -> alice
  emit dai: Transfer(pool2, alice, 160)
  return dai: true

step Pool 2 reports what it paid
  say Pool 2 tells the router it paid 160 DAI.
  return pool2: 160 DAI

step The swap ends
  say The outermost call returns, and every change from both swaps becomes final.
  gist The changes of both swaps become final when the outermost call returns
  return router: 160 DAI
`,f=`// 1つ目のPoolの送金が落ちても、Routerが受け止めて2つ目のPoolで交換し直すまで。
// 落ちた呼び出しの内側の変更だけが元に戻り、Routerの変更は暫定のまま続く。
pipe 落ちた交換を別のPoolでやり直す

box alice as Alice
box router as SwapRouter
box usdc as USDC
box pool1 as Pool1
box weth as WETH
box pool2 as Pool2

hold alice: 1000 USDC, 0 WETH
hold router: 0 USDC
hold router: tries 0
hold pool1: 2000 USDC, 0.01 WETH
hold pool2: 2000 USDC, 10 WETH

step AliceがRouterに交換を頼む
  say AliceがRouterに、100 USDCをWETHに替えるよう頼む。
  alice -> router: 100 USDCを交換

step RouterがAliceのUSDCを預かる
  say RouterがUSDCに頼み、Aliceの100 USDCを自分へ移させる。試した回数も1にする。
  router -> usdc: 100 USDCを預かる
  move usdc: 100 alice -> router
  emit usdc: Transfer(alice, router, 100)
  return usdc: true
  write router: tries 1

step RouterがPool1に交換を頼む
  say RouterがPool1に、USDCをWETHに替えてAliceへ送るよう頼む。
  router -> pool1: 100 USDCを交換

step Pool1がUSDCを受け取る
  say Pool1がUSDCに頼み、Routerの100 USDCを自分へ移させる。
  pool1 -> usdc: 100 USDCを受け取る
  move usdc: 100 router -> pool1
  emit usdc: Transfer(router, pool1, 100)
  return usdc: true

step Pool1がWETHに払わせる
  say Pool1がWETHに、0.05 WETHをAliceへ送らせる。
  pool1 -> weth: 0.05 WETHを送る

step WETHの送金が残高不足で落ちる
  say Pool1のWETHは0.01しかない。WETHが落ち、それを受けてPool1も落ちる。
  check weth: 0.01 WETH >= 0.05 WETH
  revert weth: 残高不足
  revert pool1: 送金の失敗

step RouterがPool2で交換し直す
  say RouterはPool1が落ちたことを受け止め、Pool2に同じ交換を頼む。元に戻ったのはPool1の内側の変更だけ。
  gist 元に戻ったのはPool1の内側の変更だけで、外側の変更は残る
  router -> pool2: 100 USDCを交換

step Pool2がUSDCを受け取る
  say Pool2がUSDCに頼み、Routerの100 USDCを自分へ移させる。
  pool2 -> usdc: 100 USDCを受け取る
  move usdc: 100 router -> pool2
  emit usdc: Transfer(router, pool2, 100)
  return usdc: true

step 0.05 WETHがPool2からAliceへ移る
  say Pool2がWETHに頼み、0.05 WETHをAliceへ送らせる。
  pool2 -> weth: 0.05 WETHを送る
  move weth: 0.05 pool2 -> alice
  emit weth: Transfer(pool2, alice, 0.05)
  return weth: true

step Pool2が払った量を返す
  say Pool2がRouterに、0.05 WETHを払ったと返す。
  return pool2: 0.05 WETH

step 交換が終わる
  say 一番外の呼び出しが戻り、残った変更が全て確定する。
  gist 一番外の呼び出しが戻った時に、残った変更が全て確定する
  return router: 0.05 WETH
`,b=`// The first pool fails to pay, the router catches the failure, and the swap is tried again through the second pool.
// Only the changes inside the failed call go back, and the router's own changes stay provisional.
pipe Retry a failed swap through another pool

box alice as Alice
box router as SwapRouter
box usdc as USDC
box pool1 as Pool1
box weth as WETH
box pool2 as Pool2

hold alice: 1000 USDC, 0 WETH
hold router: 0 USDC
hold router: tries 0
hold pool1: 2000 USDC, 0.01 WETH
hold pool2: 2000 USDC, 10 WETH

step Alice asks the router to swap
  say Alice asks the router to turn 100 USDC into WETH.
  alice -> router: swap 100 USDC

step The router takes Alice's USDC
  say The router asks USDC to move Alice's 100 USDC to the router, and counts one try.
  router -> usdc: take 100 USDC
  move usdc: 100 alice -> router
  emit usdc: Transfer(alice, router, 100)
  return usdc: true
  write router: tries 1

step The router asks pool 1 to swap
  say The router asks pool 1 to turn the USDC into WETH and send it to Alice.
  router -> pool1: swap 100 USDC

step Pool 1 takes the USDC
  say Pool 1 asks USDC to move the router's 100 USDC to pool 1.
  pool1 -> usdc: take 100 USDC
  move usdc: 100 router -> pool1
  emit usdc: Transfer(router, pool1, 100)
  return usdc: true

step Pool 1 has WETH pay Alice
  say Pool 1 asks WETH to send 0.05 WETH to Alice.
  pool1 -> weth: send 0.05 WETH

step The WETH transfer fails for lack of funds
  say Pool 1 holds only 0.01 WETH. WETH fails, and pool 1 fails with it.
  check weth: 0.01 WETH >= 0.05 WETH
  revert weth: insufficient balance
  revert pool1: transfer failed

step The router tries pool 2
  say The router catches the failure of pool 1 and asks pool 2 for the same swap. Only the changes inside pool 1 went back.
  gist Only the changes inside pool 1 went back, and the outer changes stay
  router -> pool2: swap 100 USDC

step Pool 2 takes the USDC
  say Pool 2 asks USDC to move the router's 100 USDC to pool 2.
  pool2 -> usdc: take 100 USDC
  move usdc: 100 router -> pool2
  emit usdc: Transfer(router, pool2, 100)
  return usdc: true

step 0.05 WETH moves from pool 2 to Alice
  say Pool 2 asks WETH to send 0.05 WETH to Alice.
  pool2 -> weth: send 0.05 WETH
  move weth: 0.05 pool2 -> alice
  emit weth: Transfer(pool2, alice, 0.05)
  return weth: true

step Pool 2 reports what it paid
  say Pool 2 tells the router it paid 0.05 WETH.
  return pool2: 0.05 WETH

step The swap ends
  say The outermost call returns, and every change that is left becomes final.
  gist The remaining changes become final when the outermost call returns
  return router: 0.05 WETH
`,w=`// AliceがProxyを通してVaultに1 ETHを預けるまで。
// ETHは呼び出しに添えて送り、Proxyは処理を借りて自分の値に書き込み、価格は書き込めない呼び出しで読む。
pipe Proxyを通してVaultに1 ETHを預ける

box alice as Alice
box proxy as VaultProxy
box logic as VaultLogic
box oracle as PriceOracle

hold alice: 5 ETH
hold proxy: 0 ETH
hold proxy: owner alice
hold proxy: "deposits[alice]" 0
hold proxy: paused false

step AliceがProxyに1 ETHを添えて頼む
  say AliceがProxyのdepositを呼び、呼び出しに1 ETHを添えて送る。
  alice -> proxy: deposit [value: 1 ETH]

step ProxyがVaultLogicの処理を借りる
  say Proxyは処理を持たず、VaultLogicの処理を借りて自分の値の上で動かす。
  gist Proxyは処理を持たず、借りた処理をProxyの値の上で動かす
  proxy -> logic: deposit [call: delegate]

step 止まっていないかを確かめる
  say 借りた処理が、Vaultが止められていないかを確かめる。
  check logic: paused == false

step 価格を読むだけの呼び出し
  say 借りた処理がPriceOracleに価格を尋ねる。この呼び出しの中では何も書き込めない。
  gist 読むだけの呼び出しの中では、何も書き込めない
  logic -> oracle: price [call: static]

step PriceOracleが価格を返す
  say PriceOracleが今のETHの価格を返す。
  return oracle: 3200

step 預けた額をProxyの値に書く
  say 借りた処理が書き込む先は、VaultLogicではなくProxyの値になる。
  write logic: "deposits[alice]" 1

step 借りた処理が終わる
  say VaultLogicの処理が終わり、Proxyに戻る。
  return logic: true

step Proxyが預けた記録を出す
  say Proxyが、誰がいくら預けたかをイベントとして出す。
  emit proxy: Deposited(alice, 1)

step 預け入れが終わる
  say 一番外の呼び出しが戻り、ETHの送金も書き込んだ値も確定する。
  gist 一番外の呼び出しが戻った時に、ETHの送金も書き込んだ値も確定する
  return proxy: true
`,k=`// Alice deposits 1 ETH in a vault through a proxy.
// The ETH rides along with the call, the proxy borrows code that writes to its own values, and the price is read with a call that cannot write.
pipe Deposit 1 ETH in a vault through a proxy

box alice as Alice
box proxy as VaultProxy
box logic as VaultLogic
box oracle as PriceOracle

hold alice: 5 ETH
hold proxy: 0 ETH
hold proxy: owner alice
hold proxy: "deposits[alice]" 0
hold proxy: paused false

step Alice calls the proxy with 1 ETH
  say Alice calls deposit on the proxy and sends 1 ETH along with the call.
  alice -> proxy: deposit [value: 1 ETH]

step The proxy borrows the vault logic
  say The proxy has no code of its own, so it runs the code of VaultLogic on its own values.
  gist The proxy has no code of its own and runs the borrowed code on the proxy's values
  proxy -> logic: deposit [call: delegate]

step The vault checks it is not paused
  say The borrowed code checks that the vault has not been paused.
  check logic: paused == false

step A call that only reads the price
  say The borrowed code asks PriceOracle for the price. Nothing can be written inside this call.
  gist Nothing can be written inside a read-only call
  logic -> oracle: price [call: static]

step PriceOracle returns the price
  say PriceOracle returns the current price of ETH.
  return oracle: 3200

step The deposit is written to the proxy
  say The borrowed code writes to the values of the proxy, not of VaultLogic.
  write logic: "deposits[alice]" 1

step The borrowed code ends
  say The code of VaultLogic finishes and control goes back to the proxy.
  return logic: true

step The proxy records the deposit
  say The proxy emits an event saying who deposited how much.
  emit proxy: Deposited(alice, 1)

step The deposit ends
  say The outermost call returns, and the ETH sent and the value written both become final.
  gist The ETH transfer and the written values become final when the outermost call returns
  return proxy: true
`,v=`// AliceのUSDCを、Aggregatorが3つのPoolに分けてWETHに替え、手数料を引いた残りをRouterがBobへ送るまで。
// 関係者が15あり、Aggregatorの内側は1つの箱にまとまり、内側にしか出ない9の関係者の列は箱を開くまで描かない。
pipe Aggregatorが3つのPoolに分けて交換する

box alice as Alice
box router as Router
box agg as Aggregator
box usdc as USDC
box oracle as Oracle
box lib as Lib
box pool1 as Pool1
box pool2 as Pool2
box pool3 as Pool3
box weth as WETH
box pool4 as Pool4
box dai as DAI
box fee as Fee
box vault as Vault
box bob as Bob

hold alice: 1000 USDC
hold router: 0 WETH
hold agg: 0 USDC, 0 WETH
hold pool1: 2000 USDC, 10 WETH
hold pool2: 1500 USDC, 8 WETH
hold pool3: 1000 USDC, 6 WETH
hold pool4: 30 WETH, 100000 DAI
hold fee: 0 DAI
hold bob: 0 WETH
hold vault: volume 0

step AliceがRouterに交換を頼む
  say AliceがRouterに、100 USDCをWETHに替えてBobへ送るよう頼む。受け取る量は最低0.049 WETHにする。
  alice -> router: 100 USDCをWETHに交換

step 100 USDCがAliceからAggregatorへ移る
  say RouterがUSDCに頼み、Aliceの100 USDCをAggregatorへ移させる。
  router -> usdc: 100 USDCを移す
  move usdc: 100 alice -> agg
  emit usdc: Transfer(alice, agg, 100)
  return usdc: true

step RouterがAggregatorに交換を任せる
  say RouterがAggregatorに交換を任せる。内側の段は1つの箱に畳まれ、押すと開く。
  gist Aggregatorの内側の段は、畳んだ箱を押すと開く
  router -> agg: 100 USDCをWETHに交換 [fold]

step Aggregatorが価格と分け方を読む
  say Aggregatorが、Oracleから価格を、Libから3つのPoolへの分け方を読む。
  agg -> oracle: price [call: static]
  return oracle: 3200
  agg -> lib: split [call: static]
  return lib: 40/35/25

step Pool1で40 USDCを替える
  say AggregatorがPool1へ40 USDCを送り、Pool1が0.02 WETHを返す。
  agg -> usdc: 40 USDCを送る
  move usdc: 40 agg -> pool1
  return usdc: true
  agg -> pool1: 40 USDCを交換
  calc pool1: 40 USDC -> 0.02 WETH
  pool1 -> weth: 0.02 WETHを送る
  move weth: 0.02 pool1 -> agg
  return weth: true
  return pool1: 0.02 WETH

step Pool2で35 USDCを替える
  say AggregatorがPool2へ35 USDCを送り、Pool2が0.0175 WETHを返す。
  agg -> usdc: 35 USDCを送る
  move usdc: 35 agg -> pool2
  return usdc: true
  agg -> pool2: 35 USDCを交換
  calc pool2: 35 USDC -> 0.0175 WETH
  pool2 -> weth: 0.0175 WETHを送る
  move weth: 0.0175 pool2 -> agg
  return weth: true
  return pool2: 0.0175 WETH

step Pool3で25 USDCを替える
  say AggregatorがPool3へ25 USDCを送り、Pool3が0.0125 WETHを返す。
  agg -> usdc: 25 USDCを送る
  move usdc: 25 agg -> pool3
  return usdc: true
  agg -> pool3: 25 USDCを交換
  calc pool3: 25 USDC -> 0.0125 WETH
  pool3 -> weth: 0.0125 WETHを送る
  move weth: 0.0125 pool3 -> agg
  return weth: true
  return pool3: 0.0125 WETH

step 手数料をDAIに替えてFeeへ送る
  say AggregatorがPool4へ0.0005 WETHを送り、Pool4が1.6 DAIを手数料としてFeeへ送る。
  agg -> weth: 0.0005 WETHを送る
  move weth: 0.0005 agg -> pool4
  return weth: true
  agg -> pool4: 手数料をDAIに交換
  calc pool4: 0.0005 WETH -> 1.6 DAI
  pool4 -> dai: 1.6 DAIをFeeへ送る
  move dai: 1.6 pool4 -> fee
  return dai: true
  return pool4: 1.6 DAI

step 残りのWETHをRouterへ送る
  say Aggregatorが、残りの0.0495 WETHをRouterへ送る。
  agg -> weth: 0.0495 WETHを送る
  move weth: 0.0495 agg -> router
  emit weth: Transfer(agg, router, 0.0495)
  return weth: true

step 交換した量を記録する
  say AggregatorがVaultに、交換した量を記録させる。
  agg -> vault: 量を記録
  write vault: volume 100
  return vault: true

step Aggregatorが戻る
  say AggregatorがRouterに、0.0495 WETHを送ったと返す。
  return agg: 0.0495 WETH

step 0.0495 WETHはAliceの最低額を満たす
  say Routerが、受け取った0.0495 WETHが最低0.049 WETH以上かを確かめる。
  check router: 0.0495 WETH >= 0.049 WETH

step RouterがWETHをBobへ送る
  say RouterがWETHに頼み、0.0495 WETHをBobへ送らせる。
  router -> weth: 0.0495 WETHをBobへ送る
  move weth: 0.0495 router -> bob
  emit weth: Transfer(router, bob, 0.0495)
  return weth: true

step 交換が終わる
  say 一番外の呼び出しが戻り、15の関係者にまたがる変更が全て確定する。
  gist 一番外の呼び出しが戻った時に、15の関係者にまたがる変更が全て確定する
  return router: 0.0495 WETH
`,x=`// An aggregator splits Alice's USDC across three pools into WETH, takes a fee, and the router sends the rest to Bob.
// There are 15 parties. The inside of the aggregator folds into one box, and the 9 parties that appear only inside are not drawn until the box opens.
pipe An aggregator swaps across three pools

box alice as Alice
box router as Router
box agg as Aggregator
box usdc as USDC
box oracle as Oracle
box lib as Lib
box pool1 as Pool1
box pool2 as Pool2
box pool3 as Pool3
box weth as WETH
box pool4 as Pool4
box dai as DAI
box fee as Fee
box vault as Vault
box bob as Bob

hold alice: 1000 USDC
hold router: 0 WETH
hold agg: 0 USDC, 0 WETH
hold pool1: 2000 USDC, 10 WETH
hold pool2: 1500 USDC, 8 WETH
hold pool3: 1000 USDC, 6 WETH
hold pool4: 30 WETH, 100000 DAI
hold fee: 0 DAI
hold bob: 0 WETH
hold vault: volume 0

step Alice asks the router to swap
  say Alice asks the router to turn 100 USDC into WETH and send it to Bob. She wants at least 0.049 WETH.
  alice -> router: swap 100 USDC into WETH

step 100 USDC moves from Alice to the aggregator
  say The router asks USDC to move Alice's 100 USDC to the aggregator.
  router -> usdc: move 100 USDC
  move usdc: 100 alice -> agg
  emit usdc: Transfer(alice, agg, 100)
  return usdc: true

step The router hands the swap to the aggregator
  say The router leaves the swap to the aggregator. The steps inside fold into one box that opens when pressed.
  gist The aggregator's inner steps open when you press the folded box
  router -> agg: swap 100 USDC into WETH [fold]

step The aggregator reads the price and the split
  say The aggregator reads the price from Oracle and how to split across three pools from Lib.
  agg -> oracle: price [call: static]
  return oracle: 3200
  agg -> lib: split [call: static]
  return lib: 40/35/25

step Pool 1 swaps 40 USDC
  say The aggregator sends 40 USDC to pool 1, and pool 1 pays back 0.02 WETH.
  agg -> usdc: send 40 USDC
  move usdc: 40 agg -> pool1
  return usdc: true
  agg -> pool1: swap 40 USDC
  calc pool1: 40 USDC -> 0.02 WETH
  pool1 -> weth: send 0.02 WETH
  move weth: 0.02 pool1 -> agg
  return weth: true
  return pool1: 0.02 WETH

step Pool 2 swaps 35 USDC
  say The aggregator sends 35 USDC to pool 2, and pool 2 pays back 0.0175 WETH.
  agg -> usdc: send 35 USDC
  move usdc: 35 agg -> pool2
  return usdc: true
  agg -> pool2: swap 35 USDC
  calc pool2: 35 USDC -> 0.0175 WETH
  pool2 -> weth: send 0.0175 WETH
  move weth: 0.0175 pool2 -> agg
  return weth: true
  return pool2: 0.0175 WETH

step Pool 3 swaps 25 USDC
  say The aggregator sends 25 USDC to pool 3, and pool 3 pays back 0.0125 WETH.
  agg -> usdc: send 25 USDC
  move usdc: 25 agg -> pool3
  return usdc: true
  agg -> pool3: swap 25 USDC
  calc pool3: 25 USDC -> 0.0125 WETH
  pool3 -> weth: send 0.0125 WETH
  move weth: 0.0125 pool3 -> agg
  return weth: true
  return pool3: 0.0125 WETH

step Pool 4 turns the fee into DAI for Fee
  say The aggregator sends 0.0005 WETH to pool 4, and pool 4 sends 1.6 DAI to Fee as the fee.
  agg -> weth: send 0.0005 WETH
  move weth: 0.0005 agg -> pool4
  return weth: true
  agg -> pool4: swap the fee into DAI
  calc pool4: 0.0005 WETH -> 1.6 DAI
  pool4 -> dai: send 1.6 DAI to Fee
  move dai: 1.6 pool4 -> fee
  return dai: true
  return pool4: 1.6 DAI

step The rest of the WETH goes to the router
  say The aggregator sends the remaining 0.0495 WETH to the router.
  agg -> weth: send 0.0495 WETH
  move weth: 0.0495 agg -> router
  emit weth: Transfer(agg, router, 0.0495)
  return weth: true

step The swapped amount is recorded
  say The aggregator asks the vault to record how much was swapped.
  agg -> vault: record the amount
  write vault: volume 100
  return vault: true

step The aggregator returns
  say The aggregator tells the router it sent 0.0495 WETH.
  return agg: 0.0495 WETH

step 0.0495 WETH meets the minimum
  say The router checks that the 0.0495 WETH it received is at least 0.049 WETH.
  check router: 0.0495 WETH >= 0.049 WETH

step The router sends the WETH to Bob
  say The router asks WETH to send 0.0495 WETH to Bob.
  router -> weth: send 0.0495 WETH to Bob
  move weth: 0.0495 router -> bob
  emit weth: Transfer(router, bob, 0.0495)
  return weth: true

step The swap ends
  say The outermost call returns, and every change across the 15 parties becomes final.
  gist Every change across the 15 parties becomes final when the outermost call returns
  return router: 0.0495 WETH
`,T=`// スマホのOSの割合が、2018年から2024年までにどう移ったかをドーナツで比べる。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
chart スマホのOSの割合 [shape: donut]

item ios as iOS [color: blue]
item android as Android [color: green]
item other as その他 [color: slate]

step 2018年
  say iOSが7割を占め、Androidが3割弱。
  set ios: 70
  set android: 29
  set other: 1

step 2021年
  say Androidが少しずつ伸び、3割を超える。
  set ios: 66
  set android: 33

step 2024年
  say Androidが4割近くまで伸び、差が縮まる。
  set ios: 60
  set android: 39
`,D=`// How the share of smartphone operating systems moved from 2018 to 2024, compared on a donut.
// The values are sample numbers that show the shape, not measured figures.
chart Smartphone OS share [shape: donut]

item ios as iOS [color: blue]
item android as Android [color: green]
item other as Other [color: slate]

step 2018
  say iOS holds 70 percent and Android a little under 30.
  set ios: 70
  set android: 29
  set other: 1

step 2021
  say Android grows step by step and passes 30 percent.
  set ios: 66
  set android: 33

step 2024
  say Android nears 40 percent and the gap narrows.
  set ios: 60
  set android: 39
`,A=`// 窓口ごとの問い合わせの件数が、4月から6月までにどう移ったかを横棒で比べる。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
chart 窓口ごとの問い合わせの件数 [shape: bar]

item mail as メール [color: blue]
item chat as チャット [color: green]
item phone as 電話 [color: amber]

step 4月
  say メールと電話で受け、チャットはまだ開いていない。
  set mail: 120
  set phone: 64

step 5月
  say チャットを開くと、電話の件数が減る。
  set mail: 104
  set chat: 38
  set phone: 58

step 6月
  say チャットが伸び、メールの件数を追う。
  set mail: 86
  set chat: 81
  set phone: 41
`,C=`// How the number of support requests per channel moved from April to June, compared on bars.
// The values are sample numbers that show the shape, not measured figures.
chart Support requests by channel [shape: bar]

item mail as Email [color: blue]
item chat as Chat [color: green]
item phone as Phone [color: amber]

step April
  say Requests come by email and phone, and chat is not open yet.
  set mail: 120
  set phone: 64

step May
  say Chat opens, and phone requests drop.
  set mail: 104
  set chat: 38
  set phone: 58

step June
  say Chat grows and catches up with email.
  set mail: 86
  set chat: 81
  set phone: 41
`,E=`// ログインの入力を、パスワードと2FAの2つの判断で確かめる手順。
// どちらかの判断が「いいえ」ならエラーを出す。最初の段より前の線は今回は通らない道で、点線で残る。
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
`,S=`// A login input checked by two choices, the password and the 2FA code.
// If either choice says no, an error is shown. Lines written before the first step are paths not taken this time and stay dotted.
flow Login check

box input as Input
choice pw as Password correct?
choice otp as 2FA correct?
box done as Signed in [color: green]
box err as Show an error [color: rose]

pw -> err: No
otp -> err: No

step Enter
  say The user enters an ID and a password.
  start -> input

step Check the password
  say The server checks the password.
  input -> pw: Send

step Check the 2FA code
  say The password matched, so the 2FA code is checked.
  pw -> otp: Yes

step Sign in
  say The code matches too, and the user is signed in. The no paths stay dotted.
  otp -> done: Yes
  done -> finish
`,P=`// ログインの入力を、パスワードと2FAの2つの判断で確かめる手順の全ての道を走る。
// 判断の段に「はい」と「いいえ」の線を並べて書くと、点が両方の道へ同時に走る。先に書いた線が本筋で真下へ進み、後に書いた線は横へ分かれる。
flow ログインの全ての道

box input as 入力
choice pw as パスワードは正しい？
choice otp as 2FAは正しい？
box done as ログイン [color: green]
box err as エラーを出す [color: rose]

step 入力する
  say 利用者がIDとパスワードを入れる。
  start -> input

step パスワードを確かめる
  say サーバーがパスワードを照らし合わせる。
  input -> pw: 送る

step パスワードで分かれる
  say 合えば2FAへ、違えばエラーへ進む。
  pw -> otp: はい
  pw -> err: いいえ

step 2FAで分かれる
  say 合えばログインへ、違えばエラーへ進む。
  otp -> done: はい
  otp -> err: いいえ
  done -> finish
`,H=`// Every path of a login check by two choices, the password and the 2FA code.
// Write both answers of a choice in the same step, and dots run down both paths at once. The line written first goes straight down as the main path, and the line written after it branches to the side.
flow Every path of a login

box input as Input
choice pw as Password correct?
choice otp as 2FA correct?
box done as Signed in [color: green]
box err as Show an error [color: rose]

step Enter
  say The user enters an ID and a password.
  start -> input

step Check the password
  say The server compares the password.
  input -> pw: Send

step Split on the password
  say A match goes on to 2FA, and anything else goes to the error.
  pw -> otp: Yes
  pw -> err: No

step Split on 2FA
  say A match signs in, and anything else goes to the error.
  otp -> done: Yes
  otp -> err: No
  done -> finish
`,W=`// API の往復の見本。行きの線と戻りの線を引き、戻りの線の名前は線の下に置く
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
`,B=`// API round trip example. Draw the request and the reply, and put the reply labels under the line
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
`,U=`// Ethereum で送ったトランザクションが、ビルダーの入札を経てブロックに入り、投票されるまで。
// 札の 1 枚が 1 人のビルダーのブロックで、チップ 1 枚が 1 件のトランザクション。自分の分は色の付いたチップで追う。
// ビルダーは順序を替えて封をし、提案者は金額だけを見て選び、中身を見ずに署名する。
lineup 入札でブロックの中身が決まるまで

role リレー [note: 中身を封で隠す]
role 提案者 [note: 見えるのは金額だけ]

box メモリプール [order: none]
box ビルダーA
box ビルダーB [color: violet]
box ビルダーC
box バリデーター [color: green, order: none]

item 送金, 交換, 発行, 預入, 返済, 清算, 償還 [note: 取引 (名前はその取引でする事)]
item 自分 [color: amber, note: 自分の取引]
item 裏1, 裏2 [color: blue, note: 裏 (メモリプールを通らずビルダーに直接届いた取引)]
item 票1, 票2, 票3, 票4, 票5, 票6, 票7, 票8, 票9, 票10, 票11, 票12 [color: green, label: ✓, note: 票]

step トランザクションが列に並ぶ
  say 送ったトランザクションはメモリプールに入り、ほかの人の分と一緒に待つ。
  line メモリプール: 送金, 自分, 交換, 発行, 預入, 返済, 清算, 償還

step ビルダーが順序を決めて入札する
  say ビルダーは順序を並べ替え、メモリプールに無い取引も足してブロックを組み、金額を付ける。
  line ビルダーA: 送金, 交換, 自分, 発行, 預入, 返済, 清算, 償還
  line ビルダーB: 裏1, 裏2, 発行, 自分, 送金, 交換, 預入, 返済
  line ビルダーC: 送金, 交換, 発行, 預入, 返済, 清算, 償還
  note ビルダーA: 0.05 ETH
  note ビルダーB: 0.12 ETH
  note ビルダーC: 0.08 ETH

step リレーが封をして中身を隠す
  say リレーは中身を預かって隠す。提案者が中身を盗めないようにするため。
  role リレー
  seal ビルダーA
  seal ビルダーB
  seal ビルダーC

step 提案者に金額だけを見せる
  say 提案者に届くのは金額だけで、最も高いビルダーBを選ぶ。
  role 提案者
  pick ビルダーB

step 提案者が中身を見ずに署名する
  say 提案者は中身を見ないまま、ブロックの頭に署名する。
  role 提案者
  stamp ビルダーB: 署名済み

step 封を開けて全文を公開する
  say 署名を受けたリレーが全文を公開する。負けた列の中身は公開されない。
  role リレー
  open ビルダーB

step バリデーターが投票する
  say バリデーターが実行し直して確かめ、正しければ投票する。あなたの取引はBのブロックの4番目で確定する。
  line バリデーター: 票1, 票2, 票3, 票4, 票5, 票6, 票7, 票8, 票9, 票10, 票11, 票12
`,R=`// How a transaction sent on Ethereum gets into a block through builder bids and is voted on.
// Each card is one builder's block and each chip is one transaction. Your own transaction is the coloured chip.
// Builders reorder and seal their blocks, and the proposer picks by price alone and signs without seeing the contents.
lineup How an auction decides what goes in a block

role Relay [note: Seals the contents]
role Proposer [note: Sees only the price]

box Mempool [order: none]
box BuilderA as Builder A
box BuilderB as Builder B [color: violet]
box BuilderC as Builder C
box Validators [color: green, order: none]

item send, swap, mint, stake, repay, settle, redeem [note: Transaction (named for what it does)]
item mine [color: amber, note: Your transaction]
item private1, private2 [color: blue, note: Private (sent straight to a builder without the mempool)]
item v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12 [color: green, label: ✓, note: Vote]

step Transactions line up
  say A transaction you send enters the mempool and waits with everyone else's.
  line Mempool: send, mine, swap, mint, stake, repay, settle, redeem

step Builders pick an order and bid
  say Builders reorder the transactions, add private ones the mempool never saw, and name a price.
  line BuilderA: send, swap, mine, mint, stake, repay, settle, redeem
  line BuilderB: private1, private2, mint, mine, send, swap, stake, repay
  line BuilderC: send, swap, mint, stake, repay, settle, redeem
  note BuilderA: 0.05 ETH
  note BuilderB: 0.12 ETH
  note BuilderC: 0.08 ETH

step The relay seals the contents
  say The relay holds the contents and hides them, so the proposer cannot steal them.
  role Relay
  seal BuilderA
  seal BuilderB
  seal BuilderC

step The proposer sees only the price
  say Only the price reaches the proposer, who picks the highest bid, Builder B.
  role Proposer
  pick BuilderB

step The proposer signs without looking
  say The proposer signs the block header without seeing the contents.
  role Proposer
  stamp BuilderB: Signed

step The seal opens and the block is published
  say With the signature in hand, the relay publishes the full block. The losing blocks stay hidden.
  role Relay
  open BuilderB

step Validators vote
  say Validators re-execute the block and vote for it if it is correct. Your transaction is confirmed as #4 in Builder B's block.
  line Validators: v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12
`,L=`// Ethereum でブロックが出てから確定して戻せなくなるまで。
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
`,F=`// How an Ethereum block becomes final and cannot be reverted.
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
`,I=`// 直しの枝 fix と作業の枝 feature を、merge commit で main へ取り込むまで。
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
`,q=`// Bringing the fix branch and the feature branch into main with merge commits.
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
`,O=`// 8件の取引から組んだ Merkle 木で、取引3が含まれることを根まで辿って証明する。
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
`,M=`// Prove that transaction 3 is in a Merkle tree built from 8 transactions, by climbing to the root.
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
`,j=`// ネット通販の注文 #1042 が受け付けられ、届いた後に返品されて返金で閉じるまでの状態。
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
`,N=`// The states of online order #1042, from the order to delivery, then a return and a refund that close it.
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
`,J=`// 支払いと後から届く知らせの見本。お金は硬貨で運び、注文の状態を帯で追う
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
`,G=`// Payment and later notice example. Money moves as a coin, and the strip follows the order state
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
`,V=`// 作業の枝 feature を main の先端へ rebase し、main を早送りで進めて履歴を 1 本にするまで。
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
`,z=`// Rebasing the work branch feature onto the tip of main, then fast-forwarding main into one straight history.
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
`,Y=`// 失敗してやり直す見本。同じ線を 2 度引き、待つ処理と何回目かを箱の中と下に見せる
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
`,_=`// Retry example. Draw the same line twice, and show the wait and the attempt count inside and under the box
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
`,K=`// 送ったトランザクションが網を伝わって作る人に届き、手数料の高い順にブロックへ入り、前のブロックの hash を持って鎖につながるまで。
// 読み手は送り手、宛先、量、手数料を打ち込んで送り、ブロックを作る釦を押し、ブロックの中のチップを押して量を書き換えられる。
// チップ 1 枚が 1 件のトランザクションで、チップには名前と手数料だけを出す。
try トランザクションがブロックに入るまで

route ノードの網: あなた - node-1 - node-4 - 作る人, あなた - node-2 - node-5 - 作る人, node-1 - node-3 - 作る人, node-2 - node-4 [from: あなた, to: 作る人]
queue メモリプール [order: 手数料]
chain 機械の列 [edit: 量]
ask 送り手, 宛先, 量, 手数料 [into: メモリプール, via: ノードの網]
press ブロックを作る [from: メモリプール, into: 機械の列, take: 3]

item 他1 [宛先: Carol, 量: 3, 手数料: 7]
item 他2 [宛先: Dave, 量: 5, 手数料: 5]
item 他3 [宛先: Erin, 量: 2, 手数料: 4]
item 他4 [宛先: Bob, 量: 8, 手数料: 9]
item 他5 [宛先: Carol, 量: 1, 手数料: 6]
item 他6 [宛先: Erin, 量: 4, 手数料: 8]
item 他7 [宛先: Dave, 量: 6, 手数料: 6]
item 他8 [宛先: Bob, 量: 2, 手数料: 3]
item 他9 [宛先: Carol, 量: 7, 手数料: 4]
item 他10 [宛先: Erin, 量: 3, 手数料: 2]

step トランザクションが並んで待つ
  say メモリプールのトランザクションは手数料の高い順に並び、作る人がブロックに入れるのを待つ。
  line 機械の列: 他4, 他5, 他8
  line 機械の列: 他1, 他2, 他3
  line メモリプール: 他6, 他7, 他9, 他10

step あなたが送る
  say あなたのトランザクションは網を伝わって作る人に届き、手数料の順でメモリプールに並ぶ。
  ask あなた, Bob, 5, 12

step ブロックを作る
  say 作る人は手数料の高い順に3件をブロック3に入れ、prevにブロック2のhashを持たせる。
  press ブロックを作る

step 中身を書き換える
  say ブロック2の他2の量を書き換えるとhashが変わり、ブロック3が持つprevと食い違う。
  item 他2 [量: 50]
`,Q=`// How a transaction you send crosses the network to the builder, enters a block in fee order, and joins the chain by holding the previous block's hash.
// The reader types a sender, recipient, amount and fee and sends it, presses the button that builds a block, and taps a chip in a block to change its amount.
// Each chip is one transaction and shows only its name and fee.
try How a transaction gets into a block

route Network: You - node-1 - node-4 - Builder, You - node-2 - node-5 - Builder, node-1 - node-3 - Builder, node-2 - node-4 [from: You, to: Builder]
queue Mempool [order: Fee]
chain Chain [edit: Amount]
ask Sender, To, Amount, Fee [into: Mempool, via: Network]
press Build [from: Mempool, into: Chain, take: 3]

item tx1 [To: Carol, Amount: 3, Fee: 7]
item tx2 [To: Dave, Amount: 5, Fee: 5]
item tx3 [To: Erin, Amount: 2, Fee: 4]
item tx4 [To: Bob, Amount: 8, Fee: 9]
item tx5 [To: Carol, Amount: 1, Fee: 6]
item tx6 [To: Erin, Amount: 4, Fee: 8]
item tx7 [To: Dave, Amount: 6, Fee: 6]
item tx8 [To: Bob, Amount: 2, Fee: 3]
item tx9 [To: Carol, Amount: 7, Fee: 4]
item tx10 [To: Erin, Amount: 3, Fee: 2]

step Transactions wait in line
  say Transactions in the mempool line up from the highest fee and wait for the builder to put them in a block.
  line Chain: tx4, tx5, tx8
  line Chain: tx1, tx2, tx3
  line Mempool: tx6, tx7, tx9, tx10

step You send one
  say Your transaction crosses the network to the builder and lines up in the mempool by its fee.
  ask You, Bob, 5, 12

step The builder makes a block
  say The builder puts the three highest fees into block 3 and gives it block 2's hash as prev.
  press Build

step Someone changes a block
  say Changing the amount of tx2 in block 2 changes its hash, so it no longer matches the prev that block 3 holds.
  item tx2 [Amount: 50]
`,X=`// ウォレットで署名して取引を送る見本。署名した取引を札で運び、段ごとに呼ぶ命令を見せる
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
`,Z=`// Wallet signing example. The signed transaction runs as a tag, and each step shows the call it makes
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
`,$=`// 箱と線と印を元にしたブロックを手元で足し、Bridgeがトークンを別のチェーンへ渡す図を描く
architecture 足したブロックでBridgeを描く

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
`,ee=`// Add blocks based on a box, a line, and an icon, and draw a bridge handing a token to another chain
architecture Draw a bridge with added blocks

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
`,ne=`// L2 から L1 へ資産を引き出す時の 7 日の待ち。
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
`,te=`// The 7-day wait when withdrawing assets from L2 to L1.
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
`,oe=`// リリースまでの 14 日の工程。
// 設計、実装、テスト、リリースの 4 つの作業を、目盛り 1 つが 1 日の軸に太い棒で並べる。実装とテストは期間が重なる。
// 針が進むと、通った分の棒が濃く塗られる。箱と拡大の帯を持たない、作業の棒だけの図。
time リリースまでの工程

scale 日 1d 14 [from: 1]
task design as 設計 0-2 [color: blue]
task build as 実装 3-8 [color: violet]
task test as テスト 7-10 [color: amber]
task ship as リリース 13 [color: green]

step 設計
  say 最初の3日で画面と仕様を決める。
  now -> 2

step 実装とテスト
  say 4日目から実装し、8日目からテストを重ねて進める。
  now -> 10

step リリース
  say 14日目にリリースする。全ての作業の棒が塗られる。
  now -> 13
`,se=`// A 14-day schedule up to a release.
// Four tasks, design, build, test and release, are thick bars on an axis where one tick is one day. Build and test overlap.
// As the needle moves, the part of each bar it has passed fills in. A diagram of task bars only, with no boxes or zoom band.
time Schedule up to the release

scale day 1d 14 [from: 1]
task design as Design 0-2 [color: blue]
task build as Build 3-8 [color: violet]
task test as Test 7-10 [color: amber]
task ship as Release 13 [color: green]

step Design
  say Settle the screens and the spec in the first 3 days.
  now -> 2

step Build and test
  say Start building on day 4, and start testing alongside it on day 8.
  now -> 10

step Release
  say Release on day 14. Every task bar is filled.
  now -> 13
`,ae=`// ECサイトで利用者が出した注文が、配信網とWebの層とAPIの層を通り、在庫と決済を経て待ち行列へ積まれるまで。
// 上の区画が店の外で、利用者と借りているサービスを置く。下の区画が自社で動かす店の中。
architecture ECサイトで注文が流れる道

group 外 as 店の外 [note: 利用者と借りるサービス, color: slate, icon: globe]
  box 画面 as 利用者の画面 [note: 品物を選ぶ, icon: user]
  box CDN as 配信網 [note: 近くから頁を返す, icon: globe]
  box 決済 as 決済のサービス [note: カードで払う, color: violet, icon: card]
end

group 中 as 店の中 [note: 自社で動かす, color: blue, icon: cart]
  box Web as Webの層 [note: 頁を組む, icon: server]
  box API as APIの層 [note: 注文を受ける, icon: code]
  box 在庫 as 在庫の仕組み [note: 残りを数える, icon: box]
  box DB as データベース [note: 注文を残す, icon: db]
  box 待ち as 注文の待ち行列 [note: 後で片付ける仕事, color: amber, icon: layers]
end

strip 注文: 番号, 品物, 代金, 在庫, 状態

step 頁を開く
  say 利用者が品物の頁を開く。画像や決まった頁は配信網が近くの置き場から返し、置き場に無い頁だけをWebの層へ取りに行く。
  画面 -> CDN: 頁を開く [side: right]
  CDN -> Web: 無い頁だけ
  note CDN: 画像は置き場から返す

step 注文を送る
  say 利用者が注文のボタンを押す。注文は配信網を素通りしてWebの層に届き、Webの層がAPIの層へ渡す。
  code POST /api/orders
  Web -> API: 注文する
  set 番号: #2087
  set 品物: 靴1足
  set 代金: 8800円
  set 状態: 受付

step 在庫を押さえる
  say APIの層が在庫の仕組みに残りを聞いて1足を押さえ、注文をデータベースに残す。払う前に押さえるので、同じ靴を2人に売らない。
  API -> 在庫: 押さえる
  note 在庫: 残り3足 → 2足
  API -> DB: 注文を残す [side: left]
  set 在庫: 押さえた
  set 状態: 支払い待ち

step 代金を払う
  say APIの層が外の決済のサービスに代金を頼み、カードの承認を受け取る。カードの番号は店の中に残さない。
  API -> 決済: 8800円を請求 [carry: coin]
  決済 -> API: 承認 [carry: none]
  set 代金: 8800円 [tag: 払った]
  set 状態: 支払い済

step 待ち行列に積む
  say 時間の掛かる出荷の手配と知らせのメールは、注文の待ち行列に積んで後で片付ける。APIの層は積んだらすぐに利用者の画面へ受付を返す。
  API -> 待ち: 積む [tag: #2087, side: below]
  note 画面: 注文#2087を受け付けた
  set 状態: 出荷待ち

step 後ろで片付ける
  say 待ち行列から仕事を取り出した処理が、押さえた在庫を引き当てて出荷へ回す。利用者は待たずに次の頁へ進める。
  待ち -> 在庫: 引き当てる [side: right]
  note 在庫: 残り2足
  set 在庫: 引き当てた [tag: 済]
  set 状態: 出荷の手配
`,re=`// How an order placed on an online shop passes the CDN, the web tier and the API tier, holds stock, gets paid and lands in the queue.
// The top region is outside the shop, with the user and the rented services. The lower region is inside the shop, run by the company itself.
architecture How an order flows through an online shop

group outside as Outside the shop [note: user and rented services, color: slate, icon: globe]
  box screen as User's screen [note: picks an item, icon: user]
  box cdn as CDN [note: serves pages nearby, icon: globe]
  box pay as Payment service [note: takes the card, color: violet, icon: card]
end

group inside as Inside the shop [note: run in-house, color: blue, icon: cart]
  box web as Web tier [note: builds pages, icon: server]
  box api as API tier [note: takes orders, icon: code]
  box stock as Stock service [note: counts what is left, icon: box]
  box db as Database [note: keeps orders, icon: db]
  box queue as Order queue [note: work for later, color: amber, icon: layers]
end

strip Order: No., Item, Price, Stock, Status

step Open the page
  say The user opens an item page. The CDN serves images and fixed pages from a nearby cache, and only fetches pages it does not have from the web tier.
  screen -> cdn: open page [side: right]
  cdn -> web: missing pages
  note cdn: images from the cache

step Send the order
  say The user presses the order button. The order passes straight through the CDN to the web tier, which hands it to the API tier.
  code POST /api/orders
  web -> api: place order
  set No.: #2087
  set Item: 1 pair of shoes
  set Price: 8,800 yen
  set Status: received

step Hold the stock
  say The API tier asks the stock service what is left, holds one pair, and keeps the order in the database. Holding it before payment stops the same pair being sold twice.
  api -> stock: hold
  note stock: 3 left → 2 left
  api -> db: keep order [side: left]
  set Stock: held
  set Status: awaiting payment

step Take the payment
  say The API tier asks the outside payment service for the money and gets the card approval back. The card number is never kept inside the shop.
  api -> pay: charge 8,800 yen [carry: coin]
  pay -> api: approved [carry: none]
  set Price: 8,800 yen [tag: paid]
  set Status: paid

step Queue the work
  say Slow work such as arranging the shipment and sending the mail goes into the order queue for later. The API tier tells the user's screen the order is in as soon as it is queued.
  api -> queue: queue [tag: #2087, side: below]
  note screen: order #2087 received
  set Status: awaiting shipment

step Finish in the back
  say A worker takes the job from the queue, commits the held stock and passes the order on to shipping. The user does not wait and can move on to the next page.
  queue -> stock: commit [side: right]
  note stock: 2 left
  set Stock: committed [tag: done]
  set Status: arranging shipment
`,ie=`// 投稿者が上げた動画を、待ち行列から仕事を取って変換とサムネイル作りに回し、置き場に保存して配信網から視聴者へ届けるまで。
// 区画の外の上が投稿者、下が視聴者。真ん中の2つの区画が、動画を整える仕組みと届ける仕組み。
architecture 動画を上げてから視聴者に届くまで

box 投稿者 [note: 動画を上げる, color: slate, icon: user]

group 整える as 変換の仕組み [note: 上がった動画を整える, color: blue, icon: refresh]
  box 受付 as 受付のAPI [note: 動画を受け取る, icon: server]
  box 原本 as 原本の置き場 [note: 上げたままの形, icon: db]
  box 待ち as 変換の待ち行列 [note: 仕事を順に渡す, color: amber, icon: layers]
  box 変換 as 変換の仕事 [note: 画質ごとに作る, icon: refresh]
  box サムネ as サムネイルの仕事 [note: 一覧の絵を作る, icon: paint]
end

group 届ける as 届ける仕組み [note: 置いて配る, color: green, icon: globe]
  box 保存 as 配る形の置き場 [note: 変換した動画, icon: db]
  box CDN as 配信網 [note: 近くから届ける, icon: globe]
end

box 視聴者 [note: 動画を見る, color: slate, icon: user]

strip 動画: 名前, 長さ, 画質, サムネイル, 状態

step 動画を上げる
  say 投稿者が撮った動画を受付のAPIへ上げる。受付のAPIは上がったままの形を原本の置き場にしまい、後の仕事はいつでも原本からやり直せる。
  code PUT /uploads/v-318
  投稿者 -> 受付: 動画を上げる
  受付 -> 原本: しまう [side: left]
  set 名前: 旅の記録.mov
  set 長さ: 12分
  set 状態: 受付

step 仕事を積む
  say 変換は数分かかるので、受付のAPIはその場で待たずに、変換とサムネイル作りの2つの仕事を待ち行列に積む。投稿者にはすぐに受け付けたと返す。
  受付 -> 待ち: 仕事を積む [tag: v-318]
  note 待ち: 2つの仕事を待つ
  set 状態: 変換待ち

step 画質ごとに変える
  say 変換の仕事が待ち行列から1つ取り出し、原本を1080p、720p、480pの3つの画質に作り直して、配る形の置き場へ置く。見る人の回線に合わせて画質を選べるようにする。
  待ち -> 変換: 取り出す
  act 変換: 3つの画質に変える
  変換 -> 保存: 置く
  set 画質: 1080p, 720p, 480p

step サムネイルを作る
  say サムネイルの仕事がもう1つの仕事を取り出し、動画の3か所から絵を切り出して置き場へ置く。一覧の頁にはこの絵が並ぶ。
  待ち -> サムネ: 取り出す [side: left]
  act サムネ: 3か所を切り出す
  サムネ -> 保存: 絵を置く
  note 待ち: 空になった
  set サムネイル: 3枚

step 配信網へ載せる
  say 置き場の動画を配信網へ渡す。配信網は各地の置き場に写しを持ち、見る人の近くから届ける。
  保存 -> CDN: 配る
  note CDN: 各地へ写した
  set 状態: 公開 [tag: 済]

step 視聴者へ届ける
  say 視聴者が再生を押すと、近くの配信網が動画を少しずつに分けて届ける。回線が遅くなれば、途中から低い画質へ切り替える。
  視聴者 -> CDN: 再生する [side: right]
  CDN -> 視聴者: 少しずつ届ける [side: left]
  note 視聴者: 720pで見ている
`,le=`// An uploaded video goes through a queue to transcoding and thumbnail work, is stored, and reaches viewers through a CDN.
// Outside the regions, the uploader is at the top and the viewer at the bottom. The two regions in between prepare the video and deliver it.
architecture From upload to the viewer's screen

box uploader as Uploader [note: uploads a video, color: slate, icon: user]

group prepare as Transcoding [note: prepares the upload, color: blue, icon: refresh]
  box intake as Upload API [note: takes the video, icon: server]
  box raw as Original store [note: as uploaded, icon: db]
  box queue as Transcode queue [note: hands out jobs, color: amber, icon: layers]
  box transcode as Transcode job [note: one per quality, icon: refresh]
  box thumbs as Thumbnail job [note: pictures for lists, icon: paint]
end

group deliver as Delivery [note: stores and serves, color: green, icon: globe]
  box store as Delivery store [note: transcoded video, icon: db]
  box cdn as CDN [note: serves from nearby, icon: globe]
end

box viewer as Viewer [note: watches the video, color: slate, icon: user]

strip Video: Name, Length, Quality, Thumbnails, Status

step Upload the video
  say The uploader sends the recorded video to the upload API. The API puts it as uploaded into the original store, so any later job can start again from the original.
  code PUT /uploads/v-318
  uploader -> intake: upload
  intake -> raw: keep [side: left]
  set Name: trip-diary.mov
  set Length: 12 min
  set Status: received

step Queue the jobs
  say Transcoding takes minutes, so the upload API does not wait and puts two jobs on the queue, one to transcode and one for thumbnails. The uploader hears back right away.
  intake -> queue: queue jobs [tag: v-318]
  note queue: 2 jobs waiting
  set Status: waiting to transcode

step Transcode by quality
  say The transcode job takes one job from the queue, rebuilds the original in three qualities, 1080p, 720p and 480p, and puts them in the delivery store. Each viewer can then get the quality that suits their connection.
  queue -> transcode: take
  act transcode: make 3 qualities
  transcode -> store: put
  set Quality: 1080p, 720p, 480p

step Make thumbnails
  say The thumbnail job takes the other job, cuts pictures from three points in the video and puts them in the store. These pictures fill the list pages.
  queue -> thumbs: take [side: left]
  act thumbs: cut 3 frames
  thumbs -> store: put pictures
  note queue: now empty
  set Thumbnails: 3

step Load onto the CDN
  say The stored video is handed to the CDN. The CDN keeps copies in many places and serves each viewer from nearby.
  store -> cdn: serve
  note cdn: copied out
  set Status: public [tag: done]

step Deliver to the viewer
  say When the viewer presses play, the nearest CDN sends the video in small pieces. If the connection slows, it switches to a lower quality partway.
  viewer -> cdn: play [side: right]
  cdn -> viewer: send in pieces [side: left]
  note viewer: watching in 720p
`,he=`// ウォレットで送った取引が、mempoolで待ち、手数料を上げて置き換えられ、ブロックに入って確定するまでの状態。
// 最初の段より前の線は、期限切れでmempoolから落ちる、今回は通らない道。
state 送った取引が確定するまでの状態

box 署名済み [note: nonce 7を付けた, color: blue, icon: sign]
box 待機中 [note: mempoolで待つ, color: amber, icon: clock]
box ブロック入り [note: 確認を待つ, color: violet, icon: block]
box 確定 [note: もう戻らない, color: green, icon: check]
box 落ちた [note: 送り直しが要る, color: rose, icon: x]

strip nonce 7の取引: ハッシュ, 手数料, 確認数, 経過

待機中 -> 落ちた: 期限切れ
落ちた -> finish

step 署名する
  say ウォレットが取引にnonce 7を付けて署名し、署名済みから始まる。まだ誰にも送っていない。
  start -> 署名済み: 署名する [tag: nonce 7]
  set ハッシュ: 0x3fa2…
  set 手数料: 1 gwei
  set 確認数: 0
  set 経過: 0秒

step mempoolへ送る
  say ノードへ送ると、待機中に移る。手数料が低いので、ブロックを作る側にすぐには選ばれない。
  署名済み -> 待機中: ノードへ送る [tag: nonce 7]
  set 経過: 1秒

step 手数料を上げて置き換える
  say 同じnonceで手数料を上げた取引を送り、前の取引を置き換える。状態は待機中のままなので、同じ状態へ戻る矢印で表す。
  待機中 -> 待機中: 手数料を上げる [tag: nonce 7]
  note 待機中: 置き換えた
  set ハッシュ: 0x9c1e…
  set 手数料: 3 gwei
  set 経過: 2分

step ブロックに入る
  say 手数料が上がったので選ばれ、ブロックに入る。確認数は1で、まだ確定ではない。
  待機中 -> ブロック入り: 取り込まれる [tag: nonce 7]
  set 確認数: 1
  set 経過: 2分12秒

step 確定する
  say 後ろにブロックが積まれて確定し、確定に移る。ここから先は取引が取り消されない。
  ブロック入り -> 確定: 確定する [tag: nonce 7]
  set 確認数: 64
  set 経過: 15分

step 記録を閉じる
  say 確定は終わりの状態で、ここから先へは移らない。ウォレットの履歴に済んだ取引として残る。
  確定 -> finish: 履歴に残す [tag: nonce 7]
`,ce=`// The states of a transaction sent from a wallet, as it waits in the mempool, is replaced with a higher fee, and lands in a block until it is final.
// The lines before the first step are the path where it expires and drops out of the mempool, which it does not take this time.
state States of a sent transaction until it is final

box signed as Signed [note: Nonce 7 set, color: blue, icon: sign]
box pending as Pending [note: In the mempool, color: amber, icon: clock]
box included as In a block [note: Awaiting confirms, color: violet, icon: block]
box final as Final [note: Cannot be undone, color: green, icon: check]
box dropped as Dropped [note: Must be resent, color: rose, icon: x]

strip Tx nonce 7: Hash, Fee, Confirms, Elapsed

pending -> dropped: Expire
dropped -> finish

step Sign
  say The wallet signs the transaction with nonce 7, and it starts at Signed. It has not been sent to anyone yet.
  start -> signed: Sign [tag: nonce 7]
  set Hash: 0x3fa2…
  set Fee: 1 gwei
  set Confirms: 0
  set Elapsed: 0 s

step Send to the mempool
  say Sending it to a node moves it to Pending. The fee is low, so block builders do not pick it right away.
  signed -> pending: Send to node [tag: nonce 7]
  set Elapsed: 1 s

step Replace with a higher fee
  say A transaction with the same nonce and a higher fee replaces the earlier one. The state stays Pending, so the arrow goes back to the same state.
  pending -> pending: Raise fee [tag: nonce 7]
  note pending: Replaced
  set Hash: 0x9c1e…
  set Fee: 3 gwei
  set Elapsed: 2 min

step Land in a block
  say With the higher fee it is picked and lands in a block. It has 1 confirmation and is not final yet.
  pending -> included: Get included [tag: nonce 7]
  set Confirms: 1
  set Elapsed: 2 min 12 s

step Become final
  say More blocks are built on top, and it moves to Final. From here the transaction cannot be reversed.
  included -> final: Finalize [tag: nonce 7]
  set Confirms: 64
  set Elapsed: 15 min

step Close the record
  say Final is an end state, and nothing moves on from it. The wallet keeps it in its history as a settled transaction.
  final -> finish: Keep in history [tag: nonce 7]
`,pe=`// 動画のサブスクの契約が、無料体験から有料に移り、支払いに失敗して止まった後、カードを直して再開するまでの状態。
// 最初の段より前の線は、止まる前ならいつでも選べるが今回は通らない解約の道。
state サブスクの契約が止まって再開するまでの状態

box 無料体験 [note: 14日だけ使える, color: blue, icon: flag]
box 有料 [note: 毎月払う, color: green, icon: card]
box 猶予期間 [note: 7日は見られる, color: amber, icon: clock]
box 停止 [note: 見られない, color: rose, icon: off]
box 解約 [note: 契約を終える, color: rose, icon: x]

strip 契約 #A-207: 料金, 支払い, 見られるか, 経過

無料体験 -> 解約
有料 -> 解約: 解約する
猶予期間 -> 解約
解約 -> finish

step 無料体験を始める
  say 会員になると、無料体験から始まる。カードは登録するが、14日の間は請求しない。
  start -> 無料体験: 会員になる [tag: #A-207]
  set 料金: 0円
  set 支払い: まだ
  set 見られるか: 見られる
  set 経過: 0日

step 有料に移る
  say 体験の期間が終わると、自動で有料に移る。月の料金の990円を毎月引き落とす。
  無料体験 -> 有料: 体験が終わる [tag: #A-207]
  set 料金: 990円
  set 支払い: 払った
  set 経過: 14日

step 支払いに失敗する
  say 翌月の引き落としがカードの期限切れで通らず、猶予期間に移る。すぐには止めず、7日の間は動画も見られる。
  有料 -> 猶予期間: 支払いに失敗 [tag: #A-207]
  set 支払い: 失敗した
  set 経過: 44日

step 停止する
  say 猶予の7日が過ぎても払われず、停止に移る。契約は残るが、動画は見られなくなる。
  猶予期間 -> 停止: 期限が過ぎる [tag: #A-207]
  set 見られるか: 見られない
  set 経過: 52日

step 再開する
  say 会員がカードを直して払い、有料に戻る。止まっていた間の分は請求せず、また見られる。
  停止 -> 有料: カードを直す [tag: #A-207]
  note 有料: 再開した
  set 支払い: 払った
  set 見られるか: 見られる
  set 経過: 55日
`,de=`// The states of a video subscription that moves from a free trial to paid, stops after a failed payment, and resumes once the card is fixed.
// The lines before the first step are the cancel path, open any time before it stops, which it does not take this time.
state States of a subscription that stops and resumes

box trial as Free trial [note: 14 days to try, color: blue, icon: flag]
box paid as Paid [note: Billed monthly, color: green, icon: card]
box grace as Grace period [note: 7 days to watch, color: amber, icon: clock]
box suspended as Suspended [note: Cannot watch, color: rose, icon: off]
box cancelled as Cancelled [note: Plan ended, color: rose, icon: x]

strip Plan #A-207: Price, Payment, Can watch, Elapsed

trial -> cancelled
paid -> cancelled: Cancel
grace -> cancelled
cancelled -> finish

step Start the free trial
  say Signing up starts the plan at Free trial. The card is registered, but nothing is charged for 14 days.
  start -> trial: Sign up [tag: #A-207]
  set Price: 0 yen
  set Payment: not yet
  set Can watch: yes
  set Elapsed: 0 days

step Move to paid
  say When the trial ends, the plan moves to Paid on its own. The monthly price of 990 yen is charged every month.
  trial -> paid: Trial ends [tag: #A-207]
  set Price: 990 yen
  set Payment: paid
  set Elapsed: 14 days

step Fail to pay
  say The next month's charge fails because the card has expired, and the plan moves to Grace period. It is not stopped right away, and videos stay watchable for 7 days.
  paid -> grace: Payment fails [tag: #A-207]
  set Payment: failed
  set Elapsed: 44 days

step Suspend
  say The 7 days of grace pass without payment, and the plan moves to Suspended. The plan remains, but videos can no longer be watched.
  grace -> suspended: Time runs out [tag: #A-207]
  set Can watch: no
  set Elapsed: 52 days

step Resume
  say The member fixes the card and pays, and the plan goes back to Paid. The stopped days are not charged, and videos can be watched again.
  suspended -> paid: Fix the card [tag: #A-207]
  note paid: Resumed
  set Payment: paid
  set Can watch: yes
  set Elapsed: 55 days
`,ue=`// #318の問い合わせが受け付けられ、担当が決まって解決した後、同じ件の連絡で再開してから閉じるまでの状態。
// 最初の段より前の線は、返事が来ないまま自動で閉じる、今回は通らない道。
state 問い合わせの対応が閉じるまでの状態

box 受付 [note: 番号を付ける, color: blue, icon: doc]
box 対応中 [note: 担当が調べる, color: violet, icon: user]
box 回答待ち [note: 返事を待つ, color: amber, icon: clock]
box 解決済み [note: 直ったと分かった, color: green, icon: check]
box 再開 [note: 同じ件が再び起きた, color: violet, icon: refresh]
box 完了 [note: 記録に残す, color: green, icon: lock]
box 自動で閉じた [note: 返事が無かった, color: rose, icon: x]

strip 問い合わせ #318: 担当, 返事, 経過

回答待ち -> 自動で閉じた: 14日たつ
自動で閉じた -> finish

step 受け付ける
  say 窓口の画面から問い合わせが届き、受付から始まる。番号は#318で、やり取りは全て記録に残る。
  start -> 受付: 問い合わせが届く [tag: #318]
  set 担当: まだ
  set 返事: まだ
  set 経過: 0時間

step 担当を決める
  say 内容を見て担当を割り当て、対応中に移る。担当が原因を調べ始める。
  受付 -> 対応中: 担当を割り当てる [tag: #318]
  set 担当: 2班
  set 経過: 1時間

step 回答を待つ
  say 直し方の手順を送り、回答待ちに移る。返事が14日来なければ、この状態から自動で閉じる。
  対応中 -> 回答待ち: 手順を送る [tag: #318]
  set 返事: 待っている
  set 経過: 3時間

step 解決する
  say 手順で直ったと返事が届き、解決済みに移る。すぐには閉じず、同じ件の連絡を7日待つ。
  回答待ち -> 解決済み: 直ったと返事 [tag: #318]
  set 返事: 直った
  set 経過: 1日

step 再開する
  say 同じ件でまた問い合わせが届き、再開に移る。番号は同じ#318のまま、続きとして同じ担当が受ける。
  解決済み -> 再開: 再び問い合わせ [tag: #318]
  set 返事: また起きた
  set 経過: 3日

step 閉じる
  say 担当が設定を直し、完了に移って問い合わせを閉じる。完了は終わりの状態で、通った道は記録として残る。
  再開 -> 完了: 設定を直す [tag: #318]
  完了 -> finish: 閉じる [tag: #318]
  note 完了: 2回目で直った
  set 返事: 直った
  set 経過: 4日
`,me=`// The states of support request #318, from intake and an assigned owner to a fix, then a reopen on the same issue before it closes.
// The lines before the first step are the path where it closes on its own with no reply, which it does not take this time.
state States of a support request until it closes

box new as New [note: Gets a number, color: blue, icon: doc]
box working as In progress [note: Owner looks into it, color: violet, icon: user]
box waiting as Awaiting reply [note: Waits for the user, color: amber, icon: clock]
box resolved as Resolved [note: Confirmed fixed, color: green, icon: check]
box reopened as Reopened [note: Same issue came back, color: violet, icon: refresh]
box closed as Closed [note: Kept on record, color: green, icon: lock]
box autoclosed as Auto-closed [note: No reply came, color: rose, icon: x]

strip Request #318: Owner, Reply, Elapsed

waiting -> autoclosed: 14 days pass
autoclosed -> finish

step Take the request
  say A request arrives from the help form and starts at New. It gets the number #318, and every exchange is recorded.
  start -> new: Request arrives [tag: #318]
  set Owner: none yet
  set Reply: none yet
  set Elapsed: 0 h

step Assign an owner
  say Someone reads it and assigns an owner, and it moves to In progress. The owner starts looking for the cause.
  new -> working: Assign owner [tag: #318]
  set Owner: Team 2
  set Elapsed: 1 h

step Wait for a reply
  say The fix steps are sent, and it moves to Awaiting reply. If no reply comes in 14 days, it closes on its own from here.
  working -> waiting: Send steps [tag: #318]
  set Reply: waiting
  set Elapsed: 3 h

step Resolve
  say A reply says the steps fixed it, and it moves to Resolved. It does not close right away, and waits 7 days for news on the same issue.
  waiting -> resolved: Reply says fixed [tag: #318]
  set Reply: fixed
  set Elapsed: 1 day

step Reopen
  say Another request comes in on the same issue, and it moves to Reopened. It keeps the number #318, and the same owner picks it up as a follow-up.
  resolved -> reopened: Asks again [tag: #318]
  set Reply: happened again
  set Elapsed: 3 days

step Close
  say The owner fixes a setting, and it moves to Closed. Closed is a final state, and the path it took stays on record.
  reopened -> closed: Fix setting [tag: #318]
  closed -> finish: Close [tag: #318]
  note closed: Fixed on 2nd try
  set Reply: fixed
  set Elapsed: 4 days
`,ye=`// 公開の枝releaseで見つかった不具合を直しの枝hotfixで直し、releaseへ取り込んで版の印を付け、同じ直しをcherry-pickでmainへ戻すまで。
// 上の帯がmain、真ん中がhotfix、下がrelease。mainには直しのcommitだけを写し、releaseにだけある変更は持ち込まない。
git 公開版の不具合を直してmainへ戻す

branch main [note: 次の版を作る]
branch hotfix [note: 直しの枝]
branch release [note: 公開している版]

box 印 as 版の印 [note: v2.4.0はR, color: green, icon: flag]

strip 参照: main, release, hotfix, 公開中

step 公開の枝がある
  say mainのAからreleaseを切り、Rをv2.4.0として公開した。その後もmainには次の版に向けたBが積まれている。
  commit A on main [hash: 3fa0c19, note: 一覧を足す]
  release from A
  commit R on release [hash: 6c1e2b8, note: 版をv2.4.0にする]
  commit B on main [hash: 8b04f71, note: 検索を足す]
  set main: B 8b04f71
  set release: R 6c1e2b8
  set 公開中: v2.4.0

step 直しの枝を切る
  say 公開中のv2.4.0で合計の金額がずれる不具合が見つかる。releaseの先端Rからhotfixを切り、直しのHを積む。
  code git switch -c hotfix release → git commit
  hotfix from R
  commit H on hotfix [hash: 5b2e7a1, note: 合計の丸めを直す]
  set hotfix: H 5b2e7a1

step 公開の枝へ取り込む
  say releaseでhotfixをmerge commitで取り込む。M1の親はreleaseの先端Rとhotfixの先端Hの2つで、releaseだけがM1へ進む。
  code git switch release → git merge --no-ff hotfix
  commit M1 on release merge hotfix [hash: 9a1c3e4, note: hotfixを取り込む]
  set release: M1 9a1c3e4

step 版の印を付ける
  say M1にv2.4.1の印を付けて公開する。印は動かない札なので、後からどのcommitを配ったかを辿れる。
  code git tag v2.4.1 → git push origin v2.4.1
  note 印: v2.4.1はM1
  set 公開中: v2.4.1 [tag: 新しい]

step mainへ戻す
  say mainでcherry-pickを使い、Hの変更だけをBの上に写してH'を作る。releaseにだけある版の変更Rは持ち込まず、mainがH'へ進む。
  code git switch main → git cherry-pick 5b2e7a1
  commit H' on main [hash: d72b9a3, note: Hの直しを写す]
  set main: H' d72b9a3

step 両方に直しが入る
  say releaseのv2.4.1とmainの次の版の両方に、同じ直しが入った。H'は親がBなので、Hと同じ変更でもhashは別になる。
  code git log --graph --oneline main release
`,ge=`// A bug found on the release branch is fixed on the hotfix branch, merged into release and tagged, and the same fix goes back to main with cherry-pick.
// The top lane is main, the middle is hotfix and the bottom is release. Only the fix commit is copied to main, and nothing that lives only on release comes along.
git Fix a released bug and bring it back to main

branch main [note: Next version]
branch hotfix [note: Fix branch]
branch release [note: Released version]

box tag as Version tag [note: v2.4.0 is R, color: green, icon: flag]

strip Refs: main, release, hotfix, Live

step The release branch
  say release was cut from A on main, and R went out as v2.4.0. Since then main has gained B for the next version.
  commit A on main [hash: 3fa0c19, note: Add the list]
  release from A
  commit R on release [hash: 6c1e2b8, note: Set version 2.4.0]
  commit B on main [hash: 8b04f71, note: Add search]
  set main: B 8b04f71
  set release: R 6c1e2b8
  set Live: v2.4.0

step Cut a fix branch
  say A bug in the live v2.4.0 makes the total come out wrong. Cut hotfix from R at the tip of release, and add the fix H.
  code git switch -c hotfix release → git commit
  hotfix from R
  commit H on hotfix [hash: 5b2e7a1, note: Fix total rounding]
  set hotfix: H 5b2e7a1

step Merge into release
  say On release, merge hotfix with a merge commit. M1 has two parents, R at the tip of release and H at the tip of hotfix, and only release moves to M1.
  code git switch release → git merge --no-ff hotfix
  commit M1 on release merge hotfix [hash: 9a1c3e4, note: Merge hotfix]
  set release: M1 9a1c3e4

step Tag the version
  say Tag M1 as v2.4.1 and ship it. A tag is a ref that never moves, so you can always trace which commit went out.
  code git tag v2.4.1 → git push origin v2.4.1
  note tag: v2.4.1 is M1
  set Live: v2.4.1 [tag: new]

step Bring it back to main
  say On main, cherry-pick copies only the change in H onto B as H'. The version change R that lives only on release stays out, and main moves to H'.
  code git switch main → git cherry-pick 5b2e7a1
  commit H' on main [hash: d72b9a3, note: Copy the fix in H]
  set main: H' d72b9a3

step The fix is in both
  say The same fix is now in v2.4.1 on release and in the next version on main. H' has B as its parent, so its hash differs from H even though the change is the same.
  code git log --graph --oneline main release
`,fe=`// 機能の枝featureに積んだいくつものcommitをsquashで1つにまとめてmainへ取り込み、featureを消すまで。
// 上の帯がmain、下の帯がfeature。まとめたSは親をmainの先端の1つだけ持ち、featureのcommitはmainの履歴に入らない。
git 機能の枝をsquashで1つにまとめて取り込む

branch main [note: 取り込む先]
branch feature [note: 機能の枝]

box 遠く as 遠くのrepo [note: mainだけを置いている, color: violet, icon: cloud]

strip 参照: main, mainの履歴

step 枝を切る
  say mainにAとBがある。Bから機能の枝featureを切って移る。
  code git switch -c feature
  commit A on main [hash: 3fa0c19, note: 最初の形]
  commit B on main [hash: 8b04f71, note: 一覧を足す]
  feature from B
  set main: B 8b04f71
  set mainの履歴: B, A

step 細かく積む
  say featureに検索の機能を3つのcommitに分けて積み、遠くのrepoへ送る。途中の誤字の直しや検査の足し忘れも、そのまま履歴に残る。
  code git commit → git push -u origin feature
  commit C1 on feature [hash: c41d0e5, note: 検索の枠を足す]
  commit C2 on feature [hash: 1e94a7c, note: 誤字を直す]
  commit C3 on feature [hash: f1e7d28, note: 検査を足す]
  note 遠く: featureがC3まで届いた

step mainが進む
  say その間に他の人の変更DとEがmainに入る。featureは古いBから分かれたまま。
  commit D on main [hash: e5f8312, note: 税率を直す]
  commit E on main [hash: 2a7c9d0, note: 送料を足す]
  set main: E 2a7c9d0
  set mainの履歴: E, D, B, A

step squashでまとめる
  say mainへ戻ってfeatureをsquashで取り込み、C1からC3の変更を全て合わせた1つのcommit Sを作る。Sの親はmainの先端Eだけで、featureとは線で繋がらない。
  code git switch main → git merge --squash feature → git commit
  HEAD -> E: git switch main
  main -> E
  commit S on main [hash: 7d3a5e2, note: C1からC3をまとめる]
  note 遠く: mainにSが届いた
  set main: S 7d3a5e2
  set mainの履歴: S, E, D, B, A [tag: 一直線]

step 機能の枝を消す
  say squashしたfeatureのcommitはmainから辿れないので、-dでは消せず-Dで消す。遠くのrepoの枝も消す。featureの札が消え、どの枝からも辿れなくなったC1からC3は点線の丸になる。
  code git branch -D feature → git push origin --delete feature
  delete feature
  note 遠く: featureを消した

step 1本の履歴
  say mainを先端から辿ると、S、E、D、B、Aの1本になる。C1からC3はどの枝からも辿れなくなり、reflogの期限が過ぎると掃除される。
  code git log --oneline main
`,be=`// Squashing the many commits on the feature branch into one, bringing it into main, and deleting the feature branch.
// The top lane is main and the lower lane is feature. The squashed S has only one parent, the tip of main, and the feature commits never enter main's history.
git Squash a feature branch into one commit on main

branch main [note: Merge target]
branch feature [note: Feature branch]

box remote as Remote repo [note: holds only main, color: violet, icon: cloud]

strip Refs: main, main history

step Cut a branch
  say main has A and B. Cut the feature branch feature from B and switch to it.
  code git switch -c feature
  commit A on main [hash: 3fa0c19, note: First shape]
  commit B on main [hash: 8b04f71, note: Add the list]
  feature from B
  set main: B 8b04f71
  set main history: B, A

step Commit in small pieces
  say Build search on feature in three commits and push them to the remote repo. The typo fix and the forgotten check along the way stay in the history as they are.
  code git commit → git push -u origin feature
  commit C1 on feature [hash: c41d0e5, note: Add the search box]
  commit C2 on feature [hash: 1e94a7c, note: Fix a typo]
  commit C3 on feature [hash: f1e7d28, note: Add checks]
  note remote: feature is up to C3

step main moves on
  say Meanwhile other people's changes D and E land on main. feature still branches off the old B.
  commit D on main [hash: e5f8312, note: Fix the tax rate]
  commit E on main [hash: 2a7c9d0, note: Add shipping]
  set main: E 2a7c9d0
  set main history: E, D, B, A

step Squash into one
  say Switch back to main and squash-merge feature to make one commit S that holds every change from C1 to C3. S has only E at the tip of main as its parent, and no line joins it to feature.
  code git switch main → git merge --squash feature → git commit
  HEAD -> E: git switch main
  main -> E
  commit S on main [hash: 7d3a5e2, note: Squash C1 to C3]
  note remote: main now has S
  set main: S 7d3a5e2
  set main history: S, E, D, B, A [tag: straight]

step Delete the feature branch
  say The squashed feature commits cannot be reached from main, so -d refuses and -D deletes the branch. The branch on the remote repo goes too. The feature ref disappears, and C1 to C3, now reachable from no branch, turn into dotted circles.
  code git branch -D feature → git push origin --delete feature
  delete feature
  note remote: feature deleted

step One straight history
  say Following main back from its tip gives one line: S, E, D, B, A. C1 to C3 can no longer be reached from any branch and are cleaned up once the reflog expires.
  code git log --oneline main
`,we=`// 新しい店を借りてから開店するまでの4週間の準備の工程。
// 目盛り1つが1日で、内装、採用、仕入れ、研修、試しの営業の作業を太い棒で並べる。作業は日をまたいで重なる。
// 針が進むと通った分の棒が塗られ、内装の引き渡しと開店の2つの節目の状態が変わる。
time 新しい店を開くまでの準備

scale 日 1d 31 [from: 1]
task interior as 内装 0-11 [color: violet]
task hire as 採用 3-10 [color: blue]
task stock as 仕入れ 12-20 [color: amber]
task train as 研修 14-21 [color: blue]
task trial as 試しの営業 21-24 [color: rose]
point 引き渡し at 11
point 開店 at 27

strip 開店までの進み: 経過, 店員, 開店まで

step 内装の工事を始める
  say 店を借りた日から内装の工事を始める。工事は12日かかり、その間は店に品物を置けない。
  note 引き渡し: 工事中 [color: amber]
  note 開店: 準備中 [color: blue]
  now -> 2
  set 経過: 3日
  set 店員: 0人
  set 開店まで: 25日

step 工事と並べて店員を集める
  say 工事が終わるのを待たず、4日目から採用を始める。2つの作業を重ねて、開店までの日数を縮める。
  now -> 10
  set 経過: 11日
  set 店員: 6人
  set 開店まで: 17日

step 内装を引き渡してもらう
  say 12日目に内装が仕上がり、店を引き渡してもらう。ここから棚に品物を入れられる。
  note 引き渡し: 済み [color: green]
  now -> 11
  set 経過: 12日
  set 開店まで: 16日

step 仕入れと研修を重ねる
  say 品物を仕入れて棚に並べながら、店員はレジと接客の研修を受ける。研修は並べた棚を使って行う。
  span 14-20: 仕入れと研修が重なる7日 [color: slate]
  now -> 20
  set 経過: 21日
  set 開店まで: 7日

step 試しの営業で確かめる
  say 知り合いを招いて4日だけ店を開け、レジの流れと品切れを確かめる。直す所は開店までの2日で直す。
  span 25-26: 直す2日 [color: rose]
  now -> 24
  set 経過: 25日
  set 開店まで: 3日

step 開店する
  say 28日目に店を開ける。内装の引き渡しから16日で、全ての作業の棒が塗られる。
  引き渡し -> 開店: 16日 [carry: none]
  note 開店: 営業中 [color: green]
  now -> 27
  set 経過: 28日
  set 開店まで: 0日
`,ke=`// A 4-week schedule from renting a new shop to opening it.
// One tick is one day, and the fit-out, hiring, stocking, training and trial run are thick bars. The tasks overlap across days.
// As the needle moves, the part of each bar it has passed fills in, and the status of the two points, the handover and the opening, changes.
time Getting a new shop ready to open

scale day 1d 31 [from: 1]
task interior as Fit-out 0-11 [color: violet]
task hire as Hiring 3-10 [color: blue]
task stock as Stocking 12-20 [color: amber]
task train as Training 14-21 [color: blue]
task trial as Trial run 21-24 [color: rose]
point Handover at 11
point Opening at 27

strip Road to opening: Elapsed, Staff, Days left

step Start the fit-out
  say The fit-out starts the day the shop is rented. It takes 12 days, and nothing can be stocked until it is done.
  note Handover: Building [color: amber]
  note Opening: Preparing [color: blue]
  now -> 2
  set Elapsed: 3 d
  set Staff: 0
  set Days left: 25 d

step Hire alongside the fit-out
  say Hiring starts on day 4 without waiting for the fit-out to end. Running both at once brings the opening closer.
  now -> 10
  set Elapsed: 11 d
  set Staff: 6
  set Days left: 17 d

step Take over the finished shop
  say The fit-out is done on day 12 and the shop is handed over. From here the shelves can be stocked.
  note Handover: Done [color: green]
  now -> 11
  set Elapsed: 12 d
  set Days left: 16 d

step Stock and train at once
  say While the goods come in and fill the shelves, the staff train on the till and with customers, using the stocked shelves.
  span 14-20: 7 days of stocking and training [color: slate]
  now -> 20
  set Elapsed: 21 d
  set Days left: 7 d

step Check with a trial run
  say The shop opens for 4 days to invited friends to check the till and spot gaps on the shelves. Fixes go into the 2 days before opening.
  span 25-26: 2 days to fix [color: rose]
  now -> 24
  set Elapsed: 25 d
  set Days left: 3 d

step Open the shop
  say The shop opens on day 28, 16 days after the handover, and every task bar is filled.
  Handover -> Opening: 16 days [carry: none]
  note Opening: Open [color: green]
  now -> 27
  set Elapsed: 28 d
  set Days left: 0 d
`,ve=`// 8チームのトーナメント表で、1回戦から決勝まで勝ったチームが上へ進み、優勝が根になるまでを追う。
// 試合の箱は勝ったチームが上がる所で、線の札が勝ったチームの名前を運ぶ。
tree 社内のフットサル大会

box 優勝旗 [note: まだ渡さない, color: amber, icon: flag]

strip 勝ち上がり: 準決勝へ, 決勝へ, 優勝

step 8チームが出そろう
  say 部署ごとに8チームが出る。隣どうしが1回戦で当たるように並べる。
  leaf 営業
  leaf 開発
  leaf 経理
  leaf 総務
  leaf 人事
  leaf 広報
  leaf 法務
  leaf 企画

step 1回戦を組む
  say 隣どうしの2チームを1つの試合にまとめる。1回戦は4試合になる。
  node 第1試合 of 営業, 開発
  node 第2試合 of 経理, 総務
  node 第3試合 of 人事, 広報
  node 第4試合 of 法務, 企画

step 1回戦を戦う
  say 4試合それぞれで勝ったチームが、試合の箱へ上がる。負けたチームはここで終わる。
  開発 -> 第1試合 [tag: 開発]
  経理 -> 第2試合 [tag: 経理]
  広報 -> 第3試合 [tag: 広報]
  法務 -> 第4試合 [tag: 法務]
  set 準決勝へ: 開発, 経理, 広報, 法務

step 準決勝を戦う
  say 1回戦の勝者どうしが当たる。勝った2チームが決勝へ進む。
  node 準決勝1 of 第1試合, 第2試合
  node 準決勝2 of 第3試合, 第4試合
  第1試合 -> 準決勝1 [tag: 開発]
  第4試合 -> 準決勝2 [tag: 法務]
  set 決勝へ: 開発, 法務

step 決勝で優勝が決まる
  say 残った2チームが決勝で当たる。勝ったチームが根の優勝に着き、木が1つにまとまる。
  node 優勝 of 準決勝1, 準決勝2
  準決勝2 -> 優勝 [tag: 法務]
  set 優勝: 法務

step 優勝旗を渡す
  say 優勝した法務に優勝旗を渡す。3回勝てば、8チームの頂点に立つ。
  優勝 -> 優勝旗: 渡す [tag: 法務]
  note 優勝旗: 法務が受け取った
`,xe=`// An 8-team tournament bracket, following the winners from the first round to the final until the champion becomes the root.
// A match box is where its winner climbs to, and the tag on each line carries the winning team's name.
tree Office futsal cup

box Trophy [note: Not awarded yet, color: amber, icon: flag]

strip Progress: To the semis, To the final, Champion

step Eight teams enter
  say Eight teams enter, one per department. Neighbours are lined up to meet in the first round.
  leaf Sales
  leaf Dev
  leaf Finance
  leaf Admin
  leaf HR
  leaf PR
  leaf Legal
  leaf Planning

step Draw the first round
  say Put each pair of neighbours into one match. The first round has four matches.
  node Game1 of Sales, Dev
  node Game2 of Finance, Admin
  node Game3 of HR, PR
  node Game4 of Legal, Planning

step Play the first round
  say The winner of each of the four matches climbs to its match box. The losing teams stop here.
  Dev -> Game1 [tag: Dev]
  Finance -> Game2 [tag: Finance]
  PR -> Game3 [tag: PR]
  Legal -> Game4 [tag: Legal]
  set To the semis: Dev, Finance, PR, Legal

step Play the semifinals
  say The first-round winners meet each other. The two teams that win go on to the final.
  node Semi1 of Game1, Game2
  node Semi2 of Game3, Game4
  Game1 -> Semi1 [tag: Dev]
  Game4 -> Semi2 [tag: Legal]
  set To the final: Dev, Legal

step The final decides the champion
  say The last two teams meet in the final. The winner reaches the root, and the tree comes together as one.
  node Champion of Semi1, Semi2
  Semi2 -> Champion [tag: Legal]
  set Champion: Legal

step Award the trophy
  say The trophy goes to Legal, the champion. Three wins put a team on top of all eight.
  Champion -> Trophy: Award [tag: Legal]
  note Trophy: Legal holds it
`,Te=`// 会社のサイトの頁を、下の頁から区分の頁、トップへと組み上げ、訪れた人が見積もりの頁まで辿る道を追う。
// 前半の3段で下の頁からトップまでの階層を組み、後半の3段で訪れた人がトップから2回のクリックで見積もりに着く。
tree 会社のサイトの頁の階層

box 訪れた人 [note: 検索から来た, color: slate, icon: user]

strip 訪問: 入口, 辿った頁, クリック

step 下の頁を並べる
  say 一番下の頁を、区分ごとに隣り合うよう左から並べる。中身を持つのはこの頁たち。
  leaf 機能
  leaf 導入事例
  leaf プラン
  leaf 見積もり
  leaf お知らせ
  leaf 技術記事
  leaf 会社概要
  leaf 採用
  leaf 問い合わせ

step 区分の頁にまとめる
  say 下の頁を、製品、料金、ブログ、会社案内の4つの区分の頁にまとめる。区分の頁は下の頁への入口になる。
  node 製品 of 機能, 導入事例
  node 料金 of プラン, 見積もり
  node ブログ of お知らせ, 技術記事
  node 会社案内 of 会社概要, 採用, 問い合わせ

step トップの頁を置く
  say 4つの区分の頁をトップの頁から開けるようにする。トップが根になり、どの頁もトップから辿れる。
  node トップ of 製品, 料金, ブログ, 会社案内

step 訪れた人がトップを開く
  say 検索から来た人が、まずトップの頁を開く。
  訪れた人 -> トップ: 開く
  set 入口: トップ
  set クリック: 0回

step 料金の頁へ進む
  say メニューの料金を押して、区分の頁へ1段下りる。
  トップ -> 料金
  set 辿った頁: 料金
  set クリック: 1回

step 見積もりの頁に着く
  say 料金の頁から見積もりを押して着く。どの下の頁にもトップから2回で届くので、迷いにくい。
  料金 -> 見積もり
  set 辿った頁: 料金, 見積もり
  set クリック: 2回
  note 訪れた人: 見積もりを読んでいる
`,De=`// Build the pages of a company site from the bottom pages up through the section pages to the home page, then follow a visitor down to the quote page.
// The first 3 steps build the hierarchy up to the home page. The last 3 follow a visitor who reaches the quote page in two clicks from home.
tree Page hierarchy of a company site

box visitor as Visitor [note: Came from search, color: slate, icon: user]

strip Visit: Entry, Pages visited, Clicks

step Line up the bottom pages
  say Line up the bottom pages from the left, keeping each section's pages next to each other. These pages hold the content.
  leaf Features
  leaf Cases
  leaf Plans
  leaf Quote
  leaf News
  leaf TechPosts
  leaf About
  leaf Careers
  leaf Contact

step Group them into sections
  say Group the bottom pages under four section pages, Products, Pricing, Blog and Company. A section page is the way into its pages.
  node Products of Features, Cases
  node Pricing of Plans, Quote
  node Blog of News, TechPosts
  node Company of About, Careers, Contact

step Place the home page
  say Make the four section pages open from the home page. Home becomes the root, and every page can be reached from it.
  node Home of Products, Pricing, Blog, Company

step A visitor opens home
  say A visitor who came from search opens the home page first.
  visitor -> Home: Open
  set Entry: Home
  set Clicks: 0

step Go to the pricing page
  say Clicking Pricing in the menu goes one level down to a section page.
  Home -> Pricing
  set Pages visited: Pricing
  set Clicks: 1

step Reach the quote page
  say A click on Quote from the pricing page arrives. Every bottom page is two clicks from home, so visitors rarely get lost.
  Pricing -> Quote
  set Pages visited: Pricing, Quote
  set Clicks: 2
  note visitor: Reading the quote
`,Ae=`// HDウォレットで、1つの種から親の鍵、用途、コインの種類、口座、受け取りの住所へと鍵が枝分かれする様子を追う。
// 前半の3段で住所から種まで鍵の木を組み、後半の3段で復元の言葉から種を作り、種から住所1まで鍵を導く。
tree HDウォレットの鍵の派生

box 復元の言葉 [note: 12語を紙に控える, color: amber, icon: key]

strip 導出: 道, 出した鍵, 住所

step 受け取りの住所を並べる
  say 財布が使う受け取りの住所は4つ。どれも別々に作った鍵でなく、1つの種から導いた鍵で決まる。
  leaf 住所1 [hash: 7c2e]
  leaf 住所2 [hash: 41b9]
  leaf 住所3 [hash: d05a]
  leaf 住所4 [hash: 9e73]

step 口座とコインの種類で分ける
  say 住所は口座ごとにまとまり、口座はコインの種類ごとに分かれる。ETHの下に普段用と取引用、BTCの下に長期用の口座を持つ。
  node 普段用 of 住所1, 住所2 [hash: 3a8f]
  node 取引用 of 住所3 [hash: c612]
  node 長期用 of 住所4 [hash: 58d4]
  node ETH of 普段用, 取引用 [hash: b27e]
  node BTC of 長期用 [hash: 6f01]

step 種まで束ねる
  say コインの種類は用途44'の鍵の下に並び、用途は親の鍵の下に、親の鍵は種の下にある。全ての鍵が1つの種へ集まる。
  node 用途44' of ETH, BTC [hash: e94c]
  node 親の鍵 of 用途44' [hash: 12fd]
  node 種 of 親の鍵 [hash: a5c3]

step 言葉から種と親の鍵を作る
  say 控えた12語の言葉から種を作り、種から親の鍵を出す。言葉さえ残っていれば、どの鍵も作り直せる。
  復元の言葉 -> 種: 作る
  種 -> 親の鍵 [tag: 12fd]
  set 道: m
  set 出した鍵: 12fd

step 用途とコインの種類と口座を辿る
  say 親の鍵から用途44'、ETHの60'、口座の0'の順に子の鍵を出す。印の'は、子の鍵から親の鍵を辿れないよう守る導き方。
  親の鍵 -> 用途44' [tag: e94c]
  用途44' -> ETH [tag: b27e]
  ETH -> 普段用 [tag: 3a8f]
  set 道: m/44'/60'/0'
  set 出した鍵: 3a8f

step 受け取りの住所に着く
  say 口座の鍵から受け取り用の0番目の鍵を出すと、住所1が決まる。同じ道を辿れば、別の財布でも同じ住所になる。
  普段用 -> 住所1 [tag: 7c2e]
  set 道: m/44'/60'/0'/0/0
  set 出した鍵: 7c2e
  set 住所: 住所1
`,Ce=`// How an HD wallet branches one seed into keys, through the master key, purpose, coin type and account down to receiving addresses.
// The first 3 steps build the key tree from the addresses up to the seed. The last 3 make the seed from the recovery phrase and derive keys down to addr1.
tree Key derivation in an HD wallet

box phrase as Recovery phrase [note: 12 words kept on paper, color: amber, icon: key]

strip Derivation: Path, Derived key, Address

step Line up the receiving addresses
  say The wallet uses four receiving addresses. Each one comes from a key derived from a single seed, not from a key made on its own.
  leaf addr1 [hash: 7c2e]
  leaf addr2 [hash: 41b9]
  leaf addr3 [hash: d05a]
  leaf addr4 [hash: 9e73]

step Split by account and coin type
  say Addresses group under accounts, and accounts split by coin type. ETH holds a daily and a trading account, and BTC holds a holding account.
  node Daily of addr1, addr2 [hash: 3a8f]
  node Trading of addr3 [hash: c612]
  node Holding of addr4 [hash: 58d4]
  node ETH of Daily, Trading [hash: b27e]
  node BTC of Holding [hash: 6f01]

step Gather everything into the seed
  say The coin types sit under the purpose 44' key, the purpose sits under the master key, and the master key sits under the seed. Every key gathers into one seed.
  node purpose44' of ETH, BTC [hash: e94c]
  node master of purpose44' [hash: 12fd]
  node seed of master [hash: a5c3]

step Make the seed and master key
  say Turn the 12 saved words into the seed, and derive the master key from the seed. As long as the words survive, every key can be made again.
  phrase -> seed: Make
  seed -> master [tag: 12fd]
  set Path: m
  set Derived key: 12fd

step Follow purpose, coin type and account
  say From the master key, derive child keys for purpose 44', ETH's 60' and account 0' in turn. The ' mark is a way of deriving that keeps a child key from leading back to its parent.
  master -> purpose44' [tag: e94c]
  purpose44' -> ETH [tag: b27e]
  ETH -> Daily [tag: 3a8f]
  set Path: m/44'/60'/0'
  set Derived key: 3a8f

step Reach the receiving address
  say Deriving receiving key number 0 from the account key fixes addr1. Following the same path gives the same address in any other wallet.
  Daily -> addr1 [tag: 7c2e]
  set Path: m/44'/60'/0'/0/0
  set Derived key: 7c2e
  set Address: addr1
`,Ee=`// 病院に着いた患者が、受付から診察待ち、検査、会計の列へ移っていく順番。
// チップ1枚が1人の患者で、名前は来た用件。自分は色の付いたチップで追い、急ぎの患者は赤いチップで示す。
// 受付はその日に来た患者を控えるだけで順番を持たず、診察待ちから先の列は上から呼ばれる。
lineup 病院の受付から会計までの順番

role 受付係 [note: 来た順に受け付ける]
role 看護師 [note: 急ぎかを見分ける]
role 医師 [note: 診て検査を決める]

box 受付 [order: none]
box 診察待ち
box 検査 [color: violet]
box 会計 [color: green]

item 発熱, 腹痛, 健診, 頭痛 [note: 患者 (名前は来た用件)]
item 自分 [color: amber, note: 自分 (腰の痛みで来た)]
item 胸痛 [color: rose, note: 急ぎの患者 (救急で運ばれた)]

step 受付に診察券を出す
  say 着いた患者は受付に診察券を出す。受付は来た患者を控えるだけで、まだ順番は付けない。
  role 受付係
  line 受付: 発熱, 腹痛, 自分, 健診, 頭痛

step 来た順に診察を待つ
  say 受付を済ませた順に診察待ちの列に入る。自分は3番目で、待ちは40分ほど。
  role 受付係
  line 診察待ち: 発熱, 腹痛, 自分, 健診, 頭痛
  note 診察待ち: 40分

step 急ぎの患者を先に呼ぶ
  say 胸の痛みを訴える患者が救急で運ばれた。看護師が急ぎと見て、受付を通さず列の先頭に入れる。
  role 看護師
  line 診察待ち: 胸痛, 発熱, 腹痛, 自分, 健診, 頭痛
  note 診察待ち: 60分

step 診察を終えて検査へ回る
  say 医師が上から順に診て、検査が要る患者を検査の列へ回す。自分はレントゲンを撮る。
  role 医師
  line 検査: 胸痛, 発熱, 腹痛, 自分, 健診
  line 診察待ち: 頭痛
  note 診察待ち: 10分

step 検査を終えて会計へ進む
  say 結果を見た医師が会計へ回す。胸痛の患者はそのまま入院し、列から外れる。
  role 医師
  line 会計: 発熱, 腹痛, 自分
  line 検査: 健診

step 上から払って帰る
  say 会計の列は上から順に呼ばれ、自分も3番目に払い終える。これでこの日の受診は終わる。
  role 受付係
  stamp 会計: 支払い済み
`,Se=`// The order in which patients at a hospital move from the front desk to the queues for the doctor, tests and payment.
// Each chip is one patient, named for why they came. You are the coloured chip, and the urgent patient is the red chip.
// The front desk only logs who came that day and keeps no order, while every queue after it is called from the top.
lineup From the front desk to payment at a hospital

role Clerk [note: Checks people in]
role Nurse [note: Spots urgent cases]
role Doctor [note: Sees and orders tests]

box Desk as Front desk [order: none]
box Waiting as Waiting for doctor
box Tests [color: violet]
box Payment [color: green]

item fever, stomach, checkup, headache [note: Patient (named for why they came)]
item me [color: amber, note: You (came with a sore back)]
item chest [color: rose, note: Urgent patient (came by ambulance)]

step Hand in your card
  say Patients hand their card to the front desk. The desk only logs who came, and gives no order yet.
  role Clerk
  line Desk: fever, stomach, me, checkup, headache

step Wait for the doctor in order
  say Patients join the queue in the order they checked in. You are third, about 40 minutes away.
  role Clerk
  line Waiting: fever, stomach, me, checkup, headache
  note Waiting: 40 min

step Call the urgent patient first
  say A patient with chest pain arrives by ambulance. The nurse sees it is urgent and puts them at the top without the desk.
  role Nurse
  line Waiting: chest, fever, stomach, me, checkup, headache
  note Waiting: 60 min

step From the doctor to tests
  say The doctor sees patients from the top and sends those who need tests to the test queue. You get an X-ray.
  role Doctor
  line Tests: chest, fever, stomach, me, checkup
  line Waiting: headache
  note Waiting: 10 min

step From tests to payment
  say The doctor reads the results and sends patients on to payment. The chest pain patient is admitted and leaves the queues.
  role Doctor
  line Payment: fever, stomach, me
  line Tests: checkup

step Pay from the top and go home
  say The payment queue is called from the top, and you pay third. That ends your visit for the day.
  role Clerk
  stamp Payment: Paid
`,Pe=`// かんばんの作業が、やること、作業中、確認待ち、済みの列を移っていく様子。
// チップ1枚が1件の作業。作業中は3件までと決め、帯の見出しの数と目盛りで今の件数を示す。枠が空くまで、急ぎの作業も取らない。確認で直しが要った作業は作業中へ差し戻す。
lineup かんばんで作業中を3件に絞る

role 開発者 [note: 作業中を上から進める]
role 確認係 [note: 仕上がりを確かめる]

box やること
box 作業中 [color: violet, limit: 3]
box 確認待ち [color: amber]
box 済み [color: green, order: none]

item 検索, 通知, 決済, 文言, 画像 [note: 作業 (名前は手を入れる所)]
item 不具合 [color: rose, note: 急ぎの不具合]

step 先にやる順に並べる
  say 作業はやることの列に、先にやる順で上から並べる。
  line やること: 検索, 通知, 決済, 文言, 画像

step 上から3件を取る
  say 作業中は3件までと決めている。上から3件を取ると枠が埋まる。
  role 開発者
  line 作業中: 検索, 通知, 決済
  line やること: 文言, 画像

step 枠が埋まっていれば取らない
  say 急ぎの不具合がやることの先頭に入った。作業中が埋まっているので、すぐには取らず今の作業を先に終える。
  role 開発者
  line やること: 不具合, 文言, 画像

step 終えた作業を確認へ回す
  say 検索の作業が終わり、確認待ちへ回す。作業中の枠が1つ空く。
  role 開発者
  line 確認待ち: 検索
  line 作業中: 通知, 決済

step 空いた枠に次の1件を取る
  say 空いた枠に、やることの先頭の不具合を取る。数を絞るので、急ぎの作業も待たずに流れる。
  role 開発者
  line 作業中: 不具合, 通知, 決済
  line やること: 文言, 画像

step 確かめて済みにする
  say 確認係が検索の仕上がりを確かめて済みへ送る。終えた通知が入れ替わりに確認待ちへ来る。
  role 確認係
  line 済み: 検索
  line 確認待ち: 通知
  line 作業中: 不具合, 決済

step 直しが要れば作業中へ差し戻す
  say 確認係が通知に直す所を見つけ、作業中へ差し戻す。差し戻した作業も枠を1つ使うので、作業中はまた3件で埋まる。
  role 確認係
  line 作業中: 不具合, 決済, 通知
  line 確認待ち:
`,He=`// How tasks on a kanban board move through the To do, Doing, Review and Done columns.
// Each chip is one task. Doing is limited to 3 tasks, and the count and ticks at the top of the column show how many are in it. Even an urgent task waits until a slot frees up. A task that needs fixing after review is sent back to Doing.
lineup Limit work in progress to 3 on a kanban board

role Developer [note: Works Doing from the top]
role Reviewer [note: Checks the result]

box Todo as To do
box Doing [color: violet, limit: 3]
box Review [color: amber]
box Done [color: green, order: none]

item search, notify, checkout, wording, images [note: Task (named for the part it changes)]
item bug [color: rose, note: Urgent bug]

step Order by what comes first
  say Tasks go in the To do column from the top, in the order they should be done.
  line Todo: search, notify, checkout, wording, images

step Take the top 3
  say Doing is limited to 3 tasks. Taking the top 3 fills every slot.
  role Developer
  line Doing: search, notify, checkout
  line Todo: wording, images

step Take nothing while Doing is full
  say An urgent bug lands at the top of To do. Doing is full, so it is not taken yet, and the current work is finished first.
  role Developer
  line Todo: bug, wording, images

step Send finished work to review
  say The search task is done and goes to Review. One slot in Doing frees up.
  role Developer
  line Review: search
  line Doing: notify, checkout

step Fill the free slot with the next task
  say The free slot takes the bug at the top of To do. With the limit in place, even urgent work flows without a long wait.
  role Developer
  line Doing: bug, notify, checkout
  line Todo: wording, images

step Check it and mark it done
  say The reviewer checks the search task and moves it to Done. The finished notify task takes its place in Review.
  role Reviewer
  line Done: search
  line Review: notify
  line Doing: bug, checkout

step Send it back to Doing if it needs a fix
  say The reviewer finds something to fix in notify and sends it back to Doing. A task sent back takes a slot too, so Doing is full with 3 again.
  role Reviewer
  line Doing: bug, checkout, notify
  line Review:
`,We=`// 変更がレビューとステージングを通って本番へ出るまでの流れ。
// チップ1枚が1件の変更。ステージングには2件まで載せる。ステージングで問題が出た変更は開発へ差し戻し、直してから流し直す。
lineup 変更を本番へ出す流れ [shape: stations]

role 開発者 [note: 変更を作って直す]
role レビュー係 [note: 変更を読んで通す]
role 運用係 [note: ステージングで確かめて本番へ出す]

box dev as 開発
box review as レビュー [color: violet]
box staging as ステージング [color: amber, limit: 2]
box live as 本番 [color: green, order: none, note: v1.4]

item ログイン, 検索, 通知 [note: 変更 (名前は手を入れる所)]

step 変更を作る
  say 開発で3件の変更を作る。チップは開発の駅に並ぶ。
  role 開発者
  line dev: ログイン, 検索, 通知

step 2件をレビューに出す
  say 出来上がったログインと検索をレビューに出す。通知はまだ開発に残る。
  role 開発者
  line review: ログイン, 検索
  line dev: 通知

step レビューを通してステージングへ
  say レビュー係が2件を読んで通し、ステージングへ載せる。ステージングは2件で埋まる。
  role レビュー係
  line staging: ログイン, 検索
  line review:

step 問題が出たら開発へ差し戻す
  say 運用係がステージングで検索の遅さを見つけ、開発へ差し戻す。ステージングの枠が1つ空く。
  role 運用係
  line dev: 検索, 通知
  line staging: ログイン

step 確かめた変更を本番へ出す
  say 問題の出なかったログインを本番へ出す。本番の版が1つ上がる。
  role 運用係
  line live: ログイン
  line staging:
  note live: v1.5

step 直した変更を流し直す
  say 直した検索を、もう一度レビューへ出す。差し戻した変更も同じ順に駅を通る。
  role 開発者
  line review: 検索
  line dev: 通知
`,Be=`// How a change goes through review and staging before it reaches production.
// Each chip is one change. Staging holds up to 2 changes. A change that fails on staging is sent back to Dev, fixed and sent through again.
lineup Ship a change to production [shape: stations]

role Developer [note: Makes and fixes changes]
role Reviewer [note: Reads and approves changes]
role Operator [note: Checks on staging and ships]

box dev as Dev
box review as Review [color: violet]
box staging as Staging [color: amber, limit: 2]
box live as Production [color: green, order: none, note: v1.4]

item login, search, notify [note: Change (named for the part it touches)]

step Make the changes
  say Three changes are made in Dev. The chips line up at the Dev stop.
  role Developer
  line dev: login, search, notify

step Send 2 to review
  say The finished login and search changes go to Review. notify stays in Dev.
  role Developer
  line review: login, search
  line dev: notify

step Approve them onto staging
  say The reviewer reads both changes, approves them and puts them on Staging. Staging is now full with 2.
  role Reviewer
  line staging: login, search
  line review:

step Send it back to Dev if it fails
  say The operator finds search too slow on Staging and sends it back to Dev. One slot on Staging frees up.
  role Operator
  line dev: search, notify
  line staging: login

step Ship what passed
  say login passed, so it ships to production. The production version goes up by one.
  role Operator
  line live: login
  line staging:
  note live: v1.5

step Send the fix through again
  say The fixed search goes to Review again. A change sent back passes the same stops in the same order.
  role Developer
  line review: search
  line dev: notify
`,Ue=`// スマートコントラクトが自動検査と監査人の確認を通って監査済みになるまでの流れ。
// チップ1枚が1本のコントラクト。監査人は1本ずつ読む。重い指摘が出たコントラクトは提出へ差し戻し、直してから自動検査に流し直す。
lineup コントラクトの監査の流れ [shape: stations]

role 開発者 [note: コントラクトを書いて直す]
role 監査人 [note: 1本ずつ読んで指摘を出す]

box submitted as 提出
box checks as 自動検査 [color: amber]
box audit as 監査 [color: violet, limit: 1]
box done as 監査済み [color: green, order: none]

item Vault, Token, Router [note: コントラクト]

step 監査に出す
  say 開発者が3本のコントラクトを監査に出す。
  role 開発者
  line submitted: Vault, Token, Router

step 自動検査にかける
  say 3本を自動検査にかける。よくある誤りを先に機械で拾う。
  line checks: Vault, Token, Router
  line submitted:

step 1本ずつ監査する
  say 監査人は1本ずつ読む。まずVaultを読み、残りは自動検査の後で待つ。
  role 監査人
  line audit: Vault
  line checks: Token, Router

step 重い指摘が出たら差し戻す
  say Vaultに資金を引き出せる穴が見つかり、提出へ差し戻す。監査は次のTokenへ移る。
  role 監査人
  line submitted: Vault
  line audit: Token
  line checks: Router
  note submitted: 指摘2件

step 通ったコントラクトを監査済みにする
  say 指摘の無かったTokenを監査済みにし、Routerを読み始める。
  role 監査人
  line done: Token
  line audit: Router
  line checks:

step 直したコントラクトを流し直す
  say 開発者が指摘を直したVaultを、もう一度自動検査にかける。
  role 開発者
  line checks: Vault
  line submitted:
  note submitted: 指摘0件
`,Re=`// How smart contracts go through automated checks and an auditor's review before they are audited.
// Each chip is one contract. The auditor reads one at a time. A contract with a serious finding is sent back to Submitted, fixed and put through the checks again.
lineup Audit smart contracts [shape: stations]

role Developer [note: Writes and fixes contracts]
role Auditor [note: Reads one at a time and reports findings]

box submitted as Submitted
box checks as Auto checks [color: amber]
box audit as Audit [color: violet, limit: 1]
box done as Audited [color: green, order: none]

item Vault, Token, Router [note: Contract]

step Submit for audit
  say The developer submits three contracts for audit.
  role Developer
  line submitted: Vault, Token, Router

step Run the automated checks
  say The three contracts go through automated checks, which catch common mistakes first.
  line checks: Vault, Token, Router
  line submitted:

step Audit one at a time
  say The auditor reads one contract at a time. Vault goes first, and the rest wait after the checks.
  role Auditor
  line audit: Vault
  line checks: Token, Router

step Send it back on a serious finding
  say A hole that lets funds be drained is found in Vault, so it is sent back to Submitted. The audit moves on to Token.
  role Auditor
  line submitted: Vault
  line audit: Token
  line checks: Router
  note submitted: 2 findings

step Mark what passed as audited
  say Token has no findings, so it is marked audited, and the auditor starts on Router.
  role Auditor
  line done: Token
  line audit: Router
  line checks:

step Put the fix through again
  say The developer fixes the findings in Vault and puts it through the automated checks again.
  role Developer
  line checks: Vault
  line submitted:
  note submitted: 0 findings
`,Le=`// L2で送った取引が、シーケンサーの列に並び、バッチにまとめられてL1に載るまで。
// チップ1枚が1件の取引で、自分の分は色の付いたチップで追う。並びは最初にシーケンサーが決め、L1に載るまで変わらない。
// 封はバッチを圧縮した形で、L1に載ったデータは誰でも開いて中身を確かめられる。
lineup ロールアップが取引をまとめてL1に載せるまで

role シーケンサー [note: 届いた順に並べる]
role バッチャー [note: まとめてL1へ出す]
role 検証者 [note: L1のデータで確かめる]

box 受け口 [order: none]
box L2ブロック
box バッチ [color: violet]
box L1 [color: green]

item 送金, 交換, 発行, 預入, 引出, 返済, 清算 [note: 取引 (名前はその取引でする事)]
item 自分 [color: amber, note: 自分の取引]

step 取引が受け口に届く
  say L2で送った取引は、シーケンサーの受け口に届く。L1で直に送るより手数料が安い。
  line 受け口: 送金, 交換, 自分, 発行, 預入, 引出, 返済, 清算

step シーケンサーが順番を決める
  say シーケンサーは届いた順に並べてL2のブロックにし、数秒で結果を返す。まだL1には載っていない。
  role シーケンサー
  line L2ブロック: 送金, 交換, 自分, 発行, 預入, 引出
  note L2ブロック: 数秒

step 並びを保ってバッチにまとめる
  say バッチャーはL2のブロックを並びのまま集めて、1つのバッチにする。後から届いた取引は次のバッチに回る。
  role バッチャー
  line バッチ: 送金, 交換, 自分, 発行, 預入, 引出
  note バッチ: 6件

step 圧縮してL1へ出す
  say バッチを圧縮し、L1へ1件の取引として出す。L1の手数料を6件で分けるので、1件あたりが安くなる。
  role バッチャー
  line L1: 送金, 交換, 自分, 発行, 預入, 引出
  seal L1
  note L1: 1件

step 誰でも中身を確かめられる
  say L1に載ったデータは誰でも読める。開いて取引を作り直せば、L2の状態が正しいかを確かめられる。
  role 検証者
  open L1

step L1で確定する
  say L1のブロックが確定すると、取引の並びはL1と同じ強さで戻せなくなる。自分の取引は3番目のまま載っている。
  stamp L1: 確定
`,Fe=`// How transactions sent on L2 line up at the sequencer, get bundled into a batch and land on L1.
// Each chip is one transaction, and your own is the coloured chip. The sequencer sets the order first, and it stays the same all the way to L1.
// The seal is the compressed batch, and anyone can open the data on L1 to check what is inside.
lineup How a rollup bundles transactions onto L1

role Sequencer [note: Orders them as they arrive]
role Batcher [note: Bundles them for L1]
role Verifier [note: Checks with L1 data]

box Inbox [order: none]
box L2Block as L2 block
box Batch [color: violet]
box L1 [color: green]

item send, swap, mint, deposit, withdraw, repay, settle [note: Transaction (named for what it does)]
item mine [color: amber, note: Your transaction]

step Transactions reach the inbox
  say Transactions sent on L2 reach the sequencer's inbox. The fee is lower than sending straight on L1.
  line Inbox: send, swap, mine, mint, deposit, withdraw, repay, settle

step The sequencer sets the order
  say The sequencer puts them in arrival order into an L2 block and answers within seconds. Nothing is on L1 yet.
  role Sequencer
  line L2Block: send, swap, mine, mint, deposit, withdraw
  note L2Block: Seconds

step Bundle a batch in the same order
  say The batcher gathers the L2 blocks in order into one batch. Transactions that arrive later go into the next batch.
  role Batcher
  line Batch: send, swap, mine, mint, deposit, withdraw
  note Batch: 6 txs

step Compress and post to L1
  say The batch is compressed and posted to L1 as one transaction, so 6 transactions share one L1 fee.
  role Batcher
  line L1: send, swap, mine, mint, deposit, withdraw
  seal L1
  note L1: 1 tx

step Anyone can check the contents
  say The data on L1 is open to everyone. Unpacking it and replaying the transactions shows whether the L2 state is right.
  role Verifier
  open L1

step Final on L1
  say Once the L1 block is final, the order of the transactions can no longer be reverted, just like L1 itself. Your transaction is still third.
  stamp L1: Final
`,Ie=`// L2で送った交換の取引が、アプリからL1で戻せなくなるまでに通る5つの層。
// 札は1件の取引で、段ごとに1つ下の層へ下り、層の印にその層でした事と掛かった時間を残す。
lineup L2の取引が確定するまで [shape: layers]

box app as アプリ [note: 画面で交換を頼む, color: blue]
box wallet as ウォレット [note: 鍵で署名する, color: violet]
box l2 as L2 (ロールアップ) [note: 2000件の取引をまとめて縮める, color: amber]
box da as データの置き場 [note: まとめたデータをL1に置く, color: slate]
box l1 as L1 (Ethereum) [note: 戻せなくなるまで待つ, color: green]

item 取引 [color: blue, note: 100 USDCを替える]

step アプリで交換を頼む
  say 画面で100 USDCを別のトークンに替える取引を作る。
  line app: 取引
  note app: 頼んだ

step ウォレットが鍵で署名する
  say 取引はウォレットへ下り、持ち主の鍵で署名される。
  line wallet: 取引
  note wallet: 1秒で署名した

step L2が取引をまとめる
  say L2のシーケンサーが2000件の取引を1つのまとまりにし、数秒で結果を返す。
  line l2: 取引
  note l2: 2秒でまとめた

step まとめたデータをL1に置く
  say まとめた取引のデータは、誰でも確かめられるようにL1に置かれる。
  line da: 取引
  note da: 1分でL1に置いた

step L1で確定する
  say L1のブロックが確定すると、取引はL1と同じ強さで戻せなくなる。
  line l1: 取引
  note l1: 13分で確定した
`,qe=`// The five layers a swap sent on an L2 passes through, from the app until it can no longer be undone on L1.
// The card is one transaction. It steps down one layer per step, and each layer's mark keeps what that layer did and how long it took.
lineup An L2 transaction until it is final [shape: layers]

box app as App [note: Asks for a swap on screen, color: blue]
box wallet as Wallet [note: Signs with the private key, color: violet]
box l2 as L2 (rollup) [note: Bundles 2000 transactions into one, color: amber]
box da as Data availability [note: Posts the bundled data to L1, color: slate]
box l1 as L1 (Ethereum) [note: Waits until it cannot be undone, color: green]

item Transaction [color: blue, note: Swap 100 USDC]

step Ask for a swap in the app
  say The screen makes a transaction that swaps 100 USDC for another token.
  line app: Transaction
  note app: Asked

step The wallet signs with the private key
  say The transaction steps down to the wallet and is signed with the owner's key.
  line wallet: Transaction
  note wallet: Signed in 1 s

step The L2 bundles the transactions
  say The L2 sequencer bundles 2000 transactions into one and answers within seconds.
  line l2: Transaction
  note l2: Bundled in 2 s

step Post the bundled data to L1
  say The data of the bundled transactions is posted to L1 so that anyone can check it.
  line da: Transaction
  note da: Posted in 1 min

step L1 makes it final
  say Once the L1 block is final, the transaction can no longer be undone, as firmly as on L1.
  line l1: Transaction
  note l1: Final in 13 min
`,Oe=`// Webの画面で押した保存の頼みが、ブラウザからデータの置き場まで届くまでに通る4つの層。
// 札は1件の頼みで、段ごとに1つ下の層へ下り、層の印にその層でした事と掛かった時間を残す。
lineup Webの頼みが画面から置き場に届くまで [shape: layers]

box browser as 画面 (ブラウザ) [note: 押した保存を頼みにして送る, color: blue]
box cdn as 配信の網 (CDN) [note: 近くの拠点で受けて先へ渡す, color: violet]
box api as サーバー (API) [note: ログインと中身を確かめる, color: amber]
box db as データの置き場 (DB) [note: 行を書いて控える, color: green]

item 頼み [color: blue, note: POST /notes]

step 画面で保存を押す
  say メモの画面で保存を押すと、ブラウザが中身を頼みにして送る。
  line browser: 頼み
  note browser: 頼みを作った

step 近くの拠点が受ける
  say 頼みは配信の網へ下り、使う人に近い拠点が受けてサーバーへ渡す。
  line cdn: 頼み
  note cdn: 20ミリ秒で受けた

step サーバーが確かめる
  say サーバーはログインしている人かと、メモの中身の形を確かめる。
  line api: 頼み
  note api: 80ミリ秒で確かめた

step 置き場に書く
  say 確かめた頼みはデータの置き場へ下り、メモの行として書かれる。
  line db: 頼み
  note db: 30ミリ秒で書いた
`,Me=`// The four layers a save request from a web page passes through, from the browser down to the data store.
// The card is one request. It steps down one layer per step, and each layer's mark keeps what that layer did and how long it took.
lineup A web request from the page to the store [shape: layers]

box browser as Page (browser) [note: Turns the save tap into a request, color: blue]
box cdn as Edge network (CDN) [note: Takes it at a nearby point and passes it on, color: violet]
box api as Server (API) [note: Checks the login and the content, color: amber]
box db as Data store (DB) [note: Writes the row and keeps it, color: green]

item Request [color: blue, note: POST /notes]

step Tap save on the page
  say Tapping save on the notes page makes the browser send the content as a request.
  line browser: Request
  note browser: Made the request

step A nearby point takes it
  say The request steps down to the edge network, where a point near the user takes it and passes it to the server.
  line cdn: Request
  note cdn: Taken in 20 ms

step The server checks it
  say The server checks that the user is logged in and that the note has the right form.
  line api: Request
  note api: Checked in 80 ms

step Write it to the store
  say The checked request steps down to the data store and is written as a row of notes.
  line db: Request
  note db: Written in 30 ms
`,je=`// 撮った動画が、見る人の端末で見られるようになるまでに通る5つの層。
// 札は1本の動画で、段ごとに1つ下の層へ下り、右の目盛りの針がそこまでに経った時間を指す。
lineup 動画が見られるようになるまで [shape: stairs]

box phone as 撮った端末 [note: 撮り終えた動画を持つ, color: blue, time: 0s]
box upload as 送る [note: 動画を置き場へ送る, color: violet, time: 40s]
box encode as 変換する [note: 画質ごとの動画に作り直す, color: amber, time: 3min]
box cdn as 配信網に置く [note: 見る人の近くへ写す, color: slate, time: 20s]
box viewer as 見る人の端末 [note: 動画を読み込んで再生する, color: green, time: 3s]

item 動画 [color: blue, note: 旅行の動画]

step 撮り終える
  say 端末で旅行の動画を撮り終える。
  line phone: 動画
  note phone: 撮り終えた

step 置き場へ送る
  say 動画を端末から置き場へ送る。
  line upload: 動画
  note upload: 送り終えた

step 画質ごとに変換する
  say 置き場が動画を4つの画質に作り直す。
  line encode: 動画
  note encode: 4つの画質にした

step 配信網に置く
  say 作り直した動画を、見る人の近くの配信網へ写す。
  line cdn: 動画
  note cdn: 近くへ写した

step 見る人の端末で再生する
  say 見る人の端末が動画を読み込み、再生を始める。
  line viewer: 動画
  note viewer: 再生を始めた
`,Ne=`// The five layers a video passes through, from the phone that shot it until a viewer can watch it.
// The card is one video. It steps down one layer per step, and the needle of the scale on the right points at the time spent so far.
lineup Until a video can be watched [shape: stairs]

box phone as Shooting phone [note: Holds the finished video, color: blue, time: 0s]
box upload as Upload [note: Sends the video to storage, color: violet, time: 40s]
box encode as Encode [note: Remakes it for each quality, color: amber, time: 3min]
box cdn as Place on CDN [note: Copies it near the viewers, color: slate, time: 20s]
box viewer as Viewer's device [note: Loads and plays the video, color: green, time: 3s]

item video [color: blue, note: Trip video]

step Finish shooting
  say The phone finishes shooting a trip video.
  line phone: video
  note phone: Shot

step Upload to storage
  say The phone sends the video to storage.
  line upload: video
  note upload: Uploaded

step Encode for each quality
  say Storage remakes the video in four qualities.
  line encode: video
  note encode: Four qualities

step Place on the CDN
  say The remade video is copied to the CDN near the viewers.
  line cdn: video
  note cdn: Copied nearby

step Play on the viewer's device
  say The viewer's device loads the video and starts playback.
  line viewer: video
  note viewer: Playing
`,Je=`// コンビニのレジで、客が品数ごとに2つの列に分かれて来た順に並び、2台のレジが自分の列の先頭から順に呼ぶまで。
// 読み手は客の名前と品数を選んで列に並ばせ、レジの釦を押して列の先頭の客を呼べる。
try コンビニのレジの行列

route 店内: 入口 - おにぎりの棚 - レジ前, 入口 - 飲み物の棚 - レジ前 [from: 入口, to: レジ前]
queue 6点以上
queue 5点まで
log レジ1
log レジ2
ask 客, 品数 [into: 品数, via: 店内]
choose 品数: 6点以上, 5点まで
press レジ1が呼ぶ [from: 6点以上, into: レジ1, take: 1]
press レジ2が呼ぶ [from: 5点まで, into: レジ2, take: 1]
side 6点以上, レジ1
side 5点まで, レジ2

item 客1 [品数: 6点以上]
item 客2 [品数: 6点以上]
item 客3 [品数: 5点まで]

step 2つの列に並ぶ
  say 品数が6点以上の客はレジ1の列に、5点までの客は専用のレジ2の列に、来た順に並ぶ。
  line 6点以上: 客1, 客2
  line 5点まで: 客3

step あなたが並ぶ
  say 品数に5点までを選ぶと、あなたは棚を回ってレジ前に着き、5点までの列の最後に並ぶ。
  ask あなた, 5点まで

step レジ1が呼ぶ
  say レジ1は6点以上の列の先頭の客1を呼び、会計を始める。
  press レジ1が呼ぶ

step 専用のレジ2が呼ぶ
  say 5点まで専用のレジ2は、その列の先頭の客3を呼ぶ。
  press レジ2が呼ぶ

step あなたの番が来る
  say 品数の少ない客は会計がすぐ済むので、先に並んでいた客2より先にあなたの番が来る。
  press レジ2が呼ぶ
`,Ge=`// How shoppers at a convenience store split into two lines by how many items they carry, and how two tills each call the next shopper in their own line.
// The reader picks a name and an item count to join a line, and presses a till's button to call the shopper at the front.
try Lines at a convenience store till

route Store: Door - Snacks - Counter, Door - Drinks - Counter [from: Door, to: Counter]
queue 6+
queue 1-5
log Till1
log Till2
ask Shopper, Items [into: Items, via: Store]
choose Items: 6+, 1-5
press Call1 [from: 6+, into: Till1, take: 1]
press Call2 [from: 1-5, into: Till2, take: 1]
side 6+, Till1
side 1-5, Till2

item Guest1 [Items: 6+]
item Guest2 [Items: 6+]
item Guest3 [Items: 1-5]

step Two lines form
  say Shoppers with 6 or more items line up for till 1, and those with 1 to 5 line up for till 2, which only takes small baskets. Each line keeps the order they came in.
  line 6+: Guest1, Guest2
  line 1-5: Guest3

step You join a line
  say Pick 1-5 for items and you walk past the shelves to the counter, then join the back of the 1-5 line.
  ask You, 1-5

step Till 1 calls
  say Till 1 calls Guest1 from the front of the 6+ line and starts ringing up.
  press Call1

step The express till calls
  say Till 2, kept for 1 to 5 items, calls Guest3 from the front of its line.
  press Call2

step Your turn comes
  say Small baskets clear fast, so your turn comes before Guest2, who was in line before you.
  press Call2
`,Ve=`// 注文が倉庫の棚を回り、棚ごとの関門で在庫が足りるかを確かめられ、足りれば引き当てて出荷へ、足りなければ取り寄せ待ちへ回るまで。
// 読み手は注文の名前と水と米の数を打ち込んで送り、出荷の釦を押せる。関門の値は棚の今の在庫の数で、引き当てても減らない。
try 注文の在庫を引き当てる

route 倉庫: 受付 - 水の棚 - 米の棚 - 出荷口 [from: 受付, to: 出荷口]
queue 引き当て済み
log 取り寄せ待ち
log 出荷
ask 注文, 水, 米 [into: 引き当て済み, via: 倉庫]
press 出荷する [from: 引き当て済み, into: 出荷, take: 2]
side 引き当て済み, 出荷

check 水の棚: 水 <= 6 [no: 水の在庫不足, retry, into: 取り寄せ待ち]
check 米の棚: 米 <= 3 [no: 米の在庫不足, retry, into: 取り寄せ待ち]

item 注文1 [水: 2, 米: 1]
item 注文2 [水: 4, 米: 0]

step 引き当て済みの注文が待つ
  say 在庫は水が6箱、米が3袋。どちらの数も在庫以下の注文は引き当てられ、出荷を待つ。
  line 引き当て済み: 注文1, 注文2

step 在庫が足りる注文
  say 水1箱と米2袋の注文3は、水の棚と米の棚の関門を通り、引き当て済みの最後に並ぶ。
  ask 注文3, 1, 2

step 米が足りない注文
  say 米5袋の注文4は水の棚を通るが、米の棚で在庫の3袋を超えて止まり、取り寄せ待ちに回る。
  ask 注文4, 3, 5

step 水が足りない注文
  say 水9箱の注文5は最初の水の棚で止まる。取り寄せ待ちの注文は、品が届けば送り直せる。
  ask 注文5, 9, 1

step 出荷する
  say 出荷の釦を押すと、引き当て済みの上から2件が1回の出荷にまとまる。
  press 出荷する
`,ze=`// How an order walks the warehouse racks, where a check at each rack asks whether there is enough stock, so the order is reserved and shipped, or sent to wait for a backorder.
// The reader types an order name and how much water and rice it wants, sends it, and presses the ship button. Each check holds the rack's stock now, which reserving does not lower.
try Reserving stock for an order

route Warehouse: Intake - WaterRack - RiceRack - Dock [from: Intake, to: Dock]
queue Reserved
log Backorder
log Shipped
ask Order, Water, Rice [into: Reserved, via: Warehouse]
press Ship [from: Reserved, into: Shipped, take: 2]
side Reserved, Shipped

check WaterRack: Water <= 6 [no: Short of water, retry, into: Backorder]
check RiceRack: Rice <= 3 [no: Short of rice, retry, into: Backorder]

item Order1 [Water: 2, Rice: 1]
item Order2 [Water: 4, Rice: 0]

step Reserved orders wait
  say The stock is 6 cases of water and 3 bags of rice. An order within the stock of both is reserved and waits to ship.
  line Reserved: Order1, Order2

step An order with enough stock
  say Order3, for 1 case of water and 2 bags of rice, passes the checks at both racks and joins the end of Reserved.
  ask Order3, 1, 2

step Not enough rice
  say Order4 passes the water rack, but its 5 bags of rice go over the 3 in stock, so it stops at the rice rack and goes to Backorder.
  ask Order4, 3, 5

step Not enough water
  say Order5 wants 9 cases of water and stops at the first rack. An order on backorder can be sent again once the goods arrive.
  ask Order5, 9, 1

step Ship
  say Pressing the ship button bundles the top 2 reserved orders into one shipment.
  press Ship
`,Ye=`// マルチシグの金庫で、送金の提案が3人の署名者のうち2人以上の署名を集めた時だけ関門を通って実行され、ブロックに入るまで。
// 読み手は提案の名前と宛先と量を打ち込み、署名の数を選んで送り、実行の釦を押せる。署名が1人分の提案は金庫の関門で止まる。
try マルチシグの送金の承認

route ノードの網: あなた - node-1 - 金庫, あなた - node-2 - node-3 - 金庫 [from: あなた, to: 金庫]
queue 実行待ち
chain 機械の列
log 止まった提案
ask 提案, 宛先, 量, 署名の数 [into: 実行待ち, via: ノードの網]
choose 署名の数: 1, 2, 3
press 実行する [from: 実行待ち, into: 機械の列, take: 2]
side 実行待ち, 止まった提案

check 金庫: 署名の数 >= 2 [no: 署名が足りない, into: 止まった提案]

item 提案1 [宛先: 0xA1, 量: 3, 署名の数: 2]
item 提案2 [宛先: 0xB2, 量: 5, 署名の数: 3]

step 署名の揃った提案が待つ
  say 金庫は3人の署名者のうち2人以上が署名した提案だけを通す。提案1と提案2は署名が揃い、実行を待つ。
  line 実行待ち: 提案1, 提案2

step 署名が1人分の提案
  say あなただけが署名した提案3は網を伝わって金庫に着くが、関門で止まり、止まった提案に記録される。
  ask 提案3, 0xC3, 8, 1

step 2人目の署名を集める
  say もう1人の署名者が署名して2人分になった提案3を送り直すと、関門を通って実行待ちに並ぶ。
  ask 提案3, 0xC3, 8, 2

step 実行してブロックに入れる
  say 実行の釦を押すと、金庫は実行待ちの上から2件を送金し、ブロック1に入れる。
  press 実行する

step 次のブロックへつなぐ
  say 提案3もブロック2に入り、prevにブロック1のhashを持つ。
  press 実行する
`,_e=`// How a transfer proposal to a multisig vault passes its check and runs only once at least 2 of its 3 signers have signed, then lands in a block.
// The reader types a proposal name, recipient and amount, picks how many signers signed, sends it, and presses the execute button. A proposal with one signature stops at the vault's check.
try Approving a multisig transfer

route Network: You - node-1 - Vault, You - node-2 - node-3 - Vault [from: You, to: Vault]
queue Pending
chain Chain
log Stopped
ask Proposal, To, Amount, Signatures [into: Pending, via: Network]
choose Signatures: 1, 2, 3
press Execute [from: Pending, into: Chain, take: 2]
side Pending, Stopped

check Vault: Signatures >= 2 [no: Not enough signatures, into: Stopped]

item P1 [To: 0xA1, Amount: 3, Signatures: 2]
item P2 [To: 0xB2, Amount: 5, Signatures: 3]

step Signed proposals wait
  say The vault lets through only proposals that at least 2 of the 3 signers have signed. P1 and P2 have enough signatures and wait to run.
  line Pending: P1, P2

step One signature only
  say P3, signed by you alone, crosses the network to the vault but stops at its check and is logged in Stopped.
  ask P3, 0xC3, 8, 1

step A second signer signs
  say Once a second signer signs, P3 has 2 signatures. Sent again, it passes the check and joins Pending.
  ask P3, 0xC3, 8, 2

step Execute into a block
  say Pressing the execute button makes the vault send the top 2 pending proposals and puts them in block 1.
  press Execute

step Link the next block
  say P3 goes into block 2, which holds block 1's hash as prev.
  press Execute
`,Ke=`// 1日のガス代の目安が、夜中から夜までの時間帯でどう移るかを、急ぎ方ごとの横棒で比べる。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
chart 時間帯ごとのガス代の目安 [shape: bar]

item slow as 遅くてよい [color: green]
item normal as 普通 [color: blue]
item fast as 急ぐ [color: amber]

step 3時
  say 夜中は取引が少なく、ガス代が一番安い。値の単位はgweiで、急ぐほど上乗せが要る。
  set slow: 8
  set normal: 10
  set fast: 13

step 9時
  say 朝になって取引が増え、どの急ぎ方でもガス代が上がり始める。
  set slow: 15
  set normal: 18
  set fast: 24

step 13時
  say 昼は取引が少し落ち着き、ガス代も下がる。
  set slow: 12
  set normal: 14
  set fast: 18

step 18時
  say 別の地域の取引が重なり、急ぐ取引の上乗せが大きく開く。
  set slow: 22
  set normal: 27
  set fast: 36

step 22時
  say 1日で一番混む。急がない取引は、夜中まで待つと4分の1ほどで済む。
  set slow: 30
  set normal: 38
  set fast: 52
`,Qe=`// How the gas fee estimate moves through a day from late night to night, compared on bars for each speed.
// The values are sample numbers to show the shape, not measured figures.
chart Gas fee estimate by hour [shape: bar]

item slow as Slow [color: green]
item normal as Normal [color: blue]
item fast as Fast [color: amber]

step 3:00
  say Late at night there are few transactions, so gas is cheapest. Values are in gwei, and the faster you want it, the more you add on top.
  set slow: 8
  set normal: 10
  set fast: 13

step 9:00
  say Transactions pick up in the morning, and gas starts to rise at every speed.
  set slow: 15
  set normal: 18
  set fast: 24

step 13:00
  say Midday calms down a little, and gas falls with it.
  set slow: 12
  set normal: 14
  set fast: 18

step 18:00
  say Traffic from another region overlaps, and the extra for fast transactions widens.
  set slow: 22
  set normal: 27
  set fast: 36

step 22:00
  say The busiest hour of the day. A transaction that can wait until late night costs about a quarter.
  set slow: 30
  set normal: 38
  set fast: 52
`,Xe=`// ステーキングの1か月の報酬の内訳が、1月から4月までにどう移ったかをドーナツで比べる。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
chart ステーキングの報酬の内訳 [shape: donut]

item vote as 投票の報酬 [color: blue]
item propose as 提案の報酬 [color: green]
item tip as 手数料の上乗せ [color: amber]
item sync as 同期委員会 [color: violet]

step 1月
  say 報酬の8割は、毎回の投票で受け取る報酬が占める。ブロックの提案に選ばれる回は少ない。
  set vote: 82
  set propose: 10
  set tip: 8

step 2月
  say ブロックの提案に2回選ばれ、提案の報酬と手数料の上乗せが膨らむ。
  set vote: 80
  set propose: 26
  set tip: 30

step 3月
  say 同期委員会に選ばれ、その期間は委員会の報酬が加わる。投票の報酬は毎月ほぼ変わらない。
  set vote: 79
  set propose: 9
  set tip: 7
  set sync: 45

step 4月
  say 委員会の期間が終わり、1月と同じ形に戻る。報酬の土台は毎回の投票にある。
  set vote: 81
  set propose: 11
  set tip: 9
  set sync: 0
`,Ze=`// How the breakdown of one month of staking rewards moved from January to April, compared on a donut.
// The values are sample numbers to show the shape, not measured figures.
chart Breakdown of staking rewards [shape: donut]

item vote as Attestations [color: blue]
item propose as Proposals [color: green]
item tip as Fee tips [color: amber]
item sync as Sync committee [color: violet]

step January
  say About 80 percent of the reward comes from attesting every time. The validator is rarely picked to propose a block.
  set vote: 82
  set propose: 10
  set tip: 8

step February
  say The validator is picked to propose a block twice, and proposal rewards and fee tips swell.
  set vote: 80
  set propose: 26
  set tip: 30

step March
  say The validator joins the sync committee, and committee rewards come in for that period. Attestation rewards stay nearly the same every month.
  set vote: 79
  set propose: 9
  set tip: 7
  set sync: 45

step April
  say The committee period ends, and the shape returns to January's. The base of the reward is attesting every time.
  set vote: 81
  set propose: 11
  set tip: 9
  set sync: 0
`,$e=`// 通販の店を訪れた人が、商品を見てカートに入れて買うまでに、段ごとに何人去るかを漏斗で比べる。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
chart 店で買うまでの人数 [shape: funnel]

item visit as 店を訪れた [color: blue]
item view as 商品を見た [color: violet]
item cart as カートに入れた [color: amber]
item buy as 買った [color: green]

step 訪れる
  say 店のサイトを10,000人が訪れた。
  set visit: 10000

step 商品を見る
  say 商品の頁まで進んだのは4,200人で、5,800人は商品を見ずに去った。
  set view: 4200

step カートに入れる
  say カートに入れたのは1,100人で、商品を見た人の26%だった。
  set cart: 1100

step 買う
  say 買ったのは380人で、カートに入れた人のうち720人は買わずに去った。
  set buy: 380

step 振り返る
  say 店を訪れた10,000人のうち、最後に買ったのは3.8%だった。
`,en=`// How many visitors to an online shop leave at each stage on the way from a visit to a purchase, compared as a funnel.
// The values are sample numbers to show the shape, not real measurements.
chart People on the way to buying [shape: funnel]

item visit as Visited the shop [color: blue]
item view as Viewed a product [color: violet]
item cart as Added to cart [color: amber]
item buy as Bought [color: green]

step Visit
  say 10,000 people visited the shop site.
  set visit: 10000

step View a product
  say 4,200 people went on to a product page, and 5,800 left without seeing one.
  set view: 4200

step Add to cart
  say 1,100 people added to cart, 26% of those who viewed a product.
  set cart: 1100

step Buy
  say 380 people bought, and 720 of those who added to cart left without buying.
  set buy: 380

step Look back
  say Of the 10,000 people who visited the shop, 3.8% bought in the end.
`,nn=`// 財布の道具を入れた人が、財布を作って初めて送るまでに、段ごとに何人去るかを漏斗で比べる。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
chart 財布を作ってから初めて送るまで [shape: funnel]

item install as 道具を入れた [color: blue]
item create as 財布を作った [color: violet]
item backup as 復元の語を控えた [color: amber]
item fund as 初めて受け取った [color: slate]
item send as 初めて送った [color: green]

step 入れる
  say 財布の道具を8,000人が入れた。
  set install: 8000

step 作る
  say 財布を作ったのは6,400人で、1,600人は作らずに去った。
  set create: 6400

step 控える
  say 復元の語を控えたのは4,200人で、控えずに去った人が2,200人いた。
  set backup: 4200

step 受け取る
  say 初めて資産を受け取ったのは2,600人で、控えた人の62%だった。
  set fund: 2600

step 送る
  say 初めて送ったのは1,500人で、受け取った人のうち1,100人は送らずに去った。
  set send: 1500

step 振り返る
  say 道具を入れた8,000人のうち、初めて送るまで進んだのは19%だった。
`,tn=`// How many people who install a wallet app leave at each stage on the way to their first send, compared as a funnel.
// The values are sample numbers to show the shape, not real measurements.
chart From a new wallet to the first send [shape: funnel]

item install as Installed the app [color: blue]
item create as Created a wallet [color: violet]
item backup as Saved the recovery phrase [color: amber]
item fund as First received funds [color: slate]
item send as Sent for the first time [color: green]

step Install
  say 8,000 people installed the wallet app.
  set install: 8000

step Create
  say 6,400 people created a wallet, and 1,600 left without one.
  set create: 6400

step Save the phrase
  say 4,200 people saved the recovery phrase, and 2,200 left without saving it.
  set backup: 4200

step Receive
  say 2,600 people received funds for the first time, 62% of those who saved the phrase.
  set fund: 2600

step Send
  say 1,500 people sent for the first time, and 1,100 of those who received funds left without sending.
  set send: 1500

step Look back
  say Of the 8,000 people who installed the app, 19% went on to their first send.
`,on=`// トークンを預ける前に、残高と承認済みの量を判断し、足りなければ承認の取引を送ってから預ける手順。
// 最初の段より前の線は今回は通らない道で、点線で残る。残高が足りなければ止め、承認が足りていれば承認を飛ばして預ける。
flow トークンを預ける前の承認

box input as 預ける量を入れる [note: 100 USDC, icon: user]
choice bal as 残高は足りる？
choice allow as 承認済みの量は足りる？
box approve as 承認の取引を送る [note: 量を許す, color: amber, icon: sign]
box deposit as 預ける取引を送る [note: Vaultへ移す, color: green, icon: pool]
box short as 足りないと伝える [note: 預けずに止める, color: rose, icon: x]

strip 預け入れ: 残高, 承認済み, 預けた量

bal -> short: いいえ
allow -> deposit: はい

step 量を入れる
  say 利用者が預ける量に100 USDCを入れる。ウォレットの残高は250 USDCある。
  start -> input
  set 残高: 250 USDC
  set 承認済み: 0 USDC
  set 預けた量: 0 USDC

step 残高を確かめる
  say 画面がウォレットの残高を読み、預ける量に足りるかを判断する。
  input -> bal: 調べる

step 承認の量を確かめる
  say 残高は足りる。次に、Vaultが動かしてよいと承認済みの量を読む。
  bal -> allow: はい

step 承認の取引を送る
  say 承認済みは0 USDCで足りないので、100 USDCを動かしてよいと承認する取引を送る。ブロックに入ると、承認済みが100 USDCになる。
  allow -> approve: いいえ
  set 承認済み: 100 USDC

step 預ける
  say 承認が確定したので、預ける取引を送る。Vaultが100 USDCを引き取り、承認済みの量は使い切る。
  approve -> deposit: 確定を待つ
  deposit -> finish
  set 残高: 150 USDC
  set 承認済み: 0 USDC
  set 預けた量: 100 USDC
`,sn=`// Before depositing tokens, check the balance and the approved amount, and send an approval transaction first if it falls short.
// Lines written before the first step are paths not taken this time and stay dotted. A short balance stops it, and an approval that already covers the amount skips straight to the deposit.
flow Approve before a token deposit

box input as Enter the amount [note: 100 USDC, icon: user]
choice bal as Enough balance?
choice allow as Enough approved?
box approve as Send the approval [note: Allow the amount, color: amber, icon: sign]
box deposit as Send the deposit [note: Move to the vault, color: green, icon: pool]
box short as Say it falls short [note: Stop before deposit, color: rose, icon: x]

strip Deposit: Balance, Approved, Deposited

bal -> short: No
allow -> deposit: Yes

step Enter the amount
  say The user enters 100 USDC as the amount to deposit. The wallet holds 250 USDC.
  start -> input
  set Balance: 250 USDC
  set Approved: 0 USDC
  set Deposited: 0 USDC

step Check the balance
  say The app reads the wallet balance and decides whether it covers the amount.
  input -> bal: Check

step Check the approval
  say The balance is enough. Next, it reads how much the vault is already approved to move.
  bal -> allow: Yes

step Send the approval
  say The approved amount is 0 USDC and falls short, so a transaction approving 100 USDC is sent. Once it lands in a block, the approved amount becomes 100 USDC.
  allow -> approve: No
  set Approved: 100 USDC

step Deposit
  say The approval is final, so the deposit transaction is sent. The vault takes the 100 USDC, and the approval is used up.
  approve -> deposit: Wait for final
  deposit -> finish
  set Balance: 150 USDC
  set Approved: 0 USDC
  set Deposited: 100 USDC
`,an=`// 届いた返品を、期限内か、未使用か、返金か交換かの3つの判断で確かめ、返金、交換、断るに分ける手順。
// 最初の段より前の線は今回は通らない道で、点線で残る。期限か未使用のどちらかが「いいえ」なら断り、交換を望めば同じ品を送る。
flow 返品を受けるかの判断

box arrive as 返品が届く [note: 届いて開ける, icon: box]
choice term as 30日以内？
choice unused as 未使用？
box form as 申し込みを読む [note: 選んだ望みを見る, icon: doc]
choice refund as 返金か交換か？
box pay as 返金する [note: 代金を戻す, color: green, icon: yen]
box swap as 交換の品を送る [note: 同じ品を送る, color: violet, icon: truck]
box reject as 断って送り返す [note: 理由を添える, color: rose, icon: x]

strip 返品 #R-52: 日数, 状態, 結果

term -> reject: いいえ
unused -> reject: いいえ
refund -> swap: 交換

step 返品が届く
  say 買った人が送り返した品が倉庫に届き、手順が始まる。
  start -> arrive
  set 日数: 数える前
  set 状態: 見る前
  set 結果: まだ

step 期限を確かめる
  say 届けた日から数え、30日以内に返されたかを判断する。
  arrive -> term: 日付を見る
  set 日数: 12日

step 状態を確かめる
  say 12日なので期限内。次に、箱と品を開けて使った跡が無いかを確かめる。
  term -> unused: はい
  set 状態: 未使用

step 申し込みを読む
  say 使った跡は無いので、受けられる返品と分かる。次に、申し込みの時に選んだ望みを読む。
  unused -> form: はい

step 望みで分ける
  say 申し込みに書かれた望みで、返金か交換かに分ける。
  form -> refund: 調べる

step 返金する
  say 返金を望んでいたので、代金を戻して手順が終わる。交換を望んでいれば、点線の道で同じ品を送る。
  refund -> pay: 返金
  pay -> finish
  set 結果: 返金した
`,rn=`// A returned item checked by three choices, whether it is in time, unused, and wanted as a refund or a swap, that split it into refund, swap, or refusal.
// Lines written before the first step are paths not taken this time and stay dotted. A no on time or use refuses the return, and a wish for a swap sends the same item again.
flow Whether to accept a return

box arrive as Return arrives [note: Open the parcel, icon: box]
choice term as Within 30 days?
choice unused as Unused?
box form as Read the request [note: See the chosen wish, icon: doc]
choice refund as Refund or swap?
box pay as Refund [note: Pay the money back, color: green, icon: yen]
box swap as Send a swap [note: Same item again, color: violet, icon: truck]
box reject as Refuse and send back [note: Give the reason, color: rose, icon: x]

strip Return #R-52: Days, Condition, Result

term -> reject: No
unused -> reject: No
refund -> swap: Swap

step The return arrives
  say The item the buyer sent back reaches the warehouse, and the procedure starts.
  start -> arrive
  set Days: unknown
  set Condition: unseen
  set Result: pending

step Check the time limit
  say Counting from the delivery date, a choice decides whether it came back within 30 days.
  arrive -> term: See the date
  set Days: 12 days

step Check the condition
  say 12 days is in time. Next, the box and the item are opened to check for signs of use.
  term -> unused: Yes
  set Condition: unused

step Read the request
  say There are no signs of use, so the return can be accepted. Next, the wish chosen in the request is read.
  unused -> form: Yes

step Split on the wish
  say The wish written in the request splits it into a refund or a swap.
  form -> refund: Check

step Refund
  say The buyer wanted a refund, so the money is paid back and the procedure ends. A wish for a swap would take the dotted path and send the same item.
  refund -> pay: Refund
  pay -> finish
  set Result: refunded
`,ln=`// Ethereumの1つのスロットは12秒で、提案者が取引を集めてブロックを出し、委員が投票し、投票をまとめて次の提案者へ渡す。
// 12秒たつと次のスロットが始まり、同じ4つの手順をもう一度回る。
cycle Ethereumの12秒のスロット

box collect as 取引を集める [note: 待ちの場から, color: blue]
box propose as ブロックを出す [note: 提案者が1人, color: violet]
box vote as 委員が投票する [note: 約3万人が署名, color: green]
box gather as 投票をまとめる [note: 次の提案者へ, color: amber]

strip スロット: 番号, 経過

step 取引を集める
  say 提案者が、送られて待っている取引を待ちの場 (mempool) から集める。
  set 番号: #18,402,113
  set 経過: 始まりから0秒

step ブロックを出す
  say 提案者が集めた取引でブロックを作り、スロットの始まりにネットワークへ出す。
  collect -> propose [tag: 取引]

step 委員が投票する
  say このスロットの委員が、届いたブロックを正しい先頭と認めて署名する。
  propose -> vote [tag: ブロック]
  set 経過: 始まりから4秒

step 投票をまとめる
  say 集まった署名を1つにまとめ、次のスロットの提案者へ渡す。
  vote -> gather [tag: 投票]
  set 経過: 始まりから8秒

step 次のスロットへ
  say 12秒たつと次のスロットが始まり、次の提案者が取引を集める。
  gather -> collect [tag: 次へ]
  set 番号: #18,402,114
  set 経過: 始まりから0秒
`,hn=`// One Ethereum slot lasts 12 seconds. The proposer collects transactions and puts out a block, the committee votes, and the votes are aggregated and passed to the next proposer.
// After 12 seconds the next slot begins and goes around the same four steps again.
cycle Ethereum's 12-second slot

box collect as Collect txs [note: from the mempool, color: blue]
box propose as Propose block [note: by one proposer, color: violet]
box vote as Committee votes [note: about 30k sign, color: green]
box gather as Aggregate votes [note: to next proposer, color: amber]

strip Slot: number, elapsed

step Collect transactions
  say The proposer collects the waiting transactions from the mempool.
  set number: #18,402,113
  set elapsed: 0s into the slot

step Propose the block
  say The proposer builds a block from those transactions and sends it to the network at the start of the slot.
  collect -> propose [tag: txs]

step The committee votes
  say The committee for this slot accepts the block as the head of the chain and signs it.
  propose -> vote [tag: block]
  set elapsed: 4s into the slot

step Aggregate the votes
  say The signatures are aggregated into one and passed to the proposer of the next slot.
  vote -> gather [tag: votes]
  set elapsed: 8s into the slot

step On to the next slot
  say After 12 seconds the next slot begins, and the next proposer collects transactions.
  gather -> collect [tag: next]
  set number: #18,402,114
  set elapsed: 0s into the slot
`,cn=`// 2週間のスプリントで、やる物を選んで計画し、少しずつ作り、できた物を見せ、進め方を振り返って次のスプリントの計画へ戻る。
cycle 2週間のスプリント

box plan as 計画する [note: やる物を選ぶ, color: blue]
box build as 開発する [note: 毎日少しずつ, color: violet]
box demo as 見せる [note: できた物を見せる, color: green]
box retro as 振り返る [note: 直すことを決める, color: amber]

strip スプリント: 回, 日

step 計画する
  say チームで2週間にやる物を選び、誰が何をするかを決める。
  set 回: 第12スプリント
  set 日: 1日目

step 開発する
  say 選んだ物を毎日少しずつ作り、作った分をその日のうちに確かめる。
  plan -> build [tag: やる物]
  set 日: 2日目から9日目

step 見せる
  say できた物を使う人に動かして見せ、意見をもらう。
  build -> demo [tag: できた物]
  set 日: 10日目

step 振り返る
  say 2週間の進め方を振り返り、次のスプリントで直すことを1つ決める。
  demo -> retro [tag: 意見]

step 次のスプリントへ
  say 直すことを持って、次のスプリントの計画へ戻る。
  retro -> plan [tag: 直すこと]
  set 回: 第13スプリント
  set 日: 1日目
`,pn=`// In a two-week sprint the team picks the work and plans it, builds it bit by bit, shows what is done, looks back on how it went and returns to planning the next sprint.
cycle A two-week sprint

box plan as Plan [note: pick the work, color: blue]
box build as Build [note: a little each day, color: violet]
box demo as Show [note: show what is done, color: green]
box retro as Look back [note: pick one fix, color: amber]

strip Sprint: round, day

step Plan
  say The team picks the work for the two weeks and decides who does what.
  set round: Sprint 12
  set day: Day 1

step Build
  say The work is built a little each day and checked the same day.
  plan -> build [tag: work]
  set day: Days 2 to 9

step Show
  say What is done is shown running to the people who use it, and they give feedback.
  build -> demo [tag: done]
  set day: Day 10

step Look back
  say The team looks back on how the two weeks went and picks one thing to fix next sprint.
  demo -> retro [tag: feedback]

step On to the next sprint
  say The team takes the fix back to planning the next sprint.
  retro -> plan [tag: fix]
  set round: Sprint 13
  set day: Day 1
`,dn=`// 店の売り場をPDCAで直す。売れ行きから棚の計画を立て、並べ替えて売ってみて、売上を確かめ、直す点を決めて次の回の計画へ戻る。
cycle PDCAで売り場を直す

box plan as 計画 [note: Plan, color: blue]
box run as 実行 [note: Do, color: green]
box check as 確かめる [note: Check, color: amber]
box fix as 直す [note: Act, color: rose]

strip 売り場: 回, 売上

step 計画を立てる
  say 先月の売れ行きを見て、よく売れる商品を入口の近くへ移す計画を立てる。
  set 回: 1回目
  set 売上: 週に120万円

step 並べ替えて売る
  say 計画どおりに棚を並べ替え、2週間売ってみる。
  plan -> run [tag: 棚の計画]

step 売上を確かめる
  say 並べ替えた後の売上を、前の週と比べて確かめる。
  run -> check [tag: 売上]
  set 売上: 週に138万円

step 直す点を決める
  say 伸びた棚はそのまま残し、伸びなかった棚の並べ方を直すと決める。
  check -> fix [tag: 比べた結果]

step 次の回へ
  say 直す点を次の計画に入れ、2回目を始める。
  fix -> plan [tag: 直す点]
  set 回: 2回目
`,un=`// A shop fixes its floor with PDCA. It plans the shelves from what sold, rearranges them and sells for a while, checks the sales, decides what to fix and returns to planning the next round.
cycle Fix the shop floor with PDCA

box plan as Plan [note: set the goal, color: blue]
box run as Do [note: try it out, color: green]
box check as Check [note: measure it, color: amber]
box fix as Act [note: adjust, color: rose]

strip Shop floor: round, sales

step Make the plan
  say From last month's sales, plan to move the best sellers near the entrance.
  set round: Round 1
  set sales: 12,000 USD a week

step Rearrange and sell
  say The shelves are rearranged as planned and the shop sells for two weeks.
  plan -> run [tag: shelf plan]

step Check the sales
  say The sales after the change are checked against the weeks before.
  run -> check [tag: sales]
  set sales: 13,800 USD a week

step Decide what to fix
  say Shelves that sold more stay as they are, and the layout of the others gets fixed.
  check -> fix [tag: results]

step On to the next round
  say The fixes go into the next plan, and round 2 begins.
  fix -> plan [tag: fixes]
  set round: Round 2
`,mn=`// ステーキングで付いた報酬を受け取り、元の預け入れに足して預け直す。預け直すたびに、報酬が付く元の量が増える。
cycle ステーキングの報酬を預け直す

box stake as 預ける [note: 検証者へ委任, color: blue]
box earn as 報酬が付く [note: ブロックごと, color: green]
box claim as 受け取る [note: 報酬を引き出す, color: amber]
box again as 預け直す [note: 元の量に足す, color: violet]

strip 預けた量: 量, 報酬

step 預ける
  say 100 ATOMを検証者へ預け (委任し)、ステーキングを始める。
  set 量: 100 ATOM
  set 報酬: 0 ATOM

step 報酬が付く
  say ブロックが進むたびに、預けた量に応じて報酬が少しずつ付く。
  stake -> earn [tag: 100 ATOM]
  set 報酬: 1.2 ATOM

step 受け取る
  say 30日たったので、付いた報酬を受け取る取引を送る。
  earn -> claim [tag: 1.2 ATOM]

step 預け直す
  say 受け取った報酬を、同じ検証者へもう一度預ける。
  claim -> again [tag: 1.2 ATOM]
  set 報酬: 0 ATOM

step 次の回へ
  say 預けた量が101.2 ATOMになり、次の回はこの量に報酬が付く。
  again -> stake [tag: 101.2 ATOM]
  set 量: 101.2 ATOM
`,yn=`// The rewards earned by staking are claimed and staked again on top of the first deposit. Each time they are staked again, the amount that earns rewards grows.
cycle Restake the staking rewards

box stake as Stake [note: delegate to a validator, color: blue]
box earn as Earn rewards [note: every block, color: green]
box claim as Claim [note: withdraw the rewards, color: amber]
box again as Restake [note: add to the stake, color: violet]

strip Staked: amount, rewards

step Stake
  say 100 ATOM is delegated to a validator and staking begins.
  set amount: 100 ATOM
  set rewards: 0 ATOM

step Earn rewards
  say With every block, rewards build up in line with the staked amount.
  stake -> earn [tag: 100 ATOM]
  set rewards: 1.2 ATOM

step Claim
  say After 30 days a transaction claims the rewards.
  earn -> claim [tag: 1.2 ATOM]

step Restake
  say The claimed rewards are delegated again to the same validator.
  claim -> again [tag: 1.2 ATOM]
  set rewards: 0 ATOM

step On to the next round
  say The stake is now 101.2 ATOM, and the next round earns rewards on it.
  again -> stake [tag: 101.2 ATOM]
  set amount: 101.2 ATOM
`,gn=`// 1時間の集中の時間割。25分集中し、5分休み、10分で振り返り、20分長く休んで、次の集中へ戻る。
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
`,fn=`// An hour of focused work. Focus for 25 minutes, rest for 5, look back for 10, take a long 20 minute rest and return to the next focus.
cycle Focus and rest schedule [shape: clock]

box focus as Focus [time: 25min, color: blue]
box short as Short rest [time: 5min, color: green]
box review as Look back [time: 10min, color: amber]
box long as Long rest [time: 20min, color: rose]

strip Schedule: round, focused

step Start focusing
  say Notifications go off and the work at hand gets 25 minutes of focus.
  set round: Round 1
  set focused: 0 min

step Short rest
  say After 25 minutes the work stops for a 5 minute stretch.
  focus -> short [tag: 25 min]
  set focused: 25 min

step Look back
  say After the rest, 10 minutes go into writing down what moved and what got stuck.
  short -> review

step Long rest
  say With the notes written, a long 20 minute rest clears the head.
  review -> long [tag: notes]

step On to the next round
  say The rest ends and the second round of focus begins.
  long -> focus
  set round: Round 2
`,bn=`// 畑の1年。春に種をまき、夏に育て、秋に収穫し、冬に土を休めて、2年目の春にまた種をまく。
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
`,wn=`// A year on a field. Sow in spring, grow through summer, harvest in autumn, rest the soil in winter, and sow again in the second spring.
cycle A year on the field [shape: band]

box sow as Sow [time: 60d, color: green]
box grow as Grow [time: 120d, color: blue]
box harvest as Harvest [time: 60d, color: amber]
box rest as Rest the soil [time: 120d, color: slate]

strip Field: year, season

step Sow
  say In spring the soil is tilled and seeds go into the field.
  set year: Year 1
  set season: Spring

step Grow
  say Once the shoots are up, they get water and grow all summer.
  sow -> grow [tag: shoots]
  set season: Summer

step Harvest
  say In autumn the ripe crop is harvested.
  grow -> harvest [tag: crop]
  set season: Autumn

step Rest the soil
  say After the harvest, compost goes on the field and the soil rests through winter.
  harvest -> rest [tag: compost]
  set season: Winter

step Into year 2
  say When spring comes, seeds go into the rested soil again.
  rest -> sow [tag: seeds]
  set year: Year 2
  set season: Spring

step Grow in year 2
  say In year 2 the shoots again grow through the summer.
  sow -> grow [tag: shoots]
  set season: Summer
`,kn=`// 家計簿のアプリに入れる機能を、入力、集計、通知、共有の4つの枝に分けて考える。
// 段ごとに1つの枝を伸ばし、その枝で作る機能を葉に書き出す。
mind 家計簿のアプリの機能

step 題を置く
  say 毎月のお金の出入りを続けて付けられる、家計簿のアプリを真ん中に置く。
  idea app as 家計簿のアプリ

step 入力の枝
  say 付ける手間を減らす機能を考える。手で打つ数が減るほど続く。
  idea input as 入力 of app
  idea receipt as レシートを撮って読む of input
  idea bank as 口座の明細を取り込む of input

step 集計の枝
  say 付けた記録から、どこにいくら使ったかを見せる機能を考える。
  idea sum as 集計 of app
  idea category as 費目ごとの円グラフ of sum
  idea month as 前の月と比べる of sum

step 通知の枝
  say 使いすぎに気付ける知らせを考える。
  idea alert as 通知 of app
  idea over as 予算を超えそうな時 of alert
  idea payday as 引き落としの前の日 of alert

step 共有の枝
  say 家族と同じ家計簿を見る機能を考える。
  idea share as 共有 of app
  idea family as 家族と同じ帳簿を見る of share
  idea split as 立て替えを分ける of share
`,vn=`// Think through the features of a budget app in four branches: input, summary, alerts and sharing.
// Each step grows one branch and lists the features it needs as leaves.
mind Features for a budget app

step Put the title
  say Put in the middle a budget app that makes it easy to keep tracking money every month.
  idea app as Budget app

step Input branch
  say Think of features that cut the effort of logging. The less typing, the longer people keep at it.
  idea input as Input of app
  idea receipt as Scan receipts of input
  idea bank as Import bank records of input

step Summary branch
  say Think of features that show where the money went.
  idea sum as Summary of app
  idea category as Pie chart by category of sum
  idea month as Compare with last month of sum

step Alerts branch
  say Think of alerts that catch overspending early.
  idea alert as Alerts of app
  idea over as About to pass the budget of alert
  idea payday as Day before a direct debit of alert

step Sharing branch
  say Think of features for keeping one budget with the family.
  idea share as Sharing of app
  idea family as Shared family book of share
  idea split as Split shared costs of share
`,xn=`// 3泊4日の旅行の計画を、行き先、移動、宿、予算の4つの枝に分けて立てる。
// 段ごとに1つの枝を伸ばし、決めることを葉に書き出す。
mind 夏の旅行の計画

step 題を置く
  say 家族4人で行く3泊4日の旅行を真ん中に置く。
  idea trip as 夏の旅行

step 行き先の枝
  say どこで何をするかを決める。
  idea place as 行き先 of trip
  idea kyoto as 京都で寺を回る of place
  idea nara as 奈良で鹿を見る of place

step 移動の枝
  say 家から行き先までと、行き先の中の移動を決める。
  idea move as 移動 of trip
  idea train as 新幹線の指定席 of move
  idea bus as 市バスの1日券 of move

step 宿の枝
  say 泊まる所を決める。
  idea stay as 宿 of trip
  idea inn as 駅に近い旅館 of stay
  idea breakfast as 朝ごはん付き of stay

step 予算の枝
  say 使えるお金を決め、枝ごとに割り振る。
  idea budget as 予算 of trip
  idea total as 全部で20万円 of budget
  idea reserve as 1割は残しておく of budget
`,Tn=`// Plan a four-day summer trip in four branches: places, travel, stay and budget.
// Each step grows one branch and lists what to decide as leaves.
mind Planning a summer trip

step Put the title
  say Put in the middle a four-day trip for a family of four.
  idea trip as Summer trip

step Places branch
  say Decide where to go and what to do there.
  idea place as Places of trip
  idea kyoto as Temples in Kyoto of place
  idea nara as Deer in Nara of place

step Travel branch
  say Decide how to get there and how to get around.
  idea move as Travel of trip
  idea train as Reserved bullet train of move
  idea bus as City bus day pass of move

step Stay branch
  say Decide where to sleep.
  idea stay as Stay of trip
  idea inn as Inn near the station of stay
  idea breakfast as Breakfast included of stay

step Budget branch
  say Decide how much to spend and share it out across the branches.
  idea budget as Budget of trip
  idea total as 200,000 yen in all of budget
  idea reserve as Keep a tenth spare of budget
`,Dn=`// DAOに出す提案を、目的、予算、投票、実行の4つの枝に分けて練る。
// 段ごとに1つの枝を伸ばし、提案に書くことを葉に書き出す。
mind 開発者への助成の提案

step 題を置く
  say DAOの金庫から、道具を作る開発者に助成する提案を真ん中に置く。
  idea grant as 開発者への助成

step 目的の枝
  say なぜ助成するかを書く。
  idea goal as 目的 of grant
  idea tools as 使う人の道具を増やす of goal
  idea devs as 新しい開発者を呼ぶ of goal

step 予算の枝
  say どれだけ出すかを書く。
  idea budget as 予算 of grant
  idea amount as 金庫から5万USDC of budget
  idea milestone as 節目ごとに分けて払う of budget

step 投票の枝
  say どう決めるかを書く。
  idea vote as 投票 of grant
  idea period as 7日間の投票 of vote
  idea quorum as 定足数は4% of vote

step 実行の枝
  say 決まった後にどう動かすかを書く。
  idea run as 実行 of grant
  idea timelock as 2日のタイムロック of run
  idea multisig as 3人のマルチシグで払う of run
`,An=`// Shape a proposal for a DAO in four branches: goal, budget, vote and execution.
// Each step grows one branch and lists what the proposal must say as leaves.
mind A developer grant proposal

step Put the title
  say Put in the middle a proposal to fund, from the DAO treasury, developers who build tools.
  idea grant as Developer grant

step Goal branch
  say Write why the DAO should fund it.
  idea goal as Goal of grant
  idea tools as More tools for users of goal
  idea devs as Bring in new developers of goal

step Budget branch
  say Write how much to give.
  idea budget as Budget of grant
  idea amount as 50,000 USDC from treasury of budget
  idea milestone as Paid out by milestone of budget

step Vote branch
  say Write how the DAO decides.
  idea vote as Vote of grant
  idea period as Seven-day vote of vote
  idea quorum as Quorum at 4% of vote

step Execution branch
  say Write how it runs once passed.
  idea run as Execution of grant
  idea timelock as Two-day timelock of run
  idea multisig as Paid by a 3-person multisig of run
`,Cn=`// ウォレットの使いやすさを、鍵の守り、送金、表示、復旧の4つの枝に分けて考える。
// 段ごとに1つの枝を伸ばし、使う人がつまずく所を直す手を葉に書き出す。
mind ウォレットの使いやすさ

step 題を置く
  say 初めて暗号資産を持つ人が迷わないウォレットを真ん中に置く。
  idea wallet as 使いやすいウォレット

step 鍵の守りの枝
  say 鍵をなくさず、盗まれない形を考える。
  idea key as 鍵の守り of wallet
  idea passkey as パスキーで署名する of key
  idea limit as 1日に送れる額の上限 of key

step 送金の枝
  say 送る前の確かめと、手数料の見せ方を考える。
  idea send as 送金 of wallet
  idea address as 宛先を名前で選ぶ of send
  idea fee as 手数料を円で出す of send

step 表示の枝
  say 持っている物と、署名する中身の見せ方を考える。
  idea view as 表示 of wallet
  idea balance as 残高を円で合計する of view
  idea readable as 署名の中身を文で出す of view

step 復旧の枝
  say 端末をなくした時に戻す道を考える。
  idea recover as 復旧 of wallet
  idea guardian as 信頼する人で戻す of recover
  idea backup as 暗号化した控え of recover
`,En=`// Think through how easy a wallet is to use in four branches: key safety, sending, display and recovery.
// Each step grows one branch and lists fixes for where users stumble as leaves.
mind Making a wallet easy to use

step Put the title
  say Put in the middle a wallet that first-time crypto holders can use without getting lost.
  idea wallet as Easy-to-use wallet

step Key safety branch
  say Think of ways to keep the key from being lost or stolen.
  idea key as Key safety of wallet
  idea passkey as Sign with a passkey of key
  idea limit as Daily sending limit of key

step Sending branch
  say Think of the checks before sending and how to show the fee.
  idea send as Sending of wallet
  idea address as Pick payees by name of send
  idea fee as Show the fee in your currency of send

step Display branch
  say Think of how to show holdings and what a signature does.
  idea view as Display of wallet
  idea balance as Total in your currency of view
  idea readable as Explain what you sign of view

step Recovery branch
  say Think of a way back when the device is lost.
  idea recover as Recovery of wallet
  idea guardian as Recover with trusted people of recover
  idea backup as Encrypted backup of recover
`,Sn=`// ネット通販の注文の合計を出す。利用者から注文、注文の明細、商品へと結びを辿って値段を集め、数と値段から合計を出して注文に書く。
er 注文の合計を出す

table users as 利用者
  field id: 7 [key]
  field 名前: Alice

table orders as 注文
  field id: 1042 [key]
  field 利用者id: 7 [ref: users.id]
  field 合計: 未計算
  field 状態: 受付済み

table lines as 注文の明細
  field id: 1 [key]
  field 注文id: 1042 [ref: orders.id]
  field 商品id: P-3 [ref: products.id]
  field 数: 2

table products as 商品
  field id: P-3 [key]
  field 名前: マグカップ
  field 値段: 1,200

step 利用者を引く
  say 利用者の表から、idが7のAliceを引く。
  pick users.id

step 注文を引く
  say 利用者idが7の注文を引くと、注文#1042が見つかる。
  users.id -> orders.利用者id [tag: 7]
  pick orders.利用者id

step 明細を引く
  say 注文idが1042の明細を引く。商品P-3を2つ頼んでいる。
  orders.id -> lines.注文id [tag: 1042]
  pick lines.注文id

step 値段を引く
  say 明細の商品idから、商品P-3の値段1,200円を引く。
  lines.商品id -> products.id [tag: P-3]
  pick products.id

step 合計を書く
  say 数の2と値段の1,200を掛けて2,400円を出し、注文の合計に書く。
  pick lines.数
  pick products.値段
  note orders.合計: 2 × 1,200 = 2,400
  set orders.合計: 2,400
  pick orders.合計
`,Pn=`// Work out the total of an online shop order. Follow the links from the user to the order, its lines and the product to collect the price, then multiply the quantity by the price and write the total to the order.
er Work out an order total

table users as Users
  field id: 7 [key]
  field name: Alice

table orders as Orders
  field id: 1042 [key]
  field user_id: 7 [ref: users.id]
  field total: none
  field status: received

table lines as Order lines
  field id: 1 [key]
  field order_id: 1042 [ref: orders.id]
  field item_id: P-3 [ref: products.id]
  field qty: 2

table products as Products
  field id: P-3 [key]
  field name: Mug
  field price: 1,200

step Look up the user
  say Look up Alice, whose id is 7, in the users table.
  pick users.id

step Look up the order
  say Look up the orders whose user_id is 7 and find order #1042.
  users.id -> orders.user_id [tag: 7]
  pick orders.user_id

step Look up the lines
  say Look up the lines whose order_id is 1042. The order asks for 2 of product P-3.
  orders.id -> lines.order_id [tag: 1042]
  pick lines.order_id

step Look up the price
  say From the item_id of the line, look up the price of product P-3, 1,200.
  lines.item_id -> products.id [tag: P-3]
  pick products.id

step Write the total
  say Multiply the qty 2 by the price 1,200 to get 2,400 and write it to the order total.
  pick lines.qty
  pick products.price
  note orders.total: 2 × 1,200 = 2,400
  set orders.total: 2,400
  pick orders.total
`,Hn=`// 図書館で本を借りる。会員証と本のバーコードから会員と本を引き、貸し出しの行に結びを書いて、本の状態と会員の借りている数を書き換える。
er 図書館で本を借りる

table members as 会員
  field id: M-12 [key]
  field 名前: 佐藤
  field 借りている数: 1

table loans as 貸し出し
  field id: L-305 [key]
  field 会員id: M-12 [ref: members.id]
  field 本id: B-88 [ref: books.id]
  field 返す日: 未定

table books as 本
  field id: B-88 [key]
  field 題: 星の地図
  field 状態: 棚にある

step 会員を確かめる
  say 窓口で会員証を読み、会員M-12の佐藤さんを引く。
  pick members.id

step 本を確かめる
  say 本のバーコードを読み、本B-88が棚にあるかを引く。
  pick books.id

step 貸し出しを作る
  say 会員idと本idを貸し出しの行に書き、返す日を2週間後にする。
  members.id -> loans.会員id [tag: M-12]
  books.id -> loans.本id [tag: B-88]
  set loans.返す日: 11月25日
  pick loans.id

step 本の状態を変える
  say 本の状態を、棚にあるから貸し出し中に書き換える。
  set books.状態: 貸し出し中
  pick books.状態

step 借りている数を増やす
  say 佐藤さんの借りている数を1つ増やして2冊にする。
  note members.借りている数: 1 + 1 = 2
  set members.借りている数: 2
  pick members.借りている数
`,Wn=`// Borrow a book from a library. Read the member card and the book barcode to look up the member and the book, write the links into a loan row, then rewrite the book status and the number of books the member has.
er Borrow a library book

table members as Members
  field id: M-12 [key]
  field name: Sato
  field on_loan: 1

table loans as Loans
  field id: L-305 [key]
  field member_id: M-12 [ref: members.id]
  field book_id: B-88 [ref: books.id]
  field due: none

table books as Books
  field id: B-88 [key]
  field title: Star Map
  field status: on shelf

step Check the member
  say Read the member card at the desk and look up Sato, member M-12.
  pick members.id

step Check the book
  say Read the barcode and look up whether book B-88 is on the shelf.
  pick books.id

step Make the loan
  say Write the member_id and the book_id into a loan row and set the due date two weeks ahead.
  members.id -> loans.member_id [tag: M-12]
  books.id -> loans.book_id [tag: B-88]
  set loans.due: Nov 25
  pick loans.id

step Change the book status
  say Rewrite the book status from on shelf to on loan.
  set books.status: on loan
  pick books.status

step Count the loan
  say Add one to the books Sato has, making it 2.
  note members.on_loan: 1 + 1 = 2
  set members.on_loan: 2
  pick members.on_loan
`,Bn=`// NFTを売り買いする。出品からトークンを引き、買い手が買うと売買の行を書き、トークンの持ち主を買い手に書き換えて、買い手の持っている数を増やす。
er NFTを売り買いする

table owners as 持ち主
  field id: 0xB2 [key]
  field 名前: Bob
  field 持っている数: 0

table tokens as トークン
  field id: #42 [key]
  field 名前: Dragon #42
  field 持ち主: 0xA1 [ref: owners.id]

table listings as 出品
  field id: L-7 [key]
  field トークン: #42 [ref: tokens.id]
  field 値段: 0.5 ETH
  field 状態: 出品中

table sales as 売買
  field id: S-3 [key]
  field 出品: L-7 [ref: listings.id]
  field 買い手: 0xB2 [ref: owners.id]
  field 値段: 0.5 ETH

step 出品を見る
  say 出品L-7を見る。トークン#42が0.5 ETHで売りに出ている。
  pick listings.id

step トークンを引く
  say 出品のトークンから、トークン#42を引く。今の持ち主は0xA1。
  listings.トークン -> tokens.id [tag: #42]
  pick tokens.id

step 売買を書く
  say 0xB2が買うと、売買S-3に出品L-7と買い手を書き、出品を売れたにする。
  listings.id -> sales.出品 [tag: L-7]
  set listings.状態: 売れた
  pick sales.出品

step 持ち主を替える
  say 売買の買い手から持ち主0xB2を引き、トークン#42の持ち主を0xB2に書き換える。
  sales.買い手 -> owners.id [tag: 0xB2]
  set tokens.持ち主: 0xB2
  pick owners.id

step 持っている数を増やす
  say 0xB2の持っている数を1つ増やす。
  note owners.持っている数: 0 + 1 = 1
  set owners.持っている数: 1
  pick owners.持っている数
`,Un=`// Buy and sell an NFT. Look up the token from the listing, write a sale row when the buyer buys, rewrite the token owner to the buyer and add one to the tokens the buyer holds.
er Buy and sell an NFT

table owners as Owners
  field id: 0xB2 [key]
  field name: Bob
  field held: 0

table tokens as Tokens
  field id: #42 [key]
  field name: Dragon #42
  field owner: 0xA1 [ref: owners.id]

table listings as Listings
  field id: L-7 [key]
  field token: #42 [ref: tokens.id]
  field price: 0.5 ETH
  field status: listed

table sales as Sales
  field id: S-3 [key]
  field listing: L-7 [ref: listings.id]
  field buyer: 0xB2 [ref: owners.id]
  field price: 0.5 ETH

step See the listing
  say See listing L-7. Token #42 is for sale at 0.5 ETH.
  pick listings.id

step Look up the token
  say From the token of the listing, look up token #42. Its owner is 0xA1.
  listings.token -> tokens.id [tag: #42]
  pick tokens.id

step Write the sale
  say When 0xB2 buys, write listing L-7 and the buyer into sale S-3 and mark the listing sold.
  listings.id -> sales.listing [tag: L-7]
  set listings.status: sold
  pick sales.listing

step Change the owner
  say From the buyer of the sale, look up owner 0xB2 and rewrite the owner of token #42 to 0xB2.
  sales.buyer -> owners.id [tag: 0xB2]
  set tokens.owner: 0xB2
  pick owners.id

step Add to the holdings
  say Add one to the tokens 0xB2 holds.
  note owners.held: 0 + 1 = 1
  set owners.held: 1
  pick owners.held
`,Rn=`// トークンを送る。送金の行の送り手から口座を引き、口座から残高を引いて、送る額を残高から引き、送金を済みにする。
er トークンを送る

table transfers as 送金
  field id: T-9 [key]
  field 送り手: 0xA1 [ref: accounts.id]
  field 受け手: 0xC3
  field 額: 30 USDC
  field 状態: 待ち

table accounts as 口座
  field id: 0xA1 [key]
  field 名前: Alice

table balances as 残高
  field id: B-1 [key]
  field 口座: 0xA1 [ref: accounts.id]
  field 残高: 100 USDC

step 送金を受け付ける
  say 0xA1から0xC3へ30 USDCを送る送金T-9を受け付ける。
  pick transfers.id

step 送り手を引く
  say 送金の送り手から、口座0xA1のAliceを引く。
  transfers.送り手 -> accounts.id [tag: 0xA1]
  pick accounts.id

step 残高を引く
  say 口座0xA1の残高を引くと、100 USDCある。
  accounts.id -> balances.口座 [tag: 0xA1]
  pick balances.口座

step 残高を減らす
  say 残高から送る額の30を引いて70 USDCにする。
  note balances.残高: 100 - 30 = 70
  set balances.残高: 70 USDC
  pick balances.残高

step 送金を済ませる
  say 送金の状態を済みにする。
  set transfers.状態: 済み
  pick transfers.状態
`,Ln=`// Send tokens. Look up the account from the sender of the transfer row, look up its balance, take the amount sent from the balance and mark the transfer done.
er Send tokens

table transfers as Transfers
  field id: T-9 [key]
  field from: 0xA1 [ref: accounts.id]
  field to: 0xC3
  field amount: 30 USDC
  field status: pending

table accounts as Accounts
  field id: 0xA1 [key]
  field name: Alice

table balances as Balances
  field id: B-1 [key]
  field account: 0xA1 [ref: accounts.id]
  field balance: 100 USDC

step Take the transfer
  say Take transfer T-9, which sends 30 USDC from 0xA1 to 0xC3.
  pick transfers.id

step Look up the sender
  say From the sender of the transfer, look up Alice, account 0xA1.
  transfers.from -> accounts.id [tag: 0xA1]
  pick accounts.id

step Look up the balance
  say Look up the balance of account 0xA1. It holds 100 USDC.
  accounts.id -> balances.account [tag: 0xA1]
  pick balances.account

step Lower the balance
  say Take the 30 sent from the balance, leaving 70 USDC.
  note balances.balance: 100 - 30 = 70
  set balances.balance: 70 USDC
  pick balances.balance

step Finish the transfer
  say Mark the transfer done.
  set transfers.status: done
  pick transfers.status
`,Fn=`// 今週の仕事を、急ぎと大事さの2つの軸で4つに分ける。
// 段ごとに1つの区画へ仕事を置き、置いた区画で何をするかを決める。
matrix 今週の仕事を急ぎと大事さで分ける

axis 急ぎ [from: 低い, to: 高い]
axis 大事さ [from: 低い, to: 高い]

box plan as 予定を立てる
box now as すぐやる
box drop as やめる
box ask as 人に任せる

item report as 明日締めの報告書
item trouble as 客先の不具合
item study as 資格の勉強
item health as 健康診断の予約
item call as 急ぎの取り次ぎ
item room as 定例会の会場取り
item feed as 何となく見るSNS

step 並べる
  say 今週の仕事を左に並べる。まだどの区画にも置いていない。

step すぐやる
  say 急ぎで大事な仕事は、ほかより先に今日のうちに片付ける。
  line now: report, trouble

step 予定を立てる
  say 大事だが急がない仕事は、後回しにならないよう先に日を決める。
  line plan: study, health

step 人に任せる
  say 急ぐが大事さの低い仕事は、ほかの人に頼んで手を空ける。
  line ask: call, room

step やめる
  say 急ぎでも大事でもない仕事は、今週はやめる。
  line drop: feed
`,In=`// Sort this week's tasks into four areas by two axes: urgency and importance.
// Each step places tasks into one area and decides what to do with them there.
matrix Sort this week's tasks by urgency and importance

axis Urgency [from: low, to: high]
axis Importance [from: low, to: high]

box plan as Schedule it
box now as Do it now
box drop as Drop it
box ask as Hand it off

item report as Report due tomorrow
item trouble as Client bug
item study as Exam study
item health as Book a checkup
item call as Urgent call
item room as Book the meeting room
item feed as Idle social feed

step Line up
  say Line up this week's tasks on the left. None of them sits in an area yet.

step Do it now
  say Tasks that are urgent and important get done today, before anything else.
  line now: report, trouble

step Schedule it
  say Important tasks that are not urgent get a date now so they do not slip.
  line plan: study, health

step Hand it off
  say Urgent tasks of low importance go to someone else to free up time.
  line ask: call, room

step Drop it
  say Tasks that are neither urgent nor important are dropped this week.
  line drop: feed
`,qn=`// 店を開く前に、起こりうる困りごとを起きやすさと影響の2つの軸で4つに分ける。
// 段ごとに1つの区画へ困りごとを置き、区画ごとに打つ手を決める。
matrix 店を開く前の困りごとを分ける

axis 起きやすさ [from: 低い, to: 高い]
axis 影響 [from: 小さい, to: 大きい]

box plan as 備えを決める
box act as すぐ手を打つ
box accept as 受け入れる
box watch as 見張る

item staff as 人手が足りない
item quake as 地震で棚が倒れる
item fire as 厨房の火事
item rain as 雨で客が減る
item stock as 品切れ
item wifi as 店のWi-Fiが切れる

step 並べる
  say 思い付く困りごとを左に並べる。まだどの区画にも置いていない。

step すぐ手を打つ
  say 起きやすく影響も大きい困りごとは、開く前に手を打つ。
  line act: staff

step 備えを決める
  say 起きにくいが影響の大きい困りごとは、起きた時の備えを決めておく。
  line plan: quake, fire

step 見張る
  say 起きやすいが影響の小さい困りごとは、数を見張って早めに気付く。
  line watch: rain, stock

step 受け入れる
  say 起きにくく影響も小さい困りごとは、起きた時に直せばよい。
  line accept: wifi
`,On=`// Before opening a shop, sort the things that could go wrong by two axes: likelihood and impact.
// Each step places risks into one area and decides how to handle that area.
matrix Sort the risks before opening a shop

axis Likelihood [from: low, to: high]
axis Impact [from: small, to: large]

box plan as Plan ahead
box act as Act now
box accept as Accept it
box watch as Keep watch

item staff as Short of staff
item quake as Shelves fall in a quake
item fire as Kitchen fire
item rain as Rain keeps people away
item stock as Out of stock
item wifi as Shop Wi-Fi goes down

step Line up
  say Line up every risk that comes to mind on the left. None of them sits in an area yet.

step Act now
  say Risks that are likely and have a large impact get handled before opening.
  line act: staff

step Plan ahead
  say Unlikely risks with a large impact get a plan ready for when they happen.
  line plan: quake, fire

step Keep watch
  say Likely risks with a small impact are watched in the numbers to catch them early.
  line watch: rain, stock

step Accept it
  say Unlikely risks with a small impact can be fixed when they happen.
  line accept: wifi
`,Mn=`// 次に作る機能を、手間と効き目の点数で点に打つ。
// 段ごとに1つの機能を打ち、点が入った区画で着手の順を決める。
matrix 次に作る機能を手間と効き目の点数で打つ [shape: scatter]

axis 手間 [from: 小さい, to: 大きい]
axis 効き目 [from: 小さい, to: 大きい]

box now as 今やる
box plan as 計画する
box spare as 手が空いたら
box drop as やらない

item search as 検索を速く [x: 2, y: 8.5]
item pay as 決済を足す [x: 8, y: 7]
item copy as 文言の直し [x: 1.5, y: 3]
item export as 書き出しを足す [x: 5, y: 5]
item legacy as 古い画面を作り直す [x: 9, y: 1.5]

step 並べる
  say 次に作る機能と点数を左の表に並べる。まだ点を打っていない。

step 検索
  say 手間が小さく効き目の大きい機能は、今週のうちに作る。
  line: search

step 決済
  say 効き目も手間も大きい機能は、期日を決めて計画に入れる。
  line: pay

step 文言
  say 手間も効き目も小さい機能は、手が空いた時に片付ける。
  line: copy

step 書き出し
  say 真ん中の5点は大きい側に数えるので、書き出しは計画する区画に入る。
  line: export

step 古い画面
  say 手間が大きく効き目の小さい機能は、今は作らない。
  line: legacy
`,jn=`// Plot the next features as dots by their effort and impact scores.
// Each step plots one feature, and the area it lands in decides when to build it.
matrix Plot the next features by effort and impact [shape: scatter]

axis Effort [from: small, to: large]
axis Impact [from: small, to: large]

box now as Do it now
box plan as Plan it
box spare as When free
box drop as Skip it

item search as Faster search [x: 2, y: 8.5]
item pay as Add payments [x: 8, y: 7]
item copy as Fix the wording [x: 1.5, y: 3]
item export as Add export [x: 5, y: 5]
item legacy as Rebuild old UI [x: 9, y: 1.5]

step Line up
  say Line up the next features and their scores in the table on the left. No dot is plotted yet.

step Search
  say A feature with small effort and large impact gets built this week.
  line: search

step Payments
  say A feature with large impact and large effort gets a date in the plan.
  line: pay

step Wording
  say A feature with small effort and small impact waits until someone is free.
  line: copy

step Export
  say A score of 5 counts as the large side, so export lands in Plan it.
  line: export

step Old screens
  say A feature with large effort and small impact is not built for now.
  line: legacy
`,Nn=`// 取引所に上場を頼まれたトークンを、取引の量と信頼の2つの軸で4つに分ける。
// 段ごとに1つの区画へトークンを置き、区画ごとに上場の扱いを決める。
matrix 取引の量と信頼でトークンの上場を分ける

axis 取引の量 [from: 少ない, to: 多い]
axis 信頼 [from: 低い, to: 高い]

box wait as 様子を見る
box list as 上場する
box reject as 断る
box check as 調べ直す

item stable as 監査済みのステーブルコイン
item vote as 大手DAOの投票トークン
item gas as 新しいL2の手数料トークン
item game as ゲームの中の通貨
item meme as 急に伸びたミームトークン
item copy as 有名な名前を真似たトークン

step 並べる
  say 上場を頼まれたトークンを左に並べる。まだどの区画にも置いていない。

step 上場する
  say 取引が多く、監査や持ち主の分散で信頼できるトークンは上場する。
  line list: stable, vote

step 様子を見る
  say 信頼できるが取引のまだ少ないトークンは、量が育つのを待つ。
  line wait: gas, game

step 調べ直す
  say 取引は多いが信頼の低いトークンは、契約と持ち主の偏りを調べ直す。
  line check: meme

step 断る
  say 取引も信頼も低いトークンは断る。
  line reject: copy
`,Jn=`// Sort the tokens an exchange was asked to list by two axes: trading volume and trust.
// Each step places tokens into one area and decides how that area is handled.
matrix Sort token listings by volume and trust

axis Trading volume [from: low, to: high]
axis Trust [from: low, to: high]

box wait as Wait and see
box list as List it
box reject as Turn it down
box check as Look again

item stable as Audited stablecoin
item vote as Large DAO vote token
item gas as New L2 gas token
item game as In-game coin
item meme as Sudden meme token
item copy as Copycat name token

step Line up
  say Line up the tokens asked to be listed on the left. None of them sits in an area yet.

step List it
  say Tokens with high volume that earn trust through audits and spread-out holders get listed.
  line list: stable, vote

step Wait and see
  say Trusted tokens with little trading yet wait for their volume to grow.
  line wait: gas, game

step Look again
  say Tokens with high volume but low trust get their contract and holder spread checked again.
  line check: meme

step Turn it down
  say Tokens low on both volume and trust are turned down.
  line reject: copy
`,Gn=`// アプリを載せるチェーンの候補を、手数料の安さと速さの2つの軸で4つに分ける。
// 段ごとに1つの区画へ候補を置き、区画ごとにどんな時に使うかを決める。
matrix 手数料と速さでチェーンを選ぶ

axis 手数料の安さ [from: 高い, to: 安い]
axis 速さ [from: 遅い, to: 速い]

box rush as 急ぐ時だけ
box first as 最初に選ぶ
box big as 大きな額だけ
box idle as 待てる時に

item fast as 速さを売りにするL1
item rollup as ロールアップのL2
item app as アプリ専用のチェーン
item main as イーサリアムの本体
item side as 古いサイドチェーン

step 並べる
  say 載せる先の候補を左に並べる。まだどの区画にも置いていない。

step 最初に選ぶ
  say 手数料が安く速い候補を、日々の操作の載せ先に選ぶ。
  line first: rollup, app

step 急ぐ時だけ
  say 速いが手数料の高い候補は、待てない操作の時だけ使う。
  line rush: fast

step 待てる時に
  say 安いが遅い候補は、急がない送金をまとめて流す時に使う。
  line idle: side

step 大きな額だけ
  say 高く遅いが最も守りの固い本体は、大きな額を確かめる時だけ使う。
  line big: main
`,Vn=`// Sort the candidate chains for an app by two axes: how cheap the fees are and how fast it is.
// Each step places candidates into one area and decides when to use that area.
matrix Choose a chain by fees and speed

axis Low fees [from: costly, to: cheap]
axis Speed [from: slow, to: fast]

box rush as Only when rushed
box first as First choice
box big as Large sums only
box idle as When it can wait

item fast as Speed-first L1
item rollup as Rollup L2
item app as App-only chain
item main as Ethereum mainnet
item side as Old sidechain

step Line up
  say Line up the candidate chains on the left. None of them sits in an area yet.

step First choice
  say Cheap and fast candidates carry the everyday actions.
  line first: rollup, app

step Only when rushed
  say Fast candidates with high fees are used only for actions that cannot wait.
  line rush: fast

step When it can wait
  say Cheap but slow candidates carry batched transfers that are in no hurry.
  line idle: side

step Large sums only
  say The mainnet is costly and slow but the most secure, so it settles large sums only.
  line big: main
`,zn=`// ウォレットの利用者が、送金と交換と預けるのどれを使ったかを円の重なりで数える。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
venn ウォレットの使い方の重なり

item send as 送金
item swap as 交換
item stake as 預ける

step 送金
  say 1か月に送金した利用者は8,200人いる。
  set send: 8200

step 交換
  say 交換した利用者は5,400人で、そのうち3,100人は送金もした。
  set swap: 5400
  set send & swap: 3100

step 預ける
  say 預けた利用者は2,600人。送金もした人は1,500人、交換もした人は1,200人いる。
  set stake: 2600
  set send & stake: 1500
  set swap & stake: 1200

step 3つ全て
  say 送金と交換と預けるの3つ全てを使った利用者は900人いる。
  set send & swap & stake: 900

step どれも使わない
  say 残高を持つだけで、どれも使わなかった利用者は700人いる。
  set none: 700
`,Yn=`// Count which of send, swap and stake the users of a wallet used, with overlapping circles.
// The values are sample numbers to show the shape, not numbers from a real survey.
venn How a wallet is used

item send as Send
item swap as Swap
item stake as Stake

step Send
  say 8,200 users sent tokens in a month.
  set send: 8200

step Swap
  say 5,400 users swapped, and 3,100 of them also sent.
  set swap: 5400
  set send & swap: 3100

step Stake
  say 2,600 users staked. 1,500 of them also sent, and 1,200 also swapped.
  set stake: 2600
  set send & stake: 1500
  set swap & stake: 1200

step All three
  say 900 users used all three of send, swap and stake.
  set send & swap & stake: 900

step None
  say 700 users only held a balance and used none of them.
  set none: 700
`,_n=`// 1か月にBaseとArbitrumで取引した住所の数を、2つの円の重なりで比べる。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
venn L2の使われ方の重なり

item base as Base
item arb as Arbitrum

step Base
  say Baseで取引した住所は12,000ある。
  set base: 12000

step Arbitrum
  say Arbitrumで取引した住所は9,000ある。
  set arb: 9000

step 両方
  say 両方で取引した住所は3,500あり、残りはどちらか1つだけを使った。
  set base & arb: 3500
`,Kn=`// Compare the number of addresses that traded on Base and Arbitrum in a month, with two overlapping circles.
// The values are sample numbers to show the shape, not numbers from a real survey.
venn How L2 chains are used

item base as Base
item arb as Arbitrum

step Base
  say 12,000 addresses traded on Base.
  set base: 12000

step Arbitrum
  say 9,000 addresses traded on Arbitrum.
  set arb: 9000

step Both
  say 3,500 addresses traded on both, and the rest used only one of them.
  set base & arb: 3500
`,Qn=`// 100人に聞いた趣味の読書と運動と料理が、どう重なるかを円で数える。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
venn 趣味の重なり

item read as 読書
item sport as 運動
item cook as 料理

step 読書
  say 100人のうち、読書が趣味の人は48人いる。
  set read: 48

step 運動
  say 運動が趣味の人は36人で、そのうち14人は読書も趣味にしている。
  set sport: 36
  set read & sport: 14

step 料理
  say 料理が趣味の人は30人。読書もする人は12人、運動もする人は9人いる。
  set cook: 30
  set read & cook: 12
  set sport & cook: 9

step 3つ全て
  say 3つ全てが趣味の人は5人いる。
  set read & sport & cook: 5

step どれでもない
  say 3つのどれも趣味でない人は16人いる。
  set none: 16
`,Xn=`// Count how reading, sports and cooking overlap as hobbies of 100 people, with circles.
// The values are sample numbers to show the shape, not numbers from a real survey.
venn Overlapping hobbies

item read as Reading
item sport as Sports
item cook as Cooking

step Reading
  say Of 100 people, 48 have reading as a hobby.
  set read: 48

step Sports
  say 36 have sports as a hobby, and 14 of them also like reading.
  set sport: 36
  set read & sport: 14

step Cooking
  say 30 have cooking as a hobby. 12 also read, and 9 also do sports.
  set cook: 30
  set read & cook: 12
  set sport & cook: 9

step All three
  say 5 people have all three hobbies.
  set read & sport & cook: 5

step None
  say 16 people have none of the three hobbies.
  set none: 16
`,Zn=`// 開発者の得意がフロントエンドとバックエンドのどちらか、両方かを、2つの円の重なりで数える。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
venn 開発者の得意の重なり

item front as フロントエンド
item back as バックエンド

step フロントエンド
  say 70人の開発者のうち、フロントエンドが得意な人は42人いる。
  set front: 42

step バックエンド
  say バックエンドが得意な人は35人いる。
  set back: 35

step 両方
  say 両方が得意な人は15人いる。
  set front & back: 15

step どちらでもない
  say どちらも得意でない人は8人で、設計や試験を受け持つ。
  set none: 8
`,$n=`// Count whether developers are good at the frontend, the backend or both, with two overlapping circles.
// The values are sample numbers to show the shape, not numbers from a real survey.
venn What developers are good at

item front as Frontend
item back as Backend

step Frontend
  say Of 70 developers, 42 are good at the frontend.
  set front: 42

step Backend
  say 35 are good at the backend.
  set back: 35

step Both
  say 15 are good at both.
  set front & back: 15

step Neither
  say 8 are good at neither and take on design and testing.
  set none: 8
`,et=`// 1,000人に聞いた、いちばんよく使う端末を、1点を10人の点で数えて比べる。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
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
`,nt=`// Compare the devices 1,000 people use most, counting them in dots of 10 people each.
// The values are sample numbers to show the shape, not numbers from a real survey.
chart Devices of 1,000 people [shape: dots]

item i as iPhone
item a as Android
item w as Windows
item m as Mac

step iPhone
  say 412 people use an iPhone most, which makes 41 dots.
  set i: 412

step Android
  say 287 people use Android, the second most after iPhone.
  set a: 287

step Windows
  say 158 people use a Windows computer.
  set w: 158

step Mac
  say 93 people use a Mac, which makes 9 dots.
  set m: 93

step None of them
  say The 50 people who use none of them stay grey in the box of the whole.
  set none: 50
`,tt=`// 調べたウォレットの住所10,000件を、NFTとDeFiとDAOのどれに使ったかで、1点を100件の点で数えて分ける。
// 値は形を見せるための見本の数で、実際の調べた数ではない。
venn 調べた住所 [shape: dots]

item n as NFT
item d as DeFi
item v as DAO

step NFT
  say NFTを持つ住所は4,220件で、点42個になる。
  set n: 4220

step DeFi
  say DeFiを使う住所は5,120件で、そのうち1,520件はNFTも持つ。
  set d: 5120
  set n & d: 1520

step DAO
  say DAOで投票した住所は2,020件で、NFTと重なる住所とDeFiと重なる住所へ点が分かれる。
  set v: 2020
  set n & v: 620
  set d & v: 820

step 3つ全て
  say 3つ全てに入る住所は320件で、点を3色の扇形で塗る。
  set n & d & v: 320

step どれにも
  say どれにも入らない1,280件は、点が灰色のまま全体の箱に残る。
  set none: 1280
`,ot=`// Split 10,000 checked wallet addresses by NFT, DeFi and DAO use, counting them in dots of 100 addresses each.
// The values are sample numbers to show the shape, not numbers from a real survey.
venn Checked addresses [shape: dots]

item n as NFT
item d as DeFi
item v as DAO

step NFT
  say 4,220 addresses hold NFTs, which makes 42 dots.
  set n: 4220

step DeFi
  say 5,120 addresses use DeFi, and 1,520 of them also hold NFTs.
  set d: 5120
  set n & d: 1520

step DAO
  say 2,020 addresses voted in a DAO, and the dots split into the overlaps with NFT and DeFi.
  set v: 2020
  set n & v: 620
  set d & v: 820

step All three
  say 320 addresses are in all three, painted as slices in three colors.
  set n & d & v: 320

step None
  say The 1,280 addresses in none stay grey in the box of the whole.
  set none: 1280
`,st=`// 写真を受け取って縮めて配る構成を、見本のために作った色付きの絵柄で描く。
// 絵柄は見本のために作った物で、事業者が配るアイコンではない。事業者のアイコンは、配る元の最新の物を dragon icon で定義に変えて使う。
architecture 写真を受け取って縮めて配る

blocks 1
block +phone
  base icon
  view 0 0 24 24
  paint #1E3A8A "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2z"
  paint #BFDBFE "M7 5h10v12h-10z"
  paint #10B981 "M8 16l3 -4l2 2.5l1.5 -2l2.5 3.5z"
  paint #F59E0B "M13.6 8a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0z"
end
block +resize
  base icon
  view 0 0 24 24
  paint #7C3AED evenodd "M3 3h18v18h-18z M5 5v14h14v-14z"
  paint #F472B6 "M7 12h6v6h-6z"
  paint #7C3AED "M13 6h5v5l-1.8 -1.8l-2.8 2.8l-1.4 -1.4l2.8 -2.8z"
end
block +cloud
  base icon
  view 0 0 24 24
  paint #0EA5E9 "M7 19a4.5 4.5 0 0 1 -.6 -8.96a6 6 0 0 1 11.4 -.84a5 5 0 0 1 -.3 9.8z"
  paint #FFFFFF "M11 9h2v4h2.5l-3.5 3.5l-3.5 -3.5h2.5z"
end

box app as スマホのアプリ [note: 撮った写真を送る, color: blue, icon: +phone]
box shrink as 縮める処理 [note: 3つの大きさに縮める, color: violet, icon: +resize]
box cdn as 配る置き場 [note: 近い所から配る, color: green, icon: +cloud]
box viewer as 見る人 [note: 縮めた写真を見る, color: amber, icon: user]

step 受け取る
  say スマホのアプリが、撮った写真を縮める処理へ送る。
  app -> shrink: 写真

step 縮める
  say 縮める処理が写真を3つの大きさに縮め、配る置き場に置く。
  shrink -> cdn: 縮めた写真

step 配る
  say 見る人は、近い配る置き場から縮めた写真を受け取る。
  cdn -> viewer: 写真
`,at=`// Draw a setup that receives photos, shrinks them and delivers them, with colored icons made for this sample.
// The icons were made for this sample and are not icons a provider hands out. Convert the latest icons from the provider with dragon icon and use those.
architecture Receive, shrink and deliver photos

blocks 1
block +phone
  base icon
  view 0 0 24 24
  paint #1E3A8A "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2z"
  paint #BFDBFE "M7 5h10v12h-10z"
  paint #10B981 "M8 16l3 -4l2 2.5l1.5 -2l2.5 3.5z"
  paint #F59E0B "M13.6 8a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0z"
end
block +resize
  base icon
  view 0 0 24 24
  paint #7C3AED evenodd "M3 3h18v18h-18z M5 5v14h14v-14z"
  paint #F472B6 "M7 12h6v6h-6z"
  paint #7C3AED "M13 6h5v5l-1.8 -1.8l-2.8 2.8l-1.4 -1.4l2.8 -2.8z"
end
block +cloud
  base icon
  view 0 0 24 24
  paint #0EA5E9 "M7 19a4.5 4.5 0 0 1 -.6 -8.96a6 6 0 0 1 11.4 -.84a5 5 0 0 1 -.3 9.8z"
  paint #FFFFFF "M11 9h2v4h2.5l-3.5 3.5l-3.5 -3.5h2.5z"
end

box app as Phone app [note: Sends the photo taken, color: blue, icon: +phone]
box shrink as Shrinker [note: Makes 3 sizes, color: violet, icon: +resize]
box cdn as Delivery store [note: Serves from nearby, color: green, icon: +cloud]
box viewer as Viewer [note: Sees the small photo, color: amber, icon: user]

step Receive
  say The phone app sends the photo it took to the shrinker.
  app -> shrink: photo

step Shrink
  say The shrinker makes 3 sizes of the photo and puts them in the delivery store.
  shrink -> cdn: small photos

step Deliver
  say The viewer gets the small photo from a nearby delivery store.
  cdn -> viewer: photo
`,rt=`// 新しく作ったトークンを、仲間と作った人と出資した人と運営の蓄えへどれだけ配るかを、全量から分かれる帯で追う。
// 割合は形を見せるための見本の値で、実際のトークンの配り方ではない。
sankey トークンの配り先

box total as 全量1億トークン [color: slate]
box comm as 仲間に配る [color: green]
box team as 作った人 [color: blue]
box inv as 出資した人 [color: violet]
box treas as 運営の蓄え [color: amber]
box rew as 使った人への報酬 [color: green]
box don as 寄付 [color: rose]

step 作る
  say 1億トークンを作る。

step 仲間に配る
  say 全量の40%を、仲間に配る枠へ回す。
  total -> comm: 40%

step 作った人と出資した人へ
  say 20%を作った人へ、18%を出資した人へ回す。
  total -> team: 20%
  total -> inv: 18%

step 運営の蓄えへ
  say 残りの22%を運営の蓄えへ回す。
  total -> treas: 22%

step 仲間の分を分ける
  say 仲間の40%を、使った人への報酬の25%と寄付の15%に分ける。
  comm -> rew: 25%
  comm -> don: 15%
`,it=`// Follow how much of a newly minted token goes to the community, the team, the investors and the treasury, with bands that split off the total.
// The shares are sample values to show the shape, not how a real token is handed out.
sankey Where the tokens go

box total as Total 100M tokens [color: slate]
box comm as Community pool [color: green]
box team as Team [color: blue]
box inv as Investors [color: violet]
box treas as Treasury [color: amber]
box rew as User rewards [color: green]
box don as Donations [color: rose]

step Mint
  say Mint 100 million tokens.

step Community pool
  say Send 40% of the total to the community pool.
  total -> comm: 40%

step Team and investors
  say Send 20% to the team and 18% to the investors.
  total -> team: 20%
  total -> inv: 18%

step Treasury
  say Send the remaining 22% to the treasury.
  total -> treas: 22%

step Split the community pool
  say Split the community 40% into 25% for user rewards and 15% for donations.
  comm -> rew: 25%
  comm -> don: 15%
`,lt=`// 交換所の取引の手数料が、流動性を預けた人と運営の蓄えと買い戻しへどれだけ分かれるかを追う。
// 額は形を見せるための見本の値で、実際の交換所の数ではない。
sankey 取引の手数料の分け先

box fee as 1日の手数料1,000 USDC [color: slate]
box lp as 流動性を預けた人 [color: blue]
box protocol as 交換所の取り分 [color: violet]
box treasury as 運営の蓄え [color: amber]
box burn as 買い戻して燃やす [color: rose]

step 集める
  say 1日の取引で、手数料が1,000 USDC集まる。

step 預けた人へ
  say 手数料の8割の800 USDCを、流動性を預けた人へ配る。
  fee -> lp: 800 USDC

step 交換所の取り分
  say 残りの200 USDCが交換所の取り分になる。
  fee -> protocol: 200 USDC

step 取り分を分ける
  say 取り分のうち120 USDCを運営の蓄えへ回し、80 USDCで交換所のトークンを買い戻して燃やす。
  protocol -> treasury: 120 USDC
  protocol -> burn: 80 USDC
`,ht=`// Follow how the trading fees of an exchange split between the liquidity providers, the treasury and buybacks.
// The amounts are sample values to show the shape, not numbers from a real exchange.
sankey Where the trading fees go

box fee as Fees in a day 1,000 USDC [color: slate]
box lp as Liquidity providers [color: blue]
box protocol as Exchange share [color: violet]
box treasury as Treasury [color: amber]
box burn as Buy back and burn [color: rose]

step Collect
  say A day of trading collects 1,000 USDC in fees.

step Liquidity providers
  say Pay 80% of the fees, 800 USDC, to the liquidity providers.
  fee -> lp: 800 USDC

step Exchange share
  say The remaining 200 USDC is the share of the exchange.
  fee -> protocol: 200 USDC

step Split the share
  say Send 120 USDC of the share to the treasury and use 80 USDC to buy back the exchange token and burn it.
  protocol -> treasury: 120 USDC
  protocol -> burn: 80 USDC
`,ct=`// 1か月の手取りの給料が、決まった出費と食費と遊びと貯金へどれだけ分かれるかを追う。
// 額は形を見せるための見本の値で、実際の家計の数ではない。
sankey 給料の行き先

box pay as 手取り30万円 [color: slate]
box fixed as 決まった出費 [color: blue]
box food as 食費 [color: amber]
box fun as 遊び [color: rose]
box save as 貯金 [color: green]
box rent as 家賃 [color: blue]
box bills as 光熱費と通信費 [color: violet]

step 受け取る
  say 1か月の手取りの給料は30万円。

step 決まった出費
  say 毎月決まって出ていく分に13万円を回す。
  pay -> fixed: 13万円

step 食費と遊び
  say 食費に6万円、遊びに3万円を使う。
  pay -> food: 6万円
  pay -> fun: 3万円

step 貯金
  say 残りの8万円を貯金へ回す。
  pay -> save: 8万円

step 決まった出費の中身
  say 決まった出費の13万円は、家賃の10万円と、光熱費と通信費の3万円に分かれる。
  fixed -> rent: 10万円
  fixed -> bills: 3万円
`,pt=`// Follow how a month of take-home pay splits into fixed costs, food, fun and savings.
// The amounts are sample values to show the shape, not numbers from a real household.
sankey Where the pay goes

box pay as Take-home pay 300k yen [color: slate]
box fixed as Fixed costs [color: blue]
box food as Food [color: amber]
box fun as Fun [color: rose]
box save as Savings [color: green]
box rent as Rent [color: blue]
box bills as Utilities and phone [color: violet]

step Get paid
  say A month of take-home pay is 300k yen.

step Fixed costs
  say Set aside 130k yen for the costs that come every month.
  pay -> fixed: 130k yen

step Food and fun
  say Spend 60k yen on food and 30k yen on fun.
  pay -> food: 60k yen
  pay -> fun: 30k yen

step Savings
  say Put the remaining 80k yen into savings.
  pay -> save: 80k yen

step Inside the fixed costs
  say The 130k yen of fixed costs splits into 100k yen of rent and 30k yen for utilities and the phone.
  fixed -> rent: 100k yen
  fixed -> bills: 30k yen
`,dt=`// お店の1年の売上が、仕入れと人件費と家賃と利益へどれだけ分かれ、利益がどこへ行くかを追う。
// 額は形を見せるための見本の値で、実際のお店の数ではない。
sankey 売上の行き先

box sales as 1年の売上5,000万円 [color: slate]
box cost as 仕入れ [color: amber]
box staff as 人件費 [color: blue]
box rent as 家賃 [color: violet]
box profit as 利益 [color: green]
box tax as 税 [color: rose]
box keep as 手元に残す [color: green]

step 売る
  say 1年の売上は5,000万円。

step 仕入れ
  say 売上の4割の2,000万円が仕入れに出ていく。
  sales -> cost: 2,000万円

step 人件費と家賃
  say 人件費に1,500万円、家賃に600万円を払う。
  sales -> staff: 1,500万円
  sales -> rent: 600万円

step 利益
  say 残りの900万円が利益になる。
  sales -> profit: 900万円

step 利益の行き先
  say 利益のうち270万円を税で納め、630万円を手元に残す。
  profit -> tax: 270万円
  profit -> keep: 630万円
`,ut=`// Follow how a year of sales at a shop splits into stock, staff, rent and profit, and where the profit goes.
// The amounts are sample values to show the shape, not numbers from a real shop.
sankey Where the sales go

box sales as Sales in a year 50M yen [color: slate]
box cost as Stock [color: amber]
box staff as Staff [color: blue]
box rent as Rent [color: violet]
box profit as Profit [color: green]
box tax as Tax [color: rose]
box keep as Kept [color: green]

step Sell
  say A year of sales comes to 50M yen.

step Stock
  say 40% of the sales, 20M yen, goes out on stock.
  sales -> cost: 20M yen

step Staff and rent
  say Pay 15M yen for staff and 6M yen in rent.
  sales -> staff: 15M yen
  sales -> rent: 6M yen

step Profit
  say The remaining 9M yen is the profit.
  sales -> profit: 9M yen

step Where the profit goes
  say Pay 2.7M yen of the profit in tax and keep 6.3M yen.
  profit -> tax: 2.7M yen
  profit -> keep: 6.3M yen
`,mt=`// 1日の24時間を、寝る時間と起きている時間に分け、起きている時間を仕事と家のことと自由な時間に分けていく流れを、段ごとの帯で追う。
// 時間は形を見せるための見本の値で、誰かの実際の1日ではない。
sankey 1日24時間の使い方 [shape: rows]

box day as 1日 [color: slate]
box sleep as 寝る [color: blue]
box awake as 起きている [color: amber]
box work as 仕事 [color: violet]
box home as 家のこと [color: green]
box free as 自由な時間 [color: rose]
box move as 通う [color: violet]
box desk as 働く [color: violet]

step 1日
  say 1日は24時間。

step 寝る
  say 24時間のうち8時間を寝る。
  day -> sleep: 8時間

step 起きている
  say 残りの16時間は起きている。
  day -> awake: 16時間

step 起きている時間を分ける
  say 起きている16時間を、仕事の10時間と家のことの3時間と自由な時間の3時間に分ける。
  awake -> work: 10時間
  awake -> home: 3時間
  awake -> free: 3時間

step 仕事の時間を分ける
  say 仕事の10時間を、通う2時間と働く8時間に分ける。
  work -> move: 2時間
  work -> desk: 8時間
`,yt=`// Follow how the 24 hours of a day split into sleep and awake time, and how the awake time splits into work, home and free time, one row per step.
// The hours are sample values to show the shape, not anyone's real day.
sankey How a day's 24 hours are spent [shape: rows]

box day as One day [color: slate]
box sleep as Sleep [color: blue]
box awake as Awake [color: amber]
box work as Work [color: violet]
box home as Home [color: green]
box free as Free time [color: rose]
box move as Commute [color: violet]
box desk as Desk work [color: violet]

step One day
  say A day has 24 hours.

step Sleep
  say Sleep 8 of the 24 hours.
  day -> sleep: 8h

step Awake
  say The other 16 hours are awake time.
  day -> awake: 16h

step Split the awake time
  say Split the 16 awake hours into 10 hours of work, 3 hours at home and 3 hours of free time.
  awake -> work: 10h
  awake -> home: 3h
  awake -> free: 3h

step Split the work time
  say Split the 10 hours of work into a 2-hour commute and 8 hours at the desk.
  work -> move: 2h
  work -> desk: 8h
`,gt=`// スマホの128GBの保存領域を、写真とアプリと動画と空きに分け、アプリをさらに遊びと仕事に分けていく流れを、面積で割る四角で追う。
// 容量は形を見せるための見本の値で、誰かの実際のスマホではない。
sankey スマホの保存領域の内訳 [shape: treemap]

box all as 保存領域 [color: slate]
box photo as 写真 [color: blue]
box app as アプリ [color: green]
box video as 動画 [color: violet]
box free as 空き [color: amber]
box game as 遊び [color: rose]
box work as 仕事 [color: blue]

step 保存領域
  say スマホの保存領域は128GB。

step 写真
  say 128GBのうち48GBを写真が使う。
  all -> photo: 48GB

step アプリと動画
  say アプリが32GB、動画が16GBを使う。
  all -> app: 32GB
  all -> video: 16GB

step 空き
  say 残りの32GBは空き。
  all -> free: 32GB

step アプリの内訳
  say アプリの32GBを、遊びの20GBと仕事の12GBに分ける。
  app -> game: 20GB
  app -> work: 12GB
`,ft=`// Follow how a phone's 128GB of storage splits into photos, apps, videos and free space, and how the apps split into games and work, as one square cut by area.
// The sizes are sample values to show the shape, not anyone's real phone.
sankey What fills a phone's storage [shape: treemap]

box all as Storage [color: slate]
box photo as Photos [color: blue]
box app as Apps [color: green]
box video as Videos [color: violet]
box free as Free space [color: amber]
box game as Games [color: rose]
box work as Work [color: blue]

step Storage
  say The phone has 128GB of storage.

step Photos
  say Photos use 48 of the 128GB.
  all -> photo: 48GB

step Apps and videos
  say Apps use 32GB and videos use 16GB.
  all -> app: 32GB
  all -> video: 16GB

step Free space
  say The other 32GB is free space.
  all -> free: 32GB

step Inside the apps
  say Split the 32GB of apps into 20GB of games and 12GB of work.
  app -> game: 20GB
  app -> work: 12GB
`,e={"purchase-shoes":{ja:o,en:s},"purchase-standard":{ja:a,en:r},"purchase-quantity":{ja:i,en:l},"purchase-retry":{ja:h,en:c},api:{ja:W,en:B},retry:{ja:Y,en:_},payment:{ja:J,en:G},wallet:{ja:X,en:Z},bridge:{ja:$,en:ee},order:{ja:j,en:N},rebase:{ja:V,en:z},merge:{ja:I,en:q},finality:{ja:L,en:F},withdraw:{ja:ne,en:te},"release-plan":{ja:oe,en:se},merkle:{ja:O,en:M},auction:{ja:U,en:R},"tx-block":{ja:K,en:Q},swap:{ja:p,en:d},"swap-revert":{ja:u,en:m},"swap-two-hops":{ja:y,en:g},"swap-retry":{ja:f,en:b},"vault-proxy":{ja:w,en:k},aggregator:{ja:v,en:x},"os-share":{ja:T,en:D},tickets:{ja:A,en:C},"login-check":{ja:E,en:S},"login-all-paths":{ja:P,en:H},shop:{ja:ae,en:re},video:{ja:ie,en:le},"tx-status":{ja:he,en:ce},subscription:{ja:pe,en:de},"support-ticket":{ja:ue,en:me},hotfix:{ja:ye,en:ge},squash:{ja:fe,en:be},"shop-opening":{ja:we,en:ke},tournament:{ja:ve,en:xe},sitemap:{ja:Te,en:De},"hd-wallet":{ja:Ae,en:Ce},clinic:{ja:Ee,en:Se},kanban:{ja:Pe,en:He},"release-flow":{ja:We,en:Be},"contract-audit":{ja:Ue,en:Re},"rollup-batch":{ja:Le,en:Fe},"l2-finality":{ja:Ie,en:qe},"web-request":{ja:Oe,en:Me},"video-publish":{ja:je,en:Ne},"checkout-lanes":{ja:Je,en:Ge},"stock-reserve":{ja:Ve,en:ze},multisig:{ja:Ye,en:_e},"gas-fee":{ja:Ke,en:Qe},"staking-rewards":{ja:Xe,en:Ze},"shop-funnel":{ja:$e,en},"wallet-onboarding":{ja:nn,en:tn},"approve-deposit":{ja:on,en:sn},"return-check":{ja:an,en:rn},"eth-slot":{ja:ln,en:hn},sprint:{ja:cn,en:pn},pdca:{ja:dn,en:un},restake:{ja:mn,en:yn},"focus-clock":{ja:gn,en:fn},"farm-year":{ja:bn,en:wn},"budget-app":{ja:kn,en:vn},"trip-plan":{ja:xn,en:Tn},"dao-proposal":{ja:Dn,en:An},"wallet-ux":{ja:Cn,en:En},"order-total":{ja:Sn,en:Pn},"library-loan":{ja:Hn,en:Wn},"nft-sale":{ja:Bn,en:Un},"token-transfer":{ja:Rn,en:Ln},"task-priority":{ja:Fn,en:In},"risk-matrix":{ja:qn,en:On},"feature-scores":{ja:Mn,en:jn},"token-listing":{ja:Nn,en:Jn},"chain-choice":{ja:Gn,en:Vn},"wallet-usage":{ja:zn,en:Yn},"l2-chains":{ja:_n,en:Kn},hobbies:{ja:Qn,en:Xn},skills:{ja:Zn,en:$n},"token-allocation":{ja:rt,en:it},"fee-split":{ja:lt,en:ht},salary:{ja:ct,en:pt},revenue:{ja:dt,en:ut},"day-hours":{ja:mt,en:yt},"phone-storage":{ja:gt,en:ft},"device-dots":{ja:et,en:nt},"wallet-dots":{ja:tt,en:ot},"photo-delivery":{ja:st,en:at}};async function bt(n){return await Promise.all(Object.values(e).flatMap(t=>Object.values(t).map(n))),e}export{e as LATER_EXAMPLES,bt as withReadings};
