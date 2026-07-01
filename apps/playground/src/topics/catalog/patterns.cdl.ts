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
  .node("router", { lane: "l2", stack: 0, kind: "function", title: "API Gateway", subtitle: "粒子が貫通" })
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
export const patternHook = diagram("pattern-hook", { topic: "pattern: Hook callback" })
  .lane("sender", { x: 0, width: 280 })
  .lane("token", { x: 500, width: 380 })
  .lane("recipient", { x: 1280, width: 280 })
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
  .edge("client", "dist", { id: "e1", label: "submit", tone: "accent", style: "dotted-flow" })
  .edge("dist", "w1", { id: "e2", label: "→ w1", tone: "teal", style: "dotted-flow" })
  .edge("dist", "w2", { id: "e3", label: "→ w2", tone: "teal", style: "dotted-flow" })
  .edge("dist", "w3", { id: "e4", label: "→ w3", tone: "teal", style: "dotted-flow" })
  .phase("submit", { duration: 1800, title: "submit", body: "Producer が 1 入力を Dispatcher に submit。" }, (p: PhaseBuilder) => p.activate("client", "dist", "e1").badge("submit"))
  .phase("fanout", { duration: 1800, title: "fan-out", body: "Dispatcher が 3 worker に並列分配。" }, (p: PhaseBuilder) => p.activate("dist", "w1", "w2", "w3", "e2", "e3", "e4").badge("fan-out"))
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
  .edge("w1", "agg", { id: "e1", label: "result", tone: "teal", style: "dotted-flow" })
  .edge("w2", "agg", { id: "e2", label: "result", tone: "teal", style: "dotted-flow" })
  .edge("w3", "agg", { id: "e3", label: "result", tone: "teal", style: "dotted-flow" })
  .edge("agg", "store", { id: "e4", label: "write", tone: "warning", style: "dotted-flow" })
  .edge("store", "client", { id: "e5", label: "read", tone: "accent", style: "dotted-flow" })
  .phase("collect", { duration: 1800, title: "collect", body: "3 worker が結果を Aggregator に送る。" }, (p: PhaseBuilder) => p.activate("w1", "w2", "w3", "agg", "e1", "e2", "e3").badge("fan-in"))
  .phase("write", { duration: 1800, title: "write", body: "Aggregator が集約結果を store に書込。" }, (p: PhaseBuilder) => p.activate("agg", "store", "e4").badge("write"))
  .phase("read", { duration: 1800, title: "read", body: "Consumer が集約結果を取得。" }, (p: PhaseBuilder) => p.activate("store", "client", "e5").badge("read"))
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
  .edge("op", "db", { id: "e3", label: "tentative write", tone: "warning", style: "dotted-flow" })
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
