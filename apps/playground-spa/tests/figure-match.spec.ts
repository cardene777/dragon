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
const noteRoot = path.join(
  root,
  "apps/playground-spa/tests/fixtures/figure-match/notes",
);
const measure = path.join(root, ".claude/skills/dragon-match/scripts/measure.mjs");
const shoot = path.join(root, ".claude/skills/dragon-match/scripts/shoot.mjs");

type ItemResult = {
  name: string;
  status: "合う" | "合わない" | "測れない" | "cdl 待ち";
  actual?: string;
};
type Comparison = {
  label: string;
  palette: string | null;
  items: ItemResult[];
  expected: { items: ItemResult[] };
  measurements: {
    actual: { lines: { from: { x: number; y: number }; to: { x: number; y: number } }[] };
  };
};
type Result = {
  version: number;
  comparisons: Comparison[];
  checklistErrors: unknown[];
  counts: { 合わない: number; 測れない: number; "cdl 待ち": number };
};

let staticResult: Result;
let staticOutput: string;

function html(selector: string, palette?: string) {
  return { type: "html", path: fixture, selector, ...(palette === undefined ? {} : { palette }) };
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

function item(label: string, name: string) {
  const comparison = staticResult.comparisons.find((entry) => entry.label === label);
  const found = comparison?.items.find((entry) => entry.name === name);
  if (found === undefined) throw new Error(`一覧の判定がありません: ${label} / ${name}`);
  return found;
}

test.describe("正解の図と作った図を合わせる一覧で測る", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async () => {
    const testInfo = test.info();
    staticOutput = testInfo.outputPath("static-output");
    const checklistPath = await writeJson(testInfo, "checklist.json", {
      version: 1,
      items: [
        { 名: "text-present", 種類: "字", 字: ["Alpha", "Beta", "Gamma"] },
        {
          名: "horizontal-order",
          種類: "並び",
          向き: "横",
          字: ["Alpha", "Beta", "Gamma"],
        },
        { 名: "alpha-to-gamma", 種類: "つながり", から: "Alpha", へ: "Gamma" },
        { 名: "alpha-fill", 種類: "色", 字: "Alpha", 部分: "地", 役: "行の面" },
      ],
    });
    const comparisons = [
      { label: "all-fit", expected: html("#base"), actual: html("#same", "blueprint") },
      {
        label: "text-mismatch",
        expected: html("#base"),
        actual: html("#missing-text", "blueprint"),
      },
      {
        label: "order-mismatch",
        expected: html("#base"),
        actual: html("#order-reversed", "blueprint"),
      },
      {
        label: "connection-mismatch",
        expected: html("#base"),
        actual: html("#connection-far", "blueprint"),
      },
      {
        label: "color-mismatch",
        expected: html("#base"),
        actual: html("#color", "blueprint"),
      },
      {
        label: "layout-mismatch",
        expected: html("#base"),
        actual: html("#overlap", "blueprint"),
      },
    ];
    const configPath = await writeJson(testInfo, "static-config.json", {
      checklist: checklistPath,
      noteRoot,
      comparisons,
    });
    await node(measure, [configPath, "-o", staticOutput]);
    staticResult = JSON.parse(
      await readFile(path.join(staticOutput, "result.json"), "utf8"),
    ) as Result;
  });

  test("fixture の 5 種で合う形と合わない形を result.json に出す", () => {
    expect(staticResult.version).toBe(1);
    expect(staticResult.checklistErrors).toEqual([]);
    for (const name of [
      "text-present",
      "horizontal-order",
      "alpha-to-gamma",
      "alpha-fill",
      "崩れ",
    ]) {
      expect(item("all-fit", name).status).toBe("合う");
    }
    expect(item("text-mismatch", "text-present").status).toBe("合わない");
    expect(item("order-mismatch", "horizontal-order").status).toBe("合わない");
    expect(item("connection-mismatch", "alpha-to-gamma").status).toBe("合わない");
    expect(item("color-mismatch", "alpha-fill").status).toBe("合わない");
    expect(item("layout-mismatch", "崩れ").status).toBe("合わない");
  });

  test("fixture の 5 種で合う形と合わない形を checklist.md に出す", async () => {
    const report = await readFile(path.join(staticOutput, "checklist.md"), "utf8");
    expect(report).toContain("all-fit");
    expect(report).toContain("text-present");
    expect(report).toContain("horizontal-order");
    expect(report).toContain("alpha-to-gamma");
    expect(report).toContain("alpha-fill");
    expect(report).toMatch(/\| text-present \| 合う \| 合わない/);
    expect(report).toMatch(/\| 崩れ \| 合う \|/);
    expect(report).toMatch(/\n合わない: \d+ 件。/);
    expect(report).toMatch(/\n測れない: \d+ 件。/);
    expect(report).toMatch(/\ncdl 待ち: \d+ 件。/);
  });

  test("見本帳の営業所の階層図は字・並び・つながり・崩れが全て合う", async ({
    baseURL,
  }, testInfo) => {
    if (baseURL === undefined) throw new Error("Playwright の baseURL がありません");
    const output = testInfo.outputPath("catalog-output");
    const checklistPath = await writeJson(testInfo, "catalog-checklist.json", {
      version: 1,
      items: [
        {
          名: "offices",
          種類: "字",
          字: ["本社", "東日本", "西日本", "東京", "仙台", "大阪", "福岡"],
        },
        {
          名: "levels",
          種類: "並び",
          向き: "縦",
          字: ["本社", "東日本", "東京"],
        },
        { 名: "head-to-east", 種類: "つながり", から: "本社", へ: "東日本" },
      ],
    });
    const source = {
      type: "catalog",
      baseUrl: baseURL,
      page: "charts",
      name: "営業所の階層図",
    };
    const configPath = await writeJson(testInfo, "catalog-config.json", {
      checklist: checklistPath,
      label: "営業所の階層図",
      expected: source,
      actual: source,
    });
    await node(measure, [configPath, "-o", output]);
    const result = JSON.parse(
      await readFile(path.join(output, "result.json"), "utf8"),
    ) as Result;
    expect(result.checklistErrors).toEqual([]);
    expect(result.comparisons[0]?.items.every((entry) => entry.status === "合う")).toBe(true);
    expect(result.comparisons[0]).toMatchObject({ label: "画面の色", palette: "site-colours" });
    await expect(readFile(path.join(output, "checklist.md"), "utf8")).resolves.toContain("画面の色");

    await node(shoot, [configPath, "-o", output]);
    expect((await readdir(path.join(output, "parts"))).sort()).toEqual([
      "actual-site-colours.png",
      "expected-site-colours.png",
    ]);
  });

  test("SVG と HTML で箱の上の外にある名前を箱へ結び付ける", async () => {
    const testInfo = test.info();
    const output = testInfo.outputPath("outside-label-output");
    const checklistPath = await writeJson(testInfo, "outside-label-checklist.json", {
      version: 1,
      items: [
        { 名: "alpha-to-gamma", 種類: "つながり", から: "Alpha", へ: "Gamma" },
        { 名: "alpha-fill", 種類: "色", 字: "Alpha", 部分: "地", 役: "行の面" },
        { 名: "alpha-border", 種類: "色", 字: "Alpha", 部分: "枠", 役: "枠" },
      ],
    });
    const configPath = await writeJson(testInfo, "outside-label-config.json", {
      checklist: checklistPath,
      noteRoot,
      comparisons: [
        {
          label: "SVG",
          expected: html("#outside-label-svg"),
          actual: html("#outside-label-svg", "blueprint"),
        },
        {
          label: "HTML",
          expected: html("#outside-label-html"),
          actual: html("#outside-label-html", "blueprint"),
        },
      ],
    });
    await node(measure, [configPath, "-o", output]);
    const result = JSON.parse(await readFile(path.join(output, "result.json"), "utf8")) as Result;

    expect(result.checklistErrors).toEqual([]);
    for (const comparison of result.comparisons) {
      expect(comparison.items.every((entry) => entry.status === "合う")).toBe(true);
    }
  });

  test("SVG と HTML で線に接する塗り矢じりの先を線端として測る", async () => {
    const testInfo = test.info();
    const output = testInfo.outputPath("arrowhead-output");
    const checklistPath = await writeJson(testInfo, "arrowhead-checklist.json", {
      version: 1,
      items: [
        { 名: "alpha-to-gamma", 種類: "つながり", から: "Alpha", へ: "Gamma" },
      ],
    });
    const configPath = await writeJson(testInfo, "arrowhead-config.json", {
      checklist: checklistPath,
      comparisons: [
        {
          label: "SVG",
          expected: html("#arrow-svg"),
          actual: html("#arrow-svg"),
        },
        {
          label: "HTML",
          expected: html("#arrow-html"),
          actual: html("#arrow-html"),
        },
      ],
    });
    await node(measure, [configPath, "-o", output]);
    const result = JSON.parse(await readFile(path.join(output, "result.json"), "utf8")) as Result;

    expect(result.checklistErrors).toEqual([]);
    for (const comparison of result.comparisons) {
      expect(comparison.items.find((entry) => entry.name === "alpha-to-gamma")?.status).toBe("合う");
      expect(comparison.measurements.actual.lines).toContainEqual({
        from: { x: 160, y: 110 },
        to: expect.objectContaining({ x: expect.closeTo(300, 0) }),
      });
    }
  });

  test("markerUnits と orient に従った印の先を線端として測る", async () => {
    const testInfo = test.info();
    const output = testInfo.outputPath("marker-arrow-output");
    const checklistPath = await writeJson(testInfo, "marker-arrow-checklist.json", {
      version: 1,
      items: [
        { 名: "fixed-marker", 種類: "つながり", から: "Fixed start", へ: "Fixed end" },
        { 名: "auto-marker", 種類: "つながり", から: "Auto start", へ: "Auto end" },
      ],
    });
    const source = html("#marker-arrows");
    const configPath = await writeJson(testInfo, "marker-arrow-config.json", {
      checklist: checklistPath,
      expected: source,
      actual: source,
    });
    await node(measure, [configPath, "-o", output]);
    const result = JSON.parse(await readFile(path.join(output, "result.json"), "utf8")) as Result;
    const comparison = result.comparisons[0];

    expect(result.checklistErrors).toEqual([]);
    expect(comparison?.items.filter((entry) => entry.name !== "崩れ")).toEqual([
      expect.objectContaining({ name: "fixed-marker", status: "合う" }),
      expect.objectContaining({ name: "auto-marker", status: "合う" }),
    ]);
    expect(comparison?.measurements.actual.lines).toEqual([
      { from: { x: 100, y: 80 }, to: { x: 100, y: 160 } },
      { from: { x: 360, y: 80 }, to: { x: 360, y: 160 } },
    ]);
  });

  test("auto-start-reverse の横線で印の先を線端として測る", async () => {
    const testInfo = test.info();
    const output = testInfo.outputPath("auto-start-reverse-marker-output");
    const checklistPath = await writeJson(testInfo, "auto-start-reverse-marker-checklist.json", {
      version: 1,
      items: [
        { 名: "marker-end", 種類: "つながり", から: "End source", へ: "End target" },
        { 名: "marker-start", 種類: "つながり", から: "Start source", へ: "Start target" },
      ],
    });
    const source = html("#auto-start-reverse-markers");
    const configPath = await writeJson(testInfo, "auto-start-reverse-marker-config.json", {
      checklist: checklistPath,
      expected: source,
      actual: source,
    });
    await node(measure, [configPath, "-o", output]);
    const result = JSON.parse(await readFile(path.join(output, "result.json"), "utf8")) as Result;
    const comparison = result.comparisons[0];

    expect(result.checklistErrors).toEqual([]);
    expect(comparison?.items.filter((entry) => entry.name !== "崩れ")).toEqual([
      expect.objectContaining({ name: "marker-end", status: "合う" }),
      expect.objectContaining({ name: "marker-start", status: "合う" }),
    ]);
    expect(comparison?.measurements.actual.lines).toEqual([
      { from: { x: 160, y: 50 }, to: { x: 300.4, y: 50 } },
      { from: { x: 159.6, y: 190 }, to: { x: 300, y: 190 } },
    ]);
  });

  test("曲がった線では終端方向へ最も出る印の先を線端として測る", async () => {
    const testInfo = test.info();
    const output = testInfo.outputPath("curved-marker-arrow-output");
    const checklistPath = await writeJson(testInfo, "curved-marker-arrow-checklist.json", {
      version: 1,
      items: [
        {
          名: "curved-marker",
          種類: "つながり",
          から: "Curved source",
          へ: "Curved target",
        },
      ],
    });
    const source = html("#curved-marker-arrow");
    const configPath = await writeJson(testInfo, "curved-marker-arrow-config.json", {
      checklist: checklistPath,
      expected: source,
      actual: source,
    });
    await node(measure, [configPath, "-o", output]);
    const result = JSON.parse(await readFile(path.join(output, "result.json"), "utf8")) as Result;
    const comparison = result.comparisons[0];

    expect(result.checklistErrors).toEqual([]);
    expect(comparison?.items).toContainEqual(
      expect.objectContaining({ name: "curved-marker", status: "合う" }),
    );
    expect(comparison?.measurements.actual.lines).toEqual([
      { from: { x: 400, y: 80 }, to: { x: 100, y: 160 } },
    ]);
  });

  test("同じ経路を太線と細線で重ねた分岐を 4 本の線として測る", async () => {
    const testInfo = test.info();
    const output = testInfo.outputPath("layered-shared-edges-output");
    const checklistPath = await writeJson(testInfo, "layered-shared-edges-checklist.json", {
      version: 1,
      items: [
        { 名: "arrival-to-sort", 種類: "つながり", から: "Arrival", へ: "Sort" },
        { 名: "sort-to-north", 種類: "つながり", から: "Sort", へ: "North" },
        { 名: "sort-to-center", 種類: "つながり", から: "Sort", へ: "Center" },
        { 名: "sort-to-south", 種類: "つながり", から: "Sort", へ: "South" },
      ],
    });
    const source = html("#layered-shared-edges");
    const configPath = await writeJson(testInfo, "layered-shared-edges-config.json", {
      checklist: checklistPath,
      expected: source,
      actual: source,
    });
    await node(measure, [configPath, "-o", output]);
    const result = JSON.parse(await readFile(path.join(output, "result.json"), "utf8")) as Result;
    const comparison = result.comparisons[0];

    expect(result.checklistErrors).toEqual([]);
    expect(comparison?.measurements.actual.lines).toHaveLength(4);
    expect(
      comparison?.items
        .filter((entry) => entry.name !== "崩れ")
        .every((entry) => entry.status === "合う"),
    ).toBe(true);
  });

  test("--cdl-wait を渡すと移行先を知らせて非 0 で止まる", async () => {
    const testInfo = test.info();
    await expect(
      node(measure, [
        fixture,
        "-o",
        testInfo.outputPath("unused-output"),
        "--cdl-wait",
        testInfo.outputPath("unused-wait.json"),
      ]),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining(
        "cdl 待ちは合わせる一覧の項目の `cdl待ち` に書く形へ移った",
      ),
    });
  });

  test("2 枚を同じ物差しで並べ、札を各段の上に置く", async () => {
    const testInfo = test.info();
    const output = testInfo.outputPath("shoot-output");
    const configPath = await writeJson(testInfo, "shoot-config.json", {
      comparisons: [
        { label: "図面", expected: html("#base"), actual: html("#same") },
        { label: "活版", expected: html("#base"), actual: html("#color") },
      ],
    });
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
