/**
 * 一覧に出る見本と、表示に必要な 4 表の対応を検証する。
 *
 * 日本語名・英語名・説明の英訳は見本の export 名で引く。
 * 段題の英訳だけは、登録済み見本が実際に使う `phases[].title` で引く。
 * どの表も不足と余りを双方向で見るため、見本を消した時の古い entry も残さない。
 */
import type { CdlDiagram } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";

import { CATALOG_ITEMS, loadPartsItems, moduleToItems, type CatalogItem } from "./catalog-items";
import { ITEM_SUBTITLE_EN } from "./catalog-item-en";
import { PHASE_TITLE_EN, 日本語を含む } from "./catalog-phase-en";
import { ITEM_NAME_EN, ITEM_NAME_JA } from "./i18n";

interface 名前と英訳の表 {
  ITEM_NAME_JA: Readonly<Record<string, string>>;
  ITEM_NAME_EN: Readonly<Record<string, string>>;
  ITEM_SUBTITLE_EN: Readonly<Record<string, string>>;
  PHASE_TITLE_EN: Readonly<Record<string, string>>;
}

const 実物の表: 名前と英訳の表 = {
  ITEM_NAME_JA,
  ITEM_NAME_EN,
  ITEM_SUBTITLE_EN,
  PHASE_TITLE_EN,
};

async function 登録済みの見本(): Promise<CatalogItem[]> {
  return [...Object.values(CATALOG_ITEMS).flat(), ...(await loadPartsItems())];
}

function 段題の鍵(items: readonly CatalogItem[]): Set<string> {
  const keys = new Set<string>();
  for (const item of items) {
    const diagrams = [item.diagram, ...(item.patterns ?? []).map((pattern) => pattern.diagram)];
    for (const diagram of diagrams) {
      for (const phase of diagram.phases ?? []) {
        const title = (phase.title ?? "").trim();
        if (日本語を含む(title)) keys.add(title);
      }
    }
  }
  return keys;
}

function 表の不一致(
  必要な鍵: ReadonlySet<string>,
  table: Readonly<Record<string, string>>,
  表の名前: keyof 名前と英訳の表,
): string[] {
  const failures: string[] = [];
  const missing = [...必要な鍵].filter((key) => table[key] === undefined).sort();
  const extra = Object.keys(table)
    .filter((key) => !必要な鍵.has(key))
    .sort();
  if (missing.length > 0) failures.push(`${表の名前} に無い: ${missing.join(", ")}`);
  if (extra.length > 0) failures.push(`${表の名前} だけにある: ${extra.join(", ")}`);
  return failures;
}

/** 登録済み見本と 4 表を双方向で突き合わせ、不一致を表名と鍵つきで知らせる。 */
function 登録と表を突き合わせる(items: readonly CatalogItem[], tables: 名前と英訳の表): void {
  const exportNames = new Set(items.map((item) => item.title));
  const 説明の英訳が要るexport = new Set(
    items.filter((item) => 日本語を含む(item.subtitle)).map((item) => item.title),
  );
  const failures = [
    ...表の不一致(exportNames, tables.ITEM_NAME_JA, "ITEM_NAME_JA"),
    ...表の不一致(exportNames, tables.ITEM_NAME_EN, "ITEM_NAME_EN"),
    ...表の不一致(説明の英訳が要るexport, tables.ITEM_SUBTITLE_EN, "ITEM_SUBTITLE_EN"),
    ...表の不一致(段題の鍵(items), tables.PHASE_TITLE_EN, "PHASE_TITLE_EN"),
  ];
  if (failures.length > 0) throw new Error(failures.join("\n"));
}

function fixtureDiagram(id: string, title: string): CdlDiagram {
  return {
    id,
    topic: `${id} の日本語説明`,
    lanes: [],
    nodes: [],
    edges: [],
    states: [],
    phases: [
      {
        id: "phase",
        duration: 1,
        title,
        body: "",
        activate: [],
        tweens: [],
        sets: [],
      },
    ],
  };
}

function fixtureTables(items: readonly CatalogItem[]): 名前と英訳の表 {
  const names = Object.fromEntries(items.map((item) => [item.title, item.title]));
  const subtitles = Object.fromEntries(
    items.map((item) => [item.title, `${item.title} description`]),
  );
  const phases = Object.fromEntries(
    [...段題の鍵(items)].map((title) => [title, `${title} translation`]),
  );
  return {
    ITEM_NAME_JA: names,
    ITEM_NAME_EN: { ...names },
    ITEM_SUBTITLE_EN: subtitles,
    PHASE_TITLE_EN: phases,
  };
}

describe("登録済み見本と名前・英訳の表", () => {
  it("実際の登録経路から作った見本と 4 表が双方向で一致する", async () => {
    const items = await 登録済みの見本();
    expect(items.length, "登録済み見本を 1 件も読めていない").toBeGreaterThan(0);
    expect(() => 登録と表を突き合わせる(items, 実物の表)).not.toThrow();
  });

  it("fixture の module export と 4 表へ見本を 1 件足せば通る", () => {
    const items = moduleToItems({
      alpha: fixtureDiagram("alpha", "アルファの段"),
      beta: fixtureDiagram("beta", "ベータの段"),
    });
    expect(() => 登録と表を突き合わせる(items, fixtureTables(items))).not.toThrow();
  });

  it("fixture の module export と 4 表から見本を 1 件消せば通る", () => {
    const items = moduleToItems({ alpha: fixtureDiagram("alpha", "アルファの段") });
    expect(() => 登録と表を突き合わせる(items, fixtureTables(items))).not.toThrow();
  });

  const 欠落fixture = moduleToItems({ alpha: fixtureDiagram("alpha", "アルファの段") });
  const 揃った表 = fixtureTables(欠落fixture);

  it.each([
    ["ITEM_NAME_JA", "alpha"],
    ["ITEM_NAME_EN", "alpha"],
    ["ITEM_SUBTITLE_EN", "alpha"],
    ["PHASE_TITLE_EN", "アルファの段"],
  ] as const)("%s が 1 件欠けると欠けた鍵を知らせて落ちる", (tableName, missingKey) => {
    const table = { ...揃った表[tableName] };
    delete table[missingKey];
    expect(() => 登録と表を突き合わせる(欠落fixture, { ...揃った表, [tableName]: table })).toThrow(
      new RegExp(`${tableName} に無い: ${missingKey}`),
    );
  });
});

describe("一覧の名前 (#1030)", () => {
  it("catalog をまたいで export 名が衝突しない", async () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const item of await 登録済みの見本()) {
      if (seen.has(item.title)) duplicates.push(item.title);
      seen.add(item.title);
    }
    expect(duplicates, `名前が衝突している: ${duplicates.join(", ")}`).toEqual([]);
  });

  it("英語名が ASCII だけで書かれている", () => {
    const bad = Object.entries(ITEM_NAME_EN)
      .filter(([, value]) => /[^\x20-\x7e]/.test(value))
      .map(([key, value]) => `${key}: "${value}"`);
    expect(bad, `英語名に ASCII 以外が混ざっている: ${bad.slice(0, 6).join(", ")}`).toEqual([]);
  });

  it("表示名が export 名と同じにならない", async () => {
    const same: string[] = [];
    for (const item of await 登録済みの見本()) {
      if (ITEM_NAME_JA[item.title] === item.title) same.push(`ja/${item.title}`);
      if (ITEM_NAME_EN[item.title] === item.title) same.push(`en/${item.title}`);
    }
    expect(same, `表示名が export 名と同じ: ${same.slice(0, 8).join(", ")}`).toEqual([]);
  });
});
