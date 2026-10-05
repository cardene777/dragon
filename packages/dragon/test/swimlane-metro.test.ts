import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { compileToCdl, type CompileNotice } from "../src/compile";
import { jsonToDoc, validateDragonJson } from "../src/json-parser";
import type { DslDocument } from "../src/types";
import { parseTextDslV05 } from "../src/v05/parser";

function 組み立てる(source: string): {
  diagram: ReturnType<typeof compileToCdl>;
  markup: string;
  notices: CompileNotice[];
} {
  const parsed = parseTextDslV05(source);
  if (!parsed.ok)
    throw new Error(
      parsed.errors.map((error) => `${error.message} ${error.hint ?? ""}`).join("\n"),
    );
  const notices: CompileNotice[] = [];
  const diagram = compileToCdl(parsed.doc, { onNotice: (notice) => notices.push(notice) });
  return {
    diagram,
    markup: renderToStaticMarkup(createElement(CdlDiagramView, { diagram })),
    notices,
  };
}

const 本文 = (
  extra = "",
  flow = `  - 受け付け -> 審査する: "渡す"
  - 審査する -> 補正する: "下げる"
  - 補正する -> 確認する: "上げる"
  - 確認する -> 完了する: "返す"
  - 完了する -> 後処理する: "保管"`,
): string => `title: "申請を路線図で追う"
type: swimlane
shape: metro
lanes:
  front: { label: 窓口 }
  review: { label: 審査 }
  back: { label: 裏方 }
  unused: { label: 使わない担当 }
actors:
  - 受け付け: { lane: front }
  - 審査する: { lane: review }
  - 補正する: { lane: back }
  - 確認する: { lane: review }
  - 完了する: { lane: front }
  - 後処理する: { lane: archive }
flow:
${flow}
${extra}`;

const 駅の数 = (markup: string): number =>
  (markup.match(/data-cdl-role="node-body"[^>]*data-cdl-mark="station"/g) ?? []).length;
const 線路の数 = (markup: string): number =>
  (markup.match(/data-cdl-routing="metro"/g) ?? []).length;
const edgePaths = (markup: string): string[] =>
  [...markup.matchAll(/data-cdl-path-d="([^"]+)"/g)].map((match) => match[1]!);

type PathCommand =
  | { kind: "M" | "L"; x: number; y: number }
  | {
      kind: "A";
      rx: number;
      ry: number;
      rotation: number;
      large: number;
      sweep: number;
      x: number;
      y: number;
    };

function pathCommands(path: string): PathCommand[] {
  const tokens = path.match(/[MLA]|-?\d+(?:\.\d+)?/g) ?? [];
  const commands: PathCommand[] = [];
  for (let index = 0; index < tokens.length;) {
    const kind = tokens[index++];
    if (kind === "M" || kind === "L") {
      commands.push({ kind, x: Number(tokens[index++]), y: Number(tokens[index++]) });
    } else if (kind === "A") {
      commands.push({
        kind,
        rx: Number(tokens[index++]),
        ry: Number(tokens[index++]),
        rotation: Number(tokens[index++]),
        large: Number(tokens[index++]),
        sweep: Number(tokens[index++]),
        x: Number(tokens[index++]),
        y: Number(tokens[index++]),
      });
    } else {
      throw new Error(`読めない path command: ${kind ?? "末尾"}`);
    }
  }
  return commands;
}

const 近い = (actual: number, expected: number): void =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.1);

function 組み立てた文書(doc: DslDocument): {
  diagram: ReturnType<typeof compileToCdl>;
  notices: CompileNotice[];
} {
  const notices: CompileNotice[] = [];
  const diagram = compileToCdl(doc, { onNotice: (notice) => notices.push(notice) });
  return { diagram, notices };
}

