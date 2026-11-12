// @vitest-environment jsdom
/**
 * 点で数える見た目 (#3635)。
 *
 * 量の図 (`chart`) と集合の重なりの図 (`venn`) の見た目に `[shape: dots]` を足す。新しい図の種類は足さず、今の `item` と `set` の行をそのまま使う。
 * 件数を 1 点の件数 (`unit`) で割って四捨五入した数の点で描き、件数は字で正確に出す。1 点の件数は頭の行の `[unit: <数>]` で書け、書かなければ
 * 1 と 2 と 5 に 10 の累乗 (0 乗から) を掛けた数のうち、全体が最も大きい段で点の数が 100 に最も近くなる値を選ぶ。書いた値で点が 200 個を超える図は断る。
 * 全体の箱に空の点を描き、集まりか項目に初めて件数を書いた段で、その件数の点が箱から群れへ寄る。`set none` の点は箱に灰色で残る。
 * 集合の重なりの図で 2 つ以上の集まりに入る点は、入る集まりの色で 1 点を扇形に等分に塗る。量の図は項目ごとに点を 1 行に並べて折り返す。
 * 量の図の `set none` はドーナツと横棒でも書け、項目の後ろに灰色の弧か棒で描く。漏斗では今どおり断る。
 * 見た目の元は step 2 で本人が選んだ動く試作 (`.context/propose/dots/`) の案。
 *
 * 点と字の見え方と置き場所は、描いた SVG の keyframes を jsdom で読んで、各段の止め絵の時刻で確かめる。
 * 部品は検査と読み上げの道具が引けるよう `data-dot-*` を持つ。
 *
 * | 目印 | 部品 |
 * |---|---|
 * | `data-dot` | 1 つの点。置き場所は `transform` の `translate` |
 * | `data-dot-body` | 点の中で大きさを変える部品。`transform` の `scale` で弾む |
 * | `data-dot-paint` | 点の塗り。値は量の図の項目の名札、集合の重なりの図の区画の名札 (宣言した順の名札を `&` で繋ぐ)、`none`、まだどこにも入らない時は空 |
 * | `data-dot-slice` | 扇形の 1 切れ。値は集まりの名札 |
 * | `data-dot-box` | 全体の箱の枠 (`x`、`y`、`width`、`height`) |
 * | `data-dot-hole` | 箱の空の点 |
 * | `data-dot-unit` | 1 点の件数の字 |
 * | `data-dot-count` | 項目か集まりの件数の字。値は名札 |
 * | `data-dot-name` | 項目か集まりの名前の字。値は名札 |
 *
 * 点で数える見た目と見本の file がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Rendered, type Span } from "./render-support";

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

/** 点で数える見た目の見本。一般の量の図 (1,000 人に聞いた端末) と、Web3 の集合の重なりの図 (ウォレットの住所 10,000 件) */
const SAMPLES = [
  { name: "device-dots", kind: "chart" },
  { name: "wallet-dots", kind: "venn" },
] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

interface SourceEvent {
  type: string;
  item?: string;
  sets?: string[];
  value?: number;
}

interface Source {
  kind: string;
  title: string;
  chart?: { shape: string; unit?: number; items: { id: string }[] };
  venn?: { shape?: string; unit?: number };
  blocks: { circle?: { id: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 1,000 人に聞いた端末。1 点は 10 人で、点は iPhone 41、Android 29、Windows 16、Mac 9、どれにも入らない 5 の 100 個 */
const CHART = [
  "chart 1,000人に聞いた端末 [shape: dots]",
  "",
  "item i as iPhone",
  "item a as Android",
  "item w as Windows",
  "item m as Mac",
  "",
  "step iPhone",
  "  say iPhoneを使う人。",
  "  set i: 412",
  "",
  "step Android",
  "  say Androidを使う人。",
  "  set a: 287",
  "",
  "step Windows",
  "  say Windowsを使う人。",
  "  set w: 158",
  "",
  "step Mac",
  "  say Macを使う人。",
  "  set m: 93",
  "",
  "step どれにも",
  "  say どれも使わない人。",
  "  set none: 50",
  "",
].join("\n");

/** CHART の項目ごとの件数と点の数 */
const CHART_COUNTS: Record<string, { value: number; dots: number }> = {
  i: { value: 412, dots: 41 },
  a: { value: 287, dots: 29 },
  w: { value: 158, dots: 16 },
  m: { value: 93, dots: 9 },
};

/**
 * 調べたウォレットの住所 10,000 件。1 点は 100 件。
 * 区画のそれぞれだけの件数は n 2,400、d 3,100、v 900、n&d 1,200、n&v 300、d&v 500、n&d&v 320、どれにも入らない 1,280
 */
const VENN = [
  "venn 調べた住所 [shape: dots]",
  "",
  "item n as NFT",
  "item d as DeFi",
  "item v as DAO",
  "",
  "step NFT",
  "  say NFTを持つ住所。",
  "  set n: 4220",
  "",
  "step DeFi",
  "  say DeFiを使う住所と、両方に入る住所。",
  "  set d: 5120",
  "  set n & d: 1520",
  "",
  "step DAO",
  "  say DAOで投票した住所と、重なる住所。",
  "  set v: 2020",
  "  set n & v: 620",
  "  set d & v: 820",
  "",
  "step 3つ全て",
  "  say 3つ全てに入る住所。",
  "  set n & d & v: 320",
  "",
  "step どれにも",
  "  say どれにも入らない住所。",
  "  set none: 1280",
  "",
].join("\n");

/** VENN の最後の段の、区画ごとの点の数 */
const VENN_DOTS: Record<string, number> = { n: 24, d: 31, v: 9, "n&d": 12, "n&v": 3, "d&v": 5, "n&d&v": 3, none: 13 };

/** 項目が 1 つの量の図。`unit` を渡すと頭の行に書く */
const oneItem = (values: number[], unit?: number | string): string =>
  [
    `chart One [shape: dots${unit === undefined ? "" : `, unit: ${unit}`}]`,
    "",
    "item x as X",
    "",
    ...values.flatMap((v, k) => [`step S${k + 1}`, `  say Step ${k + 1}.`, `  set x: ${v}`, ""]),
  ].join("\n");

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang = "ja", where = "記法"): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Source | Json, lang: Lang = "ja", width?: number): Rendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "点で数える見た目の図を描けない").toBe("");
  return rendered as Rendered;
}

