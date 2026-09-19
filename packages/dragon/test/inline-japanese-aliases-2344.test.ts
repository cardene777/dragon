/*
 * 箱の日本語の項目名が、書く形で読めたり読めなかったりしないことを見る (#2344)。
 *
 * 記法は箱の項目名を日本語でも読む (#1026 / #1301) が、**中括弧の別名が手で並んでいた**ため、
 * 英語の欄を中括弧に足した日 (`title` は #1381、`tone` は #1969、`shape` は #1374) に
 * 日本語名だけが取り残された。 実測 = `- 受付: { 題: "うけつけ" }` は「項目名が読めません」 で
 * 落ち、同じ内容を段を分けて書くか、中括弧のまま `title:` と書けば読める。
 *
 * ## 対応を実装から導く
 *
 * 日本語名と英語名の対応は **記法を実際に読んで導く** = 同じ値を段を分けた形で書き、
 * **出来上がった箱が 1 文字も違わない英語名**を相手とする。 表を手で並べて突き合わせると、
 * 表が 1 つ増えるだけで同じ食い違いが起きる。
 *
 * 入る欄ではなく相手の**項目名**で組にするのは、1 つの名前が複数の欄を書くことがあるため。
 * `大きさ` は `posW` と `posH` を書くので、欄で組にすると `posW` と対になって
 * 「中括弧で読めるはず」 と誤判定する (実測)。 `size` と組にすれば、どちらも中括弧では
 * 読めないので揃っていると分かる。
 *
 * 相手を見つけられなかった名前は 0 件に潰さず、件数と名前を出す。 見本の値が悪くて
 * 読めないだけの時に「食い違い 0 件」 と読めてしまうため。
 */
import { describe, expect, it } from "vitest";
import {
  ACTOR_ITEM_ALIASES,
  ACTOR_ITEM_KEYS,
  INLINE_ACTOR_ALIASES,
  INLINE_ACTOR_KEYS,
  parseTextDslV05,
  PARTS_ONLY_ITEM_KEYS,
} from "../src/v05/parser";

const ASCIIだけ = (s: string): boolean => [...s].every((c) => (c.codePointAt(0) ?? 0) < 128);

const 全項目 = [...ACTOR_ITEM_KEYS];
/** 段を分けた形で読める日本語の項目名 */
const 日本語の項目 = 全項目.filter((k) => !ASCIIだけ(k));
const 英語の項目 = 全項目.filter(ASCIIだけ);

/**
 * 各項目に書く見本の値。
 *
 * **読める値を書く** = 読めない値だと相手を見つけられず、下の検査で「見つからない」 側に出る。
 * 値の形が変わったらここも直す (落ちた時に名前が出る)。
 */
const 見本の値: Record<string, string> = {
  種類: "service",
  題: '"だい"',
  補足: '"ほそく"',
  色: "error",
  行: "[いち, に]",
  印: "start",
  大きさ: "900,400",
  図形: "{ kind: rect, source: 10, fillMax: 100 }",
  値: "10",
  前の値: "5",
  位置: "B の右 200",
  倍率: "1.5",
  出す条件: "x > 1",
};

const 頭 = `title: "t"\ntype: flow\n`;

/** 段を分けた形で 1 項目だけ書いた箱。 読めなければ `null` */
function 段を分けた箱(k: string, v: string): string | null {
  const p = parseTextDslV05(`${頭}actors:\n  - A:\n      ${k}: ${v}\n  - B\nflow:\n  - A -> B: "r"\n`);
  if (!p.ok) return null;
  const a = p.doc.actors.find((x) => x.name === "A");
  if (a === undefined) return null;
  const { pos: _行番号, ...中身 } = a as unknown as Record<string, unknown>;
  return JSON.stringify(中身);
}