describe("路線図の形を持つ泳法図 (#2799)", () => {
  it("使った担当だけを宣言順と初出順で track- の線路にする", () => {
    const { diagram, markup } = 組み立てる(本文());
    expect(diagram.lanes.map((lane) => [lane.id, lane.label])).toEqual([
      ["track-front", "窓口"],
      ["track-review", "審査"],
      ["track-back", "裏方"],
      ["track-archive", "archive"],
    ]);
    expect(diagram.lanes.every((lane) => lane.id.startsWith("track-"))).toBe(true);
    expect(線路の数(markup)).toBeGreaterThan(0);
    expect((markup.match(/data-cdl-role="lane-label"/g) ?? []).length).toBeGreaterThan(0);
  });

  it("駅を箱の順に左から右へ、担当の帯の中央へ置く", () => {
    const { diagram, markup } = 組み立てる(本文());
    const laid = layout(diagram);
    expect(駅の数(markup)).toBe(6);
    expect(laid.nodes.map((node) => node.cx)).toEqual(
      [...laid.nodes].sort((a, b) => a.cx - b.cx).map((node) => node.cx),
    );
    for (const node of laid.nodes) {
      const lane = laid.lanes.find((item) => item.id === node.lane);
      expect(lane, `${node.id} の線路`).toBeDefined();
      expect(node.cy).toBe((lane!.y ?? 0) + (lane!.height ?? 0) / 2);
    }
  });

  it("全ての箱を station、全ての線を metro routing にする", () => {
    const { diagram, markup } = 組み立てる(本文());
    expect(diagram.nodes.every((node) => node.kind === "station")).toBe(true);
    expect(diagram.edges.every((edge) => edge.routing === "metro")).toBe(true);
    expect(駅の数(markup)).toBe(6);
    expect(edgePaths(markup)).toHaveLength(5);
  });

  it("担当を替える線は上下どちらにも傾き ±1 の区間を持つ", () => {
    const { diagram, markup } = 組み立てる(本文());
    const laid = layout(diagram);
    const paths = edgePaths(markup);
    const slopes: number[] = [];
    for (const [index, edge] of laid.edges.entries()) {
      const from = laid.nodes.find((node) => node.id === edge.from)!;
      const to = laid.nodes.find((node) => node.id === edge.to)!;
      const commands = pathCommands(paths[index]!);
      if (from.cy === to.cy) {
        expect(commands.map((command) => command.kind)).toEqual(["M", "L"]);
        近い(commands[0]!.y, from.cy);
        近い(commands[1]!.y, to.cy);
        continue;
      }

      expect(commands.map((command) => command.kind)).toEqual(["M", "L", "A", "L", "A", "L"]);
      const [move, firstHorizontal, firstArc, diagonal, secondArc, lastHorizontal] = commands;
      近い(move!.y, from.cy);
      近い(firstHorizontal!.y, from.cy);
      const dx = diagonal!.x - firstArc!.x;
      const dy = diagonal!.y - firstArc!.y;
      expect(Math.abs(Math.abs(dx) - Math.abs(dy))).toBeLessThanOrEqual(0.1);
      expect(dy).not.toBe(0);
      slopes.push(dy);
      近い(secondArc!.y, to.cy);
      近い(lastHorizontal!.y, to.cy);
      近い(lastHorizontal!.x, to.cx - to.w / 2);
    }
    expect(slopes.some((dy) => dy > 0)).toBe(true);
    expect(slopes.some((dy) => dy < 0)).toBe(true);

    const sameTrack = 組み立てる(本文("", '  - 受け付け -> 完了する: "同じ担当"'));
    expect(pathCommands(edgePaths(sameTrack.markup)[0]!)).toEqual([
      expect.objectContaining({ kind: "M", y: 80 }),
      expect.objectContaining({ kind: "L", y: 80 }),
    ]);
  });

  it("animation があっても駅と線の位置を保ち、focus は駅の id を指す", () => {
    const staticDiagram = 組み立てる(本文()).diagram;
    const animated = 組み立てる(
      本文(`animation:
  - step: "受け付け" 1s
    focus: [受け付け]
  - step: "審査" 1s
    focus: [審査する]
`),
    ).diagram;
    expect(animated.phases).toHaveLength(2);
    expect(animated.nodes.map((node) => [node.id, node.posX, node.posY])).toEqual(
      staticDiagram.nodes.map((node) => [node.id, node.posX, node.posY]),
    );
    expect(animated.edges.map((edge) => edge.routing)).toEqual(
      staticDiagram.edges.map((edge) => edge.routing),
    );
    const expectedIds = animated.nodes
      .filter((node) => ["受け付け", "審査する"].includes(node.title))
      .map((node) => node.id);
    expect(animated.phases.flatMap((phase) => phase.activate)).toEqual(
      expect.arrayContaining(expectedIds),
    );
  });

  it("lane を省いた箱名を線路名に補い track-from-name を1件知らせる", () => {
    const { diagram, notices } = 組み立てる(
      本文().replace("- 後処理する: { lane: archive }", "- 後処理する"),
    );
    expect(diagram.lanes.map((lane) => lane.label)).toContain("後処理する");
    const fallback = notices.filter((notice) => (notice.kind as string) === "track-from-name");
    expect(fallback).toHaveLength(1);
    expect(fallback[0]?.message).toContain("後処理する");
  });

  it("direction と箱の stack / kind が効かないことを知らせる", () => {
    const { notices } = 組み立てる(
      本文("direction: 縦\n").replace("lane: front }", "lane: front, stack: 2, kind: actor }"),
    );
    expect(notices.filter((notice) => notice.kind === "direction-not-honored")).toHaveLength(1);
    expect(notices.find((notice) => notice.kind === "direction-not-honored")?.message).toContain(
      "shape: metro",
    );
    const actorNotices = notices.filter((notice) => notice.kind === "actor-option-not-honored");
    expect(actorNotices).toHaveLength(1);
    expect(actorNotices[0]?.message).toContain("段");
    expect(actorNotices[0]?.message).toContain("種類");
  });

  it("余計な指定が無い路線図は知らせを出さない", () => {
    const source = `title: "知らせの無い路線図"
type: swimlane
shape: metro
lanes:
  front: { label: 窓口 }
  review: { label: 審査 }
actors:
  - 受け付け: { lane: front }
  - 審査する: { lane: review }
  - 完了する: { lane: front }
flow:
  - 受け付け -> 審査する
  - 審査する -> 完了する
`;
    expect(組み立てる(source).notices).toEqual([]);
  });

  it("同じ路線図を記法と JSON で書くと位置・線路・線・知らせが一致する", () => {
    const source = `title: "同じ路線図"
type: swimlane
shape: metro
lanes:
  front: { label: 窓口 }
  review: { label: 審査 }
actors:
  - 受付: { lane: front }
  - 審査: { lane: review }
  - 記録
flow:
  - 受付 -> 審査
  - 審査 -> 記録
`;
    const parsed = parseTextDslV05(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const validated = validateDragonJson({
      title: "同じ路線図",
      type: "swimlane",
      shape: "metro",
      lanes: { front: { label: "窓口" }, review: { label: "審査" } },
      actors: [{ name: "受付", lane: "front" }, { name: "審査", lane: "review" }, { name: "記録" }],
      flow: [
        { from: "受付", to: "審査", label: "" },
        { from: "審査", to: "記録", label: "" },
      ],
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const yaml = 組み立てた文書(parsed.doc);
    const json = 組み立てた文書(jsonToDoc(validated.data));
    const geometry = ({ diagram, notices }: typeof yaml) => ({
      nodes: diagram.nodes.map(({ id, posX, posY }) => ({ id, posX, posY })),
      lanes: diagram.lanes.map(({ id, label, posX, posY, posW, posH }) => ({
        id,
        label,
        posX,
        posY,
        posW,
        posH,
      })),
      edges: diagram.edges.map(({ from, to, routing }) => ({ from, to, routing })),
      notices: notices.map(({ kind, message, hint }) => ({ kind, message, hint })),
    });
    expect(geometry(json)).toEqual(geometry(yaml));
  });
});
