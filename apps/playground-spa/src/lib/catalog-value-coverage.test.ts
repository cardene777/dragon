/**
 * 欄が取る値を、カタログが全て見せているかを数える検査 (#1966)。
 *
 * ## なぜ要るか
 *
 * 網羅の検査は 3 本あるが、どれも **欄が取る値の種類** を見ていなかった。
 *
 * | 検査 | 見ているもの |
 * |---|---|
 * | `catalog-kind-coverage.test.ts` | 節の種別が全て見本を持つか |
 * | `catalog-notation-coverage.test.ts` | 見本が記法を持つか |
 * | `catalog-payload-coverage.test.tsx` | 節と矢印の任意の欄を 1 度でも書いたか |
 *
 * 3 本目は欄を 1 度書けば通る。 節の色 (`tone`) は `accent` を 1 件書いただけで通り、残る 5 色は
 * カタログのどこにも出ていなかった。 同じ形で、矢印の先端と根元の形・出る辺・形の満ちる向き・
 * 体験の道筋の気持ちの 16 個が抜けていた。
 *
 * ## 値の一覧は engine から出す
 *
 * 欄ごとに値を覆う方法の表を持ち、**`satisfies Record<値の型, 覆い方>` で閉じる**。
 * engine が値を 1 つ足すと `tsc` が落ちるので、見本を足すか覆い方を決めるまで進めない。
 *
 * ## 覆い方は 3 つ
 *
 * | 覆い方 | 意味 | 裏取り |
 * |---|---|---|
 * | `見本` | カタログのどこかの図に書いてある | 書いた図が 1 枚以上ある |
 * | `既定` | 書かない図が同じ形になる | 書いた図と書かない図の配置が一致する |
 * | `画面の切替` | 画面の `オプション` の切替が全ての値を持つ | 切替の選択肢の数が値の数と一致する |
 *
 * **どの覆い方にも裏取りが付く**。 書いただけで通る覆い方は 1 つも無い。
 *
 * ## 数えていない欄
 *
 * 図表の中身・工程・枝の色 (`chartData[].tone` 等) は数えない。 `catalog-payload-coverage.test.tsx` が
 * 「色だけが変わる欄は見本を求めない」 と決めており、2 つの検査で判断を分けない。
 *
 * ## 記法で書ける欄は型定義から数える (#1969)
 *
 * 上の軸は描画側の図 (`CdlDiagram`) の欄を読む。 記法にしか無い欄 (並ぶ向き・始まりと終わりの印・
 * 矢印の端の塗り・入力の種類など) は図に写ると別の形になるため、軸を並べても数え落とした。
 * 実測で JSON の型定義の欄と列挙値 552 個のうち 64 個が、カタログのどの JSON にも書かれていなかった。
 *
 * そこで記法の JSON の型定義 (`diagramJsonSchema`) を歩いて欄の道と列挙値を全て集め、カタログの
 * JSON に書かれた道と突き合わせる。 書かれていない道は、下の 4 つの覆い方のどれかに載せる。
 *
 * | 覆い方 | 意味 | 裏取り |
 * |---|---|---|
 * | 色の別名 | 同じ色の別の書き方 (`成功` は `success`) | 別名の指す色が同じ欄に書かれている |
 * | 既定 | 書かない図が同じ見え方になる | 書いた図と書かない図の描画が一致する |
 * | 画面の切替 | 画面の `オプション` の切替が全ての値を持つ | 切替の選択肢の数が値の数と一致する |
 * | 直してから見本 | 見本を置く前に直す不具合がある | Issue 番号を持ち、道がまだ書かれていない |
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { TONE_ALIAS, diagramJsonSchema, jsonToDiagram } from "@cardenelabs/dragon";
import {
  CdlDiagramView,
  EDGE_HEADS,
  EDGE_HEAD_DEFAULT,
  EDGE_HEAD_FILLS,
  EDGE_HEAD_FILL_DEFAULT,
  EDGE_STYLES,
  TONES,
  layout,
  type CdlDiagram,
  type ChartPieForm,
  type ChartSlopeForm,
  type EdgeHead,
  type EdgeHeadFill,
  type EdgeStyle,
  type JourneyEmotion,
  type Side,
  type Tone,
} from "@cardenelabs/cdl";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";
import { 円の見せ方の選択肢 } from "./chart-pie-options";
import { 傾きの見せ方の選択肢 } from "./chart-slope-options";
import { 配色の選択肢 } from "./palette-switch";

type 覆い方 = "見本" | "既定" | "画面の切替";
type 素 = Record<string, unknown>;

/** 矢印の道筋の値。 engine は型に名前を付けていないので、欄の型から引く */
type 道筋 = NonNullable<CdlDiagram["edges"][number]["routing"]>;
/** 形の満ちる向き。 四角の形だけが持つ */
type 満ちる向き = NonNullable<
  Extract<NonNullable<CdlDiagram["nodes"][number]["shape"]>, { kind: "rect" }>["orient"]
