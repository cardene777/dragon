import { describe, expect, it } from "vitest";
import { jsonToDiagram, textDslToDiagram, validateDragonJson } from "../src";
import { 図表の大きさ } from "../src/compile/chart-fields";

const actors = `actors:
  - 受付: { value: "普通", opportunity: "待ち時間を減らす", opportunityPosition: below-point }
`;

describe("3 段目 c の図の欄を記法から渡す (#2854)", () => {
  it("YAML の木の形・枝の濃さ・矢じりを描画の札へ渡す", () => {
    const node = textDslToDiagram(`title: 木
type: tree
treeNodeForm: frame
treeEdgeTone: depth
treeEdgeHead: triangle
actors:
  - 親
  - 子
flow:
  - 親 -> 子
`).nodes[0];
    expect(node).toMatchObject({
      treeNodeForm: "frame",
      treeEdgeTone: "depth",
      treeEdgeHead: "triangle",
    });
  });

  it("YAML の放射の形を描画の札へ渡す", () => {
    const node = textDslToDiagram(`title: 放射
type: mind
mindForm: outline
actors:
  - 中心
  - 枝
flow:
  - 中心 -> 枝
`).nodes[0];
    expect(node?.mindForm).toBe("outline");
  });

  it("YAML のジャーニーの罫・直線・段名・注記位置を描画へ渡す", () => {
    const node = textDslToDiagram(`title: 道のり
type: journey
journeyForm: rules
journeyLineForm: straight
journeyLabels: {"delighted":"最高","happy":"満足","neutral":"普通","frustrated":"不満","angry":"怒り"}
${actors}`).nodes[0];
    expect(node).toMatchObject({
      journeyForm: "rules",
      journeyLineForm: "straight",
      journeyLabels: {
        delighted: "最高",
        happy: "満足",
        neutral: "普通",
        frustrated: "不満",
        angry: "怒り",
      },
      journeyData: [{ opportunityPosition: "below-point" }],
    });
  });

  it("図の札の見出し帯と足を YAML から渡す", () => {
    const node = textDslToDiagram(`title: 棒
type: chart
shape: bar
figureCard: {"label":"棒 / 今月","note":"単位 件"}
actors:
  - A: "10"
`).nodes[0];
    expect(node?.figureCard).toEqual({ label: "棒 / 今月", note: "単位 件" });
  });

  it("figureSize は図の札だけを指定値へ変え、帯を札より広くする", () => {
    const diagram = textDslToDiagram(`title: 道のり
type: journey
figureSize: {"width":1712,"height":384}
${actors}`);
    const node = diagram.nodes[0];
    expect(node).toMatchObject({ w: 1712, h: 384 });
    expect(diagram.lanes.find((lane) => lane.id === node?.lane)?.width).toBe(1776);
  });

  it("figureSize を書かない journey / tree は従来の寸法を保つ", () => {
    const journey = textDslToDiagram(`title: 道のり
type: journey
${actors}`).nodes[0];
    const tree = textDslToDiagram(`title: 木
type: tree
actors:
  - 親
  - 子
flow:
  - 親 -> 子
`).nodes[0];
    expect(journey).toMatchObject({ w: 図表の大きさ.journey.w, h: 図表の大きさ.journey.h });
    expect(tree?.h).toBe(図表の大きさ.tree.h);
    expect(Object.hasOwn(journey ?? {}, "figureCard")).toBe(false);
    expect(Object.hasOwn(tree ?? {}, "figureCard")).toBe(false);
  });

  it("JSON でも同じ欄を検証し、描画へ渡す", () => {
    const source = {
      title: "道のり",
      type: "journey",
      journeyForm: "rules",
      journeyLineForm: "straight",
      journeyLabels: {
        delighted: "最高",
        happy: "満足",
        neutral: "普通",
        frustrated: "不満",
        angry: "怒り",
      },
      figureCard: { label: "ジャーニー", note: "最高 から 怒り の 5 段" },
      figureSize: { width: 1712, height: 384 },
      actors: [{
        name: "受付",
        value: "普通",
        opportunity: "待ち時間を減らす",
        opportunityPosition: "below-point",
      }],
      flow: [],
    };
    const validation = validateDragonJson(source);
    expect(
      validation.ok,
      validation.ok ? "" : validation.errors.map((error) => `${error.path}: ${error.message}`).join(" / "),
    ).toBe(true);
    expect(jsonToDiagram(source as never).nodes[0]).toMatchObject({
      journeyForm: "rules",
      journeyLineForm: "straight",
      figureCard: { label: "ジャーニー", note: "最高 から 怒り の 5 段" },
      w: 1712,
      h: 384,
      journeyData: [{ opportunityPosition: "below-point" }],
    });
  });
});
