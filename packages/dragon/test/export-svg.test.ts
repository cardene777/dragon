/**
 * `dragon export --format svg` (#3891)。
 *
 * SVG は全ての図の種類で最後の段の止め絵を書き、描いた字の書体を `data:` で埋める。
 * 形を選ばない書き出しは今どおり mp4、GIF、HTML、PNG の 4 つを書き、SVG は `--format svg` を選んだ時だけ書く。
 * 書き出しの説明 (README と使い方の頁と編集画面の案内) は、書ける形に SVG を並べる。
 *
 * 場面を持つ列の図も、場面ごとの図を並べた止めた形で書き出せる (#4018)。
 *
 * 書き出しと命令は file を読み込む段 (`at-load.ts`) で済ませ、件は書いた file を読んで確かめる。
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseNotation, renderDiagram } from "../src/core";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";
import { atLoad } from "./at-load";
import { smallSequence } from "./diagram-data";
import { exporter, type Format, formatOf, runCli } from "./export-support";

/** repo の根。vitest を回す場所 */
const REPO = process.cwd();
/** 書き出せる形を並べる説明の file */
const DOCS = [
  "README.md",
  "README.ja.md",
  "packages/dragon/README.md",
  "packages/dragon/README.ja.md",
  "apps/playground-spa/src/docs/content.ts",
  "apps/playground-spa/src/text.ts",
] as const;

const SVG = await atLoad("時系列図を SVG に書き出す", async () => {
  const exportDiagram = await exporter();
  const outDir = mkdtempSync(join(tmpdir(), "dragon-export-svg-"));
  const diagram = smallSequence();
  const result = await exportDiagram(diagram, { outDir, name: "small", formats: ["svg"] });
  const file = result.files.svg;
  return {
    svg: file ? readFileSync(file, "utf8") : "",
    stills: renderDiagram(diagram).timeline.stills,
  };
});

const DEFAULT = await atLoad("形を選ばずに命令で書き出す", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dragon-export-default-"));
  const file = join(dir, "small.json");
  writeFileSync(file, JSON.stringify(smallSequence()));
  const out = join(dir, "out");
  // 書く形だけを見るので、動画は 1 秒に 1 コマ、GIF は 2 秒に 1 コマで撮る
  const ran = await runCli(["export", file, "--out", out, "--fps", "1", "--gif-fps", "0.5"]);
  return { ran, out };
});

