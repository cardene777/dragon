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
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("progress", { initial: 0 })
  .state("orderCount", { initial: 452 })
  .state("amount", { initial: 0 })
  .state("procSec", { initial: 0 })
  .state("curStep", { initial: 0 })
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
  .edge("orderDb", "notify", { label: "notify", tone: "success" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "決済進捗 %" })
  .readout.countup("ordCU", { source: "orderCount", unit: " 件", label: "累計注文", decimals: 0 })
  .readout.stat("amtStat", { source: "amount", unit: " ¥", caption: "決済額", label: "amount" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "商品選択",
    body: "岸様が EC app 起動、 商品 3 点をカート追加。 progress 0 → 20 tween、 orderCount 452 keep、 amount 0 → 15800 tween、 procSec 0 → 2 tween、 buyer + phone + shop lane active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop").tween("progress", 0, 20).tween("amount", 0, 15800).tween("procSec", 0, 2).tween("curStep", 0, 1).badge("選択"))
  .phase("p2", {
    duration: 1800,
    title: "checkout",
    body: "shop で送料 + 消費税計算、 決済 gateway 情報入力欄表示。 progress 20 → 50 tween、 amount 15800 → 17380 tween、 procSec 2 → 5 tween、 shop lane 継続 active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop").tween("progress", 20, 50).tween("amount", 15800, 17380).tween("procSec", 2, 5).tween("curStep", 1, 2).badge("checkout"))
  .phase("p3", {
    duration: 2000,
    title: "決済送信 (直結)",
    body: "shop → payGateway 直結で charge、 中継 node なし (Direct pattern)、 Stripe 側で tokenize + settle。 progress 50 → 85 tween、 procSec 5 → 8 tween、 payGateway lane activate、 直結 edge accent 発火。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payGateway").tween("progress", 50, 85).tween("procSec", 5, 8).tween("curStep", 2, 3).badge("charge"))
  .phase("p4", {
    duration: 2000,
    title: "確定",
    body: "決済 OK で orderDb 保存 + notify service で受注確認メール送信。 progress 85 → 100 tween (gauge 針最上位)、 orderCount 452 → 453 tween、 procSec 8 → 10 tween、 orderDb + notify lane activate、 6 shape 全 active、 決済完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payGateway", "orderDb", "notify").tween("progress", 85, 100).tween("orderCount", 452, 453).tween("procSec", 8, 10).set("curStep", 3).badge("確定"))
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
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("latencyMs", { initial: 0 })
  .state("reqPerSec", { initial: 850 })
  .state("p99Ms", { initial: 45 })
  .state("errorRate", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("apiUser", { lane: "client", stack: 0, kind: "shape-person", title: "API 利用者 開発者", eyebrow: "developer", subtitle: "自社 app から REST API call" })
  .node("cliTool", { lane: "client", stack: 1, kind: "shape-mobile-device", title: "curl + Postman", eyebrow: "device", subtitle: "GET /api/v1/orders" })
  .node("apiGw", { lane: "gateway", stack: 0, kind: "shape-api-gateway", title: "API Gateway (Kong)", eyebrow: "gateway", subtitle: "auth + rate limit + route (Passthrough)" })
  .node("orderSvc", { lane: "gateway", stack: 1, kind: "shape-server-rack", title: "order microservice", eyebrow: "service", subtitle: "実業務ロジック実行 + DB query" })
  .node("apm", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "Datadog APM", eyebrow: "apm", subtitle: "trace + metric + alert" })
  .node("logStore", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "log storage", eyebrow: "storage", subtitle: "request/response log 30 日保持" })
  .edge("apiUser", "cliTool", { label: "実行", tone: "info" })
  .edge("cliTool", "apiGw", { label: "GET /api", tone: "info" })
  .edge("apiGw", "orderSvc", { label: "route", tone: "accent" })
  .edge("orderSvc", "apm", { label: "trace", tone: "success" })
  .edge("apm", "logStore", { label: "persist", tone: "accent" })
  .readout.gauge("latG", { source: "latencyMs", min: 0, max: 500, color: "#22c55e", label: "レイテンシ ms" })
  .readout.countup("rpsCU", { source: "reqPerSec", unit: " req/s", label: "req/s", decimals: 0 })
  .readout.stat("p99Stat", { source: "p99Ms", unit: " ms", caption: "p99 遅延", label: "p99" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "Client request",
    body: "開発者が curl で GET /api/v1/orders 送信。 latencyMs 0 → 15 tween、 reqPerSec 850 → 900 tween、 p99Ms 45 keep、 errorRate 0 keep、 apiUser + cliTool lane active。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool").tween("latencyMs", 0, 15).tween("reqPerSec", 850, 900).tween("curStep", 0, 1).badge("request"))
  .phase("p2", {
    duration: 1800,
    title: "Gateway route (Passthrough)",
    body: "API Gateway で JWT auth + rate limit check + route table 引き、 orderSvc に relay。 latencyMs 15 → 45 tween、 reqPerSec 900 → 950 tween、 p99Ms 45 → 60 tween、 apiGw lane activate、 Passthrough edge 発火。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw").tween("latencyMs", 15, 45).tween("reqPerSec", 900, 950).tween("p99Ms", 45, 60).tween("curStep", 1, 2).badge("route"))
  .phase("p3", {
    duration: 2000,
    title: "Service 処理",
    body: "order microservice で SQL query 実行 + business logic 適用、 APM で trace 送信。 latencyMs 45 → 120 tween、 p99Ms 60 → 145 tween、 errorRate 0 → 0.3 tween (微小)、 orderSvc + apm lane activate。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw", "orderSvc", "apm").tween("latencyMs", 45, 120).tween("p99Ms", 60, 145).tween("errorRate", 0, 0.3).tween("curStep", 2, 3).badge("処理"))
  .phase("p4", {
    duration: 2000,
    title: "Response 返却",
    body: "Service → Gateway → Client の逆経路 (Passthrough 貫通)、 log 永続化。 latencyMs 120 → 155 tween (最終)、 reqPerSec 950 → 1020 tween、 errorRate 0.3 → 0.5 tween、 logStore activate、 6 shape 全 active、 API cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw", "orderSvc", "apm", "logStore").tween("latencyMs", 120, 155).tween("reqPerSec", 950, 1020).tween("errorRate", 0.3, 0.5).set("curStep", 3).badge("response"))
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
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("writeProgress", { initial: 0 })
  .state("updateCount", { initial: 2431 })
  .state("procSec", { initial: 0 })
  .state("cacheHit", { initial: 95 })
  .state("curStep", { initial: 0 })
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
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "Call (PUT request)",
    body: "相川様が profile 編集 → Save button tap、 app が PUT /users/{id}/profile 送信。 writeProgress 0 → 15 tween、 updateCount 2431 keep、 procSec 0 → 1 tween、 cacheHit 95 keep、 user + app + apiSvc lane active。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc").tween("writeProgress", 0, 15).tween("procSec", 0, 1).tween("curStep", 0, 1).badge("call"))
  .phase("p2", {
    duration: 1800,
    title: "Read (既存 profile 取得)",
    body: "profileSvc が既存 profile を Postgres から read、 conflict check + diff 算出。 writeProgress 15 → 45 tween、 procSec 1 → 3 tween、 cacheHit 95 → 82 tween (miss で DB fallback)、 profileSvc + profileDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb").tween("writeProgress", 15, 45).tween("procSec", 1, 3).tween("cacheHit", 95, 82).tween("curStep", 1, 2).badge("read"))
  .phase("p3", {
    duration: 2000,
    title: "Write (更新 commit)",
    body: "diff 適用済 profile を Postgres に write + Redis cache invalidate。 writeProgress 45 → 85 tween、 updateCount 2431 → 2432 tween、 procSec 3 → 6 tween、 cache lane activate、 cache 無効化 flush。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb", "cache").tween("writeProgress", 45, 85).tween("updateCount", 2431, 2432).tween("procSec", 3, 6).tween("curStep", 2, 3).badge("write"))
  .phase("p4", {
    duration: 1800,
    title: "Confirm (200 OK 返却)",
    body: "profileSvc が 200 OK + 更新後 profile を Client に返却、 app UI に反映。 writeProgress 85 → 100 tween (gauge 針最上位)、 procSec 6 → 7 tween、 cacheHit 82 → 88 tween (再 populate)、 6 shape 全 active、 profile 更新 cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb", "cache").tween("writeProgress", 85, 100).tween("procSec", 6, 7).tween("cacheHit", 82, 88).set("curStep", 3).badge("confirm"))
  .build();

