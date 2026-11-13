// @vitest-environment jsdom
/**
 * 回り続ける図の、輪を開いた帯の見た目 (#3639)。
 *
 * 図の種類の行に `cycle <題> [shape: band]` を書くと、手順を書いた順に左から右へ等しい幅の山形で帯に並べる。
 * 名前は山形の下に、段の番号は山形の上に置く。全部の箱に `[time: <長さ>]` を書いた図は、手順の境目に始まる時刻の目盛りを帯の上に出す。
 * 回ごとに帯を 1 本ずつ上から下へ積み、まだ来ていない回の帯は薄く出す。帯ごとの頭に中身の帯の題とその回の欄の値を出す。
 * 段の中の線の札は帯の真ん中を送る手順の山形の真ん中から受ける手順の山形の真ん中へ走り、最後の手順から最初の手順への線は右の端から下の回の帯の左の端へ戻る矢印を辿る。
 * 携帯の幅では山形を縮めて手順の番号を中に書き、番号と名前の一覧を帯の下に並べる。
 * 見た目の元は #3623 の step 2 で本人が選ばなかった動く試作の案C (`.context/extend/new-kinds/kinds/cycle.js` の `drawC`)。
 *
 * 置き場所 (`layout`) は描く部品が返す値で確かめ、帯の薄さと山形の光り方と帯の頭の値と札の場所は SVG の keyframes を jsdom で読んで確かめる。
 * 回ごとの山形の行は `layout.bands`、山形は `layout.segments` (`round` はその山形が在る回)、目盛りは `layout.ticks` と `layout.unit`、
 * 山形の下の名前は `layout.names`、戻る矢印は `layout.returns`、携帯の幅の一覧は `layout.list` に返る。
 * 回の帯の部品は `data-band="<回>"`、山形の部品は `data-segment="<名札>"` と `data-round="<回>"` で、光らせる部品は class `dg-bd-lit` を持つ。
 * 帯の頭は `data-band-head="<回>"` で、欄の値の部品は `data-field` を持つ。戻る矢印は `data-band-return="<回>"`、一覧は `data-band-list` を持つ。
 * 回の番号は 0 から数え、最後の手順から最初の手順への線で 1 つ進む。
 * 見本と見た目の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, gap, type Layout, type Rect, type Rendered, type Span } from "./render-support";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([
  import("../src/render/svg"),
  import("../src/check"),
]);

const ROOT = process.cwd();
const PACKAGE = join(ROOT, "packages/dragon");
const EXAMPLES = join(PACKAGE, "examples");
const LANGS = ["ja", "en"] as const;
type Lang = (typeof LANGS)[number];

/** 見本帳の見本の一覧と、棚の見本の束と記法の早見と、カタログの種類の頁の見本 */
interface Playground {
  EXAMPLE_KEYS: readonly string[];
  exampleText: (key: string, lang: Lang) => string | undefined;
  LATER_EXAMPLES: { start: () => void; state: () => { status: string } };
  sampleGroups: (lang: Lang, arrived: boolean) => { kind: string; samples: { key: string }[] }[];
  syntaxLines: (lang: Lang) => { id: string; lines: string[] }[];
  samplesOf: (kind: string) => string[];
}

/** 見本帳の見本と棚の雛形は、見本帳の部品から読む。型の検査に見本帳の file を入れないよう、path を字にして読み込みの時に引く */
const playgroundFile = (path: string): Promise<object> =>
  import(/* @vite-ignore */ join(ROOT, "apps/playground-spa/src", path));
const { EXAMPLE_KEYS, exampleText, LATER_EXAMPLES, sampleGroups, syntaxLines, samplesOf } =
  Object.assign(
    {},
    ...(await Promise.all(
      ["examples.ts", "editor/shelf-first.ts", "editor/shelf-items.ts", "catalog/catalog.ts"].map(
        playgroundFile,
      ),
    )),
  ) as Playground;

/** 輪を開いた帯の見た目の見本 (#3639 の受入条件) */
const SAMPLE = "farm-year";

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 段の番号の丸の半径 (`look/values.ts` の `LOOK.badge.r`) */
const BADGE_R = 9.5;

type Point = [number, number];

/** 山形。`round` はその山形が在る回 */
interface Segment extends Rect {
  id: string;
  round: number;
}

/** 帯の上の目盛り。`value` は `unit` で数えた境目の時刻、`x` は境目の所 */
interface Tick {
  round: number;
  value: number;
  text: string;
  x: number;
}

interface ListRow {
  id: string;
  number: string;
  name: string;
  time: string;
}

interface BandLayout extends Omit<Layout, "boxes"> {
  kind: string;
  shape?: string;
  bands?: (Rect & { round: number })[];
  segments?: Segment[];
  ticks?: Tick[];
  unit?: string;
  names?: (Rect & { id: string; round: number })[];
  returns?: { round: number; points: Point[] }[];
  list?: Rect & { rows: ListRow[] };
  boxes: (Rect & { id: string })[];
}

interface BandRendered extends Omit<Rendered, "layout"> {
  layout: BandLayout;
}

interface Box {
  id: string;
  name: string;
  time?: string;
}

interface Source {
  kind: string;
  title: string;
  cycle?: { shape?: string; turn?: string };
  blocks: { box?: Box[]; strip?: { title: string; fields: string[] } };
  steps: {
    title: string;
    events: {
      type: string;
      from?: string;
      to?: string;
      carry?: { kind: string; text?: string };
      field?: string;
      value?: string;
    }[];
  }[];
}

