// @vitest-environment jsdom
/**
 * 配管の図の決まりの表と組み方 (#3418)。
 *
 * `pipe-diagram.test.ts` から分けた組 (#3738)。1 つの file では、混んだ機械で 1 回の実行の上限 (5 分) の中で終わらなかった。
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as pipeRules from "../src/pipe-rules";
import { describe, expect, it, vi } from "vitest";
import { atLoad } from "./at-load";
import { along, foldPipe as foldModel, layoutPipe, tryOrders } from "../src/kinds/pipe/layout";
import { toModel } from "../src/model";
import { type Ask, Router } from "../src/pipe-route";
import type { Diagram } from "../src/schema";
import { casesNamed } from "./case-support";
import type { Json } from "./diagram-support";
import { motionFrom } from "./motion-support";
import { draw, gap, type Rect, type Rendered } from "./render-support";
import { ROOT, SAMPLES, RETURN_CASES, KANA, type Point, type Writing, type Party, type Level, type Main, type Plate, type PipeLayout, type PipeRendered, box, bal, call, ret, move, emit, stepOf, pipeOf, exampleJson, render, partyOf, levelOf, tankOf, center, within, lastStep, stillOf, seenOf, partsOf, seen, onPath, alongPath, inside, segmentsOf } from "./pipe-diagram-support";
import "../src/kind-use/pipe";

// ---- 決まりの表と組み方 (#3418)

/** 値の管の口。槽の左か右の縁の上の点 */
interface Port {
  party: string;
  token: string;
  side: "left" | "right";
  x: number;
  y: number;
}
/** 値の管。持ち主の槽の横の口どうしを結ぶ折れ線 */
interface ValuePipe {
  token: string;
  from: string;
  to: string;
  points: Point[];
  ports: [Port, Port];
}
/** 持ち主ごとの槽の囲い。`row` は囲いの段 (一番上が 0) */
interface Housing extends Rect {
  party: string;
  row: number;
}
/** 呼び出しの管が値の管の下をくぐる所 */
interface Crossing {
  call: number;
  token: string;
  /** 越えた値の管の番号 (`valuePipes` の並び) */
  pipe: number;
  x: number;
  y: number;
}
/** 図の中の札。`kind` は役で、流れた量、イベント、戻り値、計器の式、入力と出力の印、槽の下の増減 */
interface Chip extends Rect {
  kind: "amount" | "event" | "return" | "formula" | "io" | "delta";
  step: number;
  text: string;
  /** 字の大きさ (図の座標の px) */
  size: number;
  /** 角の丸み (図の座標の px) */
  rx: number;
  party?: string;
  token?: string;
  /** 戻り値の札が伝う道 (呼ばれた側から呼んだ側へ) と、戻した呼び出しの番号 */
  path?: Point[];
  call?: number;
}
interface ComposedLayout extends PipeLayout {
  housings: Housing[];
  valuePipes: ValuePipe[];
  crossings: Crossing[];
  chips: Chip[];
}
/** 決まりの表の 1 行。`kind` は値が下限 (`min`) か上限 (`max`) か、`counted` は違反を数えるか */
interface PipeRule {
  name: string;
  breakage: string;
  counted: boolean;
  kind: "min" | "max";
  value: number;
  about: string;
}
interface Violation {
  rule: string;
  parts: string[];
  step?: number;
}

/** 崩れの 8 種類。背景の 6 種類と、字に線がかかる形と、線の小さな段差と揃わない間 */
const BREAKAGES = ["crowded", "behind-tag", "tangled", "gauge-astray", "tie-crossing", "lopsided", "text-under-line", "jog"] as const;

/**
 * 決まりの表と違反を数える処理。既定の入口が出す元の file (`src/pipe-rules.ts`) から引く。
 * 既定の入口は全ての種類を読むので、引くと配管の図でない種類を変えた時もこの検査が選ばれる (#3763)。
 * 既定の入口が出すことは、全ての種類を読む検査 (`light-entry.test.ts` の `default-entry-exports-pipe-rules`) が確かめる
 */
function rulesApi(): { rules: readonly PipeRule[]; violations: (layout: unknown, rules?: readonly PipeRule[]) => Violation[] } {
  const lib = pipeRules as unknown as { PIPE_RULES?: readonly PipeRule[]; pipeViolations?: (layout: unknown, rules?: readonly PipeRule[]) => Violation[] };
  expect(lib.PIPE_RULES, "配管の図の決まりの表 (PIPE_RULES) が src/pipe-rules から出ていない").toBeDefined();
  expect(lib.pipeViolations, "決まりの表への違反を数える処理 (pipeViolations) が src/pipe-rules から出ていない").toBeTypeOf("function");
  return { rules: lib.PIPE_RULES ?? [], violations: lib.pipeViolations ?? (() => []) };
}

/** 描いた図の置き場所を、組み方の検査が読む形で引く。無い欄を名指して落とす */
function composed(rendered: PipeRendered): ComposedLayout {
  const layout = rendered.layout as unknown as Partial<ComposedLayout>;
  for (const key of ["housings", "valuePipes", "crossings", "chips"] as const) expect(layout[key], `並べた配管の図に ${key} が無い`).toBeDefined();
  return layout as ComposedLayout;
}

/** 違反を 1 行ずつの字にする。落ちた時にどの決まりがどの部品で崩れたかを読めるようにする */
const listed = (found: Violation[]): string[] => found.map((v) => `${v.rule}${v.step === undefined ? "" : ` (段 ${v.step + 1})`}: ${v.parts.join(" / ")}`);


/** 2 つの線分が交わる点。交わらないか平行なら `undefined` */
function crossAt(a: [Point, Point], b: [Point, Point]): Point | undefined {
  const [[x1, y1], [x2, y2]] = a;
  const [[x3, y3], [x4, y4]] = b;
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(d) < 1e-9) return undefined;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / d;
  if (t < 1e-6 || t > 1 - 1e-6 || u < 1e-6 || u > 1 - 1e-6) return undefined;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

/** 折れ線どうしの交わる所と、交わる線分の組 */
function crossingsOf(p: Point[], q: Point[]): { at: Point; a: [Point, Point]; b: [Point, Point] }[] {
  const out: { at: Point; a: [Point, Point]; b: [Point, Point] }[] = [];
  for (const a of segmentsOf(p)) for (const b of segmentsOf(q)) {
    const at = crossAt(a, b);
    if (at) out.push({ at, a, b });
  }
  return out;
}

/** 線分が四角の中を通るか (端を `pad` px 縮めた四角と交わるか) */
function cutsThrough(seg: [Point, Point], r: Rect, pad = 1): boolean {
  const box = { x: r.x + pad, y: r.y + pad, w: r.w - 2 * pad, h: r.h - 2 * pad };
  if (box.w <= 0 || box.h <= 0) return false;
  const [[x1, y1], [x2, y2]] = seg;
  if (Math.max(x1, x2) < box.x || Math.min(x1, x2) > box.x + box.w || Math.max(y1, y2) < box.y || Math.min(y1, y2) > box.y + box.h) return false;
  // 縦か横の線分だけを扱う。斜めの線分は 20 等分して点で確かめる
  if (x1 === x2 || y1 === y2) return true;
  for (let k = 1; k < 20; k++) {
    const x = x1 + ((x2 - x1) * k) / 20;
    const y = y1 + ((y2 - y1) * k) / 20;
    if (x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h) return true;
  }
  return false;
}

/** 決まった種から作る、くり返せる乱数 */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/**
 * 関係者と槽と流れの数を変えて、機械で作った配管の図。`long` は関係者とトークンに英語の長い名前を付ける。
 * 送り手が Router を呼び、Router がトークンの Contract を呼んで持ち主どうしの間でトークンを動かす
 */
