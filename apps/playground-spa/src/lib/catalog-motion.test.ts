/**
 * 動きの記述が図から導かれ、画面まで届いていることの検証 (#1043)。
 *
 * 導く経路が切れると、動く図から一文が消えるだけで誰も気付かない。 説明側は動きを
 * 語らなくなっているため、**画面から動きの情報が丸ごと落ちる** 形になる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";
import { PRESETS } from "./presets";
import { motionOf, motionNote } from "./catalog-motion";

/**
 * 連続した動きを表す語。 説明に出てよいのは、図が実際に連続して動く時だけ (#1043)。
 *
 * 語の後ろを限定しない。 限定すると活用形で迂回できる
 * (実測 = `連続変化` は当たるが `連続して動く` / `連続する` は当たらなかった)。
 *
 * **この列挙は塞ぎ切れない**。 言い回しは無限にあり、同義語を足す形は収束しない。
 *
 * それでも誤った説明が単独で出ることは無い。 導出文を **動かない図も含めて必ず出す**
 * ようにしたため (#1053)、語彙の外の言い回しで誤って語っても矛盾した一文が隣に並び、
 * 読み手が気付ける。 列挙が受け持つのは「書き忘れの指摘」 までで、保証は導出文の側にある。
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
 * 一覧は `CatalogItem.subtitle` が SSOT で、`subtitle__X` を持たない図は `diagram.topic` が入る。
 * `parts` は画面側で後から読み込む形なので明示的に足す (足さないと 80 件が範囲から漏れる)。
 *
 * **preset の詳細画面は別の入れ物を使う**。 `PresetDetailPage` は `CatalogItem` を経由せず
 * `PRESETS` の説明を直に出すため、ここを足さないとその画面の説明が範囲から漏れる。
 */
