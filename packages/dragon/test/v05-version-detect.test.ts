/**
 * 記法の版を見分ける判定の検証 (#1300)。
 *
 * 公開入口 (`textDslToDiagram`) は本文を見て v0.5 か v0.4 かを決める。 v0.4 の目印を
 * `/^\s*種類\s*[:：]/` の形で探しており、**`\s*` が字下げにも当たっていた**。
 *
 * v0.4 の最上位の見出しは字下げしないが、v0.5 の縦書き形は必ず字下げする。 同じ語が
 * 「v0.4 の見出し」 と「v0.5 の箱の欄」 の両方で使われているため、後者が前者と誤認され、
 * **正しい v0.5 の本文が旧 parser へ回されていた**。
 *
 * 出る誤りは真因を 1 文字も含まない (別の行を指し、v0.4 の書き方を勧める) ため、
 * 書いた人は自分の本文を疑い続けることになる。
 *
 * ## 検査は公開入口を通す
 *
 * 版の判定は入口にしかない。 `parseTextDslV05` を直接呼ぶ検査では **原理的に踏めない**
 * (実際、既存の検査は parser 直呼びが大半で、この穴を 1 度も踏んでいなかった)。
 * 入口と parser の結果が一致することを見る形にして、判定が挟まっても結果が変わらないことを固定する。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";

/** v0.5 の箱の欄として書ける日本語と、その値 */
const 箱の欄: Record<string, string> = {
  種類: "service",
  補足: '"ほそく"',
  値: '"42"',
  行: "[ア, イ]",
  位置: "300,200",
  大きさ: "400,200",
  色: '"#ff0000"',
  倍率: "2",
};

/** 版の目印に使われている日本語 (`index.ts` の `V04_KEYWORDS`) */
const 版の目印 = ["タイトル", "種類", "登場人物", "流れ", "アニメーション", "動作", "状態"];

const 箱に欄を置く = (欄: string, 値: string, 種: string): string =>
  `title: "t"\ntype: flow\nactors:\n  - Web:\n      ${種 ? `kind: ${種}\n      ` : ""}${欄}: ${値}\n  - DB\nflow:\n  - Web -> DB: "x"\n`;

/** parser を直接通した結果 (入口が判定を挟まなければこれと同じになるはず) */
function parser経由(src: string): string {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(`v0.5 として読めない: ${r.errors.map((e) => e.message).join(" / ")}`);
  return JSON.stringify(compileToCdl(r.doc));
}

describe("v0.5 の本文が版の判定で旧記法に回されない (#1300)", () => {
  it("箱の欄を 1 つ以上持っている", () => {
    // 持っていなければ、以下の走査は 1 件も回らずに通る
    expect(Object.keys(箱の欄).length, "箱の欄が空 (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("日本語の欄が公開入口でも parser と同じ図になる", () => {
    const 食い違い: string[] = [];
    let 測れた = 0;
    for (const [欄, 値] of Object.entries(箱の欄)) {
      // 倍率と色は見本 (parts) にしか効かないため、見本の箱で書く
      const src = 箱に欄を置く(欄, 値, 欄 === "倍率" || 欄 === "色" ? "arc-gauge" : "");
      測れた += 1;
      let 入口: string;
      try {
        入口 = JSON.stringify(textDslToDiagram(src));
      } catch (e) {
        食い違い.push(`${欄}: 入口が落ちる (${(e as Error).message.split("\n")[1]?.trim()})`);
        continue;
      }
      if (入口 !== parser経由(src)) 食い違い.push(`${欄}: 入口と parser で図が違う`);
    }
    expect(測れた, "欄を 1 つも測れていない (検査が空振りしている)").toBe(
      Object.keys(箱の欄).length,
    );
    expect(食い違い, "日本語の欄が入口を通ると結果が変わる").toEqual([]);
  });

  it("見本の状態名が版の目印と同じ語でも入口で通る", () => {
    // 見本 (parts) の状態名は書いた人が決める。 たまたま版の目印と同じ語を選んだだけで
    // 本文全体が旧記法として読まれてはいけない
    const 食い違い: string[] = [];
    let 測れた = 0;
    for (const 語 of 版の目印) {
      const src = `title: "t"\ntype: flow\nactors:\n  - g:\n      kind: arc-gauge\n      ${語}: 5\n  - B\nflow:\n  - g -> B: "x"\n`;
      測れた += 1;
      try {
        if (JSON.stringify(textDslToDiagram(src)) !== parser経由(src))
          食い違い.push(`${語}: 図が違う`);
      } catch (e) {
        食い違い.push(`${語}: 入口が落ちる (${(e as Error).message.split("\n")[1]?.trim()})`);
      }
    }
    expect(測れた, "目印を 1 つも測れていない (検査が空振りしている)").toBe(版の目印.length);
    expect(食い違い, "状態名が版の目印と同じだと本文が旧記法として読まれる").toEqual([]);
  });

  it("字下げの有無で判定が分かれる", () => {
    // 陰性側 = 字下げして書いた `種類:` は v0.5 の箱の欄
    const v05 = 箱に欄を置く("種類", "service", "");
    expect(textDslToDiagram(v05).nodes.some((n) => n.kind === "service")).toBe(true);

    // 陽性側 = 行頭に書いた `種類:` は v0.4 の見出し。 v0.5 に無い書き方 (番号付きの流れ) を
    // 含む本文が通ることで、旧 parser に回っていることが分かる
    const v04 = `タイトル: "t"\n種類: flow\n登場人物:\n  - A (人)\n  - B (関数)\n流れ:\n  1. A → B: "わたす"\n`;
    const 図 = textDslToDiagram(v04);
    expect(図.nodes.length, "v0.4 の本文が読めなくなっている").toBeGreaterThan(0);
    expect(図.nodes.map((n) => n.kind)).toContain("function");
  });

  it("v0.4 の本文を v0.5 として読もうとすると落ちる (対照)", () => {
    // 上の検査が「たまたま両方の parser で通る本文」 で成立していないことを示す。
    // 番号付きの流れは v0.5 に無いため、v0.5 として読むと必ず落ちる
    const v04 = `タイトル: "t"\n種類: flow\n登場人物:\n  - A (人)\n  - B (関数)\n流れ:\n  1. A → B: "わたす"\n`;
    expect(parseTextDslV05(v04).ok).toBe(false);
  });

  it("日本語の見出しだけが目印の本文も v0.4 として読まれる", () => {
    // **他の目印に覆われない形で見る** (変異試験で判明)。 上の v0.4 の本文は番号付きの流れも
    // 持つため、日本語の見出しを目印から全部外しても番号の方が拾ってしまい、判定が壊れても
    // 落ちない。 流れを持たない本文なら、日本語の見出しだけが唯一の目印になる
    const 見出しだけ = `タイトル: "t"\n種類: flow\n登場人物:\n  - A (人)\n  - B (関数)\n`;
    expect(parseTextDslV05(見出しだけ).ok, "v0.5 として読めてしまうと対照にならない").toBe(false);
    const 図 = textDslToDiagram(見出しだけ);
    expect(図.nodes.map((n) => n.kind)).toContain("function");
  });
});
