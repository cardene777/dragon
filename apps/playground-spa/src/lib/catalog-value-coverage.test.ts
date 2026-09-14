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
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
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
