/**
 * 状態の図で始点終点の印を書ける (#1450)。
 *
 * `mark-start` (塗りつぶした丸) と `mark-end` (輪の中に丸) は、「ここから」「ここまで」 を
 * 状態そのものと分けて示す印。
 *
 * ## 何が壊れていたか
 *
 * 静止した状態の図は `stateMachine` preset を通り、**全ての箱を同じ種類で描いていた**。
 * `kind:` を書いても黙って消え、知らせも出なかった。 動く図 (`animation:` を書いた図) だけは
 * 別経路を通るため効いていた = **同じ記法が動きの有無で違う結果になる**。
 *
 * #1263 が縦列 (`lane:`) について同じ形を直しており、これはその 2 例目。
 *
 * ## 何を見るか
 *
 * 1. 書いた種類が動きの有無を問わず効くこと
 * 2. **書かない図が従来と同じ形のままであること** = 陰性対照
 * 3. 印以外の種類でも同じように効くこと (印だけの特別扱いにしない)
 *
 * 2 が要点。 1 と 3 だけだと「書いた時に効く」 ことしか見ておらず、
 * 書いていない全ての状態の図が別の形になっても気付けない。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram } from "../src/index";

const 記法 = (actors: string, 動き = ""): string =>
  `title: "状態"\ntype: state\n\nactors:\n${actors}\nflow:\n  - A -> B: "進む"\n${動き}`;

const 動き = `\nanimation:\n  - step: "s" 1.4s\n    focus: [A]\n`;

/** 図の節を `id=kind` の並びで取る */
const 種別 = (src: string): string[] =>
  textDslToDiagram(src).nodes.map((n) => `${n.id}=${n.kind as string}`);

describe("書いた種類が動きの有無を問わず効く (#1450)", () => {
  const 印つき = `  - A: { kind: mark-start }\n  - B: { kind: mark-end }\n`;

  it("静止図で印が出る", () => {
    const k = 種別(記法(印つき));
    expect(k.length, "節を 1 つも作れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(k).toContain("a=mark-start");
    expect(k).toContain("b=mark-end");
  });

  it("動く図でも印が出る (従来から効いていた側)", () => {
    const k = 種別(記法(印つき, 動き));
    expect(k).toContain("a=mark-start");
    expect(k).toContain("b=mark-end");
  });

  it("印以外の種類でも効く (印だけの特別扱いにしていない)", () => {
    // 印だけを通す形にすると、他の種類は黙って消えたままになる
    const k = 種別(記法(`  - A: { kind: database }\n  - B: "処理"\n`));
    expect(k).toContain("a=database");
  });
});

describe("書かない図は従来と同じ (#1450)", () => {
  it("種類を書かない静止図は全ての箱が同じ種類のまま", () => {
    // 陰性対照。 これが無いと「常に別経路へ流す」 実装でも上が通り、
    // 既存の状態の図すべての見た目が変わっても気付けない
    const k = 種別(記法(`  - A: "止まっている"\n  - B: "処理"\n`));
    expect(k.length, "節を 1 つも作れていない (検査が空振りしている)").toBeGreaterThan(0);
    const 種類 = [...new Set(k.map((s) => s.split("=")[1]))];
    expect(種類, "種類を書いていないのに複数の種類が出ている").toEqual(["card"]);
  });

  it("既定と同じ結果になる種類を書いても経路は変わらない", () => {
    // `kind: state` は記法だけの種類で、読み替えた後は preset の出す形と同じになる。
    // 「書いたか」 だけで切り替えると、この形も別経路へ流れて id と枠の作りが変わる
    // (実測で golden 8 件が落ちた)
    const 書いた = 種別(記法(`  - A: { kind: state }\n  - B: { kind: state }\n`));
    const 書かない = 種別(記法(`  - A: "止まっている"\n  - B: "処理"\n`));
    expect(書いた.length, "節を 1 つも作れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(書いた).toEqual(書かない);
  });

  it("種類を書いた箱が 1 つでもあれば経路が切り替わる", () => {
    // 判定は「1 人でも書いたか」。 全員に書かせる形にすると、
    // 印だけを足したい図で他の箱にも書く手間が要る
    const k = 種別(記法(`  - A: { kind: mark-start }\n  - B: "処理"\n`));
    expect(k).toContain("a=mark-start");
    expect(k.some((s) => s.startsWith("b=")), "2 つ目の箱が消えている").toBe(true);
  });
});
