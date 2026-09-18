import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { 注釈を読むfile } from "../../../test-support/scan-targets";

/**
 * 一覧を名乗る知らせが、受ける集合から作られていることの検証 (#2258)。
 *
 * ## 判定と知らせが別々に並べていた
 *
 * 読めない書き方を教える知らせが、受ける項目の一覧をすぐ上の判定とは別にもう一度並べていた。
 * 判定に 3 つ目を足しても知らせは 2 つのまま残るので、**書ける項目が増えたのに
 * 「使えるのは 2 つ」 と教え続ける**。 知らせは読めなかった人だけが見るため、
 * ずれても気付く経路が無い。
 *
 * 一覧を名乗る知らせは 46 行あり、41 行は名前を付けた集合から作っていた。
 * **多数派が既に正しい形**なので、少数派を多数派へ寄せる。
 *
 * ## 何を見るか
 *
 * 一覧を名乗る語 (下の `一覧を名乗る語`) の後ろが `=` で始まり、
 * その先に **語が 2 つ以上、句読点で区切られて literal で並んでいる** 形を落とす。
 * 集合から作る形は繋ぐ式になるので、この形には当たらない。
 *
 * ## 形を教える知らせは対象外
 *
 * `{ actor, from, to } の形で書く` のように **並びではなく形** を教える文は、
 * 項目が増えても意味が変わらない。 一覧を名乗る語を持たないので自然に外れる。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/** 一覧を名乗る語。 この後ろに `=` が続く形だけを見る */
const 一覧を名乗る語 = ["使える項目", "使える種類", "使える値", "使える語", "必須の項目"];

/**
 * 手で並べた一覧。 `= a, b` の形で ASCII の語が 2 つ以上並ぶ。
 *
 * 繋ぐ式で作る形は、この位置に式の開きが来るので当たらない。
 */
const 手で並べた = new RegExp(
  `(${一覧を名乗る語.join("|")})\\s*=\\s*[a-z][a-z0-9_-]*(\\s*,\\s*[a-z][a-z0-9_-]*)+`,
  "u",
);

/**
 * 手で並べてよい一覧と、その理由。
 *
 * 理由が空の entry は下の検査が落とす = 「落ちたから足した」 だけの entry を残さない。
 */
const 例外: Record<string, string> = {
  "使える値 = true, false":
    "真偽の閉じた集合で、3 つ目が増えることが無い。 集合を作っても読み手に伝わる情報は変わらない",
};

interface 当たり {
  場所: string;
  行: string;
}

/** 走査対象 = 注釈を読む source の全て。 知らせは実装の中にある */
const 走査したfile: string[] = 注釈を読むfile(REPO);

function 走る(): { file数: number; 名乗る行: number; 当たり: 当たり[] } {
  const 当たり: 当たり[] = [];
  let file数 = 0;
  let 名乗る行 = 0;
  for (const p of 走査したfile) {
    const 中身 = readFileSync(p, "utf8");
    file数 += 1;
    中身.split("\n").forEach((行, i) => {
      if (!一覧を名乗る語.some((語) => 行.includes(語))) return;
      名乗る行 += 1;
      const m = 手で並べた.exec(行);
      if (m === null) return;
      if (Object.keys(例外).some((e) => 行.includes(e))) return;
      当たり.push({ 場所: `${relative(REPO, p)}:${i + 1}`, 行: m[0] });
    });
  }
  return { file数, 名乗る行, 当たり };
}

const 結果 = 走る();

describe("一覧を名乗る知らせが受ける集合から作られる (#2258)", () => {
  it("走査対象を集められている", () => {
    expect(結果.file数, "走査する file を 1 件も集められていない").toBeGreaterThan(100);
  });

  it("一覧を名乗る行を拾えている", () => {
    // 0 件が「該当なし」 か「拾えていない」 かを分けるための母数
    expect(結果.名乗る行, "一覧を名乗る行を 1 つも拾えていない").toBeGreaterThan(20);
  });

  it("どの知らせも一覧を手で並べていない", () => {
    const 一覧 = 結果.当たり.map((h) => `${h.場所} ${h.行}`);
    expect(一覧, "知らせが受ける項目を手で並べている").toEqual([]);
  });

  it("手で並べた形を拾える (植え込み対照)", () => {
    // 拾えない判定だと、上の検査は残っていても通る
    for (const 語 of 一覧を名乗る語) {
      expect(手で並べた.test(`hint: "${語} = alpha, beta"`), `拾えていない: ${語}`).toBe(true);
    }
    // 3 語以上の形。 **この file 自身が走査の母数に入る**ので、通しの綴りは繋いで作る
    // (literal で書くと自分が当たる、 #2092 / #2244 / #2246 で 3 回踏んだ形)
    const 三語 = [一覧を名乗る語[0], " = alpha, beta, gamma"].join("");
    expect(手で並べた.test(`hint: "${三語}"`)).toBe(true);
  });

  it("集合から作る形と、形を教える文は拾わない (陰性対照)", () => {
    // 繋ぐ式で作る形。 この位置に式の開きが来るので語の並びにならない
    expect(手で並べた.test("hint: `使える項目 = ${項目.join(\", \")}`"), "作る形を拾っている").toBe(
      false,
    );
    // 並びではなく形を教える文。 一覧を名乗る語を持たない
    expect(手で並べた.test('hint: "{ actor, from, to } の形で書く"'), "形の文を拾っている").toBe(
      false,
    );
    // 1 語だけの一覧は並びではない
    expect(手で並べた.test('hint: "使える値 = true"'), "1 語を並びとして拾っている").toBe(false);
  });

  it("宣言した例外に理由が書かれ、その形が実際に在る", () => {
    const 理由なし = Object.entries(例外).filter(([, 理由]) => 理由.trim() === "");
    expect(
      理由なし.map(([e]) => e),
      "例外に理由が書かれていない",
    ).toEqual([]);
    // 消えた形の宣言が残ると、宣言そのものが空文になる
    const 全文 = 走査したfile.map((p) => readFileSync(p, "utf8")).join("\n");
    expect(
      Object.keys(例外).filter((e) => !全文.includes(e)),
      "宣言した形が実装に無い",
    ).toEqual([]);
  });
});
