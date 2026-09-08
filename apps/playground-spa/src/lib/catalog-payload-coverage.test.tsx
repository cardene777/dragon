/**
 * 記法で書ける欄を、見本帳が全て見せているかを数える検査
 * (#1694 / #1698 / #1700 / #1706 / #1707)。
 *
 * ## 2 つの問いを並べている
 *
 * | 何を聞くか | 対象 | 求めるもの |
 * |---|---|---|
 * | 中身の形が 2 通りある時、両側を見せているか | 中身の欄 (`*Data`) 8 家族 | 1 つの見本の切替で両側 |
 * | 記法で書ける欄を 1 度でも書いているか | 節と矢印の任意の欄 58 本 | 書いた図が 1 つ以上 |
 *
 * 前者は「同じ図を並べて見比べる」 話、後者は「そもそも見せているか」 の話。 求めるものが
 * 違うので検査を分けているが、**どちらも軸を engine の型から出す** ところは同じ。
 *
 * ## なぜ要るか
 *
 * `chart-stat` は件が 1 つだと割合の字と弧を描かず、2 つ以上だと描く (`cdl#759`)。
 * 見本帳には 1 件の見本しか無く、**割合が意味を持つ形がどこにも出ていなかった**。
 * 人が数えている限り、次に同じことが起きても気付けない。
 *
 * 実際に次が起きた。 `previous` (前の時点の値) を書くと円グラフは輪が 2 つになり
 * (`cdl#679`)、内訳の帯は帯が 2 本になる (`cdl#551`)。 どちらも見本は片側だけだった。
 *
 * ## 軸も種別も engine から出す
 *
 * #1698 まで **軸そのものは手で並べていた**。 種別の一覧を導いても、軸が手書きなら
 * 導いた範囲は軸の数で頭打ちになる (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * #1700 で軸を `chartData` の 1 件が持つ **任意の欄** から出した。 ただし対象は図表だけで、
 * 中身を持つ節は他に 7 つある (工程表 / 発想の枝 / 漏斗 / 四象限 / 系統樹 / 体験の道筋 /
 * 時系列のやり取り)。 #1706 でその 7 つも同じ形で数えるようにした。 実際に 4 件の抜けが出た。
 *
 * 家族の一覧は `Extract<keyof CdlNode, \`${string}Data\`>` から出し、各家族の軸は
 * その中身 1 件の任意の欄から出す。 どちらも `satisfies` で閉じているので、engine が
 * 欄を 1 つ足すと `tsc` が落ちる。
 *
 * ## 書いた時に何が変わるかで 3 つに分ける
 *
 * | 判定 | 意味 | 見本を要求するか |
 * |---|---|---|
 * | 役割が増える | 新しい絵が出る | する |
 * | 絵だけ変わる | 既にある役割の中身が変わる (色 / 文字) | しない |
 * | 絵も変わらない | engine が描いていない | しない。 `描かない欄` に理由を書いて残す |
 *
 * 3 つ目は engine が描き始めたら落ちる = 直った後に理由だけが残らない。
 *
 * ## 両側は 1 つの見本の切替で見せる
 *
 * 「見本帳のどこかに両側があればよい」 だと、別々の行に分かれていて **見比べられない**。
 * 同じ見本の `パターン` (`catalog-items.ts` の `patterns`) として両側を持つことを求める。
 *
 * ## 覆えない組は理由を書いて残す
 *
 * 片側が図として成立しない組がある (傾き図に前の時点を書かないと線を引く相手がいない、
 * 節が 1 つの系統樹には枝が無い)。 こういう組は `覆えない組` に理由付きで置く。
 * **表に無い組は落ち、表にあるのに engine が形の差を返さなくなった組も落ちる**。
 *
 * ## 節と矢印の欄は「1 度でも書いているか」 を聞く (#1707)
 *
 * 中身の欄は **図まるごと** に効くので、両側を並べるには切替が要る。 節と矢印の欄は
 * **1 つ 1 つの箱と線** に効くので、同じ図の中に書いた箱と書かない箱が並んでいることが多い
 * (実測 = 説明の欄は 1034 節のうち 835 節が書いている)。 切替を求めても見比べる形にならない。
 *
 * 代わりに「見本帳が 1 度は書いていること」 を求める。 見本帳の役目は **記法で何が書けるか**
 * を見せることなので、1 度も書いていない欄はその存在を読み手に伝えられない。
 *
 * ただし覆うものが別に在る欄には求めない。 何が覆っているかを先に決めるのが `節の欄の扱い`
 * と `矢印の欄の扱い` で、決めずに数えると画面の切替で見られる形にまで見本を要求してしまう。
 *
 * 書いた欄が **絵に届いているか** も見る。 見本帳の実物からその欄を消して描き比べ、絵が
 * 変わる図が 1 つも無ければ落ちる。 欄ごとの見本値を手で並べずに済むので、実物と違う値で
 * 測ることにならない。
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram, CdlEdge, CdlNode } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, type CatalogItem } from "./catalog-items";

/** 中身を持つ節の欄。 engine が `*Data` を足すと下の `satisfies` が落ちる */
type 中身の欄 = Extract<keyof CdlNode, `${string}Data`>;

/** 中身の型 (`undefined` を外したもの) */
type 中身<K extends 中身の欄> = NonNullable<CdlNode[K]>;

/**
 * その型の **任意の欄**。 書くか書かないかで形が変わりうるのはここだけ。
 *
 * 必須の欄は「書かない図」 を作れないので軸にならない。
 */
type 任意の欄<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

/** 節の任意の欄。 engine が欄を足すと下の `satisfies` が落ちる (#1707) */
type 節の任意の欄 = 任意の欄<CdlNode>;

/** 矢印の任意の欄。 同上 (#1707) */
type 矢印の任意の欄 = 任意の欄<CdlEdge>;

/*
 * 家族ごとの中身の型。 **並びの要素の型は書かない** = 下の `並び()` が取り出し方から
 * 推論し、その型の任意の欄で見本値の表を閉じる。 要素の型に名前を付けると、engine が
 * 型を差し替えた時に名前だけが残る。
 */
type 図表の中身 = 中身<"chartData">[number];
type 工程 = 中身<"ganttData">[number];
type 枝の根 = 中身<"mindData">;
type 漏斗の段 = 中身<"funnelData">[number];
type 四象限 = 中身<"quadrantData">;
type 系統の節 = 中身<"treeData">[number];
type 道筋の段 = 中身<"journeyData">[number];
type やり取り = 中身<"sequenceData">;

type 素 = Record<string, unknown>;

