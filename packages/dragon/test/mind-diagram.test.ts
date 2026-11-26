// @vitest-environment jsdom
/**
 * 考えを広げる地図 (#3619)。
 *
 * 真ん中の題から枝と葉を四方へ広げる図。原本の JSON の `kind` は `mind` で、段の中の `idea <名札> as <名前> of <親>` を書いた段でその考えが現れ、
 * 親からの枝の線が引かれていく。`of` の無い `idea` が真ん中の題で、1 つの図にちょうど 1 つ置く。題、枝、葉の 3 段までを描く。
 * 題の子の枝は左右に分けて四方へ曲線で伸ばし、孫 (葉) は子の外側に置く。枝に書いた色はその枝の線と葉の枠に引き継ぎ、色の無い枝には書いた順に色を配る。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (真ん中の題から枝を四方へ曲線で伸ばし、段ごとに枝と葉が濃くなる)。
 *
 * 置き場所 (`layout`) は描く部品が返す値で確かめ、現れ方と線の伸び方は SVG の keyframes を jsdom で読んで確かめる。
 * 考えの部品は `data-mind-idea="<名札>"`、親から子への線は `data-mind-link="<親>><子>"` を持つ。
 * 見本の file と考えを広げる地図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { motionFrom } from "./motion-support";
import { draw, type Layout, type Rect, type Rendered, type Span } from "./render-support";
import "../src/kind-use/architecture";
import "../src/kind-use/mind";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/tree";

/*
 * 崩れを数える部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const { checkLayoutText } = await import("../src/render/layout-check");

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** 考えを広げる地図の見本 4 枚 (#3619 の「決まっていること」) */
const MIND_EXAMPLES = ["budget-app", "trip-plan", "dao-proposal", "wallet-ux"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 並べた考え。`level` は真ん中の題が 0、枝が 1、葉が 2 */
interface MindIdea extends Rect {
  id: string;
  name: string;
  cx: number;
  cy: number;
  level: number;
  parent?: string;
  color: string;
}

interface MindLayout extends Omit<Layout, "boxes"> {
  kind: string;
  ideas?: MindIdea[];
}

interface MindRendered extends Omit<Rendered, "layout"> {
  layout: MindLayout;
}

interface SourceIdea {
  type: string;
  id?: string;
  name?: string;
  parent?: string;
  color?: string;
}

interface Source {
  kind: string;
  title: string;
  steps: { title: string; events: SourceIdea[] }[];
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本の file から、最初の注釈の行と、その後ろの空の行を外した記法 */
const withoutComments = (text: string): string => text.replace(/^(?:\/\/[^\n]*\n)+\n*/u, "");

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: "ja" | "en" = "ja"): Json {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `考えを広げる地図の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): MindRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "考えを広げる地図を描けない").toBe("");
  const layout = (rendered as unknown as MindRendered | undefined)?.layout;
  expect(layout?.kind, "描いた図が考えを広げる地図 (mind) でない").toBe("mind");
  expect(layout?.ideas, "並べた考えを広げる地図に考えの並び (layout.ideas) が無い").toBeDefined();
  return rendered as unknown as MindRendered;
}

const ideaOf = (layout: MindLayout, id: string): MindIdea => {
  const idea = (layout.ideas ?? []).find((i) => i.id === id);
  expect(idea, `${id} の考えが並べた図に無い`).toBeDefined();
  return idea as MindIdea;
};

/** 部品から外へ辿って最初に見つかる色の変数 (`--c:var(--c-<色>)`) の色の名前 */
function colorOf(el: Element | null): string | undefined {
  for (let e = el; e; e = e.parentElement) {
    const found = /--c:var\(--c-([a-z]+)\)/u.exec(e.getAttribute("style") ?? "");
    if (found) return found[1];
  }
  return undefined;
}

/** 家計簿のアプリの機能を考える、書き戻した形の小さな記法。真ん中の題と、4 つの枝と、枝ごとの葉 */
const SMALL = [
  "mind 家計簿のアプリの機能",
  "",
  "step 題を置く",
  "  say 考える題を真ん中に置く。",
  "  idea app as 家計簿のアプリ",
  "",
  "step 入力の枝",
  "  say 入力の枝を伸ばす。",
  "  idea input as 入力 of app",
  "  idea scan as レシートを読む of input",
  "  idea hand as 手で書く of input",
  "",
  "step 集計の枝",
  "  say 集計の枝を伸ばす。",
  "  idea sum as 集計 of app [color: rose]",
  "  idea month as 月ごと of sum",
  "",
  "step 通知の枝",
  "  say 通知の枝を伸ばす。",
  "  idea alert as 通知 of app",
  "  idea over as 使いすぎ of alert",
  "",
  "step 共有の枝",
  "  say 共有の枝を伸ばす。",
  "  idea share as 共有 of app",
  "  idea family as 家族と見る of share",
  "",
].join("\n");

const idea = (id: string, name: string, parent?: string, color?: string): Json => ({
  type: "idea",
  id,
  name,
  ...(parent !== undefined ? { parent } : {}),
  ...(color !== undefined ? { color } : {}),
});

/** SMALL と同じ図の原本 (版2) */
function smallMind(): Json {
  return {
    version: 2,
    kind: "mind",
    title: "家計簿のアプリの機能",
    blocks: {},
    steps: [
      { title: "題を置く", body: "考える題を真ん中に置く。", events: [idea("app", "家計簿のアプリ")] },
      { title: "入力の枝", body: "入力の枝を伸ばす。", events: [idea("input", "入力", "app"), idea("scan", "レシートを読む", "input"), idea("hand", "手で書く", "input")] },
      { title: "集計の枝", body: "集計の枝を伸ばす。", events: [idea("sum", "集計", "app", "rose"), idea("month", "月ごと", "sum")] },
      { title: "通知の枝", body: "通知の枝を伸ばす。", events: [idea("alert", "通知", "app"), idea("over", "使いすぎ", "alert")] },
      { title: "共有の枝", body: "共有の枝を伸ばす。", events: [idea("share", "共有", "app"), idea("family", "家族と見る", "share")] },
    ],
  };
}

/** 段ごとの考え。段の番号と考えの名札と親 */
const ideasOf = (d: Source): { step: number; id: string; parent?: string }[] =>
  d.steps.flatMap((step, s) => step.events.flatMap((e) => (e.type === "idea" && e.id !== undefined ? [{ step: s, id: e.id, ...(e.parent !== undefined ? { parent: e.parent } : {}) }] : [])));

/** 誤りの行と列と文を確かめる。日本語の文は仮名か漢字を持ち、英語の文は持たない */
function expectRefused(text: string, name: string, want: { line: number; column?: number }): void {
  const parse = api("parseNotation");
  for (const lang of ["ja", "en"] as const) {
    const read = parse(text, { lang });
    expect(read.ok, `${name} を書いた考えを広げる地図が読めてしまう (${lang})`).toBe(false);
    const first: LineError | undefined = read.ok ? undefined : read.errors[0];
    const got = first && (want.column === undefined ? { line: first.line } : { line: first.line, column: first.column });
    expect(got, `${name} の誤りの行と列 (${lang}): ${first?.message}`).toEqual(want);
    const message = first?.message ?? "";
    expect(message, `${name} の誤りの文 (${lang})`).not.toBe("");
    if (lang === "en") expect(KANA.test(message), `${name} の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
    else expect(KANA.test(message), `${name} の日本語の誤りの文が日本語でない: ${message}`).toBe(true);
  }
}

