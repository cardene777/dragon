/**
 * 箱と区画の絵柄に、無料の絵柄集 Tabler の線の絵柄を `tabler:<名前>` で書ける (#3493)。
 *
 * Tabler の線の絵柄は 24 四方の格子に path だけで描かれ、手描きの絵柄の表 (`ICONS`) は (0, 0) を中心に 20 四方へ描く。
 * 読み込む時に 20 四方へ縮めて 1 本の path にし、手描きの絵柄と同じ class と同じ縮みで描く。
 * 既定の入口は絵柄集を初めから持ち、軽い入口は `tabler:` を書いた図の時だけ `loadFor` で塊を読む。
 * 書き出した HTML の頁には、図が使った絵柄の形だけを入れる。
 *
 * 形が合うかは、描いた path と元の path を同じ平たくし方 (`flattenPath`) で点に崩し、外形の枠を比べて確かめる。
 * 平たくし方は縮めても同じ所で点を取るので、縮め方が正しければ枠は丸めの誤差の内で一致する。
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, inject, it } from "vitest";
import { flattenPath } from "../src/render/outline";
import { api, type Json, smallArchitecture } from "./diagram-support";
import { runCli } from "./export-support";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/** Tabler の線の絵柄の置き場。devDependency の `@tabler/icons` が持つ */
const TABLER = join(ROOT, "node_modules", "@tabler", "icons", "icons", "outline");
const ICONS = (dragon as unknown as { ICONS: Record<string, string> }).ICONS;
const renderDiagram = (dragon as unknown as { renderDiagram(diagram: Json): { svg: string } }).renderDiagram;
/** npm に出す file の一覧。準備の段 (`test-support/pack-setup.ts`) が 1 度だけ作る */
const packedFiles = (): string[] => ((inject as (key: string) => unknown)("dragonPackFiles") as string[] | undefined) ?? [];

/** 外形の枠。左、上、右、下 */
type Bounds = [number, number, number, number];
interface Glyph {
  scale: number;
  d: string;
  element: string;
}

/** 箱 1 つに絵柄を付けた構成図の記法 */
const boxText = (icon: string): string => ["architecture 絵柄", "", `box 橋 [icon: ${icon}]`, "box 岸", "", "step 渡る", "  say 橋から岸へ渡る。", "  橋 -> 岸: 渡る"].join("\n");
/** 区画に絵柄を付けた構成図の記法 */
const groupText = (icon: string): string =>
  ["architecture 絵柄", "", `group 川 [icon: ${icon}]`, "  box 橋", "end", "box 岸", "", "step 渡る", "  say 橋から岸へ渡る。", "  橋 -> 岸: 渡る"].join("\n");

/** Tabler の絵柄の SVG から、描く path の d を並べる。背景の枠 (`stroke="none"`) は描かないので外す */
function tablerPaths(name: string): string[] {
  const svg = readFileSync(join(TABLER, `${name}.svg`), "utf8");
  return [...svg.matchAll(/<path\b([^>]*?)\/?>/gu)]
    .map((match) => match[1] ?? "")
    .filter((attrs) => !attrs.includes('stroke="none"'))
    .map((attrs) => /\bd="([^"]*)"/u.exec(attrs)?.[1] ?? "");
}

function boundsOf(points: readonly (readonly [number, number])[]): Bounds {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** 元の path の外形の枠を、(0, 0) を中心にした 20 四方へ縮めた枠 */
function expectedBounds(name: string): Bounds {
  const k = 20 / 24;
  const points = tablerPaths(name).flatMap((d) => flattenPath(d).flat());
  return boundsOf(points.map(([x, y]) => [(x - 12) * k, (y - 12) * k] as const));
}

/** 描いた SVG の絵柄の path。手描きの絵柄も絵柄集の絵柄も、絵柄の class (`dg-gl`) を持つ */
function glyphs(svg: string): Glyph[] {
  return [...svg.matchAll(/<path class="dg-gl" transform="translate\([-\d.]+ [-\d.]+\) scale\(([-\d.]+)\)" d="([^"]*)"\/>/gu)].map((match) => ({
    scale: Number(match[1]),
    d: match[2] ?? "",
    element: match[0],
  }));
}

