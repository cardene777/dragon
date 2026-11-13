// @vitest-environment jsdom
/**
 * 量の行き先の図の段ごとの帯の見た目 (#3641)。
 *
 * 量の行き先の図 (`sankey`) の見た目に `[shape: rows]` を足す。今の帯の図と同じ `box` の行と段の中の `<出どころ> -> <行き先>: <量>` の線のまま、
 * 段ごとに図の幅いっぱいの帯を1行ずつ上から積み、各行をその段までの線で分かれた区画に分ける。区画の幅は出どころの無い箱の量の和に比べた量で決め、
 * 分かれた区画は出どころの区画の幅の内に、線を書いた順で左から置く。
 * その段で新しく分かれた区画と最後の行の区画は名前と量を書き、前の段から続いている区画は字を書かずに薄い帯だけにする。
 * 出どころの無い箱のまだ分けていない残りは、点線の枠を描かずに灰色の帯にし、`残り16時間` の形で残りの量を書く。
 * 上の行から下の行へ下りる帯と量の札は、その段で新しく分かれた区画にだけ引く。
 * 名前が区画に入らない時は、区画に量だけを書き (量も入らなければ字を書かず)、その行の帯の下に色の印と名前を並べる。
 * 見た目の元は step 2 で決めた案 (クローンの予想を採った)。
 *
 * 置き場所は描く部品が返す値で確かめる。行は `layout.rows` (区画は `sections`、帯の下の名前は `names`)、下りる帯は `layout.drops`、量の札の道は `layout.edges` に返る。
 * 部品は、行が `data-sankey-row`、区画が `data-sankey-section` (種類は `data-sankey-kind`)、残りが `data-sankey-rest`、下りる帯が `data-sankey-drop` を持つ。
 * 行の見え方は描いた SVG の keyframes を jsdom で読み、各段の止め絵の時刻で確かめる。
 * 見本の file と段ごとの帯の見た目がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import { motionFrom } from "./motion-support";
import { draw, type Rect, type Rendered } from "./render-support";

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

/** 段ごとの帯の見た目の見本。1日24時間の使い方 */
const SAMPLE = "day-hours";

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 携帯の幅 */
const PHONE = 390;

interface Source {
  kind: string;
  title: string;
  sankey?: { shape?: string };
  blocks: { box?: { id: string; name: string; color?: string }[] };
  steps: {
    title: string;
    body?: string;
    events: { type: string; from?: string; to?: string; label?: string }[];
  }[];
}

/** 字の置き場所。`rect` は字の四角 */
interface RowText {
  text: string;
  x: number;
  y: number;
  rect: Rect;
}

/**
 * 行の区画。`id` は区画の名札で、箱の区画は箱の名札、残りは `rest:<出どころの無い箱の名札>`。`box` は区画が表す箱。
 * `kind` は、その段で新しく分かれた区画 (`new`)、前の段から続いている区画 (`carried`)、出どころの無い箱のまだ分けていない残り (`rest`)。
 * `name` と `value` は区画の中に書く名前と量
 */
interface RowSection extends Rect {
  id: string;
  box: string;
  kind: "new" | "carried" | "rest";
  color: string;
  amount: number;
  name?: RowText;
  value?: RowText;
}

/** 帯の下に並べる名前。`mark` は色の印の四角 */
interface RowName {
  id: string;
  color: string;
  mark: Rect;
  name: RowText;
}

/** 段ごとの行。行の四角は図の幅いっぱいの帯 */
interface Row extends Rect {
  step: number;
  sections: RowSection[];
  names: RowName[];
}

/** 上の行から下の行へ下りる帯。`x` と `w` は下りる帯の幅、`y1` は上の行の下の縁、`y2` は下の行の上の縁 */
interface Drop {
  step: number;
  from: string;
  to: string;
  x: number;
  w: number;
  y1: number;
  y2: number;
}

interface RowsLayout {
  kind: string;
  arrangement?: string;
  width: number;
  height: number;
  rows?: Row[];
  drops?: Drop[];
  edges: { step: number; from: string; to: string; points: [number, number][] }[];
}

