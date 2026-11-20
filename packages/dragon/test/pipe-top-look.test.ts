/**
 * Tracelythのトップページの図の良い所をパイプ図に取り込む (#3783)。
 *
 * 値の管の角を半径16pxで丸め、管の縁を細い墨の線にし、槽の名前を槽の外の上に置き、槽の液面を波打たせる。
 * 記法はTracelythのカタログで槽どうしを繋ぐ管が出る14枚の図 (#3775で写した記法) を使う。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
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
  title: Rect & { text: string; base: number };
}
interface Party extends Rect {
  id: string;
  label?: Rect;
}
interface Tie {
  party: string;
  x: number;
  y1: number;
  y2: number;
}
interface ValuePipe {
  token: string;
  from: string;
  to: string;
  points: Point[];
}
interface Layout {
  chips?: Array<Rect & { kind: string }>;
  tanks: Tank[];
  parties: Party[];
  ties: Tie[];
  valuePipes: ValuePipe[];
}
interface Api {
  parseNotation(text: string, options: { lang: string }): { ok: true; diagram: unknown } | { ok: false; errors: { line: number; message: string }[] };
  renderDiagram(diagram: unknown, options: { lang: string }): { svg: string; layout: Layout };
}
const api = dragon as unknown as Api;

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures");
const NAMES = [
  "account-erc-4337-sign",
  "account-erc-6551-owner",
  "account-multisig-both",
  "erc20-burn-0",
  "erc20-mint-0",
  "erc20-transfer-0",
  "erc20-transferfrom-0",
  "patterns-eip-3009-sign",
  "patterns-erc-4626-deposit",
  "patterns-erc-4626-redeem",
  "patterns-multicall-batch",
  "patterns-permit2-sign",
  "patterns-swap-slipped",
  "patterns-swap-swap",
];
/** 管の角を丸める半径 */
const RADIUS = 16;