/** 4 つの手順を 2 回回す、書き戻した形の小さな記法。札の無い線を 1 本持つ */
const BAND = [
  "cycle 週の仕事 [shape: band]",
  "",
  "box plan as 決める [time: 10min]",
  "box work as 進める [time: 30min]",
  "box look as 振り返る [time: 10min]",
  "box rest as 休む [time: 10min]",
  "",
  "strip 回: 回目, 経過",
  "",
  "step 決める",
  "  say 決めることから始める。",
  "  set 回目: 1回目",
  "  set 経過: 0分",
  "",
  "step 進める",
  "  say 決めたことを進める。",
  "  plan -> work [tag: やること]",
  "  set 経過: 10分",
  "",
  "step 振り返る",
  "  say 進めたことを振り返る。",
  "  work -> look",
  "  set 経過: 40分",
  "",
  "step 休む",
  "  say 振り返りを終えて休む。",
  "  look -> rest [tag: メモ]",
  "  set 経過: 50分",
  "",
  "step 次の回へ",
  "  say 休みを終えて次の回へ戻る。",
  "  rest -> plan [tag: 次の回]",
  "  set 回目: 2回目",
  "  set 経過: 0分",
  "",
  "step 2回目を進める",
  "  say 2回目も決めたことを進める。",
  "  plan -> work [tag: やること]",
  "  set 経過: 10分",
  "",
].join("\n");

/** 手順ごとの長さ (分) */
const MINUTES: Record<string, number> = { plan: 10, work: 30, look: 10, rest: 10 };

/** BAND から長さを外した記法。目盛りを出さない */
const BARE = BAND.replace(/ \[time: [^\]]+\]/gu, "");

/** BAND から見た目と長さを外した、輪の見た目の記法 */
const RING = BARE.replace(" [shape: band]", "");

const tag = (from: string, to: string, text: string): Json => ({
  type: "edge",
  from,
  to,
  carry: { kind: "tag", text },
});
/** 札を書かない線。運ぶ物は既定の封筒になる */
const plain = (from: string, to: string): Json => ({
  type: "edge",
  from,
  to,
  carry: { kind: "envelope" },
});
const set = (field: string, value: string): Json => ({ type: "strip", field, value });

/** BAND と同じ図の原本 (版2) */
function bandJson(): Json {
  return {
    version: 2,
    kind: "cycle",
    title: "週の仕事",
    cycle: { shape: "band" },
    blocks: {
      box: [
        { id: "plan", name: "決める", time: "10min" },
        { id: "work", name: "進める", time: "30min" },
        { id: "look", name: "振り返る", time: "10min" },
        { id: "rest", name: "休む", time: "10min" },
      ],
      strip: { title: "回", fields: ["回目", "経過"] },
    },
    steps: [
      {
        title: "決める",
        body: "決めることから始める。",
        events: [set("回目", "1回目"), set("経過", "0分")],
      },
      {
        title: "進める",
        body: "決めたことを進める。",
        events: [tag("plan", "work", "やること"), set("経過", "10分")],
      },
      {
        title: "振り返る",
        body: "進めたことを振り返る。",
        events: [plain("work", "look"), set("経過", "40分")],
      },
      {
        title: "休む",
        body: "振り返りを終えて休む。",
        events: [tag("look", "rest", "メモ"), set("経過", "50分")],
      },
      {
        title: "次の回へ",
        body: "休みを終えて次の回へ戻る。",
        events: [tag("rest", "plan", "次の回"), set("回目", "2回目"), set("経過", "0分")],
      },
      {
        title: "2回目を進める",
        body: "2回目も決めたことを進める。",
        events: [tag("plan", "work", "やること"), set("経過", "10分")],
      },
    ],
  };
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang = "ja", where = "記法"): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok
    ? read.diagram
    : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Source | Json, lang: Lang = "ja", width?: number): BandRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "回り続ける図を描けない").toBe("");
  return rendered as unknown as BandRendered;
}

interface Band {
  rendered: BandRendered;
  layout: BandLayout;
  motion: Motion;
  bands: (Rect & { round: number })[];
  segments: Segment[];
}

/** 輪を開いた帯の見た目の描いた図。並べ方の欄が無ければ名指して落とす */
function renderBand(text: string, lang: Lang = "ja", width?: number): Band {
  const rendered = render(parsed(text, lang), lang, width);
  const { layout } = rendered;
  expect(layout.kind, "描いた図が回り続ける図 (cycle) でない").toBe("cycle");
  expect(layout.shape, "描いた図が輪を開いた帯の見た目 (layout.shape) でない").toBe("band");
  expect(layout.bands, "並べた図に回ごとの帯 (layout.bands) が無い").toBeDefined();
  expect(layout.segments, "並べた図に山形 (layout.segments) が無い").toBeDefined();
  return {
    rendered,
    layout,
    motion: motionFrom(rendered as unknown as Rendered),
    bands: layout.bands ?? [],
    segments: layout.segments ?? [],
  };
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string =>
  existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "";

/** 段の番号の丸の四角 */
const badgeRect = (b: { x: number; y: number }): Rect => ({
  x: b.x - BADGE_R,
  y: b.y - BADGE_R,
  w: BADGE_R * 2,
  h: BADGE_R * 2,
});

/** 四角の真ん中 */
const centreOf = (r: Rect): Point => [r.x + r.w / 2, r.y + r.h / 2];

/** 点 `p` から折れ線 `points` までの一番近い距離 */
function toLine([px, py]: Point, points: Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let k = 1; k < points.length; k++) {
    const [ax, ay] = points[k - 1] as Point;
    const [bx, by] = points[k] as Point;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const t = Math.max(
      0,
      Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / (len * len)),
    );
    best = Math.min(best, Math.hypot(px - (ax + (bx - ax) * t), py - (ay + (by - ay) * t)));
  }
  return best;
}

