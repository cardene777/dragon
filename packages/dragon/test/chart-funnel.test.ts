// @vitest-environment jsdom
/**
 * 量の図の漏斗の見た目 (#3621)。
 *
 * 量の図 (`chart`) の見た目に `[shape: funnel]` を足す。新しい図の種類は足さず、今の `item` と `set` をそのまま使う。
 * 項目を上から書いた順に左揃えの横の棒で並べ、棒の長さを最初の項目の値に比べて決める。
 * 段の中で項目に `set` を書くと、その段でその項目の棒が現れ、前の項目との差を薄い棒で残して、去った数と前の項目に対する割合を出す。
 * 最後の段で、最初の項目のうち最後の項目まで残った割合を出す。
 * 前の項目より大きい値は漏斗にならないので、記法を読む時と原本の JSON を検査する時に日本語と英語の誤りの文で断り、図を描かない。
 * 見た目の元は step 2 で本人が選んだ動く試作の案B (縮む横の棒)。
 *
 * 棒と薄い棒と字の見え方と長さは、描いた SVG の keyframes を jsdom で読んで、各段の止め絵の時刻で確かめる。
 * 部品は検査と読み上げの道具が引けるよう `data-chart-*` に項目の名札を持つ。
 * 棒は `data-chart-bar`、薄い棒は `data-chart-gap`、去った数は `data-chart-left`、前の項目に対する割合は `data-chart-rate`、
 * 最後の段の行の部品は `data-chart-total` (`rate` は残った割合、`left` は去った数) に持つ。
 * 見本の file と漏斗の見た目がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Rendered } from "./render-support";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/svg"), import("../src/check")]);

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
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

/** 漏斗の見た目の見本。一般の店の買い物の漏斗と、Web3 の財布を作ってから初めて送るまで */
const SAMPLES = ["shop-funnel", "wallet-onboarding"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

interface SourceEvent {
  type: string;
  item?: string;
  value?: number;
}

interface Source {
  kind: string;
  title: string;
  chart?: { shape: string; items: { id: string; name: string; color?: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

const setEvent = (item: string, value: number): Json => ({ type: "set", item, value });

/**
 * 3 つの項目を 1 段に 1 つずつ書いた最小の漏斗。`summary` を立てると、値を書かない振り返りの段を最後に足す。
 * 甲 12,000、乙 4,800 (甲の 40%)、丙 1,200 (乙の 25%) で、甲のうち丙まで残ったのは 10%
 */
function smallFunnel(summary = true, shape = "funnel"): Json {
  return {
    version: 2,
    kind: "chart",
    title: "小さな漏斗",
    chart: {
      shape,
      items: [
        { id: "a", name: "甲", color: "blue" },
        { id: "b", name: "乙", color: "violet" },
        { id: "c", name: "丙", color: "green" },
      ],
    },
    blocks: {},
    steps: [
      { title: "一", body: "甲に12,000が来る。", events: [setEvent("a", 12000)] },
      { title: "二", body: "乙へ4,800が進む。", events: [setEvent("b", 4800)] },
      { title: "三", body: "丙へ1,200が進む。", events: [setEvent("c", 1200)] },
      ...(summary ? [{ title: "振り返る", body: "甲のうち丙まで残った割合を見る。", events: [] }] : []),
    ],
  };
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: Lang = "ja", width?: number): Rendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "漏斗の見た目の量の図を描けない").toBe("");
  return rendered as Rendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", steps: [] }) as unknown as Source;
}

/** 描いた図の部品。全て返す */
const partsOf = (motion: Motion, selector: string): Element[] => [...motion.doc.querySelectorAll(selector)];

/** 時刻 `t` に見えている (濃さが 0.9 を超える) 部品 */
const shownAt = (motion: Motion, selector: string, t: number): Element[] => partsOf(motion, selector).filter((el) => motion.opacity(el, t) > 0.9);

/** 時刻 `t` に見えている部品の字 */
const textsAt = (motion: Motion, selector: string, t: number): string[] => shownAt(motion, selector, t).map((el) => el.textContent ?? "");

/** 棒の部品を 1 つ。無ければ落とす */
function barOf(motion: Motion, id: string): Element {
  const el = motion.doc.querySelector(`[data-chart-bar="${id}"]`);
  expect(el, `描いた図に ${id} の棒 (data-chart-bar) が無い`).not.toBeNull();
  return el as Element;
}

/** 棒の部品の、時刻 `t` の横の縮み (0 から 1) */
const barScaleAt = (motion: Motion, id: string, t: number): number => motion.value(barOf(motion, id), "transform", t)?.[0] ?? Number.NaN;

/** 部品の数の属性 */
const num = (el: Element, name: string): number => Number(el.getAttribute(name));

/** 記法の行の、注釈と空の行を除いた並び */
const codeLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "" && !line.trimStart().startsWith("//"));

/** 原本の項目と段と段ごとの `set` の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.chart?.shape,
  items: (d.chart?.items ?? []).map((i) => i.id),
  steps: d.steps.length,
  sets: d.steps.map((step) => step.events.filter((e) => e.type === "set").length),
});

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});

describe("漏斗の見た目の原本の JSON (#3621)", () => {
  it("schema-accepts-chart-funnel", () => {
    const validate = api("validateDiagram");
    for (const summary of [true, false]) {
      const checked = validate(smallFunnel(summary));
      expect(checked.ok, `漏斗の見た目の最小の量の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    // 漏斗の見た目のほかの見た目の綴りは、今どおり見た目の欄を指して断る
    const wrong = validate(smallFunnel(true, "funnels"));
    expect(pointers(wrong), "漏斗のほかの綴りの見た目の誤りの場所").toContain("/chart/shape");
    // 見本の記法から作った原本も検査を通る
    for (const name of SAMPLES) {
      for (const lang of LANGS) {
        const text = fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`);
        expect(text, `${name} の ${lang} の見本が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const sample = validate(parsed(text, lang, name));
        expect(sample.ok, `${name} の ${lang} の原本が検査で落ちる: ${JSON.stringify(sample.ok ? [] : sample.errors)}`).toBe(true);
      }
    }
  });
});

describe("漏斗の見た目の記法 (#3621)", () => {
  it("chart-funnel-roundtrip-keeps-notation", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of SAMPLES) {
      for (const lang of LANGS) {
        const file = `${name}${lang === "en" ? ".en" : ""}.dragon`;
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const first = parse(text, { lang });
        expect(first.ok, `${file} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
        if (!first.ok) continue;
        expect((first.diagram as unknown as Source).chart?.shape, `${file} の見た目`).toBe("funnel");
        // 書き戻すと、注釈の行のほかは書いた記法と同じ行に戻る
        const printed = print(first.diagram);
        expect(codeLines(printed), `${file} を書き戻した記法が書いた記法と違う`).toEqual(codeLines(text));
        expect(codeLines(printed)[0], `${file} を書き戻した頭の行`).toMatch(/^chart .+ \[shape: funnel\]$/u);
        const second = parse(printed, { lang });
        expect(second.ok ? second.diagram : undefined, `${file} を往復した JSON が最初と違う`).toEqual(first.diagram);
      }
    }
  });
});

describe("漏斗の見た目の描き方 (#3621)", () => {
  it("chart-funnel-bars-follow-the-values", () => {
    const cases: { where: string; source: Source }[] = [{ where: "最小の漏斗", source: smallFunnel() as unknown as Source }];
    for (const name of SAMPLES) {
      const text = fileText(`${name}.dragon`);
      expect(text, `${name}.dragon が packages/dragon/examples に無い`).toBeDefined();
      if (text !== undefined) cases.push({ where: name, source: parsed(text, "ja", name) });
    }
    for (const { where, source } of cases) {
      expect(source.chart?.shape, `${where} の見た目`).toBe("funnel");
      const rendered = render(source as unknown as Json);
      const motion = motionFrom(rendered);
      const items = source.chart?.items ?? [];
      // 項目を書いた順に上から、左揃えの横の棒で並べる
      const bars = items.map((item) => barOf(motion, item.id));
      bars.forEach((bar, k) => {
        if (k === 0) return;
        const above = bars[k - 1] as Element;
        expect(num(bar, "y"), `${where} の ${items[k]?.id} の棒が前の項目の棒より下に無い`).toBeGreaterThan(num(above, "y") + num(above, "height") - 0.5);
        expect(num(bar, "x"), `${where} の ${items[k]?.id} の棒の左端が前の項目の棒と揃わない`).toBeCloseTo(num(above, "x"), 1);
      });
      // 棒の長さは、その段の値を最初の項目の値で割った割合。最初の項目の棒が一番長い
      const now = new Map<string, number>();
      source.steps.forEach((step, s) => {
        for (const e of step.events) if (e.type === "set" && e.item !== undefined) now.set(e.item, e.value ?? 0);
        const t = rendered.timeline.stills[s] ?? 0;
        const first = now.get(items[0]?.id ?? "") ?? 0;
        expect(first, `${where} の段 ${s + 1} の最初の項目の値`).toBeGreaterThan(0);
        items.forEach((item) => {
          if (!now.has(item.id)) return;
          expect(barScaleAt(motion, item.id, t), `${where} の段 ${s + 1} の止め絵の ${item.id} の棒の長さの割合`).toBeCloseTo((now.get(item.id) ?? 0) / first, 2);
        });
      });
    }
  });

  it("chart-funnel-shows-who-left", () => {
    for (const lang of LANGS) {
      const rendered = render(smallFunnel(), lang);
      const motion = motionFrom(rendered);
      const { stills } = rendered.timeline;
      const bar = barOf(motion, "a");
      const x0 = num(bar, "x");
      const w = num(bar, "width");
      // 段 1 は甲の棒だけが出ていて、乙の棒と薄い棒と字はまだ出ない
      expect(motion.opacity(barOf(motion, "a"), stills[0] ?? 0), `${lang} の段 1 の止め絵で甲の棒が見えない`).toBeGreaterThan(0.9);
      expect(motion.opacity(barOf(motion, "b"), stills[0] ?? 0), `${lang} の段 1 の止め絵で、まだ書いていない乙の棒が見える`).toBeLessThan(0.1);
      for (const selector of ['[data-chart-gap="b"]', '[data-chart-left="b"]', '[data-chart-rate="b"]']) {
        expect(shownAt(motion, selector, stills[0] ?? 0), `${lang} の段 1 の止め絵で、まだ書いていない乙の ${selector} が見える`).toEqual([]);
      }
      // 乙と丙は、set を書いた段で棒が現れ、前の項目との差を薄い棒で残し、去った数と前の項目に対する割合を出す
      const cases = [
        { id: "b", step: 1, from: 0.4, to: 1, left: "7,200", rate: "40%" },
        { id: "c", step: 2, from: 0.1, to: 0.4, left: "3,600", rate: "25%" },
      ];
      for (const { id, step, from, to, left, rate } of cases) {
        const t = stills[step] ?? 0;
        expect(motion.opacity(barOf(motion, id), t), `${lang} の段 ${step + 1} の止め絵で ${id} の棒が見えない`).toBeGreaterThan(0.9);
        const gaps = shownAt(motion, `[data-chart-gap="${id}"]`, t);
        expect(gaps.length, `${lang} の段 ${step + 1} の止め絵の ${id} の薄い棒の数`).toBe(1);
        const gap = gaps[0];
        if (gap) {
          expect(num(gap, "x"), `${lang} の段 ${step + 1} の ${id} の薄い棒の左端が ${id} の棒の端に無い`).toBeCloseTo(x0 + from * w, 0);
          expect(num(gap, "width"), `${lang} の段 ${step + 1} の ${id} の薄い棒の長さが前の項目との差に無い`).toBeCloseTo((to - from) * w, 0);
        }
        const lefts = textsAt(motion, `[data-chart-left="${id}"]`, t);
        expect(lefts.length, `${lang} の段 ${step + 1} の止め絵の ${id} の去った数の字`).toBe(1);
        expect(lefts[0] ?? "", `${lang} の段 ${step + 1} の ${id} の去った数`).toContain(left);
        expect(KANA.test(lefts[0] ?? ""), `${lang} の段 ${step + 1} の ${id} の去った数の字の言葉: ${lefts[0]}`).toBe(lang === "ja");
        expect(textsAt(motion, `[data-chart-rate="${id}"]`, t), `${lang} の段 ${step + 1} の ${id} の前の項目に対する割合`).toEqual([rate]);
      }
    }
  });

  it("chart-funnel-shows-the-overall-rate", () => {
    for (const lang of LANGS) {
      // 値を書かない振り返りの段を最後に置いた図と、最後の項目を書いた段で終わる図
      for (const summary of [true, false]) {
        const rendered = render(smallFunnel(summary), lang);
        const motion = motionFrom(rendered);
        const { stills } = rendered.timeline;
        const last = stills.length - 1;
        const where = `${lang} の${summary ? "振り返りの段で終わる" : "最後の項目の段で終わる"}図`;
        expect(shownAt(motion, "[data-chart-total]", stills[last - 1] ?? 0), `${where} の最後より前の段で、残った割合の行が見える`).toEqual([]);
        const t = stills[last] ?? 0;
        expect(textsAt(motion, '[data-chart-total="rate"]', t), `${where} の最後の段の、甲のうち丙まで残った割合`).toEqual(["10%"]);
        const lefts = textsAt(motion, '[data-chart-total="left"]', t);
        expect(lefts.length, `${where} の最後の段の、甲のうち丙までに去った数の字`).toBe(1);
        expect(lefts[0] ?? "", `${where} の最後の段の、甲のうち丙までに去った数`).toContain("10,800");
      }
    }
  });
});

describe("漏斗にならない値 (#3621)", () => {
  it("chart-funnel-rejects-a-rising-value", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札と名前は英字にする
    const head = ["chart Small funnel [shape: funnel]", "item a as A", "item b as B"];
    const at = (line: string, token: string): number => line.lastIndexOf(token);
    // 記法の行と、誤りの行 (0 から数える) と、その行の中の誤りを指す語の位置 (0 から数える)
    const cases: [string, string[], number, number][] = [
      ["同じ段で前の項目より大きい値", [...head, "step One", "  say Rises.", "  set a: 10", "  set b: 20"], 6, at("  set b: 20", "20")],
      ["前の項目を後の段で後の項目より小さくする値", [...head, "step One", "  say Even.", "  set a: 10", "  set b: 8", "step Two", "  say Shrinks.", "  set a: 5"], 9, at("  set a: 5", "5")],
      ["前の項目を書く前の値", [...head, "step One", "  say Early.", "  set b: 3"], 5, at("  set b: 3", "3")],
      // 値を書かないまま終わる項目は漏斗の段に現れないので、宣言した行の名札を指して断る
      ["値を書かない項目", [...head, "item c as C", "step One", "  say Two.", "  set a: 10", "  set b: 8"], 3, at("item c as C", "c ")],
    ];
    for (const [name, lines, row, column] of cases) {
      const want = { line: row + 1, column: column + 1 };
      for (const lang of LANGS) {
        const read = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang}): ${first?.message ?? "誤りにならない"}`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        expect(KANA.test(first?.message ?? ""), `${name} の誤りの文の言葉 (${lang}): ${first?.message}`).toBe(lang === "ja");
      }
    }
    // 同じ段の中で書く順は問わず、前の項目と同じ値は漏斗のまま読む。ドーナツと横棒は値が増えても今どおり読む
    const accepted: [string, string[]][] = [
      ["同じ段で後の項目を先に書いた値", [...head, "step One", "  say Order.", "  set b: 5", "  set a: 10"]],
      ["前の項目と同じ値", [...head, "step One", "  say Same.", "  set a: 10", "  set b: 10"]],
      ["増える値の横棒", ["chart Small bar [shape: bar]", ...head.slice(1), "step One", "  say Rises.", "  set a: 10", "  set b: 20"]],
      ["増える値のドーナツ", ["chart Small donut [shape: donut]", ...head.slice(1), "step One", "  say Rises.", "  set a: 10", "  set b: 20"]],
    ];
    for (const [name, lines] of accepted) {
      const read = parse(lines.join("\n"));
      expect(read.ok, `${name} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }

    // 原本の JSON も、検査が値の欄を指して日本語と英語の文で断り、描く処理は図を作らずに断る
    const validate = api("validateDiagram");
    const rising = smallFunnel();
    ((rising as { steps: { events: Json[] }[] }).steps[0] as { events: Json[] }).events.push(setEvent("b", 20000));
    for (const lang of LANGS) {
      const checked = validate(rising, { lang });
      expect(pointers(checked), `前の項目より大きい値の原本の誤りの場所 (${lang})`).toContain("/steps/0/events/1/value");
      const messages = checked.ok ? [] : checked.errors.filter((e) => e.pointer === "/steps/0/events/1/value").map((e) => e.message);
      expect(messages.length, `前の項目より大きい値の原本の誤りの文 (${lang})`).toBeGreaterThan(0);
      for (const message of messages) expect(KANA.test(message), `前の項目より大きい値の原本の誤りの文の言葉 (${lang}): ${message}`).toBe(lang === "ja");
      let refused = "";
      try {
        draw("renderDiagram")(rising, { lang });
      } catch (error) {
        refused = String(error);
      }
      expect(refused, `前の項目より大きい値の原本を描いてしまう (${lang})`).not.toBe("");
    }
    for (const shape of ["bar", "donut"]) {
      const other = JSON.parse(JSON.stringify(rising).replace('"shape":"funnel"', `"shape":"${shape}"`)) as Json;
      const checked = validate(other);
      expect(checked.ok, `値が増える ${shape} の原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
  });
});

describe("漏斗の見た目の書き方の文書 (#3621)", () => {
  it("chart-funnel-docs-describe-the-shape", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const funnelFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).chart?.shape === "funnel";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md", "plugins/dragon/skills/dragon/references/kinds/chart.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: funnel\]/u.test(text), `${path} に [shape: funnel] の書き方が無い`).toBe(true);
      if (path.endsWith("quick-start.md") || path.endsWith("quick-start.en.md") || path === "packages/dragon/README.md") {
        expect(funnelFences(text), `${path} に漏斗の見た目として読める dragon の囲みが無い`).toBeGreaterThan(0);
      }
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = ["chart.dragon", "chart.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(/\[shape: funnel\]/u.test(page), "使い方の頁に [shape: funnel] の書き方が無い").toBe(true);
    // 変更履歴の Unreleased か版の節の Added に、漏斗の見た目が英語と日本語で載る
    for (const [path, word] of [
      ["CHANGELOG.md", /funnel/u],
      ["CHANGELOG.ja.md", /漏斗/u],
    ] as const) {
      const entry = changelogEntry(join(ROOT, path), 3621);
      const added = /### (?:Added|追加)([\s\S]*?)(?=\n### |$)/u.exec(entry)?.[1] ?? "";
      expect(added, `${path} の漏斗の見た目の項 (#3621) を持つ節に Added の節が無い`).not.toBe("");
      expect(word.test(added) && /\[shape: funnel\]/u.test(added), `${path} の Added に漏斗の見た目 ([shape: funnel]) が無い`).toBe(true);
    }
  });
});

describe("漏斗の見た目の見本 (#3621)", () => {
  it("chart-funnel-examples-in-both-langs-have-no-breaks", () => {
    for (const name of SAMPLES) {
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
        expect(source.chart?.shape, `${file} の見た目`).toBe("funnel");
        // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
        const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
        expect(problems, `${file} の崩れの知らせ`).toEqual([]);
        for (const width of [undefined, 390]) expect(partsOf(motionFrom(render(source as unknown as Json, lang, width)), "[data-chart-bar]").length, `${file} を幅 ${width ?? "既定"} で描いた棒`).toBe(source.chart?.items.length ?? -1);
      }
      if (sources.ja && sources.en) expect(shapeOf(sources.en), `${name} の英語版の項目と段と段ごとの set の数が日本語版と違う`).toEqual(shapeOf(sources.ja));
      // 見本帳の見本の一覧に載り、量の図の頁に並ぶ
      expect(EXAMPLE_KEYS.includes(name),`${name} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      expect(samplesOf("chart"),`見本帳の量の図の頁に ${name} が無い`).toContain(name);
      for (const lang of LANGS) {
        expect(exampleText(name, lang), `見本帳の ${name} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
      }
    }
  });
});

describe("漏斗の見た目の棚 (#3621)", () => {
  it("chart-funnel-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、漏斗の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(
        kinds.some((line) =>/^chart <[^>]+> \[shape: funnel\]$/u.test(line)),
        `棚の記法の早見 (${lang}) に chart の漏斗の見た目の頭の行が無い: ${kinds.join(" / ")}`,
      ).toBe(true);
      // 量の図の見本の束に漏斗の見た目の見本が在り、どの雛形も誤り無く漏斗の見た目の量の図として読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "chart");
      expect(group, `棚の見本の束 (${lang}) に量の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      for (const name of SAMPLES) {
        expect(keys, `棚の量の図の束 (${lang}) に ${name} が無い`).toContain(name);
        if (!keys.includes(name)) continue;
        const text = exampleText(name, lang) ?? "";
        expect(parsed(text, lang, `棚の雛形 ${name} (${lang})`).chart?.shape, `棚の雛形 ${name} (${lang}) の見た目`).toBe("funnel");
      }
    }
  });
});
