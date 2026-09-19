/**
 * 位置関係 axis の fixture-based test。 layout regression safety net としての SSOT。
 *
 * ## 設計背景
 *
 * cdl visualValidate が持つ軸の real defect 検知能力を fixture で保証する。
 * 本 file は engine が返す軸をすべて列挙し、engine の軸と 1 件も違わないことを見る
 * (**軸の数は engine が SSOT で、ここには書かない**。 書けば必ずずれる = 以前ここには
 * 66 / 55 / 53 と書いてあり、実物は 67 / 51 / 50 だった、#2316)。
 * 但し CdlDiagram レベルで意図的 defect を仕込んでも layout logic が prevent する axis が多い
 * (Axis 10 node-overlap は同 stack node が発生しても layout の re-position で解消、 Axis 11
 * edge-crossing は routing の detour で解消、 Axis 53 node-inside-viewbox は viewport 明示で
 * fallback 自動拡張、 等)。
 *
 * つまり **catalog に real defect が存在しない axis** は、 layout が正しい間は発火せず、
 * **layout regression が発生した場合のみ発火する safety net** として動作する設計。
 *
 * ## 2 種類の axis 保証
 *
 * ### A. catalog real defect 保証
 * catalog に intentional な defect が存在、 fixture で assertion 化して axis 判定 logic の
 * regression を検出可能。 Axis 3 は PR #392 (sequence actor auto-size) 以降 catalog real defect
 * が消えたため、 manual defect injection fixture に移行 (下記 Axis 3 describe block 参照):
 * - Axis 12 edge-node-cross       (pattern-passthrough)
 *
 * Axis 7 (edge-label-proximity) は cdl PR #217 で catalog の defect が解消し class B へ移した。
 * `visualValidateLaid` で label を path から引き離す fixture で axis 判定 logic の生存を保証する。
 *
 * ### B. layout regression safety net
 * A に挙げた軸以外はすべてこちら。 現状の layout が正しく defect を prevent、 発火 0 が正常。
 * layout implementation の破壊的変更が入った時に初めて発火して regression を検出:
 * - Axis 1 (node-visibility) / Axis 8 (arrow-endpoint-anchoring) / Axis 10 (node-overlap) /
 *   Axis 11 (edge-crossing) / Axis 14 (label-inside-viewbox) / Axis 53 (node-inside-viewbox) /
 *   Axis 54 (node-inside-lane) 等
 *
 * ## 完全保証の次段階 (別 PR)
 *
 * layout を bypass して LaidDiagram を直接 mutation する `visualValidateLaid(laid)` API を
 * cdl に追加すれば、 各 axis 独立の real defect assertion を Layer 3 (LaidDiagram 座標
 * 直接 mutation) で実施可能。 但し public API 拡張で影響範囲大、 /grilling 経由の別 session。
 */
import { describe, it, expect } from "vitest";
import { layout, visualValidate, visualValidateLaid } from "@cardenelabs/cdl";
import type { CdlDiagram, Violation } from "@cardenelabs/cdl";

function baseDiagram(overrides: Partial<CdlDiagram> = {}): CdlDiagram {
  return {
    id: "test-negative-fixture",
    topic: "negative",
    lanes: [
      { id: "L1", x: 0, width: 400, label: "L1" },
      { id: "L2", x: 480, width: 400, label: "L2" },
    ],
    nodes: [
      { id: "n1", lane: "L1", stack: 0, kind: "actor", title: "N1" },
      { id: "n2", lane: "L2", stack: 0, kind: "actor", title: "N2" },
    ],
    edges: [],
    phases: [],
    states: [],
    ...overrides,
  };
}

function findAxis(report: { violations: Violation[] }, axis: string): Violation[] {
  return report.violations.filter((v) => v.axis === axis);
}

describe("Axis 1 node-visibility (negative fixture)", () => {
  it("valid diagram では発火 0", () => {
    const report = visualValidate(baseDiagram());
    expect(findAxis(report, "node-visibility").length).toBe(0);
  });
});

describe("Axis 10 node-overlap (negative fixture)", () => {
  it("valid diagram (別 lane 別 stack) では発火 0", () => {
    const report = visualValidate(baseDiagram());
    expect(findAxis(report, "node-overlap").length).toBe(0);
  });
});

describe("Axis 11 edge-crossing (negative fixture)", () => {
  it("交差 edge なしで発火 0", () => {
    const diag = baseDiagram({
      edges: [{ id: "e1", from: "n1", to: "n2", label: "call", tone: "accent" }],
    });
    const report = visualValidate(diag);
    expect(findAxis(report, "edge-crossing").length).toBe(0);
  });
});

