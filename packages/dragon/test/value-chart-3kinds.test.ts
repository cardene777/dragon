/**
 * 値で描く図表に 3 種を足した (#1450)。
 *
 * `chart-stat` (値 1 つを大きく示す) / `chart-waffle` (割合を 100 個の印で示す) /
 * `chart-stacked-bar` (内訳と時点間の変化を帯で示す) の 3 種。
 *
 * 3 種とも既存の 5 種と同じ payload (`label` + `value`) を使うので、新しく要るのは
 * **前の時点の値** (`previous`) の 1 欄だけ。
 *
 * ## 何を見るか
 *
 * 1. 3 種が正しい種別の節になり、高さが描画側の既定と揃うこと
 * 2. **前の時点の値を書かない図が従来と同じ形のままであること** = 陰性対照
 * 3. 前の時点の値が読めない形を黙って捨てないこと
 *
 * 2 が要点。 1 と 3 だけだと「書いた時に正しく渡る」 ことしか見ておらず、
 * 書いていない全図に欄が付いても気付けない。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram } from "../src/index";
import { PRESET_TYPES } from "../src/v05/parser";
import type { PresetType } from "../src/types";
import type { CompileNotice } from "../src/index";

/** 型ごとの最小の記法。 名前と値だけを並べる */
const 記法 = (type: string, body: string): string =>
  `title: "確認"\ntype: ${type}\n\nactors:\n${body}`;

const 節 = (type: string, body: string) => textDslToDiagram(記法(type, body)).nodes[0];

describe("3 種が記法から書ける (#1450)", () => {
  it("受ける型に 3 種が入っている", () => {
    for (const t of ["stat", "waffle", "stacked"]) {
      expect(PRESET_TYPES.has(t as PresetType), `${t} を受けていない`).toBe(true);
    }
  });

  it("型ごとに正しい種別の節になる", () => {
    const 表: Array<[string, string]> = [
      ["stat", "chart-stat"],
      ["waffle", "chart-waffle"],
      ["stacked", "chart-stacked-bar"],
    ];
    for (const [型, 種別] of 表) {
      expect(節(型, `  - A: "10"\n`)?.kind, `${型} の種別が違う`).toBe(種別);
    }
  });

  it("高さが描画側の既定と揃う", () => {
    // 揃えないと、同じ値を同じ図種で描いても catalog と記法で高さが変わる。
    // 帯だけ縦を使うので 368、値 1 つと印は縦を使わないので 320
    expect(節("stat", `  - A: "10"\n`)?.h).toBe(320);
    expect(節("waffle", `  - A: "10"\n`)?.h).toBe(320);
    expect(節("stacked", `  - A: "10"\n`)?.h).toBe(368);
  });

  it("案内の言葉が型ごとに違う (共通化で薄まっていない)", () => {
    // 共通化すると「割合 / 100 個の印 / 45%」 が「値 / 図 / 45」 に薄まる。
    // 読めない値を書いて、出た知らせの文面を見る
    const 言葉 = (型: string): string => {
      const 出た: CompileNotice[] = [];
      textDslToDiagram(記法(型, `  - A: "読めない"\n`), { onNotice: (n) => 出た.push(n) });
      return 出た.map((n) => n.message).join(" / ");
    };
    expect(言葉("stat")).toContain("大きな数字");
    expect(言葉("waffle")).toContain("100 個の印");
    expect(言葉("stacked")).toContain("帯");
  });
});

describe("前の時点の値 (#1450)", () => {
  const 中身 = (型: string, body: string) => 節(型, body)?.chartData;

  it("書かない図は欄ごと持たない (従来と同じ形)", () => {
    // 陰性対照。 これが無いと「常に欄を付ける」 実装でも以下が通る
    const d = 中身("stacked", `  - A: "10"\n`);
    expect(d?.length, "中身を 1 件も作れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(d?.[0]).not.toHaveProperty("previous");
  });

  it("書いた図は描画側へ渡る", () => {
    expect(中身("stacked", `  - A: { value: "320", previous: "280" }\n`)?.[0]?.previous).toBe(280);
  });

  it("3 つの書き方すべてで書ける (書き方によって効かない形が無い)", () => {
    // 記法は箱の項目を 3 通りで書ける。 1 つだけに配線すると、書き方を変えた時だけ
    // 「書いたのに 2 本目の帯が出ない」 が起きる
    const 形: Array<[string, string]> = [
      ["中括弧の形", `  - A: { value: "320", previous: "280" }\n`],
      ["縦に並べた形", `  - A:\n      value: "320"\n      previous: "280"\n`],
      ["日本語の項目名", `  - A: { 値: "320", 前の値: "280" }\n`],
    ];
    for (const [名, body] of 形) {
      expect(中身("stacked", body)?.[0]?.previous, `${名}で前の値が落ちている`).toBe(280);
    }
  });

  it("値で描く 8 種すべてで書ける (種別で落ちない)", () => {
    // 欄は payload に載るので図表の種別を問わない。 片方だけに配線すると
    // 「同じ書き方が型によって効かない」 状態になる
    let 測れた = 0;
    for (const 型 of ["pie", "bar", "line", "gauge", "radial", "stat", "waffle", "stacked"]) {
      const d = 中身(型, `  - A: { value: "320", previous: "280" }\n`);
      expect(d?.[0]?.previous, `${型} で前の値が落ちている`).toBe(280);
      測れた += 1;
    }
    expect(測れた, "型を 1 つも測れていない (検査が空振りしている)").toBe(8);
  });

  it("読めない形を黙って捨てない", () => {
    const 出た: CompileNotice[] = [];
    textDslToDiagram(記法("stacked", `  - A: { value: "320", previous: "読めない" }\n`), {
      onNotice: (n) => 出た.push(n),
    });
    expect(出た.map((n) => n.message).join(" / ")).toContain("前の時点の値を読めない");
  });

  it("読めない前の値でも、値そのものは残る (図が消えない)", () => {
    // 前の値は見え方の足しなので、読めないことを理由に節を落とさない
    const d = 中身("stacked", `  - A: { value: "320", previous: "読めない" }\n`);
    expect(d?.[0]?.value).toBe(320);
    expect(d?.[0]).not.toHaveProperty("previous");
  });
});
