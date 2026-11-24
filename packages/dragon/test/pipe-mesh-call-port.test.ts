/**
 * 網型の配管の図で、人からトークンの箱への呼び出しの管が、箱の辺の真ん中に近い所へ少ない曲がりで入ることを確かめる (#3813)。
 *
 * `mesh-call-home-*.dragon`はTracelythのトップページの先頭の図 (400 USDCを送る、SolidityとDaml) の記法を写した。
 * 箱の真下の人が呼ぶ図と、箱の左に居る2人が呼ぶ図は、その記法の呼ぶ人を替えて作った。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
import { PIPE_LOOK } from "../src/look/pipe";
import "../src/kind-use/pipe";
// 組み立てが本体に埋める共有のブロック集と絵柄集を、src を読む検査にも置く (#3763)
import "./built-globals";

const [{ checkLayoutText }] = await Promise.all([import("../src/render/layout-check")]);

type Point = [number, number];
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Party extends Rect {
  id: string;
}
interface Call {
  from: string;
  to: string;
  points: Point[];
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
interface Layout {
  parties: Party[];
  calls: Call[];
  tanks: Tank[];
  levels: Level[];
  /** 描いた全てのステップの札入れの矩形 */
  wallets?: Rect[];
}
interface Api {
  parseNotation(text: string, options: { lang: string }): { ok: true; diagram: unknown } | { ok: false; errors: { line: number; message: string }[] };
  renderDiagram(diagram: unknown, options: { lang: string }): { layout: Layout };
}
const api = dragon as unknown as Api;

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures");
const HOME = ["mesh-call-home-erc20-400", "mesh-call-home-daml-400"];
/** Tracelythのカタログの網型の図 (`pipe-side-port.test.ts`と同じ14枚) */
const CATALOG = [
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
  "erc20-transfer-0",
];

const read = (name: string): string => readFileSync(join(FIXTURES, `${name}.dragon`), "utf8");

/** 箱の真下のBobがUSDCを呼ぶ図。先頭の図の呼ぶ人をBobに替えた */
const BELOW = read("mesh-call-home-erc20-400")
  .replace("alice -> usdc: transfer(to: bob, amount: 400 USDC)", "bob -> usdc: transfer(to: carol, amount: 100 USDC)")
  .replace("move usdc: 400 alice -> bob", "move usdc: 100 bob -> carol")
  .replace("Transfer(from: alice, to: bob, amount: 400 USDC)", "Transfer(from: bob, to: carol, amount: 100 USDC)");

/** 箱の左に居るAliceとBobが、それぞれUSDCを呼ぶ5人の図 */
const PAIR = `pipe 2人が同じ箱を呼ぶ
layout mesh

box alice as Alice
box bob as Bob
box usdc as USDC
box carol as Carol
box dave as Dave
box erin as Erin

hold alice: 1000 USDC
hold bob: 500 USDC
hold carol: 0 USDC
hold dave: 0 USDC
hold erin: 0 USDC

step AliceがErinへ送る
  say AliceがUSDC.transferを呼び出します。
  alice -> usdc: transfer(to: erin, amount: 100 USDC)
  move usdc: 100 alice -> erin
  return usdc

step BobがDaveへ送る
  say BobがUSDC.transferを呼び出します。
  bob -> usdc: transfer(to: dave, amount: 100 USDC)
  move usdc: 100 bob -> dave
  return usdc
`;

