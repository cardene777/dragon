import { describe, expect, it } from "vitest";

import { jsonToDiagram, textDslToDiagram, validateDragonJson } from "../src";

describe("cdl 0.130.0 の欄を記法から渡す (#2854)", () => {
  it("表の箱の意匠・行の色の段・足・入れ子を YAML / JSON から渡す", () => {
    const yaml = textDslToDiagram(`title: 関係
type: record
actors:
  - 契約: { kind: storage, emptyRowsNote: "操作を持たない", emphasis: primary, titleAlign: center, rowRules: true, rowMarkForm: tone, figureCard: {"label":"抱える 1","note":"記録 2"}, rows: [id, 状態], marks: [{"mark":"鍵","tone":"primary"},{"mark":"","tone":"muted"}] }
  - 明細: { kind: storage, nestIn: 契約 }
flow: []
`);
    const json = jsonToDiagram({
      title: "関係",
      type: "record",
      actors: [
        {
          name: "契約",
          kind: "storage",
          emptyRowsNote: "操作を持たない",
          emphasis: "primary",
          titleAlign: "center",
          rowRules: true,
          rowMarkForm: "tone",
          figureCard: { label: "抱える 1", note: "記録 2" },
          rows: ["id", "状態"],
          marks: [
            { mark: "鍵", tone: "primary" },
            { mark: "", tone: "muted" },
          ],
        },
        { name: "明細", kind: "storage", nestIn: "契約" },
      ],
      flow: [],
    });

    for (const diagram of [yaml, json]) {
      const parent = diagram.nodes.find((node) => node.id === "契約");
      const child = diagram.nodes.find((node) => node.id === "明細");
      expect(parent).toMatchObject({
        emptyRowsNote: "操作を持たない",
        emphasis: "primary",
        titleAlign: "center",
        rowRules: true,
        rowMarkForm: "tone",
        figureCard: { label: "抱える 1", note: "記録 2" },
        rowMarks: [
          { shape: "square", filled: true, underline: true, tone: "primary" },
          { shape: "square", filled: true, tone: "muted" },
        ],
      });
      expect(child?.nestIn).toBe("契約");
    }
  });

  it("共通の部品箱と通常 lane の補足を YAML / JSON から渡す", () => {
    const yaml = textDslToDiagram(`title: 構成
type: topology
actors:
  - 受付: { kind: service, kindForm: icon, icon: terminal, figureCard: {"label":"部品","note":"L2"}, lane: app }
flow: []
lanes:
  app: { label: "配送システム", subtitle: "L2 · 中の部品" }
`);
    const json = jsonToDiagram({
      title: "構成",
      type: "topology",
      actors: [
        {
          name: "受付",
          kind: "service",
          kindForm: "icon",
          icon: "terminal",
          figureCard: { label: "部品", note: "L2" },
          lane: "app",
        },
      ],
      flow: [],
      lanes: { app: { label: "配送システム", subtitle: "L2 · 中の部品" } },
    });
    for (const diagram of [yaml, json]) {
      expect(diagram.nodes.find((node) => node.id === "受付")).toMatchObject({
        kindForm: "icon",
        icon: "terminal",
        figureCard: { label: "部品", note: "L2" },
      });
      expect(diagram.lanes.find((lane) => lane.id === "app")?.subtitle).toBe("L2 · 中の部品");
    }
  });

  it("順序図の枠・種類札・返す矢じり・種類名を YAML / JSON から渡す", () => {
    const yaml = textDslToDiagram(`title: 順序
type: sequence
sequenceActorForm: box
sequenceLabelForm: kind
sequenceReturnHead: solid
sequenceKindLabels: {"call":"呼ぶ","return":"返す","fire":"投げる"}
actors:
  - 荷主
  - 営業所
flow:
  - 荷主 -> 営業所: 依頼 { kind: call }
`);
    const json = jsonToDiagram({
      title: "順序",
      type: "sequence",
      sequenceActorForm: "box",
      sequenceLabelForm: "kind",
      sequenceReturnHead: "solid",
      sequenceKindLabels: { call: "呼ぶ", return: "返す", fire: "投げる" },
      actors: ["荷主", "営業所"],
      flow: [{ from: "荷主", to: "営業所", label: "依頼", kind: "call" }],
    });
    for (const diagram of [yaml, json]) {
      expect(diagram.nodes[0]?.sequenceData).toMatchObject({
        sequenceActorForm: "box",
        sequenceLabelForm: "kind",
        sequenceReturnHead: "solid",
        sequenceKindLabels: { call: "呼ぶ", return: "返す", fire: "投げる" },
      });
    }
  });

  it("凡例の色・線種・注記の位置と導入句を YAML / JSON から渡す", () => {
    const yaml = textDslToDiagram(`title: 凡例
type: flow
actors:
  - A
flow: []
legend:
  - { mark: line-diamond-hollow, text: "集約 (外しても残る)", tone: teal, lineStyle: solid }
  - { mark: line-triangle-hollow, text: "実装", tone: accent, lineStyle: dotted }
  - { text: "持つ は線を引かない。 注文 が 明細 を抱えるように、囲いで出す", align: start, lead: "持つ" }
`);
    const source = {
      title: "凡例",
      type: "flow",
      actors: ["A"],
      flow: [],
      legend: [
        {
          mark: "line-diamond-hollow",
          text: "集約 (外しても残る)",
          tone: "teal",
          lineStyle: "solid",
        },
        { mark: "line-triangle-hollow", text: "実装", tone: "accent", lineStyle: "dotted" },
        {
          text: "持つ は線を引かない。 注文 が 明細 を抱えるように、囲いで出す",
          align: "start",
          lead: "持つ",
        },
      ],
    };
    expect(validateDragonJson(source).ok).toBe(true);
    const json = jsonToDiagram(source);
    for (const diagram of [yaml, json]) {
      expect(diagram.legend).toEqual(source.legend);
    }
  });

  it("閉じた値と入れ子の綴り違いを JSON で知らせる", () => {
    const result = validateDragonJson({
      title: "誤り",
      type: "record",
      actors: [
        {
          name: "A",
          kindForm: "card",
          icon: "phone",
          rowMarkForm: "shape",
          marks: [{ mark: "鍵", tone: "strong", extra: true }],
        },
      ],
      flow: [],
      sequenceActorForm: "frame",
      sequenceKindLabels: { calls: "呼ぶ" },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining([
        "$.actors[0].kindForm",
        "$.actors[0].icon",
        "$.actors[0].rowMarkForm",
        "$.actors[0].marks[0].tone",
        "$.actors[0].marks[0].extra",
        "$.sequenceActorForm",
        "$.sequenceKindLabels.calls",
      ]),
    );
  });
});
