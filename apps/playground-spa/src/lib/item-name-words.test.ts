/**
 * 見本の日本語名が分類の呼び名と揃っていることの検証 (#1790)。
 *
 * 分類の呼び名を `テキストDSL` から `テキスト記法` にした (#1787 / #1788) 一方で、
 * その分類に並ぶ見本の名前は `テキストDSLのシーケンス` のまま 15 件残っていた。
 * 分類の題が「テキスト記法」 で、その下に並ぶ見本が「テキストDSLの…」 と別の呼び名になる。
 *
 * `DSL` は Domain Specific Language の略で、この repo の外の読み手には意味が取れない。
 * #1787 で画面の説明文から外した語でもある。
 *
 * **呼び名は分類から導く**。 見本側に `テキスト記法` を literal で書くと、分類の呼び名を
 * 変えた時にまた片方だけ古いまま残る (#1788 で直したのと同じ形)。
 */
import { describe, it, expect } from "vitest";
import { ITEM_NAME_JA, ITEM_NAME_EN } from "./i18n";
import { CATEGORIES } from "./catalog";

/** 記法の分類の呼び名。 `CATEGORIES[].label` が唯一の出どころ (#1788) */
const 記法の呼び名 = CATEGORIES.find((c) => c.slug === "text-dsl")?.label ?? "";

/** 記法の分類に並ぶ見本。 鍵の頭で引く */
function 記法の見本(): [string, string][] {
  return Object.entries(ITEM_NAME_JA).filter(([k]) => k.startsWith("textDsl"));
}

describe("見本の名前と分類の呼び名 (#1790)", () => {
  it("分類の呼び名を引けている", () => {
    // 引けないと下の検査が空文字と突き合わせて素通りする
    expect(記法の呼び名, "text-dsl 分類の呼び名を引けない (検査が空振りしている)").not.toBe("");
    expect(記法の呼び名).toBe("テキスト記法");
  });

  it("見本の日本語名に DSL が残っていない", () => {
    const 全件 = Object.entries(ITEM_NAME_JA);
    expect(全件.length, "見本の名前を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(400);
    const 残る = 全件.filter(([, v]) => v.includes("DSL")).map(([k, v]) => `${k}: ${v}`);
    expect(残る, `見本の名前に DSL が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("記法の見本が分類の呼び名で始まる", () => {
    const 見本 = 記法の見本();
    expect(見本.length, "記法の見本を 1 件も見ていない (検査が空振りしている)").toBeGreaterThan(10);
    const 揃わない = 見本
      .filter(([, v]) => !v.startsWith(`${記法の呼び名}の`))
      .map(([k, v]) => `${k}: ${v}`);
    expect(揃わない, `分類の呼び名で始まらない見本:\n${揃わない.join("\n")}`).toEqual([]);
  });

  it("DSL を含む名前を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る
    const 元: [string, string][] = [["textDslSequence", "テキスト記法のシーケンス"]];
    expect(元.filter(([, v]) => v.includes("DSL"))).toEqual([]);
    const 植え: [string, string][] = [["textDslSequence", "テキストDSLのシーケンス"]];
    expect(植え.filter(([, v]) => v.includes("DSL"))).toHaveLength(1);
    expect(植え.filter(([, v]) => !v.startsWith(`${記法の呼び名}の`))).toHaveLength(1);
  });

  it("英語名は原語のまま残す", () => {
    // 英語の読み手には `DSL` が通じる。 日本語名だけを直したことを固定する
    const 英語 = Object.entries(ITEM_NAME_EN).filter(([k]) => k.startsWith("textDsl"));
    expect(英語.length, "記法の見本の英語名を 1 件も見ていない").toBeGreaterThan(10);
    const 外れる = 英語.filter(([, v]) => !v.startsWith("Text DSL")).map(([k, v]) => `${k}: ${v}`);
    expect(外れる, `英語名が Text DSL で始まらない:\n${外れる.join("\n")}`).toEqual([]);
  });
});
