/**
 * 速さを測る道具。
 *
 * 5 通りの入力 (small / medium / large / huge / animation-heavy) について、
 * 読み取り (記法 → doc) / 組み立て (doc → 図) / 配置 (図 → 置いた図) の 3 段を別々に測る。
 *
 * 起動 = `pnpm run test:bench`。
 *
 * **workspace に無い package を選ぶ書き方を置かない** (#2248)。 以前ここには
 * `--filter` で外から入れている依存を選ぶ書き方が載っており、打つと
 * `No projects matched the filters` と出たうえで **成功として終わる** =
 * 打った人には通ったように見え、1 件も測っていないことに気付けない。
 *
 * 測った値は repo に残さない。 残す場所を注記に書いていた時期があるが、
 * 書いた場所は git の追跡外で日ごとに掃除されるため、在ると書いても保てなかった。
 *
 * ## 段によって図の種類を変える (#2250)
 *
 * 3 段とも `sequence` で測っていた間、**配置の 5 行が全て同じ値だった**
 * (10 箱で 373,359 回/秒、1000 箱で 405,231 回/秒。 大きいほうが速い)。
 *
 * `sequence` は箱が何個あっても **1 枚の板**に組み上がり、箱と矢印は板の中の値になる。
 * 配置が並べるのは板 1 枚なので、箱を 100 倍にしても配置の仕事は増えない。
 * 同じ箱数を `flow` で組むと箱がそのままの数だけ出るので、配置は大きさに反応する。
 *
 * | 段 | 使う種類 | なぜ |
 * |---|---|---|
 * | 読み取り | `sequence` | 記法の行数に反応する。 種類を変える理由が無い |
 * | 組み立て | `sequence` | 板の中に詰める値が箱の数だけ増えるので反応する |
 * | 配置 | `flow` | `sequence` では板 1 枚しか置かないため、大きさに反応しない |
 *
 * この前提 (`sequence` は 1 枚 / `flow` は箱の数だけ) は `bench-cases-scale.test.ts` が
 * 実際に組み上げて確かめる。 前提が変われば そちらが落ちる。
 *
 * ## 読み取りは v0.5 の入口を直に呼ぶ
 *
 * `textDslToDiagram` の種類の見分けは記法の先頭 60 行だけを見るため、100 箱を超えると
 * 矢印と動きの行が窓の外に出て、古い入口へ回される。
 * ここでは 3 段を別々に測るので、v0.5 の入口を直に呼ぶ。
 */
import { bench, describe } from "vitest";
import { parseTextDslV05, compileToCdl } from "@cardenelabs/dragon";
import { layout } from "@cardenelabs/cdl";
import type { DslDocument } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CASES, 記法を作る, type 図の種類 } from "./bench-cases";

function 組み上げる(種類: 図の種類, label: string): { src: string; doc: DslDocument; cdl: CdlDiagram } {
  const c = CASES.find((x) => x.label === label)!;
  const src = 記法を作る(種類, c);
  const r = parseTextDslV05(src);
  if (!r.ok) {
    throw new Error(
      `bench の下ごしらえが ${種類} / ${label} で失敗した: ${r.errors.map((e) => `L${e.line} ${e.message}`).join(", ")}`,
    );
  }
  return { src, doc: r.doc, cdl: compileToCdl(r.doc) };
}

/** 読み取りと組み立てが測る入力 */
const 板の入力: Record<string, { src: string; doc: DslDocument; cdl: CdlDiagram }> = {};
/** 配置が測る入力 (箱が入力の数だけ出る種類) */
const 箱の入力: Record<string, { src: string; doc: DslDocument; cdl: CdlDiagram }> = {};
for (const c of CASES) {
  板の入力[c.label] = 組み上げる("sequence", c.label);
  箱の入力[c.label] = 組み上げる("flow", c.label);
}

describe("parse (Text DSL → DslDocument)", () => {
  for (const c of CASES) {
    const { src } = 板の入力[c.label]!;
    bench(c.label, () => {
      const r = parseTextDslV05(src);
      if (!r.ok) throw new Error("parse failed during bench");
    });
  }
});

describe("compile (DslDocument → CdlDiagram)", () => {
  for (const c of CASES) {
    const { doc } = 板の入力[c.label]!;
    bench(c.label, () => {
      compileToCdl(doc);
    });
  }
});

describe("layout (CdlDiagram → LaidDiagram)", () => {
  for (const c of CASES) {
    const { cdl } = 箱の入力[c.label]!;
    bench(c.label, () => {
      layout(cdl);
    });
  }
});
