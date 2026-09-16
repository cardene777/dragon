/**
 * 見本と部品の件数を、コードと検査の題や説明に数字で書かないことの検証 (#2060)。
 *
 * 編集画面の見本 (`EDITOR_SAMPLES`) は足され続けて 25 件になったが、検査の題と説明には
 * 「全」 の後に 12 と sample を続けた書き方が 44 か所残っていた (書いた時点の件数)。
 * 件数を数字と比べる行 (`toBe(25)`) は見本を足すたびに直され、題と説明は直されなかった。
 * 数字を書く場所が残る限り、同じずれは見本や部品を足すたびに起きる。
 *
 * 題に件数を出したい時は `${EDITOR_SAMPLES.length}` のように実物から組む。 この形は数字を
 * 書いていないので拾わない。
 *
 * 対象は追跡中の `*.ts` / `*.tsx` に限る。 `docs/` や `tests/spec/` の Markdown に残る件数は
 * 書いた時点の実測の記録で、その時の数字が正しい。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const REPO = join(import.meta.dirname, "..", "..", "..");

/**
 * 件数を数字で書いた形。 「全」 の後に数字を置き、見本か部品を表す語を続ける。
 *
 * 「全」 を付けた形に限る。 `5 parts 同時` のように、その検査の中で決めた個数を書く形は
 * 実物の件数とずれようがないので拾わない。
 */
const 数字で書いた件数 = /全 ?[0-9]+ ?(?:個の )?(?:sample|samples|EDITOR_SAMPLES|SAMPLES|見本|parts|部品)/gu;

/** 本文から、件数を数字で書いた箇所を返す */
function 書いた件数(本文: string): string[] {
  return [...本文.matchAll(数字で書いた件数)].map((m) => m[0]);
}

/** 植え込み対照に使う形。 この file 自身が走査に掛からないよう、数字と語を分けて組む */
const 組む = (...部分: string[]): string => 部分.join(" ");

describe("見本と部品の件数を数字で書かない (#2060)", () => {
  it("追跡中の *.ts / *.tsx に件数を数字で書いた箇所が無い", () => {
    const 対象 = execFileSync("git", ["-C", REPO, "ls-files", "*.ts", "*.tsx"], { encoding: "utf8" })
      .split("\n")
      .filter((p) => p !== "");
    expect(対象.length, "file を 1 つも拾えていない (検査が空振りしている)").toBeGreaterThan(0);

    const 見つけた: string[] = [];
    for (const rel of 対象) {
      const 行たち = readFileSync(join(REPO, rel), "utf8").split("\n");
      行たち.forEach((行, i) => {
        for (const 形 of 書いた件数(行)) 見つけた.push(`${rel}:${i + 1}: ${形}`);
      });
    }
    expect(
      見つけた,
      "見本や部品の件数を数字で書いている (足すたびにずれる。 数字を消すか、実物から組む)",
    ).toEqual([]);
  });

  it("件数を数字で書いた 4 つの形をそれぞれ拾う", () => {
    // 植え込み対照。 本番の走査は 0 件を期待するので、探し方が何にも一致しない形に
    // 壊れていても通ってしまう。 同じ判定に違反の形を渡して、拾えることを確かめる
    for (const 形 of [
      組む("全", "12", "sample"),
      組む("全", "80", "parts"),
      組む("全", "19", "見本"),
      組む("全", "25", "EDITOR_SAMPLES"),
    ]) {
      expect(書いた件数(`describe("iter: ${形} × 検査", () => {`), 形).toEqual([形]);
    }
  });

  it("数字を持たない形とその検査の中で決めた個数は拾わない", () => {
    // 陰性対照。 上の対照が、何でも拾う判定で通っていないことを確かめる
    const 形 = [
      "describe(\"iter: 全 sample × 検査\", () => {",
      "it(\"5 parts 同時 inject でも id が重ならない\", () => {",
      "test(`全 ${見本.length} 見本で文字が読める`, async () => {",
    ];
    expect(形.flatMap(書いた件数)).toEqual([]);
  });
});