>;

/** 欄 1 つ分 */
interface 軸 {
  /** 画面や失敗の文に出す名前 */
  名: string;
  /** 値ごとの覆い方 */
  表: Record<string, 覆い方>;
  /** 図に書かれた値を全て返す。 記法の値 (`{状態}`) はまだ解かない */
  読む: (d: CdlDiagram) => unknown[];
  /**
   * `読む` が返した並びの `添字` 番目の対象に値を書く (`undefined` なら消す)。 `既定` の裏取りに使う。
   * 書いた欄の名前 (`欄`) は配置を比べる時に外す = 欄そのものは配置の結果にも写るため
   */
  置く?: { 欄: string; 書く: (d: CdlDiagram, 添字: number, 値: string | undefined) => CdlDiagram };
  /** 画面の切替の選択肢。 `画面の切替` の裏取りに使う */
  切替の選択肢?: readonly string[];
}

const 写す = (d: CdlDiagram): CdlDiagram => JSON.parse(JSON.stringify(d)) as CdlDiagram;

/** 矢印の欄を読む軸の部品 */
const 矢印の欄を読む =
  (欄: string) =>
  (d: CdlDiagram): unknown[] =>
    d.edges.map((e) => (e as unknown as 素)[欄]);

const 矢印の欄に置く = (欄: string): NonNullable<軸["置く"]> => ({
  欄,
  書く: (d, 添字, 値) => {
    const 次 = 写す(d);
    const e = 次.edges[添字] as unknown as 素;
    if (値 === undefined) delete e[欄];
    else e[欄] = 値;
    return 次;
  },
});

/** 体験の道筋の段ごとの気持ちを読む。 段の値から入る分 (`{状態}`) は `値を解く` が解く */
function 道筋の気持ち(d: CdlDiagram): unknown[] {
  return d.nodes.flatMap((n) => (n.journeyData ?? []).map((j) => (j as unknown as 素).emotion));
}

