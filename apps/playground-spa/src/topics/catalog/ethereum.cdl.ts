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
 * ## 寸法の決め方
 *
 * 動作実績のある animation catalog に合わせる。 円弧は node の 40% 程度の半径
 * (w:180 に対し outerRadius:70)、 波は w:140 h:200 に amplitude:100。
 * これを外すと図形が node からはみ出して切れる (実測で確認)。
 *
 * subtitle は state 1 つ分の短い表記に留める。 長い説明を入れると node 枠から
 * はみ出して他の要素と重なる。 説明は phase の title / body に書く。
 */

// ============================================================
// 1. ERC-20 の送金 — 残高の付け替えを見る
// ============================================================

/**
 * ERC-20 の transfer は「トークンが動く」 のではなく
 * **契約が持つ残高表の数字を書き換えるだけ** という点が理解の要になる。
 *
 * 送り手の残高が減り、 受け手の残高が増える。 その 2 つを同時に tween し、
 * 合計が変わらないことを readout で示す。
 */
export const erc20Transfer = diagram("eth-erc20-transfer", {
  topic: "ERC-20 の送金 — 残高表の書き換え",
})
  .lane("l1", { x: 0, width: 240, label: "送り手" })
  .lane("l2", { x: 0, width: 240, label: "契約" })
  .lane("l3", { x: 0, width: 240, label: "受け手" })
  .state("balA", { initial: 1000 })
  .state("balB", { initial: 0 })
  .state("moved", { initial: 0 })
  .node("alice", {
    lane: "l1",
    stack: 0,
    kind: "dyn-wave",
    title: "太郎",
    subtitle: "{balA} トークン",
    w: 160,
    h: 220,
    shape: {
      kind: "wave",
      level: "{balA}",
      amplitude: 1000,
      frequency: 2,
      waveHeight: 6,
      fill: "#4e9dc4",
    },
  })
  .node("token", {
    lane: "l2",
    stack: 0,
    kind: "shape-smart-contract",
    title: "トークン契約",
    subtitle: "残高表を持つ",
    w: 200,
    h: 220,
  })
  .node("bob", {
    lane: "l3",
    stack: 0,
    kind: "dyn-wave",
    title: "花子",
    subtitle: "{balB} トークン",
    w: 160,
    h: 220,
    shape: {
      kind: "wave",
      level: "{balB}",
      amplitude: 1000,
      frequency: 2,
      waveHeight: 6,
      fill: "#22c55e",
    },
  })
  .edge("alice", "token", { id: "e1", label: "250 送りたい", tone: "info" })
  .edge("token", "bob", { id: "e2", label: "残高を加算", tone: "success" })
  .readout.countup("cu", { source: "moved", unit: " トークン", label: "動いた量", decimals: 0 })
  .phase(
    "p1",
    {
      duration: 2200,
      title: "① 送金を申し込む",
      body: "太郎が契約に「花子へ 250 送って」 と伝える。 この時点ではまだ何も動いていない。",
    },
    (p: PhaseBuilder) => p.activate("alice").activate("token").badge("申込"),
  )
  .phase(
    "p2",
    {
      duration: 2400,
      title: "② 残高が足りるか確かめる",
      body: "契約は残高表を見て、 太郎が 250 以上持っているかを確認する。 足りなければここで失敗して終わる。",
    },
    (p: PhaseBuilder) => p.activate("token").badge("残高を確認"),
  )
  .phase(
    "p3",
    {
      duration: 3000,
      title: "③ 数字を付け替える",
      body: "送り手から 250 を引き、 受け手に 250 を足す。 トークンという物が移動するのではなく、 契約が持つ表の数字が同時に書き換わるだけ。 2 人の合計は 1000 のまま変わらない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("alice")
        .activate("bob")
        .tween("balA", 1000, 750)
        .tween("balB", 0, 250)
        .tween("moved", 0, 250)
        .badge("書き換え"),
  )
  .phase(
    "p4",
    {
      duration: 2000,
      title: "④ 記録を残す",
      body: "Transfer という記録を残して完了。 外部のアプリはこの記録を読んで残高の変化を知る。",
    },
    (p: PhaseBuilder) => p.activate("token").activate("bob").badge("完了"),
  )
  .build();

// ============================================================
// 2. EIP-1559 — 手数料が上下する仕組み
// ============================================================

/**
 * EIP-1559 の要点は「基礎手数料がブロックの混み具合で自動的に上下する」 こと。
 *
 * 混雑度が目標の 50% を超えると次のブロックの基礎手数料が上がり、 下回ると下がる。
 * その追随を、 使用率の円弧と手数料の水位で並べて見せる。
 */
export const eip1559Gas = diagram("eth-eip1559-gas", {
  topic: "EIP-1559 — 手数料が混み具合で上下する",
})
  .lane("l1", { x: 0, width: 240, label: "混み具合" })
  .lane("l2", { x: 0, width: 240, label: "基礎手数料" })
  .lane("l3", { x: 0, width: 240, label: "検証者の取り分" })
  .state("usage", { initial: 50 })
  // 円弧は角度で描かれる。 % をそのまま渡すと 100 度分しか使われず弧が欠けて見え、
  // 逆に 360 度にすると始点と終点が重なって SVG が何も描かない (実測)。
  // 一般的なゲージと同じ 270 度に収め、 表示用の % とは別に角度用の state を持つ。
  .state("usageDeg", { initial: 135 })
  .state("base", { initial: 20 })
  .state("burn", { initial: 0 })
  .state("tip", { initial: 2 })
  .node("gauge", {
    lane: "l1",
    stack: 0,
    kind: "dyn-arc",
    title: "使用率",
    subtitle: "{usage}%",
    w: 180,
    h: 180,
    shape: {
      kind: "arc",
      angle: "{usageDeg}",
      sweepMax: 270,
      outerRadius: 70,
      innerRadius: 52,
      fill: "#e0803a",
    },
  })
  .node("basefee", {
    lane: "l2",
    stack: 0,
    kind: "dyn-wave",
    title: "基礎手数料",
    subtitle: "{base} gwei",
    w: 160,
    h: 220,
    shape: {
      kind: "wave",
      level: "{base}",
      amplitude: 60,
      frequency: 2,
      waveHeight: 6,
      fill: "#4e9dc4",
    },
  })
  .node("validator", {
    lane: "l3",
    stack: 0,
    kind: "dyn-wave",
    title: "チップ",
    subtitle: "{tip} gwei",
    w: 160,
    h: 220,
    shape: {
      kind: "wave",
      level: "{tip}",
      amplitude: 10,
      frequency: 2,
      waveHeight: 6,
      fill: "#22c55e",
    },
  })
  .edge("gauge", "basefee", { id: "e1", label: "次のブロックへ", tone: "info" })
  .edge("basefee", "validator", { id: "e2", label: "基礎分は消える", tone: "warning" })
  .readout.gauge("g", { source: "usage", min: 0, max: 100, color: "#e0803a", label: "使用率 %" })
  .readout.countup("burnCu", { source: "burn", unit: " gwei", label: "焼却の累計", decimals: 0 })
  .phase(
    "p1",
    {
      duration: 2200,
      title: "① 目標ちょうどのとき",
      body: "1 ブロックに詰められる量には上限があり、 その半分が目標。 ちょうど目標なら基礎手数料は据え置きで、 空いても混んでもいない状態。",
    },
    (p: PhaseBuilder) => p.activate("gauge").badge("据え置き"),
  )
  .phase(
    "p2",
    {
      duration: 3000,
      title: "② 混んできたとき",
      body: "目標を超えて詰まると、 次のブロックの基礎手数料が上がる。 1 ブロックあたり最大 12.5% までしか動かないので、 一気に跳ね上がることはない。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("gauge")
        .activate("basefee")
        .tween("usage", 50, 95)
        .tween("usageDeg", 135, 257)
        .tween("base", 20, 45)
        .badge("上がる"),
  )
  .phase(
    "p3",
    {
      duration: 2400,
      title: "③ 基礎分は誰の手にも渡らない",
      body: "払った基礎手数料は焼却されて消える。 検証者が受け取るのはチップだけ。 ここが以前の仕組みとの大きな違い。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("basefee")
        .activate("validator")
        .tween("burn", 0, 45)
        .tween("tip", 2, 5)
        .badge("焼却"),
  )
  .phase(
    "p4",
    {
      duration: 3000,
      title: "④ 空いてきたとき",
      body: "目標を下回ると基礎手数料は下がる。 混雑が続かない限り自動的に元の水準へ戻っていく。 誰かが調整しているわけではなく、 式で決まる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("gauge")
        .activate("basefee")
        .tween("usage", 95, 20)
        .tween("usageDeg", 257, 54)
        .tween("base", 45, 18)
        .tween("burn", 45, 63)
        .tween("tip", 5, 2)
        .badge("下がる"),
  )
  .build();

// ============================================================
// 3. ERC-4337 — 財布そのものを契約にする
// ============================================================

/**
 * ERC-4337 (アカウント抽象化) は「秘密鍵を持つ人だけが取引を出せる」 という
 * 前提を外し、 **契約が自分で取引の正しさを判断する** 形にしたもの。
 *
 * 待ち行列に溜まった要求をまとめ役が束ね、 入口の契約が検証する流れを、
 * 件数の増減で見せる。
 */
export const erc4337Flow = diagram("eth-erc4337-flow", {
  topic: "ERC-4337 — 財布を契約にして代理で払う",
})
  .lane("l1", { x: 0, width: 240, label: "利用者" })
  .lane("l2", { x: 0, width: 240, label: "待ち行列" })
  .lane("l3", { x: 0, width: 240, label: "まとめ役" })
  .lane("l4", { x: 0, width: 240, label: "入口の契約" })
  .state("ops", { initial: 0 })
  .state("checked", { initial: 0 })
  .state("checkedDeg", { initial: 0 })
  .state("gasPaid", { initial: 0 })
  .node("owner", {
    lane: "l1",
    stack: 0,
    kind: "shape-person",
    title: "利用者",
    subtitle: "鍵がなくてもよい",
    w: 180,
    h: 200,
  })
  .node("mempool", {
    lane: "l2",
    stack: 0,
    kind: "dyn-wave",
    title: "待ち行列",
    subtitle: "{ops} 件",
    w: 160,
    h: 220,
    shape: {
      kind: "wave",
      level: "{ops}",
      amplitude: 5,
      frequency: 2,
      waveHeight: 6,
      fill: "#8a5a2a",
    },
  })
  .node("bundler", {
    lane: "l3",
    stack: 0,
    kind: "shape-stack",
    title: "まとめ役",
    subtitle: "束ねて送る",
    w: 180,
    h: 200,
  })
  .node("entrypoint", {
    lane: "l4",
    stack: 0,
    kind: "dyn-arc",
    title: "入口の契約",
    subtitle: "{checked}% 検証",
    w: 180,
    h: 180,
    shape: {
      kind: "arc",
      angle: "{checkedDeg}",
      sweepMax: 270,
      outerRadius: 70,
      innerRadius: 52,
      fill: "#4e9dc4",
    },
  })
  .edge("owner", "mempool", { id: "e1", label: "やりたいこと", tone: "info" })
  .edge("mempool", "bundler", { id: "e2", label: "拾い集める", tone: "info" })
  .edge("bundler", "entrypoint", { id: "e3", label: "まとめて渡す", tone: "info" })
  .readout.countup("cu", { source: "gasPaid", unit: " gwei", label: "肩代わり額", decimals: 0 })
  .phase(
    "p1",
    {
      duration: 2400,
      title: "① やりたいことを書いて出す",
      body: "利用者は取引そのものではなく「やりたいこと」 を書いて出す。 秘密鍵で署名する代わりに、 指紋認証や複数人の承認でもよい。",
    },
    (p: PhaseBuilder) =>
      p.activate("owner").activate("mempool").tween("ops", 0, 1).badge("要求を作る"),
  )
  .phase(
    "p2",
    {
      duration: 2600,
      title: "② まとめ役が拾い集める",
      body: "専用の待ち行列から複数人分をまとめ役が拾う。 1 つの取引にまとめることで、 1 人あたりの手数料が下がる。",
    },
    (p: PhaseBuilder) =>
      p.activate("mempool").activate("bundler").tween("ops", 1, 5).badge("5 件を束ねる"),
  )
  .phase(
    "p3",
    {
      duration: 3000,
      title: "③ 財布が自分で正しさを判断する",
      body: "入口の契約が各財布に「これはあなたの意思か」 と尋ね、 財布側の判定に従う。 判定の仕方は財布ごとに自由に書ける。 秘密鍵の照合に固定されていない点が従来と最も違う。",
    },
    (p: PhaseBuilder) =>
      p.activate("entrypoint").tween("checked", 0, 100).tween("checkedDeg", 0, 270).badge("検証"),
  )
  .phase(
    "p4",
    {
      duration: 2400,
      title: "④ 手数料を肩代わりしてもらう",
      body: "手数料を肩代わりする契約を挟める。 利用者は手数料用の通貨を持っていなくても取引できる。 サービス側が負担する使い方が典型例。",
    },
    (p: PhaseBuilder) =>
      p.activate("entrypoint").tween("gasPaid", 0, 180).tween("ops", 5, 0).badge("実行完了"),
  )
  .build();

// ============================================================
// 4. ブロックが作られるまで
// ============================================================

/**
 * 取引が出されてから確定するまでの流れ。
 *
 * 待ち行列に溜まる → 提案者が詰める → 検証者が賛成する → 確定、 の 4 段階を
 * 待ち件数と賛成率の変化で見せる。
 */
export const blockProduction = diagram("eth-block-production", {
  topic: "Ethereum のブロックができるまで",
})
  .lane("l1", { x: 0, width: 240, label: "待ち行列" })
  .lane("l2", { x: 0, width: 240, label: "提案者" })
  .lane("l3", { x: 0, width: 240, label: "新しいブロック" })
  .lane("l4", { x: 0, width: 240, label: "他の検証者" })
  .state("pending", { initial: 0 })
  .state("included", { initial: 0 })
  .state("votes", { initial: 0 })
  .state("votesDeg", { initial: 0 })
  .node("pool", {
    lane: "l1",
    stack: 0,
    kind: "dyn-wave",
    title: "待つ取引",
    subtitle: "{pending} 件",
    w: 160,
    h: 220,
    shape: {
      kind: "wave",
      level: "{pending}",
      amplitude: 200,
      frequency: 2,
      waveHeight: 6,
      fill: "#8a5a2a",
    },
  })
  .node("picker", {
    lane: "l2",
    stack: 0,
    kind: "shape-blockchain-node",
    title: "提案者",
    subtitle: "12 秒に 1 人",
    w: 180,
    h: 200,
  })
  .node("newblock", {
    lane: "l3",
    stack: 0,
    kind: "shape-blockchain-block",
    title: "ブロック",
    subtitle: "{included} 件",
    w: 180,
    h: 200,
  })
  .node("voters", {
    lane: "l4",
    stack: 0,
    kind: "dyn-arc",
    title: "賛成の割合",
    subtitle: "{votes}%",
    w: 180,
    h: 180,
    shape: {
      kind: "arc",
      angle: "{votesDeg}",
      sweepMax: 270,
      outerRadius: 70,
      innerRadius: 52,
      fill: "#4e9dc4",
    },
  })
  .edge("pool", "picker", { id: "e1", label: "取り出す", tone: "info" })
  .edge("picker", "newblock", { id: "e2", label: "詰める", tone: "info" })
  .edge("newblock", "voters", { id: "e3", label: "確かめる", tone: "warning" })
  .readout.percentRing("ring", { source: "votes", max: 100, label: "賛成率" })
  .readout.countup("cu", { source: "included", unit: " 件", label: "収録済み", decimals: 0 })
  .phase(
    "p1",
    {
      duration: 2400,
      title: "① 取引が溜まっていく",
      body: "世界中から送られた取引が待ち行列に溜まる。 まだどのブロックにも入っていない状態。",
    },
    (p: PhaseBuilder) => p.activate("pool").tween("pending", 0, 180).badge("待ち行列"),
  )
  .phase(
    "p2",
    {
      duration: 2200,
      title: "② 提案者が選ばれる",
      body: "12 秒ごとに 1 人が提案者に選ばれる。 誰が選ばれるかは抽選で事前に決まるが、 直前まで公表されないので狙い撃ちされにくい。",
    },
    (p: PhaseBuilder) => p.activate("picker").badge("担当が決まる"),
  )
  .phase(
    "p3",
    {
      duration: 3000,
      title: "③ ブロックに詰める",
      body: "提案者は待ち行列から取引を選んで詰める。 どれを入れるか、 どの順に並べるかは提案者の裁量。 手数料の高いものが選ばれやすい。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("picker")
        .activate("newblock")
        .tween("pending", 180, 60)
        .tween("included", 0, 120)
        .badge("120 件を収録"),
  )
  .phase(
    "p4",
    {
      duration: 2800,
      title: "④ 他の検証者が確かめる",
      body: "他の検証者がブロックの正しさを確認して賛成票を投じる。 賛成が集まらないブロックは次の提案者に選ばれず、 鎖から外れる。",
    },
    (p: PhaseBuilder) =>
      p
        .activate("voters")
        .activate("newblock")
        .tween("votes", 0, 78)
        .tween("votesDeg", 0, 211)
        .badge("賛成を集める"),
  )
  .phase(
    "p5",
    {
      duration: 2400,
      title: "⑤ 確定する",
      body: "賛成が全体の 3 分の 2 を超え、 それが 2 期間 (約 13 分) 続くと、 このブロックは覆せなくなる。 それまでは理論上、 別の鎖に置き換わる余地が残っている。",
    },
    (p: PhaseBuilder) =>
      p.activate("voters").tween("votes", 78, 96).tween("votesDeg", 211, 259).badge("覆せない"),
  )
  .build();

// ============================================================
// 記法 (#1374)
// ============================================================
//
// 記法に `shape:` (箱の中に描く図形) と `readouts:` (値を見せる部品) を足したので、
// Ethereum の見本 4 件 も記法で書けるようになった。 これでカタログの図は全て記法を持つ。
//
// **手で書かず、組み立て済みの図から機械で出した**。 出す前に 3 つ確かめている =
// 組み立てが注意を出さないこと、2 記法が同じ図になること、組み立て済みの図と骨格が
// 一致すること。 以降は一致検査 (`lib/catalog-source-parity.test.tsx`) が守る。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれ、
// 一覧と検索に出る文字列が変わる。

export const sourceYaml__erc20Transfer = `title: "ERC-20 の送金 — 残高表の書き換え"
type: flow

lanes:
  l1: { x: 0, width: 240, label: "送り手" }
  l2: { x: 0, width: 240, label: "契約" }
  l3: { x: 0, width: 240, label: "受け手" }

states:
  balA: 1000
  balB: 0
  moved: 0

readouts:
  cu: { kind: countup, source: moved, decimals: 0, unit: " トークン", label: "動いた量" }

actors:
  - 太郎: { kind: dyn-wave, lane: l1, stack: 0, subtitle: "{balA} トークン", posW: 160, posH: 220, shape: { kind: wave, level: "{balA}", amplitude: 1000, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } }
  - トークン契約: { kind: shape-smart-contract, lane: l2, stack: 0, subtitle: "残高表を持つ", posW: 200, posH: 220 }
  - 花子: { kind: dyn-wave, lane: l3, stack: 0, subtitle: "{balB} トークン", posW: 160, posH: 220, shape: { kind: wave, level: "{balB}", amplitude: 1000, frequency: 2, waveHeight: 6, fill: "#22c55e" } }

flow:
  - 太郎 -> トークン契約: "250 送りたい" (info)
  - トークン契約 -> 花子: "残高を加算" (success)

animation:
  - step: "① 送金を申し込む" 2.2s
    focus: ["太郎", "トークン契約"]
    badge: "申込"
    description: "太郎が契約に「花子へ 250 送って」 と伝える。 この時点ではまだ何も動いていない。"
  - step: "② 残高が足りるか確かめる" 2.4s
    focus: ["トークン契約"]
    badge: "残高を確認"
    description: "契約は残高表を見て、 太郎が 250 以上持っているかを確認する。 足りなければここで失敗して終わる。"
  - step: "③ 数字を付け替える" 3s
    focus: ["太郎", "花子"]
    tween:
      balA: 1000 -> 750
      balB: 0 -> 250
      moved: 0 -> 250
    badge: "書き換え"
    description: "送り手から 250 を引き、 受け手に 250 を足す。 トークンという物が移動するのではなく、 契約が持つ表の数字が同時に書き換わるだけ。 2 人の合計は 1000 のまま変わらない。"
  - step: "④ 記録を残す" 2s
    focus: ["トークン契約", "花子"]
    badge: "完了"
    description: "Transfer という記録を残して完了。 外部のアプリはこの記録を読んで残高の変化を知る。"
`;

export const sourceJson__erc20Transfer = `{
  "title": "ERC-20 の送金 — 残高表の書き換え",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 240, "label": "送り手" },
    "l2": { "x": 0, "width": 240, "label": "契約" },
    "l3": { "x": 0, "width": 240, "label": "受け手" }
  },
  "actors": [
    {
      "name": "太郎",
      "kind": "dyn-wave",
      "lane": "l1",
      "stack": 0,
      "subtitle": "{balA} トークン",
      "posW": 160,
      "posH": 220,
      "shape": {
        "kind": "wave",
        "level": "{balA}",
        "amplitude": 1000,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "トークン契約",
      "kind": "shape-smart-contract",
      "lane": "l2",
      "stack": 0,
      "subtitle": "残高表を持つ",
      "posW": 200,
      "posH": 220
    },
    {
      "name": "花子",
      "kind": "dyn-wave",
      "lane": "l3",
      "stack": 0,
      "subtitle": "{balB} トークン",
      "posW": 160,
      "posH": 220,
      "shape": {
        "kind": "wave",
        "level": "{balB}",
        "amplitude": 1000,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#22c55e"
      }
    }
  ],
  "flow": [
    { "from": "太郎", "to": "トークン契約", "label": "250 送りたい", "tone": "info" },
    { "from": "トークン契約", "to": "花子", "label": "残高を加算", "tone": "success" }
  ],
  "states": { "balA": 1000, "balB": 0, "moved": 0 },
  "readouts": [
    {
      "id": "cu",
      "kind": "countup",
      "source": "moved",
      "decimals": 0,
      "unit": " トークン",
      "label": "動いた量"
    }
  ],
  "animation": [
    {
      "step": "① 送金を申し込む",
      "duration": 2.2,
      "focus": ["太郎", "トークン契約"],
      "badge": "申込",
      "body": "太郎が契約に「花子へ 250 送って」 と伝える。 この時点ではまだ何も動いていない。"
    },
    {
      "step": "② 残高が足りるか確かめる",
      "duration": 2.4,
      "focus": ["トークン契約"],
      "badge": "残高を確認",
      "body": "契約は残高表を見て、 太郎が 250 以上持っているかを確認する。 足りなければここで失敗して終わる。"
    },
    {
      "step": "③ 数字を付け替える",
      "duration": 3,
      "focus": ["太郎", "花子"],
      "tween": { "balA": [1000, 750], "balB": [0, 250], "moved": [0, 250] },
      "badge": "書き換え",
      "body": "送り手から 250 を引き、 受け手に 250 を足す。 トークンという物が移動するのではなく、 契約が持つ表の数字が同時に書き換わるだけ。 2 人の合計は 1000 のまま変わらない。"
    },
    {
      "step": "④ 記録を残す",
      "duration": 2,
      "focus": ["トークン契約", "花子"],
      "badge": "完了",
      "body": "Transfer という記録を残して完了。 外部のアプリはこの記録を読んで残高の変化を知る。"
    }
  ]
}`;

export const sourceYaml__eip1559Gas = `title: "EIP-1559 — 手数料が混み具合で上下する"
type: flow

lanes:
  l1: { x: 0, width: 240, label: "混み具合" }
  l2: { x: 0, width: 240, label: "基礎手数料" }
  l3: { x: 0, width: 240, label: "検証者の取り分" }

states:
  usage: 50
  usageDeg: 135
  base: 20
  burn: 0
  tip: 2

readouts:
  g: { kind: gauge, source: usage, min: 0, max: 100, color: "#e0803a", label: "使用率 %" }
  burnCu: { kind: countup, source: burn, decimals: 0, unit: " gwei", label: "焼却の累計" }

actors:
  - 使用率: { kind: dyn-arc, lane: l1, stack: 0, subtitle: "{usage}%", posW: 180, posH: 180, shape: { kind: arc, angle: "{usageDeg}", sweepMax: 270, outerRadius: 70, innerRadius: 52, fill: "#e0803a" } }
  - 基礎手数料: { kind: dyn-wave, lane: l2, stack: 0, subtitle: "{base} gwei", posW: 160, posH: 220, shape: { kind: wave, level: "{base}", amplitude: 60, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } }
  - チップ: { kind: dyn-wave, lane: l3, stack: 0, subtitle: "{tip} gwei", posW: 160, posH: 220, shape: { kind: wave, level: "{tip}", amplitude: 10, frequency: 2, waveHeight: 6, fill: "#22c55e" } }

flow:
  - 使用率 -> 基礎手数料: "次のブロックへ" (info)
  - 基礎手数料 -> チップ: "基礎分は消える" (warning)

animation:
  - step: "① 目標ちょうどのとき" 2.2s
    focus: ["使用率"]
    badge: "据え置き"
    description: "1 ブロックに詰められる量には上限があり、 その半分が目標。 ちょうど目標なら基礎手数料は据え置きで、 空いても混んでもいない状態。"
  - step: "② 混んできたとき" 3s
    focus: ["使用率", "基礎手数料"]
    tween:
      usage: 50 -> 95
      usageDeg: 135 -> 257
      base: 20 -> 45
    badge: "上がる"
    description: "目標を超えて詰まると、 次のブロックの基礎手数料が上がる。 1 ブロックあたり最大 12.5% までしか動かないので、 一気に跳ね上がることはない。"
  - step: "③ 基礎分は誰の手にも渡らない" 2.4s
    focus: ["基礎手数料", "チップ"]
    tween:
      burn: 0 -> 45
      tip: 2 -> 5
    badge: "焼却"
    description: "払った基礎手数料は焼却されて消える。 検証者が受け取るのはチップだけ。 ここが以前の仕組みとの大きな違い。"
  - step: "④ 空いてきたとき" 3s
    focus: ["使用率", "基礎手数料"]
    tween:
      usage: 95 -> 20
      usageDeg: 257 -> 54
      base: 45 -> 18
      burn: 45 -> 63
      tip: 5 -> 2
    badge: "下がる"
    description: "目標を下回ると基礎手数料は下がる。 混雑が続かない限り自動的に元の水準へ戻っていく。 誰かが調整しているわけではなく、 式で決まる。"
`;

export const sourceJson__eip1559Gas = `{
  "title": "EIP-1559 — 手数料が混み具合で上下する",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 240, "label": "混み具合" },
    "l2": { "x": 0, "width": 240, "label": "基礎手数料" },
    "l3": { "x": 0, "width": 240, "label": "検証者の取り分" }
  },
  "actors": [
    {
      "name": "使用率",
      "kind": "dyn-arc",
      "lane": "l1",
      "stack": 0,
      "subtitle": "{usage}%",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "arc",
        "angle": "{usageDeg}",
        "sweepMax": 270,
        "outerRadius": 70,
        "innerRadius": 52,
        "fill": "#e0803a"
      }
    },
    {
      "name": "基礎手数料",
      "kind": "dyn-wave",
      "lane": "l2",
      "stack": 0,
      "subtitle": "{base} gwei",
      "posW": 160,
      "posH": 220,
      "shape": {
        "kind": "wave",
        "level": "{base}",
        "amplitude": 60,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#4e9dc4"
      }
    },
    {
      "name": "チップ",
      "kind": "dyn-wave",
      "lane": "l3",
      "stack": 0,
      "subtitle": "{tip} gwei",
      "posW": 160,
      "posH": 220,
      "shape": {
        "kind": "wave",
        "level": "{tip}",
        "amplitude": 10,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#22c55e"
      }
    }
  ],
  "flow": [
    { "from": "使用率", "to": "基礎手数料", "label": "次のブロックへ", "tone": "info" },
    { "from": "基礎手数料", "to": "チップ", "label": "基礎分は消える", "tone": "warning" }
  ],
  "states": { "usage": 50, "usageDeg": 135, "base": 20, "burn": 0, "tip": 2 },
  "readouts": [
    {
      "id": "g",
      "kind": "gauge",
      "source": "usage",
      "min": 0,
      "max": 100,
      "color": "#e0803a",
      "label": "使用率 %"
    },
    {
      "id": "burnCu",
      "kind": "countup",
      "source": "burn",
      "decimals": 0,
      "unit": " gwei",
      "label": "焼却の累計"
    }
  ],
  "animation": [
    {
      "step": "① 目標ちょうどのとき",
      "duration": 2.2,
      "focus": ["使用率"],
      "badge": "据え置き",
      "body": "1 ブロックに詰められる量には上限があり、 その半分が目標。 ちょうど目標なら基礎手数料は据え置きで、 空いても混んでもいない状態。"
    },
    {
      "step": "② 混んできたとき",
      "duration": 3,
      "focus": ["使用率", "基礎手数料"],
      "tween": { "usage": [50, 95], "usageDeg": [135, 257], "base": [20, 45] },
      "badge": "上がる",
      "body": "目標を超えて詰まると、 次のブロックの基礎手数料が上がる。 1 ブロックあたり最大 12.5% までしか動かないので、 一気に跳ね上がることはない。"
    },
    {
      "step": "③ 基礎分は誰の手にも渡らない",
      "duration": 2.4,
      "focus": ["基礎手数料", "チップ"],
      "tween": { "burn": [0, 45], "tip": [2, 5] },
      "badge": "焼却",
      "body": "払った基礎手数料は焼却されて消える。 検証者が受け取るのはチップだけ。 ここが以前の仕組みとの大きな違い。"
    },
    {
      "step": "④ 空いてきたとき",
      "duration": 3,
      "focus": ["使用率", "基礎手数料"],
      "tween": {
        "usage": [95, 20],
        "usageDeg": [257, 54],
        "base": [45, 18],
        "burn": [45, 63],
        "tip": [5, 2]
      },
      "badge": "下がる",
      "body": "目標を下回ると基礎手数料は下がる。 混雑が続かない限り自動的に元の水準へ戻っていく。 誰かが調整しているわけではなく、 式で決まる。"
    }
  ]
}`;

export const sourceYaml__erc4337Flow = `title: "ERC-4337 — 財布を契約にして代理で払う"
type: flow

lanes:
  l1: { x: 0, width: 240, label: "利用者" }
  l2: { x: 0, width: 240, label: "待ち行列" }
  l3: { x: 0, width: 240, label: "まとめ役" }
  l4: { x: 0, width: 240, label: "入口の契約" }

states:
  ops: 0
  checked: 0
  checkedDeg: 0
  gasPaid: 0

readouts:
  cu: { kind: countup, source: gasPaid, decimals: 0, unit: " gwei", label: "肩代わり額" }

actors:
  - 利用者: { kind: shape-person, lane: l1, stack: 0, subtitle: "鍵がなくてもよい", posW: 180, posH: 200 }
  - 待ち行列: { kind: dyn-wave, lane: l2, stack: 0, subtitle: "{ops} 件", posW: 160, posH: 220, shape: { kind: wave, level: "{ops}", amplitude: 5, frequency: 2, waveHeight: 6, fill: "#8a5a2a" } }
  - まとめ役: { kind: shape-stack, lane: l3, stack: 0, subtitle: "束ねて送る", posW: 180, posH: 200 }
  - 入口の契約: { kind: dyn-arc, lane: l4, stack: 0, subtitle: "{checked}% 検証", posW: 180, posH: 180, shape: { kind: arc, angle: "{checkedDeg}", sweepMax: 270, outerRadius: 70, innerRadius: 52, fill: "#4e9dc4" } }

flow:
  - 利用者 -> 待ち行列: "やりたいこと" (info)
  - 待ち行列 -> まとめ役: "拾い集める" (info)
  - まとめ役 -> 入口の契約: "まとめて渡す" (info)

animation:
  - step: "① やりたいことを書いて出す" 2.4s
    focus: ["利用者", "待ち行列"]
    tween:
      ops: 0 -> 1
    badge: "要求を作る"
    description: "利用者は取引そのものではなく「やりたいこと」 を書いて出す。 秘密鍵で署名する代わりに、 指紋認証や複数人の承認でもよい。"
  - step: "② まとめ役が拾い集める" 2.6s
    focus: ["待ち行列", "まとめ役"]
    tween:
      ops: 1 -> 5
    badge: "5 件を束ねる"
    description: "専用の待ち行列から複数人分をまとめ役が拾う。 1 つの取引にまとめることで、 1 人あたりの手数料が下がる。"
  - step: "③ 財布が自分で正しさを判断する" 3s
    focus: ["入口の契約"]
    tween:
      checked: 0 -> 100
      checkedDeg: 0 -> 270
    badge: "検証"
    description: "入口の契約が各財布に「これはあなたの意思か」 と尋ね、 財布側の判定に従う。 判定の仕方は財布ごとに自由に書ける。 秘密鍵の照合に固定されていない点が従来と最も違う。"
  - step: "④ 手数料を肩代わりしてもらう" 2.4s
    focus: ["入口の契約"]
    tween:
      gasPaid: 0 -> 180
      ops: 5 -> 0
    badge: "実行完了"
    description: "手数料を肩代わりする契約を挟める。 利用者は手数料用の通貨を持っていなくても取引できる。 サービス側が負担する使い方が典型例。"
`;

export const sourceJson__erc4337Flow = `{
  "title": "ERC-4337 — 財布を契約にして代理で払う",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 240, "label": "利用者" },
    "l2": { "x": 0, "width": 240, "label": "待ち行列" },
    "l3": { "x": 0, "width": 240, "label": "まとめ役" },
    "l4": { "x": 0, "width": 240, "label": "入口の契約" }
  },
  "actors": [
    {
      "name": "利用者",
      "kind": "shape-person",
      "lane": "l1",
      "stack": 0,
      "subtitle": "鍵がなくてもよい",
      "posW": 180,
      "posH": 200
    },
    {
      "name": "待ち行列",
      "kind": "dyn-wave",
      "lane": "l2",
      "stack": 0,
      "subtitle": "{ops} 件",
      "posW": 160,
      "posH": 220,
      "shape": {
        "kind": "wave",
        "level": "{ops}",
        "amplitude": 5,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#8a5a2a"
      }
    },
    {
      "name": "まとめ役",
      "kind": "shape-stack",
      "lane": "l3",
      "stack": 0,
      "subtitle": "束ねて送る",
      "posW": 180,
      "posH": 200
    },
    {
      "name": "入口の契約",
      "kind": "dyn-arc",
      "lane": "l4",
      "stack": 0,
      "subtitle": "{checked}% 検証",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "arc",
        "angle": "{checkedDeg}",
        "sweepMax": 270,
        "outerRadius": 70,
        "innerRadius": 52,
        "fill": "#4e9dc4"
      }
    }
  ],
  "flow": [
    { "from": "利用者", "to": "待ち行列", "label": "やりたいこと", "tone": "info" },
    { "from": "待ち行列", "to": "まとめ役", "label": "拾い集める", "tone": "info" },
    { "from": "まとめ役", "to": "入口の契約", "label": "まとめて渡す", "tone": "info" }
  ],
  "states": { "ops": 0, "checked": 0, "checkedDeg": 0, "gasPaid": 0 },
  "readouts": [
    {
      "id": "cu",
      "kind": "countup",
      "source": "gasPaid",
      "decimals": 0,
      "unit": " gwei",
      "label": "肩代わり額"
    }
  ],
  "animation": [
    {
      "step": "① やりたいことを書いて出す",
      "duration": 2.4,
      "focus": ["利用者", "待ち行列"],
      "tween": { "ops": [0, 1] },
      "badge": "要求を作る",
      "body": "利用者は取引そのものではなく「やりたいこと」 を書いて出す。 秘密鍵で署名する代わりに、 指紋認証や複数人の承認でもよい。"
    },
    {
      "step": "② まとめ役が拾い集める",
      "duration": 2.6,
      "focus": ["待ち行列", "まとめ役"],
      "tween": { "ops": [1, 5] },
      "badge": "5 件を束ねる",
      "body": "専用の待ち行列から複数人分をまとめ役が拾う。 1 つの取引にまとめることで、 1 人あたりの手数料が下がる。"
    },
    {
      "step": "③ 財布が自分で正しさを判断する",
      "duration": 3,
      "focus": ["入口の契約"],
      "tween": { "checked": [0, 100], "checkedDeg": [0, 270] },
      "badge": "検証",
      "body": "入口の契約が各財布に「これはあなたの意思か」 と尋ね、 財布側の判定に従う。 判定の仕方は財布ごとに自由に書ける。 秘密鍵の照合に固定されていない点が従来と最も違う。"
    },
    {
      "step": "④ 手数料を肩代わりしてもらう",
      "duration": 2.4,
      "focus": ["入口の契約"],
      "tween": { "gasPaid": [0, 180], "ops": [5, 0] },
      "badge": "実行完了",
      "body": "手数料を肩代わりする契約を挟める。 利用者は手数料用の通貨を持っていなくても取引できる。 サービス側が負担する使い方が典型例。"
    }
  ]
}`;

export const sourceYaml__blockProduction = `title: "Ethereum のブロックができるまで"
type: flow

lanes:
  l1: { x: 0, width: 240, label: "待ち行列" }
  l2: { x: 0, width: 240, label: "提案者" }
  l3: { x: 0, width: 240, label: "新しいブロック" }
  l4: { x: 0, width: 240, label: "他の検証者" }

states:
  pending: 0
  included: 0
  votes: 0
  votesDeg: 0

readouts:
  ring: { kind: percent-ring, source: votes, max: 100, label: "賛成率" }
  cu: { kind: countup, source: included, decimals: 0, unit: " 件", label: "収録済み" }

actors:
  - 待つ取引: { kind: dyn-wave, lane: l1, stack: 0, subtitle: "{pending} 件", posW: 160, posH: 220, shape: { kind: wave, level: "{pending}", amplitude: 200, frequency: 2, waveHeight: 6, fill: "#8a5a2a" } }
  - 提案者: { kind: shape-blockchain-node, lane: l2, stack: 0, subtitle: "12 秒に 1 人", posW: 180, posH: 200 }
  - ブロック: { kind: shape-blockchain-block, lane: l3, stack: 0, subtitle: "{included} 件", posW: 180, posH: 200 }
  - 賛成の割合: { kind: dyn-arc, lane: l4, stack: 0, subtitle: "{votes}%", posW: 180, posH: 180, shape: { kind: arc, angle: "{votesDeg}", sweepMax: 270, outerRadius: 70, innerRadius: 52, fill: "#4e9dc4" } }

flow:
  - 待つ取引 -> 提案者: "取り出す" (info)
  - 提案者 -> ブロック: "詰める" (info)
  - ブロック -> 賛成の割合: "確かめる" (warning)

animation:
  - step: "① 取引が溜まっていく" 2.4s
    focus: ["待つ取引"]
    tween:
      pending: 0 -> 180
    badge: "待ち行列"
    description: "世界中から送られた取引が待ち行列に溜まる。 まだどのブロックにも入っていない状態。"
  - step: "② 提案者が選ばれる" 2.2s
    focus: ["提案者"]
    badge: "担当が決まる"
    description: "12 秒ごとに 1 人が提案者に選ばれる。 誰が選ばれるかは抽選で事前に決まるが、 直前まで公表されないので狙い撃ちされにくい。"
  - step: "③ ブロックに詰める" 3s
    focus: ["提案者", "ブロック"]
    tween:
      pending: 180 -> 60
      included: 0 -> 120
    badge: "120 件を収録"
    description: "提案者は待ち行列から取引を選んで詰める。 どれを入れるか、 どの順に並べるかは提案者の裁量。 手数料の高いものが選ばれやすい。"
  - step: "④ 他の検証者が確かめる" 2.8s
    focus: ["賛成の割合", "ブロック"]
    tween:
      votes: 0 -> 78
      votesDeg: 0 -> 211
    badge: "賛成を集める"
    description: "他の検証者がブロックの正しさを確認して賛成票を投じる。 賛成が集まらないブロックは次の提案者に選ばれず、 鎖から外れる。"
  - step: "⑤ 確定する" 2.4s
    focus: ["賛成の割合"]
    tween:
      votes: 78 -> 96
      votesDeg: 211 -> 259
    badge: "覆せない"
    description: "賛成が全体の 3 分の 2 を超え、 それが 2 期間 (約 13 分) 続くと、 このブロックは覆せなくなる。 それまでは理論上、 別の鎖に置き換わる余地が残っている。"
`;

export const sourceJson__blockProduction = `{
  "title": "Ethereum のブロックができるまで",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 240, "label": "待ち行列" },
    "l2": { "x": 0, "width": 240, "label": "提案者" },
    "l3": { "x": 0, "width": 240, "label": "新しいブロック" },
    "l4": { "x": 0, "width": 240, "label": "他の検証者" }
  },
  "actors": [
    {
      "name": "待つ取引",
      "kind": "dyn-wave",
      "lane": "l1",
      "stack": 0,
      "subtitle": "{pending} 件",
      "posW": 160,
      "posH": 220,
      "shape": {
        "kind": "wave",
        "level": "{pending}",
        "amplitude": 200,
        "frequency": 2,
        "waveHeight": 6,
        "fill": "#8a5a2a"
      }
    },
    {
      "name": "提案者",
      "kind": "shape-blockchain-node",
      "lane": "l2",
      "stack": 0,
      "subtitle": "12 秒に 1 人",
      "posW": 180,
      "posH": 200
    },
    {
      "name": "ブロック",
      "kind": "shape-blockchain-block",
      "lane": "l3",
      "stack": 0,
      "subtitle": "{included} 件",
      "posW": 180,
      "posH": 200
    },
    {
      "name": "賛成の割合",
      "kind": "dyn-arc",
      "lane": "l4",
      "stack": 0,
      "subtitle": "{votes}%",
      "posW": 180,
      "posH": 180,
      "shape": {
        "kind": "arc",
        "angle": "{votesDeg}",
        "sweepMax": 270,
        "outerRadius": 70,
        "innerRadius": 52,
        "fill": "#4e9dc4"
      }
    }
  ],
  "flow": [
    { "from": "待つ取引", "to": "提案者", "label": "取り出す", "tone": "info" },
    { "from": "提案者", "to": "ブロック", "label": "詰める", "tone": "info" },
    { "from": "ブロック", "to": "賛成の割合", "label": "確かめる", "tone": "warning" }
  ],
  "states": { "pending": 0, "included": 0, "votes": 0, "votesDeg": 0 },
  "readouts": [
    { "id": "ring", "kind": "percent-ring", "source": "votes", "max": 100, "label": "賛成率" },
    {
      "id": "cu",
      "kind": "countup",
      "source": "included",
      "decimals": 0,
      "unit": " 件",
      "label": "収録済み"
    }
  ],
  "animation": [
    {
      "step": "① 取引が溜まっていく",
      "duration": 2.4,
      "focus": ["待つ取引"],
      "tween": { "pending": [0, 180] },
      "badge": "待ち行列",
      "body": "世界中から送られた取引が待ち行列に溜まる。 まだどのブロックにも入っていない状態。"
    },
    {
      "step": "② 提案者が選ばれる",
      "duration": 2.2,
      "focus": ["提案者"],
      "badge": "担当が決まる",
      "body": "12 秒ごとに 1 人が提案者に選ばれる。 誰が選ばれるかは抽選で事前に決まるが、 直前まで公表されないので狙い撃ちされにくい。"
    },
    {
      "step": "③ ブロックに詰める",
      "duration": 3,
      "focus": ["提案者", "ブロック"],
      "tween": { "pending": [180, 60], "included": [0, 120] },
      "badge": "120 件を収録",
      "body": "提案者は待ち行列から取引を選んで詰める。 どれを入れるか、 どの順に並べるかは提案者の裁量。 手数料の高いものが選ばれやすい。"
    },
    {
      "step": "④ 他の検証者が確かめる",
      "duration": 2.8,
      "focus": ["賛成の割合", "ブロック"],
      "tween": { "votes": [0, 78], "votesDeg": [0, 211] },
      "badge": "賛成を集める",
      "body": "他の検証者がブロックの正しさを確認して賛成票を投じる。 賛成が集まらないブロックは次の提案者に選ばれず、 鎖から外れる。"
    },
    {
      "step": "⑤ 確定する",
      "duration": 2.4,
      "focus": ["賛成の割合"],
      "tween": { "votes": [78, 96], "votesDeg": [211, 259] },
      "badge": "覆せない",
      "body": "賛成が全体の 3 分の 2 を超え、 それが 2 期間 (約 13 分) 続くと、 このブロックは覆せなくなる。 それまでは理論上、 別の鎖に置き換わる余地が残っている。"
    }
  ]
}`;
