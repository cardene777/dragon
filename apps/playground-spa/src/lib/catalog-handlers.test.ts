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

  it("長押しは押している時間を測る (#1045)", () => {
    // `cdl` は `long-press` に pointerdown / pointerup / pointercancel をそのまま渡すだけで
    // 時間を測らない。 測らないと押した瞬間と離した瞬間の 2 回とも受け取ってしまう
    const calls: string[] = [];
    const signals = {
      input: {}, formula: {}, scroll: {},
      setString: (id: string, v: string) => { if (id === "lastEvent") calls.push(v); },
      getNumber: () => 0,
      setNumber: () => { /* 累計は別 test で見る */ },
    };
    const h = CATALOG_HANDLERS["on-long"]!;
    // `Event.timeStamp` は読み取り専用なので、実 Event を作らず必要な 2 つの値だけを渡す
    const ev = (type: string, ts: number) => ({ type, timeStamp: ts }) as unknown as Event;

    // 短い押下 = 受け取らない
    h(ev("pointerdown", 1000), signals as never);
    h(ev("pointerup", 1100), signals as never);
    expect(calls, "短い押下で受け取っている").toHaveLength(0);

    // 長い押下 = 受け取る
    h(ev("pointerdown", 2000), signals as never);
    h(ev("pointerup", 2600), signals as never);
    expect(calls, "長い押下で受け取っていない").toEqual(["長押し"]);

    // 取り消された押下の後、離しただけでは受け取らない
    h(ev("pointerdown", 3000), signals as never);
    h(ev("pointercancel", 3100), signals as never);
    h(ev("pointerup", 4000), signals as never);
    expect(calls, "取り消し後の離しで受け取っている").toEqual(["長押し"]);

    // 押していないのに離しただけでも受け取らない
    h(ev("pointerup", 5000), signals as never);
    expect(calls, "押さずに離して受け取っている").toEqual(["長押し"]);
  });

  it("5 種の操作がそれぞれ別の名前を残す (#1045)", () => {
    // 1 つでも同じ名前だと、どれを受け取ったか画面で区別が付かない
    const names = new Map<string, string>();
    for (const id of ["on-dbl", "on-focus", "on-blur", "on-key"]) {
      const signals = {
        input: {}, formula: {}, scroll: {},
        setString: (k: string, v: string) => { if (k === "lastEvent") names.set(id, v); },
        getNumber: () => 0,
        setNumber: () => { /* 累計は別 test で見る */ },
      };
      CATALOG_HANDLERS[id]!(new Event("x"), signals as never);
    }
    expect(names.size, "受け取り手が名前を残していない").toBe(4);
    expect(new Set(names.values()).size, `名前が重複している: ${[...names.values()].join(", ")}`).toBe(4);
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
