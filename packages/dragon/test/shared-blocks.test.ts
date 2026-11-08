// @vitest-environment jsdom
/**
 * 共有のブロック集 (#3455)。
 *
 * 使う人が足したブロックのうち、皆で使える物を `packages/dragon/blocks/` に 1 定義 1 file で集める。
 * 各定義は、それを使う見本を `packages/dragon/blocks/examples/` に 1 つ以上持つ。
 * 集めたブロックは、図の頭に定義を書かずに `+名前` で使える。
 * 読んだ図は、使った共有の定義を原本の JSON の定義の欄 (`define`) に入れ、JSON だけを受け取った側でも同じ図を描ける。
 * 図の頭に同じ名前の定義が在る時は、図の頭の定義が効く。共有の集に後から同じ名前が足されても、前に書いた図の意味が変わらないため。
 */
import * as dragon from "@cardenelabs/dragon";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, type NotationLang } from "./diagram-support";
import { runCli } from "./export-support";
import { draw } from "./render-support";

type ReadBlocks = { ok: true; blocks: unknown } | { ok: false; errors: LineError[] };
type Parsed = { ok: true; diagram: Json } | { ok: false; errors: LineError[] };

interface Define {
  format: number;
  blocks: SharedBlock[];
}

interface SharedBlock {
  name: string;
  base: string;
  path?: string;
  shape?: string;
  color?: string;
  icon?: string;
}

const ROOT = process.cwd();
const SHARED = join(ROOT, "packages/dragon/blocks");
const EXAMPLES = join(SHARED, "examples");
const PACKAGE = join(ROOT, "packages/dragon/package.json");

/** 共有のブロック集の最初の箱の形。見本の bridge から写す */
const BRIDGE = "M 0 70 Q 50 0 100 70 Z";
/** 図の頭で同じ名前に与える別の形 */
const LOCAL_BRIDGE = "M 0 0 L 100 0 L 50 70 Z";

function readBlocks(input: unknown, options?: { lang?: NotationLang }): ReadBlocks {
  const fn = (dragon as unknown as { readBlocks?: (input: unknown, options?: { lang?: NotationLang }) => ReadBlocks }).readBlocks;
  expect(fn, "readBlocks が @cardenelabs/dragon から出ていない").toBeDefined();
  return fn ? fn(input, options) : { ok: false, errors: [] };
}

const parse = (text: string, lang: NotationLang = "en"): Parsed => api("parseNotation")(text, { lang });
const read = (path: string): string => readFileSync(path, "utf8");
const dragonFiles = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(".dragon")).map((name) => join(dir, name)) : []);
const defineOf = (parsed: Parsed): Define | undefined => (parsed.ok ? ((parsed.diagram as { define?: Define }).define ?? undefined) : undefined);

/** 描いた SVG の中で、`d` が `d` に等しい path */
function pathsWith(svg: string, d: string): Element[] {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  return [...doc.querySelectorAll("path")].filter((p) => p.getAttribute("d") === d);
}

/** 共有の `+bridge` を、図の頭に定義を書かずに使う図 */
const USES_SHARED = ["architecture Bridge without a definition", "", "box eth as Ethereum", "+bridge cc as Bridge", "", "step Send", "  say Ethereum sends the token to the bridge.", "  eth -> cc: send", ""].join("\n");

/** 同じ図の頭に、同じ名前で別の形の定義を書いた図 */
const OVERRIDES_SHARED = USES_SHARED.replace(
  "\n\nbox eth",
  ["", "", "blocks 1", "block +bridge", "  base box", `  shape path "${LOCAL_BRIDGE}"`, "end", "", "box eth"].join("\n"),
);

/** 共有の橋のブロックの絵柄 (#3489) */
const BRIDGE_ICON = "tabler:building-bridge-2";

/** 描いた SVG の箱の絵柄 (`dg-gl`) の path の d */
const glyphDs = (svg: string): string[] =>
  [...new DOMParser().parseFromString(svg, "image/svg+xml").querySelectorAll("path.dg-gl")].map((p) => p.getAttribute("d") ?? "");

