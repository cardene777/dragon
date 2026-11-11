// @vitest-environment jsdom
/**
 * 列の図の層の見た目 (#3625)。
 *
 * 列の図 (`lineup`) の見た目に `[shape: layers]` を足す。新しい図の種類は足さず、今の `box` と `item` と `line` と `note` をそのまま使う。
 * 箱 (`box`) を書いた順に上から横の帯に重ね、帯の左に層の名前と説明 (`box` の `[note: ]`) を出す。
 * 段の中に `line <層>: <札>` を書くと、その段で札がその層の帯へ下り、`note <層>: <文>` を書くと、その段でその層の帯に印を出して後の段でも残す。
 * 層と層の間に矢印は描かない。9つ以上の層と、層の見た目で描かない行 (`[order: none]`、`seal`、`open`、`pick`、`stamp`、`role`) は読む時に断る。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (横の帯を重ねる)。
 *
 * 帯の置き場所は描く部品が返す置き場所 (`layout.lanes` と `layout.bands`) で、札と印の見え方は描いた SVG の keyframes を jsdom で読んで、各段の止め絵の時刻で確かめる。
 * 部品は検査と読み上げの道具が引けるよう、帯は `data-lineup-layer`、札は `data-lineup-card` (居る層は `data-lineup-on`)、
 * 印は `data-lineup-band-note` に層の名札を持つ。
 * 見本の file と層の見た目がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Rect, type Rendered } from "./render-support";

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

/** 層の見た目の見本。Web3 の L2 の取引が確定するまでと、一般の Web の頼みが画面から置き場まで届くまで */
const SAMPLES = ["l2-finality", "web-request"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 層の見た目で描く層の上限 */
const MOST_LAYERS = 8;

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
    box?: { id: string; name: string; sub?: string; color?: string; order?: string }[];
    item?: { id: string; color?: string; label?: string; note?: string }[];
  };
  steps: { title: string; body?: string; events: SourceEvent[] }[];
}

/** 字の置き場所。`text` は描く字 */
type Writing = Rect & { text: string };

/** 層の帯。帯そのものの四角は `layout.lanes` の箱が持ち、帯の左の名前と説明はここが持つ */
interface Band {
  lane: string;
  name: Writing;
  desc?: Writing;
}

/** 札が層の帯に居る間 1 回分。`from` は滑り始める左上で、弾んで現れる札は持たない */
interface Seat extends Rect {
  id: string;
  lane: string;
  step: number;
  event: number;
  from?: [number, number];
}

/** 層の帯の印。`note` の行 1 つ分 */
interface BandNote extends Rect {
  lane: string;
  step: number;
  event: number;
  text: Writing;
}

interface LayersLayout {
  kind: string;
  arrangement?: string;
  width: number;
  height: number;
  lanes: (Rect & { id: string; name: string; title: Writing })[];
  bands?: Band[];
  bandNotes?: BandNote[];
  chips: Seat[];
  arrows?: unknown[];
}

interface LayersRendered extends Omit<Rendered, "layout"> {
  layout: LayersLayout;
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

const lineEvent = (box: string, items: string[]): Json => ({ type: "line", box, items });
const noteEvent = (box: string, text: string): Json => ({ type: "swap", box, text });

/**
 * 3 つの層を上から重ね、取引の札 1 枚が段ごとに 1 つずつ下りる最小の層の図。段 1 と段 2 で、札が下りた層に印を出す。
 * `shape` を外すと、同じ箱とチップと段の今の列の図になる
 */
function smallLayers(shape: string | undefined = "layers"): Json {
  return {
    version: 2,
    kind: "lineup",
    title: "小さな層",
    ...(shape === undefined ? {} : { lineup: { shape } }),
    blocks: {
      box: [
        { id: "app", name: "アプリ", sub: "画面で頼む", color: "blue" },
        { id: "wallet", name: "ウォレット", sub: "鍵で署名する", color: "violet" },
        { id: "chain", name: "チェーン", color: "green" },
      ],
      item: [{ id: "tx", color: "blue", note: "100 USDCを替える" }],
    },
    steps: [
      { title: "頼む", body: "アプリで頼む。", events: [lineEvent("app", ["tx"]), noteEvent("app", "頼んだ")] },
      { title: "署名する", body: "ウォレットが署名する。", events: [lineEvent("wallet", ["tx"]), noteEvent("wallet", "署名した")] },
      { title: "載せる", body: "チェーンに載る。", events: [lineEvent("chain", ["tx"])] },
    ],
  };
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: Lang = "ja", width?: number): LayersRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "層の見た目の列の図を描けない").toBe("");
  return rendered as unknown as LayersRendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 描いた図の部品。全て返す */
