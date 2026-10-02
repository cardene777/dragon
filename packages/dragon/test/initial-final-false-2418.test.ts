/*
 * 始まりと終わりの札は、書いた箱にだけ出す (#2418 / #2782)。
 *
 * 畳む前は「1 つも書いていない図では並びの最初と最後を始まりと終わりとみなす」 既定を
 * 持っていた。 `initial: false` はその既定を打ち消すための書き方で、#2418 は打ち消しが
 * 効かず **打ち消しを書いた当の箱に札が出る** 不具合を直したものだった。
 *
 * #2782 で表の図と移り変わりの図を 1 つに畳んだ時、並びで決める既定を落とした。
 * 畳んだ後も残すと、行を並べた表の箱に「初期」 や「状態」 の字が出る =
 * 書いた人が言っていないことを図が名乗る。
 *
 * そのため札は **書いた箱にだけ** 出る。 `initial: false` は打ち消す相手が無くなったので、
 * 書いても書かなくても札は付かない。 本 file はその形を固定する = 並びで決める既定を
 * もう一度足した日に落ちる。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import type { CompileNotice } from "../src/compile/notice";
import { parseTextDslV05 } from "../src/v05/parser";

/** 動きを書かない形 */
const 素の本文 = (箱: string): string => `title: "しらべ"
type: record

actors:
${箱}

flow:
  - A -> B: "x"
  - B -> C: "y"
`;

/** 動きを書いた形 */
const 動きの本文 = (箱: string): string => `${素の本文(箱)}
animation:
  - step: "みる" 1.8s
    focus: ["A"]
`;

const 経路 = { "動きを書かない形": 素の本文, "動きを書いた形": 動きの本文 };

function 組み立てる(本文: string): { 札: Record<string, string>; 知らせ: CompileNotice[]; 図: string } {
  const p = parseTextDslV05(本文);
  if (!p.ok) throw new Error(p.errors.map((e) => `${e.line}: ${e.message}`).join(" / "));
  const 知らせ: CompileNotice[] = [];
  const d = compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
  const 札: Record<string, string> = {};
  for (const n of d.nodes) 札[n.id] = n.eyebrow ?? "";
  return { 札, 知らせ, 図: JSON.stringify(d) };
}

describe("札は書いた箱にだけ出す (#2418 / #2782)", () => {
  for (const [経路名, 本文] of Object.entries(経路)) {
    it(`${経路名} ... 何も書かない図はどの箱にも札を出さない`, () => {
      const r = 組み立てる(本文(`  - A\n  - B\n  - C`));
      expect(r.札, 経路名).toEqual({ a: "", b: "", c: "" });
    });

    it(`${経路名} ... 書いた箱にだけ札が出る`, () => {
      const r = 組み立てる(本文(`  - A: { initial: true }\n  - B\n  - C: { final: true }`));
      expect(r.札, 経路名).toEqual({ a: "初期", b: "", c: "最終" });
    });

    it(`${経路名} ... 打ち消しを書いた箱にも札は出ない`, () => {
      for (const 箱 of [
        `  - A: { initial: false }\n  - B\n  - C`,
        `  - A\n  - B: { initial: false }\n  - C`,
        `  - A\n  - B\n  - C: { final: false }`,
      ]) {
        const r = 組み立てる(本文(箱));
        expect(Object.values(r.札).join(""), 箱).toBe("");
      }
    });

    it(`${経路名} ... 打ち消しても知らせは出ない (正しい書き方なので誤報にしない)`, () => {
      for (const 箱 of [
        `  - A: { initial: false }\n  - B\n  - C`,
        `  - A\n  - B: { initial: false }\n  - C`,
        `  - A\n  - B\n  - C: { final: false }`,
      ]) {
        expect(組み立てる(本文(箱)).知らせ, 箱).toEqual([]);
      }
    });

    it(`${経路名} ... 書いた始まりは打ち消しを書いた他の箱に消されない`, () => {
      const r = 組み立てる(本文(`  - A: { initial: true }\n  - B: { initial: false }\n  - C`));
      expect(r.札.a, "書いた箱の札が残る").toBe("初期");
      expect(r.札.b).toBe("");
    });
  }

  it("動きの有無で出来上がりが変わる (片方しか通っていないと差が出ない)", () => {
    const 箱 = `  - A\n  - B\n  - C`;
    expect(組み立てる(素の本文(箱)).図).not.toBe(組み立てる(動きの本文(箱)).図);
  });

  it("箱が 1 つの図でも書かなければ札を付けない", () => {
    const r = 組み立てる(`title: "しらべ"\ntype: record\n\nactors:\n  - A\n`);
    expect(r.札.a).toBe("");
  });
});
