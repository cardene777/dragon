import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Ethereum の仕組みをアニメーションで説明する 4 図。
 *
 * シーケンス図が「誰が誰を呼んだか」 の順序を描くのに対し、 ここでは
 * **数値が動く様子そのもの** を見せる。 残高が減って増える、 手数料が上下する、
 * ブロックが積まれる、 といった変化を tween で表現し、 静止図では伝わらない
 * 「何が起きているか」 を直感的に掴めるようにする。
 *
 * 各図は phase を追うごとに state が変わり、 title / body で今どの段階かを説明する。
 */

// ============================================================
// 1. ERC-20 の送金 — 残高の付け替えを見る
// ============================================================

/**
 * ERC-20 の transfer は「トークンが動く」 のではなく
 * **契約が持つ残高表の数字を書き換えるだけ** という点が理解の要になる。
 *
 * 送り手の残高が減り、 受け手の残高が増える。 その 2 つが同時に起きることを
 * 2 つの数値の tween で同時に見せる。 合計が変わらないことも読み取れる。
 */
export const erc20Transfer = diagram("eth-erc20-transfer", {
  topic: "ERC-20 の送金 — 残高表の書き換え",
})
  .lane("sender", { x: 0, width: 320, label: "送り手" })
  .lane("contract", { x: 420, width: 380, label: "トークン契約" })
  .lane("receiver", { x: 900, width: 320, label: "受け手" })
  .state("balA", { initial: 1000 })
  .state("balB", { initial: 0 })
  .state("amount", { initial: 0 })
  .state("step", { initial: "送金前" })
  .node("alice", {
    lane: "sender", stack: 0, kind: "shape-wallet",
    title: "Alice の財布", subtitle: "残高 {balA} TKN", w: 280, h: 200,
  })
  .node("token", {
    lane: "contract", stack: 0, kind: "shape-smart-contract",
    title: "ERC-20 契約", subtitle: "{step}", w: 340, h: 200,
  })
  .node("ledger", {
    lane: "contract", stack: 1, kind: "dyn-rect",
    title: "残高表", subtitle: "Alice {balA} / Bob {balB}", w: 340, h: 160,
    shape: { kind: "rect", source: "{balB}", fillMax: 250, orient: "up", fill: "#4e9dc4" },
  })
  .node("bob", {
    lane: "receiver", stack: 0, kind: "shape-wallet",
    title: "Bob の財布", subtitle: "残高 {balB} TKN", w: 280, h: 200,
  })
  .edge("alice", "token", { id: "e-call", label: "transfer(Bob, 250)", tone: "info" })
  .edge("token", "bob", { id: "e-credit", label: "残高を加算", tone: "success" })
  .phase("p1", {
    duration: 2200,
    title: "① 送金を申し込む",
    body: "Alice が契約に「Bob へ 250 送って」 と伝える。 この時点ではまだ何も動いていない。",
  }, (p: PhaseBuilder) => p.activate("alice").activate("token").set("step", "申込を受理").tween("amount", 0, 250).badge("transfer 呼び出し"))
  .phase("p2", {
    duration: 2600,
    title: "② 残高が足りるか確かめる",
    body: "契約は残高表を見て、 Alice が 250 以上持っているかを確認する。 足りなければここで失敗して終わる。",
  }, (p: PhaseBuilder) => p.activate("token").activate("ledger").set("step", "残高を確認中").badge("require(balance >= 250)"))
  .phase("p3", {
    duration: 3000,
    title: "③ 数字を付け替える",
    body: "送り手から 250 を引き、 受け手に 250 を足す。 トークンが移動するのではなく、 表の数字が同時に書き換わるだけ。 合計は 1000 のまま変わらない。",
  }, (p: PhaseBuilder) => p.activate("ledger").tween("balA", 1000, 750).tween("balB", 0, 250).set("step", "残高を更新").badge("書き換え中"))
  .phase("p4", {
    duration: 2200,
    title: "④ 記録を残す",
    body: "Transfer という記録を残して完了。 外部のアプリはこの記録を読んで残高の変化を知る。",
  }, (p: PhaseBuilder) => p.activate("bob").activate("token").set("step", "完了").badge("Transfer イベント"))
  .build();

// ============================================================
// 2. EIP-1559 — 手数料が上下する仕組み
// ============================================================

/**
 * EIP-1559 の要点は「基礎手数料がブロックの混み具合で自動的に上下する」 こと。
 *
 * 混雑度 (使用率) が 50% を超えると次のブロックの基礎手数料が上がり、
 * 下回ると下がる。 その追随の様子を、 使用率と手数料の 2 本の数値を
 * 並べて動かすことで見せる。
 */
