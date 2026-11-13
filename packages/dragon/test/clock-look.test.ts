// @vitest-environment jsdom
/**
 * 回り続ける図の、時計の文字盤の見た目 (#3638)。
 *
 * 図の種類の行に `cycle <題> [shape: clock]` を書くと、手順を 12 時から右回りに、書いた順で手順の長さの弧に置く。`[shape: clock, turn: left]` は左回りに置く。
 * 手順の長さは箱の行に `box <名札> as <名前> [time: <長さ>]` で単位付き (`ms`、`s`、`min`、`h`、`d`) で書き、1 周は長さの合計にする。
 * 文字盤の目盛りの数字は 1、2、5 に 10 の累乗を掛けた間隔で 3 個から 6 個置き、単位は箱に書いた中で一番大きい単位にする。
 * 段の中の線 `<名札> -> <名札>` は 1 本の針を前の段の向きから受ける手順の始まりの向きまで回し、線の `[tag: <字>]` の札は針の先に乗って回る。
 * 光らせる弧は、その回 (針が 12 時を越えるまで) に入った手順の弧にする。
 * 番号が弧に入らない短い手順は、番号と名前を文字盤の外へ短い線で引き出す。携帯の幅では文字盤を幅いっぱいに描き、手順の番号と名前と長さを下の一覧に並べる。
 * 見た目の元は #3623 の step 2 で本人が選ばなかった動く試作の案B (`.context/extend/new-kinds/kinds/cycle.js` の `drawB`)。
 *
 * 置き場所 (`layout`) は描く部品が返す値で確かめ、針の向きと弧の光り方と札の場所は SVG の keyframes を jsdom で読んで確かめる。
 * 弧は `layout.sectors` (向きは 12 時を 0 にした度で、右回りに増え、左回りの図は減る)、目盛りは `layout.ticks` と `layout.unit`、
 * 針は `layout.hand` (`r` は針の先の半径、`angles` は段ごとの向きで、回った分だけ足していく)、文字盤の外の名前は `layout.names`、
 * 引き出す線は `layout.leads`、携帯の幅の一覧は `layout.list` に返る。
 * 弧の部品は `data-sector="<名札>"` で、光らせる部品は class `dg-ck-lit` を持つ。針の部品は `data-clock-hand` を持ち、`transform` の `rotate` で回る。
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
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/svg"), import("../src/check")]);

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

/**
 * 見本帳の見本と棚の雛形は、見本帳の部品から読む。描画の部品の型の検査 (`tsconfig.test.json`) は見本帳の vite の読み込み (`?raw`) の型を持たないので、
 * path を字にして読み込みの時に引き、型の検査に見本帳の file を入れない
 */
const playgroundFile = (path: string): Promise<object> => import(/* @vite-ignore */ join(ROOT, "apps/playground-spa/src", path));
const { EXAMPLE_KEYS, exampleText, LATER_EXAMPLES, sampleGroups, syntaxLines, samplesOf } = Object.assign(
  {},
  ...(await Promise.all(["examples.ts", "editor/shelf-first.ts", "editor/shelf-items.ts", "catalog/catalog.ts"].map(playgroundFile))),
) as Playground;

/** 時計の文字盤の見た目の見本 (#3638 の受入条件) */
const SAMPLE = "focus-clock";

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 段の番号の丸の半径 (`look/values.ts` の `LOOK.badge.r`) */
const BADGE_R = 9.5;

type Point = [number, number];

/** 手順の弧。`from` と `to` は 12 時を 0 にした度で、右回りの図は `to` が大きく、左回りの図は小さい */
interface Sector {
  id: string;
  from: number;
  to: number;
}

/** 文字盤の目盛りの数字。`value` は `unit` で数えた値、`angle` は 12 時を 0 にした度 */
interface Tick {
  value: number;
  text: string;
  angle: number;
}

/** 文字盤の外へ引き出す線。`from` は弧の側の端、`to` は外の端 */
interface Lead {
  id: string;
  from: Point;
  to: Point;
}

interface ListRow {
  id: string;
  number: string;
  name: string;
  time: string;
}

interface ClockLayout extends Omit<Layout, "boxes"> {
  kind: string;
  shape?: string;
  turn?: string;
  /** 文字盤の真ん中と、弧の帯の外の半径 `r` と内の半径 `inner` */
  ring?: { cx: number; cy: number; r: number; inner?: number };
  sectors?: Sector[];
  ticks?: Tick[];
  unit?: string;
  hand?: { r: number; angles: number[] };
  names?: (Rect & { id: string })[];
  leads?: Lead[];
  list?: Rect & { rows: ListRow[] };
  boxes: (Rect & { id: string })[];
}

interface ClockRendered extends Omit<Rendered, "layout"> {
  layout: ClockLayout;
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
  steps: { title: string; events: { type: string; from?: string; to?: string; carry?: { kind: string; text?: string }; field?: string; value?: string }[] }[];
}

