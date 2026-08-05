/**
 * 動きの記述が図から導かれ、画面まで届いていることの検証 (#1043)。
 *
 * 導く経路が切れると、動く図から一文が消えるだけで誰も気付かない。 説明側は動きを
 * 語らなくなっているため、**画面から動きの情報が丸ごと落ちる** 形になる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";
import { motionOf, motionNote } from "./catalog-motion";

/**
 * 連続した動きを表す語。 説明に出てよいのは、図が実際に連続して動く時だけ (#1043)。
 *
 * 語の後ろを限定しない。 限定すると活用形で迂回できる
 * (実測 = `連続変化` は当たるが `連続して動く` / `連続する` は当たらなかった)。
 *
 * **この列挙は塞ぎ切れない**。 言い回しは無限にあり、同義語を足す形は収束しない。
 * それでも実害が出ないのは、動きの記述を **図から導いて必ず画面に出す** ようにしたため。
 * 取りこぼしても「誤った主張が単独で出る」 ことは無く、正しい導出文の隣に矛盾した一文が
 * 並ぶ形になり、読み手が気付ける。
 */
const CONTINUOUS_WORDS = [
  /tween/i,
  /連続/,
  /徐々/,
  /なめらか|滑らか/,
  /少しずつ/,
  /補間/,
  /ゆっくり/,
  /次第に/,
  /じわじわ/,
  /漸次/,
  /アニメーションしながら/,
  /シームレス/,
];

/**
 * 画面に出る全ての説明。
 *
 * `subtitle` が SSOT で、`subtitle__X` を持たない図は `diagram.topic` が入る。
 * `parts` は画面側で後から読み込む形なので明示的に足す (足さないと 80 件が範囲から漏れる)。
 */
async function allItems(): Promise<Array<{ category: string; item: CatalogItem }>> {
  const out: Array<{ category: string; item: CatalogItem }> = [];
  const byCategory: Record<string, CatalogItem[]> = {
    ...CATALOG_ITEMS,
    parts: await loadPartsItems(),
  };
  for (const [category, items] of Object.entries(byCategory)) {
    for (const item of items) out.push({ category, item });
  }
  return out;
}

/**
 * 段が持つものを組み立てて、動きの種類だけを見る最小の図。
 *
 * 状態は初期値 0 で宣言する。 **初期値を持たせないと `set` が動きに見えない**
 * (置いた値 1 つでは前後の比べようが無いため)。
 */
function diagramWith(opts: {
  tweens?: Array<string | { id: string; from: number; to: number }>;
  sets?: Array<string | { id: string; value: number }>;
  inputs?: string[];
  formulas?: string[];
}): Parameters<typeof motionOf>[0] {
  const tweens = (opts.tweens ?? []).map((t) => (typeof t === "string" ? { id: t, from: 0, to: 1 } : t));
  const sets = (opts.sets ?? []).map((s) => (typeof s === "string" ? { id: s, value: 1 } : s));
  const ids = [...new Set([...tweens.map((t) => t.id), ...sets.map((s) => s.id)])];
  return {
    id: "x",
    nodes: [],
    states: ids.map((id) => ({ id, initial: 0 })),
    inputs: (opts.inputs ?? []).map((id) => ({ id, kind: "slider" })),
    formulas: (opts.formulas ?? []).map((id) => ({ id, expression: "1" })),
    phases: [{
      id: "p1",
      tweens: tweens.map((t) => ({ stateId: t.id, from: t.from, to: t.to })),
      sets: sets.map((s) => ({ stateId: s.id, value: s.value })),
    }],
  } as unknown as Parameters<typeof motionOf>[0];
}