export const eip1559Gas = diagram("eth-eip1559-gas", {
  topic: "EIP-1559 — 手数料が混み具合で上下する",
})
  .lane("block", { x: 0, width: 380, label: "ブロックの混み具合" })
  .lane("fee", { x: 480, width: 380, label: "基礎手数料" })
  .lane("user", { x: 960, width: 340, label: "利用者の支払い" })
  .state("usage", { initial: 50 })
  .state("base", { initial: 20 })
  .state("tip", { initial: 2 })
  .state("burn", { initial: 0 })
  .state("mood", { initial: "ちょうど良い" })
  .node("gauge", {
    lane: "block", stack: 0, kind: "dyn-arc",
    title: "使用率", subtitle: "{usage}%", w: 340, h: 320,
    shape: { kind: "arc", angle: "{usage}", sweepMax: 100, outerRadius: 130, innerRadius: 92, fill: "#e0803a" },
  })
  .node("target", {
    lane: "block", stack: 1, kind: "card",
    title: "目標は 50%", subtitle: "{mood}", w: 340, h: 120,
  })
  .node("basefee", {
    lane: "fee", stack: 0, kind: "dyn-wave",
    title: "基礎手数料", subtitle: "{base} gwei", w: 340, h: 320,
    shape: { kind: "wave", level: "{base}", amplitude: 60, frequency: 2, waveHeight: 6, fill: "#4e9dc4" },
  })
  .node("burned", {
    lane: "fee", stack: 1, kind: "card",
    title: "焼却された分", subtitle: "累計 {burn} gwei", w: 340, h: 120,
  })
  .node("payer", {
    lane: "user", stack: 0, kind: "shape-person",
    title: "支払う人", subtitle: "基礎 {base} + チップ {tip}", w: 300, h: 200,
  })
  .node("validator", {
    lane: "user", stack: 1, kind: "shape-blockchain-node",
    title: "検証者", subtitle: "受け取るのはチップ {tip} のみ", w: 300, h: 200,
  })
  .edge("gauge", "basefee", { id: "e-adjust", label: "次のブロックへ反映", tone: "info" })
  .edge("payer", "validator", { id: "e-tip", label: "チップ", tone: "success" })
  .phase("p1", {
    duration: 2400,
    title: "① 目標ちょうどのとき",
    body: "ブロックの使用率が目標の 50% なら、 基礎手数料は据え置き。 空いても混んでもいない状態。",
  }, (p: PhaseBuilder) => p.activate("gauge").activate("target").set("mood", "ちょうど良い").badge("据え置き"))
  .phase("p2", {
    duration: 3000,
    title: "② 混んできたとき",
    body: "使用率が 50% を超えると、 次のブロックの基礎手数料が上がる。 1 ブロックで最大 12.5% までしか動かないので、 急騰はしない。",
  }, (p: PhaseBuilder) => p.activate("gauge").activate("basefee").tween("usage", 50, 95).tween("base", 20, 45).set("mood", "混雑").badge("手数料が上がる"))
  .phase("p3", {
    duration: 2600,
    title: "③ 高い手数料を払う",
    body: "利用者は基礎手数料とチップを払う。 基礎手数料は誰の手にも渡らず消える (焼却)。 検証者が受け取るのはチップだけ。",
  }, (p: PhaseBuilder) => p.activate("payer").activate("validator").activate("burned").tween("burn", 0, 45).badge("基礎分は焼却"))
  .phase("p4", {
    duration: 3000,
    title: "④ 空いてきたとき",
    body: "使用率が 50% を下回ると基礎手数料は下がる。 混雑が続かない限り自動的に元の水準へ戻っていく。",
  }, (p: PhaseBuilder) => p.activate("gauge").activate("basefee").tween("usage", 95, 20).tween("base", 45, 18).tween("burn", 45, 63).set("mood", "空いている").badge("手数料が下がる"))
  .build();

// ============================================================
// 3. ERC-4337 — 財布そのものを契約にする
// ============================================================

/**
 * ERC-4337 (アカウント抽象化) は「秘密鍵を持つ人だけが取引を出せる」 という
 * 前提を外し、 **契約が自分で取引の正しさを判断する** 形にしたもの。
 *
 * 通常の取引とは別の流れ (専用の待ち行列 → まとめ役 → 入口の契約) を通る。
 * その 4 者の間を要求が流れていく様子を段階的に見せる。
 */