function generatedPipe(seed: number, long: boolean): Json {
  const rand = seeded(seed);
  const pick = (n: number): number => Math.floor(rand() * n);
  const holders = 2 + pick(4);
  const tokens = 1 + pick(3);
  const name = (base: string, i: number): string => (long ? `${base}LiquidityProviderNumber${i + 1}` : `${base}${i + 1}`);
  const tokenIds = Array.from({ length: tokens }, (_, i) => `tok${i + 1}`);
  const tokenNames = tokenIds.map((_, i) => (long ? `WRAPPEDSTAKEDTOKEN${i + 1}` : `TK${i + 1}`));
  const holderIds = Array.from({ length: holders }, (_, i) => `h${i + 1}`);
  const boxes: Json[] = [box("sender", long ? "ExternallyOwnedAccountSender" : "Sender"), box("router", long ? "UniversalSwapRouterContract" : "Router")];
  tokenIds.forEach((id, i) => boxes.push(box(id, tokenNames[i] as string)));
  holderIds.forEach((id, i) => boxes.push(box(id, name("Pool", i))));
  const balance = new Map<string, number>();
  const holds: Json[] = [];
  for (const h of ["sender", ...holderIds])
    for (const t of tokenNames) {
      if (rand() < 0.5 && h !== "sender") continue;
      const amount = 100 + pick(9) * 100;
      balance.set(`${h}|${t}`, amount);
      holds.push(bal(h, String(amount), t));
    }
  const steps: Json[] = [stepOf("Sender calls Router", [call("sender", "router", "swap")])];
  const flows = 2 + pick(5);
  for (let f = 0; f < flows; f++) {
    const owned = [...balance.entries()].filter(([, v]) => v >= 10);
    if (owned.length === 0) break;
    const [key] = owned[pick(owned.length)] as [string, number];
    const [from, token] = key.split("|") as [string, string];
    const others = ["sender", ...holderIds].filter((h) => h !== from);
    const to = others[pick(others.length)] as string;
    const t = tokenIds[tokenNames.indexOf(token)] as string;
    const amount = 10;
    balance.set(key, (balance.get(key) ?? 0) - amount);
    balance.set(`${to}|${token}`, (balance.get(`${to}|${token}`) ?? 0) + amount);
    steps.push(stepOf(`Router moves ${token}`, [call("router", t, `move ${amount}`), move(t, String(amount), from, to), emit(t, "Transfer", [from, to, String(amount)]), ret(t, "true")]));
  }
  steps.push(stepOf("Router returns", [ret("router", "ok")]));
  return pipeOf(long ? "Generated pipe with long names" : "Generated pipe", boxes, holds, steps);
}

/** 見本と言葉と枠の幅の組 */
const exampleCases = SAMPLES.flatMap((name) => (["ja", "en"] as const).flatMap((lang) => ([1280, 390] as const).map((width) => [name, lang, width] as const)));

// 箱 2 を開いた aggregator の道を探す回数は、同じ図を描く前の file を読み込む段で数える。描いた図は並べ方の覚えに入り、覚えに在る図は道を探さない。
// 描く助けの file も `src` の並べ方を読むので、数える前に描くと覚えを引いて 0 回になる (#3763)。キーは見本の file の名前
const AGGREGATOR_SEARCHES = await atLoad("箱 2 を開いた aggregator を幅 390 で並べ、道を探す回数を数える", () =>
  new Map(
    (["ja", "en"] as const).map((lang): [string, number] => {
      const file = lang === "ja" ? "aggregator.json" : "aggregator.en.json";
      const model = foldModel(toModel(exampleJson(file) as unknown as Diagram), [2], lang);
      const route = vi.spyOn(Router.prototype, "route");
      try {
        layoutPipe(model, { lang, width: 390 });
        return [file, route.mock.calls.length];
      } finally {
        route.mockRestore();
      }
    }),
  ),
);

// 見本ごとの件の中で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。全ての見本と言葉と枠の幅の図を file を読み込む段で描き、
// 件は描いた置き場所を読む。キーは `見本 言葉 幅`。Aggregator は 2 つ目の箱を開いて描く
const EXAMPLES_DRAWN = await atLoad("見本を言葉と枠の幅ごとに描く", () =>
  new Map(
    exampleCases.map(([name, lang, width]): [string, PipeRendered] => [
      `${name} ${lang} ${width}`,
      render(exampleJson(lang === "ja" ? `${name}.json` : `${name}.en.json`), lang, width, name === "aggregator" ? [2] : undefined),
    ]),
  ),
);

// 箱を開かない aggregator を件の中で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。
// ほかの見本と、2 つ目の箱を開いた aggregator は EXAMPLES_DRAWN が同じ形で描いているので、箱を開かない aggregator だけを file を読み込む段で描く。キーは `言葉 幅`
const CLOSED_AGGREGATOR = await atLoad("箱を開かない aggregator を言葉と枠の幅ごとに描く", () =>
  new Map(
    (["ja", "en"] as const).flatMap((lang) =>
      ([1280, 390] as const).map((width): [string, PipeRendered] => [`${lang} ${width}`, render(exampleJson(lang === "ja" ? "aggregator.json" : "aggregator.en.json"), lang, width)]),
    ),
  ),
);

// 色味ごとに描いて置き場所を比べると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。
// file を読み込む段で見本ごとに全ての色味で描き、件は既定の色味と置き場所の違った色味を読む。
// 色味は置き場所を変えない。色味ごとに描いた置き場所が既定の色味と同じなら、違反の数も同じ
const PALETTE_DIFFERS = await atLoad("見本を全ての色味で描き、置き場所を既定の色味と比べる", () =>
  new Map(
    SAMPLES.map((name): [string, string[]] => {
      const source = exampleJson(`${name}.json`);
      const base = JSON.stringify(render(source, "ja", 390).layout);
      return [name, Object.keys(draw("PALETTES")).filter((palette) => JSON.stringify(draw("renderDiagram")(source, { lang: "ja", width: 390, palette }).layout) !== base)];
    }),
  ),
);