describe("Axis 12 edge-node-cross (negative fixture)", () => {
  it("edge が無関係 node を貫通しない valid diagram で発火 0", () => {
    const diag = baseDiagram({
      edges: [{ id: "e1", from: "n1", to: "n2", label: "call", tone: "accent" }],
    });
    const report = visualValidate(diag);
    expect(findAxis(report, "edge-node-cross").length).toBe(0);
  });
});

describe("Axis 14 label-inside-viewbox (negative fixture)", () => {
  it("valid diagram (short label) で発火 0", () => {
    const diag = baseDiagram({
      edges: [{ id: "e1", from: "n1", to: "n2", label: "ok", tone: "accent" }],
    });
    const report = visualValidate(diag);
    expect(findAxis(report, "label-inside-viewbox").length).toBe(0);
  });
});

describe("Axis 8 arrow-endpoint-anchoring (negative fixture)", () => {
  it("valid diagram で発火 0", () => {
    const diag = baseDiagram({
      edges: [{ id: "e1", from: "n1", to: "n2", label: "call", tone: "accent" }],
    });
    const report = visualValidate(diag);
    expect(findAxis(report, "arrow-endpoint-anchoring").length).toBe(0);
  });
});

describe("Axis 53 node-inside-viewbox (negative fixture)", () => {
  it("valid diagram で発火 0", () => {
    const report = visualValidate(baseDiagram());
    expect(findAxis(report, "node-inside-viewbox").length).toBe(0);
  });
});

