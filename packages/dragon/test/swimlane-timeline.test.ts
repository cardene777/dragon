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
  laid: ReturnType<typeof layout>;
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
    laid: layout(diagram),
    markup: renderToStaticMarkup(createElement(CdlDiagramView, { diagram })),
    notices,
  };
}

function 組み立てた文書(doc: DslDocument): {
  diagram: ReturnType<typeof compileToCdl>;
  notices: CompileNotice[];
} {
  const notices: CompileNotice[] = [];
  const diagram = compileToCdl(doc, { onNotice: (notice) => notices.push(notice) });
  return { diagram, notices };
}

const 本文 = (extra = ""): string => `title: "申請を時間軸で追う"
type: swimlane
shape: timeline
lanes:
  front: { label: 窓口 }
  review: { label: 審査係 }
  chief: { label: 課長 }
actors:
  - 受け付ける: { lane: front }
  - 書類を審査する: { lane: review }
  - 不備を直す
  - 決裁する: { lane: chief }
  - 結果を知らせる: { lane: front }
flow:
  - 受け付ける -> 書類を審査する: "回す"
  - 書類を審査する -> 決裁する: "通す"
  - 決裁する -> 不備を直す: "戻す"
  - 不備を直す -> 決裁する: "出し直す"
  - 決裁する -> 結果を知らせる: "知らせる"
${extra}`;

const 近い = (actual: number, expected: number): void =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.1);

const 節の中身 = (markup: string, attribute: string): string => {
  const start = markup.indexOf(attribute);
  if (start < 0) return "";
  const next = markup.indexOf('data-cdl-node="', start + attribute.length);
  return markup.slice(start, next < 0 ? undefined : next);
};

type 点 = { x: number; y: number };
type 線分 = { from: 点; to: 点 };
type 矩形 = { left: number; top: number; right: number; bottom: number };

const 交差の誤差 = 1e-9;

function 線分と矩形の交差を数える(segment: 線分, rectangle: 矩形): number {
  const 内側 = (point: 点): boolean =>
    point.x >= rectangle.left &&
    point.x <= rectangle.right &&
    point.y >= rectangle.top &&
    point.y <= rectangle.bottom;
  if (内側(segment.from) || 内側(segment.to)) return 1;
  const dx = segment.to.x - segment.from.x;
  const dy = segment.to.y - segment.from.y;
  const boundaries = [
    { direction: -dx, distance: segment.from.x - rectangle.left },
    { direction: dx, distance: rectangle.right - segment.from.x },
    { direction: -dy, distance: segment.from.y - rectangle.top },
    { direction: dy, distance: rectangle.bottom - segment.from.y },
  ];
  let entering = 0;
  let leaving = 1;
  for (const { direction, distance } of boundaries) {
    if (Math.abs(direction) <= 交差の誤差) {
      if (distance < 0) return 0;
      continue;
    }
    const ratio = distance / direction;
    if (direction < 0) entering = Math.max(entering, ratio);
    else leaving = Math.min(leaving, ratio);
  }
  return entering <= leaving + 交差の誤差 ? 1 : 0;
}

function 道筋の折れ点(d: string): 点[] {
  const coordinates = d.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)?.map(Number) ?? [];
  if (coordinates.length % 2 !== 0) throw new Error(`道筋の座標が奇数個: ${d}`);
  const points: 点[] = [];
  for (let index = 0; index < coordinates.length; index += 2) {
    const x = coordinates[index];
    const y = coordinates[index + 1];
    if (x === undefined || y === undefined) throw new Error(`道筋の座標が足りない: ${d}`);
    points.push({ x, y });
  }
  return points;
}

describe("線分と矩形の交差を数える", () => {
  it("内側の点と矩形を貫く縦線を数え、外の線分は数えない", () => {
    const rectangle = { left: 0, top: 0, right: 10, bottom: 10 };
    expect(線分と矩形の交差を数える({ from: { x: 5, y: 5 }, to: { x: 5, y: 5 } }, rectangle)).toBe(
      1,
    );
    expect(
      線分と矩形の交差を数える({ from: { x: 5, y: -5 }, to: { x: 5, y: 15 } }, rectangle),
    ).toBe(1);
    expect(
      線分と矩形の交差を数える({ from: { x: 15, y: -5 }, to: { x: 15, y: 15 } }, rectangle),
    ).toBe(0);
  });
});

