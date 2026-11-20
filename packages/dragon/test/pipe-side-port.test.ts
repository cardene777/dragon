/**
 * 網型の配管の図で、槽と槽を繋ぐ値の管が槽の側面の平らな所に付くことを確かめる (#3775)。
 *
 * 記法はTracelythのカタログで槽どうしを繋ぐ管が出る14枚の図 (0.79.0の`traceToPipe`の出力) を写した。
 * 13枚は隣り合わない槽を繋ぎ、`erc20-transfer`は隣り合う槽を繋ぐ。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
import { PIPE_LOOK } from "../src/look/pipe";
import "../src/kind-use/pipe";
// 組み立てが本体に埋める共有のブロック集と絵柄集を、src を読む検査にも置く (#3763)
import "./built-globals";

type Point = [number, number];
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Tank extends Rect {
  party: string;
  token: string;
}
interface Level {
  party: string;
  token: string;
  text?: Rect;
}
interface ValuePipe {
  token: string;
  from: string;
  to: string;
  points: Point[];
}
interface Layout {
  tanks: Tank[];
  levels: Level[];
  valuePipes: ValuePipe[];
}
interface Api {
  parseNotation(text: string, options: { lang: string }): { ok: true; diagram: unknown } | { ok: false; errors: { line: number; message: string }[] };
  renderDiagram(diagram: unknown, options: { lang: string }): { layout: Layout };
}
const api = dragon as unknown as Api;

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures");
const UNDER = [
  "account-erc-4337-sign",
  "account-erc-6551-owner",
  "account-multisig-both",
  "erc20-burn-0",
  "erc20-mint-0",
  "erc20-transferfrom-0",
  "patterns-eip-3009-sign",
  "patterns-erc-4626-deposit",
  "patterns-erc-4626-redeem",
  "patterns-multicall-batch",
  "patterns-permit2-sign",
  "patterns-swap-slipped",
  "patterns-swap-swap",
];
const ALL = [...UNDER, "erc20-transfer-0"];

function layoutOf(name: string): Layout {
  const parsed = api.parseNotation(readFileSync(join(FIXTURES, `side-port-${name}.dragon`), "utf8"), { lang: "ja" });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}行目 ${e.message}`).join("\n"));
  return api.renderDiagram(parsed.diagram, { lang: "ja" }).layout;
}
/** 2人の槽と槽を繋ぐ値の管と、両端の槽。箱から自分の槽へ書き込む管 (`from`と`to`が同じ) は数えない */
function tankPipes(l: Layout): Array<{ pipe: ValuePipe; a: Tank; b: Tank }> {
  const tank = (party: string, token: string) => l.tanks.find((t) => t.party === party && t.token === token);
  return l.valuePipes.flatMap((pipe) => {
    if (pipe.from === pipe.to) return [];
    const a = tank(pipe.from, pipe.token);
    const b = tank(pipe.to, pipe.token);
    return a && b ? [{ pipe, a, b }] : [];
  });
}