interface RowsRendered extends Omit<Rendered, "layout"> {
  layout: RowsLayout;
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string =>
  existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "";

const flow = (from: string, to: string, label: string): Json => ({
  type: "edge",
  from,
  to,
  label,
  carry: { kind: "envelope" },
});

/** 小さな図の箱。名札、名前、色 */
const SMALL_BOXES: [string, string, string][] = [
  ["day", "1日", "slate"],
  ["sleep", "寝る", "blue"],
  ["awake", "起きている", "amber"],
  ["work", "仕事", "violet"],
  ["home", "家のこと", "green"],
  ["move", "移動にかかる時間", "rose"],
];

/**
 * 1日24時間を、寝る時間と起きている時間に分け、起きている時間を仕事と家のことと移動に分ける小さな図。
 * 段 1 は線を持たず、段 2 で寝る時間を分けて残りを出し、段 3 で残りを起きている時間にし、段 4 で起きている時間を 3 つに分ける。
 * 移動の区画は狭く、名前が区画に入らない。`shape` を外すと、同じ箱と段の今の帯の図になる
 */
function smallRows(shape: string | null = "rows"): Json {
  return {
    version: 2,
    kind: "sankey",
    title: "小さな1日",
    ...(shape === null ? {} : { sankey: { shape } }),
    blocks: { box: SMALL_BOXES.map(([id, name, color]) => ({ id, name, color })) },
    steps: [
      { title: "1日", body: "1日は24時間。", events: [] },
      { title: "寝る", body: "8時間寝る。", events: [flow("day", "sleep", "8時間")] },
      {
        title: "起きている",
        body: "残りの16時間は起きている。",
        events: [flow("day", "awake", "16時間")],
      },
      {
        title: "分ける",
        body: "起きている時間を仕事と家のことと移動に分ける。",
        events: [
          flow("awake", "work", "8時間"),
          flow("awake", "home", "6時間"),
          flow("awake", "move", "2時間"),
        ],
      },
    ],
  };
}

/** 小さな図の書き戻した記法 */
const SMALL_TEXT = [
  "sankey 小さな1日 [shape: rows]",
  "",
  ...SMALL_BOXES.map(([id, name, color]) => `box ${id} as ${name} [color: ${color}]`),
  "",
  "step 1日",
  "  say 1日は24時間。",
  "",
  "step 寝る",
  "  say 8時間寝る。",
  "  day -> sleep: 8時間",
  "",
  "step 起きている",
  "  say 残りの16時間は起きている。",
  "  day -> awake: 16時間",
  "",
  "step 分ける",
  "  say 起きている時間を仕事と家のことと移動に分ける。",
  "  awake -> work: 8時間",
  "  awake -> home: 6時間",
  "  awake -> move: 2時間",
  "",
].join("\n");

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: Lang = "ja", width?: number): RowsRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "段ごとの帯の見た目の量の行き先の図を描けない").toBe("");
  return rendered as unknown as RowsRendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok
    ? read.diagram
    : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 段ごとの帯の行。段ごとの帯の見た目で並べていなければ落とす */
function rowsOf(rendered: RowsRendered, where: string): Row[] {
  const { layout } = rendered;
  expect(layout.arrangement, `${where} を段ごとの帯の見た目で並べていない`).toBe("rows");
  expect(layout.rows, `${where} に段ごとの行 (layout.rows) が無い`).toBeDefined();
  return layout.rows ?? [];
}

/** 四角 `inner` が四角 `outer` の中に在るか */
const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x - 0.5 &&
  inner.y >= outer.y - 0.5 &&
  inner.x + inner.w <= outer.x + outer.w + 0.5 &&
  inner.y + inner.h <= outer.y + outer.h + 0.5;

/** 2 つの四角が重なるか */
const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;

/**
 * 区画が受け持つ幅。隣の区画との間の真ん中で区切り、行の端の区画は行の端までを受け持つ。
 * 区画どうしの隙間は区画の描く四角に入れず、受け持つ幅で量と比べる
 */
function spansOf(row: Row): { id: string; left: number; right: number }[] {
  const { sections } = row;
  return sections.map((s, i) => {
    const prev = sections[i - 1];
    const next = sections[i + 1];
    return {
      id: s.id,
      left: prev ? (prev.x + prev.w + s.x) / 2 : row.x,
      right: next ? (s.x + s.w + next.x) / 2 : row.x + row.w,
    };
  });
}

/** 記法の行の、注釈と空の行を除いた並び */
const codeLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "" && !line.trimStart().startsWith("//"));

