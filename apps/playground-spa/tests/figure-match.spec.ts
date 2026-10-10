import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { expect, test, type TestInfo } from "@playwright/test";
import { PNG } from "pngjs";

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, "../../..");
const fixture = path.join(
  root,
  "apps/playground-spa/tests/fixtures/figure-match/contrasts.html",
);
const measure = path.join(root, ".claude/skills/dragon-match/scripts/measure.mjs");
const shoot = path.join(root, ".claude/skills/dragon-match/scripts/shoot.mjs");
type Difference = { item: string; status: string };
type BoxMeasurement = {
  width: number;
  fillKind: string;
  fillStartColor: string | null;
  fillEndColor: string | null;
  fillDirection: string | Record<string, string> | null;
  borderWidth: number;
  rawBorderWidth: number;
};
type TextMeasurement = {
  text: string;
  fontSize: number;
  rawFontSize: number;
  fontFamily: string;
  platformFont: string | null;
  rawPlatformFont: string | null;
  box: BoxMeasurement | null;
};
type FigureMeasurement = {
  texts: TextMeasurement[];
  lines: { width: number; rawWidth: number; count: number }[];
  unlabeledBoxes: BoxMeasurement[];
};
type Comparison = {
  label: string;
  overallScale: number;
  differenceCount: number;
  unmeasurableCount: number;
  cdlWaitCount: number;
  originDelta: { x: number; y: number };
  differences: Difference[];
  unmeasurable: Difference[];
  cdlWait: Difference[];
  layout: {
    count: number;
    overlaps: unknown[];
    textOverflows: unknown[];
    outside: unknown[];
  };
  measurements: { expected: FigureMeasurement; actual: FigureMeasurement };
};
type Result = { comparisons: Comparison[] };

let staticResult: Result;
let staticOutput: string;

function html(selector: string) {
  return { type: "html", path: fixture, selector };
}

async function node(script: string, args: string[]) {
  return execFileAsync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env },
    maxBuffer: 1024 * 1024,
  });
}

async function writeJson(testInfo: TestInfo, name: string, value: unknown) {
  const output = testInfo.outputPath(name);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return output;
}

function comparison(label: string): Comparison {
  const found = staticResult.comparisons.find((entry) => entry.label === label);
  if (found === undefined) throw new Error(`比較結果がありません: ${label}`);
  return found;
}

