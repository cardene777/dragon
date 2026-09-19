import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import {
  PART_INLINE_UNREADABLE_KEYS,
  ACTOR_RESERVED_FIELDS,
  INLINE_ACTOR_KEYS,
} from "../src/v05/parser";

/**
 * 部品の 1 行の形で、予約されているのにどの欄も読まない名前を知らせることの検証 (#1996)。
 *
 * 部品の中括弧に書いた名前は状態の上書きとして意味を持つため、知らせる側は部品では何もせずに
 * 戻っていた。 一方 `位置` / `大きさ` / `色` は予約の一覧に載っているので状態の上書きからも
 * 外れる。 どの欄も読まず、状態にも入らず、誰も知らせない隙間に落ちていた。
 *
 * 実測 = `- 甲: { kind: edge-chain, 大きさ: 900,400 }` と書いても、書かない時と 1 ピクセルも
 * 変わらない (どちらも `viewBox 1951x552` / 部品の幅 896) うえ、知らせが 1 件も出なかった。
 * 同じ語を段を分けた形で書けば効き、普通の箱に 1 行で書けば「項目名が読めません」 と出る。
 */

const 解析 = (actors: string) => parseTextDslV05(`title: "t"\ntype: flow\n\nactors:\n${actors}\n`);

/** 読めない項目名の知らせだけを取り出す。 誤りが 0 件なら空 (`ok: true` で `errors` を持たない) */
const 読めない項目 = (r: ReturnType<typeof parseTextDslV05>): string[] =>
  r.ok
    ? []
    : r.errors.filter((e) => e.message.includes("項目名が読めません")).map((e) => e.message);

/** 解析できた時の最初の箱。 失敗していたら `undefined` */
const 最初の箱 = (r: ReturnType<typeof parseTextDslV05>) => (r.ok ? r.doc.actors[0] : undefined);

describe("部品の 1 行の形で読まない予約名を知らせる (#1996)", () => {
  // `色` はここに居たが、英語側 (`color` / `tone`) が中括弧で読めるようになった時
  // (#1969) に取り残されていただけだった (#2344 で読める側へ移した)
  for (const [key, 値] of [
    ["位置", "300,200"],
    ["大きさ", "900,400"],
  ] as const) {
    it(`${key} を部品の 1 行の形に書くと知らせが出る`, () => {
      const r = 解析(`  - 甲: { kind: edge-chain, ${key}: ${値} }`);
      expect(読めない項目(r)).toEqual([`項目名が読めません: "${key}"`]);
    });
  }

  it("知らせは段を分けた形で書くよう案内する", () => {
    // 「読めません」 だけだと、どこにも書けないのか書く場所が違うのかが分からない。
    // 段を分けた形では効くので、行き先を示す
    const r = 解析(`  - 甲: { kind: edge-chain, 大きさ: 900,400 }`);
    const 知らせ = r.ok
      ? undefined
      : r.errors.find((e) => e.message.includes("項目名が読めません"));
    expect(知らせ?.hint, "案内が無い").toContain("段を分けた形");
  });

  it("読めない名前が複数あれば全部知らせる", () => {
    const r = 解析(`  - 甲: { kind: edge-chain, 位置: 300,200, 大きさ: 900,400 }`);
    expect(読めない項目(r)).toHaveLength(2);
  });
});

describe("部品の状態の上書きは今までどおり黙って通る (#1996)", () => {
  for (const [名, actor] of [
    ["見本が持つ状態の名前", `  - arc1: { kind: arc-gauge, v: 50, count: 100 }`],
    ["予約に無い名前", `  - arc1: { kind: arc-gauge, foo: 1 }`],
    ["箱の欄と同じ綴りの状態の名前", `  - arc1: { kind: arc-gauge, title: "あ", tone: success }`],
    ["状態の明示欄", `  - arc1: { kind: arc-gauge, state: { v: 50 } }`],
  ] as const) {
    it(`${名} では知らせない`, () => {
      expect(読めない項目(解析(actor))).toEqual([]);
    });
  }

  it("知らせないだけでなく、状態の上書きに実際に入る", () => {
    // 「知らせが 0 件」 だけだと、黙って捨てているのと区別が付かない
    const r = 解析(`  - arc1: { kind: arc-gauge, v: 50, count: 100 }`);
    expect(最初の箱(r)?.stateOverride, "状態の上書きが残っていない").toEqual({ v: 50, count: 100 });
  });

  it("状態の明示欄の値は実際に残る", () => {
    // 知らせないだけでなく、書いた値が効いていることを見る。 効かないなら知らせないのは誤り
    const r = 解析(`  - arc1: { kind: arc-gauge, state: { v: 50 } }`);
    expect(最初の箱(r)?.stateOverride, "状態の上書きが残っていない").toEqual({ v: 50 });
  });
});

