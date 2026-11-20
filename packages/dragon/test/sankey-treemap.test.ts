// @vitest-environment jsdom
/**
 * 量の行き先の図の面積で割る四角の見た目 (#3642)。
 *
 * 量の行き先の図 (`sankey`) の見た目に `[shape: treemap]` を足す。今の帯の図と同じ `box` の行と段の中の `<出どころ> -> <行き先>: <量>` の線のまま、
 * 全量を1つの四角にし、段ごとに切る線を引いて量の面積に割る。まだ分けていない残りは長い辺を量の割合で切り、
 * 同じ段に同じ出どころから書いた線は、線の量の和の帯を1つ切り出して帯の中を線を書いた順に分ける。切る線は割った四角の縁から縁までに留まる。
 * 行き先の区画をさらに分けた時は、親の区画の枠と名前の札を残して内側を子の区画に割る。
 * 区画の中には名前と線の名前の量を書き、出どころの無い箱の残りは灰色の区画に `残り80GB` の形で書き、量の札を出さない。
 * 名前が区画に入らない時は、区画に量だけを書き (量も入らなければ字を書かず)、図の四角の下に色の印と名前を並べる。
 * 見た目の元は step 2 で決めた案 (クローンの予想を採った)。
 *
 * 置き場所は描く部品が返す値で確かめる。図の四角は `layout.frame`、区画は `layout.tiles` (残りは `kind` が `rest`)、切る線は `layout.cuts`、
 * 図の四角の下の名前は `layout.names` に返る。部品は、区画が `data-sankey-tile`、切る線が `data-sankey-cut` を持つ。
 * 区画の見え方は描いた SVG の keyframes を jsdom で読み、各段の止め絵の時刻で確かめる。
 * 見本の file と面積で割る四角の見た目がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { motionFrom } from "./motion-support";
import { draw, type Rect, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/sankey";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const LANGS = ["ja", "en"] as const;
type Lang = (typeof LANGS)[number];

/** 面積で割る四角の見た目の見本。スマホの保存領域の内訳 */
const SAMPLE = "phone-storage";

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
interface TileText {
  text: string;
  x: number;
  y: number;
  rect: Rect;
}

/**
 * 区画。`id` は区画の名札で、箱の区画は箱の名札、出どころの無い箱の残りは `rest:<名札>:<段>`。`box` は区画が表す箱。
 * `kind` は箱の区画 (`box`) か残り (`rest`)。`step` は区画が現れる段、`until` は区画が消える段 (残りが切られた時)。
 * `split` は区画を子の区画に分けた段で、その段から区画は枠と名前の札 (`chip`) だけになる。`name` と `value` は区画の中に書く名前と量
 */
interface Tile extends Rect {
  id: string;
  box: string;
  kind: "box" | "rest";
  step: number;
  until?: number;
  split?: number;
  color: string;
  amount: number;
  name?: TileText;
  value?: TileText;
  chip?: TileText;
}

/** 切る線。`region` は線が割った四角、`step` は線を引く段 */
interface Cut {
  step: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  region: Rect;
}

/** 図の四角の下に並べる名前。`mark` は区画と同じ色の印の四角 */
interface TileName {
  id: string;
  color: string;
  mark: Rect;
  name: TileText;
}

interface TreemapLayout {
  kind: string;
  arrangement?: string;
  width: number;
  height: number;
  frame?: Rect;
  tiles?: Tile[];
  cuts?: Cut[];
  names?: TileName[];
  edges: unknown[];
}