/** 原本の見た目と箱と段と段ごとの線の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.sankey?.shape,
  boxes: (d.blocks.box ?? []).map((b) => b.id),
  steps: d.steps.length,
  lines: d.steps.map((step) =>
    step.events.filter((e) => e.type === "edge").map((e) => `${e.from}>${e.to}`),
  ),
});

/** 見本の記法と、描く原本 */
function samples(): { where: string; text: string; source: Source; lang: Lang }[] {
  return LANGS.flatMap((lang) => {
    const file = `${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`;
    const text = fileText(file);
    expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
    return text === undefined
      ? []
      : [{ where: file, text, source: parsed(text, lang, file), lang }];
  });
}

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1)
    await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});

describe("段ごとの帯の見た目の原本の JSON (#3641)", () => {
  it("schema-accepts-sankey-rows", () => {
    const validate = api("validateDiagram");
    const checked = validate(smallRows());
    expect(
      checked.ok,
      `段ごとの帯の見た目の原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`,
    ).toBe(true);
    // rows のほかの見た目は、根の sankey の欄を指して断る
    for (const shape of ["bars", "layers"]) {
      const wrong = validate(smallRows(shape));
      expect(wrong.ok, `量の行き先の図の見た目 ${shape} が検査を通る`).toBe(false);
      expect(
        pointers(wrong).some((p) => p.startsWith("/sankey")),
        `見た目 ${shape} の誤りの場所: ${pointers(wrong).join(", ")}`,
      ).toBe(true);
    }
    // 見本の記法から作った原本も検査を通る
    for (const { where, source } of samples()) {
      const sample = validate(source);
      expect(
        sample.ok,
        `${where} の原本が検査で落ちる: ${JSON.stringify(sample.ok ? [] : sample.errors)}`,
      ).toBe(true);
    }
  });
});

