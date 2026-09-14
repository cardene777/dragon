/**
 * 図の中身を **字ではなく役割の印と図の定義から** 選ぶための共通部 (#1838)。
 *
 * ## 字で探すと、見本を日本語に開いた日から噛み合わなくなる
 *
 * 折れ線の札は `Jan` 〜 `Dec` を、見本の根は `Project` を探していた。
 * 図に実際に出るのは `1月` 〜 `4月` と `新しい企画` で、どちらも 1 件も当たらない。
 *
 * 当たらないと「重なり 0 件」 を期待する側は **空振りのまま緑になる**。
 * 「1 件以上」 を期待する植え込み対照だけが落ちるので、
 * 赤い 1 件が緑の 1 件の空振りを教えている形になっていた。
 *
 * ## 印は言語を変えても動かない
 *
 * 折れ線の図は役割の印を出す (実測で `chart-line-value` / `chart-line-label` /
 * `chart-line-tick` の 3 種)。 値の札と軸の札を印で選べば、呼び名を日本語に開いても
 * 別の言語に替えても噛み合ったままになる。
 *
 * **目盛 (`chart-line-tick`) は混ぜない**。 軸の札とは別の印を持ち、
 * 混ぜると重なりの判定が変わる。
 *
 * ## 印を持たない見本の根は、図の定義から導く
 *
 * 見本の根は印を持たないので、`presetMindMap` の定義そのものを読む。
 * 書かれた名前が `{…}` の形なら、図が持つ状態の初期値へ解く。
 *
 * ## 印で選んでも、下限が無ければ同じことが起きる
 *
 * 印の名前が変われば集めた件数は再び 0 になる。 0 件を期待する検査は母集団が空でも
 * 通るので、**集めた件数を別に assert する** (`rules/quality.md § 対象を走査する検査は
 * 「1 件以上あった」 ことを併記済`)。 下限は `折れ線の札の下限` が持つ。
 */
import { presetChartLine, presetMindMap } from "../../src/topics/catalog/presets.cdl";

/**
 * 折れ線の図が出す役割の印。 2 つの検査が同じ字を書かないよう、ここに 1 度だけ置く。
 *
 * 値の札 = 点の上に出る数、 軸の札 = 横軸に並ぶ月の名前。
 */
export const 折れ線の印 = {
  値の札: "chart-line-value",
  軸の札: "chart-line-label",
} as const;

/**
 * 印で選んだ札の件数の下限。
 *
 * 実測は値の札が 3 件、軸の札が 4 件 (4 か月ぶんの図で、最後の月の値はまだ札を持たない)。
 * **実数ちょうどに置かない** = 図が 5 か月に伸びた日に、検査の側が落ちてしまう。
 * 見たいのは「1 件も集められていない」 形なので下限は 1 でよい。
 */
export const 折れ線の札の下限 = 1;

/**
 * 見本の図の根に出る名前を、図の定義から導く。
 *
 * `presetMindMap` は根の名前を `{theme}` に差し替えてあり、
 * 実際に出る字は図が持つ状態 `theme` の初期値で決まる。
 * 段が進むと `認証と課金の刷新` に変わるので、検査が見るのは開いた直後の初期値。
 */
export function 見本の根の名前(): string {
  const 根 = presetMindMap.nodes.find((n) => n.mindData !== undefined);
  const 中身 = 根?.mindData;
  if (中身 === undefined) throw new Error("見本の図が根の中身を持っていない");

  const 差し込み = /^\{([^{}]+)\}$/.exec(中身.rootTitle);
  const 状態の名 = 差し込み?.[1];
  if (状態の名 === undefined) return 中身.rootTitle;

  const 状態 = presetMindMap.states.find((s) => s.id === 状態の名);
  if (状態 === undefined) {
    throw new Error(`見本の根が差し込む状態 ${状態の名} が図の定義に無い`);
  }
  return String(状態.initial);
}

/**
 * 見本の折れ線グラフが持つ値の数を、図の定義から導く (#1952)。
 *
 * 折れ線は値ごとに 1 つの点を打つので、描いた線の点の数はこの数と一致する。
 * 字で書くと、見本の月を足した日から検査が噛み合わなくなる。
 */
export function 見本の折れ線の値の数(): number {
  const 値たち = presetChartLine.nodes.find((n) => n.chartData !== undefined)?.chartData;
  if (値たち === undefined) throw new Error("見本の折れ線グラフが値を持っていない");
  return 値たち.length;
}
