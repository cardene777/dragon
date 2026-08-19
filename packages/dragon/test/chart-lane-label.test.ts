import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";

/**
 * 図表の記法が図の題を 2 度描かないことの検証 (#1249)。
 *
 * 図表は箱を 1 つしか作らず、その箱が既に図の題を持つ。 そこへ縦列の見出しにも同じ題を
 * 渡していたため、**同じ字が縦に 2 つ並んで** いた。
 *
 * 実測 = 円グラフの見本を記法で書き直して描くと、図の題が画面に 2 回出た (組み立て API は
 * 1 回)。 縦の高さも 440 から 532 になっていた = 帯が場所を取る。
 *
 * 縦列の見出しは「複数の箱がどの列に属するか」 を読ませるためのもので、箱が 1 つの図には
 * 役目が無い。
 */

/** 図全体を 1 箱にする図種。 縦列の見出しに役目が無い */
const 一箱の図種 = [
  "pie", "bar", "line", "funnel", "tree", "journey", "quadrant", "mind", "gantt",
] as const;

/**
 * 箱ごとに分かれる図種と、 その縦列の見出し。 本 file の変更で 1 つも動かないことを見る。
 *
 * **「1 つでも見出しがあること」 では足りない**。 図種によっては元から見出しを持たない
 * (`flow` / `er` / `state` は動きを書かない時に cdl 側の組み立てを通り、 見出しが付かない)
 * ため、 緩い条件だと外し過ぎに気付けない。 実測した値をそのまま固定する。
 */
const 箱ごとの図種: readonly (readonly [string, readonly (string | null | undefined)[]])[] = [
  ["sequence", ["A", "B"]],
  ["flow", [undefined]],
  ["swimlane", ["A", "B"]],
  ["er", [undefined, undefined]],
  ["state", [undefined, undefined]],
  ["topology", ["図の題"]],
  ["solidity", ["A", "B"]],
  ["class", ["図の題"]],
  ["c4", ["System Context"]],
];

const 記法 = (type: string, 追加 = "") =>
  `title: "図の題"\ntype: ${type}\n${追加}\nactors:\n  - A: "1"\n  - B: "2"\nflow:\n  - A -> B: "x"\n`;

function 組み立てる(src: string) {
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
  return compileToCdl(r.doc);
}

const 縦列の見出し = (src: string) => (組み立てる(src).lanes ?? []).map((l) => l.label);

describe("図表の縦列に見出しを付けない (#1249)", () => {
  for (const type of 一箱の図種) {
    it(`${type} の縦列に見出しが無い`, () => {
      expect(縦列の見出し(記法(type))).toEqual([undefined]);
    });
  }

  it("図の題が箱の側にだけ残る", () => {
    // 見出しを外しただけで題ごと消えていないことを見る。 消えていたら図が読めなくなる
    const d = 組み立てる(記法("pie"));
    expect(d.nodes[0]?.title, "箱の題まで消えている").toBe("図の題");
  });

  it("縦列の幅は変わらない", () => {
    // 幅は見出しの有無と独立に決まるべき。 連動していると帯を外した分だけ図が細くなる
    expect((組み立てる(記法("pie")).lanes ?? [])[0]?.width).toBe(704);
  });
});

describe("箱ごとに分かれる図種は従来どおり (陰性対照)", () => {
  for (const [type, 期待] of 箱ごとの図種) {
    it(`${type} の縦列の見出しが変わらない`, () => {
      // 検査が恒真でないことを見る。 全図種で外していたら見出しを持つ図種が落ちる
      expect(縦列の見出し(記法(type))).toEqual(期待);
    });
  }
});

describe("明示した見出しは図表でも効く", () => {
  it("lanes ブロックで書いた見出しが残る", () => {
    // 既定を外しただけで、書いた指定まで潰していないことを見る
    expect(縦列の見出し(記法("pie", 'lanes:\n  chart: { label: "内訳" }\n'))).toEqual(["内訳"]);
  });

  it("gantt でも効く", () => {
    // gantt だけ縦列の id が違う (`gantt`)。 1 図種だけ取り残される形を防ぐ
    expect(縦列の見出し(記法("gantt", 'lanes:\n  gantt: { label: "工程" }\n'))).toEqual(["工程"]);
  });
});