describe("段ごとの帯の見た目の記法 (#3641)", () => {
  it("sankey-rows-roundtrip-keeps-notation", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    // 小さな図の記法は、読むと小さな図の原本になり、書き戻すと同じ記法に戻る
    const small = parse(SMALL_TEXT, { lang: "ja" });
    expect(
      small.ok,
      `小さな図の記法が読めない: ${small.ok ? "" : JSON.stringify(small.errors)}`,
    ).toBe(true);
    if (small.ok) {
      expect((small.diagram as unknown as Source).sankey?.shape, "小さな図の見た目").toBe("rows");
      expect(codeLines(print(small.diagram)), "小さな図を書き戻した記法が書いた記法と違う").toEqual(
        codeLines(SMALL_TEXT),
      );
    }
    const read = api("readDiagram")(smallRows());
    expect(read.ok, `小さな図の原本が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(
      true,
    );
    if (read.ok) {
      const printed = print(read.diagram);
      expect(printed.split("\n")[0], "小さな図の原本を書き戻した頭の行").toBe(
        "sankey 小さな1日 [shape: rows]",
      );
      const again = parse(printed, { lang: "ja" });
      expect(
        again.ok ? again.diagram : undefined,
        `小さな図を往復した JSON が最初と違う\n${printed}`,
      ).toEqual(read.diagram);
    }
    for (const { where, text, source, lang } of samples()) {
      expect(source.sankey?.shape, `${where} の見た目`).toBe("rows");
      const printed = print(source);
      expect(codeLines(printed), `${where} を書き戻した記法が書いた記法と違う`).toEqual(
        codeLines(text),
      );
      expect(codeLines(printed)[0], `${where} を書き戻した頭の行`).toMatch(
        /^sankey .+ \[shape: rows\]$/u,
      );
      const second = parse(printed, { lang });
      expect(
        second.ok ? second.diagram : undefined,
        `${where} を往復した JSON が最初と違う`,
      ).toEqual(source);
    }
  });
});

describe("段ごとの帯の見た目の描き方 (#3641)", () => {
  it("sankey-rows-stack-one-row-per-step", () => {
    const rendered = render(smallRows());
    const rows = rowsOf(rendered, "小さな図");
    const steps = 4;
    expect(rows.length, "小さな図の行の数が段の数と違う").toBe(steps);
    const total = 24;
    rows.forEach((row, k) => {
      expect(row.step, `行 ${k + 1} の段`).toBe(k);
      // 行は図の幅いっぱいで、全ての行が同じ左右の端を持つ
      expect(row.x, `行 ${k + 1} の左の端が行 1 と違う`).toBeCloseTo(rows[0]?.x ?? -1, 1);
      expect(row.w, `行 ${k + 1} の幅が行 1 と違う`).toBeCloseTo(rows[0]?.w ?? -1, 1);
      expect(row.w, `行 ${k + 1} の幅が図の幅の 8 割に届かない`).toBeGreaterThan(
        rendered.layout.width * 0.8,
      );
      // 行は上から段の順に積み、重ならない
      const prev = rows[k - 1];
      if (prev)
        expect(row.y, `行 ${k + 1} が行 ${k} の下に無い`).toBeGreaterThanOrEqual(prev.y + prev.h);
      // 区画は行の中に左から並び、受け持つ幅は量を出どころの無い箱の量の和に比べた幅
      row.sections.forEach((s, i) => {
        expect(inside(s, row), `行 ${k + 1} の区画 ${s.id} が行の中に無い`).toBe(true);
        const next = row.sections[i + 1];
        if (next)
          expect(
            next.x,
            `行 ${k + 1} の区画 ${next.id} が ${s.id} の右に無い`,
          ).toBeGreaterThanOrEqual(s.x + s.w);
      });
      for (const span of spansOf(row)) {
        const s = row.sections.find((x) => x.id === span.id) as RowSection;
        expect(
          span.right - span.left,
          `行 ${k + 1} の区画 ${s.id} の受け持つ幅が量 ${s.amount} に比べた幅と違う`,
        ).toBeCloseTo((s.amount / total) * row.w, 0);
      }
    });
    // 各行の区画。段 2 で寝る時間を分けて残りを出し、段 3 で残りを起きている時間にし、段 4 で起きている時間を 3 つに分ける
    expect(
      rows.map((row) => row.sections.map((s) => s.id)),
      "行ごとの区画の並び",
    ).toEqual([
      ["day"],
      ["sleep", "rest:day"],
      ["sleep", "awake"],
      ["sleep", "work", "home", "move"],
    ]);
    // 分かれた区画は、上の行の出どころの区画の受け持つ幅の内に、線を書いた順で左から置く
    const parentSpan = spansOf(rows[2] as Row).find((s) => s.id === "awake");
    expect(parentSpan, "行 3 に起きている時間の区画が無い").toBeDefined();
    for (const span of spansOf(rows[3] as Row).filter((s) =>
      ["work", "home", "move"].includes(s.id),
    )) {
      expect(
        span.left,
        `行 4 の ${span.id} が起きている時間の区画の左の端より左に在る`,
      ).toBeGreaterThanOrEqual((parentSpan?.left ?? 0) - 0.5);
      expect(
        span.right,
        `行 4 の ${span.id} が起きている時間の区画の右の端より右に在る`,
      ).toBeLessThanOrEqual((parentSpan?.right ?? 0) + 0.5);
    }
    // 行は段を追って現れる。行 k は段 k の止め絵で見え、その前の段の止め絵では見えない
    const motion = motionFrom(rendered as unknown as Rendered);
    const { stills } = rendered.timeline;
    expect(motion.doc.querySelectorAll("[data-sankey-row]").length, "描いた行の部品の数").toBe(
      steps,
    );
    rows.forEach((_, k) => {
      const el = motion.doc.querySelector(`[data-sankey-row="${k}"]`);
      expect(el, `行 ${k + 1} の部品 (data-sankey-row="${k}") が無い`).not.toBeNull();
      if (!el) return;
      expect(
        motion.opacity(el, stills[k] ?? 0),
        `行 ${k + 1} が段 ${k + 1} の止め絵で見えない`,
      ).toBeGreaterThan(0.9);
      if (k > 0)
        expect(
          motion.opacity(el, stills[k - 1] ?? 0),
          `行 ${k + 1} が段 ${k} の止め絵で見える`,
        ).toBeLessThan(0.1);
    });
  });

  it("sankey-rows-carried-sections-stay-quiet", () => {
    for (const lang of LANGS) {
      const rendered = render(smallRows(), lang);
      const rows = rowsOf(rendered, `小さな図 (${lang})`);
      const names = new Map(SMALL_BOXES.map(([id, name]) => [id, name]));
      const labels = new Map([
        ["day", "24時間"],
        ["sleep", "8時間"],
        ["awake", "16時間"],
        ["work", "8時間"],
        ["home", "6時間"],
        ["move", "2時間"],
      ]);
      const last = rows.length - 1;
      rows.forEach((row, k) => {
        for (const s of row.sections) {
          if (s.kind === "rest") continue;
          const listed = row.names.some((n) => n.id === s.id);
          if (s.kind === "carried" && k < last) {
            // 続いている区画は、最後の行のほかでは字を書かない
            expect(
              s.name,
              `行 ${k + 1} の続いている区画 ${s.id} に名前を書く (${lang})`,
            ).toBeUndefined();
            expect(
              s.value,
              `行 ${k + 1} の続いている区画 ${s.id} に量を書く (${lang})`,
            ).toBeUndefined();
            expect(
              listed,
              `行 ${k + 1} の続いている区画 ${s.id} の名前を帯の下に並べる (${lang})`,
            ).toBe(false);
            continue;
          }
          // 新しく分かれた区画と最後の行の区画は、名前を区画の中か帯の下に書き、量を区画の中か帯の下に書く
          expect(
            s.name !== undefined || listed,
            `行 ${k + 1} の区画 ${s.id} の名前がどこにも無い (${lang})`,
          ).toBe(true);
          if (s.name) {
            expect(s.name.text, `行 ${k + 1} の区画 ${s.id} の名前 (${lang})`).toBe(
              names.get(s.box),
            );
            expect(
              inside(s.name.rect, s),
              `行 ${k + 1} の区画 ${s.id} の名前が区画からはみ出る (${lang})`,
            ).toBe(true);
          }
          if (s.value) {
            expect(s.value.text, `行 ${k + 1} の区画 ${s.id} の量 (${lang})`).toBe(
              labels.get(s.box),
            );
            expect(
              inside(s.value.rect, s),
              `行 ${k + 1} の区画 ${s.id} の量がはみ出る (${lang})`,
            ).toBe(true);
          } else {
            expect(listed, `行 ${k + 1} の区画 ${s.id} の量がどこにも無い (${lang})`).toBe(true);
          }
        }
      });
      // 描いた続いている区画 (最後の行のほか) は字の部品を持たない
      const motion = motionFrom(rendered as unknown as Rendered);
      for (let k = 0; k < last; k += 1) {
        const quiet = [
          ...motion.doc.querySelectorAll(`[data-sankey-row="${k}"] [data-sankey-kind="carried"]`),
        ];
        for (const el of quiet)
          expect(
            el.querySelectorAll("text").length,
            `行 ${k + 1} の続いている区画 ${el.getAttribute("data-sankey-section")} が字を描く (${lang})`,
          ).toBe(0);
      }
      expect(
        motion.doc.querySelectorAll('[data-sankey-row="2"] [data-sankey-kind="carried"]').length,
        `行 3 の続いている区画の部品の数 (${lang})`,
      ).toBe(1);
    }
  });

  it("sankey-rows-rest-is-a-gray-bar", () => {
    for (const [lang, want] of [
      ["ja", "残り16時間"],
      ["en", "16時間 left"],
    ] as const) {
      const rendered = render(smallRows(), lang);
      const rows = rowsOf(rendered, `小さな図 (${lang})`);
      // 残りは寝る時間を分けた段の行にだけ在り、灰色の帯に残りの量を書く
      const rests = rows.flatMap((row) =>
        row.sections.filter((s) => s.kind === "rest").map((s) => ({ row, s })),
      );
      expect(
        rests.map(({ row, s }) => `${row.step}:${s.id}`),
        `残りの区画の在る行 (${lang})`,
      ).toEqual(["1:rest:day"]);
      const rest = rests[0]?.s;
      if (!rest) continue;
      expect(rest.box, `残りの区画が表す箱 (${lang})`).toBe("day");
      expect(rest.color, `残りの区画の色 (${lang})`).toBe("slate");
      expect(rest.amount, `残りの区画の量 (${lang})`).toBe(16);
      expect(rest.value?.text, `残りの区画の字 (${lang})`).toBe(want);
      // 残りは点線の枠を描かない
      const motion = motionFrom(rendered as unknown as Rendered);
      const els = [...motion.doc.querySelectorAll("[data-sankey-rest]")];
      expect(els.length, `描いた残りの部品の数 (${lang})`).toBe(1);
      for (const el of els) {
        const dashed = [el, ...el.querySelectorAll("*")].some(
          (x) =>
            x.hasAttribute("stroke-dasharray") || /dasharray/u.test(x.getAttribute("style") ?? ""),
        );
        expect(dashed, `残りの部品が点線を描く (${lang})`).toBe(false);
        expect(el.textContent ?? "", `描いた残りの字 (${lang})`).toContain(want);
      }
    }
  });

  it("sankey-rows-drops-only-new-splits", () => {
    const rendered = render(smallRows());
    const rows = rowsOf(rendered, "小さな図");
    const drops = rendered.layout.drops ?? [];
    expect(rendered.layout.drops, "下りる帯 (layout.drops) が無い").toBeDefined();
    // 下りる帯は、2 行目からの各行で新しく分かれた区画にだけ引く
    const wanted = rows.flatMap((row, k) =>
      k === 0 ? [] : row.sections.filter((s) => s.kind === "new").map((s) => `${k}:${s.id}`),
    );
    expect(
      drops.map((d) => `${d.step}:${d.to}`),
      "下りる帯の行き先",
    ).toEqual(wanted);
    expect(wanted, "小さな図の新しく分かれた区画").toEqual([
      "1:sleep",
      "2:awake",
      "3:work",
      "3:home",
      "3:move",
    ]);
    for (const d of drops) {
      const row = rows[d.step] as Row;
      const above = rows[d.step - 1] as Row;
      const s = row.sections.find((x) => x.id === d.to) as RowSection;
      expect(d.x, `段 ${d.step + 1} の ${d.to} へ下りる帯の左の端`).toBeCloseTo(s.x, 0);
      expect(d.w, `段 ${d.step + 1} の ${d.to} へ下りる帯の幅`).toBeCloseTo(s.w, 0);
      expect(d.y1, `段 ${d.step + 1} の ${d.to} へ下りる帯の上の端`).toBeCloseTo(
        above.y + above.h,
        0,
      );
      expect(d.y2, `段 ${d.step + 1} の ${d.to} へ下りる帯の下の端`).toBeCloseTo(row.y, 0);
    }
    // 量の札は線ごとに 1 枚で、その段で新しく分かれた区画の幅の内を、上の行から下の行へ縦に渡る
    const { edges } = rendered.layout;
    expect(
      edges.map((e) => `${e.step}:${e.from}>${e.to}`),
      "量の札の道",
    ).toEqual(["1:day>sleep", "2:day>awake", "3:awake>work", "3:awake>home", "3:awake>move"]);
    for (const e of edges) {
      const row = rows[e.step] as Row;
      const above = rows[e.step - 1] as Row;
      const s = row.sections.find((x) => x.id === e.to) as RowSection;
      for (const [x, y] of e.points) {
        expect(
          x >= s.x - 0.5 && x <= s.x + s.w + 0.5,
          `段 ${e.step + 1} の ${e.to} の量の札の道が区画の幅の外を通る`,
        ).toBe(true);
        expect(
          y >= above.y - 0.5 && y <= row.y + row.h + 0.5,
          `段 ${e.step + 1} の ${e.to} の量の札の道が行の間の外を通る`,
        ).toBe(true);
      }
    }
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(
      motion.doc.querySelectorAll("[data-sankey-drop]").length,
      "描いた下りる帯の部品の数",
    ).toBe(wanted.length);
  });

  it("sankey-rows-names-below-when-narrow", () => {
    for (const lang of LANGS) {
      for (const width of [undefined, PHONE]) {
        const where = `小さな図 (${lang}、幅 ${width ?? "既定"})`;
        const rendered = render(smallRows(), lang, width);
        const rows = rowsOf(rendered, where);
        const { layout } = rendered;
        if (width !== undefined)
          expect(layout.width, `${where} の図の幅が携帯の幅を超える`).toBeLessThanOrEqual(width);
        rows.forEach((row, k) => {
          // 帯は図の幅いっぱいのまま保つ
          expect(row.w, `${where} の行 ${k + 1} の幅が図の幅の 8 割に届かない`).toBeGreaterThan(
            layout.width * 0.8,
          );
          for (const s of row.sections) {
            for (const t of [s.name, s.value])
              if (t)
                expect(
                  inside(t.rect, s),
                  `${where} の行 ${k + 1} の区画 ${s.id} の字 ${t.text} がはみ出る`,
                ).toBe(true);
          }
          // 帯の下の名前は、区画の中に名前を書かなかった区画のものだけで、区画と同じ色の印を持ち、帯の下に重ならずに並ぶ
          const next = rows[k + 1];
          for (const n of row.names) {
            const s = row.sections.find((x) => x.id === n.id);
            expect(s, `${where} の行 ${k + 1} の帯の下の名前 ${n.id} の区画が無い`).toBeDefined();
            if (!s) continue;
            expect(
              s.name,
              `${where} の行 ${k + 1} の区画 ${n.id} は名前を区画の中にも帯の下にも書く`,
            ).toBeUndefined();
            expect(n.color, `${where} の行 ${k + 1} の帯の下の名前 ${n.id} の印の色`).toBe(s.color);
            expect(
              n.name.text.startsWith(SMALL_BOXES.find(([id]) => id === s.box)?.[1] ?? "?"),
              `${where} の行 ${k + 1} の帯の下の名前 ${n.name.text}`,
            ).toBe(true);
            for (const r of [n.mark, n.name.rect]) {
              expect(
                r.y,
                `${where} の行 ${k + 1} の帯の下の名前 ${n.id} が帯の下に無い`,
              ).toBeGreaterThanOrEqual(row.y + row.h);
              expect(
                r.x >= 0 && r.x + r.w <= layout.width,
                `${where} の行 ${k + 1} の帯の下の名前 ${n.id} が図の外に在る`,
              ).toBe(true);
              if (next)
                expect(
                  overlaps(r, next),
                  `${where} の行 ${k + 1} の帯の下の名前 ${n.id} が次の行に重なる`,
                ).toBe(false);
            }
          }
          row.names.forEach((a, i) =>
            row.names
              .slice(i + 1)
              .forEach((b) =>
                expect(
                  overlaps(a.name.rect, b.name.rect),
                  `${where} の行 ${k + 1} の帯の下の名前 ${a.id} と ${b.id} が重なる`,
                ).toBe(false),
              ),
          );
        });
        // 移動の区画は狭く、名前を区画に書かずに帯の下に並べる
        const lastRow = rows.at(-1) as Row;
        const move = lastRow.sections.find((s) => s.id === "move");
        expect(move?.name, `${where} の最後の行の移動の区画に名前を書く`).toBeUndefined();
        expect(
          lastRow.names.map((n) => n.id),
          `${where} の最後の行の帯の下の名前`,
        ).toContain("move");
      }
    }
  });

  it("sankey-rows-rejects-unknown-shape", () => {
    const parse = api("parseNotation");
    const body = ["box a as 全量", "box b as 行き先", "step 流す", "  say 流す。", "  a -> b: 40%"];
    for (const shape of ["bars", "layers", "stairs"]) {
      const text = [`sankey Flow [shape: ${shape}]`, ...body].join("\n");
      for (const lang of LANGS) {
        const read = parse(text, { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(
          first?.line,
          `見た目 ${shape} の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`,
        ).toBe(1);
        const message = first?.message ?? "";
        expect(KANA.test(message), `見た目 ${shape} の誤りの文の言葉 (${lang}): ${message}`).toBe(
          lang === "ja",
        );
        expect(
          message,
          `見た目 ${shape} の誤りの文 (${lang}) が書ける見た目 rows を名指さない`,
        ).toContain("rows");
      }
    }
    // rows は読み、見た目を書かない量の行き先の図は今の帯の図のまま読む
    const rows = parse(["sankey Flow [shape: rows]", ...body].join("\n"));
    expect(rows.ok, `[shape: rows] が読めない: ${rows.ok ? "" : JSON.stringify(rows.errors)}`).toBe(
      true,
    );
    if (rows.ok)
      expect((rows.diagram as unknown as Source).sankey?.shape, "[shape: rows] の見た目").toBe(
        "rows",
      );
    const bare = parse(["sankey Flow", ...body].join("\n"));
    expect(
      bare.ok && (bare.diagram as unknown as Source).sankey,
      "見た目を書かない量の行き先の図が見た目の欄を持つ",
    ).toBeFalsy();
  });
});

describe("段ごとの帯の見た目の見本 (#3641)", () => {
  it("sankey-rows-examples-in-both-langs-have-no-breaks", () => {
    const sources: Partial<Record<Lang, Source>> = {};
    for (const { where, text, source, lang } of samples()) {
      // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
      expect(text.split("\n")[0] ?? "", `${where} の最初の行`).toMatch(/^\/\/ /u);
      expect(
        /#\d+/u.test(text.split("\n")[0] ?? ""),
        `${where} の最初の注釈の行に作業の番号がある`,
      ).toBe(false);
      sources[lang] = source;
      expect(source.sankey?.shape, `${where} の見た目`).toBe("rows");
      // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
      const problems = checkText(where, text, "notation", lang, {
        layout: (step, said) => `段 ${step}: ${said}`,
      }).map(problemLine);
      expect(problems, `${where} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, PHONE]) {
        const rows = rowsOf(
          render(source as unknown as Json, lang, width),
          `${where} (幅 ${width ?? "既定"})`,
        );
        expect(rows.length, `${where} を幅 ${width ?? "既定"} で描いた行の数`).toBe(
          source.steps.length,
        );
      }
    }
    expect(sources.ja && sources.en, `${SAMPLE} の日本語版と英語版が揃わない`).toBeTruthy();
    if (sources.ja && sources.en)
      expect(shapeOf(sources.en), `${SAMPLE} の英語版の箱と段と線が日本語版と違う`).toEqual(
        shapeOf(sources.ja),
      );
    // 見本帳の見本の一覧に載り、量の行き先の図の頁に並ぶ
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(
      true,
    );
    expect(samplesOf("sankey"), `見本帳の量の行き先の図の頁に ${SAMPLE} が無い`).toContain(SAMPLE);
    for (const lang of LANGS)
      expect(
        exampleText(SAMPLE, lang),
        `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`,
      ).toBe((fileText(`${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
  });
});

describe("段ごとの帯の見た目の棚 (#3641)", () => {
  it("sankey-rows-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、段ごとの帯の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(
        kinds.some((line) => /^sankey <[^>]+> \[shape: rows\]$/u.test(line)),
        `棚の記法の早見 (${lang}) に sankey の段ごとの帯の見た目の頭の行が無い: ${kinds.join(" / ")}`,
      ).toBe(true);
      // 量の行き先の図の見本の束に段ごとの帯の見た目の見本が在り、雛形が誤り無く読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "sankey");
      expect(group, `棚の見本の束 (${lang}) に量の行き先の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      expect(keys, `棚の量の行き先の図の束 (${lang}) に ${SAMPLE} が無い`).toContain(SAMPLE);
      if (!keys.includes(SAMPLE)) continue;
      expect(
        parsed(exampleText(SAMPLE, lang) ?? "", lang, `棚の雛形 ${SAMPLE} (${lang})`).sankey?.shape,
        `棚の雛形 ${SAMPLE} (${lang}) の見た目`,
      ).toBe("rows");
    }
  });
});

