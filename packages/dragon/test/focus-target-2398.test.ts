/*
 * 段の注目先 (`focus:`) が書いたとおりに光らない時、なぜ光らないかを知らせる (#2398)。
 *
 * 注目先の検査は **記法にその名前が在るか** しか見ていなかった。 名前は在るので綴り違いの
 * 経路に落ちず、黙って通る。 書いた人には「書いたのに図も変わらず知らせも出ない」 だけが残る。
 *
 * ## 効くかどうかは手で並べず、書き分けて測る
 *
 * 図種ごとに「名前で相手を選べるか」 を一覧に書くと、図種を足した日に一覧だけが古くなる。
 * ここでは **2 通りの注目先を書いて、組み上がった段が分かれるか** で測る。 分かれるなら
 * その図種は書いた名前を見ており、分かれないなら何を書いても同じ図になる。
 *
 * 測ると 3 通りに分かれた (実測)。
 *
 * | 光り方 | 書き分けると | 知らせ |
 * |---|---|---|
 * | 書いた箱 / 矢印が光る (`flow` 等) | 分かれる | 出さない |
 * | 書いた名前に合う言づてまで板が進む (`sequence` / `solidity`) | 分かれる | 出さない |
 * | 図全体の 1 箱が光る (残る図種) | 分かれない | `focus-target-not-honored` |
 *
 * **板の 2 図種を「図に箱も矢印も無い」 だけで括らない**。 板は箱も矢印も作らないが、書いた
 * 名前は捨てられておらず板が何通目まで描くかを決めている。 図の中身だけを見ると、効いている
 * 指定に「選べません」 と知らせることになる。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import type { CompileNotice } from "../src/compile/notice";
import { parseTextDslV05, PRESET_TYPES } from "../src/v05/parser";

const 全図種 = [...PRESET_TYPES].sort();

/** 図種ごとに読める値。 値として読む図は語の形が決まっている */
const 読める値 = (図種: string): string =>
  図種 === "gantt" ? '"1月"' : 図種 === "journey" ? '"満足"' : 図種 === "quadrant" ? '"左上"' : "10";

/**
 * 走査に使う本文。 箱 3 つを 2 本の矢印で繋ぐ。
 *
 * **端の箱がそれぞれ 1 本の矢印にしか出てこない形にする**。 輪にすると、どの箱を書いても
 * 同じ言づてに合うため板の番号が動かず、板の 2 図種が「名前を見ない」 側に誤って落ちる (実測)。
 */
function 本文(図種: string, focus: string): string {
  const v = 読める値(図種);
  return `title: "しらべ"
type: ${図種}

actors:
  - あ: { value: ${v} }
  - い: { value: ${v} }
  - う: { value: ${v} }

flow:
  - あ -> い: "1"
  - い -> う: "2"

animation:
  - step: "s1" 1s
    focus: [${focus}]
    body: "b"
`;
}

type 測った結果 = {
  /** 組み上がった段。 書き分けて分かれるかを見るために丸ごと持つ */
  段: string;
  知らせ: CompileNotice[];
};