export const erc4337Flow = diagram("eth-erc4337-flow", {
  topic: "ERC-4337 — 財布を契約にして代理で払う",
})
  .lane("user", { x: 0, width: 300, label: "利用者" })
  .lane("pool", { x: 380, width: 300, label: "専用の待ち行列" })
  .lane("bundler", { x: 760, width: 300, label: "まとめ役" })
  .lane("entry", { x: 1140, width: 320, label: "入口の契約" })
  .lane("wallet", { x: 1540, width: 300, label: "契約財布" })
  .state("ops", { initial: 0 })
  .state("gas", { initial: 0 })
  .state("stage", { initial: "作成前" })
  .state("paid", { initial: "本人" })
  .node("owner", {
    lane: "user", stack: 0, kind: "shape-person",
    title: "利用者", subtitle: "{stage}", w: 260, h: 200,
  })
  .node("mempool", {
    lane: "pool", stack: 0, kind: "dyn-rect",
    title: "待ち行列", subtitle: "{ops} 件", w: 260, h: 220,
    shape: { kind: "rect", source: "{ops}", fillMax: 5, orient: "up", fill: "#8a5a2a" },
  })
  .node("bundle", {
    lane: "bundler", stack: 0, kind: "shape-stack",
    title: "まとめ役", subtitle: "{ops} 件を 1 つに", w: 260, h: 220,
  })
  .node("entrypoint", {
    lane: "entry", stack: 0, kind: "shape-smart-contract",
    title: "入口の契約", subtitle: "検証と実行", w: 280, h: 220,
  })
  .node("paymaster", {
    lane: "entry", stack: 1, kind: "shape-payment-provider",
    title: "手数料の肩代わり", subtitle: "支払者 = {paid}", w: 280, h: 180,
  })
  .node("account", {
    lane: "wallet", stack: 0, kind: "shape-wallet",
    title: "契約財布", subtitle: "自分で正しさを判断", w: 260, h: 220,
  })
  .edge("owner", "mempool", { id: "e1", label: "やりたいことを出す", tone: "info" })
  .edge("mempool", "bundle", { id: "e2", label: "拾い集める", tone: "info" })
  .edge("bundle", "entrypoint", { id: "e3", label: "まとめて渡す", tone: "info" })
  .edge("entrypoint", "account", { id: "e4", label: "検証を頼む", tone: "warning" })
  .edge("entrypoint", "paymaster", { id: "e5", label: "手数料を請求", tone: "success" })
  .phase("p1", {
    duration: 2400,
    title: "① やりたいことを書いて出す",
    body: "利用者は取引そのものではなく「やりたいこと」 を書いて出す。 秘密鍵で署名する代わりに、 指紋認証や複数人の承認でもよい。",
  }, (p: PhaseBuilder) => p.activate("owner").activate("mempool").set("stage", "作成して送信").tween("ops", 0, 1).badge("UserOperation"))
  .phase("p2", {
    duration: 2600,
    title: "② まとめ役が拾い集める",
    body: "専用の待ち行列から複数人分をまとめ役が拾う。 1 つの取引にまとめることで、 1 人あたりの手数料が下がる。",
  }, (p: PhaseBuilder) => p.activate("mempool").activate("bundle").tween("ops", 1, 5).set("stage", "束ねられた").badge("5 件を 1 つに"))
  .phase("p3", {
    duration: 3000,
    title: "③ 入口の契約が正しさを確かめる",
    body: "入口の契約が各財布に「これはあなたの意思か」 と尋ねる。 判断の仕方は財布ごとに自由に決められる。 ここが従来と最も違う点。",
  }, (p: PhaseBuilder) => p.activate("entrypoint").activate("account").set("stage", "検証中").tween("gas", 0, 120).badge("財布が自分で判断"))
  .phase("p4", {
    duration: 2600,
    title: "④ 手数料を肩代わりしてもらう",
    body: "手数料を別の誰かが払える。 利用者はガス代を持っていなくても取引できる。 サービス側が負担する使い方が典型例。",
  }, (p: PhaseBuilder) => p.activate("paymaster").activate("entrypoint").set("paid", "サービス側").set("stage", "実行完了").tween("gas", 120, 180).badge("肩代わり"))
  .build();

// ============================================================
// 4. ブロックが作られるまで
// ============================================================

/**
 * 取引が出されてから確定するまでの流れ。
 *
 * 待ち行列に溜まる → 提案者が選ばれる → ブロックに詰める → 他の検証者が確かめる →
 * 十分な賛成が集まって確定、 という 5 段階を、 件数と賛成率の変化で見せる。
 */