describe("配管の図の決まりの表と組み方 (#3418)", () => {
  it("pipe-rules-table-covers-eight-breakages", () => {
    const { rules } = rulesApi();
    // 部品の種類の組ごとの最小の間、線が部品を通ってよい口、線どうしの間と交わり方、1 本の管が折れてよい回数を持つ
    const names = rules.map((r) => r.name);
    for (const want of ["part-gap", "call-part-spacing", "line-through-part", "parallel-gap", "value-crossings", "call-crossings", "bends", "short-segment"])
      expect(names, `決まりの表に ${want} の行が無い`).toContain(want);
    for (const r of rules) {
      expect(["min", "max"], `決まり ${r.name} の値の向き`).toContain(r.kind);
      expect(Number.isFinite(r.value), `決まり ${r.name} の値が数でない`).toBe(true);
      expect(r.about, `決まり ${r.name} に何を決めるかの文が無い`).toMatch(/\p{L}{4,}/u);
      expect(BREAKAGES as readonly string[], `決まり ${r.name} の崩れの種類`).toContain(r.breakage);
    }
    // 8 種類の崩れのそれぞれを受け持つ決まりがある。空きの偏りは組み方で減らし、違反には数えない
    for (const b of BREAKAGES) expect(rules.some((r) => r.breakage === b), `崩れ ${b} を受け持つ決まりが無い`).toBe(true);
    expect(rules.filter((r) => r.breakage === "lopsided").every((r) => !r.counted), "空きの偏りを違反に数えている").toBe(true);
    expect(rules.filter((r) => r.breakage !== "lopsided").every((r) => r.counted), "空きの偏り以外に数えない決まりがある").toBe(true);
    // 決まりの名前は 1 つずつ
    expect(new Set(names).size, "決まりの名前が重なる").toBe(names.length);
  });

  // 見本と言語と枠の幅ごとに件を分け、1 件が混んだ機械でも 10 秒の上限に迫らないようにする (#3410 と同じ分け方)。
  // 広い枠を先に描くので、狭い枠の件は覚えに在る広い枠の図を使う
  describe.for(exampleCases)("%s %s 幅 %i", ([name, lang, width]) => {
    it("pipe-rules-zero-violations-in-every-example", () => {
      const { violations } = rulesApi();
      const rendered = EXAMPLES_DRAWN.get().get(`${name} ${lang} ${width}`) as PipeRendered;
      expect(listed(violations(rendered.layout)), `${name} (${lang}, 幅 ${width}) の決まりの表への違反`).toEqual([]);
    });
  });

  /*
   * 置き場所の指紋 (#3472)。道を探す処理を速くしても、管の線を 1 本も変えないことを縛る。
   * 見本と言語と枠の幅と開いた箱ごとに、描いた置き場所 (`layout`) を JSON にした文の指紋を、記録した指紋と比べる。
   * 上の決まりの表の件が同じ図を描くので、多くの件は覚えに在る図を使う。
   * 線を変えると決めた変更では、`DRAGON_RECORD_PIPE_FINGERPRINTS=1` を付けてこの検査を回し、記録を書き直す
   */
  const FINGERPRINTS = join(ROOT, "packages/dragon/test/fixtures/pipe-layout-fingerprints.json");
  const fingerprintCases = SAMPLES.flatMap((name) =>
    (["ja", "en"] as const).flatMap((lang) =>
      ([1280, 390] as const).flatMap((width) => (name === "aggregator" ? ["-", "2"] : ["-"]).map((open) => [name, lang, width, open] as const)),
    ),
  );
  describe.for(fingerprintCases)("%s %s 幅 %i 開く箱 %s", ([name, lang, width, open]) => {
    it("pipe-layout-matches-recorded-fingerprints", () => {
      // EXAMPLES_DRAWN は aggregator を 2 つ目の箱を開いて描く。開く箱の組は `-` か `2` だけ
      const rendered = (name === "aggregator" && open === "-" ? CLOSED_AGGREGATOR.get().get(`${lang} ${width}`) : EXAMPLES_DRAWN.get().get(`${name} ${lang} ${width}`)) as PipeRendered;
      const key = `${name} ${lang} ${width} ${open}`;
      const print = createHash("sha256").update(JSON.stringify(rendered.layout)).digest("hex").slice(0, 16);
      const recorded = existsSync(FINGERPRINTS) ? (JSON.parse(readFileSync(FINGERPRINTS, "utf8")) as Record<string, string>) : {};
      if (process.env.DRAGON_RECORD_PIPE_FINGERPRINTS === "1") {
        recorded[key] = print;
        writeFileSync(FINGERPRINTS, `${JSON.stringify(Object.fromEntries(Object.entries(recorded).sort()), null, 2)}\n`);
        return;
      }
      expect(recorded[key], `${key} の指紋が記録に無い`).toBeDefined();
      expect(print, `${key} の置き場所が記録した指紋と違う。管の線が変わった`).toBe(recorded[key]);
    });
  });

  /*
   * 管を引く順を試す回 (#3603)。順は文字 1 つで表し、引いた時の悪い管の数を表から返す。
   * 悪い管が 0 の回は次の順を返さず、ほかの回は `order` の次の文字を返す
   */
  const orderTries = (bad: Record<string, number>, order = "abcde"): { ran: string[]; best: string; last: string } => {
    const ran: string[] = [];
    const { best, ran: last } = tryOrders(
      order[0] as string,
      (list) => list,
      (list) => {
        ran.push(list);
        return bad[list] as number;
      },
      (got) => [got],
      (list, got) => (got === 0 ? undefined : order[(order.indexOf(list) + 1) % order.length]),
    );
    return { ran, best: best.list, last };
  };

  it("pipe-order-tries-stop-without-gain", () => {
    // 前の最良と同じ数の回と、増えた回の後は、次の順を試さない。最良は前の回の順のまま
    expect(orderTries({ a: 2, b: 2, c: 0 }), "前の最良と同じ数の回の後も次の順を試した").toEqual({ ran: ["a", "b"], best: "a", last: "b" });
    expect(orderTries({ a: 1, b: 3, c: 0 }), "前の最良より悪い回の後も次の順を試した").toEqual({ ran: ["a", "b"], best: "a", last: "b" });
  });

  it("pipe-order-tries-keep-going-while-better", () => {
    // 良くなる間は次の順を試し、悪い管が 0 になった回でやめる
    expect(orderTries({ a: 3, b: 1, c: 0, d: 0 }), "悪い管が 0 になった回でやめない").toEqual({ ran: ["a", "b", "c"], best: "c", last: "c" });
    // 良くなり続けても 4 回でやめ、最良の回の順を返す
    expect(orderTries({ a: 4, b: 3, c: 2, d: 1, e: 0 }), "4 回でやめない").toEqual({ ran: ["a", "b", "c", "d"], best: "d", last: "d" });
    // 前に試した順に戻った時はやめる
    expect(orderTries({ a: 2, b: 1 }, "ab"), "前に試した順をまた試した").toEqual({ ran: ["a", "b"], best: "b", last: "b" });
  });

  describe.for([
    ["aggregator.json", "ja"],
    ["aggregator.en.json", "en"],
  ] as const)("%s", ([file]) => {
    it("pipe-narrow-open-aggregator-searches-fewer", () => {
      // 幅 390 で箱 2 を開いた aggregator は、組み方を 3 通り試し、管の道を何度も探す。
      // 直す前は、広い枠と狭い枠を合わせて 515 回探した (#3603)。並べ方の覚えに在る図は探さないので、0 回は数えない。
      // `src` の並べ方を呼び、数える `Router` と並べ方が使う `Router` を同じ module にする (`dist` は別の `Router` を持つ)
      const searches = AGGREGATOR_SEARCHES.get().get(file) ?? 0;
      expect(searches, `${file} の道を 1 度も探していない。覚えに在る図を使った`).toBeGreaterThan(0);
      expect(searches, `${file} の道を探す回数`).toBeLessThan(515);
    });
  });

  it("router-paths-same-when-routers-alternate", () => {
    // 大きさの違う格子の Router を交互に使っても、それぞれを新しく作った Router と同じ道を返す (#3472)。
    // 道を探す作業の配列を Router の間で使い回す時に、前の探しの覚えが混ざると道が変わる
    const lines = (count: number): number[] => Array.from({ length: count }, (_, k) => k * 20);
    const big = { xs: lines(60), ys: lines(40), obstacles: [{ rect: { x: 200, y: 100, w: 200, h: 400 }, pad: 10 }, { rect: { x: 600, y: 300, w: 300, h: 200 }, pad: 10 }] };
    const small = { xs: lines(16), ys: lines(12), obstacles: [{ rect: { x: 100, y: 60, w: 60, h: 120 }, pad: 10 }] };
    const ask = (from: Point, to: Point, bend: number): Ask => ({
      owner: "a",
      group: "a",
      kind: "value",
      width: 4,
      starts: [{ at: from, dir: 0 }],
      ends: [{ at: to, dir: 0 }],
      cross: () => 5,
      gap: 4,
      bend,
      hug: 0.2,
    });
    const asks = {
      big: [ask([0, 0], [1000, 700], 30), ask([0, 700], [1100, 40], 300), ask([0, 300], [1000, 320], 30)],
      small: [ask([0, 0], [280, 200], 30), ask([0, 200], [300, 20], 300), ask([0, 100], [240, 100], 30)],
    };
    const fresh = (grid: typeof big, a: Ask): Point[] | undefined => new Router(grid.xs, grid.ys, grid.obstacles).route(a);
    const want = { big: asks.big.map((a) => fresh(big, a)), small: asks.small.map((a) => fresh(small, a)) };
    for (const path of [...want.big, ...want.small]) expect(path, "新しく作った Router が道を見つけない").toBeDefined();
    // 小さい格子から始めて大きい格子へ移り、また小さい格子へ戻る
    const routers = { big: new Router(big.xs, big.ys, big.obstacles), small: new Router(small.xs, small.ys, small.obstacles) };
    const got: string[] = [];
    const expected: string[] = [];
    for (let k = 0; k < 3; k++)
      for (const size of ["small", "big"] as const) {
        got.push(`${size} ${k} ${JSON.stringify(routers[size].route(asks[size][k] as Ask))}`);
        expected.push(`${size} ${k} ${JSON.stringify(want[size][k])}`);
      }
    expect(got, "交互に使った Router の道が、新しく作った Router の道と違う").toEqual(expected);
  });

  describe.for(SAMPLES)("%s の色味", (name) => {
    it("pipe-rules-zero-violations-in-every-example", () => {
      expect(PALETTE_DIFFERS.get().get(name), `${name} の置き場所が既定の色味と違う色味`).toEqual([]);
    });
  });

  describe.for(Array.from({ length: 10 }, (_, k) => k + 1))("種 %i", (seed) => {
    it("pipe-rules-zero-violations-in-generated-figures", () => {
      const { violations } = rulesApi();
      const found: string[] = [];
      for (const long of [false, true]) {
        const source = generatedPipe(seed, long);
        for (const width of [1280, 390]) {
          const rendered = render(source, "en", width);
          for (const v of listed(violations(rendered.layout))) found.push(`種 ${seed}${long ? " (長い名前)" : ""} 幅 ${width} ${v}`);
        }
      }
      expect(found, "機械で作った図の決まりの表への違反").toEqual([]);
    });
  });

  it("pipe-rules-broken-value-names-the-rule", () => {
    const { rules, violations } = rulesApi();
    const layouts = [
      render(exampleJson("swap.json")).layout,
      render(exampleJson("swap-two-hops.json")).layout,
      render(exampleJson("vault-proxy.json")).layout,
      render(exampleJson("aggregator.json"), "ja", 1280, [2]).layout,
    ];
    for (const rule of rules.filter((r) => r.counted)) {
      // 下限は 40 倍に、上限は 0 より 1 つ小さくして壊す。壊した決まりだけが違反に出る
      const broken = rules.map((r) => (r.name === rule.name ? { ...r, value: r.kind === "min" ? r.value * 40 + 400 : -1 } : r));
      const hit = layouts.flatMap((layout) => violations(layout, broken)).map((v) => v.rule);
      expect(hit, `決まり ${rule.name} の値を壊しても違反に名前が出ない`).toContain(rule.name);
      expect([...new Set(hit)], `決まり ${rule.name} を壊した時にほかの決まりの違反が出る`).toEqual([rule.name]);
    }
  });

  it("pipe-compose-by-calls-and-flows", () => {
    // 見本 swap-two-hops は 3 つの持ち主の流れが輪になる。Pool2 の囲いを下の段に置いて輪にする
    const two = composed(render(exampleJson("swap-two-hops.json")));
    const housingOf = (layout: ComposedLayout, party: string): Housing => {
      const found = layout.housings.filter((h) => h.party === party);
      expect(found.length, `${party} の囲いの数`).toBe(1);
      return found[0] as Housing;
    };
    const alice = housingOf(two, "alice");
    const pool1 = housingOf(two, "pool1");
    const pool2 = housingOf(two, "pool2");
    expect([alice.row, pool1.row], "Alice と Pool1 の囲いの段").toEqual([0, 0]);
    expect(pool2.row, "Pool2 の囲いの段").toBe(1);
    expect(alice.y, "Alice と Pool1 の囲いの高さが揃わない").toBeCloseTo(pool1.y, 0);
    expect(pool2.y, "Pool2 の囲いが Pool1 の囲いより下に無い").toBeGreaterThan(pool1.y + pool1.h);
    expect(alice.x + alice.w < pool1.x, "Alice の囲いが Pool1 の囲いの左に無い").toBe(true);
    // 流れでつながる囲いを隣に置く。1 列の囲いの間に別の囲いを挟まない
    expect(two.housings.filter((h) => h.row === 0 && h.x > alice.x && h.x < pool1.x), "Alice と Pool1 の囲いの間の囲い").toEqual([]);
    // WETH と DAI と USDC の値の管は輪を作り、互いに交わらない
    const pipeOf = (token: string): ValuePipe => {
      const found = two.valuePipes.find((p) => p.token === token);
      expect(found, `${token} の値の管が無い`).toBeDefined();
      return found as ValuePipe;
    };
    const ring = ["USDC", "WETH", "DAI"].map(pipeOf);
    expect(ring.map((p) => `${p.from}->${p.to}`), "輪の値の管がつなぐ持ち主").toEqual(["alice->pool1", "pool1->pool2", "pool2->alice"]);
    for (let i = 0; i < ring.length; i++)
      for (let j = i + 1; j < ring.length; j++)
        expect(crossingsOf((ring[i] as ValuePipe).points, (ring[j] as ValuePipe).points), `${ring[i]?.token} と ${ring[j]?.token} の値の管が交わる`).toEqual([]);
    // 槽は持ち主の囲いの中に在る
    for (const t of two.tanks) expect(inside(t, housingOf(two, t.party)), `${t.party} の ${t.token} の槽が自分の囲いの外に在る`).toBe(true);
    // 名札は自分の囲いの真上に在り、呼び出しの深さで段を下げる (Router は Alice より下、Pool1 は Router より下)
    for (const party of ["alice", "pool1", "pool2"]) {
      const p = partyOf(two, party);
      const h = housingOf(two, party);
      expect(within(center(p), h), `${party} の名札が自分の囲いの真上に無い`).toBe(true);
      expect(p.y + p.h, `${party} の名札が自分の囲いより上に無い`).toBeLessThanOrEqual(h.y);
    }
    expect(partyOf(two, "router").y, "Router の名札が Alice の名札より下に無い").toBeGreaterThanOrEqual(partyOf(two, "alice").y);
    expect(partyOf(two, "pool1").y, "Pool1 の名札が Router の名札より下に無い").toBeGreaterThan(partyOf(two, "router").y);
    // 隣にできる流れだけの見本 swap は、囲いを 1 段に並べる
    const swap = composed(render(exampleJson("swap.json")));
    expect([...new Set(swap.housings.map((h) => h.row))], "見本 swap の囲いの段").toEqual([0]);
  });

  // 全ての見本を 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。見本ごとの件に分け、file を読み込む段で描いた図を読む
  describe.for(SAMPLES)("%s", (name) => {
    it("pipe-pipes-join-side-ports-and-cross-under", () => {
      const { rules } = rulesApi();
      const spacing = rules.find((r) => r.name === "call-part-spacing")?.value ?? Number.NaN;
      const rendered = EXAMPLES_DRAWN.get().get(`${name} ja 1280`) as PipeRendered;
      const layout = composed(rendered);
      // 値の管は持ち主の槽の横の口どうしを結ぶ
      for (const pipe of layout.valuePipes) {
        for (const [k, port] of pipe.ports.entries()) {
          const tank = tankOf(layout, port.party, port.token);
          const edge = port.side === "left" ? tank.x : tank.x + tank.w;
          expect(port.party, `${name} の ${pipe.token} の値の管の${k === 0 ? "出口" : "入口"}の持ち主`).toBe(k === 0 ? pipe.from : pipe.to);
          expect(port.x, `${name} の ${pipe.token} の値の管の口が ${port.party} の槽の横の縁に無い`).toBeCloseTo(edge, 0);
          expect(port.y > tank.y && port.y < tank.y + tank.h, `${name} の ${pipe.token} の値の管の口が ${port.party} の槽の高さの外`).toBe(true);
        }
        const ends = [pipe.points[0], pipe.points[pipe.points.length - 1]] as Point[];
        expect(ends.map(([x, y]) => [Math.round(x), Math.round(y)]), `${name} の ${pipe.token} の値の管の端が口に無い`).toEqual(pipe.ports.map((p) => [Math.round(p.x), Math.round(p.y)]));
      }
      // 呼び出しの管が値の管を越える所は直角に 1 回だけで、くぐる所を置き場所に持つ
      const seen = new Set<string>();
      for (const c of layout.calls)
        for (const [index, pipe] of layout.valuePipes.entries()) {
          const xs = crossingsOf(c.points, pipe.points);
          expect(xs.length, `${name} の ${c.index + 1} 番目の呼び出しの管が ${pipe.token} の値の管を越える回数`).toBeLessThanOrEqual(1);
          for (const x of xs) {
            const flatA = x.a[0][1] === x.a[1][1];
            const flatB = x.b[0][1] === x.b[1][1];
            expect(flatA !== flatB, `${name} の ${c.index + 1} 番目の呼び出しの管が ${pipe.token} の値の管を直角に越えない`).toBe(true);
            // 同じトークンの値の管が 2 本ある時、1 本の呼び出しの管が両方を越えることがあるため、管の番号で引く
            const listedAt = layout.crossings.find((k) => k.call === c.index && k.pipe === index);
            expect(listedAt && Math.hypot(listedAt.x - x.at[0], listedAt.y - x.at[1]) < 1, `${name} の ${c.index + 1} 番目の呼び出しの管が ${pipe.token} の値の管をくぐる所が置き場所に無い`).toBe(true);
            seen.add(`${c.index}|${index}`);
          }
        }
      expect(layout.crossings.map((k) => `${k.call}|${k.pipe}`).sort(), `${name} のくぐる所の一覧`).toEqual([...seen].sort());
      // くぐる所は値の管の下に描く (呼び出しの管を値の管より先に描き、くぐる所で呼び出しの管を切る)
      const doc = new DOMParser().parseFromString(rendered.svg, "image/svg+xml");
      for (const k of layout.crossings) expect(doc.querySelector(`[data-pipe-crossing="${k.call}"][data-pipe-token="${k.token}"]`), `${name} のくぐる所の印が SVG に無い`).not.toBeNull();
      const all = [...doc.querySelectorAll("[data-pipe-call], [data-pipe-value]")];
      const lastCall = Math.max(...all.map((e, i) => (e.hasAttribute("data-pipe-call") ? i : -1)));
      const firstValue = all.findIndex((e) => e.hasAttribute("data-pipe-value"));
      if (layout.crossings.length > 0) expect(firstValue, `${name} の値の管が呼び出しの管より先に描かれる`).toBeGreaterThan(lastCall);
      // 呼び出しの管は名札と槽を横切らない (呼んだ者と呼ばれた者の名札の中の端は除く)
      for (const c of layout.calls) {
        for (const p of layout.parties.filter((q) => q.id !== c.from && q.id !== c.to))
          expect(segmentsOf(c.points).some((s) => cutsThrough(s, p)), `${name} の ${c.index + 1} 番目の呼び出しの管が ${p.id} の名札を横切る`).toBe(false);
        for (const t of layout.tanks) expect(segmentsOf(c.points).some((s) => cutsThrough(s, t)), `${name} の ${c.index + 1} 番目の呼び出しの管が ${t.party} の ${t.token} の槽を横切る`).toBe(false);
      }
      // 呼び出しの弁は管が横か縦に走る所に、管の向きに合わせて置く (縦に走る所の弁は `vertical`)。計器は横に走る所に置き、決まりの間を空ける
      for (const main of layout.mains ?? [])
        for (const b of main.branches) {
          const v = b.valve;
          const upright = (v as { vertical?: boolean }).vertical === true;
          const onRun = segmentsOf(main.points.concat(b.points)).some(([a, z]) =>
            upright
              ? a[0] === z[0] && Math.abs(a[0] - v.x) < 0.5 && v.y >= Math.min(a[1], z[1]) && v.y <= Math.max(a[1], z[1])
              : a[1] === z[1] && Math.abs(a[1] - v.y) < 0.5 && v.x >= Math.min(a[0], z[0]) && v.x <= Math.max(a[0], z[0]),
          );
          expect(onRun, `${name} の ${main.from} から ${b.to} への弁が、弁の向きに走る管の上に無い`).toBe(true);
        }
      const onCall = layout.gauges.filter((g) => g.on === "call");
      for (const g of onCall)
        for (const h of onCall.filter((k) => k !== g && k.step === g.step))
          expect(gap(g, h), `${name} の段 ${g.step + 1} の ${g.party} と ${h.party} の計器の間`).toBeGreaterThanOrEqual(spacing - 1e-6);
    });
  });

  it("pipe-value-pipes-share-a-trunk", () => {
    // 見本 aggregator では、Aggregator の USDC の槽から 3 つの Pool へ出る管と、3 つの Pool から Aggregator の WETH の槽へ入る管が、それぞれ 1 本の幹を作る
    const layout = composed(render(exampleJson("aggregator.json"), "ja", 1280, [2]));
    /** 2 本の折れ線が同じ筋の上で重なって走る長さ */
    const sharedLength = (p: Point[], q: Point[]): number => {
      let n = 0;
      for (const [a, b] of segmentsOf(p))
        for (const [u, v] of segmentsOf(q)) {
          const flat = a[1] === b[1];
          if (flat !== (u[1] === v[1])) continue;
          if (flat ? Math.abs(a[1] - u[1]) > 0.5 : Math.abs(a[0] - u[0]) > 0.5) continue;
          const k = flat ? 0 : 1;
          n += Math.max(0, Math.min(Math.max(a[k], b[k]), Math.max(u[k], v[k])) - Math.max(Math.min(a[k], b[k]), Math.min(u[k], v[k])));
        }
      return n;
    };
    for (const [token, root] of [
      ["USDC", 0],
      ["WETH", 1],
    ] as const) {
      const leaf = root === 0 ? 1 : 0;
      const group = layout.valuePipes.filter((p) => p.token === token && p.ports[root].party === "agg" && /^pool[1-3]$/.test(p.ports[leaf].party));
      expect(group.map((p) => p.ports[leaf].party).sort(), `${token} の幹の管が結ぶ Pool`).toEqual(["pool1", "pool2", "pool3"]);
      // 根の槽の 1 つの口を共に使う
      const roots = new Set(group.map((p) => `${Math.round(p.ports[root].x)},${Math.round(p.ports[root].y)}`));
      expect(roots.size, `${token} の幹の管が Aggregator の槽の別々の口を使う`).toBe(1);
      // 2 本ずつ、同じ筋の上を重なって走る幹を持ち、互いを突き抜けて越えない
      for (let i = 0; i < group.length; i++)
        for (let j = i + 1; j < group.length; j++) {
          const [a, b] = [group[i] as ValuePipe, group[j] as ValuePipe];
          const label = `${token} の ${a.ports[leaf].party} と ${b.ports[leaf].party} の管`;
          expect(sharedLength(a.points, b.points), `${label}が重なって走る長さ`).toBeGreaterThan(40);
          expect(crossingsOf(a.points, b.points), `${label}が互いを突き抜ける`).toEqual([]);
        }
    }
  });

  it("pipe-rules-valve-clearance", () => {
    const { rules, violations } = rulesApi();
    const rule = rules.find((r) => r.name === "valve-clearance");
    expect(rule, "決まりの表に valve-clearance の行が無い").toBeDefined();
    expect([rule?.kind, rule?.value, rule?.breakage, rule?.counted], "valve-clearance の向きと値と崩れの種類").toEqual(["min", 3, "crowded", true]);
    // 見本 swap の弁はどれもほかの線から離れている
    const layout = render(exampleJson("swap.json"), "ja", 1280).layout as unknown as ComposedLayout;
    const clearance = (l: unknown): Violation[] => violations(l).filter((v) => v.rule === "valve-clearance");
    expect(listed(clearance(layout)), "見本 swap の弁とほかの線の間の違反").toEqual([]);
    // 弁を 1 つ、横に走る値の管の 35px 下へ動かす。弁の胴は値の管から離れ、閉じた取っ手が値の管に重なる
    const pipe = layout.valuePipes.find((p) => segmentsOf(p.points).some(([a, b]) => a[1] === b[1] && Math.abs(b[0] - a[0]) >= 60));
    expect(pipe, "見本 swap に横に 60px 以上走る値の管が無い").toBeDefined();
    const [a, b] = segmentsOf((pipe as ValuePipe).points).find(([u, v]) => u[1] === v[1] && Math.abs(v[0] - u[0]) >= 60) as [Point, Point];
    const moved = JSON.parse(JSON.stringify(layout)) as ComposedLayout;
    const main = (moved.mains ?? [])[0] as Main;
    const branch = main.branches[0] as Main["branches"][number];
    branch.valve = { ...branch.valve, x: (a[0] + b[0]) / 2, y: a[1] + 35, vertical: false } as Main["branches"][number]["valve"];
    const found = clearance(moved);
    expect(
      found.some((v) => v.parts[0] === `valve:${main.from}>${branch.to}`),
      `取っ手を値の管に重ねた ${main.from} から ${branch.to} への弁を違反に数えない: ${listed(found).join(", ")}`,
    ).toBe(true);
  });

  it("pipe-aggregator-untangled", () => {
    // 見本 aggregator の箱を全て開いた図の最後の段で、管が交わる所を数える
    const layout = composed(render(exampleJson("aggregator.json"), "ja", 1280, [2]));
    const calls = (layout.mains ?? []).flatMap((m) => m.branches.map((b) => ({ name: `${m.from}>${b.to}`, from: m.from, points: b.points })));
    const stubs = (layout as unknown as { stubs: { points: Point[] }[] }).stubs;
    const values = [...layout.valuePipes.map((p) => p.points), ...stubs.map((s) => s.points)];
    const at = (p: Point): string => `${Math.round(p[0])},${Math.round(p[1])}`;
    // 呼び出しの管どうしが交わる所
    const callCalls = new Set<string>();
    for (let i = 0; i < calls.length; i++)
      for (let j = i + 1; j < calls.length; j++) for (const x of crossingsOf((calls[i] as (typeof calls)[number]).points, (calls[j] as (typeof calls)[number]).points)) callCalls.add(at(x.at));
    // 呼び出しの管が値の管を越える所。幹を共に通る値の管を 1 か所で越える時は 1 と数える
    const overValues = new Set<string>();
    for (const c of calls) for (const v of values) for (const x of crossingsOf(c.points, v)) overValues.add(`${c.name}|${at(x.at)}`);
    // 1 本の呼び出しの管が越える線。値の管と、ほかの者から出る呼び出しの管
    const perCall = calls.map((c) => {
      const points = new Set<string>();
      for (const v of values) for (const x of crossingsOf(c.points, v)) points.add(at(x.at));
      for (const o of calls.filter((k) => k.from !== c.from)) for (const x of crossingsOf(c.points, o.points)) points.add(at(x.at));
      return [c.name, points.size] as const;
    });
    const most = perCall.reduce((m, x) => (x[1] > m[1] ? x : m), ["", 0] as readonly [string, number]);
    expect(callCalls.size, "呼び出しの管どうしが交わる所 (直す前は 25)").toBeLessThanOrEqual(12);
    expect(overValues.size, "呼び出しの管が値の管を越える所 (直す前は 26)").toBeLessThanOrEqual(16);
    expect(most[1], `1 本の呼び出しの管 (${most[0]}) が越える線 (直す前は 10)`).toBeLessThanOrEqual(7);
  });

  // 全ての見本を 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) に近づいた (#3738)。見本ごとの件に分け、file を読み込む段で描いた図を読む
  describe.for(SAMPLES)("%s", (name) => {
    it("pipe-text-caps-and-square-labels", () => {
      const drawn = EXAMPLES_DRAWN.get();
      const sizeOf = (layout: ComposedLayout): Record<string, number[]> => ({
        tank: [layout.tanks[0]?.w ?? 0, layout.tanks[0]?.h ?? 0],
        gauge: [Number((layout.gauges[0] as unknown as { r?: number } | undefined)?.r ?? 0)],
        tag: [layout.parties.find((p) => p.shape === "cabinet")?.h ?? 0],
      });
      const want = sizeOf(composed(drawn.get("swap ja 1280") as PipeRendered));
      const layout = composed(drawn.get(`${name} ja 1280`) as PipeRendered);
      // 槽と計器と名札の寸法は見本 swap と同じ。込み合う図でも小さくしない
      const got = sizeOf(layout);
      for (const key of Object.keys(want)) if ((got[key] ?? [0]).every((v) => v > 0)) expect(got[key], `${name} の ${key} の寸法が見本 swap と違う`).toEqual(want[key]);
      // 槽の数字は 22px、名前は 15px、値の箱は 26px を超えない
      for (const l of layout.levels) expect(l.text.h, `${name} の ${l.party} の ${l.token} の槽の数字の大きさ`).toBeLessThanOrEqual(22);
      for (const p of layout.parties) expect((p as Party & { label?: Writing }).label?.h ?? 0, `${name} の ${p.id} の名前の大きさ`).toBeLessThanOrEqual(15);
      for (const p of layout.plates) expect(p.text.h, `${name} の ${p.party} の ${p.name} の値の大きさ`).toBeLessThanOrEqual(26);
      // 名札の幅は名前の長さに合わせる (名前の幅と名札の幅の差が全ての箱の名札で同じ)
      const pads = layout.parties.filter((p) => p.shape === "cabinet").map((p) => Math.round(p.w - ((p as Party & { label?: Writing }).label?.w ?? 0)));
      expect(new Set(pads).size, `${name} の箱の名札の幅が名前の長さに合っていない (${pads.join(", ")})`).toBeLessThanOrEqual(1);
      // 図の中の札の角の丸みは 6px 以下
      for (const c of layout.chips) expect(c.rx, `${name} の段 ${c.step + 1} の ${c.kind} の札の角の丸み`).toBeLessThanOrEqual(6);
    });
  });

  it("pipe-values-have-roles", () => {
    const source = exampleJson("swap-two-hops.json");
    const rendered = render(source, "ja", 1280);
    const layout = composed(rendered);
    // 値の管に流れた量を単位つきで、管の近くに出す
    for (const [step, text, token] of [
      [2, "100 USDC", "USDC"],
      [5, "0.05 WETH", "WETH"],
      [10, "160 DAI", "DAI"],
    ] as const) {
      const chip = layout.chips.find((c) => c.kind === "amount" && c.step === step);
      expect(chip?.text, `段 ${step + 1} の流れた量の札`).toBe(text);
      const pipe = layout.valuePipes.find((p) => p.token === token);
      const mid: Point = [center(chip as Rect), (chip?.y ?? 0) + (chip?.h ?? 0) / 2];
      expect(onPath(mid, pipe?.points ?? [], 60), `段 ${step + 1} の流れた量の札が ${token} の値の管の近くに無い`).toBe(true);
    }
    // 計器に単位つきの式を出す
    const formula = layout.chips.find((c) => c.kind === "formula" && c.step === 9);
    expect(formula?.text, "段 10 の計器の式").toBe("160 DAI ≥ 150 DAI");
    // 始めた人が払った槽に入力、受け取った槽に出力の印を付ける
    const io = layout.chips.filter((c) => c.kind === "io" && c.step === lastStep(source));
    const ioOf = (token: string): Chip | undefined => io.find((c) => c.party === "alice" && c.token === token);
    expect(ioOf("USDC")?.text, "Alice が払った USDC の槽の印").toMatch(/^入力/);
    expect(ioOf("DAI")?.text, "Alice が受け取った DAI の槽の印").toMatch(/^出力/);
    const en = composed(render(exampleJson("swap-two-hops.en.json"), "en", 1280));
    const enIo = en.chips.filter((c) => c.kind === "io" && c.party === "alice");
    expect(enIo.length > 0 && enIo.every((c) => !KANA.test(c.text)), "英語の入力と出力の印に仮名か漢字がある").toBe(true);
    // 段ごとの吹き出しは出さない
    expect(layout.callouts ?? [], "吹き出しの置き場所").toEqual([]);
    expect(rendered.svg.includes("data-pipe-callout"), "SVG に吹き出しがある").toBe(false);
  });

  it("pipe-tank-shows-balance-and-change", () => {
    const source = exampleJson("swap.json");
    const layout = render(source, "ja", 1280).layout;
    const last = lastStep(source);
    type Shown = Level & { delta?: Writing; tag?: Writing };
    const at = (s: number): Shown => levelOf(layout, "pool", "USDC", s);
    expect(at(3).delta, "変わる前の段の Pool の USDC に増減がある").toBeUndefined();
    for (let s = 4; s < last; s++) {
      expect([at(s).text.text, at(s).delta?.text, at(s).tag?.text], `段 ${s + 1} の Pool の USDC の残高と増減と語`).toEqual(["2,100", "+100 USDC", "暫定"]);
      expect([at(s).was, at(s).strike], `段 ${s + 1} の Pool の USDC に前の値の消し線がある`).toEqual([undefined, undefined]);
    }
    expect([at(last).delta?.text, at(last).tag?.text], "最後の段の Pool の USDC の増減と語").toEqual(["+100 USDC", "確定"]);
    const alice = levelOf(layout, "alice", "USDC", last) as Shown;
    expect(alice.delta?.text, "最後の段の Alice の USDC の増減").toBe("−100 USDC");
    // 増減は残高の下に在る
    expect(at(last).delta?.y ?? 0, "増減が残高の下に無い").toBeGreaterThanOrEqual(at(last).text.y + at(last).text.h);
  });

  it("pipe-emit-beside-emitter", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source, "ja", 1280);
    const layout = composed(rendered);
    // 図の上の端にイベントの列を描かない
    expect(layout.heads?.events, "図の上の端にイベントの行の字がある").toBeUndefined();
    const top = Math.min(...layout.parties.map((p) => p.y));
    const chips = layout.chips.filter((c) => c.kind === "event");
    expect(chips.length, "イベントの札の数").toBeGreaterThan(0);
    for (const c of chips) {
      // イベントの札は、出した Contract の箱の横に出る
      const emitter = partyOf(layout, c.party ?? "");
      expect(c.y, `段 ${c.step + 1} の ${c.party} のイベントの札が図の上の端に在る`).toBeGreaterThan(top);
      expect(gap(c, emitter), `段 ${c.step + 1} の ${c.party} のイベントの札が出した箱から離れる`).toBeLessThanOrEqual(40);
      const middle = c.y + c.h / 2;
      expect(middle >= emitter.y - 8 && middle <= emitter.y + emitter.h + 40, `段 ${c.step + 1} の ${c.party} のイベントの札が箱の横に無い`).toBe(true);
    }
  });

  it("pipe-write-plates-sit-in-owner-housing", () => {
    const layout = composed(render(exampleJson("vault-proxy.json"), "ja", 1280));
    const housing = layout.housings.find((h) => h.party === "proxy");
    expect(housing, "Proxy の囲いが無い").toBeDefined();
    const plates = layout.plates.filter((p) => p.party === "proxy" && !(p as Plate & { boxed?: boolean }).boxed);
    expect(plates.length, "Proxy の値の札の数").toBeGreaterThan(0);
    for (const p of plates) expect(inside(p, housing as Rect), `段 ${p.step + 1} の Proxy の ${p.name} の札が囲いの外に在る`).toBe(true);
    // write の段で札の値が替わり、前の値を消し線で残し、確定するまで暫定の印で描く。
    // 消し線は Tracelyth の配管の図の形を元にした時に戻した (#3761)
    const written = layout.plates.find((p) => p.party === "proxy" && p.name === "deposits[alice]" && p.step === 5);
    expect([written?.value, written?.was?.text, written?.state], "write の段の Proxy の deposits[alice] の札").toEqual(["1", "0", "provisional"]);
    const was = written?.was ?? { x: Number.NaN, y: 0, w: 0, h: 0 };
    expect(written?.strike !== undefined && (written.strike?.x ?? Infinity) <= was.x + 1 && (written.strike?.x ?? 0) + (written.strike?.w ?? 0) >= was.x + was.w - 1, "write の段の前の値に消し線が無い").toBe(true);
  });

  it("pipe-dims-parts-that-did-not-move", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source, "ja", 1280);
    const motion = motionFrom(rendered as unknown as Rendered);
    // 段 2 は Router が道筋を確かめる。Router の計器は明るく、Alice の槽と USDC の値の管は薄い
    const t = stillOf(rendered, 1);
    expect(seen(motion, '[data-pipe-gauge="router"][data-pipe-step="1"]', t), "段 2 の Router の計器が明るくない").toBeGreaterThan(0.9);
    const dim = (sel: string): number => Math.max(...partsOf(motion, sel).map((el) => seenOf(motion, el, t)));
    expect(dim('[data-pipe-tank="alice"][data-pipe-token="USDC"]'), "段 2 の Alice の USDC の槽が薄くない").toBeLessThanOrEqual(0.5);
    expect(dim('[data-pipe-value="USDC"]'), "段 2 の USDC の値の管が薄くない").toBeLessThanOrEqual(0.5);
    // 段 5 は 100 USDC が Alice から Pool へ移る。USDC の値の管と Alice と Pool の USDC の槽が明るく、WETH の値の管は薄い
    const t5 = stillOf(rendered, 4);
    const bright = (sel: string): number => Math.max(...partsOf(motion, sel).map((el) => seenOf(motion, el, t5)));
    expect(bright('[data-pipe-value="USDC"]'), "段 5 の USDC の値の管が明るくない").toBeGreaterThan(0.9);
    expect(bright('[data-pipe-tank="pool"][data-pipe-token="USDC"]'), "段 5 の Pool の USDC の槽が明るくない").toBeGreaterThan(0.9);
    const weth = Math.max(...partsOf(motion, '[data-pipe-value="WETH"]').map((el) => seenOf(motion, el, t5)));
    expect(weth, "段 5 の WETH の値の管が薄くない").toBeLessThanOrEqual(0.5);
  });

  it("pipe-return-travels-back-along-call", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source, "ja", 1280);
    const layout = rendered.layout;
    const motion = motionFrom(rendered as unknown as Rendered);
    // 段 6 で USDC が Router へ戻る。戻り値の札は、呼び出しの管を USDC の箱から Router の名札まで伝って動く
    const lane = layout.calls.find((c) => c.from === "router" && c.to === "usdc");
    expect(lane, "Router から USDC への呼び出しの管が無い").toBeDefined();
    const chip = partsOf(motion, '[data-pipe-return-chip][data-pipe-step="5"]')[0] as Element;
    const span = rendered.timeline.steps[5] ?? { start: 0, end: 0 };
    const posAt = (t: number): Point => {
      const v = motion.value(chip, "transform", t) ?? [];
      return [Number(chip.getAttribute("data-pipe-x") ?? 0) + (v[0] ?? 0), Number(chip.getAttribute("data-pipe-y") ?? 0) + (v[1] ?? 0)];
    };
    const points = lane?.points ?? [];
    const first = posAt(span.start + 0.05);
    const end = posAt(stillOf(rendered, 5));
    // 動き出す所は呼び出しの管の上の、呼ばれた側の端から、この段に出ている呼び出しの札と箱を避けられる一番近い所。
    // 呼ばれた側の端のすぐ上は呼び出しの札に重なるので、札は管の頭を切り詰めた所から動き出す (Tracelyth #221、#3761)
    const size = composed(rendered).chips.find((c) => c.kind === "return" && c.step === 5) ?? { w: 0, h: 0 };
    const chipAt = (p: Point): Rect => ({ x: p[0] - size.w / 2, y: p[1] - size.h / 2, w: size.w, h: size.h });
    const cards = ((layout as unknown as { callCards?: (Rect & { shown: [number, number][] })[] }).callCards ?? []).filter((cc) => cc.shown.some(([u, v]) => u < span.end && span.start < v));
    const solids: Rect[] = [...layout.parties, ...cards];
    const nearest = (p: Point): number => Math.min(...solids.map((r) => gap(chipAt(p), r)));
    expect(onPath(first, points, 6), "戻り値の札が呼び出しの管の上から動き出さない").toBe(true);
    expect(nearest(first), "戻り値の札が動き出す所で呼び出しの札か箱に重なる").toBeGreaterThan(0);
    // 4px 呼ばれた側へ寄せると、札は呼び出しの札か箱との間を 4px 保てない
    expect(nearest(along(points, alongPath(first, points, 6) + 4)), "戻り値の札が、呼び出しの札と箱を避けられる所より呼ばれた側から離れて動き出す").toBeLessThan(4);
    // 着く所は呼び出しの管の上の、動き出した所より呼んだ側の所。呼んだ側の名札の手前に並ぶ弁と計器を避けて止まるので、
    // 名札の際とは限らない (#3523)
    expect(onPath(end, points, 6), "戻り値の札が呼び出しの管の上に止まらない").toBe(true);
    expect(alongPath(end, points, 6), "戻り値の札が呼んだ側へ戻らない").toBeLessThan(alongPath(first, points, 6) - 40);
    // 途中は呼び出しの管の上を通る
    for (const k of [0.3, 0.5, 0.7]) {
      const p = posAt(span.start + (stillOf(rendered, 5) - span.start) * k);
      expect(onPath(p, points, 6), `戻り値の札が途中 (${k}) で呼び出しの管を外れる`).toBe(true);
    }
  });

  it("pipe-return-cases-follow-samples", ({ task }) => {
    expect(casesNamed(task.file, "pipe-return-chip-clear-of-caller"), "見本と言葉ごとの件").toEqual(RETURN_CASES.map(({ label }) => label));
  });

  /** 見本と言葉ごとの件が見た戻り値の札の数。全ての件の後の `pipe-return-samples-have-chips` が読む */
  let returnChipsSeen = 0;

  // 着いた札は、呼んだ側の丸や箱にも名前の字にも載らない。全ての見本の広い枠で見る。
  // 全ての見本を 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3733)。見本と言葉ごとの件に分ける
  describe.for(RETURN_CASES)("$label", ({ name, lang }) => {
    it("pipe-return-chip-clear-of-caller", () => {
      const covers = (a: Rect, b: Rect): boolean => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5;
      const laid = composed(render(exampleJson(lang === "ja" ? `${name}.json` : `${name}.en.json`), lang, 1280, name === "aggregator" ? [2] : undefined));
      for (const c of laid.chips.filter((k) => k.kind === "return")) {
        const path = c.path ?? [];
        const at = path[path.length - 1];
        const from = laid.calls.find((k) => k.index === c.call)?.from;
        const party = laid.parties.find((p) => p.id === from);
        expect(at && party, `${name} (${lang}) の段 ${c.step + 1} の戻り値の札 ${c.text} の道か呼んだ側が無い`).toBeTruthy();
        if (!at || !party) continue;
        const arrived = { x: at[0] - c.w / 2, y: at[1] - c.h / 2, w: c.w, h: c.h };
        for (const [what, r] of [["丸か箱", party], ["名前の字", party.label]] as const)
          if (r) expect(covers(arrived, r), `${name} (${lang}) の段 ${c.step + 1} の戻り値の札 ${c.text} が呼んだ側 ${party.id} の${what}に載る`).toBe(false);
        returnChipsSeen++;
      }
    });
  });

  // 戻り値の札を 1 枚も見ずに通らない。vitest は 1 つの file の検査を書いた順に回すので、見本と言葉ごとの件の後に数える
  it("pipe-return-samples-have-chips", () => {
    expect(returnChipsSeen, "見本の中に戻り値の札が無い").toBeGreaterThan(0);
  });

  it("pipe-narrow-shows-balances-and-current-value", () => {
    const source = exampleJson("swap-two-hops.json");
    // 電話の幅でも広い枠と同じ並びで描き、縮めずに送る枠で見せる (Tracelyth #87、#3720)。残高と札は広い枠と同じ字の大きさと数で出る
    const phone = composed(render(source, "ja", 390));
    const wide = composed(render(source, "ja", 1280));
    expect((phone as { narrow?: boolean }).narrow ?? false, "電話の幅の並び").toBe(false);
    const last = lastStep(source);
    for (let s = 0; s <= last; s++) {
      // 全ての槽の残高を、10px 以上の字で出す
      for (const l of phone.levels.filter((k) => k.step === s)) expect(l.text.h, `段 ${s + 1} の ${l.party} の ${l.token} の残高の字の大きさ`).toBeGreaterThanOrEqual(10);
      for (const c of phone.chips.filter((k) => k.step === s && k.kind !== "io")) expect(c.size, `段 ${s + 1} の ${c.kind} の札の字の大きさ`).toBeGreaterThanOrEqual(10);
    }
    expect(phone.levels, "電話の幅の槽の残高と増減").toEqual(wide.levels);
    expect(phone.chips, "電話の幅の札").toEqual(wide.chips);
    // 済んだ段の流れた量も札に残る
    expect(phone.chips.filter((c) => c.kind === "amount" && c.step === last).length, "最後の段の流れた量の札の数").toBe(3);
  });

  it("pipe-swap-keeps-approved-arrangement", () => {
    const source = exampleJson("swap.json");
    const layout = render(source, "ja", 1280).layout;
    // #3398 で本人が良しとした並び。関係者の左右の順と上下の順、槽の順、値の管がつなぐ槽
    const parties = layout.parties.filter((p) => p.shape !== "token");
    expect([...parties].sort((a, b) => center(a) - center(b)).map((p) => p.id), "見本 swap の名札の左右の順").toEqual(["alice", "router", "pool", "bob"]);
    const rowOf = (id: string): number => partyOf(layout, id).y + partyOf(layout, id).h / 2;
    expect(rowOf("alice"), "Alice と Router の名札の高さ (真ん中)").toBeCloseTo(rowOf("router"), 0);
    expect(rowOf("pool"), "Pool の名札が Router の名札より下に無い").toBeGreaterThan(rowOf("router"));
    expect([...layout.tanks].sort((a, b) => a.x - b.x).map((t) => `${t.party}:${t.token}`), "見本 swap の槽の左右の順").toEqual(["alice:USDC", "pool:USDC", "pool:WETH", "bob:WETH"]);
    const tankY = new Set(layout.tanks.map((t) => Math.round(t.y)));
    expect(tankY.size, "見本 swap の槽が 1 列に並ばない").toBe(1);
    for (const s of [4, lastStep(source)]) {
      const flows = layout.flows.filter((f) => f.step === s).map((f) => `${f.token}:${f.from}->${f.to}`);
      expect(flows, `見本 swap の段 ${s + 1} の流れ`).toEqual(s === 4 ? ["USDC:alice->pool"] : ["USDC:alice->pool", "WETH:pool->bob"]);
    }
  });
});