describe("動きの記述 (#1043)", () => {
  it("段の実装から動きの種類が決まる", () => {
    expect(motionOf(diagramWith({ tweens: ["a"] })), "tween を連続と読まない").toBe("continuous");
    expect(motionOf(diagramWith({ sets: ["a"] })), "set を段階と読まない").toBe("step");
    expect(motionOf(diagramWith({})), "何も無い図を動くと読む").toBe("none");
    // tween が 1 つでもあれば連続 (set と併存する図がある)
    expect(motionOf(diagramWith({ tweens: ["a"], sets: ["b"] }))).toBe("continuous");
  });

  it("値が実際に変わらない段は動きに数えない", () => {
    // 書いてあるかではなく、値が変わるかで決める。 数えると止まったままの図に
    // 「段の切替で値が一度に変わる」 と書くことになる (実測 = parts の 6 図がこれだった)
    expect(motionOf(diagramWith({ tweens: [{ id: "a", from: 0, to: 0 }] })), "動かない tween を連続と数えている").toBe("none");
    expect(motionOf(diagramWith({ sets: [{ id: "a", value: 0 }] })), "初期値と同じ set を数えている").toBe("none");

    // 始点と終点が同じでも、初期値と違えば段の境界で一度に変わる = step
    expect(motionOf(diagramWith({ tweens: [{ id: "a", from: 50, to: 50 }] })), "境界での変化を見落としている").toBe("step");

    // 片方でも動けば動く
    expect(motionOf(diagramWith({ tweens: [{ id: "a", from: 0, to: 0 }, { id: "b", from: 0, to: 1 }] }))).toBe("continuous");
    expect(motionOf(diagramWith({ sets: [{ id: "a", value: 0 }, { id: "b", value: 1 }] }))).toBe("step");
  });

  it("入力欄 / 計算式が握る状態は動きに数えない", () => {
    // 握られている状態は実行時に上書きされるため、段で動かしても画面に届かない。
    // 数えると、画面が動かない図に「連続して動く」 と書くことになる
    expect(motionOf(diagramWith({ tweens: ["v"], inputs: ["v"] })), "入力欄が握る状態を数えている").toBe("none");
    expect(motionOf(diagramWith({ tweens: ["v"], formulas: ["v"] })), "計算式が握る状態を数えている").toBe("none");
    // 握られていない状態が別にあれば動く
    expect(motionOf(diagramWith({ tweens: ["v", "w"], inputs: ["v"] }))).toBe("continuous");
  });

  it("動かない図には一文を付けない", () => {
    expect(motionNote(diagramWith({}))).toBeUndefined();
    expect(motionNote(diagramWith({ tweens: ["a"] }))).toBe("段の中で値が連続して動く");
    expect(motionNote(diagramWith({ sets: ["a"] }))).toBe("段の切替で値が一度に変わる");
  });

  it("一覧の項目が導いた一文を持っている", () => {
    // 組み立て側 (`catalog-items.ts`) の配線が切れていないこと
    const interactive = CATALOG_ITEMS.interactive ?? [];
    expect(interactive.length, "図が 1 件も見つからない").toBeGreaterThan(50);
    const withNote = interactive.filter((i) => typeof i.motionNote === "string");
    expect(withNote.length, "導いた一文を持つ項目が無い (配線が切れている)").toBeGreaterThan(50);
    // 一文の中身は 2 種類しかない (自由文が紛れ込んでいないこと)
    const allowed = new Set(["段の中で値が連続して動く", "段の切替で値が一度に変わる"]);
    const unexpected = [...new Set(withNote.map((i) => i.motionNote))].filter((s) => !allowed.has(s!));
    expect(unexpected, `想定外の一文がある: ${unexpected.join(" / ")}`).toHaveLength(0);
  });

  it("全ての図で、一文が段の実装と一致する", () => {
    // 導く経路が切れると、動く図から一文が消えるだけで誰も気付かない。
    // **一覧に載る全ての図** を見る。 一部の図に絞ると、連続して動く図が 4 件しかないため
    // その 4 件が範囲から外れて、連続側の判定が一度も試されないまま通る (実測で起きた)
    const items = CATALOG_ITEMS.interactive ?? [];
    const kinds = { continuous: 0, step: 0 };
    for (const item of items) {
      const hasTween = (item.diagram.phases ?? []).some((p) => (p.tweens ?? []).length > 0);
      const kind = motionOf(item.diagram);
      if (kind === "none") continue;
      const expected = hasTween ? "段の中で値が連続して動く" : "段の切替で値が一度に変わる";
      expect(item.motionNote, `${item.title} の一文が実装と合わない`).toBe(expected);
      kinds[kind] += 1;
    }
    // 2 種類ともが実データで試されていること
    expect(kinds.continuous, "連続して動く図が 1 件も無い").toBeGreaterThan(0);
    expect(kinds.step, "段の切替で変わる図が 1 件も無い").toBeGreaterThan(0);
  });

  it("連続した動きを語る説明は、実際に連続して動く図だけが持つ", async () => {
    // 直す前は言い回しの列挙で「連続を語るか」 を判定し、当たった説明だけを実装と
    // 突き合わせていた。 対象は `interactive` の 100 件に限られ、`subtitle__X` を持たない図と
    // 他の種別が範囲の外だった (実測 = `animation` と `parts` の 9 件が見られていなかった)。
    //
    // **画面に出る説明を全件見る**。 判定の中身は変わらないが、範囲が画面と一致する
    const items = await allItems();
    expect(items.length, "図が 1 件も見つからない").toBeGreaterThan(400);

    const bad: string[] = [];
    for (const { category, item } of items) {
      const found = CONTINUOUS_WORDS.filter((re) => re.test(item.subtitle)).map((re) => re.source);
      if (!found.length) continue;
      if (motionOf(item.diagram) === "continuous") continue;
      bad.push(`${category}/${item.title}: ${found.join(" / ")} と語るが ${motionOf(item.diagram)}`);
    }
    expect(bad, `説明と実装の動きが合わない:\n${bad.join("\n")}`).toHaveLength(0);
  });

  it("画面が導いた一文を出している", () => {
    // 一覧の中と拡大表示の 2 経路がある。 片方だけだと、その経路で動きの情報が落ちる
    const src = readFileSync(new URL("../pages/CategoryPage.tsx", import.meta.url), "utf8");
    const uses = src.match(/motionNote/g) ?? [];
    expect(uses.length, `画面が導いた一文を出していない (出現 ${uses.length} 回)`).toBeGreaterThanOrEqual(4);
  });
});
