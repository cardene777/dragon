/**
 * 走査の指摘の本文が開いた言語で出ることの検証 (#2464)。
 *
 * **母集団は実物から導く**。 型の側だけを見ると、engine が本文の形を変えた日も
 * 検査は緑のまま通り、英語の画面だけが軸の呼び名に落ちる。
 * 実物の見本と編集画面の見本を全部走らせ、出た指摘を 1 件ずつ型に通す。
 */
import { describe, expect, it } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import type { Violation } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";
import { buildAndValidate } from "./render-pipeline";
import { EDITOR_SAMPLES } from "../data/editor-samples";
import { AXIS_NAMES } from "./axis-names";
import { 指摘の本文, 本文の型を持つ軸 } from "./audit-detail";

const 日本語の字 =
  /[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script=Han}]/u;

/** 実物の見本と編集画面の見本を走らせて出た指摘を全部集める */
function 実物の指摘(): { 指摘: Violation[]; 図の数: number } {
  const 指摘: Violation[] = [];
  let 図の数 = 0;
  for (const items of Object.values(CATALOG_ITEMS)) {
    for (const 項 of items) {
      図の数 += 1;
      try {
        指摘.push(...buildAndValidate(項.diagram).warnings);
      } catch {
        /* 組めない図は数えない */
      }
    }
  }
  // **読めない見本を黙って飛ばさない**。 飛ばすと母集団が減ったことに気付けない
  // (実測 = 関数名を間違えていた間、編集画面の見本は 1 枚も走っていなかった)
  for (const s of EDITOR_SAMPLES) {
    const d = textDslToDiagram(s.code);
    図の数 += 1;
    指摘.push(...buildAndValidate(d).warnings);
  }
  return { 指摘, 図の数 };
}

/** 本文の中の引用 (`"..."` の中身) = 図を書いた人の言葉 */
function 引用の中身(本文: string): string[] {
  return [...本文.matchAll(/"([^"]*)"/g)].map((m) => m[1]!);
}

/** 引用の中身を伏せた残り = 画面の飾りの部分 */
function 引用を伏せる(本文: string): string {
  return 本文.replace(/"[^"]*"/g, '""');
}

/**
 * 引用が図の題しか指さない軸。
 *
 * 編集画面が見ているのは開いている 1 枚だけなので、題を足しても指す先が増えない。
 * 他の軸の引用は箱や線の名前で、**どこを直すか** を指すため落とせない。
 */
const 図の題だけを引用に持つ軸 = ["structured-data-extraction"];

describe("走査の指摘の本文 (#2464)", () => {
  it("実物を走らせて指摘が 1 件以上出る (検査が空振りしていない)", () => {
    const { 指摘, 図の数 } = 実物の指摘();
    expect(図の数, "図を 1 枚も走らせていない").toBeGreaterThan(100);
    expect(指摘.length, "指摘が 1 件も出ていない").toBeGreaterThan(0);
  });

  it("出た指摘の軸が全て型を持つ", () => {
    const { 指摘 } = 実物の指摘();
    const 出た軸 = [...new Set(指摘.map((w) => w.axis))].sort();
    expect(出た軸.length, "軸が 1 つも出ていない").toBeGreaterThan(0);
    expect(
      出た軸.filter((a) => !本文の型を持つ軸.includes(a)),
      `型を持たない軸が出た (走った軸 ${出た軸.length} 種)`,
    ).toEqual([]);
  });

  it("英語の本文に、飾りの日本語が残らない", () => {
    const { 指摘 } = 実物の指摘();
    const 残る = 指摘
      .map((w) => ({ 軸: w.axis, 元: w.detail, 英: 指摘の本文(w, "en") }))
      .filter((x) => 日本語の字.test(引用を伏せる(x.英)));
    expect(残る.length, `英語の本文に日本語が残る:\n${残る.map((x) => `${x.軸}: ${x.英}`).slice(0, 5).join("\n")}`).toBe(0);
  });

  it("引用の中身は訳さずそのまま移す", () => {
    const { 指摘 } = 実物の指摘();
    const 引用を持つ = 指摘.filter((w) => 引用の中身(w.detail).length > 0);
    expect(引用を持つ.length, "引用を持つ指摘が 1 件も無い").toBeGreaterThan(0);
    const 外した: string[] = [];
    for (const w of 引用を持つ) {
      if (図の題だけを引用に持つ軸.includes(w.axis)) {
        外した.push(w.axis);
        continue;
      }
      const 英 = 指摘の本文(w, "en");
      // 軸の呼び名へ落ちた時は引用を持たない。 型が当たった時だけ見る
      if (英 === (AXIS_NAMES[w.axis]?.en ?? w.axis)) continue;
      for (const q of 引用の中身(w.detail)) {
        expect(英, `${w.axis} が引用 "${q}" を落とした`).toContain(q);
      }
    }
    // 外した側が空振りしていないこと = 宣言だけ残って実体が無い形を止める
    expect(外した.length, "外した軸の指摘が 1 件も出ていない (宣言が古い)").toBeGreaterThan(0);
  });

  it("日本語では engine の本文をそのまま出す", () => {
    const { 指摘 } = 実物の指摘();
    expect(指摘.length).toBeGreaterThan(0);
    for (const w of 指摘) expect(指摘の本文(w, "ja")).toBe(w.detail);
  });

  it("型が当たらない本文は軸の呼び名へ落ちる (植え込み対照)", () => {
    const 壊した: Violation = {
      axis: "structured-data-extraction",
      diagramId: "x",
      detail: "engine が形を変えた後の見たことのない本文",
      severity: "warn",
    };
    expect(指摘の本文(壊した, "en")).toBe(AXIS_NAMES["structured-data-extraction"]!.en);
    expect(指摘の本文(壊した, "ja")).toBe(壊した.detail);
  });

  it("型を持つ軸は全て呼び名も持つ", () => {
    expect(
      本文の型を持つ軸.filter((a) => AXIS_NAMES[a] === undefined),
      "型はあるが呼び名が無い軸",
    ).toEqual([]);
  });
});