describe("時間軸の形を持つ泳法図 (#2798)", () => {
  it("時間軸の組み立て結果を固定する", () => {
    expect(組み立てる(本文()).diagram).toMatchSnapshot();
  });

  it("番号は actors の順に 1 から振られ、軸の x 上に並ぶ", () => {
    const { diagram, laid } = 組み立てる(本文());
    const numbers = diagram.nodes.filter((node) => node.id.startsWith("timeline-number-"));
    expect(numbers.map((node) => node.title)).toEqual(["1", "2", "3", "4", "5"]);
    const axis = laid.lanes.find((lane) => lane.id === "timeline-axis");
    expect(axis).toBeDefined();
    const axisX = axis!.x + axis!.width / 2;
    for (const number of laid.nodes.filter((node) => node.id.startsWith("timeline-number-"))) {
      expect(number.cx).toBe(axisX);
      expect(number.w).toBeGreaterThanOrEqual(80);
      expect(number.h).toBeGreaterThanOrEqual(40);
    }
  });

  it("札は軸の左右へ交互に置き、軸・番号と重ならず同じ段の y を共有する", () => {
    const { laid } = 組み立てる(本文());
    const axis = laid.lanes.find((lane) => lane.id === "timeline-axis")!;
    const axisX = axis.x + axis.width / 2;
    const cards = laid.nodes.filter((node) => !node.id.startsWith("timeline-number-"));
    const numbers = laid.nodes.filter((node) => node.id.startsWith("timeline-number-"));
    expect(cards).toHaveLength(5);
    cards.forEach((card, index) => {
      expect(index % 2 === 0 ? card.cx < axisX : card.cx > axisX).toBe(true);
      const innerEdge = index % 2 === 0 ? card.cx + card.w / 2 : card.cx - card.w / 2;
      expect(index % 2 === 0 ? innerEdge < axisX : innerEdge > axisX).toBe(true);
      const number = numbers[index]!;
      expect(card.cy).toBe(number.cy);
      const horizontalGap = Math.max(
        number.cx - number.w / 2 - (card.cx + card.w / 2),
        card.cx - card.w / 2 - (number.cx + number.w / 2),
      );
      expect(horizontalGap).toBeGreaterThanOrEqual(70);
    });
  });

  it("札の eyebrow に担当名を出し、lane のない札には出さない", () => {
    const { diagram, markup } = 組み立てる(本文());
    const cards = diagram.nodes.filter((node) => !node.id.startsWith("timeline-number-"));
    expect(cards.map((node) => node.eyebrow)).toEqual([
      "窓口",
      "審査係",
      undefined,
      "課長",
      "窓口",
    ]);
    for (const owner of ["窓口", "審査係", "課長"]) expect(markup).toContain(owner);
    expect(cards.find((node) => node.title === "不備を直す")?.eyebrow).toBeUndefined();
  });

  it("前の段へ戻る線だけが札の上辺を back-detour で結び、他の札と交わらない", () => {
    const { diagram, laid, markup } = 組み立てる(本文());
    const back = diagram.edges.filter((edge) => edge.routing === "back-detour");
    expect(back.map((edge) => edge.id)).toEqual(["e2-決裁する-不備を直す"]);
    const edge = laid.edges.find((item) => item.id === back[0]!.id)!;
    const from = laid.nodes.find((node) => node.id === edge.from)!;
    const to = laid.nodes.find((node) => node.id === edge.to)!;
    const coordinates = edge.d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    近い(coordinates[0]!, from.cx);
    近い(coordinates[1]!, from.cy - from.h / 2);
    近い(coordinates.at(-2)!, to.cx);
    近い(coordinates.at(-1)!, to.cy - to.h / 2);
    const crestY = Math.min(...coordinates.filter((_, index) => index % 2 === 1));
    const sameSideEarlier = laid.nodes.find((node) => node.title === "書類を審査する")!;
    expect(crestY).toBeGreaterThan(sameSideEarlier.cy + sameSideEarlier.h / 2);
    expect(markup).toContain(`data-cdl-edge="${edge.id}"`);
    expect(markup).toContain(`data-cdl-path-d="M ${from.cx} ${from.cy - from.h / 2}`);
  });

  it("5 段目から 2 段目へ戻る線は途中の札と番号を避けて外側を回る", () => {
    const { laid } = 組み立てる(`title: "長い戻り線"
type: swimlane
shape: timeline
actors:
  - 一段目
  - 二段目
  - 三段目
  - 四段目
  - 五段目
flow:
  - 五段目 -> 二段目: "戻す"
`);
    expect(laid.edges).toHaveLength(1);
    const edge = laid.edges[0];
    if (!edge) throw new Error("戻り線が無い");
    const from = laid.nodes.find((node) => node.id === edge.from);
    const to = laid.nodes.find((node) => node.id === edge.to);
    if (!from || !to) throw new Error("戻り線の両端の札が無い");
    const points = 道筋の折れ点(edge.d);
    const segments: 線分[] = [];
    for (let index = 1; index < points.length; index++) {
      const segmentFrom = points[index - 1];
      const segmentTo = points[index];
      if (segmentFrom && segmentTo) segments.push({ from: segmentFrom, to: segmentTo });
    }
    const otherRectangles = laid.nodes
      .filter((node) => node.id !== edge.from && node.id !== edge.to)
      .map((node): 矩形 => ({
        left: node.cx - node.w / 2,
        top: node.cy - node.h / 2,
        right: node.cx + node.w / 2,
        bottom: node.cy + node.h / 2,
      }));
    const crossings = segments.reduce(
      (total, segment) =>
        total +
        otherRectangles.reduce(
          (count, rectangle) => count + 線分と矩形の交差を数える(segment, rectangle),
          0,
        ),
      0,
    );
    expect(crossings).toBe(0);

    const upperY = Math.min(from.cy, to.cy);
    const lowerY = Math.max(from.cy, to.cy);
    const middleCards = laid.nodes.filter(
      (node) =>
        !node.id.startsWith("timeline-number-") &&
        node.id !== edge.from &&
        node.id !== edge.to &&
        node.cy > upperY &&
        node.cy < lowerY,
    );
    expect(middleCards.map((node) => node.id)).toEqual(["三段目", "四段目"]);
    const outerLeft = Math.min(...middleCards.map((node) => node.cx - node.w / 2));
    const outerRight = Math.max(...middleCards.map((node) => node.cx + node.w / 2));
    const outsideSegments = segments.filter(
      (segment) =>
        segment.from.x === segment.to.x &&
        ((segment.from.x < outerLeft && segment.to.x < outerLeft) ||
          (segment.from.x > outerRight && segment.to.x > outerRight)),
    );
    expect(outsideSegments.length).toBeGreaterThan(0);
  });

  it("次の段への進行線は番号を結び、2段以上先への分かれ道は札を結ぶ", () => {
    const { diagram } = 組み立てる(本文());
    const forward = diagram.edges.find((edge) => edge.id === "e0-受け付ける-書類を審査する");
    expect(forward).toMatchObject({
      from: "timeline-number-1",
      to: "timeline-number-2",
      routing: undefined,
    });
    const branch = diagram.edges.find((edge) => edge.id === "e1-書類を審査する-決裁する");
    expect(branch).toMatchObject({
      from: "書類を審査する",
      to: "決裁する",
      routing: undefined,
    });
  });

  it("animation でも静止図と同じ配置にし、札と番号・進行線を一緒に光らせる", () => {
    const still = 組み立てる(本文());
    const animated = 組み立てる(
      本文(`animation:
  - step: "受付" 1s
    focus: [受け付ける, "受け付ける -> 書類を審査する"]
`),
    );
    const geometry = (value: typeof still) => ({
      lanes: value.laid.lanes.map(({ id, x, y, width, height }) => ({ id, x, y, width, height })),
      nodes: value.laid.nodes.map(({ id, cx, cy, w, h }) => ({ id, cx, cy, w, h })),
    });
    expect(geometry(animated)).toEqual(geometry(still));
    expect(animated.notices).toEqual([]);
    expect(animated.markup).toContain('data-cdl-role="lane-lifeline"');
    expect(animated.diagram.phases[0]?.activate).toEqual(
      expect.arrayContaining([
        "受け付ける",
        "timeline-number-1",
        "e0-受け付ける-書類を審査する",
      ]),
    );
  });

  it("軸・番号・札を既存の data-cdl-role で識別できる", () => {
    const { markup } = 組み立てる(本文());
    const axisStart = markup.indexOf('data-cdl-lane="timeline-axis"');
    const axisEnd = markup.indexOf('data-cdl-lane="timeline-steps"', axisStart);
    expect(markup.slice(axisStart, axisEnd)).toContain('data-cdl-role="lane-lifeline"');
    const number = 節の中身(markup, 'data-cdl-node="timeline-number-1"');
    expect(number).toContain('data-cdl-role="node-body"');
    expect(number).toContain('data-cdl-role="node-label"');
    expect(節の中身(markup, 'data-cdl-node="受け付ける"')).toContain(
      'data-cdl-role="node-body"',
    );
  });

  it("direction と箱の stack / kind が効かないことを1件ずつ知らせる", () => {
    const source = 本文("direction: 横\n").replace(
      "lane: front }",
      "lane: front, stack: 2, kind: actor }",
    );
    const { notices } = 組み立てる(source);
    expect(notices.filter((notice) => notice.kind === "direction-not-honored")).toHaveLength(1);
    expect(notices.find((notice) => notice.kind === "direction-not-honored")?.message).toContain(
      "shape: timeline",
    );
    const actorNotices = notices.filter((notice) => notice.kind === "actor-option-not-honored");
    expect(actorNotices).toHaveLength(1);
    expect(actorNotices[0]?.message).toContain("段");
    expect(actorNotices[0]?.message).toContain("種類");
    expect(actorNotices[0]?.hint).toContain("軸の左右へ交互");
  });

  it("余計な指定の無い時間軸は知らせを出さない", () => {
    expect(組み立てる(本文()).notices).toEqual([]);
  });

  it("同じ時間軸を記法と JSON で書くと、箱・lane・線・知らせが一致する", () => {
    const source = `title: "同じ時間軸"
type: swimlane
shape: timeline
lanes:
  front: { label: 窓口 }
actors:
  - 受付: { lane: front }
  - 審査
flow:
  - 受付 -> 審査: "渡す"
`;
    const parsed = parseTextDslV05(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const validated = validateDragonJson({
      title: "同じ時間軸",
      type: "swimlane",
      shape: "timeline",
      lanes: { front: { label: "窓口" } },
      actors: [{ name: "受付", lane: "front" }, { name: "審査" }],
      flow: [{ from: "受付", to: "審査", label: "渡す" }],
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const yaml = 組み立てた文書(parsed.doc);
    const json = 組み立てた文書(jsonToDoc(validated.data));
    const geometry = ({ diagram, notices }: typeof yaml) => ({
      nodes: diagram.nodes.map(({ id, lane, kind, title, eyebrow, posX, posY, w, h }) => ({
        id,
        lane,
        kind,
        title,
        eyebrow,
        posX,
        posY,
        w,
        h,
      })),
      lanes: diagram.lanes.map(({ id, role, lifeline, posX, posY, posW, posH }) => ({
        id,
        role,
        lifeline,
        posX,
        posY,
        posW,
        posH,
      })),
      edges: diagram.edges.map(({ id, from, to, routing }) => ({ id, from, to, routing })),
      notices: notices.map(({ kind, message, hint }) => ({ kind, message, hint })),
    });
    expect(geometry(json)).toEqual(geometry(yaml));
  });
});
