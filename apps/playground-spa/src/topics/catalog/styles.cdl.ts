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
    .node("a", { lane: "l1", stack: 0, kind: "actor", title: "始点" })
    .node("b", { lane: "l2", stack: 0, kind: "actor", title: "終点" })
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
export const stateActive = diagram("state-active", { topic: "edge: 動いている状態" })
  .lane("l1", { x: 0, width: 280 })
  .lane("l2", { x: 600, width: 280 })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "動作中", tone: "accent", style: "solid" })
  .phase("p", { duration: 1800, title: "動いている状態", body: "phase で activate された edge は太く + 色付きで見える。" }, (p: PhaseBuilder) => p.activate("a", "b", "e").badge("動作中"))
  .build();

export const stateInactive = diagram("state-inactive", { topic: "edge: 止まっている状態" })
  .lane("l1", { x: 0, width: 280 })
  .lane("l2", { x: 600, width: 280 })
  .node("a", { lane: "l1", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .edge("a", "b", { id: "e", label: "停止中", tone: "accent", style: "solid" })
  .phase("p", { duration: 1800, title: "止まっている状態", body: "activate されていない edge は薄い灰色 + 破線で静かに出る。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("矢印は停止中"))
  .build();

// ============================================================
// 記法 (#1373)
// ============================================================
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれ、
// `style-solid` が `solid-style-実線-矢頭-edge-の-default` に変わる (識別子は一覧と検索に出る)。
//
// 併記は写し違いが起きるため、**同じ図になることを検査で固定する**
// (`lib/catalog-source-parity.test.tsx`)。 記法を直して図がずれたらそこで落ちる。
//
// 図の直前ではなく末尾にまとめるのは、10 件のうち 8 件が `smallPair(...)` の 1 行で
// 並ぶ形だから。 間に 50 行の記法を挟むと「線種 2 種 / 色 6 種」 の対比が読めなくなる。

export const sourceYaml__styleSolid = `title: "solid style (実線 + 矢頭、 edge の default)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "solid" (accent, solid) { sub: "実線 + 矢頭" }

animation:
  - step: "solid / accent" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "accent"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__styleSolid = `{
  "title": "solid style (実線 + 矢頭、 edge の default)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    {
      "from": "始点",
      "to": "終点",
      "label": "solid",
      "sub": "実線 + 矢頭",
      "tone": "accent",
      "style": "solid"
    }
  ],
  "animation": [
    {
      "step": "solid / accent",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "accent"
    }
  ]
}`;

export const sourceYaml__styleDottedFlow = `title: "dotted-flow style (点線 + 粒子、 動的 flow 表現)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "dotted-flow" (accent, dotted-flow) { sub: "点線 + 粒子" }

animation:
  - step: "dotted-flow / accent" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "accent"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__styleDottedFlow = `{
  "title": "dotted-flow style (点線 + 粒子、 動的 flow 表現)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    {
      "from": "始点",
      "to": "終点",
      "label": "dotted-flow",
      "sub": "点線 + 粒子",
      "tone": "accent",
      "style": "dotted-flow"
    }
  ],
  "animation": [
    {
      "step": "dotted-flow / accent",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "accent"
    }
  ]
}`;

export const sourceYaml__toneAccent = `title: "accent tone (主張色、 dark navy)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "accent" (accent, solid)

animation:
  - step: "solid / accent" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "accent"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneAccent = `{
  "title": "accent tone (主張色、 dark navy)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "accent", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / accent",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "accent"
    }
  ]
}`;

export const sourceYaml__toneTeal = `title: "teal tone (青緑、 secondary emphasis)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "teal" (teal, solid)

animation:
  - step: "solid / teal" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "teal"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneTeal = `{
  "title": "teal tone (青緑、 secondary emphasis)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "teal", "tone": "teal", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / teal",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "teal"
    }
  ]
}`;

export const sourceYaml__toneSuccess = `title: "success tone (green、 成功状態)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "success" (success, solid)

animation:
  - step: "solid / success" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "success"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneSuccess = `{
  "title": "success tone (green、 成功状態)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "success", "tone": "success", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / success",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "success"
    }
  ]
}`;

export const sourceYaml__toneError = `title: "error tone (red、 エラー状態)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "error" (error, solid)