/**
 * 軸を組む時に欄へ入れる値。 添字を見て決める欄 (前の工程を指す等) は関数で書く。
 *
 * `unknown` にしないのは、関数の引数の型が推論されなくなるため (`unknown | 関数` は
 * `unknown` に潰れる)。 値そのものに意味は無いので、書ける形はこの 3 つで足りる。
 */
type 見本値 = string | number | ((並び: 素[], 添字: number) => unknown);

/** 中身の中の 1 並び (図表の件 / 発想の枝 / 時系列の面々 等) */
interface 並びの決め {
  名: string;
  取る: (中身: unknown) => 素[];
  欄の見本値: Record<string, 見本値>;
  /** 件数そのものを軸に数えるか。 並びでない中身 (発想の根) は数えない */
  件数を見る: boolean;
}

/**
 * 1 並びを宣言する。 **`欄の見本値` は引数の型で閉じている** = その型の任意の欄を 1 つでも
 * 書き落とすと `tsc` が落ちる。 値そのものに意味は無く、「書いた図」 を作れれば足りる。
 *
 * 効く欄かどうかは engine を描いて判定するので、ここで人が選り分けない。
 */
const 並び = <T, E>(
  名: string,
  取る: (中身: T) => readonly E[],
  欄の見本値: Record<任意の欄<E>, 見本値>,
  件数を見る: boolean,
): 並びの決め => ({
  名,
  // **写しではなく実体を返す**。 件数の軸は並びの長さを変えるので、写しだと図に届かない
  取る: (中身) => 取る(中身 as T) as unknown as 素[],
  欄の見本値,
  件数を見る,
});

/**
 * 中身を持つ節の家族。 **`satisfies` で閉じる** = engine が `*Data` の欄を足すと `tsc` が落ちる。
 */
const 家族 = {
  chartData: [並び("件", (v: 図表の中身[]) => v, { previous: 8, tone: "accent" }, true)],
  ganttData: [
    並び(
      "工程",
      (v: 工程[]) => v,
      {
        owner: "運用",
        // 前の工程を指す。 先頭は指す相手がいないので書かない
        dependsOn: (並, i) => (i > 0 ? String(並[i - 1]!.id) : undefined),
        tone: "accent",
      },
      true,
    ),
  ],
  mindData: [
    並び("根", (v: 枝の根) => [v], { rootSubtitle: "説明" }, false),
    並び("枝", (v: 枝の根) => v.branches, { tone: "accent", subtitle: "説明" }, true),
  ],
  funnelData: [並び("段", (v: 漏斗の段[]) => v, { subtitle: "説明" }, true)],
  quadrantData: [
    並び("面", (v: 四象限) => [v], {}, false),
    並び("点", (v: 四象限) => v.items, { subtitle: "説明" }, true),
  ],
  treeData: [
    並び(
      "節",
      (v: 系統の節[]) => v,
      {
        // 先頭を親にする。 空文字にすると「書かない」 側と同じ形 (全部が根) になり、
        // 差が出ないので軸として測れない
        parent: (並, i) => (i > 0 ? String(並[0]!.id) : undefined),
        subtitle: "説明",
      },
      true,
    ),
  ],
  journeyData: [
    並び("段", (v: 道筋の段[]) => v, { touchpoint: "窓口", opportunity: "改善の余地" }, true),
  ],
  sequenceData: [
    並び("面々", (v: やり取り) => v.actors, { subtitle: "説明" }, true),
    並び("言づて", (v: やり取り) => v.messages, {}, true),
    並び("帯", (v: やり取り) => v.bands, {}, true),
  ],
} satisfies Record<中身の欄, 並びの決め[]>;

/**
 * 節の任意の欄を、何が覆っているか。 **`satisfies` で閉じる** = engine が欄を足すと `tsc` が落ちる。
 *
 * | 扱い | 意味 | 見本帳に書いた図を求めるか |
 * |---|---|---|
 * | `中身` | 図に載せる値そのもの (`*Data`)。 上の家族の軸が数える | 求めない (軸が数える) |
 * | file の path | 画面の `オプション` の切替が覆う。 押せば両方の形を見られる | 求めない |
 * | `動き` | 状態から読む欄。 状態を持たない図に書いても絵が変わらないので、描いても判定できない | **求める** |
 * | `置き場所` | 図を組む側が決める寸法 / 座標 / 内部の目印。 読み手が見比べる選択肢ではない | 求めない |
 * | `記法` | 記法から書く表現の欄 | **求める** |
 *
 * **どの扱いにも裏取りが付く**。 `中身` は家族の表に在ること、file の path はその file が
 * 欄の名前を持つこと、`置き場所` は書いても役割が増えないこと、`動き` と `記法` は見本帳が
 * 1 件以上書いていること。 書いただけで通る扱いは 1 つも無い。
 */
const 節の欄の扱い = {
  // 中身 = 上の家族の軸が数える (#1706)
  chartData: "中身",
  ganttData: "中身",
  mindData: "中身",
  funnelData: "中身",
  quadrantData: "中身",
  treeData: "中身",
  journeyData: "中身",
  sequenceData: "中身",
  // 画面の オプション の切替が覆う (値はその切替を実装している file)
  chartFillUnder: "src/lib/chart-line-options.ts",
  chartValueRise: "src/lib/chart-line-options.ts",
  chartTrace: "src/lib/chart-line-options.ts",
  chartPieForm: "src/lib/chart-pie-options.ts",
  chartSlopeForm: "src/lib/chart-slope-options.ts",
  // 動き = 状態 / signal から読む
  value: "動き",
  sequenceStep: "動き",
  wBind: "動き",
  hBind: "動き",
  opacity: "動き",
  visibleIf: "動き",
  renderOffsetX: "動き",
  renderOffsetY: "動き",
  // 置き場所 = 図を組む側が決める
  w: "置き場所",
  h: "置き場所",
  posX: "置き場所",
  posY: "置き場所",
  posW: "置き場所",
  posH: "置き場所",
  role: "置き場所",
  // 記法 = 記法から書く表現の欄
  eyebrow: "記法",
  subtitle: "記法",
  rows: "記法",
  rowMarks: "記法",
  rowStripe: "記法",
  tone: "記法",
  shape: "記法",
  ganttAxisMax: "記法",
} satisfies Record<節の任意の欄, string>;

/**
 * 矢印の任意の欄を、何が覆っているか。 扱いの意味は上の表と同じ (`中身` は矢印に無い)。
 */
