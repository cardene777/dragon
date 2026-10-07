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

const 宅配の本文 = (): string => `title: "荷物を届ける"
type: swimlane
shape: timeline
lanes:
  shipper: { label: 荷主 }
  office: { label: 営業所 }
  courier: { label: 配送便 }
actors:
  - 始まり: { kind: mark-start, lane: shipper }
  - 集荷を頼む: { lane: shipper }
  - 受け付ける: { lane: office }
  - 送り状を起こす: { lane: office }
  - 便に積む: { lane: courier }
  - 届けに行く: { lane: courier }
  - 在宅?: { kind: decision, lane: courier }
  - 受け取る: { lane: shipper }
  - 持ち戻る: { lane: courier }
  - 終わり: { kind: mark-end, lane: shipper }
flow:
  - 始まり -> 集荷を頼む
  - 集荷を頼む -> 受け付ける
  - 受け付ける -> 送り状を起こす
  - 送り状を起こす -> 便に積む
  - 便に積む -> 届けに行く
  - 届けに行く -> 在宅?
  - 在宅? -> 受け取る: "はい" (success)
  - 在宅? -> 持ち戻る: "いいえ" (error)
  - 持ち戻る -> 便に積む: "翌日もう一度" (error, dashed)
  - 受け取る -> 終わり (success)
`;

const 近い = (actual: number, expected: number): void =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.1);

const 節の中身 = (markup: string, attribute: string): string => {
  const start = markup.indexOf(attribute);
  if (start < 0) return "";
  const next = markup.indexOf('data-cdl-node="', start + attribute.length);
  return markup.slice(start, next < 0 ? undefined : next);
};

const 正規表現の文字を逃がす = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function 属性を持つ要素(markup: string, tag: string, attribute: string, value: string): string[] {
  const attr = `${正規表現の文字を逃がす(attribute)}="${正規表現の文字を逃がす(value)}"`;
  return markup.match(new RegExp(`<${tag}\\b(?=[^>]*${attr})[^>]*>`, "g")) ?? [];
}

function 属性(element: string, name: string): string | undefined {
  return new RegExp(`\\b${正規表現の文字を逃がす(name)}="([^"]*)"`).exec(element)?.[1];
}

function 数の属性(element: string, name: string): number {
  const value = 属性(element, name);
  if (value === undefined) throw new Error(`${name} の無い要素: ${element}`);
  return Number(value);
}

