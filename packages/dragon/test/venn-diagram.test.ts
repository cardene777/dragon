// @vitest-environment jsdom
/**
 * 集合の重なりの図 (#3620)。
 *
 * 2 つか 3 つの集まりの重なりと、重なった区画ごとの数を段ごとに見せる図。原本の JSON の `kind` は `venn` で、
 * 集まりは最初の `step` より前の `item <名札> as <名前>` で宣言し、原本では `blocks.circle` に宣言した順に持つ。
 * 段の中の `set <名札>: <数>` は集まりの数で、集まりに初めて書いた段でその集まりの円が現れ、円の外に名前と数を出す。
 * `set <名札> & <名札>: <数>` は重なりの数で、その段でその重なりの区画を光らせる。`set none: <数>` はどれにも入らない数で、円の外の枠に出す。
 * それぞれだけの区画の数は、全体と重なりの数から出して区画の中に書く。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (円を段ごとに足し、重なった区画を光らせて数を書く)。
 *
 * 描いた部品は検査と読み上げの道具が引けるよう `data-venn-*` に集まりか区画の名札を持ち、区画の名札は宣言した順の名札を `&` で繋ぐ。
 * 見え方は SVG の keyframes を jsdom で読んで確かめる。
 * 見本の file と集合の重なりの図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Rendered, type Span } from "./render-support";

const ROOT = process.cwd();
const PACKAGE = join(ROOT, "packages/dragon");
const EXAMPLES = join(PACKAGE, "examples");

/** 集合の重なりの図の見本 4 枚 (#3620 の「決まっていること」) */
const VENN_EXAMPLES = ["wallet-usage", "l2-chains", "hobbies", "skills"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

interface SourceEvent {
  type: string;
  sets?: string[];
  value?: number;
}

interface Source {
  kind: string;
  title: string;
  blocks: { circle?: { id: string; name: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 見本の file から、最初の注釈の行と、その後ろの空の行を外した記法 */
const withoutComments = (text: string): string => text.replace(/^(?:\/\/[^\n]*\n)+\n*/u, "");

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: "ja" | "en" = "ja"): Json {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `集合の重なりの図の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): Rendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "集合の重なりの図を描けない").toBe("");
  expect((rendered?.layout as { kind?: string } | undefined)?.kind, "描いた図が集合の重なりの図 (venn) でない").toBe("venn");
  return rendered as Rendered;
}

/** 数の字。3 桁ごとに `,` で区切る */
const shown = (value: number): string => value.toLocaleString("en-US");

/** 3 つの集まりの、書き戻した形の小さな記法。それぞれだけの区画の数は 読書 22、運動 14、料理 11、読書と運動 8、読書と料理 6、運動と料理 4、3 つ全て 4 */
const SMALL = [
  "venn 小さな重なり",
  "",
  "item a as 読書",
  "item b as 運動",
  "item c as 料理",
  "",
  "step 読書",
  "  say 本を読む人を数える。",
  "  set a: 40",
  "",
  "step 運動",
  "  say 運動する人と、両方に入る人を足す。",
  "  set b: 30",
  "  set a & b: 12",
  "",
  "step 料理",
  "  say 料理する人と、重なる人を足す。",
  "  set c: 25",
  "  set a & c: 10",
  "  set b & c: 8",
  "",
  "step 3つ全て",
  "  say 3つ全てに入る人を数える。",
  "  set a & b & c: 4",
  "",
  "step どれにも",
  "  say どれにも入らない人を数える。",
  "  set none: 15",
  "",
].join("\n");

/** SMALL の区画ごとの、それぞれだけの数。鍵は宣言した順の名札を `&` で繋いだ区画の名札 */
const SMALL_REGIONS: Record<string, number> = { a: 22, b: 14, c: 11, "a&b": 8, "a&c": 6, "b&c": 4, "a&b&c": 4 };

/** 2 つの集まりの記法。それぞれだけの区画の数は 朝 25、夜 15、両方 5 */
const TWO = ["venn 二つの重なり", "", "item x as 朝", "item y as 夜", "", "step 朝", "  say 朝に使う人。", "  set x: 30", "", "step 夜", "  say 夜に使う人と、両方に使う人。", "  set y: 20", "  set x & y: 5", ""].join("\n");

const TWO_REGIONS: Record<string, number> = { x: 25, y: 15, "x&y": 5 };

const count = (sets: string[], value: number): Json => ({ type: "count", sets, value });

/** SMALL と同じ図の原本 (版2) */
function smallVenn(): Json {
  return {
    version: 2,
    kind: "venn",
    title: "小さな重なり",
    blocks: {
      circle: [
        { id: "a", name: "読書" },
        { id: "b", name: "運動" },
        { id: "c", name: "料理" },
      ],
    },
    steps: [
      { title: "読書", body: "本を読む人を数える。", events: [count(["a"], 40)] },
      { title: "運動", body: "運動する人と、両方に入る人を足す。", events: [count(["b"], 30), count(["a", "b"], 12)] },
      { title: "料理", body: "料理する人と、重なる人を足す。", events: [count(["c"], 25), count(["a", "c"], 10), count(["b", "c"], 8)] },
      { title: "3つ全て", body: "3つ全てに入る人を数える。", events: [count(["a", "b", "c"], 4)] },
      { title: "どれにも", body: "どれにも入らない人を数える。", events: [{ type: "none", value: 15 }] },
    ],
  };
}

/** 描いた円。`data-venn-set` に集まりの名札を持つ */
interface Circle {
  id: string;
  cx: number;
  cy: number;
  r: number;
}

function circlesOf(motion: Motion, ids: readonly string[], what: string): Circle[] {
  return ids.map((id) => {
    const el = motion.doc.querySelector(`[data-venn-set="${id}"]`);
    expect(el, `${what} の集まり ${id} の円 ([data-venn-set]) が描いた図に無い`).not.toBeNull();
    return { id, cx: Number(el?.getAttribute("cx")), cy: Number(el?.getAttribute("cy")), r: Number(el?.getAttribute("r")) };
  });
}

/**
 * 属性 `name` が区画の名札 `key` (`a&b`) の部品を選ぶ書き方。
 * jsdom の部品の探し方は引用符の中の `&` を入れ子の印と読んで何も拾わないので、`&` を CSS の符号 (`\26 `) で書く
 */
const keyIs = (name: string, key: string): string => `[${name}="${key.replaceAll("&", "\\26 ")}"]`;

/** 字の置き場所 (基準線の点) */
const at =(el: Element): [number, number] => [Number(el.getAttribute("x")), Number(el.getAttribute("y"))];
const inside = (c: Circle, [x, y]: [number, number]): boolean => Math.hypot(x - c.cx, y - c.cy) < c.r;

/** 時刻 `t` に見えている、選んだ字の中身 */
const visibleTexts = (motion: Motion, selector: string, t: number): string[] =>
  [...motion.doc.querySelectorAll(selector)].filter((el) => motion.opacity(el, t) > 0.9).map((el) => el.textContent ?? "");

/** 段 `s` の終わりの少し前の時刻 */
const endOf = (rendered: Rendered, s: number): number => (rendered.timeline.steps[s] as Span).end - 0.05;

/** 集まりの名札ごとに、初めて数を書いた段 */
function firstSteps(source: Source): Map<string, number> {
  const first = new Map<string, number>();
  source.steps.forEach((step, s) => {
    for (const e of step.events) if (e.type === "count" && e.sets?.length === 1 && !first.has(e.sets[0] as string)) first.set(e.sets[0] as string, s);
  });
  return first;
}

describe("集合の重なりの図の原本の JSON (#3620)", () => {
  it("schema-accepts-venn-diagram", () => {
    const validate = api("validateDiagram");
    for (const lang of ["ja", "en"] as const) {
      const checked = validate(smallVenn(), { lang });
      expect(checked.ok, `3 つの集まりの集合の重なりの図が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    // 2 つの集まりで、どれにも入らない数を書かない図も通る
    const two = smallVenn() as { blocks: { circle: Json[] }; steps: { events: Json[] }[] };
    two.blocks.circle = two.blocks.circle.slice(0, 2);
    two.steps = [{ ...two.steps[0], events: [count(["a"], 40)] }, { ...two.steps[1], events: [count(["b"], 30), count(["a", "b"], 12)] }] as typeof two.steps;
    const checked = validate(two);
    expect(checked.ok, `2 つの集まりの集合の重なりの図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
  });
});

describe("集合の重なりの図の記法 (#3620)", () => {
  it("venn-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(print(parsed(SMALL)), "小さな集合の重なりの図を読んで書き戻した記法が元と違う").toBe(SMALL);
    expect(print(parsed(TWO)), "2 つの集まりの図を読んで書き戻した記法が元と違う").toBe(TWO);
    // 記法から作った原本は、原本の JSON と同じ
    expect(parsed(SMALL), "小さな集合の重なりの図の記法から作った原本").toEqual(smallVenn());
    for (const key of VENN_EXAMPLES) {
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const diagram = parsed(text, lang);
        expect((diagram as unknown as Source).kind, `${file} の図の種類`).toBe("venn");
        expect(print(diagram), `${file} を読んで書き戻した記法が元 (最初の注釈を除く) と違う`).toBe(withoutComments(text));
      }
    }
  });

  it("venn-rejects-other-than-two-or-three-sets", () => {
    const parse = api("parseNotation");
    const text = (n: number): string =>
      ["venn small", ...Array.from({ length: n }, (_, i) => `item s${i + 1}`), "step go", "  say go.", ...(n > 0 ? ["  set s1: 1"] : [])].join("\n");
    // 2 つより少ない図は頭の行を、3 つより多い図は 4 つ目の集まりの行を指して止める
    for (const n of [0, 1, 4, 5]) {
      const want = n < 2 ? 1 : 5;
      for (const lang of ["ja", "en"] as const) {
        const read = parse(text(n), { lang });
        expect(read.ok, `集まりが ${n} つの集合の重なりの図が読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first?.line, `集まりが ${n} つの集合の重なりの図の誤りの行 (${lang}): ${first?.message}`).toBe(want);
        const message = first?.message ?? "";
        expect(message.includes("2") && message.includes("3"), `集まりが ${n} つの図の誤りの文が 2 と 3 の数を示さない (${lang}): ${message}`).toBe(true);
        if (lang === "en") expect(KANA.test(message), `集まりが ${n} つの英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
        else expect(KANA.test(message), `集まりが ${n} つの日本語の誤りの文が日本語でない: ${message}`).toBe(true);
      }
    }
    for (const n of [2, 3]) {
      const read = parse(text(n));
      expect(read.ok, `集まりが ${n} つの集合の重なりの図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });

  it("venn-rejects-an-overlap-larger-than-its-set", () => {
    const parse = api("parseNotation");
    const head = ["venn small", "item a", "item b", "item c"];
    // 重なりの数が、重なる集まりか、それを含む重なりの数より大きくなった行を指して止める。誤りの文は 2 つの数を示す
    const cases: { name: string; lines: string[]; line: number; numbers: [string, string] }[] = [
      { name: "集まりより大きい重なり", lines: ["step go", "  say go.", "  set a: 10", "  set b: 8", "  set a & b: 9"], line: 9, numbers: ["9", "8"] },
      { name: "後の段で重なりより小さくした集まり", lines: ["step go", "  say go.", "  set a: 10", "  set b: 10", "  set a & b: 5", "step down", "  say down.", "  set a: 4"], line: 12, numbers: ["5", "4"] },
      {
        name: "2 つの重なりより大きい 3 つの重なり",
        lines: ["step go", "  say go.", "  set a: 10", "  set b: 10", "  set c: 10", "  set a & b: 3", "  set a & b & c: 4"],
        line: 11,
        numbers: ["4", "3"],
      },
    ];
    for (const { name, lines, line, numbers } of cases) {
      for (const lang of ["ja", "en"] as const) {
        const read = parse([...head, ...lines].join("\n"), { lang });
        expect(read.ok, `${name} を書いた集合の重なりの図が読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first?.line, `${name} の誤りの行 (${lang}): ${first?.message}`).toBe(line);
        const message = first?.message ?? "";
        expect(numbers.every((n) => message.includes(n)), `${name} の誤りの文が ${numbers.join(" と ")} を示さない (${lang}): ${message}`).toBe(true);
        if (lang === "en") expect(KANA.test(message), `${name} の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
        else expect(KANA.test(message), `${name} の日本語の誤りの文が日本語でない: ${message}`).toBe(true);
      }
    }
    // 重なりの数が集まりの数と同じ図は受ける
    const equal = parse([...head, "step go", "  say go.", "  set a: 10", "  set b: 8", "  set a & b: 8", "  set a & b & c: 0"].join("\n"));
    expect(equal.ok, `重なりの数が集まりの数と同じ図が読めない: ${equal.ok ? "" : JSON.stringify(equal.errors)}`).toBe(true);
  });

  it("notation-keeps-venn-words-plain-outside-venn", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [`${kind} 重なりの語の名札`, "box venn as 重なり", "box none as 無し", "step 送る", "  say 送る。", "  venn -> none: 送る", "  none -> venn: 戻す"].join("\n");
      const read = parse(text);
      expect(read.ok, `${kind} で venn と none を名札にした箱が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
      const diagram = (read.ok ? read.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["venn", "none"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind} の venn と none を結ぶ線`).toEqual([
        { type: "edge", from: "venn", to: "none" },
        { type: "edge", from: "none", to: "venn" },
      ]);
    }
  });
});

