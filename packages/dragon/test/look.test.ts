/**
 * 見た目の値の表と色味と字 (#2985)。
 *
 * 色味は澄んだ色 / 紙と墨 / 夜の計器の 3 案で、既定は紙と墨。墨と朱は持たない。
 * 呼ぶ側は `colors` で色の値を渡し、名前で選んだ色味の色を上書きできる (#3198)。
 * 描く file は色の値と字の大きさを直接書かず、共通の値の表から読む。字は同梱した 2 つだけを使う。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { closestPair, type Sight } from "./color-vision";
import { exampleJson, smallSequence } from "./diagram-support";
import { ARCADE_COLORS, draw, figureClass, figureVars, type Lang } from "./render-support";

const PACKAGE = fileURLToPath(new URL("../", import.meta.url));
const SLOTS = ["c-blue", "c-amber", "c-green", "c-violet", "c-rose"];

describe("色味", () => {
  it("palette-defaults-to-paper", () => {
    const resolvePalette = draw("resolvePalette");
    const renderDiagram = draw("renderDiagram");

    expect(resolvePalette().id).toBe("paper");
    expect(resolvePalette("night").id).toBe("night");
    // 外した墨と朱の名前を渡しても、既定の紙と墨で描く
    expect(resolvePalette("ink").id).toBe("paper");

    const plain = renderDiagram(smallSequence());
    expect(plain.palette).toBe("paper");
    expect(plain.svg).toContain(resolvePalette("paper").light["c-blue"]);
    expect(renderDiagram(smallSequence(), { palette: "ink" }).palette).toBe("paper");
  });

  it("palettes-keep-cvd-separation", () => {
    const palettes = draw("PALETTES");
    expect(Object.keys(palettes).sort()).toEqual(["clear", "night", "paper"]);

    const floors: Record<Sight, number> = { normal: 15, protan: 6, deutan: 6, tritan: 6 };
    for (const palette of Object.values(palettes)) {
      for (const theme of ["light", "dark"] as const) {
        const colors = SLOTS.map((slot) => palette[theme][slot] ?? "");
        for (const [sight, floor] of Object.entries(floors) as [Sight, number][]) {
          const { distance, pair } = closestPair(colors, sight);
          expect(distance, `${palette.id} ${theme} ${sight} ${pair.join(" と ")}`).toBeGreaterThanOrEqual(floor);
        }
      }
    }
  });
});

/** 仮名と漢字。英語の断りの文に入らない */
const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
/** 図の名前の class に色と並んで書く、色でない変数 (字と 1 周の長さ) */
const NOT_COLORS = new Set(["sans", "mono", "T"]);