function 文字要素の中身(markup: string, role: string): string[] {
  const escaped = 正規表現の文字を逃がす(role);
  return [...markup.matchAll(new RegExp(`<text\\b(?=[^>]*data-cdl-role="${escaped}")[^>]*>([\\s\\S]*?)<\\/text>`, "g"))]
    .map((match) => match[1]!.replace(/<[^>]+>/g, "").trim());
}

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
  const points: 点[] = [];
  const parameterCounts: Readonly<Record<string, number>> = {
    M: 2, L: 2, T: 2, Q: 4, S: 4, C: 6, A: 7,
  };
  for (const match of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const command = match[1]!;
    if (command === "Z") continue;
    const parameterCount = parameterCounts[command];
    if (parameterCount === undefined) throw new Error(`読めない道筋の命令 ${command}: ${d}`);
    const parameters = match[2]!.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)?.map(Number) ?? [];
    if (parameters.length % parameterCount !== 0) throw new Error(`${command} の座標が足りない: ${d}`);
    for (let index = 0; index < parameters.length; index += parameterCount) {
      const x = parameters[index + parameterCount - 2];
      const y = parameters[index + parameterCount - 1];
      if (x === undefined || y === undefined) throw new Error(`${command} の終点が無い: ${d}`);
      points.push({ x, y });
    }
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
    const laidNumbers = laid.nodes.filter((node) => node.id.startsWith("timeline-number-"));
    expect(numbers.map((node) => node.kind)).toEqual(Array(5).fill("timeline-number"));
    for (const number of laidNumbers) {
      expect(number.cx).toBe(axisX);
      expect(number.w).toBe(52);
      expect(number.h).toBe(52);
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

  it("担当名を札の subtitle と番号への補助線で札の右に出す", () => {
    const { diagram, markup } = 組み立てる(本文());
    const cards = diagram.nodes.filter((node) => !node.id.startsWith("timeline-number-"));
    expect(cards.map((node) => node.subtitle)).toEqual([
      "窓口",
      "審査係",
      undefined,
      "課長",
      "窓口",
    ]);
    expect(cards.map((node) => node.eyebrow)).toEqual(Array(5).fill(undefined));
    expect(cards.map((node) => node.leaderTo)).toEqual([
      "timeline-number-1",
      "timeline-number-2",
      "timeline-number-3",
      "timeline-number-4",
      "timeline-number-5",
    ]);
    expect(文字要素の中身(markup, "stage-note")).toEqual(["窓口", "審査係", "課長", "窓口"]);
    expect(属性を持つ要素(markup, "line", "data-cdl-role", "timeline-leader")).toHaveLength(5);
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
      head: "none",
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
    expect(animated.markup).toContain('data-cdl-role="timeline-axis"');
    expect(animated.diagram.phases[0]?.activate).toEqual(
      expect.arrayContaining([
        "受け付ける",
        "timeline-number-1",
        "e0-受け付ける-書類を審査する",
      ]),
    );
  });

  it("実線の軸と丸い番号を data-cdl-role と data-cdl-mark で識別できる", () => {
    const { markup } = 組み立てる(本文());
    const axisStart = markup.indexOf('data-cdl-lane="timeline-axis"');
    const axisEnd = markup.indexOf('data-cdl-lane="timeline-steps"', axisStart);
    expect(markup.slice(axisStart, axisEnd)).toContain('data-cdl-role="timeline-axis"');
    expect(属性を持つ要素(markup, "line", "data-cdl-role", "lane-lifeline")).toHaveLength(0);
    const number = 節の中身(markup, 'data-cdl-node="timeline-number-1"');
    expect(number).toContain('<circle data-cdl-role="node-body" data-cdl-mark="timeline-number"');
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
      nodes: diagram.nodes.map(({ id, lane, kind, title, subtitle, leaderTo, posX, posY, w, h }) => ({
        id,
        lane,
        kind,
        title,
        subtitle,
        leaderTo,
        posX,
        posY,
        w,
        h,
      })),
      lanes: diagram.lanes.map(({ id, role, timelineAxis, posX, posY, posW, posH }) => ({
        id,
        role,
        timelineAxis,
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

describe("時間軸で分かれ道と終わりを書く (#2830)", () => {
  const 宅配 = 組み立てる(宅配の本文());
  const nodeIds = new Set(宅配.diagram.nodes.map((node) => node.id));
  const numbers = 宅配.diagram.nodes.filter((node) => node.id.startsWith("timeline-number-"));

  it("分かれ道と終わりを軸上の印にし、始まりは描かない", () => {
    expect(宅配.diagram.nodes.filter((node) => node.kind === "decision")).toHaveLength(1);
    expect(宅配.diagram.nodes.filter((node) => node.kind === "mark-end")).toHaveLength(1);
    expect(宅配.diagram.nodes.filter((node) => node.kind === "mark-start")).toHaveLength(0);
    expect(宅配.diagram.nodes.some((node) => node.id === "始まり")).toBe(false);
    expect((宅配.markup.match(/data-cdl-kind="decision"/g) ?? []).length).toBe(1);
    expect((宅配.markup.match(/data-cdl-mark="end"/g) ?? []).length).toBe(1);
    expect((宅配.markup.match(/data-cdl-mark="start"/g) ?? []).length).toBe(0);
  });

  it("分かれ道と終わりを番号と同じ軸上に置く", () => {
    const atHome = 宅配.diagram.nodes.find((node) => node.id === "在宅")!;
    const end = 宅配.diagram.nodes.find((node) => node.id === "終わり")!;
    expect(atHome.lane).toBe("timeline-axis");
    expect(end.lane).toBe("timeline-axis");
    expect(numbers.some((node) => node.posX === atHome.posX)).toBe(true);
    expect(numbers.some((node) => node.posX === end.posX)).toBe(true);
  });

  it("普通の段だけに連番と札を作る", () => {
    expect(numbers).toHaveLength(6);
    expect(numbers.map((node) => node.title)).toEqual(["1", "2", "3", "4", "5", "6"]);
    const cards = 宅配.diagram.nodes.filter((node) => node.kind === "card" && node.lane === "timeline-steps");
    expect(cards).toHaveLength(7);
    expect(cards.map((node) => node.title)).not.toContain("在宅?");
    expect(cards.map((node) => node.title)).not.toContain("終わり");
    expect(cards.map((node) => node.title)).not.toContain("始まり");
  });

  it("印を指定しても知らせを出さない", () => {
    expect(宅配.notices).toEqual([]);
  });

  it("分かれ道から番号と札へラベル付きで線を出す", () => {
    expect(宅配.diagram.edges.find((edge) => edge.from === "在宅" && edge.label === "はい")?.to).toBe("timeline-number-6");
    expect(宅配.diagram.edges.find((edge) => edge.from === "在宅" && edge.label === "いいえ")?.to).toBe("持ち戻る");
    expect(宅配.diagram.edges.find((edge) => edge.from === "timeline-number-5" && edge.to === "在宅")).toBeDefined();
  });

  it("戻り線の破線と迂回 routing を保つ", () => {
    expect(宅配.diagram.edges.find((edge) => edge.from === "持ち戻る" && edge.to === "便に積む")).toMatchObject({ style: "dashed", label: "翌日もう一度", routing: "back-detour" });
  });

  it("描かない始まりからの宙に浮いた線を残さない", () => {
    expect(宅配.diagram.edges).toHaveLength(9);
    expect(宅配.diagram.edges.every((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to))).toBe(true);
  });
});

describe("時間軸を見本と同じ丸い番号と実線の軸で描く (#2832)", () => {
  const 宅配 = 組み立てる(宅配の本文());
  const axisLane = 宅配.laid.lanes.find((lane) => lane.id === "timeline-axis");
  const axisX = axisLane === undefined ? Number.NaN : axisLane.x + axisLane.width / 2;

  it("丸い番号 6 個・札 7 個・分かれ道と終わりを必要な役割で描く", () => {
    expect(属性を持つ要素(宅配.markup, "circle", "data-cdl-mark", "timeline-number")).toHaveLength(6);
    expect(属性を持つ要素(宅配.markup, "g", "data-cdl-kind", "card")).toHaveLength(7);
    expect(属性を持つ要素(宅配.markup, "g", "data-cdl-kind", "decision")).toHaveLength(1);
    expect(属性を持つ要素(宅配.markup, "circle", "data-cdl-mark", "end")).toHaveLength(1);
    expect(属性を持つ要素(宅配.markup, "circle", "data-cdl-mark", "start")).toHaveLength(0);
    expect(属性を持つ要素(宅配.markup, "line", "data-cdl-role", "timeline-leader")).toHaveLength(6);
  });

  it("番号を持つ札の担当を右へ出し、脇の札にも担当を保つ", () => {
    const stageNotes = 文字要素の中身(宅配.markup, "stage-note");
    expect(stageNotes).toEqual([
      "荷主", "営業所", "営業所", "配送便", "配送便", "荷主",
    ]);
    const cards = 宅配.diagram.nodes.filter((node) => node.kind === "card" && node.lane === "timeline-steps");
    expect(cards.filter((node) => node.subtitle !== undefined)).toHaveLength(7);
    const side = cards.find((node) => node.title === "持ち戻る");
    expect(side?.subtitle).toBe("配送便");
    expect(side?.leaderTo).toBeUndefined();
    // cardene777/cdl#1032: leaderTo の無い札の subtitle は札の右ではなく名前の下へ出る仕様。
    expect(cards.map((node) => node.subtitle)).toEqual([
      "荷主", "営業所", "営業所", "配送便", "配送便", "荷主", "配送便",
    ]);
    const sideNotes = 文字要素の中身(
      節の中身(宅配.markup, 'data-cdl-node="持ち戻る"'),
      "node-subtitle",
    );
    expect(sideNotes).toEqual(["配送便"]);
    expect([...stageNotes, ...sideNotes]).toHaveLength(7);
  });

  it("6 枚の札から同じ段の丸の縁へ点線の補助線を引く", () => {
    const leaders = 属性を持つ要素(宅配.markup, "line", "data-cdl-role", "timeline-leader");
    expect(leaders).toHaveLength(6);
    const cards = 宅配.diagram.nodes.filter((node) => node.leaderTo?.startsWith("timeline-number-"));
    expect(leaders.map((line) => 属性(line, "data-cdl-leader-from")).sort()).toEqual(
      cards.map((card) => card.id).sort(),
    );
    expect(leaders.map((line) => 属性(line, "data-cdl-leader-to"))).toEqual([
      "timeline-number-1", "timeline-number-2", "timeline-number-3",
      "timeline-number-4", "timeline-number-5", "timeline-number-6",
    ]);
    for (const line of leaders) {
      const targetId = 属性(line, "data-cdl-leader-to");
      const target = 宅配.laid.nodes.find((node) => node.id === targetId);
      expect(target, `${targetId} の丸が無い`).toBeDefined();
      if (target === undefined) continue;
      const xs = [数の属性(line, "x1"), 数の属性(line, "x2")];
      const edges = [target.cx - 26, target.cx + 26];
      const distance = Math.min(...xs.flatMap((x) => edges.map((edge) => Math.abs(x - edge))));
      expect(distance, `${targetId} の丸の縁へ届かない`).toBeLessThanOrEqual(0.1);
    }
  });

  it("丸の中心を通り終わりまで届く軸を実線で描く", () => {
    const axes = 属性を持つ要素(宅配.markup, "line", "data-cdl-role", "timeline-axis");
    const circles = 属性を持つ要素(宅配.markup, "circle", "data-cdl-mark", "timeline-number");
    expect(axes).toHaveLength(1);
    expect(circles).toHaveLength(6);
    const axis = axes[0]!;
    const circleXs = circles.map((circle) => 数の属性(circle, "cx"));
    const circleYs = circles.map((circle) => 数の属性(circle, "cy"));
    expect(数の属性(axis, "x1")).toBe(数の属性(axis, "x2"));
    expect(circleXs.every((x) => x === 数の属性(axis, "x1"))).toBe(true);
    expect(数の属性(axis, "y1")).toBeLessThanOrEqual(Math.min(...circleYs));
    expect(数の属性(axis, "y2")).toBeGreaterThanOrEqual(Math.max(...circleYs));
    expect(属性(axis, "stroke-dasharray")).toBeUndefined();
    expect(属性を持つ要素(宅配.markup, "line", "data-cdl-role", "lane-lifeline")).toHaveLength(0);
  });

  it("番号を半径 24・縁 4 の丸で描く", () => {
    const circles = 属性を持つ要素(宅配.markup, "circle", "data-cdl-mark", "timeline-number");
    expect(circles).toHaveLength(6);
    expect(circles.map((circle) => 数の属性(circle, "r"))).toEqual(Array(6).fill(24));
    expect(circles.map((circle) => 数の属性(circle, "stroke-width"))).toEqual(Array(6).fill(4));
  });

  it("番号を持つ札を左・右・左・右・左・左に置き、脇の札を右へ置く", () => {
    const sides = Array.from({ length: 6 }, (_, index) => {
      const id = `timeline-number-${index + 1}`;
      const card = 宅配.diagram.nodes.find((node) => node.leaderTo === id);
      const laidCard = 宅配.laid.nodes.find((node) => node.id === card?.id);
      expect(laidCard, `${id} と組になる札が無い`).toBeDefined();
      if (laidCard === undefined) return "無し";
      expect(laidCard.h).toBe(56);
      expect(Math.abs(laidCard.cx - axisX) - laidCard.w / 2 - 26).toBeGreaterThanOrEqual(70);
      return laidCard.cx < axisX ? "左" : "右";
    });
    expect(sides).toEqual(["左", "右", "左", "右", "左", "左"]);
    expect(宅配.laid.nodes.find((node) => node.title === "持ち戻る")!.cx).toBeGreaterThan(axisX);
  });

  it("持ち戻るを分かれ道と同じ段の右に十分離して置く", () => {
    const decision = 宅配.laid.nodes.find((node) => node.id === "在宅");
    const side = 宅配.laid.nodes.find((node) => node.title === "持ち戻る");
    expect(decision).toBeDefined();
    expect(side).toBeDefined();
    if (decision === undefined || side === undefined) return;
    expect(side.cy).toBe(decision.cy);
    expect(side.cx - side.w / 2 - axisX).toBeGreaterThanOrEqual(decision.w / 2 + 70);
  });

  it("いいえの線を菱形の右から脇の札の左へ水平に引く", () => {
    const edge = 宅配.diagram.edges.find((item) => item.label === "いいえ");
    expect(edge).toBeDefined();
    if (edge === undefined) return;
    const laidEdge = 宅配.laid.edges.find((item) => item.id === edge.id);
    const decision = 宅配.laid.nodes.find((node) => node.id === "在宅");
    const side = 宅配.laid.nodes.find((node) => node.title === "持ち戻る");
    expect(laidEdge).toBeDefined();
    expect(decision).toBeDefined();
    expect(side).toBeDefined();
    if (laidEdge === undefined || decision === undefined || side === undefined) return;
    const points = 道筋の折れ点(laidEdge.d);
    expect(points).toHaveLength(2);
    expect(new Set(points.map((point) => point.y)).size).toBe(1);
    expect(points[0]!.x).toBeGreaterThanOrEqual(decision.cx + decision.w / 2 - 1);
    expect(points.at(-1)!.x).toBeLessThanOrEqual(side.cx - side.w / 2 + 1);
  });

  it("軸上を進む線から矢頭を外し、終わりへ入る線だけ既定の矢頭を残す", () => {
    for (const [from, to] of [
      ["timeline-number-1", "timeline-number-2"],
      ["timeline-number-5", "在宅"],
      ["在宅", "timeline-number-6"],
    ] as const) {
      expect(宅配.diagram.edges.find((edge) => edge.from === from && edge.to === to)).toMatchObject({
        from, to, head: "none",
      });
    }
    const ending = 宅配.diagram.edges.find(
      (edge) => edge.from === "timeline-number-6" && edge.to === "終わり",
    );
    expect(ending).toBeDefined();
    expect(ending).not.toHaveProperty("head");
  });

  it("色だけを書いた終端線と軸上の進行線に書いた tone を保つ", () => {
    const yes = 宅配.diagram.edges.find((edge) => edge.label === "はい");
    const ending = 宅配.diagram.edges.find(
      (edge) => edge.from === "timeline-number-6" && edge.to === "終わり",
    );
    expect(yes).toMatchObject({ tone: "success", style: undefined, sub: undefined });
    expect(ending).toMatchObject({ label: "", tone: "success" });
    expect(ending?.label).toBe("");
    expect(ending?.tone).toBe("success");
  });

  it("軸上の進行線に書いた補足と本文の行番号を同じ線へ写す", () => {
    const source = 宅配の本文().replace(
      "  - 集荷を頼む -> 受け付ける",
      '  - 集荷を頼む -> 受け付ける: "受付へ" { sub: "送り状を作る" }',
    );
    const parsed = parseTextDslV05(source);
    if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
    const sourceLines = new Map<string, number>();
    const diagram = compileToCdl(parsed.doc, {
      onEdgeSource: (edgeId, line) => sourceLines.set(edgeId, line),
    });
    const edge = diagram.edges.find((candidate) => candidate.label === "受付へ");
    expect(edge, "補足を書いた進行線が無い (検査が空振りしている)").toBeDefined();
    expect(edge?.sub).toBe("送り状を作る");
    // 時間軸は線の両端を番号へ付け替えるため、札の名前を残す edge id で同じ行へ対応させる。
    expect(sourceLines.get(edge!.id)).toBe(21);
  });

  it("分かれ道から色付きの線で入る番号の節に同じ tone を出す", () => {
    const number = 宅配.diagram.nodes.find((node) => node.id === "timeline-number-6");
    expect(number?.tone).toBe("success");
    expect(節の中身(宅配.markup, 'data-cdl-node="timeline-number-6"')).toContain(
      'data-cdl-tone="success"',
    );
  });

  it("横に引く分かれ道だけ札を線の上へ浮かせる", () => {
    const labeled = 宅配.diagram.edges.filter((edge) => edge.label !== "");
    expect(labeled.map((edge) => [edge.label, edge.overlay])).toEqual([
      ["はい", true],
      ["いいえ", undefined],
      ["翌日もう一度", true],
    ]);
  });

  it("書いた overlay は札付き線の既定より優先する", () => {
    const source = 宅配の本文().replace(
      '- 在宅? -> 受け取る: "はい" (success)',
      '- 在宅? -> 受け取る: "はい" (success) { overlay: false }',
    );
    const { diagram } = 組み立てる(source);
    expect(diagram.edges.find((edge) => edge.label === "はい")?.overlay).toBe(false);
  });

  it("持ち戻る線を破線の back-detour にし、両端を含む全ての札の内側を横切らない", () => {
    const back = 宅配.diagram.edges.find((edge) => edge.from === "持ち戻る" && edge.to === "便に積む");
    expect(back).toMatchObject({ style: "dashed", label: "翌日もう一度", routing: "back-detour" });
    if (back === undefined) return;
    const laidEdge = 宅配.laid.edges.find((edge) => edge.id === back.id);
    expect(laidEdge).toBeDefined();
    if (laidEdge === undefined) return;
    const points = 道筋の折れ点(laidEdge.d);
    const rectangles = 宅配.laid.nodes
      .filter((node) => node.kind === "card")
      .map((node): 矩形 => ({
        // 線の両端は札の輪郭に触れる。輪郭との接続は交差と数えず、札の内側を貫く線だけを検出する。
        left: node.cx - node.w / 2 + 0.1,
        top: node.cy - node.h / 2 + 0.1,
        right: node.cx + node.w / 2 - 0.1,
        bottom: node.cy + node.h / 2 - 0.1,
      }));
    let crossings = 0;
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      if (from === undefined || to === undefined) continue;
      for (const rectangle of rectangles) crossings += 線分と矩形の交差を数える({ from, to }, rectangle);
    }
    expect(crossings).toBe(0);
  });

  it("戻る線を持つ脇の札の中心を行き先の札の右端から 70 以上外へ置く", () => {
    const side = 宅配.laid.nodes.find((node) => node.title === "持ち戻る");
    const target = 宅配.laid.nodes.find((node) => node.title === "便に積む");
    expect(side).toBeDefined();
    expect(target).toBeDefined();
    if (side === undefined || target === undefined) return;
    expect(side.cx - (target.cx + target.w / 2)).toBeGreaterThanOrEqual(70);
    expect(side.cx - side.w / 2 - axisX).toBeGreaterThanOrEqual(220);
  });

  it("通常の番号の段を全検査が通る最小の 157 間隔で置く", () => {
    const first = 宅配.laid.nodes.find((node) => node.id === "timeline-number-1");
    const second = 宅配.laid.nodes.find((node) => node.id === "timeline-number-2");
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (first === undefined || second === undefined) return;
    expect(second.cy - first.cy).toBe(157);
  });

  it("終わりを外輪 19 の二重丸にして内外の輪へ隙間を空ける", () => {
    const end = 節の中身(宅配.markup, 'data-cdl-node="終わり"');
    const outer = 属性を持つ要素(end, "circle", "data-cdl-mark", "end");
    const inner = 属性を持つ要素(end, "circle", "data-cdl-role", "node-inner");
    expect(outer).toHaveLength(1);
    expect(inner).toHaveLength(1);
    const outerRadius = 数の属性(outer[0]!, "r");
    const strokeWidth = 数の属性(outer[0]!, "stroke-width");
    const innerRadius = 数の属性(inner[0]!, "r");
    expect(Math.abs(outerRadius - 19)).toBeLessThanOrEqual(0.5);
    expect(innerRadius + 4).toBeLessThanOrEqual(outerRadius - strokeWidth / 2);
  });

  it("分かれ道の菱形を見本に近い大きさへ縮める", () => {
    const decision = 宅配.laid.nodes.find((node) => node.id === "在宅");
    expect(decision).toBeDefined();
    expect(decision!.w).toBeLessThanOrEqual(160);
    expect(decision!.h).toBeLessThanOrEqual(120);
  });
});
