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
    expect((r.data as unknown) === 入力, "入力そのものを返している").toBe(false);
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
    expect(Object.getPrototypeOf(写し), "写しの prototype が差し替わっている").toBe(
      Object.prototype,
    );
    expect(
      Object.prototype.hasOwnProperty.call(写し, "__proto__"),
      "普通の項目として持っていない",
    ).toBe(true);
    // 全体を汚していないことも併せて見る
    expect(({} as Record<string, unknown>).汚染).toBeUndefined();
  });
});

describe("写しを作れない入力を誤りとして返す (Round 1)", () => {
  it("値を返す関数が投げても throw しない (r1-f1)", () => {
    // 検査が見ない項目でも、 名前を数える所と値を読む所で getter は動く。 投げたら
    // `validateDragonJson` 自体が throw して「誤りは {ok:false} で返す」 が破れる
    const 素 = 図の素({ states: { amount: 0 } });
    Object.defineProperty(素, "使わない項目", {
      enumerable: true,
      configurable: true,
      get() {
        throw new Error("getter exploded");
      },
    });

    const r = validateDragonJson(素);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.message).toBe("入力を読み取れない");
    expect(r.errors[0]?.hint).toContain("getter exploded");
  });

  it("項目の名前を数える所で投げても throw しない (r1-f1)", () => {
    const 素 = new Proxy(図の素({ states: { amount: 0 } }), {
      ownKeys() {
        throw new Error("ownKeys exploded");
      },
    });
    const r = validateDragonJson(素);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.hint).toContain("ownKeys exploded");
  });

  it("jsonToDiagram でも同じ入力が検査の誤りとして出る (r1-f1)", () => {
    const 素 = 図の素({ states: { amount: 0 } });
    Object.defineProperty(素, "使わない項目", {
      enumerable: true,
      configurable: true,
      get() {
        throw new Error("getter exploded");
      },
    });
    // 投げるのは検査の誤りとして。 生の Error がそのまま出ない
    expect(() => jsonToDiagram(素)).toThrow(/Dragon JSON DSL validation error/);
  });

  it("深すぎる入れ子を誤りとして返す (r1-f2)", () => {
    // 検査が見ない項目でも写しは降りるため、 上限が無いと呼び出しが積み上がって溢れる
    // (実測 = 20,000 段で RangeError: Maximum call stack size exceeded)
    const 深い: Record<string, unknown> = {};
    let 先 = 深い;
    for (let i = 0; i < 20_000; i += 1) {
      const 次: Record<string, unknown> = {};
      先.next = 次;
      先 = 次;
    }
    const r = validateDragonJson(図の素({ 使わない項目: 深い }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.message).toContain("入れ子が深すぎる");
    // どこで止まったかが path から読める
    expect(r.errors[0]?.path.startsWith("$.使わない項目")).toBe(true);
  });

  it("項目が多い入力でも数を理由に拒まない (Round 3)", () => {
    // 数の上限は図の書式が持っていない規則で、 置くと「構造としては正しいのに大きいから拒む」
    // 入力が生まれる (Round 3 の指摘 = 1 つの actors に 100,001 個の値を持たせた形が拒まれた)
    const 多い: Record<string, unknown> = {};
    for (let i = 0; i < 200_000; i += 1) 多い[`k${i}`] = i;
    const r = validateDragonJson(図の素({ 使わない項目: 多い }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const 写し = (r.data as unknown as Record<string, Record<string, unknown>>).使わない項目;
    expect(Object.keys(写し).length).toBe(200_000);
  }, 30_000);

  it("書式にある項目に大きな値を持たせても通る (Round 3 / 4)", () => {
    // Round 4 の指摘 = 前の書き方は未知の root 項目を使っており、 書式にある形を固定できて
    // いなかった。 `actors[].state` は書式が持つ項目で、 値の数に上限が無い
    const 状態: Record<string, number> = {};
    for (let i = 0; i < 100_001; i += 1) 状態[`s${i}`] = i;
    const r = validateDragonJson({
      title: "確認",
      type: "flow",
      actors: [{ name: "受付", kind: "arc-gauge", state: 状態 }, { name: "処理" }],
      flow: [{ from: "受付", to: "処理", label: "渡す" }],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const 写した状態 = (r.data.actors[0] as { state: Record<string, number> }).state;
    expect(Object.keys(写した状態).length).toBe(100_001);
  }, 30_000);

  it("巨大な配列を、 添字を 1 つも読まずに長さで止める (Round 6 / 7)", () => {
    // 添字を文字の並びとして作ると、 上限を見る前にその並びを作ってしまう
    // (Round 6 の実測 = `new Array(5_000_001)` で 500 万個の添字を作ろうとした)。
    //
    // **添字を読んだ回数で見る** (Round 7 の指摘)。 素の巨大配列は旧い形でも最後は同じ誤りに
    // なるため、 「並びを作る前に止まった」 ことを分けて見る必要がある
    let 添字を読んだ = 0;
    let 長さを読んだ = 0;
    const 巨大 = new Proxy([] as unknown[], {
      get(t, k, r) {
        if (k === "length") {
          長さを読んだ += 1;
          return 5_000_001;
        }
        if (typeof k === "string" && /^\d+$/.test(k)) 添字を読んだ += 1;
        return Reflect.get(t, k, r);
      },
    });

    const r = validateDragonJson(図の素({ 使わない項目: 巨大 }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.message).toContain("項目が多すぎる");
    expect(r.errors[0]?.path).toBe("$.使わない項目");
    expect(添字を読んだ, "添字を読んでから止まっている").toBe(0);
    expect(長さを読んだ, "長さを 2 度以上読んでいる").toBe(1);
  }, 30_000);

  it("長さが整数でない配列を ToLength と同じに扱う (Round 7)", () => {
    // `Array.from({ length })` は仕様の `ToLength` を通す。 生の値をそのまま使うと
    // 2.5 で 3 回読む
    const 端数 = new Proxy(["a", "b", "c"] as unknown[], {
      get(t, k, r) {
        if (k === "length") return 2.5;
        return Reflect.get(t, k, r);
      },
    });
    const r = validateDragonJson(図の素({ 使わない項目: 端数 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.data as unknown as Record<string, unknown[]>).使わない項目).toEqual(["a", "b"]);
  });

  it("長さが数でない配列は空として扱い、 読み続けない (Round 7)", () => {
    // `NaN` を返すと数の合計が `NaN` になり、 上限も終わりも判定できず読み続ける
    let 添字を読んだ = 0;
    const 壊れた = new Proxy(["a", "b"] as unknown[], {
      get(t, k, r) {
        if (k === "length") return NaN;
        if (typeof k === "string" && /^\d+$/.test(k)) 添字を読んだ += 1;
        return Reflect.get(t, k, r);
      },
    });
    const r = validateDragonJson(図の素({ 使わない項目: 壊れた }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.data as unknown as Record<string, unknown[]>).使わない項目).toEqual([]);
    expect(添字を読んだ, "読み続けている").toBe(0);
  }, 20_000);

  it("長さが BigInt の配列は誤りとして返す (Round 8)", () => {
    // 仕様の `ToNumber` は `BigInt` で `TypeError` を投げる = `Array.from({ length: 2n })` は
    // 投げる。 `Number()` は通してしまうため、 単項 `+` を使って元の挙動と揃える
    const bigint長 = new Proxy(["a", "b", "c"] as unknown[], {
      get(t, k, r) {
        if (k === "length") return 2n;
        return Reflect.get(t, k, r);
      },
    });
    const r = validateDragonJson(図の素({ 使わない項目: bigint長 }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.message).toBe("入力を読み取れない");
    expect(r.errors[0]?.hint).toContain("BigInt");
  });

  it("長さが負の配列も空として扱い、 数の残りを増やさない (Round 7)", () => {
    const 負を作る = (長さ: number): unknown[] =>
      new Proxy(["a"] as unknown[], {
        get(t, k, r) {
          if (k === "length") return 長さ;
          return Reflect.get(t, k, r);
        },
      });

    // 空として写る
    const r1 = validateDragonJson(図の素({ 使わない項目: 負を作る(-5) }));
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    expect((r1.data as unknown as Record<string, unknown[]>).使わない項目).toEqual([]);

    // **数の残りを増やさない**。 0 に寄せずに足すと、 大きな負の長さで上限の判定を無効にできる
    const 巨大 = new Proxy([] as unknown[], {
      get(t, k, r) {
        if (k === "length") return 5_000_001;
        return Reflect.get(t, k, r);
      },
    });
    const r2 = validateDragonJson(図の素({ 使わない項目: [負を作る(-1e15), 巨大] }));
    expect(r2.ok, "負の長さで上限の判定が無効になっている").toBe(false);
    if (r2.ok) return;
    expect(r2.errors[0]?.message).toContain("項目が多すぎる");
  }, 20_000);

  it("普通の大きさの配列は通る", () => {
    const 並び = Array.from({ length: 1000 }, (_, i) => i);
    const r = validateDragonJson(図の素({ 使わない項目: 並び }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const 写し = (r.data as unknown as Record<string, number[]>).使わない項目;
    expect(写し.length).toBe(1000);
    expect(写し[999]).toBe(999);
  });

  it("名前だけを大量に並べる形も数の上限で止める (Round 5)", () => {
    // 値を読む前に名前の一覧を作るため、 値だけを数えると「名前が多い段を深く降りる」 形で
    // 上限を見る前に資源を使い切れる (Round 5 の実測 = 値を 63 回しか読まない間に 126 万個)
    let 並べた数 = 0;
    const 名前が多い = (深さ: number): unknown => {
      const 名前 = Array.from({ length: 20_000 }, (_, i) => `k${i}`);
      return new Proxy(
        {},
        {
          ownKeys: () => {
            並べた数 += 名前.length;
            return 名前;
          },
          getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
          get: () => (深さ > 0 ? 名前が多い(深さ - 1) : 1),
        },
      );
    };

    const r = validateDragonJson(図の素({ 使わない項目: 名前が多い(60) }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.message).toContain("項目が多すぎる");
    // 上限を大きく超えて並べていないこと (名前を数えていないと 126 万で止まらない)
    expect(並べた数, `${並べた数} 個並べた`).toBeLessThanOrEqual(5_020_000);
  }, 60_000);

  it("読まれるたびに枝を生やす Proxy を、 数の上限で止める (Round 4)", () => {
    // Proxy は読まれるたびに新しい object を返せるため、 小さな入力から枝を生やせる。
    // 深さの上限だけでは横の広がりを止められない (実測 = 深さ 6 / 6 分岐で 55,987 個)
    let 作った数 = 0;
    const 生やす = (深さ: number): unknown =>
      new Proxy(
        {},
        {
          ownKeys: () => ["a", "b", "c", "d", "e", "f", "g", "h"],
          getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
          get: () => {
            作った数 += 1;
            return 深さ > 0 ? 生やす(深さ - 1) : 1;
          },
        },
      );

    const r = validateDragonJson(図の素({ 使わない項目: 生やす(30) }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    // 深さの上限か数の上限のどちらかで止まる。 どちらでも「止まる」 ことが要点
    expect(
      (r.errors[0]?.message ?? "").match(/項目が多すぎる|入れ子が深すぎる/) !== null,
      `止まらずに ${作った数} 個作った`,
    ).toBe(true);
  }, 60_000);

  it("普通の大きさの入れ子は通る", () => {
    // 上限を厳しくしすぎて正当な図を弾いていないことを見る
    const 入れ子: Record<string, unknown> = {};
    let 先 = 入れ子;
    for (let i = 0; i < 30; i += 1) {
      const 次: Record<string, unknown> = {};
      先.next = 次;
      先 = 次;
    }
    expect(validateDragonJson(図の素({ 使わない項目: 入れ子 })).ok).toBe(true);
  });
});

describe("読み取りの誤りの出し方 (Round 2)", () => {
  it("失効した Proxy を渡しても throw しない (r1-f1)", () => {
    // `Array.isArray` は失効した Proxy で `TypeError` を投げる。 root の形を写しより先に
    // 見ていると、 その判定が外へ出て約束が破れる
    const { proxy, revoke } = Proxy.revocable(図の素({ states: { amount: 0 } }), {});
    revoke();
    const r = validateDragonJson(proxy);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.message).toBe("入力を読み取れない");
  });

  it("投げた場所を path で示す (r1-f1)", () => {
    // `$` としか言えないと、 大きな図でどの項目が原因か追えない
    const 素 = 図の素({ states: { amount: 0 } }) as Record<string, unknown>;
    const 入れ子: Record<string, unknown> = {};
    Object.defineProperty(入れ子, "壊れた項目", {
      enumerable: true,
      configurable: true,
      get() {
        throw new Error("boom");
      },
    });
    素.使わない項目 = 入れ子;

    const r = validateDragonJson(素);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.path).toBe("$.使わない項目.壊れた項目");
  });

  it("配列の中で投げた場所も path で示す (r1-f1)", () => {
    const 並び: unknown[] = [{ ok: 1 }];
    Object.defineProperty(並び, "1", {
      enumerable: true,
      configurable: true,
      get() {
        throw new Error("boom");
      },
    });
    const r = validateDragonJson(図の素({ 使わない項目: 並び }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.path).toBe("$.使わない項目[1]");
  });

  it("兄弟の項目を書いた順に読む (r1-f2 の fix が順を変えていない)", () => {
    // `pop` で取り出すと兄弟の順が逆になり、 値を返す関数が副作用を持つ入力で写しの中身が
    // 変わる。 読んだ順を記録して確かめる
    const 読んだ順: string[] = [];
    const 見る = (名: string): Record<string, unknown> => {
      const o: Record<string, unknown> = {};
      Object.defineProperty(o, "印", {
        enumerable: true,
        configurable: true,
        get() {
          読んだ順.push(名);
          return 名;
        },
      });
      return o;
    };
    const r = validateDragonJson(
      図の素({ 使わない項目: { 甲: 見る("甲"), 乙: 見る("乙"), 丙: 見る("丙") } }),
    );
    expect(r.ok).toBe(true);
    expect(読んだ順).toEqual(["甲", "乙", "丙"]);
  });

  it("同じ object を 2 か所から指しても 1 つの写しを共有する", () => {
    const 共有 = { 値: 1 };
    const r = validateDragonJson(図の素({ 使わない項目: { 甲: 共有, 乙: 共有 } }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const 写し = (r.data as unknown as Record<string, Record<string, unknown>>).使わない項目;
    expect(写し.甲).toBe(写し.乙);
    expect(写し.甲).not.toBe(共有);
  });
});

describe("読む順は書いた順で深さ優先 (Round 3)", () => {
  /** 読まれた時に名前を記録する項目を持つ object を作る */
  const 見る = (
    読んだ順: string[],
    名: string,
    中身: Record<string, unknown> = {},
  ): Record<string, unknown> => {
    const o: Record<string, unknown> = { ...中身 };
    Object.defineProperty(o, "印", {
      enumerable: true,
      configurable: true,
      get() {
        読んだ順.push(名);
        return 名;
      },
    });
    return o;
  };

  it("深さの違う兄弟でも、 先の兄弟の中を全部読んでから次の兄弟へ行く", () => {
    // 幅優先で回すと、 先に書いた兄弟の深い所より後の兄弟の浅い所を先に読む
    const 読んだ順: string[] = [];
    const 甲 = 見る(読んだ順, "甲", { 中: 見る(読んだ順, "甲の中") });
    const 乙 = 見る(読んだ順, "乙");
    const r = validateDragonJson(図の素({ 使わない項目: { 甲, 乙 } }));
    expect(r.ok).toBe(true);
    expect(読んだ順).toEqual(["甲の中", "甲", "乙"]);
  });

  it("3 段の入れ子でも書いた順のまま降りる", () => {
    const 読んだ順: string[] = [];
    const 素 = {
      甲: 見る(読んだ順, "甲", { 中: 見る(読んだ順, "甲の中", { 奥: 見る(読んだ順, "甲の奥") }) }),
      乙: 見る(読んだ順, "乙", { 中: 見る(読んだ順, "乙の中") }),
    };
    const r = validateDragonJson(図の素({ 使わない項目: 素 }));
    expect(r.ok).toBe(true);
    expect(読んだ順).toEqual(["甲の奥", "甲の中", "甲", "乙の中", "乙"]);
  });

  it("root が配列の入力は、 中を読まずに root の形の誤りとして返す", () => {
    // 写しを先に作ると配列の中の getter が動き、 誤りが `入力を読み取れない` に化ける
    let 読んだ = false;
    const 並び: unknown[] = [];
    Object.defineProperty(並び, "0", {
      enumerable: true,
      configurable: true,
      get() {
        読んだ = true;
        throw new Error("読んではいけない");
      },
    });
    const r = validateDragonJson(並び);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]?.message).toBe("root must be a JSON object");
    expect(読んだ, "root の形を見る前に中を読んでいる").toBe(false);
  });
});