describe("集合の重なりの図の並べ方と動き (#3620)", () => {
  it("venn-circles-appear-at-their-step", () => {
    const sources: [string, Json, "ja" | "en"][] = [
      ["小さな重なり", parsed(SMALL), "ja"],
      ["二つの重なり", parsed(TWO), "ja"],
    ];
    const wallet = fileText("wallet-usage.dragon");
    expect(wallet, "wallet-usage.dragon が packages/dragon/examples に無い").toBeDefined();
    if (wallet !== undefined) sources.push(["wallet-usage", parsed(wallet), "ja"]);
    for (const [name, diagram, lang] of sources) {
      const source = diagram as unknown as Source;
      const sets = source.blocks.circle ?? [];
      const rendered = render(diagram, lang);
      const motion = motionFrom(rendered);
      const circles = circlesOf(motion, sets.map((s) => s.id), name);
      const first = firstSteps(source);
      const last = rendered.timeline.steps.length - 1;
      for (const set of sets) {
        const step = first.get(set.id);
        expect(step, `${name} の集まり ${set.id} に数を書いた段が無い`).toBeDefined();
        if (step === undefined) continue;
        const circle = motion.doc.querySelector(`[data-venn-set="${set.id}"]`) as Element;
        const span = rendered.timeline.steps[step] as Span;
        // 円は初めて数を書いた段で現れ、後の段でも残る
        if (step > 0) expect(motion.opacity(circle, span.start - 0.05), `${name} の ${set.id} の円が数を書く前の段から見える`).toBeLessThan(0.1);
        expect(motion.opacity(circle, endOf(rendered, step)), `${name} の ${set.id} の円がその段の終わりに見えない`).toBeGreaterThan(0.9);
        expect(motion.opacity(circle, endOf(rendered, last)), `${name} の ${set.id} の円が最後の段で残らない`).toBeGreaterThan(0.9);
        // 円の外に名前と全体の数を出す
        const value = source.steps[step]?.events.find((e) => e.type === "count" && e.sets?.length === 1 && e.sets[0] === set.id)?.value ?? -1;
        expect(visibleTexts(motion, `[data-venn-name="${set.id}"]`, endOf(rendered, step)), `${name} の ${set.id} の名前`).toEqual([set.name]);
        expect(visibleTexts(motion, `[data-venn-total="${set.id}"]`, endOf(rendered, step)), `${name} の ${set.id} の全体の数`).toEqual([shown(value)]);
        if (step > 0) expect(visibleTexts(motion, `[data-venn-name="${set.id}"]`, span.start - 0.05), `${name} の ${set.id} の名前が数を書く前の段から見える`).toEqual([]);
        for (const el of motion.doc.querySelectorAll(`[data-venn-name="${set.id}"], [data-venn-total="${set.id}"]`)) {
          const p = at(el);
          expect(
            circles.every((c) => !inside(c, p)),
            `${name} の ${set.id} の名前か数 ${el.textContent} が円の中に在る`,
          ).toBe(true);
        }
      }
    }
  });

  it("venn-overlap-lights-at-its-step", () => {
    for (const [name, text] of [
      ["小さな重なり", SMALL],
      ["二つの重なり", TWO],
    ] as const) {
      const diagram = parsed(text);
      const source = diagram as unknown as Source;
      const order = (source.blocks.circle ?? []).map((s) => s.id);
      const rendered = render(diagram);
      const motion = motionFrom(rendered);
      const overlaps = source.steps.flatMap((step, s) => step.events.flatMap((e) => (e.type === "count" && (e.sets?.length ?? 0) > 1 ? [{ step: s, sets: e.sets as string[] }] : [])));
      expect(overlaps.length, `${name} に重なりの数を書いた行が無い`).toBeGreaterThan(0);
      for (const { step, sets } of overlaps) {
        const key = order.filter((id) => sets.includes(id)).join("&");
        const lit = motion.doc.querySelector(keyIs("data-venn-lit", key));
        expect(lit, `${name} の重なり ${key} の光る区画 ([data-venn-lit]) が描いた図に無い`).not.toBeNull();
        if (!lit) continue;
        const span = rendered.timeline.steps[step] as Span;
        // 重なりの数を書いた段で光り、前の段と後の段では光らない
        if (step > 0) expect(motion.opacity(lit, span.start - 0.05), `${name} の重なり ${key} が数を書く前の段から光る`).toBeLessThan(0.1);
        expect(motion.opacity(lit, endOf(rendered, step)), `${name} の重なり ${key} が数を書いた段で光らない`).toBeGreaterThan(0.9);
        const next = rendered.timeline.steps[step + 1];
        if (next) expect(motion.opacity(lit, (next.start + next.end) / 2), `${name} の重なり ${key} が次の段でも光ったまま残る`).toBeLessThan(0.1);
      }
    }
  });

  it("venn-regions-show-exclusive-counts", () => {
    for (const [name, text, regions] of [
      ["小さな重なり", SMALL, SMALL_REGIONS],
      ["二つの重なり", TWO, TWO_REGIONS],
    ] as const) {
      const diagram = parsed(text);
      const source = diagram as unknown as Source;
      const ids = (source.blocks.circle ?? []).map((s) => s.id);
      const rendered = render(diagram);
      const motion = motionFrom(rendered);
      const circles = circlesOf(motion, ids, name);
      const last = rendered.timeline.steps.length - 1;
      for (const [key, value] of Object.entries(regions)) {
        // 最後の段では、どの区画にもそれぞれだけの数が出る
        expect(visibleTexts(motion, keyIs("data-venn-region", key), endOf(rendered, last)), `${name} の最後の段の区画 ${key} の数`).toEqual([shown(value)]);
        // 区画の数は、その区画の集まりの円の中で、ほかの円の外に書く
        const members = key.split("&");
        for (const el of motion.doc.querySelectorAll(keyIs("data-venn-region", key))) {
          const p = at(el);
          for (const c of circles) expect(inside(c, p), `${name} の区画 ${key} の数が ${c.id} の円の${members.includes(c.id) ? "中" : "外"}に無い`).toBe(members.includes(c.id));
        }
      }
      // どの段でも、出ている区画の数はそれぞれだけの数と同じで、まだ決まらない数を出さない
      rendered.timeline.steps.forEach((_, s) => {
        for (const [key, value] of Object.entries(regions)) {
          for (const t of visibleTexts(motion, keyIs("data-venn-region", key), endOf(rendered, s))) expect(t, `${name} の段 ${s + 1} の区画 ${key} の数`).toBe(shown(value));
        }
      });
      // 円がまだ無い段には、その円の区画の数を出さない
      const first = firstSteps(source);
      for (const key of Object.keys(regions)) {
        const appear = Math.max(...key.split("&").map((id) => first.get(id) ?? 0));
        if (appear > 0) expect(visibleTexts(motion, keyIs("data-venn-region", key), endOf(rendered, appear - 1)), `${name} の区画 ${key} の数が円の現れる前の段に出る`).toEqual([]);
      }
    }
  });

  it("venn-none-shows-outside-count", () => {
    const diagram = parsed(SMALL);
    const source = diagram as unknown as Source;
    const ids = (source.blocks.circle ?? []).map((s) => s.id);
    const rendered = render(diagram);
    const motion = motionFrom(rendered);
    const circles = circlesOf(motion, ids, "小さな重なり");
    const step = source.steps.findIndex((s) => s.events.some((e) => e.type === "none"));
    expect(step, "小さな重なりに set none の行が無い").toBeGreaterThan(0);
    const group = motion.doc.querySelector("[data-venn-none]");
    expect(group, "どれにも入らない数の部品 ([data-venn-none]) が描いた図に無い").not.toBeNull();
    if (!group) return;
    const span = rendered.timeline.steps[step] as Span;
    expect(motion.opacity(group, span.start - 0.05), "どれにも入らない数が書く前の段から見える").toBeLessThan(0.1);
    expect(motion.opacity(group, endOf(rendered, step)), "どれにも入らない数がその段の終わりに見えない").toBeGreaterThan(0.9);
    // 円を囲む枠を出し、数は枠の中で、どの円の外にも書く
    const frame = group.querySelector("[data-venn-frame]");
    expect(frame, "どれにも入らない数の枠 ([data-venn-frame]) が描いた図に無い").not.toBeNull();
    const [fx, fy, fw, fh] = ["x", "y", "width", "height"].map((k) => Number(frame?.getAttribute(k)));
    for (const c of circles) {
      expect(c.cx - c.r >= (fx as number) && c.cx + c.r <= (fx as number) + (fw as number) && c.cy - c.r >= (fy as number) && c.cy + c.r <= (fy as number) + (fh as number), `${c.id} の円が枠の中に無い`).toBe(true);
    }
    const texts = [...group.querySelectorAll("[data-venn-none-count]")];
    expect(texts.map((t) => t.textContent ?? "").some((t) => t.includes(shown(15))), "どれにも入らない数 15 が枠に無い").toBe(true);
    for (const t of texts) {
      const p = at(t);
      expect(circles.every((c) => !inside(c, p)), `どれにも入らない数 ${t.textContent} が円の中に在る`).toBe(true);
      expect(p[0] > (fx as number) && p[0] < (fx as number) + (fw as number) && p[1] > (fy as number) && p[1] < (fy as number) + (fh as number), `どれにも入らない数 ${t.textContent} が枠の外に在る`).toBe(true);
    }
  });
});

