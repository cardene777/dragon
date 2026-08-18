/**
 * JSON の入口が同じ項目を 2 度読み、 検査後に値を差し替えられた件 (#1217)。
 *
 * 検査する時と図に写す時で同じ項目を読み直していたため、 値を返す関数 (getter) を持つ object を
 * 渡すと **2 度目に別の値を返せた** = 検査を通った値と図に届く値が別物になり、 検査が意味を
 * 持たなかった。
 *
 * 入口で 1 度だけ読んで素のデータの写しを作り、 以降は写しだけを読む形に変えた。
 *
 * **公開経路で見る**。 `jsonToDoc` は package の外から呼べないため、 `jsonToDiagram` と
 * `validateDragonJson` の 2 つで確かめる。
 */
import { describe, it, expect } from "vitest";
import { jsonToDiagram, validateDragonJson } from "../src/index";

/** JSON の最小形。 差し替えたい項目だけを渡す */
const 図の素 = (extra: Record<string, unknown>): Record<string, unknown> => ({
  title: "確認",
  type: "flow",
  actors: [{ name: "受付", value: "{amount}" }, { name: "処理" }],
  flow: [{ from: "受付", to: "処理", label: "渡す" }],
  ...extra,
});

/**
 * `n` 回目までは `正` を返し、 それ以降は `偽` を返す項目を持つ object を作る。
 *
 * 検査が何回読むかは実装の都合で変わるため、 **切替の回数を引数にする**。 1 回目で切り替える形
 * (`states`) と 6 回目で切り替える形 (`tween`) の両方を Issue が挙げている。
 */
function 途中で変わる項目(
  base: Record<string, unknown>,
  名: string,
  正: unknown,
  偽: unknown,
  切替: number,
): { 図: Record<string, unknown>; 読んだ回数: () => number } {
  let 回数 = 0;
  const 図: Record<string, unknown> = { ...base };
  Object.defineProperty(図, 名, {
    enumerable: true,
    configurable: true,
    get() {
      回数 += 1;
      return 回数 <= 切替 ? 正 : 偽;
    },
  });
  return { 図, 読んだ回数: () => 回数 };
}

describe("検査後に値を差し替えられない", () => {
  it("段の動き (tween) を途中から壊す入力でも、 図に届く値が検査した値と一致する", () => {
    // Issue の再現手順 = 6 回目以降に `[NaN, Infinity]` を返す
    const { 図, 読んだ回数 } = 途中で変わる項目(
      図の素({ states: { amount: 0 } }),
      "animation",
      [{ step: "進む", duration: 1.4, tween: { amount: [0, 100] } }],
      [{ step: "進む", duration: 1.4, tween: { amount: [NaN, Infinity] } }],
      5,
    );

    const d = jsonToDiagram(図);
    expect(読んだ回数(), "項目を 2 度以上読んでいる").toBe(1);

    const tweens = d.phases[0]?.tweens ?? [];
    expect(tweens).toEqual([{ stateId: "amount", from: 0, to: 100 }]);
    // 壊れた値が届いていないこと (以前は from / to が null になった)
    for (const t of tweens) {
      expect(Number.isFinite(t.from), "from が有限でない").toBe(true);
      expect(Number.isFinite(t.to), "to が有限でない").toBe(true);
    }
  });

  it("段の切替 (set) を途中から壊す入力でも、 図に届く値が検査した値と一致する", () => {
    const { 図, 読んだ回数 } = 途中で変わる項目(
      図の素({ states: { amount: 0 } }),
      "animation",
      [{ step: "進む", duration: 1.4, set: { amount: 42 } }],
      [{ step: "進む", duration: 1.4, set: { amount: { 入れ子: true } } }],
      5,
    );

    const d = jsonToDiagram(図);
    expect(読んだ回数(), "項目を 2 度以上読んでいる").toBe(1);
    expect(d.phases[0]?.sets ?? []).toEqual([{ stateId: "amount", value: 42 }]);
  });

  it("状態 (states) を 2 回目から壊す入力でも、 図に届く値が検査した値と一致する", () => {
    // Issue の再現手順 = 2 回目に `{ "bad.name": ... }` を返す。 `bad.name` は名前の判定が
    // 拒む形で、 検査を通る経路が他に無い
    const { 図, 読んだ回数 } = 途中で変わる項目(
      図の素({}),
      "states",
      { amount: 0 },
      { "bad.name": { 入れ子: true } },
      1,
    );

    const d = jsonToDiagram(図);
    expect(読んだ回数(), "項目を 2 度以上読んでいる").toBe(1);
    expect(d.states.map((s) => s.id)).toEqual(["amount"]);
    expect(d.states.map((s) => s.initial)).toEqual([0]);
  });

  it("誤った値を返す入力は、 写した後の値で誤りとして拒む", () => {
    // 1 回目から誤った値を返す形は、 写した時点でその値になるので検査が拒む
    const { 図 } = 途中で変わる項目(
      図の素({ states: { amount: 0 } }),
      "animation",
      [{ step: "進む", duration: 1.4, tween: { amount: [NaN, Infinity] } }],
      [{ step: "進む", duration: 1.4, tween: { amount: [0, 100] } }],
      1,
    );
    expect(() => jsonToDiagram(図)).toThrow(/validation error/);
  });
});

