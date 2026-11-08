// @vitest-environment jsdom
/**
 * 使う人が自分の手元で足すブロック (#3399)。
 *
 * 足すブロックは、今の箱 (`box`) と線 (`edge`) と箱に付く印 (`icon`) のどれかを元にして、形と色の役を替えた物にする。
 * 定義はデータだけで、記法の行 (`blocks 1` の後の `block +<名前>` から `end` まで) か、同じ中身の JSON (`"format": 1`) で書く。
 * 記法の語は頭に `+` を付ける。後で本体が同じ名前のブロックを足しても、前に書いた図の意味が変わらないため。
 * 定義は図の塊の頭、頁の `<link rel="dragon-blocks">`、code の `parseNotation` と `renderDiagram` の引数 `blocks` の 3 つの入口で読む。
 * 元のブロックの置き場所と動きと色の表をそのまま使うので、足したブロックも段を追う動きで光り、線の上を点が流れる。
 */
import * as dragon from "@cardenelabs/dragon";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
import type { Json, LineError, NotationLang } from "./diagram-support";
import { api } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { fileChromium } from "./page-needs";
import { draw, figureClass, figureVars, type Rendered, type RenderOptions } from "./render-support";

/** 足したブロックの定義を読んだ結果。`blocks` は `parseNotation` と `renderDiagram` にそのまま渡す */
type ReadBlocks = { ok: true; blocks: unknown } | { ok: false; errors: LineError[] };
type Parsed = { ok: true; diagram: Json } | { ok: false; errors: LineError[] };

interface UserBlocksApi {
  readBlocks(input: unknown, options?: { lang?: NotationLang }): ReadBlocks;
}

function readBlocks(input: unknown, options?: { lang?: NotationLang }): ReadBlocks {
  const fn = (dragon as unknown as Partial<UserBlocksApi>).readBlocks;
  expect(fn, "readBlocks が @cardenelabs/dragon から出ていない").toBeDefined();
  return fn ? fn(input, options) : { ok: false, errors: [] };
}

const parse = (text: string, options: { lang?: NotationLang; blocks?: unknown } = {}): Parsed =>
  api("parseNotation")(text, options);

const render = (diagram: Json, options: RenderOptions & { blocks?: unknown } = {}): Rendered =>
  draw("renderDiagram")(diagram, options);

/** 読めた図。読めない時は誤りの文を添えて落とす */
function parsed(text: string, options: { lang?: NotationLang; blocks?: unknown } = {}): Json {
  const result = parse(text, options);
  expect(result.ok, `記法を読めない: ${result.ok ? "" : JSON.stringify(result.errors)}`).toBe(true);
  return result.ok ? result.diagram : {};
}

/** 足した箱の形の path。形を囲む最も小さい四角を箱の枠いっぱいに伸ばす (#3520) */
const BRIDGE = "M 0 70 Q 50 0 100 70 Z";
/** 足した印の path。今の絵柄と同じく、(0, 0) を中心に 20 四方へ収める */
const KEY = "M -8 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M 0 0 h 8 M 5 0 v 3";

/** 箱と線と印の 3 つを足す定義の記法 */
const DEFS = [
  "blocks 1",
  "block +bridge",
  "  base box",
  `  shape path "${BRIDGE}"`,
  "  color violet",
  "end",
  "block +wire",
  "  base edge",
  "  shape dashed",
  "  color amber",
  "end",
  "block +key",
  "  base icon",
  `  shape path "${KEY}"`,
  "end",
].join("\n");

/** 同じ定義の JSON */
const JSON_DEFS = {
  format: 1,
  blocks: [
    { name: "+bridge", base: "box", path: BRIDGE, color: "violet" },
    { name: "+wire", base: "edge", shape: "dashed", color: "amber" },
    { name: "+key", base: "icon", path: KEY },
  ],
};

