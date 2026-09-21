/*
 * 状態の図で始まりや終わりを打ち消して書いた時に効かせる (#2418)。
 *
 * `initial:` / `final:` は書いた方が勝つ決まりだが、書いたかどうかを `true` だけで
 * 数えていたため、`false` しか書かれていない図は「1 つも書いていない」 扱いになり
 * 並びで決める既定へ落ちていた。 その既定は「1 番目の箱が始まり」 なので、
 * **打ち消しを書いた当の箱に札が出る**。
 *
 * ## 打ち消しは書いた箱にだけ効かせる
 *
 * 「どれか 1 つでも `initial` を書いたら並びの既定を捨てる」 形にすると、
 * 途中の箱に書いた `initial: false` が 1 番目の箱の札まで消す。
 * 書き手は途中の箱のことしか言っていないので、他の箱の見た目を変えない。
 *
 * ## 組み立て経路は 2 つある
 *
 * 動きを書かない図は `stateMachine` を使い、動きを書いた図は共通の組み立てへ回る。
 * どちらも同じ `始まりと終わりの決め方` を呼ぶため、両方を走査する。
 * **2 経路が本当に別物であることを検査の中で確かめる** = 同じ本文の出来上がりが
 * 2 経路で違うことを見る (同じなら片方しか通っていない)。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import type { CompileNotice } from "../src/compile/notice";
import { parseTextDslV05 } from "../src/v05/parser";

/** 動きを書かない形 (`stateMachine` を使う経路) */
const 素の本文 = (箱: string): string => `title: "しらべ"
type: state

actors:
${箱}

flow:
  - A -> B: "x"
  - B -> C: "y"
`;

/** 動きを書いた形 (共通の組み立てへ回る経路) */
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

describe("打ち消しを書いた箱に札を出さない (#2418)", () => {
  for (const [経路名, 本文] of Object.entries(経路)) {
    it(`${経路名} ... 1 番目の箱の initial: false が効く`, () => {
      const 素 = 組み立てる(本文(`  - A\n  - B\n  - C`));
      expect(素.札.a, "直す前の既定 = 1 番目が始まり").toBe("初期");
      const 打ち消し = 組み立てる(本文(`  - A: { initial: false }\n  - B\n  - C`));
      // 始まりでなくなった箱は ふつうの状態になる (札そのものは消えない)
      expect(打ち消し.札.a).toBe("状態");
    });

    it(`${経路名} ... 最後の箱の final: false が効く`, () => {
      const 素 = 組み立てる(本文(`  - A\n  - B\n  - C`));
      expect(素.札.c, "直す前の既定 = 最後が終わり").toBe("最終");
      const 打ち消し = 組み立てる(本文(`  - A\n  - B\n  - C: { final: false }`));
      expect(打ち消し.札.c).toBe("状態");
    });

    it(`${経路名} ... 途中の箱の打ち消しは他の箱に及ばない`, () => {
      const 打ち消し = 組み立てる(本文(`  - A\n  - B: { initial: false }\n  - C`));
      expect(打ち消し.札.a, "1 番目の札は残る").toBe("初期");
      expect(打ち消し.札.b).toBe("状態");
      expect(打ち消し.札.c, "最後の札も残る").toBe("最終");
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
  }

  it("2 つの経路が別物であることを確かめる (片方しか通っていないと差が出ない)", () => {
    const 箱 = `  - A\n  - B\n  - C`;
    expect(組み立てる(素の本文(箱)).図).not.toBe(組み立てる(動きの本文(箱)).図);
  });
});

describe("打ち消しを書かない図は変わらない (#2418)", () => {
  it("true を書いた図の札が直す前と同じ", () => {
    for (const [経路名, 本文] of Object.entries(経路)) {
      const r = 組み立てる(本文(`  - A\n  - B: { initial: true }\n  - C`));
      expect(r.札, 経路名).toEqual({ a: "状態", b: "初期", c: "最終" });
    }
  });

  it("何も書かない図の札が直す前と同じ", () => {
    for (const [経路名, 本文] of Object.entries(経路)) {
      const r = 組み立てる(本文(`  - A\n  - B\n  - C`));
      expect(r.札, 経路名).toEqual({ a: "初期", b: "状態", c: "最終" });
    }
  });

  it("箱が 1 つの図では終わりの札を付けない (直す前の振る舞いを保つ)", () => {
    const r = 組み立てる(`title: "しらべ"\ntype: state\n\nactors:\n  - A\n`);
    expect(r.札.a).toBe("初期");
  });
});