/**
 * 16. patternEmitOrderCreated v2 = pattern 4 Emit Event の business scenario 拡張 (EC 注文確定で OrderCreated event を emit → 複数 subscriber (メール / 在庫 / 分析) に fan-out)、 shape-person + shape-mobile-device + shape-online-shop + shape-stack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (注文確定 → event emit → bus 中継 → subscriber 処理) + 4 readout (gauge 配信率 / countup 累計 event / stat subscriber 数 / stat latency ms) が tween で visually 連続変化。 iteration 8 wave 8-S redesign。 pattern 4 の抽象 patternEmit と並置。
 */
export const patternEmitOrderCreated = diagram("pattern-emit-order-created", {
  topic: "pattern 4 Emit Event business scenario = EC 注文確定で OrderCreated event を emit → subscribers に fan-out する 4 phase の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("client", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("deliveryRate", { initial: 0 })
  .state("eventCount", { initial: 8642 })
  .state("subCount", { initial: 3 })
  .state("latency", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("buyer", { lane: "client", stack: 0, kind: "shape-person", title: "buyer 桂様", eyebrow: "customer", subtitle: "商品購入者" })
  .node("phone", { lane: "client", stack: 1, kind: "shape-mobile-device", title: "iPhone EC app", eyebrow: "device", subtitle: "checkout 完了 → OrderCreated" })
  .node("shop", { lane: "service", stack: 0, kind: "shape-online-shop", title: "EC service", eyebrow: "shop", subtitle: "processOrder() で event emit" })
  .node("bus", { lane: "service", stack: 1, kind: "shape-stack", title: "event bus (Kafka)", eyebrow: "bus", subtitle: "OrderCreated topic + 3 subscriber" })
  .node("subscribers", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "3 subscriber", eyebrow: "sub", subtitle: "email / inventory / analytics" })
  .node("eventLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "event log DB", eyebrow: "storage", subtitle: "全 event 履歴 + audit" })
  .edge("buyer", "phone", { label: "checkout", tone: "info" })
  .edge("phone", "shop", { label: "commit", tone: "info" })
  .edge("shop", "bus", { label: "emit", tone: "success" })
  .edge("bus", "subscribers", { label: "fan-out", tone: "accent" })
  .edge("subscribers", "eventLog", { label: "persist", tone: "success" })
  .readout.gauge("delG", { source: "deliveryRate", min: 0, max: 100, color: "#22c55e", label: "配信率 %" })
  .readout.countup("evCU", { source: "eventCount", unit: " 件", label: "累計 event", decimals: 0 })
  .readout.stat("subStat", { source: "subCount", unit: " sub", caption: "subscriber", label: "sub" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "注文確定",
    body: "桂様が checkout 完了、 shop で processOrder() 実行 (order DB 保存 + event 発火準備)。 deliveryRate 0 keep、 eventCount 8642 keep、 subCount 3 keep、 latency 0 → 2 tween、 buyer + phone + shop lane active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop").tween("latency", 0, 2).tween("curStep", 0, 1).badge("確定"))
  .phase("p2", {
    duration: 1800,
    title: "event emit",
    body: "shop が OrderCreated event を bus に emit、 orderId + userId + total を payload に含む。 deliveryRate 0 → 30 tween、 eventCount 8642 → 8643 tween、 latency 2 → 5 tween、 bus lane activate。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "bus").tween("deliveryRate", 0, 30).tween("eventCount", 8642, 8643).tween("latency", 2, 5).tween("curStep", 1, 2).badge("emit"))
  .phase("p3", {
    duration: 2000,
    title: "bus 中継 + fan-out",
    body: "Kafka bus が OrderCreated topic を 3 subscriber (email / inventory / analytics) に fan-out。 deliveryRate 30 → 90 tween、 latency 5 → 12 tween、 subscribers lane activate、 3 並列配信。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "bus", "subscribers").tween("deliveryRate", 30, 90).tween("latency", 5, 12).tween("curStep", 2, 3).badge("fan-out"))
  .phase("p4", {
    duration: 2000,
    title: "subscriber 処理 + log",
    body: "各 subscriber が独立処理 (メール送信 / 在庫減算 / 分析集計)、 eventLog に event 履歴永続化。 deliveryRate 90 → 100 tween (gauge 針最上位)、 latency 12 → 18 tween、 eventLog lane activate、 6 shape 全 active、 event 配信 cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "bus", "subscribers", "eventLog").tween("deliveryRate", 90, 100).tween("latency", 12, 18).set("curStep", 3).badge("処理"))
  .build();

/**
 * 17. patternHookWebhook v2 = pattern 5 Hook callback の business scenario 拡張 (SaaS 側で顧客の webhook endpoint に受信可否を確認しながら delivery)、 shape-server-rack + shape-cloud + shape-api-gateway + shape-website + shape-cylinder + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (delivery 準備 → hook 送信 → 顧客側検証 → 受信確定) + 4 readout (gauge success 率 / countup 累計 delivery / stat retry 回数 / stat 平均 ack ms) が tween で visually 連続変化。 iteration 8 wave 8-S redesign。 pattern 5 の抽象 patternHook と並置。
 */
export const patternHookWebhook = diagram("pattern-hook-webhook", {
  topic: "pattern 5 Hook callback business scenario = SaaS が顧客 webhook endpoint に受信確認しながら deliver する 4 phase の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("saas", { x: 0, width: 220 })
  .lane("bridge", { x: 240, width: 320 })
  .lane("customer", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("successRate", { initial: 0 })
  .state("deliveryCount", { initial: 15234 })
  .state("retryNum", { initial: 0 })
  .state("ackMs", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("saasSvr", { lane: "saas", stack: 0, kind: "shape-server-rack", title: "SaaS notification svc", eyebrow: "saas", subtitle: "顧客 webhook subscribers 管理" })
  .node("scheduler", { lane: "saas", stack: 1, kind: "shape-cloud", title: "delivery scheduler", eyebrow: "scheduler", subtitle: "retry policy + backoff" })
  .node("egress", { lane: "bridge", stack: 0, kind: "shape-api-gateway", title: "outbound gateway", eyebrow: "egress", subtitle: "HTTPS + signature 署名" })
  .node("healthCheck", { lane: "bridge", stack: 1, kind: "shape-gear", title: "endpoint health probe", eyebrow: "probe", subtitle: "顧客 endpoint 可用性 15s check" })
  .node("customerEp", { lane: "customer", stack: 0, kind: "shape-website", title: "customer webhook endpoint", eyebrow: "endpoint", subtitle: "POST /hooks/order (顧客側実装)" })
  .node("deliveryLog", { lane: "customer", stack: 1, kind: "shape-cylinder", title: "delivery log", eyebrow: "storage", subtitle: "顧客別 delivery + ack 履歴" })
  .edge("saasSvr", "scheduler", { label: "queue", tone: "info" })
  .edge("scheduler", "egress", { label: "dispatch", tone: "info" })
  .edge("egress", "customerEp", { label: "POST + hook", tone: "accent" })
  .edge("healthCheck", "customerEp", { label: "health probe", tone: "info" })
  .edge("egress", "deliveryLog", { label: "log ack", tone: "success" })
  .readout.gauge("sucG", { source: "successRate", min: 0, max: 100, color: "#22c55e", label: "success 率 %" })
  .readout.countup("delCU", { source: "deliveryCount", unit: " 件", label: "累計配信", decimals: 0 })
  .readout.stat("retryStat", { source: "retryNum", unit: " 回", caption: "retry", label: "retry" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "delivery 準備",
    body: "SaaS 側で顧客向け notification 発生、 scheduler に queue 投入 + retry policy 適用。 successRate 0 keep、 deliveryCount 15234 keep、 retryNum 0 keep、 ackMs 0 keep、 saasSvr + scheduler lane active。",
  }, (p: PhaseBuilder) => p.activate("saasSvr", "scheduler").tween("curStep", 0, 1).badge("準備"))
  .phase("p2", {
    duration: 1800,
    title: "hook 送信",
    body: "scheduler → outbound gateway → 顧客 endpoint に POST + signature 署名、 healthCheck で事前可用性確認。 successRate 0 → 40 tween、 deliveryCount 15234 → 15235 tween、 ackMs 0 → 80 tween、 egress + healthCheck lane activate。",
  }, (p: PhaseBuilder) => p.activate("saasSvr", "scheduler", "egress", "healthCheck").tween("successRate", 0, 40).tween("deliveryCount", 15234, 15235).tween("ackMs", 0, 80).tween("curStep", 1, 2).badge("送信"))
  .phase("p3", {
    duration: 2000,
    title: "顧客側検証",
    body: "顧客 webhook endpoint (onReceive hook) が signature 検証 + 受信可否判定、 一時的な 5xx で 1 回 retry 発火。 successRate 40 → 75 tween、 retryNum 0 → 1 tween、 ackMs 80 → 220 tween、 customerEp lane activate。",
  }, (p: PhaseBuilder) => p.activate("saasSvr", "scheduler", "egress", "healthCheck", "customerEp").tween("successRate", 40, 75).tween("retryNum", 0, 1).tween("ackMs", 80, 220).tween("curStep", 2, 3).badge("検証"))
  .phase("p4", {
    duration: 2000,
    title: "受信確定 + log",
    body: "retry で 2xx ack 受信、 deliveryLog に成功記録、 SaaS 側 delivery status 更新。 successRate 75 → 98 tween (gauge 針最上位)、 retryNum 1 keep、 ackMs 220 → 250 tween、 deliveryLog lane activate、 6 shape 全 active、 webhook delivery cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("saasSvr", "scheduler", "egress", "healthCheck", "customerEp", "deliveryLog").tween("successRate", 75, 98).tween("ackMs", 220, 250).set("curStep", 3).badge("受信"))
  .build();

/**
 * 18. patternBranchAuthzCheck v2 = pattern 6 Branch (条件分岐) の business scenario 拡張 (SaaS 認可判定 = role check → allow / deny 分岐)、 shape-person + shape-mobile-device + shape-api-gateway + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (request → role check → allow 経路 → deny + audit) + 4 readout (gauge allow 率 / countup deny 累計 / stat 平均判定 ms / stat 監査 log 件数) が tween で visually 連続変化。 iteration 8 wave 8-S redesign。 pattern 6 の抽象 patternBranch と並置。
 */
export const patternBranchAuthzCheck = diagram("pattern-branch-authz-check", {
  topic: "pattern 6 Branch business scenario = SaaS 認可判定 (role check → allow / deny 分岐) 4 phase の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("user", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("allowRate", { initial: 100 })
  .state("denyCount", { initial: 87 })
  .state("checkMs", { initial: 0 })
  .state("auditLogs", { initial: 12451 })
  .state("curStep", { initial: 0 })
  .node("user", { lane: "user", stack: 0, kind: "shape-person", title: "SaaS user 三宅様", eyebrow: "user", subtitle: "role: editor · admin 権限なし" })
  .node("app", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "SaaS web app", eyebrow: "device", subtitle: "DELETE /projects/{id} 実行" })
  .node("authz", { lane: "service", stack: 0, kind: "shape-api-gateway", title: "authz middleware", eyebrow: "authz", subtitle: "role + policy 評価" })
  .node("apiSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "project API", eyebrow: "api", subtitle: "allow 時のみ実行 / deny 時 403" })
  .node("policyDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "policy DB", eyebrow: "policy", subtitle: "role → resource → action grant map" })
  .node("auditSink", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "audit log sink", eyebrow: "audit", subtitle: "allow / deny 全 event 記録" })
  .edge("user", "app", { label: "DELETE 試行", tone: "info" })
  .edge("app", "authz", { label: "role check", tone: "info" })
  .edge("authz", "policyDb", { label: "lookup", tone: "success" })
  .edge("authz", "apiSvc", { label: "allow (true)", tone: "success" })
  .edge("authz", "auditSink", { label: "deny (false) + log", tone: "error" })
  .readout.gauge("alwG", { source: "allowRate", min: 0, max: 100, color: "#22c55e", label: "allow 率 %" })
  .readout.countup("denyCU", { source: "denyCount", unit: " 件", label: "deny 累計", decimals: 0 })
  .readout.stat("chStat", { source: "checkMs", unit: " ms", caption: "判定時間", label: "check" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "request",
    body: "三宅様が DELETE /projects/42 実行、 authz middleware に到達。 allowRate 100 keep、 denyCount 87 keep、 checkMs 0 → 2 tween、 auditLogs 12451 → 12452 tween、 user + app + authz lane active。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "authz").tween("checkMs", 0, 2).tween("auditLogs", 12451, 12452).tween("curStep", 0, 1).badge("request"))
  .phase("p2", {
    duration: 1800,
    title: "role check",
    body: "authz が policyDb を lookup、 三宅様の role (editor) と DELETE action の grant を評価。 allowRate 100 → 88 tween (editor DELETE 不可判定)、 checkMs 2 → 6 tween、 policyDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "authz", "policyDb").tween("allowRate", 100, 88).tween("checkMs", 2, 6).tween("curStep", 1, 2).badge("check"))
  .phase("p3", {
    duration: 2000,
    title: "deny 経路",
    body: "policy 評価結果 = deny (editor は DELETE 権限なし)、 apiSvc は呼ばず 403 Forbidden 即座返却。 allowRate 88 keep (denied で分岐)、 denyCount 87 → 88 tween、 checkMs 6 → 9 tween、 分岐 edge error 発火。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "authz", "policyDb").tween("denyCount", 87, 88).tween("checkMs", 6, 9).tween("curStep", 2, 3).badge("deny"))
  .phase("p4", {
    duration: 2000,
    title: "audit log + notify",
    body: "auditSink に deny event 記録 + SecOps に高頻度 deny alert 通知、 apiSvc は不動作 (safe)。 allowRate 88 keep、 denyCount 88 keep、 checkMs 9 → 10 tween、 auditLogs 12452 → 12453 tween、 auditSink + apiSvc lane activate (apiSvc は inactive 表示)、 6 shape 全 active、 authz cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "authz", "policyDb", "apiSvc", "auditSink").tween("checkMs", 9, 10).tween("auditLogs", 12452, 12453).set("curStep", 3).badge("audit"))
  .build();

/**
 * 19. patternLoopBatchImport v2 = pattern 7 Loop の business scenario 拡張 (CSV 100 行を 1 行ずつ import + validate + DB 挿入する batch job)、 shape-person + shape-mobile-device + shape-server-rack + shape-cylinder + shape-cloud + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (start → 進行中 33% → 進行中 66% → 完了) + 4 readout (gauge 進捗 / countup 処理行 / stat エラー行 / stat 平均 ms/row) が tween で visually 連続変化。 iteration 8 wave 8-T redesign。 pattern 7 の抽象 patternLoop と並置。
 */
export const patternLoopBatchImport = diagram("pattern-loop-batch-import", {
  topic: "pattern 7 Loop business scenario = CSV 100 行 batch import 4 phase (start → 33% → 66% → 100%) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("admin", { x: 0, width: 220 })
  .lane("worker", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("progress", { initial: 0 })
  .state("processed", { initial: 0 })
  .state("errRows", { initial: 0 })
  .state("avgMs", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("admin", { lane: "admin", stack: 0, kind: "shape-person", title: "admin 中森様", eyebrow: "admin", subtitle: "CSV batch import 実行者" })
  .node("laptop", { lane: "admin", stack: 1, kind: "shape-mobile-device", title: "admin console", eyebrow: "device", subtitle: "batch job 起動 + 進捗 monitoring" })
  .node("worker", { lane: "worker", stack: 0, kind: "shape-server-rack", title: "batch worker", eyebrow: "worker", subtitle: "for row in csv: validate + insert" })
  .node("progressSensor", { lane: "worker", stack: 1, kind: "shape-iot-sensor", title: "progress sensor", eyebrow: "sensor", subtitle: "per-row status emit + WebSocket 送信" })
  .node("db", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "target DB", eyebrow: "storage", subtitle: "insert 100 row + transaction 100 batch" })
  .node("notify", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "notify service", eyebrow: "notify", subtitle: "完了時 email + Slack 通知" })
  .edge("admin", "laptop", { label: "start", tone: "info" })
  .edge("laptop", "worker", { label: "run job", tone: "info" })
  .edge("worker", "progressSensor", { label: "emit tick", tone: "success" })
  .edge("worker", "db", { label: "insert (loop)", tone: "accent" })
  .edge("worker", "notify", { label: "complete", tone: "success" })
  .readout.gauge("prgG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "進捗 %" })
  .readout.countup("procCU", { source: "processed", unit: " row", label: "処理済", decimals: 0 })
  .readout.stat("errStat", { source: "errRows", unit: " row", caption: "error 行", label: "err" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "start (行 0)",
    body: "中森様が admin console から batch job 起動、 worker が CSV parse + validate 準備。 progress 0 → 5 tween、 processed 0 keep、 errRows 0 keep、 avgMs 0 → 8 tween、 admin + laptop + worker lane active。",
  }, (p: PhaseBuilder) => p.activate("admin", "laptop", "worker").tween("progress", 0, 5).tween("avgMs", 0, 8).tween("curStep", 0, 1).badge("start"))
  .phase("p2", {
    duration: 2000,
    title: "進行中 33% (行 33)",
    body: "for loop で行 1-33 を validate + insert、 1 行 fail (encoding error)。 progress 5 → 33 tween、 processed 0 → 33 tween、 errRows 0 → 1 tween、 avgMs 8 → 12 tween、 progressSensor + db lane activate。",
  }, (p: PhaseBuilder) => p.activate("admin", "laptop", "worker", "progressSensor", "db").tween("progress", 5, 33).tween("processed", 0, 33).tween("errRows", 0, 1).tween("avgMs", 8, 12).tween("curStep", 1, 2).badge("33%"))
  .phase("p3", {
    duration: 2000,
    title: "進行中 66% (行 66)",
    body: "行 34-66 継続処理、 2 行 fail (duplicate key)。 progress 33 → 66 tween、 processed 33 → 66 tween、 errRows 1 → 3 tween、 avgMs 12 → 15 tween、 DB transaction commit 継続。",
  }, (p: PhaseBuilder) => p.activate("admin", "laptop", "worker", "progressSensor", "db").tween("progress", 33, 66).tween("processed", 33, 66).tween("errRows", 1, 3).tween("avgMs", 12, 15).tween("curStep", 2, 3).badge("66%"))
  .phase("p4", {
    duration: 2000,
    title: "完了 (行 100)",
    body: "残り 34 行完了、 notify で email + Slack 通知送信、 error log は別出力。 progress 66 → 100 tween (gauge 針最上位)、 processed 66 → 100 tween、 errRows 3 keep、 avgMs 15 → 14 tween (安定)、 notify lane activate、 6 shape 全 active、 batch import cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("admin", "laptop", "worker", "progressSensor", "db", "notify").tween("progress", 66, 100).tween("processed", 66, 100).tween("avgMs", 15, 14).set("curStep", 3).badge("100%"))
  .build();

/**
 * 20. patternFanOutVideoTranscode v2 = pattern 8 Fan-out の business scenario 拡張 (動画 upload 1 本を 3 解像度 (480p/720p/1080p) に並列 transcode)、 shape-person + shape-mobile-device + shape-cloud + shape-server-rack + shape-cdn-edge + shape-cylinder の 6 shape で visual scene 化、 4 phase (upload → dispatch → 3 並列 transcode → 全解像度公開) + 4 readout (gauge 完了率 / countup 累計動画 / stat 総処理秒 / stat 平均 MB) が tween で visually 連続変化。 iteration 8 wave 8-T redesign。 pattern 8 の抽象 patternFanOut と並置。
 */
export const patternFanOutVideoTranscode = diagram("pattern-fanout-video-transcode", {
  topic: "pattern 8 Fan-out business scenario = 動画 upload → 3 解像度並列 transcode 4 phase (upload → dispatch → 並列 → 公開) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("creator", { x: 0, width: 220 })
  .lane("cluster", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("completionRate", { initial: 0 })
  .state("videoCount", { initial: 3821 })
  .state("totalSec", { initial: 0 })
  .state("avgMb", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("creator", { lane: "creator", stack: 0, kind: "shape-person", title: "creator 川島様", eyebrow: "creator", subtitle: "video 配信サービスの動画投稿者" })
  .node("phone", { lane: "creator", stack: 1, kind: "shape-mobile-device", title: "iPhone + video app", eyebrow: "device", subtitle: "録画 + upload UI + 進捗 monitor" })
  .node("dispatcher", { lane: "cluster", stack: 0, kind: "shape-cloud", title: "transcode dispatcher", eyebrow: "dispatcher", subtitle: "1 job を 3 worker に fan-out" })
  .node("workers", { lane: "cluster", stack: 1, kind: "shape-server-rack", title: "3 transcode worker", eyebrow: "worker", subtitle: "worker 1 = 480p / 2 = 720p / 3 = 1080p" })
  .node("cdn", { lane: "outcome", stack: 0, kind: "shape-cdn-edge", title: "video CDN edge", eyebrow: "cdn", subtitle: "全 3 解像度配信 + edge cache" })
  .node("mediaDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "media DB", eyebrow: "storage", subtitle: "video_id → 3 resolution URL map" })
  .edge("creator", "phone", { label: "録画", tone: "info" })
  .edge("phone", "dispatcher", { label: "upload", tone: "info" })
  .edge("dispatcher", "workers", { label: "fan-out (3 並列)", tone: "accent" })
  .edge("workers", "cdn", { label: "publish", tone: "success" })
  .edge("cdn", "mediaDb", { label: "URL 登録", tone: "success" })
  .readout.gauge("comG", { source: "completionRate", min: 0, max: 100, color: "#22c55e", label: "完了率 %" })
  .readout.countup("vidCU", { source: "videoCount", unit: " 本", label: "累計動画", decimals: 0 })
  .readout.stat("secStat", { source: "totalSec", unit: " 秒", caption: "総処理", label: "sec" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "upload",
    body: "川島様が iPhone で録画完了、 300 MB 原本を dispatcher に upload。 completionRate 0 → 15 tween、 videoCount 3821 keep、 totalSec 0 → 20 tween、 avgMb 0 → 300 tween、 creator + phone + dispatcher lane active。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "dispatcher").tween("completionRate", 0, 15).tween("totalSec", 0, 20).tween("avgMb", 0, 300).tween("curStep", 0, 1).badge("upload"))
  .phase("p2", {
    duration: 1800,
    title: "dispatch (fan-out 3)",
    body: "dispatcher が 1 原本を 3 worker に並列 job 投入 (480p / 720p / 1080p 各 1 worker)。 completionRate 15 → 35 tween、 totalSec 20 → 35 tween、 workers lane activate、 3 並列 job kick。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "dispatcher", "workers").tween("completionRate", 15, 35).tween("totalSec", 20, 35).tween("curStep", 1, 2).badge("dispatch"))
  .phase("p3", {
    duration: 2200,
    title: "3 並列 transcode",
    body: "3 worker が独立に H.264 transcode 実行、 完了順に CDN publish 済、 mediaDb に URL 登録。 completionRate 35 → 90 tween、 totalSec 35 → 120 tween、 avgMb 300 → 180 tween (圧縮効果)、 cdn + mediaDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "dispatcher", "workers", "cdn", "mediaDb").tween("completionRate", 35, 90).tween("totalSec", 35, 120).tween("avgMb", 300, 180).tween("curStep", 2, 3).badge("transcode"))
  .phase("p4", {
    duration: 2000,
    title: "全解像度公開",
    body: "3 解像度全 publish 完了、 川島様に通知 + CDN 全 edge に伝播完了。 completionRate 90 → 100 tween (gauge 針最上位)、 videoCount 3821 → 3822 tween、 totalSec 120 → 135 tween、 avgMb 180 keep、 6 shape 全 active、 動画公開 cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "dispatcher", "workers", "cdn", "mediaDb").tween("completionRate", 90, 100).tween("videoCount", 3821, 3822).tween("totalSec", 120, 135).set("curStep", 3).badge("公開"))
  .build();

/**
 * 21. patternFanInMapReduce v2 = pattern 9 Fan-in の business scenario 拡張 (3 shard から集計結果を 1 aggregator に fan-in する MapReduce 風 集計 job)、 shape-server-rack + shape-cloud + shape-cylinder + shape-brokerage + shape-mobile-device + shape-person の 6 shape で visual scene 化、 4 phase (shard 起動 → 並列 map → aggregator fan-in → 結果配信) + 4 readout (gauge aggregate 進捗 / countup 集計 job / stat total records / stat 全体秒) が tween で visually 連続変化。 iteration 8 wave 8-T redesign。 pattern 9 の抽象 patternFanIn と並置。
 */
export const patternFanInMapReduce = diagram("pattern-fanin-mapreduce", {
  topic: "pattern 9 Fan-in business scenario = 3 shard 集計 → 1 aggregator fan-in の MapReduce 集計 4 phase (起動 → map → fan-in → 配信) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("shards", { x: 0, width: 220 })
  .lane("aggregator", { x: 240, width: 320 })
  .lane("consumer", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("aggPct", { initial: 0 })
  .state("jobCount", { initial: 214 })
  .state("totalRecs", { initial: 0 })
  .state("elapsedSec", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("shardCluster", { lane: "shards", stack: 0, kind: "shape-server-rack", title: "3 shard cluster", eyebrow: "shards", subtitle: "us-east / eu-west / ap-south" })
  .node("shardStorage", { lane: "shards", stack: 1, kind: "shape-cylinder", title: "3 shard DB", eyebrow: "storage", subtitle: "各 shard = 1M record 保持" })
  .node("aggSvc", { lane: "aggregator", stack: 0, kind: "shape-gear", title: "aggregator service", eyebrow: "aggregator", subtitle: "3 shard result を集約 + reduce" })
  .node("aggCloud", { lane: "aggregator", stack: 1, kind: "shape-cloud", title: "compute pool", eyebrow: "compute", subtitle: "reduce phase の compute 割当" })
  .node("analyst", { lane: "consumer", stack: 0, kind: "shape-person", title: "analyst 川口様", eyebrow: "analyst", subtitle: "集計結果 review + Slack 共有" })
  .node("dashboard", { lane: "consumer", stack: 1, kind: "shape-mobile-device", title: "BI dashboard", eyebrow: "device", subtitle: "集計 KPI + 時系列 chart" })
  .edge("shardCluster", "aggSvc", { label: "map result", tone: "success" })
  .edge("shardStorage", "shardCluster", { label: "read", tone: "info" })
  .edge("aggSvc", "aggCloud", { label: "compute", tone: "accent" })
  .edge("aggSvc", "dashboard", { label: "publish", tone: "success" })
  .edge("dashboard", "analyst", { label: "review", tone: "info" })
  .readout.gauge("agG", { source: "aggPct", min: 0, max: 100, color: "#22c55e", label: "aggregate %" })
  .readout.countup("jobCU", { source: "jobCount", unit: " job", label: "集計 job 累計", decimals: 0 })
  .readout.stat("recStat", { source: "totalRecs", unit: " M", caption: "総 record", label: "recs" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "shard 起動",
    body: "3 region shard cluster に集計 job 投入、 各 shard が独立 read + map phase 準備。 aggPct 0 → 10 tween、 jobCount 214 keep、 totalRecs 0 → 1 tween、 elapsedSec 0 → 8 tween、 shardCluster + shardStorage lane active。",
  }, (p: PhaseBuilder) => p.activate("shardCluster", "shardStorage").tween("aggPct", 0, 10).tween("totalRecs", 0, 1).tween("elapsedSec", 0, 8).tween("curStep", 0, 1).badge("起動"))
  .phase("p2", {
    duration: 2000,
    title: "並列 map",
    body: "3 shard が独立に map 実行 (各 1M record)、 中間結果を aggregator に send。 aggPct 10 → 55 tween、 totalRecs 1 → 3 tween、 elapsedSec 8 → 45 tween、 aggSvc lane activate、 fan-in edge 発火。",
  }, (p: PhaseBuilder) => p.activate("shardCluster", "shardStorage", "aggSvc").tween("aggPct", 10, 55).tween("totalRecs", 1, 3).tween("elapsedSec", 8, 45).tween("curStep", 1, 2).badge("map"))
  .phase("p3", {
    duration: 2000,
    title: "aggregator fan-in + reduce",
    body: "aggregator が 3 shard 結果を集約 + reduce 実行、 compute pool で並列 processing。 aggPct 55 → 90 tween、 jobCount 214 → 215 tween、 elapsedSec 45 → 75 tween、 aggCloud lane activate。",
  }, (p: PhaseBuilder) => p.activate("shardCluster", "shardStorage", "aggSvc", "aggCloud").tween("aggPct", 55, 90).tween("jobCount", 214, 215).tween("elapsedSec", 45, 75).tween("curStep", 2, 3).badge("reduce"))
  .phase("p4", {
    duration: 2000,
    title: "結果配信",
    body: "集計結果を BI dashboard に publish、 川口様がグラフ review + Slack 共有。 aggPct 90 → 100 tween (gauge 針最上位)、 totalRecs 3 keep、 elapsedSec 75 → 85 tween、 dashboard + analyst lane activate、 6 shape 全 active、 MapReduce cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("shardCluster", "shardStorage", "aggSvc", "aggCloud", "dashboard", "analyst").tween("aggPct", 90, 100).tween("elapsedSec", 75, 85).set("curStep", 3).badge("配信"))
  .build();

/**
 * 22. patternRollbackBankTransfer v2 = pattern 10 Rollback の business scenario 拡張 (銀行送金 tx で送信側 debit + 受信側 credit の atomic 更新、 失敗時 rollback)、 shape-person + shape-mobile-device + shape-bank + shape-brokerage + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (BEGIN → debit + credit → 検証 fail → ROLLBACK) + 4 readout (gauge tx 進捗 / countup 累計 tx / stat rollback 件数 / stat 平均 ms) が tween で visually 連続変化。 iteration 8 wave 8-U redesign。 pattern 10 の抽象 patternRollback と並置。
 */
export const patternRollbackBankTransfer = diagram("pattern-rollback-bank-transfer", {
  topic: "pattern 10 Rollback business scenario = 銀行送金 tx (debit + credit atomic、 fail 時 rollback) 4 phase の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("sender", { x: 0, width: 220 })
  .lane("bank", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("txProgress", { initial: 0 })
  .state("txCount", { initial: 52341 })
  .state("rollbackCount", { initial: 128 })
  .state("avgMs", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("sender", { lane: "sender", stack: 0, kind: "shape-person", title: "送金者 田代様", eyebrow: "sender", subtitle: "口座残高 100万 → 20万送金試行" })
  .node("mobile", { lane: "sender", stack: 1, kind: "shape-mobile-device", title: "銀行 mobile app", eyebrow: "device", subtitle: "送金 form + confirmation UI" })
  .node("issuer", { lane: "bank", stack: 0, kind: "shape-bank", title: "送信元 bank (MUFG)", eyebrow: "issuer", subtitle: "debit 実行 + tx logging" })
  .node("txSvc", { lane: "bank", stack: 1, kind: "shape-gear", title: "tx orchestrator", eyebrow: "tx", subtitle: "BEGIN / COMMIT / ROLLBACK 制御" })
  .node("ledger", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "元帳 DB", eyebrow: "ledger", subtitle: "atomic 更新 or 完全巻き戻し" })
  .node("alerting", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "SecOps alerting", eyebrow: "alert", subtitle: "rollback event 通知 + 監査" })
  .edge("sender", "mobile", { label: "送金操作", tone: "info" })
  .edge("mobile", "issuer", { label: "commit request", tone: "info" })
  .edge("issuer", "txSvc", { label: "BEGIN tx", tone: "accent" })
  .edge("txSvc", "ledger", { label: "debit / credit", tone: "warning" })
  .edge("ledger", "alerting", { label: "ROLLBACK notify", tone: "error" })
  .readout.gauge("txG", { source: "txProgress", min: 0, max: 100, color: "#22c55e", label: "tx 進捗 %" })
  .readout.countup("txCU", { source: "txCount", unit: " 件", label: "累計 tx", decimals: 0 })
  .readout.stat("rlbStat", { source: "rollbackCount", unit: " 件", caption: "rollback", label: "rlb" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "BEGIN tx",
    body: "田代様が 20万送金 confirm、 bank が tx orchestrator に BEGIN 発行。 txProgress 0 → 20 tween、 txCount 52341 keep、 rollbackCount 128 keep、 avgMs 0 → 15 tween、 sender + mobile + issuer + txSvc lane active。",
  }, (p: PhaseBuilder) => p.activate("sender", "mobile", "issuer", "txSvc").tween("txProgress", 0, 20).tween("avgMs", 0, 15).tween("curStep", 0, 1).badge("BEGIN"))
  .phase("p2", {
    duration: 2000,
    title: "debit + credit (tentative)",
    body: "元帳 DB で送信元 debit (-20万) + 受信側 credit (+20万) を tentative write、 COMMIT 前の中間状態。 txProgress 20 → 65 tween、 avgMs 15 → 65 tween、 ledger lane activate、 debit / credit 2 edge 発火。",
  }, (p: PhaseBuilder) => p.activate("sender", "mobile", "issuer", "txSvc", "ledger").tween("txProgress", 20, 65).tween("avgMs", 15, 65).tween("curStep", 1, 2).badge("debit/credit"))
  .phase("p3", {
    duration: 2000,
    title: "検証 fail 検知",
    body: "受信側口座で AML check fail (制裁国口座)、 tx orchestrator が ROLLBACK 判定。 txProgress 65 → 45 tween (下降)、 avgMs 65 → 120 tween、 error 分岐発火、 SecOps 通知準備。",
  }, (p: PhaseBuilder) => p.activate("sender", "mobile", "issuer", "txSvc", "ledger").tween("txProgress", 65, 45).tween("avgMs", 65, 120).tween("curStep", 2, 3).badge("fail"))
  .phase("p4", {
    duration: 2000,
    title: "ROLLBACK + audit",
    body: "元帳を debit / credit 前の残高に完全巻き戻し、 alerting で SecOps 通知 + tx log 記録。 txProgress 45 → 0 tween (全ゼロ復帰)、 txCount 52341 → 52342 tween (試行として count)、 rollbackCount 128 → 129 tween、 avgMs 120 → 180 tween (最終)、 alerting lane activate、 6 shape 全 active、 rollback cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("sender", "mobile", "issuer", "txSvc", "ledger", "alerting").tween("txProgress", 45, 0).tween("txCount", 52341, 52342).tween("rollbackCount", 128, 129).tween("avgMs", 120, 180).set("curStep", 3).badge("ROLLBACK"))
  .build();

/**
 * 23. patternScheduleReportJob v2 = pattern 11 Schedule の business scenario 拡張 (Cron 5 分毎に定期実行される週次 KPI report 集計 job)、 shape-iot-sensor + shape-cloud + shape-server-rack + shape-brokerage + shape-cylinder + shape-person の 6 shape で visual scene 化、 4 phase (tick → scheduler trigger → job 実行 → report 配信) + 4 readout (gauge job 進捗 / countup 累計実行 / stat 平均秒 / stat next tick 分) が tween で visually 連続変化。 iteration 8 wave 8-U redesign。 pattern 11 の抽象 patternSchedule と並置。
 */
export const patternScheduleReportJob = diagram("pattern-schedule-report-job", {
  topic: "pattern 11 Schedule business scenario = Cron 週次 KPI report 集計 job 4 phase (tick → trigger → 実行 → 配信) の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("scheduler", { x: 0, width: 220 })
  .lane("job", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("jobProgress", { initial: 0 })
  .state("runCount", { initial: 8721 })
  .state("avgSec", { initial: 0 })
  .state("nextMin", { initial: 5 })
  .state("curStep", { initial: 0 })
  .node("cron", { lane: "scheduler", stack: 0, kind: "shape-iot-sensor", title: "Cron */5 * * * *", eyebrow: "cron", subtitle: "5 分毎 tick 発火 + drift 監視" })
  .node("schedulerSvc", { lane: "scheduler", stack: 1, kind: "shape-cloud", title: "scheduler service", eyebrow: "scheduler", subtitle: "job queue + concurrency 制御" })
  .node("worker", { lane: "job", stack: 0, kind: "shape-server-rack", title: "report worker", eyebrow: "worker", subtitle: "週次 KPI 集計 (revenue / users / churn)" })
  .node("compute", { lane: "job", stack: 1, kind: "shape-gear", title: "compute engine", eyebrow: "compute", subtitle: "BigQuery + aggregate function" })
  .node("reportStore", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "report store", eyebrow: "storage", subtitle: "週次 report 履歴 + PDF 生成" })
  .node("stakeholder", { lane: "outcome", stack: 1, kind: "shape-person", title: "stakeholder 岩田様", eyebrow: "reader", subtitle: "経営会議で report review" })
  .edge("cron", "schedulerSvc", { label: "tick", tone: "info" })
  .edge("schedulerSvc", "worker", { label: "trigger", tone: "accent" })
  .edge("worker", "compute", { label: "aggregate", tone: "success" })
  .edge("worker", "reportStore", { label: "persist", tone: "success" })
  .edge("reportStore", "stakeholder", { label: "配信", tone: "info" })
  .readout.gauge("jpG", { source: "jobProgress", min: 0, max: 100, color: "#22c55e", label: "job 進捗 %" })
  .readout.countup("runCU", { source: "runCount", unit: " 回", label: "累計実行", decimals: 0 })
  .readout.stat("secStat", { source: "avgSec", unit: " 秒", caption: "平均", label: "sec" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "Cron tick",
    body: "Cron が */5 minute の tick 発火、 scheduler service に job 起動要求。 jobProgress 0 → 10 tween、 runCount 8721 keep、 avgSec 0 → 2 tween、 nextMin 5 → 5 keep、 cron + schedulerSvc lane active。",
  }, (p: PhaseBuilder) => p.activate("cron", "schedulerSvc").tween("jobProgress", 0, 10).tween("avgSec", 0, 2).tween("curStep", 0, 1).badge("tick"))
  .phase("p2", {
    duration: 1800,
    title: "scheduler trigger",
    body: "scheduler service が job queue 確認 + concurrency 判定 → worker に trigger 送信。 jobProgress 10 → 30 tween、 avgSec 2 → 5 tween、 worker lane activate。",
  }, (p: PhaseBuilder) => p.activate("cron", "schedulerSvc", "worker").tween("jobProgress", 10, 30).tween("avgSec", 2, 5).tween("curStep", 1, 2).badge("trigger"))
  .phase("p3", {
    duration: 2000,
    title: "job 実行 (compute)",
    body: "worker が BigQuery 経由で週次 revenue + users + churn を aggregate、 PDF report 生成。 jobProgress 30 → 85 tween、 runCount 8721 → 8722 tween、 avgSec 5 → 42 tween、 compute + reportStore lane activate。",
  }, (p: PhaseBuilder) => p.activate("cron", "schedulerSvc", "worker", "compute", "reportStore").tween("jobProgress", 30, 85).tween("runCount", 8721, 8722).tween("avgSec", 5, 42).tween("curStep", 2, 3).badge("実行"))
  .phase("p4", {
    duration: 2000,
    title: "report 配信",
    body: "reportStore が PDF を Slack + Notion で岩田様に配信、 next tick 準備。 jobProgress 85 → 100 tween (gauge 針最上位)、 avgSec 42 → 48 tween、 nextMin 5 → 4 tween (減少開始)、 stakeholder lane activate、 6 shape 全 active、 scheduled report cycle 完遂。",
  }, (p: PhaseBuilder) => p.activate("cron", "schedulerSvc", "worker", "compute", "reportStore", "stakeholder").tween("jobProgress", 85, 100).tween("avgSec", 42, 48).tween("nextMin", 5, 4).set("curStep", 3).badge("配信"))
  .build();

/**
 * 24. patternValidateProcessOrderSubmit v2 = pattern 12 Validate → Process の business scenario 拡張 (EC 注文 submit で cart validate → OK なら process、 fail なら ValidationError 返却)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (submit → validate → OK 経路 process → NG 経路 error) + 4 readout (gauge 成功率 / countup submit 累計 / stat NG 件数 / stat 平均 ms) が tween で visually 連続変化。 iteration 8 wave 8-U redesign。 pattern 12 の抽象 patternValidateProcess と並置。 patterns.cdl.ts business scenario 完遂 (12/12 wave 8-R 〜 8-U)。
 */
export const patternValidateProcessOrderSubmit = diagram("pattern-validate-process-order-submit", {
  topic: "pattern 12 Validate-Process business scenario = EC 注文 submit (validate → OK 時 process / NG 時 ValidationError) 4 phase の flow を shape-* primitive 6 種で表現 + 4 readout tween",
})
  .lane("buyer", { x: 0, width: 220 })
  .lane("service", { x: 240, width: 320 })
  .lane("outcome", { x: 580, width: 240 })
  .arraySignal("stepLabels", ["p1", "p2", "p3", "p4"])
  .state("successRate", { initial: 0 })
  .state("submitCount", { initial: 15678 })
  .state("ngCount", { initial: 423 })
  .state("avgMs", { initial: 0 })
  .state("curStep", { initial: 0 })
  .node("buyer", { lane: "buyer", stack: 0, kind: "shape-person", title: "buyer 平川様", eyebrow: "buyer", subtitle: "EC 注文 submit 試行者" })
  .node("phone", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "iPhone EC app", eyebrow: "device", subtitle: "cart + submit button + error 表示" })
  .node("submitApi", { lane: "service", stack: 0, kind: "shape-website", title: "order submit API", eyebrow: "api", subtitle: "POST /orders + validation middleware" })
  .node("validator", { lane: "service", stack: 1, kind: "shape-server-rack", title: "validator (zod)", eyebrow: "validator", subtitle: "schema check + business rule 判定" })
  .node("orderDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "order DB", eyebrow: "storage", subtitle: "OK 時のみ commit 保存" })
  .node("errorSink", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "error tracking (Sentry)", eyebrow: "error", subtitle: "NG event 記録 + パターン分析" })
  .edge("buyer", "phone", { label: "submit", tone: "info" })
  .edge("phone", "submitApi", { label: "POST", tone: "info" })
  .edge("submitApi", "validator", { label: "check", tone: "success" })
  .edge("validator", "orderDb", { label: "OK: process", tone: "success" })
  .edge("validator", "errorSink", { label: "NG log", tone: "error" })
  .readout.gauge("sucG", { source: "successRate", min: 0, max: 100, color: "#22c55e", label: "成功率 %" })
  .readout.countup("subCU", { source: "submitCount", unit: " 件", label: "submit 累計", decimals: 0 })
  .readout.stat("ngStat", { source: "ngCount", unit: " 件", caption: "NG 件数", label: "ng" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "phase step" })
  .phase("p1", {
    duration: 1500,
    title: "submit",
    body: "平川様がカート confirm、 EC app が POST /orders 送信 (cart items + shipping address + payment ref)。 successRate 0 keep、 submitCount 15678 keep、 ngCount 423 keep、 avgMs 0 → 8 tween、 buyer + phone + submitApi lane active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "submitApi").tween("avgMs", 0, 8).tween("curStep", 0, 1).badge("submit"))
  .phase("p2", {
    duration: 1800,
    title: "validate",
    body: "validator (zod) が schema check + 在庫確認 + 送料計算 + shipping address 検証。 successRate 0 → 92 tween (95% pass 想定)、 submitCount 15678 → 15679 tween、 avgMs 8 → 25 tween、 validator lane activate。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "submitApi", "validator").tween("successRate", 0, 92).tween("submitCount", 15678, 15679).tween("avgMs", 8, 25).tween("curStep", 1, 2).badge("validate"))
  .phase("p3", {
    duration: 2000,
    title: "OK 経路 (process)",
    body: "validate pass → orderDb に注文 commit + 受注確認番号発行。 successRate 92 keep、 avgMs 25 → 48 tween、 orderDb lane activate、 success 分岐 edge 発火、 buyer に confirmation 準備。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "submitApi", "validator", "orderDb").tween("avgMs", 25, 48).tween("curStep", 2, 3).badge("process"))
  .phase("p4", {
    duration: 2000,
    title: "NG 経路 (error 別 flow)",
    body: "並行で NG case (在庫不足 / address 不正) を error 分岐で表現、 errorSink に ValidationError 記録 + パターン集計。 successRate 92 keep (両経路併存)、 ngCount 423 → 424 tween、 avgMs 48 → 55 tween、 errorSink lane activate、 6 shape 全 active、 validate-process cycle 完遂。 patterns.cdl.ts business scenario 12/12 完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "submitApi", "validator", "orderDb", "errorSink").tween("ngCount", 423, 424).tween("avgMs", 48, 55).set("curStep", 3).badge("error"))
  .build();
