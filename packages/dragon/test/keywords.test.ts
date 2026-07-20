import { describe, it, expect } from "vitest";
import { normalizeArrow, parseDuration, resolveHeader, resolveAnimSubkey } from "../src/keywords";

/**
 * keywords.ts は DSL の字句正規化層 (矢印異体の統一 / duration parse / header・subkey alias 解決)。
 * parser の土台だが 4 export 関数が全て test 0 件だった。 自然言語っぽい DSL 入力を
 * canonical form に落とす挙動を実 code path で pin する。
 */

describe("normalizeArrow — 矢印異体を → に統一", () => {
  it("-> を → に", () => { expect(normalizeArrow("A -> B")).toBe("A → B"); });
  it("=> を → に", () => { expect(normalizeArrow("A => B")).toBe("A → B"); });
  it(">> を → に", () => { expect(normalizeArrow("A >> B")).toBe("A → B"); });
  it("既に → の場合は不変 (冪等)", () => { expect(normalizeArrow("A → B")).toBe("A → B"); });
  it("2 回適用しても同結果 (冪等性)", () => {
    const once = normalizeArrow("A -> B => C");
    expect(normalizeArrow(once)).toBe(once);
  });
  it("複数矢印 (空白なし) を全て変換", () => { expect(normalizeArrow("x->y=>z")).toBe("x→y→z"); });
  it("矢印を含まない文字列は不変", () => { expect(normalizeArrow("A - B")).toBe("A - B"); });
  it("->> は -> が先に消費され →> になる (pattern 順序の実挙動)", () => {
    expect(normalizeArrow("A ->> B")).toBe("A →> B");
  });
});

describe("parseDuration — 期間文字列を ms に変換", () => {
  it("「2 秒」 → 2000", () => { expect(parseDuration("2 秒")).toBe(2000); });
  it("「1.5 秒」 → 1500", () => { expect(parseDuration("1.5 秒")).toBe(1500); });
  it("「2秒」 (空白なし) → 2000", () => { expect(parseDuration("2秒")).toBe(2000); });
  it("「1500ms」 → 1500", () => { expect(parseDuration("1500ms")).toBe(1500); });
  it("「1500 ms」 (空白あり) → 1500", () => { expect(parseDuration("1500 ms")).toBe(1500); });
  it("「1.5s」 → 1500", () => { expect(parseDuration("1.5s")).toBe(1500); });
  it("「2s」 → 2000", () => { expect(parseDuration("2s")).toBe(2000); });
  it("大文字 MS/S も受理 (case insensitive)", () => {
    expect(parseDuration("1500MS")).toBe(1500);
    expect(parseDuration("2S")).toBe(2000);
  });
  it("前後空白は trim される", () => { expect(parseDuration("  2 秒  ")).toBe(2000); });
  it("端数は Math.round される (1.4s → 1400)", () => { expect(parseDuration("1.4s")).toBe(1400); });
  it("単位なし数値 → null", () => { expect(parseDuration("1500")).toBeNull(); });
  it("非数値 → null", () => { expect(parseDuration("abc")).toBeNull(); });
  it("空文字 → null", () => { expect(parseDuration("")).toBeNull(); });
});

describe("resolveHeader — header alias を canonical に解決", () => {
  it("「タイトル」/「title」 → title", () => {
    expect(resolveHeader("タイトル")).toBe("title");
    expect(resolveHeader("title")).toBe("title");
  });
  it("「種類」/「type」 → type", () => {
    expect(resolveHeader("種類")).toBe("type");
    expect(resolveHeader("type")).toBe("type");
  });
  it("「登場人物」 → actors", () => { expect(resolveHeader("登場人物")).toBe("actors"); });
  it("「流れ」/「flow」/「steps」 → flow", () => {
    expect(resolveHeader("流れ")).toBe("flow");
    expect(resolveHeader("flow")).toBe("flow");
    expect(resolveHeader("steps")).toBe("flow");
  });
  it("「アニメーション」/「animate」/「animation」 → animate", () => {
    expect(resolveHeader("アニメーション")).toBe("animate");
    expect(resolveHeader("animation")).toBe("animate");
  });
  it("大文字も解決 (case insensitive)", () => { expect(resolveHeader("TITLE")).toBe("title"); });
  it("前後空白は trim される", () => { expect(resolveHeader("  flow  ")).toBe("flow"); });
  it("未知の header → null", () => { expect(resolveHeader("unknown")).toBeNull(); });
});

describe("resolveAnimSubkey — animation subkey alias を canonical に解決", () => {
  it("「状態」/「state」 → state", () => {
    expect(resolveAnimSubkey("状態")).toBe("state");
    expect(resolveAnimSubkey("state")).toBe("state");
  });
  it("「強調」/「highlight」/「active」/「activate」 → highlight", () => {
    expect(resolveAnimSubkey("強調")).toBe("highlight");
    expect(resolveAnimSubkey("highlight")).toBe("highlight");
    expect(resolveAnimSubkey("active")).toBe("highlight");
    expect(resolveAnimSubkey("activate")).toBe("highlight");
  });
  it("「説明」/「body」/「description」 → body", () => {
    expect(resolveAnimSubkey("説明")).toBe("body");
    expect(resolveAnimSubkey("description")).toBe("body");
  });
  it("「切替」/「set」 → set", () => { expect(resolveAnimSubkey("切替")).toBe("set"); });
  it("大文字も解決 (case insensitive)", () => { expect(resolveAnimSubkey("STATE")).toBe("state"); });
  it("未知の subkey → null", () => { expect(resolveAnimSubkey("bogus")).toBeNull(); });
});
