import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { compileToCdl, type CompileNotice } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

function 組み立てる(source: string): {
  diagram: ReturnType<typeof compileToCdl>;
  markup: string;
  notices: CompileNotice[];
} {
  const parsed = parseTextDslV05(source);
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => `${error.message} ${error.hint ?? ""}`).join("\n"));
  const notices: CompileNotice[] = [];
  const diagram = compileToCdl(parsed.doc, { onNotice: (notice) => notices.push(notice) });
  return {
    diagram,
    markup: renderToStaticMarkup(createElement(CdlDiagramView, { diagram })),
    notices,
  };
}

const 本文 = (actors: string, extra = "", flow = '  - 受付 -> 完了: "渡す"'): string => `title: "申請の流れ"
shape: stages
type: swimlane
${extra}actors:
${actors}
flow:
${flow}
`;

const 段階の箱の数 = (markup: string): number =>
  (
    markup.match(
      /<g data-cdl-lane="stage-[^"]+" data-cdl-lane-x=[^>]*>[\s\S]*?<rect data-cdl-role="lane-container"/g,
    ) ?? []
  ).length;
const 役割の数 = (markup: string, role: string): number =>
  (markup.match(new RegExp(`data-cdl-role="${role}"`, "g")) ?? []).length;

describe("段階ごとの箱を並べる泳法図 (#2797)", () => {
  it("英語の stage を縦に書いた数だけ段階の箱を作る", () => {
    const { markup } = 組み立てる(
      本文(`  - 受付:
    stage: 申請
    lane: front
  - 確認:
    stage: 審査
    lane: review
  - 完了:
    stage: 完了
    lane: front`),
    );
    expect(段階の箱の数(markup)).toBe(3);
  });

  it("和名の 段階 を縦に書いた数だけ段階の箱を作る", () => {
    const { markup } = 組み立てる(
      本文(`  - 受付:
    段階: 申請
    lane: front
  - 確認:
    段階: 審査
    lane: review
  - 完了:
    段階: 完了
    lane: front`),
    );
    expect(段階の箱の数(markup)).toBe(3);
  });

  it("中括弧の stage と 段階 を読める", () => {
    const { markup } = 組み立てる(
      本文(`  - 受付: { stage: 申請, lane: front }
  - 確認: { 段階: 審査, lane: review }
  - 完了: { stage: 完了, lane: front }`),
    );
    expect(段階の箱の数(markup)).toBe(3);
  });

  it("段の札へ宣言した担当名を重複なく添える", () => {
    const { diagram, markup } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 入力: { stage: 申請, lane: front }
  - 確認: { stage: 申請, lane: review }
  - 完了: { stage: 完了, lane: front }`,
        `lanes:
  front: { label: 窓口 }
  review: { label: 審査係 }
`,
        '  - 受付 -> 入力: "書く"\n  - 入力 -> 確認: "渡す"\n  - 確認 -> 完了: "返す"',
      ),
    );
    expect(diagram.lanes.map((lane) => lane.label)).toContain("申請 ・ 窓口、審査係");
    expect(markup).toContain("窓口");
    expect(markup).toContain("審査係");
    expect(役割の数(markup, "lane-label")).toBeGreaterThan(0);
  });

  it("stack は段階の中の段として使う", () => {
    const { diagram } = 組み立てる(
      本文(
        `  - 後: { stage: 申請, lane: front, stack: 1 }
  - 先: { stage: 申請, lane: front, stack: 0 }
  - 完了: { stage: 完了, lane: front }`,
        "",
        '  - 先 -> 後: "続ける"\n  - 後 -> 完了: "渡す"',
      ),
    );
    expect(diagram.nodes.map((node) => [node.title, node.stack])).toEqual([
      ["後", 1],
      ["先", 0],
      ["完了", 0],
    ]);
  });

  it("stage が無い箱は lane と箱名を段階に使い、知らせを図全体で1件だけ出す", () => {
    const { diagram, markup, notices } = 組み立てる(
      本文(`  - 受付: { lane: front }
  - 確認: { lane: review }
  - 完了`),
    );
    expect(段階の箱の数(markup)).toBe(3);
    expect(diagram.lanes.map((lane) => lane.label)).toEqual(expect.arrayContaining(["front", "review", "完了"]));
    const fallback = notices.filter((notice) => (notice.kind as string) === "stage-from-lane");
    expect(fallback).toHaveLength(1);
    expect(fallback[0]?.message).toContain("受付");
    expect(fallback[0]?.message).toContain("確認");
    expect(fallback[0]?.message).toContain("完了");
  });

  it("stage が1つも無い時は同じ担当の箱を同じ段階へまとめる", () => {
    const { diagram, markup, notices } = 組み立てる(
      本文(
        `  - 受付: { lane: front }
  - 入力: { lane: front }
  - 確認: { lane: review }`,
        "",
        '  - 受付 -> 入力: "書く"\n  - 入力 -> 確認: "渡す"',
      ),
    );
    expect(段階の箱の数(markup)).toBe(2);
    expect(diagram.lanes.map((lane) => lane.label)).toEqual(["front", "review"]);
    expect(notices.filter((notice) => notice.kind === "stage-from-lane")).toHaveLength(1);
  });

  it("animation があっても段階の箱の数を保つ", () => {
    const { markup } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
  - 完了: { stage: 完了, lane: front }`,
        `animation:
  - step: "受け付ける" 1s
    focus: [受付]
  - step: "確認する" 1s
    focus: [確認]
`,
      ),
    );
    expect(段階の箱の数(markup)).toBe(3);
  });

  it("lanes は担当の宣言に使い、空の縦列を増やさない", () => {
    const { diagram, markup, notices } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
  - 完了: { stage: 完了, lane: front }`,
        `lanes:
  front: { label: 窓口 }
  review: { label: 審査係 }
`,
      ),
    );
    expect(段階の箱の数(markup)).toBe(3);
    expect(diagram.lanes).toHaveLength(3);
    expect(diagram.lanes.every((lane) => lane.id.startsWith("stage-"))).toBe(true);
    expect(notices.filter((notice) => notice.kind === "lane-declared-empty")).toEqual([]);
  });

  it("direction は配置を変えず、向きの知らせを1件だけ出す", () => {
    const { markup, notices } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
  - 完了: { stage: 完了, lane: front }`,
        "direction: 縦\n",
      ),
    );
    expect(段階の箱の数(markup)).toBe(3);
    expect(
      notices.filter((notice) =>
        ["direction-not-honored", "direction-same-as-default"].includes(notice.kind),
      ),
    ).toHaveLength(1);
  });

  it("段階をまたぐ線だけを curve にし、描いた path に3次曲線を含める", () => {
    const { diagram, markup } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 入力: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }`,
        `animation:
  - step: "確認する" 1s
    focus: [受付, 入力, 確認]
`,
        '  - 受付 -> 入力: "書く"\n  - 入力 -> 確認: "渡す"',
      ),
    );
    expect(diagram.edges.map((edge) => edge.routing)).toEqual([undefined, "curve"]);
    const paths = [...markup.matchAll(/<path(?=[^>]*data-cdl-role="edge-line")(?=[^>]*\sd="([^"]+)")[^>]*>/g)].map(
      (match) => match[1],
    );
    expect(paths).toHaveLength(2);
    expect(paths[0]).not.toMatch(/\bC\b/);
    expect(paths[1]).toMatch(/\bC\b/);
  });

  it("段階の箱と札に描画側の role が付く", () => {
    const { markup } = 組み立てる(
      本文(`  - 受付: { stage: 申請, lane: front }
  - 完了: { stage: 完了, lane: front }`),
    );
    expect(役割の数(markup, "lane-container")).toBeGreaterThan(0);
    expect(役割の数(markup, "lane-label")).toBeGreaterThan(0);
  });

  it.each([
    ["flow", "stage: 申請"],
    ["swimlane", "stage: 申請"],
  ])("stage が効かない %s では箱の欄の知らせに段階を出す", (type, field) => {
    const source = `title: "効かない段階"
type: ${type}
actors:
  - 受付:
    ${field}
  - 完了
flow:
  - 受付 -> 完了: "渡す"
`;
    const { notices } = 組み立てる(source);
    const actorNotices = notices.filter((notice) => notice.kind === "actor-option-not-honored");
    expect(actorNotices).toHaveLength(1);
    expect(actorNotices[0]?.message).toContain("段階");
  });
});