describe("段ごとの帯の見た目の軽い入口 (#3641)", () => {
  it("sankey-rows-light-entry-draws-after-load-for", () => {
    const text = fileText(`${SAMPLE}.dragon`);
    expect(text, `${SAMPLE}.dragon が packages/dragon/examples に無い`).toBeDefined();
    if (text === undefined) return;
    const code = [
      `const text = ${JSON.stringify(text)};`,
      "await light.loadFor(text);",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.arrangement = drawn.layout.arrangement;",
      "  out.rows = (drawn.svg.match(/data-sankey-row=/g) ?? []).length;",
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
    expect(failure, "軽い入口で段ごとの帯の見た目を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as {
      ok?: boolean;
      errors?: unknown[];
      arrangement?: string;
      rows?: number;
      same?: boolean;
    };
    expect(
      out.ok,
      `軽い入口で loadFor を待った後に段ごとの帯の見た目を読めない: ${JSON.stringify(out.errors)}`,
    ).toBe(true);
    expect(out.arrangement, "軽い入口で描いた図の並べ方").toBe("rows");
    expect(out.rows, "軽い入口で描いた行の部品の数").toBe(parsed(text, "ja", SAMPLE).steps.length);
    expect(out.same, "軽い入口と既定の入口で描いた段ごとの帯の見た目が違う").toBe(true);
  });
});

describe("段ごとの帯の見た目の書き方の文書 (#3641)", () => {
  it("sankey-rows-docs-describe-the-shape", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const rowsFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).sankey?.shape === "rows";
      }).length;
    for (const path of [
      "packages/dragon/README.md",
      "packages/dragon/README.ja.md",
      "packages/dragon/examples/quick-start.md",
      "packages/dragon/examples/quick-start.en.md",
    ]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: rows\]/u.test(text), `${path} に [shape: rows] の書き方が無い`).toBe(true);
      expect(
        rowsFences(text),
        `${path} に段ごとの帯の見た目として読める dragon の囲みが無い`,
      ).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = readdirSync(join(ROOT, "apps/playground-spa/src/docs/examples")).map((file) =>
      repoText(`apps/playground-spa/src/docs/examples/${file}`),
    );
    const paragraphs = readdirSync(join(PACKAGE, "src/blocks")).map((name) =>
      repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`),
    );
    expect(
      /\[shape: rows\]/u.test([content, ...sections, ...paragraphs].join("\n")),
      "使い方の頁に [shape: rows] の書き方が無い",
    ).toBe(true);
  });
});
