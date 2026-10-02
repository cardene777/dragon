/*
 * 行を持つ図の「書かなかった時の既定」 が、書き方で変わらないことを見る (#2352 / #2782)。
 *
 * 畳む前は 2 つの経路があり、動きも縦列も書かない図は組み立て器を通り、どちらかを書いた
 * 図は共通の組み立てを通っていた。 実測 = **2 つで既定が揃っておらず**、同じ本文でも
 * 動きの段を 1 つ足すだけで箱が札の形から人の形に変わっていた。
 *
 * 経路は 1 本になった (#2782) が、既定は 4 通りの書き方で揃っている必要がある。
 * 縦列の有無と動きの有無を掛け合わせた 4 通りを回す。
 *
 * ## 畳んだ後の既定
 *
 * | 書いたもの | 箱の形 | 札 |
 * |---|---|---|
 * | 何も書かない | 札 (`card`) | 付かない |
 * | 行を書いた | 表の箱 (`storage`) | 付かない |
 * | 始まりか終わりを書いた | 変わらない | 書いた箱に 初期 / 最終 |
 *
 * **札を配る既定は持たない**。 畳む前は並びの最初と最後を始まり / 終わりとみなし、残りの
 * 箱へ「状態」 の字を配っていた。 畳んだ後も同じ形にすると、行を並べた表の箱に「状態」 の
 * 字が出る = 書いた人が言っていないことを図が名乗る。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

type 書き方 = { 縦列: boolean; 動き: boolean };

const 書き方一覧: 書き方[] = [
  { 縦列: false, 動き: false },
  { 縦列: false, 動き: true },
  { 縦列: true, 動き: false },
  { 縦列: true, 動き: true },
];

const 呼び名 = (w: 書き方): string => `縦列${w.縦列 ? "有" : "無"}・動き${w.動き ? "有" : "無"}`;

/** 行を持つ図の本文。 `欄` を渡すと全ての箱にその欄を書く */
function 本文(w: 書き方, 欄?: string): string {
  const 名 = ["受付", "審査", "完了"];
  const 箱 = 名.map((n, i) => {
    const 中身 = [
      ...(欄 === undefined ? [] : [欄]),
      ...(w.縦列 ? [`lane: c${i === 2 ? 1 : 0}`, `stack: ${i === 2 ? 0 : i}`] : []),
    ];
    return 中身.length === 0 ? `  - ${n}` : `  - ${n}: { ${中身.join(", ")} }`;
  });
  return `title: "行を持つ図"
type: record
${w.縦列 ? "\nlanes:\n  c0: { width: 320 }\n  c1: { width: 320 }\n" : ""}
actors:
${箱.join("\n")}

flow:
  - 受付 -> 審査: "提出"
  - 審査 -> 完了: "承認"
${
  w.動き
    ? `
animation:
  - step: "進む" 1.2s
    focus: ["受付", "審査"]
    description: "受付から審査へ進む"
`
    : ""
}`;
}

/** 箱の形だけを 1 本の字にする */
function 箱の形だけ(src: string): string {
  return 形と札(src).replace(/:[^\s]*/gu, "");
}

/** 箱の形と札を 1 本の字にする */
function 形と札(src: string): string {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  const d = compileToCdl(p.doc, { onNotice: () => {} });
  const 箱 = d.nodes as ReadonlyArray<{ id: string; kind?: string; eyebrow?: string }>;
  return 箱.map((n) => `${n.id}[${n.kind ?? "-"}]:${n.eyebrow ?? "-"}`).join(" ");
}