/** 段ごとの、その段の手順と回。札が着いた手順、線の無い段は前の段の手順。最後の手順から最初の手順への線で回が 1 つ進む */
function stepsOf(source: Source): { id: string; round: number }[] {
  const ids = (source.blocks.box ?? []).map((b) => b.id);
  let now = ids[0] ?? "";
  let round = 0;
  return source.steps.map((step) => {
    for (const e of step.events) {
      if (e.type !== "edge" || !e.to) continue;
      if (e.from === ids[ids.length - 1] && e.to === ids[0]) round += 1;
      now = e.to;
    }
    return { id: now, round };
  });
}

const edgesOf = (source: Source) =>
  source.steps.flatMap((step, s) =>
    step.events.flatMap((e, i) => (e.type === "edge" ? [{ ...e, step: s, event: i }] : [])),
  );

/** 山形の部品 */
const segmentOf = (motion: Motion, id: string, round: number): Element | null =>
  motion.doc.querySelector(`[data-segment="${id}"][data-round="${round}"]`);

/** 字が `text` の札のうち、時刻 `t` に見えている札の部品。同じ字の札がほかの段にも在るので、見えている札で選ぶ */
const chipOf = (motion: Motion, text: string, t: number): Element | undefined =>
  [...motion.doc.querySelectorAll("text.dg-car-t")]
    .filter((x) => x.textContent === text)
    .map((x) => x.parentElement)
    .find((g): g is Element => g !== null && motion.opacity(g, t) > 0.5);

/** 箱に書いた長さの単位を、言語ごとに目盛りの数字に添える字 */
const UNIT_WORD: Record<Lang, Record<string, string>> = {
  ja: { ms: "ミリ秒", s: "秒", min: "分", h: "時間", d: "日" },
  en: { ms: "ms", s: "s", min: "min", h: "h", d: "d" },
};

/** 長さの単位を秒で数えた値 */
const SECONDS: Record<string, number> = { ms: 0.001, s: 1, min: 60, h: 3600, d: 86400 };

/** 誤りの最初の 1 件 */
function firstError(text: string, lang: Lang): LineError | undefined {
  const read = api("parseNotation")(text, { lang });
  return read.ok ? undefined : read.errors[0];
}

