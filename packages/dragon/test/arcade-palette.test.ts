/**
 * bitsumi の頁と同じ色の色味 `arcade` (アーケードの画面) (#3341)。
 *
 * 地と字と線は bitsumi の値、5 つの色の緑は bitsumi の強調の緑、琥珀は bitsumi の橙を少し赤に寄せた値で、
 * 明るい頁に置いても暗い頁と同じ値で描き、影は付けない。
 * 今の 3 つの色味 (澄んだ色、紙と墨、夜の計器) の値は変えない。
 */
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { runCli } from "./export-support";
import { draw, figureVars, type Palette } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const THEMES = ["light", "dark"] as const;

/** 決めたことの値 (#3341 の step 2) */
const BITSUMI: Record<string, string> = {
  page: "#030805",
  bg: "#04100a",
  surf: "#071a10",
  sunk: "#020604",
  ink: "#e3f7e8",
  ink2: "#b4d4bd",
  mute: "#86a991",
  line: "#2f6b45",
  "c-blue": "#2ea7c4",
  "c-amber": "#ff9a45",
  "c-green": "#3cff78",
  "c-violet": "#8b63d9",
  "c-rose": "#d0457f",
  "c-slate": "#5a8a6b",
};

/** 色味の表から `arcade` を引く。無ければ無いと判定に出す */
function arcade(): Palette {
  const palette = draw("PALETTES").arcade;
  expect(palette, "色味の表に arcade が無い").toBeDefined();
  return palette as Palette;
}

/** 影の濃さの値を数に読む。読めない値は数でない印にする */
const opacity = (value: string | undefined): number => Number.parseFloat(value ?? "NaN");

describe("arcade の値 (#3341)", () => {
  it("arcade-palette-matches-bitsumi", () => {
    const palette = arcade();
    expect(palette.id).toBe("arcade");
    for (const [name, value] of Object.entries(BITSUMI)) expect(palette.dark[name], `arcade の暗い頁の ${name}`).toBe(value);
    // 描く部品は全ての色の変数を読むため、ほかの色味の暗い頁と同じ名前の色を全て持つ。
    // 明るい頁だけが持つ運ぶ物の色 (`carry`) は持たず、暗い頁と同じく字の色で描く
    const paper = draw("PALETTES").paper as Palette;
    for (const theme of THEMES) expect(Object.keys(palette[theme]).sort(), `arcade の ${theme} の色の名前`).toEqual(Object.keys(paper.dark).sort());
  });

  it("arcade-light-equals-dark", () => {
    const palette = arcade();
    expect(palette.light).toEqual(palette.dark);
  });

  it("arcade-casts-no-shadow", () => {
    const palette = arcade();
    const renderDiagram = draw("renderDiagram");
    const diagram = JSON.parse(readFileSync(join(EXAMPLES, "oauth.json"), "utf8")) as unknown;
    for (const theme of THEMES) {
      expect(opacity(palette[theme].shA), `arcade の ${theme} の近い影の濃さ`).toBe(0);
      expect(opacity(palette[theme].shB), `arcade の ${theme} の遠い影の濃さ`).toBe(0);
      const vars = figureVars(renderDiagram(diagram, { palette: "arcade", theme }).svg);
      expect(opacity(vars.shA), `arcade の ${theme} で描いた図の近い影の濃さ`).toBe(0);
      expect(opacity(vars.shB), `arcade の ${theme} で描いた図の遠い影の濃さ`).toBe(0);
    }
  });
});

