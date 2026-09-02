import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// @ts-expect-error -- 検査対象は .mjs で型宣言を持たない
import { 図の塊, 塊に切る, 抜き出す, 落ちた名前 } from "../scripts/design-source.mjs";

type 塊 = { name: string; exported: boolean; start: number; end: number; text: string };

const 記法 = [
  "// 段の長さ",
  "const STEP = 900;",
  "",
  "// 組み立ての助け。 段を後ろから足す",
  "function withSteps(d, steps) {",
  "  return { ...d, phases: steps };",
  "}",
  "",
  "// 点の並び。 計画と実績を持つ",
  "const POINTS = [",
  '  { id: "jan", plan: 1000 },',
  '  { id: "feb", plan: 1300 },',
  "];",
  "",
  "const builder = chart({",
  '  id: "chart-demo",',
  '  type: "line",',
  "});",
  "",
  "// この図の宣言",
  "export const presetChart = withSteps(builder.build(), [",
  "  { title: \"1\", duration: STEP },",
  "]);",
  "",
  "// 次の塊の前置き。 ここから先は別の図",
  "export const presetOther = withSteps(other.build(), []);",
].join("\n");

const 名前 = (cs: 塊[]) => cs.map((c) => c.name);

describe("宣言の塊に切る", () => {
  it("深さ 0 の宣言を全て拾う", () => {
    const cs = 塊に切る(記法) as 塊[];

    expect(cs.length, "塊を 1 つも切れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(名前(cs)).toEqual(["STEP", "withSteps", "POINTS", "builder", "presetChart", "presetOther"]);
  });

  it("直前に続く注釈をその塊のものとして連れて行く", () => {
    const cs = 塊に切る(記法) as 塊[];
    const points = cs.find((c) => c.name === "POINTS");

    expect(points?.text.startsWith("// 点の並び。")).toBe(true);
  });

  it("次の塊の前置きを末尾に含めない", () => {
    const cs = 塊に切る(記法) as 塊[];
    const chart = cs.find((c) => c.name === "presetChart");

    // 元の欠陥はここ。 他人の前置きまで食べて、記法の末尾に無関係なコメントが残る
    expect(chart?.text).not.toContain("次の塊の前置き");
    expect(chart?.text.trimEnd().endsWith("]);")).toBe(true);
  });

  it("括弧をまたぐ宣言を 1 つの塊として扱う", () => {
    const cs = 塊に切る(記法) as 塊[];
    const points = cs.find((c) => c.name === "POINTS");

    expect(points?.text).toContain('{ id: "jan", plan: 1000 }');
    expect(points?.text).toContain('{ id: "feb", plan: 1300 }');
  });

  it("文字列と注釈の中の括弧を数えない", () => {
    // 数えると深さが狂い、以降の塊を 1 つも切れなくなる
    const 罠 = [
      "// 前置きに ( を書く",
      'const A = "括弧 ( を含む文字列";',
      "",
      "export const B = 2;",
    ].join("\n");
    const cs = 塊に切る(罠) as 塊[];

    expect(名前(cs)).toEqual(["A", "B"]);
  });

  it("export の有無を見分ける", () => {
    const cs = 塊に切る(記法) as 塊[];

    expect(cs.find((c) => c.name === "builder")?.exported).toBe(false);
    expect(cs.find((c) => c.name === "presetChart")?.exported).toBe(true);
  });
});

describe("図に要る塊を集める", () => {
  it("id を持つ塊が export でなければ、組み立てて使う側まで辿る", () => {
    const cs = 図の塊(記法, "chart-demo") as 塊[];

    // builder で止めると段の宣言が落ちて記法として読めない
    expect(名前(cs)).toContain("builder");
    expect(名前(cs)).toContain("presetChart");
  });

  it("参照する塊を前から集める", () => {
    const cs = 図の塊(記法, "chart-demo") as 塊[];

    expect(名前(cs)).toContain("withSteps");
    expect(名前(cs)).toContain("STEP");
  });

  it("別の図の塊を巻き込まない", () => {
    const cs = 図の塊(記法, "chart-demo") as 塊[];

    expect(名前(cs)).not.toContain("presetOther");
  });

  it("記法の並び順で返す", () => {
    const cs = 図の塊(記法, "chart-demo") as 塊[];
    const 位置 = cs.map((c) => c.start);

    expect([...位置].sort((a, b) => a - b)).toEqual(位置);
  });

  it("id が無ければ何も返さない", () => {
    expect(図の塊(記法, "存在しない図")).toEqual([]);
  });

  it("名前の部分一致で巻き込まない", () => {
    /*
     * 巻き込むのは **選んだ本文が長い名前を含み、短い名前がその一部になる** 形。
     * 逆向き (短い名前を参照して長い名前を持ち込むか) では、部分一致にしても何も起きない。
     */
    const 紛らわしい = [
      "const STEP = 900;",
      "const STEP_LONG = 1800;",
      'export const p = build({ id: "x" }, STEP_LONG);',
    ].join("\n");
    const cs = 図の塊(紛らわしい, "x") as 塊[];

    expect(名前(cs)).toContain("STEP_LONG");
    // `STEP_LONG` は文字として `STEP` を含む。 語で見ないと要らない塊まで付いてくる
    expect(名前(cs)).not.toContain("STEP");
  });
});

describe("落ちた名前", () => {
  it("要る宣言が揃っていれば 0 件", () => {
    expect(落ちた名前(記法, "chart-demo")).toEqual([]);
  });

  it("参照しているのに含まれない名前を名指す", () => {
    // 集める側を通さず、id を持つ塊だけを本文にした形を作って確かめる
    const 欠けた = [
      "const NEEDED = 1;",
      'export const p = build({ id: "x" });',
    ].join("\n");
    // `p` は `NEEDED` を参照しないので 0 件。 参照を足すと名指す
    expect(落ちた名前(欠けた, "x")).toEqual([]);

    const 参照あり = [
      "const NEEDED = 1;",
      'export const p = build({ id: "x" }, OTHER);',
      "const OTHER = 2;",
    ].join("\n");
    // `OTHER` は集める側が拾うので 0 件になる = 拾えていれば落ちない
    expect(落ちた名前(参照あり, "x")).toEqual([]);
  });
});

describe("実物で確かめる", () => {
  const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const catalog = join(repo, "apps/playground-spa/src/topics/catalog/presets.cdl.ts");
  const 図たち = ["er-demo", "seq-demo", "infra-demo", "chart-line-demo"];

  it("catalog の 4 図で落ちる名前が 0 件", () => {
    if (!existsSync(catalog)) return;
    const t = readFileSync(catalog, "utf8");

    expect(図たち.length, "図を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(0);
    for (const id of 図たち) {
      const cs = 図の塊(t, id) as 塊[];
      expect(cs.length, `${id} の塊を 1 つも集めていない`).toBeGreaterThan(0);
      expect(落ちた名前(t, id), `${id} に落ちた名前がある`).toEqual([]);
    }
  });

  it("catalog の 4 図が export const を 1 つ以上含む", () => {
    if (!existsSync(catalog)) return;
    const t = readFileSync(catalog, "utf8");

    for (const id of 図たち) {
      const 本文 = 抜き出す(t, id) as string;
      expect(本文, `${id} に export const が無い`).toContain("export const");
    }
  });

  it("catalog の 4 図が id を含む", () => {
    if (!existsSync(catalog)) return;
    const t = readFileSync(catalog, "utf8");

    for (const id of 図たち) {
      expect(抜き出す(t, id) as string, `${id} の id が抜き出しに無い`).toContain(`id: "${id}"`);
    }
  });
});
