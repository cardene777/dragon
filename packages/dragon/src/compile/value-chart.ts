import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";
import { parseChartValue, 数の欄から参照できる名前, 参照する名前 } from "./chart-fields";

import { 箱の題 } from "./node-title";
import type { CompileNotice } from "./notice";
import { slugify } from "./slug";
import { 図の小見出し } from "./subtitle";
/**
 * 棒 / 折れ線の組立て。 円グラフと **入力の形が同じ**なので 1 つにまとめる。
 *
 * 3 種とも `- 名前: "45"` の 1 行 1 値で書く。 違うのは描画側の種別と、 値の意味だけ。
 *
 * | 型 | 種別 | 値の意味 |
 * |---|---|---|
 * | `pie` | `chart-pie` | 全体に対する取り分 |
 * | `bar` | `chart-bar` | 棒の高さ (単位は問わない) |
 * | `line` | `chart-line` | 線の高さ。 **書いた順に並ぶ** |
 *
 * 値を読めない項目は載せず、 まとめて警告に出す。 **黙って 0 にしない** = その項目だけ欠けた
 * 図が「正しい図」 として出てしまうため。
 *
 * 矢印は描けない。 書かれていたら警告に出して捨てる (「書いたのに効かない」 を残さない)。
 */
export function compileValueChart(
  doc: DslDocument,
  型: "pie" | "bar" | "line" | "gauge" | "radial" | "stat" | "waffle" | "stacked" | "slope",
  kind:
    | "chart-pie"
    | "chart-bar"
    | "chart-line"
    | "chart-gauge"
    | "chart-radial"
    | "chart-stat"
    | "chart-waffle"
    | "chart-stacked-bar"
    | "chart-slope",
  onNotice?: (notice: CompileNotice) => void,
): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "chart" });
  const CHART_W = 640;
  // **高さは型で違い、 格子に載せる**。 描画側 (`cdl` の `chart()` preset) は `pie` を 320、
  // 棒と折れ線を 360 とした上で **16 の倍数へ切り上げる** (360 は 16 で割り切れないので 368)。
  // 切り上げないと下端が格子から外れ、 全図で位置の警告が出る (review 指摘)
  // 半円と弧は縦を使わないので円と同じ 320。 描画側 (`cdl` の `chart()` preset) が
  // `pie` / `gauge` / `radial` を 320、棒と折れ線を 360 とし、16 の倍数へ切り上げる
  // 縦に余白が要らない型。 描画側 (`cdl` の `chart()` preset) と揃える。
  // 半円 / 弧 / 割合の印 は縦を使わず、値 1 つを大きく示す図も縦に伸びない
  const 低い型 =
    型 === "pie" || 型 === "gauge" || 型 === "radial" || 型 === "waffle" || 型 === "stat";
  const CHART_H = 低い型 ? 320 : 368;
  b.lane("chart", { width: CHART_W + 64 });

  const data: NonNullable<CdlDiagram["nodes"][number]["chartData"]> = [];
  const 読めない: string[] = [];
  const 前が読めない: string[] = [];
  let 前が読めない行 = 0;
  const 未宣言: string[] = [];
  let 未宣言行 = 0;
  const 参照できる = 数の欄から参照できる名前(doc);
  // 最初に読めなかった行を覚える。 画面が案内できるようにする
  let 読めない行 = 0;
  for (const a of doc.actors) {
    // 値の置き場所は記法で 2 通りある。 略記 (`- TypeScript: "45%"`) は説明文に、
    // 縦書きの map (`- SliceA: { kind: card, value: "30%" }`) は値に入る。 両方を読む
    const value = parseChartValue(a.value ?? a.subtitle);
    // **負を受けるのは折れ線と傾き図だけ**。 どちらも増減を追う図なので、気温や損益のように
    // 0 を跨ぐ値が来る。 円は取り分、 棒は高さで、 どちらも負に意味が無い (review 指摘)。
    // 状態を読む欄 (`{名前}`) は書いた時点で符号が決まらないため、この検査を通す
    if (
      value === null ||
      (typeof value === "number" && value < 0 && 型 !== "line" && 型 !== "slope")
    ) {
      // `pos` を持たない経路がある (JSON 経路で組み立てた actor)。 無ければ 0 のまま
      if (読めない.length === 0) 読めない行 = a.pos?.line ?? 0;
      読めない.push(a.name);
      continue;
    }
    // 数にならない参照は落とす。 通すと図は出るのに数が入っていない状態になる
    const 名前 = 参照する名前(value);
    if (名前 !== null && !参照できる.has(名前)) {
      if (未宣言.length === 0) 未宣言行 = a.pos?.line ?? 0;
      未宣言.push(a.name);
      continue;
    }
    // 色はそのまま渡す。 箱が 1 つになっても、 書いた色が消えないようにする
    // 前の時点の値 (#1450)。 読めない形は黙って捨てず知らせる = 書いたのに 2 本目の帯が
    // 出ない状態になり、手掛かりが残らない
    const 前 = a.previous === undefined ? null : parseChartValue(a.previous);
    if (a.previous !== undefined && 前 === null) {
      if (前が読めない.length === 0) 前が読めない行 = a.pos?.line ?? 0;
      前が読めない.push(a.name);
    }
    data.push({
      label: 箱の題(a),
      value,
      ...(前 === null ? {} : { previous: 前 }),
      ...(a.tone !== undefined ? { tone: a.tone } : {}),
    });
  }
  // 案内の言葉は型ごとに変える。 共通化した時に `pie` の「割合 / 円 / 45%」 が「値 / 図 / 45」 に
  // 薄まり、 既存の案内が後退した (review 指摘)。 何を書けばよいかは型ごとに違う
  // 何を書けばよいかは型ごとに違う。 まとめると「割合 / 円 / 45%」 が「値 / 図 / 45」 に薄まる
  //
  // **表で持つ**。 三項の連鎖にすると、型が増えるたびに深さが増え、最後の枝が
  // 「それ以外」 になるため型検査が新しい型の漏れを教えてくれない
  const 語の表: Record<typeof 型, { 量: string; 図: string; 例: string }> = {
    pie: { 量: "割合", 図: "円", 例: '"45%"' },
    bar: { 量: "値", 図: "棒", 例: '"420"' },
    line: { 量: "値", 図: "折れ線", 例: '"180"' },
    gauge: { 量: "値", 図: "半円", 例: '"680"' },
    radial: { 量: "値", 図: "弧", 例: '"72"' },
    stat: { 量: "値", 図: "大きな数字", 例: '"1200"' },
    waffle: { 量: "割合", 図: "100 個の印", 例: '"45%"' },
    stacked: { 量: "内訳の値", 図: "帯", 例: '"320"' },
    slope: { 量: "値", 図: "傾き図", 例: '"320"' },
  };
  const 語 = 語の表[型];

  /**
   * 利用者に伝える。 **`console.warn` だけにしない**。 エディタは受け取った notice を画面に
   * 出す経路を持っており、 log だけだと項目が消えた理由が誰にも見えない (review 指摘)。
   */
  const 伝える = (種類: CompileNotice["kind"], 名前: string, message: string, line = 0) => {
    onNotice?.({ kind: 種類, actor: 名前, line, message });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };

  if (読めない.length > 0) {
    伝える(
      "chart-value-unreadable",
      読めない[0]!,
      `type: ${型} で${語.量}を読めない項目があります (${語.図}に載せません): ${読めない.join(", ")}。` +
        ` \`- 名前: ${語.例}\` の形で書いてください`,
      読めない行,
    );
  }
  if (未宣言.length > 0) {
    伝える(
      "chart-value-unreadable",
      未宣言[0]!,
      `type: ${型} で数にならない値を参照した項目があります (${語.図}に載せません): ${未宣言.join(", ")}。` +
        ` \`states:\` にその名前を数で書いてください`,
      未宣言行,
    );
  }
  if (前が読めない.length > 0) {
    伝える(
      "chart-value-unreadable",
      前が読めない[0]!,
      `type: ${型} で前の時点の値を読めない項目があります (前の値を使いません): ${前が読めない.join(", ")}。` +
        " `- 名前: { value: " +
        語.例 +
        ", previous: " +
        語.例 +
        " }` の形で書いてください",
      前が読めない行,
    );
  }
  if (doc.flow.length > 0) {
    伝える(
      "chart-edge-dropped",
      doc.flow[0]?.from ?? "",
      `type: ${型} では矢印を描けません (${doc.flow.length} 本を無視しました)。` +
        ` 関係を描くなら type: flow を使ってください`,
      doc.flow[0]?.pos?.line ?? 0,
    );
  }

  b.node(`${slugify(doc.title) || 型}-chart`, {
    lane: "chart",
    stack: 0,
    kind,
    title: doc.title,
    ...図の小見出し(doc),
    w: CHART_W,
    h: CHART_H,
    chartData: data,
  });

  return b.build();
}