/** 記法を読んで描き、時刻を指して読めるようにする */
const motionOfText = (text: string, lang: Lang = "ja", width?: number): Motion => motionFrom(render(parsed(text, lang), lang, width));

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 記法の行の、注釈と空の行を除いた並び */
const codeLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "" && !line.trimStart().startsWith("//"));

/** 数の字。3 桁ごとに `,` で区切る */
const shown = (value: number): string => value.toLocaleString("en-US");

/** 描いた点。無ければ落とす */
function dotsOf(motion: Motion, where: string): Element[] {
  const dots = [...motion.doc.querySelectorAll("[data-dot]")];
  expect(dots.length, `${where} に点 ([data-dot]) が無い`).toBeGreaterThan(0);
  return dots;
}

/** 点の、時刻 `t` の置き場所。動かない点は `transform` の属性から読む */
function placeAt(motion: Motion, dot: Element, t: number): [number, number] {
  const moving = motion.value(dot, "transform", t);
  const xy = moving ?? [...(dot.getAttribute("transform") ?? "").matchAll(/-?[\d.]+/g)].map((m) => Number(m[0]));
  return [xy[0] ?? Number.NaN, xy[1] ?? Number.NaN];
}

/** 点の、時刻 `t` に見えている塗りの名札。見えている塗りが無ければ `undefined` */
function paintAt(motion: Motion, dot: Element, t: number): string | undefined {
  const shown = [...dot.querySelectorAll("[data-dot-paint]")].filter((p) => motion.opacity(p, t) > 0.9);
  return shown.length === 1 ? (shown[0]?.getAttribute("data-dot-paint") ?? undefined) : undefined;
}

/** 点の、時刻 `t` の大きさの倍率。大きさを変えない点は 1 */
function scaleAt(motion: Motion, dot: Element, t: number): number {
  const body = dot.querySelector("[data-dot-body]");
  return body ? (motion.value(body, "transform", t)?.[0] ?? 1) : 1;
}

/** 時刻 `t` に塗りの名札が `key` の点 */
const dotsWith = (motion: Motion, dots: Element[], key: string, t: number): Element[] => dots.filter((d) => paintAt(motion, d, t) === key);

/** 全体の箱の枠 */
function boxOf(motion: Motion, where: string): { x: number; y: number; w: number; h: number } {
  const el = motion.doc.querySelector("[data-dot-box]");
  expect(el, `${where} に全体の箱 ([data-dot-box]) が無い`).not.toBeNull();
  const n = (k: string): number => Number(el?.getAttribute(k));
  return { x: n("x"), y: n("y"), w: n("width"), h: n("height") };
}

const inBox = (box: { x: number; y: number; w: number; h: number }, [x, y]: [number, number]): boolean => x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h;

/** 時刻 `t` に見えている、選んだ字の中身 */
const textsAt = (motion: Motion, selector: string, t: number): string[] =>
  [...motion.doc.querySelectorAll(selector)].filter((el) => motion.opacity(el, t) > 0.9).map((el) => el.textContent ?? "");

/** 段 `s` の止め絵の時刻 */
const still = (motion: Motion, s: number): number => motion.rendered.timeline.stills[s] ?? Number.NaN;

/** 原本の項目と段と段ごとの数の行の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.chart?.shape ?? d.venn?.shape,
  items: (d.chart?.items ?? d.blocks.circle ?? []).map((i) => i.id),
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

/** 誤りの最初の 1 件 */
function firstError(text: string, lang: Lang): LineError | undefined {
  const read = api("parseNotation")(text, { lang });
  return read.ok ? undefined : read.errors[0];
}

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});

