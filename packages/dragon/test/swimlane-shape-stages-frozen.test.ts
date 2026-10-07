import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { sourceYaml__textDslSwimlaneStages } from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import { compileToCdl, type CompileNotice } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

function 組み立てる(source: string): ReturnType<typeof compileToCdl> {
  const parsed = parseTextDslV05(source);
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
  return compileToCdl(parsed.doc, { onNotice: () => {} });
}

describe("段階ごとの箱の出力を固定する (#2799)", () => {
  it("見本帳の段階ごとの箱", () => {
    expect(組み立てる(sourceYaml__textDslSwimlaneStages)).toMatchSnapshot();
  });

  it("animation を持たない小さな段階ごとの箱", () => {
    expect(
      組み立てる(`title: "段階の固定"
type: swimlane
shape: stages
actors:
  - 受付: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
flow:
  - 受付 -> 確認: "渡す"
`),
    ).toMatchSnapshot();
  });
});

describe("段の箱で分かれ道と始まりと終わりを書く (#2830)", () => {
  const 宅配の本文 = (): string => `title: "荷物を届ける"
type: swimlane
shape: stages
lanes:
  shipper: { label: 荷主 }
  office: { label: 営業所 }
  courier: { label: 配送便 }
actors:
  - 始まり: { kind: mark-start, lane: shipper }
  - 集荷を頼む: { stage: 申し込み, lane: shipper }
  - 受け付ける: { stage: 受付, lane: office }
  - 送り状を起こす: { stage: 受付, lane: office }
  - 便に積む: { stage: 配送, lane: courier }
  - 届けに行く: { stage: 配送, lane: courier }
  - 在宅?: { kind: decision, stage: 配送, lane: courier }
  - 受け取る: { stage: 結果, lane: shipper }
  - 持ち戻る: { stage: 結果, lane: courier }
  - 終わり: { kind: mark-end, lane: shipper }
flow:
  - 始まり -> 集荷を頼む
  - 集荷を頼む -> 受け付ける
  - 受け付ける -> 送り状を起こす
  - 送り状を起こす -> 便に積む
  - 便に積む -> 届けに行く
  - 届けに行く -> 在宅?
  - 在宅? -> 受け取る: "はい"
  - 在宅? -> 持ち戻る: "いいえ"
  - 持ち戻る -> 便に積む: "翌日もう一度" (dashed)
  - 受け取る -> 終わり
`;
  const parsed = parseTextDslV05(宅配の本文());
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
  const notices: CompileNotice[] = [];
  const diagram = compileToCdl(parsed.doc, { onNotice: (notice) => notices.push(notice) });
  const markup = renderToStaticMarkup(createElement(CdlDiagramView, { diagram }));
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));

  it("始まりと終わりの印を node に描かない", () => {
    expect(diagram.nodes.filter((node) => node.kind === "mark-start" || node.kind === "mark-end")).toHaveLength(0);
    expect(diagram.nodes.some((node) => node.id === "始まり" || node.id === "終わり")).toBe(false);
    expect(markup).not.toContain('data-cdl-mark="start"');
    expect(markup).not.toContain('data-cdl-mark="end"');
  });

  it("分かれ道を普通の箱として分かれ道の札付きで描く", () => {
    expect(diagram.nodes.filter((node) => node.kind === "decision")).toHaveLength(0);
    const decisions = diagram.nodes.filter((node) => node.subtitle === "分かれ道");
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({ title: "在宅?", kind: diagram.nodes.find((node) => node.id === "集荷を頼む")?.kind });
  });

  it("始まりと終わりのための段階の列を作らない", () => {
    expect(diagram.lanes.map((lane) => lane.stage?.name)).toEqual([
      "申し込み",
      "受付",
      "配送",
      "結果",
    ]);
  });

  it("余計な知らせを出さない", () => {
    expect(notices).toEqual([]);
  });

  it("分かれ道と戻り線のラベルと破線を保つ", () => {
    expect(diagram.edges.find((edge) => edge.from === "在宅" && edge.to === "受け取る")?.label).toBe("はい");
    expect(diagram.edges.find((edge) => edge.from === "在宅" && edge.to === "持ち戻る")?.label).toBe("いいえ");
    expect(diagram.edges.find((edge) => edge.from === "持ち戻る" && edge.to === "便に積む")).toMatchObject({ style: "dashed", label: "翌日もう一度" });
  });

  it("印から出入りする宙に浮いた線を残さない", () => {
    expect(diagram.edges).toHaveLength(8);
    expect(diagram.edges.every((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))).toBe(true);
  });

  it("描かない終わりを挟む二本の線を一本に繋ぎ直す", () => {
    const source = `title: "繋ぎ直す"
type: swimlane
shape: stages
actors:
  - 受付: { stage: 申請 }
  - 中継: { kind: mark-end, stage: 申請 }
  - 確認: { stage: 審査 }
flow:
  - 受付 -> 中継: "渡す"
  - 中継 -> 確認
`;
    const parsedRelay = parseTextDslV05(source);
    if (!parsedRelay.ok) throw new Error(parsedRelay.errors.map((error) => error.message).join("\n"));
    const relay = compileToCdl(parsedRelay.doc, { onNotice: () => {} });
    expect(relay.edges).toEqual([expect.objectContaining({ from: "受付", to: "確認", label: "渡す" })]);
  });
});