/** 集中と休みを 1 時間で回す、書き戻した形の小さな記法。札の無い線を 1 本持つ */
const CLOCK = [
  "cycle 集中の時間割 [shape: clock]",
  "",
  "box focus as 集中する [time: 25min]",
  "box short as 短く休む [time: 5min]",
  "box review as 振り返る [time: 10min]",
  "box long as 長く休む [time: 20min]",
  "",
  "strip 進み: 回, 経過",
  "",
  "step 始める",
  "  say 集中から始める。",
  "  set 回: 1回目",
  "  set 経過: 0分",
  "",
  "step 短く休む",
  "  say 集中を終えて短く休む。",
  "  focus -> short [tag: 25分]",
  "  set 経過: 25分",
  "",
  "step 振り返る",
  "  say 休みを終えて振り返る。",
  "  short -> review",
  "  set 経過: 30分",
  "",
  "step 長く休む",
  "  say 振り返りを終えて長く休む。",
  "  review -> long [tag: メモ]",
  "  set 経過: 40分",
  "",
  "step 次の回へ",
  "  say 休みを終えて次の回の集中へ戻る。",
  "  long -> focus [tag: 次の回]",
  "  set 回: 2回目",
  "  set 経過: 0分",
  "",
].join("\n");

/** 手順ごとの長さ (分) */
const MINUTES: Record<string, number> = { focus: 25, short: 5, review: 10, long: 20 };

/** 左回りに置く CLOCK */
const LEFT = CLOCK.replace("[shape: clock]", "[shape: clock, turn: left]");

/** CLOCK から見た目と長さを外した、輪の見た目の記法 */
const RING = CLOCK.replace(" [shape: clock]", "").replace(/ \[time: [^\]]+\]/gu, "");

/** 1 周 60 分のうち 1 分の手順を 2 つ並べた記法。番号が弧に入らない短い手順を持つ */
const SHORT = [
  "cycle 作業の時間割 [shape: clock]",
  "",
  "box work as 作業する [time: 50min]",
  "box save as 保存する [time: 1min]",
  "box check as 確かめる [time: 1min]",
  "box rest as 休む [time: 8min]",
  "",
  "step 始める",
  "  say 作業から始める。",
  "",
  "step 保存する",
  "  say 作業を終えて保存する。",
  "  work -> save [tag: 保存]",
  "",
  "step 確かめる",
  "  say 保存した物を確かめる。",
  "  save -> check",
  "",
  "step 休む",
  "  say 確かめ終えて休む。",
  "  check -> rest [tag: 確認]",
  "",
  "step 次の回へ",
  "  say 休みを終えて次の作業へ戻る。",
  "  rest -> work",
  "",
].join("\n");

/** SHORT のうち番号が弧に入らない手順 */
const SHORT_STEPS = ["save", "check"];

const tag = (from: string, to: string, text: string): Json => ({ type: "edge", from, to, carry: { kind: "tag", text } });
/** 札を書かない線。運ぶ物は既定の封筒になる */
const plain = (from: string, to: string): Json => ({ type: "edge", from, to, carry: { kind: "envelope" } });
const set = (field: string, value: string): Json => ({ type: "strip", field, value });

/** CLOCK と同じ図の原本 (版2) */
function clockJson(): Json {
  return {
    version: 2,
    kind: "cycle",
    title: "集中の時間割",
    cycle: { shape: "clock" },
    blocks: {
      box: [
        { id: "focus", name: "集中する", time: "25min" },
        { id: "short", name: "短く休む", time: "5min" },
        { id: "review", name: "振り返る", time: "10min" },
        { id: "long", name: "長く休む", time: "20min" },
      ],
      strip: { title: "進み", fields: ["回", "経過"] },
    },
    steps: [
      { title: "始める", body: "集中から始める。", events: [set("回", "1回目"), set("経過", "0分")] },
      { title: "短く休む", body: "集中を終えて短く休む。", events: [tag("focus", "short", "25分"), set("経過", "25分")] },
      { title: "振り返る", body: "休みを終えて振り返る。", events: [plain("short", "review"), set("経過", "30分")] },
      { title: "長く休む", body: "振り返りを終えて長く休む。", events: [tag("review", "long", "メモ"), set("経過", "40分")] },
      { title: "次の回へ", body: "休みを終えて次の回の集中へ戻る。", events: [tag("long", "focus", "次の回"), set("回", "2回目"), set("経過", "0分")] },
    ],
  };
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang = "ja", where = "記法"): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Source | Json, lang: Lang = "ja", width?: number): ClockRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "回り続ける図を描けない").toBe("");
  return rendered as unknown as ClockRendered;
}

interface Clock {
  rendered: ClockRendered;
  layout: ClockLayout;
  motion: Motion;
  ring: { cx: number; cy: number; r: number; inner: number };
  sectors: Sector[];
  hand: { r: number; angles: number[] };
}