describe("考えを広げる地図の原本の JSON (#3619)", () => {
  it("schema-accepts-mind-diagram", () => {
    const validate = api("validateDiagram");
    for (const lang of ["ja", "en"] as const) {
      const checked = validate(smallMind(), { lang });
      expect(checked.ok, `小さな考えを広げる地図が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    // 考えの出来事はほかの種類の図には書けない
    const tree = { version: 2, kind: "tree", title: "木", blocks: {}, steps: [{ title: "葉", body: "葉を出す。", events: [{ type: "leaf", id: "a" }, idea("b", "考え")] }] };
    const other = validate(tree);
    expect(other.ok, "木の図の段に考え (idea) を書いた原本が検査を通る").toBe(false);
  });
});

describe("考えを広げる地図の記法 (#3619)", () => {
  it("mind-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(print(parsed(SMALL)), "小さな考えを広げる地図を読んで書き戻した記法が元と違う").toBe(SMALL);
    // 記法から作った原本は、原本の JSON と同じ
    expect(parsed(SMALL), "小さな考えを広げる地図の記法から作った原本").toEqual(smallMind());
    // `as <名前>` を省いた考えは名札を名前にし、書き戻すと名札だけの行に戻る
    const bare = ["mind 名前を省く", "", "step 置く", "  say 名札だけで置く。", "  idea 題", "  idea 枝 of 題", ""].join("\n");
    expect(print(parsed(bare)), "名前を省いた考えを読んで書き戻した記法が元と違う").toBe(bare);
    for (const key of MIND_EXAMPLES) {
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const diagram = parsed(text, lang);
        expect((diagram as unknown as Source).kind, `${file} の図の種類`).toBe("mind");
        expect(print(diagram), `${file} を読んで書き戻した記法が元 (最初の注釈を除く) と違う`).toBe(withoutComments(text));
      }
    }
  });

  it("mind-rejects-an-idea-with-a-missing-parent", () => {
    const head = ["mind 題", "step 置く", "  say 置く。", "  idea app as 題"];
    const n = head.length;
    // 1 度も書いていない親と、後の段で書く親は、親の名札を指して止める
    const never = "  idea input as 入力 of nope";
    expectRefused([...head, never].join("\n"), "無い親を指す考え", { line: n + 1, column: never.indexOf("nope") + 1 });
    const later = "  idea scan as 読む of input";
    expectRefused([...head, later, "step 次", "  say 次。", "  idea input as 入力 of app"].join("\n"), "後で書く親を指す考え", {
      line: n + 1,
      column: later.indexOf("input") + 1,
    });
    // 前に書いた考えを親にした考えは読める
    const read = api("parseNotation")([...head, "  idea input as 入力 of app", "  idea scan as 読む of input"].join("\n"));
    expect(read.ok, `前に書いた考えを親にした考えが読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  });

  it("mind-rejects-other-than-one-centre", () => {
    // 真ん中の題が 2 つの図は、2 つ目の題の行を指して止める
    const two = ["mind 題", "step 置く", "  say 置く。", "  idea a as 一つ目", "  idea b as 二つ目"];
    expectRefused(two.join("\n"), "真ん中の題が 2 つの図", { line: 5, column: 3 });
    // 真ん中の題が 1 つも無い図は、図の種類の行を指して止める。考えが 1 つも無い図も同じ
    expectRefused(["mind 題", "step 置く", "  say 置く。"].join("\n"), "考えが 1 つも無い図", { line: 1 });
  });

  it("mind-rejects-ideas-deeper-than-three-levels", () => {
    // 題、枝、葉の 3 段まで書け、葉の子 (4 段目) は止める
    const head = ["mind 題", "step 置く", "  say 置く。", "  idea app as 題", "  idea input as 入力 of app", "  idea scan as 読む of input"];
    const read = api("parseNotation")(head.join("\n"));
    expect(read.ok, `題と枝と葉の 3 段の図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    expectRefused([...head, "  idea deep as 深い of scan"].join("\n"), "4 段目の考え", { line: head.length + 1, column: 3 });
  });

  it("mind-rejects-an-unknown-color", () => {
    // 考えの色は箱と同じ色の一覧から選ぶ。一覧に無い色は色の鍵を指し、箱に知らない色を書いた時と同じ誤りの文で止める (#3657)
    const head = ["mind 題", "step 置く", "  say 置く。", "  idea app as 題"];
    const bad = "  idea input as 入力 of app [color: gold]";
    expectRefused([...head, bad].join("\n"), "知らない色の考え", { line: head.length + 1, column: bad.indexOf("color") + 1 });
    const parse = api("parseNotation");
    for (const lang of ["ja", "en"] as const) {
      const idea = parse([...head, bad].join("\n"), { lang });
      const box = parse(["architecture 題", "box a as 箱 [color: gold]", "step 置く", "  say 置く。"].join("\n"), { lang });
      const said = (read: typeof idea): string => (read.ok ? "" : (read.errors[0]?.message ?? ""));
      expect(said(box), `箱に知らない色を書いた図が読めてしまう (${lang})`).not.toBe("");
      expect(said(idea), `考えの知らない色の誤りの文が箱の時と違う (${lang})`).toBe(said(box));
    }
    // 一覧に在る色は読める
    const read = parse([...head, "  idea input as 入力 of app [color: green]"].join("\n"));
    expect(read.ok, `一覧に在る色の考えが読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  });

  it("notation-keeps-mind-words-plain-outside-mind", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [`${kind} 考えの語の名札`, "box idea as 考え", "box mind as 地図", "step 送る", "  say 送る。", "  idea -> mind: 送る", "  mind -> idea: 戻す"].join("\n");
      const read = parse(text);
      expect(read.ok, `${kind} で idea と mind を名札にした箱が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
      const diagram = (read.ok ? read.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["idea", "mind"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind} の idea から出る線と入る線`).toEqual([
        { type: "edge", from: "idea", to: "mind" },
        { type: "edge", from: "mind", to: "idea" },
      ]);
    }
  });
});

describe("考えを広げる地図の並べ方と動き (#3619)", () => {
  it("mind-idea-appears-at-its-step", () => {
    const sources: [string, Json, "ja" | "en"][] = [["小さな地図", parsed(SMALL), "ja"]];
    for (const [file, lang] of [
      ["budget-app.dragon", "ja"],
      ["budget-app.en.dragon", "en"],
    ] as const) {
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      if (text !== undefined) sources.push([file, parsed(text, lang), lang]);
    }
    for (const [name, diagram, lang] of sources) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram, lang);
      const { timeline } = rendered;
      const motion = motionFrom(rendered as unknown as Rendered);
      const last = timeline.steps[timeline.steps.length - 1] as Span;
      for (const item of ideasOf(source)) {
        const span = timeline.steps[item.step] as Span;
        const what = `${name} の段 ${item.step + 1} の ${item.id}`;
        const group = motion.doc.querySelector(`[data-mind-idea="${item.id}"]`);
        expect(group, `${what} の考えの部品 ([data-mind-idea]) が描いた図に無い`).not.toBeNull();
        if (!group) continue;
        // 考えは書いた段の前は薄いか見えず、書いた段の終わりには濃く出て、最後の段まで残る
        if (item.step > 0) expect(motion.opacity(group, span.start - 0.05), `${what} が書いた段より前から濃く出ている`).toBeLessThan(0.5);
        expect(motion.opacity(group, span.end - 0.05), `${what} が書いた段の終わりに濃く出ていない`).toBeGreaterThan(0.9);
        expect(motion.opacity(group, (last.start + last.end) / 2), `${what} が最後の段で濃く残らない`).toBeGreaterThan(0.9);
        if (item.parent === undefined) continue;
        // 親からの枝の線は書いた段で引かれていき、段の終わりには引き終わっている
        const link = motion.doc.querySelector(`[data-mind-link="${item.parent}>${item.id}"]`);
        expect(link, `${what} の親 ${item.parent} からの線 ([data-mind-link]) が描いた図に無い`).not.toBeNull();
        if (!link) continue;
        const offset = (t: number): number => motion.value(link, "stroke-dashoffset", t)?.[0] ?? 0;
        expect(offset(span.start + 0.02), `${what} の線が書いた段の始めに引き終わっている`).toBeGreaterThan(0.5);
        expect(offset(span.end - 0.05), `${what} の線が書いた段の終わりに引き終わっていない`).toBeLessThan(0.01);
        expect(motion.opacity(link, span.end - 0.05), `${what} の線が書いた段の終わりに濃く出ていない`).toBeGreaterThan(0.9);
        if (item.step > 0) expect(motion.opacity(link, span.start - 0.05), `${what} の線が書いた段より前から濃く出ている`).toBeLessThan(0.5);
      }
    }
  });

  it("mind-branches-spread-four-ways", () => {
    const sources: [string, Json, "ja" | "en"][] = [["小さな地図", parsed(SMALL), "ja"]];
    for (const key of MIND_EXAMPLES)
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text !== undefined) sources.push([file, parsed(text, lang), lang]);
      }
    for (const [name, diagram, lang] of sources) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram, lang);
      const { layout } = rendered;
      const motion = motionFrom(rendered as unknown as Rendered);
      const all = ideasOf(source);
      const centre = all.find((i) => i.parent === undefined);
      expect(centre, `${name} に真ん中の題が無い`).toBeDefined();
      if (!centre) continue;
      const c = ideaOf(layout, centre.id);
      expect(c.level, `${name} の真ん中の題の段`).toBe(0);
      // 真ん中の題は図の真ん中に置く
      expect(Math.abs(c.cx - layout.width / 2), `${name} の真ん中の題が図の横の真ん中に無い`).toBeLessThan(1);
      const branches = all.filter((i) => i.parent === centre.id).map((i) => ideaOf(layout, i.id));
      expect(branches.length, `${name} の枝の数`).toBeGreaterThan(1);
      // 枝は左右に分け、数の差は 1 つまで
      const right = branches.filter((b) => b.cx > c.cx);
      const left = branches.filter((b) => b.cx < c.cx);
      expect(right.length + left.length, `${name} の真ん中の真上か真下に置いた枝が在る`).toBe(branches.length);
      expect(Math.abs(right.length - left.length), `${name} の左右の枝の数の差 (右 ${right.length}、左 ${left.length})`).toBeLessThanOrEqual(1);
      // 枝が 4 つの図は、書いた順に左上、右上、右下、左下の四方へ伸ばす
      if (branches.length === 4) {
        const quadrant = (b: MindIdea): string => `${b.cy < c.cy ? "上" : "下"}${b.cx < c.cx ? "左" : "右"}`;
        expect(branches.map(quadrant), `${name} の 4 つの枝の向き`).toEqual(["上左", "上右", "下右", "下左"]);
      }
      for (const b of branches) {
        expect(b.level, `${name} の枝 ${b.id} の段`).toBe(1);
        // 題から枝への線は曲線で描く
        const link = motion.doc.querySelector(`[data-mind-link="${centre.id}>${b.id}"]`);
        expect(link?.getAttribute("d") ?? "", `${name} の題から枝 ${b.id} への線が曲線 (C) でない`).toMatch(/C/u);
        const outward = Math.sign(b.cx - c.cx);
        const leaves = all.filter((i) => i.parent === b.id).map((i) => ideaOf(layout, i.id));
        for (const leaf of leaves) {
          expect(leaf.level, `${name} の葉 ${leaf.id} の段`).toBe(2);
          // 葉は枝と同じ側の、枝より外に置く
          expect(Math.sign(leaf.cx - c.cx), `${name} の葉 ${leaf.id} が枝 ${b.id} と同じ側に無い`).toBe(outward);
          expect((leaf.cx - b.cx) * outward, `${name} の葉 ${leaf.id} が枝 ${b.id} より外に無い`).toBeGreaterThan(0);
          const tie = motion.doc.querySelector(`[data-mind-link="${b.id}>${leaf.id}"]`);
          expect(tie?.getAttribute("d") ?? "", `${name} の枝 ${b.id} から葉 ${leaf.id} への線が曲線 (C) でない`).toMatch(/C/u);
        }
      }
      // 考えの枠どうしは重ならず、どれも図の枠の中に在る
      const ideas = layout.ideas ?? [];
      for (const [i, a] of ideas.entries()) {
        expect(a.x >= 0 && a.y >= 0 && a.x + a.w <= layout.width && a.y + a.h <= layout.height, `${name} の ${a.id} が図の枠の外へ出る`).toBe(true);
        for (const b of ideas.slice(i + 1)) {
          const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
          expect(apart, `${name} の ${a.id} と ${b.id} の枠が重なる`).toBe(true);
        }
      }
    }
  });

  it("mind-branch-color-flows-to-leaves", () => {
    const rendered = render(parsed(SMALL));
    const { layout } = rendered;
    const motion = motionFrom(rendered as unknown as Rendered);
    const source = smallMind() as unknown as Source;
    const all = ideasOf(source);
    const branches = all.filter((i) => i.parent === "app").map((i) => ideaOf(layout, i.id));
    // 色を書いた枝 (集計) はその色、色の無い枝は書いた順に色を配り、色を書いた枝の分を飛ばさない
    expect(ideaOf(layout, "sum").color, "色を書いた枝 sum の色").toBe("rose");
    const plain = branches.filter((b) => b.id !== "sum");
    expect(new Set(plain.map((b) => b.color)).size, `色の無い枝に同じ色を配った: ${plain.map((b) => `${b.id}=${b.color}`).join(", ")}`).toBe(plain.length);
    // 色の無い枝の色は、書いた順と同じ図をもう 1 度描いても同じ (書いた順で決まる)
    const again = render(parsed(SMALL)).layout;
    expect(plain.map((b) => ideaOf(again, b.id).color), "色の無い枝の色が描くたびに変わる").toEqual(plain.map((b) => b.color));
    // 枝の色が、その枝の線と、葉の枠と、葉への線に引き継がれる
    for (const b of branches) {
      const box = motion.doc.querySelector(`[data-mind-idea="${b.id}"]`);
      expect(colorOf(box), `枝 ${b.id} の枠の色`).toBe(b.color);
      expect(colorOf(motion.doc.querySelector(`[data-mind-link="app>${b.id}"]`)), `題から枝 ${b.id} への線の色`).toBe(b.color);
      for (const leaf of all.filter((i) => i.parent === b.id)) {
        expect(ideaOf(layout, leaf.id).color, `枝 ${b.id} の葉 ${leaf.id} の色`).toBe(b.color);
        expect(colorOf(motion.doc.querySelector(`[data-mind-idea="${leaf.id}"]`)), `枝 ${b.id} の葉 ${leaf.id} の枠の色`).toBe(b.color);
        expect(colorOf(motion.doc.querySelector(`[data-mind-link="${b.id}>${leaf.id}"]`)), `枝 ${b.id} から葉 ${leaf.id} への線の色`).toBe(b.color);
      }
    }
  });
});

