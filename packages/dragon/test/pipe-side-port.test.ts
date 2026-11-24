/**
 * 網型の配管の図で、槽と槽を繋ぐ値の管が槽の側面の平らな所に付くことを確かめる (#3775)。
 *
 * 記法はTracelythのカタログで槽どうしを繋ぐ管が出る14枚の図 (0.79.0の`traceToPipe`の出力) を写した。
 * 13枚は隣り合わない槽を繋ぎ、`erc20-transfer`は隣り合う槽を繋ぐ。
 *
 * 両隣に同じ人の槽が並ぶ槽の管と、帳簿型、母線型、上、下の型で底から出る管も、管の縁まで槽の平らな辺から出ることを確かめる (#3781)。
 * `side-port-middle-tank`は1人の3つの槽の真ん中から離れた人へ送る図、`side-port-both-sides-used`は真ん中の槽が3人とやり取りして左右の側面が埋まる図、
 * `bottom-port-eth`は見本帳のETHの送金の図を帳簿型で描く記法で、検査が型の行を替えて4つの型で描く。
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
  delta?: Rect;
  tag?: Rect;
  before?: { text?: Rect };
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
  return layoutOfText(readFileSync(join(FIXTURES, `side-port-${name}.dragon`), "utf8"));
}
function layoutOfText(text: string): Layout {
  const parsed = api.parseNotation(text, { lang: "ja" });
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
/** 口が槽の底に在り、管の縁が丸めた角の内に収まるか。外れた時は理由の文を返す (#3781) */
function offFlatBottom(p: Point, t: Tank): string | undefined {
  const left = t.x + T.radius + HALF;
  const right = t.x + t.w - T.radius - HALF;
  if (Math.abs(p[1] - (t.y + t.h)) >= 0.5) return `口 (${p.join(",")}) が槽 ${t.party} (y ${t.y + t.h}) の底に無い`;
  if (p[0] < left - 0.5 || p[0] > right + 0.5) return `口の横の位置 ${p[0]} が槽 ${t.party} の底の平らな所 (${left}から${right}) の外`;
  return undefined;
}
/** 管の両端の口と、その口の槽 */
function endsOf(l: Layout): Array<{ p: Point; t: Tank; pipe: ValuePipe }> {
  return tankPipes(l).flatMap(({ pipe, a, b }) => [
    { p: pipe.points[0] as Point, t: a, pipe },
    { p: pipe.points[pipe.points.length - 1] as Point, t: b, pipe },
  ]);
}
/** 槽の下の残高と増減と語の字の矩形。全ての段の分 */
function textRects(l: Layout): Array<Rect & { name: string }> {
  return l.levels.flatMap((v) =>
    [v.text, v.delta, v.tag, v.before?.text].flatMap((r) => (r ? [{ name: `${v.party} ${v.token} の字`, x: r.x, y: r.y, w: r.w, h: r.h }] : [])),
  );
}
/** 管を太さの分だけ広げた線分ごとに、槽か槽の下の字に重なる所を返す */
function pipeHits(l: Layout): string[] {
  const rects = [...l.tanks.map((t) => ({ name: `槽 ${t.party} ${t.token}`, x: t.x, y: t.y, w: t.w, h: t.h })), ...textRects(l)];
  const hits: string[] = [];
  for (const { pipe } of tankPipes(l))
    pipe.points.slice(1).forEach((q, i) => {
      const p = pipe.points[i] as Point;
      const box = { x: Math.min(p[0], q[0]) - HALF, y: Math.min(p[1], q[1]) - HALF, w: Math.abs(q[0] - p[0]) + HALF * 2, h: Math.abs(q[1] - p[1]) + HALF * 2 };
      // 口から出る線分は槽の縁に触れるので、その槽とは管の太さの分を広げずに比べる
      const end = i === 0 ? p : i === pipe.points.length - 2 ? q : undefined;
      for (const r of rects) {
        const own = end !== undefined && r.name.startsWith("槽") && end[0] >= r.x - 0.5 && end[0] <= r.x + r.w + 0.5 && end[1] >= r.y - 0.5 && end[1] <= r.y + r.h + 0.5;
        const body = own ? { x: Math.min(p[0], q[0]), y: Math.min(p[1], q[1]), w: Math.abs(q[0] - p[0]), h: Math.abs(q[1] - p[1]) } : box;
        if (crosses([[body.x, body.y], [body.x + body.w, body.y + body.h]], r)) hits.push(`${pipe.from}→${pipe.to} の (${p.join(",")})-(${q.join(",")}) が ${r.name} に重なる`);
      }
    });
  return hits;
}
/** 見本帳のETHの送金の図を、型の行を替えて描く */
function ethLayoutOf(shape: string): Layout {
  const text = readFileSync(join(FIXTURES, "bottom-port-eth.dragon"), "utf8").replace(/^layout ledger$/mu, `layout ${shape}`);
  return layoutOfText(text);
}
const OTHER_SHAPES = ["ledger", "bus", "top", "bottom"];

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

  it("pipe-side-port-middle-tank-on-flat-side", () => {
    // Aliceの3つの槽の真ん中 (WETH) からCarolへ送る管は、両端とも槽の側面の平らな所に付く (#3781)
    const ends = endsOf(layoutOf("middle-tank"));
    expect(ends.length, "数えた管の口の数").toBe(2);
    expect(
      ends.flatMap(({ p, t }) => offFlatSide(p, t) ?? []),
      "槽の側面の平らな所に無い口",
    ).toEqual([]);
  });

  it("pipe-side-port-middle-tank-gap-widened", () => {
    // 管を通す真ん中の槽 (WETH) と右の槽 (DAI) の間だけを、管の両側に隙間を残す48pxに広げ、左の間は16pxのまま
    const l = layoutOf("middle-tank");
    const own = l.tanks.filter((t) => t.party === "alice").sort((a, b) => a.x - b.x);
    expect(own.map((t) => t.token)).toEqual(["USDC", "WETH", "DAI"]);
    const gaps = own.slice(1).map((t, i) => Math.round((t.x - ((own[i] as Tank).x + (own[i] as Tank).w)) * 1000) / 1000);
    expect(gaps, "Aliceの槽どうしの間").toEqual([16, 48]);
  });

  it("pipe-side-port-middle-tank-clears-text", () => {
    // 真ん中の槽から出る管は、管の太さまで含めて、どの槽にも槽の下の残高と増減と語の字にも重ならない
    expect(pipeHits(layoutOf("middle-tank")), "槽か槽の下の字に重なる管").toEqual([]);
  });

  it("pipe-side-port-both-sides-bottom-on-flat", () => {
    // 真ん中の槽 (AliceのWETH) の左右の側面をDaveとCarolの管が使う時、3本目のFrankへの管だけを底の平らな所の端から出す
    const ends = endsOf(layoutOf("both-sides-used")).filter(({ t }) => t.party === "alice");
    expect(ends.map(({ pipe }) => `${pipe.from}→${pipe.to}`).sort()).toEqual(["alice→carol", "alice→frank", "dave→alice"]);
    const off = ends.flatMap(({ p, t, pipe }) => {
      const why = pipe.to === "frank" ? offFlatBottom(p, t) : offFlatSide(p, t);
      return why ? [`${pipe.from}→${pipe.to}: ${why}`] : [];
    });
    expect(off, "槽の平らな辺に無い口").toEqual([]);
  });

  it("pipe-side-port-both-sides-clears-text", () => {
    // 底から出る管に掛かる残高と増減と語の字は横へずれ、どの管も槽と槽の下の字に重ならない
    expect(pipeHits(layoutOf("both-sides-used")), "槽か槽の下の字に重なる管").toEqual([]);
  });

  it("pipe-bottom-port-other-shapes-on-flat", () => {
    // 帳簿型、母線型、上、下の型でETHを送る2人の槽を繋ぐ管は、両端とも槽の底の平らな所に付く (#3781)
    const off: string[] = [];
    let ends = 0;
    for (const shape of OTHER_SHAPES)
      for (const { p, t } of endsOf(ethLayoutOf(shape))) {
        ends++;
        const why = offFlatBottom(p, t);
        if (why) off.push(`${shape}: ${why}`);
      }
    expect(ends, "数えた管の口の数").toBe(OTHER_SHAPES.length * 2);
    expect(off, "槽の底の平らな所に無い口").toEqual([]);
  });

  it("pipe-bottom-port-other-shapes-clears-text", () => {
    // その4つの型で、管は太さまで含めてどの槽にも槽の下の残高と増減と語の字にも重ならない
    expect(
      OTHER_SHAPES.flatMap((shape) => pipeHits(ethLayoutOf(shape)).map((hit) => `${shape}: ${hit}`)),
      "槽か槽の下の字に重なる管",
    ).toEqual([]);
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

/*
 * トークンの箱が無い図の人の上の空き (#3860)。
 * 見本帳のETHの送金の図はAliceとVaultだけでトークンの箱を持たない。上、帳簿、下の型と`auto`で描いても、
 * 型の行が無い図 (人の丸が図の上の縁から48px) と同じく、図の上の縁から一番上に描く部品までを48px以下にする。
 * 一番上に描く部品は、置き場所が持つ全ての段の部品 (呼び出しの間だけ出る札も入る) のうち、上端が最も上の物とする
 */
interface Line {
  points?: Point[];
}
interface Card extends Rect {
  title: string;
}
interface Drawn {
  parties: Array<Rect & { id: string; label?: Rect }>;
  housings?: Rect[];
  tanks: Rect[];
  plates?: Rect[];
  gauges?: Rect[];
  callTags?: Rect[];
  callCards?: Card[];
  wallets?: Rect[];
  calls?: Line[];
  links?: Line[];
  valuePipes?: Line[];
  writes?: Line[];
}
/** 呼び出しの管と2人を結ぶ線の太さの半分。値の管は`HALF` */
const CALL_HALF = 8;
/** 図の上の縁から、型の行が無い図の人の丸までの高さ */
const ROOM = 48;
const SHAPES_WITHOUT_BOX = ["top", "ledger", "bottom", "auto"] as const;
const drawnOf = (shape: string): Drawn => ethLayoutOf(shape) as unknown as Drawn;
const finite = (r: Rect | undefined): r is Rect => r !== undefined && [r.x, r.y, r.w, r.h].every((v) => Number.isFinite(v));
/** 管と線を、太さの半分だけ広げた線分ごとの矩形にする */
const lineRects = (name: string, lines: readonly Line[] | undefined, half: number): Array<Rect & { name: string }> =>
  (lines ?? []).flatMap((l) =>
    (l.points ?? []).slice(1).map((q, i) => {
      const p = (l.points as Point[])[i] as Point;
      return { name, x: Math.min(p[0], q[0]) - half, y: Math.min(p[1], q[1]) - half, w: Math.abs(q[0] - p[0]) + half * 2, h: Math.abs(q[1] - p[1]) + half * 2 };
    }),
  );
/** 図に描く部品の矩形。呼び出しの札は`cards`を真にした時だけ入れる */
function partRects(l: Drawn, cards: boolean): Array<Rect & { name: string }> {
  const named = (name: string, rs: readonly (Rect | undefined)[] | undefined): Array<Rect & { name: string }> => (rs ?? []).filter(finite).map((r) => ({ name, x: r.x, y: r.y, w: r.w, h: r.h }));
  return [
    ...l.parties.flatMap((p) => [...named(`人と箱 ${p.id}`, [p]), ...named(`名前 ${p.id}`, [p.label])]),
    ...named("入れ物", l.housings),
    ...named("槽", l.tanks),
    ...named("札の入れ物", l.plates),
    ...named("計器", l.gauges),
    ...named("線の札", l.callTags),
    ...named("札入れ", l.wallets),
    ...(cards ? (l.callCards ?? []).filter(finite).map((c) => ({ name: `呼び出しの札 ${c.title}`, x: c.x, y: c.y, w: c.w, h: c.h })) : []),
    ...lineRects("呼び出しの管", l.calls, CALL_HALF),
    ...lineRects("2人を結ぶ線", l.links, CALL_HALF),
    ...lineRects("値の管", l.valuePipes, HALF),
    ...lineRects("書き換えの線", l.writes, CALL_HALF),
  ];
}
/** 図の上の縁から一番上に描く部品までの高さと、その部品の名前 */
function roomAbove(l: Drawn): { y: number; name: string } {
  return partRects(l, true).reduce((a, r) => (r.y < a.y ? { y: r.y, name: r.name } : a), { y: Infinity, name: "(部品が無い)" });
}

describe("トークンの箱が無い図の人の上の空き (#3860)", () => {
  for (const shape of SHAPES_WITHOUT_BOX)
    it(`pipe-no-token-box-room-${shape}`, () => {
      // ETHの送金の図をこの型で描くと、どの段でも、図の上の縁から一番上に描く部品までが48px以下になる
      const top = roomAbove(drawnOf(shape));
      expect(top.y, `layout ${shape} で図の上の縁から一番上の部品 (${top.name}) まで`).toBeLessThanOrEqual(ROOM);
    });

  it("pipe-no-token-box-card-clears-parts", () => {
    // その4つの型で、呼び出しの札Vault.預けるは人の丸と箱と名前と槽と入れ物と管のどれにも重ならない
    const hits: string[] = [];
    let cards = 0;
    for (const shape of SHAPES_WITHOUT_BOX) {
      const l = drawnOf(shape);
      for (const card of (l.callCards ?? []).filter(finite)) {
        cards++;
        for (const r of partRects(l, false))
          if (card.x < r.x + r.w - 0.5 && r.x < card.x + card.w - 0.5 && card.y < r.y + r.h - 0.5 && r.y < card.y + card.h - 0.5) hits.push(`${shape}: 札 ${card.title} が ${r.name} に重なる`);
      }
    }
    expect(cards, "数えた呼び出しの札の数").toBe(SHAPES_WITHOUT_BOX.length);
    expect(hits, "部品に重なる呼び出しの札").toEqual([]);
  });
});