/** 中括弧に 1 項目だけ書いた箱。 読めなければ `null` */
function 中括弧の箱(k: string, v: string): string | null {
  const p = parseTextDslV05(`${頭}actors:\n  - A: { ${k}: ${v} }\n  - B\nflow:\n  - A -> B: "r"\n`);
  if (!p.ok) return null;
  const a = p.doc.actors.find((x) => x.name === "A");
  if (a === undefined) return null;
  const { pos: _行番号, ...中身 } = a as unknown as Record<string, unknown>;
  return JSON.stringify(中身);
}

/** 中括弧に書いた項目名が「読めません」 と言われるか */
function 中括弧で弾かれる(k: string, v: string): boolean {
  const p = parseTextDslV05(`${頭}actors:\n  - A: { ${k}: ${v} }\n  - B\nflow:\n  - A -> B: "r"\n`);
  if (p.ok) return false;
  return p.errors.some((e) => e.message.includes("項目名が読めません"));
}

/** 同じ箱になる英語名で組にした対応と、相手を見つけられなかった名前 */
function 対応を導く(): { 対応: { 日: string; 英: string }[]; 見つからない: string[] } {
  const 対応: { 日: string; 英: string }[] = [];
  const 見つからない: string[] = [];
  for (const 日 of 日本語の項目) {
    // 部品だけに効く名前は箱の欄を持たない (#1026)。 別経路 (`reportScaleOnNonPart`) が知らせる
    if (PARTS_ONLY_ITEM_KEYS.has(日)) continue;
    const v = 見本の値[日] ?? "x";
    const 和 = 段を分けた箱(日, v);
    const 英 = 和 === null ? undefined : 英語の項目.find((e) => 段を分けた箱(e, v) === 和);
    if (英 === undefined) {
      見つからない.push(日);
      continue;
    }
    対応.push({ 日, 英 });
  }
  return { 対応, 見つからない };
}

