import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Patterns ... ブロックチェーン解説で頻出する構成パターン。
 *
 * 全 pattern で lane width / gap を統一 (single 1700px / triple 1700px / quad 1700px)、
 * catalog 1 column max-w 1700px 内で SVG 縮小率 ~100% を維持、 全 card サイズ揃え。
 *
 * lane gap = 240px (label pill 最大幅 ~200px + node 端 margin 40px) で edge label が
 * adjacent node に侵食しない設計。
 */

// 3 lane 統一構成 (left 280 / center 380 / right 280、 gap 240px × 2 = 1700px total)
const L3_X1 = 0;
const L3_X2 = 520;
const L3_X3 = 1140;
const L3_W_LR = 280;
const L3_W_C = 380;
// 2 lane 統一構成
const L2_X1 = 0;
const L2_X2 = 600;
const L2_W = 280;
// 4 lane 構成は patternProxy のみで使用していたが、 Permit 同様 individual override に移行したため削除
// (将来 4 lane pattern を増やす場合は再導入)

/** 1. 直結 dotted-flow (隣接 node 間) */
export const patternDirect = diagram("pattern-direct", { topic: "pattern: 直結 dotted-flow" })
  .lane("l1", { x: L2_X1, width: L2_W })
  .lane("l2", { x: L2_X2, width: L2_W })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "直結", sub: "node 端 stop", tone: "accent", style: "dotted-flow" })
  .phase("p", { duration: 2400, title: "直結", body: "粒子が A 端 → B 端で stop、 node 内には入らない。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("direct"))
  .build();

/** 2. 経由 node 貫通 */
export const patternPassthrough = diagram("pattern-passthrough", { topic: "pattern: 経由 node 貫通 (自動判定)" })
  .lane("l1", { x: L3_X1, width: L3_W_LR })
  .lane("l2", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("l3", { x: L3_X3, width: L3_W_LR })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("router", { lane: "l2", stack: 0, kind: "function", title: "Router", subtitle: "粒子が貫通" })
  .node("c", { lane: "l3", stack: 0, kind: "function", title: "C" })
  .edge("a", "c", { id: "e", label: "A → C", sub: "Router 経由", tone: "accent", style: "dotted-flow", labelOffsetY: -160 })
  .phase("p", { duration: 2800, title: "貫通", body: "edge path が Router の上を通るため、 cdl が auto 判定で粒子を Router 中央まで動かす。" }, (p: PhaseBuilder) => p.activate("a", "router", "c", "e").badge("through"))
  .build();

/** 3. call → read → write */
export const patternCallReadWrite = diagram("pattern-call-rw", { topic: "pattern: call → read → write" })
  .lane("actor", { x: L2_X1, width: L2_W })
  .lane("contract", { x: L2_X2, width: 480, contain: true })
  .state("bal", { initial: 100 })
  .node("alice", { lane: "actor", stack: 0, kind: "actor", title: "Alice", value: "{bal}" })
  .node("fn", { lane: "contract", stack: 0, kind: "function", title: "transfer(...)" })
  .node("storage", { lane: "contract", stack: 1, kind: "storage", title: "balances", rows: ["Alice: {bal}"] })
  .edge("alice", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "storage", { id: "read", label: "read", tone: "teal", style: "dotted-flow" })
  .edge("fn", "storage", { id: "write", label: "write", tone: "accent", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "call", body: "外部から関数呼び出し。" }, (p: PhaseBuilder) => p.activate("alice", "fn", "call").badge("call"))
  .phase("read", { duration: 1800, title: "read", body: "storage から balances を読む。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "read").badge("read"))
  .phase("write", { duration: 1800, title: "write", body: "storage を更新。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "write").tween("bal", 100, 90).badge("write"))
  .build();

/** 4. emit event */
export const patternEmit = diagram("pattern-emit", { topic: "pattern: emit event" })
  .lane("c", { x: L2_X1, width: L2_W })
  .lane("o", { x: L2_X2, width: L2_W })
  .node("fn", { lane: "c", stack: 0, kind: "function", title: "transfer(...)" })
  .node("ev", { lane: "o", stack: 0, kind: "event", title: "Transfer", subtitle: "(from, to, value)" })
  .edge("fn", "ev", { id: "emit", label: "emit", tone: "success", style: "dotted-flow" })
  .phase("p", { duration: 2400, title: "emit", body: "関数内で emit したイベントが log に書き込まれる。" }, (p: PhaseBuilder) => p.activate("fn", "ev", "emit").badge("emit"))
  .build();

/** 5. Hook callback ... 専用 lane geometry で hook callback + 受信可否確認 sub label の clearance 確保 */
export const patternHook = diagram("pattern-hook", { topic: "pattern: Hook callback" })
  .lane("sender", { x: 0, width: 280 })
  .lane("token", { x: 500, width: 380 })
  .lane("recipient", { x: 1280, width: 280 })
  .node("from", { lane: "sender", stack: 0, kind: "actor", title: "From" })
  .node("fn", { lane: "token", stack: 0, kind: "function", title: "safeTransfer", subtitle: "残高更新後 hook" })
  .node("hook", { lane: "recipient", stack: 0, kind: "function", title: "onReceived", subtitle: "受信側で実装" })
  .edge("from", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "hook", { id: "hook", label: "hook callback", sub: "受信可否確認", tone: "teal", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "call", body: "送信側が safeTransfer を呼ぶ。" }, (p: PhaseBuilder) => p.activate("from", "fn", "call").badge("call"))
  .phase("hook", { duration: 1800, title: "hook callback", body: "Token が受信側 contract の onReceived hook を呼んで「受け取れますか」 と確認。" }, (p: PhaseBuilder) => p.activate("fn", "hook", "hook").badge("hook"))
  .build();

/** 6. Bridge (Lock-Mint) */
export const patternBridge = diagram("pattern-bridge", { topic: "pattern: Bridge (Lock-Mint)" })
  .lane("src", { x: L3_X1, width: L3_W_LR, contain: true })
  .lane("br", { x: L3_X2, width: L3_W_C })
  .lane("dst", { x: L3_X3, width: L3_W_LR, contain: true })
  .state("locked", { initial: 0 })
  .state("minted", { initial: 0 })
  .node("user", { lane: "src", stack: 0, kind: "actor", title: "User" })
  .node("lockFn", { lane: "src", stack: 1, kind: "function", title: "lock(amt)" })
  .node("vault", { lane: "src", stack: 2, kind: "storage", title: "Vault", rows: ["locked: {locked}"] })
  .node("relayer", { lane: "br", stack: 0, kind: "function", title: "Relayer", subtitle: "message" })
  .node("mintFn", { lane: "dst", stack: 0, kind: "function", title: "mint(amt)" })
  .node("recv", { lane: "dst", stack: 1, kind: "actor", title: "Receiver", value: "{minted}" })
  .edge("user", "lockFn", { id: "e1", label: "lock", tone: "accent", style: "dotted-flow" })
  .edge("lockFn", "vault", { id: "e2", label: "store", tone: "teal", style: "dotted-flow" })
  .edge("lockFn", "relayer", { id: "e3", label: "msg", tone: "info", style: "dotted-flow" })
  .edge("relayer", "mintFn", { id: "e4", label: "relay", tone: "info", style: "dotted-flow" })
  .edge("mintFn", "recv", { id: "e5", label: "send", tone: "success", style: "dotted-flow" })
  .phase("lock", { duration: 1800, title: "Source: lock", body: "Source chain で資産を vault に lock。" }, (p: PhaseBuilder) => p.activate("user", "lockFn", "vault", "e1", "e2").tween("locked", 0, 10).badge("locked"))
  .phase("relay", { duration: 1800, title: "Relayer: msg pass", body: "Bridge relayer が cross-chain メッセージを伝達。" }, (p: PhaseBuilder) => p.activate("lockFn", "relayer", "mintFn", "e3", "e4").badge("relay"))
  .phase("mint", { duration: 1800, title: "Dest: mint + send", body: "Dest chain で同量を mint して receiver に送る。" }, (p: PhaseBuilder) => p.activate("mintFn", "recv", "e5").tween("minted", 0, 10).badge("minted"))
  .build();

/** 7. Approve → Pull */
export const patternApprovePull = diagram("pattern-approve-pull", { topic: "pattern: Approve → Pull (2 step)" })
  .lane("owner", { x: 0, width: 280 })
  .lane("token", { x: 500, width: 420 })
  .lane("spender", { x: 1280, width: 280 })
  .state("allowance", { initial: 0 })
  .node("o", { lane: "owner", stack: 0, kind: "actor", title: "Owner" })
  .node("approveFn", { lane: "token", stack: 0, kind: "function", title: "approve(spender, n)" })
  .node("allowMap", { lane: "token", stack: 1, kind: "storage", title: "allowances", rows: ["sp: {allowance}"] })
  .node("pullFn", { lane: "token", stack: 2, kind: "function", title: "transferFrom(...)" })
  .node("s", { lane: "spender", stack: 0, kind: "actor", title: "Spender" })
  .edge("o", "approveFn", { id: "e1", label: "approve", tone: "accent", style: "dotted-flow" })
  .edge("approveFn", "allowMap", { id: "e2", label: "set", tone: "teal", style: "dotted-flow" })
  .edge("s", "pullFn", { id: "e3", label: "transferFrom", tone: "warning", style: "dotted-flow" })
  .edge("pullFn", "allowMap", { id: "e4", label: "decrement", tone: "warning", style: "dotted-flow", labelOffsetX: 160 })
  .phase("approve", { duration: 1800, title: "Owner: approve", body: "Owner が Spender に対する allowance を設定。" }, (p: PhaseBuilder) => p.activate("o", "approveFn", "allowMap", "e1", "e2").tween("allowance", 0, 100).badge("approved"))
  .phase("pull", { duration: 1800, title: "Spender: transferFrom", body: "Spender が allowance の範囲で資産を pull、 allowance が減算。" }, (p: PhaseBuilder) => p.activate("s", "pullFn", "allowMap", "e3", "e4").tween("allowance", 100, 60).badge("pulled"))
  .build();

/** 8. Multicall (Router 経由) */
export const patternMulticall = diagram("pattern-multicall", { topic: "pattern: Multicall (Router 経由)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("r", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("t", { x: L3_X3, width: L3_W_LR })
  .node("user", { lane: "u", stack: 0, kind: "actor", title: "User" })
  .node("router", { lane: "r", stack: 0, kind: "function", title: "multicall([...])", subtitle: "貫通" })
  .node("t1", { lane: "t", stack: 0, kind: "function", title: "Target 1" })
  .node("t2", { lane: "t", stack: 1, kind: "function", title: "Target 2" })
  .edge("user", "t1", { id: "e1", label: "call 1", tone: "accent", style: "dotted-flow", labelOffsetY: -160 })
  .edge("user", "t2", { id: "e2", label: "call 2", tone: "teal", style: "dotted-flow", labelOffsetY: 200 })
  .phase("call1", { duration: 2400, title: "call 1: User → Router → Target 1", body: "粒子が Router を貫通して Target 1 へ。" }, (p: PhaseBuilder) => p.activate("user", "router", "t1", "e1").badge("call 1"))
  .phase("call2", { duration: 2400, title: "call 2: User → Router → Target 2", body: "同様に Target 2 へ。" }, (p: PhaseBuilder) => p.activate("user", "router", "t2", "e2").badge("call 2"))
  .build();

/** 9. Proxy + Implementation ... 4 lane で widen + e1 を上に逃がし proxy 貫通 demo を視覚的に分離 */
export const patternProxy = diagram("pattern-proxy", { topic: "pattern: Proxy + Implementation" })
  .lane("u", { x: 0, width: 260 })
  .lane("p", { x: 420, width: 260, contain: true })
  .lane("i", { x: 840, width: 260 })
  .lane("s", { x: 1260, width: 320 })
  .state("v", { initial: 0 })
  .node("user", { lane: "u", stack: 0, kind: "actor", title: "User" })
  .node("proxy", { lane: "p", stack: 0, kind: "function", title: "Proxy.fallback", subtitle: "delegatecall" })
  .node("impl", { lane: "i", stack: 0, kind: "function", title: "Implementation" })
  .node("st", { lane: "s", stack: 0, kind: "storage", title: "Proxy Storage", rows: ["v: {v}"] })
  .edge("user", "impl", { id: "e1", label: "call", sub: "Proxy 経由", tone: "accent", style: "dotted-flow", labelOffsetY: -160 })
  .edge("impl", "st", { id: "e2", label: "read/write", sub: "Proxy storage", tone: "teal", style: "dotted-flow", labelOffsetY: -160 })
  .phase("call", { duration: 2400, title: "User → Proxy → Impl", body: "User が Proxy を呼び、 delegatecall で Implementation を実行。" }, (p: PhaseBuilder) => p.activate("user", "proxy", "impl", "e1").badge("delegatecall"))
  .phase("store", { duration: 2400, title: "Impl → Storage (Proxy)", body: "Implementation のロジックで storage を更新。 storage 自体は Proxy 側に保持。" }, (p: PhaseBuilder) => p.activate("impl", "st", "e2").tween("v", 0, 1).badge("stored"))
  .build();

/** 10. DEX Swap (AMM) */
export const patternDexSwap = diagram("pattern-dex-swap", { topic: "pattern: DEX Swap (AMM)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("r", { x: L3_X2, width: L3_W_C })
  .lane("p", { x: L3_X3, width: L3_W_LR, contain: true })
  .state("reserveA", { initial: 1000 })
  .state("reserveB", { initial: 1000 })
  .state("userA", { initial: 100 })
  .state("userB", { initial: 0 })
  .node("user", { lane: "u", stack: 0, kind: "actor", title: "Trader", value: "{userA}" })
  .node("router", { lane: "r", stack: 0, kind: "function", title: "swap(...)", subtitle: "経路計算" })
  .node("pair", { lane: "p", stack: 0, kind: "function", title: "Pair.swap", subtitle: "x*y=k" })
  .node("reserves", { lane: "p", stack: 1, kind: "storage", title: "reserves", rows: ["A: {reserveA}", "B: {reserveB}"] })
  .edge("user", "router", { id: "e1", label: "swap A→B", tone: "accent", style: "dotted-flow" })
  .edge("router", "pair", { id: "e2", label: "forward", tone: "teal", style: "dotted-flow" })
  .edge("pair", "reserves", { id: "e3", label: "update", tone: "warning", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "Trader → Router", body: "Router 経由で swap 呼出。" }, (p: PhaseBuilder) => p.activate("user", "router", "e1").badge("call"))
  .phase("swap", { duration: 1800, title: "Router → Pair", body: "Pair contract で constant product 数式により out 算出。" }, (p: PhaseBuilder) => p.activate("router", "pair", "e2").badge("swap"))
  .phase("settle", { duration: 1800, title: "Reserves 更新", body: "reserves が更新、 価格 = reserveB/reserveA が変動。" }, (p: PhaseBuilder) =>
    p.activate("pair", "reserves", "e3").tween("reserveA", 1000, 1100).tween("reserveB", 1000, 909).tween("userA", 100, 0).tween("userB", 0, 91).badge("settled"),
  )
  .build();

/** 11. Lending */
export const patternLending = diagram("pattern-lending", { topic: "pattern: Lending (Supply / Borrow)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("p", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("o", { x: L3_X3, width: L3_W_LR })
  .state("supplied", { initial: 0 })
  .state("borrowed", { initial: 0 })
  .node("user", { lane: "u", stack: 0, kind: "actor", title: "User", value: "{supplied}" })
  .node("supplyFn", { lane: "p", stack: 0, kind: "function", title: "supply(...)" })
  .node("borrowFn", { lane: "p", stack: 1, kind: "function", title: "borrow(...)" })
  .node("vault", { lane: "p", stack: 2, kind: "storage", title: "PoolStorage", rows: ["sup: {supplied}", "bor: {borrowed}"] })
  .node("oracle", { lane: "o", stack: 0, kind: "function", title: "Oracle", subtitle: "price" })
  .edge("user", "supplyFn", { id: "e1", label: "supply", tone: "success", style: "dotted-flow", labelOffsetY: -60 })
  .edge("supplyFn", "vault", { id: "e2", label: "store", tone: "teal", style: "dotted-flow", labelOffsetX: 160 })
  .edge("user", "borrowFn", { id: "e3", label: "borrow", tone: "warning", style: "dotted-flow", labelOffsetY: 200 })
  .edge("borrowFn", "oracle", { id: "e4", label: "price", tone: "info", style: "dotted-flow" })
  .edge("borrowFn", "vault", { id: "e5", label: "track debt", tone: "warning", style: "dotted-flow", labelOffsetX: 180 })
  .phase("supply", { duration: 1800, title: "Supply", body: "User が collateral を supply、 vault に記録。" }, (p: PhaseBuilder) =>
    p.activate("user", "supplyFn", "vault", "e1", "e2").tween("supplied", 0, 1000).badge("collateral"),
  )
  .phase("borrow", { duration: 1800, title: "Borrow", body: "Oracle で価格確認 → vault に debt 記録。" }, (p: PhaseBuilder) =>
    p.activate("user", "borrowFn", "oracle", "vault", "e3", "e4", "e5").tween("borrowed", 0, 500).badge("borrowed"),
  )
  .build();

/** 12. Oracle */
export const patternOracle = diagram("pattern-oracle", { topic: "pattern: Oracle Price Feed" })
  .lane("ext", { x: L3_X1, width: L3_W_LR })
  .lane("o", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("c", { x: L3_X3, width: L3_W_LR })
  .state("price", { initial: 0 })
  .node("nodes", { lane: "ext", stack: 0, kind: "actor", title: "Oracle Nodes", subtitle: "複数 node" })
  .node("agg", { lane: "o", stack: 0, kind: "function", title: "Aggregator", subtitle: "median" })
  .node("store", { lane: "o", stack: 1, kind: "storage", title: "latestAnswer", rows: ["p: {price}"] })
  .node("user", { lane: "c", stack: 0, kind: "function", title: "MyContract", subtitle: "読む" })
  .edge("nodes", "agg", { id: "e1", label: "submit", tone: "info", style: "dotted-flow" })
  .edge("agg", "store", { id: "e2", label: "write", tone: "teal", style: "dotted-flow" })
  .edge("user", "store", { id: "e3", label: "read", tone: "accent", style: "dotted-flow" })
  .phase("submit", { duration: 1800, title: "Off-chain → Aggregator", body: "複数 Oracle node が価格を submit。" }, (p: PhaseBuilder) => p.activate("nodes", "agg", "e1").badge("submit"))
  .phase("aggregate", { duration: 1800, title: "Aggregate → Store", body: "median 集計、 latestAnswer に書込。" }, (p: PhaseBuilder) =>
    p.activate("agg", "store", "e2").tween("price", 0, 3500).badge("aggregated"),
  )
  .phase("read", { duration: 1800, title: "Consumer reads", body: "Consumer が latestAnswer を読んで利用。" }, (p: PhaseBuilder) => p.activate("user", "store", "e3").badge("consumed"))
  .build();

/** 13. Staking */
export const patternStaking = diagram("pattern-staking", { topic: "pattern: Staking (Stake / Reward)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("c", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .state("staked", { initial: 0 })
  .state("reward", { initial: 0 })
  .node("v", { lane: "u", stack: 0, kind: "actor", title: "Validator", value: "{staked}" })
  .node("stakeFn", { lane: "c", stack: 0, kind: "function", title: "stake(amt)" })
  .node("registry", { lane: "c", stack: 1, kind: "storage", title: "ValidatorSet", rows: ["staked: {staked}"] })
  .node("rewardFn", { lane: "r", stack: 0, kind: "function", title: "distribute", subtitle: "epoch 毎" })
  .edge("v", "stakeFn", { id: "e1", label: "stake", tone: "success", style: "dotted-flow" })
  .edge("stakeFn", "registry", { id: "e2", label: "register", tone: "teal", style: "dotted-flow" })
  .edge("rewardFn", "v", { id: "e3", label: "reward", tone: "info", style: "dotted-flow", labelOffsetY: -160 })
  .phase("stake", { duration: 1800, title: "Stake", body: "Validator が stake、 ValidatorSet に登録。" }, (p: PhaseBuilder) =>
    p.activate("v", "stakeFn", "registry", "e1", "e2").tween("staked", 0, 32).badge("staked"),
  )
  .phase("reward", { duration: 1800, title: "Reward", body: "epoch ごとに validator に報酬を distribute。" }, (p: PhaseBuilder) =>
    p.activate("rewardFn", "v", "e3").tween("reward", 0, 1).badge("rewarded"),
  )
  .build();

/** 14. Liquidation */
export const patternLiquidation = diagram("pattern-liquidation", { topic: "pattern: Liquidation" })
  .lane("k", { x: L3_X1, width: L3_W_LR })
  .lane("p", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("b", { x: L3_X3, width: L3_W_LR })
  .state("hf", { initial: 0 })
  .state("collateral", { initial: 1000 })
  .state("debt", { initial: 800 })
  .node("keeper", { lane: "k", stack: 0, kind: "actor", title: "Keeper", subtitle: "HF<1 監視" })
  .node("liqFn", { lane: "p", stack: 0, kind: "function", title: "liquidate(...)" })
  .node("vault", { lane: "p", stack: 1, kind: "storage", title: "Position", rows: ["coll: {collateral}", "debt: {debt}", "hf: {hf}"] })
  .node("borrower", { lane: "b", stack: 0, kind: "actor", title: "Borrower" })
  .edge("keeper", "liqFn", { id: "e1", label: "call", tone: "warning", style: "dotted-flow", labelOffsetY: -60 })
  .edge("liqFn", "vault", { id: "e2", label: "seize", tone: "error", style: "dotted-flow" })
  .edge("liqFn", "keeper", { id: "e3", label: "send", tone: "success", style: "dotted-flow", labelOffsetY: 80 })
  .phase("watch", { duration: 1500, title: "Keeper monitors HF", body: "HF (担保価値/借入価値) を監視、 1 を割ると liquidate 起動。" }, (p: PhaseBuilder) =>
    p.activate("keeper", "vault").set("hf", 0.95).badge("HF<1"),
  )
  .phase("liquidate", { duration: 1800, title: "Liquidate", body: "Keeper が liquidate を呼び、 担保を discount 価格で取得。" }, (p: PhaseBuilder) =>
    p.activate("keeper", "liqFn", "vault", "e1", "e2").tween("collateral", 1000, 0).tween("debt", 800, 0).badge("seized"),
  )
  .phase("reward", { duration: 1800, title: "Keeper reward", body: "Keeper は discount 分が利益、 borrower は担保失う。" }, (p: PhaseBuilder) => p.activate("liqFn", "keeper", "borrower", "e3").badge("done"))
  .build();

/** 15. NFT Mint */
export const patternNftMint = diagram("pattern-nft-mint", { topic: "pattern: NFT Mint" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("c", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("o", { x: L3_X3, width: L3_W_LR })
  .state("supply", { initial: 0 })
  .node("buyer", { lane: "u", stack: 0, kind: "actor", title: "Buyer" })
  .node("mintFn", { lane: "c", stack: 0, kind: "function", title: "mint(to)", subtitle: "payable" })
  .node("ownerMap", { lane: "c", stack: 1, kind: "storage", title: "owners", rows: ["sup: {supply}"] })
  .node("nft", { lane: "o", stack: 0, kind: "event", title: "Transfer", subtitle: "(0x0, b, id)" })
  .edge("buyer", "mintFn", { id: "e1", label: "mint+ETH", tone: "accent", style: "dotted-flow" })
  .edge("mintFn", "ownerMap", { id: "e2", label: "owners[id]", tone: "teal", style: "dotted-flow" })
  .edge("mintFn", "nft", { id: "e3", label: "emit", tone: "success", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "mint call (with ETH)", body: "Buyer が ETH 付きで mint を呼ぶ。" }, (p: PhaseBuilder) => p.activate("buyer", "mintFn", "e1").badge("paid"))
  .phase("assign", { duration: 1800, title: "owners[id] = buyer", body: "新 tokenId の owner として記録、 supply 増加。" }, (p: PhaseBuilder) =>
    p.activate("mintFn", "ownerMap", "e2").tween("supply", 0, 1).badge("assigned"),
  )
  .phase("emit", { duration: 1800, title: "emit Transfer", body: "Mint は from=0x0 の Transfer event として emit。" }, (p: PhaseBuilder) => p.activate("mintFn", "nft", "e3").badge("emitted"))
  .build();

/** 16. EIP-2612 Permit ... Permit 専用 lane geometry で edge label clearance 確保 + EIP-712 独立 node 化 */
export const patternPermit = diagram("pattern-permit", { topic: "pattern: Permit (EIP-2612 gasless)" })
  // Permit 専用 lane geometry ... center↔right gap 拡大で permit(sig) label clearance >= 32px 確保
  .lane("o", { x: 0, width: 320 })
  .lane("s", { x: 540, width: 360 })
  .lane("t", { x: 1240, width: 420, contain: true })
  .state("allowance", { initial: 0 })
  .node("owner", { lane: "o", stack: 0, kind: "actor", title: "Owner", subtitle: "署名のみ (gas 0)" })
  .node("spender", { lane: "s", stack: 0, kind: "actor", title: "Spender", subtitle: "relayer" })
  .node("eip712", { lane: "s", stack: 1, kind: "card", title: "EIP-712 typed-data", subtitle: "domain + Permit struct" })
  .node("permitFn", { lane: "t", stack: 0, kind: "function", title: "permit(...sig)" })
  .node("allowMap", { lane: "t", stack: 1, kind: "storage", title: "allowances", rows: ["amt: {allowance}"] })
  .edge("owner", "eip712", { id: "e1", label: "sign", tone: "info", style: "dotted-flow" })
  .edge("eip712", "spender", { id: "e1b", label: "send sig", tone: "info", style: "dotted-flow" })
  .edge("spender", "permitFn", { id: "e2", label: "permit(sig)", tone: "accent", style: "dotted-flow" })
  .edge("permitFn", "allowMap", { id: "e3", label: "set allowance", tone: "teal", style: "dotted-flow" })
  .phase("sign", { duration: 1800, title: "Off-chain signature", body: "Owner が EIP-712 typed-data 形式で Permit struct を署名 (gas 不要)。" }, (p: PhaseBuilder) =>
    p.activate("owner", "eip712", "e1").badge("signed"),
  )
  .phase("relay", { duration: 1800, title: "Spender が relay", body: "Owner から受け取った sig を Spender が保持し on-chain へ relay。" }, (p: PhaseBuilder) =>
    p.activate("eip712", "spender", "e1b").badge("relayed"),
  )
  .phase("execute", { duration: 1800, title: "Spender が on-chain execute", body: "Spender が sig を持って permit を呼ぶ。 Token が検証して allowance 設定。" }, (p: PhaseBuilder) =>
    p.activate("spender", "permitFn", "allowMap", "e2", "e3").tween("allowance", 0, 100).badge("approved"),
  )
  .build();

/** 17. CCTP */
export const patternCctp = diagram("pattern-cctp", { topic: "pattern: CCTP (USDC Burn-Mint)" })
  .lane("src", { x: L3_X1, width: L3_W_LR, contain: true })
  .lane("att", { x: L3_X2, width: L3_W_C })
  .lane("dst", { x: L3_X3, width: L3_W_LR, contain: true })
  .state("srcBal", { initial: 100 })
  .state("dstBal", { initial: 0 })
  .node("sender", { lane: "src", stack: 0, kind: "actor", title: "Sender", value: "{srcBal}" })
  .node("burnFn", { lane: "src", stack: 1, kind: "function", title: "depositForBurn" })
  .node("attService", { lane: "att", stack: 0, kind: "function", title: "Attestation", subtitle: "Circle" })
  .node("mintFn", { lane: "dst", stack: 0, kind: "function", title: "receiveMessage" })
  .node("recv", { lane: "dst", stack: 1, kind: "actor", title: "Recipient", value: "{dstBal}" })
  .edge("sender", "burnFn", { id: "e1", label: "burn", tone: "warning", style: "dotted-flow" })
  .edge("burnFn", "attService", { id: "e2", label: "req", tone: "info", style: "dotted-flow" })
  .edge("attService", "mintFn", { id: "e3", label: "attest", tone: "info", style: "dotted-flow" })
  .edge("mintFn", "recv", { id: "e4", label: "mint", tone: "success", style: "dotted-flow" })
  .phase("burn", { duration: 1800, title: "Source: burn USDC", body: "Sender が source chain で USDC を burn、 depositForBurn でメッセージ作成。" }, (p: PhaseBuilder) =>
    p.activate("sender", "burnFn", "e1").tween("srcBal", 100, 90).badge("burned"),
  )
  .phase("attest", { duration: 1800, title: "Circle: attestation", body: "Circle の off-chain サービスが burn を確認、 attestation 署名を発行。" }, (p: PhaseBuilder) =>
    p.activate("burnFn", "attService", "e2", "e3").badge("attested"),
  )
  .phase("mint", { duration: 1800, title: "Dest: mint USDC", body: "Recipient が dest chain で attestation を提示、 同量を mint。" }, (p: PhaseBuilder) =>
    p.activate("mintFn", "recv", "e4").tween("dstBal", 0, 10).badge("minted"),
  )
  .build();

/** 18. Meta-Transaction */
export const patternMetaTx = diagram("pattern-meta-tx", { topic: "pattern: Meta-Transaction (gasless)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("r", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("f", { x: L3_X3, width: L3_W_LR })
  .node("user", { lane: "u", stack: 0, kind: "actor", title: "User", subtitle: "ETH 0" })
  .node("relayer", { lane: "r", stack: 0, kind: "function", title: "Relayer", subtitle: "gas 負担" })
  .node("fwd", { lane: "f", stack: 0, kind: "function", title: "Forwarder.execute" })
  .node("target", { lane: "f", stack: 1, kind: "function", title: "Target.fn", subtitle: "sender = User" })
  .edge("user", "relayer", { id: "e1", label: "signed tx", tone: "info", style: "dotted-flow" })
  .edge("relayer", "fwd", { id: "e2", label: "execute", tone: "accent", style: "dotted-flow" })
  .edge("fwd", "target", { id: "e3", label: "forward", tone: "teal", style: "dotted-flow" })
  .phase("sign", { duration: 1800, title: "User signs off-chain", body: "User は署名のみ、 gas 不要で Relayer に渡す。" }, (p: PhaseBuilder) => p.activate("user", "relayer", "e1").badge("signed"))
  .phase("relay", { duration: 1800, title: "Relayer pays gas + execute", body: "Relayer が gas を払って Forwarder を呼ぶ。" }, (p: PhaseBuilder) => p.activate("relayer", "fwd", "e2").badge("relayed"))
  .phase("forward", { duration: 1800, title: "Forwarder → Target", body: "Forwarder が Target を呼ぶ、 msg.sender = User として実行。" }, (p: PhaseBuilder) => p.activate("fwd", "target", "e3").badge("done"))
  .build();