/** 足したブロックを使う図の中身。1 段目は今の線で橋へ送り、2 段目は足した線で橋から渡す */
const BODY = [
  "box eth as Ethereum",
  "+bridge cc as CCIP [note: 橋]",
  "box base as Base [icon: +key]",
  "",
  "step 送る",
  "  say トークンを橋へ送る。",
  "  eth -> cc: 送る",
  "",
  "step 渡す",
  "  say 橋がトークンを渡す。",
  "  cc +wire base: 渡す",
].join("\n");

/** 図の塊の頭に定義を書いた記法 */
const TEXT = `architecture 橋を渡る\n\n${DEFS}\n\n${BODY}\n`;
/** 定義を持たない記法。定義は code か頁の link から渡す */
const BARE_TEXT = `architecture 橋を渡る\n\n${BODY}\n`;

/** 描いた SVG の中で、`d` が `d` に等しい path */
function pathsWith(svg: string, d: string): Element[] {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  return [...doc.querySelectorAll("path")].filter((p) => p.getAttribute("d") === d);
}

interface Box {
  id: string;
  block?: string;
  icon?: string;
}
interface Event {
  type: string;
  block?: string;
}
/** 原本の箱。原本は宣言をブロックの名前ごとの欄 (`blocks`) に持つ */
const boxesOf = (diagram: Json): Box[] => (diagram as unknown as { blocks: { box?: Box[] } }).blocks.box ?? [];
const eventsOf = (diagram: Json, step: number): Event[] => (diagram as unknown as { steps: { events: Event[] }[] }).steps[step]?.events ?? [];

/** 図の id を外した SVG。図の id は原本の字から作り、図の class と動きの名前に入るので、中身を比べる時は外す */
function withoutId(svg: string): string {
  const id = figureClass(svg)?.slice("dg-".length) ?? "";
  return id === "" ? svg : svg.replaceAll(id, "x");
}

/** 箱の札 (`.dg-st`) の並びの中で、`id` の箱の光 (`.dg-halo`) が時刻 `t` に見える濃さ */
function haloAt(m: Motion, id: string, t: number): number {
  const cards = [...m.doc.querySelectorAll(".dg-st")];
  expect(cards.length, "箱の札の数が箱の数と違う").toBe(m.rendered.layout.boxes.length);
  const i = m.rendered.layout.boxes.findIndex((b) => b.id === id);
  expect(i, `${id} の箱が置かれていない`).toBeGreaterThanOrEqual(0);
  const halo = cards[i]?.parentElement?.querySelector(".dg-halo");
  return halo ? m.opacity(halo, t) : 0;
}

/** 誤りの文が 1 つ以上在り、全てが `line` 行目を指す */
function errorsAt(result: Parsed | ReadBlocks, line: number, where: string): LineError[] {
  expect(result.ok, `${where} を読めてしまう`).toBe(false);
  const errors = result.ok ? [] : result.errors;
  expect(errors.length, `${where} の誤りの文が無い`).toBeGreaterThan(0);
  expect(
    errors.map((e) => e.line),
    `${where} の誤りが ${line} 行目を指さない`,
  ).toContain(line);
  for (const e of errors) expect(e.column, `${where} の誤りの列`).toBeGreaterThanOrEqual(1);
  return errors;
}

/** 誤りの理由ごとに、その行を指す誤りの文が持つ語。日英それぞれ */
const REASONS = {
  version: { ja: /版/u, en: /version/iu },
  path: { ja: /path/u, en: /path/iu },
  key: { ja: /鍵|書けない/u, en: /key|cannot/iu },
  color: { ja: /色/u, en: /colou?r/iu },
  plus: { ja: /\+/u, en: /\+/u },
  undefined: { ja: /定義/u, en: /defin/iu },
} as const;

/**
 * 同じ記法の誤りを日英で読み、`line` 行目を指す誤りの文が理由の語を持つ。
 * 日本語の文は日本語の字を持ち、英語の文は日本語の字を持たない
 */
