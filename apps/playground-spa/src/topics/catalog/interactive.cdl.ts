import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Interactive ... input widget / reactive state + formula / scroll-driven trigger /
 * event handler の 4 primitive の使い方 tour。 全て抽象例のみで特定分野固有の題材は含まず、
 * library は汎用 primitive を提供、 domain 応用は consumer app 側の責務。
 *
 * 各 diagram は CdlDiagramView (render integration) を通して実際に動く:
 *   - inputSliderBar = slider を動かすと node の subtitle が signal 値でリアルタイム更新
 *   - formulaTextBind = number 入力を変えると formula computed が再計算され node subtitle 反映
 *   - scrollNarrative = scroll 位置 → progress signal が SVG 上部の readout に反映
 *   - clickToggle = node click で signal toggle、 subtitle が active / idle 切替
 *
 * state.id と input/formula id を一致させることで、 CdlDiagramView が signal 値で state を
 * override して SVG に反映する経路 (`{state.id}` を node.value / subtitle で参照)。
 */

const W = 480;

/**
 * 1. slider → node value bind (input widget primitive + reactive state)。
 *    signal 'value' を state 'value' と同 id にすることで、 CdlDiagramView が自動 override、
 *    node の subtitle が signal 変化に追随して表示更新される。
 */
export const inputSliderBar = diagram("interactive-slider-bar", {
  topic: "input.slider を signal に bind、 node subtitle が signal 変化にリアルタイム追随",
})
  .lane("l", { x: 0, width: W })
  .input.slider("value", { min: 0, max: 100, defaultValue: 50, label: "Value" })
  .state("value", { initial: 50 })
  .node("bar-node", { lane: "l", stack: 0, kind: "card", title: "Bar", subtitle: "value: {value}" })
  .phase("p", { duration: 1500, title: "input.slider → signal → node subtitle", body: "slider を動かすと signal 'value' が更新、 node subtitle {value} が追随。" }, (p: PhaseBuilder) => p.activate("bar-node").badge("bind: value"))
  .build();

/**
 * 2. formula → text bind (formula primitive + reactive computed)。
 *    formula 'doubled' / 'halved' が computed として自動再計算、
 *    state id と一致させて node subtitle に反映される。
 */
export const formulaTextBind = diagram("interactive-formula-text", {
  topic: "formula (algebraic mini-DSL) で derived value を宣言、 number 入力変化で自動再計算",
})
  .lane("l", { x: 0, width: W })
  .input.number("input", { defaultValue: 10, label: "Input" })
  .formula("doubled", "input * 2")
  .formula("halved", "input / 2")
  .state("input", { initial: 10 })
  .state("doubled", { initial: 20 })
  .state("halved", { initial: 5 })
  .node("in", { lane: "l", stack: 0, kind: "card", title: "Input", subtitle: "value: {input}" })
  .node("out1", { lane: "l", stack: 1, kind: "card", title: "Doubled", subtitle: "input * 2 = {doubled}" })
  .node("out2", { lane: "l", stack: 2, kind: "card", title: "Halved", subtitle: "input / 2 = {halved}" })
  .phase("p", { duration: 1500, title: "formula は signal 変化で自動再計算", body: "input を変えると formula 'doubled' / 'halved' が computed として reactive に再評価、 node subtitle {doubled} / {halved} も追随。" }, (p: PhaseBuilder) => p.activate("in", "out1", "out2").badge("formula bind"))
  .build();

/**
 * 3. scroll → progress readout (scroll-driven trigger)。
 *    scroll trigger 'intro' の progress が interactive panel 上部の readout として表示、
 *    state id と一致させて node subtitle に反映される。
 */
export const scrollNarrative = diagram("interactive-scroll-narrative", {
  topic: "scroll 位置に応じて 0..1 progress を signal に反映、 node subtitle が progress を追随",
})
  .lane("l", { x: 0, width: W })
  .animation.scroll("intro", { start: 0.9, end: 0.1, label: "Intro reveal" })
  .state("intro", { initial: 0 })
  .node("a", { lane: "l", stack: 0, kind: "card", title: "Step 1", subtitle: "progress: {intro}" })
  .node("b", { lane: "l", stack: 1, kind: "card", title: "Step 2", subtitle: "progress: {intro}" })
  .node("c", { lane: "l", stack: 2, kind: "card", title: "Step 3", subtitle: "progress: {intro}" })
  .phase("p", { duration: 1500, title: "scroll → 0..1 progress → node subtitle", body: "wrapper element を scroll すると 'intro' progress が 0→1 に変化、 3 node の subtitle も追随。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("scroll bind"))
  .build();

/**
 * 4. click → toggle (event handler + hover)。
 *    click で state を toggle、 hover で hover state を signal に反映。
 *    consumer が interactiveHandlers prop で handler 関数を渡す前提。
 */
export const clickToggle = diagram("interactive-click-toggle", {
  topic: "click event → handler → signal toggle → node subtitle 切替",
})
  .lane("l", { x: 0, width: W })
  .input.toggle("active", { defaultValue: false, label: "Active" })
  .state("active", { initial: "off" })
  .node("btn", { lane: "l", stack: 0, kind: "card", title: "Button", subtitle: "state: {active}" })
  .on.click({ kind: "node", id: "btn" }, "toggle-active")
  .on.hover({ kind: "node", id: "btn" }, "hover-state")
  .phase("p", { duration: 1500, title: "click → handler → signal → SVG update", body: "consumer が 'toggle-active' handler を実装、 button click で active signal を反転、 subtitle が追随。" }, (p: PhaseBuilder) => p.activate("btn").badge("event bind"))
  .build();
