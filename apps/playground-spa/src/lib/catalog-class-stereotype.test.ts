import { describe, expect, it } from "vitest";
import { jsonToDiagram, textDslToDiagram } from "@cardenelabs/dragon";
import * as カタログ from "@/topics/catalog/presets.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

type 表記 = "組み立て器" | "記法" | "JSON";

/** 三つの表記をそれぞれ図にする。 */
function クラス図たち(): Record<表記, CdlDiagram> {
  return {
    組み立て器: カタログ.presetClassDiagram,
    記法: textDslToDiagram(カタログ.sourceYaml__presetClassDiagram),
    JSON: jsonToDiagram(JSON.parse(カタログ.sourceJson__presetClassDiagram)),
  };
}

/** 題を持つ箱を、三つの表記それぞれから引く。 */
function 題の箱たち(題: string) {
  return Object.fromEntries(
    Object.entries(クラス図たち()).map(([表記, 図]) => [表記, 図.nodes.filter((箱) => 箱.title === 題)]),
  ) as Record<表記, CdlDiagram["nodes"]>;
}

describe("クラス図見本の種類の札", () => {
  it("`Auditable` は三つの表記すべてで `interface` の札を持つ", () => {
    const 箱たち = 題の箱たち("Auditable");

    expect(
      Object.fromEntries(Object.entries(箱たち).map(([表記, 箱]) => [表記, 箱.length])),
      "`Auditable` の箱を 1 件も引けない表記がある (検査が空振りしている)",
    ).toEqual({ 組み立て器: 1, 記法: 1, JSON: 1 });

    expect(
      Object.fromEntries(Object.entries(箱たち).map(([表記, 箱]) => [表記, 箱[0]?.eyebrow])),
      "`Auditable` が三つの表記すべてで `interface` の札を持つ",
    ).toEqual({ 組み立て器: "interface", 記法: "interface", JSON: "interface" });
  });

  it("`User` は三つの表記すべてで `abstract` の札を持つ", () => {
    const 箱たち = 題の箱たち("User");

    expect(
      Object.fromEntries(Object.entries(箱たち).map(([表記, 箱]) => [表記, 箱.length])),
      "`User` の箱を 1 件も引けない表記がある (検査が空振りしている)",
    ).toEqual({ 組み立て器: 1, 記法: 1, JSON: 1 });

    expect(
      Object.fromEntries(Object.entries(箱たち).map(([表記, 箱]) => [表記, 箱[0]?.eyebrow])),
      "`User` が三つの表記すべてで `abstract` の札を持つ",
    ).toEqual({ 組み立て器: "abstract", 記法: "abstract", JSON: "abstract" });
  });
});