describe("arcade で描く (#3341)", () => {
  it("arcade-renders-every-example", () => {
    const palettes = draw("PALETTES");
    const renderDiagram = draw("renderDiagram");
    const files = readdirSync(EXAMPLES).filter((file) => file.endsWith(".json"));
    expect(files.length, "packages/dragon/examples の見本の数").toBeGreaterThan(0);
    const others = Object.values(palettes)
      .filter((palette) => palette.id !== "arcade")
      .flatMap((palette) => THEMES.map((theme) => ({ where: `${palette.id} の ${theme} の地`, value: (palette[theme].bg ?? "").toLowerCase() })));
    expect(others.length, "arcade のほかの色味の地の数").toBe(8);

    for (const file of files) {
      const diagram = JSON.parse(readFileSync(join(EXAMPLES, file), "utf8")) as unknown;
      for (const theme of THEMES) {
        const rendered = renderDiagram(diagram, { palette: "arcade", theme });
        const svg = rendered.svg.toLowerCase();
        expect(rendered.palette, `${file} を arcade の ${theme} で描いた色味`).toBe("arcade");
        expect(svg, `${file} の ${theme} に arcade の地が入らない`).toContain(BITSUMI.bg);
        expect(svg, `${file} の ${theme} に arcade の緑が入らない`).toContain(BITSUMI["c-green"]);
        const leaked = others.filter((other) => svg.includes(other.value)).map((other) => other.where);
        expect(leaked, `${file} の ${theme} にほかの色味の地が入る`).toEqual([]);
      }
    }
  });

  it("cli-draws-with-arcade-palette", async () => {
    const out = join(mkdtempSync(join(tmpdir(), "dragon-arcade-")), "out");
    const ran = await runCli(["export", join(EXAMPLES, "oauth.json"), "--out", out, "--format", "html", "--palette", "arcade"]);
    expect(ran.code, `--palette arcade で書き出せない: ${ran.stderr}`).toBe(0);
    // `--out` は書き出す dir で、図の file の名前の HTML を置く
    const written = readdirSync(out).filter((file) => file.endsWith(".html"));
    expect(written, "--palette arcade で HTML を書き出さない").toHaveLength(1);
    const html = readFileSync(join(out, written[0] ?? ""), "utf8").toLowerCase();
    expect(html, "書き出した HTML に arcade の地が入らない").toContain(BITSUMI.bg);
    expect(html, "書き出した HTML に arcade の緑が入らない").toContain(BITSUMI["c-green"]);
  });
});

/** `text` の中で、`head` で始まる行。無ければ空 */
const lineOf = (text: string, head: string): string => text.split("\n").find((line) => line.startsWith(head)) ?? "";

/** CHANGELOG の Unreleased の節 */
describe("色味を挙げる文書 (#3341)", () => {
  it("docs-list-every-palette", () => {
    const ids = Object.keys(draw("PALETTES"));
    expect(ids, "色味の表に arcade が無い").toContain("arcade");
    const rows = [
      { where: "README.md の --palette の行", line: lineOf(readFileSync(join(ROOT, "packages/dragon/README.md"), "utf8"), "| `--palette <name>`") },
      { where: "README.ja.md の --palette の行", line: lineOf(readFileSync(join(ROOT, "packages/dragon/README.ja.md"), "utf8"), "| `--palette <名前>`") },
      { where: "docs/design/base/README.md の palettes.json の行", line: lineOf(readFileSync(join(ROOT, "docs/design/base/README.md"), "utf8"), "| `palettes.json`") },
    ];
    for (const { where, line } of rows) {
      expect(line, `${where} が無い`).not.toBe("");
      const missing = ids.filter((id) => !line.includes(`\`${id}\``));
      expect(missing, `${where} が挙げない色味`).toEqual([]);
    }
  });

  it("changelog-lists-arcade-palette", () => {
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"]) expect(changelogEntry(join(ROOT, file), 3341), `${file} の #3341 の項を持つ節に arcade が無い`).toContain("`arcade`");
  });
});

describe("今の色味 (#3341)", () => {
  it("existing-palettes-keep-their-values", () => {
    const before = JSON.parse(readFileSync(join(ROOT, "packages/dragon/test/fixtures/palettes-before-arcade.json"), "utf8")) as Record<string, Palette>;
    const palettes = draw("PALETTES");
    for (const [id, palette] of Object.entries(before)) {
      for (const theme of THEMES) expect(palettes[id]?.[theme], `${id} の ${theme} の値`).toEqual(palette[theme]);
    }
  });

  it("palette-copies-match", () => {
    const read = (file: string): unknown => JSON.parse(readFileSync(join(ROOT, file), "utf8"));
    expect(read("docs/design/base/palettes.json")).toEqual(read("packages/dragon/src/look/palettes.json"));
  });
});