interface TreemapRendered extends Omit<Rendered, "layout"> {
  layout: TreemapLayout;
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

const flow = (from: string, to: string, label: string): Json => ({
  type: "edge",
  from,
  to,
  label,
  carry: { kind: "envelope" },
});

/** 小さな図の箱。名札、名前、色 */
const SMALL_BOXES: [string, string, string][] = [
  ["all", "保存領域", "slate"],
  ["photo", "写真", "blue"],
  ["app", "アプリ", "green"],
  ["video", "動画", "violet"],
  ["free", "空き", "amber"],
  ["misc", "その他のファイル", "rose"],
  ["game", "遊び", "green"],
  ["work", "仕事", "blue"],
];

/** 小さな図の線の量 */
const AMOUNTS: Record<string, number> = {
  photo: 48,
  app: 32,
  video: 16,
  free: 30,
  misc: 2,
  game: 20,
  work: 12,
};
const WHOLE = 128;

/**
 * 128GBの保存領域を割る小さな図。段 1 は線を持たず、段 2 で写真を、段 3 でアプリと動画を同じ出どころからまとめて、
 * 段 4 で空きとその他のファイルを残りから切り、段 5 でアプリを遊びと仕事に分ける。その他のファイルの区画は狭く、名前が区画に入らない。
 * `shape` を外すと、同じ箱と段の今の帯の図になる
 */
function smallTreemap(shape: string | null = "treemap"): Json {
  return {
    version: 2,
    kind: "sankey",
    title: "小さな保存領域",
    ...(shape === null ? {} : { sankey: { shape } }),
    blocks: { box: SMALL_BOXES.map(([id, name, color]) => ({ id, name, color })) },
    steps: [
      { title: "全体", body: "保存領域は128GB。", events: [] },
      { title: "写真", body: "写真が48GBを使う。", events: [flow("all", "photo", "48GB")] },
      {
        title: "アプリと動画",
        body: "アプリが32GB、動画が16GBを使う。",
        events: [flow("all", "app", "32GB"), flow("all", "video", "16GB")],
      },
      {
        title: "空き",
        body: "残りは空きとその他のファイル。",
        events: [flow("all", "free", "30GB"), flow("all", "misc", "2GB")],
      },
      {
        title: "アプリの内訳",
        body: "アプリの32GBを遊びと仕事に分ける。",
        events: [flow("app", "game", "20GB"), flow("app", "work", "12GB")],
      },
    ],
  };
}

/** 小さな図の書き戻した記法 */
const SMALL_TEXT = [
  "sankey 小さな保存領域 [shape: treemap]",
  "",
  ...SMALL_BOXES.map(([id, name, color]) => `box ${id} as ${name} [color: ${color}]`),
  "",
  "step 全体",
  "  say 保存領域は128GB。",
  "",
  "step 写真",
  "  say 写真が48GBを使う。",
  "  all -> photo: 48GB",
  "",
  "step アプリと動画",
  "  say アプリが32GB、動画が16GBを使う。",
  "  all -> app: 32GB",
  "  all -> video: 16GB",
  "",
  "step 空き",
  "  say 残りは空きとその他のファイル。",
  "  all -> free: 30GB",
  "  all -> misc: 2GB",
  "",
  "step アプリの内訳",
  "  say アプリの32GBを遊びと仕事に分ける。",
  "  app -> game: 20GB",
  "  app -> work: 12GB",
  "",
].join("\n");

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: Lang = "ja", width?: number): TreemapRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "面積で割る四角の見た目の量の行き先の図を描けない").toBe("");
  return rendered as unknown as TreemapRendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok
    ? read.diagram
    : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 面積で割る四角の置き場所。面積で割る四角の見た目で並べていなければ落とす */
function treemapOf(
  rendered: TreemapRendered,
  where: string,
): { frame: Rect; tiles: Tile[]; cuts: Cut[]; names: TileName[] } {
  const { layout } = rendered;
  expect(layout.arrangement, `${where} を面積で割る四角の見た目で並べていない`).toBe("treemap");
  expect(layout.frame, `${where} に図の四角 (layout.frame) が無い`).toBeDefined();
  expect(layout.tiles, `${where} に区画 (layout.tiles) が無い`).toBeDefined();
  return {
    frame: layout.frame ?? { x: 0, y: 0, w: 0, h: 0 },
    tiles: layout.tiles ?? [],
    cuts: layout.cuts ?? [],
    names: layout.names ?? [],
  };
}

/** 区画。無ければ落とす */
function tileOf(tiles: Tile[], id: string): Tile {
  const tile = tiles.find((t) => t.id === id);
  expect(tile, `区画 ${id} が無い`).toBeDefined();
  return (
    tile ?? { id, box: id, kind: "box", step: -1, color: "", amount: 0, x: 0, y: 0, w: 0, h: 0 }
  );
}

/** 段 `s` に見えている区画。現れた後で、消える段より前 */
const aliveAt = (tiles: Tile[], s: number): Tile[] =>
  tiles.filter((t) => t.step <= s && (t.until === undefined || s < t.until));

/** 段 `s` に子に分けずに残っている区画 (葉) */
const leavesAt = (tiles: Tile[], s: number): Tile[] =>
  aliveAt(tiles, s).filter((t) => t.split === undefined || s < t.split);

/** 四角 `inner` が四角 `outer` の中に在るか */
const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x - 0.5 &&
  inner.y >= outer.y - 0.5 &&
  inner.x + inner.w <= outer.x + outer.w + 0.5 &&
  inner.y + inner.h <= outer.y + outer.h + 0.5;

