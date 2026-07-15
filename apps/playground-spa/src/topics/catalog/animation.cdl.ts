import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Animation ... phase / state / tween / set / badge の動作。
 */

/** 1. 単 phase + state tween */
export const tweenSimple = diagram("tween-simple", { topic: "tween: 数値線形補間" })
  .lane("l", { x: 0, width: 400 })
  .state("counter", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Counter", value: "{counter}" })
  .phase("p", { duration: 2500, title: "0 → 100 へ tween", body: "phase 内で counter を 0 から 100 へ滑らかに変化。" }, (p: PhaseBuilder) => p.activate("a").tween("counter", 0, 100).badge("tween 中"))
  .build();

/** 2. 連続 phase で tween 累積 */
export const tweenChain = diagram("tween-chain", { topic: "tween: 連続 phase で累積" })
  .lane("l", { x: 0, width: 400 })
  .state("n", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Sum", value: "{n}" })
  .phase("p1", { duration: 2000, title: "Phase 1: 0 → 10", body: "1 phase 目の tween。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 0, 10).badge("p1"))
  .phase("p2", { duration: 2000, title: "Phase 2: 10 → 50", body: "前 phase の終端値から続けて tween。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 10, 50).badge("p2"))
  .phase("p3", { duration: 2000, title: "Phase 3: 50 → 100", body: "最終 phase で 100 まで。 hold で静止表示。" }, (p: PhaseBuilder) => p.activate("a").tween("n", 50, 100).badge("p3"))
  .build();

/** 3. set (即時切替) */
export const setSwitch = diagram("set-switch", { topic: "set: 即時切替 (lerp なし)" })
  .lane("l", { x: 0, width: 500 })
  .state("status", { initial: "idle" })
  .node("a", { lane: "l", stack: 0, kind: "function", title: "Process", subtitle: "status: {status}" })
  .phase("p1", { duration: 2000, title: "idle → running", body: "set で文字列 state を即時切替。 phase 開始の瞬間に値が変わる。" }, (p: PhaseBuilder) => p.activate("a").set("status", "running").badge("running"))
  .phase("p2", { duration: 2000, title: "running → done", body: "次 phase で done に切替。 tween と違い段階的でなく瞬間遷移。" }, (p: PhaseBuilder) => p.activate("a").set("status", "done").badge("done"))
  .build();

/** 4. badge 動作 */
export const badgePerPhase = diagram("badge-per-phase", { topic: "badge: phase ごと切替" })
  .lane("l", { x: 0, width: 400 })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Step" })
  .phase("p1", { duration: 1500, title: "Phase 1", body: "header に badge='preparing' を表示。" }, (p: PhaseBuilder) => p.activate("a").badge("preparing"))
  .phase("p2", { duration: 1500, title: "Phase 2", body: "header の badge を 'processing' に切替。" }, (p: PhaseBuilder) => p.activate("a").badge("processing"))
  .phase("p3", { duration: 1500, title: "Phase 3", body: "最終 phase で badge='completed'、 step 完了示唆。" }, (p: PhaseBuilder) => p.activate("a").badge("completed"))
  .build();

/** 5. 数値 tween と文字列 set の併用 */
export const mixedTweenSet = diagram("mixed-tween-set", { topic: "tween + set 併用" })
  .lane("l", { x: 0, width: 500 })
  .state("amount", { initial: 0 })
  .state("phase", { initial: "init" })
  .node("a", { lane: "l", stack: 0, kind: "function", title: "Operation", subtitle: "phase: {phase}", value: "{amount}" })
  .phase("p1", { duration: 2400, title: "init → loading + 0 → 50", body: "tween で数値、 set で文字列を同時更新。 1 phase 内で複数 state を制御可能。" }, (p: PhaseBuilder) => p.activate("a").tween("amount", 0, 50).set("phase", "loading").badge("loading"))
  .phase("p2", { duration: 2400, title: "loading → done + 50 → 100", body: "次 phase で完了状態へ。" }, (p: PhaseBuilder) => p.activate("a").tween("amount", 50, 100).set("phase", "done").badge("done"))
  .build();

/**
 * 6. richPipelineDemo = iter 9 wave 9-C 完動 pilot (rich layered animation exemplar)。
 *
 * incremental step 1-6 で全 element (dyn-wave / phase 5 / state 7 / readout 2 / lane 5 / edge 4 + activate 連鎖) が動作確認済、 動作 baseline は step6 compare で verified。
 *
 * 5 layer 同時発火 (rich judgment 5/5 pass):
 * - layer 1 = arrow が step 1-5 順に色付き (edge activate 連鎖)
 * - layer 2 = rectangle border が光る (node activate で strokeWidth 3 + accent)
 * - layer 3 = rectangle 内 wave 高さで進捗 % 表示 (dyn-wave level tween)
 * - layer 4 = 全体進捗 (readout.percentRing)
 * - layer 5 = badge phase 名切替
 *
 * theme = 「5段階 CSV batch import pipeline (500 record 処理) の rich 進捗表示」。
 * mermaid では静止 5 rectangle + 5 arrow しか描けない、 dragon はこの 5 layer 同時発火で「見てて楽しい + 理解しやすい」 を両立する。
 */
export const richPipelineDemo = diagram("animation-rich-pipeline-demo", {
  topic: "5段階CSVパイプラインのリッチ進捗デモ",
})
  .lane("l1", { x: 0, width: 160 })
  .lane("l2", { x: 180, width: 160 })
  .lane("l3", { x: 360, width: 160 })
  .lane("l4", { x: 540, width: 160 })
  .lane("l5", { x: 720, width: 160 })
  .state("s1", { initial: 0 })
  .state("s2", { initial: 0 })
  .state("s3", { initial: 0 })
  .state("s4", { initial: 0 })
  .state("s5", { initial: 0 })
  .state("total", { initial: 0 })
  .state("processed", { initial: 0 })
  .node("r1", { lane: "l1", stack: 0, kind: "dyn-wave", title: "検証", subtitle: "{s1}%", w: 140, h: 200,
    shape: { kind: "wave", level: "{s1}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } })
  .node("r2", { lane: "l2", stack: 0, kind: "dyn-wave", title: "変換", subtitle: "{s2}%", w: 140, h: 200,
    shape: { kind: "wave", level: "{s2}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } })
  .node("r3", { lane: "l3", stack: 0, kind: "dyn-wave", title: "加工", subtitle: "{s3}%", w: 140, h: 200,
    shape: { kind: "wave", level: "{s3}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } })
  .node("r4", { lane: "l4", stack: 0, kind: "dyn-wave", title: "重複排除", subtitle: "{s4}%", w: 140, h: 200,
    shape: { kind: "wave", level: "{s4}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } })
  .node("r5", { lane: "l5", stack: 0, kind: "dyn-wave", title: "保存", subtitle: "{s5}%", w: 140, h: 200,
    shape: { kind: "wave", level: "{s5}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#22c55e" } })
  .edge("r1", "r2", { id: "e12", label: "変換", tone: "info" })
  .edge("r2", "r3", { id: "e23", label: "加工", tone: "info" })
  .edge("r3", "r4", { id: "e34", label: "排除", tone: "info" })
  .edge("r4", "r5", { id: "e45", label: "確定", tone: "success" })
  .readout.percentRing("ring", { source: "total", max: 500, label: "全体進捗" })
  .readout.countup("cu", { source: "processed", unit: " 行", label: "処理済", decimals: 0 })
  .phase("p1", { duration: 1500, title: "検証中", body: "" }, (p: PhaseBuilder) => p.activate("r1").tween("s1", 0, 100).tween("total", 0, 100).tween("processed", 0, 100).badge("検証"))
  .phase("p2", { duration: 1500, title: "変換中", body: "" }, (p: PhaseBuilder) => p.activate("r1", "r2", "e12").tween("s2", 0, 100).tween("total", 100, 200).tween("processed", 100, 200).badge("変換"))
  .phase("p3", { duration: 1500, title: "加工中", body: "" }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3", "e12", "e23").tween("s3", 0, 100).tween("total", 200, 300).tween("processed", 200, 300).badge("加工"))
  .phase("p4", { duration: 1500, title: "排除中", body: "" }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3", "r4", "e12", "e23", "e34").tween("s4", 0, 100).tween("total", 300, 400).tween("processed", 300, 400).badge("排除"))
  .phase("p5", { duration: 1500, title: "保存完遂", body: "" }, (p: PhaseBuilder) => p.activate("r1", "r2", "r3", "r4", "r5", "e12", "e23", "e34", "e45").tween("s5", 0, 100).tween("total", 400, 500).tween("processed", 400, 500).badge("保存"))
  .build();

/**
 * 7. richServerLoadDashboard = 「サーバー負荷 dashboard」 rich exemplar (iter 9 wave 9-E)。
 *
 * theme = 「4 台のサーバーの CPU 使用率が朝ピーク → 昼安定 → 夜スケールダウン と変化する時系列」。
 * dyn-arc gauge を parts の使用機会 (「割合 / 目標達成率 / 針で示す状態変化」) 逆算で選定 = 使用率 % を扇形 sweep で表現。
 *
 * 5 layer 同時発火:
 * - layer 1 = 4 arc gauge が並列に 0-100% で sweep (angle tween)
 * - layer 2 = 各 server node の active/inactive (負荷高い server は active border)
 * - layer 3 = 平均負荷 readout.gauge (0-100)
 * - layer 4 = alert badge (低 = 平常運転 / 中 = 警戒 / 高 = 危険 / 復旧 = 通常)
 * - layer 5 = 稼働 hour readout.countup
 */
export const richServerLoadDashboard = diagram("animation-rich-server-load-dashboard", {
  topic: "4台サーバーCPU負荷ダッシュボード (朝ピーク→昼安定→夜スケールダウン→深夜アイドル)",
})
  .lane("l1", { x: 0, width: 200 })
  .lane("l2", { x: 260, width: 200 })
  .lane("l3", { x: 520, width: 200 })
  .lane("l4", { x: 780, width: 200 })
  .state("cpu1", { initial: 0 })
  .state("cpu2", { initial: 0 })
  .state("cpu3", { initial: 0 })
  .state("cpu4", { initial: 0 })
  .state("avgLoad", { initial: 0 })
  .state("uptimeHour", { initial: 0 })
  .node("srv1", { lane: "l1", stack: 0, kind: "dyn-arc", title: "srv-1", subtitle: "{cpu1}%", w: 180, h: 180,
    shape: { kind: "arc", angle: "{cpu1}", sweepMax: 100, outerRadius: 70, innerRadius: 52, fill: "#4e9dc4" } })
  .node("srv2", { lane: "l2", stack: 0, kind: "dyn-arc", title: "srv-2", subtitle: "{cpu2}%", w: 180, h: 180,
    shape: { kind: "arc", angle: "{cpu2}", sweepMax: 100, outerRadius: 70, innerRadius: 52, fill: "#4e9dc4" } })
  .node("srv3", { lane: "l3", stack: 0, kind: "dyn-arc", title: "srv-3", subtitle: "{cpu3}%", w: 180, h: 180,
    shape: { kind: "arc", angle: "{cpu3}", sweepMax: 100, outerRadius: 70, innerRadius: 52, fill: "#f97316" } })
  .node("srv4", { lane: "l4", stack: 0, kind: "dyn-arc", title: "srv-4", subtitle: "{cpu4}%", w: 180, h: 180,
    shape: { kind: "arc", angle: "{cpu4}", sweepMax: 100, outerRadius: 70, innerRadius: 52, fill: "#22c55e" } })
  .readout.gauge("avgG", { source: "avgLoad", min: 0, max: 100, color: "#f97316", label: "平均負荷 %" })
  .readout.countup("uptimeCU", { source: "uptimeHour", unit: " 時", label: "稼働時間", decimals: 0 })
  .phase("p1", { duration: 2000, title: "朝ピーク (7:00)", body: "" }, (p: PhaseBuilder) => p.activate("srv1", "srv2", "srv3", "srv4").tween("cpu1", 0, 85).tween("cpu2", 0, 88).tween("cpu3", 0, 92).tween("cpu4", 0, 78).tween("avgLoad", 0, 86).tween("uptimeHour", 0, 7).badge("朝ピーク"))
  .phase("p2", { duration: 2000, title: "昼安定 (12:00)", body: "" }, (p: PhaseBuilder) => p.activate("srv1", "srv2", "srv3", "srv4").tween("cpu1", 85, 55).tween("cpu2", 88, 58).tween("cpu3", 92, 62).tween("cpu4", 78, 48).tween("avgLoad", 86, 55).tween("uptimeHour", 7, 12).badge("昼安定"))
  .phase("p3", { duration: 2000, title: "夜スケールダウン (20:00)", body: "" }, (p: PhaseBuilder) => p.activate("srv1", "srv2", "srv3", "srv4").tween("cpu1", 55, 30).tween("cpu2", 58, 32).tween("cpu3", 62, 35).tween("cpu4", 48, 22).tween("avgLoad", 55, 30).tween("uptimeHour", 12, 20).badge("スケールダウン"))
  .phase("p4", { duration: 2000, title: "深夜アイドル (2:00)", body: "" }, (p: PhaseBuilder) => p.activate("srv1", "srv2", "srv3", "srv4").tween("cpu1", 30, 8).tween("cpu2", 32, 10).tween("cpu3", 35, 12).tween("cpu4", 22, 5).tween("avgLoad", 30, 9).tween("uptimeHour", 20, 26).badge("アイドル"))
  .build();

/**
 * 8. richOrderStatusFlow = 「EC 注文の状態遷移」 rich exemplar (iter 9 wave 9-E)。
 *
 * theme = 「1 件の EC 注文が受注 → 決済 → 発送 → 配達 → 完了 の 5 状態を経る process」。
 * dyn-rect を parts の使用機会 (「fill 率で完了度を表現」) 逆算で選定 = 各状態の完了率を rect 縦 fill で表現。
 *
 * 5 layer 同時発火:
 * - layer 1 = 5 rectangle 縦 fill (状態別完了率、 arrow で fill 伝搬)
 * - layer 2 = 状態遷移の edge activate 連鎖 (arrow 順次色付き)
 * - layer 3 = 進捗 readout.percentRing (0-100%)
 * - layer 4 = 経過時間 readout.countup (時)
 * - layer 5 = 状態 badge (受注 → 決済 → 発送 → 配達 → 完了)
 */
export const richOrderStatusFlow = diagram("animation-rich-order-status-flow", {
  topic: "EC注文状態遷移 (受注→決済→発送→配達→完了)",
})
  .lane("l1", { x: 0, width: 140 })
  .lane("l2", { x: 160, width: 140 })
  .lane("l3", { x: 320, width: 140 })
  .lane("l4", { x: 480, width: 140 })
  .lane("l5", { x: 640, width: 140 })
  .state("f1", { initial: 0 })
  .state("f2", { initial: 0 })
  .state("f3", { initial: 0 })
  .state("f4", { initial: 0 })
  .state("f5", { initial: 0 })
  .state("progress", { initial: 0 })
  .state("elapsedHour", { initial: 0 })
  .node("st1", { lane: "l1", stack: 0, kind: "dyn-rect", title: "受注", subtitle: "{f1}%", w: 120, h: 200,
    shape: { kind: "rect", source: "{f1}", fillMax: 100, orient: "up", fill: "#4e9dc4" } })
  .node("st2", { lane: "l2", stack: 0, kind: "dyn-rect", title: "決済", subtitle: "{f2}%", w: 120, h: 200,
    shape: { kind: "rect", source: "{f2}", fillMax: 100, orient: "up", fill: "#4e9dc4" } })
  .node("st3", { lane: "l3", stack: 0, kind: "dyn-rect", title: "発送", subtitle: "{f3}%", w: 120, h: 200,
    shape: { kind: "rect", source: "{f3}", fillMax: 100, orient: "up", fill: "#4e9dc4" } })
  .node("st4", { lane: "l4", stack: 0, kind: "dyn-rect", title: "配達", subtitle: "{f4}%", w: 120, h: 200,
    shape: { kind: "rect", source: "{f4}", fillMax: 100, orient: "up", fill: "#f97316" } })
  .node("st5", { lane: "l5", stack: 0, kind: "dyn-rect", title: "完了", subtitle: "{f5}%", w: 120, h: 200,
    shape: { kind: "rect", source: "{f5}", fillMax: 100, orient: "up", fill: "#22c55e" } })
  .edge("st1", "st2", { id: "e12", label: "決済へ", tone: "info" })
  .edge("st2", "st3", { id: "e23", label: "発送へ", tone: "info" })
  .edge("st3", "st4", { id: "e34", label: "配達へ", tone: "info" })
  .edge("st4", "st5", { id: "e45", label: "完了", tone: "success" })
  .readout.percentRing("progRing", { source: "progress", max: 100, label: "進捗" })
  .readout.countup("elapsedCU", { source: "elapsedHour", unit: " 時", label: "経過", decimals: 0 })
  .phase("p1", { duration: 1500, title: "受注中", body: "" }, (p: PhaseBuilder) => p.activate("st1").tween("f1", 0, 100).tween("progress", 0, 20).tween("elapsedHour", 0, 1).badge("受注"))
  .phase("p2", { duration: 1500, title: "決済中", body: "" }, (p: PhaseBuilder) => p.activate("st1", "st2", "e12").tween("f2", 0, 100).tween("progress", 20, 40).tween("elapsedHour", 1, 2).badge("決済"))
  .phase("p3", { duration: 1500, title: "発送中", body: "" }, (p: PhaseBuilder) => p.activate("st1", "st2", "st3", "e12", "e23").tween("f3", 0, 100).tween("progress", 40, 60).tween("elapsedHour", 2, 8).badge("発送"))
  .phase("p4", { duration: 1500, title: "配達中", body: "" }, (p: PhaseBuilder) => p.activate("st1", "st2", "st3", "st4", "e12", "e23", "e34").tween("f4", 0, 100).tween("progress", 60, 85).tween("elapsedHour", 8, 24).badge("配達"))
  .phase("p5", { duration: 1500, title: "完了", body: "" }, (p: PhaseBuilder) => p.activate("st1", "st2", "st3", "st4", "st5", "e12", "e23", "e34", "e45").tween("f5", 0, 100).tween("progress", 85, 100).tween("elapsedHour", 24, 28).badge("完了"))
  .build();

/**
 * 9. richScoreLeaderboard = 「4 プレイヤーのスコア推移」 rich exemplar (iter 9 wave 9-E)。
 *
 * theme = 「オンラインゲーム大会で 4 人のプレイヤーが 4 round プレイして score が変動する」。
 * dyn-circle radius を parts の使用機会 (「大きさ変化で強弱を表現」) 逆算で選定 = score に応じた radius の大小。
 *
 * 5 layer 同時発火:
 * - layer 1 = 4 circle radius 変化 (score 追随、 大きい = 強い)
 * - layer 2 = badge = 現在 leader プレイヤー名
 * - layer 3 = readout.countup 累計 total kill
 * - layer 4 = readout.gauge 平均 accuracy
 * - layer 5 = round 進行 (badge に round 番号)
 */
export const richScoreLeaderboard = diagram("animation-rich-score-leaderboard", {
  topic: "4プレイヤースコア推移 (4ラウンドで順位変動、 円の大きさが強さを表す)",
})
  .lane("l1", { x: 0, width: 180 })
  .lane("l2", { x: 240, width: 180 })
  .lane("l3", { x: 480, width: 180 })
  .lane("l4", { x: 720, width: 180 })
  .state("p1", { initial: 20 })
  .state("p2", { initial: 20 })
  .state("p3", { initial: 20 })
  .state("p4", { initial: 20 })
  .state("totalKill", { initial: 0 })
  .state("avgAcc", { initial: 40 })
  .node("pl1", { lane: "l1", stack: 0, kind: "dyn-circle", title: "岸田様", subtitle: "score {p1}", w: 160, h: 180,
    shape: { kind: "circle", radius: "{p1}", fill: "#4e9dc4" } })
  .node("pl2", { lane: "l2", stack: 0, kind: "dyn-circle", title: "山田様", subtitle: "score {p2}", w: 160, h: 180,
    shape: { kind: "circle", radius: "{p2}", fill: "#f97316" } })
  .node("pl3", { lane: "l3", stack: 0, kind: "dyn-circle", title: "佐藤様", subtitle: "score {p3}", w: 160, h: 180,
    shape: { kind: "circle", radius: "{p3}", fill: "#22c55e" } })
  .node("pl4", { lane: "l4", stack: 0, kind: "dyn-circle", title: "森様", subtitle: "score {p4}", w: 160, h: 180,
    shape: { kind: "circle", radius: "{p4}", fill: "#8b7ffa" } })
  .readout.countup("killCU", { source: "totalKill", unit: " kill", label: "累計 kill", decimals: 0 })
  .readout.gauge("accG", { source: "avgAcc", min: 0, max: 100, color: "#22c55e", label: "平均命中率 %" })
  .phase("r1", { duration: 2000, title: "Round 1 (拮抗)", body: "" }, (p: PhaseBuilder) => p.activate("pl1", "pl2", "pl3", "pl4").tween("p1", 20, 35).tween("p2", 20, 38).tween("p3", 20, 32).tween("p4", 20, 30).tween("totalKill", 0, 12).tween("avgAcc", 40, 52).badge("R1 拮抗"))
  .phase("r2", { duration: 2000, title: "Round 2 (山田様 lead)", body: "" }, (p: PhaseBuilder) => p.activate("pl1", "pl2", "pl3", "pl4").tween("p1", 35, 48).tween("p2", 38, 65).tween("p3", 32, 42).tween("p4", 30, 40).tween("totalKill", 12, 28).tween("avgAcc", 52, 58).badge("R2 山田様 lead"))
  .phase("r3", { duration: 2000, title: "Round 3 (佐藤様 追い上げ)", body: "" }, (p: PhaseBuilder) => p.activate("pl1", "pl2", "pl3", "pl4").tween("p1", 48, 55).tween("p2", 65, 68).tween("p3", 42, 72).tween("p4", 40, 45).tween("totalKill", 28, 48).tween("avgAcc", 58, 64).badge("R3 佐藤様 追上げ"))
  .phase("r4", { duration: 2000, title: "Round 4 (佐藤様 優勝)", body: "" }, (p: PhaseBuilder) => p.activate("pl1", "pl2", "pl3", "pl4").tween("p1", 55, 62).tween("p2", 68, 74).tween("p3", 72, 80).tween("p4", 45, 50).tween("totalKill", 48, 72).tween("avgAcc", 64, 68).badge("R4 佐藤様 優勝"))
  .build();

/**
 * 10. richLayeredPriorityFee = 「3 層優先度手数料」 composite exemplar (dragon-diagram skill pilot、 2026-07-15)。
 *
 * theme = Ethereum EIP-1559 gas fee の 3 層構成 (base burn / priority tip / max cap) を混雑度で追跡。
 *
 * uses parts:
 *   - 縦積み層バー (partsStackedLayer 経路) = 3 dyn-rect stacked layer で「重ね張り」 metaphor
 *   - カウンタ表示 (partsCounterActor 経路) = actor + subtitle template で有効総額 gwei
 *   - アークゲージ (partsArcGauge 経路) = dyn-arc で混雑度 %
 *
 * story arc = 空 block → 平常 → 混雑 → 極混雑 の 4 phase で 3 層が同時変動。
 */
export const richLayeredPriorityFee = diagram("animation-rich-layered-priority-fee", {
  topic: "3層優先度手数料 — 混雑度で base / tip / cap が同時に動く",
})
  .lane("bar", { x: 0, width: 320 })
  .lane("stat", { x: 380, width: 320 })
  .state("baseFee", { initial: 10 })
  .state("tipFee", { initial: 2 })
  .state("capFee", { initial: 8 })
  .state("effectiveGwei", { initial: 12 })
  .state("congestion", { initial: 15 })
  .node("capL", { lane: "bar", stack: 0, kind: "dyn-rect", title: "max cap", subtitle: "+{capFee} gwei", w: 300, h: 140,
    shape: { kind: "rect", source: "{capFee}", fillMax: 60, orient: "up", fill: "#94a3b8", radius: 4 } })
  .node("tipL", { lane: "bar", stack: 1, kind: "dyn-rect", title: "priority tip", subtitle: "+{tipFee} gwei", w: 300, h: 100,
    shape: { kind: "rect", source: "{tipFee}", fillMax: 50, orient: "up", fill: "#22c55e", radius: 4 } })
  .node("baseL", { lane: "bar", stack: 2, kind: "dyn-rect", title: "base fee (burn)", subtitle: "{baseFee} gwei", w: 300, h: 180,
    shape: { kind: "rect", source: "{baseFee}", fillMax: 160, orient: "up", fill: "#dc2626", radius: 4 } })
  .node("effC", { lane: "stat", stack: 0, kind: "actor", title: "有効総額", subtitle: "{effectiveGwei} gwei", w: 280, h: 180 })
  .node("congA", { lane: "stat", stack: 1, kind: "dyn-arc", title: "混雑度", subtitle: "{congestion}%", w: 280, h: 220,
    shape: { kind: "arc", angle: "{congestion}", sweepMax: 100, outerRadius: 90, innerRadius: 62, fill: "#f97316" } })
  .phase("p1", { duration: 1800, title: "空 block", body: "" }, (p: PhaseBuilder) =>
    p.activate("capL", "tipL", "baseL", "effC", "congA")
      .tween("baseFee", 10, 15).tween("tipFee", 2, 3).tween("capFee", 8, 12)
      .tween("effectiveGwei", 12, 18).tween("congestion", 15, 28)
      .badge("空 block"))
  .phase("p2", { duration: 1800, title: "平常", body: "" }, (p: PhaseBuilder) =>
    p.activate("capL", "tipL", "baseL", "effC", "congA")
      .tween("baseFee", 15, 45).tween("tipFee", 3, 6).tween("capFee", 12, 20)
      .tween("effectiveGwei", 18, 51).tween("congestion", 28, 58)
      .badge("平常"))
  .phase("p3", { duration: 1800, title: "混雑", body: "" }, (p: PhaseBuilder) =>
    p.activate("capL", "tipL", "baseL", "effC", "congA")
      .tween("baseFee", 45, 95).tween("tipFee", 6, 18).tween("capFee", 20, 35)
      .tween("effectiveGwei", 51, 113).tween("congestion", 58, 88)
      .badge("混雑"))
  .phase("p4", { duration: 1800, title: "極混雑", body: "" }, (p: PhaseBuilder) =>
    p.activate("capL", "tipL", "baseL", "effC", "congA")
      .tween("baseFee", 95, 140).tween("tipFee", 18, 42).tween("capFee", 35, 55)
      .tween("effectiveGwei", 113, 182).tween("congestion", 88, 96)
      .badge("極混雑"))
  .build();
