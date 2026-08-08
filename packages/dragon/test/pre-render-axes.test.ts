/**
 * 「図になる前」 を見る機械検査 (#1096)。
 *
 * cdl の `visualValidate` は 63 軸を持ち、 dragon 側の `visual-validate-sweep` が catalog 412 件を
 * 全件通している。 しかし 63 軸が見るのは **図が cdl に渡った後、 その中で崩れていないか** で、
 * 図になる前の 3 つの層に検査が無かった。
 *
 * この欠落のため、 `type: pie` が円を描かない / `type: gantt` が帯を描かない /
 * `type: c4` に空の枠が残る の 3 件は、 人が画面を見て報告するまで誰も気付かなかった。
 * どれも「箱が並んでいる」 だけなので幾何としては違反が無く、 63 軸は素通しする。
 *
 * | 軸 | 見るもの | なぜ 63 軸で捕まらないか |
 * |---|---|---|
 * | 型と形の対応 | 型の名前が約束した種類の節点が作られたか | 別の種類でも幾何としては正しい |
 * | 中身の無い枠 | 枠を作って中身が 0 件でないか | 空の枠は重なりも余白も違反しない |
 * | 捨てられた指定 | 記法の解析が読めなかった項目を返していないか | 図になる前の層 |
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { PresetType } from "../src/types";
import { parseTextDslV05 } from "../src/v05";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";
import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";

/**
 * 型ごとに作られるべき節点の種類。
 *
 * **実装から導かない**。 導くと実装がどう変わっても一致してしまい、 型の名前が約束したものを
 * 作らなくなったことを検知できない (`type: pie` が `card` を並べていた時、 実装から導く検査は
 * 通っていた)。 実測して表に書く。
 *
 * `sequence` / `solidity` は名札 (上端 / 下端) を `card` で作り、 段の目印も `card` なので
 * `card` だけになる。 `pie` / `gantt` は図全体を 1 つの箱で描く種類。
 *
 * **`PresetType` でキーを付ける**。 件数だけを見る形にすると、 13 番目の型を足して表への追加を
 * 忘れても件数は 12 のままで通る (Round 1 review の指摘)。 `Record<PresetType, ...>` にすれば、
 * 型を足した時点で型検査が「表に無い」 と言う。 余分なキーも同じく型検査で落ちる。
 */
const 型と種類 = {
  sequence: ["card"],
  flow: ["actor"],
  swimlane: ["actor"],
  er: ["storage"],
  state: ["card"],
  topology: ["actor"],
  solidity: ["card"],
  gantt: ["gantt-timeline"],
  class: ["storage"],
  pie: ["chart-pie"],
  c4: ["actor"],
  mind: ["card"],
} as const satisfies Readonly<Record<PresetType, readonly string[]>>;

/** 表の中身を `[型, 種類]` の並びで取り出す */
const 型の一覧 = Object.entries(型と種類) as ReadonlyArray<readonly [PresetType, readonly string[]]>;

const 記法 = (type: PresetType): string =>
  `title: "t"\ntype: ${type}\n\nactors:\n  - A: "Q1"\n  - B: "Q2"\n\nflow:\n  - A -> B: "x"\n`;

/** 中身の無い枠。 枠を作ったのに 1 つも節点が入っていないもの */
const 空の枠 = (d: CdlDiagram): string[] => {
  const 使用 = new Set(d.nodes.map((n) => n.lane));
  return d.lanes.filter((l) => !使用.has(l.id)).map((l) => l.id);
};

const catalog: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
  ["cookbook", cookbook],
  ["patterns", patterns],
  ["presets", presets],
  ["primitives", primitives],
  ["primitives-extra", primitivesExtra],
  ["text-dsl", textDsl],
  ["animation", animation],
  ["styles", styles],
  ["interactive", interactive],
  ["ethereum", ethereum],
  ["parts", parts],
];

const 図か = (v: unknown): v is CdlDiagram =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as CdlDiagram).nodes) &&
  Array.isArray((v as CdlDiagram).lanes);

/** catalog の全図を 1 度だけ集める */
const catalog図: ReadonlyArray<readonly [string, CdlDiagram]> = catalog.flatMap(([name, mod]) =>
  Object.values(mod)
    .filter(図か)
    .map((d) => [`${name}/${d.id}`, d] as const),
);

describe("軸 1 = 型の名前が約束した種類の節点を作る (#1096)", () => {
  for (const [type, 種類] of 型の一覧) {
    it(`type: ${type} は ${種類.join(" / ")} を作る`, () => {
      const d = textDslToDiagram(記法(type));
      expect(d.nodes.length, "節点が 1 つも無い").toBeGreaterThan(0);
      const 実際 = [...new Set(d.nodes.map((n) => String(n.kind)))].sort();
      expect(実際, `作られた種類が違う: ${実際.join(", ")}`).toEqual([...種類].sort());
    });
  }

  it("表が型の一覧をすべて覆う", () => {
    // `satisfies Readonly<Record<PresetType, ...>>` が抜けと余りを型検査で落とすので、 ここでは
    // 表が空でないことだけを見る (型検査を通った時点で網羅は保証されている)。
    // 件数を数える形は採らない = 13 番目の型を足して表を直し忘れても件数は 12 のままで通る
    expect(型の一覧.length, "表が空").toBeGreaterThan(0);
  });
});