describe("点で数える見た目の原本の JSON (#3635)", () => {
  it("schema-accepts-dots-look", () => {
    const validate = api("validateDiagram");
    // 量の図は根の chart の欄に、集合の重なりの図は根の venn の欄に、見た目と 1 点の件数を持つ
    const chart = parsed(CHART.replace("[shape: dots]", "[shape: dots, unit: 10]"));
    expect(chart.chart?.shape, "点で数える見た目の量の図の原本の見た目").toBe("dots");
    expect(chart.chart?.unit, "点で数える見た目の量の図の原本の 1 点の件数").toBe(10);
    const venn = parsed(VENN.replace("[shape: dots]", "[shape: dots, unit: 100]"));
    expect(venn.venn?.shape, "点で数える見た目の集合の重なりの図の原本の見た目").toBe("dots");
    expect(venn.venn?.unit, "点で数える見た目の集合の重なりの図の原本の 1 点の件数").toBe(100);
    for (const [where, source] of [
      ["量の図", chart],
      ["集合の重なりの図", venn],
      ["unit を書かない量の図", parsed(CHART)],
      ["unit を書かない集合の重なりの図", parsed(VENN)],
    ] as const) {
      const checked = validate(source as unknown as Json);
      expect(checked.ok, `点で数える見た目の${where}の原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    // 集合の重なりの図の dots のほかの見た目と、0 より大きくない 1 点の件数は、その欄を指して断る
    const json = (source: Source): Json => JSON.parse(JSON.stringify(source)) as Json;
    const wrongShape = json(venn) as { venn: { shape: string } };
    wrongShape.venn.shape = "donut";
    expect(pointers(validate(wrongShape as unknown as Json)), "集合の重なりの図の dots でない見た目の誤りの場所").toContain("/venn/shape");
    const zeroUnit = json(chart) as { chart: { unit: number } };
    zeroUnit.chart.unit = 0;
    expect(pointers(validate(zeroUnit as unknown as Json)), "0 の 1 点の件数の誤りの場所").toContain("/chart/unit");
  });
});

describe("点で数える見た目の記法 (#3635)", () => {
  it("dots-roundtrip-keeps-notation", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const none = (shape: string): string => CHART.replace("[shape: dots]", `[shape: ${shape}]`);
    const cases: [string, string][] = [
      ["点の量の図", CHART],
      ["unit を書いた点の量の図", CHART.replace("[shape: dots]", "[shape: dots, unit: 20]")],
      ["点の集合の重なりの図", VENN],
      ["unit を書いた点の集合の重なりの図", VENN.replace("[shape: dots]", "[shape: dots, unit: 50]")],
      ["set none を書いたドーナツ", none("donut")],
      ["set none を書いた横棒", none("bar")],
    ];
    for (const [where, text] of cases) {
      const first = parse(text);
      expect(first.ok, `${where} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      // 書き戻すと、書いた記法と同じ行に戻り、読み直すと同じ原本になる
      const printed = print(first.diagram);
      expect(codeLines(printed), `${where} を書き戻した記法が書いた記法と違う`).toEqual(codeLines(text));
      const second = parse(printed);
      expect(second.ok ? second.diagram : undefined, `${where} を往復した原本が最初と違う`).toEqual(first.diagram);
    }
  });

  it("dots-unit-picks-a-round-number", () => {
    // 全体の件数と、選ぶ 1 点の件数。1 と 2 と 5 に 10 の 0 乗からの累乗を掛けた数のうち、点の数が 100 に最も近くなる値
    const cases: [number, number][] = [
      [10000, 100],
      [3700, 50],
      [1000, 10],
      [150, 2],
      [130, 1],
      [7, 1],
    ];
    for (const [total, unit] of cases) {
      const motion = motionOfText(oneItem([total]), "en");
      const t = still(motion, 0);
      expect(dotsWith(motion, dotsOf(motion, `${total} の図`), "x", t).length, `全体が ${total} の図の点の数`).toBe(Math.round(total / unit));
      expect(textsAt(motion, "[data-dot-unit]", t).join(" "), `全体が ${total} の図の 1 点の件数の字`).toContain(shown(unit));
    }
    // 全体が最も大きい段 (2,000) で選び、件数の小さい段でも 1 点の件数を変えない
    const motion = motionOfText(oneItem([400, 2000]), "en");
    const dots = dotsOf(motion, "段で件数が増える図");
    expect(dotsWith(motion, dots, "x", still(motion, 0)).length, "段 1 (400) の点の数").toBe(20);
    expect(dotsWith(motion, dots, "x", still(motion, 1)).length, "段 2 (2,000) の点の数").toBe(100);
    for (const s of [0, 1]) expect(textsAt(motion, "[data-dot-unit]", still(motion, s)).join(" "), `段 ${s + 1} の 1 点の件数の字`).toContain("20");
  });

  it("dots-unit-follows-the-head-line", () => {
    for (const [unit, dots] of [
      [100, 20],
      [50, 40],
      [25, 80],
    ] as const) {
      const motion = motionOfText(oneItem([2000], unit), "en");
      const t = still(motion, 0);
      expect(dotsWith(motion, dotsOf(motion, `unit: ${unit} の図`), "x", t).length, `unit: ${unit} の図の点の数`).toBe(dots);
      expect(textsAt(motion, "[data-dot-unit]", t).join(" "), `unit: ${unit} の図の 1 点の件数の字`).toContain(String(unit));
    }
  });

  it("dots-rejects-too-many-dots", () => {
    // 点がちょうど 200 個の図は読み、どれかの段で 201 個になる図は頭の行を指して断る
    for (const lang of LANGS) {
      for (const text of [oneItem([200], 1), oneItem([100, 200], 1)]) {
        expect(firstError(text, lang), `点が 200 個の図が断られる (${lang})`).toBeUndefined();
      }
      for (const [where, text] of [
        ["1 つの段で 201 個", oneItem([201], 1)],
        ["2 つ目の段で 201 個", oneItem([100, 201], 1)],
        ["1 点 20 件で 500 個", oneItem([10000], 20)],
      ] as const) {
        const first = firstError(text, lang);
        expect(first?.line, `${where} の図の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe(1);
        const message = first?.message ?? "";
        expect(message, `${where} の図の誤りの文が上限の 200 を名指さない (${lang})`).toContain("200");
        expect(message, `${where} の図の誤りの文が unit を名指さない (${lang})`).toContain("unit");
        expect(KANA.test(message), `${where} の図の誤りの文の言葉 (${lang}): ${message}`).toBe(lang === "ja");
      }
    }
  });

  it("dots-rejects-misused-words", () => {
    const venn2 = (head: string): string => ["venn Two" + head, "", "item p as P", "item q as Q", "", "step One", "  say Both.", "  set p: 30", "  set q: 20", "  set p & q: 5", ""].join("\n");
    const chart = (head: string): string => ["chart Two" + head, "", "item p as P", "", "step One", "  say One.", "  set p: 30", ""].join("\n");
    const refused: [string, string][] = [
      ["dots のほかの見た目の集合の重なりの図", venn2(" [shape: donut]")],
      ["dots を書かない集合の重なりの図の unit", venn2(" [unit: 10]")],
      ["ドーナツの量の図の unit", chart(" [shape: donut, unit: 10]")],
      ["横棒の量の図の unit", chart(" [shape: bar, unit: 10]")],
      ["漏斗の量の図の unit", chart(" [shape: funnel, unit: 10]")],
      ["0 の unit", chart(" [shape: dots, unit: 0]")],
      ["負の unit", chart(" [shape: dots, unit: -5]")],
      ["数でない unit", chart(" [shape: dots, unit: ten]")],
    ];
    for (const [where, text] of refused) {
      for (const lang of LANGS) {
        const first = firstError(text, lang);
        expect(first?.line, `${where} の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe(1);
        expect(KANA.test(first?.message ?? ""), `${where} の誤りの文の言葉 (${lang}): ${first?.message}`).toBe(lang === "ja");
      }
    }
    // 0 より大きい小数の 1 点の件数と、dots の集合の重なりの図は読む
    for (const [where, text] of [
      ["小数の unit", chart(" [shape: dots, unit: 0.5]")],
      ["dots の集合の重なりの図", venn2(" [shape: dots]")],
    ] as const) {
      expect(firstError(text, "en"), `${where} が断られる`).toBeUndefined();
    }
  });
});

describe("点で数える見た目の描き方 (#3635)", () => {
  it("dots-round-counts-and-show-exact-text", () => {
    for (const lang of LANGS) {
      // 量の図は項目ごとに、件数を 10 で割って四捨五入した数の点を描き、件数を字で正確に出す
      const chart = motionOfText(CHART, lang);
      const dots = dotsOf(chart, `量の図 (${lang})`);
      const last = still(chart, 4);
      for (const [id, { value, dots: n }] of Object.entries(CHART_COUNTS)) {
        expect(dotsWith(chart, dots, id, last).length, `量の図 (${lang}) の ${id} の点の数`).toBe(n);
        expect(textsAt(chart, `[data-dot-count="${id}"]`, last).join(" "), `量の図 (${lang}) の ${id} の件数の字`).toContain(shown(value));
      }
      // 集合の重なりの図は区画ごとに、それぞれだけの件数を 100 で割って四捨五入した数の点を描き、集まりの件数を字で正確に出す
      const venn = motionOfText(VENN, lang);
      const vdots = dotsOf(venn, `集合の重なりの図 (${lang})`);
      const vlast = still(venn, 4);
      for (const [key, n] of Object.entries(VENN_DOTS)) expect(dotsWith(venn, vdots, key, vlast).length, `集合の重なりの図 (${lang}) の ${key} の点の数`).toBe(n);
      for (const [id, value] of [
        ["n", 4220],
        ["d", 5120],
        ["v", 2020],
      ] as const) {
        expect(textsAt(venn, `[data-dot-count="${id}"]`, vlast).join(" "), `集合の重なりの図 (${lang}) の ${id} の件数の字`).toContain(shown(value));
      }
    }
    // 端数がちょうど半分の件数は切り上げる。415 件と 585 件は 1 点 10 件で 42 点と 59 点
    const half = motionOfText(["chart Half [shape: dots, unit: 10]", "", "item p as P", "item q as Q", "", "step One", "  say Halves.", "  set p: 415", "  set q: 585", ""].join("\n"), "en");
    const hdots = dotsOf(half, "端数が半分の図");
    expect(dotsWith(half, hdots, "p", still(half, 0)).length, "415 件の点の数").toBe(42);
    expect(dotsWith(half, hdots, "q", still(half, 0)).length, "585 件の点の数").toBe(59);
  });

  it("dots-move-from-box-to-groups", () => {
    // 量の図。箱は全体の 1,000 人を 100 個の空の点で描き、項目に初めて件数を書いた段で、その点が箱から寄る
    const chart = motionOfText(CHART);
    const box = boxOf(chart, "量の図");
    expect(chart.doc.querySelectorAll("[data-dot-hole]").length, "量の図の箱の空の点の数").toBe(100);
    const dots = dotsOf(chart, "量の図");
    ["i", "a", "w", "m"].forEach((id, s) => {
      const arrived = dotsWith(chart, dots, id, still(chart, s));
      expect(arrived.length, `量の図の段 ${s + 1} の ${id} の点`).toBe(CHART_COUNTS[id]?.dots);
      for (const dot of arrived) {
        expect(inBox(box, placeAt(chart, dot, still(chart, s))), `量の図の段 ${s + 1} の ${id} の点が箱の外へ寄っていない`).toBe(false);
        if (s > 0) {
          expect(inBox(box, placeAt(chart, dot, still(chart, s - 1))), `量の図の段 ${s} で ${id} の点が箱の中に無い`).toBe(true);
          expect(paintAt(chart, dot, still(chart, s - 1)), `量の図の段 ${s} で ${id} の点がまだどこにも入らない塗りでない`).toBe("");
        }
      }
    });
    // 集合の重なりの図。DeFi だけの点は段 1 では箱に在り、両方に入る点は段 1 で既に NFT の群れに在る
    const venn = motionOfText(VENN);
    const vbox = boxOf(venn, "集合の重なりの図");
    expect(venn.doc.querySelectorAll("[data-dot-hole]").length, "集合の重なりの図の箱の空の点の数").toBe(100);
    const vdots = dotsOf(venn, "集合の重なりの図");
    const [one, two] = [still(venn, 0), still(venn, 1)];
    const defiOnly = dotsWith(venn, vdots, "d", two);
    const both = dotsWith(venn, vdots, "n&d", two);
    expect(defiOnly.length + both.length, "集合の重なりの図の段 2 の DeFi の点").toBeGreaterThan(0);
    for (const dot of defiOnly) {
      expect(inBox(vbox, placeAt(venn, dot, one)), "段 1 で DeFi だけの点が箱の中に無い").toBe(true);
      expect(inBox(vbox, placeAt(venn, dot, two)), "段 2 で DeFi だけの点が箱の外へ寄っていない").toBe(false);
    }
    for (const dot of both) {
      expect(paintAt(venn, dot, one), "段 1 で両方に入る点が NFT の塗りでない").toBe("n");
      expect(inBox(vbox, placeAt(venn, dot, one)), "段 1 で両方に入る点が箱に残っている").toBe(false);
    }
  });

  it("dots-none-stays-grey-in-the-box", () => {
    for (const [where, text, s, n] of [
      ["量の図", CHART, 4, 5],
      ["集合の重なりの図", VENN, 4, 13],
    ] as const) {
      const motion = motionOfText(text);
      const box = boxOf(motion, where);
      const dots = dotsOf(motion, where);
      const nones = dotsWith(motion, dots, "none", still(motion, s));
      expect(nones.length, `${where} の set none の段のどこにも入らない点の数`).toBe(n);
      // set none を書く前の段は、どこにも入らない点はまだ空の塗りで、書いた段で灰色になる
      expect(dotsWith(motion, dots, "none", still(motion, s - 1)).length, `${where} の set none の前の段で、どこにも入らない点が見える`).toBe(0);
      for (const dot of nones) {
        expect(inBox(box, placeAt(motion, dot, still(motion, s))), `${where} のどこにも入らない点が箱の外に在る`).toBe(true);
        const paint = [...dot.querySelectorAll('[data-dot-paint="none"]')].map((p) => p.outerHTML).join("");
        expect(paint, `${where} のどこにも入らない点が灰色 (slate) で塗られていない`).toContain("c-slate");
      }
      // ほかの点は全て箱の外の群れに在る
      for (const dot of dots.filter((d) => !nones.includes(d) && paintAt(motion, d, still(motion, s)) !== undefined)) {
        expect(inBox(box, placeAt(motion, dot, still(motion, s))), `${where} のどこかに入る点が箱に残っている`).toBe(false);
      }
    }
  });

  it("dots-venn-paints-overlaps-as-pie-slices", () => {
    const motion = motionOfText(VENN);
    const dots = dotsOf(motion, "集合の重なりの図");
    const t = still(motion, 4);
    /** 扇形の 1 切れの角度 (度)。`M0 0L<x0> <y0>A<r> <r> 0 0 1 <x1> <y1>Z` の 2 つの端から求める */
    const angle = (d: string): number => {
      const n = [...d.matchAll(/-?[\d.]+/g)].map((m) => Number(m[0]));
      const [x0, y0, x1, y1] = [n[2], n[3], n[9], n[10]] as number[];
      const a = (Math.atan2(y1, x1) - Math.atan2(y0, x0)) * (180 / Math.PI);
      return a <= 0 ? a + 360 : a;
    };
    for (const key of ["n", "d", "v", "n&d", "n&v", "d&v", "n&d&v"]) {
      const sets = key.split("&");
      const painted = dotsWith(motion, dots, key, t);
      expect(painted.length, `${key} の区画の点`).toBeGreaterThan(0);
      for (const dot of painted) {
        const layer = [...dot.querySelectorAll("[data-dot-paint]")].find((p) => p.getAttribute("data-dot-paint") === key);
        const slices = [...(layer?.querySelectorAll("[data-dot-slice]") ?? [])];
        if (sets.length === 1) {
          expect(slices.length, `1 つの集まりだけに入る ${key} の点が扇形に割れている`).toBe(0);
          expect(layer?.outerHTML ?? "", `${key} の点がその集まりの色で塗られていない`).toMatch(/--c-[a-z]+/u);
          continue;
        }
        // 入る集まりの数だけ等分の扇形に割り、どの切れもその集まりの名札と色を持つ
        expect(slices.map((s) => s.getAttribute("data-dot-slice")).sort(), `${key} の点の扇形の集まり`).toEqual([...sets].sort());
        for (const slice of slices) {
          expect(angle(slice.getAttribute("d") ?? ""), `${key} の点の ${slice.getAttribute("data-dot-slice")} の扇形の角度`).toBeCloseTo(360 / sets.length, 0);
          expect(slice.outerHTML, `${key} の点の扇形が色を持たない`).toMatch(/--c-[a-z]+/u);
        }
        expect(new Set(slices.map((s) => /--c-[a-z]+/u.exec(s.outerHTML)?.[0])).size, `${key} の点の扇形が集まりごとの色に分かれていない`).toBe(sets.length);
      }
    }
  });

  it("dots-chart-lays-items-in-rows", () => {
    for (const width of [undefined, 390]) {
      const where = `幅 ${width ?? "既定"} の量の図`;
      const motion = motionOfText(CHART, "ja", width);
      const dots = dotsOf(motion, where);
      const t = still(motion, 4);
      const right = width ?? Number(motion.doc.documentElement.getAttribute("viewBox")?.split(/\s+/)[2]);
      let above = Number.NEGATIVE_INFINITY;
      const lefts: number[] = [];
      const nameXs: number[] = [];
      for (const id of ["i", "a", "w", "m"]) {
        const places = dotsWith(motion, dots, id, t).map((d) => placeAt(motion, d, t));
        expect(places.length, `${where} の ${id} の点`).toBe(CHART_COUNTS[id]?.dots);
        // 行は上から y の順。各行の点の数は最後の行のほかは同じで、最後の行はそれ以下
        const rows = [...new Set(places.map(([, y]) => Math.round(y)))].sort((p, q) => p - q);
        const perRow = rows.map((y) => places.filter(([, py]) => Math.round(py) === y).length);
        const full = perRow[0] ?? 0;
        perRow.slice(0, -1).forEach((n, k) => expect(n, `${where} の ${id} の ${k + 1} 行目の点の数が 1 行目と違う`).toBe(full));
        expect(perRow.at(-1) ?? 0, `${where} の ${id} の最後の行の点が 1 行目より多い`).toBeLessThanOrEqual(full);
        // 項目どうしの行は重ならず、項目を書いた順に上から並ぶ
        expect(rows[0] ?? 0, `${where} の ${id} の行が前の項目の行より下に無い`).toBeGreaterThan(above);
        above = rows.at(-1) ?? 0;
        lefts.push(Math.min(...places.map(([x]) => x)));
        // 点は図の幅に収まる
        for (const [x] of places) expect(x > 0 && x < right, `${where} の ${id} の点が図の幅 ${right} の外に在る (${x})`).toBe(true);
        const name = motion.doc.querySelector(`[data-dot-name="${id}"]`);
        expect(name, `${where} に ${id} の名前の字 ([data-dot-name]) が無い`).not.toBeNull();
        nameXs.push(Number(name?.getAttribute("x")));
      }
      // 項目の点の左端と名前の字は、項目どうしで揃う
      for (const x of lefts) expect(x, `${where} の項目の点の左端が揃わない`).toBeCloseTo(lefts[0] ?? 0, 0);
      for (const x of nameXs) expect(x, `${where} の項目の名前の字の左端が揃わない`).toBeCloseTo(nameXs[0] ?? 0, 0);
      if (width === 390) {
        const iRows = new Set(dotsWith(motion, dots, "i", t).map((d) => Math.round(placeAt(motion, d, t)[1]))).size;
        expect(iRows, "幅 390 の量の図で 41 個の iPhone の点が折り返さない").toBeGreaterThan(1);
      }
    }
  });

  it("dots-groups-slide-with-a-stagger", () => {
    // 集合の重なりの図の段 2 では、NFT の点が NFT だけと両方に分かれ、DeFi だけの点が箱から寄る
    const motion = motionOfText(VENN);
    const dots = dotsOf(motion, "集合の重なりの図");
    const span = motion.rendered.timeline.steps[1] as Span;
    const end = still(motion, 1);
    const startOf = (dot: Element): number | undefined => {
      const [x0, y0] = placeAt(motion, dot, span.start);
      const [x1, y1] = placeAt(motion, dot, end);
      if (Math.hypot(x1 - x0, y1 - y0) < 1) return undefined;
      for (let t = span.start; t <= end; t += 0.01) {
        const [x, y] = placeAt(motion, dot, t);
        if (Math.hypot(x - x0, y - y0) > 0.5) return t;
      }
      return undefined;
    };
    const starts = new Map<string, number[]>();
    for (const dot of dots) {
      const t = startOf(dot);
      const key = paintAt(motion, dot, end);
      if (t === undefined || key === undefined) continue;
      starts.set(key, [...(starts.get(key) ?? []), t]);
    }
    expect([...starts.keys()].sort(), "段 2 で滑る点の群れ").toEqual(expect.arrayContaining(["d", "n&d"]));
    // 同じ群れの点は同じ時刻に滑り始め、群れどうしは少しずれた時刻に滑り始める
    const firsts = [...starts.entries()].map(([key, ts]) => {
      const lo = Math.min(...ts);
      expect(Math.max(...ts) - lo, `段 2 の ${key} の群れの点が滑り始める時刻が揃わない`).toBeLessThan(0.03);
      return lo;
    });
    const sorted = [...firsts].sort((p, q) => p - q);
    sorted.slice(1).forEach((t, k) => expect(t - (sorted[k] ?? 0), "段 2 の群れが同じ時刻に滑り始める").toBeGreaterThanOrEqual(0.03));
  });

  it("dots-added-pop-and-removed-fade", () => {
    // 段 1 は X 400 と Y 600、段 2 は X が 500 に増え、段 3 は Y が 500 に減る。全体が最も大きい段 2 (1,100) で 1 点は 10
    const text = ["chart Moving [shape: dots]", "", "item x as X", "item y as Y", "", "step One", "  say Start.", "  set x: 400", "  set y: 600", "", "step Two", "  say X grows.", "  set x: 500", "", "step Three", "  say Y shrinks.", "  set y: 500", ""].join("\n");
    const motion = motionOfText(text, "en");
    const dots = dotsOf(motion, "増減する図");
    const [one, two, three] = [0, 1, 2].map((s) => still(motion, s)) as [number, number, number];
    const span = (s: number): Span => motion.rendered.timeline.steps[s] as Span;
    const samples = (s: number): number[] => {
      const out: number[] = [];
      for (let t = span(s).start; t <= still(motion, s); t += 0.01) out.push(t);
      return out;
    };
    // 増えた 10 点は、段 1 では見えず、段 2 の間に一度 1 倍より大きくなってから 1 倍に戻る
    const added = dotsWith(motion, dots, "x", two).filter((d) => motion.opacity(d, one) < 0.1);
    expect(added.length, "段 2 で増えた X の点の数").toBe(10);
    for (const dot of added) {
      expect(Math.max(...samples(1).map((t) => scaleAt(motion, dot, t))), "段 2 で増えた点が弾まない").toBeGreaterThan(1.05);
      expect(scaleAt(motion, dot, two), "段 2 の止め絵で増えた点の大きさが戻らない").toBeCloseTo(1, 2);
    }
    // 減った 10 点は、段 2 では見え、段 3 の間に少しずつ薄くなって消える
    const removed = dotsWith(motion, dots, "y", two).filter((d) => motion.opacity(d, three) < 0.1);
    expect(removed.length, "段 3 で減った Y の点の数").toBe(10);
    for (const dot of removed) {
      expect(samples(2).some((t) => {
        const o = motion.opacity(dot, t);
        return o > 0.1 && o < 0.9;
      }), "段 3 で減った点が少しずつ薄くならずに消える").toBe(true);
    }
  });

  it("dots-stack-box-above-groups-at-phone-width", () => {
    for (const [where, text, last] of [
      ["量の図", CHART, 4],
      ["集合の重なりの図", VENN, 4],
    ] as const) {
      const motion = motionOfText(text, "ja", 390);
      const box = boxOf(motion, `幅 390 の${where}`);
      expect(box.x >= 0 && box.x + box.w <= 390, `幅 390 の${where}の箱が幅に収まらない`).toBe(true);
      const t = still(motion, last);
      for (const dot of dotsOf(motion, `幅 390 の${where}`)) {
        const key = paintAt(motion, dot, t);
        if (key === undefined || key === "none" || key === "") continue;
        expect(placeAt(motion, dot, t)[1], `幅 390 の${where}の ${key} の点が箱の下に無い`).toBeGreaterThan(box.y + box.h);
      }
    }
  });
});

describe("量の図の set none (#3635)", () => {
  it("chart-none-draws-grey-in-donut-and-bar", () => {
    const text = (shape: string): string =>
      ["chart Answers [shape: " + shape + "]", "", "item y as Yes", "item n as No", "", "step One", "  say Answers.", "  set y: 60", "  set n: 30", "", "step Two", "  say No answer.", "  set none: 10", ""].join("\n");
    for (const lang of LANGS) {
      for (const [shape, part] of [
        ["donut", "arc"],
        ["bar", "bar"],
      ] as const) {
        const motion = motionOfText(text(shape), lang);
        const el = motion.doc.querySelector(`[data-chart-${part}="none"]`);
        expect(el, `${shape} (${lang}) にどこにも入らない件数の ${part} ([data-chart-${part}="none"]) が無い`).not.toBeNull();
        if (!el) continue;
        expect(motion.opacity(el, still(motion, 0)), `${shape} (${lang}) の段 1 でどこにも入らない件数が見える`).toBeLessThan(0.1);
        expect(motion.opacity(el, still(motion, 1)), `${shape} (${lang}) の段 2 でどこにも入らない件数が見えない`).toBeGreaterThan(0.9);
        expect(el.getAttribute("style") ?? "", `${shape} (${lang}) のどこにも入らない件数が灰色 (slate) でない`).toContain("--c:var(--c-slate)");
        expect(textsAt(motion, '[data-chart-name="none"]', still(motion, 1)), `${shape} (${lang}) のどこにも入らない件数の名前`).toEqual([lang === "ja" ? "どれにも入らない" : "In none"]);
        // 項目の後ろに描く。横棒は最後の項目の棒より下、ドーナツは最後の項目の弧より後ろ (時計回り) に置く
        if (shape === "bar") {
          const last = motion.doc.querySelector('[data-chart-bar="n"]');
          expect(Number(el.getAttribute("y")), `横棒 (${lang}) のどこにも入らない件数の棒が最後の項目より下に無い`).toBeGreaterThan(Number(last?.getAttribute("y")));
        } else {
          const items = [...motion.doc.querySelectorAll("[data-chart-arc]")].map((a) => a.getAttribute("data-chart-arc"));
          expect(items.at(-1), `ドーナツ (${lang}) のどこにも入らない件数の弧が項目の後ろに無い`).toBe("none");
        }
      }
    }
  });

  it("chart-funnel-keeps-none-undeclared", () => {
    const funnel = (id: string): string => ["chart Steps [shape: funnel]", "", "item a as A", "item b as B", "", "step One", "  say Start.", "  set a: 10", "  set b: 5", "  set " + id + ": 3", ""].join("\n");
    for (const lang of LANGS) {
      const none = firstError(funnel("none"), lang);
      const ghost = firstError(funnel("ghost"), lang);
      expect(none, `漏斗 (${lang}) の set none が読めてしまう`).toBeDefined();
      // 宣言していない項目 (ghost) と同じ行と同じ文で断る
      expect(none && { line: none.line, message: none.message.replaceAll("none", "ghost") }, `漏斗 (${lang}) の set none の断り方が宣言していない項目と違う`).toEqual(ghost && { line: ghost.line, message: ghost.message });
    }
  });
});

describe("点で数える見た目の見本 (#3635)", () => {
  it("dots-examples-in-both-langs-have-no-breaks", () => {
    for (const { name, kind } of SAMPLES) {
      const sources: Partial<Record<Lang, Source>> = {};
      for (const lang of LANGS) {
        const file = `${name}${lang === "en" ? ".en" : ""}.dragon`;
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
        expect(text.split("\n")[0] ?? "", `${file} の最初の行`).toMatch(/^\/\/ /u);
        expect(/#\d+/u.test(text.split("\n")[0] ?? ""), `${file} の最初の注釈の行に作業の番号がある`).toBe(false);
        const source = parsed(text, lang, file);
        sources[lang] = source;
        expect(source.kind, `${file} の図の種類`).toBe(kind);
        expect(source.chart?.shape ?? source.venn?.shape, `${file} の見た目`).toBe("dots");
        // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
        const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
        expect(problems, `${file} の崩れの知らせ`).toEqual([]);
        for (const width of [undefined, 390]) dotsOf(motionFrom(render(source, lang, width)), `${file} を幅 ${width ?? "既定"} で描いた図`);
      }
      if (sources.ja && sources.en) expect(shapeOf(sources.en), `${name} の英語版の項目と段と段ごとの行の数が日本語版と違う`).toEqual(shapeOf(sources.ja));
      // 見本帳の見本の一覧に載り、その図の種類の頁に並ぶ
      expect(EXAMPLE_KEYS.includes(name), `${name} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      expect(samplesOf(kind), `見本帳の ${kind} の頁に ${name} が無い`).toContain(name);
      for (const lang of LANGS) {
        expect(exampleText(name, lang), `見本帳の ${name} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
      }
    }
  });

  it("dots-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、点で数える見た目の頭の行が量の図と集合の重なりの図の両方で在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      for (const kind of ["chart", "venn"]) {
        expect(
          kinds.some((line) => new RegExp(`^${kind} <[^>]+> \\[shape: dots\\]$`, "u").test(line)),
          `棚の記法の早見 (${lang}) に ${kind} の点で数える見た目の頭の行が無い: ${kinds.join(" / ")}`,
        ).toBe(true);
      }
      // 図の種類の見本の束に点で数える見た目の見本が在り、どの雛形も誤り無く点で数える見た目の図として読める
      for (const { name, kind } of SAMPLES) {
        const group = sampleGroups(lang, true).find((g) => g.kind === kind);
        expect(group, `棚の見本の束 (${lang}) に ${kind} の束が無い`).toBeDefined();
        const keys = group?.samples.map((s) => s.key) ?? [];
        expect(keys, `棚の ${kind} の束 (${lang}) に ${name} が無い`).toContain(name);
        if (!keys.includes(name)) continue;
        const source = parsed(exampleText(name, lang) ?? "", lang, `棚の雛形 ${name} (${lang})`);
        expect(source.chart?.shape ?? source.venn?.shape, `棚の雛形 ${name} (${lang}) の見た目`).toBe("dots");
      }
    }
  });
});