export const blockProduction = diagram("eth-block-production", {
  topic: "Ethereum のブロックができるまで",
})
  .lane("tx", { x: 0, width: 320, label: "取引の待ち行列" })
  .lane("proposer", { x: 400, width: 340, label: "提案者" })
  .lane("block", { x: 820, width: 340, label: "作られるブロック" })
  .lane("attest", { x: 1240, width: 340, label: "他の検証者" })
  .state("pending", { initial: 0 })
  .state("included", { initial: 0 })
  .state("votes", { initial: 0 })
  .state("slot", { initial: "待機中" })
  .state("status", { initial: "未確定" })
  .node("pool", {
    lane: "tx", stack: 0, kind: "dyn-wave",
    title: "待っている取引", subtitle: "{pending} 件", w: 280, h: 280,
    shape: { kind: "wave", level: "{pending}", amplitude: 200, frequency: 2, waveHeight: 6, fill: "#8a5a2a" },
  })
  .node("picker", {
    lane: "proposer", stack: 0, kind: "shape-blockchain-node",
    title: "選ばれた提案者", subtitle: "{slot}", w: 300, h: 220,
  })
  .node("fee", {
    lane: "proposer", stack: 1, kind: "card",
    title: "並べ替えの裁量", subtitle: "手数料の高い順に選ぶ", w: 300, h: 140,
  })
  .node("newblock", {
    lane: "block", stack: 0, kind: "shape-blockchain-block",
    title: "新しいブロック", subtitle: "{included} 件を収録", w: 300, h: 220,
  })
  .node("chain", {
    lane: "block", stack: 1, kind: "shape-ethereum-chain",
    title: "つながる先", subtitle: "{status}", w: 300, h: 160,
  })
  .node("voters", {
    lane: "attest", stack: 0, kind: "dyn-arc",
    title: "賛成の割合", subtitle: "{votes}%", w: 300, h: 300,
    shape: { kind: "arc", angle: "{votes}", sweepMax: 100, outerRadius: 120, innerRadius: 84, fill: "#4e9dc4" },
  })
  .edge("pool", "picker", { id: "e1", label: "取り出す", tone: "info" })
  .edge("picker", "newblock", { id: "e2", label: "詰める", tone: "info" })
  .edge("newblock", "voters", { id: "e3", label: "確かめてもらう", tone: "warning" })
  .edge("voters", "chain", { id: "e4", label: "確定", tone: "success" })
  .phase("p1", {
    duration: 2400,
    title: "① 取引が溜まっていく",
    body: "世界中から送られた取引が待ち行列に溜まる。 まだどのブロックにも入っていない状態。",
  }, (p: PhaseBuilder) => p.activate("pool").tween("pending", 0, 180).set("slot", "待機中").badge("待ち行列"))
  .phase("p2", {
    duration: 2400,
    title: "② 提案者が選ばれる",
    body: "12 秒ごとに 1 人が提案者に選ばれる。 誰が選ばれるかは事前に決まっているが、 予測しにくい仕組みになっている。",
  }, (p: PhaseBuilder) => p.activate("picker").activate("fee").set("slot", "この番の担当").badge("12 秒に 1 人"))
  .phase("p3", {
    duration: 3000,
    title: "③ ブロックに詰める",
    body: "提案者は待ち行列から取引を選んでブロックに入れる。 どれを入れるか、 どの順に並べるかは提案者の裁量。 手数料の高いものが選ばれやすい。",
  }, (p: PhaseBuilder) => p.activate("picker").activate("newblock").tween("pending", 180, 60).tween("included", 0, 120).badge("120 件を収録"))
  .phase("p4", {
    duration: 2800,
    title: "④ 他の検証者が確かめる",
    body: "他の検証者がブロックの正しさを確認して賛成票を投じる。 十分な賛成が集まらなければ、 このブロックは捨てられる。",
  }, (p: PhaseBuilder) => p.activate("voters").activate("newblock").tween("votes", 0, 78).set("status", "確認中").badge("賛成を集める"))
  .phase("p5", {
    duration: 2600,
    title: "⑤ 確定する",
    body: "3 分の 2 を超える賛成でブロックが鎖につながる。 さらに 2 回分の時間が経つと、 覆すことが事実上できなくなる。",
  }, (p: PhaseBuilder) => p.activate("chain").activate("voters").tween("votes", 78, 96).set("status", "確定済み").badge("覆せない"))
  .build();