test.describe("正解の図と作った図を測る", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async () => {
    const testInfo = test.info();
    staticOutput = testInfo.outputPath("static-output");
    const config = {
      comparisons: [
        { label: "same", expected: html("#base"), actual: html("#same") },
        { label: "width-10", expected: html("#base"), actual: html("#width-10") },
        { label: "position-2", expected: html("#base"), actual: html("#position-2") },
        { label: "position-3", expected: html("#base"), actual: html("#position-3") },
        { label: "shift-22", expected: html("#base"), actual: html("#shift-22") },
        { label: "color", expected: html("#base"), actual: html("#color") },
        { label: "overlap", expected: html("#base"), actual: html("#overlap") },
        { label: "gradient", expected: html("#base"), actual: html("#gradient") },
        {
          label: "gradient-end",
          expected: html("#gradient"),
          actual: html("#gradient-end"),
        },
        {
          label: "radial-gradient",
          expected: html("#radial-gradient-a"),
          actual: html("#radial-gradient-b"),
        },
        {
          label: "pattern",
          expected: html("#pattern-a"),
          actual: html("#pattern-b"),
        },
        { label: "cdl-wait", expected: html("#base"), actual: html("#width-10") },
        { label: "mask", expected: html("#base"), actual: html("#mask-hidden") },
        {
          label: "transform-half",
          expected: html("#transform-half"),
          actual: html("#transform-half"),
        },
        {
          label: "region-ignore",
          expected: {
            ...html("#region-expected"),
            region: { x: 0, y: 0, width: 260, height: 160 },
            ignoreTexts: ["Expected only"],
          },
          actual: {
            ...html("#region-actual"),
            region: { x: 0, y: 0, width: 260, height: 160 },
            ignoreTexts: ["Actual only"],
          },
        },
        { label: "scale-0636", expected: html("#base"), actual: html("#scale-0636") },
        { label: "extra-frame", expected: html("#base"), actual: html("#frame-extra") },
        { label: "font", expected: html("#font-mono"), actual: html("#font-serif") },
        {
          label: "path-lines",
          expected: html("#path-lines-one"),
          actual: html("#path-lines-two"),
        },
      ],
    };
    const configPath = await writeJson(testInfo, "static-config.json", config);
    const waitPath = await writeJson(testInfo, "cdl-wait.json", [
      {
        意匠: "cdl-wait",
        字: "Alpha",
        項目: "箱.幅",
        理由: "対照用",
        "cdl の課題": "fixture",
      },
    ]);
    await node(measure, [configPath, "-o", staticOutput, "--cdl-wait", waitPath]);
    staticResult = JSON.parse(await readFile(path.join(staticOutput, "result.json"), "utf8")) as Result;
  });

  test("正解の頁を同じ頁と比べると違いが 0 件", () => {
    expect(comparison("same").differenceCount).toBe(0);
  });

  test("箱の幅を 10 広げると違いが 1 件", () => {
    const result = comparison("width-10");
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0]?.item).toBe("箱.幅");
  });

  test("箱の位置の差 2 は許し、差 3 は違いにする", () => {
    expect(comparison("position-2").differenceCount).toBe(0);
    const result = comparison("position-3");
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0]?.item).toBe("箱.x");
  });

  test("全ての箱を右へ 22 ずらしても原点の差として揃う", () => {
    const result = comparison("shift-22");
    expect(result.originDelta.x).toBe(22);
    expect(result.differenceCount).toBe(0);
  });

  test("箱の地の色を 1 つ変えると違いが 1 件", () => {
    const result = comparison("color");
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0]?.item).toBe("箱の地の色");
  });

  test("箱を 2 つ重ねると重なりが 1 件", () => {
    const result = comparison("overlap");
    expect(result.layout.overlaps).toHaveLength(1);
  });

  test("片側だけ階調の地は地の塗り方の違い 1 件にする", () => {
    const result = comparison("gradient");
    expect(result.unmeasurableCount).toBe(0);
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0]?.item).toBe("地の塗り方");
  });

  test("両側が線形の階調なら終わりの色の違い 1 件にする", () => {
    const result = comparison("gradient-end");
    expect(result.unmeasurableCount).toBe(0);
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0]?.item).toBe("地の終わりの色");
  });

  test("両側が円の階調なら測れない 1 件にし、違いには数えない", () => {
    const result = comparison("radial-gradient");
    expect(result.unmeasurableCount).toBe(1);
    expect(result.unmeasurable[0]).toEqual(
      expect.objectContaining({ item: "箱の地の色", status: "測れない" }),
    );
    expect(result.differenceCount).toBe(0);
  });

  test("両側が模様なら測れない 1 件にし、違いには数えない", () => {
    const result = comparison("pattern");
    expect(result.unmeasurableCount).toBe(1);
    expect(result.unmeasurable[0]).toEqual(
      expect.objectContaining({ item: "箱の地の色", status: "測れない" }),
    );
    expect(result.differenceCount).toBe(0);
  });

  test("cdl-wait.json の差は件数から外れ、表に cdl 待ちと出る", async () => {
    const result = comparison("cdl-wait");
    expect(result.differenceCount).toBe(0);
    expect(result.cdlWaitCount).toBe(1);
    expect(result.cdlWait[0]?.status).toBe("cdl 待ち");
    await expect(readFile(path.join(staticOutput, "diffs.md"), "utf8")).resolves.toContain(
      "cdl 待ち",
    );
  });

  test("mask の中の線は数えない", () => {
    const result = comparison("mask");
    expect(result.differenceCount).toBe(0);
    expect(result.measurements.actual.lines).toHaveLength(1);
  });

  test("scale(0.5) の群の箱・字・線の値を root の座標へ直す", () => {
    const result = comparison("transform-half");
    const text = result.measurements.actual.texts.find((entry) => entry.text === "Scaled");
    expect(result.differenceCount).toBe(0);
    expect(text?.box?.width).toBe(100);
    expect(text?.box?.borderWidth).toBe(2);
    expect(text?.box?.rawBorderWidth).toBe(4);
    expect(text?.fontSize).toBe(10);
    expect(text?.rawFontSize).toBe(20);
    expect(result.measurements.actual.lines).toEqual([
      expect.objectContaining({ width: 2, rawWidth: 4, count: 1 }),
    ]);
  });

  test("region の外と ignoreTexts の字は違いに数えない", () => {
    const result = comparison("region-ignore");
    expect(result.differenceCount).toBe(0);
    expect(result.measurements.expected.texts.map((entry) => entry.text)).toEqual(["Keep"]);
    expect(result.measurements.actual.texts.map((entry) => entry.text)).toEqual(["Keep"]);
  });

  test("0.636 倍の写しは全体の倍率だけを違いにする", () => {
    const result = comparison("scale-0636");
    expect(result.overallScale).toBe(0.636);
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0]?.item).toBe("全体の倍率");
    expect(result.differences.some((entry) => entry.item === "字の大きさ")).toBe(false);
  });

  test("正解に無い枠は字を持たない図形の違い 1 件にする", () => {
    const result = comparison("extra-frame");
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0]?.item).toContain("字を持たない図形の数");
  });

  test("1 本の path の 2 本線と 2 本の path は同じ本数にする", () => {
    const result = comparison("path-lines");
    expect(result.differenceCount).toBe(0);
    expect(result.measurements.expected.lines[0]?.count).toBe(2);
    expect(result.measurements.actual.lines[0]?.count).toBe(2);
  });

  test("実際に描かれた monospace と serif の書体差を 1 件にする", () => {
    const result = comparison("font");
    expect(result.differenceCount).toBe(1);
    expect(result.differences[0]?.item).toBe("書体");
    expect(result.measurements.expected.texts[0]?.fontFamily).toBe("monospace");
    expect(result.measurements.actual.texts[0]?.fontFamily).toBe("serif");
    expect(result.measurements.expected.texts[0]?.rawPlatformFont).not.toBeNull();
    expect(result.measurements.actual.texts[0]?.rawPlatformFont).not.toBeNull();
  });

  test("diffs.md の冒頭に意匠別と項目別のまとめを置く", async () => {
    const report = await readFile(path.join(staticOutput, "diffs.md"), "utf8");
    const styleSummary = report.indexOf("## 意匠ごとのまとめ");
    const itemSummary = report.indexOf("## 項目ごとの違い");
    const details = report.indexOf("## same");
    const itemHeader = report.split("\n").find((line) => line.startsWith("| 項目 |"));
    expect(report).toContain("| 意匠 | 違い | 測れない | cdl 待ち | 崩れ |");
    expect(itemHeader).toContain("| 項目 |");
    expect(itemHeader).toContain("| same |");
    expect(styleSummary).toBeGreaterThanOrEqual(0);
    expect(itemSummary).toBeGreaterThan(styleSummary);
    expect(details).toBeGreaterThan(itemSummary);
  });

  test("見本帳の営業所の階層図を同じ図と比べると違いが 0 件", async ({ baseURL }, testInfo) => {
    if (baseURL === undefined) throw new Error("Playwright の baseURL がありません");
    const output = testInfo.outputPath("catalog-output");
    const source = {
      type: "catalog",
      baseUrl: baseURL,
      page: "charts",
      name: "営業所の階層図",
      palette: "blueprint",
    };
    const configPath = await writeJson(
      testInfo,
      "catalog-config.json",
      { label: "営業所の階層図", expected: source, actual: source },
    );
    await node(measure, [configPath, "-o", output]);
    const result = JSON.parse(await readFile(path.join(output, "result.json"), "utf8")) as {
      differenceCount: number;
    };
    expect(result.differenceCount).toBe(0);
  });

  test("2 枚を同じ物差しで並べ、札を各段の上に置く", async () => {
    const testInfo = test.info();
    const output = testInfo.outputPath("shoot-output");
    const configPath = await writeJson(
      testInfo,
      "shoot-config.json",
      {
        comparisons: [
          { label: "図面", expected: html("#base"), actual: html("#same") },
          { label: "活版", expected: html("#base"), actual: html("#color") },
        ],
      },
    );
    await node(shoot, [configPath, "-o", output]);
    const expected = PNG.sync.read(await readFile(path.join(output, "expected.png")));
    const actual = PNG.sync.read(await readFile(path.join(output, "actual.png")));
    expect([expected.width, expected.height]).toEqual([actual.width, actual.height]);

    expect(expected.width).toBe(2560);
    expect(expected.width).toBeGreaterThan(expected.height / 2);

    expect((await readdir(path.join(output, "parts"))).sort()).toEqual([
      "actual-図面.png",
      "actual-活版.png",
      "expected-図面.png",
      "expected-活版.png",
    ]);
    for (const style of ["図面", "活版"]) {
      const expectedPart = PNG.sync.read(
        await readFile(path.join(output, "parts", `expected-${style}.png`)),
      );
      const actualPart = PNG.sync.read(
        await readFile(path.join(output, "parts", `actual-${style}.png`)),
      );
      expect([expectedPart.width, expectedPart.height]).toEqual([
        actualPart.width,
        actualPart.height,
      ]);
    }
  });
});