/** 時計の文字盤の見た目の描いた図。並べ方の欄が無ければ名指して落とす */
function renderClock(text: string, lang: Lang = "ja", width?: number): Clock {
  const rendered = render(parsed(text, lang), lang, width);
  const { layout } = rendered;
  expect(layout.kind, "描いた図が回り続ける図 (cycle) でない").toBe("cycle");
  expect(layout.shape, "描いた図が時計の文字盤の見た目 (layout.shape) でない").toBe("clock");
  expect(layout.ring?.inner, "並べた図に文字盤の弧の帯の内の半径 (layout.ring.inner) が無い").toBeDefined();
  expect(layout.sectors, "並べた図に手順の弧 (layout.sectors) が無い").toBeDefined();
  expect(layout.ticks, "並べた図に目盛りの数字 (layout.ticks) が無い").toBeDefined();
  expect(layout.hand, "並べた図に針 (layout.hand) が無い").toBeDefined();
  const ring = layout.ring ?? { cx: 0, cy: 0, r: 0 };
  return {
    rendered,
    layout,
    motion: motionFrom(rendered as unknown as Rendered),
    ring: { cx: ring.cx, cy: ring.cy, r: ring.r, inner: ring.inner ?? 0 },
    sectors: layout.sectors ?? [],
    hand: layout.hand ?? { r: 0, angles: [] },
  };
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 度を 0 から 360 の間に直す */
const norm = (a: number): number => ((a % 360) + 360) % 360;

/** 2 つの向きの差 (度、0 から 180) */
const apart = (a: number, b: number): number => {
  const d = Math.abs(norm(a) - norm(b));
  return Math.min(d, 360 - d);
};

/** 文字盤の真ん中から見た点の向き。12 時を 0 にした度で、右回りに増える (0 から 360) */
const angleOf = (ring: { cx: number; cy: number }, [x, y]: Point): number => norm((Math.atan2(x - ring.cx, ring.cy - y) * 180) / Math.PI);

/** 文字盤の真ん中から点までの距離 */
const away = (ring: { cx: number; cy: number }, [x, y]: Point): number => Math.hypot(x - ring.cx, y - ring.cy);

/** 文字盤の真ん中から四角の一番近い所までの距離 */
function nearest(ring: { cx: number; cy: number }, rect: Rect): number {
  const dx = Math.max(rect.x - ring.cx, 0, ring.cx - (rect.x + rect.w));
  const dy = Math.max(rect.y - ring.cy, 0, ring.cy - (rect.y + rect.h));
  return Math.hypot(dx, dy);
}

/** 段の番号の丸の四角 */
const badgeRect = (b: { x: number; y: number }): Rect => ({ x: b.x - BADGE_R, y: b.y - BADGE_R, w: BADGE_R * 2, h: BADGE_R * 2 });

/** 段ごとの、その段の手順。札が着いた手順、線の無い段は前の段の手順、最初の段は最初の手順 */
function currentOf(source: Source): string[] {
  let now = source.blocks.box?.[0]?.id ?? "";
  return source.steps.map((step) => {
    for (const e of step.events) if (e.type === "edge" && e.to) now = e.to;
    return now;
  });
}

const edgesOf = (source: Source) =>
  source.steps.flatMap((step, s) => step.events.flatMap((e, i) => (e.type === "edge" ? [{ ...e, step: s, event: i }] : [])));

/** 弧の部品 */
const sectorOf = (motion: Motion, id: string): Element | null => motion.doc.querySelector(`[data-sector="${id}"]`);

/** 針の部品の、時刻 `t` 秒の向き (度) */
function handAt(motion: Motion, t: number): number | undefined {
  const hand = motion.doc.querySelector("[data-clock-hand]");
  return hand ? motion.value(hand, "transform", t)?.[0] : undefined;
}

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
    if (lang === "en") expect(KANA.test(message), `${name} の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
    else expect(KANA.test(message), `${name} の日本語の誤りの文が日本語でない: ${message}`).toBe(true);
    for (const word of words) expect(message, `${name} の誤りの文 (${lang}) が ${word} を名指さない`).toContain(word);
  }
}

/** 記法の行の番号 (1 から数える) */
const lineOf = (text: string, head: string): number => text.split("\n").findIndex((l) => l.startsWith(head)) + 1;

/** 長さを書いた手順を並べ、段を 1 つだけ持つ記法 */
const timesText = (times: string[]): string =>
  ["cycle 長さの輪 [shape: clock]", "", ...times.map((t, i) => `box s${i + 1} as 手順${i + 1} [time: ${t}]`), "", "step 始める", "  say 始める。", ""].join("\n");

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});

describe("時計の文字盤の見た目の原本の JSON (#3638)", () => {
  it("schema-accepts-clock-look", () => {
    const validate = api("validateDiagram");
    const json = (value: Json): Json => JSON.parse(JSON.stringify(value)) as Json;
    const base = clockJson();
    const left = json(base) as { cycle: { turn?: string } };
    left.cycle.turn = "left";
    for (const [where, source] of [
      ["時計の文字盤の見た目", base],
      ["左回りの文字盤の見た目", left as unknown as Json],
    ] as const) {
      for (const lang of LANGS) {
        const checked = validate(source, { lang });
        expect(checked.ok, `${where}の原本が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
      }
    }
    // 見た目を書かない図の turn は、その欄を指して断る
    const bareTurn = json(base) as { cycle: { shape?: string; turn?: string }; blocks: { box: { time?: string }[] } };
    delete bareTurn.cycle.shape;
    bareTurn.cycle.turn = "left";
    for (const box of bareTurn.blocks.box) delete box.time;
    expect(pointers(validate(bareTurn as unknown as Json)), "見た目を書かない図の turn の誤りの場所").toContain("/cycle/turn");
    // 見た目は clock だけ、回る向きは left だけ、長さは 0 でない数と単位の組だけを受け、ほかはその欄を指して断る
    const wrongShape = json(base) as { cycle: { shape: string } };
    wrongShape.cycle.shape = "dial";
    expect(pointers(validate(wrongShape as unknown as Json)), "clock でない見た目の誤りの場所").toContain("/cycle/shape");
    const wrongTurn = json(base) as { cycle: { turn: string } };
    wrongTurn.cycle.turn = "right";
    expect(pointers(validate(wrongTurn as unknown as Json)), "left でない回る向きの誤りの場所").toContain("/cycle/turn");
    for (const time of ["25", "0min", "long"]) {
      const wrongTime = json(base) as { blocks: { box: { time: string }[] } };
      (wrongTime.blocks.box[0] as { time: string }).time = time;
      expect(pointers(validate(wrongTime as unknown as Json)), `長さ ${time} の誤りの場所`).toContain("/blocks/box/0/time");
    }
  });
});

