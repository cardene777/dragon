// @vitest-environment jsdom
/**
 * 寄って追う窓を、段で動く物が今の大きさの窓に収まらない段で、箱の名前の字が読める大きさになるまで引く (#3871)。
 *
 * 引くのは字が読める大きさ (`READABLE_PX`、10.5px) になる所までで、それでも収まらない段は線の先の箱と線の札から窓に入れる。
 * 窓の端で切れる線の元の箱と足した枝には、名前を書いた札を窓の枠の内に出す。
 * 収まる段の窓は引かず、今と同じ所に止まる。時系列図は窓の上に頭の列を留めるので引かない。
 *
 * 窓の位置と倍率は、窓の中身を動かす keyframes から読む (`follow-support.ts`)。
 * 全ての見本の倍率は、準備の段 (`follow-zoom.prepare.ts`) が描いた絵の keyframes から読む。
 */
import { afterEach, describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import {
  type Diagramish,
  overflow,
  place,
  type Placed,
  releasePlaced,
  round,
} from "./follow-support";
import { ARCHITECTURE, ISSUE_CASES, MIND, SEQUENCE, STATE, STATE_BACK } from "./follow-zoom-cases";
import type prepare from "./follow-zoom.prepare";
import { prepared } from "./prepared";
import type { Rect } from "./render-support";
import { READABLE_PX, TYPE } from "../src/look/values";
import "../src/kind-use/architecture";
import "../src/kind-use/mind";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/render/look-all";

afterEach(releasePlaced);

/** 箱の名前の字を読める大きさまで縮める倍率。窓はこれより小さく引かない */
const FLOOR = READABLE_PX / TYPE.boxName.size;

type Point = [number, number];

/** 記法を読んだ原本 */
function diagramOf(text: string): Diagramish {
  const read = api("parseNotation")(text, { lang: "ja" });
  expect(read.ok, `記法を読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read as { diagram: Diagramish }).diagram;
}

interface Loose {
  boxes: (Rect & { id: string; name: string })[];
  labels: (Rect & { step: number })[];
  edges: { step: number; points: Point[] }[];
  ideas?: (Rect & { id: string; name: string; step: number })[];
}

const loose = (p: Placed): Loose => p.layout;

/** 名札 `id` の箱 */
function boxOf(p: Placed, id: string): Rect & { name: string } {
  const box = loose(p).boxes.find((b) => b.id === id);
  expect(box, `${p.name} に箱 ${id} が無い`).toBeDefined();
  return box as Rect & { name: string };
}

/** 段 `step` の線の札 */
function labelsAt(p: Placed, step: number): Rect[] {
  const labels = loose(p).labels.filter((l) => l.step === step);
  expect(labels.length, `${p.name} の段 ${step + 1} に線の札が無い`).toBeGreaterThan(0);
  return labels;
}

/** 名前の札。`pill` は札の地の、図の上の四角 */
interface Tag {
  el: Element;
  step: number;
  name: string;
  pill: Rect;
}

/** 札の組の `transform` (`translate(a b)` に `scale(c)` が続くことがある) で、組の中の四角を図の上の四角へ移す */
function placedRect(group: Element, r: Rect): Rect {
  const m = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)(?:\s*scale\(\s*([\d.]+)\s*\))?/u.exec(
    group.getAttribute("transform") ?? "",
  );
  const [a, b, c] = m
    ? [Number(m[1]), Number(m[2]), m[3] === undefined ? 1 : Number(m[3])]
    : [0, 0, 1];
  return { x: a + c * r.x, y: b + c * r.y, w: c * r.w, h: c * r.h };
}

function tagsOf(p: Placed): Tag[] {
  return [...p.figure.querySelectorAll("g.dg-tag")].map((el) => {
    const pill = el.querySelector(".dg-tag-pill");
    const n = (attr: string): number => Number(pill?.getAttribute(attr));
    return {
      el,
      step: Number(el.getAttribute("data-step")),
      name: el.querySelector(".dg-tag-name")?.textContent ?? "",
      pill: placedRect(el, { x: n("x"), y: n("y"), w: n("width"), h: n("height") }),
    };
  });
}

/** 段 `step` の止め絵で見える札 */
const shownTags = (p: Placed, step: number): Tag[] =>
  tagsOf(p).filter((t) => t.step === step && p.opacity(t.el, p.stillAt(step)) > 0.5);

/** 段 `step` の止め絵で、名前 `name` の札が見え、窓の枠の内に在るか。見えない時と枠に掛かる時は理由を返す */
function tagProblem(p: Placed, step: number, name: string): string | undefined {
  const tag = shownTags(p, step).find((t) => t.name === name);
  if (!tag) return `${p.name} の段 ${step + 1} で、切れた「${name}」に名前の札が見えない`;
  const cut = overflow(tag.pill, p.windowAt(step));
  return cut > 0.5
    ? `${p.name} の段 ${step + 1} の「${name}」の札が窓の枠から ${round(cut)} はみ出す`
    : undefined;
}

describe("寄って追う窓を読める大きさまで引く (#3871)", () => {
  it("follow-zoom-state-target-in-window", () => {
    const p = place("課題の状態の図", diagramOf(STATE), 360);
    const win = p.windowAt(3);
    expect(
      round(overflow(boxOf(p, "D"), win)),
      "幅360の状態の図の段4で、線の先の「失敗」の箱が窓から切れる",
    ).toBeLessThanOrEqual(0.5);
    for (const label of labelsAt(p, 3))
      expect(
        round(overflow(label, win)),
        "幅360の状態の図の段4で、「失敗する」の札が窓から切れる",
      ).toBeLessThanOrEqual(0.5);
  });

  it("follow-zoom-architecture-target-in-window", () => {
    const p = place("課題の構成図", diagramOf(ARCHITECTURE), 360);
    const win = p.windowAt(2);
    expect(
      round(overflow(boxOf(p, "D"), win)),
      "幅360の構成図の段3で、線の先の「記録」の箱が窓から切れる",
    ).toBeLessThanOrEqual(0.5);
    for (const label of labelsAt(p, 2))
      expect(
        round(overflow(label, win)),
        "幅360の構成図の段3で、「記録する」の札が窓から切れる",
      ).toBeLessThanOrEqual(0.5);
  });

  it("follow-zoom-wide-steps-zoom-out", () => {
    /** 課題の図ごとの、動く物が今の大きさの窓に収まらない段 */
    const wide: Record<string, number> = { state: 3, architecture: 2, mind: 1 };
    const flat: string[] = [];
    for (const width of [360, 390]) {
      for (const [name, text] of ISSUE_CASES) {
        const step = wide[name] as number;
        const p = place(`課題の${name}の図`, diagramOf(text), width);
        const k = p.scaleAt(step);
        if (k >= 0.999) flat.push(`${name} (幅 ${width}) の段 ${step + 1} の倍率 ${round(k)}`);
        releasePlaced();
      }
    }
    expect(flat, "動く物が窓に収まらないのに窓を引かない段").toEqual([]);
  });

  it("follow-zoom-never-below-readable", () => {
    // 課題の図は、全ての段の倍率を描いた図の窓から読む
    const small: string[] = [];
    for (const width of [360, 390]) {
      for (const [name, text] of ISSUE_CASES) {
        const p = place(`課題の${name}の図`, diagramOf(text), width);
        for (let s = 0; s < p.steps; s++) {
          const px = p.scaleAt(s) * TYPE.boxName.size;
          if (px < READABLE_PX - 0.01)
            small.push(`${name} (幅 ${width}) の段 ${s + 1} の箱の名前の字 ${round(px)}px`);
        }
        releasePlaced();
      }
    }
    expect(small, "課題の図で、箱の名前の字が読める大きさを下回る段").toEqual([]);
    // 全ての見本は、準備の段が描いた絵の窓の動きの倍率の最小で見る
    const { zoomed, files } = prepared<ReturnType<typeof prepare>>(import.meta.url);
    expect(files, "見本の置き場に記法の見本が無い").toBeGreaterThan(0);
    for (const width of [360, 390])
      for (const [name] of ISSUE_CASES)
        expect(
          zoomed.some((z) => z.name === name && z.width === width),
          `準備の段が課題の${name}の図 (幅 ${width}) を描いていない`,
        ).toBe(true);
    expect(
      zoomed.filter((z) => z.name.endsWith(".dragon")).length,
      "寄って追う形になる見本が無い",
    ).toBeGreaterThan(0);
    const low = zoomed
      .filter((z) => z.least * TYPE.boxName.size < READABLE_PX - 0.01)
      .map(
        (z) => `${z.name} (幅 ${z.width}) の箱の名前の字 ${round(z.least * TYPE.boxName.size)}px`,
      );
    expect(low, "寄って追う窓の箱の名前の字が読める大きさを下回る見本").toEqual([]);
  });

  it("follow-zoom-architecture-cut-source-gets-tag", () => {
    const p = place("課題の構成図", diagramOf(ARCHITECTURE), 360);
    const win = p.windowAt(2);
    // 窓は箱の名前の字が読める大きさになる所までしか引かないので、窓が映す図の幅は 360 / FLOOR (約 446) を超えない。
    // 線の元の「呼ぶ側」の左の端から線の先の「記録」の右の端まで (579) は一度に映らず、線の先から入れた窓の端で「呼ぶ側」が切れる
    expect(
      tagProblem(p, 2, "呼ぶ側"),
      "幅360の構成図の段3の、線の元の箱の名前の札",
    ).toBeUndefined();
    expect(
      round(win.w),
      "幅360の構成図の段3の窓が、読める大きさより小さく引いた広さを映す",
    ).toBeLessThanOrEqual(round(360 / FLOOR) + 0.5);
    expect(
      round(overflow(boxOf(p, "A"), win)),
      "幅360の構成図の段3で、札を出した「呼ぶ側」が窓から切れていない",
    ).toBeGreaterThan(0.5);
  });

  it("follow-zoom-mind-cut-branches-get-tags", () => {
    const p = place("課題の木の図", diagramOf(MIND), 360);
    const step = 1;
    const win = p.windowAt(step);
    const ideas = loose(p).ideas ?? [];
    const root = ideas.find((i) => i.id === "root");
    expect(root, "課題の木の図に根が無い").toBeDefined();
    const middle = (root as Rect).x + (root as Rect).w / 2;
    const badge = p.badgeAt(step);
    const added = ideas.filter((i) => i.step === step);
    expect(added.length, "課題の木の図の段2に足した枝が無い").toBe(5);
    // 番号の丸と同じ側の枝は窓に入れる
    for (const idea of added.filter((i) => i.x + i.w / 2 > middle === badge.x > middle))
      expect(
        round(overflow(idea, win)),
        `幅360の木の図の段2で、番号の丸に近い側の「${idea.name}」が窓から切れる`,
      ).toBeLessThanOrEqual(0.5);
    // 窓の端で切れる枝には名前の札を出す
    const cut = added.filter((i) => overflow(i, win) > 0.5);
    const problems = cut
      .map((i) => tagProblem(p, step, i.name))
      .filter((x): x is string => x !== undefined);
    expect(problems, "幅360の木の図の段2で、切れた足した枝の名前の札").toEqual([]);
    // 足した枝の左の端から右の端まで (622) は、読める大きさまで引いた窓 (約 446) に一度に映らない
    expect(
      cut.length,
      "幅360の木の図の段2で、読める大きさより小さく引いて全ての枝を映している",
    ).toBeGreaterThan(0);
  });

  it("follow-zoom-overview-frame-grows", () => {
    const p = place("課題の構成図", diagramOf(ARCHITECTURE), 360);
    const vp = p.figure.querySelector(".dg-mm-vp");
    expect(vp, "幅360の構成図に全体図の今見ている所の枠が無い").not.toBeNull();
    const frameW = (s: number): number =>
      Number(vp?.getAttribute("width")) *
      (p.value(vp as Element, "transform", p.stillAt(s))?.[2] ?? 1);
    const k = p.scaleAt(2);
    expect(k, "幅360の構成図の段3で窓を引かない").toBeLessThan(0.999);
    expect(p.scaleAt(0), "幅360の構成図の段1で窓を引いた").toBeCloseTo(1, 6);
    expect(
      frameW(2) / frameW(0),
      "全体図の枠が、窓を引いた段で窓が映す広さと同じ比で大きくならない",
    ).toBeCloseTo(1 / k, 2);
  });

  it("follow-zoom-fitting-steps-unchanged", () => {
    /** 今の窓が止まる所。段で動く物が今の大きさの窓に収まる段だけを挙げる */
    const kept: { name: string; text: string; width: number; spots: [number, Point][] }[] = [
      {
        name: "状態の図",
        text: STATE,
        width: 360,
        spots: [
          [0, [0, 0]],
          [1, [0, 0]],
          [2, [124.5, 0]],
        ],
      },
      {
        name: "状態の図",
        text: STATE,
        width: 390,
        spots: [
          [0, [0, 0]],
          [1, [0, 0]],
          [2, [109.5, 0]],
        ],
      },
      {
        name: "構成図",
        text: ARCHITECTURE,
        width: 360,
        spots: [
          [0, [0, 0]],
          [1, [155, 0]],
        ],
      },
      {
        name: "構成図",
        text: ARCHITECTURE,
        width: 390,
        spots: [
          [0, [0, 0]],
          [1, [140, 0]],
        ],
      },
    ];
    const moved: string[] = [];
    for (const { name, text, width, spots } of kept) {
      const p = place(`課題の${name}`, diagramOf(text), width);
      for (const [s, [x, y]] of spots) {
        const win = p.windowAt(s);
        const k = p.scaleAt(s);
        if (Math.abs(k - 1) > 1e-6 || Math.abs(win.x - x) > 0.5 || Math.abs(win.y - y) > 0.5)
          moved.push(
            `${name} (幅 ${width}) の段 ${s + 1} の窓 (${round(win.x)}, ${round(win.y)}) 倍率 ${round(k)}`,
          );
      }
      releasePlaced();
    }
    expect(moved, "収まる段で、窓が今と違う所か倍率に止まる").toEqual([]);
    // 窓を引いた段 4 の次の、隣り合う箱へ戻る段 5 は元の大きさに戻る
    const back = place("課題の状態の図に戻る段を足した図", diagramOf(STATE_BACK), 360);
    expect(back.scaleAt(4), "幅360の状態の図の、窓を引いた段の次の収まる段の倍率").toBeCloseTo(
      1,
      6,
    );
  });

  it("follow-zoom-sequence-never-zooms", () => {
    const p = place("遠い相手へ送る時系列図", diagramOf(SEQUENCE), 360);
    const line = loose(p).edges.find((e) => e.step === 0);
    expect(line, "時系列図の段1に線が無い").toBeDefined();
    const xs = (line as { points: Point[] }).points.map((q) => q[0]);
    // 段1の線は今の大きさの窓より長く、窓を引けば収まる段になる
    expect(
      Math.max(...xs) - Math.min(...xs),
      "時系列図の段1の線が窓より短く、収まらない段にならない",
    ).toBeGreaterThan(p.windowAt(0).w);
    for (let s = 0; s < p.steps; s++)
      expect(p.scaleAt(s), `時系列図の段 ${s + 1} で窓を引いた`).toBeCloseTo(1, 6);
  });
});
