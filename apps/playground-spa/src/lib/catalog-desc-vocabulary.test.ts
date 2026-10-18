// @vitest-environment node
/**
 * 見本帳の分類の説明が、記法の種類を実物どおりに挙げていることの検証 (#2944)。
 *
 * 線と色の説明は「6 つの色調 (中立 / teal / 成功 / 失敗 / 警告 / 情報)」 と書いていたが、
 * 描く側の色調 (`TONES`) は `muted` を含めて 7 つで、記法も見本も `muted` を使っていた。
 * 数と列挙を手で書くと、記法に値が増えた日に説明だけが古いまま残る。
 *
 * **数は書かず、列挙は描く側の一覧と突き合わせる**。 名前の表を `Record<EdgeStyle, string>` と
 * `Record<Tone, string>` で持つので、描く側に値が増えると名前を足すまで型検査が落ちる。
 *
 * 道筋 (自動 / 戻り / 曲線 / 路線図) は既定・戻る線・曲線・路線図の形を並べたもので、
 * 1 つの値の一覧ではないため突き合わせない。
 */
import { describe, it, expect } from "vitest";
import { EDGE_STYLES, TONES, type EdgeStyle, type Tone } from "@cardenelabs/cdl";
import { CATEGORIES } from "./catalog";

const 線の種類の名前: Record<"ja" | "en", Record<EdgeStyle, string>> = {
  ja: { solid: "実線", "dotted-flow": "点線流れ", dashed: "破線" },
  en: { solid: "solid", "dotted-flow": "dotted flow", dashed: "dashed" },
};

const 色調の名前: Record<"ja" | "en", Record<Tone, string>> = {
  ja: {
    accent: "中立",
    teal: "teal",
    success: "成功",
    error: "失敗",
    warning: "警告",
    info: "情報",
    muted: "控えめ",
  },
  en: {
    accent: "neutral",
    teal: "teal",
    success: "success",
    error: "failure",
    warning: "warning",
    info: "information",
    muted: "muted",
  },
};

/** 一覧の値のうち、説明が名前を挙げていない物。 本番と植え込みの対照が同じ関数を使う */
function 挙げていない<T extends string>(説明: string, 名前: Record<T, string>, 一覧: readonly T[]): T[] {
  return 一覧.filter((値) => !説明.includes(名前[値]));
}

/** 記法の種類を数える書き方。 「1 行で骨格ができる」 のような種類を数えない数は拾わない */
const 種類の数_日本語 = /[0-9０-９]+\s?(?:種|つの|要素)/u;
const 種類の数_英語 =
  /\b(?:two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:line styles|routes|tones|blocks|elements|kinds)\b/iu;

const 線と色 = CATEGORIES.find((c) => c.slug === "styles");

describe("見本帳の分類の説明が記法の種類を実物どおりに挙げる (#2944)", () => {
  it("線と色の説明が、線の種類と色調を日本語と英語で全て挙げる", () => {
    expect(線と色, "線と色の分類が見つからない (検査が空振りしている)").toBeDefined();
    if (線と色 === undefined) return;
    expect(挙げていない(線と色.desc, 線の種類の名前.ja, EDGE_STYLES), "日本語の説明が挙げていない線の種類").toEqual([]);
    expect(挙げていない(線と色.descEn, 線の種類の名前.en, EDGE_STYLES), "英語の説明が挙げていない線の種類").toEqual([]);
    expect(挙げていない(線と色.desc, 色調の名前.ja, TONES), "日本語の説明が挙げていない色調").toEqual([]);
    expect(挙げていない(線と色.descEn, 色調の名前.en, TONES), "英語の説明が挙げていない色調").toEqual([]);
  });

  it("名前を 1 つ外した説明では、外した値を拾う (植え込み対照)", () => {
    if (線と色 === undefined) throw new Error("線と色の分類が見つからない");
    // 同じ語が説明に 2 度出ることがある (英語の `dashed`) ので、全て外す
    expect(挙げていない(線と色.desc.replaceAll("控えめ", ""), 色調の名前.ja, TONES)).toEqual(["muted"]);
    expect(挙げていない(線と色.descEn.replaceAll("dashed", ""), 線の種類の名前.en, EDGE_STYLES)).toEqual(["dashed"]);
  });

  it("分類の説明に記法の種類の数を書かない", () => {
    expect(CATEGORIES.length, "分類を 1 つも読めていない").toBeGreaterThan(0);
    const 数を書いた = CATEGORIES.flatMap((c) => [
      ...(種類の数_日本語.test(c.desc) ? [`${c.slug} (日本語)`] : []),
      ...(種類の数_英語.test(c.descEn) ? [`${c.slug} (英語)`] : []),
    ]);
    expect(数を書いた, "記法の種類の数を書いた説明").toEqual([]);
  });

  it("数を書いた説明を拾う (植え込み対照)", () => {
    expect(種類の数_日本語.test("実線 / 点線流れ / 破線の 3 種、6 つの色調を見比べる。")).toBe(true);
    expect(種類の数_英語.test("Three line styles and six tones can be compared here.")).toBe(true);
    // 種類を数えない数は拾わない
    expect(種類の数_日本語.test("1 行で骨格ができるので、 手を動かす前に完成形の当たりをつけたい時に使う。")).toBe(false);
    expect(種類の数_英語.test("One line gives you the skeleton.")).toBe(false);
  });
});