/** 葉が 6 枚の枝 (検査) と、葉の無い枝 (記録) と、葉が 1 枚の枝 (配る) を持つ地図 (#3960)。検査の葉は 3 段目に 3 枚、4 段目に 3 枚が現れる */
const SIX = {
  ja: [
    "mind 作業の道具",
    "",
    "step 題を置く",
    "  say 考える題を真ん中に置く。",
    "  idea tool as 作業の道具",
    "",
    "step 入口の枝",
    "  say 道具を使い始める所を枝に出す。",
    "  idea entry as 入口 of tool [color: blue]",
    "  idea cli as 命令の行 of entry",
    "  idea app as 画面 of entry",
    "",
    "step 検査の枝",
    "  say 変えた物を確かめる検査を葉に書き出す。",
    "  idea check as 検査 of tool",
    "  idea types as 型の検査 of check",
    "  idea format as 書式の検査 of check",
    "  idea unit as 単体のテスト of check",
    "",
    "step 検査の葉を足す",
    "  say 残りの検査も同じ枝に足す。",
    "  idea screen as 画面のテスト of check",
    "  idea speed as 速さの計測 of check",
    "  idea keys as 鍵の検査 of check",
    "",
    "step 記録の枝",
    "  say 回した結果を残す所を枝に出す。",
    "  idea log as 記録 of tool",
    "",
    "step 配る枝",
    "  say 出来た物を届ける先を枝に出す。",
    "  idea ship as 配る of tool",
    "  idea npm as npmの版 of ship",
    "",
  ].join("\n"),
  en: [
    "mind Work tools",
    "",
    "step Put the title",
    "  say Put the topic in the middle.",
    "  idea tool as Work tools",
    "",
    "step Entry branch",
    "  say A branch for where people start.",
    "  idea entry as Entry of tool [color: blue]",
    "  idea cli as Command line of entry",
    "  idea app as Screen of entry",
    "",
    "step Checks branch",
    "  say Leaves list the checks for a change.",
    "  idea check as Checks of tool",
    "  idea types as Type check of check",
    "  idea format as Format check of check",
    "  idea unit as Unit tests of check",
    "",
    "step More checks",
    "  say The rest of the checks join the same branch.",
    "  idea screen as Screen tests of check",
    "  idea speed as Speed runs of check",
    "  idea keys as Key scan of check",
    "",
    "step Records branch",
    "  say A branch for where results are kept.",
    "  idea log as Records of tool",
    "",
    "step Ship branch",
    "  say A branch for where the work goes.",
    "  idea ship as Ship of tool",
    "  idea npm as npm release of ship",
    "",
  ].join("\n"),
} as const;