/** `colors` を渡して小さな時系列図を描いた時の断りの文。描けた時は空 */
function colorsRefusal(colors: Record<string, unknown>, lang?: Lang): string {
  try {
    draw("renderDiagram")(smallSequence(), { colors: colors as Record<string, string>, ...(lang ? { lang } : {}) });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
}

describe("色の値 (#3198)", () => {
  it("render-colors-override-palette", () => {
    const renderDiagram = draw("renderDiagram");
    for (const theme of ["light", "dark"] as const) {
      const base = draw("resolvePalette")("paper")[theme];
      const rendered = renderDiagram(smallSequence(), { palette: "paper", theme, colors: ARCADE_COLORS });
      const vars = figureVars(rendered.svg);
      for (const [name, value] of Object.entries(ARCADE_COLORS)) expect(vars[name], `${theme} の ${name}`).toBe(value);
      // 渡さない色 (影、硬貨、混ぜる割合など) は紙と墨の値のまま残る
      const kept = Object.entries(base).filter(([name]) => !Object.hasOwn(ARCADE_COLORS, name));
      expect(kept.length, "渡さない色が無い").toBeGreaterThan(0);
      for (const [name, value] of kept) expect(vars[name], `${theme} の ${name}`).toBe(value);
      expect(rendered.palette).toBe("paper");
      // 色を渡さない図と同じ頁に並べても、渡した色はこの図にだけ効く (変数を書く class の名前が分かれる)
      expect(figureClass(rendered.svg)).toBeDefined();
      expect(figureClass(rendered.svg)).not.toBe(figureClass(renderDiagram(smallSequence(), { palette: "paper", theme }).svg));
    }
  });

  it("render-colors-reject-unknown-or-unsafe", () => {
    expect(colorsRefusal({ glow: "#39ff14" }), "色味に無い名前").toMatch(/^図を描けない: .*glow/u);
    // 宣言を抜ける `;` と `}`、属性を抜ける `"`、要素を抜ける `<`、後ろの宣言を呑む閉じない括弧、外の file を読む `url(`、空と字でない値
    for (const value of ["#000;--ink:red", '#000" onload="x', "</style><script>", "red}", "rgb(0 0 0", "url(a.svg#b)", "", 12]) {
      expect(colorsRefusal({ "c-green": value }), `${JSON.stringify(value)} を描いた`).toMatch(/^図を描けない: .*c-green/u);
    }
    // 断りの文は渡した言葉で出し、誤った名前を全て挙げる
    const english = colorsRefusal({ glow: "#39ff14", bg: "red;" }, "en");
    expect(english, "英語の断りの文の頭").toMatch(/^Cannot draw the diagram: /u);
    expect(english).toContain("glow");
    expect(english).toContain("bg");
    expect(english, "英語の断りの文に仮名か漢字がある").not.toMatch(KANA_KANJI);
  });

  it("render-colors-absent-keeps-palette", () => {
    const renderDiagram = draw("renderDiagram");
    const palettes = draw("PALETTES");
    for (const palette of Object.values(palettes)) {
      for (const theme of ["light", "dark"] as const) {
        const rendered = renderDiagram(smallSequence(), { palette: palette.id, theme });
        const vars = figureVars(rendered.svg);
        for (const [name, value] of Object.entries(palette[theme])) expect(vars[name], `${palette.id} ${theme} の ${name}`).toBe(value);
        expect(Object.keys(vars).filter((name) => !NOT_COLORS.has(name)).sort(), `${palette.id} ${theme} の色の名前`).toEqual(Object.keys(palette[theme]).sort());
        expect(rendered.palette).toBe(palette.id);
      }
    }
    expect(figureVars(renderDiagram(smallSequence()).svg).bg, "名前を書かない時の地").toBe(palettes.paper?.light.bg);
  });
});

/** 描く file の一覧。置き場所と描画と動きと見せ方の file。 */
function drawingFiles(): string[] {
  const src = join(PACKAGE, "src");
  const files: string[] = [];
  for (const dir of ["render", "layout"]) {
    const path = join(src, dir);
    expect(statSync(path, { throwIfNoEntry: false })?.isDirectory(), `src/${dir} が無い`).toBe(true);
    for (const name of readdirSync(path)) if (name.endsWith(".ts")) files.push(join(path, name));
  }
  for (const name of ["timeline.ts", "view.ts", "player.ts"]) {
    const path = join(src, name);
    expect(statSync(path, { throwIfNoEntry: false })?.isFile(), `src/${name} が無い`).toBe(true);
    files.push(path);
  }
  return files;
}

const withoutComments = (code: string): string => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("値の表", () => {
  it("renderers-read-values-from-one-table", () => {
    const files = drawingFiles();
    expect(files.length).toBeGreaterThan(4);
    for (const file of files) {
      const code = withoutComments(readFileSync(file, "utf8"));
      const where = file.slice(PACKAGE.length);
      expect(code.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g), `${where} に色の値`).toBeNull();
      expect(code.match(/\b(?:rgba?|hsla?|oklch)\(/g), `${where} に色の値`).toBeNull();
      expect(code.match(/\b\d+(?:\.\d+)?px\b/g), `${where} に字の大きさ`).toBeNull();
    }
    // 描く file のうち少なくとも置き場所と描画は、値の表から読む
    const readers = files.filter((file) => /from "\.\.\/look\/values"/.test(readFileSync(file, "utf8")));
    expect(readers.length, "値の表を読む描く file が無い").toBeGreaterThanOrEqual(2);
  });
});

describe("字", () => {
  it("render-uses-bundled-fonts", () => {
    const fonts = draw("FONTS");
    expect(fonts).toEqual({ sans: "Noto Sans JP Variable", mono: "JetBrains Mono Variable" });

    // 字は package の依存として同梱し、package から解決できる
    const manifest = JSON.parse(readFileSync(join(PACKAGE, "package.json"), "utf8")) as { dependencies?: Record<string, string> };
    const require = createRequire(join(PACKAGE, "package.json"));
    for (const name of ["@fontsource-variable/noto-sans-jp", "@fontsource-variable/jetbrains-mono"]) {
      expect(manifest.dependencies?.[name], `${name} が依存に無い`).toBeDefined();
      expect(() => require.resolve(`${name}/package.json`), `${name} を解決できない`).not.toThrow();
    }

    const rendered = draw("renderDiagram")(smallSequence());
    expect(rendered.fonts).toEqual(fonts);
    // 描いた SVG は同梱した 2 つの字を変数で 1 度だけ名指し、字を使う所はどれもその変数を読む。
    // 端末の字の名前を持たないので、同梱した字が無い時に端末の字へ黙って落ちない
    const svg = rendered.svg;
    expect(svg).toMatch(new RegExp(`--sans:\\s*"${fonts.sans}"\\s*[;}]`));
    expect(svg).toMatch(new RegExp(`--mono:\\s*"${fonts.mono}"\\s*[;}]`));
    expect(svg).not.toMatch(/font-family\s*=/);
    for (const m of svg.matchAll(/font-family\s*:\s*([^;}]+)/g)) expect(m[1]?.trim()).toMatch(/^var\(--(sans|mono)\)$/);
    for (const m of svg.matchAll(/(?:^|[;{\s])font\s*:\s*([^;}]+)/g)) expect(m[1]?.trim()).toMatch(/var\(--(sans|mono)\)$/);
    expect(svg).not.toMatch(/system-ui|sans-serif|monospace|Hiragino|Menlo|Meiryo|Yu Gothic/);
  });

  it("rendered-text-at-least-10-5px", () => {
    // 字の大きさはどれも 10.5 以上にする (`look/values.ts` の `TYPE`)。小さい字は図を原寸で見ても読めない
    for (const name of ["oauth.json", "ccip.json", "intro.json"]) {
      const { svg } = draw("renderDiagram")(exampleJson(name));
      const sizes = [...svg.matchAll(/(?:^|[;{\s])font\s*:\s*\d+\s+([\d.]+)px/g), ...svg.matchAll(/font-size\s*[:=]\s*"?([\d.]+)/g)].map((m) => Number(m[1]));
      expect(sizes.length, `${name} の字の大きさ`).toBeGreaterThan(0);
      for (const size of sizes) expect(size, `${name} に ${size}px の字`).toBeGreaterThanOrEqual(10.5);
    }
  });
});