describe("時計の文字盤の見た目の記法 (#3638)", () => {
  it("clock-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(print(parsed(CLOCK) as unknown as Json), "時計の文字盤の見た目を読んで書き戻した記法が元と違う").toBe(CLOCK);
    expect(print(parsed(LEFT) as unknown as Json), "左回りの文字盤の見た目を読んで書き戻した記法が元と違う").toBe(LEFT);
    // 記法から作った原本は、原本の JSON と同じ
    expect(parsed(CLOCK), "時計の文字盤の見た目の記法から作った原本").toEqual(clockJson());
    expect(parsed(LEFT).cycle, "turn: left を書いた図の原本の見た目と向き").toEqual({ shape: "clock", turn: "left" });
    // 見た目を書かない図の原本は見た目の欄を持たない
    expect(parsed(RING).cycle, "見た目を書かない図の原本の見た目").toBeUndefined();
    expect(print(parsed(RING) as unknown as Json), "輪の見た目を読んで書き戻した記法が元と違う").toBe(RING);
  });

  it("clock-rejects-misused-words", () => {
    // 輪の見た目の箱の time は、その箱の行を指して止める
    const ringTime = CLOCK.replace(" [shape: clock]", "");
    expectRefused(ringTime, "見た目を書かない図の time", lineOf(ringTime, "box focus"), ["time"]);
    // 見た目を書かない図の turn は、図の種類の行で止める
    expectRefused(RING.replace("cycle 集中の時間割", "cycle 集中の時間割 [turn: left]"), "見た目を書かない図の turn", 1, ["turn"]);
    // 文字盤の見た目で time の無い箱は、その箱の行を指し、名札と time を名指して止める
    const noTime = CLOCK.replace("box short as 短く休む [time: 5min]", "box short as 短く休む");
    expectRefused(noTime, "文字盤の見た目で time の無い箱", lineOf(noTime, "box short"), ["short", "time"]);
    // clock でない shape と left でない turn は、図の種類の行で止める
    expectRefused(RING.replace("cycle 集中の時間割", "cycle 集中の時間割 [shape: dial]"), "clock でない shape", 1, ["clock"]);
    expectRefused(CLOCK.replace("[shape: clock]", "[shape: clock, turn: right]"), "left でない turn", 1, ["turn", "left"]);
    // 0 か、数でないか、単位の無い長さは、その箱の行を指し、書いた値を名指して止める
    for (const time of ["0min", "0.0s", "25", "long", "-5min", "5w"]) {
      const text = CLOCK.replace("[time: 25min]", `[time: ${time}]`);
      expectRefused(text, `長さ ${time} の箱`, lineOf(text, "box focus"), [time]);
    }
    // 小数の長さは読める
    expect(firstError(CLOCK.replace("[time: 25min]", "[time: 2.5min]"), "ja"), "小数の長さの箱が読めない").toBeUndefined();
    // time と turn は回り続ける図の外では書けない
    const sequence = ["sequence 送る", "", "box a as 送る側 [time: 5s]", "box b as 受ける側", "", "step 送る", "  say 送る。", "  a -> b: 送る", ""].join("\n");
    expectRefused(sequence, "時系列図の箱の time", 3, ["time"]);
    expectRefused(sequence.replace(" [time: 5s]", "").replace("sequence 送る", "sequence 送る [turn: left]"), "時系列図の turn", 1, ["turn"]);
  });
});