type Pt = [number, number];

/** 道の `d` の最初の点と最後の点 */
function endsOf(d: string): { start: Pt; end: Pt } {
  const nums = (d.match(/-?\d+(?:\.\d+)?/gu) ?? []).map(Number);
  return { start: [nums[0] ?? Number.NaN, nums[1] ?? Number.NaN], end: [nums[nums.length - 2] ?? Number.NaN, nums[nums.length - 1] ?? Number.NaN] };
}

const near = (a: Pt, b: Pt): boolean => Math.abs(a[0] - b[0]) <= 0.5 && Math.abs(a[1] - b[1]) <= 0.5;
const at = (p: Pt): string => `(${p[0].toFixed(1)}, ${p[1].toFixed(1)})`;

/** 子を持つ親と、子を置いた側 (左が -1、右が 1) ごとの子の並び。真ん中の題は左右の 2 組になる */
function familiesOf(layout: MindLayout, source: Source): { parent: MindIdea; side: number; kids: { idea: MindIdea; step: number }[] }[] {
  const all = ideasOf(source);
  const families = new Map<string, { parent: MindIdea; side: number; kids: { idea: MindIdea; step: number }[] }>();
  for (const item of all) {
    if (item.parent === undefined) continue;
    const parent = ideaOf(layout, item.parent);
    const idea = ideaOf(layout, item.id);
    const side = Math.sign(idea.cx - parent.cx);
    const key = `${parent.id}:${side}`;
    const family = families.get(key) ?? { parent, side, kids: [] };
    family.kids.push({ idea, step: item.step });
    families.set(key, family);
  }
  return [...families.values()];
}

