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
import { layout, type CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { PresetType } from "../src/types";
import { PRESET_TYPES } from "../src/v05/parser";
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
import * as partsInBox from "../../../apps/playground-spa/src/topics/catalog/parts-in-box.cdl";
import * as charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";
import { at } from "./support/at";

/**
 * 型ごとに作られるべき節点の種類。
 *
 * **実装から導かない**。 導くと実装がどう変わっても一致してしまい、 型の名前が約束したものを
 * 作らなくなったことを検知できない (`type: pie` が `card` を並べていた時、 実装から導く検査は
 * 通っていた)。 実測して表に書く。
 *
 * `sequence` / `solidity` は #1466 で 1 枚の板 (`sequence-board`) になった。
 * `pie` / `gantt` は図全体を 1 つの箱で描く種類。
 *
 * **`satisfies` を覆いの根拠にしない** (#1411)。 型検査の対象は
 * `packages/dragon/tsconfig.json` の `include` が `src/**` に限っており、`test/` は入らない。
 * つまりこの `satisfies Readonly<Record<PresetType, ...>>` は **1 度も検証されていなかった**。
 *
 * その間に表は 13 型しか持たず、6 型 (`bar` / `line` / `funnel` / `journey` / `quadrant` /
 * `tree`) が軸 1 と軸 2 を 1 度も通っていなかった。 覆いは
 * § 表が型の一覧をすべて覆う が実行時の集合 (`PRESET_TYPES`) で見る。
 *
 * `satisfies` 自体は残す。 対象を `test/` へ広げた時に効き始め、それまでも読み手には
 * 意図が伝わる。
 */
const 型と種類 = {
  sequence: ["sequence-board"],
  flow: ["actor"],
  swimlane: ["actor"],
  er: ["storage"],
  state: ["card"],
  topology: ["actor"],
  solidity: ["sequence-board"],
  gantt: ["gantt-timeline"],
  class: ["storage"],
  pie: ["chart-pie"],
  c4: ["actor"],
  // #1177 で `mind-map` 種別に寄せた (以前は card を 3 列に並べていた)
  mind: ["mind-map"],
  // 以下 6 型は #1411 で足した。 それまで表に無く、軸 1 と軸 2 を 1 度も通っていなかった
  bar: ["chart-bar"],
  line: ["chart-line"],
  funnel: ["funnel-stages"],
  journey: ["journey-map"],
  quadrant: ["quadrant-matrix"],
  tree: ["tree-hierarchy"],
  // 以下 2 型は #1446 で足した。 値を描く群で、`pie` / `bar` / `line` と同じ組み立てを通る
  gauge: ["chart-gauge"],
  radial: ["chart-radial"],
  // 以下 3 型は #1450 で足した
  stat: ["chart-stat"],
  waffle: ["chart-waffle"],
  stacked: ["chart-stacked-bar"],
  // #1647 で足した。 2 時点を直線でつなぐ図
  slope: ["chart-slope"],
} as const satisfies Readonly<Record<PresetType, readonly string[]>>;

/** 表の中身を `[型, 種類]` の並びで取り出す */
const 型の一覧 = Object.entries(型と種類) as ReadonlyArray<
  readonly [PresetType, readonly string[]]
>;

const 記法 = (type: PresetType): string =>
  `title: "t"\ntype: ${type}\n\nactors:\n  - A: "Q1"\n  - B: "Q2"\n\nflow:\n  - A -> B: "x"\n`;

/**
 * 中身の無い枠。 枠を作ったのに 1 つも節点が入っていないもの。
 *
 * 組 (`groups:`) の枠は節点を直接持たず、束ねた縦列の箱を囲む (#1972)。 節点の所属だけで数えると
 * 箱を囲んでいる枠まで空に数えるので、**描いた矩形の中に箱が収まるか** も中身として数える。
 * 所属を持たない縦列だけを配置して測る (全図を配置すると catalog 全件で時間がかかる)。
 */
const 空の枠 = (d: CdlDiagram): string[] => {
  const 使用 = new Set(d.nodes.map((n) => n.lane));
  const 候補 = d.lanes.filter((l) => !使用.has(l.id));
  if (候補.length === 0) return [];
  const 配置 = layout(d);
  const 囲む = (id: string): boolean => {
    const l = 配置.lanes.find((x) => x.id === id);
    if (!l) return false;
    const [x, y] = [l.x ?? 0, l.y ?? 0];
    return 配置.nodes.some(
      (n) =>
        n.cx - n.w / 2 >= x &&
        n.cx + n.w / 2 <= x + l.width &&
        n.cy - n.h / 2 >= y &&
        n.cy + n.h / 2 <= y + (l.height ?? 0),
    );
  };
  return 候補.filter((l) => !囲む(l.id)).map((l) => l.id);
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
  ["parts-in-box", partsInBox],
  ["charts", charts],
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
    /*
     * **`satisfies` に頼らない** (#1411)。 型検査の対象は `packages/dragon/tsconfig.json` の
     * `include` が `src/**` に限っており、`test/` はそこに入らない。 つまり
     * `satisfies Readonly<Record<PresetType, ...>>` は **1 度も検証されていなかった**。
     *
     * 実際その間に表は 13 型しか持たず、6 型 (`bar` / `line` / `funnel` / `journey` /
     * `quadrant` / `tree`) が軸 1 と軸 2 を 1 度も通っていなかった。
     *
     * 型ではなく **実行時の集合** で覆いを見る。 `PRESET_TYPES` は解析が実際に受理判定へ
     * 使う値で (`v05/parser.ts`)、記法と JSON の両入口が同じ集合を読む。 型注釈と違って
     * 走らせれば必ず評価される。
     */
    const 表の型 = new Set<string>(型の一覧.map(([t]) => t));
    expect(表の型.size, "表が空").toBeGreaterThan(0);

    // 記法が受ける型を、解析が通るかどうかで確かめる。 表に無い型が通れば漏れ
    const 漏れ = [...PRESET_TYPES].filter((t) => !表の型.has(t)).sort();
    expect(漏れ, `記法が受けるのに表に無い型: ${漏れ.join(", ")}`).toEqual([]);
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

  it("組の枠は囲んだ箱を中身に数え、箱から離した枠と箱の入らない縦列は空に数える (#1972)", () => {
    const 組の図 = textDslToDiagram(`title: "t"
type: flow

lanes:
  web: { label: "受付の層" }
  app: { label: "処理の層" }

groups:
  inside: { label: "社内の網", lanes: [web, app] }

actors:
  - 利用者: { kind: card, lane: web }
  - 注文の処理: { kind: card, lane: app }

flow:
  - 利用者 -> 注文の処理: "注文"
`);
    const 枠 = 組の図.lanes.find((l) => l.id === "group-inside");
    expect(枠, "組の枠が作られていない (検査が空振りしている)").toBeDefined();
    expect(空の枠(組の図)).toEqual([]);
    // 植え込み対照。 箱の入らない縦列と、箱から遠くへ離した枠は空と数える
    const 離した: CdlDiagram = {
      ...組の図,
      lanes: [
        ...組の図.lanes.map((l) => (l.id === "group-inside" ? { ...l, posX: 5000 } : l)),
        { id: "zz", label: "空", width: 400 },
      ],
    };
    expect(空の枠(離した).sort()).toEqual(["group-inside", "zz"]);
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
  it("全見本で読めなかった項目が 0 件", () => {
    // 記法の解析は「読めなかった項目」 を誤りとして返す (`#1090`)。 見本がその形を含んで
    // いると、 見本を写して書いた人が同じ形を書いてしまう
    expect(EDITOR_SAMPLES.length, "見本を 1 件も読めていない").toBeGreaterThan(0);
    const 問題 = EDITOR_SAMPLES.flatMap((s) => {
      const r = parseTextDslV05(s.code);
      return r.ok
        ? []
        : [`${s.slug}: ${r.errors.map((e) => `L${e.line} ${e.message}`).join(" / ")}`];
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

/**
 * 一覧に載る図が 1 つ残らず対象に入っているか (#1409)。
 *
 * `catalog` は手で並べるため、ページを足した時に **ここへ足し忘れる**。
 * 忘れても本 file は通る = 検査の件数が減るだけで、何も落ちない。
 *
 * 実際 `charts` が一覧に載りながら漏れており、「図になる前」 の 3 軸を 1 度も通って
 * いなかった。
 *
 * 同じ形は 4 度目 (#1403 / #1405 / #1407 / #1409)。 突き合わせの道具は
 * `apps/playground-spa/src/lib/catalog-scope.ts` に括り、そちらが自身の検査を持つ。
 */
describe("一覧に載る図が 1 つ残らず対象に入っている (#1409)", () => {
  /** 一覧を読む道具は 4 つの検査で共有する。 定義と検査は catalog-scope が持つ */
  const 一覧の図 = async (): Promise<string[]> => (await import("@/lib/catalog-scope")).一覧の図();
  const 差分 = async (l: readonly string[], r: readonly string[]): Promise<string[]> =>
    (await import("@/lib/catalog-scope")).差分(l, r);

  /** 本 file が見る図の id (`<ページ>/<id>` の形で持つので id 側だけを取る) */
  const 対象の図 = (): string[] => catalog図.map(([名]) => 名.slice(名.indexOf("/") + 1));

  it("一覧の図と対象の図を 1 件以上集められている", async () => {
    // 空振り防止。 どちらかが空だと下の 2 件が両方とも「差が無い」 で通る
    const [一覧, 対象] = [await 一覧の図(), 対象の図()];
    expect(一覧.length, "一覧から図を 1 件も集められていない").toBeGreaterThan(0);
    expect(対象.length, "対象から図を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("一覧にあって対象に無い図が無い", async () => {
    const 漏れ = await 差分(await 一覧の図(), 対象の図());
    expect(漏れ, "一覧に出るのに図になる前の検査を通っていない図").toEqual([]);
  });

  it("対象だが一覧に無い図が無い", async () => {
    const 余り = await 差分(対象の図(), await 一覧の図());
    expect(余り, "図になる前の検査を通っているが一覧に出ない図").toEqual([]);
  });
});

/**
 * 記法が受ける型が 1 つ残らず見本を持つか (#1411)。
 *
 * 型を足しても、見本を書かなければ **書き方の例がどこにも無い** 状態になる。
 * 実際 `solidity` が 18 型のうち 1 つだけ見本 0 件で、種別による縦列の並べ替えという
 * 固有の機能を利用者が知る手段が無かった。
 *
 * ## 型の一覧は `PresetType` から導く
 *
 * ここに型を並べてはいけない。 並べると `PresetType` を増やした時に片方だけ直る
 * (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * `型と種類` は `Record<PresetType, ...>` として宣言されており、既存の検査
 * (§ 表が型の一覧をすべて覆う) が実物との一致を固定している。 その鍵を使う。
 *
 * ## 見本は記法から数える
 *
 * 組み立て API の図ではなく `sourceYaml__*` の `type:` を数える。 見たいのは
 * 「記法でどう書くかの例があるか」 で、図があっても記法が無ければ例にならない。
 */
describe("記法が受ける型が 1 つ残らず見本を持つ (#1411)", () => {
  /** カタログの記法に現れる型を数える */
  const 見本の型 = (): Map<string, number> => {
    const out = new Map<string, number>();
    for (const [, mod] of catalog) {
      for (const [k, v] of Object.entries(mod)) {
        if (!k.startsWith("sourceYaml__") || typeof v !== "string") continue;
        const m = /^type:\s*([a-z0-9-]+)/m.exec(v);
        if (m) out.set(at(m, 1, "m"), (out.get(at(m, 1, "m")) ?? 0) + 1);
      }
    }
    return out;
  };

  it("記法を持つ見本を 1 件以上集められている", () => {
    // 空振り防止。 集められていないと下の 2 件が「全型が 0 件」 と「全型が余り」 で
    // どちらも意味を失う
    const 数 = 見本の型();
    expect(数.size, "カタログの記法から型を 1 つも集められていない").toBeGreaterThan(0);
  });

  it("見本が 0 件の型が無い", () => {
    const 数 = 見本の型();
    const ゼロ = 型の一覧.map(([t]) => t).filter((t) => !(数.get(t) ?? 0));
    expect(ゼロ, `記法で書けるのに見本が無い型: ${ゼロ.join(", ")}`).toEqual([]);
  });

  it("型の一覧に無い型を見本が使っていない", () => {
    // 記法が受けない型を見本が書いていると、その見本は組み立てを通っていない
    const 型 = new Set<string>(型の一覧.map(([t]) => t));
    const 表外 = [...見本の型().keys()].filter((t) => !型.has(t)).sort();
    expect(表外, `型の一覧に無い型を使う見本がある: ${表外.join(", ")}`).toEqual([]);
  });
});