describe("時計の文字盤の見た目の並べ方と動き (#3638)", () => {
  it("clock-arcs-follow-times", () => {
    const total = Object.values(MINUTES).reduce((a, b) => a + b, 0);
    for (const [text, turn] of [
      [CLOCK, 1],
      [LEFT, -1],
    ] as const) {
      const where = turn > 0 ? "右回りの図" : "左回りの図";
      const { layout, sectors, motion } = renderClock(text);
      expect(layout.turn, `${where}の回る向き`).toBe(turn > 0 ? "right" : "left");
      // 手順を書いた順に、12 時から回る向きへ、長さを 1 周の長さで割った角度の弧で置く
      expect(sectors.map((s) => s.id), `${where}の弧の順`).toEqual(Object.keys(MINUTES));
      let at = 0;
      for (const sector of sectors) {
        const sweep = ((MINUTES[sector.id] as number) / total) * 360 * turn;
        expect(Math.abs(sector.from - at), `${where}の ${sector.id} の弧が前の弧の終わりから始まらない (${sector.from})`).toBeLessThan(0.01);
        expect(Math.abs(sector.to - sector.from - sweep), `${where}の ${sector.id} の弧の角度 (${sector.to - sector.from})`).toBeLessThan(0.01);
        at = sector.to;
        expect(sectorOf(motion, sector.id), `${where}の ${sector.id} の弧の部品 ([data-sector]) が描いた図に無い`).not.toBeNull();
      }
      expect(Math.abs(at - 360 * turn), `${where}の弧が 1 周しない`).toBeLessThan(0.01);
    }
    // 見た目を書かない図は弧を持たず、今どおり輪の上に箱を置く
    const ring = render(parsed(RING));
    expect(ring.layout.shape, "見た目を書かない図の見た目").toBeUndefined();
    expect(ring.layout.sectors, "見た目を書かない図の弧").toBeUndefined();
  });

  it("clock-dial-numbers-at-nice-steps", () => {
    const cases: [string[], string][] = [
      [["4s", "4s", "4s"], "s"],
      [["25min", "5min", "10min", "20min"], "min"],
      [["1min", "30s", "45s"], "min"],
      [["2h", "45min", "15min"], "h"],
      [["1d", "12h"], "d"],
      [["250ms", "750ms"], "ms"],
    ];
    for (const [times, unit] of cases) {
      for (const lang of LANGS) {
        const where = `長さ ${times.join(" ")} の文字盤 (${lang})`;
        const { layout, rendered } = renderClock(timesText(times), lang);
        // 単位は箱に書いた中で一番大きい単位にする
        expect(layout.unit, `${where}の目盛りの単位`).toBe(unit);
        const total =
          times.reduce((sum, t) => {
            const m = /^([\d.]+)(ms|s|min|h|d)$/u.exec(t) as RegExpExecArray;
            return sum + Number(m[1]) * (SECONDS[m[2] as string] as number);
          }, 0) / (SECONDS[unit] as number);
        const ticks = layout.ticks ?? [];
        // 3 個から 6 個の数字を、0 から 1、2、5 に 10 の累乗を掛けた間隔で、1 周の長さより手前まで置く
        expect(ticks.length >= 3 && ticks.length <= 6, `${where}の目盛りの数字の数 (${ticks.length})`).toBe(true);
        const step = (ticks[1]?.value ?? 0) - (ticks[0]?.value ?? 0);
        const lead = step / 10 ** Math.floor(Math.log10(step) + 1e-9);
        expect([1, 2, 5].some((n) => Math.abs(lead - n) < 1e-6), `${where}の目盛りの間隔 ${step} が 1、2、5 に 10 の累乗を掛けた数でない`).toBe(true);
        ticks.forEach((tick, k) => {
          expect(Math.abs(tick.value - step * k), `${where}の ${k + 1} つ目の数字の値 (${tick.value})`).toBeLessThan(1e-6);
          expect(tick.value < total - 1e-9, `${where}の数字 ${tick.value} が 1 周の長さ ${total} に届く`).toBe(true);
          expect(Math.abs(tick.angle - (tick.value / total) * 360), `${where}の数字 ${tick.text} の向き (${tick.angle})`).toBeLessThan(0.01);
          const word = UNIT_WORD[lang][unit] as string;
          expect(tick.text.endsWith(word), `${where}の数字 ${tick.text} に単位の字 ${word} が無い`).toBe(true);
          expect(Math.abs(Number(tick.text.slice(0, -word.length)) - tick.value), `${where}の数字の字 ${tick.text} が値 ${tick.value} と違う`).toBeLessThan(1e-6);
          expect(rendered.svg.includes(`>${tick.text}</text>`), `${where}の数字 ${tick.text} が描いた図に無い`).toBe(true);
        });
      }
    }
    // 左回りの図の数字は 12 時から左回りに置く
    const left = renderClock(LEFT).layout.ticks ?? [];
    expect(left.length, "左回りの図の目盛りの数字").toBeGreaterThanOrEqual(3);
    for (const tick of left) expect(Math.abs(tick.angle + (tick.value / 60) * 360), `左回りの図の数字 ${tick.text} の向き (${tick.angle})`).toBeLessThan(0.01);
  });

  it("clock-hand-turns-to-each-step", () => {
    for (const [text, turn] of [
      [CLOCK, 1],
      [LEFT, -1],
    ] as const) {
      const where = turn > 0 ? "右回りの図" : "左回りの図";
      const source = parsed(text);
      const current = currentOf(source);
      const { sectors, hand, motion, rendered } = renderClock(text);
      const { timeline } = rendered;
      expect(hand.angles.length, `${where}の針の段ごとの向きの数`).toBe(source.steps.length);
      expect(motion.doc.querySelectorAll("[data-clock-hand]").length, `${where}の針の部品 ([data-clock-hand]) の数`).toBe(1);
      hand.angles.forEach((angle, s) => {
        const start = sectors.find((x) => x.id === current[s])?.from ?? Number.NaN;
        // 針はその段の手順の始まりを指す
        expect(apart(angle, start), `${where}の段 ${s + 1} の針 (${angle}) が ${current[s]} の始まり (${start}) を指さない`).toBeLessThan(0.5);
        // 針は前の段の向きから回る向きにだけ回り、線のある段は止まらずに回る
        if (s > 0) {
          const moved = (angle - (hand.angles[s - 1] as number)) * turn;
          const line = source.steps[s]?.events.some((e) => e.type === "edge") ?? false;
          expect(moved >= 0 && moved < 360, `${where}の段 ${s + 1} の針が回る向きと逆に回る (${moved})`).toBe(true);
          if (line) expect(moved, `${where}の段 ${s + 1} の針が回らない`).toBeGreaterThan(0);
        }
        // 描いた針は段の終わりにその向きを指す
        const span = timeline.steps[s] as Span;
        const drawn = handAt(motion, span.end - 0.05);
        expect(drawn, `${where}の針の部品が回る動き (transform の rotate) を持たない`).toBeDefined();
        expect(Math.abs((drawn ?? Number.NaN) - angle), `${where}の段 ${s + 1} の終わりの描いた針の向き (${drawn})`).toBeLessThan(0.5);
        // その回に入った手順の弧を光らせ、ほかの弧は光らせない
        const round = Math.floor(Math.abs(angle) / 360 + 1e-9);
        const lit = new Set(current.filter((_, k) => k <= s && Math.floor(Math.abs(hand.angles[k] as number) / 360 + 1e-9) === round));
        for (const sector of sectors) {
          const el = sectorOf(motion, sector.id)?.querySelector(".dg-ck-lit");
          expect(el, `${where}の ${sector.id} の弧の光る部品 (.dg-ck-lit) が無い`).toBeDefined();
          if (!el) continue;
          const o = motion.opacity(el, span.end - 0.05);
          if (lit.has(sector.id)) expect(o, `${where}の段 ${s + 1} の終わりに ${sector.id} の弧が光っていない`).toBeGreaterThan(0.9);
          else expect(o, `${where}の段 ${s + 1} の終わりに ${sector.id} の弧が光っている`).toBeLessThan(0.1);
        }
      });
    }
  });

  it("clock-tag-rides-the-hand", () => {
    for (const [text, turn] of [
      [CLOCK, 1],
      [LEFT, -1],
    ] as const) {
      const where = turn > 0 ? "右回りの図" : "左回りの図";
      const source = parsed(text);
      const { layout, ring, hand, motion, rendered } = renderClock(text);
      const { timeline } = rendered;
      const tagged = edgesOf(source).filter((e) => e.carry?.kind === "tag");
      expect(tagged.length, `${where}に札の付いた線が無い`).toBeGreaterThan(0);
      for (const e of tagged) {
        const what = `${where}の段 ${e.step + 1} の ${e.from} -> ${e.to} [tag: ${e.carry?.text}]`;
        const before = hand.angles[e.step - 1] ?? 0;
        const after = hand.angles[e.step] ?? 0;
        // 札の道は針の先の半径の弧で、前の段の針の向きから今の段の針の向きへ回る向きに進む
        const points = (layout.edges.find((l) => l.step === e.step && l.event === e.event)?.points ?? []) as Point[];
        expect(points.length, `${what} の札の道が弧になっていない`).toBeGreaterThan(2);
        for (const p of points) expect(Math.abs(away(ring, p) - hand.r), `${what} の札の道が針の先の半径に無い`).toBeLessThan(1.5);
        expect(apart(angleOf(ring, points[0] as Point), before), `${what} の札の道が前の段の針の向きから始まらない`).toBeLessThan(1);
        expect(apart(angleOf(ring, points[points.length - 1] as Point), after), `${what} の札の道が今の段の針の向きで終わらない`).toBeLessThan(1);
        let swept = 0;
        for (let k = 1; k < points.length; k++) {
          const d = ((angleOf(ring, points[k] as Point) - angleOf(ring, points[k - 1] as Point) + 540) % 360) - 180;
          expect(d * turn, `${what} の札の道が回る向きと逆に進む`).toBeGreaterThan(-0.01);
          swept += d;
        }
        expect(Math.abs(swept - (after - before)), `${what} の札の道が針の回った分だけ進まない (${swept})`).toBeLessThan(1);
        // 札はその段の間に走り、走っている間はいつも針の先に居る
        const carrier = timeline.carriers.find((c) => c.step === e.step && c.event === e.event);
        expect(carrier, `${what} の札が走らない`).toBeDefined();
        if (!carrier) continue;
        const span = timeline.steps[e.step] as Span;
        expect(carrier.depart >= span.start - 1e-9 && carrier.arrive <= span.end + 1e-9 && carrier.arrive > carrier.depart, `${what} の札がその段の間に走らない`).toBe(true);
        // 真ん中の値の欄が札と同じ字を書くことがあるので、走る札の字 (`.dg-car-t`) だけから探す
        const chip = [...motion.doc.querySelectorAll("text.dg-car-t")].find((t) => t.textContent === e.carry?.text)?.parentElement;
        expect(chip, `${what} の札の字が描いた図に無い`).toBeDefined();
        if (!chip) continue;
        for (const k of [0.25, 0.5, 0.75]) {
          const t = carrier.depart + (carrier.arrive - carrier.depart) * k;
          const at = motion.value(chip, "transform", t);
          const turned = handAt(motion, t);
          expect(at && turned !== undefined, `${what} の札か針が動く動きを持たない`).toBe(true);
          if (!at || turned === undefined) continue;
          expect(apart(angleOf(ring, [at[0] as number, at[1] as number]), turned), `${what} の札が走る途中 (${k}) で針の先に居ない`).toBeLessThan(3);
          expect(Math.abs(away(ring, [at[0] as number, at[1] as number]) - hand.r), `${what} の札が走る途中 (${k}) で針の先の半径に居ない`).toBeLessThan(2);
        }
      }
    }
  });

  it("clock-short-step-leads-labels-out", () => {
    const source = parsed(SHORT);
    const current = currentOf(source);
    const { layout, ring } = renderClock(SHORT);
    const names = layout.names ?? [];
    const leads = layout.leads ?? [];
    expect(names.map((n) => n.id), "文字盤の外の名前の順").toEqual((source.blocks.box ?? []).map((b) => b.id));
    // 番号が弧に入らない手順だけを、短い線で文字盤の外へ引き出す
    expect(leads.map((l) => l.id).sort(), "文字盤の外へ引き出す手順").toEqual([...SHORT_STEPS].sort());
    for (const lead of leads) {
      expect(away(ring, lead.from), `${lead.id} の引き出す線が弧から出ない`).toBeLessThanOrEqual(ring.r + 1);
      expect(away(ring, lead.to), `${lead.id} の引き出す線の外の端が文字盤の外に無い`).toBeGreaterThan(ring.r + 2);
    }
    // 名前はどれも文字盤の外に置く
    for (const name of names) expect(nearest(ring, name), `${name.id} の名前が文字盤に掛かる`).toBeGreaterThan(ring.r);
    // 短い手順の番号は文字盤の外に、長い手順の番号は弧の上に置く
    for (const badge of layout.badges) {
      const id = current[badge.step] as string;
      const d = away(ring, [badge.x, badge.y]);
      if (SHORT_STEPS.includes(id)) expect(d, `段 ${badge.step + 1} の ${id} の番号が文字盤の外に無い`).toBeGreaterThan(ring.r + BADGE_R - 1);
      else expect(d >= ring.inner && d <= ring.r, `段 ${badge.step + 1} の ${id} の番号が弧の上に無い (${d})`).toBe(true);
    }
    // 名前と番号はどれも互いに重ならない。同じ手順の番号は同じ所で入れ替わって出るので、同じ所の番号どうしは数えない
    const parts: [string, Rect][] = [...names.map((n): [string, Rect] => [`${n.id} の名前`, n]), ...layout.badges.map((b): [string, Rect] => [`段 ${b.step + 1} の番号`, badgeRect(b)])];
    for (let i = 0; i < parts.length; i++)
      for (let j = i + 1; j < parts.length; j++) {
        const [a, ra] = parts[i] as [string, Rect];
        const [b, rb] = parts[j] as [string, Rect];
        if (i >= names.length && ra.x === rb.x && ra.y === rb.y) continue;
        expect(gap(ra, rb), `${a}と${b}が重なる`).toBeGreaterThan(0);
      }
    // 引き出した図も崩れの知らせを出さない
    for (const lang of LANGS) {
      const problems = checkText("short.dragon", SHORT, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
      expect(problems, `短い手順を持つ図の崩れの知らせ (${lang})`).toEqual([]);
    }
  });

  it("clock-centre-shows-strip-values", () => {
    const source = parsed(CLOCK);
    const strip = source.blocks.strip;
    expect(strip, "CLOCK に中身の帯 (strip) が無い").toBeDefined();
    if (!strip) return;
    const { layout, ring, motion, rendered } = renderClock(CLOCK);
    // 真ん中に出すので、図の下の帯には置かない
    expect(layout.strip, "文字盤の見た目の中身の帯が図の下に置かれる").toBeUndefined();
    const inside = (el: Element): boolean => away(ring, [Number(el.getAttribute("x")), Number(el.getAttribute("y"))]) < ring.inner;
    const title = [...motion.doc.querySelectorAll("text")].find((t) => t.textContent === strip.title);
    expect(title, `帯の題 ${strip.title} が描いた図に無い`).toBeDefined();
    if (title) expect(inside(title), "帯の題が文字盤の真ん中に無い").toBe(true);
    // 段ごとに、その段までに書いた欄の値だけが文字盤の真ん中に出る
    const now = new Map<string, string>();
    source.steps.forEach((step, s) => {
      for (const e of step.events) if (e.type === "strip" && e.field && e.value !== undefined) now.set(e.field, e.value);
      const t = (rendered.timeline.steps[s] as Span).end - 0.05;
      for (const field of strip.fields) {
        const groups = [...motion.doc.querySelectorAll(`[data-field="${field}"]`)];
        expect(groups.length, `欄 ${field} の値の部品 ([data-field]) が描いた図に無い`).toBeGreaterThan(0);
        const want = now.get(field);
        const shown = groups.filter((g) => motion.opacity(g, t) > 0.9).map((g) => g.textContent);
        expect(shown, `段 ${s + 1} の終わりに真ん中に出ている欄 ${field} の値`).toEqual(want === undefined ? [] : [want]);
        for (const g of groups) {
          const text = g.querySelector("text");
          expect(Boolean(text && inside(text)), `欄 ${field} の値 ${g.textContent} が文字盤の真ん中に無い`).toBe(true);
        }
      }
    });
  });

  it("clock-stacks-list-below-at-phone-width", () => {
    const source = parsed(CLOCK);
    // 既定の幅では名前を文字盤の外に置き、一覧を出さない
    const wide = renderClock(CLOCK);
    expect(wide.layout.list, "既定の幅の図に手順の一覧が在る").toBeUndefined();
    expect(wide.layout.names?.length, "既定の幅の図の文字盤の外の名前の数").toBe(source.blocks.box?.length);
    for (const lang of LANGS) {
      const { layout, ring, rendered } = renderClock(CLOCK, lang, 390);
      const list = layout.list;
      expect(list, `幅 390 の図 (${lang}) に手順の一覧が無い`).toBeDefined();
      if (!list) continue;
      expect(layout.width, `幅 390 の図 (${lang}) の幅`).toBeLessThanOrEqual(390.5);
      // 文字盤を幅いっぱいに描き、一覧を文字盤の下に積む
      expect(ring.r * 2, `幅 390 の図 (${lang}) の文字盤が幅いっぱいでない`).toBeGreaterThanOrEqual(260);
      expect(list.y >= ring.cy + ring.r, `幅 390 の図 (${lang}) の一覧が文字盤の下に無い`).toBe(true);
      expect(list.x >= 0 && list.x + list.w <= 390, `幅 390 の図 (${lang}) の一覧が幅に収まらない`).toBe(true);
      expect(layout.names ?? [], `幅 390 の図 (${lang}) の文字盤の外に名前が残る`).toEqual([]);
      // 一覧の行は手順を書いた順に、番号と名前と長さを持つ
      expect(
        list.rows.map((row) => [row.id, row.number, row.name, row.time]),
        `幅 390 の図 (${lang}) の一覧の行`,
      ).toEqual((source.blocks.box ?? []).map((b, i) => [b.id, String(i + 1), b.name, b.time]));
      const doc = new DOMParser().parseFromString(rendered.svg, "image/svg+xml");
      const drawn = doc.querySelector("[data-clock-list]");
      expect(drawn, `幅 390 の図 (${lang}) の一覧の部品 ([data-clock-list]) が描いた図に無い`).not.toBeNull();
      const texts = [...(drawn?.querySelectorAll("text") ?? [])].map((t) => t.textContent);
      for (const row of list.rows) {
        for (const word of [row.name, row.time]) expect(texts, `幅 390 の図 (${lang}) の一覧に ${word} が無い`).toContain(word);
      }
    }
  });
});

describe("時計の文字盤の見た目の見本と雛形 (#3638)", () => {
  it("clock-examples-in-both-langs-have-no-breaks", () => {
    const sources: Partial<Record<Lang, Source>> = {};
    for (const lang of LANGS) {
      const file = `${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`;
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      if (text === undefined) continue;
      // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
      expect(text.split("\n")[0] ?? "", `${file} の最初の行`).toMatch(/^\/\/ /u);
      expect(/#\d+/u.test(text.split("\n")[0] ?? ""), `${file} の最初の注釈の行に作業の番号がある`).toBe(false);
      const source = parsed(text, lang, file);
      sources[lang] = source;
      expect(source.kind, `${file} の図の種類`).toBe("cycle");
      expect(source.cycle?.shape, `${file} の見た目`).toBe("clock");
      // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
      const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
      expect(problems, `${file} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, 390]) renderClock(text, lang, width);
    }
    if (sources.ja && sources.en) {
      const shape = (d: Source): Json => ({ boxes: (d.blocks.box ?? []).map((b) => [b.id, b.time ?? null]), steps: d.steps.map((s) => s.events.length) });
      expect(shape(sources.en), `${SAMPLE} の英語版の手順と長さと段ごとの行の数が日本語版と違う`).toEqual(shape(sources.ja));
    }
    // 見本帳の見本の一覧に載り、回り続ける図の頁に並ぶ
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
    expect(samplesOf("cycle"), `見本帳の cycle の頁に ${SAMPLE} が無い`).toContain(SAMPLE);
    for (const lang of LANGS) {
      expect(exampleText(SAMPLE, lang), `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
    }
  });

  it("clock-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、時計の文字盤の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(kinds.some((line) => /^cycle <[^>]+> \[shape: clock\]$/u.test(line)), `棚の記法の早見 (${lang}) に cycle の文字盤の見た目の頭の行が無い: ${kinds.join(" / ")}`).toBe(true);
      // 図の種類の見本の束に文字盤の見た目の見本が在り、雛形を誤り無く読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "cycle");
      expect(group, `棚の見本の束 (${lang}) に cycle の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      expect(keys, `棚の cycle の束 (${lang}) に ${SAMPLE} が無い`).toContain(SAMPLE);
      if (!keys.includes(SAMPLE)) continue;
      const source = parsed(exampleText(SAMPLE, lang) ?? "", lang, `棚の雛形 ${SAMPLE} (${lang})`);
      expect(source.cycle?.shape, `棚の雛形 ${SAMPLE} (${lang}) の見た目`).toBe("clock");
    }
  });
});

describe("時計の文字盤の見た目の軽い入口 (#3638)", () => {
  it("clock-light-entry-draws-after-load-for", () => {
    const code = [
      `const text = ${JSON.stringify(CLOCK)};`,
      "await light.loadFor(text);",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.shape = drawn.layout.shape;",
      "  out.sectors = (drawn.svg.match(/data-sector=/g) ?? []).length;",
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
      stdout = execFileSync(process.execPath, ["--input-type=module", "-e", script], { cwd: PACKAGE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      failure = String((error as { stderr?: string }).stderr ?? error);
    }
    expect(failure, "軽い入口で時計の文字盤の見た目を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as { ok?: boolean; errors?: unknown[]; shape?: string; sectors?: number; same?: boolean };
    expect(out.ok, `軽い入口で loadFor を待った後に時計の文字盤の見た目を読めない: ${JSON.stringify(out.errors)}`).toBe(true);
    expect(out.shape, "軽い入口で描いた図の見た目").toBe("clock");
    expect(out.sectors, "軽い入口で描いた手順の弧の部品の数").toBe(Object.keys(MINUTES).length);
    expect(out.same, "軽い入口と既定の入口で描いた時計の文字盤の見た目が違う").toBe(true);
  });
});

describe("時計の文字盤の見た目の書き方の文書 (#3638)", () => {
  it("clock-docs-describe-the-look", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const head = /cycle (<[^>]+>|[^\s`]+) \[shape: clock(, turn: left)?\]/u;
    const time = /\[time: (<[^>]+>|[\d.]+(ms|s|min|h|d))\]/u;
    const turn = /turn: left/u;
    const clockFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).cycle?.shape === "clock";
      }).length;
    for (const path of ["packages/dragon/README.md", "packages/dragon/README.ja.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に cycle <題> [shape: clock] の書き方が無い`).toBe(true);
      expect(time.test(text), `${path} に手順の長さ ([time: <長さ>]) の書き方が無い`).toBe(true);
      expect(turn.test(text), `${path} に左回りにする turn: left の書き方が無い`).toBe(true);
      expect(clockFences(text), `${path} に時計の文字盤の見た目として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = ["cycle.dragon", "cycle.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    for (const [what, pattern] of [
      ["cycle <題> [shape: clock]", head],
      ["手順の長さ [time: <長さ>]", time],
      ["turn: left", turn],
    ] as const) {
      expect(pattern.test(page), `使い方の頁に ${what} の書き方が無い`).toBe(true);
    }
  });
});
