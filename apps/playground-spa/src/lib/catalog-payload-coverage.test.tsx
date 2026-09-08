/**
 * 中身を持つ節が見せる形を、見本帳が全て見せているかを数える検査
 * (#1694 / #1698 / #1700 / #1706)。
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
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram, CdlNode } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, type CatalogItem } from "./catalog-items";

/** 中身を持つ節の欄。 engine が `*Data` を足すと下の `satisfies` が落ちる */
type 中身の欄 = Extract<keyof CdlNode, `${string}Data`>;

/** 図表の節が持つ欄 (`chart` で始まるもの)。 engine が足すと `satisfies` が落ちる */
type 図表の欄 = Extract<keyof CdlNode, `chart${string}`>;

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
 * 図表の節の欄を、何が覆っているか。 **`satisfies` で閉じる**。
 *
 * `中身` は図に載せる値そのもので、見せ方では変えられない (件数と任意の欄が軸になる)。
 * それ以外は画面の `オプション` の切替が覆っており、押せば両方の形を見られるので
 * 見本を 2 つ持つ必要が無い。
 *
 * 値は **その切替を実装している file の path**。 名前だけ書いて実は触っていない形を
 * 残さないため、下の検査がその file が欄の名前を持つことを確かめる。
 */
const 節の欄の扱い = {
  chartData: "中身",
  chartFillUnder: "src/lib/chart-line-options.ts",
  chartValueRise: "src/lib/chart-line-options.ts",
  chartTrace: "src/lib/chart-line-options.ts",
  chartPieForm: "src/lib/chart-pie-options.ts",
  chartSlopeForm: "src/lib/chart-slope-options.ts",
} satisfies Record<図表の欄, string>;

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

describe("図表の節の欄が、中身か見せ方の切替に割り当たっている (#1700)", () => {
  const 欄たち = Object.entries(節の欄の扱い) as Array<[図表の欄, string]>;

  it("節の欄を 1 つ以上走査できている", () => {
    // 空振り検知。 型から欄が取れないと 0 件になり、下の検査が何も見ずに通る
    console.log(`[節の欄] ${欄たち.map(([k]) => k).join(" / ")}`);
    expect(欄たち.length, "節の欄が 1 つも無い").toBeGreaterThan(0);
  });

  it("見せ方に割り当てた欄は、その file が実際にその欄を触っている", () => {
    // 名前だけ書いて実は触っていない、を残さない。 切替が別の欄へ移ったらここで落ちる
    let 測れた = 0;
    for (const [欄, 扱い] of 欄たち) {
      if (扱い === "中身") continue;
      測れた += 1;
      // `import.meta.url` は jsdom 環境で file 形式にならないので、作業 dir から辿る
      const 中身 = readFileSync(resolve(process.cwd(), "apps/playground-spa", 扱い), "utf8");
      expect(中身.includes(欄), `${扱い} が ${欄} を触っていない`).toBe(true);
    }
    expect(測れた, "見せ方に割り当てた欄が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("中身に割り当てた欄は、軸として数えている", () => {
    // `chartData` を「中身」 と書いておきながら軸が 1 本も無いなら、この欄は誰も見ていない
    const 中身の欄たち = 欄たち.filter(([, 扱い]) => 扱い === "中身").map(([k]) => k);
    expect(中身の欄たち, "中身に割り当てた欄が無い").toEqual(["chartData"]);
    expect(家族.chartData.length, "chartData を見る並びが 1 つも無い").toBeGreaterThan(0);
  });
});