describe("軸 2 = 中身の無い枠を作らない (#1096)", () => {
  for (const [type] of 型の一覧) {
    it(`type: ${type} で空の枠が残らない`, () => {
      const d = textDslToDiagram(記法(type));
      expect(d.lanes.length, "枠が 1 つも無い").toBeGreaterThan(0);
      expect(空の枠(d), `中身の無い枠が残っている: ${空の枠(d).join(", ")}`).toEqual([]);
    });
  }

  for (const [type] of 型の一覧) {
    it(`type: ${type} で登場人物が 0 人でも空の枠が残らない`, () => {
      // 到達できる境界。 `title` と `type` だけの本文は解析を通る (実測) ので、 枠を先に作る
      // 実装では中身の無い枠が残る (Round 1 review の指摘。 実測で `mind` / `flow` /
      // `topology` / `class` の 4 種が該当した)
      const d = textDslToDiagram(`title: "t"\ntype: ${type}\n`);
      expect(空の枠(d), `中身の無い枠が残っている: ${空の枠(d).join(", ")}`).toEqual([]);
    });
  }

  it("枝の数を変えても空の枠が残らない (mind)", () => {
    // 実測で `mind` は枠を 3 つ固定で作っており、 枝が 1 本の図で右の枠が空だった。
    // 枝の数で使う枠が変わるので、 1 件だけ見ても足りない
    const 問題: string[] = [];
    for (let n = 1; n <= 6; n += 1) {
      const actors = Array.from({ length: n }, (_, i) => `  - A${i}`).join("\n");
      const d = textDslToDiagram(`title: "t"\ntype: mind\n\nactors:\n${actors}\n`);
      const 空 = 空の枠(d);
      if (空.length > 0) 問題.push(`登場人物 ${n} 人: ${空.join(", ")}`);
    }
    expect(問題, `中身の無い枠が残っている: ${問題.join(" / ")}`).toEqual([]);
  });

  it("catalog の全図で空の枠が残らない", () => {
    expect(catalog図.length, "catalog を 1 件も読めていない").toBeGreaterThan(400);
    const 問題 = catalog図
      .filter(([, d]) => 空の枠(d).length > 0)
      .map(([name, d]) => `${name}: ${空の枠(d).join(", ")}`);
    expect(問題, `中身の無い枠が残っている: ${問題.slice(0, 10).join(" / ")}`).toEqual([]);
  });
});

describe("軸 3 = 書いた指定が黙って捨てられない (#1096)", () => {
  it("見本 12 件で読めなかった項目が 0 件", () => {
    // 記法の解析は「読めなかった項目」 を誤りとして返す (`#1090`)。 見本がその形を含んで
    // いると、 見本を写して書いた人が同じ形を書いてしまう
    expect(EDITOR_SAMPLES.length, "見本を 1 件も読めていない").toBeGreaterThan(0);
    const 問題 = EDITOR_SAMPLES.flatMap((s) => {
      const r = parseTextDslV05(s.code);
      return r.ok ? [] : [`${s.slug}: ${r.errors.map((e) => `L${e.line} ${e.message}`).join(" / ")}`];
    });
    expect(問題, `見本に誤りがある: ${問題.join(" / ")}`).toEqual([]);
  });

  it("見本が実際に図になる", () => {
    // 解析が通っても組み立てで落ちることがある。 誤り 0 件だけでは「描ける」 と言えない
    const 問題 = EDITOR_SAMPLES.flatMap((s) => {
      try {
        const d = textDslToDiagram(s.code);
        return d.nodes.length > 0 ? [] : [`${s.slug}: 節点が 0 件`];
      } catch (e) {
        return [`${s.slug}: ${String(e).slice(0, 60)}`];
      }
    });
    expect(問題, `見本が図にならない: ${問題.join(" / ")}`).toEqual([]);
  });

  it("組み立てで捨てられた指定が 0 件", () => {
    // 解析を通っても、 組み立てで「書いたが効かなかった」 ことがある (順序図に効かない相対位置 /
    // 居ない相手を指した focus 等)。 それは誤りではなく知らせ (`onNotice`) として返るので、
    // `r.ok` だけを見ていると素通りする (Round 1 review の指摘)
    const 問題 = EDITOR_SAMPLES.flatMap((s) => {
      const 知らせ: string[] = [];
      textDslToDiagram(s.code, { onNotice: (n) => 知らせ.push(`${n.kind}(${n.actor})`) });
      return 知らせ.length > 0 ? [`${s.slug}: ${知らせ.join(", ")}`] : [];
    });
    expect(問題, `見本に効かない指定がある: ${問題.join(" / ")}`).toEqual([]);
  });
});
