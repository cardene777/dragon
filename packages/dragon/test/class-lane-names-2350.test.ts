/*
 * クラス図で縦列を宣言しても、空の列が増えないことを見る (#2350)。
 *
 * クラス図は箱に書いた `lane:` を列の番号として読み、自分で `col-0` / `col-1` の列を作る。
 * 書いた名前はどこにも残らないため、**`lanes:` で宣言するとその名前の列が別に作られ、
 * 空のまま図に残っていた**。
 *
 * ```
 * 宣言なし  縦列 2 件: col-0(幅 450) col-1(幅 450)
 * 宣言あり  縦列 4 件: col-0(幅 450) col-1(幅 450) c0(幅 320) c1(幅 320)
 * ```
 *
 * 書いた幅は箱の入っていない方に付き、箱の入る列は既定のままだった。
 * 「どの箱も入らない縦列です」 の知らせも列の数だけ出ていた
 * (書いた人は全ての箱をその列に入れている)。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

/** 箱 3 つを 2 つの列へ入れたクラス図。 `宣言` を付けると `lanes:` を書く */
function 本文(opts: { 宣言: boolean; 幅?: number; 空の列?: boolean }): string {
  const 幅 = opts.幅 ?? 320;
  const 列 = [`  c0: { width: ${幅} }`, `  c1: { width: ${幅} }`];
  if (opts.空の列 === true) 列.push(`  c2: { width: ${幅} }`);
  return `title: "クラスの図"
type: class
${opts.宣言 ? `\nlanes:\n${列.join("\n")}\n` : ""}
actors:
  - 注文: { lane: c0, stack: 0, rows: ["番号: 数"] }
  - 明細: { lane: c0, stack: 1, rows: ["個数: 数"] }
  - 顧客: { lane: c1, stack: 0, rows: ["名前: 文字"] }

flow:
  - 注文 -> 明細: "持つ"
  - 顧客 -> 注文: "出す"
`;
}

type 結果 = {
  列: { id: string; width: number }[];
  箱の列: string;
  空の知らせ: number;
};

function 組む(src: string): 結果 {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  let 空の知らせ = 0;
  const d = compileToCdl(p.doc, {
    onNotice: (n) => {
      if (n.kind === "lane-declared-empty") 空の知らせ += 1;
    },
  });
  const 列 = (d.lanes as ReadonlyArray<{ id: string; width: number }>).map((l) => ({
    id: l.id,
    width: l.width,
  }));
  const 箱 = d.nodes as ReadonlyArray<{ id: string; lane?: string }>;
  return { 列, 箱の列: 箱.map((n) => `${n.id}@${n.lane ?? "-"}`).join(" "), 空の知らせ };
}

describe("クラス図で縦列を宣言しても、空の列が増えない (#2350)", () => {
  const 宣言なし = 組む(本文({ 宣言: false }));
  const 宣言あり = 組む(本文({ 宣言: true }));

  it("列を 1 本以上作れている (空振り防止)", () => {
    expect(宣言なし.列.length, "宣言なしで列が 0 本").toBeGreaterThan(0);
    expect(宣言あり.列.length, "宣言ありで列が 0 本").toBeGreaterThan(0);
  });

  it("宣言しても列の数が変わらない", () => {
    expect(宣言あり.列.length, `宣言なし ${宣言なし.列.length} 本`).toBe(宣言なし.列.length);
  });

  it("宣言した名前が、箱の入る列の名前になる", () => {
    expect(宣言あり.列.map((l) => l.id)).toEqual(["c0", "c1"]);
    expect(宣言あり.箱の列).toBe("注文@c0 明細@c0 顧客@c1");
  });

  it("宣言に書いた幅が、箱の入る列の幅になる", () => {
    const 違う = 宣言あり.列.filter((l) => l.width !== 320).map((l) => `${l.id}: ${l.width}`);
    expect(違う, `列 ${宣言あり.列.length} 本`).toEqual([]);
  });

  it("幅を変えると、その値がそのまま列に届く (植え込み対照)", () => {
    // 320 がたまたま既定と一致していると、上の検査は何もしなくても通る
    const 別の幅 = 組む(本文({ 宣言: true, 幅: 500 }));
    expect(別の幅.列.map((l) => l.width)).toEqual([500, 500]);
    expect(宣言なし.列.every((l) => l.width !== 500), "宣言なしの幅が 500 と同じ").toBe(true);
  });

  it("箱を入れた列に「どの箱も入らない」 の知らせが出ない", () => {
    expect(宣言あり.空の知らせ, `列 ${宣言あり.列.length} 本`).toBe(0);
  });

  it("本当に箱が 1 つも入らない列では、知らせが引き続き出る", () => {
    // 0 件を期待する上の検査だけだと、知らせを止めれば通ってしまう
    const 空あり = 組む(本文({ 宣言: true, 空の列: true }));
    expect(空あり.空の知らせ, "使わない列を宣言しても知らせが出ない").toBe(1);
  });

  it("宣言しない図の列の名前と数が変わらない", () => {
    // 付け替えるのは宣言した名前だけ。 宣言しない図は組み立て器の名前のまま
    expect(宣言なし.列.map((l) => l.id)).toEqual(["col-0", "col-1"]);
    expect(宣言なし.箱の列).toBe("注文@col-0 明細@col-0 顧客@col-1");
  });
});
