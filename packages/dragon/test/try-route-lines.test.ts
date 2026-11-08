// @vitest-environment jsdom
/**
 * 試す図の網の線がノードの名前を横切らない (#3524)。
 *
 * 見本 `tx-block` の段 1 と段 4 で、道 `node-1 - node-3` の線が真下へ走り、名前「node-1」と、`node-2` の丸と名前「node-2」の上を通っていた。
 * 網の列の決め方が道の中の何番目かだけを見るため、送る側でない節から始まる道の次の節 (`node-3`) が、道の前の節 (`node-1`) と同じ列に入っていた。
 * 道の中で前の節より右の列に節を置き、上下へ並べる列は左の列でつながる節の段の平均の順に並べて、線を短くし、名前の上を通らないようにする。
 *
 * 名前と線は描いた SVG から読み、描く処理が記録する線 (`traces`) には頼らない。記録が抜けていても、描いた線そのもので確かめるため。
 * 網の線と名前は初めから最後まで同じ所に見えているので、描いた SVG の 1 枚が段 1 から段 4 のどの止め絵とも同じ線と名前を持つ。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hasWide, textBox } from "../src/layout/measure";
import type { Point, Rect } from "../src/layout/scene";
import { TYPE } from "../src/look/values";
import { parseNotation } from "../src/parser";
import { renderDiagram, renderLayout } from "../src/render/svg";
import { sansOf } from "../src/render/parts";
import type { Diagram } from "../src/schema";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
/** 見本 `tx-block` の日本語と英語 */
const FILES = [
  { file: "tx-block.dragon", lang: "ja" as const },
  { file: "tx-block.en.dragon", lang: "en" as const },
];
/** 確かめる枠の幅。既定の幅、`dragon check --layout` が見る携帯の幅、携帯の頁で図を置く枠の幅 */
const WIDTHS = [undefined, 390, 324] as const;

function parsed(file: string, lang: "ja" | "en"): Diagram {
  const read = parseNotation(readFileSync(join(EXAMPLES, file), "utf8"), { lang });
  if (!read.ok) throw new Error(`${file} を読めない: ${read.errors.map((e) => e.message).join(" / ")}`);
  return read.diagram;
}

interface NetLink {
  points: Point[];
}

interface NodeName {
  id: string;
  rect: Rect;
}

/** 描いた SVG の網の線 (`path.dg-try-net`) の点の並び */
function netLinks(svg: Document): NetLink[] {
  return [...svg.querySelectorAll("path.dg-try-net")].map((path) => {
    const numbers = (path.getAttribute("d") ?? "").match(/-?\d+(?:\.\d+)?/gu)?.map(Number) ?? [];
    const points: Point[] = [];
    for (let i = 0; i + 1 < numbers.length; i += 2) points.push([numbers[i] as number, numbers[i + 1] as number]);
    return { points };
  });
}

/** 描いた SVG の網の節の名前と、その字の四角。字の幅は描く処理と同じ字の幅の表で測る */
function nodeNames(svg: Document): NodeName[] {
  return [...svg.querySelectorAll("g[data-node]")].flatMap((node) => {
    const id = node.getAttribute("data-node") ?? "";
    const text = [...node.querySelectorAll("text")].find((t) => t.textContent === id);
    if (!text) return [];
    const style = hasWide(id) ? sansOf(TYPE.tryNode) : TYPE.tryNode;
    return [{ id, rect: textBox(id, Number(text.getAttribute("x")), Number(text.getAttribute("y")), style, "middle") }];
  });
}

/** 線分 `a`-`b` が四角 `r` の内を通るか */
function segmentCrossesRect(a: Point, b: Point, r: Rect): boolean {
  let lo = 0;
  let hi = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (const [p, q] of [
    [-dx, a[0] - r.x],
    [dx, r.x + r.w - a[0]],
    [-dy, a[1] - r.y],
    [dy, r.y + r.h - a[1]],
  ] as const) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) lo = Math.max(lo, t);
    else hi = Math.min(hi, t);
    if (lo > hi) return false;
  }
  return true;
}

const cross = (o: Point, a: Point, b: Point): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/**
 * 2 本の線分が交わるか。端どうしが同じ点 (同じ節に着く 2 本の線) は、そこだけで触れるなら交わりに数えず、
 * 同じ向きに重なって走るなら交わりに数える (1 本の線に見え、どちらの線か読めない)
 */
function segmentsMeet(a: [Point, Point], b: [Point, Point]): boolean {
  const near = (p: Point, q: Point): boolean => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1;
  const d1 = cross(b[0], b[1], a[0]);
  const d2 = cross(b[0], b[1], a[1]);
  const d3 = cross(a[0], a[1], b[0]);
  const d4 = cross(a[0], a[1], b[1]);
  const shared = a.some((p) => b.some((q) => near(p, q)));
  if (shared) {
    // 同じ節から出る 2 本は、向きの差が 1 度より小さい時だけ重なって走る
    const [p, q] = near(a[0], b[0]) || near(a[0], b[1]) ? [a[0], a[1]] : [a[1], a[0]];
    const [r, s] = near(b[0], p) ? [b[0], b[1]] : [b[1], b[0]];
    const angle = Math.abs(Math.atan2(cross(p, q, s), (q[0] - p[0]) * (s[0] - r[0]) + (q[1] - p[1]) * (s[1] - r[1])));
    return angle < Math.PI / 180;
  }
  return d1 * d2 < 0 && d3 * d4 < 0;
}