/** 箱の行に Tabler の石の橋を書いて描いた時の絵柄の d。共有の橋の絵柄と比べる相手 */
function bridgeGlyph(): string {
  const parsed = parse(["architecture Bridge", "", "box eth as Ethereum", `box cc as Bridge [icon: ${BRIDGE_ICON}]`, "", "step Send", "  say Send.", "  eth -> cc: send", ""].join("\n"));
  const [d] = glyphDs(draw("renderDiagram")(parsed.ok ? parsed.diagram : {}, {}).svg);
  expect(d, "箱の行に書いた Tabler の石の橋が描かれない").toBeDefined();
  return d ?? "";
}

/** 描いた図の箱の札 (`dg-st`) の要素の名前と角の丸み。札は置いた箱の並び (`layout.boxes`) の順に描かれるので、その順で箱の名札に結ぶ */
function cards(rendered: { svg: string; layout: { boxes: { id: string }[] } }): Map<string, { tag: string; rx: string | null }> {
  const found = [...new DOMParser().parseFromString(rendered.svg, "image/svg+xml").querySelectorAll(".dg-st")];
  expect(found.length, "箱の札の数が箱の数と違う").toBe(rendered.layout.boxes.length);
  return new Map(rendered.layout.boxes.map((box, i) => [box.id, { tag: found[i]?.tagName ?? "", rx: found[i]?.getAttribute("rx") ?? null }]));
}