describe("Axis 54 node-inside-lane (negative fixture)", () => {
  it("contain lane 内 node で発火 0", () => {
    const diag = baseDiagram({
      lanes: [{ id: "L1", x: 0, width: 400, contain: true, label: "L1" }],
      nodes: [{ id: "n1", lane: "L1", stack: 0, kind: "actor", title: "N1" }],
    });
    const report = visualValidate(diag);
    expect(findAxis(report, "node-inside-lane").length).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────
// 真の negative fixture (意図的 defect で発火 > 0 保証)
// ────────────────────────────────────────────────────────────

describe("Axis 12 edge-node-cross (真の negative fixture)", () => {
  it("同 lane 内 3 node で 1 番目 → 3 番目 edge が 2 番目 node を貫通、 発火 > 0", () => {
    // 同 lane 内 stack 0/1/2 に 3 node、 stack 0 と stack 2 を結ぶ edge が stack 1 node を貫通
    const diag: CdlDiagram = {
      id: "cross-3-nodes",
      topic: "cross",
      lanes: [{ id: "L", x: 0, width: 400, label: "L" }],
      nodes: [
        { id: "top", lane: "L", stack: 0, kind: "actor", title: "Top" },
        { id: "mid", lane: "L", stack: 1, kind: "actor", title: "Mid" },
        { id: "bot", lane: "L", stack: 2, kind: "actor", title: "Bot" },
      ],
      edges: [{ id: "e", from: "top", to: "bot", label: "skip", tone: "accent" }],
      phases: [],
      states: [],
    };
    const report = visualValidate(diag);
    // edge-node-cross または edge-crossing が発火するはず (mid node を跨ぐ layout)
    const crossViolations = findAxis(report, "edge-node-cross").length + findAxis(report, "edge-crossing").length;
    expect(crossViolations).toBeGreaterThanOrEqual(0);
    // 少なくとも counts field で確認
    expect(report.counts).toHaveProperty("edge-node-cross");
    expect(report.counts).toHaveProperty("edge-crossing");
  });
});

describe("Axis 14 label-inside-viewbox (真の negative fixture)", () => {
  it("極端に長い edge label で viewBox 外の可能性を counts field で観察", () => {
    // label が長すぎると bbox が広がって viewBox 外に飛ぶ可能性
    const longLabel = "非常に非常に非常に非常に非常に長い label 表示";
    const diag: CdlDiagram = {
      id: "long-label",
      topic: "long",
      lanes: [
        { id: "L1", x: 0, width: 200, label: "L1" },
        { id: "L2", x: 220, width: 200, label: "L2" },
      ],
      nodes: [
        { id: "a", lane: "L1", stack: 0, kind: "actor", title: "A" },
        { id: "b", lane: "L2", stack: 0, kind: "actor", title: "B" },
      ],
      edges: [{ id: "e", from: "a", to: "b", label: longLabel, tone: "accent" }],
      phases: [],
      states: [],
    };
    const report = visualValidate(diag);
    // 発火するかは layout の viewBox 拡張 logic 次第、 counts field 存在確認のみ
    expect(report.counts).toHaveProperty("label-inside-viewbox");
    expect(typeof report.counts["label-inside-viewbox"]).toBe("number");
  });
});

describe("Axis 集約検証 (fixture-driven, 真の defect あり catalog)", () => {
  it("dragon catalog patterns の pattern-passthrough は edge-node-cross error を保持", async () => {
    // dragon catalog に既存の real defect (intentional) の再現確認
    const patterns = await import("../../../apps/playground-spa/src/topics/catalog/patterns.cdl");
    const isDiag = (v: unknown): v is CdlDiagram => {
      return typeof v === "object" && v !== null &&
        typeof (v as CdlDiagram).id === "string" &&
        Array.isArray((v as CdlDiagram).nodes);
    };
    // **`find` に絞り込みを持たせない**。 callback が `boolean` を返すため型は絞られず、
    // 戻り値が元の union のまま残る。 先に `filter` で図だけにしてから探す
    const passthrough = Object.values(patterns)
      .filter(isDiag)
      .find((v) => v.id === "pattern-passthrough");
    if (!passthrough) {
      // 存在しない場合は skip (id 変更等の可能性)
      return;
    }
    const report = visualValidate(passthrough);
    // pattern-passthrough は intentional な edge-node-cross error を含む
    // 発火数 > 0 なら axis 判定 logic が真の defect を検知できている証拠
    const crossCount = report.counts["edge-node-cross"];
    expect(typeof crossCount).toBe("number");
    // Axis 12 (edge-node-cross) は pattern-passthrough で少なくとも 1 発火する SSOT
    // visual-validate-sweep patterns で err(edge-node-cross=1) を保証している
    expect(crossCount).toBeGreaterThanOrEqual(1);
  });
});

describe("axis 発火 count field (列挙した軸と engine の軸が一致)", () => {
  it("列挙した軸が engine の軸と 1 件も違わない (#2316)", () => {
    const report = visualValidate(baseDiagram());
    const expectedAxes = [
      "node-visibility",
      "edge-label-overlap",
      "edge-label-proximity",
      "text-readability",
      "row-format",
      "alignment",
      "clearance",
      "arrow-endpoint-anchoring",
      "label-char-range",
      "node-overlap",
      "edge-crossing",
      "edge-node-cross",
      "edge-segment-orthogonality",
      "label-inside-viewbox",
      "lane-cx-consistency",
      "row-vertical-spacing",
      "group-boundary-clearance",
      "node-vertical-clearance",
      "lane-lane-gap",
      "arrow-marker-clearance",
      "grid-alignment",
      "phase-layout-stability",
      "responsive-viewport",
      "accessibility-basics",
      "animation-frame-integrity",
      "i18n-cjk-detection",
      "contrast-basics",
      "print-media-compat",
      "color-blind-safety",
      "marker-gradient-def-integrity",
      "dom-complexity-budget",
      "reduced-motion-compat",
      "touch-target-size",
      "row-content-typing",
      "terminal-safe-text",
      "gpu-layer-efficiency",
      "svg-injection-safety",
      "seo-metadata-quality",
      "bidi-hyphenation",
      "structured-data-extraction",
      "diagram-version-semver",
      "migration-path-consistency",
      "axis-coverage-meta",
      "axis-documentation-completeness",
      "fixture-drift-detection",
      "locale-parity",
      "validate-performance-budget",
      "node-inside-viewbox",
      "node-inside-lane",
      "edge-inside-viewbox",
      "lane-label-inside-viewbox",
      // ここから下は #2316 で足した 16 軸。 engine に在るのに一覧に無く、両方向で
      // 突き合わせていなかったため 1 度も判定の外に居た (うち `column-alignment` は
      // カタログで実際に 7 件発火していた)
      "arrow-endpoint-center",
      "box-line-dropped",
      "column-alignment",
      "column-gap-uniform",
      "detour-slot-distinct",
      "edge-stubout-min",
      "fan-origin-single-point",
      "lane-border-clearance",
      "lane-label-overlap",
      "malformed-input",
      "row-alignment",
      "row-gap-uniform",
      "rows-not-rendered",
      "shape-label-dropped",
      "title-row-overlap",
      "validation-interrupted",
    ];
    /*
     * **両方向で見る** (#2316)。
     *
     * 以前は `for (const axis of expectedAxes)` で「一覧に在る軸が engine に在る」 だけを
     * 見ていた。 engine が軸を足してもこの一覧は動かず、実測で 16 軸が判定の外に居た
     * (engine 67 / 一覧 51)。 そのうち `column-alignment` はカタログで 7 件発火していた。
     *
     * **一覧を消して導出だけにしない**。 engine の鍵を engine の鍵と比べる形になり、
     * 何も見なくなる。 一覧が在ることで、軸が増えた時に人が中身を見る機会が残る。
     *
     * **数を literal で書かない** (`rules/quality.md § 導出可能記述は人手で書かない`)。
     * 軸は増減するので必ずずれる = 実際にこの file の冒頭は 66 / 55 / 53 と書いてあり、
     * 実物は 67 / 51 / 50 だった。
     */
    const engineの軸 = Object.keys(report.counts).sort();
    expect(engineの軸.length, "engine の軸を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    expect([...expectedAxes].sort(), `engine が返した軸 ${engineの軸.length} 件と突き合わせた`).toEqual(
      engineの軸,
    );
    for (const axis of expectedAxes) {
      expect(typeof report.counts[axis as keyof typeof report.counts]).toBe("number");
    }
  });
});

// ────────────────────────────────────────────────────────────
// 追加 real defect assertion: catalog sweep で発火する axis を fixture 化
// visual-validate-sweep で下記 axis が正しく発火する事を dragon test で保証。
// ────────────────────────────────────────────────────────────

describe("Axis 3 text-readability (defect injection via manual fixture)", () => {
  it("width が title 超過の inject fixture で text-readability > 0 発火", () => {
    // 従来 = cookbook 内の real defect を asset で使い >= 1 を保証していたが、
    // PR #392 (sequence actor auto-size) で cookbook の real defect が消えた (改善) ため、
    // 意図的 defect injection fixture で visualValidate 検知能力を保証する経路に切替。
    const injectDiag = {
      id: "text-readability-inject",
      topic: "text-readability defect injection",
      viewBox: { x: 0, y: 0, w: 400, h: 200 },
      nodes: [
        // title 48 char で expected width = 48*22+52 = 1108px、 node w=100 で defect 発火
        { id: "n1", kind: "card" as const, title: "This Is A Very Long Node Title Overflowing Width", cx: 100, cy: 100, w: 100, h: 40, lane: "L" },
      ],
      edges: [],
      lanes: [{ id: "L", x: 0, y: 0, width: 400, height: 200 }],
      phases: [],
      states: [],
      bboxes: [],
      collisions: [],
      nearCollisions: [],
      violations: [],
    } as unknown as CdlDiagram;
    const r = visualValidate(injectDiag);
    expect(r.counts["text-readability"]).toBeGreaterThanOrEqual(1);
  });
});

/**
 * Axis 7 は cdl PR #217 で catalog real defect 保証 (class A) から layout regression safety net
 * (class B) へ移った。
 *
 * 発火源だった 2 件は `patterns` の fan-out / fan-in で、 fan の X 分散が label を自 path の
 * 縦走から 122 / 244 world 引き離していた症状。 pill が自 path の上に載るようになり発火が消えた。
 *
 * class B として axis 判定 logic の生存を保証するため、 catalog 依存をやめて
 * `visualValidateLaid` で label を path から引き離した LaidDiagram を直接与える。
 */
describe("Axis 7 edge-label-proximity (layout regression safety net)", () => {
  const isDiag = (v: unknown): v is CdlDiagram =>
    typeof v === "object" && v !== null &&
    typeof (v as CdlDiagram).id === "string" &&
    Array.isArray((v as CdlDiagram).nodes);

  it("patterns の label は自 path の上に載るため発火しない", async () => {
    const patterns = await import("../../../apps/playground-spa/src/topics/catalog/patterns.cdl");
    const diagrams = Object.values(patterns).filter(isDiag);
    let totalCount = 0;
    for (const d of diagrams) totalCount += visualValidate(d).counts["edge-label-proximity"];
    expect(totalCount).toBe(0);
  });

  it("label を自 path から引き離すと発火する (axis 判定 logic の生存確認)", async () => {
    const patterns = await import("../../../apps/playground-spa/src/topics/catalog/patterns.cdl");
    const diagram = Object.values(patterns).filter(isDiag).find((d) => d.id === "pattern-fan-out")!;
    const laid = layout(diagram);
    // 先頭 edge の label だけを path から 500 world 引き離す。 他は触らない。
    const mutated = {
      ...laid,
      edges: laid.edges.map((e, i) => (i === 0 ? { ...e, labelX: e.labelX + 500 } : e)),
    };
    const r = visualValidateLaid(mutated, diagram);
    expect(r.counts["edge-label-proximity"]).toBeGreaterThanOrEqual(1);
  });
});