/** 親の名札を持つ幹の部品 (`data-mind-trunk="<親>"`) のうち、`side` の側へ伸びる物 */
function trunksOf(doc: Document, parent: string, side: number): Element[] {
  return [...doc.querySelectorAll("[data-mind-trunk]")].filter((el) => {
    if (el.getAttribute("data-mind-trunk") !== parent) return false;
    const { start, end } = endsOf(el.getAttribute("d") ?? "");
    return Math.sign(end[0] - start[0]) === side;
  });
}

/** 図を読んで描いた物。名前と、描いた図と、原本 */
function drawn(name: string, text: string, lang: "ja" | "en"): { name: string; rendered: MindRendered; source: Source; motion: ReturnType<typeof motionFrom> } {
  const diagram = parsed(text, lang);
  const rendered = render(diagram, lang);
  return { name, rendered, source: diagram as unknown as Source, motion: motionFrom(rendered as unknown as Rendered) };
}

const sixSources = (): ReturnType<typeof drawn>[] => [drawn("葉が6枚の地図", SIX.ja, "ja"), drawn("six-leaf map", SIX.en, "en")];

describe("親から子への線を親の縁の 1 点から出る幹にまとめる (#3960)", () => {
  it("mind-links-leave-parent-from-one-point", () => {
    for (const { name, rendered, source, motion } of [drawn("小さな地図", SMALL, "ja"), ...sixSources()]) {
      for (const { parent, side } of familiesOf(rendered.layout, source)) {
        const what = `${name} の ${parent.id} から${side > 0 ? "右" : "左"}の子への線`;
        const trunks = trunksOf(motion.doc, parent.id, side);
        expect(trunks.length, `${what} が、親の縁から出る幹 ([data-mind-trunk="${parent.id}"]) を持たない`).toBe(1);
        const trunk = trunks[0];
        if (!trunk) continue;
        // 幹は親の箱の、子の側の縁の高さの真ん中から出る
        const edge: Pt = [side > 0 ? parent.x + parent.w : parent.x, parent.cy];
        const { start } = endsOf(trunk.getAttribute("d") ?? "");
        expect(near(start, edge), `${what} の幹が ${at(start)} から出て、親の縁の真ん中 ${at(edge)} から出ない`).toBe(true);
      }
    }
  });

  it("mind-trunk-splits-at-one-fork", () => {
    for (const { name, rendered, source, motion } of [drawn("小さな地図", SMALL, "ja"), ...sixSources()]) {
      for (const { parent, side, kids } of familiesOf(rendered.layout, source)) {
        const what = `${name} の ${parent.id} から${side > 0 ? "右" : "左"}の子への線`;
        const trunk = trunksOf(motion.doc, parent.id, side)[0];
        expect(trunk, `${what} が、親の縁から出る幹 ([data-mind-trunk="${parent.id}"]) を持たない`).toBeDefined();
        if (!trunk) continue;
        const { start, end } = endsOf(trunk.getAttribute("d") ?? "");
        // 子の縁は同じ列に揃い、幹は親の縁から子の縁までの 35% の所で終わる
        const edgeOf = (idea: MindIdea): number => (side > 0 ? idea.x : idea.x + idea.w);
        const kidEdge = edgeOf((kids[0] as { idea: MindIdea }).idea);
        for (const { idea } of kids) expect(Math.abs(edgeOf(idea) - kidEdge), `${what} の子 ${idea.id} の縁が、ほかの子の縁と揃わない`).toBeLessThanOrEqual(0.5);
        const fork: Pt = [start[0] + (kidEdge - start[0]) * 0.35, start[1]];
        expect(near(end, fork), `${what} の幹が ${at(end)} で終わり、子の縁までの 35% の所 ${at(fork)} で終わらない`).toBe(true);
        // 子への曲線は全て幹の先の 1 点から出て、子の縁の高さの真ん中へ入る
        for (const { idea } of kids) {
          const link = motion.doc.querySelector(`[data-mind-link="${parent.id}>${idea.id}"]`);
          const ends = endsOf(link?.getAttribute("d") ?? "");
          expect(near(ends.start, end), `${what} の子 ${idea.id} への曲線が ${at(ends.start)} から出て、幹の先 ${at(end)} から出ない`).toBe(true);
          const into: Pt = [edgeOf(idea), idea.cy];
          expect(near(ends.end, into), `${what} の子 ${idea.id} への曲線が ${at(ends.end)} で終わり、子の縁の真ん中 ${at(into)} へ入らない`).toBe(true);
        }
      }
    }
  });

  it("mind-trunk-drawn-once-in-parent-color", () => {
    for (const { name, rendered, source, motion } of [drawn("小さな地図", SMALL, "ja"), ...sixSources()]) {
      for (const { parent, side, kids } of familiesOf(rendered.layout, source)) {
        const what = `${name} の ${parent.id} から${side > 0 ? "右" : "左"}の子への幹`;
        const trunks = trunksOf(motion.doc, parent.id, side);
        expect(trunks.length, `${what} の数`).toBe(1);
        const trunk = trunks[0];
        if (!trunk) continue;
        // 幹は親の色で描き、子への曲線は子の色で描く
        expect(colorOf(trunk), `${what} の色`).toBe(parent.color);
        for (const { idea } of kids) expect(colorOf(motion.doc.querySelector(`[data-mind-link="${parent.id}>${idea.id}"]`)), `${what} から子 ${idea.id} への曲線の色`).toBe(idea.color);
      }
    }
  });

  it("mind-no-trunk-without-children", () => {
    for (const { name, rendered, source, motion } of [drawn("小さな地図", SMALL, "ja"), ...sixSources()]) {
      // 幹を持つ考えは子を持つ親だけで、葉と葉の無い枝は幹を持たない
      const owners = [...new Set([...motion.doc.querySelectorAll("[data-mind-trunk]")].map((el) => el.getAttribute("data-mind-trunk") ?? ""))].sort();
      const parents = [...new Set(familiesOf(rendered.layout, source).map((f) => f.parent.id))].sort();
      expect(owners, `${name} で幹を描いた考え`).toEqual(parents);
    }
  });

  it("mind-trunk-drawn-with-first-child", () => {
    for (const { name, rendered, source, motion } of sixSources()) {
      const { timeline } = rendered;
      for (const { parent, side, kids } of familiesOf(rendered.layout, source)) {
        const what = `${name} の ${parent.id} から${side > 0 ? "右" : "左"}の子への幹`;
        const trunk = trunksOf(motion.doc, parent.id, side)[0];
        expect(trunk, `${what} が無い`).toBeDefined();
        if (!trunk) continue;
        const offset = (t: number): number => motion.value(trunk, "stroke-dashoffset", t)?.[0] ?? 0;
        const first = Math.min(...kids.map((k) => k.step));
        const span = timeline.steps[first] as Span;
        // 最初の子が現れる段より前は薄く、その段で親の側から引かれ、段の終わりには引き終わる
        expect(motion.opacity(trunk, span.start - 0.05), `${what} が最初の子の段 ${first + 1} より前から濃く出ている`).toBeLessThan(0.5);
        expect(offset(span.start + 0.02), `${what} が最初の子の段 ${first + 1} の始めに引き終わっている`).toBeGreaterThan(0.5);
        expect(offset(span.end - 0.05), `${what} が最初の子の段 ${first + 1} の終わりに引き終わっていない`).toBeLessThan(0.01);
        expect(motion.opacity(trunk, span.end - 0.05), `${what} が最初の子の段 ${first + 1} の終わりに濃く出ていない`).toBeGreaterThan(0.9);
        // 後の子が現れる段では引き直さず、濃いまま残る
        for (const later of [...new Set(kids.map((k) => k.step))].filter((s) => s > first)) {
          const t = (timeline.steps[later] as Span).start + 0.02;
          expect(offset(t), `${what} を後の子の段 ${later + 1} で引き直している`).toBeLessThan(0.01);
          expect(motion.opacity(trunk, t), `${what} が後の子の段 ${later + 1} で濃く残らない`).toBeGreaterThan(0.9);
        }
      }
    }
  });

  it("mind-six-leaves-have-no-breaks", () => {
    for (const lang of ["ja", "en"] as const) {
      const { name, motion } = drawn(lang === "ja" ? "葉が6枚の地図" : "six-leaf map", SIX[lang], lang);
      // 葉が 6 枚の枝 (検査) は幹から分かれる線で描き、その図に崩れが無い
      expect(trunksOf(motion.doc, "check", 1).length, `${name} の 6 枚の葉を持つ枝 check が幹を持たない`).toBe(1);
      expect(
        checkLayoutText(SIX[lang], { lang }).map((b) => JSON.stringify(b)),
        `${name} の崩れ`,
      ).toEqual([]);
    }
  });

  it("mind-examples-draw-trunks", () => {
    for (const key of MIND_EXAMPLES)
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const { rendered, source, motion } = drawn(file, text, lang);
        // 子を持つ考えごとに、子を置いた側ごとに 1 本の幹を描く
        for (const { parent, side } of familiesOf(rendered.layout, source))
          expect(trunksOf(motion.doc, parent.id, side).length, `${file} の ${parent.id} から${side > 0 ? "右" : "左"}の子への幹の数`).toBe(1);
      }
  });
});