const partsOf = (motion: Motion, selector: string): Element[] => [...motion.doc.querySelectorAll(selector)];

/** 時刻 `t` に見えている (濃さが 0.9 を超える) 部品 */
const shownAt = (motion: Motion, selector: string, t: number): Element[] => partsOf(motion, selector).filter((el) => motion.opacity(el, t) > 0.9);

/** 時刻 `t` に見えている部品の字 */
const textsAt = (motion: Motion, selector: string, t: number): string[] => shownAt(motion, selector, t).map((el) => el.textContent ?? "");

/** 層の見た目の置き場所。層の見た目で並べていなければ落とす */
function layersOf(rendered: LayersRendered, where: string): LayersLayout {
  const { layout } = rendered;
  expect(layout.arrangement, `${where} を層の見た目で並べていない`).toBe("layers");
  return layout;
}

/** 四角 `inner` が四角 `outer` の中に在るか */
const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.w <= outer.x + outer.w + 0.5 && inner.y + inner.h <= outer.y + outer.h + 0.5;

/** 記法の行の、注釈と空の行を除いた並び */
const codeLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "" && !line.trimStart().startsWith("//"));

/** 原本の層と札と段と段ごとの出来事の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.lineup?.shape,
  layers: (d.blocks.box ?? []).map((b) => b.id),
  items: (d.blocks.item ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.map((e) => e.type)),
});

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});

describe("層の見た目の原本の JSON (#3625)", () => {
  it("schema-accepts-lineup-layers", () => {
    const validate = api("validateDiagram");
    const checked = validate(smallLayers());
    expect(checked.ok, `層の見た目の最小の列の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    // 層の見た目のほかの綴りは、見た目の欄を指して断る
    const wrong = validate(smallLayers("stack"));
    expect(pointers(wrong), "層の見た目のほかの綴りの誤りの場所").toContain("/lineup/shape");
    // 列の図の見た目の欄は、列の図のほかの種類の図には書けない
    const chart = { version: 2, kind: "chart", title: "量", lineup: { shape: "layers" }, chart: { shape: "bar", items: [{ id: "a", name: "甲" }] }, blocks: {}, steps: [{ title: "一", body: "甲。", events: [{ type: "set", item: "a", value: 1 }] }] };
    expect(pointers(validate(chart)), "量の図に書いた列の図の見た目の誤りの場所").toContain("/lineup");
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

describe("層の見た目の記法 (#3625)", () => {
  it("lineup-layers-roundtrip-keeps-notation", () => {
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
        expect((first.diagram as unknown as Source).lineup?.shape, `${file} の見た目`).toBe("layers");
        // 書き戻すと、注釈の行のほかは書いた記法と同じ行に戻る
        const printed = print(first.diagram);
        expect(codeLines(printed), `${file} を書き戻した記法が書いた記法と違う`).toEqual(codeLines(text));
        expect(codeLines(printed)[0], `${file} を書き戻した頭の行`).toMatch(/^lineup .+ \[shape: layers\]$/u);
        const second = parse(printed, { lang });
        expect(second.ok ? second.diagram : undefined, `${file} を往復した JSON が最初と違う`).toEqual(first.diagram);
      }
    }
    // 小さな層の図の原本も、書き戻して読むと同じ原本に戻る
    const read = api("readDiagram")(smallLayers());
    expect(read.ok, `小さな層の図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    const source = read.ok ? read.diagram : undefined;
    const printed = print(source);
    expect(printed.split("\n")[0], "小さな層の図を書き戻した頭の行").toBe("lineup 小さな層 [shape: layers]");
    const again = parse(printed, { lang: "ja" });
    expect(again.ok ? again.diagram : undefined, `小さな層の図を往復した JSON が最初と違う\n${printed}`).toEqual(source);
  });
});

describe("層の見た目の描き方 (#3625)", () => {
  it("lineup-layers-stack-boxes-top-to-bottom", () => {
    const cases: { where: string; source: Source; lang: Lang }[] = [{ where: "小さな層の図", source: smallLayers() as unknown as Source, lang: "ja" }];
    for (const name of SAMPLES) {
      for (const lang of LANGS) {
        const file = `${name}${lang === "en" ? ".en" : ""}.dragon`;
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text !== undefined) cases.push({ where: file, source: parsed(text, lang, file), lang });
      }
    }
    for (const { where, source, lang } of cases) {
      const rendered = render(source as unknown as Json, lang);
      const layout = layersOf(rendered, where);
      const boxes = source.blocks.box ?? [];
      // 帯は box を書いた順に上から重なり、同じ左端と幅を持ち、間を空ける
      expect(layout.lanes.map((lane) => lane.id), `${where} の帯の並び`).toEqual(boxes.map((b) => b.id));
      layout.lanes.forEach((lane, k) => {
        const above = layout.lanes[k - 1];
        if (!above) return;
        expect(lane.y, `${where} の ${lane.id} の帯が上の帯の下に無い`).toBeGreaterThan(above.y + above.h);
        expect(lane.x, `${where} の ${lane.id} の帯の左端が上の帯と揃わない`).toBeCloseTo(above.x, 1);
        expect(lane.w, `${where} の ${lane.id} の帯の幅が上の帯と違う`).toBeCloseTo(above.w, 1);
      });
      // 描いた SVG の帯も、書いた順に並ぶ
      const motion = motionFrom(rendered as unknown as Rendered);
      expect(
        partsOf(motion, "[data-lineup-layer]").map((el) => el.getAttribute("data-lineup-layer")),
        `${where} の描いた帯の並び`,
      ).toEqual(boxes.map((b) => b.id));
      // 帯の左に層の名前と説明を出し、名前と説明は帯の中で、その帯の札と印より左に在る
      const bands = layout.bands ?? [];
      expect(bands.map((b) => b.lane), `${where} の帯の名前と説明 (layout.bands)`).toEqual(boxes.map((b) => b.id));
      for (const box of boxes) {
        const lane = layout.lanes.find((l) => l.id === box.id) as Rect;
        const band = bands.find((b) => b.lane === box.id);
        if (!band) continue;
        expect(band.name.text, `${where} の ${box.id} の帯の名前`).toBe(box.name);
        expect(band.desc?.text, `${where} の ${box.id} の帯の説明`).toBe(box.sub);
        const texts = [band.name, ...(band.desc ? [band.desc] : [])];
        const right = Math.max(...texts.map((t) => t.x + t.w));
        for (const t of texts) expect(inside(t, lane), `${where} の ${box.id} の帯の字 ${t.text} が帯の外に在る`).toBe(true);
        expect(band.name.x - lane.x, `${where} の ${box.id} の帯の名前が帯の左に無い`).toBeLessThan(lane.w / 4);
        const others: Rect[] = [...layout.chips.filter((c) => c.lane === box.id), ...(layout.bandNotes ?? []).filter((n) => n.lane === box.id)];
        for (const other of others) expect(other.x, `${where} の ${box.id} の帯の札か印が名前と説明に掛かる`).toBeGreaterThan(right);
      }
    }
  });

  it("lineup-layers-item-moves-down", () => {
    const rendered = render(smallLayers());
    const layout = layersOf(rendered, "小さな層の図");
    const motion = motionFrom(rendered as unknown as Rendered);
    const { stills } = rendered.timeline;
    const order = ["app", "wallet", "chain"];
    // 札は line を書いた段で、その層の帯へ下りる。どの段の止め絵でも、札は 1 枚だけが見え、その層の帯の中に在る
    order.forEach((layer, s) => {
      const t = stills[s] ?? 0;
      const cards = shownAt(motion, '[data-lineup-card="tx"]', t);
      expect(cards.length, `段 ${s + 1} の止め絵で見える札の数`).toBe(1);
      expect(cards[0]?.getAttribute("data-lineup-on"), `段 ${s + 1} の止め絵の札の居る層`).toBe(layer);
      const seat = layout.chips.find((c) => c.id === "tx" && c.step === s);
      expect(seat, `段 ${s + 1} の札の席 (layout.chips)`).toBeDefined();
      if (!seat) return;
      expect(seat.lane, `段 ${s + 1} の札の席の層`).toBe(layer);
      const lane = layout.lanes.find((l) => l.id === layer) as Rect;
      expect(inside(seat, lane), `段 ${s + 1} の札が ${layer} の帯の中に無い`).toBe(true);
    });
    // 段 2 と段 3 の札は、前の段の層の席から滑って下りる。段 1 の札はどの層にも居なかったので弾んで現れる
    const seats = order.map((_, s) => layout.chips.find((c) => c.id === "tx" && c.step === s));
    expect(seats[0]?.from, "段 1 の札が滑り始める所を持つ").toBeUndefined();
    for (const s of [1, 2]) {
      const before = seats[s - 1];
      const seat = seats[s];
      expect(seat?.from, `段 ${s + 1} の札が前の層の席から滑らない`).toEqual(before ? [before.x, before.y] : undefined);
      expect((seat?.y ?? 0) > (before?.y ?? 0), `段 ${s + 1} の札が前の層より下に下りない`).toBe(true);
    }
    // 列の図の見た目を書かない同じ図は、今どおり札を横に並べ、層の見た目で並べない
    const plain = render(smallLayers(undefined)).layout;
    expect(plain.arrangement, "見た目を書かない列の図の並べ方").toBe("row");
    expect(plain.bands ?? [], "見た目を書かない列の図の帯").toEqual([]);
  });

  it("lineup-layers-note-stamps-the-layer", () => {
    for (const lang of LANGS) {
      const rendered = render(smallLayers(), lang);
      const layout = layersOf(rendered, `${lang} の小さな層の図`);
      const motion = motionFrom(rendered as unknown as Rendered);
      const { stills } = rendered.timeline;
      // 段の中の note は、その段でその層の帯に印を出し、後の段でも印を残す。まだ note を書いていない層は印を出さない
      const want: Record<string, string[]>[] = [
        { app: ["頼んだ"], wallet: [], chain: [] },
        { app: ["頼んだ"], wallet: ["署名した"], chain: [] },
        { app: ["頼んだ"], wallet: ["署名した"], chain: [] },
      ];
      want.forEach((layers, s) => {
        const t = stills[s] ?? 0;
        for (const [layer, texts] of Object.entries(layers)) {
          expect(textsAt(motion, `[data-lineup-band-note="${layer}"]`, t), `${lang} の段 ${s + 1} の止め絵の ${layer} の帯の印`).toEqual(texts);
        }
      });
      // 印は、その層の帯の中に置く
      const notes = layout.bandNotes ?? [];
      expect(notes.map((n) => [n.lane, n.text.text]), `${lang} の帯の印 (layout.bandNotes)`).toEqual([
        ["app", "頼んだ"],
        ["wallet", "署名した"],
      ]);
      for (const note of notes) {
        const lane = layout.lanes.find((l) => l.id === note.lane) as Rect;
        expect(inside(note, lane), `${lang} の ${note.lane} の帯の印が帯の外に在る`).toBe(true);
        expect(inside(note.text, note), `${lang} の ${note.lane} の帯の印の字が印の外に在る`).toBe(true);
      }
    }
  });

  it("lineup-layers-draws-no-arrows-between-layers", () => {
    const cases: { where: string; source: Json; lang: Lang }[] = [{ where: "小さな層の図", source: smallLayers(), lang: "ja" }];
    for (const name of SAMPLES) {
      for (const lang of LANGS) {
        const file = `${name}${lang === "en" ? ".en" : ""}.dragon`;
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text !== undefined) cases.push({ where: file, source: parsed(text, lang, file) as unknown as Json, lang });
      }
    }
    for (const { where, source, lang } of cases) {
      for (const width of [undefined, 390]) {
        const rendered = render(source, lang, width);
        const layout = layersOf(rendered, `${where} (幅 ${width ?? "既定"})`);
        // 層と層の間に矢印を置かず、列の図の矢印 (置き場と札の間、名前の下の向き、「この先」の帯の間) も描かない
        expect(layout.arrows ?? [], `${where} (幅 ${width ?? "既定"}) の矢印 (layout.arrows)`).toEqual([]);
        const motion = motionFrom(rendered as unknown as Rendered);
        expect(partsOf(motion, ".dg-ln-arrow, .dg-ln-ha, .dg-ln-aa, [data-lineup-ahead-arrow]").length, `${where} (幅 ${width ?? "既定"}) の描いた矢印`).toBe(0);
        // 帯どうしの間に、線と形を描かない
        const lanes = layout.lanes;
        for (let k = 1; k < lanes.length; k++) {
          const above = lanes[k - 1] as Rect;
          const below = lanes[k] as Rect;
          const gap = { top: above.y + above.h, bottom: below.y };
          const crossing = partsOf(motion, "path, line").filter((el) => {
            const box = el.getAttribute("d") ?? `M${el.getAttribute("x1")} ${el.getAttribute("y1")}L${el.getAttribute("x2")} ${el.getAttribute("y2")}`;
            const ys = [...box.matchAll(/[ML]\s*-?[\d.]+[ ,]\s*(-?[\d.]+)/gu)].map((m) => Number(m[1]));
            return ys.some((y) => y > gap.top + 0.5 && y < gap.bottom - 0.5);
          });
          expect(crossing.length, `${where} (幅 ${width ?? "既定"}) の ${k} 番目と ${k + 1} 番目の帯の間の線`).toBe(0);
        }
      }
    }
  });
});

describe("層の見た目で描けない列の図 (#3625)", () => {
  it("lineup-layers-rejects-more-than-eight-layers", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札は英字にする
    const boxes = (n: number): string[] => Array.from({ length: n }, (_, k) => `box L${k + 1}`);
    const tail = ["item tx", "step One", "  say Goes down.", "  line L1: tx"];
    const at = (line: string, token: string): number => line.indexOf(token);
    // 記法の行と、誤りの行 (0 から数える) と、その行の中の誤りを指す語の位置 (0 から数える)。位置を確かめない誤りは -1
    const cases: [string, string[], number, number][] = [
      ["9つの層", ["lineup Layers [shape: layers]", ...boxes(MOST_LAYERS + 1), ...tail], MOST_LAYERS + 1, 0],
      // 層の見た目では順番の無い置き場と、封と開けると選ぶと札と役を描かないので、読む時に断る
      ["順番の無い置き場", ["lineup Layers [shape: layers]", "box L1", "box L2 [order: none]", ...tail], 2, at("box L2 [order: none]", "order")],
      ["封", ["lineup Layers [shape: layers]", ...boxes(2), ...tail, "  seal L1"], 7, at("  seal L1", "seal")],
      ["開ける", ["lineup Layers [shape: layers]", ...boxes(2), ...tail, "  open L1"], 7, at("  open L1", "open")],
      ["選ぶ", ["lineup Layers [shape: layers]", ...boxes(2), ...tail, "  pick L1"], 7, at("  pick L1", "pick")],
      ["札", ["lineup Layers [shape: layers]", ...boxes(2), ...tail, "  stamp L1: Done"], 7, at("  stamp L1: Done", "stamp")],
      ["役の宣言", ["lineup Layers [shape: layers]", ...boxes(2), "role Seller", ...tail], 3, at("role Seller", "role")],
      // 列の図の見た目は layers だけで、列の図と量の図のほかの種類の図には見た目を書けない
      ["ほかの綴りの見た目", ["lineup Layers [shape: stack]", ...boxes(2), ...tail], 0, -1],
      ["時系列図の見た目", ["sequence Layers [shape: layers]", "box a", "box b", "step One", "  say Sends.", "  a -> b: Send"], 0, -1],
    ];
    for (const [name, lines, row, column] of cases) {
      for (const lang of LANGS) {
        const read = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first?.line, `${name} の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe(row + 1);
        if (column >= 0) expect(first?.column, `${name} の誤りの列 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe(column + 1);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        expect(KANA.test(first?.message ?? ""), `${name} の誤りの文の言葉 (${lang}): ${first?.message}`).toBe(lang === "ja");
      }
    }
    // 8つの層は層の見た目で読み、見た目を書かない列の図は 9 つの箱でも今どおり読む
    const accepted: [string, string[]][] = [
      ["8つの層", ["lineup Layers [shape: layers]", ...boxes(MOST_LAYERS), ...tail]],
      ["見た目を書かない 9 つの箱", ["lineup Lanes", ...boxes(MOST_LAYERS + 1), ...tail]],
    ];
    for (const [name, lines] of accepted) {
      const read = parse(lines.join("\n"));
      expect(read.ok, `${name} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });
});

describe("層の見た目の書き方の文書 (#3625)", () => {
  it("lineup-layers-docs-describe-the-shape", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const layersFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).lineup?.shape === "layers";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md", "plugins/dragon/skills/dragon/references/kinds/lineup.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: layers\]/u.test(text), `${path} に [shape: layers] の書き方が無い`).toBe(true);
      if (path.endsWith("quick-start.md") || path.endsWith("quick-start.en.md") || path === "packages/dragon/README.md") {
        expect(layersFences(text), `${path} に層の見た目として読める dragon の囲みが無い`).toBeGreaterThan(0);
      }
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = readdirSync(join(ROOT, "apps/playground-spa/src/docs/examples")).map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(/\[shape: layers\]/u.test(page), "使い方の頁に [shape: layers] の書き方が無い").toBe(true);
    // 変更履歴の Unreleased か版の節の Added に、層の見た目が英語と日本語で載る
    for (const [path, word] of [
      ["CHANGELOG.md", /layer/u],
      ["CHANGELOG.ja.md", /層/u],
    ] as const) {
      const entry = changelogEntry(join(ROOT, path), 3625);
      const added = /### (?:Added|追加)([\s\S]*?)(?=\n### |$)/u.exec(entry)?.[1] ?? "";
      expect(added, `${path} の層の見た目の項 (#3625) を持つ節に Added の節が無い`).not.toBe("");
      expect(word.test(added) && /\[shape: layers\]/u.test(added), `${path} の Added に層の見た目 ([shape: layers]) が無い`).toBe(true);
    }
  });
});

describe("層の見た目の見本 (#3625)", () => {
  it("lineup-layers-examples-in-both-langs-have-no-breaks", () => {
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
        expect(source.lineup?.shape, `${file} の見た目`).toBe("layers");
        // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
        const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
        expect(problems, `${file} の崩れの知らせ`).toEqual([]);
        for (const width of [undefined, 390]) {
          const layout = layersOf(render(source as unknown as Json, lang, width), `${file} (幅 ${width ?? "既定"})`);
          expect(layout.lanes.length, `${file} を幅 ${width ?? "既定"} で描いた帯の数`).toBe(source.blocks.box?.length ?? -1);
        }
      }
      if (sources.ja && sources.en) expect(shapeOf(sources.en), `${name} の英語版の層と札と段と出来事の数が日本語版と違う`).toEqual(shapeOf(sources.ja));
      // 見本帳の見本の一覧に載り、列の図の頁に並ぶ
      expect(EXAMPLE_KEYS.includes(name), `${name} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      expect(samplesOf("lineup"), `見本帳の列の図の頁に ${name} が無い`).toContain(name);
      for (const lang of LANGS) {
        expect(exampleText(name, lang), `見本帳の ${name} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
      }
    }
  });
});

describe("層の見た目の棚 (#3625)", () => {
  it("lineup-layers-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、層の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(
        kinds.some((line) => /^lineup <[^>]+> \[shape: layers\]$/u.test(line)),
        `棚の記法の早見 (${lang}) に lineup の層の見た目の頭の行が無い: ${kinds.join(" / ")}`,
      ).toBe(true);
      // 列の図の見本の束に層の見た目の見本が在り、どの雛形も誤り無く層の見た目の列の図として読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "lineup");
      expect(group, `棚の見本の束 (${lang}) に列の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      for (const name of SAMPLES) {
        expect(keys, `棚の列の図の束 (${lang}) に ${name} が無い`).toContain(name);
        if (!keys.includes(name)) continue;
        const text = exampleText(name, lang) ?? "";
        expect(parsed(text, lang, `棚の雛形 ${name} (${lang})`).lineup?.shape, `棚の雛形 ${name} (${lang}) の見た目`).toBe("layers");
      }
    }
  });
});