describe("段を分けた形は今までどおり効く (#1996)", () => {
  const 段 = (中: string[]) =>
    parseTextDslV05(
      `title: "t"\ntype: flow\n\nactors:\n  - 甲:\n      kind: edge-chain\n${中.map((x) => `      ${x}`).join("\n")}\n`,
    );

  it("位置 と 大きさ が座標と幅高さに入る", () => {
    const r = 段(["位置: 300,200", "大きさ: 900,400"]);
    expect(読めない項目(r), "段を分けた形で知らせが出た").toEqual([]);
    const a = 最初の箱(r);
    expect([a?.posX, a?.posY, a?.posW, a?.posH]).toEqual([300, 200, 900, 400]);
  });

  it("色 が色として読まれる", () => {
    // 部品では色の名前が `partColorName` に入る。 色番号を入れる状態の名前は部品ごとに
    // 違うため、組み立て時に解決する
    const r = 段(["色: 失敗"]);
    expect(読めない項目(r), "段を分けた形で知らせが出た").toEqual([]);
    expect(最初の箱(r)?.partColorName, "色が入っていない").toBe("error");
  });
});

describe("知らせる名前を実物の 2 集合から導く (#1996)", () => {
  // 手で並べると、予約の一覧に名前を足した時に知らせだけが取り残される
  it("予約の一覧から 1 行で読める一覧と状態の明示欄を引いた差と一致する", () => {
    const 差 = [...ACTOR_RESERVED_FIELDS].filter((k) => !INLINE_ACTOR_KEYS.has(k) && k !== "state");
    expect([...PART_INLINE_UNREADABLE_KEYS].sort()).toEqual(差.sort());
  });

  it("差が 1 件以上ある (検査が空振りしていない)", () => {
    expect(PART_INLINE_UNREADABLE_KEYS.size).toBeGreaterThan(0);
  });

  it("導いた名前は 1 件残らず実際に知らせを出す", () => {
    // 集合に載っているのに知らせが出ない名前があれば、判定と集合がずれている
    let 測れた = 0;
    for (const key of PART_INLINE_UNREADABLE_KEYS) {
      const r = 解析(`  - 甲: { kind: edge-chain, ${key}: x }`);
      expect(読めない項目(r), `${key} で知らせが出ない`).toEqual([`項目名が読めません: "${key}"`]);
      測れた += 1;
    }
    expect(測れた, "1 件も測れていない (検査が空振りしている)").toBe(
      PART_INLINE_UNREADABLE_KEYS.size,
    );
  });

  it("1 行で読める名前は 1 件も知らせを出さない", () => {
    // 集合の外側からも挟む。 差の取り方を誤ると読める名前まで知らせに落ちる
    for (const key of INLINE_ACTOR_KEYS) {
      expect(
        PART_INLINE_UNREADABLE_KEYS.has(key),
        `${key} が読める一覧と知らせる一覧の両方にある`,
      ).toBe(false);
    }
  });
});

describe("普通の箱の知らせは変わらない (#1996)", () => {
  for (const key of ["位置", "大きさ"]) {
    it(`${key} を普通の箱の 1 行の形に書くと今までどおり知らせが出る`, () => {
      expect(読めない項目(解析(`  - A: { ${key}: "x" }`))).toEqual([
        `項目名が読めません: "${key}"`,
      ]);
    });
  }

  it("普通の箱の案内は使える項目の一覧のまま", () => {
    const r = 解析(`  - A: { label: "あ" }`);
    const 知らせ = r.ok
      ? undefined
      : r.errors.find((e) => e.message.includes("項目名が読めません"));
    expect(知らせ?.hint, "使える項目の一覧が消えた").toContain("使える項目 = ");
  });
});
