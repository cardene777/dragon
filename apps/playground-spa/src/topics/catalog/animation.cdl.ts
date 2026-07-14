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
