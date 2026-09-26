/**
 * 監査の説明書 (`audit-reports/README.md`) の記法の検査の節が、記法の検査の実物と同じことを言っていることの
 * 検証 (#1948)。
 *
 * 説明書を読む検査が無く、記法の検査を変えた PR のどれも節を直していなかった。 自動修正の例は #1934 より前の
 * 出力 (`統計チャート を示す図`) のまま、実証用の台本は「8 rule」 と書いていた。
 *
 * 規則の表は、実証用の台本の図 (`buggyDiagram`) に記法の検査を当てて出た指摘と照らす。 台本の図が全ての規則を
 * 踏むことは記法の package の検査 (`lint-proof-fixture.test.ts`、#1944) が確かめる。 規則名を字で読む代わりに
 * 実際に出た指摘を使うので、重さと自動修正できるかも同じ指摘から照らせる。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { autoFix, lintDiagram } from "@cardenelabs/dragon";

type 指摘 = ReturnType<typeof lintDiagram>["issues"][number];
type 表の行 = { 規則: string; 重さ: string; 自動修正: string };

const 説明書 = readFileSync(
  fileURLToPath(new URL("../../audit-reports/README.md", import.meta.url)),
  "utf8",
);
const 道具の置き場 = new URL("../../../../packages/dragon/scripts/", import.meta.url);

/** 記法の検査の節。 `## 修正システム` の見出しから、次の区切り (`---`) の手前まで */
export function 記法の検査の節(文書: string): string {
  return /^## 修正システム[\s\S]*?(?=^---$)/m.exec(文書)?.[0] ?? "";
}

/** 規則の表の行。 1 列目が `` `規則` `` の行だけを読む */
export function 規則の表(節: string): 表の行[] {
  return [...節.matchAll(/^\| `([a-z-]+)` \| ([^|]+?) \| ([^|]+?) \|/gm)].map((m) => ({
    規則: m[1]!,
    重さ: m[2]!.trim(),
    自動修正: m[3]!.trim(),
  }));
}

/** 自動修正の例 (`` - `直す前` → `直した後` ``) */
export function 自動修正の例(節: string): { 前: string; 後: string }[] {
  return [...節.matchAll(/^- `([^`]+)` → `([^`]+)`$/gm)].map((m) => ({ 前: m[1]!, 後: m[2]! }));
}

/**
 * 表の行のうち、出た指摘と食い違うもの。
 *
 * 規則の集合は両向きで比べる。 表にあって出ない規則は、名前を書き違えたか規則が消えた行で、
 * 出るのに表に無い規則は、規則を足した時に表を直し忘れた形。
 */
export function 表とずれる行(
  表: readonly 表の行[],
  指摘たち: readonly 指摘[],
  重さの見出し: Record<string, string>,
): string[] {
  const ずれ: string[] = [];
  const 表の規則 = new Set(表.map((行) => 行.規則));
  for (const 規則 of new Set(指摘たち.map((i) => i.rule))) {
    if (!表の規則.has(規則)) ずれ.push(`${規則}: 表に無い`);
  }
  for (const 行 of 表) {
    const その規則 = 指摘たち.filter((i) => i.rule === 行.規則);
    if (その規則.length === 0) {
      ずれ.push(`${行.規則}: 記法の検査が出さない`);
      continue;
    }
    const 重さ = 重さの見出し[その規則[0]!.severity];
    if (行.重さ !== 重さ) ずれ.push(`${行.規則}: 重さは ${重さ} (表は ${行.重さ})`);
    const 直せる = その規則.some((i) => i.autoFixable);
    if (行.自動修正.startsWith("できる") !== 直せる) {
      ずれ.push(`${行.規則}: 自動修正は${直せる ? "できる" : "できない"} (表は ${行.自動修正})`);
    }
  }
  return ずれ;
}

const 図 = (topic: string): CdlDiagram =>
  ({ id: "d", topic, nodes: [], edges: [] }) as unknown as CdlDiagram;

/** 例のうち、書いた説明に自動修正を当てた値が「直した後」 と違うもの */
export function 例とずれるもの(
  例たち: readonly { 前: string; 後: string }[],
  直す: (d: CdlDiagram) => CdlDiagram,
): string[] {
  return 例たち
    .map(({ 前, 後 }) => ({ 前, 後, 実物: 直す(図(前)).topic }))
    .filter(({ 後, 実物 }) => 後 !== 実物)
    .map(({ 前, 後, 実物 }) => `${前}: 説明書は ${後}、自動修正は ${実物}`);
}

const 節 = 記法の検査の節(説明書);
let 台本の指摘: 指摘[];
let 重さの見出し: Record<string, string>;

beforeAll(async () => {
  const 台本 = (await import(new URL("lint-proof-fixture.mjs", 道具の置き場).href)) as {
    buggyDiagram: CdlDiagram;
  };
  const 出力の形 = (await import(new URL("lint-output.mjs", 道具の置き場).href)) as {
    重さの見出し: Record<string, string>;
  };
  台本の指摘 = lintDiagram(台本.buggyDiagram).issues;
  重さの見出し = 出力の形.重さの見出し;
});

describe("監査の説明書の記法の検査の節 (#1948)", () => {
  it("節と規則の表と自動修正の例を読めている", () => {
    expect(節, "記法の検査の節が見つからない (検査が空振りしている)").not.toBe("");
    expect(
      規則の表(節).length,
      "規則の表を 1 行も読めていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(
      自動修正の例(節).length,
      "自動修正の例を 1 つも読めていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(
      台本の指摘.length,
      "台本の図が指摘を 1 つも出さない (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("規則の表の規則・重さ・自動修正が、記法の検査が実際に出す指摘と同じ", () => {
    expect(表とずれる行(規則の表(節), 台本の指摘, 重さの見出し)).toEqual([]);
  });

  it("自動修正の例が、書いた説明に自動修正を当てた値と同じ", () => {
    expect(例とずれるもの(自動修正の例(節), autoFix)).toEqual([]);
  });

  it("植え込み対照: 表の重さを入れ替えた行・規則名を書き違えた行・抜けた行を見つける", () => {
    const 表 = 規則の表(節);
    const 崩した = 表
      .filter((行) => 行.規則 !== "funnel-increasing-count")
      .map((行) =>
        行.規則 === "chart-single-datum"
          ? { ...行, 重さ: "⚠ 注意" }
          : 行.規則 === "quadrant-empty"
            ? { ...行, 規則: "quadrant-emtpy" }
            : 行,
      );
    expect(表とずれる行(崩した, 台本の指摘, 重さの見出し).sort()).toEqual(
      [
        "chart-single-datum: 重さは ℹ 参考 (表は ⚠ 注意)",
        "funnel-increasing-count: 表に無い",
        "quadrant-empty: 表に無い",
        "quadrant-emtpy: 記法の検査が出さない",
      ].sort(),
    );
  });

  it("植え込み対照: #1934 より前の自動修正の例は、自動修正の値と違うものとして見つける", () => {
    const 古い例 = [{ 前: "gantt preset (Release timeline)", 後: "ガントチャート を示す図" }];
    expect(例とずれるもの(古い例, autoFix)).toEqual([
      "gantt preset (Release timeline): 説明書は ガントチャート を示す図、自動修正は 作業の期間と前後の関係を示すガントチャート",
    ]);
  });
});