// 値の管の太さは24 (`PIPE_LOOK.tank.ports`の注)。管の縁が槽の丸めた角に掛からない口の高さの範囲
const HALF = 12;
const T = PIPE_LOOK.tank;
/** 口が槽の左か右の縁に在り、管の縁が丸めた角の内に収まるか。外れた時は理由の文を返す */
function offFlatSide(p: Point, t: Tank): string | undefined {
  const onSide = Math.abs(p[0] - t.x) < 0.5 || Math.abs(p[0] - (t.x + t.w)) < 0.5;
  const top = t.y + T.radius + HALF;
  const bottom = t.y + t.h - T.radius - HALF;
  if (!onSide) return `口 (${p.join(",")}) が槽 ${t.party} (x ${t.x}から${t.x + t.w}) の側面に無い`;
  if (p[1] < top - 0.5 || p[1] > bottom + 0.5) return `口の高さ ${p[1]} が槽 ${t.party} の平らな所 (${top}から${bottom}) の外`;
  return undefined;
}
/** 点の並びを小数3桁に丸める。描く側は位置を小数3桁に丸めて持つ */
const round = (pts: readonly Point[]): Point[] => pts.map(([x, y]): Point => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
/** 槽と、槽の下の残高の数字と増減と状態の文字を包む矩形 */
function tankAreas(l: Layout): Array<Rect & { name: string }> {
  return l.tanks.map((t) => {
    const text = l.levels.find((v) => v.party === t.party && v.token === t.token && v.text)?.text;
    const x = Math.min(t.x, text?.x ?? t.x);
    const right = Math.max(t.x + t.w, text ? text.x + text.w : t.x + t.w);
    const bottom = text ? text.y + text.h + T.deltaY + T.tagY : t.y + t.h;
    return { name: `${t.party} ${t.token}`, x, y: t.y, w: right - x, h: bottom - t.y };
  });
}
/** 縦か横の線分が矩形の内側 (縁から0.5より内) を通るか */
function crosses([p, q]: [Point, Point], r: Rect): boolean {
  const E = 0.5;
  const [x1, x2] = [Math.min(p[0], q[0]), Math.max(p[0], q[0])];
  const [y1, y2] = [Math.min(p[1], q[1]), Math.max(p[1], q[1])];
  return x2 > r.x + E && x1 < r.x + r.w - E && y2 > r.y + E && y1 < r.y + r.h - E;
}

describe("網型で槽と槽を繋ぐ管の口", () => {
  it("pipe-side-port-on-flat-side", () => {
    const off: string[] = [];
    let ends = 0;
    for (const name of ALL)
      for (const { pipe, a, b } of tankPipes(layoutOf(name))) {
        const first = pipe.points[0] as Point;
        const last = pipe.points[pipe.points.length - 1] as Point;
        for (const [p, t] of [
          [first, a],
          [last, b],
        ] as const) {
          ends++;
          const why = offFlatSide(p, t);
          if (why) off.push(`${name}: ${why}`);
        }
      }
    expect(ends, "数えた管の口の数").toBeGreaterThanOrEqual(ALL.length * 2);
    expect(off, "槽の側面の平らな所に無い口").toEqual([]);
  });

  it("pipe-side-port-straight-over-empty-column", () => {
    // 発行の図はBobとゼロのアドレスの間にCarolが居るが、Carolは槽を持たないので、2つの槽の側面を1本の真っすぐな管で繋ぐ
    const l = layoutOf("erc20-mint-0");
    const [found] = tankPipes(l).filter(({ pipe }) => pipe.from === "bob" && pipe.to === "addr-00000000");
    expect(found, "Bobとゼロのアドレスを繋ぐ管").toBeDefined();
    const { pipe, a, b } = found as { pipe: ValuePipe; a: Tank; b: Tank };
    expect(round(pipe.points), "真っすぐな1本の管").toEqual(
      round([
        [a.x + a.w, a.y + (T.ports[0] as number)],
        [b.x, b.y + (T.ports[0] as number)],
      ]),
    );
  });

  it("pipe-side-port-under-clears-tanks-and-text", () => {
    // 間に槽が在る管は、どの槽にも、槽の下の残高の文字にも重ならずに下を回る
    const hits: string[] = [];
    for (const name of UNDER) {
      const l = layoutOf(name);
      const areas = tankAreas(l);
      for (const { pipe } of tankPipes(l)) {
        const segs = pipe.points.slice(1).map((q, i): [Point, Point] => [pipe.points[i] as Point, q]);
        for (const s of segs) for (const r of areas) if (crosses(s, r)) hits.push(`${name}: ${pipe.from}→${pipe.to} の (${s[0].join(",")})-(${s[1].join(",")}) が ${r.name} に重なる`);
      }
    }
    expect(hits, "槽か残高の文字に重なる管").toEqual([]);
  });

  it("pipe-side-port-adjacent-unchanged", () => {
    // 隣り合う槽は今どおり、槽の側面の真ん中の口どうしを真っすぐ繋ぐ
    const l = layoutOf("erc20-transfer-0");
    const [found] = tankPipes(l);
    expect(found, "AliceとBobを繋ぐ管").toBeDefined();
    const { pipe, a, b } = found as { pipe: ValuePipe; a: Tank; b: Tank };
    expect(round(pipe.points)).toEqual(
      round([
        [a.x + a.w, a.y + (T.ports[0] as number)],
        [b.x, b.y + (T.ports[0] as number)],
      ]),
    );
  });
});
