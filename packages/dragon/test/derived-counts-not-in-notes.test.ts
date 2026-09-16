import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * 走査すれば出る件数を、注記に手で書いていないことの検証 (#2080)。
 *
 * 対象は「数が動く一覧」 を主語にした注記だけに絞る。 実測では `NodeKind` の種類が 28 から
 * 117 へ増え、見本の名前の表が 432 件から 443 件へ増えた後も、注記は書いた日の数のまま残って
 * いた。 `NodeKind` の 1 件は配る型 (`packages/dragon/dist/index.d.ts`) にもそのまま入るため、
 * この package を使う人の補完にも古い数が見えていた。
 *
 * ## 主語と同じ行だけを見る
 *
 * 注記の中の数を一律に止めると、過去の実測を根拠として書いた数 (「当時 412 件中 9 件しか
 * 収まっていなかった」) まで巻き込む。 根拠まで消すと、その規約がなぜ在るかが読めなくなる。
 *
 * 主語 (`NodeKind` / `ITEM_NAME_JA` / `ITEM_NAME_EN`) と数が同じ行に並んだ時だけ落とす。
 * 別の行に置いた過去の実測は残る。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/** 数が動く一覧の主語。 これと同じ行に件数を書くと、一覧が動いた日にずれる */
const 主語 = ["NodeKind", "NODE_KIND_VALID", "ITEM_NAME_JA", "ITEM_NAME_EN"];

/** 走査する木 (repo 相対) */
const 走査する木 = ["packages/dragon/src", "apps/playground-spa/src"];

function file一覧(dir: string, 出: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) file一覧(p, 出);
    else if (/\.tsx?$/u.test(e.name)) 出.push(p);
  }
  return 出;
}

/** 注記の行か (`//` と JSDoc の行) */
function 注記の行(line: string): boolean {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

/** 主語と件数が同じ行に並んでいるか */
function 主語と数が並ぶ(line: string): boolean {
  if (!主語.some((s) => line.includes(s))) return false;
  return /\d+\s*(件|個|種)/u.test(line);
}

const 走査したfile = 走査する木.flatMap((d) => file一覧(join(REPO, d)));

describe("走査すれば出る件数を注記に書いていない (#2080)", () => {
  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(走査したfile.length, "走査する file を 1 件も集められていない").toBeGreaterThan(100);
  });

  it("主語を書いた注記を 1 件以上見つけられている (空振り防止)", () => {
    const 主語のある注記 = 走査したfile.flatMap((p) =>
      readFileSync(p, "utf8")
        .split("\n")
        .filter((l) => 注記の行(l) && 主語.some((s) => l.includes(s))),
    );
    expect(主語のある注記.length, "主語を書いた注記を 1 件も見ていない").toBeGreaterThan(0);
  });

  it("主語と件数が同じ行に並んだ注記が無い", () => {
    const 残る: string[] = [];
    for (const p of 走査したfile) {
      readFileSync(p, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (注記の行(line) && 主語と数が並ぶ(line)) {
            残る.push(`${p.slice(REPO.length + 1)}:${i + 1} ${line.trim()}`);
          }
        });
    }
    expect(残る, "一覧の件数を注記に手で書いている (件数は一覧そのものが持つ)").toEqual([]);
  });

  it("主語と件数が並んだ行を拾える (植え込み対照)", () => {
    // 拾えない判定だと、上の検査は書いてあっても通る
    expect(主語と数が並ぶ(" * 既存 NodeKind (28 個) に加えて parts identifier を accept する"), "").toBe(
      true,
    );
    expect(主語と数が並ぶ(" * 見本の一覧に出る名前 432 件。 ITEM_NAME_JA が持つ"), "").toBe(true);
  });

  it("主語の無い行と、数の無い行は拾わない (陰性対照)", () => {
    // 何でも拾う判定だと、過去の実測を根拠に書いた注記まで落ちる
    expect(主語と数が並ぶ(" * 以前の実測では 412 件中 9 件しか収まっていなかった"), "").toBe(false);
    expect(主語と数が並ぶ(" * 種類の一覧は NODE_KIND_VALID が持つ"), "").toBe(false);
  });
});
