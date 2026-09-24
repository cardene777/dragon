import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { PRESET_TYPES } from "../src/v05/parser";
import { 図種の作り } from "../src/compile/kinds";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";

/**
 * 図種の名前は複数の層を通る。 1 層でも登録を忘れると、どの層も error を出さないまま
 * 黙って落ちる (#2513、 `rules/quality.md § 多層 SSOT 経路の全 registration 保証`)。
 *
 * `flowchart` はまさにこの形で取り残されていた。 描画の library にも案内表にも在るのに、
 * 記法が受理する図種にだけ無く、 一覧で見た図を同じ名前で書けなかった。
 *
 * ## 型検査が捕まえる層は、ここでは見ない
 *
 * `Record<PresetType, ...>` で書かれた表 (`図種の作り` / `空の形の逃げ先`) は、
 * 図種を足した時に鍵が足りないと型検査が落ちる。 ここで二重に数えても、
 * 型検査より後に落ちるだけで早くならない。
 *
 * 見るのは **型検査が捕まえない層**の 2 つ。
 *
 * | 層 | 捕まえない理由 |
 * |---|---|
 * | 組み立ての分岐 (`compile.ts` の `switch`) | 分岐が無い図種は `default` に落ち、型としては通る |
 * | 記法の形の決まり (`schemas/diagram.json`) | JSON なので型検査の対象外 |
 *
 * ## 走査した件数を出す
 *
 * 図種を 1 つも走査できていない run は、「登録漏れ 0 件」 も「測っていない」 も同じ 0 で返る。
 * 母数を突き合わせて空振りを落とす (`rules/quality.md § 0 件を報告する時は母数を併記する`)。
 */

const ここ = fileURLToPath(new URL(".", import.meta.url));
const 組み立ての本文 = readFileSync(`${ここ}../src/compile.ts`, "utf8");
const 決まり = JSON.parse(readFileSync(`${ここ}../src/schemas/diagram.json`, "utf8")) as {
  properties: { type: { enum: string[] } };
};

const 図種一覧 = [...PRESET_TYPES].sort();

describe("図種を足した時に登録先を 1 つも落とさない (#2513)", () => {
  it("走査した図種が 1 件以上ある (空振り対照)", () => {
    expect(図種一覧.length, "図種を 1 つも走査できていない").toBeGreaterThan(0);
    expect(図種一覧.length, "走査した数が実物と合わない").toBe(PRESET_TYPES.size);
  });

  it("組み立ての分岐が無い図種が 0 件", () => {
    const 無い = 図種一覧.filter((t) => !組み立ての本文.includes(`case "${t}":`));
    expect(無い, `組み立ての分岐が無い (compile.ts に足す / 走査 ${図種一覧.length} 件): ${無い.join(", ")}`).toEqual(
      [],
    );
  });

  it("記法の形の決まりに無い図種が 0 件", () => {
    const 決まりの並び = new Set(決まり.properties.type.enum);
    const 無い = 図種一覧.filter((t) => !決まりの並び.has(t));
    expect(無い, `決まりに無い (diagram.json に足す / 走査 ${図種一覧.length} 件): ${無い.join(", ")}`).toEqual([]);
  });

  it("決まりにだけ在って記法が受けない図種が 0 件", () => {
    // 逆向き。 決まりに綴りを間違えて足した形は、書けるのに図が出ない状態になる
    const 余り = 決まり.properties.type.enum.filter((t) => !(PRESET_TYPES as ReadonlySet<string>).has(t));
    expect(余り, `記法が受けない綴りが決まりに在る: ${余り.join(", ")}`).toEqual([]);
  });

  it("図種ごとの作りを決めていない図種が 0 件", () => {
    // 型検査も落ちるが、鍵だけ足して値を書き忘れた形はここで落ちる
    const 無い = 図種一覧.filter((t) => 図種の作り[t] === undefined);
    expect(無い, `作りを決めていない (kinds.ts に足す / 走査 ${図種一覧.length} 件): ${無い.join(", ")}`).toEqual([]);
  });
});