function drawn(name: string): { svg: string; layout: Layout } {
  const parsed = api.parseNotation(readFileSync(join(FIXTURES, `side-port-${name}.dragon`), "utf8"), { lang: "ja" });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}行目 ${e.message}`).join("\n"));
  return api.renderDiagram(parsed.diagram, { lang: "ja" });
}

/** パスの d を、命令の文字と数の組に分ける */
function commands(d: string): Array<{ c: string; n: number[] }> {
  return [...d.matchAll(/([MLQ])([^MLQ]*)/g)].map((m) => ({ c: m[1] as string, n: (m[2] as string).trim().split(/[\s,]+/).filter(Boolean).map(Number) }));
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.05;
const cssRules = (svg: string, cls: string): string[] => [...svg.matchAll(new RegExp(`\\.${cls}\\{([^}]*)\\}`, "g"))].map((m) => m[1] as string);

describe("トップページの図の良い所を取り込んだパイプ図", () => {
  it("pipe-value-corners-round", () => {
    const bad: string[] = [];
    let corners = 0;
    for (const name of NAMES) {
      const { svg, layout } = drawn(name);
      const cases = [...svg.matchAll(/<path class="dg-pp-pcase" d="([^"]+)"/g)].map((m) => m[1] as string);
      for (const pipe of layout.valuePipes) {
        if (pipe.points.length < 3) continue;
        const [sx, sy] = pipe.points[0] as Point;
        const d = cases.find((c) => {
          const first = commands(c)[0];
          return first !== undefined && near(first.n[0] as number, sx) && near(first.n[1] as number, sy);
        });
        if (!d) {
          bad.push(`${name} ${pipe.from}から${pipe.to}: 壁の線が無い`);
          continue;
        }
        const cmds = commands(d);
        if (cmds.some((c, i) => i > 0 && c.c === "L" && cmds[i + 1]?.c === "L")) bad.push(`${name} ${pipe.from}から${pipe.to}: 直角の角が残る (${d})`);
        // 角の点ごとに、弧の手前の点が角から半径 (辺が短い時は辺の半分) だけ離れ、弧の制御点が角の点になる
        for (let k = 1; k < pipe.points.length - 1; k++) {
          const [a, b, c] = [pipe.points[k - 1], pipe.points[k], pipe.points[k + 1]] as [Point, Point, Point];
          const r = Math.min(RADIUS, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, Math.hypot(c[0] - b[0], c[1] - b[1]) / 2);
          const q = cmds.findIndex((x) => x.c === "Q" && near(x.n[0] as number, b[0]) && near(x.n[1] as number, b[1]));
          const before = cmds[q - 1];
          corners++;
          if (q < 0 || !before) {
            bad.push(`${name} ${pipe.from}から${pipe.to}: 角 (${b.join(",")}) を弧で曲がらない`);
            continue;
          }
          const gap = Math.hypot((before.n[0] as number) - b[0], (before.n[1] as number) - b[1]);
          if (!near(gap, r)) bad.push(`${name} ${pipe.from}から${pipe.to}: 角 (${b.join(",")}) の弧の半径が ${gap} (求めるのは ${r})`);
        }
      }
    }
    expect(corners, "数えた値の管の角の数").toBeGreaterThan(13 * 2);
    expect(bad, "丸くない値の管の角").toEqual([]);
  });

  it("pipe-value-tube-ink-edge", () => {
    const { svg } = drawn("erc20-transferfrom-0");
    const cases = cssRules(svg, "dg-pp-pcase");
    const bores = cssRules(svg, "dg-pp-pbore");
    expect(cases.length, "壁の線の決まり").toBeGreaterThan(0);
    expect(bores.length, "空洞の線の決まり").toBeGreaterThan(0);
    for (const rule of cases) {
      expect(rule, "壁の線は墨の色").toContain("stroke:var(--ink)");
      expect(rule, "壁の線の太さ").toContain("stroke-width:14");
    }
    for (const rule of bores) expect(rule, "空洞の線の太さ").toContain("stroke-width:11");
  });

  it("pipe-tank-name-above-glass", () => {
    const bad: string[] = [];
    let titles = 0;
    for (const name of NAMES) {
      const { svg, layout } = drawn(name);
      const ties = [...svg.matchAll(/<path class="dg-pp-tie" d="M ([\d.]+) ([\d.]+) V ([\d.]+)"/g)].map((m) => ({ x: Number(m[1]), y1: Number(m[2]), y2: Number(m[3]) }));
      const written = [...svg.matchAll(/<text class="dg-pp-tok" x="([\d.]+)" y="([\d.]+)">([^<]*)</g)].map((m) => ({ x: Number(m[1]), base: Number(m[2]), text: m[3] }));
      // 値の管は太さ24。管の縁から名前までを空ける
      const pipeRects = layout.valuePipes.flatMap((v) =>
        v.points.slice(1).map((q, i) => {
          const p = v.points[i] as Point;
          return { x: Math.min(p[0], q[0]) - 12, y: Math.min(p[1], q[1]) - 12, w: Math.abs(q[0] - p[0]) + 24, h: Math.abs(q[1] - p[1]) + 24 };
        }),
      );
      for (const t of layout.tanks) {
        titles++;
        const n = t.title;
        if (!written.some((w) => w.text === n.text && near(w.x, n.x) && near(w.base, n.base))) bad.push(`${name} ${t.party} ${t.token}: 描いた名前の場所が並びの名前の場所と違う`);
        for (const r of pipeRects) if (n.x < r.x + r.w && n.x + n.w > r.x && n.y < r.y + r.h && n.y + n.h > r.y) bad.push(`${name} ${t.party} ${t.token}: 名前が値の管に重なる`);
        for (const c of (layout.chips ?? []).filter((x) => x.kind === "io")) if (n.x < c.x + c.w && n.x + n.w > c.x && n.y < c.y + c.h && n.y + n.h > c.y) bad.push(`${name} ${t.party} ${t.token}: 名前が入力と出力の印に重なる`);
        if (n.base > t.y - 4) bad.push(`${name} ${t.party} ${t.token}: 名前の基準線 ${n.base} がガラスの上端 ${t.y} より上に無い`);
        const label = layout.parties.find((p) => p.id === t.party)?.label;
        if (label && n.y < label.y + label.h && n.y + n.h > label.y && n.x < label.x + label.w && n.x + n.w > label.x) bad.push(`${name} ${t.party} ${t.token}: 名前が名札の字と重なる`);
        for (const tie of ties)
          if (tie.x > n.x && tie.x < n.x + n.w && tie.y1 < n.y + n.h && tie.y2 > n.y) bad.push(`${name} ${t.party} ${t.token}: 名札からの点線が名前に重なる`);
      }
    }
    expect(titles, "数えた槽の名前の数").toBeGreaterThan(NAMES.length);
    expect(bad, "槽の外の上に無い名前").toEqual([]);
  });

  it("pipe-tank-liquid-waves", () => {
    const { svg } = drawn("erc20-transferfrom-0");
    const liquid = cssRules(svg, "dg-pp-liq").join(";");
    expect(liquid, "液の上端を波の形に切り抜くマスク").toMatch(/mask:[^;]*Q[^;]*repeat-x/);
    expect(liquid, "マスクを横へ流す動き").toMatch(/animation:[^;]*infinite/);
    const still = /@media \(prefers-reduced-motion: ?reduce\)\{[^@]*\.dg-pp-liq\{[^}]*animation:none/.test(svg);
    expect(still, "動きを減らす設定の時に波を止める決まり").toBe(true);
  });
});