describe("命令の SVG の書き出し (#3891)", () => {
  it("export-svg-writes-last-step-still", () => {
    const { svg, stills } = SVG.get();
    expect(formatOf(Buffer.from(svg)), "SVG として書かない").toBe("svg");
    expect(svg.includes('data-dragon="figure"'), "図の SVG を書かない").toBe(true);
    // 止め絵は動きを止め、最後の段の止め絵の時刻に置く
    expect(svg.includes("--play:paused"), "動きを止めない").toBe(true);
    expect(
      svg.includes(`--at:${stills.at(-1)}`),
      `最後の段の止め絵の時刻 (${stills.at(-1)} 秒) に置かない`,
    ).toBe(true);
    expect(svg.includes("@font-face"), "字の書体を埋めない").toBe(true);
    const urls = [...svg.matchAll(/@font-face\s*\{[^}]*?url\(\s*["']?([^"')]+)/gu)].map((match) =>
      (match[1] ?? "").slice(0, 32),
    );
    expect(urls.length, "字の書体の file の参照").toBeGreaterThan(0);
    expect(
      urls.filter((url) => !url.startsWith("data:font/")),
      "data: でない字の書体の参照",
    ).toEqual([]);
  });

  it("export-default-writes-no-svg", () => {
    const { ran, out } = DEFAULT.get();
    expect(ran.code, `命令が落ちた: ${ran.stderr}`).toBe(0);
    for (const format of ["mp4", "gif", "html", "png"] as const) {
      const file = join(out, `small.${format}`);
      expect(
        existsSync(file) ? formatOf(readFileSync(file)) : "missing",
        `${file} を ${format} として書かない`,
      ).toBe(format);
    }
    expect(
      readdirSync(out).filter((name) => name.endsWith(".svg")),
      "形を選ばない書き出しが SVG を書いた",
    ).toEqual([]);
  });

  it("export-svg-listed-in-docs", () => {
    // mp4、GIF、HTML、PNG を並べる行は、書ける形の一覧なので SVG も並べる
    const missing = DOCS.flatMap((doc) =>
      readFileSync(join(REPO, doc), "utf8")
        .split("\n")
        .flatMap((line, i) => {
          const low = line.toLowerCase();
          const lists = ["mp4", "gif", "html", "png"].every((word) =>
            new RegExp(`\\b${word}\\b`, "u").test(low),
          );
          return lists && !/\bsvg\b/u.test(low)
            ? [`${doc}:${i + 1}: ${line.trim().slice(0, 80)}`]
            : [];
        }),
    );
    expect(missing, "書ける形に SVG を並べない説明の行").toEqual([]);
  });
});

/** 場面の部品の図。部品の図はブロックの置き場の `gallery/` に在る */
const sceneSample = (file: string): string => readFileSync(join(REPO, "packages/dragon/src/blocks/scene/gallery", file), "utf8");

/** 列の図に場面と目盛りを書いた原本。`show` は場面の見せ方 */
const lineupGauge = (show: "stack" | "pick"): string => `lineup 作業の2つの場面 [scenes: ${show}]

box todo as やること
box doing as 作業中

gauge load as 作業の量 [on: doing, limit: 3, unit: 件, over: 抱えすぎ]

item 検索, 通知, 決済, 請求

step 並べる
  say どの場面も4件を並べる。
  line todo: 検索, 通知, 決済, 請求

scene 少しずつ取る
  step 1件取る
    say 1件だけ取る。
    line doing: 検索
    line todo: 通知, 決済, 請求
    set load: 1
end

scene まとめて取る
  step 全て取る
    say 全て取り、上限を超える。
    line doing: 検索, 通知, 決済, 請求
    set load: 4
    stop 抱えすぎた
end
`;

/** 場面を持つ列の図の、書き出す原本と書き出す形 (#4018) */
const SCENE_CASES: { name: string; text: string; lang: "ja" | "en"; formats: Format[] }[] = [
  { name: "parts/scene.lineup.dragon", text: sceneSample("scene.lineup.dragon"), lang: "ja", formats: ["png", "svg", "html"] },
  { name: "parts/scene.lineup.en.dragon", text: sceneSample("scene.lineup.en.dragon"), lang: "en", formats: ["png", "svg", "html"] },
  { name: "列の図の場面と目盛り (stack)", text: lineupGauge("stack"), lang: "ja", formats: ["svg", "html"] },
  { name: "列の図の場面と目盛り (pick)", text: lineupGauge("pick"), lang: "ja", formats: ["svg", "html"] },
];

/** 書き出した結果。書いた形と書き出しが選んだ見せ方を、落ちた時は断りの文を持つ */
interface SceneTried {
  name: string;
  files: string[];
  view?: string;
  error?: string;
}

const SCENE_EXPORTED = await atLoad("場面を持つ列の図を書き出す", async (): Promise<SceneTried[]> => {
  const exportDiagram = await exporter();
  const tried: SceneTried[] = [];
  for (const { name, text, lang, formats } of SCENE_CASES) {
    const parsed = parseNotation(text, { lang });
    if (!parsed.ok) {
      tried.push({ name, files: [], error: `記法を読めない: ${JSON.stringify(parsed.errors)}` });
      continue;
    }
    const outDir = mkdtempSync(join(tmpdir(), "dragon-scene-export-"));
    try {
      const result = await exportDiagram(parsed.diagram, { outDir, name: "scene", formats, lang });
      tried.push({ name, files: Object.keys(result.files).sort(), view: result.view });
    } catch (error) {
      tried.push({ name, files: [], error: (error as Error).message });
    }
  }
  return tried;
});

/** 書き出した結果のうち、名前が `names` の物の名前と断りの文と書いた形と見せ方 */
const sceneTried = (names: string[]): [string, string, string[], string][] =>
  SCENE_EXPORTED.get()
    .filter((t) => names.includes(t.name))
    .map((t) => [t.name, t.error ?? "", t.files, t.view ?? ""]);

describe("場面を持つ列の図は止めた形で書き出す (#4018)", () => {
  // 書き出しは枠で段を追う絵を描き直さず、場面ごとの図を並べた止めた形 (`fixed`) で書く。描き直していた時は、列の図の帯を読めずに落ちていた
  it("scene-lineup-sample-exports", () => {
    expect(sceneTried(["parts/scene.lineup.dragon", "parts/scene.lineup.en.dragon"]), "列の図の場面の見本を書き出した形と見せ方").toEqual([
      ["parts/scene.lineup.dragon", "", ["html", "png", "svg"], "fixed"],
      ["parts/scene.lineup.en.dragon", "", ["html", "png", "svg"], "fixed"],
    ]);
  });

  it("scene-lineup-gauge-exports-both-shows", () => {
    expect(sceneTried(["列の図の場面と目盛り (stack)", "列の図の場面と目盛り (pick)"]), "列の図に場面と目盛りを書いた原本を書き出した形と見せ方").toEqual([
      ["列の図の場面と目盛り (stack)", "", ["html", "svg"], "fixed"],
      ["列の図の場面と目盛り (pick)", "", ["html", "svg"], "fixed"],
    ]);
  });
});