const 矢印の欄の扱い = {
  // 動き = 状態 / signal から読む (#1396)
  widthBind: "動き",
  strokeBind: "動き",
  dashOffsetBind: "動き",
  // 置き場所 = 図を組む側が決める
  labelOffsetX: "置き場所",
  labelOffsetY: "置き場所",
  posX1: "置き場所",
  posY1: "置き場所",
  posX2: "置き場所",
  posY2: "置き場所",
  // 記法 = 記法から書く表現の欄
  sub: "記法",
  side: "記法",
  style: "記法",
  role: "記法",
  labelPlate: "記法",
  head: "記法",
  headFill: "記法",
  tailHead: "記法",
  tailHeadFill: "記法",
  guard: "記法",
  cardinality: "記法",
  routing: "記法",
  overlay: "記法",
} satisfies Record<矢印の任意の欄, string>;

/**
 * 見本帳が書けない欄。 **鍵は `節/<欄>` か `矢印/<欄>`、値はなぜ書けないか**。
 *
 * 記法 (`packages/dragon`) に口が無い欄は、見本帳が書きようがない。 engine の型にだけ在って
 * 記法から届かない状態なので、見本を求めても足せない。
 *
 * **記法に口が開いたら落ちる**。 下の検査が `packages/dragon/src` を実際に読み、欄の名前が
 * 出てきたら「書けない」 という理由が死んだものとして落とす = 直った後に理由だけが残らない。
 */
const 書けない欄: Record<string, string> = {
  "節/ganttAxisMax":
    "工程表の横軸を何目盛りにするかを決める欄。 記法 (`packages/dragon/src`) に口が無く、記法から書いた図には出ない",
};

/**
 * 書いても絵に届かない欄。 **鍵は `節/<欄>` か `矢印/<欄>`、値はなぜ届かないか**。
 *
 * 見本帳が書いているのに、消しても絵が 1 px も変わらない欄がここに来る。 読み手には
 * 見えないので、見本を足しても意味が無い。
 *
 * **届くようになったら落ちる**。 下の検査が実物を描いて確かめるので、直った後に理由だけが
 * 残らない。
 */
const 届かない欄: Record<string, string> = {
  "矢印/guard":
    "遷移の条件。 記法から書いた値は組み立ての時に矢印の説明文 (`sub`) へ写されるので、絵に出るのは説明文の側。 描画エンジンはこの欄を読まない",
  "矢印/cardinality":
    "関係の多重度。 記法から書いた値は組み立ての時に矢印の名前へ `(1:N)` の形で併記されるので、絵に出るのは名前の側。 描画エンジンはこの欄を読まない",
};

/** 節と矢印を合わせた、欄の扱いの一覧 */
const 欄の扱いたち: Array<{ 側: "節" | "矢印"; 欄: string; 扱い: string }> = [
  ...Object.entries(節の欄の扱い).map(([欄, 扱い]) => ({ 側: "節" as const, 欄, 扱い })),
  ...Object.entries(矢印の欄の扱い).map(([欄, 扱い]) => ({ 側: "矢印" as const, 欄, 扱い })),
];

/**
 * 片側が図として成立しない組。 **鍵は `<種別>/<並び>/<軸>`、値はなぜ覆えないか**。
 *
 * ここに置いた組は両側の見本を求めない。 代わりに「engine が形の差を返さなくなったら
 * 落ちる」 側の検査が付く = 直った後に理由だけが残らない
 * (`rules/quality.md § 判定できなかったことを値に潰さない` の系)。
 */
const 覆えない組: Record<string, string> = {
  "chart-slope/件/previous":
    "前の時点を書かないと線を引く相手がいない (`chart-slope-line` が 1 本も出ない) = 形が 2 通りあるのではなく図として成立していない。 点が 1 つの折れ線と同じ",
  "tree-hierarchy/節/件数":
    "節が 1 つの系統樹には枝が無い (`tree-edge` が 1 本も出ない) = 木ではなく箱 1 つ。 図として成立していない",
  "journey-map/段/件数":
    "段が 1 つの体験の道筋には起伏が無い (`journey-line` が 1 本も出ない) = 点 1 つで、道筋にならない",
  "tree-hierarchy/節/parent":
    "親を書かない系統樹は木にならない (`tree-edge` が 1 本も出ず、箱が並ぶだけ) = 形が 2 通りあるのではなく、木という図が成立していない",
  "gantt-timeline/工程/件数":
    "工程が 1 つの段取りは前後を持たない (`gantt-arrow` が 1 本も出ない) = 帯 1 本で、段取り図にならない。 前後の有無そのものは `dependsOn` の切替が見せる",
};

/**
 * engine が描いていない欄。 **鍵は `<節の欄>/<並び>/<軸>`、値はなぜ描かれないか**。
 *
 * 記法や型には在るのに、書いても絵が 1 px も変わらない欄がある。 見本を要求しても
 * 見せるものが無いので要求しない。
 *
 * **鍵に種別を含めない**。 種別ごとに見ると「棒グラフは前の時点を描かない」 のような
 * 当たり前の組が数十件並び、本当に誰も描かない欄が埋もれる。 その家族の **どの種別も**
 * 描かない時だけここに要る。
 *
 * **engine が描き始めたら落ちる**。 描くようになった時点で見本が要るので、
 * 表から外して見本を足す側へ回す。
 */
const 描かない欄: Record<string, string> = {
  "ganttData/工程/tone": "帯の色は工程の並び順で決まる。 工程ごとの色を書いても帯には出ない",
  "funnelData/段/subtitle": "漏斗の段は名前と数だけを描く。 説明を書いても段には出ない",
  "quadrantData/点/subtitle": "四象限の点は名前だけを描く。 説明を書いても点には出ない",
};

/**
 * 描いた結果。 **最後の段で描く**。
 *
 * 段を指さずに描くと最初の段の絵になり、`draw:` で後から出す要素が 1 つも出ない。
 * 発想の枝は根だけ、漏斗は段の名前だけになり、**書いた欄が効いているかを測れない**
 * (実測 = 段を指さないと文字が 2 個、最後の段だと 10 個)。
 */
const 描く = (d: CdlDiagram): string =>
  renderToStaticMarkup(
    <CdlDiagramView diagram={layout(d)} focusPhaseId={d.phases?.[d.phases.length - 1]?.id} />,
  );

