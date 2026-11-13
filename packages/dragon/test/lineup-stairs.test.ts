// @vitest-environment jsdom
/**
 * 列の図の階段の層の見た目 (#3640)。
 *
 * 列の図 (`lineup`) の見た目に `[shape: stairs]` を足す。層の見た目 (`[shape: layers]`) と同じ `box` と `item` と `line` と `note` の行のまま、
 * 層を `box` を書いた順に上から置き、下の層ほど同じ幅だけ右へずらした階段にする。段の中の `line <層>: <札>` で札がその層の段へ下り、層と層の間に札が歩く線を描かない。
 * 層の箱に `[time: <長さ>]` を書くと、その層で掛かった時間にする。全ての箱に書くか、どの箱にも書かない。時間が掛からない層には `0s` を書ける。
 * 長さを書いた図は経った時間の目盛りを置き、数字を 1、2、5 に 10 の累乗を掛けた間隔で 0 から置き、単位を箱に書いた中で一番大きい単位にする。
 * 目盛りの針は段ごとに、札の居る層までに経った時間 (その層の時間を含む) の所へ進み、経った時間を `1分3秒` の形で書いた札を添える。
 * 既定の幅では目盛りを階段の右に縦に置き、携帯の幅 (390) では階段の層を幅いっぱいに描いて目盛りを図の下に横向きで置く。
 * 見た目の元は step 2 で決めた案 (クローンの予想を採った)。
 *
 * 置き場所は描く部品が返す値で確かめる。層の段は `layout.lanes`、層の名前と説明は `layout.bands`、札の席は `layout.chips`、印は `layout.bandNotes`、
 * 目盛りは `layout.scale` (`axis` は縦か横、`ticks` の `at` は目盛りの向きの所)、針は段ごとに `layout.needles` に返る。
 * 札と印と針の札の見え方は描いた SVG の keyframes を jsdom で読み、各段の止め絵の時刻で確かめる。
 * 部品は、段が `data-lineup-layer`、札が `data-lineup-card` (居る層は `data-lineup-on`)、印が `data-lineup-band-note`、
 * 目盛りが `data-stairs-scale`、目盛りの数字が `data-stairs-tick`、針が `data-stairs-needle`、針の札が `data-stairs-elapsed` を持つ。
 * 見本の file と階段の見た目がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
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

/** 階段の層の見た目の見本。撮った動画が見る人の端末で見られるようになるまで */
const SAMPLE = "video-publish";

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 階段の見た目で描く層の上限 */
const MOST_LAYERS = 8;

/** 携帯の幅 */
const PHONE = 390;

interface SourceEvent {
  type: string;
  box?: string;
  items?: string[];
  text?: string;
}

interface Source {
  kind: string;
  title: string;
  lineup?: { shape?: string };
  blocks: {
    box?: {
      id: string;
      name: string;
      sub?: string;
      color?: string;
      order?: string;
      time?: string;
    }[];
    item?: { id: string; color?: string; label?: string; note?: string }[];
  };
  steps: { title: string; body?: string; events: SourceEvent[] }[];
}

/** 字の置き場所。`text` は描く字 */
type Writing = Rect & { text: string };

/** 層の名前と説明。段そのものの四角は `layout.lanes` の箱が持つ */
interface Band {
  lane: string;
  name: Writing;
  desc?: Writing;
}

/** 札が層の段に居る間 1 回分。`from` は滑り始める左上で、弾んで現れる札は持たない */
interface Seat extends Rect {
  id: string;
  lane: string;
  step: number;
  event: number;
  from?: [number, number];
}

/** 層の段の印。`note` の行 1 つ分 */
interface BandNote extends Rect {
  lane: string;
  step: number;
  event: number;
  text: Writing;
}

/** 経った時間の目盛りの数字。`value` は `unit` で数えた値、`at` は目盛りの向き (縦なら y、横なら x) の所 */
interface Tick {
  value: number;
  text: string;
  at: number;
  rect: Rect;
}

/** 経った時間の目盛り。`line` は目盛りの線の四角 */
interface Scale {
  axis: "vertical" | "horizontal";
  unit: string;
  line: Rect;
  ticks: Tick[];
}

/** 段ごとの針。`value` は `unit` で数えた経った時間、`at` は目盛りの向きの所、`chip` は経った時間を書いた札の四角 */
interface Needle {
  step: number;
  value: number;
  text: string;
  at: number;
  chip: Rect;
}

interface StairsLayout {
  kind: string;
  arrangement?: string;
  width: number;
  height: number;
  lanes: (Rect & { id: string; name: string })[];
  bands?: Band[];
  bandNotes?: BandNote[];
  chips: Seat[];
  arrows?: unknown[];
  scale?: Scale;
  needles?: Needle[];
}