const svgOf = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");

describe("試す図の網の線とノードの名前 (#3524)", () => {
  it("try-route-lines-clear-node-names", () => {
    const crossed: string[] = [];
    let names = 0;
    let links = 0;
    for (const { file, lang } of FILES)
      for (const width of WIDTHS) {
        const doc = svgOf(renderDiagram(parsed(file, lang), { lang, ...(width === undefined ? {} : { width }) }).svg);
        const list = nodeNames(doc);
        const lines = netLinks(doc);
        names += list.length;
        links += lines.length;
        for (const line of lines)
          for (const name of list)
            if (line.points.slice(1).some((p, i) => segmentCrossesRect(line.points[i] as Point, p, name.rect)))
              crossed.push(`${file} 幅 ${width ?? "既定"}: 線 ${JSON.stringify(line.points.map((p) => p.map(Math.round)))} が名前「${name.id}」を横切る`);
      }
    // 走査の空振りを避ける。見本は 7 つの節と 9 本の線を持ち、2 つの言葉と 3 つの幅で描く
    expect(names, "網の節の名前を読めない").toBe(7 * FILES.length * WIDTHS.length);
    expect(links, "網の線を読めない").toBe(9 * FILES.length * WIDTHS.length);
    expect(crossed, "網の線がノードの名前を横切る").toEqual([]);
  });

  it("try-route-path-steps-right", () => {
    const diagram = parsed("tx-block.dragon", "ja");
    // 記法を読んだ原本は部品を `blocks.part` に持つ
    const route = (diagram as unknown as { blocks: { part: { type: string; paths?: string[][] }[] } }).blocks.part.find((p) => p.type === "route");
    const paths = route?.paths ?? [];
    expect(paths.length, "見本の網の道").toBe(4);
    const behind: string[] = [];
    for (const width of WIDTHS) {
      const layout = renderDiagram(diagram, { lang: "ja", ...(width === undefined ? {} : { width }) }).layout as unknown as { routes: { nodes: { id: string; x: number }[] }[] };
      const x = new Map((layout.routes[0]?.nodes ?? []).map((n) => [n.id, n.x]));
      for (const path of paths)
        path.slice(1).forEach((node, i) => {
          const prev = path[i] as string;
          if ((x.get(node) ?? 0) <= (x.get(prev) ?? 0)) behind.push(`幅 ${width ?? "既定"}: 道 ${path.join(" - ")} の ${node} が ${prev} より右に無い`);
        });
    }
    expect(behind, "道の次の節が前の節より右に無い").toEqual([]);
  });

  it("try-route-links-do-not-cross", () => {
    const met: string[] = [];
    for (const { file, lang } of FILES)
      for (const width of WIDTHS) {
        const layout = renderDiagram(parsed(file, lang), { lang, ...(width === undefined ? {} : { width }) }).layout as unknown as {
          routes: { nodes: { id: string; x: number; y: number }[]; links: { a: string; b: string }[] }[];
        };
        const route = layout.routes[0];
        expect(route?.links.length, `${file} 幅 ${width ?? "既定"} の網の線`).toBe(9);
        const at = new Map((route?.nodes ?? []).map((n) => [n.id, [n.x, n.y] as Point]));
        // 線は節の真ん中どうしを結ぶ線分で比べ、丸の縁で切った長さに左右されないようにする
        const segs = (route?.links ?? []).map((l) => ({ name: `${l.a}-${l.b}`, seg: [at.get(l.a) as Point, at.get(l.b) as Point] as [Point, Point] }));
        segs.forEach((a, i) => {
          for (const b of segs.slice(i + 1)) if (segmentsMeet(a.seg, b.seg)) met.push(`${file} 幅 ${width ?? "既定"}: 線 ${a.name} と ${b.name} が交わる`);
        });
      }
    expect(met, "網の線どうしが交わる").toEqual([]);
  });

  it("try-route-overlaps-name-line-across-name", () => {
    // 描いた網の線を、名前「node-1」の真ん中を通る形に置き換えて描くと、書き出しが知らせる字の重なりに線と名前の組が出る
    const drawn = renderDiagram(parsed("tx-block.dragon", "ja"), { lang: "ja" });
    const moved = structuredClone(drawn.layout) as unknown as {
      routes: { nodes: { id: string; x: number; y: number }[]; links: { a: string; b: string; points: Point[] }[] }[];
    };
    const route = moved.routes[0];
    const name = nodeNames(svgOf(drawn.svg)).find((n) => n.id === "node-1");
    const link = route?.links.find((l) => (l.a === "あなた" && l.b === "node-1") || (l.a === "node-1" && l.b === "あなた"));
    expect(name && link, "名前「node-1」か線 あなた - node-1 が見つからない").toBeTruthy();
    if (!name || !link) return;
    const start = link.points[0] as Point;
    link.points = [start, [name.rect.x + name.rect.w / 2, name.rect.y + name.rect.h / 2]];
    const rendered = renderLayout(drawn.diagram, moved as unknown as typeof drawn.layout, drawn.timeline);
    const lines = rendered.overlaps.flatMap((o) => (o.kind === "line" ? [`${o.step + 1}:${o.line.from}->${o.line.to}|${o.text}`] : []));
    expect(lines, "網の線が名前を横切っても字の重なりに出ない").toContain(`1:${link.a}->${link.b}|node-1`);
  });
});