function layoutOfText(text: string): Layout {
  const parsed = api.parseNotation(text, { lang: "ja" });
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}行目 ${e.message}`).join("\n"));
  return api.renderDiagram(parsed.diagram, { lang: "ja" }).layout;
}
const partyOf = (l: Layout, id: string): Party => {
  const p = l.parties.find((x) => x.id === id);
  if (!p) throw new Error(`${id} の名札が無い`);
  return p;
};
const callOf = (l: Layout, from: string, to: string): Point[] => {
  const c = l.calls.find((x) => x.from === from && x.to === to && x.points.length > 1);
  if (!c) throw new Error(`${from} から ${to} への呼び出しの管が無い`);
  return c.points;
};
/** 一直線に並ぶ点を除いた時の、折れる所の数 */
function bendsOf(pts: readonly Point[]): number {
  let n = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1] as Point, pts[i] as Point, pts[i + 1] as Point];
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) > 0.5) n++;
  }
  return n;
}
const T = PIPE_LOOK.tank;
/** 槽と、槽の下の残高の数字と増減と状態の字を包む矩形 (`pipe-side-port.test.ts`と同じ測り方) */
function tankAreas(l: Layout): Array<Rect & { name: string }> {
  return l.tanks.map((t) => {
    const text = l.levels.find((v) => v.party === t.party && v.token === t.token && v.text)?.text;
    const x = Math.min(t.x, text?.x ?? t.x);
    const right = Math.max(t.x + t.w, text ? text.x + text.w : t.x + t.w);
    const bottom = text ? text.y + text.h + T.deltaY + T.tagY : t.y + t.h;
    return { name: `${t.party} ${t.token}`, x, y: t.y, w: right - x, h: bottom - t.y };
  });
}
/** 2つの矩形の内側 (縁から0.5より内) が重なるか */
const overlaps = (a: Rect, b: Rect): boolean => a.x + a.w > b.x + 0.5 && b.x + b.w > a.x + 0.5 && a.y + a.h > b.y + 0.5 && b.y + b.h > a.y + 0.5;
const cx = (r: Rect): number => r.x + r.w / 2;
const cy = (r: Rect): number => r.y + r.h / 2;
/** 縦の線分と横の線分が、どちらの端でもない所で交わるか */
function crossing(p: readonly Point[], q: readonly Point[]): boolean {
  for (let i = 1; i < p.length; i++)
    for (let j = 1; j < q.length; j++) {
      const [a, b] = [p[i - 1] as Point, p[i] as Point];
      const [c, d] = [q[j - 1] as Point, q[j] as Point];
      const av = Math.abs(a[0] - b[0]) < 0.5;
      const cv = Math.abs(c[0] - d[0]) < 0.5;
      if (av === cv) continue;
      const [v1, v2, h1, h2] = av ? [a, b, c, d] : [c, d, a, b];
      const x = v1[0];
      const y = h1[1];
      if (x > Math.min(h1[0], h2[0]) + 0.5 && x < Math.max(h1[0], h2[0]) - 0.5 && y > Math.min(v1[1], v2[1]) + 0.5 && y < Math.max(v1[1], v2[1]) - 0.5) return true;
    }
  return false;
}

describe("網型で人から箱へ入る呼び出しの管", () => {
  it("pipe-mesh-call-side-middle", () => {
    for (const name of HOME) {
      const l = layoutOfText(read(name));
      const box = partyOf(l, "usdc");
      const alice = partyOf(l, "alice");
      const pts = callOf(l, "alice", "usdc");
      const last = pts.at(-1) as Point;
      expect(cx(alice), `${name} のAliceが箱の左の外に居ない`).toBeLessThan(box.x);
      expect(last[0], `${name} の管の端が箱の左の縁に無い`).toBeCloseTo(box.x, 1);
      expect(Math.abs(last[1] - cy(box)), `${name} の管の端の高さ ${last[1]} が箱の上下の真ん中 ${cy(box)} から外れる`).toBeLessThan(0.5);
      expect(bendsOf(pts), `${name} の管の折れる数`).toBe(1);
    }
  });

  it("pipe-mesh-call-straight-below", () => {
    const l = layoutOfText(BELOW);
    const box = partyOf(l, "usdc");
    const bob = partyOf(l, "bob");
    const pts = callOf(l, "bob", "usdc");
    expect(cx(bob), "Bobが箱の幅の中に居ない").toBeGreaterThan(box.x);
    expect(cx(bob), "Bobが箱の幅の中に居ない").toBeLessThan(box.x + box.w);
    expect(bendsOf(pts), "箱の真下から入る管の折れる数").toBe(0);
    expect((pts.at(-1) as Point)[1], "管の端が箱の下の縁に無い").toBeCloseTo(box.y + box.h, 1);
  });

  it("pipe-mesh-call-side-pair", () => {
    const l = layoutOfText(PAIR);
    const box = partyOf(l, "usdc");
    const a = callOf(l, "alice", "usdc");
    const b = callOf(l, "bob", "usdc");
    expect(cx(partyOf(l, "bob")), "Bobが箱の左の外に居ない").toBeLessThan(box.x);
    for (const [who, pts] of [
      ["Alice", a],
      ["Bob", b],
    ] as const) {
      expect((pts.at(-1) as Point)[0], `${who} の管の端が箱の左の縁に無い`).toBeCloseTo(box.x, 1);
      expect(bendsOf(pts), `${who} の管の折れる数`).toBe(1);
    }
    const ya = (a.at(-1) as Point)[1];
    const yb = (b.at(-1) as Point)[1];
    const mid = cy(box);
    expect(ya, "遠いAliceの管がBobの管より上に入らない").toBeLessThan(yb - 0.5);
    expect(Math.abs(mid - ya - (yb - mid)), `2本の管 (${ya}、${yb}) が上下の真ん中 ${mid} を挟んで同じ離れに並ばない`).toBeLessThan(0.5);
    expect(crossing(a, b), "2本の管が交わる").toBe(false);
  });

  it("pipe-mesh-box-gap-from-all-paths", () => {
    // 箱と人の間は、全ての人から箱への道を下の縁へ入れた時の折る段の数で決め、横の縁へ入る管でも詰めない (#3826)
    for (const name of HOME) {
      const l = layoutOfText(read(name));
      const box = partyOf(l, "usdc");
      const top = Math.min(...["alice", "bob", "carol"].map((id) => partyOf(l, id).y));
      expect(top - (box.y + box.h), `${name} の箱の下の縁から人の丸の上の縁まで`).toBe(GAP);
    }
  });

  it("pipe-mesh-gap-steady-across-calls", () => {
    // 同じ箱と人の図は、誰が呼ぶかと券の有る無しが変わっても、箱と人を同じ所に置く (Tracelyth #221、#3826)。
    // カタログは呼び方を切り替えて同じ図を描き直すので、置き場所が動くと図が跳ねる
    const base = read("side-port-erc20-transferfrom-0");
    const variants: Array<[string, string]> = [
      ["Bobが呼び券が在る図", base],
      // 券を箱に結ぶ図は、人に結ぶ券を描かない
      ["券を箱に結ぶ図", base.replaceAll("allowance[Alice][Bob]", "allowance[Alice][USDC]").replace("[from: alice, to: bob, unit: USDC]", "[from: alice, to: usdc, unit: USDC]")],
      ["Carolが呼ぶ図", base.replace(/BobがUSDC/u, "CarolがUSDC").replace(/bob -> usdc: transferFrom/u, "carol -> usdc: transferFrom")],
    ];
    const places = variants.map(([name, text]) => {
      const l = layoutOfText(text);
      return [name, ["alice", "bob", "carol", "usdc"].map((id) => [id, partyOf(l, id).x, partyOf(l, id).y])] as const;
    });
    const [first, ...rest] = places;
    for (const [name, at] of rest) expect(at, `${name} の箱と人の置き場所が${first?.[0]}と違う`).toEqual(first?.[1]);
  });

});

// 崩れを数える検査は図ごとの件に分け、混んだ機械でも1件が10秒の上限の中で終わる形にする
const BREAK_KINDS = ["parts-overlap", "line-over-text", "empty-band"];
const BREAK_TEXTS: Array<[string, string]> = [
  ...HOME.map((n): [string, string] => [n, read(n)]),
  ...CATALOG.map((n): [string, string] => [n, read(`side-port-${n}`)]),
  ["箱の真下の人が呼ぶ図", BELOW],
  ["2人が同じ箱を呼ぶ図", PAIR],
];
for (const [name, text] of BREAK_TEXTS)
  describe(`網型の図の崩れ ${name}`, () => {
    it("pipe-mesh-call-no-breaks", () => {
      const found = checkLayoutText(text, { lang: "ja" })
        .filter((b) => BREAK_KINDS.includes(b.kind))
        .map((b) => `${b.kind} ${JSON.stringify(b.parts ?? [])}`);
      // 札入れは、槽と槽の下の残高の数字と増減と状態の字に重ならない
      const l = layoutOfText(text);
      for (const w of l.wallets ?? [])
        for (const t of tankAreas(l)) if (overlaps(w, t)) found.push(`札入れ (${w.x},${w.y}) が ${t.name} の槽か残高の字に重なる`);
      expect(found, `${name} の崩れ`).toEqual([]);
    });
  });

/** 箱の下の縁から人の丸の上の縁までの長さ。箱の左に居るAliceの道が下の縁へ入る時に折る段 (34px) を含む、0.79.2と同じ値 */
const GAP = 72;
