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
import { draw } from "./render-support";

type ReadBlocks = { ok: true; blocks: unknown } | { ok: false; errors: LineError[] };
type Parsed = { ok: true; diagram: Json } | { ok: false; errors: LineError[] };

interface Define {
  format: number;
  blocks: { name: string; base: string; path?: string; shape?: string; color?: string }[];
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
    expect(define?.blocks, "原本の JSON の定義の欄が使った共有の定義だけを持たない").toEqual([{ name: "+bridge", base: "box", path: BRIDGE, color: "violet" }]);
    // JSON だけを受け取った側でも、共有の形で描く
    const svg = draw("renderDiagram")(parsed.ok ? parsed.diagram : {}, {}).svg;
    expect(pathsWith(svg, BRIDGE).length, "共有の箱の形で描かない").toBeGreaterThan(0);
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
