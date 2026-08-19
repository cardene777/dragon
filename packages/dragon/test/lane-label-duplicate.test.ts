import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";

/**
 * 箱ごとに縦列を作る図種で、名前を 2 度描かないことの検証 (#1241)。
 *
 * `swimlane` / `er` / `state` は箱を 1 つずつ持ち、その箱が既に名前を描く。 縦列にも同じ名前を
 * 渡していたため、**同じ字が縦に 2 つ並んで** いた (実測 = 描いた絵に `Alpha` `Beta` が 2 度出る)。
 *
 * `swimlane` だけは縦列そのものが「誰の担当か」 を読ませる図なので見出しが要る。
 * `er` の縦列は表を並べるための入れ物、`state` の縦列は状態を並べるための入れ物で、
 * どちらも読む人に見せる意味を持たない (組立て API 側も見出しを空のまま置く)。
 */

const 記法 = (type: string) =>
  `title: "T"\ntype: ${type}\n\nactors:\n  - Alpha\n  - Beta\nflow:\n  - Alpha -> Beta: "x"\n\n` +
  `animation:\n  - step: "s1" 1s\n    focus: [Alpha]\n    body: "b"\n`;

function 縦列の見出し(type: string): (string | undefined)[] {
  const r = parseTextDslV05(記法(type));
  if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
  return (compileToCdl(r.doc).lanes ?? []).map((l) => l.label);
}

describe("箱ごとに縦列を作る図種の見出し (#1241)", () => {
  it.each(["er", "state"])("%s の縦列に見出しを付けない", (type) => {
    expect(縦列の見出し(type)).toEqual([undefined, undefined]);
  });

  it("swimlane には従来どおり見出しを付ける (陰性対照)", () => {
    // 縦列そのものが「誰の担当か」 を読ませる図。 全図種で外していたらここが落ちる
    expect(縦列の見出し("swimlane")).toEqual(["Alpha", "Beta"]);
  });

  it.each(["er", "state"])("%s でも箱の題は残る", (type) => {
    // 見出しを外しただけで名前ごと消えていないことを見る
    const r = parseTextDslV05(記法(type));
    const d = r.ok ? compileToCdl(r.doc) : undefined;
    expect(d?.nodes.map((n) => n.title)).toEqual(["Alpha", "Beta"]);
  });

  it.each(["er", "state", "swimlane"])("%s の縦列の数は変わらない", (type) => {
    expect(縦列の見出し(type)).toHaveLength(2);
  });
});

describe("動きを書かない図では従来どおり (陰性対照)", () => {
  // 動きを書かない `er` / `state` は cdl 側の組み立てを通るため、本 file の変更は届かない。
  // 届いていないことを固定しておく = 片方だけ直して食い違う状態に気付ける
  it.each(["er", "state"])("%s は動きなしでも見出しを持たない", (type) => {
    const src = `title: "T"\ntype: ${type}\n\nactors:\n  - Alpha\n  - Beta\nflow:\n  - Alpha -> Beta: "x"\n`;
    const r = parseTextDslV05(src);
    const d = r.ok ? compileToCdl(r.doc) : undefined;
    expect((d?.lanes ?? []).map((l) => l.label ?? undefined)).toEqual([undefined, undefined]);
  });
});