interface StairsRendered extends Omit<Rendered, "layout"> {
  layout: StairsLayout;
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string =>
  existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "";

const lineEvent = (box: string, items: string[]): Json => ({ type: "line", box, items });
const noteEvent = (box: string, text: string): Json => ({ type: "swap", box, text });

/** 小さな階段の層の長さ。撮るのに 20 秒、送るのに 1 分、置くのに掛からない */
const SMALL_TIMES = ["20s", "1min", "0s"];

/**
 * 3 つの層を階段に置き、動画の札 1 枚が段ごとに 1 つずつ下りる最小の階段の図。段 1 と段 2 で、札が下りた層に印を出す。
 * `times` を `null` にすると長さを書かない。`shape` を外すと、同じ箱とチップと段の今の列の図になる
 */
function smallStairs(
  times: readonly (string | undefined)[] | null = SMALL_TIMES,
  shape: string | null = "stairs",
): Json {
  const boxes: Record<string, string>[] = [
    { id: "cam", name: "端末", sub: "動画を撮る", color: "blue" },
    { id: "send", name: "送る", sub: "置き場へ送る", color: "violet" },
    { id: "store", name: "置き場", color: "green" },
  ];
  boxes.forEach((box, k) => {
    const time = times?.[k];
    if (time !== undefined) box.time = time;
  });
  return {
    version: 2,
    kind: "lineup",
    title: "小さな階段",
    ...(shape === null ? {} : { lineup: { shape } }),
    blocks: { box: boxes, item: [{ id: "clip", color: "blue", note: "1本の動画" }] },
    steps: [
      {
        title: "撮る",
        body: "端末で撮る。",
        events: [lineEvent("cam", ["clip"]), noteEvent("cam", "撮った")],
      },
      {
        title: "送る",
        body: "置き場へ送る。",
        events: [lineEvent("send", ["clip"]), noteEvent("send", "送った")],
      },
      { title: "置く", body: "置き場に置く。", events: [lineEvent("store", ["clip"])] },
    ],
  };
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: Lang = "ja", width?: number): StairsRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "階段の見た目の列の図を描けない").toBe("");
  return rendered as unknown as StairsRendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok
    ? read.diagram
    : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 描いた図の部品。全て返す */
const partsOf = (motion: Motion, selector: string): Element[] => [
  ...motion.doc.querySelectorAll(selector),
];

/** 時刻 `t` に見えている (濃さが 0.9 を超える) 部品 */
const shownAt = (motion: Motion, selector: string, t: number): Element[] =>
  partsOf(motion, selector).filter((el) => motion.opacity(el, t) > 0.9);

/** 時刻 `t` に見えている部品の字 */
const textsAt = (motion: Motion, selector: string, t: number): string[] =>
  shownAt(motion, selector, t).map((el) => el.textContent ?? "");

/** 階段の見た目の置き場所。階段の見た目で並べていなければ落とす */
function stairsOf(rendered: StairsRendered, where: string): StairsLayout {
  const { layout } = rendered;
  expect(layout.arrangement, `${where} を階段の見た目で並べていない`).toBe("stairs");
  return layout;
}

/** 経った時間の目盛り。無ければ落とす */
function scaleOf(layout: StairsLayout, where: string): Scale {
  expect(layout.scale, `${where} に経った時間の目盛り (layout.scale) が無い`).toBeDefined();
  return (
    layout.scale ?? { axis: "vertical", unit: "", line: { x: 0, y: 0, w: 0, h: 0 }, ticks: [] }
  );
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

/** 層の段の右の端と下の端の一番外 */
const stairsEdge = (layout: StairsLayout): { left: number; right: number; bottom: number } => ({
  left: Math.min(...layout.lanes.map((l) => l.x)),
  right: Math.max(...layout.lanes.map((l) => l.x + l.w)),
  bottom: Math.max(...layout.lanes.map((l) => l.y + l.h)),
});

/** 記法の行の、注釈と空の行を除いた並び */
const codeLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "" && !line.trimStart().startsWith("//"));

/** 原本の層と長さと札と段と段ごとの出来事の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.lineup?.shape,
  layers: (d.blocks.box ?? []).map((b) => b.id),
  times: (d.blocks.box ?? []).map((b) => b.time),
  items: (d.blocks.item ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.map((e) => e.type)),
});

/** 記法の行の番号 (1 から数える) */
const lineOf = (text: string, head: string): number =>
  text.split("\n").findIndex((l) => l.startsWith(head)) + 1;

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