describe("点で数える見た目の軽い入口 (#3635)", () => {
  it("dots-light-entry-draws-after-load-for", () => {
    const code = [
      `const texts = ${JSON.stringify([CHART, VENN])};`,
      "out.drawn = [];",
      "for (const text of texts) {",
      "  await light.loadFor(text);",
      "  const read = light.parseNotation(text);",
      "  if (!read.ok) { out.drawn.push({ ok: false, errors: read.errors }); continue; }",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  const full = await import('@cardenelabs/dragon');",
      "  const again = full.parseNotation(text);",
      "  out.drawn.push({ ok: true, kind: drawn.layout.kind, dots: (drawn.svg.match(/data-dot=/g) ?? []).length, same: again.ok && full.renderDiagram(again.diagram).svg === drawn.svg });",
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
    expect(failure, "軽い入口で点で数える見た目の図を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as { drawn?: { ok: boolean; errors?: unknown[]; kind?: string; dots?: number; same?: boolean }[] };
    expect(out.drawn?.length, "軽い入口で描いた図の数").toBe(2);
    (out.drawn ?? []).forEach((d, k) => {
      const kind = k === 0 ? "chart" : "venn";
      expect(d.ok, `軽い入口で loadFor を待った後に点で数える見た目の ${kind} を読めない: ${JSON.stringify(d.errors)}`).toBe(true);
      expect(d.kind, "軽い入口で描いた図の種類").toBe(kind);
      expect(d.dots, `軽い入口で描いた ${kind} の点の数`).toBe(100);
      expect(d.same, `軽い入口と既定の入口で描いた ${kind} が違う`).toBe(true);
    });
  });
});

describe("点で数える見た目の書き方の文書 (#3635)", () => {
  it("dots-docs-describe-the-look", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 囲みのうち、読めて条件に合う物の数 */
    const fences = (text: string, ok: (source: Source, fence: string) => boolean): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && ok(read.diagram as unknown as Source, fence.source);
      }).length;
    const dots = (s: Source): boolean => (s.chart?.shape ?? s.venn?.shape) === "dots";
    const chartNone = (s: Source, source: string): boolean => s.kind === "chart" && /^\s*set none: /mu.test(source);
    for (const path of ["packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: dots\]/u.test(text), `${path} に [shape: dots] の書き方が無い`).toBe(true);
      expect(fences(text, dots), `${path} に点で数える見た目として読める dragon の囲みが無い`).toBeGreaterThan(0);
      expect(fences(text, chartNone), `${path} に set none を書いた量の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // AI の skill の量の図と集合の重なりの図の手引き
    for (const path of ["plugins/dragon/skills/dragon/references/kinds/chart.md", "plugins/dragon/skills/dragon/references/kinds/venn.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: dots\]/u.test(text), `${path} に [shape: dots] の書き方が無い`).toBe(true);
      expect(/\[unit: /u.test(text) || /unit: \d/u.test(text), `${path} に 1 点の件数 (unit) の書き方が無い`).toBe(true);
    }
    expect(/set none: /u.test(repoText("plugins/dragon/skills/dragon/references/kinds/chart.md")), "AI の skill の量の図の手引きに set none の書き方が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = ["chart.dragon", "chart.en.dragon", "venn.dragon", "venn.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(/\[shape: dots\]/u.test(page), "使い方の頁に [shape: dots] の書き方が無い").toBe(true);
    expect(/unit: /u.test(page), "使い方の頁に 1 点の件数 (unit) の書き方が無い").toBe(true);
    // 量の図の set none は、量の図の節の例か量の図の値のブロックの段落に書く。集合の重なりの図の set none の書き方では数えない
    const chartPage = [sections[0] ?? "", sections[1] ?? "", repoText("packages/dragon/src/blocks/chart-set/gallery/docs.ts")].join("\n");
    expect(/set none/u.test(chartPage), "使い方の頁の量の図に set none の書き方が無い").toBe(true);
  });
});