describe("箱の日本語の項目名が、書く形で読めたり読めなかったりしない (#2344)", () => {
  const { 対応, 見つからない } = 対応を導く();

  it("日本語の項目名を走査できている (空振り防止)", () => {
    expect(日本語の項目.length, "日本語の項目名を 1 件も拾えていない").toBeGreaterThan(0);
    expect(英語の項目.length, "英語の項目名を 1 件も拾えていない").toBeGreaterThan(0);
    expect(
      対応.length,
      `走査 ${日本語の項目.length} 件 / 組にできた ${対応.length} 件 / できない ${見つからない.join(" ")}`,
    ).toBeGreaterThan(0);
  });

  it("同じ箱になる英語名を見つけられなかった日本語名が無い", () => {
    // 0 件に潰さない。 見本の値が悪くて読めないだけの時に、下の検査が「食い違い 0 件」 で通る
    expect(見つからない, `走査 ${日本語の項目.length} 件`).toEqual([]);
  });

  it("英語名が中括弧で読めるなら、日本語名も中括弧で読める", () => {
    const 食い違い = 対応
      .filter(({ 日, 英 }) => INLINE_ACTOR_KEYS.has(英) && 中括弧で弾かれる(日, 見本の値[日] ?? "x"))
      .map(({ 日, 英 }) => `${日} (${英})`);
    expect(食い違い, `組にできた ${対応.length} 件`).toEqual([]);
  });

  it("英語名が中括弧で読めないなら、日本語名も中括弧で読めない", () => {
    // 逆向きも見る。 片方向だけだと、別名をやみくもに足しても通ってしまう
    const 食い違い = 対応
      .filter(({ 日, 英 }) => !INLINE_ACTOR_KEYS.has(英) && !中括弧で弾かれる(日, 見本の値[日] ?? "x"))
      .map(({ 日, 英 }) => `${日} (${英})`);
    expect(食い違い, `組にできた ${対応.length} 件`).toEqual([]);
  });

  it("中括弧で読める日本語名は、英語名で書いたのと同じ箱になる", () => {
    const 違う = 対応
      .filter(({ 英 }) => INLINE_ACTOR_KEYS.has(英))
      .filter(({ 日, 英 }) => {
        const v = 見本の値[日] ?? "x";
        return 中括弧の箱(日, v) !== 中括弧の箱(英, v);
      })
      .map(({ 日, 英 }) => `${日} (${英})`);
    expect(違う, `組にできた ${対応.length} 件`).toEqual([]);
  });

  it("中括弧で英語と日本語を併記したら英語が勝つ", () => {
    // 1 行に同居できるので、どちらを採るかを決めておく (縦に並べた形は後勝ち)
    const p = parseTextDslV05(
      `${頭}actors:\n  - A: { title: "えい", 題: "わ" }\n  - B\nflow:\n  - A -> B: "r"\n`,
    );
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.doc.actors.find((x) => x.name === "A")?.title).toBe("えい");
  });

  it("対応の表が、段を分けた形で読める日本語名を全て持つ", () => {
    // 表に無い名前が増えると、中括弧の別名を導く元が欠ける
    const 表に無い = 日本語の項目
      .filter((k) => !PARTS_ONLY_ITEM_KEYS.has(k))
      .filter((k) => !Object.hasOwn(ACTOR_ITEM_ALIASES, k));
    expect(表に無い, `走査 ${日本語の項目.length} 件`).toEqual([]);
  });

  it("対応の表に、段を分けた形で読めない日本語名が残っていない", () => {
    // 逆向き。 欄を外した日に表だけが残ると、次に消えた時に気付けない
    const 実物に無い = Object.keys(ACTOR_ITEM_ALIASES).filter((k) => !ACTOR_ITEM_KEYS.has(k));
    expect(実物に無い, `表 ${Object.keys(ACTOR_ITEM_ALIASES).length} 件`).toEqual([]);
  });

  it("対応の表の組が、記法を読んだ結果と一致する", () => {
    // 表の英語名が実物と違っても、下の絞り込みは通ってしまう。 実際に読んで突き合わせる
    const 違う = Object.entries(ACTOR_ITEM_ALIASES)
      .filter(([日, 英]) => {
        const v = 見本の値[日] ?? "x";
        const 和 = 段を分けた箱(日, v);
        return 和 === null || 和 !== 段を分けた箱(英, v);
      })
      .map(([日, 英]) => `${日} (${英})`);
    expect(違う, `表 ${Object.keys(ACTOR_ITEM_ALIASES).length} 件`).toEqual([]);
  });

  it("中括弧の別名が、英語が中括弧で読める欄だけに絞られている", () => {
    const 絞れていない = Object.entries(INLINE_ACTOR_ALIASES)
      .filter(([, 英]) => !INLINE_ACTOR_KEYS.has(英))
      .map(([日, 英]) => `${日} (${英})`);
    expect(絞れていない, `別名 ${Object.keys(INLINE_ACTOR_ALIASES).length} 件`).toEqual([]);
    // 絞り込みが効いている = 表より別名の方が少ない (`位置` / `大きさ` が落ちる)
    expect(
      Object.keys(INLINE_ACTOR_ALIASES).length,
      "絞り込みで 1 件も落ちていない (英語側の判定が効いていない)",
    ).toBeLessThan(Object.keys(ACTOR_ITEM_ALIASES).length);
  });

  it("中括弧で読めない日本語名は、段を分けて書けば効くと知らせる", () => {
    // 「使える項目 = 」 に英語名を並べるだけだと、同じ名前が別の形で効くことが伝わらない
    const p = parseTextDslV05(
      `${頭}actors:\n  - A: { 位置: B の右 200 }\n  - B\nflow:\n  - A -> B: "r"\n`,
    );
    expect(p.ok).toBe(false);
    if (p.ok) return;
    const e = p.errors.find((x) => x.message.includes("項目名が読めません"));
    expect(e, "知らせが出ていない").toBeDefined();
    expect(e?.hint ?? "", `補足: ${e?.hint ?? ""}`).toContain("段を分けた形");
  });
});
