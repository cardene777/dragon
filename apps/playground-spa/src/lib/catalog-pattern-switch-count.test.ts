import { describe, expect, it } from "vitest";

import { CATALOG_ITEMS, 登録表の見本件数, type CatalogItem } from "./catalog-items";
import { ITEM_NAME_JA } from "./i18n";

function 名前表(items: readonly CatalogItem[]): Record<string, string> {
  return Object.fromEntries(
    items.map((item) => {
      const name = ITEM_NAME_JA[item.title];
      if (name === undefined) throw new Error(`ITEM_NAME_JA に無い: ${item.title}`);
      return [item.title, name];
    }),
  );
}

function fixtureItem(元: CatalogItem): CatalogItem {
  return {
    ...元,
    id: "presets-count-fixture",
    title: "presetsCountFixture",
  };
}

describe("presets 一覧の期待件数", () => {
  it("実物の登録表から件数を出す", () => {
    const 実物 = CATALOG_ITEMS.presets ?? [];

    expect(登録表の見本件数(CATALOG_ITEMS, "presets")).toBe(実物.length);
    expect(Object.keys(名前表(実物)).sort()).toEqual(実物.map((item) => item.title).sort());
  });

  it("実物の登録表と名前表へ見本を 1 件足すと件数が 1 増えて一致する", () => {
    const 実物 = CATALOG_ITEMS.presets ?? [];
    const 元 = 実物[0];
    if (元 === undefined) throw new Error("presets の実物を 1 件も読めていない");
    const fixture = fixtureItem(元);
    const 追加した登録表 = {
      ...CATALOG_ITEMS,
      presets: [...実物, fixture],
    };
    const 追加した名前表 = { ...名前表(実物), [fixture.title]: "件数検査の見本" };

    expect(登録表の見本件数(追加した登録表, "presets")).toBe(
      登録表の見本件数(CATALOG_ITEMS, "presets") + 1,
    );
    expect(登録表の見本件数(追加した登録表, "presets")).toBe(Object.keys(追加した名前表).length);
    expect(追加した登録表.presets.map((item) => item.title).sort()).toEqual(
      Object.keys(追加した名前表).sort(),
    );
  });

  it("実物の登録表と名前表から見本を 1 件消すと件数が 1 減って一致する", () => {
    const 実物 = CATALOG_ITEMS.presets ?? [];
    const [消す見本, ...減らした見本] = 実物;
    if (消す見本 === undefined) throw new Error("presets の実物を 1 件も読めていない");
    const 減らした登録表 = { ...CATALOG_ITEMS, presets: 減らした見本 };
    const 減らした名前表 = 名前表(実物);
    delete 減らした名前表[消す見本.title];

    expect(登録表の見本件数(減らした登録表, "presets")).toBe(
      登録表の見本件数(CATALOG_ITEMS, "presets") - 1,
    );
    expect(登録表の見本件数(減らした登録表, "presets")).toBe(Object.keys(減らした名前表).length);
    expect(減らした登録表.presets.map((item) => item.title).sort()).toEqual(
      Object.keys(減らした名前表).sort(),
    );
  });
});
