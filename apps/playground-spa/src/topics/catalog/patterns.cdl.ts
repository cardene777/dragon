import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Patterns ... 一般 web 開発で頻出する 12 構成 pattern。
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

/** 1. 直結 dotted-flow (隣接 node 間) */
export const patternDirect = diagram("pattern-direct", { topic: "pattern: Direct (隣接 node 直結)" })
  .lane("l1", { x: L2_X1, width: L2_W })
  .lane("l2", { x: L2_X2, width: L2_W })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "Client" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "Service" })
  .edge("a", "b", { id: "e", label: "request", sub: "node 端 stop", tone: "accent", style: "dotted-flow" })
  .phase("p", { duration: 2400, title: "直結", body: "粒子が Client 端 → Service 端で stop、 node 内には入らない。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("direct"))
  .build();

/** 2. 経由 node 貫通 (Passthrough) */
export const patternPassthrough = diagram("pattern-passthrough", { topic: "pattern: Passthrough (中継 node 貫通)" })
  .lane("l1", { x: L3_X1, width: L3_W_LR })
  .lane("l2", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("l3", { x: L3_X3, width: L3_W_LR })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "Client" })
  .node("router", { lane: "l2", stack: 0, kind: "function", title: "API Gateway", subtitle: "Client → Service を relay (proxy pattern)" })
  .node("c", { lane: "l3", stack: 0, kind: "function", title: "Service" })
  .edge("a", "c", { id: "e", label: "Client → Service", sub: "Gateway 経由", tone: "accent", style: "dotted-flow" })
  .phase("p", { duration: 2800, title: "貫通", body: "edge path が Gateway の上を通るため、 cdl が auto 判定で粒子を Gateway 中央まで動かす。" }, (p: PhaseBuilder) => p.activate("a", "router", "c", "e").badge("through"))
  .build();

/** 3. call → read → write (関数内部処理) */
export const patternCallReadWrite = diagram("pattern-call-rw", { topic: "pattern: Call → Read → Write" })
  .lane("client", { x: L2_X1, width: L2_W })
  .lane("service", { x: L2_X2, width: 480, contain: true })
  .state("count", { initial: 100 })
  .node("user", { lane: "client", stack: 0, kind: "actor", title: "User", value: "{count}" })
  .node("fn", { lane: "service", stack: 0, kind: "function", title: "decrement(...)" })
  .node("storage", { lane: "service", stack: 1, kind: "storage", title: "counter table", rows: ["User: {count}"] })
  .edge("user", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "storage", { id: "read", label: "read", tone: "teal", style: "dotted-flow" })
  .edge("fn", "storage", { id: "write", label: "write", tone: "accent", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "call", body: "外部から関数呼び出し。" }, (p: PhaseBuilder) => p.activate("user", "fn", "call").badge("call"))
  .phase("read", { duration: 1800, title: "read", body: "storage から現在値を読む。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "read").badge("read"))
  .phase("write", { duration: 1800, title: "write", body: "storage を更新。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "write").tween("count", 100, 90).badge("write"))
  .build();

/** 4. emit event (外部通知) */
export const patternEmit = diagram("pattern-emit", { topic: "pattern: Emit Event (外部通知)" })
  .lane("c", { x: L2_X1, width: L2_W })
  .lane("o", { x: L2_X2, width: L2_W })
  .node("fn", { lane: "c", stack: 0, kind: "function", title: "processOrder(...)" })
  .node("ev", { lane: "o", stack: 0, kind: "event", title: "OrderCreated", subtitle: "(orderId, userId, total)" })
  .edge("fn", "ev", { id: "emit", label: "emit", tone: "success", style: "dotted-flow" })
  .phase("p", { duration: 2400, title: "emit", body: "関数内で emit したイベントが event bus / log に書き込まれる。" }, (p: PhaseBuilder) => p.activate("fn", "ev", "emit").badge("emit"))
  .build();

/** 5. Hook callback ... 受信側 hook で「受け取れますか」 確認 */
// v10.5 = lane 間 gap を詰めて viewBox 1940 → 1300 相当に (scale 4.0 → 2.7 で label 判読性向上)。
// 旧配置 (x=0/500/1280) は lane 間 空白 400/400 world で label が実 DOM で 6-7 px に縮小、
// 新配置 (x=0/380/880) は lane 間 gap 100 world で節間の視覚 flow は維持しつつ全体を圧縮。
export const patternHook = diagram("pattern-hook", { topic: "pattern: Hook callback" })
  .lane("sender", { x: 0, width: 280 })
  .lane("token", { x: 380, width: 380 })
  .lane("recipient", { x: 880, width: 280 })
  .node("from", { lane: "sender", stack: 0, kind: "actor", title: "Sender" })
  .node("fn", { lane: "token", stack: 0, kind: "function", title: "deliver", subtitle: "送付前 hook" })
  .node("hook", { lane: "recipient", stack: 0, kind: "function", title: "onReceive", subtitle: "受信側で実装" })
  .edge("from", "fn", { id: "call", label: "call", tone: "accent", style: "dotted-flow" })
  .edge("fn", "hook", { id: "hook", label: "hook callback", sub: "受信可否確認", tone: "teal", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "call", body: "送信側が deliver を呼ぶ。" }, (p: PhaseBuilder) => p.activate("from", "fn", "call").badge("call"))
  .phase("hook", { duration: 1800, title: "hook callback", body: "Service が受信側の onReceive hook を呼んで「受け取れますか」 と確認。" }, (p: PhaseBuilder) => p.activate("fn", "hook", "hook").badge("hook"))
  .build();

/** 6. Branch (条件分岐 if/else) */
export const patternBranch = diagram("pattern-branch", { topic: "pattern: Branch (条件分岐)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("d", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .node("input", { lane: "u", stack: 0, kind: "actor", title: "Input" })
  .node("check", { lane: "d", stack: 0, kind: "function", title: "if (valid?)", subtitle: "分岐 node" })
  .node("ok", { lane: "r", stack: 0, kind: "function", title: "process()" })
  .node("ng", { lane: "r", stack: 1, kind: "event", title: "ValidationError" })
  .edge("input", "check", { id: "e1", label: "evaluate", tone: "accent", style: "dotted-flow" })
  .edge("check", "ok", { id: "e2", label: "true", tone: "success", style: "dotted-flow" })
  .edge("check", "ng", { id: "e3", label: "false", tone: "error", style: "dotted-flow" })
  .phase("eval", { duration: 1800, title: "evaluate", body: "input を条件 node に渡す。" }, (p: PhaseBuilder) => p.activate("input", "check", "e1").badge("evaluate"))
  .phase("true", { duration: 1800, title: "true 経路", body: "条件成立で process を呼ぶ。" }, (p: PhaseBuilder) => p.activate("check", "ok", "e2").badge("true"))
  .phase("false", { duration: 1800, title: "false 経路", body: "条件不成立で error イベントを emit。" }, (p: PhaseBuilder) => p.activate("check", "ng", "e3").badge("false"))
  .build();

/** 7. Loop (繰り返し処理) */
export const patternLoop = diagram("pattern-loop", { topic: "pattern: Loop (繰り返し処理)" })
  .lane("c", { x: L2_X1, width: L2_W })
  .lane("w", { x: L2_X2, width: 480, contain: true })
  .state("i", { initial: 0 })
  .node("client", { lane: "c", stack: 0, kind: "actor", title: "Client" })
  .node("iter", { lane: "w", stack: 0, kind: "function", title: "for i in items", subtitle: "ループ node" })
  .node("body", { lane: "w", stack: 1, kind: "function", title: "process(item)" })
  .edge("client", "iter", { id: "e1", label: "run", tone: "accent", style: "dotted-flow" })
  .edge("iter", "body", { id: "e2", label: "each item", tone: "teal", style: "dotted-flow" })
  .phase("start", { duration: 1500, title: "start", body: "Client が一括実行を呼ぶ。" }, (p: PhaseBuilder) => p.activate("client", "iter", "e1").badge("start"))
  .phase("iter1", { duration: 1500, title: "iter 1", body: "1 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 0, 1).badge("i=1"))
  .phase("iter2", { duration: 1500, title: "iter 2", body: "2 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 1, 2).badge("i=2"))
  .phase("iter3", { duration: 1500, title: "iter 3", body: "3 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 2, 3).badge("i=3"))
  .build();

/** 8. Fan-out (1 入力 → 複数 worker) */
export const patternFanOut = diagram("pattern-fan-out", { topic: "pattern: Fan-out (1 入力 → 複数 worker)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("d", { x: L3_X2, width: L3_W_C })
  .lane("w", { x: L3_X3, width: L3_W_LR })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "Producer" })
  .node("dist", { lane: "d", stack: 0, kind: "function", title: "Dispatcher", subtitle: "分配" })
  .node("w1", { lane: "w", stack: 0, kind: "function", title: "Worker 1" })
  .node("w2", { lane: "w", stack: 1, kind: "function", title: "Worker 2" })
  .node("w3", { lane: "w", stack: 2, kind: "function", title: "Worker 3" })
  .edge("client", "dist", { id: "e1", label: "submit", tone: "accent", style: "solid" })
  .edge("dist", "w1", { id: "e2", label: "job 1", tone: "teal", style: "solid" })
  .edge("dist", "w2", { id: "e3", label: "job 2", tone: "teal", style: "solid" })
  .edge("dist", "w3", { id: "e4", label: "job 3", tone: "teal", style: "solid" })
  .phase("submit", { duration: 1800, title: "submit", body: "Producer が 1 入力を Dispatcher に submit。" }, (p: PhaseBuilder) => p.activate("client", "dist").badge("submit"))
  .phase("fanout", { duration: 1800, title: "fan-out", body: "Dispatcher が 1 job を 3 worker に並列 dispatch (round-robin)、 各 worker が独立処理。" }, (p: PhaseBuilder) => p.activate("dist", "w1", "w2", "w3").badge("fan-out"))
  .build();

/** 9. Fan-in (複数 worker → 集約) */
export const patternFanIn = diagram("pattern-fan-in", { topic: "pattern: Fan-in (複数 worker → 集約)" })
  .lane("w", { x: L3_X1, width: L3_W_LR })
  .lane("a", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .node("w1", { lane: "w", stack: 0, kind: "function", title: "Worker 1" })
  .node("w2", { lane: "w", stack: 1, kind: "function", title: "Worker 2" })
  .node("w3", { lane: "w", stack: 2, kind: "function", title: "Worker 3" })
  .node("agg", { lane: "a", stack: 0, kind: "function", title: "Aggregator", subtitle: "集約" })
  .node("store", { lane: "a", stack: 1, kind: "storage", title: "result table" })
  .node("client", { lane: "r", stack: 0, kind: "actor", title: "Consumer" })
  .edge("w1", "agg", { id: "e1", label: "result 1", tone: "teal", style: "solid" })
  .edge("w2", "agg", { id: "e2", label: "result 2", tone: "teal", style: "solid" })
  .edge("w3", "agg", { id: "e3", label: "result 3", tone: "teal", style: "solid" })
  .edge("agg", "store", { id: "e4", label: "write", tone: "warning", style: "solid" })
  .edge("store", "client", { id: "e5", label: "read", tone: "accent", style: "solid" })
  .phase("collect", { duration: 1800, title: "collect", body: "3 worker が結果を Aggregator に送る。" }, (p: PhaseBuilder) => p.activate("w1", "w2", "w3", "agg").badge("fan-in"))
  .phase("write", { duration: 1800, title: "write", body: "Aggregator が集約結果を store に書込。" }, (p: PhaseBuilder) => p.activate("agg", "store").badge("write"))
  .phase("read", { duration: 1800, title: "read", body: "Consumer が集約結果を取得。" }, (p: PhaseBuilder) => p.activate("store", "client").badge("read"))
  .build();

/** 10. Rollback (失敗時に元の状態へ巻き戻す) */
export const patternRollback = diagram("pattern-rollback", { topic: "pattern: Rollback (失敗時巻き戻し)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("t", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("s", { x: L3_X3, width: L3_W_LR })
  .state("balance", { initial: 100 })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "Client", value: "{balance}" })
  .node("tx", { lane: "t", stack: 0, kind: "function", title: "BEGIN tx" })
  .node("op", { lane: "t", stack: 1, kind: "function", title: "operation()" })
  .node("commit", { lane: "t", stack: 2, kind: "function", title: "COMMIT / ROLLBACK" })
  .node("db", { lane: "s", stack: 0, kind: "storage", title: "DB", rows: ["balance: {balance}"] })
  .edge("client", "tx", { id: "e1", label: "BEGIN", tone: "accent", style: "dotted-flow" })
  .edge("tx", "op", { id: "e2", label: "execute", tone: "teal", style: "dotted-flow" })
  .edge("op", "db", { id: "e3", label: "write", tone: "warning", style: "dotted-flow" })
  .edge("op", "commit", { id: "e4", label: "on error", tone: "error", style: "dotted-flow" })
  .edge("commit", "db", { id: "e5", label: "ROLLBACK", tone: "error", style: "dotted-flow" })
  .phase("begin", { duration: 1500, title: "BEGIN", body: "tx 開始。" }, (p: PhaseBuilder) => p.activate("client", "tx", "e1").badge("BEGIN"))
  .phase("write", { duration: 1500, title: "tentative write", body: "operation 内で DB を仮更新。" }, (p: PhaseBuilder) => p.activate("tx", "op", "db", "e2", "e3").tween("balance", 100, 80).badge("write"))
  .phase("rollback", { duration: 1500, title: "ROLLBACK", body: "失敗検知で元の値に巻き戻し。" }, (p: PhaseBuilder) => p.activate("op", "commit", "db", "e4", "e5").tween("balance", 80, 100).badge("ROLLBACK"))
  .build();

/** 11. Schedule (定期実行) */
export const patternSchedule = diagram("pattern-schedule", { topic: "pattern: Schedule (定期実行)" })
  .lane("s", { x: L3_X1, width: L3_W_LR })
  .lane("j", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("t", { x: L3_X3, width: L3_W_LR })
  .node("cron", { lane: "s", stack: 0, kind: "actor", title: "Cron", subtitle: "*/5 * * * *" })
  .node("scheduler", { lane: "j", stack: 0, kind: "function", title: "Scheduler", subtitle: "起動判定" })
  .node("job", { lane: "j", stack: 1, kind: "function", title: "Job.run()" })
  .node("target", { lane: "t", stack: 0, kind: "function", title: "Target service" })
  .edge("cron", "scheduler", { id: "e1", label: "tick", tone: "info", style: "dotted-flow" })
  .edge("scheduler", "job", { id: "e2", label: "trigger", tone: "accent", style: "dotted-flow" })
  .edge("job", "target", { id: "e3", label: "invoke", tone: "teal", style: "dotted-flow" })
  .phase("tick", { duration: 1800, title: "tick", body: "Cron が 5 分ごとに tick。" }, (p: PhaseBuilder) => p.activate("cron", "scheduler", "e1").badge("tick"))
  .phase("trigger", { duration: 1800, title: "trigger", body: "Scheduler が Job を起動。" }, (p: PhaseBuilder) => p.activate("scheduler", "job", "e2").badge("trigger"))
  .phase("invoke", { duration: 1800, title: "invoke", body: "Job が Target を呼ぶ。" }, (p: PhaseBuilder) => p.activate("job", "target", "e3").badge("invoke"))
  .build();

/** 12. Validate → Process (検証後処理) */
export const patternValidateProcess = diagram("pattern-validate-process", { topic: "pattern: Validate → Process (検証後処理)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("v", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("p", { x: L3_X3, width: L3_W_LR })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "Client" })
  .node("validate", { lane: "v", stack: 0, kind: "function", title: "validate(input)" })
  .node("schema", { lane: "v", stack: 1, kind: "storage", title: "schema", rows: ["lib: zod / yup"] })
  .node("process", { lane: "p", stack: 0, kind: "function", title: "process()" })
  .node("err", { lane: "p", stack: 1, kind: "event", title: "ValidationError" })
  .edge("client", "validate", { id: "e1", label: "submit", tone: "accent", style: "dotted-flow" })
  .edge("validate", "schema", { id: "e2", label: "check", tone: "teal", style: "dotted-flow" })
  .edge("validate", "process", { id: "e3", label: "ok", tone: "success", style: "dotted-flow" })
  .edge("validate", "err", { id: "e4", label: "ng", tone: "error", style: "dotted-flow" })
  .phase("submit", { duration: 1500, title: "submit", body: "Client が input を送る。" }, (p: PhaseBuilder) => p.activate("client", "validate", "e1").badge("submit"))
  .phase("check", { duration: 1500, title: "check", body: "schema で検証。" }, (p: PhaseBuilder) => p.activate("validate", "schema", "e2").badge("check"))
  .phase("ok", { duration: 1500, title: "ok", body: "検証成功で process。" }, (p: PhaseBuilder) => p.activate("validate", "process", "e3").badge("ok"))
  .phase("ng", { duration: 1500, title: "ng", body: "失敗時は ValidationError emit。" }, (p: PhaseBuilder) => p.activate("validate", "err", "e4").badge("ng"))
  .build();

/**
 * 13. patternDirectCheckout v2 = pattern 1 Direct の business scenario 拡張 (EC 決済で顧客 → payment service 直結)、 shape-person + shape-mobile-device + shape-online-shop + shape-brokerage + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (商品選択 → checkout → 決済送信 → 確定) + 4 readout (gauge 決済進捗 / countup 累計注文 / stat 金額 / stat 平均処理秒) が tween で visually 連続変化。 iteration 8 wave 8-R redesign。 pattern 1 の抽象 patternDirect と並置、 diff-additive で教育資料保全。
 */
export const patternDirectCheckout = diagram("pattern-direct-checkout", {
  topic: "pattern 1 Direct business scenario = EC 決済で顧客 → payment service 直結 4 phase (商品選択 → checkout → 決済送信 → 確定) の flow を shape-* primitive 6 種で表現 + 4 readout tween で visually 連続変化",
})
  .lane("buyer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("progress", { initial: 0 })
  .state("orderCount", { initial: 452 })
  .state("amount", { initial: 0 })
  .state("procSec", { initial: 0 })
  .node("buyer", { lane: "buyer", stack: 0, kind: "shape-person", title: "buyer 岸様", eyebrow: "customer", subtitle: "夜のオンライン買い物" })
  .node("phone", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "iPhone EC app", eyebrow: "device", subtitle: "商品閲覧 + カート + 決済 UI" })
  .node("shop", { lane: "service", stack: 0, kind: "shape-online-shop", title: "EC checkout", eyebrow: "shop", subtitle: "商品明細 + 送料 + 合計計算" })
  .node("payGateway", { lane: "service", stack: 1, kind: "shape-brokerage", title: "決済 gateway (Stripe)", eyebrow: "payment", subtitle: "card 検証 + tokenize + settle" })
  .node("notify", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "通知 service", eyebrow: "notify", subtitle: "受注確認メール + push" })
  .node("orderDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "注文 DB", eyebrow: "storage", subtitle: "確定注文 + 決済 ref 保存" })
  .edge("buyer", "phone", { label: "選ぶ", tone: "info" })
  .edge("phone", "shop", { label: "checkout", tone: "info" })
  .edge("shop", "payGateway", { label: "charge (直結)", tone: "accent" })
  .edge("payGateway", "orderDb", { label: "confirm", tone: "success" })
  .edge("payGateway", "notify", { label: "notify", tone: "success" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "決済進捗 %" })
  .readout.countup("ordCU", { source: "orderCount", unit: " 件", label: "累計注文", decimals: 0 })
  .readout.stat("amtStat", { source: "amount", unit: " ¥", caption: "決済額", label: "amount" })
  .readout.stat("secStat", { source: "procSec", unit: " 秒", caption: "処理秒", label: "sec" })
  .phase("p1", {
    duration: 1500,
    title: "商品選択",
    body: "岸様が EC app 起動、 商品 3 点をカート追加。 progress 0 → 20 tween、 orderCount 452 keep、 amount 0 → 15800 tween、 procSec 0 → 2 tween、 buyer + phone + shop lane active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop").tween("progress", 0, 20).tween("amount", 0, 15800).tween("procSec", 0, 2).badge("選択"))
  .phase("p2", {
    duration: 1800,
    title: "checkout",
    body: "shop で送料 + 消費税計算、 決済 gateway 情報入力欄表示。 progress 20 → 50 tween、 amount 15800 → 17380 tween、 procSec 2 → 5 tween、 shop lane 継続 active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop").tween("progress", 20, 50).tween("amount", 15800, 17380).tween("procSec", 2, 5).badge("checkout"))
  .phase("p3", {
    duration: 2000,
    title: "決済送信 (直結)",
    body: "shop → payGateway 直結で charge、 中継 node なし (Direct pattern)、 Stripe 側で tokenize + settle。 progress 50 → 85 tween、 procSec 5 → 8 tween、 payGateway lane activate、 直結 edge accent 発火。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payGateway").tween("progress", 50, 85).tween("procSec", 5, 8).badge("charge"))
  .phase("p4", {
    duration: 2000,
    title: "確定",
    body: "決済 OK で orderDb 保存 + notify service で受注確認メール送信。 progress 85 → 100 tween (gauge 針最上位)、 orderCount 452 → 453 tween、 procSec 8 → 10 tween、 orderDb + notify lane activate、 6 shape 全 active、 決済完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payGateway", "orderDb", "notify").tween("progress", 85, 100).tween("orderCount", 452, 453).tween("procSec", 8, 10).badge("確定"))
  .build();

/**
 * 14. patternPassthroughApiGateway v2 = pattern 2 Passthrough の business scenario 拡張 (SaaS API request を API Gateway 経由で microservice に relay)、 shape-person + shape-mobile-device + shape-api-gateway + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Client request → Gateway route → Service 処理 → Response) + 4 readout (gauge レイテンシ / countup req/s / stat p99 ms / stat error 率) が tween で visually 連続変化。 iteration 8 wave 8-R redesign。 pattern 2 の抽象 patternPassthrough と並置。
 */
export const patternPassthroughApiGateway = diagram("pattern-passthrough-api-gateway", {
  topic: "pattern 2 Passthrough business scenario = SaaS API request を API Gateway 経由で microservice に relay する 4 phase (request → route → 処理 → response) の flow を shape-* primitive 6 種で表現 + 4 readout tween で visually 連続変化",
})
  .lane("client", { x: 0, width: 220 })
  .lane("gateway", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("latencyMs", { initial: 0 })
  .state("reqPerSec", { initial: 850 })
  .state("p99Ms", { initial: 45 })
  .state("errorRate", { initial: 0 })
  .node("apiUser", { lane: "client", stack: 0, kind: "shape-person", title: "API 利用者 開発者", eyebrow: "developer", subtitle: "自社 app から REST API call" })
  .node("cliTool", { lane: "client", stack: 1, kind: "shape-mobile-device", title: "curl + Postman", eyebrow: "device", subtitle: "GET /api/v1/orders" })
  .node("apiGw", { lane: "gateway", stack: 0, kind: "shape-api-gateway", title: "API Gateway (Kong)", eyebrow: "gateway", subtitle: "auth + rate limit + route (Passthrough)" })
  .node("orderSvc", { lane: "gateway", stack: 1, kind: "shape-server-rack", title: "order microservice", eyebrow: "service", subtitle: "実業務ロジック実行 + DB query" })
  .node("apm", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "Datadog APM", eyebrow: "apm", subtitle: "trace + metric + alert" })
  .node("logStore", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "log storage", eyebrow: "storage", subtitle: "request/response log 30 日保持" })
  .edge("apiUser", "cliTool", { label: "実行", tone: "info" })
  .edge("cliTool", "apiGw", { label: "GET /api", tone: "info" })
  .edge("apiGw", "orderSvc", { label: "route (Passthrough)", tone: "accent" })
  .edge("orderSvc", "apm", { label: "trace", tone: "success" })
  .edge("orderSvc", "logStore", { label: "persist", tone: "accent" })
  .readout.gauge("latG", { source: "latencyMs", min: 0, max: 500, color: "#22c55e", label: "レイテンシ ms" })
  .readout.countup("rpsCU", { source: "reqPerSec", unit: " req/s", label: "req/s", decimals: 0 })
  .readout.stat("p99Stat", { source: "p99Ms", unit: " ms", caption: "p99 遅延", label: "p99" })
  .readout.stat("errStat", { source: "errorRate", unit: " %", caption: "error 率", label: "err" })
  .phase("p1", {
    duration: 1500,
    title: "Client request",
    body: "開発者が curl で GET /api/v1/orders 送信。 latencyMs 0 → 15 tween、 reqPerSec 850 → 900 tween、 p99Ms 45 keep、 errorRate 0 keep、 apiUser + cliTool lane active。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool").tween("latencyMs", 0, 15).tween("reqPerSec", 850, 900).badge("request"))
  .phase("p2", {
    duration: 1800,
    title: "Gateway route (Passthrough)",
    body: "API Gateway で JWT auth + rate limit check + route table 引き、 orderSvc に relay。 latencyMs 15 → 45 tween、 reqPerSec 900 → 950 tween、 p99Ms 45 → 60 tween、 apiGw lane activate、 Passthrough edge 発火。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw").tween("latencyMs", 15, 45).tween("reqPerSec", 900, 950).tween("p99Ms", 45, 60).badge("route"))
  .phase("p3", {
    duration: 2000,
    title: "Service 処理",
    body: "order microservice で SQL query 実行 + business logic 適用、 APM で trace 送信。 latencyMs 45 → 120 tween、 p99Ms 60 → 145 tween、 errorRate 0 → 0.3 tween (微小)、 orderSvc + apm lane activate。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw", "orderSvc", "apm").tween("latencyMs", 45, 120).tween("p99Ms", 60, 145).tween("errorRate", 0, 0.3).badge("処理"))
  .phase("p4", {
    duration: 2000,
    title: "Response 返却",
    body: "Service → Gateway → Client の逆経路 (Passthrough 貫通)、 log 永続化。 latencyMs 120 → 155 tween (最終)、 reqPerSec 950 → 1020 tween、 errorRate 0.3 → 0.5 tween、 logStore activate、 6 shape 全 active、 API cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw", "orderSvc", "apm", "logStore").tween("latencyMs", 120, 155).tween("reqPerSec", 950, 1020).tween("errorRate", 0.3, 0.5).badge("response"))
  .build();

/**
 * 15. patternCallRwUserProfile v2 = pattern 3 Call → Read → Write の business scenario 拡張 (SNS user プロフィール更新 = client call → 既存値 read → 更新値 write)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (client call → read profile → write update → confirm) + 4 readout (gauge write 進捗 / countup 更新回数 / stat 処理秒 / stat cache hit %) が tween で visually 連続変化。 iteration 8 wave 8-R redesign。 pattern 3 の抽象 patternCallReadWrite と並置。
 */
export const patternCallRwUserProfile = diagram("pattern-call-rw-user-profile", {
  topic: "pattern 3 Call-Read-Write business scenario = SNS user プロフィール更新 4 phase (call → read → write → confirm) の flow を shape-* primitive 6 種で表現 + 4 readout tween で visually 連続変化",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .state("writeProgress", { initial: 0 })
  .state("updateCount", { initial: 2431 })
  .state("procSec", { initial: 0 })
  .state("cacheHit", { initial: 95 })
  .node("user", { lane: "user", stack: 0, kind: "shape-person", title: "SNS user 相川様", eyebrow: "user", subtitle: "自身のプロフィール編集中" })
  .node("app", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "SNS app profile UI", eyebrow: "device", subtitle: "編集 form + Save button" })
  .node("apiSvc", { lane: "service", stack: 0, kind: "shape-website", title: "profile API", eyebrow: "api", subtitle: "PUT /users/{id}/profile" })
  .node("profileSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "profile service", eyebrow: "service", subtitle: "read + write logic 実行" })
  .node("profileDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "profile DB (Postgres)", eyebrow: "storage", subtitle: "users table + profile jsonb" })
  .node("cache", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "Redis cache", eyebrow: "cache", subtitle: "profile snapshot 5 min TTL" })
  .edge("user", "app", { label: "編集", tone: "info" })
  .edge("app", "apiSvc", { label: "call PUT", tone: "info" })
  .edge("apiSvc", "profileSvc", { label: "forward", tone: "success" })
  .edge("profileSvc", "profileDb", { label: "read + write", tone: "accent" })
  .edge("profileSvc", "cache", { label: "invalidate", tone: "warning" })
  .readout.gauge("wpG", { source: "writeProgress", min: 0, max: 100, color: "#22c55e", label: "write 進捗 %" })
  .readout.countup("upCU", { source: "updateCount", unit: " 回", label: "累計更新", decimals: 0 })
  .readout.stat("secStat", { source: "procSec", unit: " 秒", caption: "処理秒", label: "sec" })
  .readout.stat("chStat", { source: "cacheHit", unit: " %", caption: "cache hit", label: "cache" })
  .phase("p1", {
    duration: 1500,
    title: "Call (PUT request)",
    body: "相川様が profile 編集 → Save button tap、 app が PUT /users/{id}/profile 送信。 writeProgress 0 → 15 tween、 updateCount 2431 keep、 procSec 0 → 1 tween、 cacheHit 95 keep、 user + app + apiSvc lane active。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc").tween("writeProgress", 0, 15).tween("procSec", 0, 1).badge("call"))
  .phase("p2", {
    duration: 1800,
    title: "Read (既存 profile 取得)",
    body: "profileSvc が既存 profile を Postgres から read、 conflict check + diff 算出。 writeProgress 15 → 45 tween、 procSec 1 → 3 tween、 cacheHit 95 → 82 tween (miss で DB fallback)、 profileSvc + profileDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb").tween("writeProgress", 15, 45).tween("procSec", 1, 3).tween("cacheHit", 95, 82).badge("read"))
  .phase("p3", {
    duration: 2000,
    title: "Write (更新 commit)",
    body: "diff 適用済 profile を Postgres に write + Redis cache invalidate。 writeProgress 45 → 85 tween、 updateCount 2431 → 2432 tween、 procSec 3 → 6 tween、 cache lane activate、 cache 無効化 flush。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb", "cache").tween("writeProgress", 45, 85).tween("updateCount", 2431, 2432).tween("procSec", 3, 6).badge("write"))
  .phase("p4", {
    duration: 1800,
    title: "Confirm (200 OK 返却)",
    body: "profileSvc が 200 OK + 更新後 profile を Client に返却、 app UI に反映。 writeProgress 85 → 100 tween (gauge 針最上位)、 procSec 6 → 7 tween、 cacheHit 82 → 88 tween (再 populate)、 6 shape 全 active、 profile 更新 cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb", "cache").tween("writeProgress", 85, 100).tween("procSec", 6, 7).tween("cacheHit", 82, 88).badge("confirm"))
  .build();