function 測る(図種: string, focus: string): 測った結果 {
  const p = parseTextDslV05(本文(図種, focus));
  if (!p.ok) throw new Error(`${図種}: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知らせ: CompileNotice[] = [];
  const d = compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
  return { 段: JSON.stringify(d.phases ?? []), 知らせ };
}

/** 注目先についての知らせだけを取り出す (値が読めない等の別の知らせを混ぜない) */
const 注目の知らせ = (r: 測った結果): CompileNotice[] =>
  r.知らせ.filter((n) => n.kind.startsWith("focus-target-"));

/** 2 通り書いて分かれるか = その図種が書いた名前を見ているか */
const 名前を見る = (図種: string, a: string, b: string): boolean =>
  測る(図種, a).段 !== 測る(図種, b).段;

/** 走査の軸。 箱の名前で指す形と、矢印で指す形 */
const 軸 = [
  { 名: "箱", a: "あ", b: "う" },
  { 名: "矢印", a: '"あ -> い"', b: '"い -> う"' },
] as const;

/** 実際に組み立てて測った、名前を見る図種と見ない図種 */
function 測って分ける(a: string, b: string): { 見る: string[]; 見ない: string[] } {
  const 見る: string[] = [];
  const 見ない: string[] = [];
  for (const t of 全図種) (名前を見る(t, a, b) ? 見る : 見ない).push(t);
  return { 見る, 見ない };
}

describe("書いたとおりに光らない図種は、そのことを知らせる (#2398)", () => {
  it.each(軸)("$名 を指す走査が空振りしていない", ({ a, b }) => {
    // どちらかが 0 件だと、下の 2 つの検査が「差が無い」 で通ってしまう
    expect(全図種.length, "図種を 1 つも走査できていない").toBe(PRESET_TYPES.size);
    const 分けた = 測って分ける(a, b);
    expect(
      分けた.見る.length,
      `走査 ${全図種.length} 図種 / 名前を見る ${分けた.見る.join(" ")}`,
    ).toBeGreaterThan(0);
    expect(
      分けた.見ない.length,
      `走査 ${全図種.length} 図種 / 名前を見ない ${分けた.見ない.join(" ")}`,
    ).toBeGreaterThan(0);
  });

  it.each(軸)("$名 を指して名前を見ない図種は、全て 1 件知らせる", ({ a, b }) => {
    const { 見ない } = 測って分ける(a, b);
    const 出た = Object.fromEntries(
      見ない.map((t) => [t, 注目の知らせ(測る(t, a)).map((n) => n.kind)]),
    );
    const 期待 = Object.fromEntries(見ない.map((t) => [t, ["focus-target-not-honored"]]));
    expect(出た, `名前を見ない ${見ない.length} 図種`).toEqual(期待);
  });

  it.each(軸)("$名 を指して名前を見る図種では、知らせが 1 件も出ない (対照)", ({ a, b }) => {
    const { 見る } = 測って分ける(a, b);
    const 出た = Object.fromEntries(見る.map((t) => [t, 注目の知らせ(測る(t, a)).map((n) => n.kind)]));
    expect(出た, `名前を見る ${見る.length} 図種`).toEqual(
      Object.fromEntries(見る.map((t) => [t, []])),
    );
  });

  it("板の 2 図種は、書いた名前で板の番号が変わる", () => {
    /*
     * 上の走査が測っている「分かれる」 の中身を、板について名指しで固定する。
     * 走査だけだと、板が別の理由で分かれた日にこの検査が意味を失う。
     */
    const 番号 = (図種: string, focus: string): unknown =>
      (JSON.parse(測る(図種, focus).段) as { sets?: { stateId: string; value: number }[] }[])[0]
        ?.sets?.find((s) => s.stateId === "seq_step")?.value;
    for (const t of ["sequence", "solidity"]) {
      expect(番号(t, '"あ -> い"'), `${t} の 1 通目`).toBe(0);
      expect(番号(t, '"い -> う"'), `${t} の 2 通目`).toBe(1);
      expect(注目の知らせ(測る(t, "あ")), `${t} で知らせが出ている`).toEqual([]);
    }
  });

  it("図全体が光る図種でも、全ての箱を書いた段では知らせない", () => {
    /*
     * 光る結果 (全ての箱) と書いたこと (全ての箱) が一致するため、伝えることが無い。
     * ここを知らせると、カタログの見本のように全件を書いた図が全て知らせを出す。
     */
    expect(注目の知らせ(測る("bar", "あ, い, う"))).toEqual([]);
    // 1 つでも欠けると知らせる (対照)
    expect(注目の知らせ(測る("bar", "あ, い")).map((n) => n.kind)).toEqual([
      "focus-target-not-honored",
    ]);
  });

  it("全ての箱を書いても、矢印を書いた段では知らせる", () => {
    // 図全体が光る図種は矢印を 1 本も描かない = 書いた矢印は箱の数と関係なく選べない
    expect(注目の知らせ(測る("bar", 'あ, い, う, "あ -> い"')).map((n) => n.kind)).toEqual([
      "focus-target-not-honored",
    ]);
  });

  it("記法に無い名前は、これまでどおり綴り違いとして知らせる", () => {
    // 種類が入れ替わると、書き直せば直る件に「書き直しても直らない」 の案内が付く
    for (const t of ["flow", "bar"]) {
      expect(注目の知らせ(測る(t, "居ない箱")).map((n) => n.kind), t).toEqual([
        "focus-target-missing",
      ]);
    }
  });

  it("矢印の端が記法に無い時も綴り違いとして知らせる", () => {
    for (const t of ["flow", "bar"]) {
      expect(注目の知らせ(測る(t, '"あ -> 居ない箱"')).map((n) => n.kind), t).toEqual([
        "focus-target-missing",
      ]);
    }
  });

  it("同じ段に 2 つ書いても、知らせは 1 件にまとまる", () => {
    /*
     * 同じ段に書いた名前はどれも同じ理由で選べない。 1 つずつ知らせると、同じ文が
     * 1 行に並んで読み手が数だけを見ることになる。
     */
    const 出た = 注目の知らせ(測る("bar", "あ, い"));
    expect(出た.length, `知らせ ${出た.length} 件`).toBe(1);
    expect(new Set(出た.map((n) => n.line)).size, "同じ行に 2 件以上並んでいる").toBe(1);
    // 書いた名前は 2 つとも本文に並べる = 1 件にまとめても、どれを指しているかが読める
    expect(出た[0]!.message).toContain("あ");
    expect(出た[0]!.message).toContain("い");
  });

  it("知らせは、書き直しでは直らないことと何が光るかを書く", () => {
    const 出た = 注目の知らせ(測る("pie", "あ"));
    expect(出た.length, "知らせが 1 件でない").toBe(1);
    const n = 出た[0]!;
    expect(n.kind).toBe("focus-target-not-honored");
    // どの図種の話かを出す
    expect(n.message, `本文: ${n.message}`).toContain("pie");
    // 書かなかった箱も光ることを出す = 何が起きるかが分かる
    expect(n.message, `本文: ${n.message}`).toContain("い");
    expect(n.message, `本文: ${n.message}`).toContain("う");
    // 「名前を書き直せ」 と読めない案内にする
    expect(n.hint ?? "", `補足: ${n.hint ?? ""}`).toContain("名前の書き方の問題ではありません");
  });

  it("箱が多くても名前が長くても、知らせの長さが抑えられる", () => {
    /*
     * 箱は 1,000 件まで書け、名前の長さにも上限が無い。 全てを本文に並べると 1 件の知らせが
     * 数百 KB になる (矢印の端の知らせが #1209 で踏んだ形)。 **件数と 1 件あたりの長さを
     * 両方切る** = 件数だけ絞っても、名前 1 つが 2 万字なら知らせも 2 万字になる。
     */
    const 長い名前 = "あ".repeat(500);
    const 箱 = [長い名前, ...Array.from({ length: 60 }, (_, i) => `箱${i}`)];
    const src = `title: "しらべ"
type: bar

actors:
${箱.map((n) => `  - "${n}": { value: 10 }`).join("\n")}

animation:
  - step: "s1" 1s
    focus: ["箱0"]
    body: "b"
`;
    const p = parseTextDslV05(src);
    if (!p.ok) throw new Error(p.errors.map((e) => e.message).join(" / "));
    const 知らせ: CompileNotice[] = [];
    compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
    const 出た = 知らせ.filter((n) => n.kind === "focus-target-not-honored");
    expect(出た.length, "知らせが 1 件でない").toBe(1);
    const 本文 = 出た[0]!.message;
    expect(本文.length, `本文が ${本文.length} 字`).toBeLessThan(600);
    expect(本文, "長い名前がそのまま入っている").not.toContain(長い名前);
    // 並べ切れなかった件数を出す = 切ったことが読み手に分かる
    expect(本文, `本文: ${本文}`).toContain("ほか");
  });

  it("綴り違いの補足も、名前が多いと切り詰める", () => {
    // 補足は知らせごとに作られる。 切らないと、名前 1,000 件 × 注目先 1,000 件で膨らむ
    const 箱 = Array.from({ length: 60 }, (_, i) => `箱${i}`);
    const src = `title: "しらべ"
type: flow

actors:
${箱.map((n) => `  - ${n}`).join("\n")}

animation:
  - step: "s1" 1s
    focus: [居ない箱]
    body: "b"
`;
    const p = parseTextDslV05(src);
    if (!p.ok) throw new Error(p.errors.map((e) => e.message).join(" / "));
    const 知らせ: CompileNotice[] = [];
    compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
    const 出た = 知らせ.filter((n) => n.kind === "focus-target-missing");
    expect(出た.length, "知らせが 1 件でない").toBe(1);
    const 補足 = 出た[0]!.hint ?? "";
    expect(補足.length, `補足が ${補足.length} 字`).toBeLessThan(200);
    expect(補足, `補足: ${補足}`).toContain("ほか");
  });

  it("段を持たない図では知らせを出さない (対照)", () => {
    const src = `title: "しらべ"
type: bar

actors:
  - あ: { value: 10 }
  - い: { value: 20 }
`;
    const p = parseTextDslV05(src);
    if (!p.ok) throw new Error(p.errors.map((e) => e.message).join(" / "));
    const 知らせ: CompileNotice[] = [];
    compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
    expect(知らせ.filter((n) => n.kind.startsWith("focus-target-"))).toEqual([]);
  });
});
