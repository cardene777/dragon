/**
 * 型定義が 1 つに決まらない時の案内 (#1454)。
 *
 * 表を作る段は依存の `dist` から目当ての型を持つ file を 1 つに絞る。 絞れない時に止めるのは
 * 正しいが、**件数によって原因が違う**。
 *
 * | 件数 | 意味 | 次の一手 |
 * |---|---|---|
 * | 0 件 | 依存が束ね方を変えた | 探し方を直す |
 * | 2 件以上 | 手元の install が汚れている | `pnpm install --force` |
 *
 * 2 件以上が汚れを意味するのは、公開されている全ての版が型定義をちょうど 1 つしか
 * 持たないため (0.9.0 から 0.15.0 まで 9 版を実測)。
 *
 * #1448 はこの区別が無く、汚れを「作り方が変わった」 と読んで脇に置いた結果、
 * 同じ汚れが別の形で返していた嘘に気付けなかった。
 *
 * ## 何を見るか
 *
 * 1. 1 つに決まる時は止まらない (陰性対照)
 * 2. 0 件と 2 件以上で **違う** 文面が出る
 * 3. 2 つの段が同じ書き分けを持つ
 *
 * 1 が要点。 これが無いと「常に止める」 実装でも 2 と 3 が通る。
 */
import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const { 型定義を1つ探す } = require_("../scripts/lib/type-def-lookup.mjs") as {
  型定義を1つ探す: (dist: string, 目印: string, 名: string) => string;
};

/** 一時の `dist` を作って、指定した中身の `.d.ts` を並べる */
const 作った: string[] = [];
function 仮のdist(中身: string[]): string {
  const d = mkdtempSync(join(tmpdir(), "typedef-"));
  作った.push(d);
  中身.forEach((c, i) => writeFileSync(join(d, `render-${i}.d.ts`), c));
  // 目印を持たない file を必ず 1 つ置く = 絞り込みが「全部拾う」 実装でも落ちる形にする
  writeFileSync(join(d, "index.d.ts"), "type Other = {};\n");
  return d;
}

afterEach(() => {
  for (const d of 作った.splice(0)) rmSync(d, { recursive: true, force: true });
});

const 目印 = "type CdlReadout = {";
const 当たる = `${目印}\n  id: string;\n};\n`;

describe("1 つに決まる時は止まらない (#1454)", () => {
  it("目印を持つ file が 1 つなら、その場所を返す", () => {
    // 陰性対照。 これが無いと「常に止める」 実装でも以下の 2 件が通る
    const d = 仮のdist([当たる]);
    const 場所 = 型定義を1つ探す(d, 目印, "部品");
    expect(場所).toContain("render-0.d.ts");
  });

  it("目印を持たない file が混ざっていても絞れる", () => {
    // `index.d.ts` は常に置いてある。 絞り込みが中身を見ずに数えると、ここで落ちる
    const d = 仮のdist([当たる, "type Nope = {};\n"]);
    expect(型定義を1つ探す(d, 目印, "部品")).toContain("render-0.d.ts");
  });
});

describe("件数で原因を書き分ける (#1454)", () => {
  const 文面 = (中身: string[]): string => {
    const d = 仮のdist(中身);
    try {
      型定義を1つ探す(d, 目印, "部品");
      return "(止まらなかった)";
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  };

  it("0 件は「束ね方が変わった」 と案内する", () => {
    const m = 文面(["type Nope = {};\n"]);
    expect(m).toContain("束ね方が変わった");
    expect(m).not.toContain("汚れています");
  });

  it("2 件以上は「手元の install が汚れている」 と案内する", () => {
    const m = 文面([当たる, 当たる]);
    expect(m).toContain("汚れています");
    expect(m).not.toContain("束ね方が変わった");
  });

  it("2 件以上の案内は次の一手を含む", () => {
    // 原因だけ言われても、読んだ人が何をすればよいか決められない
    expect(文面([当たる, 当たる])).toContain("pnpm install --force");
  });

  it("どちらの案内も件数を出す", () => {
    expect(文面(["type Nope = {};\n"])).toContain("(0 件)");
    expect(文面([当たる, 当たる, 当たる])).toContain("(3 件)");
  });

  it("0 件の案内は探している目印を出す (探し方を直せるようにする)", () => {
    expect(文面(["type Nope = {};\n"])).toContain(目印);
  });
});

describe("2 つの段が同じ絞り込みを使う (#1454)", () => {
  it("どちらの段も helper を読んでいる", () => {
    // 片方だけ直すと、同じ状況で別のことを言う
    const 読む = (f: string): string =>
      require_("node:fs").readFileSync(new URL(f, import.meta.url), "utf8") as string;
    let 測れた = 0;
    for (const f of ["../scripts/gen-readout-table.mjs", "../scripts/gen-input-table.mjs"]) {
      expect(読む(f), `${f} が helper を読んでいない`).toContain("type-def-lookup.mjs");
      測れた += 1;
    }
    expect(測れた, "段を 1 つも読めていない (検査が空振りしている)").toBe(2);
  });
});
