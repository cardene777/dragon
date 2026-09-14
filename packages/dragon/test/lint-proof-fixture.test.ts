/**
 * 実証用の台本 (`scripts/lint-proof-fixture.mjs`) が、記法の検査の全ての規則を踏むことの検査 (#1944)。
 *
 * 台本は期待する規則を手で 8 つ並べていたため、規則が 9 つになっても図が 1 つを踏まないまま
 * 全件を検知したと出していた。 期待する規則は `src/notation-lint.ts` から読む形に直した。
 *
 * 台本は `pnpm lint:notation:proof` から素の `node` で起動されるので、ここでも同じ起動の仕方で
 * 終了値と出力を見る。 台本の読み方が手書きの一覧に戻っても気付けるよう、台本が読んだ規則を
 * 図に実際に当てて出た規則と突き合わせ、台本の中に規則名の字が無いことも見る。
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { lintDiagram } from "../src/notation-lint";

const ここ = dirname(fileURLToPath(import.meta.url));
const 台本の置き場 = join(ここ, "../scripts");
const 台本の場所 = join(台本の置き場, "lint-proof-fixture.mjs");
const 記法の検査 = readFileSync(join(ここ, "../src/notation-lint.ts"), "utf8");

/** 台本が書き出すもの。 `.mjs` は型の宣言を持たないので、使う形だけをここに書く */
type 台本 = {
  buggyDiagram: CdlDiagram;
  規則を読む(src: string): string[];
  見逃した規則(期待する規則: string[], 指摘たち: ReadonlyArray<{ rule: string }>): string[];
};

let 台本: 台本;
let 規則: string[];
let 別名の置き場: string;

beforeAll(async () => {
  台本 = (await import(pathToFileURL(台本の場所).href)) as 台本;
  規則 = 台本.規則を読む(記法の検査);
  別名の置き場 = mkdtempSync(join(tmpdir(), "lint-proof-"));
  symlinkSync(台本の置き場, join(別名の置き場, "scripts"));
});

afterAll(() => {
  rmSync(別名の置き場, { recursive: true, force: true });
});

function 台本を起動する(場所: string) {
  return spawnSync("node", [場所], { encoding: "utf8" });
}

describe("実証用の台本は記法の検査の全ての規則を踏む (#1944)", () => {
  it("台本を素の node で起動すると、全ての規則が指摘を出して終了値 0 で終わる", () => {
    expect(規則.length, "規則を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    const 結果 = 台本を起動する(台本の場所);
    expect(結果.status, `台本が非 0 で終わった:\n${結果.stdout}\n${結果.stderr}`).toBe(0);
    expect(結果.stdout).toContain(`記法の検査の規則 ${規則.length} 件のすべてが指摘を出した`);
    // 台本の結論に頼らず、規則ごとの指摘の行 (`` `{規則}` (対象 `{対象}` ``) が出ているかを見る
    expect(規則.filter((r) => !結果.stdout.includes(`\`${r}\` (対象 `))).toEqual([]);
  });

  it("台本が読んだ規則は、台本の図に記法の検査を当てて実際に出た規則と同じ", () => {
    // 台本の読み方が規則を取りこぼすと、取りこぼした規則は見逃しに数えられない。 出た側と両向きで比べる
    const 出た規則 = [...new Set(lintDiagram(台本.buggyDiagram).issues.map((i) => i.rule))];
    expect(
      出た規則.length,
      "台本の図が指摘を 1 つも出さない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect([...規則].sort()).toEqual(出た規則.sort());
  });

  it("台本の中に規則名の字が無い (期待する規則を手で並べていない)", () => {
    const 台本の字 = readFileSync(台本の場所, "utf8");
    expect(規則.filter((r) => 台本の字.includes(`"${r}"`))).toEqual([]);
  });

  it("別名の dir を通して起動しても、何もしないまま終わらずに台本が走る", () => {
    const 結果 = 台本を起動する(join(別名の置き場, "scripts", "lint-proof-fixture.mjs"));
    expect(結果.status, `台本が非 0 で終わった:\n${結果.stderr}`).toBe(0);
    expect(結果.stdout, "台本が走らずに終わった").toContain("のすべてが指摘を出した");
  });

  it("植え込み対照: 四象限図の偏りの部品を外した図では、その規則だけを見逃しとして返す", () => {
    const 外した = {
      ...台本.buggyDiagram,
      nodes: 台本.buggyDiagram.nodes.filter((n) => n.id !== "quad-lopsided"),
    };
    expect(外した.nodes.length, "外す部品が見つからない").toBe(台本.buggyDiagram.nodes.length - 1);
    expect(台本.見逃した規則(規則, lintDiagram(外した).issues)).toEqual([
      "quadrant-single-quadrant",
    ]);
  });

  it("植え込み対照: 型の注釈 (`rule: string`) は規則として読まない", () => {
    expect(台本.規則を読む('  rule: string;\n  rule: "chart-empty-datum",')).toEqual([
      "chart-empty-datum",
    ]);
  });
});
