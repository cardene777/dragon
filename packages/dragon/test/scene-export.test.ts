/**
 * 場面を持つ図の書き出し (#4018)。
 *
 * 場面を持つ図は、配管の図と判定の表と同じく寄って追わない図で、見せ方を選ぶ決まり (`chooseView`) は枠の幅に依らず止めた形を選ぶ。
 * 再生の部品は場面ごとの図を枠ごと並べて寄って追わないので、書き出しも枠で段を追う絵を描き直さず、場面ごとの図を並べた止めた形で書く。
 * 描き直していた時は、場面を束ねた並べ方を列の図の並べ方として描き、列の図の帯を読めずに落ちていた。
 *
 * 描く仕事と書き出しは file を読み込む段 (`at-load.ts`) で済ませ、件はその結果を読んで確かめる。
 * 書き出しは build した入口 (`@cardenelabs/dragon/export`) を読み、PNG は file で 1 つの Chromium で撮る。
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { chooseView, parseNotation, renderDiagram } from "../src/core";
import "../src/kind-use/flow";
import "../src/kind-use/lineup";
import { atLoad } from "./at-load";
import { exporter, type Format } from "./export-support";

const ROOT = join(process.cwd(), "packages/dragon");
/** 場面の部品の図。部品の図はブロックの置き場の `gallery/` に在る */
const sample = (file: string): string =>
  readFileSync(join(ROOT, "src/blocks/scene/gallery", file), "utf8");

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

/** 書き出す原本と、書き出す形 */
const CASES: { name: string; text: string; lang: "ja" | "en"; formats: Format[] }[] = [
  {
    name: "parts/scene.lineup.dragon",
    text: sample("scene.lineup.dragon"),
    lang: "ja",
    formats: ["png", "svg", "html"],
  },
  {
    name: "parts/scene.lineup.en.dragon",
    text: sample("scene.lineup.en.dragon"),
    lang: "en",
    formats: ["png", "svg", "html"],
  },
  {
    name: "列の図の場面と目盛り (stack)",
    text: lineupGauge("stack"),
    lang: "ja",
    formats: ["svg", "html"],
  },
  {
    name: "列の図の場面と目盛り (pick)",
    text: lineupGauge("pick"),
    lang: "ja",
    formats: ["svg", "html"],
  },
];

/** 記法を読んだ原本。読めない時は断りを挙げて投げる */
function diagramOf(text: string, lang: "ja" | "en"): unknown {
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`記法を読めない: ${JSON.stringify(parsed.errors)}`);
  return parsed.diagram;
}

/** 書き出した結果。落ちた時は `error` に断りの文を持つ */
interface Tried {
  name: string;
  files: string[];
  view?: string;
  error?: string;
}

const EXPORTED = await atLoad("場面を持つ列の図を書き出す", async (): Promise<Tried[]> => {
  const exportDiagram = await exporter();
  const tried: Tried[] = [];
  for (const { name, text, lang, formats } of CASES) {
    const outDir = mkdtempSync(join(tmpdir(), "dragon-scene-export-"));
    try {
      const result = await exportDiagram(diagramOf(text, lang), {
        outDir,
        name: "scene",
        formats,
        lang,
      });
      tried.push({ name, files: Object.keys(result.files).sort(), view: result.view });
    } catch (error) {
      tried.push({ name, files: [], error: (error as Error).message });
    }
  }
  return tried;
});

/**
 * 場面の部品の図 (手順の図と列の図) を描き、図の幅の半分の枠で見せ方を選ぶ決まりが選んだ見せ方と枠の幅。
 * 半分の幅に収めると箱の名前の字が 10.5px を下回り、場面を持たない図なら寄って追う形を選ぶ
 */
const CHOSEN = await atLoad("場面の部品の図の見せ方を選ぶ", () =>
  ["scene.flow.dragon", "scene.lineup.dragon"].map((file) => {
    const rendered = renderDiagram(diagramOf(sample(file), "ja"), { lang: "ja" });
    const frame = rendered.layout.width / 2;
    return { file, frame, scenes: rendered.scenes?.length ?? 0, view: chooseView(rendered, frame) };
  }),
);

/** 書き出した結果のうち、名前が `names` の物 */
const triedOf = (names: string[]): Tried[] => EXPORTED.get().filter((t) => names.includes(t.name));

describe("場面を持つ図は止めた形で書き出す (#4018)", () => {
  it("scene-lineup-sample-exports", () => {
    const tried = triedOf(["parts/scene.lineup.dragon", "parts/scene.lineup.en.dragon"]);
    expect(
      tried.map((t) => [t.name, t.error ?? "", t.files]),
      "列の図の場面の見本を書き出した形",
    ).toEqual([
      ["parts/scene.lineup.dragon", "", ["html", "png", "svg"]],
      ["parts/scene.lineup.en.dragon", "", ["html", "png", "svg"]],
    ]);
  });

  it("scene-lineup-gauge-exports-both-shows", () => {
    const tried = triedOf(["列の図の場面と目盛り (stack)", "列の図の場面と目盛り (pick)"]);
    expect(
      tried.map((t) => [t.name, t.error ?? "", t.files]),
      "列の図に場面と目盛りを書いた原本を書き出した形",
    ).toEqual([
      ["列の図の場面と目盛り (stack)", "", ["html", "svg"]],
      ["列の図の場面と目盛り (pick)", "", ["html", "svg"]],
    ]);
  });

  it("scene-figures-stay-fixed", () => {
    for (const { file, frame, scenes, view } of CHOSEN.get()) {
      expect(scenes, `${file} の場面の数`).toBeGreaterThan(1);
      expect(
        view.textPx,
        `${file} を幅 ${frame} に収めた箱の名前の字が 10.5px を下回らず、寄って追う幅にならない`,
      ).toBeLessThan(10.5);
      expect(view.mode, `${file} を幅 ${frame} で見せる形`).toBe("fixed");
    }
    // 書き出しも止めた形で書く
    expect(
      EXPORTED.get().map((t) => [t.name, t.view ?? t.error]),
      "書き出しが選んだ見せ方",
    ).toEqual(CASES.map((c) => [c.name, "fixed"]));
  });
});