describe("行を持つ図の書かなかった時の既定が、書き方で変わらない (#2352 / #2782)", () => {
  it("書き方を走査できている (空振り防止)", () => {
    expect(書き方一覧.length, "書き方を 1 件も持っていない").toBe(4);
  });

  it("種類を書かない図の箱の形が、4 通りとも同じ", () => {
    const 結果 = 書き方一覧.map((w) => ({ w, 形: 箱の形だけ(本文(w)) }));
    const 基準 = 結果[0]!;
    const 違う = 結果
      .filter((r) => r.形 !== 基準.形)
      .map((r) => `${呼び名(r.w)}: ${r.形} (基準 ${呼び名(基準.w)}: ${基準.形})`);
    expect(違う, `走査 ${結果.length} 通り`).toEqual([]);
  });

  it("行を書かない箱は札の形になる (4 通りとも)", () => {
    // 揃っているだけでは足りない。 4 通りとも人の形に倒しても「同じ」 は通る
    const 違う = 書き方一覧
      .map((w) => ({ w, 形: 形と札(本文(w)) }))
      .filter(({ 形 }) => !形.includes("[card]"))
      .map(({ w, 形 }) => `${呼び名(w)}: ${形}`);
    expect(違う, "既定の形 = card").toEqual([]);
  });

  it("行を書いた箱は表の箱になる (4 通りとも)", () => {
    const 違う = 書き方一覧
      .map((w) => ({ w, 形: 形と札(本文(w, 'rows: ["id: bigint"]')) }))
      .filter(({ 形 }) => !形.includes("[storage]"))
      .map(({ w, 形 }) => `${呼び名(w)}: ${形}`);
    expect(違う, "行を書いた箱の形 = storage").toEqual([]);
  });

  it("何も書かない図に札が付かない (4 通りとも)", () => {
    const 付いた = 書き方一覧
      .map((w) => ({ w, 形: 形と札(本文(w)) }))
      .filter(({ 形 }) => !/^(\S+\[card\]:-)( \S+\[card\]:-)*$/u.test(形))
      .map(({ w, 形 }) => `${呼び名(w)}: ${形}`);
    expect(付いた, `走査 ${書き方一覧.length} 通り`).toEqual([]);
  });

  it("始まりと終わりを書いた箱に札が付き、書かない箱には付かない", () => {
    const 形 = 形と札(`title: "行を持つ図"
type: record

actors:
  - 受付: { initial: true }
  - 審査
  - 完了: { final: true }

flow:
  - 受付 -> 審査: "提出"
  - 審査 -> 完了: "承認"
`);
    expect(形).toBe("受付[card]:初期 審査[card]:- 完了[card]:最終");
  });

  it("印の形を書いた箱には札が付かない (4 通りとも)", () => {
    /*
     * 印の箱 (`mark-start` / `mark-end`) は形そのものが始点と終点を表す。
     * 字を重ねると同じことを 2 度言う = 実測で、既定を無条件に配った時に
     * 印の箱へ「初期」 の字が出て見本が壊れた (#2349 の突き合わせが 2 件落ちた)。
     */
    const 付いた = 書き方一覧
      .map((w) => ({ w, 形: 形と札(本文(w, "kind: mark-start")) }))
      .filter(({ 形 }) => !/^\S+\[mark-start\]:-( \S+\[mark-start\]:-)*$/u.test(形))
      .map(({ w, 形 }) => `${呼び名(w)}: ${形}`);
    expect(付いた, `走査 ${書き方一覧.length} 通り`).toEqual([]);
  });

  it("書いた種類はそのまま通る (4 通りとも)", () => {
    // 既定を引く処理が、書いた種類を上書きしていないこと
    const 上書き = 書き方一覧
      .map((w) => ({ w, 形: 形と札(本文(w, "kind: storage")) }))
      .filter(({ 形 }) => !形.includes("[storage]"))
      .map(({ w, 形 }) => `${呼び名(w)}: ${形}`);
    expect(上書き, `走査 ${書き方一覧.length} 通り`).toEqual([]);
  });

  it("形と札の見方が違いを見つけられる (植え込み対照)", () => {
    // 種類を書いた図と書かない図は形が違う。 ここが同じに見えるなら、
    // 上の検査は何を比べても通る形に壊れている
    const w = { 縦列: false, 動き: true };
    expect(形と札(本文(w)), "種類を書いても書かなくても同じに見えている").not.toBe(
      形と札(本文(w, "kind: storage")),
    );
  });
});