function bothLangs(text: string, line: number, where: string, reason: keyof typeof REASONS): void {
  for (const lang of ["ja", "en"] as const) {
    const at = errorsAt(parse(text, { lang }), line, where).filter((e) => e.line === line);
    expect(
      at.some((e) => REASONS[reason][lang].test(e.message)),
      `${where} の ${lang} の誤りの文が理由を名指さない: ${JSON.stringify(at.map((e) => e.message))}`,
    ).toBe(true);
    const japanese = at.some((e) => /[ぁ-んァ-ヶ一-龠]/u.test(e.message));
    expect(japanese, `${where} の ${lang} の誤りの文の言葉`).toBe(lang === "ja");
  }
}

/** `TEXT` の中で、字 `text` で始まる行の番号 (1 から) */
const lineOf = (source: string, text: string): number => source.split("\n").findIndex((l) => l.trim().startsWith(text)) + 1;

describe("使う人が足すブロック (#3399)", () => {
  it("user-box-block-draws-its-path", () => {
    const diagram = parsed(TEXT);
    expect(boxesOf(diagram).find((b) => b.id === "cc")?.block, "`+bridge` の行が箱として読まれない").toBe("+bridge");
    const rendered = render(diagram);
    expect(
      rendered.layout.boxes.map((b) => b.id),
      "足した箱が置かれない",
    ).toContain("cc");
    expect(
      pathsWith(rendered.svg, BRIDGE).some((p) => p.getAttribute("class") === "dg-st"),
      "足した箱の札がその path の形で描かれない",
    ).toBe(true);
  });

  it("user-box-block-lights-in-step", () => {
    const m = motionFrom(render(parsed(TEXT)));
    const [first, second] = m.rendered.timeline.stills;
    expect(first, "1 段目の止め絵の時刻が無い").toBeDefined();
    expect(haloAt(m, "cc", first ?? 0), "線が名指した足した箱が 1 段目で光らない").toBeGreaterThan(0.99);
    expect(haloAt(m, "base", first ?? 0), "1 段目に出ない箱が光る").toBeLessThan(0.01);
    expect(haloAt(m, "cc", second ?? 0), "足した線の端の足した箱が 2 段目で光らない").toBeGreaterThan(0.99);
  });

  it("user-edge-block-carries-token", () => {
    const diagram = parsed(TEXT);
    const [wire] = eventsOf(diagram, 1);
    expect(wire?.type, "`cc +wire base` の行が線として読まれない").toBe("edge");
    expect(wire?.block, "足した線の行がブロックの名前を持たない").toBe("+wire");
    const m = motionFrom(render(diagram));
    const { layout, timeline } = m.rendered;
    const times = layout.edges.flatMap((e) => timeline.edges.filter((t) => t.step === e.step && t.event === e.event));
    const flows = [...m.doc.querySelectorAll(".dg-flow")];
    expect(flows.length, "線の流れる点の数が時刻を持つ線の数と違う").toBe(times.length);
    const k = times.findIndex((t) => t.step === 1);
    const time = times[k];
    const flow = flows[k];
    expect(time && flow, "足した線が 2 段目の時刻を持たない").toBeTruthy();
    if (!time || !flow) return;
    expect(m.opacity(flow, (time.drawn + time.end) / 2), "足した線の流れる点が見えない").toBeGreaterThan(0.5);
    const from = m.value(flow, "stroke-dashoffset", time.drawn)?.[0] ?? Number.NaN;
    const to = m.value(flow, "stroke-dashoffset", time.end)?.[0] ?? Number.NaN;
    expect(to, "足した線の点が線の向きに流れない").toBeLessThan(from);
  });

  it("user-icon-block-draws-on-box", () => {
    const diagram = parsed(TEXT);
    expect(boxesOf(diagram).find((b) => b.id === "base")?.icon, "箱の `icon: +key` が読まれない").toBe("+key");
    expect(pathsWith(render(diagram).svg, KEY).length, "箱に足した印の path が描かれない").toBeGreaterThan(0);
  });

  it("user-block-basic-shapes", () => {
    const plain = render(parsed(BARE_TEXT.replace("+bridge cc as CCIP", "box cc as CCIP").replaceAll("+wire", "->").replace(" [icon: +key]", "")));
    const frame = plain.layout.boxes.find((b) => b.id === "cc");
    const svgs = new Set<string>();
    for (const shape of ["round", "circle", "cylinder", "diamond", "hexagon"]) {
      const defs = `blocks 1\nblock +bridge\n  base box\n  shape ${shape}\n  color violet\nend`;
      const text = `architecture 橋を渡る\n\n${defs}\n\n${BODY.replaceAll("+wire", "->").replace(" [icon: +key]", "")}\n`;
      const rendered = render(parsed(text));
      const box = rendered.layout.boxes.find((b) => b.id === "cc");
      expect(box && frame, `${shape} の箱が無い`).toBeTruthy();
      // 形の内に名前と下の字が収まらない時は箱を大きくする (#3520)。形を持たない箱より小さくはしない
      expect(box && frame && box.w >= frame.w - 0.01 && box.h >= frame.h - 0.01, `${shape} の箱が元の箱の枠より小さい`).toBe(true);
      svgs.add(withoutId(rendered.svg));
    }
    expect(svgs.size, "基本の形の名前ごとに描く形が変わらない").toBe(5);
  });

  it("user-block-reads-palette", () => {
    const diagram = parsed(TEXT);
    const clear = render(diagram, { palette: "clear" });
    const night = render(diagram, { palette: "night" });
    const [card] = pathsWith(clear.svg, BRIDGE).filter((p) => p.getAttribute("class") === "dg-st");
    expect(card, "足した箱の札が描かれない").toBeDefined();
    const styled = card?.closest("[style]")?.getAttribute("style") ?? "";
    expect(styled, "足した箱が色の表の役 (violet) から色を読まない").toContain("var(--c-violet)");
    for (const attr of ["fill", "stroke"]) expect(card?.getAttribute(attr) ?? "", `足した箱の ${attr} に色の値を直に書いている`).not.toMatch(/#[0-9a-f]{3,8}|rgb\(/iu);
    expect(figureVars(clear.svg)["c-violet"], "色味を変えても violet の色が変わらない").not.toBe(figureVars(night.svg)["c-violet"]);
    const wire = new DOMParser().parseFromString(clear.svg, "image/svg+xml").querySelectorAll(".dg-e-on")[1];
    // 色の線は自分の style に動きを持ち、色の役は包む部品の style が持つ
    expect(wire?.parentElement?.closest("[style]")?.getAttribute("style") ?? "", "足した線が色の表の役 (amber) から色を読まない").toContain("var(--c-amber)");
  });

  it("user-block-json-equals-notation", () => {
    const fromText = readBlocks(DEFS);
    const fromJson = readBlocks(JSON_DEFS);
    expect(fromText.ok && fromJson.ok, "記法と JSON の定義を読めない").toBe(true);
    if (!fromText.ok || !fromJson.ok) return;
    expect(fromJson.blocks, "JSON の定義が記法の定義と違う中身になる").toEqual(fromText.blocks);
    const inline = render(parsed(TEXT)).svg;
    const passed = render(parsed(BARE_TEXT, { blocks: fromJson.blocks }), { blocks: fromJson.blocks }).svg;
    expect(withoutId(passed), "JSON で渡した定義の図が、図の頭に書いた定義の図と違う").toBe(withoutId(inline));
  });

  it("user-block-round-trips", () => {
    const diagram = parsed(TEXT);
    const printed = api("printNotation")(diagram);
    for (const line of ["blocks 1", "block +bridge", `  shape path "${BRIDGE}"`, "block +wire", "+bridge cc as CCIP [note: 橋]", "cc +wire base: 渡す", "[icon: +key]"]) {
      expect(printed, `書き戻した記法に \`${line}\` が無い`).toContain(line);
    }
    expect(parsed(printed), "書き戻した記法を読み直すと元の図と違う").toEqual(diagram);
  });

  it("user-block-passed-by-code", () => {
    const read = readBlocks(DEFS);
    expect(read.ok, `定義を読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    if (!read.ok) return;
    const diagram = parsed(BARE_TEXT, { blocks: read.blocks });
    expect(boxesOf(diagram).find((b) => b.id === "cc")?.block, "引数で渡した定義の `+bridge` が読まれない").toBe("+bridge");
    const svg = render(diagram, { blocks: read.blocks }).svg;
    expect(pathsWith(svg, BRIDGE).length, "引数で渡した定義の形が描かれない").toBeGreaterThan(0);
    expect(pathsWith(svg, KEY).length, "引数で渡した定義の印が描かれない").toBeGreaterThan(0);
  });

  it("user-block-rejects-unknown-format", () => {
    const noVersion = TEXT.replace("blocks 1\n", "");
    bothLangs(noVersion, lineOf(noVersion, "block +bridge"), "版の無い定義", "version");
    const unknown = TEXT.replace("blocks 1", "blocks 2");
    bothLangs(unknown, lineOf(unknown, "blocks 2"), "知らない版の定義", "version");
    expect(readBlocks({ ...JSON_DEFS, format: 2 }).ok, "知らない版の JSON の定義を読めてしまう").toBe(false);
    expect(readBlocks({ blocks: JSON_DEFS.blocks }).ok, "版の無い JSON の定義を読めてしまう").toBe(false);
  });

  it("user-block-rejects-non-data", () => {
    const shapeLine = `  shape path "${BRIDGE}"`;
    for (const bad of ["M 0 0 L <script>", "url(#x)", "javascript:alert(1)"]) {
      const text = TEXT.replace(shapeLine, `  shape path "${bad}"`);
      bothLangs(text, lineOf(text, `shape path "${bad}"`), `path に ${bad} を書いた定義`, "path");
    }
    for (const key of ["script alert(1)", "href https://example.com/x"]) {
      const text = TEXT.replace("  color violet", `  color violet\n  ${key}`);
      bothLangs(text, lineOf(text, key), `知らない鍵 ${key.split(" ")[0]} を書いた定義`, "key");
    }
    const hex = TEXT.replace("  color violet", "  color #ff0000");
    bothLangs(hex, lineOf(hex, "color #ff0000"), "色に役の名前の外の値を書いた定義", "color");
    const json = { ...JSON_DEFS, blocks: [{ ...JSON_DEFS.blocks[0], script: "alert(1)" }] };
    expect(readBlocks(json).ok, "知らない鍵を持つ JSON の定義を読めてしまう").toBe(false);
  });

  it("user-block-names-need-plus", () => {
    const noPlus = TEXT.replace("block +bridge", "block bridge");
    bothLangs(noPlus, lineOf(noPlus, "block bridge"), "`+` で始まらない名前の定義", "plus");
    // `+bridge` と `+key` は共有のブロック集に在り、定義を書かずに読める (#3455)。集に無い `+wire` で確かめる
    bothLangs(BARE_TEXT, lineOf(BARE_TEXT, "cc +wire"), "定義していない `+wire` の行", "undefined");
  });
});

/** 箱を元にしたブロックの定義に、Tabler の石の橋の絵柄を書いた定義 (#3489) */
const ICON_DEFS = ["blocks 1", "block +bridge", "  base box", "  color violet", "  icon tabler:building-bridge-2", "end"].join("\n");
/** 絵柄を持つブロックの箱を使う図の中身 */
const ICON_BODY = ["box eth as Ethereum", "+bridge cc as CCIP", "", "step 送る", "  say トークンを橋へ送る。", "  eth -> cc: 送る"].join("\n");
const iconText = (body = ICON_BODY, defs = ICON_DEFS): string => `architecture 橋を渡る\n\n${defs}\n\n${body}\n`;
const HAND_ICONS = (dragon as unknown as { ICONS: Record<string, string> }).ICONS;

/** 描いた SVG の箱の絵柄 (`dg-gl`) の path の d */
const glyphDs = (svg: string): string[] =>
  [...new DOMParser().parseFromString(svg, "image/svg+xml").querySelectorAll("path.dg-gl")].map((p) => p.getAttribute("d") ?? "");

/** 箱の行に Tabler の石の橋を書いて描いた時の絵柄の d。定義に書いた絵柄と比べる相手 */
function bridgeGlyph(): string {
  const text = ["architecture 橋", "", "box eth as Ethereum", "box cc as CCIP [icon: tabler:building-bridge-2]", "", "step 送る", "  say 送る。", "  eth -> cc: 送る", ""].join("\n");
  const [d] = glyphDs(render(parsed(text)).svg);
  expect(d, "箱の行に書いた Tabler の石の橋が描かれない").toBeDefined();
  return d ?? "";
}

/** 記法 `text` を日英で読み、`line` 行目を指す誤りの文が `words` の語をどれも持つ */
function refusedAt(text: string, line: number, where: string, words: { ja: RegExp[]; en: RegExp[] }): void {
  for (const lang of ["ja", "en"] as const) {
    const at = errorsAt(parse(text, { lang }), line, where).filter((e) => e.line === line);
    for (const word of words[lang]) expect(at.some((e) => word.test(e.message)), `${where} の ${lang} の誤りの文が ${word} を持たない: ${JSON.stringify(at.map((e) => e.message))}`).toBe(true);
  }
}

describe("箱を元にしたブロックの絵柄 (#3489)", () => {
  it("box-block-icon-draws-on-box", () => {
    const diagram = parsed(iconText());
    expect(glyphDs(render(diagram).svg), "定義に書いた石の橋の絵柄が、ブロックの箱の絵柄の枠に描かれない").toContain(bridgeGlyph());
  });

  it("box-line-icon-wins-over-block-icon", () => {
    const svg = render(parsed(iconText(ICON_BODY.replace("+bridge cc as CCIP", "+bridge cc as CCIP [icon: key]")))).svg;
    expect(glyphDs(svg), "箱の行に書いた手描きの鍵が描かれない").toContain(HAND_ICONS.key);
    expect(glyphDs(svg), "箱の行に絵柄を書いたのに、定義の石の橋も描かれる").not.toContain(bridgeGlyph());
  });

  it("block-icon-only-on-box-blocks", () => {
    for (const [base, shape] of [
      ["edge", "  shape dashed"],
      ["icon", `  shape path "${KEY}"`],
    ] as const) {
      const defs = ["blocks 1", "block +other", `  base ${base}`, shape, "  icon key", "end"].join("\n");
      const text = iconText(ICON_BODY, defs);
      refusedAt(text, lineOf(text, "icon key"), `${base} を元にした定義の icon の行`, { ja: [/箱/u], en: [/box/iu] });
    }
  });

  it("block-icon-unknown-name-refused", () => {
    const missing = iconText(ICON_BODY, ICON_DEFS.replace("tabler:building-bridge-2", "tabler:no-such-icon"));
    refusedAt(missing, lineOf(missing, "icon tabler:no-such-icon"), "Tabler に無い名前の定義の icon", { ja: [/tabler:no-such-icon/u, /Tabler/u], en: [/tabler:no-such-icon/u, /Tabler/u] });
    const close = iconText(ICON_BODY, ICON_DEFS.replace("tabler:building-bridge-2", "tabler:building-bridg-2"));
    refusedAt(close, lineOf(close, "icon tabler:building-bridg-2"), "Tabler の名前を書き間違えた定義の icon", { ja: [/tabler:building-bridge-2/u], en: [/tabler:building-bridge-2/u] });
    const hand = iconText(ICON_BODY, ICON_DEFS.replace("tabler:building-bridge-2", "usr"));
    refusedAt(hand, lineOf(hand, "icon usr"), "手描きの名前を書き間違えた定義の icon", { ja: [/\buser\b/u], en: [/\buser\b/u] });
  });

  it("block-icon-passes-validator", () => {
    const validate = api("validateDiagram");
    const diagram = JSON.parse(JSON.stringify(parsed(iconText()))) as { define: { blocks: { icon?: string }[] } };
    expect(diagram.define.blocks[0]?.icon, "原本の JSON の定義が絵柄を持たない").toBe("tabler:building-bridge-2");
    expect(validate(diagram), "定義に Tabler の絵柄を持つ原本を通さない").toEqual({ ok: true });
    const missing = structuredClone(diagram);
    if (missing.define.blocks[0]) missing.define.blocks[0].icon = "tabler:no-such-icon";
    const result = validate(missing);
    expect(result.ok, "定義に Tabler に無い名前を持つ原本を通す").toBe(false);
    expect(result.ok ? [] : result.errors.map((e) => e.pointer), "誤りが指す欄").toEqual(["/define/blocks/0/icon"]);
  });

  it("block-icon-round-trips", () => {
    const diagram = parsed(iconText());
    const printed = api("printNotation")(diagram);
    expect(printed, "書き戻した記法に定義の icon の行が無い").toContain("  icon tabler:building-bridge-2");
    expect(parsed(printed), "書き戻した記法を読み直すと元の図と違う").toEqual(diagram);
  });
});

/* 頁の `<link rel="dragon-blocks">` は script の 1 行の入口が読む。入口と塊は build した `dist/cdn` から渡す */
const CDN = join(process.cwd(), "packages/dragon/dist/cdn");
const PAGE = "http://localhost/";
const LOCAL = "http://localhost/cdn/";
const DEFS_URL = "http://localhost/blocks/bridge.dragon";
const FONT_CSS = /^https:\/\/cdn\.jsdelivr\.net\/npm\/@fontsource-variable\/[^/]+\/index\.css$/u;
const escape = (text: string): string => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

describe("頁の link で読む定義 (#3399)", () => {
  it("user-block-page-link", async () => {
    expect(existsSync(join(CDN, "dragon.js")), "入口の file が build されていない").toBe(true);
    const second = BARE_TEXT.replace("architecture 橋を渡る", "architecture もう 1 つの橋");
    const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><link rel="dragon-blocks" href="${DEFS_URL}"><script type="module" src="${LOCAL}dragon.js"></script></head><body><pre class="dragon">${escape(BARE_TEXT)}</pre><pre class="dragon">${escape(second)}</pre></body></html>`;
    // file で 1 つの Chromium を使う。後処理で閉じず、file の process の終わりに止まる (#3424)
    const context = await (await fileChromium()).newContext();
    const defsRead: string[] = [];
    const outside: string[] = [];
    await context.route("**/*", async (route) => {
      const url = route.request().url();
      if (url === PAGE) return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
      if (url === DEFS_URL) {
        defsRead.push(url);
        return route.fulfill({ contentType: "text/plain; charset=utf-8", body: DEFS });
      }
      if (url.startsWith(LOCAL)) {
        const path = join(CDN, url.slice(LOCAL.length));
        return existsSync(path) ? route.fulfill({ contentType: "text/javascript", body: readFileSync(path) }) : route.fulfill({ status: 404, body: "" });
      }
      if (FONT_CSS.test(url)) return route.fulfill({ contentType: "text/css", body: "" });
      outside.push(url);
      return route.abort();
    });
    try {
      const page: Page = await context.newPage();
      await page.goto(PAGE);
      await page
        .waitForFunction(() => document.querySelectorAll("pre.dragon").length === 0 && document.querySelectorAll('[data-dragon="player"] svg').length >= 2, undefined, { timeout: 8_000 })
        .catch(() => undefined);
      const drawn = await page.evaluate(
        (d) => [...document.querySelectorAll('[data-dragon="player"] svg')].map((svg) => [...svg.querySelectorAll("path")].some((p) => p.getAttribute("d") === d)),
        BRIDGE,
      );
      const errors = await page.evaluate(() => [...document.querySelectorAll("pre.dragon-error")].map((e) => e.textContent ?? ""));
      expect(errors, "頁の link の定義を使えず、記法の塊が誤りになる").toEqual([]);
      expect(drawn, "頁の 2 つの記法の塊が、link の定義の形で描かれない").toEqual([true, true]);
      expect(defsRead, "定義の file を 1 度だけ読まない").toEqual([DEFS_URL]);
      expect(outside, "入口と塊と字と定義の file のほかに取りに行った物").toEqual([]);
    } finally {
      await context.close();
    }
  });
});
