import { describe, expect, it } from "vitest";
import { jsonToDiagram, textDslToDiagram } from "@cardenelabs/dragon";
import * as カタログ from "@/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

type 表記 = "組み立て器" | "記法" | "JSON";

/** 三つの表記をそれぞれ図にする。 */
function クラス図たち(): Record<表記, CdlDiagram> {
  return {
    組み立て器: カタログ.presetDeliveryClasses,
    記法: textDslToDiagram(カタログ.sourceYaml__presetDeliveryClasses),
    JSON: jsonToDiagram(JSON.parse(カタログ.sourceJson__presetDeliveryClasses)),
  };
}

/** 題を持つ箱を、三つの表記それぞれから引く。 */
function 題の箱たち(題: string) {
  return Object.fromEntries(
    Object.entries(クラス図たち()).map(([表記, 図]) => [表記, 図.nodes.filter((箱) => 箱.title === 題)]),
  ) as Record<表記, CdlDiagram["nodes"]>;
}

describe("クラス図見本の種類の札", () => {
  it("`荷物` は三つの表記すべてで `抽象` の札を持つ", () => {
    const 箱たち = 題の箱たち("荷物");

    expect(
      Object.fromEntries(Object.entries(箱たち).map(([表記, 箱]) => [表記, 箱.length])),
      "`荷物` の箱を 1 件も引けない表記がある (検査が空振りしている)",
    ).toEqual({ 組み立て器: 1, 記法: 1, JSON: 1 });

    expect(
      Object.fromEntries(Object.entries(箱たち).map(([表記, 箱]) => [表記, 箱[0]?.eyebrow])),
      "`荷物` が三つの表記すべてで `抽象` の札を持つ",
    ).toEqual({ 組み立て器: "抽象", 記法: "抽象", JSON: "抽象" });
  });

  it("`配送便` は三つの表記すべてで種類の札を持たない", () => {
    const 箱たち = 題の箱たち("配送便");

    expect(
      Object.fromEntries(Object.entries(箱たち).map(([表記, 箱]) => [表記, 箱.length])),
      "`配送便` の箱を 1 件も引けない表記がある (検査が空振りしている)",
    ).toEqual({ 組み立て器: 1, 記法: 1, JSON: 1 });

    expect(
      Object.fromEntries(Object.entries(箱たち).map(([表記, 箱]) => [表記, 箱[0]?.eyebrow])),
      "`配送便` に種類の札が紛れ込んでいる",
    ).toEqual({ 組み立て器: undefined, 記法: undefined, JSON: undefined });
  });
});
