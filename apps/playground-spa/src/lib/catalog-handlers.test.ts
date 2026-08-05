/**
 * catalog の図が名指しする受け取り手が、全て実装されていることの検証 (#1038)。
 *
 * `cdl` は受け取り手の名前だけを図に持ち、実装は使う側が渡す。 渡し漏れは
 * `attachEventHandlers` が警告を出すだけで、画面は「押しても動かない」 まま並ぶ。
 * 見た人は壊れていると受け取るため、名前の対応を機械で固定する。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CATALOG_HANDLERS } from "./catalog-handlers";
import { CATALOG_ITEMS } from "./catalog-items";

/**
 * 図が `on.click` / `on.hover` 等で名指しする受け取り手の名前 → その名前を使う図の一覧。
 *
 * `CATALOG_ITEMS` は種別ごとの map なので、全種別を横断して見る。
 */
function declaredHandlerIds(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const items of Object.values(CATALOG_ITEMS)) {
    for (const item of items) {
      const bindings = (item.diagram as { eventBindings?: Array<{ handlerId?: string }> }).eventBindings;
      if (!bindings?.length) continue;
      for (const b of bindings) {
        if (!b.handlerId) continue;
        out.set(b.handlerId, [...(out.get(b.handlerId) ?? []), item.id]);
      }
    }
  }
  return out;
}

describe("catalog の受け取り手 (#1038)", () => {
  it("図が名指しする受け取り手が全て実装されている", () => {
    // 1 つでも欠けると、その図は押しても動かない見本として並び続ける
    const declared = declaredHandlerIds();
    const missing = [...declared.entries()]
      .filter(([id]) => typeof CATALOG_HANDLERS[id] !== "function")
      .map(([id, items]) => `${id} (${items.join(", ")})`);
    expect(missing, `実装が無い受け取り手: ${missing.join(" / ")}`).toHaveLength(0);
  });

  it("名指しされていない受け取り手を持たない", () => {
    // 図から消したのに実装だけ残ると、次に同じ名前を書いた時に
    // 意図しない動きが付く
    const declared = declaredHandlerIds();
    const orphan = Object.keys(CATALOG_HANDLERS).filter((id) => !declared.has(id));
    expect(orphan, `どの図からも名指しされていない: ${orphan.join(", ")}`).toHaveLength(0);
  });

  it("押すと入りと切りが入れ替わる", () => {
    // 受け取り手の中身。 現在値を読んで反転する
    let value = false;
    const signals = {
      input: {}, formula: {}, scroll: {},
      getBool: (id: string) => (id === "active" ? value : undefined),
      setBool: (id: string, v: boolean) => { if (id === "active") value = v; },
    };
    const toggle = CATALOG_HANDLERS["toggle-active"]!;
    toggle(new Event("click"), signals as never);
    expect(value, "1 回目で入りにならない").toBe(true);
    toggle(new Event("click"), signals as never);
    expect(value, "2 回目で切りに戻らない").toBe(false);
  });

  it("受け取り手を渡さない描画経路が残っていない", () => {
    // 一覧の中と拡大表示の 2 経路がある。 片方だけ渡すと、もう片方が
    // 「押しても動かない」 まま残る (実測 = #1038 はどちらも渡していなかった)
    const src = readFileSync(new URL("../pages/CategoryPage.tsx", import.meta.url), "utf8");
    const uses = [...src.matchAll(/<CdlDiagramView\b[^>]*\/>/g)].map((m) => m[0]);
    expect(uses.length, "描画経路が 1 つも見つからない (検査が空振りしている)").toBeGreaterThanOrEqual(2);
    const bare = uses.filter((u) => !u.includes("interactiveHandlers"));
    expect(bare, `受け取り手を渡していない: ${bare.join(" / ")}`).toHaveLength(0);
  });
});
