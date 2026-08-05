/**
 * catalog の図が名指しする受け取り手が、全て実装されていることの検証 (#1038)。
 *
 * `cdl` は受け取り手の名前だけを図に持ち、実装は使う側が渡す。 渡し漏れは
 * `attachEventHandlers` が警告を出すだけで、画面は「押しても動かない」 まま並ぶ。
 * 見た人は壊れていると受け取るため、名前の対応を機械で固定する。
 */
import { describe, it, expect, vi, afterEach } from "vitest";
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

/** 受け取った名前を記録するだけの状態。 累計は別 test で見る。 */
function recorder(): { calls: string[]; signals: never } {
  const calls: string[] = [];
  const signals = {
    input: {}, formula: {}, scroll: {},
    setString: (id: string, v: string) => { if (id === "lastEvent") calls.push(v); },
    getNumber: () => 0,
    setNumber: () => { /* 累計は別 test で見る */ },
  };
  return { calls, signals: signals as never };
}

/**
 * 結び付け先の要素の代わり。
 *
 * 受け取り手は待ちを要素ごとに持つため、別物として区別できる値であれば足りる
 * (画面から外れた図を避ける検査は実要素の時だけ働くので、ここでは通り抜ける)。
 */
function fakeTarget(): EventTarget {
  return {} as unknown as EventTarget;
}

/** 押下 / 離し / 取り消しの event。 要素と指の 2 つで押下が区別される。 */
function pointerEvent(type: string, target: EventTarget, pointerId = 0): Event {
  return { type, currentTarget: target, target, pointerId } as unknown as Event;
}

describe("catalog の受け取り手 (#1038)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("長押しは押し続けている間に受け取る (#1045)", () => {
    // `cdl` は `long-press` に pointerdown / pointerup / pointercancel をそのまま渡すだけで
    // 時間を測らない。 数えないと押した瞬間と離した瞬間の 2 回とも受け取ってしまう。
    //
    // **離した時ではなく、一定時間に達した時点で受け取る**。 段の説明が
    // 「押したまま一定時間たつと受け取る」 なので、離すまで変わらないのでは食い違う
    vi.useFakeTimers();
    const { calls, signals } = recorder();
    const h = CATALOG_HANDLERS["on-long"]!;
    const el = fakeTarget();

    // 達する前 = まだ受け取らない
    h(pointerEvent("pointerdown", el), signals);
    vi.advanceTimersByTime(499);
    expect(calls, "達する前に受け取っている").toHaveLength(0);

    // 達した時点 = 離していなくても受け取る
    vi.advanceTimersByTime(1);
    expect(calls, "押し続けても受け取らない (離すまで変わらない)").toEqual(["長押し"]);

    // 離しても二重に受け取らない
    h(pointerEvent("pointerup", el), signals);
    vi.advanceTimersByTime(1000);
    expect(calls, "離した時にもう一度受け取っている").toEqual(["長押し"]);
  });

  it("長押しは達する前に離すと受け取らない (#1045)", () => {
    vi.useFakeTimers();
    const { calls, signals } = recorder();
    const h = CATALOG_HANDLERS["on-long"]!;
    const el = fakeTarget();

    // 短い押下
    h(pointerEvent("pointerdown", el), signals);
    vi.advanceTimersByTime(120);
    h(pointerEvent("pointerup", el), signals);
    vi.advanceTimersByTime(1000);
    expect(calls, "短い押下で受け取っている").toHaveLength(0);

    // 取り消された押下
    h(pointerEvent("pointerdown", el), signals);
    vi.advanceTimersByTime(120);
    h(pointerEvent("pointercancel", el), signals);
    vi.advanceTimersByTime(1000);
    expect(calls, "取り消した押下で受け取っている").toHaveLength(0);

    // 押していないのに離しただけ
    h(pointerEvent("pointerup", el), signals);
    vi.advanceTimersByTime(1000);
    expect(calls, "押さずに離して受け取っている").toHaveLength(0);
  });

  it("長押しの待ちが表示と指ごとに分かれている (#1045)", () => {
    // 受け取り手は 1 つを一覧と拡大表示が共有し、指も複数あり得る。 待ちを 1 つに持つと、
    // 別の表示 / 別の指の離しが先に押した方を取り消してしまう
    vi.useFakeTimers();
    const { calls, signals } = recorder();
    const h = CATALOG_HANDLERS["on-long"]!;
    const listView = fakeTarget();
    const modalView = fakeTarget();

    // 一覧で押し始め、拡大表示の側で離す = 一覧の待ちは消えない
    h(pointerEvent("pointerdown", listView), signals);
    vi.advanceTimersByTime(100);
    h(pointerEvent("pointerup", modalView), signals);
    vi.advanceTimersByTime(400);
    expect(calls, "別の表示の離しで取りこぼしている").toEqual(["長押し"]);

    // 同じ要素でも指が違えば別の押下として数える
    calls.length = 0;
    h(pointerEvent("pointerdown", listView, 1), signals);
    vi.advanceTimersByTime(100);
    h(pointerEvent("pointerup", listView, 2), signals);
    vi.advanceTimersByTime(400);
    expect(calls, "別の指の離しで取りこぼしている").toEqual(["長押し"]);
  });

  it("累計は上限で止まり 0 に戻らない (#1045)", () => {
    // 0 に戻すと 100 回目が「累計 0 回」 と読め、受け取ったのに数が減る
    const written: number[] = [];
    const signals = {
      input: {}, formula: {}, scroll: {},
      setString: () => { /* 名前は別 test で見る */ },
      getNumber: () => 99,
      setNumber: (id: string, v: number) => { if (id === "received") written.push(v); },
    };
    CATALOG_HANDLERS["on-dbl"]!(new Event("x"), signals as never);
    expect(written, "上限の次に 0 へ戻っている").toEqual([99]);
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