/** 描いた結果に出てくる役割名の集合 */
const 役割名 = (svg: string): Set<string> =>
  new Set([...svg.matchAll(/data-cdl-role="([^"]+)"/g)].map((m) => m[1]!));

/**
 * 見本 1 つが持つ図 (#1696)。
 *
 * **変種も数える**。 中身が違う見本は一覧の行を持たず `パターン` の切替に入るので
 * (`catalog-items.ts` の `patterns`)、元の図だけ見ると母集団から落ちる。
 */
const 図たち = (item: CatalogItem): CdlDiagram[] =>
  item.patterns && item.patterns.length > 0 ? item.patterns.map((p) => p.diagram) : [item.diagram];

const 写す = (d: CdlDiagram): CdlDiagram => JSON.parse(JSON.stringify(d)) as CdlDiagram;

/** 中身を持つ節 1 つ分 */
interface 中身の節 {
  欄: 中身の欄;
  kind: string;
  中身: unknown;
}

const 中身たち = (d: CdlDiagram): 中身の節[] =>
  d.nodes.flatMap((n) =>
    (Object.keys(家族) as 中身の欄[])
      .filter((欄) => (n as unknown as 素)[欄] !== undefined)
      .map((欄) => ({ 欄, kind: n.kind, 中身: (n as unknown as 素)[欄] })),
  );

/** 軸 1 本 */
interface 軸 {
  欄: 中身の欄;
  並び: 並びの決め;
  名: string;
  鍵: (kind: string) => string;
  /** 図を書き換えて甲 (0) / 乙 (1) の側にする */
  寄せる: (d: CdlDiagram, 側: 0 | 1) => void;
  /** 実物の節をどちらの側に数えるか */
  見本の側: (中身: unknown) => 0 | 1;
}

/** 並びの先頭を複製して件数を増やす。 同じ id が並ばないよう名前だけずらす */
function 複製(元: 素, i: number): 素 {
  const 写し: 素 = { ...元 };
  for (const k of ["id", "name", "label", "title"])
    if (typeof 写し[k] === "string") 写し[k] = `${写し[k]}-${i}`;
  return 写し;
}

function 軸たちを作る(): 軸[] {
  const 出来: 軸[] = [];
  for (const [欄, 並びら] of Object.entries(家族) as Array<[中身の欄, 並びの決め[]]>) {
    for (const 並 of 並びら) {
      const 書き換える = (d: CdlDiagram, 直す: (並: 素[]) => 素[] | void): void => {
        for (const n of d.nodes) {
          const v = (n as unknown as 素)[欄];
          if (v === undefined) continue;
          const 実体 = 並.取る(v);
          const 後 = 直す(実体);
          if (後 === undefined) continue;
          // 長さを変える軸は、実体を入れ替える (中身の中に埋まっているので差し替えられない)
          実体.length = 0;
          実体.push(...後);
        }
      };
      for (const [名, 値] of Object.entries(並.欄の見本値)) {
        出来.push({
          欄,
          並び: 並,
          名,
          鍵: (kind) => `${kind}/${並.名}/${名}`,
          寄せる: (d, 側) =>
            書き換える(d, (並列) => {
              並列.forEach((e, i) => {
                delete e[名];
                if (側 === 0) return;
                const v = typeof 値 === "function" ? 値(並列, i) : 値;
                if (v !== undefined) e[名] = v;
              });
            }),
          見本の側: (中身) => (並.取る(中身).some((e) => e[名] !== undefined) ? 1 : 0),
        });
      }
      if (!並.件数を見る) continue;
      出来.push({
        欄,
        並び: 並,
        名: "件数",
        鍵: (kind) => `${kind}/${並.名}/件数`,
        寄せる: (d, 側) =>
          書き換える(d, (並列) => {
            if (側 === 0) return [並列[0]!];
            // **写しを返す**。 実体をそのまま返すと、下で長さを 0 にした時に一緒に空になる
            if (並列.length >= 2) return [...並列];
            return [並列[0]!, 複製(並列[0]!, 2), 複製(並列[0]!, 3)];
          }),
        見本の側: (中身) => (並.取る(中身).length === 1 ? 0 : 1),
      });
    }
  }
  return 出来;
}

/** 走査してできた材料 */
interface 下ごしらえ {
  /** 家族の欄ごとに、見本帳に出ている種別 */
  種別: Map<中身の欄, string[]>;
  /** `<欄>/<種別>` ごとの元になる図 */
  基: Map<string, CdlDiagram>;
  /** 見本 1 件ごとの、持っている中身の節 */
  見本: Array<{ 名: string; 節: 中身の節[][] }>;
}

function 下ごしらえする(): 下ごしらえ {
  const 種別 = new Map<中身の欄, string[]>();
  const 基 = new Map<string, CdlDiagram>();
  const 見本: 下ごしらえ["見本"] = [];
  for (const item of Object.values(CATALOG_ITEMS).flat()) {
    const 節 = 図たち(item).map(中身たち);
    if (節.some((x) => x.length > 0)) 見本.push({ 名: item.title, 節 });
    図たち(item).forEach((d, i) => {
      for (const { 欄, kind } of 節[i]!) {
        const 一覧 = 種別.get(欄) ?? [];
        if (!一覧.includes(kind)) 種別.set(欄, [...一覧, kind]);
        if (!基.has(`${欄}/${kind}`)) 基.set(`${欄}/${kind}`, d);
      }
    });
  }
  return { 種別, 基, 見本 };
}

/**
 * その種別のその軸について、**1 つの見本の切替で両側を見せているか**。
 *
 * **本番と植え込み対照で同じ関数を使う**。 判定を 2 度書くと片方だけ直して drift する
 * (`rules/quality.md § 検査の母集団が守りたい集合と同じことを確認済`)。
 */
function 切替で両側(見本: 下ごしらえ["見本"], 軸: 軸, kind: string): boolean {
  for (const v of 見本) {
    const 側 = new Set<0 | 1>();
    for (const 節 of v.節)
      for (const x of 節)
        if (x.欄 === 軸.欄 && x.kind === kind) 側.add(軸.見本の側(x.中身));
    // 1 つの図が両側を同時に持つことはない (軸は「書いたか」 の 2 値)。
    // 同じ見本の別の図 (= パターンの切替) で分かれている時だけ両側になる
    if (側.has(0) && 側.has(1)) return true;
  }
  return false;
}

/** 書いた時に何が変わるか */
type 判定 = "役割が増える" | "絵だけ変わる" | "絵も変わらない" | "unknown";

/**
 * その軸で何が変わるかを、engine を実際に描いて判定する。
 *
 * **その種別の名前そのものの役割が増えただけの場合は数えない**。 折れ線は点が 1 つだと
 * `chart-line` (線そのもの) が出ないが、これは形が 2 通りあるのではなく **図として
 * 成立していない** = 線は 2 点以上ないと引けない。
 *
 * 組み立てに失敗する種別は判定できないので **`unknown` として別に数える**。
 * 「変わらない」 に潰すと、判定していないことが「該当なし」 と同じに見える
 * (`rules/quality.md § 判定できなかったことを値に潰さない`)。
 */
function 何が変わるか(基: CdlDiagram, 軸: 軸, kind: string): { 判定: 判定; 増えた: string[] } {
  try {
    const 甲 = 写す(基);
    const 乙 = 写す(基);
    軸.寄せる(甲, 0);
    軸.寄せる(乙, 1);
    const a = 描く(甲);
    const b = 描く(乙);
    if (a.length === 0 || b.length === 0) return { 判定: "unknown", 増えた: [] };
    const 増えた = [...役割名(b)].filter((r) => !役割名(a).has(r) && r !== kind);
    if (増えた.length > 0) return { 判定: "役割が増える", 増えた };
    return { 判定: a === b ? "絵も変わらない" : "絵だけ変わる", 増えた: [] };
  } catch {
    return { 判定: "unknown", 増えた: [] };
  }
}

/**
 * 描いた結果の控え。 **同じ図を 2 度描かない** (#1704 の言い換え)。
 *
 * 置き場所 の欄はほとんどの図に書かれていないので、書かない側は元の図と同じ絵になる。
 * 欄ごとに描き直すと、同じ絵を 13 回描くことになる。
 */
const 描いた控え = new Map<CdlDiagram, string>();
const 控えて描く = (d: CdlDiagram): string => {
  const 今 = 描いた控え.get(d);
  if (今 !== undefined) return 今;
  const 絵 = 描く(d);
  描いた控え.set(d, 絵);
  return 絵;
};

/** 甲 (書かない側) と乙 (書いた側) の絵を見比べる */
function 見比べる(a: string, b: string): { 判定: 判定; 増えた: string[] } {
  if (a.length === 0 || b.length === 0) return { 判定: "unknown", 増えた: [] };
  const 増えた = [...役割名(b)].filter((r) => !役割名(a).has(r));
  if (増えた.length > 0) return { 判定: "役割が増える", 増えた };
  return { 判定: a === b ? "絵も変わらない" : "絵だけ変わる", 増えた: [] };
}

/**
 * その欄を節に書いた時に何が変わるか (#1707)。 判定の意味は `何が変わるか` と同じ。
 *
 * 書く先を **その種別の節だけ** に絞る = 図の全部を書き換えると、別の種別が壊れて
 * 判定できなくなる。
 */
function 節に書いて描く(
  基: CdlDiagram,
  kind: string,
  欄: string,
  値: unknown,
): { 判定: 判定; 増えた: string[] } {
  try {
    let 消した = false;
    const 甲 = 写す(基);
    for (const n of 甲.nodes)
      if (n.kind === kind && (n as unknown as 素)[欄] !== undefined) {
        delete (n as unknown as 素)[欄];
        消した = true;
      }
    const 乙 = 写す(基);
    for (const n of 乙.nodes) if (n.kind === kind) (n as unknown as 素)[欄] = 値;
    return 見比べる(消した ? 描く(甲) : 控えて描く(基), 描く(乙));
  } catch {
    return { 判定: "unknown", 増えた: [] };
  }
}

/**
 * その欄を **消した時に絵が変わるか** (#1707)。
 *
 * 書いた側は見本帳の実物なので、値を作らずに済む = 欄ごとの見本値を手で並べると、
 * 実物と違う値で判定することになる (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * 差が出た時点で打ち切る = 「1 つ以上あるか」 を聞いているので、全図を描く必要が無い。
 */
function 消すと変わる図を探す(
  図ら: CdlDiagram[],
  側: "節" | "矢印",
  欄: string,
): { 見つけた: string | undefined; 描いた: number } {
  let 描いた = 0;
  for (const d of 図ら) {
    const 甲 = 写す(d);
    let 消した = false;
    const 並び = 側 === "節" ? 甲.nodes : (甲.edges ?? []);
    for (const x of 並び)
      if ((x as unknown as 素)[欄] !== undefined) {
        delete (x as unknown as 素)[欄];
        消した = true;
      }
    if (!消した) continue;
    描いた += 1;
    try {
      if (控えて描く(d) !== 描く(甲)) return { 見つけた: d.id, 描いた };
    } catch {
      // 組み立てに失敗する図は判定できない。 次の図で測る
    }
  }
  return { 見つけた: undefined, 描いた };
}

/** その欄を矢印に書いた時に何が変わるか (#1707)。 書く先は図の全矢印 */
function 矢印に書いて描く(
  基: CdlDiagram,
  欄: string,
  値: unknown,
): { 判定: 判定; 増えた: string[] } {
  try {
    let 消した = false;
    const 甲 = 写す(基);
    for (const e of 甲.edges ?? [])
      if ((e as unknown as 素)[欄] !== undefined) {
        delete (e as unknown as 素)[欄];
        消した = true;
      }
    const 乙 = 写す(基);
    for (const e of 乙.edges ?? []) (e as unknown as 素)[欄] = 値;
    return 見比べる(消した ? 描く(甲) : 控えて描く(基), 描く(乙));
  } catch {
    return { 判定: "unknown", 増えた: [] };
  }
}

function 記法の中身(): string {
  const 根 = resolve(process.cwd(), "packages/dragon/src");
  const 集める = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const 先 = resolve(dir, e.name);
      if (e.isDirectory()) return 集める(先);
      return e.isFile() && /\.(ts|tsx|json)$/.test(e.name) ? [readFileSync(先, "utf8")] : [];
    });
  return 集める(根).join("\n");
}