describe("階段の見た目の原本の JSON (#3640)", () => {
  it("schema-accepts-lineup-stairs", () => {
    const validate = api("validateDiagram");
    // 長さ (0s を含む) を全ての箱に書いた階段と、どの箱にも書かない階段は検査を通る
    for (const [where, source] of [
      ["長さを書いた階段の見た目", smallStairs()],
      ["長さを書かない階段の見た目", smallStairs(null)],
      ["全ての層が 0s の階段の見た目", smallStairs(["0s", "0s", "0s"])],
    ] as const) {
      const checked = validate(source);
      expect(
        checked.ok,
        `${where}の原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`,
      ).toBe(true);
    }
    // 一部の箱にだけ書いた長さは断る
    expect(
      validate(smallStairs(["20s", undefined, "0s"])).ok,
      "一部の箱にだけ長さを書いた階段の見た目が検査を通る",
    ).toBe(false);
    // 階段の見た目でない列の図の箱の長さは、箱を指して断る
    for (const [where, shape] of [
      ["見た目を書かない列の図", null],
      ["層の見た目の列の図", "layers"],
    ] as const) {
      const wrong = validate(smallStairs(SMALL_TIMES, shape));
      expect(wrong.ok, `${where}の箱の長さが検査を通る`).toBe(false);
      expect(
        pointers(wrong).some((p) => p.startsWith("/blocks/box")),
        `${where}の箱の長さの誤りの場所: ${pointers(wrong).join(", ")}`,
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

describe("階段の見た目の記法 (#3640)", () => {
  it("lineup-stairs-roundtrip-keeps-notation", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const { where, text, source, lang } of samples()) {
      expect(source.lineup?.shape, `${where} の見た目`).toBe("stairs");
      // 書き戻すと、注釈の行のほかは書いた記法と同じ行に戻る
      const printed = print(source);
      expect(codeLines(printed), `${where} を書き戻した記法が書いた記法と違う`).toEqual(
        codeLines(text),
      );
      expect(codeLines(printed)[0], `${where} を書き戻した頭の行`).toMatch(
        /^lineup .+ \[shape: stairs\]$/u,
      );
      expect(
        codeLines(printed)
          .filter((line) => line.startsWith("box "))
          .every((line) => /^box \S+ as .+ \[time: [^,\]]+/u.test(line)),
        `${where} を書き戻した箱の行が box <id> as <名前> [time: <長さ>] の形でない`,
      ).toBe(true);
      const second = parse(printed, { lang });
      expect(
        second.ok ? second.diagram : undefined,
        `${where} を往復した JSON が最初と違う`,
      ).toEqual(source);
    }
    // 小さな階段の図の原本も、書き戻して読むと同じ原本に戻り、0s の長さを残す
    for (const [where, source] of [
      ["長さを書いた小さな階段", smallStairs()],
      ["長さを書かない小さな階段", smallStairs(null)],
    ] as const) {
      const read = api("readDiagram")(source);
      expect(read.ok, `${where}の図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(
        true,
      );
      const original = read.ok ? read.diagram : undefined;
      const printed = print(original);
      expect(printed.split("\n")[0], `${where}の図を書き戻した頭の行`).toBe(
        "lineup 小さな階段 [shape: stairs]",
      );
      const again = parse(printed, { lang: "ja" });
      expect(
        again.ok ? again.diagram : undefined,
        `${where}の図を往復した JSON が最初と違う\n${printed}`,
      ).toEqual(original);
    }
    const timedRead = api("readDiagram")(smallStairs());
    const timed = print(timedRead.ok ? timedRead.diagram : undefined);
    expect(timed, "0s の長さを書き戻さない").toMatch(/^box store as 置き場 \[time: 0s\b/mu);
  });
});

describe("階段の見た目の描き方 (#3640)", () => {
  it("lineup-stairs-step-down-to-the-right", () => {
    const cases: { where: string; source: Source; lang: Lang }[] = [
      { where: "小さな階段の図", source: smallStairs() as unknown as Source, lang: "ja" },
      {
        where: "長さを書かない小さな階段の図",
        source: smallStairs(null) as unknown as Source,
        lang: "ja",
      },
      ...samples(),
    ];
    for (const { where, source, lang } of cases) {
      for (const width of [undefined, PHONE]) {
        const at = `${where} (幅 ${width ?? "既定"})`;
        const rendered = render(source as unknown as Json, lang, width);
        const layout = stairsOf(rendered, at);
        const boxes = source.blocks.box ?? [];
        // 段は box を書いた順に上から置き、下の段ほど同じ幅だけ右へずれる
        expect(
          layout.lanes.map((lane) => lane.id),
          `${at} の段の並び`,
        ).toEqual(boxes.map((b) => b.id));
        const shift = (layout.lanes[1]?.x ?? 0) - (layout.lanes[0]?.x ?? 0);
        expect(shift, `${at} の 2 番目の段が上の段より右にずれない`).toBeGreaterThan(4);
        layout.lanes.forEach((lane, k) => {
          const above = layout.lanes[k - 1];
          if (!above) return;
          expect(lane.y, `${at} の ${lane.id} の段が上の段の下に無い`).toBeGreaterThanOrEqual(
            above.y + above.h - 0.5,
          );
          expect(
            lane.x - above.x,
            `${at} の ${lane.id} の段のずれが上の段のずれと違う`,
          ).toBeCloseTo(shift, 1);
          expect(lane.w, `${at} の ${lane.id} の段の幅が上の段と違う`).toBeCloseTo(above.w, 1);
        });
        // 描いた SVG の段も、書いた順に並ぶ
        const motion = motionFrom(rendered as unknown as Rendered);
        expect(
          partsOf(motion, "[data-lineup-layer]").map((el) => el.getAttribute("data-lineup-layer")),
          `${at} の描いた段の並び`,
        ).toEqual(boxes.map((b) => b.id));
        // 段の中に層の名前と説明を出し、その段の札と印は名前と説明に掛からない
        const bands = layout.bands ?? [];
        expect(
          bands.map((b) => b.lane),
          `${at} の段の名前と説明 (layout.bands)`,
        ).toEqual(boxes.map((b) => b.id));
        for (const box of boxes) {
          const lane = layout.lanes.find((l) => l.id === box.id) as Rect;
          const band = bands.find((b) => b.lane === box.id);
          if (!band) continue;
          expect(band.name.text, `${at} の ${box.id} の段の名前`).toBe(box.name);
          expect(band.desc?.text, `${at} の ${box.id} の段の説明`).toBe(box.sub);
          const texts = [band.name, ...(band.desc ? [band.desc] : [])];
          for (const t of texts)
            expect(inside(t, lane), `${at} の ${box.id} の段の字 ${t.text} が段の外に在る`).toBe(
              true,
            );
          const others: Rect[] = [
            ...layout.chips.filter((c) => c.lane === box.id),
            ...(layout.bandNotes ?? []).filter((n) => n.lane === box.id),
          ];
          for (const other of others)
            for (const t of texts)
              expect(
                overlaps(other, t),
                `${at} の ${box.id} の段の札か印が ${t.text} に掛かる`,
              ).toBe(false);
        }
      }
    }
  });

  it("lineup-stairs-item-moves-down", () => {
    const rendered = render(smallStairs());
    const layout = stairsOf(rendered, "小さな階段の図");
    const motion = motionFrom(rendered as unknown as Rendered);
    const { stills } = rendered.timeline;
    const order = ["cam", "send", "store"];
    // 札は line を書いた段で、その層の段へ下りる。どの段の止め絵でも、札は 1 枚だけが見え、その層の段の中に在る
    order.forEach((layer, s) => {
      const t = stills[s] ?? 0;
      const cards = shownAt(motion, '[data-lineup-card="clip"]', t);
      expect(cards.length, `段 ${s + 1} の止め絵で見える札の数`).toBe(1);
      expect(cards[0]?.getAttribute("data-lineup-on"), `段 ${s + 1} の止め絵の札の居る層`).toBe(
        layer,
      );
      const seat = layout.chips.find((c) => c.id === "clip" && c.step === s);
      expect(seat, `段 ${s + 1} の札の席 (layout.chips)`).toBeDefined();
      if (!seat) return;
      expect(seat.lane, `段 ${s + 1} の札の席の層`).toBe(layer);
      const lane = layout.lanes.find((l) => l.id === layer) as Rect;
      expect(inside(seat, lane), `段 ${s + 1} の札が ${layer} の段の中に無い`).toBe(true);
    });
    // 段 2 と段 3 の札は、前の層の席から滑って右下へ下りる。段 1 の札はどの層にも居なかったので弾んで現れる
    const seats = order.map((_, s) => layout.chips.find((c) => c.id === "clip" && c.step === s));
    expect(seats[0]?.from, "段 1 の札が滑り始める所を持つ").toBeUndefined();
    for (const s of [1, 2]) {
      const before = seats[s - 1];
      const seat = seats[s];
      expect(seat?.from, `段 ${s + 1} の札が前の層の席から滑らない`).toEqual(
        before ? [before.x, before.y] : undefined,
      );
      expect((seat?.y ?? 0) > (before?.y ?? 0), `段 ${s + 1} の札が前の層より下に下りない`).toBe(
        true,
      );
    }
    // 層と層の間に、札が歩く線と矢印を描かない
    expect(layout.arrows ?? [], "階段の見た目の矢印 (layout.arrows)").toEqual([]);
    expect(
      partsOf(motion, ".dg-ln-arrow, .dg-ln-ha, .dg-ln-aa, [data-lineup-ahead-arrow]").length,
      "階段の見た目の描いた矢印",
    ).toBe(0);
    const { left, right } = stairsEdge(layout);
    for (let k = 1; k < layout.lanes.length; k++) {
      const above = layout.lanes[k - 1] as Rect;
      const below = layout.lanes[k] as Rect;
      const gap = { top: above.y + above.h, bottom: below.y };
      if (gap.bottom - gap.top < 1) continue;
      const crossing = partsOf(motion, "path, line, polyline").filter((el) => {
        const d =
          el.getAttribute("d") ??
          el.getAttribute("points") ??
          `M${el.getAttribute("x1")} ${el.getAttribute("y1")}L${el.getAttribute("x2")} ${el.getAttribute("y2")}`;
        const points = [...d.matchAll(/(-?[\d.]+)[ ,]\s*(-?[\d.]+)/gu)].map(
          (m) => [Number(m[1]), Number(m[2])] as const,
        );
        return points.some(
          ([x, y]) => x > left && x < right && y > gap.top + 0.5 && y < gap.bottom - 0.5,
        );
      });
      expect(crossing.length, `${k} 番目と ${k + 1} 番目の段の間の線`).toBe(0);
    }
    // 列の図の見た目を書かない同じ図は、今どおり札を横に並べる
    const plain = render(smallStairs(null, null)).layout;
    expect(plain.arrangement, "見た目を書かない列の図の並べ方").toBe("row");
  });

  it("lineup-stairs-note-stamps-the-layer", () => {
    for (const lang of LANGS) {
      const rendered = render(smallStairs(), lang);
      const layout = stairsOf(rendered, `${lang} の小さな階段の図`);
      const motion = motionFrom(rendered as unknown as Rendered);
      const { stills } = rendered.timeline;
      // 段の中の note は、その段でその層の段に印を出し、後の段でも印を残す。まだ note を書いていない層は印を出さない
      const want: Record<string, string[]>[] = [
        { cam: ["撮った"], send: [], store: [] },
        { cam: ["撮った"], send: ["送った"], store: [] },
        { cam: ["撮った"], send: ["送った"], store: [] },
      ];
      want.forEach((layers, s) => {
        const t = stills[s] ?? 0;
        for (const [layer, texts] of Object.entries(layers)) {
          expect(
            textsAt(motion, `[data-lineup-band-note="${layer}"]`, t),
            `${lang} の段 ${s + 1} の止め絵の ${layer} の段の印`,
          ).toEqual(texts);
        }
      });
      // 印は、その層の段の中に置く
      const notes = layout.bandNotes ?? [];
      expect(
        notes.map((n) => [n.lane, n.text.text]),
        `${lang} の段の印 (layout.bandNotes)`,
      ).toEqual([
        ["cam", "撮った"],
        ["send", "送った"],
      ]);
      for (const note of notes) {
        const lane = layout.lanes.find((l) => l.id === note.lane) as Rect;
        expect(inside(note, lane), `${lang} の ${note.lane} の段の印が段の外に在る`).toBe(true);
        expect(inside(note.text, note), `${lang} の ${note.lane} の段の印の字が印の外に在る`).toBe(
          true,
        );
      }
    }
  });

  it("lineup-stairs-scale-at-nice-steps", () => {
    // 目盛りの数字は 0 から切りのよい間隔で置き、単位は箱に書いた中で一番大きい単位にする
    const cases: {
      where: string;
      source: Json;
      lang: Lang;
      unit: string;
      values?: number[];
      texts?: string[];
    }[] = [
      {
        where: "小さな階段の図",
        source: smallStairs(),
        lang: "ja",
        unit: "min",
        values: [0, 0.5, 1],
        texts: ["0分", "0.5分", "1分"],
      },
      {
        where: "英語の小さな階段の図",
        source: smallStairs(),
        lang: "en",
        unit: "min",
        values: [0, 0.5, 1],
        texts: ["0min", "0.5min", "1min"],
      },
      {
        where: "秒だけの小さな階段の図",
        source: smallStairs(["2s", "5s", "1s"]),
        lang: "ja",
        unit: "s",
        values: [0, 2, 4, 6, 8],
        texts: ["0秒", "2秒", "4秒", "6秒", "8秒"],
      },
      ...samples().map(({ where, source, lang }) => ({
        where,
        source: source as unknown as Json,
        lang,
        unit: "min",
      })),
    ];
    for (const { where, source, lang, unit, values, texts } of cases) {
      const rendered = render(source, lang);
      const layout = stairsOf(rendered, where);
      const scale = scaleOf(layout, where);
      expect(scale.unit, `${where} の目盛りの単位`).toBe(unit);
      expect(scale.axis, `${where} の既定の幅の目盛りの向き`).toBe("vertical");
      const got = scale.ticks.map((t) => t.value);
      if (values) expect(got, `${where} の目盛りの数字`).toEqual(values);
      if (texts)
        expect(
          scale.ticks.map((t) => t.text),
          `${where} の目盛りの字`,
        ).toEqual(texts);
      // 0 から始まり、間隔は 1、2、5 に 10 の累乗を掛けた数で揃う
      expect(got[0], `${where} の最初の目盛り`).toBe(0);
      expect(got.length, `${where} の目盛りの数`).toBeGreaterThanOrEqual(2);
      const step = (got[1] ?? 0) - (got[0] ?? 0);
      const mantissa = Number((step / 10 ** Math.floor(Math.log10(step))).toFixed(6));
      expect([1, 2, 5], `${where} の目盛りの間隔 ${step}`).toContain(mantissa);
      got.forEach((v, k) =>
        expect(v, `${where} の ${k + 1} 番目の目盛り`).toBeCloseTo(k * step, 6),
      );
      // 目盛りは上から下へ時間が進み、数字どうしと段に掛からず、階段の右に在る
      const { right } = stairsEdge(layout);
      scale.ticks.forEach((tick, k) => {
        const above = scale.ticks[k - 1];
        if (above)
          expect(
            tick.at,
            `${where} の ${tick.text} の目盛りが前の目盛りより下に無い`,
          ).toBeGreaterThan(above.at);
        if (above)
          expect(
            overlaps(tick.rect, above.rect),
            `${where} の ${tick.text} の目盛りの字が前の字に掛かる`,
          ).toBe(false);
        expect(
          tick.rect.x,
          `${where} の ${tick.text} の目盛りの字が階段の右に無い`,
        ).toBeGreaterThanOrEqual(right);
      });
      expect(scale.line.x, `${where} の目盛りの線が階段の右に無い`).toBeGreaterThanOrEqual(right);
      expect(scale.line.h, `${where} の目盛りの線が縦でない`).toBeGreaterThan(scale.line.w);
      // 描いた SVG に目盛りと数字が在る
      const motion = motionFrom(rendered as unknown as Rendered);
      expect(partsOf(motion, "[data-stairs-scale]").length, `${where} の描いた目盛り`).toBe(1);
      expect(
        partsOf(motion, "[data-stairs-tick]").map((el) => el.textContent),
        `${where} の描いた目盛りの数字`,
      ).toEqual(scale.ticks.map((t) => t.text));
    }
    // 長さを書かない階段の見た目は目盛りと針を出さない
    const bare = render(smallStairs(null));
    expect(
      stairsOf(bare, "長さを書かない小さな階段").scale,
      "長さを書かない階段の目盛り",
    ).toBeUndefined();
    expect(bare.layout.needles ?? [], "長さを書かない階段の針").toEqual([]);
    const motion = motionFrom(bare as unknown as Rendered);
    expect(
      partsOf(
        motion,
        "[data-stairs-scale], [data-stairs-tick], [data-stairs-needle], [data-stairs-elapsed]",
      ).length,
      "長さを書かない階段の描いた目盛りと針",
    ).toBe(0);
  });

  it("lineup-stairs-needle-shows-elapsed-time", () => {
    // 段ごとの、札の居る層までに経った時間 (分で数えた値) と、針の札の字
    const want: Record<Lang, { value: number; text: string }[]> = {
      ja: [
        { value: 20 / 60, text: "20秒" },
        { value: 80 / 60, text: "1分20秒" },
        { value: 80 / 60, text: "1分20秒" },
      ],
      en: [
        { value: 20 / 60, text: "20s" },
        { value: 80 / 60, text: "1min 20s" },
        { value: 80 / 60, text: "1min 20s" },
      ],
    };
    for (const lang of LANGS) {
      for (const width of [undefined, PHONE]) {
        const at = `${lang} の小さな階段の図 (幅 ${width ?? "既定"})`;
        const rendered = render(smallStairs(), lang, width);
        const layout = stairsOf(rendered, at);
        const scale = scaleOf(layout, at);
        const needles = layout.needles ?? [];
        expect(
          needles.map((n) => n.step),
          `${at} の段ごとの針 (layout.needles)`,
        ).toEqual([0, 1, 2]);
        // 針の所は目盛りの数字と同じ物差しで、経った時間の所に在る
        const [first, second] = scale.ticks;
        const per = first && second ? (second.at - first.at) / (second.value - first.value) : 0;
        needles.forEach((needle, s) => {
          const expected = want[lang][s];
          if (!expected) return;
          expect(needle.value, `${at} の段 ${s + 1} の経った時間`).toBeCloseTo(expected.value, 6);
          expect(needle.text, `${at} の段 ${s + 1} の針の札の字`).toBe(expected.text);
          expect(needle.at, `${at} の段 ${s + 1} の針の所`).toBeCloseTo(
            (first?.at ?? 0) + expected.value * per,
            1,
          );
          const before = needles[s - 1];
          if (before)
            expect(needle.at, `${at} の段 ${s + 1} の針が戻る`).toBeGreaterThanOrEqual(
              before.at - 0.01,
            );
          // 針の札は段に掛からない
          for (const lane of layout.lanes)
            expect(
              overlaps(needle.chip, lane),
              `${at} の段 ${s + 1} の針の札が ${lane.id} の段に掛かる`,
            ).toBe(false);
        });
        // 描いた SVG では、各段の止め絵でその段の針の札だけが見える
        const motion = motionFrom(rendered as unknown as Rendered);
        const { stills } = rendered.timeline;
        expect(partsOf(motion, "[data-stairs-needle]").length, `${at} の描いた針`).toBeGreaterThan(
          0,
        );
        want[lang].forEach((expected, s) => {
          expect(
            textsAt(motion, "[data-stairs-elapsed]", stills[s] ?? 0),
            `${at} の段 ${s + 1} の止め絵の針の札`,
          ).toEqual([expected.text]);
        });
      }
    }
  });

  it("lineup-stairs-scale-below-at-phone-width", () => {
    const cases: { where: string; source: Json; lang: Lang }[] = [
      { where: "小さな階段の図", source: smallStairs(), lang: "ja" },
      ...samples().map(({ where, source, lang }) => ({
        where,
        source: source as unknown as Json,
        lang,
      })),
    ];
    for (const { where, source, lang } of cases) {
      const at = `${where} (幅 ${PHONE})`;
      const layout = stairsOf(render(source, lang, PHONE), at);
      const scale = scaleOf(layout, at);
      // 階段の層は幅に収まり、幅を広く使う
      expect(layout.width, `${at} の図の幅`).toBeLessThanOrEqual(PHONE + 0.5);
      const { left, right, bottom } = stairsEdge(layout);
      expect(left, `${at} の階段の左の端`).toBeGreaterThanOrEqual(-0.5);
      expect(right, `${at} の階段の右の端`).toBeLessThanOrEqual(PHONE + 0.5);
      expect(right - left, `${at} の階段が幅を広く使わない`).toBeGreaterThanOrEqual(PHONE * 0.75);
      // 目盛りは図の下に横向きで置き、左から右へ時間が進み、幅に収まる
      expect(scale.axis, `${at} の目盛りの向き`).toBe("horizontal");
      expect(scale.line.y, `${at} の目盛りの線が階段の下に無い`).toBeGreaterThanOrEqual(bottom);
      expect(scale.line.w, `${at} の目盛りの線が横でない`).toBeGreaterThan(scale.line.h);
      scale.ticks.forEach((tick, k) => {
        const before = scale.ticks[k - 1];
        if (before)
          expect(tick.at, `${at} の ${tick.text} の目盛りが前の目盛りより右に無い`).toBeGreaterThan(
            before.at,
          );
        if (before)
          expect(
            overlaps(tick.rect, before.rect),
            `${at} の ${tick.text} の目盛りの字が前の字に掛かる`,
          ).toBe(false);
        expect(
          tick.rect.y,
          `${at} の ${tick.text} の目盛りの字が階段の下に無い`,
        ).toBeGreaterThanOrEqual(bottom);
        expect(
          inside(tick.rect, { x: 0, y: 0, w: PHONE, h: layout.height }),
          `${at} の ${tick.text} の目盛りの字が図の外に在る`,
        ).toBe(true);
      });
      for (const needle of layout.needles ?? []) {
        expect(
          inside(needle.chip, { x: 0, y: 0, w: PHONE, h: layout.height }),
          `${at} の段 ${needle.step + 1} の針の札が図の外に在る`,
        ).toBe(true);
      }
    }
  });
});

describe("階段の見た目で描けない列の図 (#3640)", () => {
  it("lineup-stairs-rejects-misused-words", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札は英字にする
    const boxes = (n: number, time = "3s"): string[] =>
      Array.from({ length: n }, (_, k) => `box L${k + 1} [time: ${time}]`);
    const tail = ["item clip", "step One", "  say Goes down.", "  line L1: clip"];
    // 記法の行と、誤りの行 (1 から数える) と、誤りの文が名指す語
    const cases: [string, string[], string, string[]][] = [
      [
        "見た目を書かない列の図の箱の長さ",
        ["lineup Lanes", "box L1 [time: 3s]", "box L2", ...tail],
        "box L1",
        ["time", "stairs"],
      ],
      [
        "層の見た目の箱の長さ",
        ["lineup Layers [shape: layers]", "box L1 [time: 3s]", "box L2", ...tail],
        "box L1",
        ["time", "stairs"],
      ],
      [
        "一部の箱にだけ書いた長さ",
        ["lineup Stairs [shape: stairs]", "box L1 [time: 3s]", "box L2", ...tail],
        "box L2",
        ["L2", "time"],
      ],
      [
        "一部の箱にだけ書いた長さ (前の箱に無い)",
        ["lineup Stairs [shape: stairs]", "box L1", "box L2 [time: 3s]", ...tail],
        "box L1",
        ["L1", "time"],
      ],
      [
        "単位の無い長さ",
        ["lineup Stairs [shape: stairs]", "box L1 [time: 3]", "box L2 [time: 3s]", ...tail],
        "box L1",
        ["3"],
      ],
      [
        "数でない長さ",
        ["lineup Stairs [shape: stairs]", "box L1 [time: fast]", "box L2 [time: 3s]", ...tail],
        "box L1",
        ["fast"],
      ],
      [
        "負の長さ",
        ["lineup Stairs [shape: stairs]", "box L1 [time: -1s]", "box L2 [time: 3s]", ...tail],
        "box L1",
        ["-1s"],
      ],
      [
        "9つの層",
        ["lineup Stairs [shape: stairs]", ...boxes(MOST_LAYERS + 1), ...tail],
        `box L${MOST_LAYERS + 1}`,
        [],
      ],
      // 階段の見た目も層の見た目と同じく、封と開けると選ぶと札と役を描かないので、読む時に断る
      [
        "封",
        ["lineup Stairs [shape: stairs]", ...boxes(2), ...tail, "  seal L1"],
        "  seal L1",
        ["seal"],
      ],
    ];
    for (const [name, lines, head, words] of cases) {
      const text = lines.join("\n");
      for (const lang of LANGS) {
        const read = parse(text, { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(
          first?.line,
          `${name} の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`,
        ).toBe(lineOf(text, head));
        const message = first?.message ?? "";
        expect(message, `${name} の誤りの文 (${lang})`).not.toBe("");
        expect(KANA.test(message), `${name} の誤りの文の言葉 (${lang}): ${message}`).toBe(
          lang === "ja",
        );
        for (const word of words)
          expect(message, `${name} の誤りの文 (${lang}) が ${word} を名指さない`).toContain(word);
      }
    }
    // 8つの層と、0s の長さは階段の見た目で読む
    const accepted: [string, string[]][] = [
      ["8つの層", ["lineup Stairs [shape: stairs]", ...boxes(MOST_LAYERS), ...tail]],
      ["0s の長さ", ["lineup Stairs [shape: stairs]", ...boxes(3, "0s"), ...tail]],
      ["長さを書かない階段", ["lineup Stairs [shape: stairs]", "box L1", "box L2", ...tail]],
    ];
    for (const [name, lines] of accepted) {
      const read = parse(lines.join("\n"));
      expect(read.ok, `${name} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(
        true,
      );
      if (read.ok)
        expect((read.diagram as unknown as Source).lineup?.shape, `${name} の見た目`).toBe(
          "stairs",
        );
    }
  });
});

describe("階段の見た目の見本 (#3640)", () => {
  it("lineup-stairs-examples-in-both-langs-have-no-breaks", () => {
    const sources: Partial<Record<Lang, Source>> = {};
    for (const { where, text, source, lang } of samples()) {
      // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
      expect(text.split("\n")[0] ?? "", `${where} の最初の行`).toMatch(/^\/\/ /u);
      expect(
        /#\d+/u.test(text.split("\n")[0] ?? ""),
        `${where} の最初の注釈の行に作業の番号がある`,
      ).toBe(false);
      sources[lang] = source;
      expect(source.lineup?.shape, `${where} の見た目`).toBe("stairs");
      expect(
        (source.blocks.box ?? []).every((b) => b.time !== undefined),
        `${where} の全ての箱に長さが無い`,
      ).toBe(true);
      // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
      const problems = checkText(where, text, "notation", lang, {
        layout: (step, said) => `段 ${step}: ${said}`,
      }).map(problemLine);
      expect(problems, `${where} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, PHONE]) {
        const layout = stairsOf(
          render(source as unknown as Json, lang, width),
          `${where} (幅 ${width ?? "既定"})`,
        );
        expect(layout.lanes.length, `${where} を幅 ${width ?? "既定"} で描いた段の数`).toBe(
          source.blocks.box?.length ?? -1,
        );
      }
    }
    expect(sources.ja && sources.en, `${SAMPLE} の日本語版と英語版が揃わない`).toBeTruthy();
    if (sources.ja && sources.en)
      expect(
        shapeOf(sources.en),
        `${SAMPLE} の英語版の層と長さと札と段と出来事の数が日本語版と違う`,
      ).toEqual(shapeOf(sources.ja));
    // 見本帳の見本の一覧に載り、列の図の頁に並ぶ
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(
      true,
    );
    expect(samplesOf("lineup"), `見本帳の列の図の頁に ${SAMPLE} が無い`).toContain(SAMPLE);
    for (const lang of LANGS) {
      expect(
        exampleText(SAMPLE, lang),
        `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`,
      ).toBe((fileText(`${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
    }
  });
});

describe("階段の見た目の棚 (#3640)", () => {
  it("lineup-stairs-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、階段の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(
        kinds.some((line) => /^lineup <[^>]+> \[shape: stairs\]$/u.test(line)),
        `棚の記法の早見 (${lang}) に lineup の階段の見た目の頭の行が無い: ${kinds.join(" / ")}`,
      ).toBe(true);
      // 列の図の見本の束に階段の見た目の見本が在り、雛形が誤り無く階段の見た目の列の図として読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "lineup");
      expect(group, `棚の見本の束 (${lang}) に列の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      expect(keys, `棚の列の図の束 (${lang}) に ${SAMPLE} が無い`).toContain(SAMPLE);
      if (!keys.includes(SAMPLE)) continue;
      const text = exampleText(SAMPLE, lang) ?? "";
      expect(
        parsed(text, lang, `棚の雛形 ${SAMPLE} (${lang})`).lineup?.shape,
        `棚の雛形 ${SAMPLE} (${lang}) の見た目`,
      ).toBe("stairs");
    }
  });
});

describe("階段の見た目の軽い入口 (#3640)", () => {
  it("lineup-stairs-light-entry-draws-after-load-for", () => {
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
      "  out.layers = (drawn.svg.match(/data-lineup-layer=/g) ?? []).length;",
      "  out.scale = (drawn.svg.match(/data-stairs-scale/g) ?? []).length;",
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
    expect(failure, "軽い入口で階段の見た目を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as {
      ok?: boolean;
      errors?: unknown[];
      arrangement?: string;
      layers?: number;
      scale?: number;
      same?: boolean;
    };
    expect(
      out.ok,
      `軽い入口で loadFor を待った後に階段の見た目を読めない: ${JSON.stringify(out.errors)}`,
    ).toBe(true);
    expect(out.arrangement, "軽い入口で描いた図の並べ方").toBe("stairs");
    expect(out.layers, "軽い入口で描いた段の部品の数").toBe(
      parsed(text, "ja", SAMPLE).blocks.box?.length ?? -1,
    );
    expect(out.scale, "軽い入口で描いた目盛りの部品の数").toBe(1);
    expect(out.same, "軽い入口と既定の入口で描いた階段の見た目が違う").toBe(true);
  });
});

describe("階段の見た目の書き方の文書 (#3640)", () => {
  it("lineup-stairs-docs-describe-the-shape", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const stairsFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).lineup?.shape === "stairs";
      }).length;
    for (const path of [
      "packages/dragon/README.md",
      "packages/dragon/README.ja.md",
      "packages/dragon/examples/quick-start.md",
      "packages/dragon/examples/quick-start.en.md",
    ]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: stairs\]/u.test(text), `${path} に [shape: stairs] の書き方が無い`).toBe(
        true,
      );
      expect(
        /\[time: /u.test(text.slice(text.indexOf("[shape: stairs]"))),
        `${path} の [shape: stairs] の後に [time: ] の書き方が無い`,
      ).toBe(true);
      expect(
        stairsFences(text),
        `${path} に階段の見た目として読める dragon の囲みが無い`,
      ).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = readdirSync(join(ROOT, "apps/playground-spa/src/docs/examples")).map((file) =>
      repoText(`apps/playground-spa/src/docs/examples/${file}`),
    );
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) =>
      repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`),
    );
    expect(
      /\[shape: stairs\]/u.test([content, ...sections, ...paragraphs].join("\n")),
      "使い方の頁に [shape: stairs] の書き方が無い",
    ).toBe(true);
  });
});
