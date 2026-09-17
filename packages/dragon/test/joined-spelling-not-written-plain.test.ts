import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";
import { 走査するfile } from "../../../test-support/scan-targets";

/**
 * 繋いで書いた綴りを、同じ file に通しでも書いていないことの検証 (#2097)。
 *
 * 走査する検査は自分も走査対象に入る。 判定に使う綴りを通しで書くと自分を拾うので、繋いだ形にする。
 *
 * ```ts
 * const 探す語 = ["MAJ", "OR"].join("");
 * ```
 *
 * 繋ぐところまでは毎回できている。 落ちるのは **同じ file の説明文や対照の文字列に通しで書く** ため。
 * 2026-09-17 の 1 日で 4 回踏んだ (環境の指定の綴り / 探す語 5 つ / 対照の 1 行 / git の command 名)。
 * 繋いだ理由が、綴りを書く他の場所に及んでいない。
 *
 * ## 通しで書いてよい場合がある
 *
 * 判定が前後の文字まで見る形だと、名前を説明文に書いても当たらない。
 * その時は下の `例外` に file と理由を書く (`notes-no-this-pr-reference.test.ts` が同じ形を採っている)。
 *
 * ## この検査自身は繋いだ形を持たない
 *
 * 対照に使う綴りは、実行時に組み立てる (`部品` から作る)。 file の字には `[…].join("")` の形が
 * 1 つも現れないので、自分を材料に数えない。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/** `["…", "…"].join("")` の形。 2 つ以上の文字を繋ぐものだけを見る */
const 繋いだ形 = /\[\s*((?:"[^"\n]*"\s*,\s*)+"[^"\n]*")\s*\]\s*\.join\(\s*""\s*\)/gu;

/** 通しで書いてよい file と、その理由 */
const 例外: Record<string, string> = {
  "packages/dragon/test/vitest-env-declared-per-file.test.ts":
    "判定が `.` か `[` の続く形だけを見るので、説明文に書いた名前と、対象外の例 (`dom` から辿る形) には当たらない",
};

/**
 * 本文にある繋いだ形の一覧。
 *
 * `matchAll` で取る = `test` は `g` を付けた正規表現の読み始めの位置を進めるので、
 * 同じ正規表現を使い回すと 2 回目以降が file の途中から読み始めて取りこぼす。
 */
function 繋いだ形の一覧(本文: string): RegExpMatchArray[] {
  return [...本文.matchAll(繋いだ形)];
}

/** 本文の中で、繋いだ綴りが通しでも書かれているもの */
function 通しでも書いた綴り(本文: string): string[] {
  const 当たり = 繋いだ形の一覧(本文);
  if (当たり.length === 0) return [];
  // 繋いだ形そのものは数えない (`"MAJ", "OR"` の並びに綴りは現れない)
  const 残り = 本文.replace(繋いだ形, "");
  const 出た: string[] = [];
  for (const m of 当たり) {
    const 綴り = (m[1] ?? "")
      .split(",")
      .map((x) => x.trim().slice(1, -1))
      .join("");
    if (綴り !== "" && 残り.includes(綴り)) 出た.push(綴り);
  }
  return [...new Set(出た)];
}

const 検査file: string[] = 走査するfile(REPO, "*.test.ts", "*.test.tsx");
const 中身 = new Map(検査file.map((p) => [p, readFileSync(join(REPO, p), "utf8")]));

/** 繋いだ形を 1 つでも持つ file */
function 繋いだ形を持つfile(): string[] {
  return 検査file.filter((p) => 繋いだ形の一覧(中身.get(p) ?? "").length > 0);
}

/** 繋いだ書き方を組み立てる。 この file の字に繋いだ形そのものを残さないため */
function 繋いだ書き方にする(部品: readonly string[]): string {
  return `[${部品.map((p) => `"${p}"`).join(", ")}].join("")`;
}

/** 対照に使う綴り。 実行時に組み立てて、この file の字に通しの綴りを残さない */
const 部品 = ["MA", "JOR"];
const 通しの綴り = 部品.join("");
const 繋いだ書き方 = 繋いだ書き方にする(部品);

describe("繋いだ綴りを同じ file に通しで書いていない (#2097)", () => {
  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(検査file.length, "検査 file を 1 件も集められていない").toBeGreaterThan(100);
    expect(
      繋いだ形を持つfile().length,
      "繋いだ形を持つ file を 1 件も見つけられていない (空振り)",
    ).toBeGreaterThan(0);
  });

  it("宣言した file が実在し、理由を持ち、実際に通しでも書いている", () => {
    // 消えた file の宣言が残ると、同じ書き方が別の file に出た時に黙って通る
    for (const [p, 理由] of Object.entries(例外)) {
      expect(検査file, `宣言した file が走査対象に無い: ${p}`).toContain(p);
      expect(理由.length, `宣言に理由が無い: ${p}`).toBeGreaterThan(10);
      expect(
        通しでも書いた綴り(中身.get(p) ?? "").length,
        `宣言した file が通しの綴りを持たない (宣言が要らない): ${p}`,
      ).toBeGreaterThan(0);
    }
  });

  it("宣言していない file が、繋いだ綴りを通しで書いていない", () => {
    const 残る = 検査file
      .filter((p) => !(p in 例外))
      .filter((p) => 通しでも書いた綴り(中身.get(p) ?? "").length > 0);
    expect(残る, "繋いだ綴りを同じ file に通しでも書いている").toEqual([]);
  });

  it("両方を持つ本文を拾える (植え込み対照)", () => {
    // 拾えない判定だと、上の検査は書いてあっても通る
    const 本文 = `const 語 = ${繋いだ書き方};\n// ${通しの綴り} fix = 直した\n`;
    expect(通しでも書いた綴り(本文), "両方を持つ本文を拾えていない").toEqual([通しの綴り]);
  });

  it("片方だけの本文は拾わない (陰性対照)", () => {
    // 繋いだ形だけの本文まで落とすと、正しく書いた file が落ちる
    expect(
      通しでも書いた綴り(`const 語 = ${繋いだ書き方};\n// 何かを直した\n`),
      "繋いだ形だけの本文を拾っている",
    ).toEqual([]);
    // 繋いだ形を持たない file は、この検査の対象ではない
    expect(
      通しでも書いた綴り(`// ${通しの綴り} fix = 直した\n`),
      "繋いだ形を持たない本文を拾っている",
    ).toEqual([]);
    // 繋いだ形の中に綴りがそのまま在る書き方は、綴りが繋いだ形の外に出ていない。
    // 繋いだ形を残り側から取り除かないと、この形が自分の中身で落ちる
    expect(
      通しでも書いた綴り(`const 語 = ${繋いだ書き方にする([通しの綴り, ""])};\n`),
      "繋いだ形そのものを通しの綴りとして数えている",
    ).toEqual([]);
  });
});