animation:
  - step: "solid / error" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "error"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneError = `{
  "title": "error tone (red、 エラー状態)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "error", "tone": "error", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / error",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "error"
    }
  ]
}`;

export const sourceYaml__toneWarning = `title: "warning tone (orange、 警告状態)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "warning" (warning, solid)

animation:
  - step: "solid / warning" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "warning"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneWarning = `{
  "title": "warning tone (orange、 警告状態)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "warning", "tone": "warning", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / warning",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "warning"
    }
  ]
}`;

export const sourceYaml__toneInfo = `title: "info tone (light blue、 情報表示)"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - 始点: { kind: actor, lane: l1 }
  - 終点: { kind: actor, lane: l2 }

flow:
  - 始点 -> 終点: "info" (info, solid)

animation:
  - step: "solid / info" 1.8s
    focus: ["始点", "終点", "始点 -> 終点"]
    badge: "info"
    description: "edge style と tone の組み合わせを確認。"
`;

export const sourceJson__toneInfo = `{
  "title": "info tone (light blue、 情報表示)",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "始点", "kind": "actor", "lane": "l1" },
    { "name": "終点", "kind": "actor", "lane": "l2" }
  ],
  "flow": [
    { "from": "始点", "to": "終点", "label": "info", "tone": "info", "style": "solid" }
  ],
  "animation": [
    {
      "step": "solid / info",
      "duration": 1.8,
      "focus": ["始点", "終点", "始点 -> 終点"],
      "body": "edge style と tone の組み合わせを確認。",
      "badge": "info"
    }
  ]
}`;

export const sourceYaml__stateActive = `title: "edge: 動いている状態"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - A: { kind: actor, lane: l1 }
  - B: { kind: function, lane: l2 }

flow:
  - A -> B: "動作中" (accent, solid)

animation:
  - step: "動いている状態" 1.8s
    focus: ["A", "B", "A -> B"]
    badge: "動作中"
    description: "phase で activate された edge は太く + 色付きで見える。"
`;

export const sourceJson__stateActive = `{
  "title": "edge: 動いている状態",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "A", "kind": "actor", "lane": "l1" },
    { "name": "B", "kind": "function", "lane": "l2" }
  ],
  "flow": [
    { "from": "A", "to": "B", "label": "動作中", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "動いている状態",
      "duration": 1.8,
      "focus": ["A", "B", "A -> B"],
      "body": "phase で activate された edge は太く + 色付きで見える。",
      "badge": "動作中"
    }
  ]
}`;

export const sourceYaml__stateInactive = `title: "edge: 止まっている状態"
type: flow

lanes:
  l1: { x: 0, width: 280 }
  l2: { x: 600, width: 280 }

actors:
  - A: { kind: actor, lane: l1 }
  - B: { kind: function, lane: l2 }

flow:
  - A -> B: "停止中" (accent, solid)

animation:
  - step: "止まっている状態" 1.8s
    focus: ["A", "B"]
    badge: "矢印は停止中"
    description: "activate されていない edge は薄い灰色 + 破線で静かに出る。"
`;

export const sourceJson__stateInactive = `{
  "title": "edge: 止まっている状態",
  "type": "flow",
  "lanes": {
    "l1": { "x": 0, "width": 280 },
    "l2": { "x": 600, "width": 280 }
  },
  "actors": [
    { "name": "A", "kind": "actor", "lane": "l1" },
    { "name": "B", "kind": "function", "lane": "l2" }
  ],
  "flow": [
    { "from": "A", "to": "B", "label": "停止中", "tone": "accent", "style": "solid" }
  ],
  "animation": [
    {
      "step": "止まっている状態",
      "duration": 1.8,
      "focus": ["A", "B"],
      "body": "activate されていない edge は薄い灰色 + 破線で静かに出る。",
      "badge": "矢印は停止中"
    }
  ]
}`;
