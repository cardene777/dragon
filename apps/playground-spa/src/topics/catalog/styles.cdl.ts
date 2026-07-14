import { diagram } from "@cardenelabs/cdl";
import type { EdgeStyle, Tone, PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Styles ... edge / tone の見た目バリエーション。
 */

// lane gap = label pill 最大幅 (~240px = 14 文字 mono) + node 端マージン分を確保
function smallPair(id: string, style: EdgeStyle, tone: Tone, label: string, topicOverride: string, sub?: string) {
  return diagram(id, { topic: topicOverride })
    .lane("l1", { x: 0, width: 280 })
    .lane("l2", { x: 600, width: 280 })
    .node("a", { lane: "l1", stack: 0, kind: "actor", title: "From" })
    .node("b", { lane: "l2", stack: 0, kind: "actor", title: "To" })
    .edge("a", "b", { id: "e", label, sub, tone, style })
    .phase("p", { duration: 1800, title: `${style} / ${tone}`, body: "edge style と tone の組み合わせを確認。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge(tone))
    .build();
}

/** 1. EdgeStyle 2 種 = 線種の違いを比較 (tone は accent 固定) */
export const styleSolid = smallPair("style-solid", "solid", "accent", "solid", "solid style (実線 + 矢頭、 edge の default)", "実線 + 矢頭");
export const styleDottedFlow = smallPair("style-dotted-flow", "dotted-flow", "accent", "dotted-flow", "dotted-flow style (点線 + 粒子、 動的 flow 表現)", "点線 + 粒子");

/** 2. Tone 全 6 種 (solid edge で色差を確認) = 色 identity の違いを比較 */
export const toneAccent = smallPair("tone-accent", "solid", "accent", "accent", "accent tone (主張色、 dark navy)");
export const toneTeal = smallPair("tone-teal", "solid", "teal", "teal", "teal tone (青緑、 secondary emphasis)");
export const toneSuccess = smallPair("tone-success", "solid", "success", "success", "success tone (green、 成功状態)");
export const toneError = smallPair("tone-error", "solid", "error", "error", "error tone (red、 エラー状態)");
export const toneWarning = smallPair("tone-warning", "solid", "warning", "warning", "warning tone (orange、 警告状態)");
export const toneInfo = smallPair("tone-info", "solid", "info", "info", "info tone (light blue、 情報表示)");

/** 3. Inactive vs Active */
export const stateActive = diagram("state-active", { topic: "edge: active 状態" })
  .lane("l1", { x: 0, width: 280 })
  .lane("l2", { x: 600, width: 280 })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "active", tone: "accent", style: "solid" })
  .phase("p", { duration: 1800, title: "active 状態", body: "phase で activate された edge は太く + 色付きで visible。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("active"))
  .build();

export const stateInactive = diagram("state-inactive", { topic: "edge: inactive 状態" })
  .lane("l1", { x: 0, width: 280 })
  .lane("l2", { x: 600, width: 280 })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "inactive", tone: "accent", style: "solid" })
  .phase("p", { duration: 1800, title: "inactive 状態", body: "activate されていない edge は薄い灰色 + dash で静的表示。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("edge は inactive"))
  .build();