describe("集合の重なりの図の軽い入口 (#3620)", () => {
  it("venn-light-entry-draws-after-load-for", () => {
    const code = [
      `const text = ${JSON.stringify(SMALL)};`,
      "out.before = light.kindLoaded('venn');",
      "await light.loadFor(text);",
      "out.after = light.kindLoaded('venn');",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.kind = drawn.layout.kind;",
      "  out.circles = (drawn.svg.match(/data-venn-set=/g) ?? []).length;",
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
    expect(failure, "軽い入口で集合の重なりの図を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as { before?: boolean; after?: boolean; ok?: boolean; errors?: unknown[]; kind?: string; circles?: number; same?: boolean };
    expect(out.before, "軽い入口が loadFor の前から集合の重なりの図の描く部品を持つ (最初に読む塊に入っている)").toBe(false);
    expect(out.after, "軽い入口で loadFor を待っても集合の重なりの図の描く部品を読まない").toBe(true);
    expect(out.ok, `軽い入口で loadFor を待った後に集合の重なりの図を読めない: ${JSON.stringify(out.errors)}`).toBe(true);
    expect(out.kind, "軽い入口で描いた図の種類").toBe("venn");
    expect(out.circles, "軽い入口で描いた集合の重なりの図の円の数").toBe(3);
    expect(out.same, "軽い入口と既定の入口で描いた集合の重なりの図が違う").toBe(true);
  });
});

describe("集合の重なりの図の書き方の文書 (#3620)", () => {
  it("venn-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `venn` と、段の中の重なりの数の書き方 */
    const head = /(^|[\s`])venn [^\s`]/mu;
    const overlap = /set (<[^>]+>|[^\s`&]+) & (<[^>]+>|[^\s`&]+): /u;
    const vennFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "venn";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に venn の行の書き方が無い`).toBe(true);
      expect(overlap.test(text), `${path} に重なりの数の行 (set <名札> & <名札>: <数>) の書き方が無い`).toBe(true);
      if (path !== "README.md") expect(vennFences(text), `${path} に集合の重なりの図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // README の描ける図の欄に集合の重なりの図が載る
    expect(/^\| Diagram kinds \|.*\bset overlap diagram\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に set overlap diagram が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"venn"/u.test(content), "使い方の頁の節に集合の重なりの図 (venn) が無い").toBe(true);
    const sections = ["venn.dragon", "venn.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の集合の重なりの図の節の例 (${i === 0 ? "venn.dragon" : "venn.en.dragon"}) が集合の重なりの図として読めない`).toBe("venn");
    }
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に venn の行の書き方が無い").toBe(true);
    expect(overlap.test(page), "使い方の頁に重なりの数の行の書き方が無い").toBe(true);
  });
});