/** 誤りの行を確かめ、日本語の文は仮名か漢字を持ち、英語の文は持たず、どちらの文も `words` を全て含む */
function expectRefused(text: string, name: string, line: number, words: string[] = []): void {
  for (const lang of LANGS) {
    const first = firstError(text, lang);
    expect(first, `${name} が読めてしまう (${lang})`).toBeDefined();
    if (!first) continue;
    expect(first.line, `${name} の誤りの行 (${lang}): ${first.message}`).toBe(line);
    const message = first.message ?? "";
    if (lang === "en")
      expect(KANA.test(message), `${name} の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(
        false,
      );
    else
      expect(KANA.test(message), `${name} の日本語の誤りの文が日本語でない: ${message}`).toBe(true);
    for (const word of words)
      expect(message, `${name} の誤りの文 (${lang}) が ${word} を名指さない`).toContain(word);
  }
}

/** 記法の行の番号 (1 から数える) */
const lineOf = (text: string, head: string): number =>
  text.split("\n").findIndex((l) => l.startsWith(head)) + 1;

/** 長さを書いた手順を並べ、段を 1 つだけ持つ記法 */
const timesText = (times: string[]): string =>
  [
    "cycle 長さの帯 [shape: band]",
    "",
    ...times.map((t, i) => `box s${i + 1} as 手順${i + 1} [time: ${t}]`),
    "",
    "step 始める",
    "  say 始める。",
    "",
  ].join("\n");

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1)
    await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});

describe("輪を開いた帯の見た目の原本の JSON (#3639)", () => {
  it("schema-accepts-band-look", () => {
    const validate = api("validateDiagram");
    const json = (value: Json): Json => JSON.parse(JSON.stringify(value)) as Json;
    const base = bandJson();
    const bare = json(base) as { blocks: { box: { time?: string }[] } };
    for (const box of bare.blocks.box) delete box.time;
    for (const [where, source] of [
      ["長さを書いた帯の見た目", base],
      ["長さを書かない帯の見た目", bare as unknown as Json],
    ] as const) {
      for (const lang of LANGS) {
        const checked = validate(source, { lang });
        expect(
          checked.ok,
          `${where}の原本が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`,
        ).toBe(true);
      }
    }
    // 帯の見た目の turn は、その欄を指して断る
    const turned = json(base) as { cycle: { turn?: string } };
    turned.cycle.turn = "left";
    expect(
      pointers(validate(turned as unknown as Json)),
      "帯の見た目の turn の誤りの場所",
    ).toContain("/cycle/turn");
    // 一部の箱にだけ書いた長さは断る
    const partial = json(base) as { blocks: { box: { time?: string }[] } };
    delete (partial.blocks.box[1] as { time?: string }).time;
    expect(
      validate(partial as unknown as Json).ok,
      "一部の箱にだけ長さを書いた帯の見た目が検査を通る",
    ).toBe(false);
  });
});

describe("輪を開いた帯の見た目の記法 (#3639)", () => {
  it("band-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(
      print(parsed(BAND) as unknown as Json),
      "帯の見た目を読んで書き戻した記法が元と違う",
    ).toBe(BAND);
    expect(
      print(parsed(BARE) as unknown as Json),
      "長さを書かない帯の見た目を読んで書き戻した記法が元と違う",
    ).toBe(BARE);
    // 記法から作った原本は、原本の JSON と同じ
    expect(parsed(BAND), "帯の見た目の記法から作った原本").toEqual(bandJson());
    expect(parsed(BARE).cycle, "長さを書かない帯の見た目の原本の見た目").toEqual({ shape: "band" });
  });

  it("band-rejects-misused-words", () => {
    // 帯の見た目の turn は、図の種類の行で止める
    expectRefused(
      BAND.replace("[shape: band]", "[shape: band, turn: left]"),
      "帯の見た目の turn",
      1,
      ["turn"],
    );
    // 一部の箱にだけ書いた長さは、長さの無い箱の行を指し、名札と time を名指して止める
    const partial = BAND.replace("box work as 進める [time: 30min]", "box work as 進める");
    expectRefused(partial, "一部の箱にだけ書いた長さ", lineOf(partial, "box work"), [
      "work",
      "time",
    ]);
    // clock と band でない shape は、図の種類の行で、書ける見た目を名指して止める
    expectRefused(
      RING.replace("cycle 週の仕事", "cycle 週の仕事 [shape: dial]"),
      "clock と band でない shape",
      1,
      ["clock", "band"],
    );
    // 帯の見た目の長さも、0 か数でないか単位の無い値は書いた値を名指して止める
    const zero = BAND.replace("[time: 10min]", "[time: 0min]");
    expectRefused(zero, "長さ 0min の箱", lineOf(zero, "box plan"), ["0min"]);
  });
});

describe("輪を開いた帯の見た目の並べ方と動き (#3639)", () => {
  it("band-steps-go-left-to-right-at-equal-widths", () => {
    const source = parsed(BAND);
    const ids = (source.blocks.box ?? []).map((b) => b.id);
    const steps = stepsOf(source);
    const { layout, segments, motion } = renderBand(BAND);
    const first = segments.filter((s) => s.round === 0);
    // 手順を書いた順に左から右へ、等しい幅と等しい間で並べる
    expect(
      first.map((s) => s.id),
      "最初の回の山形の順",
    ).toEqual(ids);
    const w = first[0]?.w ?? 0;
    const pitch = (first[1]?.x ?? 0) - (first[0]?.x ?? 0);
    expect(pitch, "山形の間").toBeGreaterThan(0);
    first.forEach((s, i) => {
      expect(Math.abs(s.w - w), `${s.id} の山形の幅 (${s.w})`).toBeLessThan(0.01);
      expect(
        Math.abs(s.x - ((first[0]?.x ?? 0) + pitch * i)),
        `${s.id} の山形の左の端 (${s.x})`,
      ).toBeLessThan(0.01);
      expect(Math.abs(s.y - (first[0]?.y ?? 0)), `${s.id} の山形の高さの所`).toBeLessThan(0.01);
      expect(
        segmentOf(motion, s.id, 0),
        `${s.id} の山形の部品 ([data-segment][data-round]) が描いた図に無い`,
      ).not.toBeNull();
    });
    // 名前は山形の下に、山形の真ん中に揃えて置き、互いに重ならない
    const names = (layout.names ?? []).filter((n) => n.round === 0);
    expect(
      names.map((n) => n.id),
      "最初の回の山形の下の名前",
    ).toEqual(ids);
    for (const name of names) {
      const seg = first.find((s) => s.id === name.id) as Segment;
      expect(name.y, `${name.id} の名前が山形の下に無い`).toBeGreaterThanOrEqual(seg.y + seg.h);
      expect(
        Math.abs(centreOf(name)[0] - centreOf(seg)[0]),
        `${name.id} の名前が山形の真ん中に無い`,
      ).toBeLessThan(1);
    }
    for (let i = 1; i < names.length; i++)
      expect(
        gap(names[i - 1] as Rect, names[i] as Rect),
        `${names[i - 1]?.id} と ${names[i]?.id} の名前が重なる`,
      ).toBeGreaterThan(0);
    // 段の番号は、その段の手順の、その回の山形の上に置く
    for (const badge of layout.badges) {
      const at = steps[badge.step] as { id: string; round: number };
      const seg = segments.find((s) => s.id === at.id && s.round === at.round);
      expect(seg, `段 ${badge.step + 1} の ${at.id} の回 ${at.round} の山形が無い`).toBeDefined();
      if (!seg) continue;
      expect(badge.y + BADGE_R, `段 ${badge.step + 1} の番号が山形の上に無い`).toBeLessThanOrEqual(
        seg.y + 0.01,
      );
      expect(
        Math.abs(badge.x - centreOf(seg)[0]),
        `段 ${badge.step + 1} の番号が山形の真ん中の上に無い`,
      ).toBeLessThan(1);
    }
    // 見た目を書かない図は山形を持たず、今どおり輪の上に箱を置く
    const ring = render(parsed(RING));
    expect(ring.layout.shape, "見た目を書かない図の見た目").toBeUndefined();
    expect(ring.layout.segments, "見た目を書かない図の山形").toBeUndefined();
  });

  it("band-ticks-mark-step-starts", () => {
    const cases: [string[], string][] = [
      [["10min", "30min", "10min", "10min"], "min"],
      [["30s", "1min", "30s"], "min"],
      [["2h", "30min"], "h"],
      [["1d", "12h"], "d"],
      [["250ms", "750ms"], "ms"],
      [["45s", "15s"], "s"],
    ];
    for (const [times, unit] of cases) {
      for (const lang of LANGS) {
        const where = `長さ ${times.join(" ")} の帯 (${lang})`;
        const { layout, segments, rendered } = renderBand(timesText(times), lang);
        // 単位は、境目の時刻を整数か小数 1 桁で書ける一番大きい単位にする
        expect(layout.unit, `${where}の目盛りの単位`).toBe(unit);
        const ticks = (layout.ticks ?? []).filter((t) => t.round === 0);
        const first = segments.filter((s) => s.round === 0);
        // 手順の境目ごとに、最初の 0 から最後の手順の終わりまで、始まる時刻の目盛りを置く
        expect(ticks.length, `${where}の目盛りの数`).toBe(times.length + 1);
        let at = 0;
        ticks.forEach((tick, k) => {
          expect(
            Math.abs(tick.value - at / (SECONDS[unit] as number)),
            `${where}の ${k + 1} つ目の目盛りの値 (${tick.value})`,
          ).toBeLessThan(1e-6);
          const seg = first[Math.min(k, first.length - 1)] as Segment;
          const edge = k < first.length ? seg.x : seg.x + seg.w;
          expect(
            Math.abs(tick.x - edge),
            `${where}の ${k + 1} つ目の目盛りが手順の境目に無い (${tick.x})`,
          ).toBeLessThan(1);
          const word = UNIT_WORD[lang][unit] as string;
          expect(tick.text, `${where}の目盛り`).toBe(`${String(tick.value)}${word}`);
          expect(
            rendered.svg.includes(`>${tick.text}</text>`),
            `${where}の目盛り ${tick.text} が描いた図に無い`,
          ).toBe(true);
          const m = /^([\d.]+)(ms|s|min|h|d)$/u.exec(times[k] ?? "0s") as RegExpExecArray;
          at += Number(m[1]) * (SECONDS[m[2] as string] as number);
        });
      }
    }
    // 長さを書かない帯の見た目は目盛りを出さない
    const bare = renderBand(BARE);
    expect(bare.layout.ticks ?? [], "長さを書かない帯の見た目の目盛り").toEqual([]);
  });

  it("band-stacks-a-band-per-round", () => {
    const source = parsed(BAND);
    const steps = stepsOf(source);
    const rounds = (steps[steps.length - 1]?.round ?? 0) + 1;
    const { bands, segments, motion, rendered } = renderBand(BAND);
    const ids = (source.blocks.box ?? []).map((b) => b.id);
    // 回ごとに帯を 1 本ずつ上から下へ積み、どの回の帯も同じ手順の山形を同じ横の所に持つ
    expect(
      bands.map((b) => b.round),
      "回ごとの帯",
    ).toEqual(Array.from({ length: rounds }, (_, k) => k));
    for (let r = 1; r < bands.length; r++)
      expect(bands[r]?.y, `回 ${r} の帯が前の回の帯の下に無い`).toBeGreaterThan(
        (bands[r - 1]?.y ?? 0) + (bands[r - 1]?.h ?? 0),
      );
    for (let r = 0; r < rounds; r++) {
      const row = segments.filter((s) => s.round === r);
      expect(
        row.map((s) => s.id),
        `回 ${r} の帯の山形`,
      ).toEqual(ids);
      row.forEach((s, i) =>
        expect(
          Math.abs(s.x - (segments[i] as Segment).x),
          `回 ${r} の ${s.id} の山形の横の所`,
        ).toBeLessThan(0.01),
      );
    }
    // まだ来ていない回の帯は、その回に入るまで薄く出し、入った後は濃く出す
    steps.forEach((at, s) => {
      const t = (rendered.timeline.steps[s] as Span).end - 0.05;
      for (let r = 0; r < rounds; r++) {
        const el = motion.doc.querySelector(`[data-band="${r}"]`);
        expect(el, `回 ${r} の帯の部品 ([data-band]) が描いた図に無い`).not.toBeNull();
        if (!el) continue;
        const o = motion.opacity(el, t);
        if (r <= at.round)
          expect(o, `段 ${s + 1} の終わりに回 ${r} の帯が濃くない`).toBeGreaterThan(0.9);
        else
          expect(
            o > 0.05 && o < 0.9,
            `段 ${s + 1} の終わりに来ていない回 ${r} の帯が薄く出ていない (${o})`,
          ).toBe(true);
      }
    });
  });

  it("band-heads-show-strip-values", () => {
    const source = parsed(BAND);
    const strip = source.blocks.strip;
    expect(strip, "BAND に中身の帯 (strip) が無い").toBeDefined();
    if (!strip) return;
    const steps = stepsOf(source);
    const { layout, bands, motion, rendered } = renderBand(BAND);
    // 帯の頭に出すので、図の下の帯には置かない
    expect(layout.strip, "帯の見た目の中身の帯が図の下に置かれる").toBeUndefined();
    // 回ごとの、その回の終わりまでに書いた欄の値
    const now = new Map<string, string>();
    const last: Map<string, string>[] = [];
    source.steps.forEach((step, s) => {
      for (const e of step.events)
        if (e.type === "strip" && e.field && e.value !== undefined) now.set(e.field, e.value);
      last[steps[s]?.round ?? 0] = new Map(now);
      const t = (rendered.timeline.steps[s] as Span).end - 0.05;
      for (const band of bands) {
        const head = motion.doc.querySelector(`[data-band-head="${band.round}"]`);
        expect(
          head,
          `回 ${band.round} の帯の頭の部品 ([data-band-head]) が描いた図に無い`,
        ).not.toBeNull();
        if (!head) continue;
        expect(
          [...head.querySelectorAll("text")].some((x) => x.textContent === strip.title),
          `回 ${band.round} の帯の頭に帯の題 ${strip.title} が無い`,
        ).toBe(true);
        const ownY = Number(head.querySelector("text")?.getAttribute("y"));
        expect(ownY < band.y, `回 ${band.round} の帯の頭が帯の上に無い`).toBe(true);
        // 今の回と前の回の頭はその回の値を出し、来ていない回の頭は値を出さない
        const round = steps[s]?.round ?? 0;
        const want =
          band.round <= round ? (band.round === round ? now : last[band.round]) : undefined;
        for (const field of strip.fields) {
          const shown = [...head.querySelectorAll(`[data-field="${field}"]`)]
            .filter((g) => motion.opacity(g, t) > 0.9)
            .map((g) => g.textContent);
          const value = want?.get(field);
          expect(
            shown,
            `段 ${s + 1} の終わりに回 ${band.round} の帯の頭に出ている欄 ${field} の値`,
          ).toEqual(value === undefined ? [] : [value]);
        }
      }
    });
  });

  it("band-tag-runs-to-the-next-step", () => {
    const source = parsed(BAND);
    const ids = (source.blocks.box ?? []).map((b) => b.id);
    const steps = stepsOf(source);
    const { layout, bands, segments, motion, rendered } = renderBand(BAND);
    const { timeline } = rendered;
    const inBand = edgesOf(source).filter(
      (e) => !(e.from === ids[ids.length - 1] && e.to === ids[0]),
    );
    expect(
      inBand.filter((e) => e.carry?.kind === "tag").length,
      "帯の中を走る札の付いた線が無い",
    ).toBeGreaterThan(0);
    for (const e of inBand) {
      const what = `段 ${e.step + 1} の ${e.from} -> ${e.to}`;
      const round = steps[e.step]?.round ?? 0;
      const from = segments.find((s) => s.id === e.from && s.round === round) as Segment;
      const to = segments.find((s) => s.id === e.to && s.round === round) as Segment;
      const band = bands.find((b) => b.round === round) as Rect;
      // 札の道は帯の真ん中の高さで、送る手順の山形の真ん中から受ける手順の山形の真ん中へ進む
      const points = (layout.edges.find((l) => l.step === e.step && l.event === e.event)?.points ??
        []) as Point[];
      expect(points.length, `${what} の札の道が無い`).toBeGreaterThan(1);
      const mid = band.y + band.h / 2;
      for (const p of points)
        expect(Math.abs(p[1] - mid), `${what} の札の道が帯の真ん中の高さに無い`).toBeLessThan(1);
      expect(
        Math.abs((points[0] as Point)[0] - centreOf(from)[0]),
        `${what} の札の道が送る手順の山形の真ん中から始まらない`,
      ).toBeLessThan(1);
      expect(
        Math.abs((points[points.length - 1] as Point)[0] - centreOf(to)[0]),
        `${what} の札の道が受ける手順の山形の真ん中で終わらない`,
      ).toBeLessThan(1);
      if (e.carry?.kind !== "tag") continue;
      // 札は走る間いつも札の道の上に居る
      const carrier = timeline.carriers.find((c) => c.step === e.step && c.event === e.event);
      expect(carrier, `${what} の札が走らない`).toBeDefined();
      if (!carrier) continue;
      const chip = chipOf(motion, e.carry.text, (carrier.depart + carrier.arrive) / 2);
      expect(chip, `${what} の札の字が描いた図に無い`).toBeDefined();
      if (!chip) continue;
      for (const k of [0.25, 0.5, 0.75]) {
        const at = motion.value(
          chip,
          "transform",
          carrier.depart + (carrier.arrive - carrier.depart) * k,
        );
        expect(at, `${what} の札が動く動きを持たない`).toBeDefined();
        if (at)
          expect(
            toLine([at[0] as number, at[1] as number], points),
            `${what} の札が走る途中 (${k}) で札の道に居ない`,
          ).toBeLessThan(2);
      }
    }
    // 受ける手順の山形は、その回の帯で光ったまま残り、ほかの回の帯では光らない
    steps.forEach((at, s) => {
      const t = (timeline.steps[s] as Span).end - 0.05;
      const lit = new Set(steps.filter((x, k) => k <= s).map((x) => `${x.id}@${x.round}`));
      for (const seg of segments) {
        const el = segmentOf(motion, seg.id, seg.round)?.querySelector(".dg-bd-lit");
        expect(
          el,
          `回 ${seg.round} の ${seg.id} の山形の光る部品 (.dg-bd-lit) が無い`,
        ).toBeDefined();
        if (!el) continue;
        const o = motion.opacity(el, t);
        const want = lit.has(`${seg.id}@${seg.round}`) && seg.round <= at.round;
        if (want)
          expect(
            o,
            `段 ${s + 1} の終わりに回 ${seg.round} の ${seg.id} の山形が光っていない`,
          ).toBeGreaterThan(0.9);
        else
          expect(
            o,
            `段 ${s + 1} の終わりに回 ${seg.round} の ${seg.id} の山形が光っている`,
          ).toBeLessThan(0.1);
      }
    });
  });

  it("band-return-arrow-leads-to-next-round", () => {
    const source = parsed(BAND);
    const ids = (source.blocks.box ?? []).map((b) => b.id);
    const steps = stepsOf(source);
    const { layout, bands, segments, motion, rendered } = renderBand(BAND);
    const wraps = edgesOf(source).filter((e) => e.from === ids[ids.length - 1] && e.to === ids[0]);
    expect(wraps.length, "最後の手順から最初の手順への線が無い").toBeGreaterThan(0);
    for (const e of wraps) {
      const what = `段 ${e.step + 1} の ${e.from} -> ${e.to}`;
      const next = steps[e.step]?.round ?? 0;
      const top = bands.find((b) => b.round === next - 1) as Rect;
      const bottom = bands.find((b) => b.round === next) as Rect;
      // 戻る矢印は、上の回の帯の右の端の外を回って下の回の帯の左の端へ入り、字を持たない
      const arrow = (layout.returns ?? []).find((r) => r.round === next - 1);
      expect(
        arrow,
        `回 ${next - 1} から回 ${next} へ戻る矢印 (layout.returns) が無い`,
      ).toBeDefined();
      const drawn = motion.doc.querySelector(`[data-band-return="${next - 1}"]`);
      expect(
        drawn,
        `回 ${next - 1} から戻る矢印の部品 ([data-band-return]) が描いた図に無い`,
      ).not.toBeNull();
      expect(drawn?.textContent ?? "", "戻る矢印が字を持つ").toBe("");
      if (!arrow) continue;
      const xs = arrow.points.map((p) => p[0]);
      expect(Math.max(...xs), `${what} の戻る矢印が上の帯の右の端の外を回らない`).toBeGreaterThan(
        top.x + top.w,
      );
      const end = arrow.points[arrow.points.length - 1] as Point;
      expect(
        Math.abs(end[1] - (bottom.y + bottom.h / 2)),
        `${what} の戻る矢印が下の帯の真ん中の高さで終わらない`,
      ).toBeLessThan(1);
      expect(end[0] <= bottom.x + 1, `${what} の戻る矢印が下の帯の左の端へ入らない`).toBe(true);
      // 札は戻る矢印を辿り、下の回の最初の山形の真ん中で着く
      const points = (layout.edges.find((l) => l.step === e.step && l.event === e.event)?.points ??
        []) as Point[];
      const first = segments.find((s) => s.id === ids[0] && s.round === next) as Segment;
      const last = points[points.length - 1] as Point;
      expect(
        Math.abs(last[0] - centreOf(first)[0]) < 1 && Math.abs(last[1] - centreOf(first)[1]) < 1,
        `${what} の札が下の回の最初の山形の真ん中で着かない`,
      ).toBe(true);
      for (const p of arrow.points)
        expect(toLine(p, points), `${what} の札の道が戻る矢印を辿らない`).toBeLessThan(1);
      const carrier = rendered.timeline.carriers.find(
        (c) => c.step === e.step && c.event === e.event,
      );
      const chip =
        carrier && chipOf(motion, e.carry?.text ?? "", (carrier.depart + carrier.arrive) / 2);
      expect(carrier && chip, `${what} の札が走らない`).toBeTruthy();
      if (!carrier || !chip) continue;
      const at = motion.value(chip, "transform", (carrier.depart + carrier.arrive) / 2);
      if (at)
        expect(
          toLine([at[0] as number, at[1] as number], points),
          `${what} の札が走る途中で戻る道に居ない`,
        ).toBeLessThan(2);
    }
  });

  it("band-stacks-list-below-at-phone-width", () => {
    const source = parsed(BAND);
    const ids = (source.blocks.box ?? []).map((b) => b.id);
    // 既定の幅では名前を山形の下に置き、一覧を出さない
    const wide = renderBand(BAND);
    expect(wide.layout.list, "既定の幅の図に手順の一覧が在る").toBeUndefined();
    for (const lang of LANGS) {
      const { layout, bands, segments, rendered } = renderBand(BAND, lang, 390);
      const list = layout.list;
      expect(list, `幅 390 の図 (${lang}) に手順の一覧が無い`).toBeDefined();
      if (!list) continue;
      expect(layout.width, `幅 390 の図 (${lang}) の幅`).toBeLessThanOrEqual(390.5);
      // 山形を幅に収まるまで縮め、山形の中に手順の番号を書く
      const doc = new DOMParser().parseFromString(rendered.svg, "image/svg+xml");
      for (const seg of segments) {
        expect(
          seg.x >= 0 && seg.x + seg.w <= 390,
          `幅 390 の図 (${lang}) の回 ${seg.round} の ${seg.id} の山形が幅に収まらない`,
        ).toBe(true);
        const number = String(ids.indexOf(seg.id) + 1);
        const texts = [
          ...(doc
            .querySelector(`[data-segment="${seg.id}"][data-round="${seg.round}"]`)
            ?.querySelectorAll("text") ?? []),
        ].map((t) => t.textContent);
        expect(
          texts,
          `幅 390 の図 (${lang}) の回 ${seg.round} の ${seg.id} の山形に番号 ${number} が無い`,
        ).toContain(number);
      }
      expect(layout.names ?? [], `幅 390 の図 (${lang}) の山形の下に名前が残る`).toEqual([]);
      // 一覧は帯の下に、手順を書いた順に番号と名前と長さを並べる
      const bottom = Math.max(...bands.map((b) => b.y + b.h));
      expect(list.y >= bottom, `幅 390 の図 (${lang}) の一覧が帯の下に無い`).toBe(true);
      expect(
        list.x >= 0 && list.x + list.w <= 390,
        `幅 390 の図 (${lang}) の一覧が幅に収まらない`,
      ).toBe(true);
      expect(
        list.rows.map((row) => [row.id, row.number, row.name, row.time]),
        `幅 390 の図 (${lang}) の一覧の行`,
      ).toEqual(
        (source.blocks.box ?? []).map((b, i) => [b.id, String(i + 1), b.name, b.time ?? ""]),
      );
      const drawn = doc.querySelector("[data-band-list]");
      expect(
        drawn,
        `幅 390 の図 (${lang}) の一覧の部品 ([data-band-list]) が描いた図に無い`,
      ).not.toBeNull();
      const texts = [...(drawn?.querySelectorAll("text") ?? [])].map((t) => t.textContent);
      for (const row of list.rows)
        expect(texts, `幅 390 の図 (${lang}) の一覧に ${row.name} が無い`).toContain(row.name);
      // 番号の丸と山形の番号は重ならない
      for (const badge of layout.badges)
        for (const seg of segments)
          expect(
            gap(badgeRect(badge), seg),
            `幅 390 の図 (${lang}) の段 ${badge.step + 1} の番号が山形に掛かる`,
          ).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("輪を開いた帯の見た目の見本と雛形 (#3639)", () => {
  it("band-examples-in-both-langs-have-no-breaks", () => {
    const sources: Partial<Record<Lang, Source>> = {};
    for (const lang of LANGS) {
      const file = `${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`;
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      if (text === undefined) continue;
      // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
      expect(text.split("\n")[0] ?? "", `${file} の最初の行`).toMatch(/^\/\/ /u);
      expect(
        /#\d+/u.test(text.split("\n")[0] ?? ""),
        `${file} の最初の注釈の行に作業の番号がある`,
      ).toBe(false);
      const source = parsed(text, lang, file);
      sources[lang] = source;
      expect(source.kind, `${file} の図の種類`).toBe("cycle");
      expect(source.cycle?.shape, `${file} の見た目`).toBe("band");
      // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
      const problems = checkText(file, text, "notation", lang, {
        layout: (step, said) => `段 ${step}: ${said}`,
      }).map(problemLine);
      expect(problems, `${file} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, 390]) renderBand(text, lang, width);
    }
    if (sources.ja && sources.en) {
      const shape = (d: Source): Json => ({
        boxes: (d.blocks.box ?? []).map((b) => [b.id, b.time ?? null]),
        steps: d.steps.map((s) => s.events.length),
      });
      expect(
        shape(sources.en),
        `${SAMPLE} の英語版の手順と長さと段ごとの行の数が日本語版と違う`,
      ).toEqual(shape(sources.ja));
    }
    // 見本帳の見本の一覧に載り、回り続ける図の頁に並ぶ
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(
      true,
    );
    expect(samplesOf("cycle"), `見本帳の cycle の頁に ${SAMPLE} が無い`).toContain(SAMPLE);
    for (const lang of LANGS) {
      expect(
        exampleText(SAMPLE, lang),
        `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`,
      ).toBe((fileText(`${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
    }
  });

  it("band-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、輪を開いた帯の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(
        kinds.some((line) => /^cycle <[^>]+> \[shape: band\]$/u.test(line)),
        `棚の記法の早見 (${lang}) に cycle の帯の見た目の頭の行が無い: ${kinds.join(" / ")}`,
      ).toBe(true);
      // 図の種類の見本の束に帯の見た目の見本が在り、雛形を誤り無く読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "cycle");
      expect(group, `棚の見本の束 (${lang}) に cycle の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      expect(keys, `棚の cycle の束 (${lang}) に ${SAMPLE} が無い`).toContain(SAMPLE);
      if (!keys.includes(SAMPLE)) continue;
      const source = parsed(exampleText(SAMPLE, lang) ?? "", lang, `棚の雛形 ${SAMPLE} (${lang})`);
      expect(source.cycle?.shape, `棚の雛形 ${SAMPLE} (${lang}) の見た目`).toBe("band");
    }
  });
});