/** 2 つの四角が重なるか */
const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;

/** 記法の行の、注釈と空の行を除いた並び */
const codeLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "" && !line.trimStart().startsWith("//"));

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

describe("面積で割る四角の見た目の原本の JSON (#3642)", () => {
  it("schema-accepts-sankey-treemap", () => {
    const validate = api("validateDiagram");
    const checked = validate(smallTreemap());
    expect(
      checked.ok,
      `面積で割る四角の見た目の原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`,
    ).toBe(true);
    expect(validate(smallTreemap("rows")).ok, "段ごとの帯の見た目の原本が検査で落ちる").toBe(true);
    expect(validate(smallTreemap("tiles")).ok, "量の行き先の図の見た目 tiles が検査を通る").toBe(
      false,
    );
    for (const { where, source } of samples()) {
      const sample = validate(source);
      expect(
        sample.ok,
        `${where} の原本が検査で落ちる: ${JSON.stringify(sample.ok ? [] : sample.errors)}`,
      ).toBe(true);
    }
  });
});

describe("面積で割る四角の見た目の記法 (#3642)", () => {
  it("sankey-treemap-roundtrip-keeps-notation", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const small = parse(SMALL_TEXT, { lang: "ja" });
    expect(
      small.ok,
      `小さな図の記法が読めない: ${small.ok ? "" : JSON.stringify(small.errors)}`,
    ).toBe(true);
    if (small.ok) {
      expect((small.diagram as unknown as Source).sankey?.shape, "小さな図の見た目").toBe(
        "treemap",
      );
      expect(codeLines(print(small.diagram)), "小さな図を書き戻した記法が書いた記法と違う").toEqual(
        codeLines(SMALL_TEXT),
      );
    }
    const read = api("readDiagram")(smallTreemap());
    expect(read.ok, `小さな図の原本が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(
      true,
    );
    if (read.ok) {
      const printed = print(read.diagram);
      expect(printed.split("\n")[0], "小さな図の原本を書き戻した頭の行").toBe(
        "sankey 小さな保存領域 [shape: treemap]",
      );
      const again = parse(printed, { lang: "ja" });
      expect(
        again.ok ? again.diagram : undefined,
        `小さな図を往復した JSON が最初と違う\n${printed}`,
      ).toEqual(read.diagram);
    }
    for (const { where, text, source, lang } of samples()) {
      expect(source.sankey?.shape, `${where} の見た目`).toBe("treemap");
      const printed = print(source);
      expect(codeLines(printed), `${where} を書き戻した記法が書いた記法と違う`).toEqual(
        codeLines(text),
      );
      expect(codeLines(printed)[0], `${where} を書き戻した頭の行`).toMatch(
        /^sankey .+ \[shape: treemap\]$/u,
      );
      const second = parse(printed, { lang });
      expect(
        second.ok ? second.diagram : undefined,
        `${where} を往復した JSON が最初と違う`,
      ).toEqual(source);
    }
  });
});

describe("面積で割る四角の見た目の描き方 (#3642)", () => {
  it("sankey-treemap-areas-follow-the-amount", () => {
    const rendered = render(smallTreemap());
    const { frame, tiles } = treemapOf(rendered, "小さな図");
    expect(
      inside(frame, { x: 0, y: 0, w: rendered.layout.width, h: rendered.layout.height }),
      "図の四角が図の枠の外に在る",
    ).toBe(true);
    // 段 1 は全量を 1 つの区画にし、図の四角いっぱいに置く
    const first = leavesAt(tiles, 0);
    expect(
      first.map((t) => t.id),
      "段 1 の区画",
    ).toEqual(["all"]);
    expect(
      ((first[0]?.w ?? 0) * (first[0]?.h ?? 0)) / (frame.w * frame.h),
      "段 1 の全量の区画の面積",
    ).toBeGreaterThan(0.95);
    // 最後の段の葉の区画は図の四角を重ならずに埋め、面積は量を全量に比べた分
    const last = leavesAt(tiles, 4);
    expect(last.map((t) => t.id).sort(), "最後の段の葉の区画").toEqual([
      "free",
      "game",
      "misc",
      "photo",
      "video",
      "work",
    ]);
    for (const t of last) {
      expect(inside(t, frame), `区画 ${t.id} が図の四角の外に在る`).toBe(true);
      expect(t.amount, `区画 ${t.id} の量`).toBe(AMOUNTS[t.id]);
      expect(
        Math.abs((t.w * t.h) / (frame.w * frame.h) - (AMOUNTS[t.id] ?? 0) / WHOLE),
        `区画 ${t.id} の面積が量に比べた分と違う`,
      ).toBeLessThan(0.03);
    }
    last.forEach((a, i) =>
      last
        .slice(i + 1)
        .forEach((b) => expect(overlaps(a, b), `区画 ${a.id} と ${b.id} が重なる`).toBe(false)),
    );
    const covered = last.reduce((s, t) => s + t.w * t.h, 0) / (frame.w * frame.h);
    expect(covered, "最後の段の葉の区画が図の四角を埋める割合").toBeGreaterThan(0.9);
    // 区画は線を書いた段で現れる。段 k の止め絵で見え、その前の段の止め絵では見えない
    const motion = motionFrom(rendered as unknown as Rendered);
    const { stills } = rendered.timeline;
    for (const [id, s] of [
      ["photo", 1],
      ["app", 2],
      ["video", 2],
      ["free", 3],
      ["game", 4],
    ] as const) {
      const el = motion.doc.querySelector(`[data-sankey-tile="${id}"]`);
      expect(el, `区画 ${id} の部品 (data-sankey-tile="${id}") が無い`).not.toBeNull();
      if (!el) continue;
      expect(tileOf(tiles, id).step, `区画 ${id} の現れる段`).toBe(s);
      expect(
        motion.opacity(el, stills[s] ?? 0),
        `区画 ${id} が段 ${s + 1} の止め絵で見えない`,
      ).toBeGreaterThan(0.9);
      expect(
        motion.opacity(el, stills[s - 1] ?? 0),
        `区画 ${id} が段 ${s} の止め絵で見える`,
      ).toBeLessThan(0.1);
    }
  });

  it("sankey-treemap-cuts-the-longer-side", () => {
    const { frame, tiles, cuts } = treemapOf(render(smallTreemap()), "小さな図");
    expect(cuts.length, "切る線の数").toBeGreaterThan(0);
    // どの切る線も、割った四角の長い辺を割る (横に長い四角は縦の線、縦に長い四角は横の線で切る)
    for (const c of cuts) {
      const vertical = Math.abs(c.x1 - c.x2) < 0.5;
      expect(
        vertical || Math.abs(c.y1 - c.y2) < 0.5,
        `段 ${c.step + 1} の切る線が縦でも横でもない`,
      ).toBe(true);
      expect(
        vertical,
        `段 ${c.step + 1} の切る線が割った四角 (${c.region.w}x${c.region.h}) の長い辺を割らない`,
      ).toBe(c.region.w >= c.region.h);
    }
    // 段 2 の写真は、横に長い図の四角の左を縦に切る
    const photo = tileOf(tiles, "photo");
    expect(photo.x - frame.x, "写真の区画が図の四角の左の端に無い").toBeLessThan(8);
    expect(photo.h / frame.h, "写真の区画が図の四角の高さいっぱいに無い").toBeGreaterThan(0.95);
    // 段 3 のアプリと動画は同じ出どころからまとめて切った 1 本の帯の中に、書いた順に並び、帯の中の長さを量で分ける
    const app = tileOf(tiles, "app");
    const video = tileOf(tiles, "video");
    const sameColumn = Math.abs(app.x - video.x) < 0.5 && Math.abs(app.w - video.w) < 0.5;
    const sameRow = Math.abs(app.y - video.y) < 0.5 && Math.abs(app.h - video.h) < 0.5;
    expect(sameColumn || sameRow, "アプリと動画が 1 本の帯の中に並ばない").toBe(true);
    if (sameColumn) {
      expect(app.y, "帯の中でアプリが動画より後に在る").toBeLessThan(video.y);
      expect(app.h / video.h, "帯の中のアプリと動画の長さの比").toBeCloseTo(32 / 16, 0);
    } else {
      expect(app.x, "帯の中でアプリが動画より後に在る").toBeLessThan(video.x);
      expect(app.w / video.w, "帯の中のアプリと動画の長さの比").toBeCloseTo(32 / 16, 0);
    }
    expect(
      cuts.filter((c) => c.step === 2).length,
      "段 3 の切る線の数 (残りから帯を切る線と帯の中を分ける線)",
    ).toBe(2);
  });

  it("sankey-treemap-cuts-stay-inside", () => {
    for (const width of [undefined, PHONE]) {
      const where = `小さな図 (幅 ${width ?? "既定"})`;
      const rendered = render(smallTreemap(), "ja", width);
      const { frame, cuts } = treemapOf(rendered, where);
      const motion = motionFrom(rendered as unknown as Rendered);
      expect(
        motion.doc.querySelectorAll("[data-sankey-cut]").length,
        `${where} の描いた切る線の部品の数`,
      ).toBe(cuts.length);
      for (const c of cuts) {
        const ends: Rect[] = [
          { x: c.x1, y: c.y1, w: 0, h: 0 },
          { x: c.x2, y: c.y2, w: 0, h: 0 },
        ];
        for (const end of ends) {
          expect(
            inside(end, frame),
            `${where} の段 ${c.step + 1} の切る線の端が図の四角の外に在る`,
          ).toBe(true);
          expect(
            inside(end, c.region),
            `${where} の段 ${c.step + 1} の切る線の端が割った四角の外に在る`,
          ).toBe(true);
        }
        // 切る線は割った四角の縁から縁まで渡る
        const vertical = Math.abs(c.x1 - c.x2) < 0.5;
        const span = vertical ? Math.abs(c.y2 - c.y1) : Math.abs(c.x2 - c.x1);
        expect(
          span,
          `${where} の段 ${c.step + 1} の切る線が割った四角の縁から縁まで渡らない`,
        ).toBeGreaterThan((vertical ? c.region.h : c.region.w) - 16);
      }
    }
  });

  it("sankey-treemap-nested-keeps-parent-frame", () => {
    const rendered = render(smallTreemap());
    const { tiles } = treemapOf(rendered, "小さな図");
    const app = tileOf(tiles, "app");
    expect(app.split, "アプリの区画を子の区画に分けた段").toBe(4);
    expect(app.chip?.text ?? "", "アプリの区画の名前の札").toContain("アプリ");
    if (app.chip)
      expect(
        inside(app.chip.rect, {
          x: app.x - 1,
          y: app.y - app.chip.rect.h,
          w: app.w + 2,
          h: app.h + app.chip.rect.h,
        }),
        "アプリの名前の札が区画の枠から離れる",
      ).toBe(true);
    // 子の区画は親の区画の枠の内側に在る
    for (const id of ["game", "work"]) {
      const child = tileOf(tiles, id);
      expect(inside(child, app), `子の区画 ${id} がアプリの区画の枠の外に在る`).toBe(true);
      expect(child.step, `子の区画 ${id} の現れる段`).toBe(4);
    }
    // 親の区画の枠は、子に分けた段の止め絵でも見える
    const motion = motionFrom(rendered as unknown as Rendered);
    const frameEl = motion.doc.querySelector('[data-sankey-tile="app"]');
    expect(frameEl, "アプリの区画の部品が無い").not.toBeNull();
    if (frameEl)
      expect(
        motion.opacity(frameEl, rendered.timeline.stills[4] ?? 0),
        "アプリの区画の枠が子に分けた段で見えない",
      ).toBeGreaterThan(0.9);
  });

  it("sankey-treemap-tiles-show-name-and-amount", () => {
    for (const [lang, rest2, rest3] of [
      ["ja", "残り80GB", "残り32GB"],
      ["en", "80GB left", "32GB left"],
    ] as const) {
      const rendered = render(smallTreemap(), lang);
      const { tiles } = treemapOf(rendered, `小さな図 (${lang})`);
      const names = new Map(SMALL_BOXES.map(([id, name]) => [id, name]));
      // 箱の区画は名前と線の名前の量を書く。割合の字は足さない
      for (const id of ["photo", "video", "free", "game", "work"]) {
        const t = tileOf(tiles, id);
        expect(t.name?.text, `区画 ${id} の名前 (${lang})`).toBe(names.get(id));
        expect(t.value?.text, `区画 ${id} の量 (${lang})`).toBe(`${AMOUNTS[id]}GB`);
        for (const x of [t.name, t.value])
          if (x)
            expect(inside(x.rect, t), `区画 ${id} の字 ${x.text} がはみ出る (${lang})`).toBe(true);
      }
      expect(tileOf(tiles, "all").value?.text, `全量の区画の量 (${lang})`).toBe("128GB");
      // 出どころの無い箱の残りは灰色の区画に残りの量を書き、残りを切った段で消える
      const rests = tiles.filter((t) => t.kind === "rest");
      expect(
        rests.map((t) => `${t.step}:${t.value?.text ?? ""}`),
        `残りの区画 (${lang})`,
      ).toEqual([`1:${rest2}`, `2:${rest3}`]);
      for (const t of rests) {
        expect(t.color, `残りの区画 ${t.id} の色 (${lang})`).toBe("slate");
        expect(t.box, `残りの区画 ${t.id} が表す箱 (${lang})`).toBe("all");
        expect(t.until, `残りの区画 ${t.id} の消える段 (${lang})`).toBe(t.step + 1);
      }
      // 量の札を出さない
      expect(rendered.layout.edges, `量の札の道 (${lang})`).toEqual([]);
    }
  });

  it("sankey-treemap-names-below-when-narrow", () => {
    for (const lang of LANGS) {
      for (const width of [undefined, PHONE]) {
        const where = `小さな図 (${lang}、幅 ${width ?? "既定"})`;
        const rendered = render(smallTreemap(), lang, width);
        const { frame, tiles, names } = treemapOf(rendered, where);
        const { layout } = rendered;
        if (width !== undefined)
          expect(layout.width, `${where} の図の幅が携帯の幅を超える`).toBeLessThanOrEqual(width);
        expect(frame.w, `${where} の図の四角が図の幅の 8 割に届かない`).toBeGreaterThan(
          layout.width * 0.8,
        );
        // 区画の中の字ははみ出さない
        for (const t of tiles)
          for (const x of [t.name, t.value, t.chip])
            if (x && x !== t.chip)
              expect(inside(x.rect, t), `${where} の区画 ${t.id} の字 ${x.text} がはみ出る`).toBe(
                true,
              );
        // 名前を区画の中に書かなかった葉の区画は、図の四角の下に区画と同じ色の印と名前を並べる
        const leaves = leavesAt(tiles, 4).filter((t) => t.kind === "box");
        for (const t of leaves) {
          const listed = names.find((n) => n.id === t.id);
          expect(
            t.name !== undefined || listed !== undefined,
            `${where} の区画 ${t.id} の名前がどこにも無い`,
          ).toBe(true);
          if (t.name)
            expect(
              listed,
              `${where} の区画 ${t.id} は名前を区画の中にも図の下にも書く`,
            ).toBeUndefined();
        }
        for (const n of names) {
          const t = tileOf(tiles, n.id);
          expect(n.color, `${where} の図の下の名前 ${n.id} の印の色`).toBe(t.color);
          expect(
            n.name.text.startsWith(SMALL_BOXES.find(([id]) => id === t.box)?.[1] ?? "?"),
            `${where} の図の下の名前 ${n.name.text}`,
          ).toBe(true);
          for (const r of [n.mark, n.name.rect]) {
            expect(
              r.y,
              `${where} の図の下の名前 ${n.id} が図の四角の下に無い`,
            ).toBeGreaterThanOrEqual(frame.y + frame.h);
            expect(
              r.x >= 0 && r.x + r.w <= layout.width && r.y + r.h <= layout.height,
              `${where} の図の下の名前 ${n.id} が図の外に在る`,
            ).toBe(true);
          }
        }
        names.forEach((a, i) =>
          names
            .slice(i + 1)
            .forEach((b) =>
              expect(
                overlaps(a.name.rect, b.name.rect),
                `${where} の図の下の名前 ${a.id} と ${b.id} が重なる`,
              ).toBe(false),
            ),
        );
        // その他のファイルの区画は狭く、名前を図の下に並べる
        expect(
          tileOf(tiles, "misc").name,
          `${where} のその他のファイルの区画に名前を書く`,
        ).toBeUndefined();
        expect(
          names.map((n) => n.id),
          `${where} の図の下の名前`,
        ).toContain("misc");
      }
    }
  });

  it("sankey-treemap-rejects-unknown-shape", () => {
    const parse = api("parseNotation");
    const body = ["box a as 全量", "box b as 行き先", "step 流す", "  say 流す。", "  a -> b: 40%"];
    for (const shape of ["tiles", "area"]) {
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
        for (const look of ["rows", "treemap"])
          expect(
            message,
            `見た目 ${shape} の誤りの文 (${lang}) が書ける見た目 ${look} を名指さない`,
          ).toContain(look);
      }
    }
    const read = parse(["sankey Flow [shape: treemap]", ...body].join("\n"));
    expect(
      read.ok,
      `[shape: treemap] が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`,
    ).toBe(true);
    if (read.ok)
      expect((read.diagram as unknown as Source).sankey?.shape, "[shape: treemap] の見た目").toBe(
        "treemap",
      );
  });
});