describe("validateDragonJson が返す data", () => {
  it("入力 object と別の実体を返す", () => {
    const 入力 = 図の素({ states: { amount: 0 } });
    const r = validateDragonJson(入力);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data as unknown === 入力, "入力そのものを返している").toBe(false);
    // 入れ子も写している (元を書き換えても返り値は変わらない)
    expect((r.data.actors as unknown[])[0] === 入力.actors[0]).toBe(false);
  });

  it("返した後に入力を書き換えても、 返り値は変わらない", () => {
    const 入力 = 図の素({ states: { amount: 0 } }) as Record<string, unknown> & {
      actors: Array<{ name: string }>;
    };
    const r = validateDragonJson(入力);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    入力.actors[0]!.name = "書き換えた";
    expect((r.data.actors[0] as { name: string }).name).toBe("受付");
  });

  it("値を返す関数を持つ入力でも、 返り値は素のデータになる", () => {
    const { 図 } = 途中で変わる項目(図の素({}), "states", { amount: 0 }, { amount: 999 }, 1);
    const r = validateDragonJson(図);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 何度読んでも同じ値
    const 一度目 = JSON.stringify(r.data.states);
    const 二度目 = JSON.stringify(r.data.states);
    expect(一度目).toBe(二度目);
    expect(一度目).toBe(JSON.stringify({ amount: 0 }));
  });
});

describe("写しそのものの性質", () => {
  it("値を返す関数を持たない普通の JSON では図が変わらない", () => {
    const 素 = 図の素({
      states: { amount: 0 },
      animation: [{ step: "進む", duration: 1.4, tween: { amount: [0, 100] } }],
    });
    const a = jsonToDiagram(素);
    const b = jsonToDiagram(JSON.parse(JSON.stringify(素)) as Record<string, unknown>);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("自分を指す入れ子があっても止まる", () => {
    const 素 = 図の素({ states: { amount: 0 } }) as Record<string, unknown>;
    素.輪 = 素;
    // 検査は知らない項目を無視するので、 通ること自体が「無限に降りていない」 ことを示す
    expect(() => validateDragonJson(素)).not.toThrow();
  });

  it("__proto__ を項目名に持つ入力で、 写しが継承しない", () => {
    // 書き込みは `Object.defineProperty` で行う。 `out[key] = 値` と書くと、 key が
    // `__proto__` の時に `Object.prototype` の setter が動いて **写しの prototype 自体が
    // 差し替わり**、 写しが `汚染` を継承する。 `JSON.parse` は普通の項目として持つので、
    // 写しも普通の項目として持つのが元と同じ形になる
    const 素 = JSON.parse(
      '{"title":"確認","type":"flow","actors":[{"name":"受付"},{"name":"処理"}],"flow":[{"from":"受付","to":"処理","label":"渡す"}],"__proto__":{"汚染":1}}',
    ) as Record<string, unknown>;
    const r = validateDragonJson(素);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const 写し = r.data as unknown as Record<string, unknown>;
    expect(写し.汚染, "写しが差し替わった prototype から継承している").toBeUndefined();
    expect(Object.getPrototypeOf(写し), "写しの prototype が差し替わっている").toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(写し, "__proto__"), "普通の項目として持っていない").toBe(true);
    // 全体を汚していないことも併せて見る
    expect(({} as Record<string, unknown>).汚染).toBeUndefined();
  });
});