const 軸たち: 軸[] = [
  {
    名: "節の色 (tone)",
    表: {
      accent: "見本",
      teal: "見本",
      success: "見本",
      error: "見本",
      warning: "見本",
      info: "見本",
    } satisfies Record<Tone, 覆い方>,
    読む: (d) => d.nodes.map((n) => n.tone),
  },
  {
    名: "矢印の色 (tone)",
    表: {
      accent: "見本",
      teal: "見本",
      success: "見本",
      error: "見本",
      warning: "見本",
      info: "見本",
    } satisfies Record<Tone, 覆い方>,
    読む: 矢印の欄を読む("tone"),
  },
  {
    名: "矢印の線の種類 (style)",
    表: {
      solid: "見本",
      "dotted-flow": "見本",
      dashed: "見本",
    } satisfies Record<EdgeStyle, 覆い方>,
    読む: 矢印の欄を読む("style"),
  },
  {
    名: "矢印の先端の形 (head)",
    表: {
      none: "見本",
      triangle: "見本",
      diamond: "見本",
      open: "見本",
      crow: "見本",
      one: "見本",
      "zero-one": "見本",
      many: "見本",
      "zero-many": "見本",
    } satisfies Record<EdgeHead, 覆い方>,
    読む: 矢印の欄を読む("head"),
  },
  {
    名: "矢印の根元の形 (tailHead)",
    表: {
      none: "見本",
      triangle: "見本",
      diamond: "見本",
      open: "見本",
      crow: "見本",
      one: "見本",
      "zero-one": "見本",
      many: "見本",
      "zero-many": "見本",
    } satisfies Record<EdgeHead, 覆い方>,
    読む: 矢印の欄を読む("tailHead"),
  },
  {
    名: "矢印の先端の塗り (headFill)",
    表: { solid: "見本", hollow: "見本" } satisfies Record<EdgeHeadFill, 覆い方>,
    読む: 矢印の欄を読む("headFill"),
  },
  {
    名: "矢印の根元の塗り (tailHeadFill)",
    表: { solid: "見本", hollow: "見本" } satisfies Record<EdgeHeadFill, 覆い方>,
    読む: 矢印の欄を読む("tailHeadFill"),
  },
  {
    名: "矢印の出る辺 (side)",
    表: { top: "見本", right: "見本", bottom: "見本", left: "見本" } satisfies Record<Side, 覆い方>,
    読む: 矢印の欄を読む("side"),
  },
  {
    名: "矢印の道筋 (routing)",
    // 書かない矢印は自動で道筋を引く。 `default` を書いても同じ道筋になる
    表: { default: "既定", "back-detour": "見本" } satisfies Record<道筋, 覆い方>,
    読む: 矢印の欄を読む("routing"),
    置く: 矢印の欄に置く("routing"),
  },
  {
    名: "形の満ちる向き (shape.orient)",
    表: { up: "見本", down: "見本", left: "見本", right: "見本" } satisfies Record<
      満ちる向き,
      覆い方
    >,
    読む: (d) => d.nodes.flatMap((n) => (n.shape?.kind === "rect" ? [n.shape.orient] : [])),
  },
  {
    名: "体験の道筋の気持ち (journeyData[].emotion)",
    表: {
      delighted: "見本",
      happy: "見本",
      neutral: "見本",
      frustrated: "見本",
      angry: "見本",
    } satisfies Record<JourneyEmotion, 覆い方>,
    読む: 道筋の気持ち,
  },
  {
    名: "円グラフの見せ方 (chartPieForm)",
    表: { ring: "画面の切替", arcs: "画面の切替", table: "画面の切替" } satisfies Record<
      ChartPieForm,
      覆い方
    >,
    読む: (d) => d.nodes.map((n) => n.chartPieForm),
    切替の選択肢: 円の見せ方の選択肢,
  },
  {
    名: "傾き図の見せ方 (chartSlopeForm)",
    表: { values: "画面の切替", delta: "画面の切替", rank: "画面の切替" } satisfies Record<
      ChartSlopeForm,
      覆い方
    >,
    読む: (d) => d.nodes.map((n) => n.chartSlopeForm),
    切替の選択肢: 傾きの見せ方の選択肢,
  },
];

/**
 * 書かれた値を、図が実際に取りうる値へ解く。
 *
 * **記法の値 (`{状態}`) は、状態の初期値と段が置く値の両方へ解く**。 体験の道筋の気持ちは段ごとに
 * 状態から入るので、書かれた字だけを数えると「不満」 の顔を段で見せている図を数え落とす。
 *
 * 字でも数でもない値 (組んだ値) は、どの値にも一致しない印に置き換える。 黙って捨てると、読み方が
 * 図の形と噛み合っていないことが「書かれていない」 に紛れる。
 */
function 値を解く(d: Pick<CdlDiagram, "states" | "phases">, 値: unknown): string[] {
  if (値 === undefined || 値 === null) return [];
  if (typeof 値 === "number" || typeof 値 === "boolean") return [String(値)];
  if (typeof 値 !== "string") return [`(読めない値: ${JSON.stringify(値)})`];
  const 名 = /^\{(.+)\}$/.exec(値)?.[1];
  if (名 === undefined) return [値];
  return [
    ...(d.states ?? []).filter((s) => s.id === 名).map((s) => String(s.initial)),
    ...(d.phases ?? []).flatMap((p) =>
      (p.sets ?? []).filter((s) => s.stateId === 名).map((s) => String(s.value)),
    ),
  ];
}

/** 図の並びを読み、軸ごとに書かれた値の集合を返す */
function 書かれた値(図: readonly CdlDiagram[]): Map<string, Set<string>> {
  const 数 = new Map<string, Set<string>>(軸たち.map((a) => [a.名, new Set<string>()]));
  for (const d of 図) {
    for (const a of 軸たち) {
      for (const v of a.読む(d)) for (const 解 of 値を解く(d, v)) 数.get(a.名)!.add(解);
    }
  }
  return 数;
}

