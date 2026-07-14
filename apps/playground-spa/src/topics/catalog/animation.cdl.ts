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
