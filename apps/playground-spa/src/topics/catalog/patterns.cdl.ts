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
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "クライアント" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "サービス" })
  .edge("a", "b", { id: "e", label: "要求", sub: "node 端 stop", tone: "accent", style: "dotted-flow" })
  .phase("p", { duration: 2400, title: "直結", body: "粒子が クライアント 端 → サービス 端でstop、 node内には入らない。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("direct"))
  .build();

/** 2. 経由 node 貫通 (Passthrough) */
export const patternPassthrough = diagram("pattern-passthrough", { topic: "pattern: Passthrough (中継 node 貫通)" })
  .lane("l1", { x: L3_X1, width: L3_W_LR })
  .lane("l2", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("l3", { x: L3_X3, width: L3_W_LR })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "クライアント" })
  .node("router", { lane: "l2", stack: 0, kind: "function", title: "APIゲートウェイ", subtitle: "クライアント → サービス をrelay (proxy pattern)" })
  .node("c", { lane: "l3", stack: 0, kind: "function", title: "サービス" })
  .edge("a", "c", { id: "e", label: "クライアント → サービス", sub: "Gateway 経由", tone: "accent", style: "dotted-flow" })
  .phase("p", { duration: 2800, title: "貫通", body: "edgeパス が ゲートウェイ の上を通るため、 cdlがauto判定で粒子を ゲートウェイ 中央まで動かす。" }, (p: PhaseBuilder) => p.activate("a", "router", "c", "e").badge("through"))
  .build();

/** 3. call → read → write (関数内部処理) */
export const patternCallReadWrite = diagram("pattern-call-rw", { topic: "pattern: Call → Read → Write" })
  .lane("client", { x: L2_X1, width: L2_W })
  .lane("service", { x: L2_X2, width: 480, contain: true })
  .state("count", { initial: 100 })
  .node("user", { lane: "client", stack: 0, kind: "actor", title: "利用者", value: "{count}" })
  .node("fn", { lane: "service", stack: 0, kind: "function", title: "decrement(...)" })
  .node("storage", { lane: "service", stack: 1, kind: "storage", title: "カウンター テーブル", rows: ["User: {count}"] })
  .edge("user", "fn", { id: "call", label: "呼出", tone: "accent", style: "dotted-flow" })
  .edge("fn", "storage", { id: "read", label: "読取", tone: "teal", style: "dotted-flow" })
  .edge("fn", "storage", { id: "write", label: "書込", tone: "accent", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "呼出", body: "外部から関数呼び出し。" }, (p: PhaseBuilder) => p.activate("user", "fn", "call").badge("call"))
  .phase("read", { duration: 1800, title: "読取", body: "保存 から現在値を読む。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "read", "write").badge("read"))
  .phase("write", { duration: 1800, title: "書込", body: "保存 を更新。" }, (p: PhaseBuilder) => p.activate("fn", "storage", "write", "read").tween("count", 100, 90).badge("write"))
  .build();

/** 4. emit event (外部通知) */
export const patternEmit = diagram("pattern-emit", { topic: "pattern: Emit Event (外部通知)" })
  .lane("c", { x: L2_X1, width: L2_W })
  .lane("o", { x: L2_X2, width: L2_W })
  .node("fn", { lane: "c", stack: 0, kind: "function", title: "processOrder(...)" })
  .node("ev", { lane: "o", stack: 0, kind: "event", title: "OrderCreated", subtitle: "(orderId, userId, 合計)" })
  .edge("fn", "ev", { id: "emit", label: "発火", tone: "success", style: "dotted-flow" })
  .phase("p", { duration: 2400, title: "発火", body: "関数内で 発火 したイベントが イベントbus / ログ に書き込まれる。" }, (p: PhaseBuilder) => p.activate("fn", "ev", "emit").badge("emit"))
  .build();

/** 5. Hook callback ... 受信側 hook で「受け取れますか」 確認 */
// v10.5 = lane 間 gap を詰めて viewBox 1940 → 1300 相当に (scale 4.0 → 2.7 で label 判読性向上)。
// 旧配置 (x=0/500/1280) は lane 間 空白 400/400 world で label が実 DOM で 6-7 px に縮小、
// 新配置 (x=0/380/880) は lane 間 gap 100 world で節間の視覚 flow は維持しつつ全体を圧縮。
export const patternHook = diagram("pattern-hook", { topic: "pattern: Hook callback" })
  .lane("sender", { x: 0, width: 280 })
  .lane("token", { x: 380, width: 380 })
  .lane("recipient", { x: 880, width: 280 })
  .node("from", { lane: "sender", stack: 0, kind: "actor", title: "送信者" })
  .node("fn", { lane: "token", stack: 0, kind: "function", title: "配達", subtitle: "送付前hook" })
  .node("hook", { lane: "recipient", stack: 0, kind: "function", title: "onReceive", subtitle: "受信側で実装" })
  .edge("from", "fn", { id: "call", label: "呼出", tone: "accent", style: "dotted-flow" })
  .edge("fn", "hook", { id: "hook", label: "hookコールバック", sub: "受信可否確認", tone: "teal", style: "dotted-flow" })
  .phase("call", { duration: 1800, title: "呼出", body: "送信側が 配達 を呼ぶ。" }, (p: PhaseBuilder) => p.activate("from", "fn", "call").badge("call"))
  .phase("hook", { duration: 1800, title: "hookコールバック", body: "サービス が受信側のonReceive hookを呼んで「受け取れますか」 と確認。" }, (p: PhaseBuilder) => p.activate("fn", "hook", "hook").badge("hook"))
  .build();

/** 6. Branch (条件分岐 if/else) */
export const patternBranch = diagram("pattern-branch", { topic: "pattern: Branch (条件分岐)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("d", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .node("input", { lane: "u", stack: 0, kind: "actor", title: "入力" })
  .node("check", { lane: "d", stack: 0, kind: "function", title: "if (valid?)", subtitle: "分岐node" })
  .node("ok", { lane: "r", stack: 0, kind: "function", title: "処理()" })
  .node("ng", { lane: "r", stack: 1, kind: "event", title: "ValidationError" })
  .edge("input", "check", { id: "e1", label: "evaluate", tone: "accent", style: "dotted-flow" })
  .edge("check", "ok", { id: "e2", label: "真", tone: "success", style: "dotted-flow" })
  .edge("check", "ng", { id: "e3", label: "偽", tone: "error", style: "dotted-flow" })
  .phase("eval", { duration: 1800, title: "evaluate", body: "入力 を条件nodeに渡す。" }, (p: PhaseBuilder) => p.activate("input", "check", "e1").badge("evaluate"))
  .phase("true", { duration: 1800, title: "true経路", body: "条件成立で 処理 を呼ぶ。" }, (p: PhaseBuilder) => p.activate("check", "ok", "e2").badge("true"))
  .phase("false", { duration: 1800, title: "false経路", body: "条件不成立で エラー イベントを 発火。" }, (p: PhaseBuilder) => p.activate("check", "ng", "e3").badge("false"))
  .build();

/** 7. Loop (繰り返し処理) */
export const patternLoop = diagram("pattern-loop", { topic: "pattern: Loop (繰り返し処理)" })
  .lane("c", { x: L2_X1, width: L2_W })
  .lane("w", { x: L2_X2, width: 480, contain: true })
  .state("i", { initial: 0 })
  .node("client", { lane: "c", stack: 0, kind: "actor", title: "クライアント" })
  .node("iter", { lane: "w", stack: 0, kind: "function", title: "for i内 項目", subtitle: "ループnode" })
  .node("body", { lane: "w", stack: 1, kind: "function", title: "処理(項目)" })
  .edge("client", "iter", { id: "e1", label: "run", tone: "accent", style: "dotted-flow" })
  .edge("iter", "body", { id: "e2", label: "each項目", tone: "teal", style: "dotted-flow" })
  .phase("start", { duration: 1500, title: "開始", body: "クライアント が一括実行を呼ぶ。" }, (p: PhaseBuilder) => p.activate("client", "iter", "e1").badge("start"))
  .phase("iter1", { duration: 1500, title: "iter 1", body: "1 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 0, 1).badge("i=1"))
  .phase("iter2", { duration: 1500, title: "iter 2", body: "2 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 1, 2).badge("i=2"))
  .phase("iter3", { duration: 1500, title: "iter 3", body: "3 件目を処理。" }, (p: PhaseBuilder) => p.activate("iter", "body", "e2").tween("i", 2, 3).badge("i=3"))
  .build();

/** 8. Fan-out (1 入力 → 複数 worker) */
export const patternFanOut = diagram("pattern-fan-out", { topic: "pattern: Fan-out (1 入力 → 複数 worker)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("d", { x: L3_X2, width: L3_W_C })
  .lane("w", { x: L3_X3, width: L3_W_LR })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "生産者" })
  .node("dist", { lane: "d", stack: 0, kind: "function", title: "Dispatcher", subtitle: "分配" })
  .node("w1", { lane: "w", stack: 0, kind: "function", title: "ワーカー 1" })
  .node("w2", { lane: "w", stack: 1, kind: "function", title: "ワーカー 2" })
  .node("w3", { lane: "w", stack: 2, kind: "function", title: "ワーカー 3" })
  .edge("client", "dist", { id: "e1", label: "送信", tone: "accent", style: "solid" })
  .edge("dist", "w1", { id: "e2", label: "ジョブ1", tone: "teal", style: "solid" })
  .edge("dist", "w2", { id: "e3", label: "ジョブ2", tone: "teal", style: "solid" })
  .edge("dist", "w3", { id: "e4", label: "ジョブ3", tone: "teal", style: "solid" })
  .phase("submit", { duration: 1800, title: "送信", body: "生産者 が1入力をDispatcherに 送信。" }, (p: PhaseBuilder) => p.activate("client", "dist", "e1").badge("submit"))
  .phase("fanout", { duration: 1800, title: "fan-外", body: "Dispatcherが1ジョブ を3ワーカー に並列 配信(round-robin)、 各 ワーカー が独立処理。" }, (p: PhaseBuilder) => p.activate("dist", "w1", "w2", "w3", "e2", "e3", "e4").badge("fan-out"))
  .build();

/** 9. Fan-in (複数 worker → 集約) */
export const patternFanIn = diagram("pattern-fan-in", { topic: "pattern: Fan-in (複数 worker → 集約)" })
  .lane("w", { x: L3_X1, width: L3_W_LR })
  .lane("a", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("r", { x: L3_X3, width: L3_W_LR })
  .node("w1", { lane: "w", stack: 0, kind: "function", title: "ワーカー 1" })
  .node("w2", { lane: "w", stack: 1, kind: "function", title: "ワーカー 2" })
  .node("w3", { lane: "w", stack: 2, kind: "function", title: "ワーカー 3" })
  .node("agg", { lane: "a", stack: 0, kind: "function", title: "集約器", subtitle: "集約" })
  .node("store", { lane: "a", stack: 1, kind: "storage", title: "resultテーブル" })
  .node("client", { lane: "r", stack: 0, kind: "actor", title: "消費者" })
  .edge("w1", "agg", { id: "e1", label: "result 1", tone: "teal", style: "solid" })
  .edge("w2", "agg", { id: "e2", label: "result 2", tone: "teal", style: "solid" })
  .edge("w3", "agg", { id: "e3", label: "result 3", tone: "teal", style: "solid" })
  .edge("agg", "store", { id: "e4", label: "書込", tone: "warning", style: "solid" })
  .edge("store", "client", { id: "e5", label: "読取", tone: "accent", style: "solid" })
  .phase("collect", { duration: 1800, title: "collect", body: "3ワーカー が結果を 集約器 に送る。" }, (p: PhaseBuilder) => p.activate("w1", "w2", "w3", "agg", "e1", "e2", "e3").badge("fan-in"))
  .phase("write", { duration: 1800, title: "書込", body: "集約器 が集約結果をstoreに書込。" }, (p: PhaseBuilder) => p.activate("agg", "store", "e4").badge("write"))
  .phase("read", { duration: 1800, title: "読取", body: "消費者 が集約結果を取得。" }, (p: PhaseBuilder) => p.activate("store", "client", "e5").badge("read"))
  .build();

/** 10. Rollback (失敗時に元の状態へ巻き戻す) */
export const patternRollback = diagram("pattern-rollback", { topic: "pattern: Rollback (失敗時巻き戻し)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("t", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("s", { x: L3_X3, width: L3_W_LR })
  .state("balance", { initial: 100 })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "クライアント", value: "{balance}" })
  .node("tx", { lane: "t", stack: 0, kind: "function", title: "BEGIN tx" })
  .node("op", { lane: "t", stack: 1, kind: "function", title: "操作()" })
  .node("commit", { lane: "t", stack: 2, kind: "function", title: "コミット / ROLLBACK" })
  .node("db", { lane: "s", stack: 0, kind: "storage", title: "DB", rows: ["balance: {balance}"] })
  .edge("client", "tx", { id: "e1", label: "BEGIN", tone: "accent", style: "dotted-flow" })
  .edge("tx", "op", { id: "e2", label: "execute", tone: "teal", style: "dotted-flow" })
  .edge("op", "db", { id: "e3", label: "書込", tone: "warning", style: "dotted-flow" })
  .edge("op", "commit", { id: "e4", label: "オン エラー", tone: "error", style: "dotted-flow" })
  .edge("commit", "db", { id: "e5", label: "ROLLBACK", tone: "error", style: "dotted-flow" })
  .phase("begin", { duration: 1500, title: "BEGIN", body: "tx開始。" }, (p: PhaseBuilder) => p.activate("client", "tx", "e1").badge("BEGIN"))
  .phase("write", { duration: 1500, title: "tentative書込", body: "操作 内でDBを仮更新。" }, (p: PhaseBuilder) => p.activate("tx", "op", "db", "e2", "e3").tween("balance", 100, 80).badge("write"))
  .phase("rollback", { duration: 1500, title: "ROLLBACK", body: "失敗検知で元の値に巻き戻し。" }, (p: PhaseBuilder) => p.activate("op", "commit", "db", "e4", "e5", "e3").tween("balance", 80, 100).badge("ROLLBACK"))
  .build();

/** 11. Schedule (定期実行) */
export const patternSchedule = diagram("pattern-schedule", { topic: "pattern: Schedule (定期実行)" })
  .lane("s", { x: L3_X1, width: L3_W_LR })
  .lane("j", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("t", { x: L3_X3, width: L3_W_LR })
  .node("cron", { lane: "s", stack: 0, kind: "actor", title: "Cron", subtitle: "*/5 * * * *" })
  .node("scheduler", { lane: "j", stack: 0, kind: "function", title: "Scheduler", subtitle: "起動判定" })
  .node("job", { lane: "j", stack: 1, kind: "function", title: "ジョブ.run()" })
  .node("target", { lane: "t", stack: 0, kind: "function", title: "Targetサービス" })
  .edge("cron", "scheduler", { id: "e1", label: "tick", tone: "info", style: "dotted-flow" })
  .edge("scheduler", "job", { id: "e2", label: "起動", tone: "accent", style: "dotted-flow" })
  .edge("job", "target", { id: "e3", label: "呼出", tone: "teal", style: "dotted-flow" })
  .phase("tick", { duration: 1800, title: "tick", body: "Cronが5分ごとにtick。" }, (p: PhaseBuilder) => p.activate("cron", "scheduler", "e1").badge("tick"))
  .phase("trigger", { duration: 1800, title: "起動", body: "Schedulerが ジョブ を起動。" }, (p: PhaseBuilder) => p.activate("scheduler", "job", "e2").badge("trigger"))
  .phase("invoke", { duration: 1800, title: "呼出", body: "ジョブ がTargetを呼ぶ。" }, (p: PhaseBuilder) => p.activate("job", "target", "e3").badge("invoke"))
  .build();

/** 12. Validate → Process (検証後処理) */
export const patternValidateProcess = diagram("pattern-validate-process", { topic: "pattern: Validate → Process (検証後処理)" })
  .lane("u", { x: L3_X1, width: L3_W_LR })
  .lane("v", { x: L3_X2, width: L3_W_C, contain: true })
  .lane("p", { x: L3_X3, width: L3_W_LR })
  .node("client", { lane: "u", stack: 0, kind: "actor", title: "クライアント" })
  .node("validate", { lane: "v", stack: 0, kind: "function", title: "validate(入力)" })
  .node("schema", { lane: "v", stack: 1, kind: "storage", title: "スキーマ", rows: ["lib: zod / yup"] })
  .node("process", { lane: "p", stack: 0, kind: "function", title: "処理()" })
  .node("err", { lane: "p", stack: 1, kind: "event", title: "ValidationError" })
  .edge("client", "validate", { id: "e1", label: "送信", tone: "accent", style: "dotted-flow" })
  .edge("validate", "schema", { id: "e2", label: "チェック", tone: "teal", style: "dotted-flow" })
  .edge("validate", "process", { id: "e3", label: "OK", tone: "success", style: "dotted-flow" })
  .edge("validate", "err", { id: "e4", label: "NG", tone: "error", style: "dotted-flow" })
  .phase("submit", { duration: 1500, title: "送信", body: "クライアント が 入力 を送る。" }, (p: PhaseBuilder) => p.activate("client", "validate", "e1").badge("submit"))
  .phase("check", { duration: 1500, title: "チェック", body: "スキーマ で検証。" }, (p: PhaseBuilder) => p.activate("validate", "schema", "e2").badge("check"))
  .phase("ok", { duration: 1500, title: "OK", body: "検証成功で 処理。" }, (p: PhaseBuilder) => p.activate("validate", "process", "e3").badge("ok"))
  .phase("ng", { duration: 1500, title: "NG", body: "失敗時はValidationError発火。" }, (p: PhaseBuilder) => p.activate("validate", "err", "e4").badge("ng"))
  .build();

/**
 * 13. patternDirectCheckout v2 = pattern 1 Direct の business scenario 拡張 (EC 決済で顧客 → payment service 直結)、 shape-person + shape-mobile-device + shape-online-shop + shape-brokerage + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (商品選択 → checkout → 決済送信 → 確定) + 4 readout (gauge 決済進捗 / countup 累計注文 / stat 金額 / stat 平均処理秒) が tween で visually 連続変化。 iteration 8 wave 8-R redesign。 pattern 1 の抽象 patternDirect と並置、 diff-additive で教育資料保全。
 */
export const patternDirectCheckout = diagram("pattern-direct-checkout", {
  topic: "顧客がスマホから商品を選び、決済ゲートウェイ経由で注文確定するEC決済",
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
  .node("buyer", { lane: "buyer", stack: 0, kind: "shape-person", title: "購入者 岸様", eyebrow: "顧客", subtitle: "夜のオンライン買い物" })
  .node("phone", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "iPhoneのECアプリ", eyebrow: "端末", subtitle: "商品閲覧 + カート + 決済UI" })
  .node("shop", { lane: "service", stack: 0, kind: "shape-online-shop", title: "ECチェックアウト", eyebrow: "ショップ", subtitle: "商品明細 + 送料 + 合計計算" })
  .node("payGateway", { lane: "service", stack: 1, kind: "shape-brokerage", title: "決済 ゲートウェイ(Stripe)", eyebrow: "決済", subtitle: "card検証 + tokenize + settle" })
  .node("notify", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "通知 サービス", eyebrow: "通知", subtitle: "受注確認メール + プッシュ" })
  .node("orderDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "注文DB", eyebrow: "保存", subtitle: "確定注文 + 決済ref保存" })
  .edge("buyer", "phone", { label: "選ぶ", tone: "info" })
  .edge("phone", "shop", { label: "チェックアウト", tone: "info" })
  .edge("shop", "payGateway", { label: "charge (直結)", tone: "accent" })
  .edge("payGateway", "orderDb", { label: "確認", tone: "success" })
  .edge("orderDb", "notify", { label: "通知", tone: "success" })
  .readout.gauge("progG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "決済進捗 %" })
  .readout.countup("ordCU", { source: "orderCount", unit: " 件", label: "累計注文", decimals: 0 })
  .readout.stat("amtStat", { source: "amount", unit: " ¥", caption: "決済額", label: "金額" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "商品選択",
    body: "岸様がECアプリ 起動、 商品3点をカート追加。 progress 0 → 20 tween、 orderCount 452 keep、 金額0 → 15800 tween、 procSec 0 → 2 tween、 購入者 + スマホ + ショップlane active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "buyer-phone", "phone-shop").tween("progress", 0, 20).tween("amount", 0, 15800).tween("procSec", 0, 2).tween("curStep", 0, 1).badge("選択"))
  .phase("p2", {
    duration: 1800,
    title: "チェックアウト",
    body: "ショップ で送料 + 消費税計算、 決済 ゲートウェイ 情報入力欄表示。 progress 20 → 50 tween、 金額15800 → 17380 tween、 procSec 2 → 5 tween、 ショップlane継続active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "buyer-phone", "phone-shop").tween("progress", 20, 50).tween("amount", 15800, 17380).tween("procSec", 2, 5).tween("curStep", 1, 2).badge("checkout"))
  .phase("p3", {
    duration: 2000,
    title: "決済送信 (直結)",
    body: "ショップ → payGateway直結でcharge、 中継nodeなし(Direct pattern)、 Stripe側でtokenize + settle。 progress 50 → 85 tween、 procSec 5 → 8 tween、 payGateway lane activate、 直結edge accent発火。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payGateway", "buyer-phone", "phone-shop", "shop-payGateway").tween("progress", 50, 85).tween("procSec", 5, 8).tween("curStep", 2, 3).badge("charge"))
  .phase("p4", {
    duration: 2000,
    title: "確定",
    body: "決済OKでorderDb保存 + 通知サービス で受注確認メール送信。 progress 85 → 100 tween (ゲージ 針最上位)、 orderCount 452 → 453 tween、 procSec 8 → 10 tween、 orderDb + 通知lane activate、 6 shape全active、 決済完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "payGateway", "orderDb", "notify", "buyer-phone", "phone-shop", "shop-payGateway", "payGateway-orderDb", "orderDb-notify").tween("progress", 85, 100).tween("orderCount", 452, 453).tween("procSec", 8, 10).set("curStep", 3).badge("確定"))
  .build();

/**
 * 14. patternPassthroughApiGateway v2 = pattern 2 Passthrough の business scenario 拡張 (SaaS API request を API Gateway 経由で microservice に relay)、 shape-person + shape-mobile-device + shape-api-gateway + shape-server-rack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (Client request → Gateway route → Service 処理 → Response) + 4 readout (gauge レイテンシ / countup req/s / stat p99 ms / stat error 率) が tween で visually 連続変化。 iteration 8 wave 8-R redesign。 pattern 2 の抽象 patternPassthrough と並置。
 */
export const patternPassthroughApiGateway = diagram("pattern-passthrough-api-gateway", {
  topic: "APIリクエストがゲートウェイを貫通してマイクロサービスに到達、レスポンスを返すフロー",
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
  .node("apiUser", { lane: "client", stack: 0, kind: "shape-person", title: "API利用者 開発者", eyebrow: "開発者", subtitle: "自社 アプリ からREST API呼出" })
  .node("cliTool", { lane: "client", stack: 1, kind: "shape-mobile-device", title: "curl + Postman", eyebrow: "端末", subtitle: "取得 /API/v1/注文" })
  .node("apiGw", { lane: "gateway", stack: 0, kind: "shape-api-gateway", title: "APIゲートウェイ(Kong)", eyebrow: "ゲートウェイ", subtitle: "認証 + rate制限 + 経路(Passthrough)" })
  .node("orderSvc", { lane: "gateway", stack: 1, kind: "shape-server-rack", title: "orderマイクロサービス", eyebrow: "サービス", subtitle: "実業務ロジック実行 + DBクエリ" })
  .node("apm", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "Datadog APM", eyebrow: "apm", subtitle: "トレース + 指標 + アラート" })
  .node("logStore", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "ログ 保存", eyebrow: "保存", subtitle: "要求/応答 ログ30日保持" })
  .edge("apiUser", "cliTool", { label: "実行", tone: "info" })
  .edge("cliTool", "apiGw", { label: "取得 /API", tone: "info" })
  .edge("apiGw", "orderSvc", { label: "ルーティング", tone: "accent" })
  .edge("orderSvc", "apm", { label: "トレース", tone: "success" })
  .edge("apm", "logStore", { label: "persist", tone: "accent" })
  .readout.gauge("latG", { source: "latencyMs", min: 0, max: 500, color: "#22c55e", label: "レイテンシms" })
  .readout.countup("rpsCU", { source: "reqPerSec", unit: " req/s", label: "req/s", decimals: 0 })
  .readout.stat("p99Stat", { source: "p99Ms", unit: " ms", caption: "p99 遅延", label: "p99" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "クライアント 要求",
    body: "開発者がcurlで 取得 /API/v1/注文 送信。 latencyMs 0 → 15 tween、 reqPerSec 850 → 900 tween、 p99Ms 45 keep、 errorRate 0 keep、 apiUser + cliTool lane active。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiUser-cliTool").tween("latencyMs", 0, 15).tween("reqPerSec", 850, 900).tween("curStep", 0, 1).badge("request"))
  .phase("p2", {
    duration: 1800,
    title: "ゲートウェイroute (Passthrough)",
    body: "APIゲートウェイ でJWT認証 + rate制限 チェック + ルーティング テーブル 引き、 orderSvcにrelay。 latencyMs 15 → 45 tween、 reqPerSec 900 → 950 tween、 p99Ms 45 → 60 tween、 apiGw lane activate、 Passthrough edge発火。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw", "apiUser-cliTool", "cliTool-apiGw").tween("latencyMs", 15, 45).tween("reqPerSec", 900, 950).tween("p99Ms", 45, 60).tween("curStep", 1, 2).badge("route"))
  .phase("p3", {
    duration: 2000,
    title: "サービス 処理",
    body: "注文 マイクロサービス でSQLクエリ 実行 + business logic適用、 APMで トレース 送信。 latencyMs 45 → 120 tween、 p99Ms 60 → 145 tween、 errorRate 0 → 0.3 tween (微小)、 orderSvc + apm lane activate。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw", "orderSvc", "apm", "apiUser-cliTool", "cliTool-apiGw", "apiGw-orderSvc", "orderSvc-apm").tween("latencyMs", 45, 120).tween("p99Ms", 60, 145).tween("errorRate", 0, 0.3).tween("curStep", 2, 3).badge("処理"))
  .phase("p4", {
    duration: 2000,
    title: "応答 返却",
    body: "サービス → ゲートウェイ → クライアント の逆経路(Passthrough貫通)、 ログ 永続化。 latencyMs 120 → 155 tween (最終)、 reqPerSec 950 → 1020 tween、 errorRate 0.3 → 0.5 tween、 logStore activate、 6 shape全active、 API cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("apiUser", "cliTool", "apiGw", "orderSvc", "apm", "logStore", "apiUser-cliTool", "cliTool-apiGw", "apiGw-orderSvc", "orderSvc-apm", "apm-logStore").tween("latencyMs", 120, 155).tween("reqPerSec", 950, 1020).tween("errorRate", 0.3, 0.5).set("curStep", 3).badge("response"))
  .build();

/**
 * 15. patternCallRwUserProfile v2 = pattern 3 Call → Read → Write の business scenario 拡張 (SNS user プロフィール更新 = client call → 既存値 read → 更新値 write)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (client call → read profile → write update → confirm) + 4 readout (gauge write 進捗 / countup 更新回数 / stat 処理秒 / stat cache hit %) が tween で visually 連続変化。 iteration 8 wave 8-R redesign。 pattern 3 の抽象 patternCallReadWrite と並置。
 */
export const patternCallRwUserProfile = diagram("pattern-call-rw-user-profile", {
  topic: "SNSプロフィール更新の4ステップ、呼出から既存読取、更新書込、確認",
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
  .node("user", { lane: "user", stack: 0, kind: "shape-person", title: "SNS利用者 相川様", eyebrow: "利用者", subtitle: "自身のプロフィール編集中" })
  .node("app", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "SNSアプリprofile UI", eyebrow: "端末", subtitle: "編集form + Saveボタン" })
  .node("apiSvc", { lane: "service", stack: 0, kind: "shape-website", title: "プロファイルAPI", eyebrow: "API", subtitle: "更新 /users/{ID}/プロファイル" })
  .node("profileSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "プロフィールサービス", eyebrow: "サービス", subtitle: "読取 + 書込logic実行" })
  .node("profileDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "プロフィールDB (Postgres)", eyebrow: "保存", subtitle: "usersテーブル + プロファイルjsonb" })
  .node("cache", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "Redisキャッシュ", eyebrow: "キャッシュ", subtitle: "プロファイル スナップショット5最小TTL" })
  .edge("user", "app", { label: "編集", tone: "info" })
  .edge("app", "apiSvc", { label: "呼出 更新", tone: "info" })
  .edge("apiSvc", "profileSvc", { label: "進む", tone: "success" })
  .edge("profileSvc", "profileDb", { label: "読取 + 書込", tone: "accent" })
  .edge("profileSvc", "cache", { label: "無効化", tone: "warning" })
  .readout.gauge("wpG", { source: "writeProgress", min: 0, max: 100, color: "#22c55e", label: "書込 進捗 %" })
  .readout.countup("upCU", { source: "updateCount", unit: " 回", label: "累計更新", decimals: 0 })
  .readout.stat("secStat", { source: "procSec", unit: " 秒", caption: "処理秒", label: "sec" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "呼出(PUT要求)",
    body: "相川様が プロファイル 編集 → 保存 ボタン タップ、 アプリ が 更新 /users/{ID}/プロファイル 送信。 writeProgress 0 → 15 tween、 updateCount 2431 keep、 procSec 0 → 1 tween、 cacheHit 95 keep、 利用者 + アプリ + apiSvc lane active。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "user-app", "app-apiSvc").tween("writeProgress", 0, 15).tween("procSec", 0, 1).tween("curStep", 0, 1).badge("call"))
  .phase("p2", {
    duration: 1800,
    title: "読取(既存profile取得)",
    body: "profileSvcが既存 プロファイル をPostgresから 読取、 conflictチェック + 差分 算出。 writeProgress 15 → 45 tween、 procSec 1 → 3 tween、 cacheHit 95 → 82 tween (missでDB fallback)、 profileSvc + profileDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb", "user-app", "app-apiSvc", "apiSvc-profileSvc", "profileSvc-profileDb").tween("writeProgress", 15, 45).tween("procSec", 1, 3).tween("cacheHit", 95, 82).tween("curStep", 1, 2).badge("read"))
  .phase("p3", {
    duration: 2000,
    title: "書込(更新commit)",
    body: "差分 適用済 プロファイル をPostgresに 書込 + Redisキャッシュ 無効化。 writeProgress 45 → 85 tween、 updateCount 2431 → 2432 tween、 procSec 3 → 6 tween、 キャッシュlane activate、 キャッシュ 無効化flush。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb", "cache", "user-app", "app-apiSvc", "apiSvc-profileSvc", "profileSvc-profileDb", "profileSvc-cache").tween("writeProgress", 45, 85).tween("updateCount", 2431, 2432).tween("procSec", 3, 6).tween("curStep", 2, 3).badge("write"))
  .phase("p4", {
    duration: 1800,
    title: "確認(200 OK返却)",
    body: "profileSvcが200 OK + 更新後 プロファイル を クライアント に返却、 アプリUIに反映。 writeProgress 85 → 100 tween (ゲージ 針最上位)、 procSec 6 → 7 tween、 cacheHit 82 → 88 tween (再populate)、 6 shape全active、 プロファイル 更新cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "apiSvc", "profileSvc", "profileDb", "cache", "user-app", "app-apiSvc", "apiSvc-profileSvc", "profileSvc-profileDb", "profileSvc-cache").tween("writeProgress", 85, 100).tween("procSec", 6, 7).tween("cacheHit", 82, 88).set("curStep", 3).badge("confirm"))
  .build();

/**
 * 16. patternEmitOrderCreated v2 = pattern 4 Emit Event の business scenario 拡張 (EC 注文確定で OrderCreated event を emit → 複数 subscriber (メール / 在庫 / 分析) に fan-out)、 shape-person + shape-mobile-device + shape-online-shop + shape-stack + shape-cloud + shape-cylinder の 6 shape で visual scene 化、 4 phase (注文確定 → event emit → bus 中継 → subscriber 処理) + 4 readout (gauge 配信率 / countup 累計 event / stat subscriber 数 / stat latency ms) が tween で visually 連続変化。 iteration 8 wave 8-S redesign。 pattern 4 の抽象 patternEmit と並置。
 */
export const patternEmitOrderCreated = diagram("pattern-emit-order-created", {
  topic: "EC注文確定で注文作成イベントを発火、メールと在庫、分析にファンアウトする",
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
  .node("buyer", { lane: "client", stack: 0, kind: "shape-person", title: "購入者 桂様", eyebrow: "顧客", subtitle: "商品購入者" })
  .node("phone", { lane: "client", stack: 1, kind: "shape-mobile-device", title: "iPhoneのECアプリ", eyebrow: "端末", subtitle: "checkout完了 → OrderCreated" })
  .node("shop", { lane: "service", stack: 0, kind: "shape-online-shop", title: "ECサービス", eyebrow: "ショップ", subtitle: "processOrder()でevent発火" })
  .node("bus", { lane: "service", stack: 1, kind: "shape-stack", title: "イベントbus (Kafka)", eyebrow: "bus", subtitle: "OrderCreated topic + 3購読者" })
  .node("subscribers", { lane: "outcome", stack: 0, kind: "shape-cloud", title: "3購読者", eyebrow: "sub", subtitle: "email / 在庫 / 分析" })
  .node("eventLog", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "eventログDB", eyebrow: "保存", subtitle: "全event履歴 + 監査" })
  .edge("buyer", "phone", { label: "注文", tone: "info" })
  .edge("phone", "shop", { label: "確定", tone: "info" })
  .edge("shop", "bus", { label: "発火", tone: "success" })
  .edge("bus", "subscribers", { label: "fan-外", tone: "accent" })
  .edge("subscribers", "eventLog", { label: "persist", tone: "success" })
  .readout.gauge("delG", { source: "deliveryRate", min: 0, max: 100, color: "#22c55e", label: "配信率 %" })
  .readout.countup("evCU", { source: "eventCount", unit: " 件", label: "累計 イベント", decimals: 0 })
  .readout.stat("subStat", { source: "subCount", unit: " sub", caption: "subscriber", label: "sub" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "注文確定",
    body: "桂様が チェックアウト 完了、 ショップ でprocessOrder()実行(注文DB保存 + イベント 発火準備)。 deliveryRate 0 keep、 eventCount 8642 keep、 subCount 3 keep、 latency 0 → 2 tween、 購入者 + スマホ + ショップlane active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "buyer-phone", "phone-shop").tween("latency", 0, 2).tween("curStep", 0, 1).badge("確定"))
  .phase("p2", {
    duration: 1800,
    title: "イベントemit",
    body: "ショップ がOrderCreatedイベント をbusに 発火、 orderId + userId + 合計 をpayloadに含む。 deliveryRate 0 → 30 tween、 eventCount 8642 → 8643 tween、 latency 2 → 5 tween、 bus lane activate。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "bus", "buyer-phone", "phone-shop", "shop-bus").tween("deliveryRate", 0, 30).tween("eventCount", 8642, 8643).tween("latency", 2, 5).tween("curStep", 1, 2).badge("emit"))
  .phase("p3", {
    duration: 2000,
    title: "bus中継 + fan-外",
    body: "Kafka busがOrderCreated topicを3購読者(email / 在庫 / 分析)にfan-外。 deliveryRate 30 → 90 tween、 latency 5 → 12 tween、 subscribers lane activate、 3並列配信。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "bus", "subscribers", "buyer-phone", "phone-shop", "shop-bus", "bus-subscribers").tween("deliveryRate", 30, 90).tween("latency", 5, 12).tween("curStep", 2, 3).badge("fan-out"))
  .phase("p4", {
    duration: 2000,
    title: "購読者 処理 + ログ",
    body: "各 購読者 が独立処理(メール送信 / 在庫減算 / 分析集計)、 eventLogに イベント 履歴永続化。 deliveryRate 90 → 100 tween (ゲージ 針最上位)、 latency 12 → 18 tween、 eventLog lane activate、 6 shape全active、 イベント 配信cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "shop", "bus", "subscribers", "eventLog", "buyer-phone", "phone-shop", "shop-bus", "bus-subscribers", "subscribers-eventLog").tween("deliveryRate", 90, 100).tween("latency", 12, 18).set("curStep", 3).badge("処理"))
  .build();

/**
 * 17. patternHookWebhook v2 = pattern 5 Hook callback の business scenario 拡張 (SaaS 側で顧客の webhook endpoint に受信可否を確認しながら delivery)、 shape-server-rack + shape-cloud + shape-api-gateway + shape-website + shape-cylinder + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (delivery 準備 → hook 送信 → 顧客側検証 → 受信確定) + 4 readout (gauge success 率 / countup 累計 delivery / stat retry 回数 / stat 平均 ack ms) が tween で visually 連続変化。 iteration 8 wave 8-S redesign。 pattern 5 の抽象 patternHook と並置。
 */
export const patternHookWebhook = diagram("pattern-hook-webhook", {
  topic: "SaaSが顧客のWebhookエンドポイントに配信、受信可否確認から再試行、完了する流れ",
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
  .node("saasSvr", { lane: "saas", stack: 0, kind: "shape-server-rack", title: "SaaS通知svc", eyebrow: "saas", subtitle: "顧客Webhook subscribers管理" })
  .node("scheduler", { lane: "saas", stack: 1, kind: "shape-cloud", title: "配達scheduler", eyebrow: "scheduler", subtitle: "再試行 ポリシー + バックオフ" })
  .node("egress", { lane: "bridge", stack: 0, kind: "shape-api-gateway", title: "outboundゲートウェイ", eyebrow: "egress", subtitle: "HTTPS + signature署名" })
  .node("healthCheck", { lane: "bridge", stack: 1, kind: "shape-gear", title: "エンドポイントhealth probe", eyebrow: "probe", subtitle: "顧客 エンドポイント 可用性15sチェック" })
  .node("customerEp", { lane: "customer", stack: 0, kind: "shape-website", title: "顧客Webhookエンドポイント", eyebrow: "エンドポイント", subtitle: "投稿 /hooks/注文(顧客側実装)" })
  .node("deliveryLog", { lane: "customer", stack: 1, kind: "shape-cylinder", title: "deliveryログ", eyebrow: "保存", subtitle: "顧客別delivery + ack履歴" })
  .edge("saasSvr", "scheduler", { label: "キュー", tone: "info" })
  .edge("scheduler", "egress", { label: "配信", tone: "info" })
  .edge("egress", "customerEp", { label: "投稿 + hook", tone: "accent" })
  .edge("healthCheck", "customerEp", { label: "health probe", tone: "info" })
  .edge("egress", "deliveryLog", { label: "ログack", tone: "success" })
  .readout.gauge("sucG", { source: "successRate", min: 0, max: 100, color: "#22c55e", label: "成功 率 %" })
  .readout.countup("delCU", { source: "deliveryCount", unit: " 件", label: "累計配信", decimals: 0 })
  .readout.stat("retryStat", { source: "retryNum", unit: " 回", caption: "retry", label: "再試行" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "delivery準備",
    body: "SaaS側で顧客向け 通知 発生、 schedulerに キュー 投入 + 再試行 ポリシー 適用。 successRate 0 keep、 deliveryCount 15234 keep、 retryNum 0 keep、 ackMs 0 keep、 saasSvr + scheduler lane active。",
  }, (p: PhaseBuilder) => p.activate("saasSvr", "scheduler", "saasSvr-scheduler").tween("curStep", 0, 1).badge("準備"))
  .phase("p2", {
    duration: 1800,
    title: "hook送信",
    body: "scheduler → outboundゲートウェイ → 顧客 エンドポイント に 投稿 + signature署名、 ヘルスチェック で事前可用性確認。 successRate 0 → 40 tween、 deliveryCount 15234 → 15235 tween、 ackMs 0 → 80 tween、 egress + ヘルスチェックlane activate。",
  }, (p: PhaseBuilder) => p.activate("saasSvr", "scheduler", "egress", "healthCheck", "saasSvr-scheduler", "scheduler-egress").tween("successRate", 0, 40).tween("deliveryCount", 15234, 15235).tween("ackMs", 0, 80).tween("curStep", 1, 2).badge("送信"))
  .phase("p3", {
    duration: 2000,
    title: "顧客側検証",
    body: "顧客Webhookエンドポイント(onReceive hook)がsignature検証 + 受信可否判定、 一時的な5xxで1回 再試行 発火。 successRate 40 → 75 tween、 retryNum 0 → 1 tween、 ackMs 80 → 220 tween、 customerEp lane activate。",
  }, (p: PhaseBuilder) => p.activate("saasSvr", "scheduler", "egress", "healthCheck", "customerEp", "saasSvr-scheduler", "scheduler-egress", "egress-customerEp", "healthCheck-customerEp").tween("successRate", 40, 75).tween("retryNum", 0, 1).tween("ackMs", 80, 220).tween("curStep", 2, 3).badge("検証"))
  .phase("p4", {
    duration: 2000,
    title: "受信確定 + ログ",
    body: "再試行 で2xx ack受信、 deliveryLogに成功記録、 SaaS側 配達 状態 更新。 successRate 75 → 98 tween (ゲージ 針最上位)、 retryNum 1 keep、 ackMs 220 → 250 tween、 deliveryLog lane activate、 6 shape全active、 Webhook配達cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("saasSvr", "scheduler", "egress", "healthCheck", "customerEp", "deliveryLog", "saasSvr-scheduler", "scheduler-egress", "egress-customerEp", "healthCheck-customerEp", "egress-deliveryLog").tween("successRate", 75, 98).tween("ackMs", 220, 250).set("curStep", 3).badge("受信"))
  .build();

/**
 * 18. patternBranchAuthzCheck v2 = pattern 6 Branch (条件分岐) の business scenario 拡張 (SaaS 認可判定 = role check → allow / deny 分岐)、 shape-person + shape-mobile-device + shape-api-gateway + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (request → role check → allow 経路 → deny + audit) + 4 readout (gauge allow 率 / countup deny 累計 / stat 平均判定 ms / stat 監査 log 件数) が tween で visually 連続変化。 iteration 8 wave 8-S redesign。 pattern 6 の抽象 patternBranch と並置。
 */
export const patternBranchAuthzCheck = diagram("pattern-branch-authz-check", {
  topic: "SaaSの認可判定で権限確認、allowなら実行、denyなら403返却と監査記録",
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
  .node("user", { lane: "user", stack: 0, kind: "shape-person", title: "SaaS利用者 三宅様", eyebrow: "利用者", subtitle: "ロール: 編集者 · admin権限なし" })
  .node("app", { lane: "user", stack: 1, kind: "shape-mobile-device", title: "SaaS Webアプリ", eyebrow: "端末", subtitle: "削除 /projects/{ID} 実行" })
  .node("authz", { lane: "service", stack: 0, kind: "shape-api-gateway", title: "認可middleware", eyebrow: "認可", subtitle: "ロール + policy評価" })
  .node("apiSvc", { lane: "service", stack: 1, kind: "shape-server-rack", title: "project API", eyebrow: "API", subtitle: "allow時のみ実行 / deny時403" })
  .node("policyDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "ポリシー DB", eyebrow: "ポリシー", subtitle: "ロール → resource → 動作grant地図" })
  .node("auditSink", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "auditログsink", eyebrow: "監査", subtitle: "allow / deny全event記録" })
  .edge("user", "app", { label: "削除 試行", tone: "info" })
  .edge("app", "authz", { label: "ロール チェック", tone: "info" })
  .edge("authz", "policyDb", { label: "lookup", tone: "success" })
  .edge("authz", "apiSvc", { label: "allow (真)", tone: "success" })
  .edge("authz", "auditSink", { label: "deny (偽) + ログ", tone: "error" })
  .readout.gauge("alwG", { source: "allowRate", min: 0, max: 100, color: "#22c55e", label: "allow率 %" })
  .readout.countup("denyCU", { source: "denyCount", unit: " 件", label: "deny累計", decimals: 0 })
  .readout.stat("chStat", { source: "checkMs", unit: " ms", caption: "判定時間", label: "チェック" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "要求",
    body: "三宅様が 削除 /projects/42実行、 認可middlewareに到達。 allowRate 100 keep、 denyCount 87 keep、 checkMs 0 → 2 tween、 auditLogs 12451 → 12452 tween、 利用者 + アプリ + 認可lane active。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "authz", "user-app", "app-authz").tween("checkMs", 0, 2).tween("auditLogs", 12451, 12452).tween("curStep", 0, 1).badge("request"))
  .phase("p2", {
    duration: 1800,
    title: "ロールcheck",
    body: "認可 がpolicyDbをlookup、 三宅様の ロール(編集者)と 削除 動作 のgrantを評価。 allowRate 100 → 88 tween (編集者 削除 不可判定)、 checkMs 2 → 6 tween、 policyDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "authz", "policyDb", "user-app", "app-authz", "authz-policyDb").tween("allowRate", 100, 88).tween("checkMs", 2, 6).tween("curStep", 1, 2).badge("check"))
  .phase("p3", {
    duration: 2000,
    title: "deny経路",
    body: "ポリシー 評価結果 = deny (編集者 は 削除 権限なし)、 apiSvcは呼ばず403 Forbidden即座返却。 allowRate 88 keep (deniedで分岐)、 denyCount 87 → 88 tween、 checkMs 6 → 9 tween、 分岐edgeエラー 発火。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "authz", "policyDb", "user-app", "app-authz", "authz-policyDb").tween("denyCount", 87, 88).tween("checkMs", 6, 9).tween("curStep", 2, 3).badge("deny"))
  .phase("p4", {
    duration: 2000,
    title: "auditログ + 通知",
    body: "auditSinkにdenyイベント 記録 + SecOpsに高頻度denyアラート 通知、 apiSvcは不動作(safe)。 allowRate 88 keep、 denyCount 88 keep、 checkMs 9 → 10 tween、 auditLogs 12452 → 12453 tween、 auditSink + apiSvc lane activate (apiSvcはinactive表示)、 6 shape全active、 認可cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("user", "app", "authz", "policyDb", "apiSvc", "auditSink", "user-app", "app-authz", "authz-policyDb", "authz-apiSvc", "authz-auditSink").tween("checkMs", 9, 10).tween("auditLogs", 12452, 12453).set("curStep", 3).badge("audit"))
  .build();

/**
 * 19. patternLoopBatchImport v2 = pattern 7 Loop の business scenario 拡張 (CSV 100 行を 1 行ずつ import + validate + DB 挿入する batch job)、 shape-person + shape-mobile-device + shape-server-rack + shape-cylinder + shape-cloud + shape-iot-sensor の 6 shape で visual scene 化、 4 phase (start → 進行中 33% → 進行中 66% → 完了) + 4 readout (gauge 進捗 / countup 処理行 / stat エラー行 / stat 平均 ms/row) が tween で visually 連続変化。 iteration 8 wave 8-T redesign。 pattern 7 の抽象 patternLoop と並置。
 */
export const patternLoopBatchImport = diagram("pattern-loop-batch-import", {
  topic: "CSVの100行を1行ずつ検証してDB挿入するバッチジョブの進捗",
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
  .node("admin", { lane: "admin", stack: 0, kind: "shape-person", title: "admin中森様", eyebrow: "admin", subtitle: "CSVバッチimport実行者" })
  .node("laptop", { lane: "admin", stack: 1, kind: "shape-mobile-device", title: "admin console", eyebrow: "端末", subtitle: "バッチジョブ 起動 + 進捗monitoring" })
  .node("worker", { lane: "worker", stack: 0, kind: "shape-server-rack", title: "バッチ ワーカー", eyebrow: "ワーカー", subtitle: "for行 内csv: validate + 挿入" })
  .node("progressSensor", { lane: "worker", stack: 1, kind: "shape-iot-sensor", title: "progress sensor", eyebrow: "sensor", subtitle: "per-行 状態emit + WebSocket送信" })
  .node("db", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "target DB", eyebrow: "保存", subtitle: "挿入100行 + transaction 100バッチ" })
  .node("notify", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "通知サービス", eyebrow: "通知", subtitle: "完了時email + Slack通知" })
  .edge("admin", "laptop", { label: "開始", tone: "info" })
  .edge("laptop", "worker", { label: "runジョブ", tone: "info" })
  .edge("worker", "progressSensor", { label: "発火tick", tone: "success" })
  .edge("worker", "db", { label: "挿入(loop)", tone: "accent" })
  .edge("worker", "notify", { label: "complete", tone: "success" })
  .readout.gauge("prgG", { source: "progress", min: 0, max: 100, color: "#22c55e", label: "進捗 %" })
  .readout.countup("procCU", { source: "processed", unit: " row", label: "処理済", decimals: 0 })
  .readout.stat("errStat", { source: "errRows", unit: " row", caption: "error 行", label: "err" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "開始(行0)",
    body: "中森様がadmin consoleから バッチジョブ 起動、 ワーカー がCSV parse + validate準備。 progress 0 → 5 tween、 processed 0 keep、 errRows 0 keep、 avgMs 0 → 8 tween、 admin + ノートPC + ワーカー lane active。",
  }, (p: PhaseBuilder) => p.activate("admin", "laptop", "worker", "admin-laptop", "laptop-worker").tween("progress", 0, 5).tween("avgMs", 0, 8).tween("curStep", 0, 1).badge("start"))
  .phase("p2", {
    duration: 2000,
    title: "進行中 33% (行 33)",
    body: "for loopで行1-33をvalidate + 挿入、 1行fail (encodingエラー)。 progress 5 → 33 tween、 processed 0 → 33 tween、 errRows 0 → 1 tween、 avgMs 8 → 12 tween、 progressSensor + DB lane activate。",
  }, (p: PhaseBuilder) => p.activate("admin", "laptop", "worker", "progressSensor", "db", "admin-laptop", "laptop-worker", "worker-progressSensor", "worker-db").tween("progress", 5, 33).tween("processed", 0, 33).tween("errRows", 0, 1).tween("avgMs", 8, 12).tween("curStep", 1, 2).badge("33%"))
  .phase("p3", {
    duration: 2000,
    title: "進行中 66% (行 66)",
    body: "行34-66継続処理、 2行fail (duplicate key)。 progress 33 → 66 tween、 processed 33 → 66 tween、 errRows 1 → 3 tween、 avgMs 12 → 15 tween、 DB transactionコミット 継続。",
  }, (p: PhaseBuilder) => p.activate("admin", "laptop", "worker", "progressSensor", "db", "admin-laptop", "laptop-worker", "worker-progressSensor", "worker-db").tween("progress", 33, 66).tween("processed", 33, 66).tween("errRows", 1, 3).tween("avgMs", 12, 15).tween("curStep", 2, 3).badge("66%"))
  .phase("p4", {
    duration: 2000,
    title: "完了 (行 100)",
    body: "残り34行完了、 通知 でemail + Slack通知送信、 エラー ログ は別出力。 progress 66 → 100 tween (ゲージ 針最上位)、 processed 66 → 100 tween、 errRows 3 keep、 avgMs 15 → 14 tween (安定)、 通知lane activate、 6 shape全active、 バッチimport cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("admin", "laptop", "worker", "progressSensor", "db", "notify", "admin-laptop", "laptop-worker", "worker-progressSensor", "worker-db", "worker-notify").tween("progress", 66, 100).tween("processed", 66, 100).tween("avgMs", 15, 14).set("curStep", 3).badge("100%"))
  .build();

/**
 * 20. patternFanOutVideoTranscode v2 = pattern 8 Fan-out の business scenario 拡張 (動画 upload 1 本を 3 解像度 (480p/720p/1080p) に並列 transcode)、 shape-person + shape-mobile-device + shape-cloud + shape-server-rack + shape-cdn-edge + shape-cylinder の 6 shape で visual scene 化、 4 phase (upload → dispatch → 3 並列 transcode → 全解像度公開) + 4 readout (gauge 完了率 / countup 累計動画 / stat 総処理秒 / stat 平均 MB) が tween で visually 連続変化。 iteration 8 wave 8-T redesign。 pattern 8 の抽象 patternFanOut と並置。
 */
export const patternFanOutVideoTranscode = diagram("pattern-fanout-video-transcode", {
  topic: "動画アップロード1本を480pと720p、1080pの3解像度に並列変換してCDN配信",
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
  .node("creator", { lane: "creator", stack: 0, kind: "shape-person", title: "creator川島様", eyebrow: "creator", subtitle: "動画配信サービスの動画投稿者" })
  .node("phone", { lane: "creator", stack: 1, kind: "shape-mobile-device", title: "iPhone + 動画アプリ", eyebrow: "端末", subtitle: "録画 + upload UI + 進捗 モニター" })
  .node("dispatcher", { lane: "cluster", stack: 0, kind: "shape-cloud", title: "transcode dispatcher", eyebrow: "dispatcher", subtitle: "1ジョブ を3ワーカー にfan-外" })
  .node("workers", { lane: "cluster", stack: 1, kind: "shape-server-rack", title: "3 transcodeワーカー", eyebrow: "ワーカー", subtitle: "ワーカー 1 = 480p / 2 = 720p / 3 = 1080p" })
  .node("cdn", { lane: "outcome", stack: 0, kind: "shape-cdn-edge", title: "動画CDNエッジ", eyebrow: "CDN", subtitle: "全3解像度配信 + edgeキャッシュ" })
  .node("mediaDb", { lane: "outcome", stack: 1, kind: "shape-cylinder", title: "media DB", eyebrow: "保存", subtitle: "video_id → 3 resolution URL地図" })
  .edge("creator", "phone", { label: "録画", tone: "info" })
  .edge("phone", "dispatcher", { label: "アップロード", tone: "info" })
  .edge("dispatcher", "workers", { label: "並列分配", tone: "accent" })
  .edge("workers", "cdn", { label: "配信", tone: "success" })
  .edge("cdn", "mediaDb", { label: "URL登録", tone: "success" })
  .readout.gauge("comG", { source: "completionRate", min: 0, max: 100, color: "#22c55e", label: "完了率 %" })
  .readout.countup("vidCU", { source: "videoCount", unit: " 本", label: "累計動画", decimals: 0 })
  .readout.stat("secStat", { source: "totalSec", unit: " 秒", caption: "総処理", label: "sec" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "upload",
    body: "川島様がiPhoneで録画完了、 300 MB原本をdispatcherにupload。 completionRate 0 → 15 tween、 videoCount 3821 keep、 totalSec 0 → 20 tween、 avgMb 0 → 300 tween、 creator + スマホ + dispatcher lane active。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "dispatcher", "creator-phone", "phone-dispatcher").tween("completionRate", 0, 15).tween("totalSec", 0, 20).tween("avgMb", 0, 300).tween("curStep", 0, 1).badge("upload"))
  .phase("p2", {
    duration: 1800,
    title: "配信(fan-外3)",
    body: "dispatcherが1原本を3ワーカー に並列 ジョブ 投入(480p / 720p / 1080p各1ワーカー)。 completionRate 15 → 35 tween、 totalSec 20 → 35 tween、 workers lane activate、 3並列 ジョブkick。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "dispatcher", "workers", "creator-phone", "phone-dispatcher", "dispatcher-workers").tween("completionRate", 15, 35).tween("totalSec", 20, 35).tween("curStep", 1, 2).badge("dispatch"))
  .phase("p3", {
    duration: 2200,
    title: "3並列transcode",
    body: "3ワーカー が独立にH.264 transcode実行、 完了順にCDN発行 済、 mediaDbにURL登録。 completionRate 35 → 90 tween、 totalSec 35 → 120 tween、 avgMb 300 → 180 tween (圧縮効果)、 CDN + mediaDb lane activate。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "dispatcher", "workers", "cdn", "mediaDb", "creator-phone", "phone-dispatcher", "dispatcher-workers", "workers-cdn", "cdn-mediaDb").tween("completionRate", 35, 90).tween("totalSec", 35, 120).tween("avgMb", 300, 180).tween("curStep", 2, 3).badge("transcode"))
  .phase("p4", {
    duration: 2000,
    title: "全解像度公開",
    body: "3解像度全 発行 完了、 川島様に通知 + CDN全edgeに伝播完了。 completionRate 90 → 100 tween (ゲージ 針最上位)、 videoCount 3821 → 3822 tween、 totalSec 120 → 135 tween、 avgMb 180 keep、 6 shape全active、 動画公開cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("creator", "phone", "dispatcher", "workers", "cdn", "mediaDb", "creator-phone", "phone-dispatcher", "dispatcher-workers", "workers-cdn", "cdn-mediaDb").tween("completionRate", 90, 100).tween("videoCount", 3821, 3822).tween("totalSec", 120, 135).set("curStep", 3).badge("公開"))
  .build();

/**
 * 21. patternFanInMapReduce v2 = pattern 9 Fan-in の business scenario 拡張 (3 shard から集計結果を 1 aggregator に fan-in する MapReduce 風 集計 job)、 shape-server-rack + shape-cloud + shape-cylinder + shape-brokerage + shape-mobile-device + shape-person の 6 shape で visual scene 化、 4 phase (shard 起動 → 並列 map → aggregator fan-in → 結果配信) + 4 readout (gauge aggregate 進捗 / countup 集計 job / stat total records / stat 全体秒) が tween で visually 連続変化。 iteration 8 wave 8-T redesign。 pattern 9 の抽象 patternFanIn と並置。
 */
export const patternFanInMapReduce = diagram("pattern-fanin-mapreduce", {
  topic: "3シャードの集計結果を1つの集約器にまとめるMapReduce処理",
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
  .node("shardCluster", { lane: "shards", stack: 0, kind: "shape-server-rack", title: "3シャード クラスター", eyebrow: "shards", subtitle: "us-東 / eu-西 / ap-南" })
  .node("shardStorage", { lane: "shards", stack: 1, kind: "shape-cylinder", title: "3シャードDB", eyebrow: "保存", subtitle: "各shard = 1M record保持" })
  .node("aggSvc", { lane: "aggregator", stack: 0, kind: "shape-gear", title: "集約器 サービス", eyebrow: "集約器", subtitle: "3シャードresultを集約 + reduce" })
  .node("aggCloud", { lane: "aggregator", stack: 1, kind: "shape-cloud", title: "compute pool", eyebrow: "compute", subtitle: "reduce phaseのcompute割当" })
  .node("analyst", { lane: "consumer", stack: 0, kind: "shape-person", title: "analyst川口様", eyebrow: "analyst", subtitle: "集計結果review + Slack共有" })
  .node("dashboard", { lane: "consumer", stack: 1, kind: "shape-mobile-device", title: "BIダッシュボード", eyebrow: "端末", subtitle: "集計KPI + 時系列chart" })
  .edge("shardCluster", "aggSvc", { label: "地図result", tone: "success" })
  .edge("shardStorage", "shardCluster", { label: "読取", tone: "info" })
  .edge("aggSvc", "aggCloud", { label: "compute", tone: "accent" })
  .edge("aggSvc", "dashboard", { label: "発行", tone: "success" })
  .edge("dashboard", "analyst", { label: "レビュー", tone: "info" })
  .readout.gauge("agG", { source: "aggPct", min: 0, max: 100, color: "#22c55e", label: "aggregate %" })
  .readout.countup("jobCU", { source: "jobCount", unit: " job", label: "集計 ジョブ 累計", decimals: 0 })
  .readout.stat("recStat", { source: "totalRecs", unit: " M", caption: "総 record", label: "recs" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "shard起動",
    body: "3リージョン シャード クラスター に集計 ジョブ 投入、 各 シャード が独立 読取 + 地図 フェーズ 準備。 aggPct 0 → 10 tween、 jobCount 214 keep、 totalRecs 0 → 1 tween、 elapsedSec 0 → 8 tween、 shardCluster + shardStorage lane active。",
  }, (p: PhaseBuilder) => p.activate("shardCluster", "shardStorage", "shardStorage-shardCluster").tween("aggPct", 0, 10).tween("totalRecs", 0, 1).tween("elapsedSec", 0, 8).tween("curStep", 0, 1).badge("起動"))
  .phase("p2", {
    duration: 2000,
    title: "並列map",
    body: "3シャード が独立に 地図 実行(各1M記録)、 中間結果を 集約器 に 送信。 aggPct 10 → 55 tween、 totalRecs 1 → 3 tween、 elapsedSec 8 → 45 tween、 aggSvc lane activate、 fan-内edge発火。",
  }, (p: PhaseBuilder) => p.activate("shardCluster", "shardStorage", "aggSvc", "shardCluster-aggSvc", "shardStorage-shardCluster").tween("aggPct", 10, 55).tween("totalRecs", 1, 3).tween("elapsedSec", 8, 45).tween("curStep", 1, 2).badge("map"))
  .phase("p3", {
    duration: 2000,
    title: "集約器fan-内 + reduce",
    body: "集約器 が3シャード 結果を集約 + reduce実行、 compute poolで並列processing。 aggPct 55 → 90 tween、 jobCount 214 → 215 tween、 elapsedSec 45 → 75 tween、 aggCloud lane activate。",
  }, (p: PhaseBuilder) => p.activate("shardCluster", "shardStorage", "aggSvc", "aggCloud", "shardCluster-aggSvc", "shardStorage-shardCluster", "aggSvc-aggCloud").tween("aggPct", 55, 90).tween("jobCount", 214, 215).tween("elapsedSec", 45, 75).tween("curStep", 2, 3).badge("reduce"))
  .phase("p4", {
    duration: 2000,
    title: "結果配信",
    body: "集計結果をBIダッシュボード に 発行、 川口様がグラフ レビュー + Slack共有。 aggPct 90 → 100 tween (ゲージ 針最上位)、 totalRecs 3 keep、 elapsedSec 75 → 85 tween、 ダッシュボード + analyst lane activate、 6 shape全active、 MapReduce cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("shardCluster", "shardStorage", "aggSvc", "aggCloud", "dashboard", "analyst", "shardCluster-aggSvc", "shardStorage-shardCluster", "aggSvc-aggCloud", "aggSvc-dashboard", "dashboard-analyst").tween("aggPct", 90, 100).tween("elapsedSec", 75, 85).set("curStep", 3).badge("配信"))
  .build();

/**
 * 22. patternRollbackBankTransfer v2 = pattern 10 Rollback の business scenario 拡張 (銀行送金 tx で送信側 debit + 受信側 credit の atomic 更新、 失敗時 rollback)、 shape-person + shape-mobile-device + shape-bank + shape-brokerage + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (BEGIN → debit + credit → 検証 fail → ROLLBACK) + 4 readout (gauge tx 進捗 / countup 累計 tx / stat rollback 件数 / stat 平均 ms) が tween で visually 連続変化。 iteration 8 wave 8-U redesign。 pattern 10 の抽象 patternRollback と並置。
 */
export const patternRollbackBankTransfer = diagram("pattern-rollback-bank-transfer", {
  topic: "銀行送金トランザクションで出金と入金をアトミック更新、失敗時にロールバックして安全に戻す",
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
  .node("sender", { lane: "sender", stack: 0, kind: "shape-person", title: "送金者 田代様", eyebrow: "送信者", subtitle: "口座残高 100万 → 20万送金試行" })
  .node("mobile", { lane: "sender", stack: 1, kind: "shape-mobile-device", title: "銀行 モバイル アプリ", eyebrow: "端末", subtitle: "送金form + confirmation UI" })
  .node("issuer", { lane: "bank", stack: 0, kind: "shape-bank", title: "送信元 銀行(MUFG)", eyebrow: "issuer", subtitle: "debit実行 + tx logging" })
  .node("txSvc", { lane: "bank", stack: 1, kind: "shape-gear", title: "tx編成器", eyebrow: "tx", subtitle: "BEGIN / コミット / ROLLBACK制御" })
  .node("ledger", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "元帳DB", eyebrow: "ledger", subtitle: "atomic更新or完全巻き戻し" })
  .node("alerting", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "SecOps alerting", eyebrow: "アラート", subtitle: "rollback event通知 + 監査" })
  .edge("sender", "mobile", { label: "送金操作", tone: "info" })
  .edge("mobile", "issuer", { label: "コミット 要求", tone: "info" })
  .edge("issuer", "txSvc", { label: "BEGIN tx", tone: "accent" })
  .edge("txSvc", "ledger", { label: "debit / credit", tone: "warning" })
  .edge("ledger", "alerting", { label: "ROLLBACK通知", tone: "error" })
  .readout.gauge("txG", { source: "txProgress", min: 0, max: 100, color: "#22c55e", label: "tx進捗 %" })
  .readout.countup("txCU", { source: "txCount", unit: " 件", label: "累計tx", decimals: 0 })
  .readout.stat("rlbStat", { source: "rollbackCount", unit: " 件", caption: "rollback", label: "rlb" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "BEGIN tx",
    body: "田代様が20万送金 確認、 銀行 がtx編成器 にBEGIN発行。 txProgress 0 → 20 tween、 txCount 52341 keep、 rollbackCount 128 keep、 avgMs 0 → 15 tween、 送信者 + モバイル + issuer + txSvc lane active。",
  }, (p: PhaseBuilder) => p.activate("sender", "mobile", "issuer", "txSvc", "sender-mobile", "mobile-issuer", "issuer-txSvc").tween("txProgress", 0, 20).tween("avgMs", 0, 15).tween("curStep", 0, 1).badge("BEGIN"))
  .phase("p2", {
    duration: 2000,
    title: "debit + credit (tentative)",
    body: "元帳DBで送信元debit (-20万) + 受信側credit (+20万)をtentative書込、 コミット 前の中間状態。 txProgress 20 → 65 tween、 avgMs 15 → 65 tween、 ledger lane activate、 debit / credit 2 edge発火。",
  }, (p: PhaseBuilder) => p.activate("sender", "mobile", "issuer", "txSvc", "ledger", "sender-mobile", "mobile-issuer", "issuer-txSvc", "txSvc-ledger").tween("txProgress", 20, 65).tween("avgMs", 15, 65).tween("curStep", 1, 2).badge("debit/credit"))
  .phase("p3", {
    duration: 2000,
    title: "検証fail検知",
    body: "受信側口座でAMLチェックfail (制裁国口座)、 tx編成器 がROLLBACK判定。 txProgress 65 → 45 tween (下降)、 avgMs 65 → 120 tween、 エラー 分岐発火、 SecOps通知準備。",
  }, (p: PhaseBuilder) => p.activate("sender", "mobile", "issuer", "txSvc", "ledger", "sender-mobile", "mobile-issuer", "issuer-txSvc", "txSvc-ledger").tween("txProgress", 65, 45).tween("avgMs", 65, 120).tween("curStep", 2, 3).badge("fail"))
  .phase("p4", {
    duration: 2000,
    title: "ROLLBACK + 監査",
    body: "元帳をdebit / credit前の残高に完全巻き戻し、 alertingでSecOps通知 + txログ 記録。 txProgress 45 → 0 tween (全ゼロ復帰)、 txCount 52341 → 52342 tween (試行として 数)、 rollbackCount 128 → 129 tween、 avgMs 120 → 180 tween (最終)、 alerting lane activate、 6 shape全active、 rollback cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("sender", "mobile", "issuer", "txSvc", "ledger", "alerting", "sender-mobile", "mobile-issuer", "issuer-txSvc", "txSvc-ledger", "ledger-alerting").tween("txProgress", 45, 0).tween("txCount", 52341, 52342).tween("rollbackCount", 128, 129).tween("avgMs", 120, 180).set("curStep", 3).badge("ROLLBACK"))
  .build();

/**
 * 23. patternScheduleReportJob v2 = pattern 11 Schedule の business scenario 拡張 (Cron 5 分毎に定期実行される週次 KPI report 集計 job)、 shape-iot-sensor + shape-cloud + shape-server-rack + shape-brokerage + shape-cylinder + shape-person の 6 shape で visual scene 化、 4 phase (tick → scheduler trigger → job 実行 → report 配信) + 4 readout (gauge job 進捗 / countup 累計実行 / stat 平均秒 / stat next tick 分) が tween で visually 連続変化。 iteration 8 wave 8-U redesign。 pattern 11 の抽象 patternSchedule と並置。
 */
export const patternScheduleReportJob = diagram("pattern-schedule-report-job", {
  topic: "Cronが5分ごとにtickして週次KPIレポート集計ジョブを起動、配信",
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
  .node("cron", { lane: "scheduler", stack: 0, kind: "shape-iot-sensor", title: "Cron */5 * * * *", eyebrow: "Cron", subtitle: "5分毎tick発火 + drift監視" })
  .node("schedulerSvc", { lane: "scheduler", stack: 1, kind: "shape-cloud", title: "schedulerサービス", eyebrow: "scheduler", subtitle: "ジョブ キュー + concurrency制御" })
  .node("worker", { lane: "job", stack: 0, kind: "shape-server-rack", title: "reportワーカー", eyebrow: "ワーカー", subtitle: "週次KPI集計(売上 / users / churn)" })
  .node("compute", { lane: "job", stack: 1, kind: "shape-gear", title: "compute engine", eyebrow: "compute", subtitle: "BigQuery + aggregate function" })
  .node("reportStore", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "report store", eyebrow: "保存", subtitle: "週次report履歴 + PDF生成" })
  .node("stakeholder", { lane: "outcome", stack: 1, kind: "shape-person", title: "stakeholder岩田様", eyebrow: "reader", subtitle: "経営会議でreportレビュー" })
  .edge("cron", "schedulerSvc", { label: "tick", tone: "info" })
  .edge("schedulerSvc", "worker", { label: "起動", tone: "accent" })
  .edge("worker", "compute", { label: "aggregate", tone: "success" })
  .edge("worker", "reportStore", { label: "persist", tone: "success" })
  .edge("reportStore", "stakeholder", { label: "配信", tone: "info" })
  .readout.gauge("jpG", { source: "jobProgress", min: 0, max: 100, color: "#22c55e", label: "ジョブ 進捗 %" })
  .readout.countup("runCU", { source: "runCount", unit: " 回", label: "累計実行", decimals: 0 })
  .readout.stat("secStat", { source: "avgSec", unit: " 秒", caption: "平均", label: "sec" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "Cron tick",
    body: "Cronが */5 minuteのtick発火、 schedulerサービス に ジョブ 起動要求。 jobProgress 0 → 10 tween、 runCount 8721 keep、 avgSec 0 → 2 tween、 nextMin 5 → 5 keep、 Cron + schedulerSvc lane active。",
  }, (p: PhaseBuilder) => p.activate("cron", "schedulerSvc", "cron-schedulerSvc").tween("jobProgress", 0, 10).tween("avgSec", 0, 2).tween("curStep", 0, 1).badge("tick"))
  .phase("p2", {
    duration: 1800,
    title: "scheduler起動",
    body: "schedulerサービス が ジョブ キュー 確認 + concurrency判定 → ワーカー に 起動 送信。 jobProgress 10 → 30 tween、 avgSec 2 → 5 tween、 ワーカー lane activate。",
  }, (p: PhaseBuilder) => p.activate("cron", "schedulerSvc", "worker", "cron-schedulerSvc", "schedulerSvc-worker").tween("jobProgress", 10, 30).tween("avgSec", 2, 5).tween("curStep", 1, 2).badge("trigger"))
  .phase("p3", {
    duration: 2000,
    title: "ジョブ 実行(compute)",
    body: "ワーカー がBigQuery経由で週次 売上 + users + churnをaggregate、 PDF report生成。 jobProgress 30 → 85 tween、 runCount 8721 → 8722 tween、 avgSec 5 → 42 tween、 compute + reportStore lane activate。",
  }, (p: PhaseBuilder) => p.activate("cron", "schedulerSvc", "worker", "compute", "reportStore", "cron-schedulerSvc", "schedulerSvc-worker", "worker-compute", "worker-reportStore").tween("jobProgress", 30, 85).tween("runCount", 8721, 8722).tween("avgSec", 5, 42).tween("curStep", 2, 3).badge("実行"))
  .phase("p4", {
    duration: 2000,
    title: "report配信",
    body: "reportStoreがPDFをSlack + Notionで岩田様に配信、 次tick準備。 jobProgress 85 → 100 tween (ゲージ 針最上位)、 avgSec 42 → 48 tween、 nextMin 5 → 4 tween (減少開始)、 stakeholder lane activate、 6 shape全active、 scheduled report cycle完遂。",
  }, (p: PhaseBuilder) => p.activate("cron", "schedulerSvc", "worker", "compute", "reportStore", "stakeholder", "cron-schedulerSvc", "schedulerSvc-worker", "worker-compute", "worker-reportStore", "reportStore-stakeholder").tween("jobProgress", 85, 100).tween("avgSec", 42, 48).tween("nextMin", 5, 4).set("curStep", 3).badge("配信"))
  .build();

/**
 * 24. patternValidateProcessOrderSubmit v2 = pattern 12 Validate → Process の business scenario 拡張 (EC 注文 submit で cart validate → OK なら process、 fail なら ValidationError 返却)、 shape-person + shape-mobile-device + shape-website + shape-server-rack + shape-cylinder + shape-cloud の 6 shape で visual scene 化、 4 phase (submit → validate → OK 経路 process → NG 経路 error) + 4 readout (gauge 成功率 / countup submit 累計 / stat NG 件数 / stat 平均 ms) が tween で visually 連続変化。 iteration 8 wave 8-U redesign。 pattern 12 の抽象 patternValidateProcess と並置。 patterns.cdl.ts business scenario 完遂 (12/12 wave 8-R 〜 8-U)。
 */
export const patternValidateProcessOrderSubmit = diagram("pattern-validate-process-order-submit", {
  topic: "EC注文送信でカートを検証、OKならDBコミット、NGならエラー発火",
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
  .node("buyer", { lane: "buyer", stack: 0, kind: "shape-person", title: "購入者 平川様", eyebrow: "購入者", subtitle: "EC注文submit試行者" })
  .node("phone", { lane: "buyer", stack: 1, kind: "shape-mobile-device", title: "iPhoneのECアプリ", eyebrow: "端末", subtitle: "カート + submitボタン + error表示" })
  .node("submitApi", { lane: "service", stack: 0, kind: "shape-website", title: "注文submit API", eyebrow: "API", subtitle: "投稿 /注文 + validation middleware" })
  .node("validator", { lane: "service", stack: 1, kind: "shape-server-rack", title: "検証者(zod)", eyebrow: "検証者", subtitle: "スキーマcheck + business rule判定" })
  .node("orderDb", { lane: "outcome", stack: 0, kind: "shape-cylinder", title: "注文DB", eyebrow: "保存", subtitle: "OK時のみcommit保存" })
  .node("errorSink", { lane: "outcome", stack: 1, kind: "shape-cloud", title: "エラー 追跡(Sentry)", eyebrow: "エラー", subtitle: "NG event記録 + パターン分析" })
  .edge("buyer", "phone", { label: "送信", tone: "info" })
  .edge("phone", "submitApi", { label: "投稿", tone: "info" })
  .edge("submitApi", "validator", { label: "チェック", tone: "success" })
  .edge("validator", "orderDb", { label: "OK: 処理", tone: "success" })
  .edge("validator", "errorSink", { label: "NGログ", tone: "error" })
  .readout.gauge("sucG", { source: "successRate", min: 0, max: 100, color: "#22c55e", label: "成功率 %" })
  .readout.countup("subCU", { source: "submitCount", unit: " 件", label: "送信 累計", decimals: 0 })
  .readout.stat("ngStat", { source: "ngCount", unit: " 件", caption: "NG 件数", label: "NG" })
  .readout.stepProgress("stepSp", { source: "curStep", stepsSource: "stepLabels", color: "#2563eb", label: "フェーズステップ" })
  .phase("p1", {
    duration: 1500,
    title: "送信",
    body: "平川様がカート 確認、 ECアプリ が 投稿 /注文 送信(カート 項目 + 配送address + 決済ref)。 successRate 0 keep、 submitCount 15678 keep、 ngCount 423 keep、 avgMs 0 → 8 tween、 購入者 + スマホ + submitApi lane active。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "submitApi", "buyer-phone", "phone-submitApi").tween("avgMs", 0, 8).tween("curStep", 0, 1).badge("submit"))
  .phase("p2", {
    duration: 1800,
    title: "validate",
    body: "検証者(zod)が スキーマ チェック + 在庫確認 + 送料計算 + 配送address検証。 successRate 0 → 92 tween (95% pass想定)、 submitCount 15678 → 15679 tween、 avgMs 8 → 25 tween、 検証者lane activate。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "submitApi", "validator", "buyer-phone", "phone-submitApi", "submitApi-validator").tween("successRate", 0, 92).tween("submitCount", 15678, 15679).tween("avgMs", 8, 25).tween("curStep", 1, 2).badge("validate"))
  .phase("p3", {
    duration: 2000,
    title: "OK経路(処理)",
    body: "validate pass → orderDbに注文 コミット + 受注確認番号発行。 successRate 92 keep、 avgMs 25 → 48 tween、 orderDb lane activate、 成功 分岐edge発火、 購入者 にconfirmation準備。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "submitApi", "validator", "orderDb", "buyer-phone", "phone-submitApi", "submitApi-validator", "validator-orderDb").tween("avgMs", 25, 48).tween("curStep", 2, 3).badge("process"))
  .phase("p4", {
    duration: 2000,
    title: "NG経路(error別flow)",
    body: "並行でNG case (在庫不足 / address不正)を エラー 分岐で表現、 errorSinkにValidationError記録 + パターン集計。 successRate 92 keep (両経路併存)、 ngCount 423 → 424 tween、 avgMs 48 → 55 tween、 errorSink lane activate、 6 shape全active、 validate-処理cycle完遂。 patterns.cdl.ts business scenario 12/12完遂。",
  }, (p: PhaseBuilder) => p.activate("buyer", "phone", "submitApi", "validator", "orderDb", "errorSink", "buyer-phone", "phone-submitApi", "submitApi-validator", "validator-orderDb", "validator-errorSink").tween("ngCount", 423, 424).tween("avgMs", 48, 55).set("curStep", 3).badge("error"))
  .build();