/** 見本を求める値のうち、どの図にも書かれていないもの (`<軸>: <値>`) */
function 足りない値(図: readonly CdlDiagram[]): string[] {
  const 数 = 書かれた値(図);
  return 軸たち.flatMap((a) =>
    Object.entries(a.表)
      .filter(([値, 覆]) => 覆 === "見本" && !数.get(a.名)!.has(値))
      .map(([値]) => `${a.名}: ${値}`),
  );
}

/**
 * 見本 1 つが持つ図。 **変種も数える** = 中身が違う見本は一覧の行を持たず切替に入るので、
 * 元の図だけを見ると母集団から落ちる (`catalog-payload-coverage.test.tsx` と同じ)
 */
const 図たち = (item: CatalogItem): CdlDiagram[] =>
  item.patterns && item.patterns.length > 0 ? item.patterns.map((p) => p.diagram) : [item.diagram];

describe("欄が取る値を、カタログが全て見せている (#1966)", () => {
  let 全ての図: CdlDiagram[] = [];

  beforeAll(async () => {
    // 部品の分類は画面で遅れて読むので、一覧の定数には入っていない。 数え落とさないよう自分で読む
    const 見本 = [...Object.values(CATALOG_ITEMS).flat(), ...(await loadPartsItems())];
    全ての図 = 見本.flatMap(図たち);
  });

  it("カタログの図と、全ての軸の値を走査できている", () => {
    expect(
      全ての図.length,
      "カタログの図を 1 枚も読めていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    const 数 = 書かれた値(全ての図);
    const 空の軸 = 軸たち.filter(
      (a) => Object.values(a.表).includes("見本") && 数.get(a.名)!.size === 0,
    );
    expect(
      空の軸.map((a) => a.名),
      "値を 1 つも読めていない軸がある (読み方が図の形と噛み合っていない)",
    ).toEqual([]);
  });

  it("見本を求める値は、カタログのどこかの図に書かれている", () => {
    expect(
      足りない値(全ての図),
      "カタログに見本の無い値がある (見本を足すか、覆い方を決める)",
    ).toEqual([]);
  });

  it("値を持つ図を外すと、その値が足りないと見つかる (植え込み対照)", () => {
    const 見つけた: string[] = [];
    for (const a of 軸たち) {
      const 値 = Object.entries(a.表).find(([, 覆]) => 覆 === "見本")?.[0];
      if (値 === undefined) continue;
      const 外した = 全ての図.filter((d) => !a.読む(d).some((v) => 値を解く(d, v).includes(値)));
      if (足りない値(外した).includes(`${a.名}: ${値}`)) 見つけた.push(a.名);
    }
    const 見本を求める軸 = 軸たち
      .filter((a) => Object.values(a.表).includes("見本"))
      .map((a) => a.名);
    expect(
      見本を求める軸.length,
      "見本を求める軸が 1 つも無い (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(見つけた).toEqual(見本を求める軸);
  });

  it("表は engine の値の一覧と一致する", () => {
    const 一覧: Record<string, readonly string[]> = {
      "節の色 (tone)": TONES,
      "矢印の色 (tone)": TONES,
      "矢印の線の種類 (style)": EDGE_STYLES,
      "矢印の先端の形 (head)": EDGE_HEADS,
      "矢印の根元の形 (tailHead)": EDGE_HEADS,
      "矢印の先端の塗り (headFill)": EDGE_HEAD_FILLS,
      "矢印の根元の塗り (tailHeadFill)": EDGE_HEAD_FILLS,
    };
    for (const [名, 値たち] of Object.entries(一覧)) {
      const a = 軸たち.find((x) => x.名 === 名);
      expect(a, `${名} の軸が無い`).toBeDefined();
      expect(Object.keys(a!.表).sort(), 名).toEqual([...値たち].sort());
    }
    // 既定の定数を持つ欄は、表で見本を求めている = 既定を書いた図もカタログにある
    expect(軸たち.find((x) => x.名 === "矢印の先端の形 (head)")!.表[EDGE_HEAD_DEFAULT]).toBe(
      "見本",
    );
    expect(
      軸たち.find((x) => x.名 === "矢印の先端の塗り (headFill)")!.表[EDGE_HEAD_FILL_DEFAULT],
    ).toBe("見本");
  });

  it("既定と書いた値は、書いても書かなくても配置が変わらない", () => {
    let 確かめた = 0;
    for (const a of 軸たち) {
      for (const [値, 覆] of Object.entries(a.表)) {
        if (覆 !== "既定") continue;
        const 置く = a.置く;
        expect(置く, `${a.名} は既定の値を持つのに、値を置く手段が無い`).toBeDefined();
        // 既定でない値をカタログが書いている対象で比べる。 その値を消すと形が変わる対象でないと、
        // 「書いても書かなくても同じ」 が比べ方の鈍さなのか既定なのかを分けられない
        const 別の値たち = new Set(
          Object.entries(a.表)
            .filter(([, x]) => x === "見本")
            .map(([v]) => v),
        );
        let 元: CdlDiagram | undefined;
        let 添字 = -1;
        for (const d of 全ての図) {
          添字 = a.読む(d).findIndex((v) => typeof v === "string" && 別の値たち.has(v));
          if (添字 >= 0) {
            元 = d;
            break;
          }
        }
        expect(
          元,
          `${a.名} の既定でない値を書いた図がカタログに無い (比べる相手が無い)`,
        ).toBeDefined();
        const 配置 = (d: CdlDiagram): string =>
          JSON.stringify(layout(d), (鍵, v: unknown) => (鍵 === 置く!.欄 ? undefined : v));
        const 書かない = 配置(置く!.書く(元!, 添字, undefined));
        expect(
          配置(置く!.書く(元!, 添字, 値)),
          `${a.名}: ${値} を書くと配置が変わる (既定ではない)`,
        ).toBe(書かない);
        expect(
          配置(元!),
          `${a.名}: 既定でない値を消しても配置が変わらない (比べ方が効いていない)`,
        ).not.toBe(書かない);
        確かめた += 1;
      }
    }
    expect(確かめた, "既定の値を 1 つも確かめていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("画面の切替と書いた値は、切替の選択肢の数と一致する", () => {
    let 確かめた = 0;
    for (const a of 軸たち) {
      const 切替の値 = Object.entries(a.表).filter(([, 覆]) => 覆 === "画面の切替");
      if (切替の値.length === 0) continue;
      expect(a.切替の選択肢, `${a.名} は画面の切替で覆うのに、選択肢を持たない`).toBeDefined();
      expect(a.切替の選択肢!.length, `${a.名} の切替の選択肢が値の数と違う`).toBe(
        Object.keys(a.表).length,
      );
      確かめた += 1;
    }
    expect(確かめた, "画面の切替を 1 つも確かめていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("記法の値は、状態の初期値と段が置く値の両方へ解く", () => {
    const 図 = {
      states: [{ id: "気持ち", initial: "angry" }],
      phases: [{ sets: [{ stateId: "気持ち", value: "happy" }] }],
    } as unknown as Pick<CdlDiagram, "states" | "phases">;
    expect(値を解く(図, "{気持ち}").sort()).toEqual(["angry", "happy"]);
    expect(値を解く(図, "neutral")).toEqual(["neutral"]);
    expect(値を解く(図, undefined)).toEqual([]);
  });
});

/**
 * 型定義を歩き、欄の道 (`$.actors[].kind`) と列挙値 (`$.actors[].kind=card`) を全て集める。
 *
 * 自由な名前を鍵に取る組 (`lanes` や `states`) は `.*` で表す。 同じ型を参照で辿り直す形
 * (入れ子の組) は、同じ道筋で 2 度目に出会った所で止める。
 */
function 型定義の道を集める(): Set<string> {
  const 根 = diagramJsonSchema as unknown as 素;
  const 出 = new Set<string>();
  const 歩く = (s: unknown, 道: string, 通った: ReadonlySet<unknown>): void => {
    if (!s || typeof s !== "object") return;
    const 型 = s as 素;
    if (typeof 型.$ref === "string") {
      const 先 = 型.$ref
        .replace(/^#\//, "")
        .split("/")
        .reduce<unknown>((a, k) => (a as 素 | undefined)?.[k], 根);
      // 辿れない参照を黙って飛ばすと、その先の欄が丸ごと数えられない
      if (先 === undefined) throw new Error(`型定義の参照を辿れない: ${型.$ref}`);
      if (通った.has(先)) return;
      歩く(先, 道, new Set([...通った, 先]));
      return;
    }
    for (const 組 of ["oneOf", "anyOf", "allOf"]) {
      for (const x of (型[組] as unknown[] | undefined) ?? []) 歩く(x, 道, 通った);
    }
    if (Array.isArray(型.enum)) for (const v of 型.enum) 出.add(`${道}=${String(v)}`);
    if (型.const !== undefined) 出.add(`${道}=${String(型.const)}`);
    for (const [k, v] of Object.entries((型.properties as 素 | undefined) ?? {})) {
      出.add(`${道}.${k}`);
      歩く(v, `${道}.${k}`, 通った);
    }
    if (型.additionalProperties && typeof 型.additionalProperties === "object") {
      歩く(型.additionalProperties, `${道}.*`, 通った);
    }
    if (型.items && typeof 型.items === "object") 歩く(型.items, `${道}[]`, 通った);
  };
  歩く(根, "$", new Set());
  return 出;
}

/** 鍵が自由な組の道 (`$.lanes` 等)。 型定義の道のうち `.*` の手前を集める */
const 鍵が自由な道 = (型の道: ReadonlySet<string>): Set<string> =>
  new Set(
    [...型の道].flatMap((p) => {
      const i = p.indexOf(".*");
      return i >= 0 ? [p.slice(0, i)] : [];
    }),
  );

/** 記法の JSON 1 つに書かれた欄の道と値を集める */
function 書かれた道(json: unknown, 自由: ReadonlySet<string>): Set<string> {
  const 出 = new Set<string>();
  const 歩く = (v: unknown, 道: string): void => {
    if (Array.isArray(v)) {
      for (const x of v) 歩く(x, `${道}[]`);
      return;
    }
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v as 素)) {
        const 次 = 自由.has(道) ? `${道}.*` : `${道}.${k}`;
        if (!自由.has(道)) 出.add(次);
        歩く(x, 次);
      }
      return;
    }
    出.add(`${道}=${String(v)}`);
  };
  歩く(json, "$");
  return 出;
}

/** 見本 1 つが持つ記法の JSON。 変種は変種ごとに持つ (`図たち` と同じ数え方) */
const JSONたち = (item: CatalogItem): string[] =>
  (item.patterns && item.patterns.length > 0
    ? item.patterns.map((p) => p.sourceJson)
    : [item.sourceJson]
  ).filter((j): j is string => typeof j === "string");

type 道の覆い方 =
  | { 種類: "既定"; 別の値: string }
  | { 種類: "画面の切替"; 選択肢: readonly string[] }
  | { 種類: "直してから見本"; Issue: number; 理由: string };

/** 位置の欄の見本は、JSON の位置の欄の不具合を直してから置く */
const 位置の欄: 道の覆い方 = {
  種類: "直してから見本",
  Issue: 1971,
  理由: "位置の欄の見本を JSON で書くと記法と別の図になる",
};
/** 見本 (parts) にだけ効く欄は、見本を図に埋める経路を直してから置く */
const 部品の欄: 道の覆い方 = {
  種類: "直してから見本",
  Issue: 1973,
  理由: "見本を埋めた図で状態と倍率が効くことを確かめられる形になっていない",
};
/** 組の枠は、枠が縦列を囲まない不具合を直してから置く */
const 組の欄: 道の覆い方 = {
  種類: "直してから見本",
  Issue: 1972,
  理由: "組の枠が並べた縦列を囲まずに離れた場所へ描かれる",
};

/**
 * カタログの JSON に書かれていない道と、その覆い方。
 *
 * **色の別名はここに並べない**。 `成功` と `success` の対応は `TONE_ALIAS` が持ち、下の検査が表から導く。
 */
const 道の覆い方表: Record<string, 道の覆い方> = {
  // 書かない図は段ごとに矢印を出し、触れた箱を光らせない
  "$.reveal=phase": { 種類: "既定", 別の値: "all" },
  "$.relations=off": { 種類: "既定", 別の値: "hover" },
  "$.palette=celadon": { 種類: "画面の切替", 選択肢: 配色の選択肢 },
  "$.actors[].pos": 位置の欄,
  "$.actors[].pos.x": 位置の欄,
  "$.actors[].pos.y": 位置の欄,
  "$.actors[].nodes": 位置の欄,
  "$.actors[].nodes.*.posX": 位置の欄,
  "$.actors[].nodes.*.posY": 位置の欄,
  "$.actors[].nodes.*.posW": 位置の欄,
  "$.actors[].nodes.*.posH": 位置の欄,
  "$.flow[].pos": 位置の欄,
  "$.flow[].pos.x": 位置の欄,
  "$.flow[].pos.y": 位置の欄,
  "$.lanes.*.pos": 位置の欄,
  "$.lanes.*.pos.x": 位置の欄,
  "$.lanes.*.pos.y": 位置の欄,
  "$.actors[].scale": 部品の欄,
  "$.actors[].state": 部品の欄,
  "$.groups": 組の欄,
  "$.groups.*.label": 組の欄,
  "$.groups.*.lanes": 組の欄,
  "$.readouts[].colorSource": {
    種類: "直してから見本",
    Issue: 1974,
    理由: "札の描画が色の出どころの欄を読まず、書いても札の色が変わらない",
  },
};

/** 色の欄に書いた別名 (`$.actors[].tone=成功`) なら、欄の道と別名の指す色を返す */
function 色の別名(道: string): { 欄の道: string; 色: string } | undefined {
  const m = /^(.*\.(?:tone|color))=(.+)$/.exec(道);
  if (!m) return undefined;
  const [, 欄の道, 値] = m as unknown as [string, string, string];
  if (!Object.hasOwn(TONE_ALIAS, 値)) return undefined;
  const 色 = TONE_ALIAS[値]!;
  return 色 === 値 ? undefined : { 欄の道, 色 };
}

/** 書かれておらず、覆い方も持たない道 */
function 覆われない道(型の道: ReadonlySet<string>, 書いた: ReadonlySet<string>): string[] {
  return [...型の道]
    .filter((p) => !書いた.has(p) && !(p in 道の覆い方表) && 色の別名(p) === undefined)
    .sort();
}

describe("記法の型定義の全ての欄と値を、カタログの JSON が見せている (#1969)", () => {
  let 型の道 = new Set<string>();
  let 自由 = new Set<string>();
  /** JSON ごとの書かれた道 */
  let JSONごと: Set<string>[] = [];
  let 書いた = new Set<string>();
  let JSON文字列: string[] = [];
  let 読めない: string[] = [];

  beforeAll(async () => {
    型の道 = 型定義の道を集める();
    自由 = 鍵が自由な道(型の道);
    const 見本 = [...Object.values(CATALOG_ITEMS).flat(), ...(await loadPartsItems())];
    JSON文字列 = 見本.flatMap(JSONたち);
    for (const j of JSON文字列) {
      try {
        JSONごと.push(書かれた道(JSON.parse(j), 自由));
      } catch (e) {
        読めない.push(`${j.slice(0, 40)}… (${String(e)})`);
      }
    }
    書いた = new Set(JSONごと.flatMap((s) => [...s]));
  });

  it("型定義の道とカタログの JSON を走査できている", () => {
    expect(
      型の道.size,
      "型定義の道を 1 つも集められていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(
      自由.size,
      "鍵が自由な組を 1 つも見つけられていない (歩き方が型定義と噛み合っていない)",
    ).toBeGreaterThan(0);
    expect(
      JSON文字列.length,
      "カタログの JSON を 1 つも集められていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(読めない, "読めない JSON がある (読めない分の道を数え落とす)").toEqual([]);
    expect(JSONごと.length).toBe(JSON文字列.length);
  });

  it("型定義の道は、カタログの JSON に書かれているか覆い方を持つ", () => {
    expect(
      覆われない道(型の道, 書いた),
      "カタログの JSON に見本の無い欄か値がある (見本を足すか、覆い方を決める)",
    ).toEqual([]);
  });

  it("覆い方の表に載せた道は、型定義にあり、まだ書かれていない", () => {
    const 型に無い = Object.keys(道の覆い方表).filter((p) => !型の道.has(p));
    expect(型に無い, "覆い方の表に型定義に無い道がある (綴りの誤りか、型定義から消えた)").toEqual(
      [],
    );
    const 書かれた = Object.keys(道の覆い方表).filter((p) => 書いた.has(p));
    expect(書かれた, "見本が書かれた道が覆い方の表に残っている (表から外す)").toEqual([]);
  });

  it("色の別名は、別名の指す色が同じ欄に書かれている", () => {
    const 別名の道 = [...型の道].filter((p) => !書いた.has(p) && 色の別名(p) !== undefined);
    expect(別名の道.length, "別名の道を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    const 指す色が無い = 別名の道.filter((p) => {
      const a = 色の別名(p)!;
      return !書いた.has(`${a.欄の道}=${a.色}`);
    });
    expect(指す色が無い, "別名の指す色の見本が無い").toEqual([]);
  });

  it("既定と書いた値は、書いた図と書かない図の描画が一致する", () => {
    const 描く = (json: 素): string => {
      const d = jsonToDiagram(json);
      return renderToStaticMarkup(
        createElement(CdlDiagramView, {
          diagram: d,
          hideHeader: true,
          focusPhaseId: d.phases[0]?.id,
        }),
      );
    };
    let 確かめた = 0;
    for (const [道, 覆] of Object.entries(道の覆い方表)) {
      if (覆.種類 !== "既定") continue;
      const m = /^\$\.([^.=[\]]+)=(.+)$/.exec(道);
      expect(m, `${道} は図全体の欄の値の形でない (比べ方が決まらない)`).not.toBeNull();
      const [, 欄, 既定] = m as unknown as [string, string, string];
      // 既定でない値を書いた見本で比べる。 消すと見え方が変わる図でないと、比べ方の鈍さと既定を分けられない。
      // 実測の差の中身 = `reveal: all` は 1 段目から矢印の線が描かれ、`relations: hover` は箱が
      // 触れて操作できる形 (`role="button"`) になる。 どちらも図の外のしるしだけの差ではない
      const 元 = JSON文字列.map((j) => JSON.parse(j) as 素).find((j) => j[欄] === 覆.別の値);
      expect(元, `${欄}: ${覆.別の値} を書いた見本が無い (比べる相手が無い)`).toBeDefined();
      const 置く = (値: string | undefined): 素 => {
        const 次 = { ...元! };
        if (値 === undefined) delete 次[欄];
        else 次[欄] = 値;
        return 次;
      };
      const 書かない = 描く(置く(undefined));
      expect(描く(置く(既定)), `${欄}: ${既定} を書くと描画が変わる (既定ではない)`).toBe(書かない);
      expect(
        描く(元!),
        `${欄}: ${覆.別の値} を消しても描画が変わらない (比べ方が効いていない)`,
      ).not.toBe(書かない);
      確かめた += 1;
    }
    expect(確かめた, "既定の道を 1 つも確かめていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("画面の切替と書いた値は、切替の選択肢の数が型定義の値の数と一致する", () => {
    let 確かめた = 0;
    for (const [道, 覆] of Object.entries(道の覆い方表)) {
      if (覆.種類 !== "画面の切替") continue;
      const 欄の道 = 道.slice(0, 道.indexOf("="));
      const 値の数 = [...型の道].filter((p) => p.startsWith(`${欄の道}=`)).length;
      expect(値の数, `${欄の道} の値を型定義から 1 つも読めていない`).toBeGreaterThan(0);
      expect(覆.選択肢.length, `${欄の道} の切替の選択肢が値の数と違う`).toBe(値の数);
      確かめた += 1;
    }
    expect(確かめた, "画面の切替を 1 つも確かめていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("直してから見本と書いた道は、Issue 番号と理由を持つ", () => {
    const 直す = Object.entries(道の覆い方表).filter(([, 覆]) => 覆.種類 === "直してから見本");
    expect(直す.length, "直してから見本を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    for (const [道, 覆] of 直す) {
      if (覆.種類 !== "直してから見本") continue;
      expect(覆.Issue, `${道} の Issue 番号が無い`).toBeGreaterThan(0);
      expect(覆.理由.trim(), `${道} の理由が空`).not.toBe("");
    }
  });

  it("最上位の欄を書いた JSON を外すと、その欄が足りないと見つかる (植え込み対照)", () => {
    const 最上位 = [...書いた].filter((p) => /^\$\.[^.=[\]*]+$/.test(p) && !(p in 道の覆い方表));
    expect(最上位.length, "最上位の欄を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    const 見つけられない = 最上位.filter((p) => {
      const 残り = new Set(JSONごと.filter((s) => !s.has(p)).flatMap((s) => [...s]));
      return !覆われない道(型の道, 残り).includes(p);
    });
    expect(
      見つけられない,
      "外しても足りないと見つからない欄がある (突き合わせが効いていない)",
    ).toEqual([]);
  });
});
