import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Interactive ... input widget / reactive state + formula / scroll-driven trigger /
 * event handler の 4 primitive の使い方 tour。 全て domain-neutral な抽象例のみ。 特定 domain 用の
 * 具体名称 (crypto / finance / commerce 系の名前・略称・chain 種別など) は決して含めない、
 * library は汎用 primitive を提供、 domain 応用は consumer app 側の責務。
 *
 * 各 diagram は「primitive の存在と最小使い方」 を示す tour。 consumer は自身の app で
 * 対応 signal / handler を実装して SVG に bind する経路を採る。
 */

const W = 480;

/**
 * 1. slider → bar 幅 bind (input widget primitive + reactive state)。
 *    `.input.slider(name, opts)` で signal を宣言、 consumer は signals[name].value で bar 幅を driving する。
 *    diagram 自身は spec metadata のみ持つ、 実際の signal 生成 + widget 描画は consumer 側 (createInputSignals)。
 */
export const inputSliderBar = diagram("interactive-slider-bar", {
  topic: "input.slider を signal に bind、 consumer が値変化で bar 幅を driving する generic 例",
})
  .lane("l", { x: 0, width: W })
  .input.slider("value", { min: 0, max: 100, defaultValue: 50, label: "Value" })
  .state("bar", { initial: 50 })
  .node("bar-node", { lane: "l", stack: 0, kind: "card", title: "Bar", subtitle: "width tied to slider 'value'" })
  .phase("p", { duration: 1500, title: "input.slider → signal → bar width", body: "consumer 側で createInputSignals(diagram).value.value を bar 幅に bind する。" }, (p: PhaseBuilder) => p.activate("bar-node").badge("bind: value"))
  .build();

/**
 * 2. formula 評価 (formula + text bind)。
 *    `.formula(id, expression)` で computed を宣言、 consumer は createFormulaComputeds(diagram, signals) で
 *    computed を得て、 その value を SVG text に反映する。 safe subset (算術 + Math.*) のみで derived value を宣言的に。
 */
export const formulaTextBind = diagram("interactive-formula-text", {
  topic: "formula (algebraic mini-DSL) で derived value を宣言、 consumer が text に bind する generic 例",
})
  .lane("l", { x: 0, width: W })
  .input.number("input", { defaultValue: 10, label: "Input" })
  .formula("doubled", "input * 2")
  .formula("halved", "input / 2")
  .node("in", { lane: "l", stack: 0, kind: "card", title: "Input", subtitle: "input" })
  .node("out1", { lane: "l", stack: 1, kind: "card", title: "Doubled", subtitle: "input * 2" })
  .node("out2", { lane: "l", stack: 2, kind: "card", title: "Halved", subtitle: "input / 2" })
  .phase("p", { duration: 1500, title: "formula は signal 変化で自動再計算", body: "input.value を変えると formula 'doubled' / 'halved' が computed として reactive に再評価される。" }, (p: PhaseBuilder) => p.activate("in", "out1", "out2").badge("formula bind"))
  .build();

/**
 * 3. scroll narrative (scroll-driven trigger)。
 *    `.animation.scroll(id, opts)` で scroll 位置 → 0..1 progress signal を宣言、 consumer は
 *    createScrollProgressSignals(diagram).intro.attach(element) で DOM に bind、 progress signal で
 *    SVG element の opacity / position 等を driving する generic scroll narrative。
 */
export const scrollNarrative = diagram("interactive-scroll-narrative", {
  topic: "scroll 位置に応じて 0..1 progress を signal に反映、 consumer が SVG opacity / position を driving",
})
  .lane("l", { x: 0, width: W })
  .animation.scroll("intro", { start: 0.9, end: 0.1, label: "Intro reveal" })
  .node("a", { lane: "l", stack: 0, kind: "card", title: "Step 1", subtitle: "progress 0.0-0.3 で reveal" })
  .node("b", { lane: "l", stack: 1, kind: "card", title: "Step 2", subtitle: "progress 0.3-0.7 で reveal" })
  .node("c", { lane: "l", stack: 2, kind: "card", title: "Step 3", subtitle: "progress 0.7-1.0 で reveal" })
  .phase("p", { duration: 1500, title: "scroll → 0..1 progress → step 順 reveal", body: "consumer は progress を閾値と比較して各 step の opacity を切替、 scroll-driven narrative の generic pattern を実現。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("scroll bind"))
  .build();

/**
 * 4. click toggle (event handler)。
 *    `.on.click(target, handlerId)` で DOM event を宣言、 consumer は attachEventHandlers(root, diagram, handlers)
 *    で handler 関数を注入、 handler 内で signal を toggle する。 hover は mouseenter + mouseleave の両方に bind される。
 */
export const clickToggle = diagram("interactive-click-toggle", {
  topic: "click event を signal toggle に bind、 consumer が SVG color / state を切替 (generic 例)",
})
  .lane("l", { x: 0, width: W })
  .state("active", { initial: 0 })
  .node("btn", { lane: "l", stack: 0, kind: "card", title: "Button", subtitle: "click で active toggle" })
  .on.click({ kind: "node", id: "btn" }, "toggle-active")
  .on.hover({ kind: "node", id: "btn" }, "hover-state")
  .phase("p", { duration: 1500, title: "click → handler → signal → SVG update", body: "consumer は 'toggle-active' handler を実装、 signal.value を反転して SVG color / state を reactive に切替。" }, (p: PhaseBuilder) => p.activate("btn").badge("event bind"))
  .build();
