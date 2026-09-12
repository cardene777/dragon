import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * `type: c4` で段の目印が説明として出ないことの検証 (#1098)。
 *
 * 目印 (`L1` / `L2` / `L3`) は「どの段に置くか」 を組み立てに伝えるためのもので、 読む人には
 * 意味を持たない。 段の名前は枠のラベル (`全体の見取り図` / `動かす単位` / `部品`) が既に
 * 出しているので二重でもある。
 *
 * 変更前は見本の 4 箱すべてが `L1` / `L1: system` / `L2: container` を説明として出しており、
 * 書く人は説明を書いたつもりで目印を書いていた = 箱には説明が 1 つも出ていなかった。
 */

const 図 = (actors: string): CdlDiagram =>
  textDslToDiagram(`title: "t"\ntype: c4\n\nactors:\n${actors}\n`);

const 箱 = (d: CdlDiagram, id: string) => d.nodes.find((n) => n.id === id);

describe("段の目印を説明から落とす (#1098)", () => {
  it("目印だけなら説明を出さない", () => {
    // 空文字を入れると、 描画側が「説明がある」 として行を取る。 出さないのが正しい
    const d = 図(`  - A: person "L1"`);
    expect(箱(d, "a")?.subtitle, "説明が残っている").toBeUndefined();
    expect(箱(d, "a")?.lane, "段が違う").toBe("c4-l1");
  });

  it("目印の後ろの区切りごと落とす", () => {
    // 落とさないと `: container` のように区切りだけが先頭に残る
    const d = 図(`  - A: service "L2: container"`);
    expect(箱(d, "a")?.subtitle).toBe("container");
    expect(箱(d, "a")?.lane).toBe("c4-l2");
  });

  it("全角のコロンでも落とす", () => {
    const d = 図(`  - A: service "L2：入口"`);
    expect(箱(d, "a")?.subtitle).toBe("入口");
  });

  it("空白で区切っても落とす", () => {
    const d = 図(`  - A: person "L1 図を使う人"`);
    expect(箱(d, "a")?.subtitle).toBe("図を使う人");
    expect(箱(d, "a")?.lane).toBe("c4-l1");
  });

  it("目印を書かない箱の説明はそのまま残る", () => {
    const d = 図(`  - A: service "要求を受ける"`);
    expect(箱(d, "a")?.subtitle).toBe("要求を受ける");
    expect(箱(d, "a")?.lane, "目印なしは 1 段目").toBe("c4-l1");
  });

  it("小文字でも落とす", () => {
    const d = 図(`  - A: service "l3 部品"`);
    expect(箱(d, "a")?.subtitle).toBe("部品");
    // 枠の id は段の番号を保つ (左に詰めるのは位置だけで、 名前は変えない)
    expect(箱(d, "a")?.lane).toBe("c4-l3");
  });

  it("目印に見える別の語は落とさない", () => {
    // `L2X` は目印ではない。 落とすと書いた説明が消える
    const d = 図(`  - A: service "L2X 独自の名前"`);
    expect(箱(d, "a")?.subtitle).toBe("L2X 独自の名前");
    expect(箱(d, "a")?.lane, "目印でないので 1 段目").toBe("c4-l1");
  });

  it("説明を書かない箱では説明が出ない", () => {
    const d = 図(`  - A: service`);
    expect(箱(d, "a")?.subtitle).toBeUndefined();
  });
});

describe("他の型の説明は変わらない (#1098)", () => {
  // 目印を落とすのは `type: c4` だけ。 他の型で `L1` から始まる説明を書いた人がいると、
  // 落としてしまえば書いた文字が消える
  for (const type of ["flow", "swimlane", "topology", "er"] as const) {
    it(`type: ${type} では L1 から始まる説明もそのまま残る`, () => {
      const d = textDslToDiagram(
        `title: "t"\ntype: ${type}\n\nactors:\n  - A: service "L1: そのまま"\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      );
      const a = d.nodes.find((n) => n.id === "a" || n.id === "a-header");
      expect(a?.subtitle, "説明が落とされている").toBe("L1: そのまま");
    });
  }
});