/**
 * 植え込み対照。
 *
 * 上の検査は「実物から導いた図種の一覧」 を回すので、一覧そのものが空になると全部通る。
 * 実在しない図種を混ぜた時に落ちることで、判定が効いていることを示す。
 */
describe("植え込み対照 (#2513)", () => {
  it("実在しない図種を混ぜると組み立ての分岐の検査が落ちる", () => {
    const 混ぜた = [...図種一覧, "no-such-diagram"];
    const 無い = 混ぜた.filter((t) => !組み立ての本文.includes(`case "${t}":`));
    expect(無い).toEqual(["no-such-diagram"]);
  });

  it("実在しない図種を混ぜると決まりの検査が落ちる", () => {
    const 決まりの並び = new Set(決まり.properties.type.enum);
    const 混ぜた = [...図種一覧, "no-such-diagram"];
    const 無い = 混ぜた.filter((t) => !決まりの並び.has(t));
    expect(無い).toEqual(["no-such-diagram"]);
  });
});

/**
 * 分かれ道の図が実際に組み上がる (#2513)。
 *
 * 登録だけ済ませて組み立てを書き忘れると、上の検査は通るのに図が出ない。
 * 記法から図まで通して、箱と矢印が出ることを見る。
 */
describe("分かれ道の図が記法から組み上がる (#2513)", () => {
  const 記法 = [
    'title: "申請の承認"',
    "type: flowchart",
    "",
    "actors:",
    "  - 申請を出す: { kind: mark-start, lane: 申請者 }",
    "  - 審査: { kind: decision, lane: 承認者 }",
    "  - 承認: { kind: mark-end, lane: 承認者 }",
    "  - 直して出し直す: { lane: 申請者 }",
    "",
    "flow:",
    "  - 申請を出す -> 審査",
    '  - 審査 -> 承認: "はい"',
    '  - 審査 -> 直して出し直す: "いいえ"',
  ].join("\n");

  const 組み立てる = (): ReturnType<typeof compileToCdl> => {
    const r = parseTextDslV05(記法);
    if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
    return compileToCdl(r.doc);
  };

  it("箱が 4 つ出る", () => {
    expect(組み立てる().nodes).toHaveLength(4);
  });

  it("縦列が 2 本出る", () => {
    expect((組み立てる().lanes ?? []).length).toBe(2);
  });

  it("分かれ道の箱に題が出る", () => {
    // 描画側は分かれ道を `card` として描く。 形の名前ではなく **題が出るか** を見る =
    // 読み手が画面で分かるのは題のほうで、内部の種別の綴りではない
    const 審査 = 組み立てる().nodes.find((n) => n.id === "審査");
    expect(審査?.title, "分かれ道の箱の題が出ていない").toBe("審査");
  });

  it("始まりと終わりの印は題を持たない (#1466 の決まり)", () => {
    // 塗った丸に字を載せる場所が無いため、名前を題にしない。 15 図種で共有する決まりで、
    // この図種だけの振る舞いではない
    const 印 = 組み立てる().nodes.filter((n) => n.id === "申請を出す" || n.id === "承認");
    expect(印).toHaveLength(2);
    expect(印.map((n) => n.title)).toEqual(["", ""]);
  });

  it("印に題を書けばその題が出る (収容対照)", () => {
    const 題つき = 記法.replace(
      "  - 申請を出す: { kind: mark-start, lane: 申請者 }",
      "  - 申請を出す: { kind: mark-start, title: 開始, lane: 申請者 }",
    );
    const r = parseTextDslV05(題つき);
    if (!r.ok) throw new Error(r.errors.map((e) => `L${e.line}: ${e.message}`).join("\n"));
    const 印 = compileToCdl(r.doc).nodes.find((n) => n.id === "申請を出す");
    expect(印?.title, "書いた題が使われていない").toBe("開始");
  });

  it("枝の札が図に出る", () => {
    const 札 = (組み立てる().edges ?? []).map((e) => e.label).filter(Boolean);
    expect(札).toEqual(expect.arrayContaining(["はい", "いいえ"]));
  });
});
