/**
 * 記法が出す種別が、依存が実際に持つ種別であることの検査 (#1448)。
 *
 * ## なぜ要るか
 *
 * #1446 は「描画側は半円と弧を描けるのに記法が受け付けない」 という見立てで `type: gauge` /
 * `type: radial` を足したが、**公開されている `@cardenelabs/cdl@0.14.0` に 2 種は無かった**
 * (型にも実行時にも無い)。 手元の `node_modules` に未公開の build が上書きされていたため、
 * 開発中は種別の一覧に 2 種が入って見えていた。
 *
 * 汚れは同時に別の形でも現れていた = 型定義の file が 3 つに増え、それを見る 2 つの検査が
 * 落ち続けていた。 **その 2 件を「手元の環境の問題」 として脇に置いたのが分かれ目**。
 * 同じ汚れが「種別が 2 つ多い」 という形でも嘘を返していることに気付けなくなった。
 *
 * ## この検査が見るもの
 *
 * 記法の型が作る種別を **組み立てを実際に走らせて** 集め、依存の `NODE_KINDS` に無いものが
 * 1 つでもあれば落とす。
 *
 * 手元の install が汚れていても効く = 汚れた一覧に 2 種が入っていれば通るが、
 * clean な環境 (CI が無いので配布前の手元での入れ直し) で必ず落ちる。 落ちた時に
 * 「依存を上げるまで書けない」 と読めるよう、message に足りない種別と依存の版を出す。
 *
 * ## 実物から導く
 *
 * 型の一覧は `PRESET_TYPES` から取り、種別は組み立ての出力から取る。 どちらも手で並べない
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。 型を足せばこの検査の母集団に自動で入る。
 */
import { describe, it, expect } from "vitest";
import { NODE_KINDS } from "@cardenelabs/cdl";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { textDslToDiagram } from "../src/index";
import { PRESET_TYPES } from "../src/v05/parser";
import type { PresetType } from "../src/types";

/** 記法の型の並び。 `PRESET_TYPES` は集合なので、並びに直してから回す */
const 型の一覧: readonly PresetType[] = [...PRESET_TYPES];

/**
 * 依存の版。 落ちた時に「どの版に無いのか」 が message から読めるようにする。
 *
 * `require("@cardenelabs/cdl/package.json")` は使えない = 依存が `exports` を持ち、
 * `package.json` を出口に載せていないため解決できない。 依存の入口を解決してから、
 * その上へ `package.json` が見つかるまで遡る。
 */
const 依存の版 = (): string => {
  try {
    const require_ = createRequire(import.meta.url);
    let dir = dirname(require_.resolve("@cardenelabs/cdl"));
    for (let i = 0; i < 8; i += 1) {
      const 候補 = join(dir, "package.json");
      if (existsSync(候補)) {
        const pkg = JSON.parse(readFileSync(候補, "utf8")) as { name?: string; version?: string };
        if (pkg.name === "@cardenelabs/cdl") return pkg.version ?? "(版が無い)";
      }
      const 親 = dirname(dir);
      if (親 === dir) break;
      dir = 親;
    }
    return "(読めない)";
  } catch {
    return "(読めない)";
  }
};

/**
 * その型の最小の記法。
 *
 * 値を並べる型 (`pie` / `bar` 等) と、矢印で関係を書く型 (`flow` / `er` 等) の両方が
 * 通るように、登場人物と矢印の両方を書く。 読まれない項目は無視されるだけで誤りにならない。
 */
const 記法 = (type: PresetType): string =>
  `title: "t"\ntype: ${type}\n\nactors:\n  - A: "10"\n  - B: "20"\n\nflow:\n  - A -> B: "x"\n`;

/** その型が作る節の種別を、組み立てを実際に走らせて集める */
function 種別を集める(type: PresetType): string[] {
  return [...new Set(textDslToDiagram(記法(type)).nodes.map((n) => n.kind as string))];
}

describe("記法が出す種別は依存が持つ種別だけ (#1448)", () => {
  it("型を 1 つ以上見ている (検査が空振りしていない)", () => {
    expect(型の一覧.length, "記法の型を 1 つも見つけられていない").toBeGreaterThan(0);
  });

  it("依存の種別の一覧が空でない (検査が空振りしていない)", () => {
    // 一覧を読めていないと、以下の突き合わせが「全部無い」 でも「全部ある」 でもなく素通りする
    expect(NODE_KINDS.length, "依存の種別を 1 つも読めていない").toBeGreaterThan(0);
  });

  it("依存の版を読める (落ちた時の手掛かりが消えていない)", () => {
    // 版が読めないと、落ちた時に「どの版に無いのか」 が分からず、依存を上げるべきか
    // 記法を直すべきかを読み手が決められない
    expect(依存の版(), "依存の版を読めていない").toMatch(/^\d+\.\d+\.\d+/);
  });

  it("全ての型で、作られる種別を 1 つ以上観測できる (検査が空振りしていない)", () => {
    const 空 = 型の一覧.filter((t) => 種別を集める(t).length === 0);
    expect(空, "節を 1 つも作らない型がある (組み立てが走っていない)").toEqual([]);
  });

  it("依存が知らない種別を作る型が無い", () => {
    const 持っている = new Set<string>(NODE_KINDS);
    const 足りない = 型の一覧.flatMap((t) =>
      種別を集める(t)
        .filter((k) => !持っている.has(k))
        .map((k) => `${t} → ${k}`),
    );
    expect(
      足りない,
      `依存 (@cardenelabs/cdl@${依存の版()}) が持たない種別を作っている。 ` +
        `依存を上げるまで、その型は記法から書けない`,
    ).toEqual([]);
  });
});