describe("共有のブロック集 (#3455)", () => {
  it("shared-blocks-read-and-have-examples", () => {
    const files = dragonFiles(SHARED);
    // 走査の空振りを避ける。最初の集は見本の bridge の 3 つ (箱、線、印)
    expect(files.length, `${relative(ROOT, SHARED)} に定義の file が無い`).toBeGreaterThanOrEqual(3);
    const examples = dragonFiles(EXAMPLES).map((path) => ({ path, text: read(path) }));
    expect(examples.length, `${relative(ROOT, EXAMPLES)} に見本が無い`).toBeGreaterThan(0);
    const problems = files.flatMap((file) => {
      const result = readBlocks(read(file));
      if (!result.ok) return [`${relative(ROOT, file)} を読めない ${JSON.stringify(result.errors)}`];
      const names = (result.blocks as { blocks: { name: string }[] }).blocks.map((block) => block.name);
      if (names.length !== 1) return [`${relative(ROOT, file)} が定義を 1 つだけ持たない (${names.join(", ")})`];
      const [name = ""] = names;
      const used = examples.some(({ text }) => new RegExp(`(^|[\\s:,\\[])${name.replace("+", "\\+")}(?![a-z0-9-])`, "mu").test(text));
      return used ? [] : [`${name} を使う見本が無い`];
    });
    expect(problems, "共有のブロック集の誤り").toEqual([]);
    // 見本は図の頭に定義を書かずに読める
    const unreadable = examples.flatMap(({ path, text }) => {
      const parsed = parse(text);
      return parsed.ok ? [] : [`${relative(ROOT, path)} ${JSON.stringify(parsed.errors[0])}`];
    });
    expect(unreadable, "読めない見本").toEqual([]);
    const pkg = JSON.parse(read(PACKAGE)) as { files?: string[] };
    expect(pkg.files ?? [], "共有のブロック集が npm に出す file に入らない").toContain("blocks");
  });

  it("shared-block-used-without-definition", () => {
    const parsed = parse(USES_SHARED);
    expect(parsed.ok, `定義を書かない共有のブロックを読めない ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
    const define = defineOf(parsed);
    expect(define?.format, "原本の JSON が定義の欄を持たない").toBe(1);
    // 共有の橋は形を持たない角丸の箱で、色と石の橋の絵柄を持つ (#3489)
    expect(define?.blocks, "原本の JSON の定義の欄が使った共有の定義だけを持たない").toEqual([{ name: "+bridge", base: "box", color: "violet", icon: BRIDGE_ICON }]);
    // JSON だけを受け取った側でも、共有の定義の絵柄で描く
    const json = JSON.parse(JSON.stringify(parsed.ok ? parsed.diagram : {})) as Json;
    expect(glyphDs(draw("renderDiagram")(json, {}).svg), "JSON だけから描くと共有の橋の絵柄が描かれない").toContain(bridgeGlyph());
  });

  it("shared-bridge-is-card-with-icon", () => {
    const text = read(join(SHARED, "bridge.dragon"));
    expect(text, "共有の橋の定義が path の形を持つ").not.toMatch(/^\s*shape\s+path\b/mu);
    expect(text, "共有の橋の定義が石の橋の絵柄を持たない").toMatch(new RegExp(`^\\s*icon\\s+${BRIDGE_ICON}\\s*$`, "mu"));
    const parsed = parse(USES_SHARED);
    expect(parsed.ok, `共有の橋を使う図を読めない ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
    const rendered = draw("renderDiagram")(parsed.ok ? parsed.diagram : {}, {});
    const svg = rendered.svg;
    const found = cards(rendered);
    expect(found.get("cc"), "共有の橋の箱の縁が、ほかの箱と同じ角の丸みの四角で描かれない").toEqual(found.get("eth"));
    expect(found.get("eth"), "比べる相手の箱の縁が角の丸み 12 の四角でない").toEqual({ tag: "rect", rx: "12" });
    expect(glyphDs(svg), "共有の橋の箱の絵柄の枠に石の橋が描かれない").toContain(bridgeGlyph());
  });

  it("bridge-examples-draw-bridge-icon", () => {
    const files = ["packages/dragon/examples/bridge.dragon", "packages/dragon/examples/bridge.en.dragon", "packages/dragon/blocks/examples/bridge.dragon"];
    const want = bridgeGlyph();
    const missing = files.filter((file) => {
      const parsed = parse(read(join(ROOT, file)), file.endsWith(".en.dragon") || file.includes("/blocks/") ? "en" : "ja");
      return !parsed.ok || !glyphDs(draw("renderDiagram")(parsed.diagram, {}).svg).includes(want);
    });
    expect(missing, "橋の箱に石の橋の絵柄が描かれない見本").toEqual([]);
  });

  it("local-definition-wins-over-shared", () => {
    // 比べる相手の共有の `+bridge` が在ることを先に確かめる。無ければ図の頭の定義が効くのは当たり前になる
    expect(parse(USES_SHARED).ok, "共有のブロック集に +bridge が無い").toBe(true);
    const parsed = parse(OVERRIDES_SHARED);
    expect(parsed.ok, `図の頭の定義を持つ図を読めない ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
    expect(defineOf(parsed)?.blocks, "図の頭の定義が効かない").toEqual([{ name: "+bridge", base: "box", path: LOCAL_BRIDGE }]);
    const svg = draw("renderDiagram")(parsed.ok ? parsed.diagram : {}, {}).svg;
    expect(pathsWith(svg, LOCAL_BRIDGE).length, "図の頭の定義の形で描かない").toBeGreaterThan(0);
    expect(pathsWith(svg, BRIDGE).length, "共有の形で描いた").toBe(0);
  });

  it("unknown-user-block-still-fails", () => {
    const text = USES_SHARED.replace("+bridge cc", "+nosuch cc");
    const line = text.split("\n").findIndex((row) => row.startsWith("+nosuch")) + 1;
    for (const [lang, word] of [
      ["en", /defin/iu],
      ["ja", /定義/u],
    ] as const) {
      const parsed = parse(text, lang);
      expect(parsed.ok, `${lang}: 定義の無いブロックを読めてしまう`).toBe(false);
      const errors = parsed.ok ? [] : parsed.errors;
      expect(errors[0], `${lang}: 誤りが定義の無いブロックの行を指さない`).toMatchObject({ line, column: 1 });
      expect(errors[0]?.message ?? "", `${lang}: 誤りの文が定義の無いことを名指さない`).toMatch(word);
      expect(errors[0]?.message ?? "", `${lang}: 誤りの文がブロックの名前を名指さない`).toContain("+nosuch");
    }
  });
});

/**
 * Web3 と一般のシステムの共有のブロック (#3522)。
 *
 * AI が書いた図は、ウォレットやコントラクトや待ち行列を、既にある絵柄か自分で定義した形で代用していた。共有のブロック集に 8 つ足す。
 * 箱のブロックは角丸の箱の形のまま、Tabler の絵柄と色の役で見分ける。形を変えると字が形からはみ出す崩れ (#3520) を招くため。
 * 線のブロック `+async` は待たずに送る線で、共有の `+relay` と線の形か色の役で見分ける。
 */
describe("Web3 と一般のシステムの共有のブロック (#3522)", () => {
  /** 足した共有のブロックと、それぞれの元。Web3 の 4 つ、一般のシステムの箱 3 つと線 1 つ */
  const ADDED: Record<string, "box" | "edge"> = {
    "+wallet": "box",
    "+contract": "box",
    "+oracle": "box",
    "+validator": "box",
    "+queue": "box",
    "+cache": "box",
    "+gateway": "box",
    "+async": "edge",
  };
  const ROLES = ["blue", "amber", "green", "violet", "rose", "slate", "coin"];
  const BOXES = Object.keys(ADDED).filter((name) => ADDED[name] === "box");
  const definitionFile = (name: string): string => join(SHARED, `${name.slice(1)}.dragon`);
  const exampleFile = (name: string): string => join(EXAMPLES, `${name.slice(1)}.dragon`);

  /** 共有のブロック集の file から読んだ定義。file が無い時と読めない時は undefined */
  function sharedDefinition(name: string): SharedBlock | undefined {
    const file = definitionFile(name);
    if (!existsSync(file)) return undefined;
    const result = readBlocks(read(file));
    return result.ok ? (result.blocks as { blocks: SharedBlock[] }).blocks[0] : undefined;
  }

  /** 名前 Plain の箱 a から、行 `line` が置く箱 b へ線を引く図 */
  const boxDiagram = (line: string): string =>
    ["architecture Shared box", "", "box a as Plain", line, "", "step Send", "  say The plain box sends to the other box.", "  a -> b: send", ""].join("\n");

  /** 箱の行に絵柄 `icon` を書いて描いた時の絵柄の d。共有の箱のブロックの絵柄と比べる相手 */
  function glyphOf(icon: string): string {
    const parsed = parse(boxDiagram(`box b as Shared [icon: ${icon}]`));
    const [d] = glyphDs(draw("renderDiagram")(parsed.ok ? parsed.diagram : {}, {}).svg);
    expect(d, `箱の行に書いた ${icon} が描かれない`).toBeDefined();
    return d ?? "";
  }

  it("shared-blocks-add-web3-and-systems", () => {
    const problems = Object.entries(ADDED).flatMap(([name, base]) => {
      const file = definitionFile(name);
      if (!existsSync(file)) return [`${relative(ROOT, file)} が無い`];
      const text = read(file);
      const found: string[] = [];
      const [head = ""] = text.split("\n").filter((line) => line.trim() !== "");
      if (!/^\/\/\s*\S/u.test(head)) found.push(`${relative(ROOT, file)} の最初の行が何のブロックかを書く // の注釈でない`);
      const result = readBlocks(text);
      if (!result.ok) return [...found, `${relative(ROOT, file)} を読めない ${JSON.stringify(result.errors)}`];
      const blocks = (result.blocks as { blocks: SharedBlock[] }).blocks;
      if (blocks.length !== 1 || blocks[0]?.name !== name) found.push(`${relative(ROOT, file)} が ${name} の定義を 1 つだけ持たない`);
      if (blocks[0]?.base !== base) found.push(`${name} の元が ${base} でない (${blocks[0]?.base ?? "無し"})`);
      const example = exampleFile(name);
      if (!existsSync(example)) return [...found, `${relative(ROOT, example)} が無い`];
      const shown = read(example);
      if (/^\s*blocks\s+1\s*$/mu.test(shown) || /^\s*block\s+\+/mu.test(shown)) found.push(`${relative(ROOT, example)} が定義を書いている`);
      const parsed = parse(shown);
      if (!parsed.ok) return [...found, `${relative(ROOT, example)} を読めない ${JSON.stringify(parsed.errors[0])}`];
      // 定義を書かずに使った共有の定義は、原本の JSON の定義の欄に入る
      if (!(defineOf(parsed)?.blocks ?? []).some((block) => block.name === name)) found.push(`${relative(ROOT, example)} が ${name} を使わない`);
      return found;
    });
    expect(problems, "足した共有のブロックの誤り").toEqual([]);
  });

  it("shared-box-blocks-are-cards-with-icons", () => {
    const definitions = BOXES.map((name) => ({ name, text: existsSync(definitionFile(name)) ? read(definitionFile(name)) : "", block: sharedDefinition(name) }));
    expect(
      definitions.filter(({ block }) => block === undefined).map(({ name }) => name),
      "読めない共有の箱のブロック",
    ).toEqual([]);
    const wrong = definitions.flatMap(({ name, text, block }) => [
      ...(/^\s*shape\b/mu.test(text) ? [`${name} が shape の行を持つ`] : []),
      ...(/^\s*icon\s+tabler:[a-z0-9-]+\s*$/mu.test(text) ? [] : [`${name} が icon tabler:<名前> の行を持たない`]),
      ...(ROLES.includes(block?.color ?? "") ? [] : [`${name} が色の役を持たない (${block?.color ?? "無し"})`]),
    ]);
    expect(wrong, "共有の箱のブロックの定義の誤り").toEqual([]);
    const icons = definitions.map(({ block }) => block?.icon ?? "");
    expect(new Set([...icons, BRIDGE_ICON]).size, `共有の箱のブロックの絵柄が、互いにか +bridge と重なる (${icons.join(", ")})`).toBe(icons.length + 1);
    for (const { name, block } of definitions) {
      const parsed = parse(boxDiagram(`${name} b as Shared`));
      expect(parsed.ok, `${name} の箱を使う図を読めない ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const rendered = draw("renderDiagram")(parsed.ok ? parsed.diagram : {}, {});
      const found = cards(rendered);
      expect(found.get("b"), `${name} の箱の縁が、ほかの箱と同じ角の丸みの四角で描かれない`).toEqual(found.get("a"));
      expect(found.get("a"), "比べる相手の箱の縁が角の丸み 12 の四角でない").toEqual({ tag: "rect", rx: "12" });
      expect(glyphDs(rendered.svg), `${name} の箱の絵柄の枠に ${block?.icon ?? ""} が描かれない`).toContain(glyphOf(block?.icon ?? ""));
    }
  });

  it("shared-async-edge-reads-as-line", () => {
    const relay = sharedDefinition("+relay");
    expect(relay, "比べる相手の共有の +relay が無い").toMatchObject({ base: "edge" });
    const text = ["architecture Send without waiting", "", "box a as Orders", "box b as Mail", "", "step Send", "  say Orders sends the event and does not wait for Mail.", "  a +async b: order placed", ""].join("\n");
    const parsed = parse(text);
    expect(parsed.ok, `共有の +async を書いた線の行を読めない ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
    if (!parsed.ok) return;
    const [line] = (parsed.diagram as unknown as { steps: { events: { type: string; block?: string }[] }[] }).steps[0]?.events ?? [];
    expect(line, "+async の行が線として読まれない").toMatchObject({ type: "edge", block: "+async" });
    const [async] = defineOf(parsed)?.blocks ?? [];
    expect(async, "原本の JSON の定義の欄が +async の定義を持たない").toMatchObject({ name: "+async", base: "edge" });
    expect(["solid", "dashed", "dotted"], "+async が線の形を持たない").toContain(async?.shape);
    expect(ROLES, "+async が色の役を持たない").toContain(async?.color);
    expect([async?.shape, async?.color], "+async の線の形と色の役が +relay と同じ").not.toEqual([relay?.shape, relay?.color]);
    expect(draw("renderDiagram")(parsed.diagram, {}).layout.edges, "+async の線が描かれない").toHaveLength(1);
  });

  it("shared-block-examples-check-clean", async () => {
    const files = Object.keys(ADDED).map(exampleFile);
    expect(
      files.filter((file) => !existsSync(file)).map((file) => relative(ROOT, file)),
      "足した共有のブロックの見本が無い",
    ).toEqual([]);
    const plain = await runCli(["check", ...files]);
    expect(plain.code, `dragon check が見本で終わり方 0 にならない\n${plain.stdout}${plain.stderr}`).toBe(0);
    expect(plain.stdout.trim(), "dragon check が見本に誤りか警告を出した").toBe("");
    const layout = await runCli(["check", "--layout", "--json", ...files]);
    expect(layout.code, `dragon check --layout が見本で終わり方 0 にならない\n${layout.stdout}${layout.stderr}`).toBe(0);
    expect(JSON.parse(layout.stdout.trim() === "" ? "null" : layout.stdout) as unknown, "dragon check --layout が見本に誤りか崩れを出した").toEqual([]);
  });
});