describe("輪を開いた帯の見た目の軽い入口 (#3639)", () => {
  it("band-light-entry-draws-after-load-for", () => {
    const code = [
      `const text = ${JSON.stringify(BAND)};`,
      "await light.loadFor(text);",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.shape = drawn.layout.shape;",
      "  out.segments = (drawn.svg.match(/data-segment=/g) ?? []).length;",
      "  const full = await import('@cardenelabs/dragon');",
      "  const again = full.parseNotation(text);",
      "  out.same = again.ok && full.renderDiagram(again.diagram).svg === drawn.svg;",
      "}",
      "console.log(JSON.stringify(out));",
    ].join("\n");
    const script = `const light = await import("@cardenelabs/dragon/light");\nconst out = {};\n${code}`;
    let stdout = "";
    let failure = "";
    try {
      stdout = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
        cwd: PACKAGE,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      failure = String((error as { stderr?: string }).stderr ?? error);
    }
    expect(failure, "軽い入口で輪を開いた帯の見た目を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as {
      ok?: boolean;
      errors?: unknown[];
      shape?: string;
      segments?: number;
      same?: boolean;
    };
    expect(
      out.ok,
      `軽い入口で loadFor を待った後に輪を開いた帯の見た目を読めない: ${JSON.stringify(out.errors)}`,
    ).toBe(true);
    expect(out.shape, "軽い入口で描いた図の見た目").toBe("band");
    // 2 回の帯に 4 つずつの山形
    expect(out.segments, "軽い入口で描いた山形の部品の数").toBe(Object.keys(MINUTES).length * 2);
    expect(out.same, "軽い入口と既定の入口で描いた輪を開いた帯の見た目が違う").toBe(true);
  });
});

describe("輪を開いた帯の見た目の書き方の文書 (#3639)", () => {
  it("band-docs-describe-the-look", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const head = /cycle (<[^>]+>|[^\s`]+) \[shape: band\]/u;
    const bandFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).cycle?.shape === "band";
      }).length;
    for (const path of [
      "packages/dragon/README.md",
      "packages/dragon/README.ja.md",
      "packages/dragon/examples/quick-start.md",
      "packages/dragon/examples/quick-start.en.md",
    ]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に cycle <題> [shape: band] の書き方が無い`).toBe(true);
      expect(
        bandFences(text),
        `${path} に輪を開いた帯の見た目として読める dragon の囲みが無い`,
      ).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = ["cycle.dragon", "cycle.en.dragon"].map((file) =>
      repoText(`apps/playground-spa/src/docs/examples/${file}`),
    );
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) =>
      repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`),
    );
    expect(
      head.test([content, ...sections, ...paragraphs].join("\n")),
      "使い方の頁に cycle <題> [shape: band] の書き方が無い",
    ).toBe(true);
  });
});