async function allDescriptions(): Promise<Array<{ where: string; name: string; text: string; diagram: CdlDiagram }>> {
  const out: Array<{ where: string; name: string; text: string; diagram: CdlDiagram }> = [];
  const byCategory: Record<string, CatalogItem[]> = {
    ...CATALOG_ITEMS,
    parts: await loadPartsItems(),
  };
  for (const [category, items] of Object.entries(byCategory)) {
    for (const item of items) {
      out.push({ where: category, name: item.title, text: item.subtitle, diagram: item.diagram });
    }
  }
  for (const preset of PRESETS) {
    out.push({ where: "preset 詳細", name: preset.id, text: preset.subtitle, diagram: preset.diagram });
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

  it("画面に出ない途中の指定を動きに数えない", () => {
    // 描画側は同じ段の中で `set` を順に適用してから `tween` が上書きする
    // (`computeStateValues`)。 宣言された値を全て並べる形にすると、画面に一度も出ない
    // 途中の指定まで数えてしまう
    const overridden = {
      id: "x", nodes: [], states: [{ id: "a", initial: 0 }],
      phases: [{
        id: "p1",
        // 同じ段で set が 2 回 = 最後だけが見える、 さらに tween が上書きする
        sets: [{ stateId: "a", value: 7 }, { stateId: "a", value: 9 }],
        tweens: [{ stateId: "a", from: 0, to: 0 }],
      }],
    } as unknown as Parameters<typeof motionOf>[0];
    expect(motionOf(overridden), "上書きされて消える値を数えている").toBe("none");

    // 上書きの結果が初期値と違えば、段の境界で一度に変わる
    const lands = {
      id: "x", nodes: [], states: [{ id: "a", initial: 0 }],
      phases: [{
        id: "p1",
        sets: [{ stateId: "a", value: 7 }],
        tweens: [{ stateId: "a", from: 5, to: 5 }],
      }],
    } as unknown as Parameters<typeof motionOf>[0];
    expect(motionOf(lands), "上書き後の値の変化を見落としている").toBe("step");

    // 同じ段で同じ状態に tween が 2 つ = 後のものが勝つ
    const laterWins = {
      id: "x", nodes: [], states: [{ id: "a", initial: 0 }],
      phases: [{
        id: "p1", sets: [],
        tweens: [{ stateId: "a", from: 0, to: 1 }, { stateId: "a", from: 0, to: 0 }],
      }],
    } as unknown as Parameters<typeof motionOf>[0];
    expect(motionOf(laterWins), "上書きされた tween を連続と数えている").toBe("none");

    const laterMoves = {
      id: "x", nodes: [], states: [{ id: "a", initial: 0 }],
      phases: [{
        id: "p1", sets: [],
        tweens: [{ stateId: "a", from: 0, to: 0 }, { stateId: "a", from: 0, to: 1 }],
      }],
    } as unknown as Parameters<typeof motionOf>[0];
    expect(motionOf(laterMoves), "勝ち残った tween の動きを見落としている").toBe("continuous");
  });

  it("入力欄 / 計算式が握る状態は動きに数えない", () => {
    // 握られている状態は実行時に上書きされるため、段で動かしても画面に届かない。
    // 数えると、画面が動かない図に「連続して動く」 と書くことになる
    expect(motionOf(diagramWith({ tweens: ["v"], inputs: ["v"] })), "入力欄が握る状態を数えている").toBe("none");
    expect(motionOf(diagramWith({ tweens: ["v"], formulas: ["v"] })), "計算式が握る状態を数えている").toBe("none");
    // 握られていない状態が別にあれば動く
    expect(motionOf(diagramWith({ tweens: ["v", "w"], inputs: ["v"] }))).toBe("continuous");
  });

  it("動かない図にも一文を付ける", () => {
    // 付けないと、静的な図の説明に語彙の外の言い回しで動きを書かれた時に
    // 誤った説明が単独で出る (#1053)
    expect(motionNote(diagramWith({}))).toBe("段を進めても値は変わらない");
    expect(motionNote(diagramWith({ tweens: ["a"] }))).toBe("段の中で値が連続して動く");
    expect(motionNote(diagramWith({ sets: ["a"] }))).toBe("段の切替で値が一度に変わる");
  });

  it("全ての項目が導いた一文を持っている", async () => {
    // 組み立て側 (`catalog-items.ts`) の配線が切れていないこと。
    // **1 件でも欠けたら落とす** (#1053)。 欠けた図では説明が単独で出る
    const items = await allDescriptions();
    expect(items.length, "図が 1 件も見つからない").toBeGreaterThan(430);

    const allowed = new Set([
      "段の中で値が連続して動く",
      "段の切替で値が一度に変わる",
      "段を進めても値は変わらない",
    ]);
    const bad: string[] = [];
    for (const { where, name, diagram } of items) {
      const note = motionNote(diagram);
      if (!allowed.has(note)) bad.push(`${where}/${name}: ${note}`);
    }
    expect(bad, `想定外の一文がある: ${bad.join(" / ")}`).toHaveLength(0);

    // 一覧の項目に載っていること (配線)
    const interactive = CATALOG_ITEMS.interactive ?? [];
    const missing = interactive.filter((i) => !allowed.has(i.motionNote)).map((i) => i.title);
    expect(missing, `一文が載っていない項目: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("全ての図で、一文が段の実装と一致する", () => {
    // 導く経路が切れると、動く図から一文が消えるだけで誰も気付かない。
    // **一覧に載る全ての図** を見る。 一部の図に絞ると、連続して動く図が 4 件しかないため
    // その 4 件が範囲から外れて、連続側の判定が一度も試されないまま通る (実測で起きた)
    const items = CATALOG_ITEMS.interactive ?? [];
    const kinds = { continuous: 0, step: 0, none: 0 };
    for (const item of items) {
      const kind = motionOf(item.diagram);
      const expected = {
        continuous: "段の中で値が連続して動く",
        step: "段の切替で値が一度に変わる",
        none: "段を進めても値は変わらない",
      }[kind];
      expect(item.motionNote, `${item.title} の一文が実装と合わない`).toBe(expected);
      kinds[kind] += 1;
    }
    // 3 種類ともが実データで試されていること
    expect(kinds.continuous, "連続して動く図が 1 件も無い").toBeGreaterThan(0);
    expect(kinds.step, "段の切替で変わる図が 1 件も無い").toBeGreaterThan(0);
    expect(kinds.none, "動かない図が 1 件も無い").toBeGreaterThan(0);
  });

  it("連続した動きを語る説明は、実際に連続して動く図だけが持つ", async () => {
    // 直す前は言い回しの列挙で「連続を語るか」 を判定し、当たった説明だけを実装と
    // 突き合わせていた。 対象は `interactive` の 100 件に限られ、`subtitle__X` を持たない図と
    // 他の種別が範囲の外だった (実測 = `animation` と `parts` の 9 件が見られていなかった)。
    //
    // **画面に出る説明を全件見る**。 判定の中身は変わらないが、範囲が画面と一致する
    const descriptions = await allDescriptions();
    expect(descriptions.length, "説明が 1 件も見つからない").toBeGreaterThan(430);

    const bad: string[] = [];
    for (const { where, name, text, diagram } of descriptions) {
      const found = CONTINUOUS_WORDS.filter((re) => re.test(text)).map((re) => re.source);
      if (!found.length) continue;
      if (motionOf(diagram) === "continuous") continue;
      bad.push(`${where}/${name}: ${found.join(" / ")} と語るが ${motionOf(diagram)}`);
    }
    expect(bad, `説明と実装の動きが合わない:\n${bad.join("\n")}`).toHaveLength(0);
  });

  it("説明を出す画面が、導いた一文も出している", () => {
    // 説明が出る画面は 3 経路ある (一覧の中 / 拡大表示 / preset 詳細)。
    // 出さない経路が残ると、そこでは説明だけが単独で出る
    const pages = ["../pages/CategoryPage.tsx", "../pages/PresetDetailPage.tsx"];
    for (const page of pages) {
      const src = readFileSync(new URL(page, import.meta.url), "utf8");
      const uses = (src.match(/motionNote/g) ?? []).length;
      expect(uses, `${page} が導いた一文を出していない`).toBeGreaterThanOrEqual(2);
    }
  });
});