describe("中身を持つ節が見せる形を見本帳が見せているか (#1694 / #1698 / #1700 / #1706)", () => {
  const 軸ら = 軸たちを作る();
  let 材料: 下ごしらえ;
  /** `<種別>/<並び>/<軸>` ごとの判定 */
  let 判定表: Map<string, { 判定: 判定; 増えた: string[]; 軸: 軸; kind: string }>;

  /*
   * **描くのは 1 度だけ、`beforeAll` の中で**。 `describe` の直下で描くと集める段で走るので、
   * どの検査にも所要が付かず上限にも掛からない = 遅くなっても誰も気付けない (#1704)。
   *
   * 30 秒は実測に対する余裕。 同じ形の明示は `packages/dragon/test/typecheck-ratchet.test.ts`
   * が既に採っている。
   */
  beforeAll(() => {
    材料 = 下ごしらえする();
    判定表 = new Map();
    for (const 軸 of 軸ら) {
      for (const kind of 材料.種別.get(軸.欄) ?? []) {
        const 基 = 材料.基.get(`${軸.欄}/${kind}`);
        if (基 === undefined) continue;
        判定表.set(軸.鍵(kind), { ...何が変わるか(基, 軸, kind), 軸, kind });
      }
    }
  }, 60_000);

  /** `<節の欄>/<並び>/<軸>` ごとに、種別ごとの判定を並べる */
  const 家族ごとの判定 = (): Map<string, 判定[]> => {
    const m = new Map<string, 判定[]>();
    for (const { 軸, 判定 } of 判定表.values()) {
      const 鍵 = `${軸.欄}/${軸.並び.名}/${軸.名}`;
      m.set(鍵, [...(m.get(鍵) ?? []), 判定]);
    }
    return m;
  };

  it("家族と軸と種別をどれも 1 つ以上走査できている", () => {
    // 空振り検知。 どれかが 0 件だと下の検査は何も見ずに通る
    const 家族数 = Object.keys(家族).length;
    const 種別数 = [...材料.種別.values()].reduce((a, x) => a + x.length, 0);
    console.log(`[走査] 家族 ${家族数} / 軸 ${軸ら.length} / 種別 ${種別数} / 組 ${判定表.size}`);
    console.log(`[軸] ${軸ら.map((a) => `${a.欄}:${a.並び.名}/${a.名}`).join(" ")}`);
    expect(家族数, "中身を持つ節の家族が 1 つも無い").toBeGreaterThan(0);
    expect(軸ら.length, "軸を 1 本も導けていない").toBeGreaterThan(0);
    expect(種別数, "種別を 1 つも拾えていない").toBeGreaterThan(0);
    expect(判定表.size, "組を 1 つも判定できていない").toBeGreaterThan(0);
  });

  it("どの軸でも形が変わる種別を 1 つ以上見分けられている", () => {
    // 判定そのものの空振り検知。 全部 unknown だと下の検査が素通りする
    const 内訳: Record<判定, number> = {
      役割が増える: 0,
      絵だけ変わる: 0,
      絵も変わらない: 0,
      unknown: 0,
    };
    for (const { 判定 } of 判定表.values()) 内訳[判定] += 1;
    // 内訳を出す = 数だけ見ると「多いな」 で終わり、判定できていない組が埋もれる
    console.log(`[判定の内訳] ${JSON.stringify(内訳)} / 走査 ${判定表.size}`);
    // 役割が増える組を並べる = 内訳の数だけ見ると、どの組が要求されているか読めない
    const 増える = [...判定表].filter(([, v]) => v.判定 === "役割が増える").map(([k]) => k);
    console.log(`[役割が増える組] ${増える.join(" / ")}`);
    expect(内訳.役割が増える, "役割が増える組を 1 つも見分けられていない").toBeGreaterThan(0);
    expect(内訳.unknown, "判定できない組がある").toBe(0);
  });

  it("役割が増える組は、1 つの見本の切替で両側を見せている", () => {
    // 「見本帳のどこかに両側がある」 では見比べられない。 同じ見本の パターン で持つ
    let 測れた = 0;
    const 足りない: string[] = [];
    for (const [鍵, { 判定, 軸, kind, 増えた }] of 判定表) {
      if (判定 !== "役割が増える") continue;
      if (覆えない組[鍵] !== undefined) continue;
      測れた += 1;
      if (!切替で両側(材料.見本, 軸, kind)) 足りない.push(`${鍵} (増える役割 ${増えた.join(", ")})`);
    }
    expect(足りない, `切替で両側を見せていない組\n  ${足りない.join("\n  ")}`).toEqual([]);
    expect(測れた, "1 組も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("両側が別の見本に分かれていると見つかる (植え込み対照)", () => {
    /*
     * 上は「0 件」 を期待する形なので、判定が何にも当たらなくても通る。
     * **本番と同じ関数** に、片側ずつを別の見本に置いた並びを渡して見つかることを見る
     * (`rules/quality.md § 期待する件数で対照の向きが変わる`)。
     *
     * 「見本帳のどこかに両側があればよい」 に緩めると、この対照が通ってしまう。
     */
    const 軸 = 軸ら.find((a) => a.欄 === "treeData" && a.名 === "subtitle");
    expect(軸, "系統樹の説明の軸が無い").toBeDefined();
    const 節 = (subtitle: boolean): 中身の節[] => [
      {
        欄: "treeData",
        kind: "tree-hierarchy",
        中身: [{ id: "a", title: "a", ...(subtitle ? { subtitle: "説明" } : {}) }],
      },
    ];
    // 片側ずつを別の見本に置く = 見本帳には両側があるが、切替では見比べられない
    expect(
      切替で両側(
        [
          { 名: "書かない側だけの見本", 節: [節(false)] },
          { 名: "書く側だけの見本", 節: [節(true)] },
        ],
        軸!,
        "tree-hierarchy",
      ),
      "別々の見本に分かれているのに両側とみなした",
    ).toBe(false);
    // 同じ見本の切替に両側を置くと見つかる (判定が常に false でないことの確認)
    expect(
      切替で両側([{ 名: "切替を持つ見本", 節: [節(false), 節(true)] }], 軸!, "tree-hierarchy"),
      "同じ見本の切替に両側があるのに片側とみなした",
    ).toBe(true);
  });

  it("覆えない組は、今も engine が形の差を返す組だけ", () => {
    // 直った後に理由だけが残ると、次に同じ ずれ が出ても「書いてあるから」 で見逃す
    const 死んだ理由: string[] = [];
    for (const 鍵 of Object.keys(覆えない組)) {
      const x = 判定表.get(鍵);
      if (x === undefined) {
        死んだ理由.push(`${鍵} (その組はもう無い)`);
        continue;
      }
      if (x.判定 !== "役割が増える") 死んだ理由.push(`${鍵} (engine が形の差を返さない)`);
    }
    expect(死んだ理由, `覆えない組に死んだ理由が残っている: ${死んだ理由.join(", ")}`).toEqual([]);
  });

  it("描かない欄は、今も engine が 1 px も描かない欄だけ", () => {
    // engine が描き始めたら見本が要る。 理由だけ残ると「書いてあるから」 で見逃す
    const 死んだ理由: string[] = [];
    for (const 鍵 of Object.keys(描かない欄)) {
      const 判定ら = 家族ごとの判定().get(鍵);
      if (判定ら === undefined || 判定ら.length === 0) {
        死んだ理由.push(`${鍵} (その軸はもう無い)`);
        continue;
      }
      if (判定ら.some((j) => j !== "絵も変わらない"))
        死んだ理由.push(`${鍵} (engine が描くようになった)`);
    }
    expect(死んだ理由, `描かない欄に死んだ理由が残っている: ${死んだ理由.join(", ")}`).toEqual([]);
  });

  it("どの種別でも描かれない欄は、表に理由が書いてある", () => {
    // 表に無いまま黙って落ちると、書けるのに描かれない欄が誰にも見えない
    let 測れた = 0;
    const 書いていない: string[] = [];
    for (const [鍵, 判定ら] of 家族ごとの判定()) {
      測れた += 1;
      if (判定ら.every((j) => j === "絵も変わらない") && 描かない欄[鍵] === undefined)
        書いていない.push(鍵);
    }
    expect(書いていない, `engine が描かない欄が表に無い: ${書いていない.join(", ")}`).toEqual([]);
    expect(測れた, "1 本も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });
});

/**
 * 置き場所 に割り当てた欄へ入れる値。 **値そのものに意味は無い** = 「書いた図」 を作れれば足りる。
 *
 * 下の検査が、置き場所 の欄すべてに値が在ることを確かめる。
 */
const 置き場所の見本値: Record<string, unknown> = {
  "節/w": 240,
  "節/h": 160,
  "節/posX": 120,
  "節/posY": 120,
  "節/posW": 240,
  "節/posH": 160,
  "節/role": "lifeline-footer",
  "矢印/labelOffsetX": 40,
  "矢印/labelOffsetY": 40,
  "矢印/posX1": 20,
  "矢印/posY1": 20,
  "矢印/posX2": 220,
  "矢印/posY2": 220,
};

describe("節と矢印の任意の欄が、何かに覆われている (#1700 / #1707)", () => {
  /** 見本帳の全図 (変種を含む) */
  const 図ら: CdlDiagram[] = Object.values(CATALOG_ITEMS)
    .flat()
    .flatMap((item) => 図たち(item));

  /** `節/<欄>` `矢印/<欄>` ごとに、見本帳が書いている件数 */
  const 書いた件数 = new Map<string, number>();
  /** 節の種別ごとの元になる図 */
  const 節の基 = new Map<string, CdlDiagram>();
  /** 矢印の書きぶりごとの元になる図 */
  const 矢印の基 = new Map<string, CdlDiagram>();
  let 節の数 = 0;
  let 矢印の数 = 0;
  for (const d of 図ら) {
    for (const n of d.nodes) {
      節の数 += 1;
      if (!節の基.has(n.kind)) 節の基.set(n.kind, d);
      for (const 欄 of Object.keys(節の欄の扱い))
        if ((n as unknown as 素)[欄] !== undefined)
          書いた件数.set(`節/${欄}`, (書いた件数.get(`節/${欄}`) ?? 0) + 1);
    }
    const 書きぶり = new Set<string>();
    for (const e of d.edges ?? []) {
      矢印の数 += 1;
      for (const 欄 of Object.keys(矢印の欄の扱い))
        if ((e as unknown as 素)[欄] !== undefined) {
          書いた件数.set(`矢印/${欄}`, (書いた件数.get(`矢印/${欄}`) ?? 0) + 1);
          書きぶり.add(欄);
        }
    }
    /*
     * **矢印の側は「書きぶり」 ごとに 1 図を選ぶ** = 見本帳の全図 (矢印を持つ 136 図) を
     * 欄ごとに描き直すと、この 1 file だけで 25 秒かかる (#1704 の言い換え)。 節の種別で
     * 選ぶと矢印を持つ図が 10 しか残らず、矢印の書き方の幅を覆えない。
     *
     * 書きぶり = その図の矢印が書いている欄の組。 同じ組の図は同じ経路を通る。
     */
    if ((d.edges ?? []).length > 0) {
      const 鍵 = [...書きぶり].sort().join(",");
      if (!矢印の基.has(鍵)) 矢印の基.set(鍵, d);
    }
  }

  /** 置き場所 の欄を書いた時に何が変わるか */
  let 置き場所の判定: Map<string, { 増えた: string[]; 内訳: Record<判定, number> }>;
  /** 記法 の欄を消した時に絵が変わる図 */
  let 届き判定: Map<string, { 見つけた: string | undefined; 描いた: number }>;

  /*
   * **描くのは `beforeAll` の中で 1 度だけ**。 `describe` の直下で描くと集める段で走るので、
   * どの検査にも所要が付かず上限にも掛からない (#1704)。
   */
  beforeAll(() => {
    届き判定 = new Map();
    for (const { 側, 欄, 扱い } of 欄の扱いたち) {
      if (扱い !== "記法") continue;
      const 鍵 = `${側}/${欄}`;
      if (書けない欄[鍵] !== undefined) continue;
      届き判定.set(鍵, 消すと変わる図を探す(図ら, 側, 欄));
    }
    置き場所の判定 = new Map();
    const 足す = (鍵: string, r: { 判定: 判定; 増えた: string[] }): void => {
      const 今 = 置き場所の判定.get(鍵) ?? {
        増えた: [],
        内訳: { 役割が増える: 0, 絵だけ変わる: 0, 絵も変わらない: 0, unknown: 0 },
      };
      今.内訳[r.判定] += 1;
      今.増えた = [...new Set([...今.増えた, ...r.増えた])];
      置き場所の判定.set(鍵, 今);
    };
    for (const { 側, 欄, 扱い } of 欄の扱いたち) {
      if (扱い !== "置き場所") continue;
      const 鍵 = `${側}/${欄}`;
      const 値 = 置き場所の見本値[鍵];
      if (値 === undefined) continue;
      if (側 === "節") {
        for (const [kind, 基] of 節の基) 足す(鍵, 節に書いて描く(基, kind, 欄, 値));
      } else {
        for (const d of 矢印の基.values()) 足す(鍵, 矢印に書いて描く(d, 欄, 値));
      }
    }
  }, 90_000);

  it("節と矢印の欄をどちらも 1 つ以上走査できている", () => {
    // 空振り検知。 型から欄が取れないと 0 件になり、下の検査が何も見ずに通る
    const 節の欄数 = Object.keys(節の欄の扱い).length;
    const 矢印の欄数 = Object.keys(矢印の欄の扱い).length;
    console.log(
      `[欄] 節 ${節の欄数} / 矢印 ${矢印の欄数} — 図 ${図ら.length} (節 ${節の数} / 矢印 ${矢印の数}) / 代表の図 = 節の種別 ${節の基.size} + 矢印の書きぶり ${矢印の基.size}`,
    );
    const 内訳 = new Map<string, string[]>();
    for (const { 側, 欄, 扱い } of 欄の扱いたち) {
      const 名 = 扱い.includes("/") ? "画面の切替" : 扱い;
      内訳.set(名, [...(内訳.get(名) ?? []), `${側}/${欄}`]);
    }
    for (const [名, 一覧] of 内訳) console.log(`[${名}] ${一覧.length} 本 = ${一覧.join(" ")}`);
    expect(節の欄数, "節の任意の欄が 1 つも無い").toBeGreaterThan(0);
    expect(矢印の欄数, "矢印の任意の欄が 1 つも無い").toBeGreaterThan(0);
    expect(節の数, "節を 1 つも拾えていない").toBeGreaterThan(0);
    expect(矢印の数, "矢印を 1 つも拾えていない").toBeGreaterThan(0);
  });

  it("画面の切替に割り当てた欄は、その file が実際にその欄を触っている", () => {
    // 名前だけ書いて実は触っていない、を残さない。 切替が別の欄へ移ったらここで落ちる
    let 測れた = 0;
    for (const { 欄, 扱い } of 欄の扱いたち) {
      if (!扱い.includes("/")) continue;
      測れた += 1;
      // `import.meta.url` は jsdom 環境で file 形式にならないので、作業 dir から辿る
      const 中身 = readFileSync(resolve(process.cwd(), "apps/playground-spa", 扱い), "utf8");
      expect(中身.includes(欄), `${扱い} が ${欄} を触っていない`).toBe(true);
    }
    expect(測れた, "画面の切替に割り当てた欄が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("中身に割り当てた欄は、軸として数えている", () => {
    // 「中身」 と書いておきながら軸が 1 本も無いなら、その欄は誰も見ていない
    let 測れた = 0;
    const 数えていない: string[] = [];
    for (const { 欄, 扱い } of 欄の扱いたち) {
      if (扱い !== "中身") continue;
      測れた += 1;
      const 並びら = (家族 as Record<string, 並びの決め[] | undefined>)[欄];
      if (並びら === undefined || 並びら.length === 0) 数えていない.push(欄);
    }
    expect(数えていない, `中身と書いたのに軸が無い: ${数えていない.join(", ")}`).toEqual([]);
    expect(測れた, "中身に割り当てた欄が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("記法と動きに割り当てた欄は、見本帳が書いた図を持っている", () => {
    /*
     * 見本帳の役目は「記法で何が書けるか」 を見せること。 書ける欄を 1 度も書いていないと、
     * 読み手はその欄の存在を知りようがない。
     *
     * 書けない欄 (記法に口が無い) は求めない。 理由は表に書き、下の検査が生死を見る。
     */
    let 測れた = 0;
    const 書いていない: string[] = [];
    for (const { 側, 欄, 扱い } of 欄の扱いたち) {
      if (扱い !== "記法" && 扱い !== "動き") continue;
      const 鍵 = `${側}/${欄}`;
      if (書けない欄[鍵] !== undefined) continue;
      測れた += 1;
      if ((書いた件数.get(鍵) ?? 0) === 0) 書いていない.push(鍵);
    }
    expect(
      書いていない,
      `記法から書けるのに見本帳が 1 度も書いていない欄\n  ${書いていない.join("\n  ")}`,
    ).toEqual([]);
    expect(測れた, "記法と動きに割り当てた欄が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("記法に割り当てた欄は、消すと絵が変わる図が見本帳にある", () => {
    /*
     * 書いてあるだけでは足りない。 **書いた欄が絵に届いていること** まで見る。
     *
     * 判定は見本帳の実物から欄を消して描き比べる = 欄ごとの見本値を手で並べると、実物と
     * 違う値で測ることになる。
     *
     * 動き の欄はここで測れない (状態を持たない場に描くと、書いても消しても同じ絵になる)。
     * 動きが実際に動くかは `catalog-motion-render.test.tsx` が見る。
     */
    let 測れた = 0;
    const 届いていない: string[] = [];
    for (const [鍵, r] of 届き判定) {
      測れた += 1;
      // 何図で試して届いたかを出す = 数だけ見ると、届くまでに全図を描いた欄が埋もれる
      console.log(`[届き] ${鍵} ${r.見つけた ?? "届かない"} (${r.描いた} 図)`);
      if (r.見つけた !== undefined) continue;
      if (届かない欄[鍵] !== undefined) continue;
      届いていない.push(`${鍵} (${r.描いた} 図で試した)`);
    }
    expect(
      届いていない,
      `見本帳が書いているのに絵に届いていない欄\n  ${届いていない.join("\n  ")}`,
    ).toEqual([]);
    expect(測れた, "記法に割り当てた欄を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("届かない欄は、今も絵に届かない欄だけ", () => {
    // 届くようになったら表から外す = 直った後に理由だけが残らない
    const 死んだ理由: string[] = [];
    for (const [鍵, r] of 届き判定)
      if (届かない欄[鍵] !== undefined && r.見つけた !== undefined)
        死んだ理由.push(`${鍵} (${r.見つけた} で絵が変わる)`);
    expect(死んだ理由, `届かない欄に死んだ理由が残っている: ${死んだ理由.join(", ")}`).toEqual([]);
  });

  it("書けない欄は、今も記法に口が無い欄だけ", () => {
    // 記法に口が開いたら見本を足す側へ回す = 直った後に理由だけが残らない
    let 測れた = 0;
    const 死んだ理由: string[] = [];
    const 記法 = 記法の中身();
    for (const 鍵 of Object.keys(書けない欄)) {
      測れた += 1;
      const 欄 = 鍵.split("/")[1]!;
      if (記法.includes(欄)) 死んだ理由.push(`${鍵} (記法に口がある)`);
    }
    expect(死んだ理由, `書けない欄に死んだ理由が残っている: ${死んだ理由.join(", ")}`).toEqual([]);
    expect(測れた, "書けない欄が 1 つも無い (表が空)").toBeGreaterThan(0);
    // 記法を読めていないと、上の照合は何にも当たらず素通りする
    expect(記法.length, "記法を 1 文字も読めていない (検査が空振りしている)").toBeGreaterThan(1000);
  });

  it("置き場所に割り当てた欄は、書いても役割が増えない", () => {
    /*
     * 置き場所 は「図を組む側が決めるもの」 なので見本を求めない。 その代わり、書いた時に
     * **新しい役割が出ないこと** を毎回確かめる。 役割が出るなら読み手の選択肢なので、
     * 記法 の側へ回して見本を求める。
     *
     * 座標の欄のように単独では絵が変わらないものもあるため、内訳を出す
     * (数だけ見ると「測れていない」 が「変わらない」 に埋もれる)。
     */
    const 増えた: string[] = [];
    const 値の無い: string[] = [];
    let 測れた = 0;
    for (const { 側, 欄, 扱い } of 欄の扱いたち) {
      if (扱い !== "置き場所") continue;
      const 鍵 = `${側}/${欄}`;
      if (置き場所の見本値[鍵] === undefined) {
        値の無い.push(鍵);
        continue;
      }
      const r = 置き場所の判定.get(鍵);
      if (r === undefined) continue;
      測れた += 1;
      console.log(`[置き場所] ${鍵} ${JSON.stringify(r.内訳)}`);
      if (r.増えた.length > 0) 増えた.push(`${鍵} (${r.増えた.join(", ")})`);
    }
    expect(値の無い, `置き場所の見本値が無い欄: ${値の無い.join(", ")}`).toEqual([]);
    expect(増えた, `置き場所と書いたのに役割が増えた欄\n  ${増えた.join("\n  ")}`).toEqual([]);
    expect(測れた, "置き場所の欄を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });
});