const near = (a: Bounds, b: Bounds): boolean => a.every((value, index) => Math.abs(value - (b[index] ?? Number.NaN)) <= 0.1);

/** 描いた絵柄のうち、外形の枠が `want` と 0.1 以内で合う物 */
const glyphLike = (svg: string, want: Bounds): Glyph | undefined => glyphs(svg).find((glyph) => near(boundsOf(flattenPath(glyph.d).flat()), want));

/** 記法を既定の入口で読んで描いた SVG。読めない時は誤りの文を添えて落とす */
function svgOf(text: string): string {
  const parsed = api("parseNotation")(text);
  expect(parsed.ok, `記法を読めない: ${JSON.stringify(parsed.ok ? [] : parsed.errors)}`).toBe(true);
  return parsed.ok ? renderDiagram(parsed.diagram).svg : "";
}

const withIcon = (base: Json, list: "boxes" | "regions", icon: string): Json => {
  const diagram = structuredClone(base) as Record<string, { icon?: string }[]>;
  const items = diagram[list] as { icon?: string }[];
  items[0] = { ...items[0], icon };
  return diagram;
};

/** 新しい Node で軽い入口を読み、`body` を回して `out` を返す */
function inFreshNode<T>(body: string): T {
  const code = `const light = await import("@cardenelabs/dragon/light");\nconst out = {};\n${body}\nconsole.log(JSON.stringify(out));`;
  const stdout = execFileSync(process.execPath, ["--input-type=module", "-e", code], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(stdout) as T;
}

/** 絵柄集を読んだかを返す式。関数がまだ無い時は "missing" */
const TABLER_LOADED = `typeof light.iconSetLoaded === "function" ? light.iconSetLoaded("tabler") : "missing"`;

describe("Tabler の絵柄を箱と区画に描く (#3493)", () => {
  it("tabler-icon-draws-in-box", () => {
    const svg = svgOf(boxText("tabler:building-bridge-2"));
    expect(glyphLike(svg, expectedBounds("building-bridge-2")), "箱の絵柄の枠に、石の橋を 20 四方へ縮めた形が無い").toBeDefined();
  });

  it("tabler-icon-draws-in-group", () => {
    const svg = svgOf(groupText("tabler:building-bridge-2"));
    expect(glyphLike(svg, expectedBounds("building-bridge-2")), "区画の印に、石の橋を 20 四方へ縮めた形が無い").toBeDefined();
  });

  it("tabler-icon-matches-house-stroke", () => {
    const text = ["architecture 絵柄", "", "box 鍵 [icon: key]", "box 橋 [icon: tabler:building-bridge-2]", "", "step 渡る", "  say 鍵から橋へ渡る。", "  鍵 -> 橋: 渡る"].join("\n");
    const svg = svgOf(text);
    const house = glyphs(svg).find((glyph) => glyph.d === ICONS.key);
    const tabler = glyphLike(svg, expectedBounds("building-bridge-2"));
    expect(house, "手描きの鍵の絵柄が無い").toBeDefined();
    expect(tabler, "石の橋の絵柄が無い").toBeDefined();
    expect(tabler?.scale, "絵柄集の絵柄の縮みが手描きの絵柄と違う").toBe(house?.scale);
    // 線の太さは絵柄の class (`dg-gl`) の決まりが持つ。要素に太さを書くと手描きの絵柄とずれる
    expect(tabler?.element, "絵柄集の絵柄が線の太さを自分で持つ").not.toMatch(/stroke-width|style=/u);
  });

  it("tabler-paths-convert-to-20-grid", () => {
    const names = readdirSync(TABLER)
      .filter((file) => file.endsWith(".svg"))
      .map((file) => file.slice(0, -4))
      .sort();
    expect(names.length, "Tabler の線の絵柄が無い (走査の空振り)").toBeGreaterThan(5000);
    // 命令の一覧は手で書かず、描く path から数える。命令ごとに、その命令を最初に持つ絵柄を 1 つ選ぶ
    const picked = new Map<string, string>();
    for (const name of names) {
      for (const d of tablerPaths(name)) for (const command of d.match(/[A-Za-z]/gu) ?? []) if (!picked.has(command)) picked.set(command, name);
    }
    expect(picked.size, "描く path の命令を数えられない (走査の空振り)").toBeGreaterThan(5);
    const wrong = [...picked].flatMap(([command, name]) => {
      const parsed = api("parseNotation")(boxText(`tabler:${name}`));
      if (!parsed.ok) return [`${command} (${name}): 読めない`];
      return glyphLike(renderDiagram(parsed.diagram).svg, expectedBounds(name)) ? [] : [`${command} (${name}): 形が合わない`];
    });
    expect(wrong, "20 四方へ縮めた形が元と合わない絵柄").toEqual([]);
  });

  it("house-icon-draws-house-path", () => {
    for (const name of ["key", "user", "doc"]) {
      expect(
        glyphs(svgOf(boxText(name))).some((glyph) => glyph.d === ICONS[name]),
        `手描きの ${name} の絵柄が表の path のまま描かれない`,
      ).toBe(true);
    }
  });
});

describe("Tabler の名前を確かめる (#3493)", () => {
  it("tabler-unknown-name-refused", () => {
    const text = boxText("tabler:no-such-icon");
    const result = api("parseNotation")(text);
    expect(result.ok, "Tabler に無い名前を通す").toBe(false);
    const error = result.ok ? undefined : result.errors[0];
    expect({ line: error?.line, column: error?.column }, "誤りが指す所").toEqual({ line: 3, column: (text.split("\n")[2] ?? "").indexOf("icon") + 1 });
    expect(error?.message, "誤りの文が書いた名前を名指さない").toContain("tabler:no-such-icon");
    expect(error?.message, "誤りの文が Tabler に無いことを言わない").toContain("Tabler");
    const close = api("parseNotation")(boxText("tabler:building-bridg-2"));
    expect(close.ok ? "" : close.errors[0]?.message, "誤りの文が近い名前を挙げない").toContain("tabler:building-bridge-2");
  });

  it("tabler-icon-passes-validator", () => {
    const validate = api("validateDiagram");
    expect(validate(withIcon(smallArchitecture(), "boxes", "tabler:building-bridge-2")), "箱の Tabler の名前を通さない").toEqual({ ok: true });
    expect(validate(withIcon(smallArchitecture(), "regions", "tabler:building-bridge-2")), "区画の Tabler の名前を通さない").toEqual({ ok: true });
    const missing = validate(withIcon(smallArchitecture(), "boxes", "tabler:no-such-icon"));
    expect(missing.ok, "Tabler に無い名前を通す").toBe(false);
    expect(missing.ok ? [] : missing.errors.map((e) => e.pointer), "誤りが指す欄").toEqual(["/boxes/0/icon"]);
  });
});

describe("軽い入口は Tabler を使う図の時だけ読む (#3493)", () => {
  it("light-loads-tabler-for-tabler-diagram", () => {
    const text = boxText("tabler:building-bridge-2");
    const whole = svgOf(text);
    const out = inFreshNode<{ svg?: string; loaded: unknown }>(`
      const text = ${JSON.stringify(text)};
      await light.loadFor(text);
      const parsed = light.parseNotation(text);
      out.svg = parsed.ok ? light.renderDiagram(parsed.diagram).svg : "読めない: " + JSON.stringify(parsed.errors);
      out.loaded = ${TABLER_LOADED};
    `);
    expect(out.loaded, "loadFor を待っても絵柄集を読まない").toBe(true);
    expect(out.svg, "軽い入口の SVG が既定の入口と違う").toBe(whole);
  });

  it("light-skips-tabler-for-plain-diagram", () => {
    const out = inFreshNode<{ loaded: unknown }>(`
      await light.loadFor(${JSON.stringify(boxText("key"))});
      out.loaded = ${TABLER_LOADED};
    `);
    expect(out.loaded, "tabler: を書かない図で絵柄集を読んだ").toBe(false);
  });

  it("light-refuses-tabler-before-load", () => {
    const out = inFreshNode<{ result: string }>(`
      // 構成図を読む読み方だけを先に読み、絵柄集は読まない
      await light.loadFor(${JSON.stringify(boxText("key"))});
      const parsed = light.parseNotation(${JSON.stringify(boxText("tabler:building-bridge-2"))});
      if (!parsed.ok) out.result = "読めない: " + parsed.errors.map((e) => e.message).join(" / ");
      else {
        try { out.result = light.renderDiagram(parsed.diagram).svg ? "描けた" : "空"; } catch (e) { out.result = "描けない: " + e.message; }
      }
    `);
    expect(out.result, "loadFor の前に Tabler の図を描けた").not.toBe("描けた");
    expect(out.result, "誤りの文が絵柄集の名前を言わない").toMatch(/tabler/iu);
    expect(out.result, "誤りの文が loadFor を待つよう言わない").toContain("loadFor");
  });
});

describe("書き出した頁と package (#3493)", () => {
  it("html-export-carries-only-used-tabler-icons", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dragon-icon-set-"));
    writeFileSync(join(dir, "house.dragon"), boxText("doc"));
    writeFileSync(join(dir, "tabler.dragon"), boxText("tabler:building-bridge-2"));
    const house = await runCli(["export", join(dir, "house.dragon"), "--format", "html", "--out", dir]);
    const tabler = await runCli(["export", join(dir, "tabler.dragon"), "--format", "html", "--out", dir]);
    expect(house.code, house.stderr).toBe(0);
    expect(tabler.code, tabler.stderr).toBe(0);
    const houseHtml = readFileSync(join(dir, "house.html"), "utf8");
    const tablerHtml = readFileSync(join(dir, "tabler.html"), "utf8");
    expect(Buffer.byteLength(tablerHtml) - Buffer.byteLength(houseHtml), "Tabler の絵柄を使った頁が 5KB を超えて大きい").toBeLessThanOrEqual(5 * 1024);
    expect(tablerHtml, "頁が外の script か CSS を読む").not.toMatch(/<script[^>]+\bsrc=|<link[^>]+href="https?:/u);
    const used = glyphLike(svgOf(boxText("tabler:building-bridge-2")), expectedBounds("building-bridge-2"));
    const unused = glyphLike(svgOf(boxText("tabler:building-bridge")), expectedBounds("building-bridge"));
    expect(used && tablerHtml.includes(used.d), "頁が使った石の橋の形を持たない").toBe(true);
    expect(unused && tablerHtml.includes(unused.d), "頁が使っていない吊り橋の形まで持つ").toBe(false);
  });

  it("tabler-license-ships", () => {
    const files = packedFiles();
    expect(files.length, "準備の段が npm に出す file の一覧を渡していない").toBeGreaterThan(0);
    expect(files, "npm に出す file に利用許諾の表示が無い").toContain("THIRD_PARTY_NOTICES.md");
    const notice = readFileSync(join(ROOT, "THIRD_PARTY_NOTICES.md"), "utf8");
    const license = readFileSync(join(ROOT, "node_modules", "@tabler", "icons", "LICENSE"), "utf8").trim();
    expect(notice, "利用許諾の表示に Tabler の MIT の全文が無い").toContain(license);
  });
});
